/**
 * DGI Invoice PDF Generator
 * Génère des factures conformes aux exigences DGI RDC
 * Format: A4,(mm), encodage UTF-8
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

const MARGIN = 15;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// Palette de couleurs
const GREEN = [34, 197, 94] as [number, number, number];
const GREEN_DARK = [22, 163, 74] as [number, number, number];
const GREEN_LIGHT = [187, 247, 208] as [number, number, number];
const GREEN_FAINT = [240, 253, 244] as [number, number, number];
const GRAY_900 = [17, 24, 39] as [number, number, number];
const GRAY_700 = [55, 65, 81] as [number, number, number];
const GRAY_600 = [75, 85, 99] as [number, number, number];
const GRAY_500 = [107, 114, 128] as [number, number, number];
const GRAY_200 = [229, 231, 235] as [number, number, number];
const WHITE = [255, 255, 255] as [number, number, number];

const fmt = (n: number, dec = 2) => new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: dec,
  maximumFractionDigits: dec,
}).format(n);

const fmtCurrency = (amount: number, currency = 'USD') =>
  currency === 'USD' ? `$${fmt(amount)}` : `${fmt(amount)} FC`;

interface DgiInvoiceData {
  id: string;
  facture_number: string;
  numero_dgi?: string;
  date_emission: string;
  client_nom?: string;
  client_telephone?: string;
  client_adresse?: string;
  items: Array<{
    description: string;
    quantite: number;
    prix_unitaire: number;
    montant_total: number;
    groupe_tva?: string;
  }>;
  subtotal: number;
  frais?: number;
  total_general: number;
  devise?: string;
}

interface DeclarantInfo {
  raison_sociale: string;
  sigle?: string;
  nif?: string;
  rccm?: string;
  dgi_numero?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
}

export async function generateDgiInvoicePDF(
  invoice: DgiInvoiceData,
  declarant?: DeclarantInfo
): Promise<Blob> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const company = declarant || {
    raison_sociale: 'Ma Société SARL',
    nif: 'NIF à configurer',
    rccm: 'RCCM à configurer',
    adresse: 'Adresse à configurer',
    telephone: '+243 XX XXX XXXX',
    email: 'contact@exemple.cd',
  };

  let y = MARGIN;
  const setFont = (style: 'bold' | 'normal' = 'normal') =>
    doc.setFont('helvetica', style);

  // ── 1. BANDEAU VERT EN-TÊTE ──────────────────────────────────────
  doc.setFillColor(GREEN[0], GREEN[1], GREEN[2]);
  doc.rect(0, 0, PAGE_WIDTH, 12, 'F');

  setFont('bold');
  doc.setFontSize(14);
  doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
  doc.text('FACTURE NORMALISÉE', PAGE_WIDTH / 2, 7.5, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(GREEN_LIGHT[0], GREEN_LIGHT[1], GREEN_LIGHT[2]);
  doc.text('DGI - République Démocratique du Congo', PAGE_WIDTH / 2, 11, { align: 'center' });

  y = 16;

  // ── 2. INFO ENTREPRISE (gauche) + INFO FACTURE (droite) ────────
  const midY = y;

  // Bloc entreprise (gauche)
  setFont('bold');
  doc.setFontSize(13);
  doc.setTextColor(GREEN[0], GREEN[1], GREEN[2]);
  doc.text(company.raison_sociale.toUpperCase(), MARGIN, y + 4);

  if (company.sigle) {
    setFont('normal');
    doc.setFontSize(9);
    doc.setTextColor(GRAY_600[0], GRAY_600[1], GRAY_600[2]);
    doc.text(`(${company.sigle})`, MARGIN, y + 9);
    y += 4;
  }

  setFont('normal');
  doc.setFontSize(8);
  doc.setTextColor(GRAY_700[0], GRAY_700[1], GRAY_700[2]);
  const infoLines = [
    company.adresse,
    `Tél: ${company.telephone}`,
    `Email: ${company.email}`,
    `NIF: ${company.nif}`,
    `RCCM: ${company.rccm}`,
  ].filter(Boolean) as string[];

  infoLines.forEach((line, i) => {
    doc.text(line, MARGIN, y + 9 + i * 4);
  });

  y = midY;

  // Bloc facture (droite)
  const rightX = 125;
  const boxW = PAGE_WIDTH - rightX - MARGIN;

  doc.setFillColor(GREEN_FAINT[0], GREEN_FAINT[1], GREEN_FAINT[2]);
  doc.rect(rightX, y, boxW, 35, 'F');

  doc.setDrawColor(GREEN[0], GREEN[1], GREEN[2]);
  doc.setLineWidth(0.5);
  doc.rect(rightX, y, boxW, 35, 'S');

  const labelStyle = () => {
    setFont('normal');
    doc.setFontSize(7.5);
    doc.setTextColor(GRAY_500[0], GRAY_500[1], GRAY_500[2]);
  };
  const valueStyle = () => {
    setFont('bold');
    doc.setFontSize(9);
    doc.setTextColor(GRAY_900[0], GRAY_900[1], GRAY_900[2]);
  };

  const label = (text: string, px: number, py: number) => {
    labelStyle();
    doc.text(text, px, py);
  };
  const value = (text: string, px: number, py: number) => {
    valueStyle();
    doc.text(text, px + boxW - MARGIN - 2, py, { align: 'right' });
  };

  label('N° Facture:', rightX + 4, y + 7);
  value(invoice.facture_number, rightX + 4, y + 7);

  label('N° DGI:', rightX + 4, y + 14);
  value(invoice.numero_dgi || '-', rightX + 4, y + 14);

  label('Date:', rightX + 4, y + 21);
  value(
    format(new Date(invoice.date_emission), 'dd MMM yyyy', { locale: fr }),
    rightX + 4, y + 21
  );

  label('Devise:', rightX + 4, y + 28);
  value(invoice.devise || 'USD', rightX + 4, y + 28);

  label('Siège:', rightX + 4, y + 35);
  value(company.dgi_numero ? `DGI ${company.dgi_numero}` : '-', rightX + 4, y + 35);

  // ── 3. CLIENT ───────────────────────────────────────────────────
  y += 40;

  doc.setFillColor(GREEN[0], GREEN[1], GREEN[2]);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 7, 'F');
  setFont('bold');
  doc.setFontSize(9);
  doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
  doc.text('INFORMATIONS CLIENT', MARGIN + 3, y + 4.5);

  y += 7;
  doc.setFillColor(GREEN_FAINT[0], GREEN_FAINT[1], GREEN_FAINT[2]);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 14, 'F');

  setFont('normal');
  doc.setFontSize(8.5);

  const clientX = MARGIN + 4;
  doc.setTextColor(GRAY_600[0], GRAY_600[1], GRAY_600[2]);
  doc.text('Client:', clientX, y + 5);
  setFont('bold');
  doc.setTextColor(GRAY_900[0], GRAY_900[1], GRAY_900[2]);
  doc.text(invoice.client_nom || 'Client', clientX, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(GRAY_600[0], GRAY_600[1], GRAY_600[2]);
  if (invoice.client_telephone) {
    doc.text(`Tél: ${invoice.client_telephone}`, 110, y + 5);
  }
  if (invoice.client_adresse) {
    doc.text(invoice.client_adresse, 110, y + 10);
  }

  y += 18;

  // ── 4. TABLEAU DES ARTICLES ─────────────────────────────────────
  const tvaRates: Record<string, string> = {
    A: '0% (Exonéré)',
    B: '8%',
    C: '16%',
  };

  const tableHeaders = ['#', 'Description', 'Qté', 'Prix Unit.', 'TVA', 'Montant'];
  const tableData = invoice.items.map((item, idx) => [
    idx + 1,
    item.description,
    item.quantite,
    fmtCurrency(item.prix_unitaire, invoice.devise),
    item.groupe_tva ? tvaRates[item.groupe_tva] || '16%' : '16%',
    fmtCurrency(item.montant_total, invoice.devise),
  ]);

  autoTable(doc, {
    startY: y,
    head: [tableHeaders],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
      lineColor: GRAY_200,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: GREEN,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
      valign: 'middle',
    },
    bodyStyles: {
      textColor: GRAY_700,
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: GREEN_FAINT,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { cellWidth: 75 },
      2: { halign: 'center', cellWidth: 18 },
      3: { halign: 'right', cellWidth: 28 },
      4: { halign: 'center', cellWidth: 25 },
      5: { halign: 'right', cellWidth: 30, fontStyle: 'bold' },
    },
    margin: { left: MARGIN, right: MARGIN, bottom: 60 },
    showHead: 'everyPage',
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ── 5. TOTAUX ───────────────────────────────────────────────────
  const totalsX = 130;
  const totalsW = PAGE_WIDTH - totalsX - MARGIN;

  const drawTotalRow = (label: string, amount: number, isBold = false, isLast = false) => {
    const rowY = y;
    if (!isLast) {
      doc.setFillColor(GREEN_FAINT[0], GREEN_FAINT[1], GREEN_FAINT[2]);
      doc.rect(totalsX, rowY, totalsW, 8, 'F');
    } else {
      doc.setFillColor(GREEN[0], GREEN[1], GREEN[2]);
      doc.rect(totalsX, rowY, totalsW, 9, 'F');
    }

    setFont(isBold ? 'bold' : 'normal');
    doc.setFontSize(isBold ? 10 : 8.5);
    doc.setTextColor(isLast ? WHITE[0] : GRAY_900[0], isLast ? WHITE[1] : GRAY_900[1], isLast ? WHITE[2] : GRAY_900[2]);
    doc.text(label, totalsX + 3, rowY + (isBold ? 6 : 5.5));

    doc.text(fmtCurrency(amount, invoice.devise), totalsX + totalsW - 3, rowY + (isBold ? 6 : 5.5), { align: 'right' });

    y += isLast ? 9 : 8;
  };

  drawTotalRow('Sous-total HTVA', invoice.subtotal);
  if (invoice.frais) drawTotalRow('Frais', invoice.frais);
  drawTotalRow('TOTAL À PAYER', invoice.total_general, true, true);

  // ── 6. MENTION DGI ───────────────────────────────────────────────
  y += 6;

  doc.setFillColor(GREEN_LIGHT[0], GREEN_LIGHT[1], GREEN_LIGHT[2]);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 10, 'F');

  setFont('bold');
  doc.setFontSize(7.5);
  doc.setTextColor(GREEN_DARK[0], GREEN_DARK[1], GREEN_DARK[2]);
  doc.text(
    `TVA perçue récupérable | NIF: ${company.nif} | RCCM: ${company.rccm}`,
    PAGE_WIDTH / 2, y + 4,
    { align: 'center' }
  );
  doc.setFontSize(6.5);
  doc.text(
    `Document généré par FactureSmart | Déclarant DGI`,
    PAGE_WIDTH / 2, y + 8,
    { align: 'center' }
  );

  y += 14;

  // ── 7. SIGNATURES ────────────────────────────────────────────────
  doc.setDrawColor(GRAY_200[0], GRAY_200[1], GRAY_200[2]);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, MARGIN + 80, y);
  doc.line(110, y, PAGE_WIDTH - MARGIN, y);

  setFont('bold');
  doc.setFontSize(7.5);
  doc.setTextColor(GRAY_600[0], GRAY_600[1], GRAY_600[2]);
  doc.text('Signature Vendeur', MARGIN + 40, y + 4, { align: 'center' });
  doc.text('Signature Client', 110 + (PAGE_WIDTH - MARGIN - 110) / 2, y + 4, { align: 'center' });

  // ── FOOTER ───────────────────────────────────────────────────────
  doc.setFillColor(GREEN[0], GREEN[1], GREEN[2]);
  doc.rect(0, 287, PAGE_WIDTH, 10, 'F');
  setFont('normal');
  doc.setFontSize(7);
  doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
  doc.text(
    `Facture N° ${invoice.facture_number} | Émise le ${format(new Date(invoice.date_emission), 'dd/MM/yyyy', { locale: fr })} | DGI RDC`,
    PAGE_WIDTH / 2, 293,
    { align: 'center' }
  );

  return doc.output('blob');
}
