# Deployment: Grey Company native NeuroAtlas service

## What the app can run

The Research Lab web app contains:

- The existing **TypeScript** synthetic brain/narrative UI.
- An optional **Gemini JSON cue extractor**; absent the key, it uses explicitly labeled lexical narrative rules.
- The new **C++ Wilson–Cowan regional solver** behind an authenticated **Python HTTP broker**.
- Optional direct access to the provided **Occult Killer Python v3** module via the same broker.
- The **Native C++** and **Python v3** controls show an unavailable status until their configured services are reachable.

**Do not claim full-brain anatomical accuracy, actual EEG recordings, patient-specific neurochemistry, or validated cognitive prediction.** These outputs are educationally modeled hypotheses.

## 1. Build/run the native backend

```bash
docker build -f Dockerfile.neuro -t grey-research-native .
docker run --rm -p 127.0.0.1:8081:8081 \
  -e NEURO_SERVICE_TOKEN="REPLACE_WITH_A_LONG_RANDOM_SECRET_32_CHARS_OR_MORE" \
  grey-research-native
```

The service requires a long token, runs as nonroot, checks bearer auth, validates all numeric parameters, limits execution time and returns JSON.

Check from a trusted machine:

```bash
curl -H 'Authorization: Bearer REPLACE_WITH_A_LONG_RANDOM_SECRET_32_CHARS_OR_MORE' \
  http://127.0.0.1:8081/api/health
```

Never publish plain HTTP on an untrusted network. Use a secured public **HTTPS** endpoint, firewall restrictions and reasonable monitoring before deploying it.

## 2. Mount the user-provided Python v3 backend

The original Occult Killer v3 Python package is in the separately provided project ZIP, **not included in GitHub**. Extract the archive into a host directory:

```bash
unzip NeuroAtlas_Occult_Killer_Integrated_v3.zip -d /srv/grey-input
```

Mount the exact directory containing `group_sim/` (the `NeuroAtlas_Combined/python` directory) into the container:

```bash
docker run --rm -p 127.0.0.1:8081:8081 \
  -v /srv/grey-input/NeuroAtlas_Combined/python:/app/python:ro \
  -e NEURO_SERVICE_TOKEN="REPLACE_WITH_A_LONG_RANDOM_SECRET_32_CHARS_OR_MORE" \
  grey-research-native
```

The service dynamically detects `group_sim.occult_killer`. When mounted, the authenticated endpoints `GET /api/occult-killer` and `POST /api/occult-killer/compare` are available. The original group-simulator server is **not** exposed publicly by this wrapper, avoiding unrelated corpus-ingestion endpoints.

## 3. Connect the deployed web app

In server-side environment/secrets (never `VITE_` or browser code), configure:

```text
NEUROPHYSICS_URL=https://YOUR-PRIVATE-NATIVE-SERVICE.example
PYTHON_SIM_URL=https://YOUR-PRIVATE-NATIVE-SERVICE.example
NEURO_SERVICE_TOKEN=<same secure bearer token as native service>
GEMINI_API_KEY=<optional, for narrative cue extraction and chat>
SUPABASE_URL=<existing server database URL>
SUPABASE_SERVICE_ROLE_KEY=<existing server secret; use only with proper auth>
```

Refresh `/neural-atlas`: **NATIVE CONFIGURED** should show when server settings exist (actual backend accessibility is confirmed only after a successful run). Refresh `/occult-killer`: Python v3 can be selected for **Neutral reference**, if the server's `/api/occult-killer` endpoint is reachable.

The native UI uses a matched no-alcohol reference with the same seed. **Red** = lower simulated regional excitation, **green** = higher. This does not establish positive/negative medical effects.

## 4. Frontend deployment is separate

This repo uses TanStack Start with a default Cloudflare-style Nitro runtime. That hosting environment **cannot spawn C++ processes**, hence this remote service. Build and deploy the web project through its actual connected hosting provider, and configure the secrets above.

The two currently connected Lovable workspaces did not list this Research Lab as an accessible Lovable project when checked. Consequently, GitHub merges **do not confirm the site is published**. Connect the appropriate existing Lovable project or an equivalent TanStack-compatible hosting provider before attempting to deploy. Do not create a replacement site accidentally.

## 5. Production protection required

Most server functions in `src/lib/chat.functions.ts` and `src/lib/lab.functions.ts` use Supabase service-role credentials, which bypass database RLS. Before public access, implement and test authenticated per-user workspace isolation and ownership checks; otherwise a public publish can expose user data.

The Python broker only protects its endpoints by bearer token. A production deployment also needs abuse prevention, rate limits, resource quotas, audit logs and TLS. Do not store user medical records or identifiable abuse testimony in this unreviewed prototype.

## 6. Scientific fidelity roadmap

This prototype is not calibrated. Next steps are licensed MRI atlas import, measured diffusion-connectome weighting, regional neurophysiology parameter fitting, validated EEG lead fields and a held-out multi-subject benchmark. See [NEURO_NATIVE_RESEARCH.md](./NEURO_NATIVE_RESEARCH.md).
