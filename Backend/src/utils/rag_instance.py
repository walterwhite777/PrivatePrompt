from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_core.documents import Document
from typing import List, Optional
import os

class RAGEngine:
    def __init__(self, db_path: str = "vector_db", embedding_model: str = "all-MiniLM-L6-v2"):
        try:
            self.embedding = HuggingFaceEmbeddings(model_name=embedding_model)
            self.vectorstore = Chroma(
                persist_directory=db_path,
                embedding_function=self.embedding
            )
            self.retriever = self.vectorstore.as_retriever(
                search_kwargs={"k": 5}
            )
            self.is_initialized = True
        except Exception as e:
            print(f"[RAG Init Error] {e}")
            self.is_initialized = False

    def retrieve(self, query: str, k: int) -> List[Document]:
        if not self.is_initialized:
            return []
        try:
            self.retriever.search_kwargs["k"] = k
            results=self.retriever.invoke(query)
            filtered = [doc for doc in results if doc.metadata.get("score", 1.0) >= 0.7]
            return results
        except Exception as e:
            print(f"[RAG Retrieval Error] {e}")
            return []

    def add_to_store(self, content: str, metadata: Optional[dict] = None):
        if not self.is_initialized or not content.strip():
            return
        try:
            doc = Document(page_content=content.strip(), metadata=metadata or {})
            self.vectorstore.add_documents([doc])
            print(f"[RAG Add] Stored document: {content[:50]}...")
            # self.vectorstore.persist()
        except Exception as e:
            print(f"[RAG Add Error] {e}")

# Create a global instance to import in API
rag = RAGEngine()
