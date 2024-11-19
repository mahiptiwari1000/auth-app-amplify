'use client';
// pages/index.js
import { signOut } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from "react";
import Image from 'next/image';

interface FormData {
    arNumber: string;
    severity: string;
    priority: string;
    requestorUsername: string;
    assigneeUsername: string;
    status: string;
    dateFrom: string;
    dateTo: string;
    product: string;
    subProduct: string;
}

interface UserDetails {
  firstName: string;
  lastName: string;
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  email: string;
  phoneNumber: string;
}

interface Ticket {
  arNumber: string;
  severity: string;
  priority: string;
  requestor: string;
  assignee: string;
  status: string;
  dateCreated: string; // ISO date string
  product: string;
  subProduct: string;
}


const initialFormData: FormData = {
  arNumber: "",
  severity: "",
  priority: "",
  requestorUsername: "",
  assigneeUsername: "",
  status: "",
  dateFrom: "",
  dateTo: "",
  product: "",
  subProduct: "",
};

const initialNewTicket: Ticket = {
  arNumber: "",
  severity: "",
  priority: "",
  requestor: "",
  assignee: "",
  status: "Pending",
  dateCreated: new Date().toISOString(),
  product: "",
  subProduct: "",
};


type Tab = "All" | "Open" | "Closed";
const tabs: Tab[] = ["All", "Open", "Closed"];


export default function Home() {
    const [formData, setFormData] = useState<FormData>({
        arNumber: "",
        severity: "",
        priority: "",
        requestorUsername: "",
        assigneeUsername: "",
        status: "",
        dateFrom: "",
        dateTo: "",
        product: "",
        subProduct: "",
    });

    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);

    
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
    const [activeTab, setActiveTab] = useState<Tab>("All");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTicket, setNewTicket] = useState<Ticket>(initialNewTicket);

    const allTickets: Ticket[] = [
        {
            arNumber: "12345",
            severity: "High",
            priority: "P1",
            requestor: "jdoe",
            assignee: "asmith",
            status: "In Progress",
            dateCreated: "2024-01-15",
            product: "Laptop",
            subProduct: "Dell Inspiron",
        },
        {
            arNumber: "67890",
            severity: "Low",
            priority: "P3",
            requestor: "mjane",
            assignee: "rsmith",
            status: "Resolved",
            dateCreated: "2024-02-01",
            product: "Phone",
            subProduct: "iPhone 12",
        },
        {
            arNumber: "11223",
            severity: "Medium",
            priority: "P2",
            requestor: "alice",
            assignee: "bob",
            status: "Closed",
            dateCreated: "2024-03-05",
            product: "Monitor",
            subProduct: "Samsung Curved",
        },
    ];
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    const fetchedUserDetails:UserDetails = {
      firstName: "John",
      lastName: "Doe",
      streetAddress: "123 Main Street",
      city: "Chicago",
      state: "IL",
      zipCode: "60601",
      email: "john.doe@example.com",
      phoneNumber: "123-456-7890",
    };

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

  useEffect(() => {
    // Mock data for initial tickets
    setTickets([
      {
        arNumber: "12345",
        severity: "High",
        priority: "P1",
        requestor: "jdoe",
        assignee: "asmith",
        status: "In Progress",
        dateCreated: "2024-01-15",
        product: "Laptop",
        subProduct: "Dell Inspiron",
      },
    ]);
  }, []);

    useEffect(() => {
        setTickets(allTickets);
        setFilteredTickets(allTickets);
      setUserDetails(fetchedUserDetails);
    },[]);

    const handleModalOpen = () => setIsModalOpen(true);
    const handleModalClose = () => {
      setIsModalOpen(false);
      setNewTicket(initialNewTicket); // Reset form data
    };
  

    const handleInputChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setTickets((prev) => [...prev, { ...newTicket, arNumber: `${Date.now()}` }]);
      handleModalClose();
    };  

    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const results = tickets.filter((ticket) => {
          return (
                (!formData.arNumber || ticket.arNumber.includes(formData.arNumber)) &&
                (!formData.severity || ticket.severity === formData.severity) &&
                (!formData.priority || ticket.priority === formData.priority) &&
                (!formData.requestorUsername || ticket.requestor.includes(formData.requestorUsername)) &&
                (!formData.assigneeUsername || ticket.assignee.includes(formData.assigneeUsername)) &&
                (!formData.status || ticket.status === formData.status) &&
                (!formData.dateFrom || new Date(ticket.dateCreated) >= new Date(formData.dateFrom)) &&
                (!formData.dateTo || new Date(ticket.dateCreated) <= new Date(formData.dateTo)) &&
                (!formData.product || ticket.product === formData.product) &&
                (!formData.subProduct || ticket.subProduct === formData.subProduct)
            );
        });

        setFilteredTickets(results);
    };

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
        if (tab === "All") {
            setFilteredTickets(tickets);
        } else if (tab === "Open") {
            setFilteredTickets(tickets.filter((ticket) => ticket.status !== "Closed"));
        } else if (tab === "Closed") {
            setFilteredTickets(tickets.filter((ticket) => ticket.status === "Closed"));
        }
    };

    const handleRowClick = (ticket: Ticket) => {
      // Store ticket details in localStorage
      localStorage.setItem('selectedTicket', JSON.stringify(ticket));
      // Redirect to the static details page
      router.push('/ticketdetails');
    };
  
    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
           {/* Logo and Title */}
        <header className="flex items-center justify-between px-6 py-4 bg-gray-800 shadow-md">
        <div className="flex items-center space-x-4">
            <Image
                src="/logo.png" // Path to your logo
                alt="Invictacore Logo"
                width={50} // Adjust size as needed
                height={50}
                className="rounded-full"
            />
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

           {/* Top Menu */}
<nav className="bg-gray-800 text-gray-200 shadow-lg relative">
    <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
            {/* Left Menu Links */}
            <div className="flex space-x-4">
                {/* About Dropdown */}
                <div className="relative group">
                    <a
                        href="#about"
                        className="hover:bg-gray-700 px-3 py-2 rounded transition-colors duration-200"
                    >
                        About
                    </a>
                    <div className="absolute hidden group-hover:block bg-gray-700 text-gray-200 w-48 shadow-lg rounded mt-2">
                        <a href="#president" className="block px-4 py-2 hover:bg-gray-600">
                            President&apos;s Message
                        </a>
                        <a href="#conduct" className="block px-4 py-2 hover:bg-gray-600">
                            Code of Conduct
                        </a>
                        <a href="#policies" className="block px-4 py-2 hover:bg-gray-600">
                            Policies
                        </a>
                        <a href="#bylaws" className="block px-4 py-2 hover:bg-gray-600">
                            Bylaws
                        </a>
                        <a href="#sponsors" className="block px-4 py-2 hover:bg-gray-600">
                            Sponsors
                        </a>
                        <a href="#handbook" className="block px-4 py-2 hover:bg-gray-600">
                            Handbook
                        </a>
                        <a href="#contact" className="block px-4 py-2 hover:bg-gray-600">
                            Contact
                        </a>
                    </div>
                </div>

                {/* News Dropdown */}
                <div className="relative group">
                    <a
                        href="#news"
                        className="hover:bg-gray-700 px-3 py-2 rounded transition-colors duration-200"
                    >
                        News
                    </a>
                    <div className="absolute hidden group-hover:block bg-gray-700 text-gray-200 w-48 shadow-lg rounded mt-2">
                        <a href="#announcement" className="block px-4 py-2 hover:bg-gray-600">
                            Announcement
                        </a>
                        <a href="#ksea-letters" className="block px-4 py-2 hover:bg-gray-600">
                            KSEA Letters
                        </a>
                        <a href="#ksea-eletters" className="block px-4 py-2 hover:bg-gray-600">
                            KSEA e-Letters
                        </a>
                        <a href="#jobs" className="block px-4 py-2 hover:bg-gray-600">
                            Job Opportunities
                        </a>
                        <a href="#media" className="block px-4 py-2 hover:bg-gray-600">
                            Media
                        </a>
                    </div>
                </div>

                {/* Organization Dropdown */}
                <div className="relative group">
                    <a
                        href="#organization"
                        className="hover:bg-gray-700 px-3 py-2 rounded transition-colors duration-200"
                    >
                        Organization
                    </a>
                    <div className="absolute hidden group-hover:block bg-gray-700 text-gray-200 w-56 shadow-lg rounded mt-2">
                        <a href="#leadership" className="block px-4 py-2 hover:bg-gray-600">
                            Leadership
                        </a>
                        <a href="#committee" className="block px-4 py-2 hover:bg-gray-600">
                            Committee
                        </a>
                        <a href="#technical-group" className="block px-4 py-2 hover:bg-gray-600">
                            Technical Group
                        </a>
                        <a href="#former-presidents" className="block px-4 py-2 hover:bg-gray-600">
                            Former Presidents
                        </a>
                        <a href="#local-chapters" className="block px-4 py-2 hover:bg-gray-600">
                            Local Chapters
                        </a>
                        <a href="#ksea-councilors" className="block px-4 py-2 hover:bg-gray-600">
                            KSEA Councilors
                        </a>
                        <a href="#affiliated" className="block px-4 py-2 hover:bg-gray-600">
                            Affiliated Professional Societies
                        </a>
                    </div>
                </div>

                <div className="relative group">
                    <a
                        href="#award"
                        className="hover:bg-gray-700 px-3 py-2 rounded transition-colors duration-200"
                    >
                        Award
                    </a>
                    <div className="absolute hidden group-hover:block bg-gray-700 text-gray-200 w-56 shadow-lg rounded mt-2">
                        <a href="#scholarship" className="block px-4 py-2 hover:bg-gray-600">
                            Scholarship
                        </a>
                        <a href="#honors" className="block px-4 py-2 hover:bg-gray-600">
                            Honors and Awards
                        </a>
                        <a href="#grants" className="block px-4 py-2 hover:bg-gray-600">
                            Young Investigator Grants
                        </a>
                    </div>
                </div>

                {/* Membership Dropdown */}
                <div className="relative group">
                    <a
                        href="#membership"
                        className="hover:bg-gray-700 px-3 py-2 rounded transition-colors duration-200"
                    >
                        Membership
                    </a>
                    <div className="absolute hidden group-hover:block bg-gray-700 text-gray-200 w-56 shadow-lg rounded mt-2">
                        <a href="#about-membership" className="block px-4 py-2 hover:bg-gray-600">
                            About Membership
                        </a>
                        <a href="#lifetime" className="block px-4 py-2 hover:bg-gray-600">
                            Lifetime Members
                        </a>
                        <a href="#join-membership" className="block px-4 py-2 hover:bg-gray-600">
                            Join KSEA
                        </a>
                    </div>
                </div>

                {/* Donation (No Submenu) */}
                <div>
                    <a
                        href="#donation"
                        className="hover:bg-gray-700 px-3 py-2 rounded transition-colors duration-200"
                    >
                        Donation
                    </a>
                </div>

            </div>

            {/* Right Menu Links */}
            <div className="space-x-4">
                <a
                    href="#join"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded transition-colors duration-200 shadow"
                >
                    Join
                </a>
            </div>
        </div>
    </div>
</nav>


{/* Spacer */}
<div className="h-6 bg-gray-900"></div>
        
{/* User Contact Information */}
{userDetails && (
    <div className="max-w-4xl mx-auto bg-gray-800 p-6 shadow-lg rounded mb-6">
        <h2 className="text-xl font-bold mb-4 text-gray-100">User Contact Information</h2>
        <div className="space-y-2">
            <p>
                <span className="font-semibold text-gray-300">Full Name:</span>{" "}
                {userDetails.firstName} {userDetails.lastName}
            </p>
            <p>
                <span className="font-semibold text-gray-300">Mailing Address:</span>{" "}
                {userDetails.streetAddress}, {userDetails.city}, {userDetails.state}{" "}
                {userDetails.zipCode}
            </p>
            <p>
                <span className="font-semibold text-gray-300">Email Address:</span>{" "}
                {userDetails.email}
            </p>
            <p>
                <span className="font-semibold text-gray-300">Phone Number:</span>{" "}
                {userDetails.phoneNumber}
            </p>
        </div>
    </div>
)}


            {/* Tabs for navigation */}
            <div className="flex justify-center space-x-4 mb-6">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        className={`p-2 rounded text-sm font-semibold ${
                            activeTab === tab
                                ? "bg-blue-600 text-white shadow-lg"
                                : "bg-gray-800 hover:bg-gray-700"
                        }`}
                        onClick={() => handleTabChange(tab)}
                    >
                        {tab} Tickets
                    </button>
                ))}
            </div>

            {/* Search Form */}
            <form
                className="space-y-4 max-w-4xl mx-auto bg-gray-800 p-6 shadow-lg rounded"
                onSubmit={handleSearch}
            >
                <div className="grid grid-cols-2 gap-4">
                    <input
                        name="arNumber"
                        type="text"
                        placeholder="AR Number"
                        value={formData.arNumber}
                        onChange={handleInputChange}
                        className="p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded focus:outline-none focus:ring focus:ring-blue-500"
                    />
                    <select
                        name="severity"
                        value={formData.severity}
                        onChange={handleInputChange}
                        className="p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded focus:outline-none focus:ring focus:ring-blue-500"
                    >
                        <option value="">Select Severity</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                    <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        className="p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded focus:outline-none focus:ring focus:ring-blue-500"
                    >
                        <option value="">Select Priority</option>
                        <option value="P1">P1</option>
                        <option value="P2">P2</option>
                        <option value="P3">P3</option>
                    </select>
                    <input
                        name="requestorUsername"
                        type="text"
                        placeholder="Requestor Username"
                        value={formData.requestorUsername}
                        onChange={handleInputChange}
                        className="p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded focus:outline-none focus:ring focus:ring-blue-500"
                    />
                    <input
                        name="assigneeUsername"
                        type="text"
                        placeholder="Assignee Username"
                        value={formData.assigneeUsername}
                        onChange={handleInputChange}
                        className="p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded focus:outline-none focus:ring focus:ring-blue-500"
                    />
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded focus:outline-none focus:ring focus:ring-blue-500"
                    >
                        <option value="">Select Status</option>
                        <option value="Assigned">Assigned</option>
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                    </select>
                    <input
                        name="dateFrom"
                        type="date"
                        value={formData.dateFrom}
                        onChange={handleInputChange}
                        className="p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded focus:outline-none focus:ring focus:ring-blue-500"
                    />
                    <input
                        name="dateTo"
                        type="date"
                        value={formData.dateTo}
                        onChange={handleInputChange}
                        className="p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded focus:outline-none focus:ring focus:ring-blue-500"
                    />
                    <input
                        name="product"
                        type="text"
                        placeholder="Product"
                        value={formData.product}
                        onChange={handleInputChange}
                        className="p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded focus:outline-none focus:ring focus:ring-blue-500"
                    />
                    <input
                        name="subProduct"
                        type="text"
                        placeholder="Sub-Product"
                        value={formData.subProduct}
                        onChange={handleInputChange}
                        className="p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded focus:outline-none focus:ring focus:ring-blue-500"
                    />
                </div>
                <div className="flex justify-end space-x-4">
                    <button
                        type="reset"
                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-500"
                        onClick={() => setFormData(initialFormData)}
                    >
                        Clear
                    </button>
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
                    >
                        Search
                    </button>
                </div>
            </form>

            {/* Ticket List */}
            <div className="mt-6 max-w-4xl mx-auto">
                <h2 className="text-xl font-bold mb-4">Tickets ({activeTab})</h2>

        <button
          onClick={handleModalOpen}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded mb-4"
        >
          Create New Request
        </button>

                {filteredTickets.length > 0 ? (
                    <table className="table-auto w-full bg-gray-800 text-gray-100 rounded">
                        <thead>
                            <tr className="bg-gray-700 text-gray-200">
                                <th className="p-2 border border-gray-600">AR Number</th>
                                <th className="p-2 border border-gray-600">Severity</th>
                                <th className="p-2 border border-gray-600">Priority</th>
                                <th className="p-2 border border-gray-600">Requestor</th>
                                <th className="p-2 border border-gray-600">Assignee</th>
                                <th className="p-2 border border-gray-600">Status</th>
                                <th className="p-2 border border-gray-600">Date Created</th>
                                <th className="p-2 border border-gray-600">Product</th>
                                <th className="p-2 border border-gray-600">Sub-Product</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTickets.map((ticket) => (
                                <tr key={ticket.arNumber}
                                onClick={() => handleRowClick(ticket)}
                                className="hover:bg-gray-700">
                                    <td className="p-2 border border-gray-700">{ticket.arNumber}</td>
                                    <td className="p-2 border border-gray-700">{ticket.severity}</td>
                                    <td className="p-2 border border-gray-700">{ticket.priority}</td>
                                    <td className="p-2 border border-gray-700">{ticket.requestor}</td>
                                    <td className="p-2 border border-gray-700">{ticket.assignee}</td>
                                    <td className="p-2 border border-gray-700">{ticket.status}</td>
                                    <td className="p-2 border border-gray-700">{ticket.dateCreated}</td>
                                    <td className="p-2 border border-gray-700">{ticket.product}</td>
                                    <td className="p-2 border border-gray-700">{ticket.subProduct}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-gray-400">No tickets found.</p>
                )}

{isModalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Create New Request</h2>
            <form onSubmit={handleFormSubmit}>
              <div className="space-y-4">
                <input
                  name="severity"
                  type="text"
                  placeholder="Severity"
                  value={newTicket.severity}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
                />
                <input
                  name="priority"
                  type="text"
                  placeholder="Priority"
                  value={newTicket.priority}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
                />
                <input
                  name="requestor"
                  type="text"
                  placeholder="Requestor Username"
                  value={newTicket.requestor}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
                />
                <input
                  name="assignee"
                  type="text"
                  placeholder="Assignee Username"
                  value={newTicket.assignee}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
                />
                <input
                  name="product"
                  type="text"
                  placeholder="Product"
                  value={newTicket.product}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
                />
                <input
                  name="subProduct"
                  type="text"
                  placeholder="Sub-Product"
                  value={newTicket.subProduct}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-700 bg-gray-700 text-gray-100 rounded"
                />
              </div>
              <div className="flex justify-end space-x-4 mt-4">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="bg-gray-600 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
            </div>
        </div>        
    );
}
