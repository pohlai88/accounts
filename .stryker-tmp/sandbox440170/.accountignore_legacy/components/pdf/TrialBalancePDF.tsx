// @ts-nocheck
import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { TrialBalance } from "@eprnext/contracts";

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    textAlign: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: "#666666",
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#000000",
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
  },
  tableColHeader: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#000000",
    backgroundColor: "#f0f0f0",
    padding: 8,
    textAlign: "center",
    fontWeight: "bold",
  },
  tableCol: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#000000",
    padding: 8,
  },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: "bold",
  },
  tableCell: {
    fontSize: 9,
  },
  tableCellRight: {
    fontSize: 9,
    textAlign: "right",
  },
  totalsRow: {
    backgroundColor: "#f9f9f9",
    fontWeight: "bold",
  },
  footer: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 8,
    color: "#666666",
  },
});

interface TrialBalancePDFProps {
  data: TrialBalance;
}

export const TrialBalancePDF: React.FC<TrialBalancePDFProps> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>Trial Balance</Text>
        <Text style={styles.subtitle}>
          As of {new Date(data.period.as_of).toLocaleDateString()} ({data.period.currency})
        </Text>
      </View>

      <View style={styles.table}>
        {/* Header Row */}
        <View style={styles.tableRow}>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCellHeader}>Account Code</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCellHeader}>Account Name</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCellHeader}>Debit</Text>
          </View>
          <View style={styles.tableColHeader}>
            <Text style={styles.tableCellHeader}>Credit</Text>
          </View>
        </View>

        {/* Data Rows */}
        {data.accounts.map((account, index) => (
          <View key={account.account_id} style={styles.tableRow}>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{account.account_code}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCell}>{account.account_name}</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCellRight}>
                {account.debit > 0
                  ? account.debit.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : "-"}
              </Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={styles.tableCellRight}>
                {account.credit > 0
                  ? account.credit.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : "-"}
              </Text>
            </View>
          </View>
        ))}

        {/* Totals Row */}
        <View style={[styles.tableRow, styles.totalsRow]}>
          <View style={styles.tableCol}>
            <Text style={[styles.tableCell, { fontWeight: "bold" }]}>TOTAL</Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={[styles.tableCell, { fontWeight: "bold" }]}>
              {data.totals.is_balanced ? "✓ Balanced" : "⚠ Not Balanced"}
            </Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={[styles.tableCellRight, { fontWeight: "bold" }]}>
              {data.totals.debit.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
          <View style={styles.tableCol}>
            <Text style={[styles.tableCellRight, { fontWeight: "bold" }]}>
              {data.totals.credit.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text>Generated on {new Date().toLocaleString()}</Text>
        <Text>eprNEXT Accounting System</Text>
      </View>
    </Page>
  </Document>
);
