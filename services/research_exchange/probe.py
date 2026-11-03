"""Opt-in toolchain readiness probe. No network, execution, or source imports."""
from __future__ import annotations

import importlib.util
import json
import shutil
from pathlib import Path

MODULES = {"armory": "armory", "benchq": "benchq", "pyliqtr": "pyLIQTR", "angr": "angr"}
EXECUTABLES = {"openroad": "openroad", "mpirun": "mpirun", "cuda_compiler": "nvcc"}


def probe() -> dict[str, object]:
    modules = {}
    for name, module in MODULES.items():
        try:
            modules[name] = importlib.util.find_spec(module) is not None
        except (ImportError, ValueError, ModuleNotFoundError):
            modules[name] = False
    return {
        "status": "LOCAL_PROVISIONING_PROBE_ONLY",
        "modules": modules,
        "executables": {key: shutil.which(cmd) is not None for key, cmd in EXECUTABLES.items()},
        "notice": "Module or executable presence does not prove usable hardware, supported versions, "
                  "license compliance, calibrated outputs or successful integration tests.",
    }


if __name__ == "__main__":
    print(json.dumps(probe(), indent=2))
