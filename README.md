# PrivatePrompt

PrivatePrompt is a full-stack, locally hosted AI application designed to enable secure and private interaction with large language models (LLMs). The system connects a modern web-based frontend with a backend API that interfaces with locally running LLMs, ensuring that all data processing happens offline without reliance on external cloud services.

This project demonstrates end-to-end system design, combining frontend development, backend APIs, and AI model integration in a modular and extensible architecture.

---

## Project Overview

The application allows users to interact with locally hosted LLMs through a responsive chat interface. It supports session handling, model switching, and retrieval-augmented generation (RAG), making it suitable for internal tools, private AI workflows, and experimentation with AI-driven platforms.

Key objectives of the project include:
- Building a privacy-first AI application
- Demonstrating full-stack integration
- Designing extensible backend services for AI workflows

---

## Project Structure

```
PrivatePrompt/
├── Backend/        # FastAPI backend handling APIs, LLM interaction, and sessions
├── Frontend/       # React-based chat interface
├── .gitignore      # Git ignore rules
└── README.md       # Project documentation
```

---

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/walterwhite777/PrivatePrompt.git
cd PrivatePrompt
```

---

### Backend Setup

```bash
cd Backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The backend is built using FastAPI and is responsible for:
- Handling chat requests and responses
- Managing session context
- Interfacing with locally hosted LLMs
- Supporting optional RAG pipelines

---

### Frontend Setup

```bash
cd ../Frontend
npm install
npm run dev
```

The frontend provides a clean and responsive interface for interacting with the backend and visualizing AI-generated responses in real time.

---

## Technology Stack

- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: FastAPI (Python)
- **LLM Integration**: Local models via Ollama (e.g., LLaMA, OpenHermes)
- **Storage**: Lightweight local storage (SQLite or TinyDB) for session and chat history

---

## Core Features

- End-to-end full-stack architecture
- Offline and privacy-first AI processing
- Session-based chat management
- Support for multiple local LLMs
- Retrieval-Augmented Generation (RAG)
- Modular backend design for future scalability

---

## Notes on Repository Setup

If Git reports submodule-related issues (e.g., frontend treated as a submodule), ensure the frontend directory is tracked as a standard folder and committed correctly.

---

## Use Cases

- Private AI assistants
- Internal productivity tools
- AI platform prototyping
- Learning full-stack AI system design

---

## Future Enhancements

- User authentication and access control
- Improved session persistence
- Enhanced UI/UX for multi-model comparison
- Deployment-ready configurations

---

This project reflects practical experience in building secure, full-stack AI applications by integrating frontend interfaces, backend APIs, and local AI models in a privacy-focused system design.
