"""Authenticated headless Python wrapper for the C++ regional neural mass kernel.
Optional group_sim v3 imports work when the user's supplied archive is mounted
under PYTHONPATH. No corpus ingestion endpoints are exposed.
"""
import hmac
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import subprocess
import sys

TOKEN = os.getenv("NEURO_SERVICE_TOKEN", "")
BIN = os.getenv("NEUROPHYSICS_BIN", "/app/bin/neurophysics")
HOST = os.getenv("NEURO_SERVICE_HOST", "0.0.0.0")
PORT = int(os.getenv("NEURO_SERVICE_PORT", "8081"))
MAX_BODY = 16000

try:
    from group_sim.occult_killer import compare as occult_compare, catalog as occult_catalog
except ImportError:
    occult_compare = None
    occult_catalog = None

def number(o, name, upper):
    x = o.get(name, 0.0)
    if isinstance(x, bool) or not isinstance(x, (int, float)) or not 0 <= x <= upper:
        raise ValueError(f"{name}: expected number in [0,{upper}]")
    return x

def simulate_native(payload):
    params = [
        number(payload, "alcohol", 1), number(payload, "stress", 1),
        number(payload, "attention", 1), number(payload, "arousal", 1),
        number(payload, "seconds", 5), number(payload, "seed", 1000000),
    ]
    if int(params[4]) != params[4] or not 1 <= params[4] <= 5:
        raise ValueError("seconds must be integer 1..5")
    if int(params[5]) != params[5]:
        raise ValueError("seed must be integer")
    proc = subprocess.run([BIN] + [str(x) for x in params],
                          capture_output=True, text=True, timeout=15, check=True)
    if len(proc.stdout) > 200_000:
        raise ValueError("native output too large")
    out = json.loads(proc.stdout)
    if out.get("model") != "wilson-cowan-regional-v0.1" or len(out.get("regions", [])) != 50:
        raise ValueError("unexpected native model response")
    return out

class Handler(BaseHTTPRequestHandler):
    def reply(self, status, data):
        body = json.dumps(data, allow_nan=False, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def authenticated(self):
        header = self.headers.get("Authorization", "")
        candidate = header.removeprefix("Bearer ") if header.startswith("Bearer ") else ""
        if not hmac.compare_digest(candidate, TOKEN):
            self.reply(401, {"error": "unauthorized"})
            return False
        return True

    def do_GET(self):
        if not self.authenticated():
            return
        if self.path == "/api/health":
            self.reply(200, {"status": "ok", "native_model": "wilson-cowan-regional-v0.1",
                             "occult_v3_available": occult_catalog is not None})
        elif self.path == "/api/occult-killer" and occult_catalog is not None:
            self.reply(200, occult_catalog())
        else:
            self.reply(404, {"error": "not found"})

    def do_POST(self):
        if not self.authenticated():
            return
        if self.path not in ("/api/neurophysics/simulate", "/api/occult-killer/compare"):
            return self.reply(404, {"error": "not found"})
        if self.path.endswith("/compare") and occult_compare is None:
            return self.reply(503, {"error": "Python v3 group_sim is not mounted"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 1 <= length <= MAX_BODY:
                return self.reply(413, {"error": "input size invalid"})
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            if not isinstance(payload, dict):
                return self.reply(400, {"error": "object required"})
            if self.path == "/api/neurophysics/simulate":
                output = simulate_native(payload)
            else:
                output = occult_compare(payload)
            self.reply(200, output)
        except (ValueError, KeyError, json.JSONDecodeError) as e:
            self.reply(400, {"error": str(e)[:160]})
        except (OSError, subprocess.SubprocessError) as e:
            self.reply(503, {"error": "native simulator unavailable or failed", "detail": str(e)[:120]})
        except Exception:
            self.reply(500, {"error": "simulation failure"})

if __name__ == "__main__":
    if len(TOKEN) < 24:
        print("NEURO_SERVICE_TOKEN must be set to a secret of at least 24 characters.", file=sys.stderr)
        sys.exit(2)
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
