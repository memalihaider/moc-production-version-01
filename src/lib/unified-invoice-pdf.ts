import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface UnifiedInvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  details?: string;
}

export interface UnifiedInvoicePaymentMethod {
  label: string;
  amount: number;
}

export interface UnifiedInvoicePdfData {
  invoiceNumber: string;
  invoiceDate: string;
  companyName: string;
  companyAddress?: string;
  companyCityCountry?: string;
  companyPhone?: string;
  companyEmail?: string;
  trnNumber?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  serviceDate?: string;
  serviceTime?: string;
  branchName: string;
  items: UnifiedInvoiceLineItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  taxPercent?: number;
  serviceCharges?: number;
  tipAmount?: number;
  totalAmount: number;
  paymentMethods: UnifiedInvoicePaymentMethod[];
  notes?: string;
  disclaimerText?: string;
  logoPath?: string;
  fileName?: string;
}

const formatCurrency = (amount: number) => `AED ${Number(amount || 0).toFixed(2)}`;

const toDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const loadLogoDataUrl = async (logoPath?: string): Promise<string | null> => {
  if (!logoPath) return null;

  try {
    const response = await fetch(logoPath);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await toDataUrl(blob);
  } catch {
    return null;
  }
};

export async function generateUnifiedInvoicePdf(data: UnifiedInvoicePdfData): Promise<void> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;

  const logoDataUrl = await loadLogoDataUrl(data.logoPath);

  let headerX = margin;
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', margin, 32, 54, 54);
    headerX += 66;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39);
  doc.text(data.companyName || 'MAN OF CAVE BARBERSHOP', headerX, 52);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);

  const rawCompanyLines = [
    data.companyAddress,
    data.companyCityCountry,
    data.companyPhone ? `Phone: ${data.companyPhone}` : '',
    data.companyEmail ? `Email: ${data.companyEmail}` : '',
    data.trnNumber ? `TRN: ${data.trnNumber}` : '',
  ].filter(Boolean) as string[];

  const normalizedAddress = (data.companyAddress || '').trim().toLowerCase();
  const normalizedCityCountry = (data.companyCityCountry || '').trim().toLowerCase();
  const filteredLines = rawCompanyLines.filter((line) => {
    const normalizedLine = line.trim().toLowerCase();
    if (!normalizedLine) return false;
    if (normalizedCityCountry && normalizedLine === normalizedCityCountry && normalizedAddress.includes(normalizedCityCountry)) {
      return false;
    }
    return true;
  });

  const uniqueLines = Array.from(new Set(filteredLines));
  const headerLeftMaxWidth = pageWidth - margin * 2 - 220;
  let companyY = 66;

  uniqueLines.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, headerLeftMaxWidth);
    wrapped.forEach((wrappedLine: string) => {
      doc.text(wrappedLine, headerX, companyY);
      companyY += 12;
    });
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(3, 105, 161);
  doc.text('TAX INVOICE', pageWidth - margin, 50, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text(`Invoice #: ${data.invoiceNumber}`, pageWidth - margin, 70, { align: 'right' });
  doc.text(`Invoice Date: ${data.invoiceDate}`, pageWidth - margin, 84, { align: 'right' });

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, 100, pageWidth - margin, 100);

  const leftInfoLines = [
    `Customer: ${data.customerName || '-'}`,
    `Phone: ${data.customerPhone || '-'}`,
    `Email: ${data.customerEmail || '-'}`,
    `Branch: ${data.branchName || '-'}`,
  ];

  const rightInfoLines = [
    `Service Date: ${data.serviceDate || '-'}`,
    `Service Time: ${data.serviceTime || '-'}`,
  ];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text('Billing Details', margin, 124);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  let infoY = 140;
  leftInfoLines.forEach((line) => {
    doc.text(line, margin, infoY);
    infoY += 14;
  });

  let rightY = 140;
  rightInfoLines.forEach((line) => {
    doc.text(line, pageWidth - margin - 200, rightY);
    rightY += 14;
  });

  const tableRows = data.items.map((item) => [
    item.details ? `${item.description}\n${item.details}` : item.description,
    String(item.quantity),
    formatCurrency(item.unitPrice),
    formatCurrency(item.lineTotal),
  ]);

  autoTable(doc, {
    startY: 204,
    margin: { left: margin, right: margin },
    head: [['Description', 'Qty', 'Unit Price', 'Line Total']],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 6,
      valign: 'middle',
      textColor: [31, 41, 55],
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 290 },
      1: { halign: 'center', cellWidth: 50 },
      2: { halign: 'right', cellWidth: 90 },
      3: { halign: 'right', cellWidth: 95 },
    },
  });

  const finalY = ((doc as any).lastAutoTable?.finalY || 204) + 18;
  const summaryX = pageWidth - margin - 210;

  const summaryRows: Array<{ label: string; value: number; negative?: boolean }> = [
    { label: 'Subtotal', value: data.subtotal },
    { label: 'Discount', value: data.discountAmount, negative: true },
    { label: data.taxPercent !== undefined ? `Tax (${data.taxPercent.toFixed(2)}%)` : 'Tax', value: data.taxAmount },
  ];

  if ((data.serviceCharges || 0) > 0) {
    summaryRows.push({ label: 'Service Charges', value: Number(data.serviceCharges || 0) });
  }

  if ((data.tipAmount || 0) > 0) {
    summaryRows.push({ label: 'Tips', value: Number(data.tipAmount || 0) });
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Invoice Summary', summaryX, finalY);

  let summaryY = finalY + 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  summaryRows.forEach((row) => {
    doc.text(row.label, summaryX, summaryY);
    const amountText = row.negative ? `- ${formatCurrency(row.value)}` : formatCurrency(row.value);
    doc.text(amountText, pageWidth - margin, summaryY, { align: 'right' });
    summaryY += 14;
  });

  doc.setDrawColor(203, 213, 225);
  doc.line(summaryX, summaryY + 2, pageWidth - margin, summaryY + 2);
  summaryY += 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total Amount', summaryX, summaryY);
  doc.text(formatCurrency(data.totalAmount), pageWidth - margin, summaryY, { align: 'right' });

  const payments = data.paymentMethods.filter((method) => Number(method.amount || 0) > 0);
  let paymentY = finalY;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Payment Method(s)', margin, paymentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  paymentY += 16;

  if (payments.length === 0) {
    doc.text('No payment details provided', margin, paymentY);
    paymentY += 14;
  } else {
    payments.forEach((method) => {
      doc.text(`${method.label}: ${formatCurrency(method.amount)}`, margin, paymentY);
      paymentY += 14;
    });
  }

  if (data.notes) {
    paymentY += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Notes', margin, paymentY);
    doc.setFont('helvetica', 'normal');
    const wrappedNotes = doc.splitTextToSize(data.notes, pageWidth - margin * 2);
    doc.text(wrappedNotes, margin, paymentY + 12);
    paymentY += wrappedNotes.length * 12 + 6;
  }

  // Keep clear breathing room between totals/summary and disclaimer text.
  let disclaimerY = Math.max(summaryY + 20, paymentY + 16);

  if (data.disclaimerText) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);

    const wrappedDisclaimer = doc.splitTextToSize(data.disclaimerText, pageWidth - margin * 2);
    doc.text(wrappedDisclaimer, margin, disclaimerY);

    disclaimerY += wrappedDisclaimer.length * 10;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text('Thank you for your business', pageWidth / 2, pageHeight - 24, { align: 'center' });

  const fileName = data.fileName || `Invoice-${data.invoiceNumber}.pdf`;
  doc.save(fileName);
}
