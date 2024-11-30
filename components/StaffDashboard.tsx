// components/StaffDashboard.js
import React, { useState, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import TicketReportPDF from './TicketReportPDF';

const StaffDashboard = ({tickets}:any) => {

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
