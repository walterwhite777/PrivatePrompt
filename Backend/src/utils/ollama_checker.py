import subprocess
import shlex
from typing import List
import json
from fastapi.responses import JSONResponse
link="https://ollama.com/"
def ollama_checker():
    try:
        result = subprocess.run(["ollama", "--version"], capture_output=True, text=True)
        
        return JSONResponse(content={
            "status": "ok",
            "message": "Ollama is up and running.",
            "version": result.stdout.strip()
        }, status_code=200)

    except FileNotFoundError:
        download_link = "https://ollama.com/download"  # You can adjust this link
        return JSONResponse(content={
            "status": "error",
            "message": f"Ollama is not installed. Please follow {download_link} to download Ollama."
        }, status_code=404)

    except subprocess.CalledProcessError as e:
        return JSONResponse(content={
            "status": "error",
            "message": f"Error while executing Ollama: {e.stderr.strip()}"
        }, status_code=500)
# Utility to check installed models
def get_installed_models() -> List[str]:
    result = subprocess.run(
        ["ollama", "list", "--json"],
        capture_output=True,
        text=True
    )
    try:
        models = json.loads(result.stdout)
        return [m["name"] for m in models]
    except Exception:
        return []
