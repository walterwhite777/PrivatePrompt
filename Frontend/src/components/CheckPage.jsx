const CheckPage = ({ onOllamaCheck, checking }) => (
  <div className="page-transition min-h-[80vh] flex flex-col items-center justify-center">
    <div className="text-center">
      <svg
        className="w-24 h-24 mx-auto"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="45" stroke="#6366F1" strokeWidth="10" />
        <path
          d="M30 50L45 65L70 35"
          stroke="#6366F1"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Ollama Chat</h1>
      <p className="text-gray-600 mb-8">Your offline AI assistant powered by Ollama</p>
      <div className={`bg-white p-8 rounded-xl shadow-lg max-w-md mx-auto ${checking ? "" : "hidden"}`}>
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500" />
          <p className="text-gray-700">Checking if Ollama is installed...</p>
        </div>
      </div>
      <div className={`bg-white p-8 rounded-xl shadow-lg max-w-md mx-auto ${checking ? "hidden" : ""}`}>
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto text-amber-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-xl font-semibold mt-4 mb-2">Ollama Not Detected</h2>
          <p className="text-gray-600 mb-6">To use this application, you need to install Ollama first.</p>
          <a
            href="https://ollama.ai/download"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download Ollama
          </a>
          <button
            onClick={onOllamaCheck}
            className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Check again
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default CheckPage;