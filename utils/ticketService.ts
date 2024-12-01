const API_URL = "https://it-support-app-backend.vercel.app/api/tickets";

// Fetch tickets
export const fetchTickets = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Failed to fetch tickets");
    return await response.json();
  } catch (error) {
    console.error("Error fetching tickets:", error);
    throw error;
  }
};

// Create a new ticket
export const createTicket = async (ticket: Record<string, any>) => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ticket),
    });
    if (!response.ok) throw new Error("Failed to create ticket");
    return await response.json();
  } catch (error) {
    console.error("Error creating ticket:", error);
    throw error;
  }
};

// Search ticket by AR number
export const searchTicketByArNumber = async (arNumber:any) => {
  try {
    const response = await fetch(`${API_URL}/search?arNumber=${encodeURIComponent(arNumber)}`);
    if (!response.ok) throw new Error("Failed to search ticket");
    return await response.json();
  } catch (error) {
    console.error("Error searching ticket:", error);
    throw error;
  }
};
