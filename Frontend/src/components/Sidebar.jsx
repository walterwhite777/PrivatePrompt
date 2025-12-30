import React, { useState, useEffect } from "react";
import ChatListItem from "./SessionList";
import { FiPlus, FiSearch, FiRefreshCw, FiSidebar, FiEdit2, FiLoader } from "react-icons/fi";
import { useRouter } from "next/router";
import { API,API_BASE } from "../lib/api";
import { useAppContext } from "../lib/AppContext";
export default function Sidebar({ onNewChat, selectedModel, collapsed, setCollapsed }) {
  const { state, switchChat } = useAppContext();
  const [chats, setChats] = useState([]); // Start with empty
  const [loading, setLoading] = useState(true); // Loading state
  const [search, setSearch] = useState("");
  const router = useRouter();

  const handleDelete = (id) => {
  setChats((prevChats) => prevChats.filter((chat) => chat.id !== id));
  };
  const handleEdit = (id, newName) => {
  setChats((prevChats) =>
    prevChats.map((chat) =>
      chat.id === id ? { ...chat, name: newName } : chat
    )
  );
};
  useEffect(() => {
    const modelName = selectedModel?.model_name;
    if (!modelName) {
      setChats([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const url = `${API.SESSIONS}?model=${encodeURIComponent(modelName)}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.sessions)) {
          setChats(
            data.sessions.map((s) => ({ id: s.chat_id, name: s.title }))
          );
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedModel?.model_name]);

const handleNewChat = async () => {
  if (!selectedModel?.model_name) return;

  try {
    const response = await fetch(
      `${API_BASE}/chat/session_id?model=${encodeURIComponent(selectedModel.model_name)}`
    );

    if (!response.ok) throw new Error("Failed to create new chat session");

    const data = await response.json();
    const newChatId = data.session_id; // ✅ correct name

    await switchChat(newChatId); // ✅ use correct variable and await to ensure state update

    const title = data.title || `New Chat ${chats.length + 1}`;
    const newChat = { id: newChatId, name: title };

    setChats((prevChats) => [newChat, ...prevChats]); // ✅ add to sidebar
    if (onNewChat) {
      onNewChat(newChatId); // ✅ inform parent (optional)
    }

  } catch (err) {
    console.error("❌ Failed to create chat session:", err);
    alert("Failed to create a new chat. Please try again.");
  }
};



  const handleChangeModel = () => {
    router.push("/Models");
  };

  // Filter chats based on search
  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside
    className="bg-white scroll text-black h-screen flex flex-col border-r border-[#e8e6e6]"
    style={{ width: '100%', height: '100%' }}
  >

      {/* Collapse/Expand Button at the very top */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <button
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full w-9 h-9 flex items-center justify-center transition"
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <FiSidebar size={22} />
        </button>
        {!collapsed && (
          <span className="ml-2 font-bold text-lg tracking-tight"> {/* Logo or App Name */} </span>
        )}
      </div>

      {/* Menu Items */}
      <nav className={`flex flex-col gap-1 px-2 ${collapsed ? "items-center" : ""}`}>
        <button
          onClick={handleNewChat}
          className={`flex items-center gap-3 px-3 py-2 rounded-md transition text-base ${
            collapsed
              ? "justify-center bg-transparent text-black hover:bg-gray-200"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
        >
          <FiPlus size={20} />
          {!collapsed && <span>New chat</span>}
        </button>
        {/* search input */}
        {!collapsed ? (
          <div className="w-full px-1 py-1 mb-4"> {/* <-- Added mb-4 here */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search chats"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none w-full"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <FiSearch className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
          </div>
        ) : (
          <button
            className="flex items-center gap-3 px-3 py-2 rounded-md transition text-base justify-center"
            tabIndex={-1}
            aria-label="Search"
          >
            <FiSearch size={20} />
          </button>
        )}
      </nav>

      {/* Chats List */}
      {!collapsed && (
        <div className={`flex-1 overflow-y-auto px-2 scroll-auto`}>
          <div className={`text-lg  tracking-wider text-gray-700 mb-2`}>Chats</div>
          {loading ? (
            <div className="flex justify-center items-center h-20">
              <FiLoader className="animate-spin mr-2" size={22} /> Loading...
            </div>
          ) : !selectedModel?.model_name ? (
            <div className="flex justify-center items-center h-20 text-gray-400 text-sm text-center px-2">
              Please select a model to view sessions.
            </div>
          ) : (
            filteredChats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                onEdit={handleEdit}
                onDelete={handleDelete}
                collapsed={collapsed}
                isActive={chat.id === state.currentChatId}
                 onClick={(id) => {
    if (id !== state.currentChatId) {
      switchChat(id);
    }
  }}
              />
            ))
          )
          }
        </div>
      )}

      {/* Footer */}
      {!collapsed && (
        <div className="p-3 border-t border-[#e8e6e6] flex flex-col items-center">
          <button
            className="flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-md px-4 py-2 transition text-sm"
            onClick={handleChangeModel}
          >
            <FiRefreshCw />
            Explore Models
          </button>
          <div className="text-xs text-gray-400 mt-2 text-center w-full">
            More access to the best models
          </div>
        </div>
      )}
    </aside>
  );
}