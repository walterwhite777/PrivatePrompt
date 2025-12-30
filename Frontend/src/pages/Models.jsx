import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useAppContext } from '../lib/AppContext';

const ModelsPageDynamic = dynamic(() => import('../components/ModelPage'), { ssr: false });

export default function Models() {
  const { state, fetchModels, selectModel, downloadModel } = useAppContext();
  const router = useRouter();
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!hasFetchedRef.current) {
      console.log('models.jsx mounted, fetching models');
      hasFetchedRef.current = true;
      fetchModels();
    }
    return () => {
      console.log('models.jsx unmounted');
    };
  }, [fetchModels]);

  console.log('models.jsx render - installedModels:', state.models.installed, 'availableModels:', state.models.available);

  return (
    <ModelsPageDynamic
      installedModels={state.models.installed}
      availableModels={state.models.available}
      onSelectModel={selectModel}
      onDownloadModel={downloadModel}
    />
  );
}