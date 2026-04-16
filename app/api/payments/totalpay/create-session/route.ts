import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

type TotalPayConfig = {
  enabled?: boolean;
  provider?: "none" | "totalpay";
  baseUrl?: string;
  createInvoiceEndpoint?: string;
  merchantId?: string;
  apiKey?: string;
  apiSecret?: string;
  successUrl?: string;
  cancelUrl?: string;
  webhookUrl?: string;
};

type PaymentGatewayConfig = {
  provider?: "none" | "totalpay";
  totalPay?: TotalPayConfig;
};

const toDateYMD = (date: Date) => date.toISOString().slice(0, 10);

const normalizeBaseUrl = (value: string) => {
  const trimmed = String(value || "").trim();

  try {
    const parsed = new URL(trimmed);
    return parsed.origin;
  } catch {
    return trimmed.replace(/\/+$/, "");
  }
};
const normalizeEndpoint = (value: string) => (value.startsWith("/") ? value : `/${value}`);

const getTotalPayConfig = async (branchId?: string): Promise<TotalPayConfig | null> => {
  let branchGateway: PaymentGatewayConfig | undefined;

  if (branchId) {
    const branchSnap = await adminDb.collection("branches").doc(branchId).get();
    if (branchSnap.exists) {
      branchGateway = branchSnap.data()?.paymentGateway as PaymentGatewayConfig | undefined;
    }
  }

  const globalSnap = await adminDb.collection("general").doc("settings").get();
  const globalGateway = globalSnap.exists
    ? (globalSnap.data()?.paymentGateway as PaymentGatewayConfig | undefined)
    : undefined;

  const branchTotalPay = branchGateway?.totalPay || {};
  const globalTotalPay = globalGateway?.totalPay || {};

  return {
    enabled: branchTotalPay.enabled ?? globalTotalPay.enabled ?? false,
    provider: branchGateway?.provider ?? globalGateway?.provider ?? "none",
    baseUrl: branchTotalPay.baseUrl || globalTotalPay.baseUrl || "",
    createInvoiceEndpoint:
      branchTotalPay.createInvoiceEndpoint || globalTotalPay.createInvoiceEndpoint || "/api/customer-invoices/create",
    merchantId: branchTotalPay.merchantId || globalTotalPay.merchantId || "",
    apiKey: branchTotalPay.apiKey || globalTotalPay.apiKey || "",
    apiSecret: branchTotalPay.apiSecret || globalTotalPay.apiSecret || "",
    successUrl: branchTotalPay.successUrl || globalTotalPay.successUrl || "",
    cancelUrl: branchTotalPay.cancelUrl || globalTotalPay.cancelUrl || "",
    webhookUrl: branchTotalPay.webhookUrl || globalTotalPay.webhookUrl || "",
  };
};

export async function POST(request: NextRequest) {
  try {
    const {
      branchId,
      amount,
      currency = "AED",
      customer,
      orderRef,
      returnUrl,
      cancelUrl,
      notes,
    } = await request.json();

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: "Valid amount is required." }, { status: 400 });
    }

    if (!customer?.name || !customer?.email || !customer?.phone) {
      return NextResponse.json(
        { error: "Customer name, email, and phone are required." },
        { status: 400 }
      );
    }

    const cfg = await getTotalPayConfig(branchId);

    if (!cfg || cfg.provider !== "totalpay" || !cfg.enabled) {
      return NextResponse.json(
        { error: "Card gateway is not enabled for this branch." },
        { status: 400 }
      );
    }

    if (!cfg.baseUrl || !cfg.merchantId || !cfg.apiKey || !cfg.apiSecret) {
      return NextResponse.json(
        { error: "TotalPay configuration is incomplete. Please check settings." },
        { status: 400 }
      );
    }

    const invoiceNumber = String(orderRef || `ORD-${Date.now()}`);
    const currentDate = new Date();
    const dueDate = new Date(currentDate);
    dueDate.setDate(dueDate.getDate() + 30);

    const payload = {
      paymentType: "one-time",
      invoiceDate: toDateYMD(currentDate),
      dueDate: toDateYMD(dueDate),
      merchantInfo: {
        merchantId: cfg.merchantId,
      },
      customerInfo: {
        name: String(customer.name),
        email: String(customer.email),
        phone: String(customer.phone),
      },
      itemList: [
        {
          invoiceNumber,
          currency: String(currency || "AED"),
          productOrService: "Online Order",
          price: Number(amount),
          quantity: 1,
        },
      ],
      additionalInfo: {
        notes: String(notes || "Order payment"),
      },
      successUrl: String(returnUrl || cfg.successUrl || ""),
      cancelUrl: String(cancelUrl || cfg.cancelUrl || ""),
      webhookUrl: String(cfg.webhookUrl || ""),
    };

    const endpoint = `${normalizeBaseUrl(cfg.baseUrl)}${normalizeEndpoint(
      cfg.createInvoiceEndpoint || "/api/customer-invoices/create"
    )}`;

    const basicAuth = Buffer.from(`${cfg.apiKey}:${cfg.apiSecret}`).toString("base64");

    const gatewayResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${basicAuth}`,
        "x-api-key": cfg.apiKey,
        "x-api-secret": cfg.apiSecret,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const rawText = await gatewayResponse.text();
    let data: any = {};

    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      data = { raw: rawText };
    }

    if (!gatewayResponse.ok) {
      return NextResponse.json(
        {
          error: data?.message || data?.error || "Failed to initialize card payment.",
          gatewayStatus: gatewayResponse.status,
        },
        { status: 502 }
      );
    }

    const paymentUrl =
      data?.checkout_url ||
      data?.payment_url ||
      data?.invoice_url ||
      data?.redirect_url ||
      data?.url ||
      data?.link ||
      data?.hosted_page_url ||
      data?.data?.checkout_url ||
      data?.data?.payment_url ||
      data?.data?.url;

    if (!paymentUrl || typeof paymentUrl !== "string") {
      return NextResponse.json(
        {
          error: "Gateway response did not include a payment URL.",
          response: data,
        },
        { status: 502 }
      );
    }

    const gatewayReference =
      data?.paymentPublicId ||
      data?.payment_public_id ||
      data?.transactionId ||
      data?.transaction_id ||
      data?.invoiceNumber ||
      data?.invoice_number ||
      data?.id ||
      invoiceNumber;

    return NextResponse.json({
      success: true,
      paymentUrl,
      gatewayReference,
      raw: data,
    });
  } catch (error: any) {
    console.error("TotalPay create session error:", error);
    return NextResponse.json(
      { error: error?.message || "Unable to create card payment session." },
      { status: 500 }
    );
  }
}
