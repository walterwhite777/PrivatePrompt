'use client';

import React, { useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { ExclamationTriangleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { API } from '../lib/api';
import { useAppContext } from '../lib/AppContext'; // Import context

const ModelDeleteButton = ({ model, onDelete }) => {
  const { deleteModel } = useAppContext(); // ✅ use deleteModel from context
  const [isDeleting, setIsDeleting] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openConfirmModal = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setModalOpen(true);
  };

  const closeModal = () => {
    if (!isDeleting) {
      setModalOpen(false);
      setStatus('');
      setError(null);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setStatus('Deleting model...');
    setError(null);

    try {
      const response = await fetch(`${API.DELETE}?llm_model=${encodeURIComponent(model.model_name)}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setStatus('Model deleted successfully.');
        deleteModel(model.model_name); // ✅ update installed models
        if (onDelete) onDelete(); // <-- call onDelete callback
        setTimeout(() => {
          closeModal(); // ✅ close after short delay
        }, 1000);
      } else {
        throw new Error(`Failed with status ${response.status}`);
      }
    } catch (err) {
      setError(`Error deleting model: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={openConfirmModal}
        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50"
        title="Delete Model"
        disabled={isDeleting}
      >
        <TrashIcon className="w-4 h-4" />
      </button>

      <Dialog open={modalOpen} onClose={closeModal} className="relative z-10">
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
              <div className="bg-white px-6 py-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-red-100">
                    <ExclamationTriangleIcon className="size-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div>
                    <DialogTitle as="h3" className="text-base font-semibold text-gray-900">
                      Delete {model.model_name}?
                    </DialogTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      Are you sure you want to delete this model? This action cannot be undone.
                    </p>
                  </div>
                </div>

                {status && (
                  <p className="text-sm mb-4 text-gray-600">{status}</p>
                )}
                {error && (
                  <p className="text-sm mb-4 text-red-600">{error}</p>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                  >
                    {isDeleting ? (
                      <>
                        <svg
                          className="animate-spin mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8z"
                          ></path>
                        </svg>
                        Deleting...
                      </>
                    ) : (
                      'Yes, Delete'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default ModelDeleteButton;
