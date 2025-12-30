import requests

class LocalLLMWrapper:
    def __init__(self, base_url: str = "http://localhost:11434", model_name: str = "llama3"):
        self.base_url = base_url.rstrip("/")
        self.model_name = model_name

    def call(self, messages: list[dict], stream: bool = False) -> str:
        """
        Call the local model with a list of messages (chat format).

        messages = [
            {"role": "system", "content": "..."},
            {"role": "user", "content": "..."},
        ]
        """
        try:
            payload = {
                "model": self.model_name,
                "messages": messages,
                "stream": stream
            }
            response = requests.post(f"{self.base_url}/api/chat", json=payload)
            response.raise_for_status()

            # Handle multi-line JSON (Ollama streams this way)
            lines = response.text.strip().splitlines()
            full_text = ""
            for line in lines:
                try:
                    json_line = response.json() if not stream else eval(line)
                    full_text += json_line.get("message", {}).get("content", "")
                except Exception:
                    continue

            return full_text.strip()

        except Exception as e:
            print(f"[Model Error] {e}")
            return "Error generating response."

    def set_model(self, model_name: str):
        self.model_name = model_name
