import { Document, Page, View, Text, StyleSheet, Font } from "@react-pdf/renderer";

// Vercel-safe: fuente remota estable (evita rutas locales a node_modules en runtime serverless)
Font.register({
  family: "PinyonScript",
  src: "https://cdn.jsdelivr.net/npm/@fontsource/pinyon-script/files/pinyon-script-latin-400-normal.woff",
});

const styles = StyleSheet.create({
  page: { backgroundColor: "#ffffff", padding: 48, fontFamily: "Helvetica" },
  headerContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  heading: {
    fontSize: 48,
    color: "#4a4f36",
    fontFamily: "PinyonScript",
    marginBottom: 4,
  },
  subheading: { fontSize: 9, color: "#8a8a7a", letterSpacing: 2, textTransform: "uppercase" },
  receiptTitleContainer: {
    marginBottom: 24,
    borderBottom: "1pt solid #eaeaea",
    paddingBottom: 12,
  },
  receiptTitle: { fontSize: 16, color: "#2D3220", fontWeight: "bold", letterSpacing: 0.5 },
  
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  infoCol: {
    flexDirection: "column",
    gap: 4,
  },
  label: { fontSize: 8, color: "#8a8a7a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 },
  value: { fontSize: 11, color: "#2D3220" },
  
  tableContainer: {
    marginTop: 12,
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "1pt solid #eaeaea",
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  serviceName: { fontSize: 11, color: "#4a4a40", flex: 1, paddingRight: 10 },
  servicePrice: { fontSize: 11, color: "#2D3220", textAlign: "right" },
  
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1pt solid #2D3220",
    paddingTop: 12,
    marginTop: 8,
  },
  totalLabel: { fontSize: 12, color: "#2D3220", fontWeight: "bold", letterSpacing: 1, textTransform: "uppercase" },
  totalValue: { fontSize: 16, color: "#2D3220", fontWeight: "bold" },
  
  footerDetails: {
    marginTop: 32,
    paddingTop: 16,
    borderTop: "1pt dashed #eaeaea",
  },
  notes: { fontSize: 9, color: "#6b6b5a", lineHeight: 1.5, marginTop: 12, fontStyle: "italic" },
  footer: { marginTop: 40, fontSize: 8, color: "#a29b86", textAlign: "center", letterSpacing: 1, textTransform: "uppercase" },
});

interface ReciboPDFProps {
  clientName: string;
  services: Array<{ name: string; price: string }>;
  date: string;
  time: string;
  totalAmount: string;
  paymentMethod: string;
  notes?: string | null;
}

export function ReciboPDF({
  clientName,
  services,
  date,
  time,
  totalAmount,
  paymentMethod,
  notes,
}: ReciboPDFProps) {
  return (
    <Document>
      <Page size="A5" style={styles.page}>
        <View style={styles.headerContainer}>
          <Text style={styles.heading}>Angelin</Text>
          <Text style={styles.subheading}>ESTHETICIAN STUDIO</Text>
        </View>

        <View style={styles.receiptTitleContainer}>
          <Text style={styles.receiptTitle}>Recibo de Pago</Text>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <View style={{ marginBottom: 12 }}>
              <Text style={styles.label}>Clienta</Text>
              <Text style={styles.value}>{clientName}</Text>
            </View>
            <View>
              <Text style={styles.label}>Forma de pago</Text>
              <Text style={styles.value}>{paymentMethod}</Text>
            </View>
          </View>
          
          <View style={[styles.infoCol, { alignItems: "flex-end" }]}>
            <View style={{ marginBottom: 12, alignItems: "flex-end" }}>
              <Text style={styles.label}>Fecha</Text>
              <Text style={styles.value}>{date}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.label}>Hora</Text>
              <Text style={styles.value}>{time}</Text>
            </View>
          </View>
        </View>

        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={styles.label}>Servicio</Text>
            <Text style={styles.label}>Importe</Text>
          </View>

          {services.map((s, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.serviceName}>{s.name}</Text>
              <Text style={styles.servicePrice}>{s.price || "-"}</Text>
            </View>
          ))}

          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{totalAmount}</Text>
          </View>
        </View>

        <View style={styles.footerDetails}>
          {notes ? <Text style={styles.notes}>Notas: {notes}</Text> : null}
        </View>

        <Text style={styles.footer}>Gracias por tu preferencia</Text>
      </Page>
    </Document>
  );
}
