'use client';
import { useEffect, useState } from 'react';

interface Ticket {
  arNumber: string;
  severity: string;
  priority: string;
  requestor: string;
  assignee: string;
  status: string;
  dateCreated: string;
  product: string;
  subProduct: string;
}

export default function TicketDetails() {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<string>('In Progress');
  const [uploadedDocument, setUploadedDocument] = useState<File | null>(null);

  useEffect(() => {
    // Retrieve ticket details from localStorage
    const storedTicket = localStorage.getItem('selectedTicket');
    if (storedTicket) {
      setTicket(JSON.parse(storedTicket));
    }
  }, []);

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedDocument(e.target.files[0]);
    }
  };

  const handleResolutionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setResolutionStatus(e.target.value);
  };

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <p className="text-red-500 text-lg font-semibold">No ticket selected</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-blue-400 text-center">
          Ticket Details
        </h1>
        <div className="space-y-4">
          <p>
            <span className="font-semibold text-gray-300">AR Number:</span>{' '}
            {ticket.arNumber}
          </p>
          <p>
            <span className="font-semibold text-gray-300">Severity:</span>{' '}
            {ticket.severity}
          </p>
          <p>
            <span className="font-semibold text-gray-300">Priority:</span>{' '}
            {ticket.priority}
          </p>
          <p>
            <span className="font-semibold text-gray-300">Requestor:</span>{' '}
            {ticket.requestor}
          </p>
          <p>
            <span className="font-semibold text-gray-300">Assignee:</span>{' '}
            {ticket.assignee}
          </p>
          <p>
            <span className="font-semibold text-gray-300">Status:</span>{' '}
            {ticket.status}
          </p>
          <p>
            <span className="font-semibold text-gray-300">Date Created:</span>{' '}
            {ticket.dateCreated}
          </p>
          <p>
            <span className="font-semibold text-gray-300">Product:</span>{' '}
            {ticket.product}
          </p>
          <p>
            <span className="font-semibold text-gray-300">Sub-Product:</span>{' '}
            {ticket.subProduct}
          </p>
        </div>

        {/* Progress / Resolution Status */}
        <div className="mt-6">
          <label
            htmlFor="resolution-status"
            className="block text-gray-300 font-semibold mb-2"
          >
            Resolution/Progress Status
          </label>
          <select
            id="resolution-status"
            value={resolutionStatus}
            onChange={handleResolutionChange}
            className="w-full p-3 bg-gray-700 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="In Progress">In Progress</option>
            <option value="Pending">Pending</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        {/* Document Upload */}
        <div className="mt-6">
          <label
            htmlFor="document-upload"
            className="block text-gray-300 font-semibold mb-2"
          >
            Upload Supporting Document
          </label>
          <input
            type="file"
            id="document-upload"
            accept=".pdf,.docx,.png,.jpg"
            onChange={handleDocumentUpload}
            className="w-full p-2 bg-gray-700 text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {uploadedDocument && (
            <p className="text-green-500 mt-2">
              Uploaded: {uploadedDocument.name}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => alert('Details saved successfully!')}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
