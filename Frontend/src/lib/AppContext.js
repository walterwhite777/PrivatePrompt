import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { API, 
  createChatSession,
  sendMessage as apiSendMessage,
  getChatHistory,
  getAllSessions,
  deleteSession as apiDeleteSession,
  updateChatTitle,
  exportChatSession
} from './api';
import { API_BASE } from './api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [state, setState] = useState({
    selectedModel: null,
    chatSessions: [],
    currentChatId: null,
    models: { installed: [], available: [] },
  });

  const [checkingOllama, setCheckingOllama] = useState(true);
  const [ollamaInstalled, setOllamaInstalled] = useState(false);
  const isCheckingRef = useRef(false);
  const isFetchingModelsRef = useRef(false);

  const checkOllamaPresence = useCallback(async (retries = 3) => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    setCheckingOllama(true);

    while (retries > 0) {
      try {
        const response = await fetch(API.OLLAMA);
        const data = await response.json();

        if (response.ok && data.status === 'ok') {
          setOllamaInstalled(true);
          break;
        } else {
          setOllamaInstalled(false);
        }
      } catch {
        retries--;
        if (retries === 0) {
          setOllamaInstalled(false);
        } else {
          await new Promise((res) => setTimeout(res, 1000));
        }
      }
    }

    setCheckingOllama(false);
    isCheckingRef.current = false;
  }, []);

  const fetchModels = useCallback(async () => {
    if (isFetchingModelsRef.current) return;
    isFetchingModelsRef.current = true;

    try {
      const [installedRes, availableRes] = await Promise.all([
        fetch(API.LIST),
        fetch(API.AVAILABLE)
      ]);

      const [installedData, availableData] = await Promise.all([
        installedRes.ok ? installedRes.json() : { models: [] },
        availableRes.ok ? availableRes.json() : { models: [] },
      ]);

      const installed = (installedData.models || []).filter(m => m?.model_name);
      const available = (availableData.models || []).filter(m => m?.model_name);

      setState((prev) => ({
        ...prev,
        models: {
          installed,
          available,
        },
      }));
    } catch (e) {
      console.error('Error fetching models:', e);
    } finally {
      isFetchingModelsRef.current = false;
    }
  }, []);

  const deleteModel = useCallback((modelName) => {
    setState(prev => ({
      ...prev,
      models: {
        ...prev.models,
        installed: prev.models.installed.filter(m => m.model_name !== modelName),
      },
    }));
  }, []);




  const downloadModel = useCallback((modelName) => {
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        models: {
          ...prev.models,
          installed: [
            ...prev.models.installed,
            { model_name: modelName, size: 123456789 },
          ],
        },
      }));
    }, 2000);
  }, []);

  // Add chat session management and message sending using backend
const createNewChat = useCallback(async (modelName) => {
  try {
    const session = await createChatSession(modelName);

    // 👇 Get the full model object from installed models
    const fullModel = state.models.installed.find(
      (m) => m.model_name === modelName
    );

    const welcomeMessage = {
      role: 'assistant',
      content: `What’s on your mind today?`,
    };

    const newChat = {
      id: session.session_id,
      title: 'New Conversation',
      model: modelName,
      timestamp: new Date(),
      messages: [welcomeMessage],
    };

    setState((prev) => ({
      ...prev,
      selectedModel: fullModel || prev.selectedModel, // ✅ fix here
      currentChatId: session.session_id,
      chatSessions: [newChat, ...prev.chatSessions],
    }));

    return session.session_id;
  } catch (e) {
    console.error('Failed to create chat session', e);
  }
}, [state.models.installed]);

const switchChat = useCallback(async (chatId) => {
  try {
    const response = await fetch(`${API_BASE}/chat/chat_history/${chatId}`);
    const data = await response.json();

    if (!Array.isArray(data.conversations)) {
      throw new Error("Invalid chat history format");
    }

    const messages = data.conversations.flatMap((conv) => {
      const parts = [];
      if (conv.user_message) parts.push({ role: "user", content: conv.user_message });
      if (conv.assistant_response) parts.push({ role: "assistant", content: conv.assistant_response });
      return parts;
    });

    setState((prev) => {
      const sessionExists = prev.chatSessions.some((s) => s.id === chatId);

      const updatedSessions = sessionExists
        ? prev.chatSessions.map((s) =>
            s.id === chatId ? { ...s, messages } : s
          )
        : [
            {
              id: chatId,
              title: "Restored Session",
              model: prev.selectedModel?.model_name || "default-model",
              messages,
            },
            ...prev.chatSessions,
          ];

      return {
        ...prev,
        currentChatId: chatId,
        chatSessions: updatedSessions,
      };
    });
  } catch (e) {
    console.error("Failed to fetch chat history for session", chatId, e);
  }
}, []);

const selectModel = useCallback((model) => {
  setState((prev) => ({
    ...prev,
    selectedModel: model,
    currentChatId: null, // 🔥 Clear previous session
    chatSessions: [],    // 🔥 Reset sessions (optional: fetch fresh from server)
  }));
}, []);

const sendMessage = useCallback(async (message) => {
  if (!state.currentChatId) return;
  try {
    const res = await apiSendMessage(state.currentChatId, message,state.selectedModel);
    const history = await getChatHistory(state.currentChatId);

setState((prev) => ({
  ...prev,
  chatSessions: prev.chatSessions.map((session) =>
    session.id === prev.currentChatId
      ? {
          ...session,
          messages: history.conversations.flatMap((conv) => {
            const parts = [];
            if (conv.user_message)
              parts.push({ role: "user", content: conv.user_message });
            if (conv.assistant_response)
              parts.push({ role: "assistant", content: conv.assistant_response });
            return parts;
          }),
        }
      : session
  ),
}));


    return res;
  } catch (e) {
    console.error("Failed to send message", e);
  }
}, [state.currentChatId]);


  useEffect(() => {
    checkOllamaPresence();
    fetchModels();
  }, [checkOllamaPresence, fetchModels]);

  if (state.selectedModel === undefined) {
    return <div>Loading...</div>;
  }

  return (
    <AppContext.Provider
      value={{
        state,
        checkingOllama,
        ollamaInstalled,
        checkOllamaPresence,
        fetchModels,
        deleteModel,
        selectModel,
        downloadModel,
        createNewChat,
        sendMessage,
        switchChat,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
