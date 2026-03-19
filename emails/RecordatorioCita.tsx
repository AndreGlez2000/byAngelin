import {
  Body,
  Container,
  Font,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface Props {
  clientName: string
  service: string
  date: string
  time: string
  price: string
}

export function RecordatorioCita({ clientName, service, date, time, price }: Props) {
  return (
    <Html lang="es">
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>Recordatorio: tu cita es mañana — {service} a las {time}</Preview>
      <Body style={body}>

        {/* Logo */}
        <Section style={logoSection}>
          <table cellPadding="0" cellSpacing="0" style={{ margin: '0 auto' }}>
            <tbody>
              <tr>
                <td style={{ textAlign: 'center' }}>
                  <div style={monogramBox}>
                    <span style={monogram}>AE</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td style={{ textAlign: 'center', paddingTop: '8px' }}>
                  <div style={brandBox}>
                    <span style={brandName}>Angelin Esthetician</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </Section>

        {/* Card */}
        <Container style={card}>

          {/* Card body */}
          <Section style={cardBody}>
            <Text style={heading}>Tu cita es mañana</Text>
            <Text style={intro}>
              Hola <strong style={{ color: '#2D3220' }}>{clientName}</strong>, te recordamos que tienes una cita mañana.
            </Text>

            {/* Details table */}
            <table style={detailsBox} cellPadding="0" cellSpacing="0" width="100%">
              <tbody>
                <tr>
                  <td style={labelCell}>Servicio</td>
                  <td style={valueCell}>{service}</td>
                </tr>
                <tr>
                  <td style={labelCell}>Fecha</td>
                  <td style={valueCell}>{date}</td>
                </tr>
                <tr>
                  <td style={labelCell}>Hora</td>
                  <td style={valueCell}>{time}</td>
                </tr>
                <tr>
                  <td style={{ ...labelCell, borderTop: '1px solid #e2ddd4', paddingTop: '12px' }}>Total</td>
                  <td style={{ ...valueCell, borderTop: '1px solid #e2ddd4', paddingTop: '12px', fontSize: '20px', color: '#5D6345', fontWeight: 700, letterSpacing: '-0.5px' }}>{price}</td>
                </tr>
              </tbody>
            </table>

            {/* Reminder note */}
            <div style={reminderBox}>
              <Text style={reminderText}>
                ⏰ Si necesitas cancelar o reagendar, por favor avísanos con anticipación.
              </Text>
            </div>

            {/* Signature */}
            <Text style={signatureText}>
              ¡Nos vemos mañana!
              <br />
              — <span style={signature}>Angelin</span>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={cardFooter}>
            <Text style={footerText}>Angelin Esthetician Studio · correo automático</Text>
          </Section>

        </Container>

      </Body>
    </Html>
  )
}

export default RecordatorioCita

// ─── Styles ─────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: '#E2E2D1',
  fontFamily: "'Inter', Helvetica, sans-serif",
  margin: 0,
  padding: '36px 16px',
}

const logoSection: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '28px',
}

const monogramBox: React.CSSProperties = {
  display: 'inline-block',
  border: '1px dashed #8a9a7a',
  padding: '6px 18px',
}

const monogram: React.CSSProperties = {
  fontFamily: "'Pinyon Script', cursive",
  fontSize: '44px',
  color: '#5D6345',
  lineHeight: '1.1',
}

const brandBox: React.CSSProperties = {
  display: 'inline-block',
  border: '1px dashed #8a9a7a',
  padding: '4px 20px',
}

const brandName: React.CSSProperties = {
  fontFamily: "'Pinyon Script', cursive",
  fontSize: '20px',
  color: '#5D6345',
  letterSpacing: '1px',
}

const card: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  maxWidth: '420px',
  margin: '0 auto',
  border: '1px solid #d8d4c8',
  overflow: 'hidden',
}

const cardBody: React.CSSProperties = {
  padding: '28px 28px 20px',
}

const heading: React.CSSProperties = {
  margin: '0 0 14px',
  fontSize: '15px',
  fontWeight: 600,
  color: '#2D3220',
  letterSpacing: '-0.2px',
  fontFamily: "'Inter', Helvetica, sans-serif",
}

const intro: React.CSSProperties = {
  margin: '0 0 20px',
  fontSize: '13px',
  color: '#6a6a50',
  lineHeight: '1.6',
  fontFamily: "'Inter', Helvetica, sans-serif",
}

const detailsBox: React.CSSProperties = {
  backgroundColor: '#f5f3ed',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '18px',
}

const labelCell: React.CSSProperties = {
  padding: '7px 0',
  fontSize: '11px',
  color: '#8a8a72',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  fontFamily: "'Inter', Helvetica, sans-serif",
}

const valueCell: React.CSSProperties = {
  padding: '7px 0',
  fontSize: '13px',
  color: '#2D3220',
  fontWeight: 500,
  textAlign: 'right',
  fontFamily: "'Inter', Helvetica, sans-serif",
}

const reminderBox: React.CSSProperties = {
  borderRadius: '8px',
  padding: '12px 14px',
  border: '1px solid #e2ddd4',
  backgroundColor: '#f5f3ed',
  marginBottom: '22px',
}

const reminderText: React.CSSProperties = {
  margin: 0,
  fontSize: '12px',
  color: '#6a6a50',
  lineHeight: '1.7',
  fontFamily: "'Inter', Helvetica, sans-serif",
}

const signatureText: React.CSSProperties = {
  margin: 0,
  fontSize: '12px',
  color: '#9a9a7a',
  lineHeight: '1.6',
  fontFamily: "'Inter', Helvetica, sans-serif",
}

const signature: React.CSSProperties = {
  fontFamily: "'Pinyon Script', cursive",
  fontSize: '18px',
  color: '#a34e62',
}

const cardFooter: React.CSSProperties = {
  padding: '14px 28px',
  backgroundColor: '#f5f3ed',
  borderTop: '1px solid #e2ddd4',
}

const footerText: React.CSSProperties = {
  margin: 0,
  fontSize: '10px',
  color: '#b0a890',
  textAlign: 'center',
  fontFamily: "'Inter', Helvetica, sans-serif",
  letterSpacing: '0.3px',
}
