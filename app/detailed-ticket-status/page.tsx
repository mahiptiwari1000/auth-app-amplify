'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchAuthSession } from 'aws-amplify/auth';
import { fetchUserAttributes } from 'aws-amplify/auth';

interface UserDetails {
  userId: string,
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
}


export default function DetailedTicketStatus() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Retrieve ticket details from query parameters
  const arNumber = searchParams.get('arNumber') || '';
  const initialStatus = searchParams.get('status') || '';
  const priority = searchParams.get('priority') || '';
  const severity = searchParams.get('severity') || '';
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

  // State for the form
  const [status, setStatus] = useState(initialStatus);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [progressLog, setProgressLog] = useState<string[]>([]);
  const [isITStaff, setIsITStaff] = useState(false);

  // Simulate role check
  useEffect(() => {
    // Replace this with an actual API call or logic to determine if the user is ITStaff
    const fetchUserRole = async () => {
      const sessionDetails = await fetchAuthSession();
      const attributeDetails = await fetchUserAttributes();
      const userGroups = (sessionDetails.tokens?.accessToken.payload['cognito:groups'] || []) as string[];
      setIsITStaff(userGroups.includes('ITStaff'));

       // Structure user details
       const details: UserDetails = {
        userId: attributeDetails.sub || '',
        firstName: attributeDetails.given_name || '', // Default to an empty string if undefined
        lastName: attributeDetails.family_name || '',
        email: attributeDetails.email || '',
        phoneNumber: attributeDetails.phone_number || '',
        address: `${attributeDetails['custom:street_address'] || ''}, ${attributeDetails['custom:city'] || ''}, ${attributeDetails['custom:state'] || ''} ${attributeDetails['custom:zipcode'] || ''}`,
      };
      setUserDetails(details);
    };
    fetchUserRole();
  }, []);

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      console.log('Selected file:', event.target.files[0]);
    }
  };

  // Handle status change and add to progress log
  const handleStatusChange = (newStatus: string) => {
    const timestamp = new Date().toLocaleString();
    setProgressLog((prevLog) => [
      ...prevLog,
      `[${timestamp}] Status changed from "${status}" to "${newStatus}".`,
    ]);
    setStatus(newStatus);
  };

  // Save ticket details
  const handleSave = async () => {
    const data = {
      arNumber,
      status,
      priority,
      severity,
      description,
      progressLog,
      resolutionNotes: isITStaff ? resolutionNotes : undefined, // Only send if ITStaff
      userId: userDetails?.userId
    };

    try {
      const response = await fetch('https://it-support-app-backend.vercel.app/api/ticketdetails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        alert('Ticket details saved successfully!');
        console.log('Saved ticket details:', result);
      } else {
        const errorData = await response.json();
        alert(`Failed to save ticket details: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error saving ticket:', error);
      alert('An error occurred while saving ticket details.');
    }
  };
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="bg-gray-800 p-6 rounded shadow-md max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white">Detailed Ticket Status</h2>
          <button
            onClick={() => router.push('/')} // Navigate back to the dashboard
            className="bg-gray-700 text-gray-300 px-4 py-2 rounded hover:bg-gray-600"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Ticket Fields */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-300">AR Number</label>
            <input
              type="text"
              value={arNumber}
              readOnly
              className="w-full p-2 bg-gray-700 text-gray-100 rounded border border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300">Status</label>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full p-2 bg-gray-700 text-gray-100 rounded border border-gray-600"
            >
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300">Severity</label>
            <input
              type="text"
              value={severity}
              readOnly
              className="w-full p-2 bg-gray-700 text-gray-100 rounded border border-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300">Priority</label>
            <input
              type="text"
              value={priority}
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
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
            rows={8}
            value={progressLog.join('\n')}
            readOnly
            className="w-full p-2 bg-gray-700 text-gray-100 rounded border border-gray-600"
          ></textarea>
        </div>

        {/* Resolution Notes */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-300">
            Resolution notes from the agent - Can be uploaded only when the ticket status is changed
            to &quot;Resolved&quot;.
          </label>
          <textarea
            rows={3}
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            disabled={!isITStaff} // Disable for non-ITStaff
            className="w-full p-2 bg-gray-700 text-gray-100 rounded border border-gray-600"
          ></textarea>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
