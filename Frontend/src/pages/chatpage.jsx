import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAppContext } from "../lib/AppContext";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

export default function ChatPage() {
  const { state, createNewChat, switchChat, sendMessage } = useAppContext();
  const router = useRouter();
  const [currentChatId, setCurrentChatId] = useState(state.currentChatId);
  const [collapsed, setCollapsed] = useState(false); // <-- Add collapsed state here

  // Show loading while context is initializing
  if (state.selectedModel === undefined) {
    return <div>Loading...</div>;
  }

  // Only redirect if selectedModel is null AND there are no chatSessions (user did not select a model)
  useEffect(() => {
    // Redirect to model selection if nothing is set
    if (
      state.selectedModel === null &&
      (!state.chatSessions || state.chatSessions.length === 0)
    ) {
      router.push("/Models");
      return;
    }
  }, [state.selectedModel, state.chatSessions, state.currentChatId, router]);

  return (
    <div className="flex h-screen w-[100%]">
      <div
        style={{ width: collapsed ? 64 : 300 }}
        className="transition-[width] duration-300 ease-in-out overflow-hidden"
      >
        <Sidebar
          onNewChat={setCurrentChatId}
          selectedModel={state.selectedModel}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {state.currentChatId ? (
          <ChatWindow
            selectedModel={state.selectedModel}
            onSendMessage={sendMessage}
            chatSessions={state.chatSessions}
            currentChatId={state.currentChatId}
            onNewChat={createNewChat}
            onChangeModel={() => router.push("/Models")}
            onSwitchChat={switchChat}
          />
        ) : (
          <div className="flex-1 h-[100%] flex items-center justify-center bg-gray-50">
            <div className="text-gray-500 text-6xl">
              What's on your mind today?
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
