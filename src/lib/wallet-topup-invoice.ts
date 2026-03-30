import { generateUnifiedInvoicePdf } from "@/lib/unified-invoice-pdf";

export const WALLET_TOPUP_WHATSAPP_SENDER_NUMBER = "+971543230365";

export interface WalletTopupInvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  amount: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  branchName?: string;
  discountPercent?: number;
  sourceNote?: string;
}

const sanitizePhone = (phone?: string): string => String(phone || "").replace(/[^0-9]/g, "");

export async function downloadWalletTopupInvoicePdf(
  data: WalletTopupInvoiceData
): Promise<void> {
  const discountLine =
    typeof data.discountPercent === "number" && data.discountPercent > 0
      ? `Unlocked service discount: ${data.discountPercent}% (active while wallet balance is above zero).`
      : "No service discount tier was unlocked for this top-up.";

  const sourceLine = data.sourceNote || "Invoice generated for eWallet top-up.";

  await generateUnifiedInvoicePdf({
    invoiceNumber: data.invoiceNumber,
    invoiceDate: data.invoiceDate,
    companyName: "MAN OF CAVE BARBERSHOP",
    customerName: data.customerName || "Customer",
    customerPhone: data.customerPhone || "",
    customerEmail: data.customerEmail || "",
    serviceDate: data.invoiceDate,
    serviceTime: "-",
    branchName: data.branchName || "Main Branch",
    items: [
      {
        description: "eWallet Top-up",
        quantity: 1,
        unitPrice: Number(data.amount || 0),
        lineTotal: Number(data.amount || 0),
        details: "Wallet credit added to customer account",
      },
    ],
    subtotal: Number(data.amount || 0),
    discountAmount: 0,
    taxAmount: 0,
    taxPercent: 0,
    serviceCharges: 0,
    tipAmount: 0,
    totalAmount: Number(data.amount || 0),
    paymentMethods: [
      {
        label: "Wallet Top-up",
        amount: Number(data.amount || 0),
      },
    ],
    notes: `${sourceLine}\n${discountLine}\nWhatsApp Desk: ${WALLET_TOPUP_WHATSAPP_SENDER_NUMBER}`,
    logoPath: "/manofcave.png",
    fileName: `Wallet-Topup-Invoice-${data.invoiceNumber}.pdf`,
  });
}

export function buildWalletTopupWhatsAppUrl(data: WalletTopupInvoiceData): string | null {
  const phone = sanitizePhone(data.customerPhone);
  if (!phone) {
    return null;
  }

  const amountText = Number(data.amount || 0).toFixed(2);
  const discountText =
    typeof data.discountPercent === "number" && data.discountPercent > 0
      ? `${data.discountPercent}% service discount unlocked while wallet balance remains.`
      : "No top-up discount tier was unlocked.";

  const message = [
    `Hello ${data.customerName || "Customer"},`,
    "Your eWallet top-up invoice is ready.",
    `Invoice Number: ${data.invoiceNumber}`,
    `Invoice Date: ${data.invoiceDate}`,
    `Top-up Amount: AED ${amountText}`,
    `Branch: ${data.branchName || "Main Branch"}`,
    discountText,
    `For assistance, message us on ${WALLET_TOPUP_WHATSAPP_SENDER_NUMBER}.`,
  ].join("\n");

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
