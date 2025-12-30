import React, { useState } from "react";
import { API_BASE } from "../lib/api";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle
} from "@headlessui/react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { MenuButton,Menu,MenuItems,MenuItem } from '@headlessui/react';
import { FiMoreHorizontal, FiEdit2 } from 'react-icons/fi';
import { MdDelete } from 'react-icons/md';
export default function ChatListItem({ chat, onEdit, collapsed, onDelete,onClick,isActive}) {
  const [isEditing, setIsEditing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState(chat.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDeleteClick = (e) => {
  e.stopPropagation();
  setModalOpen(true); // show confirm modal
};

  const confirmDelete = async () => {
  setLoading(true);
  setError("");
  try {
    const res = await fetch(`${API_BASE}/chat/delete-session/${chat.id}`, {
      method: "DELETE",
    });

    const data = await res.json();
    if (!res.ok || data.message !== "Session successfully deleted!") {
      throw new Error("Unexpected server response");
    }

    if (onDelete) onDelete(chat.id);
    setModalOpen(false);
  } catch (err) {
    console.error("❌ Delete error:", err);
    setError("Could not delete chat.");
  } finally {
    setLoading(false);
  }
};

  const handleEditClick = (e) => {
    console.log("🛠 Updating chat title for ID:",chat.id);
    e.stopPropagation();
    setIsEditing(true);
  };


  const handleChange = (e) => setName(e.target.value);

  const handleBlur = async () => {
    setIsEditing(false);
    setError("");
    if (name.trim() && name !== chat.name) {
      setLoading(true);
      try {
        console.log("🛠 Updating chat title for ID:", chat.id);
        const res = await fetch(`${API_BASE}/chat/chat/${chat.id}/title`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: name.trim() }),
        });
        if (!res.ok) throw new Error("Failed to update title");
        const data = await res.json();
        onEdit(chat.id, data.new_title || name.trim());
      } catch (err) {
        setError("Could not edit title");
        setName(chat.name); // revert
      } finally {
        setLoading(false);
      }
    } else {
      setName(chat.name);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setName(chat.name);
    }
  };
  const handleClick = () => {
    if (onClick) {
      onClick(chat.id); // ✅ notify parent (Sidebar) of selected chat
    }
  };
  return (
    <div className={`flex items-center px-2 py-2 rounded-md mb-1 transition-colors hover:bg-blue-100 cursor-pointer group ${isActive ? 'bg-indigo-100 text-indigo-800 font-semibold' : 'hover:bg-gray-100 text-gray-800'}`}
    onClick={handleClick}>
      {isEditing ? (
        !collapsed && (
          <input
            className="flex-1 px-2 py-1 rounded bg-white text-gray-800 border border-[#444654] outline-none text-base"
            value={name}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            disabled={loading}
          />
        )
      ) : (
        <>
          {!collapsed && <span className="flex-1 truncate">{chat.name}</span>}
          {!collapsed && (
            <Menu as="div" className="relative inline-block text-left ml-2">
<MenuButton className="invisible group-hover:visible text-gray-400 hover:text-gray-600">
  <FiMoreHorizontal size={18} />
</MenuButton>

  <MenuItems className="absolute right-0 z-20 mt-2 w-28 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
    <div className="py-1">
      <MenuItem>
        {({ active }) => (
          <button
            onClick={handleEditClick}
            className={`${
              active ? 'bg-gray-100' : ''
            } group flex w-full items-center px-3 py-2 text-sm text-gray-700`}
          >
            <FiEdit2 className="mr-2" size={16} />
            Rename
          </button>
        )}
      </MenuItem>
      <MenuItem>
        {({ active }) => (
          <button
            onClick={handleDeleteClick}
            className={`${
              active ? 'bg-gray-100' : ''
            } group flex w-full items-center px-3 py-2 text-sm text-red-600`}
          >
            <MdDelete className="mr-2" size={16} />
            Delete
          </button>
        )}
      </MenuItem>
    </div>
  </MenuItems>
</Menu>

          )}
          <Dialog open={modalOpen} onClose={() => setModalOpen(false)} className="relative z-10">
  <DialogBackdrop className="fixed inset-0 bg-gray-500/75" />
  <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
      <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
        <div className="bg-white px-6 py-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-red-100">
              <ExclamationTriangleIcon className="size-6 text-red-600" aria-hidden="true" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-gray-900">
                Delete session?
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                This will permanently delete this chat. Are you sure?
              </p>
            </div>
          </div>

          {error && <p className="text-sm mb-2 text-red-600">{error}</p>}

          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={confirmDelete}
              disabled={loading}
              className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              {loading ? "Deleting..." : "Yes, Delete"}
            </button>
            <button
              onClick={() => setModalOpen(false)}
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
      )}
      {error && !collapsed && (
        <span className="ml-2 text-xs text-red-500">{error}</span>
      )}
    </div>
  );
}