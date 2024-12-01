import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

// Define the Ticket interface
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
  userName: string; // Assuming 'userName' is part of Ticket data
}

const styles = StyleSheet.create({
  page: { padding: 30 },
  section: { marginBottom: 10 },
  header: { fontSize: 18, marginBottom: 10 },
  table: { display: 'flex', flexDirection: 'column', width: 'auto' },
  tableRow: { flexDirection: 'row' },
  tableCol: { flex: 1, borderStyle: 'solid', borderWidth: 1 },
  tableCell: { margin: 5, fontSize: 10 },
});

interface TicketReportPDFProps {
  tickets: Ticket[]; // Define the expected prop type
}

const TicketReportPDF: React.FC<TicketReportPDFProps> = ({ tickets }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Ticket Report</Text>
      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.tableRow}>
          <View style={styles.tableCol}><Text style={styles.tableCell}>User</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>Ticket Title</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>Status</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>AR Number</Text></View>
        </View>
        {/* Table Body */}
        {tickets.map((ticket, index) => (
          <View key={index} style={styles.tableRow}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{ticket.userName}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{ticket.title}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{ticket.status}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{ticket.arNumber}</Text></View>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

export default TicketReportPDF;
