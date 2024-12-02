'use client';

import { useState, useEffect } from "react";
import { signOut } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getCurrentUser } from 'aws-amplify/auth';
import { fetchAuthSession } from 'aws-amplify/auth';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { v4 as uuidv4 } from 'uuid'; // For generating a unique AR number
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import Chart from "chart.js/auto";

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

// User Info interface
interface UserDetails {
  userId: string,
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
}


export default function Dashboard() {
  const router = useRouter();
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]); // Tickets from the backend
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState({
    arNumber: '',
    severity: '',
    priority: '',
    requestorUsername: '',
    assigneeUsername: '',
    status: '',
    startDate: '',
    endDate: '',
    product: '',
    subProduct: ''
  });

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    severity: string;
    priority: string;
    product: ProductType | '';
    subProduct: string;
    status: string;
    assignee: string;
    assigneeEmail: string;
  }>({
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
  
  
  
  const [isITStaff, setIsITStaff] = useState<string | null>(null);

  type ProductType = 'About' | 'News' | 'Organization' | 'Activity' | 'Award' | 'Membership';

const productOptions: Record<ProductType, string[]> = {
  About: [
    "President’s Message",
    "Code of Conduct",
    "Policies",
    "Bylaws",
    "Sponsors",
    "Handbook",
    "Contact"
  ],
  News: [
    "Announcement",
    "KSEA Letters",
    "KSEA e-Letters",
    "Job Opportunities",
    "Media"
  ],
  Organization: [
    "Leadership",
    "Committee",
    "Technical Group",
    "Former Presidents",
    "Local Chapters",
    "KSEA Councilors",
    "YG Group",
    "Affiliated Professional Societies"
  ],
  Activity: [
    "SEED",
    "UKC",
    "NMSC",
    "Katalyst",
    "IMPACTs",
    "SET-UP"
  ],
  Award: [
    "Scholarship",
    "Honors and Awards",
    "Young Investigator Grants"
  ],
  Membership: [
    "About Membership",
    "Lifetime Members",
    "Join Ksea"
  ]
};

  // Fetch tickets from the backend on load
  useEffect(() => {
    const loadTickets = async () => {
      const sessionDetails = await fetchAuthSession();
      const attributeDetails = await fetchUserAttributes();

      const userGroups = (sessionDetails.tokens?.accessToken.payload['cognito:groups'] || []) as string[];
      setIsITStaff(userGroups.includes('ITStaff') ? 'ITStaff' : 'User');

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

      const { userId } = await getCurrentUser();

      if (!userId) return; // Ensure userId is available
      try {
        setLoading(true);
        const response = await fetch(`https://it-support-app-backend.vercel.app/api/tickets?userId=${userId}&role=${userGroups[0]}`);
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

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({
      ...prev,
      userId:userDetails?.userId,
      [name]: value,
    }));
  };

  const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
  
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "product" && { subProduct: "" }) // Reset subProduct if product changes
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

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(searchParams).toString();
      console.log();
      
      const response = await fetch(`https://it-support-app-backend.vercel.app/api/search?${queryParams}&role=${isITStaff}`);

      if (!response.ok) throw new Error('Failed to fetch tickets');
      const data = await response.json();
      setTickets(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const randomARNumber = `AR-${Date.now()}-${uuidv4()}`; // Generate unique AR number
    const { userId } = await getCurrentUser();
    if (!userId) {
      console.error('User ID is missing');
      return;
    }
    try {
      const response = await fetch('https://it-support-app-backend.vercel.app/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...formData, userId, arNumber: randomARNumber }),
      });
      if (!response.ok) {
        throw new Error('Failed to create ticket');
      }
      const newTicket = await response.json();
      setTickets((prevTickets) => [...prevTickets, newTicket]);
      // Reset form fields
      setFormData({    
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
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
  };

  const generatePDFReport = async (tickets: Ticket[]) => {
    // Step 1: Calculate ticket counts by status
    const statusCounts = tickets.reduce((acc, ticket) => {
      acc[ticket.status] = (acc[ticket.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  
    // Step 2: Create a pie chart using Chart.js
    const canvas = document.createElement("canvas");
    new Chart(canvas, {
      type: "pie",
      data: {
        labels: Object.keys(statusCounts),
        datasets: [
          {
            data: Object.values(statusCounts),
            backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
          },
        ],
      },
    });
  
    // Wait for the chart to render
    await new Promise((resolve) => setTimeout(resolve, 500));
  
    // Step 3: Convert the chart to a PNG image
    const chartImage = canvas.toDataURL("image/png");
  
    // Step 4: Generate the PDF using pdf-lib
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
    // Title
    const title = "Ticket Report";
    page.drawText(title, {
      x: 50,
      y: 750,
      size: 20,
      font,
      color: rgb(0, 0, 0),
    });
  
    // Total Tickets Summary
    let yPosition = 700;
    page.drawText(`Total Tickets: ${tickets.length}`, {
      x: 50,
      y: yPosition,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });
    yPosition -= 20;
  
    Object.entries(statusCounts).forEach(([status, count]) => {
      page.drawText(`${status}: ${count}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
    });
  
    // Embed the chart image into the PDF
    const chartImageBytes = await fetch(chartImage).then((res) => res.arrayBuffer());
    const chartImageEmbed = await pdfDoc.embedPng(chartImageBytes);
    const chartImageDims = chartImageEmbed.scale(0.5);
  
    // Add chart to the PDF
    page.drawImage(chartImageEmbed, {
      x: 50,
      y: 400,
      width: chartImageDims.width,
      height: chartImageDims.height,
    });
  
    // Save and download the PDF
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "ticket_report_with_chart.pdf";
    link.click();
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

      {/* User Info Section */}
      <div className="bg-gray-800 p-6 rounded shadow-md mb-6">
        <h2 className="text-lg font-bold mb-4 text-white">User Information</h2>
        {userDetails ? (
          <div className="space-y-2">
            <p>
              <span className="font-semibold text-gray-300">First Name:</span> {userDetails.firstName}
            </p>
            <p>
              <span className="font-semibold text-gray-300">Last Name:</span> {userDetails.lastName}
            </p>
            <p>
              <span className="font-semibold text-gray-300">Email:</span> {userDetails.email}
            </p>
            <p>
              <span className="font-semibold text-gray-300">Phone Number:</span> {userDetails.phoneNumber}
            </p>
            <p>
              <span className="font-semibold text-gray-300">Address:</span> {userDetails.address}
            </p>
          </div>
        ) : (
          <p className="text-gray-400">Loading user information...</p>
        )}
      </div>


      {/* Ticket List Section */}
      <div className="bg-gray-800 p-6 rounded shadow-md max-w-4xl mx-auto">
        {isITStaff && (
          <div className="mb-4">
            <button
              onClick={() => generatePDFReport(tickets)}
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              View Ticket Report
            </button>
          </div>
        )}
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
              onClick={() => router.push(
                `/detailed-ticket-status?arNumber=${selectedTicket.arNumber}&status=${selectedTicket.status}&priority=${selectedTicket.priority}&severity=${selectedTicket.severity}`
              )}
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
        <div className="bg-gray-800 p-6 rounded shadow-md max-w-4xl mx-auto">
        <h2 className="text-lg font-bold text-white mb-4">Search Tickets</h2>
        <form className="grid grid-cols-2 gap-4" onSubmit={handleSearch}>
          <input
            type="text"
            name="arNumber"
            placeholder="AR Number"
            value={searchParams.arNumber}
            onChange={handleSearchInputChange}
            className="p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
          />
          <select
            name="severity"
            value={searchParams.severity}
            onChange={handleSearchInputChange}
            className="p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
          >
            <option value="">Select Severity</option>
            <option value="1 day">1 day</option>
            <option value="5 days">5 days</option>
            <option value="15 days">15 days</option>
            <option value="45 days">45 days</option>
          </select>
          <select
            name="priority"
            value={searchParams.priority}
            onChange={handleSearchInputChange}
            className="p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
          >
            <option value="">Select Priority</option>
            <option value="Very High">Very High</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <input
            type="text"
            name="requestorUsername"
            placeholder="Requestor Username"
            value={searchParams.requestorUsername}
            onChange={handleSearchInputChange}
            className="p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
          />
          <input
            type="text"
            name="assigneeUsername"
            placeholder="Assignee Username"
            value={searchParams.assigneeUsername}
            onChange={handleSearchInputChange}
            className="p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
          />
          <select
            name="status"
            value={searchParams.status}
            onChange={handleSearchInputChange}
            className="p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
          >
            <option value="">Select Status</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Pending">Pending</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
          <input
            type="date"
            name="startDate"
            value={searchParams.startDate}
            onChange={handleSearchInputChange}
            className="p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
          />
          <input
            type="date"
            name="endDate"
            value={searchParams.endDate}
            onChange={handleSearchInputChange}
            className="p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
          />
          <input
            type="text"
            name="product"
            placeholder="Product"
            value={searchParams.product}
            onChange={handleSearchInputChange}
            className="p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
          />
          <input
            type="text"
            name="subProduct"
            placeholder="Sub-Product"
            value={searchParams.subProduct}
            onChange={handleSearchInputChange}
            className="p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500 col-span-2">
            Search
          </button>
        </form>
      </div>

        {/* Create New Ticket Section */}
       
  <div className="bg-gray-800 p-6 rounded shadow-md max-w-4xl mx-auto">
  <h2 className="text-lg font-bold text-white mb-4">Create a New Ticket</h2>
  <form className="space-y-4" onSubmit={handleCreateTicket}>

    {/* Ticket Title */}
    <input
      type="text"
      name="title"
      placeholder="Ticket Title"
      value={formData.title}
      onChange={handleFormInputChange}
      className="w-full p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
    />

<div>
  <label className="block text-sm font-semibold text-gray-300">Product</label>
  <select
    name="product"
    value={formData.product}
    onChange={handleDropdownChange}
    className="w-full p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
  >
    <option value="" disabled>
      Select a Product
    </option>
    {Object.keys(productOptions).map((product) => (
      <option key={product} value={product}>
        {product}
      </option>
    ))}
  </select>
</div>

<div>
  <label className="block text-sm font-semibold text-gray-300">SubProduct</label>
  <select
    name="subProduct"
    value={formData.subProduct}
    onChange={handleDropdownChange}
    className="w-full p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
    disabled={!formData.product} // Disable if no product selected
  >
    <option value="" disabled>
      Select a SubProduct
    </option>
    {formData.product &&
      productOptions[formData.product]?.map((subProduct) => (
        <option key={subProduct} value={subProduct}>
          {subProduct}
        </option>
      ))}
  </select>
</div>


    {/* Brief Summary */}
    <textarea
      name="description"
      placeholder="Brief Summary"
      value={formData.description}
      onChange={handleFormInputChange}
      className="w-full p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
    ></textarea>

    {/* Severity */}
    <select
      name="severity"
      value={formData.severity}
      onChange={handleFormInputChange}
      className="w-full p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
    >
      <option value="">Select Severity</option>
      <option value="1 day">1 day</option>
      <option value="5 days">5 days</option>
      <option value="15 days">15 days</option>
      <option value="45 days">45 days</option>
    </select>

    {/* Priority */}
    <select
      name="priority"
      value={formData.priority}
      onChange={handleFormInputChange}
      className="w-full p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
    >
      <option value="">Select Priority</option>
      <option value="Very High">Very High</option>
      <option value="High">High</option>
      <option value="Medium">Medium</option>
      <option value="Low">Low</option>
    </select>

    {/* Submit Button */}
    <button
      type="submit"
      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
    >
      Submit
    </button>
  </form>
</div>        
      </div>
    </div>
  );
}
