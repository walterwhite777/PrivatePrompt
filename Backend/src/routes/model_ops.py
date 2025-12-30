from fastapi import APIRouter
from ..utils.requests_helper import curl
from ..utils.ollama_checker import ollama_checker, get_installed_models
from ..utils.webscraper import scrape_ollama_search
import traceback
from ..utils.PromptGenerator import prompt_generator, code_generator
import subprocess
from fastapi.responses import StreamingResponse
import re
from fastapi.exceptions import HTTPException
from fastapi import Query
import requests
import json

router = APIRouter()

@router.get("/ollama")
def ollama_check():
    return ollama_checker()

@router.get("/list")
def list_models():
    raw_data = scrape_ollama_search("https://ollama.com/search")
    # Convert dict to list for frontend
    models_list = list(raw_data.values()) if isinstance(raw_data, dict) else []
    return { "models": models_list }

@router.get("/available")
def local_models():
    response = curl('tags', 'GET')

    # Fallback in case 'models' key not present or response invalid
    raw_models = response.get("models", []) if isinstance(response, dict) else []

    # Reformat to match frontend expectations
    models_list = []
    for model in raw_models:
        models_list.append({
            "model_name": model.get("model") or model.get("name") or "",  # for compatibility
            "name": model.get("name") or model.get("model") or "",
            "details": model.get("details", {}),
            "size": model.get("size", 0),
            "modified_at": model.get("modified_at", ""),
            "digest": model.get("digest", "")
        })

    return {"models": models_list}

@router.get("/info")
def model_information(model:str):
    model=model.strip('"')
    return curl('show','POST',{"model":model})

@router.delete("/remove")
def remove_model(llm_model: str = Query(..., description="Name of the model to delete")):
    if not llm_model.strip():
        raise HTTPException(status_code=400, detail="Model name must not be empty")

    try:
        print(f"Trying to delete model: {llm_model}")

        response = requests.request(
            method="DELETE",
            url="http://localhost:11434/api/delete",
            headers={"Content-Type": "application/json"},
            data=json.dumps({"name": llm_model})  # 🔥 critical part
        )

        try:
            result = response.json()
        except ValueError:
            return {"message": f"Model '{llm_model}' deleted successfully (no content from Ollama)."}

        if result.get("error"):
            raise HTTPException(status_code=500, detail=f"Ollama error: {result['error']}")

        return result

    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Request to Ollama failed: {str(e)}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete model '{llm_model}': {str(e)}")

@router.get("/running")
def running_models():
    return curl('ps', 'GET')

# Regex to strip ANSI escape sequences
ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')

@router.get("/pull/{llm_model}")
async def download_models(llm_model: str):
    # Validate model name to prevent command injection
    if not re.match(r'^[a-zA-Z0-9._:-]+$', llm_model):
        raise HTTPException(status_code=400, detail="Invalid model name")

    def stream():
        try:
            process = subprocess.Popen(
                ["ollama", "pull", llm_model],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                encoding='utf-8',
                bufsize=1,
            )
            for line in process.stdout:
                # Strip ANSI codes
                clean_line = ansi_escape.sub('', line).strip()
                if clean_line:
                    yield f"data: {clean_line}\n\n"
            process.wait()

            if process.returncode == 0:
                yield "data: Download completed successfully\n\n"
            else:
                yield f"data: Error: Process exited with code {process.returncode}\n\n"

        except FileNotFoundError:
            yield "data: Error: Ollama CLI not found on server\n\n"
        except Exception as e:
            yield f"data: Error: Failed to start download: {str(e)}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")


