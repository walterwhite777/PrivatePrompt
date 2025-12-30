import { useState, useEffect } from "react";
import ModelCard from "./ListModelCard";
import ModelCard1 from "./AvailableModelCard";
import { useAppContext } from "../lib/AppContext";

const ModelsPage = () => {
  const {
    state: { models },
    selectModel,
    fetchModels,
  } = useAppContext();

  const [availableSearch, setAvailableSearch] = useState("");
  const [allSearch, setAllSearch] = useState("");
  const [downloadingModel, setDownloadingModel] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState("");
  const [downloadError, setDownloadError] = useState(null);
  const [isFetchingAfterDownload, setIsFetchingAfterDownload] = useState(false);
  const [loadingModels, setLoadingModels] = useState(true); // Initialize to true

useEffect(() => {
  const fetchWithSpinner = async () => {
    setLoadingModels(true);
    const start = Date.now(); 

    await fetchModels();  

    const elapsed = Date.now() - start;
    const minDelay = 500; 

    const remaining = minDelay - elapsed;
    if (remaining > 0) {
      setTimeout(() => setLoadingModels(false), remaining);
    } else {
      setLoadingModels(false);
    }
  };

  fetchWithSpinner();
}, [fetchModels]);


  const handleDownloadModel = async (modelName) => {
    console.log("Starting download for:", modelName);
    setDownloadingModel(modelName);
    setDownloadProgress("Connecting...");
    setDownloadError(null);

    const source = new EventSource(`/api/download/${modelName}`);

    source.onmessage = async (event) => {
      const data = event.data;
      console.log("Download update:", data);
      setDownloadProgress(data);

      if (data.includes("success") || data.includes("completed")) {
        setDownloadProgress("Successfully downloaded");
        source.close();
        setIsFetchingAfterDownload(true);
        setLoadingModels(true);
        await fetchModels(); // Wait for models to update
        setTimeout(() => setLoadingModels(false), 200); // Add delay for spinner visibility
        setIsFetchingAfterDownload(false);
        setDownloadingModel(null);
        setDownloadProgress("");
      }
    };

    source.onerror = (err) => {
      console.error("Download error:", err);
      setDownloadError(
        "Failed to connect to download stream. Please try again."
      );
      source.close();
      setTimeout(() => {
        setDownloadingModel(null);
        setDownloadProgress("");
        setDownloadError(null);
      }, 3000);
    };
  };

  const closeDownloadPopup = () => {
    setDownloadingModel(null);
    setDownloadProgress("");
    setDownloadError(null);
  };

  const installedModels = models.installed;
  const availableModels = models.available;

  return (
    <div className="page-transition max-w-6xl mx-auto px-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
        Select a Model
      </h1>
      <p className="text-gray-600 mb-8 text-center">
        Choose an AI model to start your conversation
      </p>

      {/* Installed Models */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Available Models (Installed)
          </h2>
          <input
            type="text"
            placeholder="Search installed models..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            value={availableSearch}
            onChange={(e) => setAvailableSearch(e.target.value)}
          />
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-2">
          {loadingModels ? (
            <div className="flex justify-center items-center w-full py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-indigo-600 border-solid"></div>
              <span className="ml-3 text-gray-600">Loading models...</span>
            </div>
          ) : availableModels.length === 0 ? (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg w-full">
              <p className="text-gray-600">No models installed yet.</p>
            </div>
          ) : (
            availableModels
              .filter((model) =>
                model.model_name
                  ?.toLowerCase()
                  .includes(availableSearch.toLowerCase())
              )
              .map((model) => (
                <div key={model.model_name} className="flex-shrink-0 w-72">
                  <ModelCard1
                    model={model}
                    isInstalled={true}
                    onClick={selectModel} // <-- this should be the context function
                    onDelete={fetchModels}
                  />
                </div>
              ))
          )}
        </div>
      </div>

      {/* All Models */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">ALL Models</h2>
          <input
            type="text"
            placeholder="Search all models..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            value={allSearch}
            onChange={(e) => setAllSearch(e.target.value)}
          />
        </div>

        <div className="flex space-x-4 overflow-x-auto pb-2">
          {loadingModels ? (
            <div className="flex justify-center items-center w-full py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-indigo-600 border-solid"></div>
              <span className="ml-3 text-gray-600">Loading models...</span>
            </div>
          ) : installedModels.length === 0 ? (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg w-full">
              <p className="text-gray-600">
                No models available. Please check the model repository.
              </p>
            </div>
          ) : (
            installedModels
              .filter((model) =>
                model.model_name
                  ?.toLowerCase()
                  .includes(allSearch.toLowerCase())
              )
              .map((model) => (
                <div key={model.model_name} className="flex-shrink-0 w-72">
                  <ModelCard
                    model={model}
                    isInstalled={false}
                    onSelect={() => selectModel(model.model_name)}
                    onDownload={() => handleDownloadModel(model.model_name)}
                  />
                </div>
              ))
          )}
        </div>
      </div>

      {/* Download popup */}
      {downloadingModel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4 flex flex-col items-center">
            <div className="text-lg font-semibold mb-4">
              Downloading {downloadingModel}
            </div>
            {isFetchingAfterDownload ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 border-solid mb-4"></div>
                <div className="text-sm text-gray-600">Updating models...</div>
              </>
            ) : !downloadError ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 border-solid mb-4"></div>
                <div className="text-sm text-gray-600">{downloadProgress}</div>
              </>
            ) : (
              <>
                <div className="text-red-600 mb-4">{downloadError}</div>
                <button
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  onClick={closeDownloadPopup}
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelsPage;
