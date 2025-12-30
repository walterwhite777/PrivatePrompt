import { formatSize } from "../lib/utils";
import ModelDeleteButton from "./ModeldeleteButton";
import { useRouter } from 'next/router';
const ModelCard1 = ({ model, isInstalled, onClick, onDelete }) => {
  const router = useRouter();

  const handleCardClick = async () => {
    if (onClick) {
      // If onClick returns a promise, await it
      const result = onClick(model);
      if (result && typeof result.then === "function") {
        await result;
      }
    }
    // Now navigate to chatpage
    router.push("/chatpage");
  };

  return(
      <div
        className="model-card flex flex-col justify-between p-5 border border-gray-200 rounded-2xl hover:border-indigo-400 hover:shadow-lg transition-all cursor-pointer bg-white h-[360px] w-[270px]"
        onClick={handleCardClick}
        data-model={model.model_name}
      >
        <div className="flex flex-col space-y-4">
          {/* Header */}
          <div className="flex items-center">
            <div className="bg-gray-100 rounded-full p-2 mr-3">
              <svg
                className="w-6 h-6 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="flex-1 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 text-base truncate">
                {model.model_name}
              </h3>
              {isInstalled && (
                <ModelDeleteButton model={model} onDelete={onDelete} />
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 line-clamp-2 h-10">
            {model.details?.family || "No description available"}
          </p>

          {/* Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-semibold text-gray-700">Size: </span>
              <span className="text-gray-600">{formatSize(model.size)}</span>
            </div>

            <div>
              <span className="font-semibold text-gray-700">
                Quantization:{" "}
              </span>
              <span className="text-gray-600">
                {model.details?.quantization_level || "Unknown"}
              </span>
            </div>

            <div>
              <span className="font-semibold text-gray-700">Parameters: </span>
              <span className="text-gray-600">
                {model.details?.parameter_size || "Unknown"}
              </span>
            </div>

            <div>
              <span className="font-semibold text-gray-700">Digest: </span>
              <span className="text-gray-600">
                {model.digest?.substring(0, 8) || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 border-t pt-2 text-xs text-gray-500">
          Last Used: {formatDate(model.modified_at) || "N/A"}
        </div>
      </div>
);
  };

const formatDate = (isoStr) => {
  if (!isoStr) return "";
  const date = new Date(isoStr);
  return date.toLocaleDateString() + " " + date.toLocaleTimeString();
};

export default ModelCard1;
