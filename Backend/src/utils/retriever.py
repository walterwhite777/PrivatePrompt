import chromadb
from chromadb.config import Settings
from uuid import uuid4
from .embedder import embed_text

chroma_client = chromadb.Client(Settings(
    persist_directory="./chroma_store",
    chroma_db_impl="duckdb+parquet"
))

collection = chroma_client.get_or_create_collection(name="chat_chunks")

def add_message_to_vectorstore(chat_id, role, content):
    embedding = embed_text(content)
    message_id = str(uuid4())
    metadata = {
        "chat_id": chat_id,
        "role": role,
    }
    collection.add(
        documents=[content],
        embeddings=[embedding],
        metadatas=[metadata],
        ids=[message_id],
    )

def retrieve_relevant_messages(query, chat_id, top_k=6):
    query_embedding = embed_text(query)
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where={"chat_id": chat_id}
    )
    return [{"role": doc['metadata']['role'], "content": doc['document']} 
            for doc in zip(results['metadatas'][0], results['documents'][0])]
