'use client';

import { useState } from 'react';

export default function DetailedTicketStatus() {

  // State to hold the selected file
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      console.log('Selected file:', event.target.files[0]);
    }
  };

 
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="bg-gray-800 p-6 rounded shadow-md max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white">Detailed Ticket Status</h2>
         
        </div>

        {/* Ticket Fields */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-300">AR Number</label>
            <input
              type="text"
              value={''}
              readOnly
              className="w-full p-2 bg-gray-700 text-gray-100 rounded border border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300">Status</label>
            <input
              type="text"
              value={''}
              readOnly
              className="w-full p-2 bg-gray-700 text-gray-100 rounded border border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300">Severity</label>
            <input
              type="text"
              value={''}
              readOnly
              className="w-full p-2 bg-gray-700 text-gray-100 rounded border border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300">Priority</label>
            <input
              type="text"
              value={''}
              readOnly
              className="w-full p-2 bg-gray-700 text-gray-100 rounded border border-gray-600"
            />
          </div>
        </div>

        {/* Description Field */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-300">
            Write your detailed description here, so that our agent can help solve your ticket faster!
          </label>
          <textarea
            rows={4}
            className="w-full p-2 bg-gray-700 text-gray-100 rounded border border-gray-600"
          ></textarea>
        </div>

        {/* Attach Image */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-300">Attach an image</label>
          <div className="flex items-center space-x-4">
            <button
              className="bg-gray-700 text-gray-300 px-4 py-2 rounded hover:bg-gray-600"
              onClick={() => document.getElementById('fileInput')?.click()} // Trigger file input click
            >
              <span className="text-lg">↑</span> Upload Image
            </button>
            <input
              id="fileInput"
              type="file"
              accept="image/*"
              className="hidden" // Hide the file input
              onChange={handleFileChange}
            />
          </div>
          {/* Display selected file name */}
          {selectedFile && (
            <p className="text-sm text-gray-400 mt-2">
              Selected file: {selectedFile.name}
            </p>
          )}
        </div>

        {/* Detailed Progress Field */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-300">Detailed Progress Field</label>
          <textarea
            rows={4}
            className="w-full p-2 bg-gray-700 text-gray-100 rounded border border-gray-600"
          ></textarea>
        </div>

        {/* Resolution Notes */}
        <div>
          <label className="block text-sm font-semibold text-gray-300">
            Resolution notes from the agent - Can be uploaded only when the ticket status is changed
            to &quot;Resolved&quot;.
          </label>
          <textarea
            rows={3}
            className="w-full p-2 bg-gray-700 text-gray-100 rounded border border-gray-600"
          ></textarea>
        </div>
      </div>
    </div>
  );
}
