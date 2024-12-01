import { FC } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import TicketReportPDF from './TicketReportPDF';

// Define the Ticket interface (includes userName)
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
  userName: string; // Ensure this matches the TicketReportPDF interface
}

const StaffDashboard: FC<{ tickets: Ticket[] }> = ({ tickets }) => {
  return (
    <div>
      <h1>Staff Dashboard</h1>
      <PDFDownloadLink
        document={<TicketReportPDF tickets={tickets} />}
        fileName="ticket_report.pdf"
      >
        View Ticket Report
      </PDFDownloadLink>
    </div>
  );
};

export default StaffDashboard;
