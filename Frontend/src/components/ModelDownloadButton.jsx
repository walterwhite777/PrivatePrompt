'use client'

import React, { useState, useEffect } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { API } from '../lib/api';

const ModelDownloadButton = ({ model, onDownload }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState(null);
  const [modalType, setModalType] = useState(null); // 'confirm' or 'download'

  const handleDownload = (modelName) => {
    setIsDownloading(true);
    setModalType('download');
    setError(null);
    setProgress('Download in progress...');

    const source = new EventSource(`${API.DOWNLOAD}/${modelName}`);

    source.onmessage = (event) => {
      const data = event.data;
      setProgress(data);
      console.log('Stream update:', data);
      if (data.includes('success') || data.includes('completed')) {
        setIsDownloading(false);
        setProgress('Successfully downloaded');
        if (onDownload && typeof onDownload === 'function') {
          onDownload(modelName);
        }
        source.close();
      }
    };

    source.onerror = () => {
      setError('Failed to connect to the download stream. Please try again.');
      setIsDownloading(false);
      setModalType(null);
      source.close();
    };

    source.onopen = () => {
      console.log('Connected to stream');
    };

    return () => {
      source.close();
      console.log('Stream closed');
    };
  };

  const openConfirmModal = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setModalType('confirm');
  };

  const closeModal = () => {
    setModalType(null);
  };

  const confirmDownload = () => {
    closeModal();
    setTimeout(() => handleDownload(model.model_name), 0);
  };

  return (
    <>
      <button
        onClick={openConfirmModal}
        className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 disabled:opacity-50"
        title="Download"
        disabled={isDownloading}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 16v2a2 2 0 002 2h14a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4"
          />
        </svg>
      </button>

      {/* Confirm Modal */}
      <Dialog open={modalType === 'confirm'} onClose={closeModal} className="relative z-10">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-500/75 transition-opacity"
        />
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:size-10">
                    <ExclamationTriangleIcon className="size-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <DialogTitle as="h3" className="text-base font-semibold text-gray-900">
                      Download {model.model_name}?
                    </DialogTitle>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to download this model?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={confirmDownload}
                  className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 sm:ml-3 sm:w-auto"
                >
                  Yes, Download
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>

      {/* Download Modal */}
      <Dialog open={modalType === 'download'} onClose={closeModal} className="relative z-10">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-500/75 transition-opacity"
        />
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
            >
              <div className="bg-white px-6 py-6 sm:p-6">
                {isDownloading ? (
                  <>
                    <div className="text-lg font-semibold mb-4 text-gray-900">
                      Downloading {model.model_name}
                    </div>
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-indigo-600 border-solid mb-4 mx-auto"></div>
                    <div className="text-sm text-gray-600 text-center">{progress}</div>
                  </>
                ) : (
                  <>
                    <div className="text-lg font-semibold mb-4 text-green-600 text-center">
                      Successfully downloaded
                    </div>
                    <div className="flex justify-center">
                      <button
                        onClick={closeModal}
                        className="mt-3 inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-700"
                      >
                        Close
                      </button>
                    </div>
                  </>
                )}
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default ModelDownloadButton;
