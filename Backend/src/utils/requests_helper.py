import requests


def ollama_api():
    return "http://localhost:11434/api/"


def curl(path, method, data=None):
    url = ollama_api() + path
    headers = {"Content-Type": "application/json"}

    try:
        response = requests.request(
            method=method,
            url=url,
            headers=headers,
            json=data if data else None  # Don't send `{}` as default
        )
        return response.json()
    except ValueError:
        return {"error": "Invalid JSON response", "response_text": response.text}
    except Exception as e:
        return {"error": str(e)}


