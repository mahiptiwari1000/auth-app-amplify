'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';

interface UserDetails {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
}

export default function DetailedTicketStatus() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract query parameters
  const arNumber = searchParams.get('arNumber') || '';
  const initialStatus = searchParams.get('status') || '';
  const priority = searchParams.get('priority') || '';
  const severity = searchParams.get('severity') || '';

  // State
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [status, setStatus] = useState(initialStatus);
  const [description, setDescription] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [progressLog, setProgressLog] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isITStaff, setIsITStaff] = useState(false);
  const [ticketDetails, setTicketDetails] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch ticket details
  const fetchTicketDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://it-support-app-backend.vercel.app/api/ticketdetails?arNumber=${arNumber}&userId=${userDetails?.userId}`
      );
      if (!response.ok) throw new Error('Failed to fetch ticket details');
      const data = await response.json();
      setTicketDetails(data[0]);
      setDescription(data[0]?.description || '');
      setProgressLog(data[0]?.progressLog || []);
      setResolutionNotes(data[0]?.resolutionNotes || '');
    } catch (error) {
      console.error('Error fetching ticket details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user details and role
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const sessionDetails = await fetchAuthSession();
        const attributeDetails = await fetchUserAttributes();
        const userGroups = (sessionDetails.tokens?.accessToken.payload['cognito:groups'] || []) as string[];

        setIsITStaff(userGroups.includes('ITStaff'));
        setUserDetails({
          userId: attributeDetails.sub || '',
          firstName: attributeDetails.given_name || '',
          lastName: attributeDetails.family_name || '',
          email: attributeDetails.email || '',
          phoneNumber: attributeDetails.phone_number || '',
          address: `${attributeDetails['custom:street_address'] || ''}, ${attributeDetails['custom:city'] || ''}, ${attributeDetails['custom:state'] || ''} ${attributeDetails['custom:zipcode'] || ''}`,
        });
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };

    fetchUserRole();
  }, []);

  // Fetch ticket details after user details are fetched
  useEffect(() => {
    if (arNumber && userDetails?.userId) {
      fetchTicketDetails();
    }
  }, [arNumber, userDetails?.userId]);

  // Handle status change and log
  const handleStatusChange = (newStatus: string) => {
    const timestamp = new Date().toLocaleString();
    setProgressLog((prevLog) => [...prevLog, `[${timestamp}] Status changed to "${newStatus}".`]);
    setStatus(newStatus);
  };

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  // Save ticket details
  const handleSave = async () => {
    const ticketData = {
      arNumber,
      status,
      priority,
      severity,
      description,
      progressLog,
      resolutionNotes: isITStaff ? resolutionNotes : undefined,
      userId: userDetails?.userId,
    };

    try {
      const response = await fetch('https://it-support-app-backend.vercel.app/api/ticketdetails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData),
      });

      if (response.ok) {
        alert('Ticket details saved successfully!');
        fetchTicketDetails(); // Re-fetch ticket details after saving
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
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-lg font-bold text-white">Detailed Ticket Status</h1>
          <button
            onClick={() => router.push('/')}
            className="bg-gray-700 text-gray-300 px-4 py-2 rounded hover:bg-gray-600"
          >
            Back to Dashboard
          </button>
        </header>

        {loading ? (
          <p className="text-center text-gray-400">Loading...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <ReadOnlyField label="AR Number" value={arNumber} />
              <DropdownField label="Status" value={status} onChange={handleStatusChange} options={['Assigned', 'In Progress', 'Pending', 'Resolved', 'Closed']} />
              <ReadOnlyField label="Priority" value={priority} />
              <ReadOnlyField label="Severity" value={severity} />
            </div>

            <TextAreaField label="Description" value={description} onChange={(value) => setDescription(value)} />
            <FileUploadField label="Attach an Image" file={selectedFile} onFileChange={handleFileChange} />
            <TextAreaField label="Progress Log" value={progressLog.join('\n')} readOnly />

            {isITStaff && (
              <TextAreaField label="Resolution Notes" value={resolutionNotes} onChange={(value) => setResolutionNotes(value)} />
            )}

            <div className="flex justify-end">
              <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500">
                Save
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


interface FieldProps {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}

function ReadOnlyField({ label, value }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-300">{label}</label>
      <input type="text" value={value} readOnly className="w-full p-2 bg-gray-700 text-gray-100 rounded border border-gray-600" />
    </div>
  );
}

function DropdownField({ label, value, onChange, options }: FieldProps & { options: string[] }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-300">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full p-2 bg-gray-700 text-gray-100 rounded border border-gray-600"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextAreaField({ label, value, onChange, readOnly }: FieldProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-300">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        readOnly={readOnly}
        className="w-full p-2 bg-gray-700 text-gray-100 rounded border border-gray-600"
        rows={4}
      />
    </div>
  );
}

function FileUploadField({ label, file, onFileChange }: { label: string; file: File | null; onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-300">{label}</label>
      <div className="flex items-center space-x-4">
        <button
          className="bg-gray-700 text-gray-300 px-4 py-2 rounded hover:bg-gray-600"
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          Upload
        </button>
        <input
          id="fileInput"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
      </div>
      {file && <p className="text-sm text-gray-400 mt-2">Selected file: {file.name}</p>}
    </div>
  );
}
