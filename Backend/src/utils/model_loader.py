import requests
OLLAMA_MODELS = ["llama3","codellama"]
OLLAMA_URL = "http://localhost:11434/api/generate"
def warm_up_ollama_model():
    dummy_prompt_1= {
        "model": OLLAMA_MODELS[0],
        "prompt": "Say hello",
        "stream": False
    }
    dummy_prompt_2= {
        "model": OLLAMA_MODELS[1],
        "prompt": "Write a SQL query that selects all rows from a table named employees.",
        "stream": False
    }
    try:
        response = requests.post(OLLAMA_URL, json=dummy_prompt_1)
        if response.status_code == 200:
            print(f"✅ Model '{OLLAMA_MODELS[0]}' warmed up successfully.")
        else:
            print(f"⚠️ Failed to warm up model: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error during model warm-up: {e}")

    try:
        response = requests.post(OLLAMA_URL, json=dummy_prompt_2)
        if response.status_code == 200:
            print(f"✅ Model '{OLLAMA_MODELS[1]}' warmed up successfully.")
        else:
            print(f"⚠️ Failed to warm up model: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error during model warm-up: {e}")


