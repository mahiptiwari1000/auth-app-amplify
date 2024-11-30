import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30 },
  section: { marginBottom: 10 },
  header: { fontSize: 18, marginBottom: 10 },
  table: { display: 'flex', flexDirection: 'column', width: 'auto' },
  tableRow: { flexDirection: 'row' },
  tableCol: { flex: 1, borderStyle: 'solid', borderWidth: 1 },
  tableCell: { margin: 5, fontSize: 10 },
});

const TicketReportPDF = ({ tickets }:any) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Ticket Report</Text>
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={styles.tableCol}><Text style={styles.tableCell}>User</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>Ticket Title</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>Status</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>AR Number</Text></View>
        </View>
        {tickets.map((ticket:any, index:any) => (
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
