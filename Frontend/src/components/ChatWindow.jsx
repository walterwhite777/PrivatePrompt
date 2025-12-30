import React, { useState, useEffect } from "react";
import { FaRegUser, FaMicrophone } from "react-icons/fa";
import { ImAttachment } from "react-icons/im";
import { VscRobot } from "react-icons/vsc";
import { IoMdSend } from "react-icons/io";
import { MdKeyboardArrowDown } from "react-icons/md";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import oneDark from "react-syntax-highlighter/dist/esm/styles/prism/one-dark";
import { useAppContext } from "../lib/AppContext";
import { FaRegCircleStop } from "react-icons/fa6";

export default function ChatWindow({ selectedModel, onNewChat, onSendMessage, onSwitchChat }) {
  const { state, sendMessage } = useAppContext();
  const [systemMessages, setSystemMessages] = useState([]);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingError, setRecordingError] = useState(null);
  // PDF file upload state
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfError, setPdfError] = useState("");

  // Textarea ref for setting transcribed text
  const textareaRef = React.useRef(null);

  useEffect(() => {
    if (audioBlob) {
      console.log("Recorded audio blob:", audioBlob);
      // Send audio blob to backend and fill textarea
      const sendAudioForTranscription = async () => {
        try {
          const formData = new FormData();
          formData.append("file", audioBlob, "audio.webm");
          // Change the URL below to match your FastAPI backend
          const response = await fetch("http://localhost:8000/chat/transcribe", {
            method: "POST",
            body: formData,
          });
          const data = await response.json();
          if (data.text && textareaRef.current) {
            textareaRef.current.value = data.text;
          }
        } catch (err) {
          console.error("Transcription error:", err);
        }
      };
      sendAudioForTranscription();
    }
  }, [audioBlob]);

  // Start/stop recording
  const handleMicClick = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorder) {
        mediaRecorder.stop();
      }
      setIsRecording(false);
    } else {
      setRecordingError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new window.MediaRecorder(stream);
        let chunks = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          setAudioBlob(blob);
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
        };
        setMediaRecorder(recorder);
        setIsRecording(true);
        chunks = [];
        recorder.start();
      } catch (err) {
        setRecordingError('Microphone access denied or not available.');
      }
    }
  };

  const currentSession = state.chatSessions.find(
    (s) => s.id === state.currentChatId
  );
  // console.log("currentSession", currentSession);

  const messages = currentSession?.messages || [];
  // Combine system messages and chat messages for display
  const allMessages = [
    ...systemMessages.map((msg, idx) => ({ ...msg, _sys: true, idx })),
    ...messages.map((msg, idx) => ({ ...msg, _sys: false, idx: 1000 + idx })),
  ].sort((a, b) => a.idx - b.idx);
  // console.log("messages", messages);
  const bottomRef = React.useRef(null);

  // Track whose turn it is (user or assistant)
  const [nextRole, setNextRole] = useState("user");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle sending a message
  const handleSendMessage = async (value) => {
    setIsLoading(true);
    try {
      // If PDF file is attached, handle upload here
      if (pdfFile) {
        const formData = new FormData();
        formData.append("file", pdfFile);
        // Replace with your backend endpoint for PDF upload
        let pdfSuccess = false;
        let pdfMsg = "";
        try {
        const res = await fetch(`http://localhost:8000/chat/pdf_context/${selectedModel.model_name}/${state.currentChatId}`, {
                    method: "POST",
                    body: formData,
                    });
          const data = await res.json();
          if (res.ok && (data.success || data.status === 'ok')) {
            pdfSuccess = true;
            pdfMsg = data.message || "PDF extracted successfully.";
          } else {
            pdfMsg = data.message || "Failed to extract PDF.";
          }
        } catch (err) {
          pdfMsg = "Failed to extract PDF.";
        }
        setSystemMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: pdfMsg,
            sysType: pdfSuccess ? "success" : "error",
          },
        ]);
        setPdfFile(null);
      }
      await sendMessage(value);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle PDF file selection
  const handlePdfChange = (e) => {
    setPdfError("");
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
        setPdfError("Only PDF files are allowed.");
        setPdfFile(null);
      } else {
        setPdfFile(file);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50">
      {/* Chat Header */}
      <div className="p-6 flex items-center shadow-sm">
        <span className="text-black text-lg tracking-tight flex items-center">
          {selectedModel?.model_name || "Model"}
        </span>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {allMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-center mb-6 message-appear ${
              msg.role === "user"
                ? "justify-end"
                : msg.role === "system"
                ? "justify-center"
                : "justify-start"
            }`}
          >
            {/* System message bubble */}
            {msg.role === "system" && (
              <div
                className={`bg-${msg.sysType === "success" ? "green" : "red"}-100 text-${msg.sysType === "success" ? "green" : "red"}-700 rounded-lg px-4 py-2 max-w-[70%] mx-auto text-center text-sm font-medium`}
                style={{ minWidth: 180 }}
              >
                {msg.content}
              </div>
            )}
            {/* Assistant Avatar */}
            {msg.role === "assistant" && (
              <>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-indigo-100">
                  <VscRobot className="h-5 w-5 text-indigo-600" />
                </div>
                <div
                  className="ml-4 bg-gray-50 text-left rounded-lg px-4 py-3 max-w-[85%] overflow-x-auto."
                >
                  <ReactMarkdown
                    children={msg.content}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                          <div className="overflow-x-auto max-w-full bg-[#282c34] rounded-md">
                            <SyntaxHighlighter
                              style={oneDark}
                              language={match[1]}
                              PreTag="div"
                              customStyle={{
                                margin: 0,
                                padding: "1em",
                                whiteSpace: "pre", // Prevent wrapping of long lines
                              }}
                              {...props}
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code className="bg-gray-200 rounded px-1">
                            {children}
                          </code>
                        );
                      },
                    }}
                  />
                </div>
              </>
            )}
            {/* User Message */}
            {msg.role === "user" && (
              <>
                <div className="bg-indigo-500 text-white text-right rounded-lg px-4 py-3 max-w-[85%] ml-auto">
                  <span className="text-inherit">{msg.content}</span>
                </div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-100 ml-4">
                  <FaRegUser className="h-5 w-5 text-blue-600" />
                </div>
              </>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center mb-6 justify-start">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-indigo-100">
              <VscRobot className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="ml-4 bg-gray-100 text-left rounded-lg px-4 py-3 max-w-[85%] italic text-gray-500 flex items-center gap-2">
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input and Send Button */}
      <div className="w-full flex justify-center items-end pb-6 pointer-events-none">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const value = e.target.elements.message.value;
            if (value || pdfFile) {
              handleSendMessage(value);
              e.target.reset();
              setPdfFile(null);
            }
          }}
          className="flex w-full max-w-3xl bg-white  rounded-[28px] shadow-md px-3 py-2 pointer-events-auto gap-2"
        >
          {/* Textarea and attachment icon container */}
          <div className="flex items-center flex-1">
            <div className="max-h-52 overflow-auto scrollbar-thin px-2 py-1 flex-1">
              <textarea
                ref={textareaRef}
                name="message"
                rows={1}
                autoComplete="on"
                placeholder="Ask anything"
                className="w-full resize-none overflow-hidden text-base bg-transparent outline-none placeholder:text-gray-400 text-gray-900 "
                onInput={(e) => {
                  const el = e.target;
                  el.style.height = "auto";
                  el.style.height = `${el.scrollHeight}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    e.target.form.requestSubmit();
                  }
                }}
              />
            </div>
            {/* Attachment icon right next to textarea */}
            <div className="flex items-center ml-2">
              <label className="cursor-pointer flex items-center">
                <ImAttachment size={20} className="text-indigo-500 hover:text-indigo-700" />
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handlePdfChange}
                  style={{ display: "none" }}
                />
              </label>
            </div>
            {/* Show PDF file name and error inline */}
            {pdfFile && (
              <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full ml-2">
                {pdfFile.name}
                <button
                  type="button"
                  className="ml-2 text-red-500 hover:text-red-700"
                  onClick={() => setPdfFile(null)}
                >
                  ×
                </button>
              </span>
            )}
            {pdfError && (
              <span className="text-xs text-red-500 ml-2">{pdfError}</span>
            )}
          </div>
          {/* Send Button aligned to the side */}
          <div className="flex items-end">
            {/* Attachment icon is now in the PDF section above */}
            {/* Microphone Button */}
            <button
              type="button"
              className={`flex items-center justify-center p-2 rounded-full transition-colors mr-2 ${isRecording ? 'bg-red-200 text-red-700' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
              title={isRecording ? "Stop recording" : "Record voice message"}
              onClick={handleMicClick}
            >
              <FaMicrophone className="w-5 h-5" />
            </button>
            {/* Show recording error if any */}
            {recordingError && (
              <span className="text-xs text-red-500 ml-2">{recordingError}</span>
            )}
            {isLoading ? (
              <button
                type="button"
                className="flex items-center justify-center bg-red-100 text-red-500 p-2 rounded-full transition-colors cursor-not-allowed"
                disabled
                tabIndex={-1}
                title="Waiting for response"
              >
                <FaRegCircleStop size={20} />
              </button>
            ) : (
              <button
                type="submit"
                className="flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded-full transition-colors"
              >
                <IoMdSend size={20} />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
