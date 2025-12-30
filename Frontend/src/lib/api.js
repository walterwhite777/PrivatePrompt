export const API_BASE = "http://localhost:8000";
export const API = {
  OLLAMA: `${API_BASE}/model/ollama`,
  LIST: `${API_BASE}/model/list`,
  AVAILABLE: `${API_BASE}/model/available`,
  SESSION_ID:`${API_BASE}/chat/session_id`,
  TITLE:`${API_BASE}/chat/chat//title`,
  CHAT: `${API_BASE}/chat/sessions//messages`,
  SESSIONS:`${API_BASE}/chat/sessions/by_model`,
  DELETE_SESSION:`${API_BASE}/chat/delete-session//`,
  CHAT_HISTORY:`${API_BASE}/chat/chat_history//`,
  GENERATE: `${API_BASE}/api/generate`,
  DOWNLOAD:`${API_BASE}/model/pull`,
  DELETE:`${API_BASE}/model/remove`,
  EXPORT_SESSION:`${API_BASE}/chat//export//`,
  HEALTH:`${API_BASE}/chat/health`,
};

export async function createChatSession(model) {
  const res = await fetch(`${API_BASE}/chat/session_id?model=${encodeURIComponent(model)}`);
  if (!res.ok) throw new Error("Failed to create session");
  return res.json();
}

export async function sendMessage(sessionId, message, selectedModel) {
  const url = `${API_BASE}/chat/${selectedModel?.model_name}/${sessionId}?q=${encodeURIComponent(message)}`;

  const res = await fetch(url, {
    method: "POST",
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to send message: ${errorText}`);
  }

  return res.json(); // returns { response: ..., model_used: ..., ... }
}


export async function getChatHistory(sessionId) {
  const res = await fetch(`${API_BASE}/chat/chat_history/${sessionId}`);
  if (!res.ok) throw new Error("Failed to fetch chat history");
  return res.json();
}

export async function getAllSessions() {
  const res = await fetch(`${API_BASE}/sessions`);
  if (!res.ok) throw new Error("Failed to fetch sessions");
  return res.json();
}

export async function deleteSession(sessionId) {
  const res = await fetch(`${API_BASE}/delete-session/${sessionId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete session");
  return res.json();
}

export async function updateChatTitle(sessionId, title) {
  const res = await fetch(`${API_BASE}/chat/${sessionId}/title`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to update title");
  return res.json();
}

export async function exportChatSession(sessionId) {
  const res = await fetch(`${API_BASE}/export/${sessionId}`);
  if (!res.ok) throw new Error("Failed to export session");
  return res.json();
}