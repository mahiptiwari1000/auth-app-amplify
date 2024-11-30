'use client';

import { useState, useEffect } from "react";
import { signOut } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getCurrentUser } from 'aws-amplify/auth';
import { fetchTickets } from "@/utils/ticketService";

// Ticket interface for backend data
interface Ticket {
  arNumber: string;
  title: string;
  description: string;
  severity: string;
  priority: string;
  product: string;
  subProduct: string;
  status: string;
  assignee: string;
  assigneeEmail: string;
}

const userDetails = {
  fullName: "John Doe",
  email: "john.doe@example.com",
};

export default function Dashboard() {
  const router:any = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]); // Tickets from the backend
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Ticket>({
    arNumber: '',
    title: '',
    description: '',
    severity: '',
    priority: '',
    product: '',
    subProduct: '',
    status: '',
    assignee: '',
    assigneeEmail: ''
  });
  const [searchArNumber, setSearchArNumber] = useState('');

  // Fetch tickets from the backend on load
  useEffect(() => {
    const loadTickets = async () => {
      const {userId} = await getCurrentUser();
      console.log(userId,"user id");
      
      if (!userId) return; // Ensure userId is available
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5001/api/tickets?userId=${userId}`);
        if (!response.ok) throw new Error('Failed to fetch tickets');
        const data = await response.json();
        setTickets(data);
      } catch (error) {
        console.error('Error loading tickets:', error);
      } finally {
        setLoading(false);
      }
    };
  
    loadTickets();
  }, []);  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
    

  // Handle ticket selection
  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  // Handle sign out
  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      router.push('/signup');
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchInputChange = (e: any) => {
    setSearchArNumber(e.target.value);
  };  

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5001/api/tickets?arNumber=${encodeURIComponent(searchArNumber)}`);
      if (!response.ok) throw new Error('Failed to fetch tickets');
      const data = await response.json();
      setTickets(data);
    } catch (err:any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateTicket = async (e:React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const {userId} = await getCurrentUser();
    if (!userId) {
      console.error('User ID is missing');
      return;
    }
    try {
      const response = await fetch('http://localhost:5001/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, userId }),
      });
      if (!response.ok) {
        throw new Error('Failed to create ticket');
      }
      const newTicket = await response.json();
      setTickets((prevTickets) => [...prevTickets, newTicket]);
      // Reset form fields
      setFormData({
        arNumber: '',
        title: '',
        description: '',
        severity: '',
        priority: '',
        product: '',
        subProduct: '',
        status: '',
        assignee: '',
        assigneeEmail: '',
      });
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6 space-y-6">
      {/* Top Bar with Sign Out Button */}
      <header className="flex items-center justify-between px-6 py-4 bg-gray-800 shadow-md">
        <div className="flex items-center space-x-4">
          <Image src="/logo.png" alt="Invictacore Logo" width={50} height={50} className="rounded-full" />
          <h1 className="text-2xl font-bold text-white">Invictacore</h1>
        </div>
        <button
          onClick={handleSignOut}
          className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-red-300"
        >
          Sign Out
        </button>
      </header>

      {/* Full-Screen Loader */}
      {loading && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="w-16 h-16 border-4 border-t-4 border-gray-200 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error Message */}
      {error && <div className="bg-red-500 text-white p-4 rounded shadow">{error}</div>}

      {/* Ticket List Section */}
      <div className="bg-gray-800 p-6 rounded shadow-md max-w-4xl mx-auto">
        <h2 className="text-lg font-bold mb-4 text-white">Your Tickets</h2>
        {tickets.map((ticket) => (
          <div
            key={ticket.arNumber}
            className="flex items-center justify-between p-4 bg-gray-700 rounded mb-2 shadow cursor-pointer hover:bg-gray-600"
            onClick={() => handleTicketClick(ticket)}
          >
            <div>
              <p className="font-semibold text-white">{ticket.title}</p>
              <p className="text-sm text-gray-300">{ticket.description}</p>
            </div>
            <p className="text-sm text-gray-400">{ticket.status}</p>
          </div>
        ))}
      </div>

      {/* Ticket Info Section */}
      {selectedTicket && (
        <div className="bg-gray-800 p-6 rounded shadow-md max-w-4xl mx-auto">
          <h2 className="text-lg font-bold mb-4 text-white">Your Ticket Info</h2>
          <div className="space-y-2">
            <p>
              <span className="font-semibold text-gray-300">AR Number:</span> {selectedTicket.arNumber}
            </p>
            <p>
              <span className="font-semibold text-gray-300">Ticket Title:</span> {selectedTicket.title}
            </p>
            <p>
              <span className="font-semibold text-gray-300">Product:</span> {selectedTicket.product}
            </p>
            <p>
              <span className="font-semibold text-gray-300">Severity:</span> {selectedTicket.severity}
            </p>
            <p>
              <span className="font-semibold text-gray-300">Priority:</span> {selectedTicket.priority}
            </p>
            <p>
              <span className="font-semibold text-gray-300">Status:</span> {selectedTicket.status}
            </p>
          </div>
          <div className="mt-4">
            <button
              onClick={() => router.push(`/detailed-ticket-status?arNumber=${selectedTicket.arNumber}`)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
            >
              View Detailed Ticket Status
            </button>
          </div>
        </div>
      )}

      {/* Search and Create Ticket Section */}
      <div className="bg-gray-800 p-6 rounded shadow-md max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Search Section */}
        <div>
  <h2 className="text-lg font-bold mb-4 text-white">Search Your Ticket by AR Number:</h2>
  <form className="space-y-4" onSubmit={handleSearch}>
    <input
      type="text"
      placeholder="AR Number"
      value={searchArNumber}
      onChange={handleSearchInputChange}
      className="w-full p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
    />
    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500">
      Search
    </button>
  </form>
</div>


        {/* Create New Ticket Section */}
        <div>
          <h2 className="text-lg font-bold mb-4 text-white">Create a New Ticket</h2>
          <form className="space-y-4" onSubmit={handleCreateTicket}>
  <input
    type="text"
    name="arNumber"
    placeholder="AR Number"
    value={formData.arNumber}
    onChange={handleInputChange}
    className="w-full p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
  />
  <input
    type="text"
    name="title"
    placeholder="Ticket Title"
    value={formData.title}
    onChange={handleInputChange}
    className="w-full p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
  />
  <textarea
    name="description"
    placeholder="Brief Summary"
    value={formData.description}
    onChange={handleInputChange}
    className="w-full p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
  ></textarea>
  <input
    type="text"
    name="severity"
    placeholder="Severity"
    value={formData.severity}
    onChange={handleInputChange}
    className="w-full p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
  />
  <input
    type="text"
    name="priority"
    placeholder="Priority"
    value={formData.priority}
    onChange={handleInputChange}
    className="w-full p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
  />
  <input
    type="text"
    name="product"
    placeholder="Product"
    value={formData.product}
    onChange={handleInputChange}
    className="w-full p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
  />
  <input
    type="text"
    name="subProduct"
    placeholder="Sub-Product"
    value={formData.subProduct}
    onChange={handleInputChange}
    className="w-full p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
  />
  <input
    type="text"
    name="status"
    placeholder="Status"
    value={formData.status}
    onChange={handleInputChange}
    className="w-full p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
  />
  <input
    type="text"
    name="assignee"
    placeholder="Assignee"
    value={formData.assignee}
    onChange={handleInputChange}
    className="w-full p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
  />
  <input
    type="email"
    name="assigneeEmail"
    placeholder="Assignee Email"
    value={formData.assigneeEmail}
    onChange={handleInputChange}
    className="w-full p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
  />
  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500">
    Submit
  </button>
</form>
        </div>
      </div>
    </div>
  );
}
