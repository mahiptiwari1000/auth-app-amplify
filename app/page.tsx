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
import OpenAI from "openai";

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
  assigneeName:string;
  updatedAt:number;
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
  const [aiSuggestions, setAISuggestions] = useState<string[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
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
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => {
    setIsModalOpen((prev) => !prev);
  };

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

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY, // Ensure this is set in your .env file
  dangerouslyAllowBrowser: true
});


  // Fetch tickets from the backend on load
  useEffect(() => {
    const loadTickets = async () => {
      const sessionDetails = await fetchAuthSession();
      const attributeDetails = await fetchUserAttributes();

      const userGroups = (sessionDetails.tokens?.accessToken.payload['cognito:groups'] || []) as string[];
      setIsITStaff(userGroups.includes('ITStaff') ? 'ITStaff' : 'Users');

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
         // Add a random Assignee Name to each ticket
      const ticketsWithAssignees = data.map((ticket:Ticket) => ({
        ...ticket,
        assigneeName: assigneeNames[Math.floor(Math.random() * assigneeNames.length)], // Randomize once
      }));      

      setTickets(ticketsWithAssignees);
      } catch (error) {
        console.error('Error loading tickets:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTickets();
  }, []);

  useEffect(() => {
    const checkEscalation = () => {
      const now = Date.now();
      const newEscalatedTickets = new Set<string>();

      tickets.forEach((ticket) => {
        const severityDuration = parseSeverity(ticket.severity);
        if (
          ticket.status === "In Progress" &&
          severityDuration &&
          now - ticket.updatedAt > severityDuration
        ) {
          newEscalatedTickets.add(ticket.arNumber);
        }
      });
    };

    checkEscalation();
    const interval = setInterval(checkEscalation, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [tickets]);

    // Function to ask AI for better titles
    const handleAskAI = async (ticket: Ticket) => {
      toggleModal();
      setLoadingAI(true);
      setAISuggestions([]);
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are an AI assistant suggesting better solutions related to the ticket title and description." },
            { role: "user", content: `Suggest better solutions for the following ticket:\n\nTitle: "${ticket.title}"\nDescription: "${ticket.description}"` },
          ],
          max_tokens: 100,
        });
  
        const suggestions = response.choices
        .map((choice) => choice.message?.content?.trim())
        .filter((content): content is string => Boolean(content)); // Ensures only non-null strings are included
          setAISuggestions(suggestions || []);
      } catch (error) {
        console.error("Error fetching AI suggestions:", error);
        setAISuggestions(["Failed to fetch suggestions. Please try again later."]);
      } finally {
        setLoadingAI(false);
      }
    };  

  const parseSeverity = (severity: string): number | null => {
    const match = severity.match(/(\d+)\s*(seconds|minutes|hours|days)/);
    if (!match) return null;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    
    switch (unit) {
      case 'seconds':
        return value * 1000;
      case 'minutes':
        return value * 60 * 1000;
      case 'hours':
        return value * 60 * 60 * 1000;
      case 'days':
        return value * 24 * 60 * 60 * 1000;
      default:
        return null;
    }
  };

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

  const handleSearchDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "product" && { subProduct: "" }) // Reset Sub-Product if Product changes
    }));
  };  

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const queryParams = new URLSearchParams(searchParams).toString();      
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
        body: JSON.stringify({
          ...formData,
          userId,
          arNumber: randomARNumber,
          status: 'Assigned', // Default status
        }),
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

  const generatePDFReport = async () => {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([600, 800]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
    const marginLeft = 50;
    const marginTop = 750;
    const rowHeight = 20;
    const columnWidths = [150, 150, 150, 100]; // Column widths: Title, Status, Priority
    const fontSize = 12;
  
    let currentY = marginTop;
  
    // Report Header with Introductory Text
    const title = 'Ticket Summary Report';
    const subtitle = 'Overview of Tickets and Their Status';
    const generatedDate = new Date().toLocaleString();
    const organizationName = 'IT Support Department';
    const introText = `This report provides a comprehensive overview of the ticket activity managed by the ${organizationName}. It highlights ticket priorities, statuses, and key details for effective tracking and management of ongoing tasks and issues. The report is generated to assist in analyzing the resolution workflow and ensuring timely resolution of all reported tickets.`;
  
    // Title
    page.drawText(title, {
      x: marginLeft,
      y: currentY,
      size: 20,
      font,
      color: rgb(0, 0, 0),
    });
    currentY -= 20;
  
    // Subtitle
    page.drawText(subtitle, {
      x: marginLeft,
      y: currentY,
      size: 14,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
    currentY -= 20;
  
    // Generated Date
    page.drawText(`Generated on: ${generatedDate}`, {
      x: marginLeft,
      y: currentY,
      size: 10,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
    currentY -= 30;
  
    // Introduction Text
    const lineHeight = 14;
  
    const introLines = introText.split(/(?<=\.)\s+/); // Split into sentences for better formatting
    introLines.forEach((line) => {
      if (currentY <= 50) {
        // Add a new page if needed
        page = pdfDoc.addPage([600, 800]);
        currentY = marginTop;
      }
  
      page.drawText(line, {
        x: marginLeft,
        y: currentY,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });
      currentY -= lineHeight;
    });
  
    currentY -= 30; // Add some space before the next section
  
    // Summary Section
    const totalTickets = tickets.length;
    const priorityCounts = tickets.reduce<Record<string, number>>((counts, ticket) => {
      counts[ticket.priority] = (counts[ticket.priority] || 0) + 1;
      return counts;
    }, {});    
  
    page.drawText(`Total Tickets: ${totalTickets}`, {
      x: marginLeft,
      y: currentY,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
    currentY -= rowHeight;
  
    Object.entries(priorityCounts).forEach(([priority, count]) => {
      page.drawText(`Priority ${priority}: ${count}`, {
        x: marginLeft,
        y: currentY,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
      currentY -= rowHeight;
    });
  
    currentY -= 20; // Add some spacing before the table
  
    // Table Header
    const headers = ['Title', 'Status', 'Priority'];
    headers.forEach((header, index) => {
      page.drawText(header, {
        x: marginLeft + columnWidths.slice(0, index).reduce((a, b) => a + b, 0),
        y: currentY,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    });
  
    // Draw Horizontal Line Below Header
    currentY -= 5;
    page.drawLine({
      start: { x: marginLeft, y: currentY },
      end: { x: marginLeft + columnWidths.reduce((a, b) => a + b, 0), y: currentY },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    currentY -= rowHeight;
  
    // Table Rows
    tickets.forEach((ticket) => {
      if (currentY <= 50) {
        // Add a new page if the current page is full
        page = pdfDoc.addPage([600, 800]);
        currentY = marginTop;
      }
  
      const columns = [
        ticket.title || 'N/A',
        ticket.status || 'N/A',
        ticket.priority || 'N/A',
      ];
  
      columns.forEach((text, index) => {
        page.drawText(text, {
          x: marginLeft + columnWidths.slice(0, index).reduce((a, b) => a + b, 0),
          y: currentY,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
      });
  
      // Draw Horizontal Line Below Row
      currentY -= rowHeight;
      page.drawLine({
        start: { x: marginLeft, y: currentY },
        end: { x: marginLeft + columnWidths.reduce((a, b) => a + b, 0), y: currentY },
        thickness: 0.5,
        color: rgb(0.7, 0.7, 0.7),
      });
    });
  
    // Footer Section
    const footerText = 'Generated by Ticket Management System';
    const footerY = 30;
  
    page.drawText(footerText, {
      x: marginLeft,
      y: footerY,
      size: 10,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  
    page.drawText(`Generated on: ${generatedDate}`, {
      x: marginLeft,
      y: footerY - 10,
      size: 10,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  
    // Save PDF and download
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'ticket_summary_report.pdf';
    link.click();
  };

  const assigneeNames = ["Mahip", "Hansika"];

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
        {isITStaff === 'ITStaff' && (
          <div className="mb-4">
            <button
              onClick={generatePDFReport}
              className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-green-300"
            >
              View Ticket Report
            </button>
          </div>
        )}
        <h2 className="text-lg font-bold mb-4 text-white">Your Tickets</h2>
       
        {tickets.map((ticket) => {
  // Check if the ticket needs escalation
  const updatedAtTimestamp = new Date(ticket.updatedAt).getTime();

  const now = Date.now();
  const parseSeverity = (severity: string): number | null => {
    const match = severity.match(/(\d+)\s*(seconds|minutes|hours|days)/);
    if (!match) return null;

    const value = parseInt(match[1], 10);
  
    const unit = match[2];
    
    switch (unit) {
      case 'seconds':
        return value * 1000;
      case 'minutes':
        return value * 60 * 1000;
      case 'hours':
        return value * 60 * 60 * 1000;
      case 'days':
        return value * 24 * 60 * 60 * 1000;
      default:
        return null;
    }
  };

  const severityDuration = parseSeverity(ticket.severity);
  const isEscalated = severityDuration && (now - updatedAtTimestamp > severityDuration);

  return (
    <div
  key={ticket.arNumber}
  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded mb-2 shadow cursor-pointer ${
    isEscalated ? 'bg-red-700 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
  }`}
  onClick={() => handleTicketClick(ticket)}
>
  <div className="w-full sm:w-3/4">
    <p className="font-semibold text-white mb-1">{ticket.title}</p>
    <p className="text-sm text-gray-300 mb-1">{ticket.description}</p>
    <p className="text-sm text-gray-300 mb-1">Assignee: {ticket.assigneeName}</p>
    {isEscalated && (
      <p className="text-sm text-yellow-400 font-semibold">
        This ticket has been escalated!
      </p>
    )}
  </div>
  <div className="w-full sm:w-1/4 flex items-center sm:justify-end mt-2 sm:mt-0">
    <p className="text-sm text-gray-400 mr-4">{ticket.status}</p>
    <button
      onClick={(e) => {
        e.stopPropagation(); // Prevents triggering onClick of parent
        handleAskAI(ticket);
      }}
      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-500"
    >
      Ask AI
    </button>
  </div>
</div>
  );
})}
      </div>

      {/* AI Suggestions Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded shadow-lg w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">AI Suggestions</h3>
              <button
                onClick={toggleModal}
                className="text-gray-300 hover:text-white text-xl font-bold"
              >
                &times;
              </button>
            </div>
            {loadingAI ? (
              <div className="flex justify-center items-center h-40">
                <div className="w-8 h-8 border-4 border-t-4 border-gray-200 rounded-full animate-spin"></div>
              </div>
            ) : (
            <ul className="list-disc list-inside text-gray-300">
              {aiSuggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>)}
          </div>
        </div>
      )}

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
                `/detailed-ticket-status?arNumber=${selectedTicket.arNumber}&status=${selectedTicket.status}&priority=${selectedTicket.priority}&severity=${selectedTicket.severity}&title=${encodeURIComponent(selectedTicket.title)}`
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
      <option value="60seconds">60seconds</option>
      <option value="120seconds">120seconds</option>
      <option value="150seconds">150seconds</option>
      <option value="180seconds">180seconds</option>
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

    {/* Product Dropdown */}
    <div>
      <label className="block text-sm font-semibold text-gray-300">Product</label>
      <select
        name="product"
        value={searchParams.product}
        onChange={handleSearchDropdownChange}
        className="p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
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

    {/* Sub-Product Dropdown */}
    <div>
      <label className="block text-sm font-semibold text-gray-300">Sub-Product</label>
      <select
        name="subProduct"
        value={searchParams.subProduct}
        onChange={handleSearchDropdownChange}
        className="p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
        disabled={!searchParams.product} // Disable if no product selected
      >
        <option value="" disabled>
          Select a Sub-Product
        </option>
        {searchParams.product && productOptions[searchParams.product as ProductType]?.map((subProduct) => (
  <option key={subProduct} value={subProduct}>
    {subProduct}
  </option>
))}
      </select>
    </div>

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
      Select SubProduct
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
      <option value="60seconds">60seconds</option>
      <option value="120seconds">120seconds</option>
      <option value="150seconds">150seconds</option>
      <option value="180seconds">180seconds</option>
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
