import { formatSize } from '../lib/utils';
import ModelDownloadButton from './ModelDownloadButton';

const ModelCard = ({ model, isInstalled, onSelect, onDownload }) => (
  <div
    className="model-card flex flex-col justify-between p-5 border border-gray-200 rounded-2xl hover:border-indigo-400 hover:shadow-lg transition-all cursor-pointer bg-white h-[360px] w-[270px]"
    data-model={model.model_name}
  >
    <div className="flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-grow">
          <div className={`${isInstalled ? 'bg-indigo-100' : 'bg-gray-100'} rounded-full p-2 mr-3`}>
            <svg
              className={`w-6 h-6 ${!isInstalled ? 'text-indigo-600' : 'text-gray-600'}`}
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
          <h3 className="font-semibold text-gray-800 text-base truncate">{model.model_name}</h3>
        </div>

        {/* Download button only if not installed */}
        {!isInstalled && (
          <ModelDownloadButton model={model} onDownload={onDownload} />
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 line-clamp-2 h-10">
        {model.description || 'No description available'}
      </p>

      {/* Details */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="font-semibold text-gray-700">Sizes: </span>
          <span className="text-gray-600">
            {model.sizes?.length > 0
              ? model.sizes.map((size) => formatSize(parseSize(size))).join(', ')
              : 'Unknown'}
          </span>
        </div>

        <div>
          <span className="font-semibold text-gray-700">Capabilities: </span>
          <span className="text-gray-600">
            {model.capability?.length > 0 ? model.capability.join(', ') : 'None'}
          </span>
        </div>

        <div>
          <span className="font-semibold text-gray-700">Pulls: </span>
          <span className="text-gray-600">{model.pulls || 'N/A'}</span>
        </div>

        <div>
          <span className="font-semibold text-gray-700">Tags: </span>
          <span className="text-gray-600">{model.tags || 'N/A'}</span>
        </div>
      </div>
    </div>

    {/* Footer */}
    <div className="mt-4 border-t pt-2 text-xs text-gray-500">
      Last Updated: {model.last_updated || 'N/A'}
    </div>
  </div>
);

const parseSize = (sizeStr) => {
  if (!sizeStr || typeof sizeStr !== 'string') return 0;
  const sizeMap = { b: 1e9, m: 1e6, k: 1e3 };
  const num = parseFloat(sizeStr);
  const unit = sizeStr.match(/[bmk]/i)?.[0]?.toLowerCase();
  return unit ? num * (sizeMap[unit] || 1e9) : num * 1e9;
};

export default ModelCard;
