
# 🧠 PrivatePrompt

A full-stack offline AI application that connects frontend and backend layers with local LLMs like LLaMA, OpenHermes, and more.

## 📁 Project Structure

```
PrivatePrompt/
├── Backend/       # FastAPI backend with RAG, LLM chat, and session handling
├── Frontend/      # React + Tailwind CSS chat UI
├── .gitignore     # Files ignored by Git
└── README.md      # Project documentation
```

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/koppolu-buddha-bhavan/PrivatePrompt.git
cd PrivatePrompt
```

---

### 2. Run the Backend

```bash
cd Backend
# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn main:app --reload
```

---

### 3. Run the Frontend

```bash
cd ../Frontend
npm install
npm run dev
```

---

## 🛠 Tech Stack

- **Frontend**: React, Tailwind CSS, Vite
- **Backend**: FastAPI (Python)
- **LLM Support**: Local models via Ollama (LLaMA3, CodeLLaMA, OpenHermes)
- **Database**: SQLite or TinyDB (for sessions/chat)

---

## ❗ Git Submodule Fix (If Needed)

If Git throws an error like `Frontend is a submodule`, run the following from the root:

```bash
git rm --cached Frontend
rm -rf .gitmodules
rm -rf .git/config  # ⚠️ use only if necessary
cp -r /actual/path/to/Frontend ./Frontend
git add Frontend
git commit -m "Fixed submodule issue"
git push
```

---

## ✨ Features

- Chat UI with streaming response
- Local-only secure processing
- RAG pipeline support
- Model switch per session

---

## 👨‍💻 Author

**Koppolu Buddha Bhavan**  
📎 [GitHub](https://github.com/koppolu-buddha-bhavan)

---
