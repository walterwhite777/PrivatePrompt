from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.documents import Document
from sqlalchemy.orm import Session
from langchain.chains.history_aware_retriever import create_history_aware_retriever
from langchain.chains.combine_documents.stuff import create_stuff_documents_chain
from chat_helper import get_chat_history
from .chat_helper import save_conversation
from .model_wrapper import LocalLLMWrapper
from ..models.chat_models import ChatSession, ChatConversations
from ..database.db import SessionLocal

embedding_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
vectorstore = Chroma(persist_directory="vector_db", embedding_function=embedding_model)

retriever = vectorstore.as_retriever(search_kwargs={"k": 4,"score_threshold": 0.9})

llm = LocalLLMWrapper(model_name="llama3")  

# History-aware retriever prompt
history_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are an assistant. Given a user question and prior chat history, reformulate the question if needed."),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}")
])

retriever_chain = create_history_aware_retriever(llm, retriever, history_prompt)

qa_prompt = ChatPromptTemplate.from_messages([
    ("system", "Answer the question based on the following documents:{context}"),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}")
])

document_chain = create_stuff_documents_chain(llm, qa_prompt)

class CustomRetrievalChain:
    def __init__(self, retriever_chain, document_chain, llm):
        self.retriever_chain = retriever_chain
        self.document_chain = document_chain
        self.llm = llm

    def invoke(self, inputs: dict):
        question = inputs["input"]
        chat_history = inputs.get("chat_history", [])

        context_docs = self.retriever_chain.retriever.get_relevant_documents(question)
        
        if not context_docs:
            print("[RAG] No relevant documents found. Using base LLM without context.")
            messages = chat_history + [{"role": "user", "content": question}]
            return {"answer": self.llm.call(messages)}

        return self.document_chain.invoke({
            "input": question,
            "chat_history": chat_history,
            "context": context_docs
        })

rag_chain = CustomRetrievalChain(retriever_chain, document_chain, llm)

def add_to_vectorstore(text: str):
    doc = Document(page_content=text)
    vectorstore.add_documents([doc])
    vectorstore.persist()

def chat_with_history(session_id: str, query: str):
    chat_history = get_chat_history(session_id)
    result = rag_chain.invoke({
        "chat_history": chat_history,
        "input": query
    })

    answer = result["answer"]
    save_conversation(session_id, query, answer)
    add_to_vectorstore(query)
    add_to_vectorstore(answer)
    return answer
