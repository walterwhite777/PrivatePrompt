import { useRouter } from 'next/router';
import { useState } from 'react';
import ModelCard1 from './AvailableModelCard';

const ModelsSection = ({ state, searchTerm, downloadModel }) => {
  const router = useRouter();
  
  const availableModels = state.models.available
    .filter((model) => !state.models.installed.some((m) => m.model_name === model.model_name))
    .filter((model) => model.model_name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleModelClick = (model) => {
    router.push({
      pathname: '/chat',
      query: { model: model.model_name },
    });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Available Models</h2>
      
      <div id="available-models" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableModels.length === 0 ? (
          <div className="col-span-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-gray-600">No additional models available.</p>
          </div>
        ) : (
          availableModels.map((model) => (
            <ModelCard1
              key={model.model_name}
              model={model}
              onDownload={downloadModel}
              onClick={() => handleModelClick(model)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ModelsSection;
