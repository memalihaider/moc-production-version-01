'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Calendar, Clock, User, ChevronLeft, ChevronRight, Settings, 
  RotateCcw, Users, PlusCircle, X, DollarSign, CheckCircle, 
  Scissors, Phone, Mail, MapPin, FileText, CreditCard, Calculator, 
  AlertCircle, Receipt, Trash2, Plus, Minus, Download, Hash, 
  Building, Tag, Package, Smartphone, Wallet, FileCheck, Printer,
  Search, Filter, Banknote, Coins, Smartphone as Mobile, QrCode,
  CheckSquare, Percent, CalendarDays, ClipboardList, MoreVertical, Pencil
} from "lucide-react";
import { format, addDays, startOfDay, addMinutes, isSameDay, parseISO } from "date-fns";
import { collection, getDocs, query, where, doc, getDoc, updateDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { generateUnifiedInvoicePdf } from "@/lib/unified-invoice-pdf";
import {
  buildWalletTopupWhatsAppUrl,
  downloadWalletTopupInvoicePdf,
  WALLET_TOPUP_WHATSAPP_SENDER_NUMBER,
  type WalletTopupInvoiceData,
} from "@/lib/wallet-topup-invoice";

interface Appointment {
  customerId?: string;
  staffName: any;
  staff: any;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  bookingDate: string;
  bookingTime: string;
  serviceName: string;
  serviceDetails: any;
  id: string | number;
  firebaseId?: string;
  customer: string;
  service: string;
  services?: string[];
  barber: string;
  date: string;
  time: string;
  duration: string;
  price: number;
  status: string;
  phone: string;
  email: string;
  notes: string;
  source: string;
  branch: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  staffId?: string;
  staffRole?: string;
  serviceCategory?: string;
  pointsAwarded?: boolean;
  cardLast4Digits?: string;
  trnNumber?: string;
  teamMembers?: Array<{name: string, tip: number}>;
  products?: Array<{name: string, category: string, price: number, quantity: number}>;
  paymentMethods?: Array<'cash' | 'card' | 'check' | 'digital' | 'wallet'>;
  paymentAmounts?: {
    Cash: number;
    Digital: number;
    Card: number;
    Check: number;
    cash: number;
    card: number;
    check: number;
    digital: number;
    wallet: number;
  };
  paymentMethod?: string;
  paymentStatus?: string;
  discount?: number;
  discountType?: 'fixed' | 'percentage';
  serviceTip?: number;
  serviceCharges?: number;
  tax?: number;
  servicePrice?: number;
  subtotal?: number;
  totalAmount?: number;
  taxAmount?: number;
  bookingNumber?: string;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  specialization: string[];
  branch: string;
  branchId?: string;
  userBranchId?: string;
  userBranchName?: string;
  branchNames?: string[];
  branches?: string[];
  avatar: string;
  status: string;
  rating: number;
  createdAt: any;
  updatedAt: any;
}

interface ServiceItem {
  id: string;
  name: string;
  category: string;
  categoryId: string;
  price: number;
  duration: number;
  description: string;
  status: string;
  branchNames: string[];
  branches: string[];
  popularity: string;
  imageUrl: string;
  revenue: number;
  totalBookings: number;
  createdAt: any;
  updatedAt: any;
}

// NEW: Branch interface
interface Branch {
  id: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  status?: string;
  openingTime?: string;
  closingTime?: string;
  weeklyTimings?: any;
}

interface AdvancedCalendarProps {
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
  onStatusChange: (appointmentId: string | number, newStatus: string) => void;
  onCreateBooking?: (barber: string, date: string, time: string) => void;
  onEditBooking?: (appointment: Appointment) => void;
  onDeleteBooking?: (appointment: Appointment) => void;
  onCheckoutBooking?: (appointment: Appointment) => void;
  onDownloadInvoiceBooking?: (appointment: Appointment) => void;
  onCloseBooking?: (appointment: Appointment) => void;
  staff?: StaffMember[];
  showFullDetails?: boolean;
  formatCurrency?: (amount: number) => string;
  /** When set, locks the calendar to this branch and hides the branch filter dropdown */
  lockedBranch?: string;
  paymentMethodAvailability?: {
    cash?: boolean;
    card?: boolean;
    check?: boolean;
    digital?: boolean;
    ewallet?: boolean;
  };
  calendarDisplaySettings?: {
    weeklyTimings?: {
      monday?: { open?: string; close?: string; opening?: string; closing?: string; closed?: boolean };
      tuesday?: { open?: string; close?: string; opening?: string; closing?: string; closed?: boolean };
      wednesday?: { open?: string; close?: string; opening?: string; closing?: string; closed?: boolean };
      thursday?: { open?: string; close?: string; opening?: string; closing?: string; closed?: boolean };
      friday?: { open?: string; close?: string; opening?: string; closing?: string; closed?: boolean };
      saturday?: { open?: string; close?: string; opening?: string; closing?: string; closed?: boolean };
      sunday?: { open?: string; close?: string; opening?: string; closing?: string; closed?: boolean };
    };
    timeSlotGap?: number;
    layoutMode?: 'time-top' | 'employee-top';
    businessHours?: { start: number; end: number };
    hiddenHours?: number[];
    totalValueDisplayMode?: 'both' | 'with-tax' | 'without-tax';
  };
  invoiceDisclaimerTemplate?: string;
}

type WeekdayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

const DEFAULT_WEEKLY_TIMINGS: Record<WeekdayKey, { open: string; close: string; closed: boolean }> = {
  monday: { open: '09:00', close: '22:00', closed: false },
  tuesday: { open: '09:00', close: '22:00', closed: false },
  wednesday: { open: '09:00', close: '22:00', closed: false },
  thursday: { open: '09:00', close: '22:00', closed: false },
  friday: { open: '09:00', close: '22:00', closed: false },
  saturday: { open: '09:00', close: '22:00', closed: false },
  sunday: { open: '09:00', close: '22:00', closed: false },
};

const WALLET_TOPUP_TIERS = [
  { amount: 1050, discountPercent: 20 },
  { amount: 2100, discountPercent: 20 },
  { amount: 3150, discountPercent: 25 },
  { amount: 5250, discountPercent: 30 },
];

const getWalletTopupTier = (amount: number) =>
  WALLET_TOPUP_TIERS.find((tier) => Math.abs(amount - tier.amount) < 0.01);

// INVOICE INTERFACES
interface InvoiceItem {
  tip: number;
  staff: string;
  duration: string;
  branch: string;
  id: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
}

interface PaymentMethod {
  type: 'cash' | 'card' | 'check' | 'digital' | 'wallet' | 'other';
  label: string;
  amount: number;
  details?: string;
}

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  trnNumber: string;
  service: string;
  services: string[];
  barber: string;
  serviceDate: string;
  serviceTime: string;
  duration: string;
  servicePrice: number;
  subtotal: number;
  discount: number;
  discountType: 'fixed' | 'percentage';
  tax: number;
  taxAmount: number;
  serviceTip: number;
  serviceCharges: number;
  totalAmount: number;
  cardLast4Digits: string;
  paymentMethods: PaymentMethod[];
  totalPaid: number;
  balanceDue: number;
  items: InvoiceItem[];
  notes: string;
  branch: string;
}

// PAYMENT METHOD ICONS
const PaymentMethodIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'cash':
      return <Banknote className="w-4 h-4" />;
    case 'card':
      return <CreditCard className="w-4 h-4" />;
    case 'check':
      return <FileCheck className="w-4 h-4" />;
    case 'digital':
      return <Mobile className="w-4 h-4" />;
    case 'wallet':
      return <Wallet className="w-4 h-4" />;
    default:
      return <Coins className="w-4 h-4" />;
  }
};

// PAYMENT METHOD COLORS
const getPaymentMethodColor = (type: string): string => {
  switch (type) {
    case 'cash': return 'bg-green-100 text-green-800 border-green-200';
    case 'card': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'check': return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'digital': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'wallet': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};


// INVOICE GENERATION POPUP COMPONENT - FINAL VERSION
const InvoiceGenerationPopup = ({ 
  appointment, 
  onClose,
  selectedBranchName,
  branchDirectory = [],
  formatCurrency = (amount) => `AED ${amount.toFixed(2)}`
}: { 
  appointment: Appointment | null; 
  onClose: () => void;
  selectedBranchName?: string;
  branchDirectory?: Branch[];
  formatCurrency?: (amount: number) => string;
}) => {
  const [loading, setLoading] = useState(true);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [servicesList, setServicesList] = useState<ServiceItem[]>([]);
  const [showServicesDropdown, setShowServicesDropdown] = useState(false);
  const [searchService, setSearchService] = useState("");
  const [showNewPaymentMethod, setShowNewPaymentMethod] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState({
    type: 'cash' as 'cash' | 'card' | 'check' | 'digital' | 'wallet' | 'other',
    label: '',
    amount: 0
  });
  const [customerDocId, setCustomerDocId] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletUseAmount, setWalletUseAmount] = useState(0);
  const [walletTopupAmount, setWalletTopupAmount] = useState(0);
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [invoiceBranchDetails, setInvoiceBranchDetails] = useState<Branch | null>(null);

  const normalizeText = (value: string | undefined | null) => (value || '').trim().toLowerCase();

  const computeInvoiceTotals = (
    subtotal: number,
    discountValue: number,
    discountType: 'fixed' | 'percentage',
    taxPercent: number,
    serviceCharges: number,
    serviceTip: number
  ) => {
    const safeSubtotal = Math.max(0, Number(subtotal || 0));
    const safeDiscountValue = Math.max(0, Number(discountValue || 0));
    const safeTaxPercent = Math.max(0, Number(taxPercent || 0));
    const safeServiceCharges = Math.max(0, Number(serviceCharges || 0));
    const safeServiceTip = Math.max(0, Number(serviceTip || 0));

    const discountAmount =
      discountType === 'percentage'
        ? Math.min(safeSubtotal, (safeSubtotal * safeDiscountValue) / 100)
        : Math.min(safeSubtotal, safeDiscountValue);

    const taxableAmount = Math.max(0, safeSubtotal - discountAmount);
    const taxAmount = (taxableAmount * safeTaxPercent) / 100;
    const totalAmount = taxableAmount + taxAmount + safeServiceCharges + safeServiceTip;

    return { discountAmount, taxAmount, totalAmount };
  };
  
  const generateInvoiceNumber = () => {
    return `INV-${Date.now().toString().slice(-8)}`;
  };
  
  useEffect(() => {
    if (appointment) {
      initializeInvoiceData();
      fetchServicesFromFirebase();
    }
  }, [appointment]);
  
  const fetchServicesFromFirebase = async () => {
    try {
      const servicesRef = collection(db, "services");
      const q = query(servicesRef, where("status", "==", "active"));
      const querySnapshot = await getDocs(q);
      
      const services: ServiceItem[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        services.push({
          id: doc.id,
          name: data.name || "",
          category: data.category || "",
          categoryId: data.categoryId || "",
          price: data.price || 0,
          duration: data.duration || 0,
          description: data.description || "",
          status: data.status || "active",
          branchNames: Array.isArray(data.branchNames) ? data.branchNames : [],
          branches: Array.isArray(data.branches) ? data.branches : [],
          popularity: data.popularity || "low",
          imageUrl: data.imageUrl || "",
          revenue: data.revenue || 0,
          totalBookings: data.totalBookings || 0,
          createdAt: data.createdAt || new Date(),
          updatedAt: data.updatedAt || new Date()
        });
      });
      
      setServicesList(services);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };
  
  const initializeInvoiceData = async () => {
    if (!appointment) return;
    
    setLoading(true);
    setPaymentProcessed(false);
    setProcessingPayment(false);
    setWalletUseAmount(0);
    setWalletTopupAmount(0);
    try {
      let freshData = appointment;
      if (appointment.firebaseId) {
        const bookingRef = doc(db, "bookings", appointment.firebaseId);
        const bookingSnap = await getDoc(bookingRef);
        
        if (bookingSnap.exists()) {
          const firebaseData = bookingSnap.data();
          freshData = {
            ...appointment,
            servicePrice: firebaseData.servicePrice || 0,
            subtotal: firebaseData.subtotal || firebaseData.servicePrice || 0,
            totalAmount: firebaseData.totalAmount || firebaseData.servicePrice || 0,
            taxAmount: firebaseData.taxAmount || 0,
            serviceCharges: firebaseData.serviceCharges || 0,
            discount: firebaseData.discount || 0,
            discountType: firebaseData.discountType || appointment.discountType || 'fixed',
            tax: firebaseData.tax || 5,
            cardLast4Digits: firebaseData.cardLast4Digits || '',
            trnNumber: firebaseData.trnNumber || '',
            paymentAmounts: firebaseData.paymentAmounts || {}
          };
        }
      }
      
      // Create items array from serviceDetails with all fields
      const items: InvoiceItem[] = [];
      
      const effectiveBranchName =
        selectedBranchName && selectedBranchName !== 'all'
          ? selectedBranchName
          : (freshData.branch || freshData.serviceDetails?.[0]?.branch || 'Main Branch');

      const matchedBranch = branchDirectory.find(
        (branch) => normalizeText(branch.name) === normalizeText(effectiveBranchName)
      ) || null;
      setInvoiceBranchDetails(matchedBranch);

      if (freshData.serviceDetails && freshData.serviceDetails.length > 0) {
        freshData.serviceDetails.forEach((service: any, index: number) => {
          items.push({
            id: `service-${index}-${Date.now()}`,
            description: service.name,
            branch: service.branch || effectiveBranchName,
            staff: service.staff || freshData.staffName || freshData.staff || freshData.barber || 'Not Assigned',
            duration: service.duration ? `${service.duration} min` : freshData.duration || '60 min',
            quantity: 1,
            price: service.price || 0,
            total: service.price || 0,
            tip: 0
          });
        });
      } else {
        items.push({
          id: `service-1-${Date.now()}`,
          description: freshData.service || 'Service',
          branch: effectiveBranchName,
          staff: freshData.staffName || freshData.staff || freshData.barber || 'Not Assigned',
          duration: freshData.duration || '60 min',
          quantity: 1,
          price: freshData.servicePrice || freshData.price || 0,
          total: freshData.servicePrice || freshData.price || 0,
          tip: 0
        });
      }
      
      
      // Create payment methods from paymentAmounts
const paymentMethods: PaymentMethod[] = [];
const paymentAmounts = freshData.paymentAmounts || {};

// Safe way to access properties with type assertion
const amounts = paymentAmounts as any;

if (amounts.Cash > 0 || amounts.cash > 0) {
  paymentMethods.push({
    type: 'cash',
    label: 'Cash',
    amount: amounts.Cash || amounts.cash || 0
  });
}

if (amounts.Digital > 0 || amounts.digital > 0) {
  paymentMethods.push({
    type: 'digital',
    label: 'Digital Payment',
    amount: amounts.Digital || amounts.digital || 0
  });
}

if (amounts.Card > 0 || amounts.card > 0) {
  paymentMethods.push({
    type: 'card',
    label: 'Card Payment',
    amount: amounts.Card || amounts.card || 0,
    details: freshData.cardLast4Digits ? `****${freshData.cardLast4Digits}` : ''
  });
}

if (amounts.Check > 0 || amounts.check > 0) {
  paymentMethods.push({
    type: 'check',
    label: 'Check',
    amount: amounts.Check || amounts.check || 0
  });
}
      
      const subtotal = Number(freshData.subtotal ?? items.reduce((sum, item) => sum + item.total, 0));
      const totalTips = items.reduce((sum, item) => sum + (item.tip || 0), 0);

      const effectiveDiscountType: 'fixed' | 'percentage' =
        freshData.discountType === 'percentage' ? 'percentage' : 'fixed';
      const effectiveDiscount = Number(freshData.discount || 0);
      const effectiveTax = Number(freshData.tax || 5);
      const effectiveServiceCharges = Number(freshData.serviceCharges || 0);

      const { taxAmount, totalAmount } = computeInvoiceTotals(
        subtotal,
        effectiveDiscount,
        effectiveDiscountType,
        effectiveTax,
        effectiveServiceCharges,
        totalTips
      );
      const totalPaid = paymentMethods.reduce((sum, pm) => sum + pm.amount, 0);
      
      setInvoiceData({
        invoiceNumber: generateInvoiceNumber(),
        invoiceDate: new Date().toISOString().split('T')[0],
        customerName: freshData.customerName || freshData.customer,
        customerEmail: freshData.customerEmail || freshData.email || '',
        customerPhone: freshData.customerPhone || freshData.phone || '',
        customerAddress: matchedBranch
          ? `${matchedBranch.address || matchedBranch.name}${matchedBranch.city ? `, ${matchedBranch.city}` : ''}${matchedBranch.country ? `, ${matchedBranch.country}` : ''}`
          : `${effectiveBranchName}, Abu Dhabi, UAE`,
        trnNumber: freshData.trnNumber || '',
        service: freshData.service || '',
        services: freshData.services || [freshData.service],
        barber: freshData.staffName || freshData.staff || freshData.barber,
        serviceDate: freshData.bookingDate || freshData.date,
        serviceTime: freshData.bookingTime || freshData.time,
        duration: freshData.duration || '60 min',
        servicePrice: freshData.servicePrice || freshData.price || 0,
        subtotal,
        discount: effectiveDiscount,
        discountType: effectiveDiscountType,
        tax: effectiveTax,
        taxAmount,
        serviceTip: totalTips,
        serviceCharges: effectiveServiceCharges,
        totalAmount,
        cardLast4Digits: freshData.cardLast4Digits || '',
        paymentMethods,
        totalPaid,
        balanceDue: totalAmount - totalPaid,
        items,
        notes: freshData.notes || '',
        branch: effectiveBranchName
      });

      const customerEmail = freshData.customerEmail || freshData.email;
      if (customerEmail) {
        const customersRef = collection(db, "customers");
        const customerQ = query(customersRef, where("email", "==", customerEmail));
        const customerSnapshot = await getDocs(customerQ);

        if (!customerSnapshot.empty) {
          const customerDoc = customerSnapshot.docs[0];
          const customerData = customerDoc.data() as any;
          setCustomerDocId(customerDoc.id);
          setWalletBalance(Number(customerData.walletBalance || customerData.wallet || 0));
        } else {
          setCustomerDocId(null);
          setWalletBalance(0);
        }
      } else {
        setCustomerDocId(null);
        setWalletBalance(0);
      }
      
    } catch (error) {
      console.error("Error initializing invoice:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const addServiceFromList = (service: ServiceItem) => {
    if (!invoiceData) return;
    
    const newItem: InvoiceItem = {
      id: `service-${Date.now()}`,
      description: service.name,
      branch: service.branchNames?.[0] || invoiceData.branch || 'Main Branch',
      staff: invoiceData.barber || 'Not Assigned',
      duration: `${service.duration} min`,
      quantity: 1,
      price: service.price || 0,
      total: service.price || 0,
      tip: 0
    };
    
    const updatedItems = [...invoiceData.items, newItem];
    updateInvoiceWithItems(updatedItems);
    setShowServicesDropdown(false);
    setSearchService("");
  };
  
  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    if (!invoiceData) return;
    
    const updatedItems = invoiceData.items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'price') {
          updatedItem.total = updatedItem.quantity * updatedItem.price;
        }
        return updatedItem;
      }
      return item;
    });
    
    updateInvoiceWithItems(updatedItems);
  };
  
  const updateItemTip = (id: string, tipValue: number) => {
    if (!invoiceData) return;
    
    const updatedItems = invoiceData.items.map(item => {
      if (item.id === id) {
        return { ...item, tip: tipValue };
      }
      return item;
    });
    
    updateInvoiceWithItems(updatedItems);
  };
  
  const removeItem = (id: string) => {
    if (!invoiceData) return;
    const updatedItems = invoiceData.items.filter(item => item.id !== id);
    updateInvoiceWithItems(updatedItems);
  };
  
  const updateInvoiceWithItems = (items: InvoiceItem[]) => {
    if (!invoiceData) return;
    
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const totalTips = items.reduce((sum, item) => sum + (item.tip || 0), 0);

    const { taxAmount, totalAmount } = computeInvoiceTotals(
      subtotal,
      invoiceData.discount,
      invoiceData.discountType,
      invoiceData.tax,
      invoiceData.serviceCharges,
      totalTips
    );
    const totalPaid = invoiceData.paymentMethods.reduce((sum, pm) => sum + pm.amount, 0);
    
    setInvoiceData({
      ...invoiceData,
      items,
      subtotal,
      taxAmount,
      serviceTip: totalTips,
      totalAmount,
      totalPaid,
      balanceDue: totalAmount - totalPaid
    });
  };
  
  const addPaymentMethod = () => {
    if (!invoiceData) return;
    
    if (!newPaymentMethod.label) {
      alert("Please enter payment method name");
      return;
    }
    
    const newPayment: PaymentMethod = {
      type: newPaymentMethod.type,
      label: newPaymentMethod.label,
      amount: newPaymentMethod.amount || 0
    };
    
    const updatedPayments = [...invoiceData.paymentMethods, newPayment];
    const totalPaid = updatedPayments.reduce((sum, pm) => sum + pm.amount, 0);
    
    setInvoiceData({
      ...invoiceData,
      paymentMethods: updatedPayments,
      totalPaid,
      balanceDue: invoiceData.totalAmount - totalPaid
    });
    
    setNewPaymentMethod({
      type: 'cash',
      label: '',
      amount: 0
    });
    setShowNewPaymentMethod(false);
  };
  
  const updatePaymentMethod = (index: number, amount: number) => {
    if (!invoiceData) return;
    
    const updatedPayments = [...invoiceData.paymentMethods];
    updatedPayments[index] = { ...updatedPayments[index], amount };
    
    const totalPaid = updatedPayments.reduce((sum, pm) => sum + pm.amount, 0);
    
    setInvoiceData({
      ...invoiceData,
      paymentMethods: updatedPayments,
      totalPaid,
      balanceDue: invoiceData.totalAmount - totalPaid
    });
  };
  
  const removePaymentMethod = (index: number) => {
    if (!invoiceData) return;
    
    const updatedPayments = invoiceData.paymentMethods.filter((_, i) => i !== index);
    const totalPaid = updatedPayments.reduce((sum, pm) => sum + pm.amount, 0);
    
    setInvoiceData({
      ...invoiceData,
      paymentMethods: updatedPayments,
      totalPaid,
      balanceDue: invoiceData.totalAmount - totalPaid
    });
  };

  const applyWalletUsage = (amount: number) => {
    if (!invoiceData) return;

    const safeAmount = Math.max(0, Math.min(amount, walletBalance));
    setWalletUseAmount(safeAmount);

    const nonWalletMethods: PaymentMethod[] = invoiceData.paymentMethods.filter(
      (method) => method.type !== 'wallet'
    );
    const walletMethod: PaymentMethod = {
      type: 'wallet',
      label: 'Digital Wallet',
      amount: safeAmount,
    };
    const updatedMethods: PaymentMethod[] = safeAmount > 0
      ? [...nonWalletMethods, walletMethod]
      : nonWalletMethods;
    const totalPaid = updatedMethods.reduce((sum, method) => sum + method.amount, 0);

    setInvoiceData({
      ...invoiceData,
      paymentMethods: updatedMethods,
      totalPaid,
      balanceDue: Math.max(0, invoiceData.totalAmount - totalPaid)
    });
  };

  const handleProceedPay = async () => {
    if (!invoiceData || !appointment?.firebaseId) return;
    if (invoiceData.totalPaid <= 0) {
      alert('Add at least one payment amount before proceeding.');
      return;
    }

    setProcessingPayment(true);
    try {
      const paymentAmounts = invoiceData.paymentMethods.reduce((acc, method) => {
        acc[method.type] = (acc[method.type] || 0) + method.amount;
        return acc;
      }, {} as Record<string, number>);

      const bookingRef = doc(db, "bookings", appointment.firebaseId);
      await updateDoc(bookingRef, {
        paymentMethods: invoiceData.paymentMethods.map((method) => method.type),
        paymentMethod: invoiceData.paymentMethods.map((method) => method.label).join(', '),
        paymentAmounts,
        paymentStatus: invoiceData.totalPaid >= invoiceData.totalAmount ? 'paid' : 'partial',
        status: invoiceData.totalPaid >= invoiceData.totalAmount ? 'completed' : appointment.status,
        updatedAt: new Date()
      });

      if (customerDocId) {
        const customerRef = doc(db, "customers", customerDocId);
        const balanceAfterUse = Math.max(0, walletBalance - walletUseAmount);
        const finalBalance = balanceAfterUse + Math.max(0, walletTopupAmount);

        await updateDoc(customerRef, {
          walletBalance: finalBalance,
          updatedAt: new Date()
        });

        setWalletBalance(finalBalance);
        setWalletTopupAmount(0);
      }

      setPaymentProcessed(true);
    } catch (error) {
      console.error("Error processing payment:", error);
      alert('Failed to process payment. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleSendInvoiceEmail = () => {
    alert('Invoice email sent successfully.');
  };
  
  const updateDiscount = (value: number) => {
    if (!invoiceData) return;

    const { taxAmount, totalAmount } = computeInvoiceTotals(
      invoiceData.subtotal,
      value,
      invoiceData.discountType,
      invoiceData.tax,
      invoiceData.serviceCharges,
      invoiceData.serviceTip
    );
    
    setInvoiceData({
      ...invoiceData,
      discount: value,
      taxAmount,
      totalAmount,
      balanceDue: totalAmount - invoiceData.totalPaid
    });
  };
  
  const updateTax = (value: number) => {
    if (!invoiceData) return;

    const { taxAmount, totalAmount } = computeInvoiceTotals(
      invoiceData.subtotal,
      invoiceData.discount,
      invoiceData.discountType,
      value,
      invoiceData.serviceCharges,
      invoiceData.serviceTip
    );
    
    setInvoiceData({
      ...invoiceData,
      tax: value,
      taxAmount,
      totalAmount,
      balanceDue: totalAmount - invoiceData.totalPaid
    });
  };
  
  const updateServiceCharges = (value: number) => {
    if (!invoiceData) return;

    const { totalAmount } = computeInvoiceTotals(
      invoiceData.subtotal,
      invoiceData.discount,
      invoiceData.discountType,
      invoiceData.tax,
      value,
      invoiceData.serviceTip
    );
    
    setInvoiceData({
      ...invoiceData,
      serviceCharges: value,
      totalAmount,
      balanceDue: totalAmount - invoiceData.totalPaid
    });
  };
  
 const generatePDF = async () => {
  if (!invoiceData) return;

  const discountAmount =
    invoiceData.discountType === 'percentage'
      ? Math.min(invoiceData.subtotal, (invoiceData.subtotal * invoiceData.discount) / 100)
      : Math.min(invoiceData.subtotal, invoiceData.discount);

  const tipsFromLines = invoiceData.items.reduce((sum, item) => sum + Number(item.tip || 0), 0);
  const tipAmount = Number(invoiceData.serviceTip || 0) + tipsFromLines;

  await generateUnifiedInvoicePdf({
    invoiceNumber: invoiceData.invoiceNumber,
    invoiceDate: invoiceData.invoiceDate,
    companyName: invoiceBranchDetails?.name || invoiceData.branch || 'MAN OF CAVE BARBERSHOP',
    companyAddress: invoiceBranchDetails?.address || '',
    companyCityCountry: [invoiceBranchDetails?.city, invoiceBranchDetails?.country].filter(Boolean).join(', '),
    companyPhone: invoiceBranchDetails?.phone || '',
    companyEmail: invoiceBranchDetails?.email || '',
    trnNumber: invoiceData.trnNumber || '',
    customerName: invoiceData.customerName,
    customerPhone: invoiceData.customerPhone,
    customerEmail: invoiceData.customerEmail,
    serviceDate: invoiceData.serviceDate,
    serviceTime: invoiceData.serviceTime,
    branchName: invoiceData.branch || invoiceBranchDetails?.name || 'Main Branch',
    items: invoiceData.items.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity || 1),
      unitPrice: Number(item.price || 0),
      lineTotal: Number(item.total || 0) + Number(item.tip || 0),
      details: `${item.branch || 'Main Branch'} | ${item.staff || 'Not Assigned'} | ${item.duration || '60 min'}`,
    })),
    subtotal: Number(invoiceData.subtotal || 0),
    discountAmount,
    taxAmount: Number(invoiceData.taxAmount || 0),
    taxPercent: Number(invoiceData.tax || 0),
    serviceCharges: Number(invoiceData.serviceCharges || 0),
    tipAmount,
    totalAmount: Number(invoiceData.totalAmount || 0),
    paymentMethods: invoiceData.paymentMethods.map((method) => ({
      label: method.label,
      amount: Number(method.amount || 0),
    })),
    notes: invoiceData.notes,
    logoPath: '/manofcave.png',
    fileName: `Invoice-${invoiceData.invoiceNumber}.pdf`,
  });
};
  
  const filteredServices = servicesList.filter(service =>
    service.name.toLowerCase().includes(searchService.toLowerCase())
  );
  
  if (!appointment || !invoiceData) return null;
  
  return (
    <Sheet open={true} onOpenChange={onClose}>
      {/* Sheet full width - whole page */}
      <SheetContent className="w-full sm:max-w-full p-0 overflow-y-auto">
        <SheetTitle className="sr-only">Generate Invoice</SheetTitle>
        
        {/* Header */}
        <div className="sticky top-0 bg-white border-b z-10 px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Receipt className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Generate Invoice</h2>
                <p className="text-base text-gray-500">
                  {invoiceData.invoiceNumber}
                </p>
              </div>
            </div>
            {loading && (
              <Badge className="bg-blue-500 animate-pulse text-base px-4 py-2">Loading...</Badge>
            )}
          </div>
        </div>

        <div className="p-8 space-y-8">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-6"></div>
                <p className="text-xl text-gray-600">Loading invoice data...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Customer Details Section - Branch and Barber REMOVED */}
              <div className="bg-white border rounded-xl p-6">
                <h3 className="text-base font-semibold text-gray-700 mb-5 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Customer Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Name</p>
                    <Input
                      value={invoiceData.customerName}
                      onChange={(e) => setInvoiceData({...invoiceData, customerName: e.target.value})}
                      className="h-10 text-base"
                      placeholder="Customer name"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    <Input
                      type="email"
                      value={invoiceData.customerEmail}
                      onChange={(e) => setInvoiceData({...invoiceData, customerEmail: e.target.value})}
                      className="h-10 text-base"
                      placeholder="Email address"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Phone</p>
                    <Input
                      value={invoiceData.customerPhone}
                      onChange={(e) => setInvoiceData({...invoiceData, customerPhone: e.target.value})}
                      className="h-10 text-base"
                      placeholder="Phone number"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Date</p>
                    <Input
                      type="date"
                      value={invoiceData.serviceDate}
                      onChange={(e) => setInvoiceData({...invoiceData, serviceDate: e.target.value})}
                      className="h-10 text-base"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Time</p>
                    <Input
                      type="time"
                      value={invoiceData.serviceTime}
                      onChange={(e) => setInvoiceData({...invoiceData, serviceTime: e.target.value})}
                      className="h-10 text-base"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-xl p-6">
                <h3 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-600" />
                  Branch Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Branch</p>
                    <p className="font-medium text-gray-900">{invoiceBranchDetails?.name || invoiceData.branch || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">{invoiceBranchDetails?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium text-gray-900 break-all">{invoiceBranchDetails?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Address</p>
                    <p className="font-medium text-gray-900">
                      {invoiceBranchDetails
                        ? `${invoiceBranchDetails.address || ''}${invoiceBranchDetails.city ? `, ${invoiceBranchDetails.city}` : ''}${invoiceBranchDetails.country ? `, ${invoiceBranchDetails.country}` : ''}`
                        : (invoiceData.customerAddress || 'N/A')}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Services Table - WITH ALL COLUMNS */}
              <div className="bg-white border rounded-xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-semibold text-gray-700 flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-blue-600" />
                    Services
                  </h3>
                  <Button 
                    size="default"
                    variant="outline"
                    onClick={() => setShowServicesDropdown(true)}
                    className="flex items-center gap-2 text-base h-10"
                  >
                    <Plus className="w-4 h-4" />
                    Add Service
                  </Button>
                </div>
                
                {/* Services Dropdown */}
                {showServicesDropdown && (
                  <div className="mb-5 p-5 bg-gray-50 border rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-base">Select Service to Add</h4>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowServicesDropdown(false)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                    
                    <div className="relative mb-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        placeholder="Search services..."
                        value={searchService}
                        onChange={(e) => setSearchService(e.target.value)}
                        className="pl-10 h-10 text-base"
                      />
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto space-y-3">
                      {filteredServices.map((service) => (
                        <div 
                          key={service.id}
                          className="p-4 bg-white border rounded-lg hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                          onClick={() => addServiceFromList(service)}
                        >
                          <div>
                            <p className="font-medium text-base">{service.name}</p>
                            <p className="text-sm text-gray-500">{service.category} • {service.duration} min</p>
                          </div>
                          <p className="font-bold text-green-600 text-lg">{formatCurrency(service.price)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="overflow-x-auto">
                  <table className="w-full text-base">
                    <thead className="bg-gray-50 border-y">
                      <tr>
                        <th className="px-4 py-4 text-left text-sm font-medium text-gray-500">Service</th>
                        <th className="px-4 py-4 text-left text-sm font-medium text-gray-500">Branch</th>
                        <th className="px-4 py-4 text-left text-sm font-medium text-gray-500">Staff</th>
                        <th className="px-4 py-4 text-center text-sm font-medium text-gray-500 w-24">Duration</th>
                        <th className="px-4 py-4 text-center text-sm font-medium text-gray-500 w-20">Qty</th>
                        <th className="px-4 py-4 text-right text-sm font-medium text-gray-500 w-28">Price</th>
                        <th className="px-4 py-4 text-right text-sm font-medium text-gray-500 w-28">Tip (AED)</th>
                        <th className="px-4 py-4 text-right text-sm font-medium text-gray-500 w-28">Total</th>
                        <th className="px-4 py-4 text-center w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {invoiceData.items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <Input
                              value={item.description}
                              onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                              className="h-9 text-base"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              value={item.branch || invoiceData.branch}
                              onChange={(e) => updateItem(item.id, 'branch', e.target.value)}
                              className="h-9 text-base"
                              placeholder="Branch"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              value={item.staff || invoiceData.barber}
                              onChange={(e) => updateItem(item.id, 'staff', e.target.value)}
                              className="h-9 text-base"
                              placeholder="Staff"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              value={item.duration || '60 min'}
                              onChange={(e) => updateItem(item.id, 'duration', e.target.value)}
                              className="h-9 text-base text-center"
                              placeholder="Duration"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                              className="h-9 text-base text-center"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                              className="h-9 text-base text-right"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.tip || 0}
                              onChange={(e) => updateItemTip(item.id, parseFloat(e.target.value) || 0)}
                              className="h-9 text-base text-right border-blue-200 focus:border-blue-500"
                              placeholder="0.00"
                            />
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-base">
                            {formatCurrency(item.total + (item.tip || 0))}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              className="h-9 w-9 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Tips Summary */}
                {invoiceData.serviceTip > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg flex justify-between items-center">
                    <span className="text-base font-medium text-blue-700">Total Tips:</span>
                    <span className="text-xl font-bold text-blue-700">{formatCurrency(invoiceData.serviceTip)}</span>
                  </div>
                )}
              </div>
              
              {/* Payment Methods */}
              <div className="bg-white border rounded-xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-semibold text-gray-700 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    Payment Methods
                  </h3>
                  <Button 
                    size="default"
                    variant="outline"
                    onClick={() => setShowNewPaymentMethod(true)}
                    className="flex items-center gap-2 text-base h-10"
                  >
                    <Plus className="w-4 h-4" />
                    Add Method
                  </Button>
                </div>
                
                {/* New Payment Method Form */}
                {showNewPaymentMethod && (
                  <div className="mb-5 p-5 bg-gray-50 border rounded-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-base">Add Payment Method</h4>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowNewPaymentMethod(false)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Type</p>
                        <Select
                          value={newPaymentMethod.type}
                          onValueChange={(value: any) => setNewPaymentMethod({...newPaymentMethod, type: value})}
                        >
                          <SelectTrigger className="h-10 text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="digital">Digital</SelectItem>
                            <SelectItem value="check">Check</SelectItem>
                            <SelectItem value="wallet">Wallet</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Name</p>
                        <Input
                          value={newPaymentMethod.label}
                          onChange={(e) => setNewPaymentMethod({...newPaymentMethod, label: e.target.value})}
                          placeholder="e.g., Credit Card"
                          className="h-10 text-base"
                        />
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Amount</p>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={newPaymentMethod.amount}
                          onChange={(e) => setNewPaymentMethod({...newPaymentMethod, amount: parseFloat(e.target.value) || 0})}
                          className="h-10 text-base"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button onClick={addPaymentMethod} size="default" className="bg-green-600 text-base h-10 px-6">
                        Add Payment Method
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  {invoiceData.paymentMethods.map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          payment.type === 'cash' ? 'bg-green-100' :
                          payment.type === 'digital' ? 'bg-purple-100' :
                          payment.type === 'card' ? 'bg-blue-100' : 
                          payment.type === 'check' ? 'bg-orange-100' : 'bg-gray-100'
                        }`}>
                          {payment.type === 'cash' && <DollarSign className="w-5 h-5 text-green-600" />}
                          {payment.type === 'digital' && <Smartphone className="w-5 h-5 text-purple-600" />}
                          {payment.type === 'card' && <CreditCard className="w-5 h-5 text-blue-600" />}
                          {payment.type === 'check' && <FileText className="w-5 h-5 text-orange-600" />}
                          {payment.type === 'wallet' && <Wallet className="w-5 h-5 text-indigo-600" />}
                          {payment.type === 'other' && <Coins className="w-5 h-5 text-gray-600" />}
                        </div>
                        <div>
                          <p className="font-medium text-base">{payment.label}</p>
                          {payment.details && (
                            <p className="text-sm text-gray-500">{payment.details}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={payment.amount}
                          onChange={(e) => updatePaymentMethod(index, parseFloat(e.target.value) || 0)}
                          className="w-28 h-9 text-base text-right"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePaymentMethod(index)}
                          className="h-9 w-9 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {invoiceData.paymentMethods.length === 0 && !showNewPaymentMethod && (
                    <div className="text-center p-5 bg-gray-50 rounded-lg">
                      <p className="text-base text-gray-500">No payment methods added</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Wallet */}
              <div className="bg-white border rounded-xl p-6">
                <h3 className="text-base font-semibold text-gray-700 mb-5 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-indigo-600" />
                  Wallet
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Current Balance</p>
                    <div className="h-10 px-3 flex items-center rounded-md border bg-indigo-50 text-indigo-700 font-semibold">
                      {formatCurrency(walletBalance)}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Use Wallet</p>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      max={walletBalance}
                      value={walletUseAmount}
                      onChange={(e) => applyWalletUsage(parseFloat(e.target.value) || 0)}
                      className="h-10 text-base"
                    />
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Top-up Wallet</p>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={walletTopupAmount}
                      onChange={(e) => setWalletTopupAmount(parseFloat(e.target.value) || 0)}
                      className="h-10 text-base"
                    />
                  </div>
                </div>
              </div>
              
              {/* Discount, Tax, Service Charges */}
              <div className="bg-white border rounded-xl p-6">
                <h3 className="text-base font-semibold text-gray-700 mb-5 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  Charges & Discounts
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Discount (%)</p>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={invoiceData.discount}
                      onChange={(e) => updateDiscount(parseFloat(e.target.value) || 0)}
                      className="h-10 text-base"
                    />
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Tax (%)</p>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={invoiceData.tax}
                      onChange={(e) => updateTax(parseFloat(e.target.value) || 0)}
                      className="h-10 text-base"
                    />
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Service Charges</p>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={invoiceData.serviceCharges}
                      onChange={(e) => updateServiceCharges(parseFloat(e.target.value) || 0)}
                      className="h-10 text-base"
                    />
                  </div>
                </div>
              </div>
              
              {/* TRN Number & Card Last 4 */}
              <div className="bg-white border rounded-xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">TRN Number</p>
                    <Input
                      value={invoiceData.trnNumber}
                      onChange={(e) => setInvoiceData({...invoiceData, trnNumber: e.target.value})}
                      placeholder="Enter TRN number"
                      className="h-10 text-base"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Card Last 4 Digits</p>
                    <Input
                      value={invoiceData.cardLast4Digits}
                      onChange={(e) => setInvoiceData({...invoiceData, cardLast4Digits: e.target.value})}
                      maxLength={4}
                      placeholder="1234"
                      className="h-10 text-base"
                    />
                  </div>
                </div>
              </div>
              
              {/* Summary */}
              <div className="bg-linear-to-r from-blue-50 to-indigo-50 border rounded-xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Subtotal</p>
                    <p className="text-2xl font-bold text-blue-700">{formatCurrency(invoiceData.subtotal)}</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Tips</p>
                    <p className="text-xl font-semibold text-green-600">{formatCurrency(invoiceData.serviceTip)}</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Paid</p>
                    <p className="text-xl font-semibold text-green-600">{formatCurrency(invoiceData.totalPaid)}</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-blue-700">{formatCurrency(invoiceData.totalAmount)}</p>
                  </div>
                </div>
                
                {invoiceData.balanceDue > 0 && (
                  <div className="mt-4 p-3 bg-yellow-100 rounded-lg text-center">
                    <p className="text-base text-yellow-800">
                      Balance Due: {formatCurrency(invoiceData.balanceDue)}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Notes */}
              <div className="bg-white border rounded-xl p-6">
                <p className="text-sm text-gray-500 mb-2">Notes</p>
                <Textarea
                  value={invoiceData.notes}
                  onChange={(e) => setInvoiceData({...invoiceData, notes: e.target.value})}
                  placeholder="Add any notes..."
                  rows={3}
                  className="text-base"
                />
              </div>
              
              {/* Actions */}
              <div className="flex justify-end gap-4 pt-6">
                {!paymentProcessed ? (
                  <>
                    <Button variant="outline" onClick={onClose} size="lg" className="text-base h-12 px-8">
                      Void / Back
                    </Button>
                    <Button
                      onClick={handleProceedPay}
                      disabled={processingPayment || invoiceData.totalPaid <= 0}
                      className="bg-blue-600 hover:bg-blue-700 text-white gap-3 text-base h-12 px-8"
                      size="lg"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {processingPayment ? 'Processing...' : 'Proceed Pay'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={onClose} size="lg" className="text-base h-12 px-8">
                      Close
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleSendInvoiceEmail}
                      className="gap-2 text-base h-12 px-8"
                      size="lg"
                    >
                      <Mail className="w-5 h-5" />
                      Send Invoice Email
                    </Button>
                    <Button
                      onClick={generatePDF}
                      className="bg-green-600 hover:bg-green-700 text-white gap-3 text-base h-12 px-8"
                      size="lg"
                    >
                      <Printer className="w-5 h-5" />
                      Print / Download Invoice
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};




  

// ADVANCE CALENDAR POPUP COMPONENT - WITH RESCHEDULE FUNCTIONALITY
const AdvanceCalendarPopup = ({ 
  appointment, 
  onClose,
  onStatusChange,
  initialAction,
  onGenerateInvoice,
  formatCurrency = (amount) => `AED ${amount.toFixed(2)}`
}: { 
  appointment: Appointment | null; 
  onClose: () => void;
  onStatusChange?: (appointmentId: string | number, newStatus: string) => void;
  initialAction?: 'reschedule' | null;
  onGenerateInvoice?: (appointment: Appointment) => void;
  formatCurrency?: (amount: number) => string;
}) => {
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [freshAppointment, setFreshAppointment] = useState<Appointment | null>(null);
  
  // ✅ NEW: Reschedule state
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduling, setRescheduling] = useState(false);
  
  const [paymentDetails, setPaymentDetails] = useState<{
    methods: PaymentMethod[];
    totalPaid: number;
    balanceDue: number;
    paymentStatus: string;
    paymentMethod: string;
  }>({
    methods: [],
    totalPaid: 0,
    balanceDue: 0,
    paymentStatus: '',
    paymentMethod: ''
  });
  
  useEffect(() => {
    if (appointment?.firebaseId) {
      fetchFreshData();
    }
  }, [appointment]);

  useEffect(() => {
    if (!appointment || initialAction !== 'reschedule') return;
    setRescheduleDate(appointment.bookingDate || appointment.date || '');
    setRescheduleTime(appointment.bookingTime || appointment.time || '');
    setShowRescheduleDialog(true);
  }, [appointment, initialAction]);
  
  const fetchFreshData = async () => {
    if (!appointment?.firebaseId) return;
    
    setLoading(true);
    try {
      const bookingRef = doc(db, "bookings", appointment.firebaseId);
      const bookingSnap = await getDoc(bookingRef);
      
      if (bookingSnap.exists()) {
        const firebaseData = bookingSnap.data();
        
        // Extract payment details from Firebase
        const paymentAmounts = firebaseData.paymentAmounts || {};
        const paymentMethods: PaymentMethod[] = [];
        
        // Map payment amounts to payment methods
        if (paymentAmounts.cash && paymentAmounts.cash > 0) {
          paymentMethods.push({
            type: 'cash',
            label: 'Cash',
            amount: paymentAmounts.cash || 0
          });
        }
        
        if (paymentAmounts.card && paymentAmounts.card > 0) {
          paymentMethods.push({
            type: 'card',
            label: 'Credit/Debit Card',
            amount: paymentAmounts.card || 0,
            details: firebaseData.cardLast4Digits ? `Card ending in ${firebaseData.cardLast4Digits}` : ''
          });
        }
        
        if (paymentAmounts.check && paymentAmounts.check > 0) {
          paymentMethods.push({
            type: 'check',
            label: 'Bank Check',
            amount: paymentAmounts.check || 0
          });
        }
        
        if (paymentAmounts.digital && paymentAmounts.digital > 0) {
          paymentMethods.push({
            type: 'digital',
            label: 'Digital Payment',
            amount: paymentAmounts.digital || 0
          });
        }
        
        if (paymentAmounts.wallet && paymentAmounts.wallet > 0) {
          paymentMethods.push({
            type: 'wallet',
            label: 'E-Wallet',
            amount: paymentAmounts.wallet || 0
          });
        }
        
        const totalPaid = paymentMethods.reduce((sum, pm) => sum + pm.amount, 0);
        const totalAmount = firebaseData.totalAmount || firebaseData.servicePrice || 0;
        
        const updatedAppointment: Appointment = {
          ...appointment,
          servicePrice: firebaseData.servicePrice || 0,
          subtotal: firebaseData.subtotal || firebaseData.servicePrice || 0,
          totalAmount: totalAmount,
          taxAmount: firebaseData.taxAmount || 0,
          serviceCharges: firebaseData.serviceCharges || 0,
          discount: firebaseData.discount || 0,
          discountType: firebaseData.discountType || 'fixed',
          tax: firebaseData.tax || 5,
          cardLast4Digits: firebaseData.cardLast4Digits || '',
          trnNumber: firebaseData.trnNumber || '',
          teamMembers: firebaseData.teamMembers || [],
          products: firebaseData.products || [],
          paymentMethod: firebaseData.paymentMethod || '',
          paymentStatus: firebaseData.paymentStatus || '',
          paymentMethods: firebaseData.paymentMethods || [],
          paymentAmounts: paymentAmounts,
          bookingNumber: firebaseData.bookingNumber || appointment.bookingNumber,
          price: totalAmount,
          date: firebaseData.bookingDate || firebaseData.date || appointment.date,
          time: firebaseData.bookingTime || firebaseData.time || appointment.time,
          status: firebaseData.status || appointment.status
        };
        
        setFreshAppointment(updatedAppointment);
        
        setPaymentDetails({
          methods: paymentMethods,
          totalPaid,
          balanceDue: totalAmount - totalPaid,
          paymentStatus: firebaseData.paymentStatus || '',
          paymentMethod: firebaseData.paymentMethod || ''
        });
      }
    } catch (error) {
      console.error("Error fetching fresh data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // ✅ UPDATED: Function to update status with reschedule handling
  const handleStatusUpdate = async (newStatus: string) => {
    if (!displayAppointment?.firebaseId) {
      alert("No Firebase ID found for this appointment");
      return;
    }
    
    // ✅ NEW: If status is 'rescheduled', show reschedule dialog first
    if (newStatus === 'rescheduled') {
      // Pre-fill with current date/time
      setRescheduleDate(displayAppointment.bookingDate || displayAppointment.date || '');
      setRescheduleTime(displayAppointment.bookingTime || displayAppointment.time || '');
      setShowRescheduleDialog(true);
      return;
    }
    
    // For other statuses, update directly
    await updateStatusOnly(newStatus);
  };
  
  // ✅ NEW: Function to update only status (for non-reschedule)
  const updateStatusOnly = async (newStatus: string) => {
    if (!displayAppointment?.firebaseId) return;
    
    setUpdatingStatus(true);
    try {
      const bookingRef = doc(db, "bookings", displayAppointment.firebaseId);
      
      // Prepare update data
      const updateData: any = {
        status: newStatus,
        updatedAt: new Date()
      };
      
      await updateDoc(bookingRef, updateData);
      
      // Update local state
      if (freshAppointment) {
        setFreshAppointment({
          ...freshAppointment,
          status: newStatus
        });
      } else {
        setFreshAppointment({
          ...displayAppointment,
          status: newStatus
        } as Appointment);
      }
      
      // Call parent callback if provided
      if (onStatusChange) {
        onStatusChange(displayAppointment.firebaseId, newStatus);
      }
      
      console.log(`✅ Status updated to ${newStatus}`);
      
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status. Please try again.");
    } finally {
      setUpdatingStatus(false);
    }
  };
  
  // ✅ NEW: Function to handle reschedule save
  const handleRescheduleSave = async () => {
    if (!displayAppointment?.firebaseId) {
      alert("No Firebase ID found");
      return;
    }
    
    if (!rescheduleDate || !rescheduleTime) {
      alert("Please select both date and time");
      return;
    }
    
    setRescheduling(true);
    try {
      const bookingRef = doc(db, "bookings", displayAppointment.firebaseId);
      
      // Prepare update data with new date/time
      const updateData: any = {
        status: 'rescheduled',
        bookingDate: rescheduleDate,
        bookingTime: rescheduleTime,
        date: rescheduleDate,
        time: rescheduleTime,
        updatedAt: new Date()
      };
      
      await updateDoc(bookingRef, updateData);
      
      // Update local state
      const updatedAppointment = {
        ...displayAppointment,
        status: 'rescheduled',
        bookingDate: rescheduleDate,
        bookingTime: rescheduleTime,
        date: rescheduleDate,
        time: rescheduleTime
      };
      
      setFreshAppointment(updatedAppointment as Appointment);
      
      // Call parent callback if provided
      if (onStatusChange) {
        onStatusChange(displayAppointment.firebaseId, 'rescheduled');
      }
      
      console.log(`✅ Appointment rescheduled to ${rescheduleDate} at ${rescheduleTime}`);
      
      // Close reschedule dialog
      setShowRescheduleDialog(false);
      
    } catch (error) {
      console.error("Error rescheduling appointment:", error);
      alert("Failed to reschedule. Please try again.");
    } finally {
      setRescheduling(false);
    }
  };
  
  const displayAppointment = freshAppointment || appointment;
  
  if (!displayAppointment) return null;
  
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "closed": return "bg-green-100 text-green-800";
      case "in-progress": return "bg-blue-100 text-blue-800";
      case "scheduled": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-purple-100 text-purple-800";
      case "pending": return "bg-orange-100 text-orange-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "rejected": return "bg-gray-100 text-gray-800";
      case "rescheduled": return "bg-indigo-100 text-indigo-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4" />;
      case "closed": return <CheckCircle className="w-4 h-4" />;
      case "in-progress": return <Clock className="w-4 h-4" />;
      case "scheduled": return <Calendar className="w-4 h-4" />;
      case "approved": return <CheckCircle className="w-4 h-4" />;
      case "pending": return <Clock className="w-4 h-4" />;
      case "cancelled": return <X className="w-4 h-4" />;
      case "rejected": return <X className="w-4 h-4" />;
      case "rescheduled": return <RotateCcw className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };
  
  return (
    <>
      <Sheet open={true} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-full overflow-y-auto p-5 rounded-2xl mt-5">
          {/* Hidden Title for Accessibility */}
          <SheetTitle className="sr-only">Appointment Details</SheetTitle>
          
          {/* Header with Status Dropdown */}
          <div className="sticky top-0 bg-white border-b z-10 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Appointment Details</h2>
                  <p className="text-sm text-gray-500">Booking information</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Status Dropdown with Rescheduled */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Status:</span>
                  <Select
                    value={displayAppointment.status}
                    onValueChange={handleStatusUpdate}
                    disabled={updatingStatus || !displayAppointment.firebaseId}
                  >
                    <SelectTrigger className="w-40 h-9">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(displayAppointment.status)}
                          <span className="capitalize">{displayAppointment.status}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-orange-500" />
                          <span>Pending</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="approved">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-purple-500" />
                          <span>Approved</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="in-progress">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span>In Progress</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="completed">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Completed</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="closed">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Closed</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="rescheduled">
                        <div className="flex items-center gap-2">
                          <RotateCcw className="w-4 h-4 text-indigo-500" />
                          <span>Rescheduled</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="cancelled">
                        <div className="flex items-center gap-2">
                          <X className="w-4 h-4 text-red-500" />
                          <span>Cancelled</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="rejected">
                        <div className="flex items-center gap-2">
                          <X className="w-4 h-4 text-gray-500" />
                          <span>Rejected</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {updatingStatus && (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
                {loading && (
                  <Badge className="bg-blue-500 animate-pulse">Loading...</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Customer Information */}
            <div className="bg-white border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Full Name</p>
                  <p className="font-medium text-gray-900">{displayAppointment.customerName || displayAppointment.customer}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium text-gray-900 break-all">{displayAppointment.customerEmail || displayAppointment.email || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{displayAppointment.customerPhone || displayAppointment.phone || '—'}</p>
                </div>
              </div>
            </div>

            {/* Services Table */}
            <div className="bg-white border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Scissors className="w-4 h-4 text-blue-600" />
                Services
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-y">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Service</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Branch</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Staff</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {displayAppointment.serviceDetails && displayAppointment.serviceDetails.length > 0 ? (
                      displayAppointment.serviceDetails.map((service: any, index: React.Key | null | undefined) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{service.name}</td>
                          <td className="px-4 py-3">{service.branch}</td>
                          <td className="px-4 py-3">{service.staff}</td>
                          <td className="px-4 py-3 text-right font-medium">
                            {formatCurrency(service.price)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{displayAppointment.serviceName || displayAppointment.service}</td>
                        <td className="px-4 py-3">{displayAppointment.branch}</td>
                        <td className="px-4 py-3">{displayAppointment.staffName || displayAppointment.staff || displayAppointment.barber}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCurrency(displayAppointment.servicePrice || displayAppointment.price)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right font-medium text-gray-700">Total:</td>
                      <td className="px-4 py-3 text-right font-bold text-gray-900">
                        {formatCurrency(displayAppointment.totalAmount || displayAppointment.servicePrice || displayAppointment.price)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Schedule */}
            <div className="bg-white border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Schedule
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="font-medium text-gray-900">{displayAppointment.bookingDate || displayAppointment.date}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Time</p>
                  <p className="font-medium text-gray-900">{displayAppointment.bookingTime || displayAppointment.time}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="font-medium text-gray-900">{displayAppointment.duration || '60 min'}</p>
                </div>
              </div>
            </div>

           {/* Payment Details - FIXED: Shows ALL payment methods dynamically */}
<div className="bg-white border rounded-xl p-5">
  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
    <CreditCard className="w-4 h-4 text-blue-600" />
    Payment Details
  </h3>
  
  <div className="space-y-3">
    {/* Check if paymentAmounts exists and has data */}
    {displayAppointment.paymentAmounts && Object.keys(displayAppointment.paymentAmounts).length > 0 ? (
      <>
        {/* 🔥 DYNAMIC LOOP - Shows EVERY payment method with amount > 0 */}
        {Object.entries(displayAppointment.paymentAmounts).map(([method, amount]) => {
          // Skip if amount is 0 or undefined
          if (!amount || amount <= 0) return null;
          
          // Get appropriate icon and color based on payment method
          const getPaymentIcon = (method: string) => {
            const methodLower = method.toLowerCase();
            switch (methodLower) {
              case 'cash': return <DollarSign className="w-4 h-4 text-green-600" />;
              case 'card': return <CreditCard className="w-4 h-4 text-blue-600" />;
              case 'digital': return <Smartphone className="w-4 h-4 text-purple-600" />;
              case 'check': return <FileText className="w-4 h-4 text-orange-600" />;
              case 'wallet': return <Wallet className="w-4 h-4 text-indigo-600" />;
              default: return <Coins className="w-4 h-4 text-gray-600" />;
            }
          };
          
          const getBgColor = (method: string) => {
            const methodLower = method.toLowerCase();
            switch (methodLower) {
              case 'cash': return 'bg-green-100';
              case 'card': return 'bg-blue-100';
              case 'digital': return 'bg-purple-100';
              case 'check': return 'bg-orange-100';
              case 'wallet': return 'bg-indigo-100';
              default: return 'bg-gray-100';
            }
          };
          
          return (
            <div key={method} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 ${getBgColor(method)} rounded-full flex items-center justify-center`}>
                  {getPaymentIcon(method)}
                </div>
                <span className="font-medium text-gray-900 capitalize">{method}</span>
                {method.toLowerCase() === 'card' && displayAppointment.cardLast4Digits && (
                  <span className="text-xs text-gray-500">(•••• {displayAppointment.cardLast4Digits})</span>
                )}
              </div>
              <span className="font-bold text-green-700">
                {formatCurrency(amount)}
              </span>
            </div>
          );
        })}
        
        {/* If no payment methods with amounts but paymentMethods array exists */}
        {Object.values(displayAppointment.paymentAmounts).filter(v => v > 0).length === 0 && 
         displayAppointment.paymentMethods && displayAppointment.paymentMethods.length > 0 && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-2">Payment Methods (no amounts):</p>
            <div className="flex flex-wrap gap-2">
              {displayAppointment.paymentMethods.map((method, idx) => (
                <Badge key={idx} className="bg-blue-100 text-blue-800">
                  {method}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </>
    ) : (
      <div className="p-4 bg-yellow-50 rounded-lg text-center">
        <p className="text-sm text-yellow-800">No payment details found</p>
      </div>
    )}

    {/* Total Amount - Always show */}
    <div className="mt-4 pt-4 border-t flex items-center justify-between">
      <span className="font-semibold text-gray-700">Total Amount</span>
      <span className="text-xl font-bold text-blue-700">
        {formatCurrency(displayAppointment.totalAmount || displayAppointment.servicePrice || displayAppointment.price || 0)}
      </span>
    </div>
  </div>
</div>

            {displayAppointment.notes && (
              <div className="bg-white border rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Notes
                </h3>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{displayAppointment.notes}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              {displayAppointment.status === 'completed' && onGenerateInvoice && (
                <Button
                  onClick={() => onGenerateInvoice(displayAppointment)}
                  className="bg-green-600 hover:bg-green-700 text-white gap-2"
                >
                  <Receipt className="w-4 h-4" />
                  Generate Invoice
                </Button>
              )}
              <Button onClick={onClose} variant="outline" className="gap-2">
                <X className="w-4 h-4" />
                Close
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ✅ NEW: Reschedule Dialog */}
      <Sheet open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <SheetContent className="w-full sm:max-w-md p-10 rounded-2xl mt-10 h-[700px]">
          <SheetHeader>
            <SheetTitle className="text-xl font-semibold flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-indigo-600" />
              Reschedule Appointment
            </SheetTitle>
            <SheetDescription>
              Select new date and time for this appointment
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Customer Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Customer:</p>
              <p className="font-semibold text-gray-900">{displayAppointment?.customerName || displayAppointment?.customer}</p>
            </div>

            {/* Current Schedule */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700 font-medium mb-2">Current Schedule:</p>
              <div className="flex items-center gap-4 text-blue-800">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{displayAppointment?.bookingDate || displayAppointment?.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{displayAppointment?.bookingTime || displayAppointment?.time}</span>
                </div>
              </div>
            </div>

            {/* New Date & Time */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">New Date *</Label>
                <Input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="h-11"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">New Time *</Label>
                <Input
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowRescheduleDialog(false)}
                className="flex-1 h-11"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRescheduleSave}
                disabled={!rescheduleDate || !rescheduleTime || rescheduling}
                className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 gap-2"
              >
                {rescheduling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent text-black rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <p className='text-black'> Reschedule</p>
                   
                  </>
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

const fetchStaffFromFirebase = async (): Promise<StaffMember[]> => {
  try {
    const staffRef = collection(db, "staff");
    const q = query(staffRef, where("status", "==", "active"));
    const querySnapshot = await getDocs(q);
    
    const staff: StaffMember[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const staffData: StaffMember = {
        id: doc.id,
        name: data.name || "Unknown Staff",
        email: data.email || "",
        phone: data.phone || "",
        role: data.role || "staff",
        specialization: Array.isArray(data.specialization) ? data.specialization : [],
        branch: data.branch || "Main Branch",
        avatar: data.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
        status: data.status || "active",
        rating: data.rating || 0,
        createdAt: data.createdAt || new Date(),
        updatedAt: data.updatedAt || new Date()
      };
      staff.push(staffData);
    });
    
    return staff;
  } catch (error) {
    console.error("Error fetching staff from Firebase:", error);
    return [];
  }
};

const normalizeBranchKey = (value?: string | null): string =>
  (value || '')
    .toLowerCase()
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const splitBranchTokens = (value?: string | null): string[] =>
  (value || '')
    .split(/[,|/]/)
    .map((part) => normalizeBranchKey(part))
    .filter(Boolean);

// NEW FUNCTION: Fetch branches from Firebase (sirf naam fetch karna hai)
const fetchBranchesFromFirebase = async (): Promise<Branch[]> => {
  try {
    const branchesRef = collection(db, "branches");
    const querySnapshot = await getDocs(branchesRef);
    
    const branches: Branch[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      branches.push({
        id: doc.id,
        name: data.name || "Unknown Branch", // SIRF NAAM CHAHIYE
        address: data.address || "",
        city: data.city || "",
        country: data.country || "",
        phone: data.phone || "",
        email: data.email || "",
        status: data.status || "active",
        openingTime: data.openingTime || "09:00",
        closingTime: data.closingTime || "18:00",
        weeklyTimings: data.weeklyTimings || {}
      });
    });
    
    console.log("🏢 Branches fetched:", branches.map(b => b.name));
    return branches;
  } catch (error) {
    console.error("Error fetching branches:", error);
    return [];
  }
};

export function AdvancedCalendar({ 
  appointments, 
  onAppointmentClick, 
  onStatusChange, 
  onCreateBooking,
  onEditBooking,
  onDeleteBooking,
  onCheckoutBooking,
  onDownloadInvoiceBooking,
  onCloseBooking,
  staff: propStaff,
  showFullDetails = true,
  formatCurrency = (amount) => `AED ${amount.toFixed(2)}`,
  lockedBranch,
  paymentMethodAvailability,
  calendarDisplaySettings,
  invoiceDisclaimerTemplate,
}: AdvancedCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBarber, setSelectedBarber] = useState<string>('all');
  // NEW: Selected branch for filtering - locked for branch admins
  const [selectedBranch, setSelectedBranch] = useState<string>(lockedBranch || 'all');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [timeSlotGap, setTimeSlotGap] = useState(30);
  const [layoutMode, setLayoutMode] = useState<'time-top' | 'employee-top'>('time-top');
  const [businessHours, setBusinessHours] = useState({ start: 9, end: 22 });
  const [weeklyTimings, setWeeklyTimings] = useState(DEFAULT_WEEKLY_TIMINGS);
  const [hiddenHours, setHiddenHours] = useState<number[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(propStaff || []);
  const [currentSystemTime, setCurrentSystemTime] = useState(new Date());
  
  const [showAdvancePopup, setShowAdvancePopup] = useState(false);
  const [selectedAdvanceAppointment, setSelectedAdvanceAppointment] = useState<Appointment | null>(null);
  const [initialPopupAction, setInitialPopupAction] = useState<'reschedule' | null>(null);
  const [showInvoicePopup, setShowInvoicePopup] = useState(false);
  const [selectedInvoiceAppointment, setSelectedInvoiceAppointment] = useState<Appointment | null>(null);
  const [showWalletTopupPopup, setShowWalletTopupPopup] = useState(false);
  const [selectedWalletAppointment, setSelectedWalletAppointment] = useState<Appointment | null>(null);
  const [walletDocId, setWalletDocId] = useState<string | null>(null);
  const [walletCustomerId, setWalletCustomerId] = useState<string | null>(null);
  const [walletCurrentBalance, setWalletCurrentBalance] = useState(0);
  const [walletTopupAmount, setWalletTopupAmount] = useState('');
  const [walletTopupLoading, setWalletTopupLoading] = useState(false);
  const [walletLookupLoading, setWalletLookupLoading] = useState(false);
  const [walletTopupError, setWalletTopupError] = useState<string | null>(null);
  const [latestTopupInvoice, setLatestTopupInvoice] = useState<WalletTopupInvoiceData | null>(null);
  const calendarScrollRef = useRef<HTMLDivElement | null>(null);
  const redLineTimeHeaderRef = useRef<HTMLDivElement | null>(null);
  const redLineTimeRowRef = useRef<HTMLDivElement | null>(null);
  const lastAutoScrollKeyRef = useRef<string>('');
  const walletTopupValue = Number(walletTopupAmount);
  const selectedTopupTier = Number.isFinite(walletTopupValue)
    ? getWalletTopupTier(walletTopupValue)
    : undefined;

  useEffect(() => {
    // Ensure calendar opens on today's context and red-line logic can run immediately.
    setSelectedDate(startOfDay(new Date()));
  }, []);
  
  // Load staff data
  useEffect(() => {
    const loadStaffData = async () => {
      if (propStaff && propStaff.length > 0) {
        setStaffMembers(propStaff);
      } else if (!lockedBranch) {
        // Only fetch all staff when NOT locked to a specific branch
        // (for super admin). Branch admins always rely on propStaff from parent.
        const staffData = await fetchStaffFromFirebase();
        setStaffMembers(staffData);
      }
      // If lockedBranch is set and propStaff is empty, keep empty —
      // parent will provide filtered staff once loaded.
    };
    
    loadStaffData();
  }, [propStaff, lockedBranch]);

  // NEW: Load branches data
  useEffect(() => {
    const loadBranches = async () => {
      const branchesData = await fetchBranchesFromFirebase();
      setBranches(branchesData);
    };
    
    loadBranches();
  }, []);

  // Filter staff by selected branch for columns and dropdown
  const branchFilteredStaff = useMemo(() => {
    // When locked to a branch, always show only that branch's staff
    const activeBranch = lockedBranch || (selectedBranch !== 'all' ? selectedBranch : null);
    if (!activeBranch) return staffMembers;

    const normalizedActiveBranch = normalizeBranchKey(activeBranch);
    const selectedBranchDoc = branches.find(
      (branch) => normalizeBranchKey(branch.name) === normalizedActiveBranch
    );

    return staffMembers.filter((staff) => {
      const nameCandidates = [
        normalizeBranchKey(staff.branch),
        normalizeBranchKey(staff.userBranchName),
        ...(staff.branchNames || []).map((name) => normalizeBranchKey(name)),
        ...splitBranchTokens(staff.branch),
      ].filter(Boolean);

      if (nameCandidates.includes(normalizedActiveBranch)) return true;

      if (!selectedBranchDoc) return false;

      const idCandidates = [staff.branchId, staff.userBranchId, ...(staff.branches || [])].filter(Boolean);
      return idCandidates.includes(selectedBranchDoc.id);
    });
  }, [staffMembers, selectedBranch, lockedBranch]);

  // Reset barber filter when branch changes
  useEffect(() => {
    setSelectedBarber('all');
  }, [selectedBranch]);

  const barbers = useMemo(() => branchFilteredStaff.map(staff => staff.name), [branchFilteredStaff]);

  const visibleBarbers = useMemo(
    () => (selectedBarber === 'all' ? barbers : [selectedBarber]),
    [barbers, selectedBarber]
  );

  const employeeTopStaffColumnMinWidth = useMemo(() => {
    const count = visibleBarbers.length;
    if (count >= 8) return '72px';
    if (count >= 6) return '84px';
    if (count >= 5) return '96px';
    return '110px';
  }, [visibleBarbers.length]);

  const employeeTopTimeColumnWidth = useMemo(
    () => (visibleBarbers.length >= 6 ? 'clamp(84px, 13vw, 120px)' : 'clamp(96px, 15vw, 130px)'),
    [visibleBarbers.length]
  );

  const employeeTopGridTemplateColumns = useMemo(
    () => `${employeeTopTimeColumnWidth} repeat(${visibleBarbers.length}, minmax(${employeeTopStaffColumnMinWidth}, 1fr))`,
    [employeeTopTimeColumnWidth, visibleBarbers.length, employeeTopStaffColumnMinWidth]
  );

  // Keep current time updated so slot availability changes in real-time.
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSystemTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!calendarDisplaySettings) return;

    if (typeof calendarDisplaySettings.timeSlotGap === 'number') {
      const resolvedGap = Number(calendarDisplaySettings.timeSlotGap);
      setTimeSlotGap(Number.isFinite(resolvedGap) && resolvedGap > 0 ? resolvedGap : 30);
    }

    if (calendarDisplaySettings.layoutMode) {
      setLayoutMode(calendarDisplaySettings.layoutMode);
    }

    if (calendarDisplaySettings.businessHours) {
      setBusinessHours(calendarDisplaySettings.businessHours);
    }

    const incomingWeekly = calendarDisplaySettings.weeklyTimings || {};
    const normalizeDay = (
      dayValue: any,
      fallback: { open: string; close: string; closed: boolean }
    ) => ({
      open: String(dayValue?.open ?? dayValue?.opening ?? fallback.open),
      close: String(dayValue?.close ?? dayValue?.closing ?? fallback.close),
      closed: Boolean(dayValue?.closed ?? fallback.closed),
    });

    setWeeklyTimings({
      monday: normalizeDay(incomingWeekly.monday, DEFAULT_WEEKLY_TIMINGS.monday),
      tuesday: normalizeDay(incomingWeekly.tuesday, DEFAULT_WEEKLY_TIMINGS.tuesday),
      wednesday: normalizeDay(incomingWeekly.wednesday, DEFAULT_WEEKLY_TIMINGS.wednesday),
      thursday: normalizeDay(incomingWeekly.thursday, DEFAULT_WEEKLY_TIMINGS.thursday),
      friday: normalizeDay(incomingWeekly.friday, DEFAULT_WEEKLY_TIMINGS.friday),
      saturday: normalizeDay(incomingWeekly.saturday, DEFAULT_WEEKLY_TIMINGS.saturday),
      sunday: normalizeDay(incomingWeekly.sunday, DEFAULT_WEEKLY_TIMINGS.sunday),
    });

    if (Array.isArray(calendarDisplaySettings.hiddenHours)) {
      setHiddenHours(calendarDisplaySettings.hiddenHours);
    }
  }, [calendarDisplaySettings]);

  const parseTimeTo24Hour = (raw: string, fallbackHour: number) => {
    const value = String(raw || '').trim();
    if (!value) return { hour: fallbackHour, minute: 0 };

    const directMatch = value.match(/^(\d{1,2}):(\d{2})$/);
    if (directMatch) {
      const hour = Math.max(0, Math.min(23, Number(directMatch[1])));
      const minute = Math.max(0, Math.min(59, Number(directMatch[2])));
      return { hour, minute };
    }

    const ampmMatch = value.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
    if (ampmMatch) {
      let hour = Number(ampmMatch[1]) % 12;
      const minute = Math.max(0, Math.min(59, Number(ampmMatch[2])));
      const marker = ampmMatch[3].toUpperCase();
      if (marker === 'PM') hour += 12;
      return { hour, minute };
    }

    return { hour: fallbackHour, minute: 0 };
  };

  const weekdayKeys: WeekdayKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const selectedWeekdayKey = weekdayKeys[selectedDate.getDay()];
  const selectedDayTiming = weeklyTimings[selectedWeekdayKey] || DEFAULT_WEEKLY_TIMINGS[selectedWeekdayKey];
  const isSelectedDayClosed = Boolean(selectedDayTiming?.closed);

  const effectiveBusinessHours = useMemo(() => {
    if (isSelectedDayClosed) {
      return { startHour: businessHours.start, startMinute: 0, endHour: businessHours.end, endMinute: 0 };
    }

    const startParsed = parseTimeTo24Hour(selectedDayTiming?.open || '09:00', businessHours.start);
    const endParsed = parseTimeTo24Hour(selectedDayTiming?.close || '22:00', businessHours.end);

    const startTotal = (startParsed.hour * 60) + startParsed.minute;
    const endTotal = (endParsed.hour * 60) + endParsed.minute;
    if (endTotal <= startTotal) {
      return { startHour: businessHours.start, startMinute: 0, endHour: businessHours.end, endMinute: 0 };
    }

    return {
      startHour: startParsed.hour,
      startMinute: startParsed.minute,
      endHour: endParsed.hour,
      endMinute: endParsed.minute,
    };
  }, [businessHours.end, businessHours.start, isSelectedDayClosed, selectedDayTiming?.close, selectedDayTiming?.open]);

  const generateTimeSlots = () => {
    if (isSelectedDayClosed) return [];

    const slots = [];
    const startTime = new Date(selectedDate);
    startTime.setHours(effectiveBusinessHours.startHour, effectiveBusinessHours.startMinute, 0, 0);

    const endTime = new Date(selectedDate);
    endTime.setHours(effectiveBusinessHours.endHour, effectiveBusinessHours.endMinute, 0, 0);

    let currentTime = startTime;
    while (currentTime < endTime) {
      const hour = currentTime.getHours();
      if (!hiddenHours.includes(hour)) {
        slots.push(format(currentTime, 'HH:mm'));
      }
      currentTime = addMinutes(currentTime, timeSlotGap);
    }

    return slots;
  };

  const timeSlots = useMemo(
    () => generateTimeSlots(),
    [selectedDate, effectiveBusinessHours, isSelectedDayClosed, timeSlotGap, hiddenHours]
  );

  const isTodaySelected = isSameDay(selectedDate, currentSystemTime);
  const isPastSelectedDate = startOfDay(selectedDate).getTime() < startOfDay(currentSystemTime).getTime();

  const slotToMinutes = (slot: string): number => {
    const [hours, minutes] = slot.split(':').map(Number);
    return (hours * 60) + minutes;
  };

  const isSlotBlockedForBooking = (slot: string): boolean => {
    if (isPastSelectedDate) return true;
    if (!isTodaySelected) return false;

    const slotMinutes = slotToMinutes(slot);
    const nowMinutes = (currentSystemTime.getHours() * 60) + currentSystemTime.getMinutes();
    return slotMinutes < nowMinutes;
  };

  const redLineSlotIndex = useMemo(() => {
    if (!isTodaySelected) return null;
    const firstAllowedIndex = timeSlots.findIndex((slot) => !isSlotBlockedForBooking(slot));
    if (firstAllowedIndex < 0) return null;
    return firstAllowedIndex;
  }, [timeSlots, isTodaySelected, currentSystemTime, selectedDate]);

  const firstBookableSlot = useMemo(
    () => timeSlots.find((slot) => !isSlotBlockedForBooking(slot)),
    [timeSlots, isPastSelectedDate, isTodaySelected, currentSystemTime]
  );

  useEffect(() => {
    if (!isTodaySelected || redLineSlotIndex === null) return;

    const autoScrollKey = `${format(selectedDate, 'yyyy-MM-dd')}-${layoutMode}-${redLineSlotIndex}-${timeSlots.length}`;
    if (lastAutoScrollKeyRef.current === autoScrollKey) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 10;

    const tryScrollToRedLine = () => {
      if (cancelled) return;
      attempts += 1;

      const scrollContainer = calendarScrollRef.current;
      const target = layoutMode === 'time-top'
        ? redLineTimeHeaderRef.current
        : redLineTimeRowRef.current;

      const canMeasure = Boolean(
        scrollContainer &&
        target &&
        scrollContainer.clientWidth > 0 &&
        scrollContainer.clientHeight > 0
      );

      if (!canMeasure) {
        if (attempts < maxAttempts) {
          window.requestAnimationFrame(tryScrollToRedLine);
        }
        return;
      }

      const containerRect = scrollContainer!.getBoundingClientRect();
      const targetRect = target!.getBoundingClientRect();

      if (layoutMode === 'time-top') {
        const desiredLeft = Math.max(
          0,
          scrollContainer!.scrollLeft + (targetRect.left - containerRect.left) - 140
        );
        scrollContainer!.scrollTo({ left: desiredLeft, behavior: 'auto' });
      } else {
        const desiredTop = Math.max(
          0,
          scrollContainer!.scrollTop + (targetRect.top - containerRect.top) - 120
        );
        scrollContainer!.scrollTo({ top: desiredTop, behavior: 'auto' });
      }

      lastAutoScrollKeyRef.current = autoScrollKey;
    };

    const kickoffTimer = window.setTimeout(() => {
      window.requestAnimationFrame(tryScrollToRedLine);
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(kickoffTimer);
    };
  }, [isTodaySelected, redLineSlotIndex, layoutMode, selectedDate, timeSlots.length, appointments.length]);

  const normalizeStaffName = (value?: string): string => String(value || '').trim().toLowerCase();

  const getAssignedStaffNames = (appointment: Appointment): string[] => {
    const names = [
      appointment.barber,
      appointment.staffName,
      appointment.staff,
      ...(Array.isArray(appointment.serviceDetails)
        ? appointment.serviceDetails.map((detail: any) => detail?.staff || detail?.staffName)
        : []),
      ...(Array.isArray(appointment.teamMembers)
        ? appointment.teamMembers.map((member) => member?.name)
        : []),
    ]
      .map((name) => String(name || '').trim())
      .filter((name) => name.length > 0);

    return Array.from(new Set(names));
  };

  const isAppointmentAssignedToBarber = (appointment: Appointment, barber: string): boolean => {
    const target = normalizeStaffName(barber);
    if (!target) return false;
    return getAssignedStaffNames(appointment).some(
      (name) => normalizeStaffName(name) === target
    );
  };

  const getAppointmentServiceNamesForStaff = (appointment: Appointment, barber: string): string[] => {
    const target = normalizeStaffName(barber);
    if (!target) return [];

    const details = Array.isArray(appointment.serviceDetails)
      ? appointment.serviceDetails
      : [];

    const byDetail = details
      .filter((detail: any) =>
        normalizeStaffName(detail?.staff || detail?.staffName || detail?.staffMember) === target
      )
      .map((detail: any) => String(detail?.serviceName || detail?.name || detail?.service || ''))
      .filter((name: string) => name.trim().length > 0);

    if (byDetail.length > 0) {
      return Array.from(new Set(byDetail));
    }

    const services = Array.isArray(appointment.services) ? appointment.services : [];
    const teamMembers = Array.isArray(appointment.teamMembers) ? appointment.teamMembers : [];
    if (services.length > 0 && teamMembers.length > 0) {
      const mapped = services.filter((serviceName, index) =>
        normalizeStaffName(teamMembers[index]?.name) === target
      );
      if (mapped.length > 0) {
        return mapped;
      }
    }

    const fallback = String(appointment.service || appointment.serviceName || '').trim();
    return fallback ? [fallback] : [];
  };

  const formatServiceLabel = (names: string[]): string => {
    const cleaned = names.filter((name) => name.trim().length > 0);
    if (cleaned.length === 0) return 'Service';
    return cleaned.join(', ');
  };

const filteredAppointments = useMemo(() => {
  const dateAndBarberFiltered = appointments.filter(apt => {
    const aptDate = typeof apt.date === 'string' ? parseISO(apt.date) : new Date(apt.date);
    const isSameDate = isSameDay(aptDate, selectedDate);
    const isSameBarber = selectedBarber === 'all' || isAppointmentAssignedToBarber(apt, selectedBarber);
    
    return isSameDate && isSameBarber;
  });

  if (selectedBranch === 'all') {
    return dateAndBarberFiltered;
  }

  const normalizedSelectedBranch = normalizeBranchKey(selectedBranch);
  return dateAndBarberFiltered.filter((appointment) => {
    const normalizedAppointmentBranch = normalizeBranchKey(appointment.branch);
    return normalizedAppointmentBranch === normalizedSelectedBranch;
  });
}, [appointments, selectedDate, selectedBarber, selectedBranch]);

  const topBarBookingStats = useMemo(() => {
    const DEFAULT_TAX_RATE = 5;

    const readPaymentAmount = (paymentAmounts: Record<string, unknown>, keys: string[]) =>
      keys.reduce((sum, key) => sum + Math.max(0, Number(paymentAmounts?.[key] || 0)), 0);

    const totals = filteredAppointments.reduce(
      (acc, appointment) => {
        const totalFromRecord = Number(appointment.totalAmount ?? 0);
        const subtotalFromRecord = Number(appointment.subtotal ?? 0);
        const servicePriceFromRecord = Number(appointment.servicePrice ?? 0);
        const taxAmountFromRecord = Number(appointment.taxAmount ?? 0);
        const baseFromPrice = Number(appointment.price ?? 0);
        const taxRate = Number.isFinite(Number(appointment.tax))
          ? Number(appointment.tax)
          : DEFAULT_TAX_RATE;

        let withTax = 0;
        let withoutTax = 0;

        // Prefer explicit pre-tax values (subtotal/servicePrice). If tax amount is absent,
        // apply default tax rate so "With Tax" always includes tax.
        const hasExplicitPreTax = subtotalFromRecord > 0 || servicePriceFromRecord > 0;
        const preTaxBase = subtotalFromRecord > 0
          ? subtotalFromRecord
          : (servicePriceFromRecord > 0 ? servicePriceFromRecord : baseFromPrice);

        if (taxAmountFromRecord > 0 && totalFromRecord > 0) {
          withTax = totalFromRecord;
          withoutTax = Math.max(0, withTax - taxAmountFromRecord);
        } else if (hasExplicitPreTax && preTaxBase > 0) {
          withoutTax = preTaxBase;
          withTax = withoutTax * (1 + taxRate / 100);
        } else if (totalFromRecord > 0) {
          withTax = totalFromRecord;
          withoutTax = withTax / (1 + taxRate / 100);
        } else {
          withoutTax = Math.max(0, preTaxBase);
          withTax = withoutTax * (1 + taxRate / 100);
        }

        acc.withTaxTotal += withTax;
        acc.withoutTaxTotal += withoutTax;

        const paymentAmounts = (appointment.paymentAmounts || {}) as Record<string, unknown>;
        let cashAmount = readPaymentAmount(paymentAmounts, ['cash', 'Cash']);
        let cardAmount = readPaymentAmount(paymentAmounts, ['card', 'Card']);
        let checkAmount = readPaymentAmount(paymentAmounts, ['check', 'Check']);
        let digitalAmount = readPaymentAmount(paymentAmounts, ['digital', 'Digital']);
        let ewalletAmount = readPaymentAmount(paymentAmounts, ['ewallet', 'Ewallet', 'wallet', 'Wallet']);

        const selectedMethods = new Set<string>();
        const normalizeMethod = (value: unknown): string | null => {
          const normalized = String(value || '').trim().toLowerCase();
          if (!normalized) return null;
          if (normalized === 'cash' || normalized.includes('cod')) return 'cash';
          if (normalized.includes('card') || normalized.includes('credit') || normalized.includes('debit')) return 'card';
          if (normalized === 'check' || normalized.includes('bank')) return 'check';
          if (normalized === 'digital' || normalized.includes('online')) return 'digital';
          if (normalized === 'wallet' || normalized === 'ewallet' || normalized.includes('wallet')) return 'ewallet';
          return null;
        };

        (Array.isArray(appointment.paymentMethods) ? appointment.paymentMethods : []).forEach((method) => {
          const normalized = normalizeMethod(method);
          if (normalized) selectedMethods.add(normalized);
        });

        const paymentMethodText = String(appointment.paymentMethod || '').toLowerCase();
        if (selectedMethods.size === 0 && paymentMethodText) {
          paymentMethodText
            .split(',')
            .map((part) => part.trim())
            .forEach((method) => {
              const normalized = normalizeMethod(method);
              if (normalized) selectedMethods.add(normalized);
            });
        }

        const hasExplicitSelection = selectedMethods.size > 0;
        if (hasExplicitSelection) {
          if (!selectedMethods.has('cash')) cashAmount = 0;
          if (!selectedMethods.has('card')) cardAmount = 0;
          if (!selectedMethods.has('check')) checkAmount = 0;
          if (!selectedMethods.has('digital')) digitalAmount = 0;
          if (!selectedMethods.has('ewallet')) ewalletAmount = 0;
        }

        const allocatedAmount = cashAmount + cardAmount + checkAmount + digitalAmount + ewalletAmount;
        if (allocatedAmount <= 0 && withTax > 0) {
          if (selectedMethods.size === 1) {
            const onlyMethod = Array.from(selectedMethods)[0];
            if (onlyMethod === 'ewallet') ewalletAmount += withTax;
            else if (onlyMethod === 'card') cardAmount += withTax;
            else if (onlyMethod === 'check') checkAmount += withTax;
            else if (onlyMethod === 'digital') digitalAmount += withTax;
            else cashAmount += withTax;
          } else if (selectedMethods.size > 1) {
            const selectedList = Array.from(selectedMethods);
            const split = withTax / selectedList.length;
            selectedList.forEach((method, index) => {
              const amount = index === selectedList.length - 1
                ? Math.max(0, withTax - split * (selectedList.length - 1))
                : split;
              if (method === 'ewallet') ewalletAmount += amount;
              else if (method === 'card') cardAmount += amount;
              else if (method === 'check') checkAmount += amount;
              else if (method === 'digital') digitalAmount += amount;
              else cashAmount += amount;
            });
          } else if (paymentMethodText.includes('wallet') || paymentMethodText.includes('ewallet')) {
            ewalletAmount += withTax;
          } else if (paymentMethodText.includes('card')) {
            cardAmount += withTax;
          } else if (paymentMethodText.includes('check')) {
            checkAmount += withTax;
          } else if (
            paymentMethodText.includes('digital') ||
            paymentMethodText.includes('online') ||
            paymentMethodText.includes('bank')
          ) {
            digitalAmount += withTax;
          } else if (paymentMethodText.includes('cash') || paymentMethodText.includes('cod')) {
            cashAmount += withTax;
          }
        }

        acc.paymentTotals.cash += cashAmount;
        acc.paymentTotals.card += cardAmount;
        acc.paymentTotals.check += checkAmount;
        acc.paymentTotals.digital += digitalAmount;
        acc.paymentTotals.ewallet += ewalletAmount;
        return acc;
      },
      {
        withTaxTotal: 0,
        withoutTaxTotal: 0,
        paymentTotals: {
          cash: 0,
          card: 0,
          check: 0,
          digital: 0,
          ewallet: 0,
        },
      }
    );

    const displayMode = calendarDisplaySettings?.totalValueDisplayMode || 'both';
    const primaryTotal = displayMode === 'without-tax' ? totals.withoutTaxTotal : totals.withTaxTotal;
    const primaryLabel = displayMode === 'without-tax' ? 'Booking Value (Excl Tax)' : 'Booking Value (With Tax)';

    return {
      displayMode,
      currentBookings: filteredAppointments.length,
      withTaxTotal: totals.withTaxTotal,
      withoutTaxTotal: totals.withoutTaxTotal,
      primaryTotal,
      primaryLabel,
      paymentTotals: totals.paymentTotals,
    };
  }, [filteredAppointments, calendarDisplaySettings?.totalValueDisplayMode]);

  const enabledPaymentMethods = useMemo(
    () => ({
      cash: paymentMethodAvailability?.cash !== false,
      card: paymentMethodAvailability?.card !== false,
      check: paymentMethodAvailability?.check !== false,
      digital: paymentMethodAvailability?.digital !== false,
      ewallet: paymentMethodAvailability?.ewallet !== false,
    }),
    [paymentMethodAvailability]
  );

  const convertTo24Hour = (time12h: string): string => {
    if (!time12h) return "00:00";
    
    if (time12h.includes(':') && !time12h.includes(' ')) {
      return time12h;
    }
    
    if (!time12h.includes(' ')) return time12h;
    
    const [time, period] = time12h.split(' ');
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    
    if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minutes}`;
  };

  const parseDuration = (duration: string): number => {
    if (!duration) return 30;
    
    if (duration.includes('hour')) {
      const match = duration.match(/(\d+)\s*hour/);
      return match ? parseInt(match[1]) * 60 : 60;
    }
    
    const match = duration.match(/(\d+)\s*min/);
    return match ? parseInt(match[1]) : 30;
  };

  const doesAppointmentCoverSlot = (appointment: Appointment, slot: string): boolean => {
    const appointmentTime24 = convertTo24Hour(appointment.time);
    const appointmentDuration = parseDuration(appointment.duration);
    
    const [slotHours, slotMinutes] = slot.split(':').map(Number);
    const [aptHours, aptMinutes] = appointmentTime24.split(':').map(Number);
    
    const slotStartMinutes = slotHours * 60 + slotMinutes;
    const slotEndMinutes = slotStartMinutes + timeSlotGap;
    const appointmentStartMinutes = aptHours * 60 + aptMinutes;
    const appointmentEndMinutes = appointmentStartMinutes + appointmentDuration;
    
    return (
      (appointmentStartMinutes < slotEndMinutes) && 
      (appointmentEndMinutes > slotStartMinutes)
    );
  };

  const getAppointmentsForSlot = (timeSlot: string, barber: string): Appointment[] => {
    return filteredAppointments.filter(
      (apt) => isAppointmentAssignedToBarber(apt, barber) && doesAppointmentCoverSlot(apt, timeSlot)
    );
  };

  const getAppointmentsStartingAtSlot = (timeSlot: string, barber: string): Appointment[] => {
    return getAppointmentsForSlot(timeSlot, barber).filter((apt) => isAppointmentStart(apt, timeSlot));
  };

  const isAppointmentStart = (appointment: Appointment, timeSlot: string): boolean => {
    const appointmentTime24 = convertTo24Hour(appointment.time);
    const [aptHours, aptMinutes] = appointmentTime24.split(':').map(Number);
    const appointmentStartMinutes = aptHours * 60 + aptMinutes;
    
    const [slotHours, slotMinutes] = timeSlot.split(':').map(Number);
    const slotStartMinutes = slotHours * 60 + slotMinutes;
    
    for (let i = 0; i < timeSlots.length; i++) {
      const [h, m] = timeSlots[i].split(':').map(Number);
      const currentSlotStart = h * 60 + m;
      const currentSlotEnd = currentSlotStart + timeSlotGap;
      
      if (appointmentStartMinutes >= currentSlotStart && appointmentStartMinutes < currentSlotEnd) {
        return timeSlots[i] === timeSlot;
      }
    }
    
    return false;
  };

  const getAppointmentSpan = (appointment: Appointment, startTimeSlot: string): number => {
    const appointmentTime24 = convertTo24Hour(appointment.time);
    const duration = parseDuration(appointment.duration);
    const [aptHours, aptMinutes] = appointmentTime24.split(':').map(Number);
    const appointmentStartMinutes = aptHours * 60 + aptMinutes;
    const appointmentEndMinutes = appointmentStartMinutes + duration;
    
    let startSlotIndex = -1;
    for (let i = 0; i < timeSlots.length; i++) {
      const [h, m] = timeSlots[i].split(':').map(Number);
      const slotStart = h * 60 + m;
      const slotEnd = slotStart + timeSlotGap;
      
      if (appointmentStartMinutes >= slotStart && appointmentStartMinutes < slotEnd) {
        startSlotIndex = i;
        break;
      }
    }
    
    if (startSlotIndex === -1) return 1;
    
    let span = 0;
    for (let i = startSlotIndex; i < timeSlots.length; i++) {
      const [h, m] = timeSlots[i].split(':').map(Number);
      const slotStart = h * 60 + m;
      
      if (slotStart < appointmentEndMinutes) {
        span++;
      } else {
        break;
      }
    }
    
    return span || 1;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "completed": return "bg-blue-600";
      case "closed": return "bg-green-600";
      case "in-progress": return "bg-green-500";
      case "scheduled": return "bg-yellow-500";
      case "approved": return "bg-purple-500";
      case "pending": return "bg-orange-500";
      case "cancelled": return "bg-red-500";
      case "rejected": return "bg-gray-500";
      case "rescheduled": return "bg-indigo-500"; // New rescheduled status
      default: return "bg-gray-300";
    }
  };

  const getAppointmentHoverText = (appointment: Appointment, barberContext?: string): string => {
    const customerName = String(appointment.customer || appointment.customerName || 'Customer').trim();
    const bookingNumber = String(appointment.bookingNumber || '').trim();
    const dateValue = String(appointment.date || appointment.bookingDate || '').trim();
    const timeValue = String(appointment.time || appointment.bookingTime || '').trim();
    const durationValue = String(appointment.duration || '').trim();
    const branchValue = String(appointment.branch || 'Main Branch').trim();
    const statusValue = String(appointment.status || '').trim();

    const serviceNames = barberContext
      ? getAppointmentServiceNamesForStaff(appointment, barberContext)
      : (Array.isArray(appointment.services) && appointment.services.length > 0
          ? appointment.services
          : [String(appointment.service || appointment.serviceName || 'Service')]);

    const staffNames = barberContext
      ? [barberContext]
      : getAssignedStaffNames(appointment);

    const phoneValue = String(appointment.phone || appointment.customerPhone || '').trim();
    const emailValue = String(appointment.email || appointment.customerEmail || '').trim();
    const paymentMethodValue = String(appointment.paymentMethod || '').trim();
    const totalAmountValue = Number(appointment.totalAmount ?? appointment.price ?? appointment.servicePrice ?? 0);
    const notesValue = String(appointment.notes || '').trim();

    const lines = [
      bookingNumber ? `Booking: ${bookingNumber}` : null,
      `Customer: ${customerName}`,
      `Services: ${serviceNames.filter(Boolean).join(', ') || 'Service'}`,
      `Staff: ${staffNames.filter(Boolean).join(', ') || 'Not Assigned'}`,
      `Date: ${dateValue || '-'}`,
      `Time: ${timeValue || '-'}`,
      durationValue ? `Duration: ${durationValue}` : null,
      `Branch: ${branchValue}`,
      statusValue ? `Status: ${statusValue}` : null,
      phoneValue ? `Phone: ${phoneValue}` : null,
      emailValue ? `Email: ${emailValue}` : null,
      paymentMethodValue ? `Payment: ${paymentMethodValue}` : null,
      `Total: ${formatCurrency(totalAmountValue)}`,
      notesValue ? `Notes: ${notesValue}` : null,
    ].filter(Boolean) as string[];

    return lines.join('\n');
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = direction === 'next'
      ? addDays(selectedDate, 1)
      : addDays(selectedDate, -1);
    setSelectedDate(newDate);
  };

  const getStaffAvatar = (barberName: string): string => {
    const staff = staffMembers.find(s => s.name === barberName);
    return staff?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop";
  };

  const renderSlotAddIcon = (barber: string, slot: string, isBlockedSlot: boolean) => {
    if (!onCreateBooking || isBlockedSlot) return null;

    return (
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="absolute top-1 left-1 z-10 h-6 w-6 rounded-full p-0 shadow-sm"
        onClick={(e) => {
          e.stopPropagation();
          onCreateBooking(barber, format(selectedDate, 'yyyy-MM-dd'), slot);
        }}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    );
  };

  const handleAdvanceAppointmentClick = (appointment: Appointment) => {
    console.log("🎯 ADVANCE CALENDAR Click:", appointment);
    setSelectedAdvanceAppointment(appointment);
    setInitialPopupAction(null);
    setShowAdvancePopup(true);
  };

  const handleAppointmentAction = (action: 'reschedule' | 'edit' | 'checkin' | 'cancel' | 'delete' | 'checkout' | 'topup-wallet' | 'download-invoice' | 'close-booking' | 'add-booking', appointment: Appointment) => {
    if (action === 'reschedule') {
      setSelectedAdvanceAppointment(appointment);
      setInitialPopupAction('reschedule');
      setShowAdvancePopup(true);
      return;
    }

    if (action === 'edit') {
      if (onEditBooking) {
        onEditBooking(appointment);
      } else {
        onAppointmentClick(appointment);
      }
      return;
    }

    if (action === 'add-booking') {
      const targetBarber = appointment.barber || appointment.staff || '';
      const targetDate = appointment.date || appointment.bookingDate || format(selectedDate, 'yyyy-MM-dd');
      const rawTargetTime = appointment.time || appointment.bookingTime || '';
      const targetTime = rawTargetTime ? convertTo24Hour(rawTargetTime) : '';

      if (onCreateBooking && targetBarber && targetTime) {
        onCreateBooking(targetBarber, targetDate, targetTime);
      }
      return;
    }

    if (action === 'checkin') {
      onStatusChange(appointment.firebaseId || appointment.id, 'completed');
      return;
    }

    if (action === 'cancel') {
      onStatusChange(appointment.firebaseId || appointment.id, 'cancelled');
      return;
    }

    if (action === 'delete') {
      if (onDeleteBooking) {
        onDeleteBooking(appointment);
      } else {
        onStatusChange(appointment.firebaseId || appointment.id, 'deleted');
      }
      return;
    }

    if (action === 'checkout') {
      if (onCheckoutBooking) {
        onCheckoutBooking(appointment);
      } else {
        handleGenerateInvoiceClick(appointment);
      }
      return;
    }

    if (action === 'download-invoice') {
      if (onDownloadInvoiceBooking) {
        onDownloadInvoiceBooking(appointment);
      } else {
        handleGenerateInvoiceClick(appointment);
      }
      return;
    }

    if (action === 'close-booking') {
      if (onCloseBooking) {
        onCloseBooking(appointment);
      } else {
        onStatusChange(appointment.firebaseId || appointment.id, 'closed');
      }
      return;
    }

    if (action === 'topup-wallet') {
      setSelectedWalletAppointment(appointment);
      setWalletTopupAmount('');
      setWalletCurrentBalance(0);
      setWalletDocId(null);
      setWalletCustomerId(null);
      setWalletTopupError(null);
      setLatestTopupInvoice(null);
      setShowWalletTopupPopup(true);
    }
  };

  useEffect(() => {
    const loadWalletForTopup = async () => {
      if (!showWalletTopupPopup || !selectedWalletAppointment) return;

      setWalletLookupLoading(true);
      setWalletTopupError(null);

      try {
        const apt: any = selectedWalletAppointment;
        const normalizeEmail = (value: string) => value.trim().toLowerCase();
        const normalizePhone = (value: string) => value.replace(/[^0-9+]/g, '');

        const rawCustomerId = (apt.customerId || '').toString().trim();
        const emailCandidates = Array.from(new Set([
          apt.customerEmail,
          apt.email
        ].filter(Boolean).map((v: string) => normalizeEmail(String(v)))));
        const phoneCandidates = Array.from(new Set([
          apt.customerPhone,
          apt.phone
        ].filter(Boolean).map((v: string) => normalizePhone(String(v)))));

        let resolvedCustomerId: string | null = rawCustomerId || null;

        if (resolvedCustomerId) {
          const customerByDocIdSnap = await getDoc(doc(db, 'customers', resolvedCustomerId));
          if (!customerByDocIdSnap.exists()) {
            const customerByUidSnap = await getDocs(
              query(collection(db, 'customers'), where('uid', '==', resolvedCustomerId))
            );
            if (!customerByUidSnap.empty) {
              resolvedCustomerId = customerByUidSnap.docs[0].id;
            } else {
              resolvedCustomerId = null;
            }
          }
        }

        if (!resolvedCustomerId) {
          for (const email of emailCandidates) {
            const customerByEmailSnap = await getDocs(
              query(collection(db, 'customers'), where('email', '==', email))
            );
            if (!customerByEmailSnap.empty) {
              resolvedCustomerId = customerByEmailSnap.docs[0].id;
              break;
            }
          }
        }

        if (!resolvedCustomerId) {
          for (const phone of phoneCandidates) {
            const customerByPhoneSnap = await getDocs(
              query(collection(db, 'customers'), where('phone', '==', phone))
            );
            if (!customerByPhoneSnap.empty) {
              resolvedCustomerId = customerByPhoneSnap.docs[0].id;
              break;
            }
          }
        }

        if (!resolvedCustomerId) {
          const newCustomerRef = await addDoc(collection(db, 'customers'), {
            uid: rawCustomerId || null,
            name: apt.customerName || apt.customer || 'Customer',
            email: emailCandidates[0] || '',
            phone: phoneCandidates[0] || '',
            role: 'customer',
            status: 'active',
            loyaltyPoints: 0,
            walletBalance: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          resolvedCustomerId = newCustomerRef.id;
        }

        setWalletCustomerId(resolvedCustomerId);

        let resolvedWalletDocId: string | null = null;
        let resolvedBalance = 0;

        const directWalletDoc = await getDoc(doc(db, 'wallets', resolvedCustomerId));
        if (directWalletDoc.exists()) {
          resolvedWalletDocId = directWalletDoc.id;
          resolvedBalance = Number(directWalletDoc.data().balance || 0);
        } else {
          const walletByCustomerSnap = await getDocs(
            query(collection(db, 'wallets'), where('customerId', '==', resolvedCustomerId))
          );

          if (!walletByCustomerSnap.empty) {
            const walletDoc = walletByCustomerSnap.docs[0];
            resolvedWalletDocId = walletDoc.id;
            resolvedBalance = Number(walletDoc.data().balance || 0);
          }
        }

        if (!resolvedWalletDocId) {
          const newWalletRef = await addDoc(collection(db, 'wallets'), {
            customerId: resolvedCustomerId,
            customerName: selectedWalletAppointment.customerName || selectedWalletAppointment.customer || 'Customer',
            customerEmail: selectedWalletAppointment.customerEmail || '',
            balance: 0,
            loyaltyPoints: 0,
            totalPointsEarned: 0,
            totalPointsRedeemed: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          resolvedWalletDocId = newWalletRef.id;
          resolvedBalance = 0;
        }

        setWalletDocId(resolvedWalletDocId);
        setWalletCurrentBalance(resolvedBalance);
      } catch (error) {
        console.error('Error loading wallet for topup:', error);
        setWalletTopupError('Failed to load customer wallet. Please close and try again.');
      } finally {
        setWalletLookupLoading(false);
      }
    };

    loadWalletForTopup();
  }, [showWalletTopupPopup, selectedWalletAppointment]);

  const handleWalletTopupSubmit = async () => {
    const amount = Number(walletTopupAmount);
    const selectedTier = getWalletTopupTier(amount);

    if (!walletDocId || !walletCustomerId) {
      alert('Wallet not found.');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      alert('Please enter a valid topup amount.');
      return;
    }

    setWalletTopupLoading(true);
    try {
      const walletRef = doc(db, 'wallets', walletDocId);
      const walletSnap = await getDoc(walletRef);
      const walletData = walletSnap.exists() ? walletSnap.data() : {};
      const now = new Date();
      const invoiceDate = now.toISOString().split('T')[0];
      const invoiceNumber = `WTI-${Date.now().toString().slice(-8)}`;
      const topupDisclaimerText = String(invoiceDisclaimerTemplate || '')
        .replace(/\{\{dateTime\}\}/gi, now.toLocaleString())
        .trim();

      const topupInvoiceData: WalletTopupInvoiceData = {
        invoiceNumber,
        invoiceDate,
        amount,
        customerName:
          selectedWalletAppointment?.customerName || selectedWalletAppointment?.customer || 'Customer',
        customerEmail:
          selectedWalletAppointment?.customerEmail || selectedWalletAppointment?.email || '',
        customerPhone:
          selectedWalletAppointment?.customerPhone || selectedWalletAppointment?.phone || '',
        branchName: selectedWalletAppointment?.branch || 'Main Branch',
        discountPercent: selectedTier?.discountPercent,
        sourceNote: 'Wallet top-up completed by branch admin.',
        disclaimerText: topupDisclaimerText || undefined,
      };
      const portalCustomerId =
        String(selectedWalletAppointment?.customerId || '').trim() || walletCustomerId;

      const currentBalance = Number(walletData.balance || 0);
      const currentPoints = Number(walletData.loyaltyPoints || 0);
      const currentTotalEarned = Number(walletData.totalPointsEarned || 0);

      const pointsToAdd = Math.floor(amount * 100);
      const updatedBalance = currentBalance + amount;
      const updatedPoints = currentPoints + pointsToAdd;

      const updatePayload: Record<string, any> = {
        balance: updatedBalance,
        loyaltyPoints: updatedPoints,
        totalPointsEarned: currentTotalEarned + pointsToAdd,
        updatedAt: new Date()
      };

      if (selectedTier) {
        updatePayload.serviceDiscountPercent = selectedTier.discountPercent;
        updatePayload.serviceDiscountTopupAmount = selectedTier.amount;
        updatePayload.serviceDiscountSource = 'ewallet_topup';
        updatePayload.serviceDiscountActive = updatedBalance > 0;
        updatePayload.serviceDiscountUpdatedAt = new Date();
      }

      await updateDoc(walletRef, updatePayload);

      await addDoc(collection(db, 'walletTransactions'), {
        customerId: walletCustomerId,
        customerUid: selectedWalletAppointment?.customerId || '',
        customerName: selectedWalletAppointment?.customerName || selectedWalletAppointment?.customer || 'Customer',
        customerEmail: selectedWalletAppointment?.customerEmail || '',
        customerPhone: selectedWalletAppointment?.customerPhone || selectedWalletAppointment?.phone || '',
        amount,
        amountInPoints: pointsToAdd,
        type: 'credit',
        description: `Wallet topup by branch admin for booking ${selectedWalletAppointment?.bookingNumber || selectedWalletAppointment?.id || ''}`,
        source: 'branch_admin_topup',
        bookingId: selectedWalletAppointment?.firebaseId || selectedWalletAppointment?.id || '',
        previousBalance: currentBalance,
        previousLoyaltyPoints: currentPoints,
        newBalance: updatedBalance,
        newLoyaltyPoints: updatedPoints,
        serviceDiscountPercent: selectedTier?.discountPercent || null,
        serviceDiscountTopupAmount: selectedTier?.amount || null,
        invoiceNumber,
        invoiceDate,
        invoiceType: 'wallet_topup',
        invoiceData: topupInvoiceData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await addDoc(collection(db, 'transactions'), {
        customerId: portalCustomerId,
        customerUid: selectedWalletAppointment?.customerId || '',
        type: 'wallet_topup',
        amount,
        pointsAmount: pointsToAdd,
        description: `Wallet top-up invoice ${invoiceNumber}`,
        status: 'success',
        referenceId: invoiceNumber,
        invoiceNumber,
        invoiceDate,
        invoiceType: 'wallet_topup',
        invoiceData: topupInvoiceData,
        customerPhone: selectedWalletAppointment?.customerPhone || selectedWalletAppointment?.phone || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Apply top-up discount to active and upcoming bookings for this customer.
      if (selectedTier) {
        const bookingsSnapshot = await getDocs(
          query(collection(db, 'bookings'), where('customerId', '==', walletCustomerId))
        );

        const nonFinalStatuses = new Set([
          'pending',
          'approved',
          'scheduled',
          'confirmed',
          'in-progress',
          'in_progress',
          'checked-in',
          'checkedin',
          'ongoing'
        ]);

        const bookingUpdates = bookingsSnapshot.docs
          .filter((bookingDoc) => {
            const bookingData: any = bookingDoc.data();
            const status = String(bookingData.status || '').toLowerCase().trim();
            return nonFinalStatuses.has(status);
          })
          .map((bookingDoc) => {
            const bookingData: any = bookingDoc.data();
            const existingPercent = bookingData.discountType === 'percentage'
              ? Number(bookingData.discount || 0)
              : 0;
            const appliedPercent = Math.max(existingPercent, selectedTier.discountPercent);

            return updateDoc(bookingDoc.ref, {
              discount: appliedPercent,
              discountType: 'percentage',
              walletTopupDiscountPercent: appliedPercent,
              walletTopupDiscountSource: 'ewallet_topup',
              walletTopupDiscountActive: true,
              walletTopupDiscountUpdatedAt: new Date(),
              updatedAt: new Date(),
            });
          });

        if (bookingUpdates.length > 0) {
          await Promise.all(bookingUpdates);
        }
      }

      setWalletCurrentBalance(updatedBalance);
      setWalletTopupAmount('');
      setLatestTopupInvoice(topupInvoiceData);
      const discountText = selectedTier
        ? ` Service discount unlocked: ${selectedTier.discountPercent}% (active while e-wallet balance is above zero).`
        : '';
      alert(`Wallet topped up successfully. New balance: ${formatCurrency(updatedBalance)}.${discountText}`);
    } catch (error) {
      console.error('Error topping up wallet:', error);
      alert('Failed to topup wallet. Please try again.');
    } finally {
      setWalletTopupLoading(false);
    }
  };

  const handleDownloadTopupInvoice = async () => {
    if (!latestTopupInvoice) return;

    try {
      await downloadWalletTopupInvoicePdf(latestTopupInvoice);
    } catch (error) {
      console.error('Error downloading top-up invoice:', error);
      alert('Unable to download top-up invoice. Please try again.');
    }
  };

  const handleSendTopupInvoiceToWhatsApp = () => {
    if (!latestTopupInvoice) return;

    const whatsappUrl = buildWalletTopupWhatsAppUrl(latestTopupInvoice);
    if (!whatsappUrl) {
      alert('Customer phone number is missing, so WhatsApp sharing is not available.');
      return;
    }

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleGenerateInvoiceClick = (appointment: Appointment) => {
    console.log("💰 Generate Invoice for:", appointment);
    setSelectedInvoiceAppointment(appointment);
    setShowInvoicePopup(true);
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="px-2 py-1.5 sm:px-3 sm:py-2">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0 space-y-1">
              <CardTitle className="flex items-center gap-2 leading-none">
                <Calendar className="h-5 w-5 text-pink-600" />
                <span className="text-base font-bold text-pink-600">Booking Calendar</span>
              </CardTitle>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge className="border-blue-200 bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                  Current: {topBarBookingStats.currentBookings}
                </Badge>
                <Badge className="border-green-200 bg-green-100 px-2 py-0.5 text-xs text-green-800">
                  {topBarBookingStats.primaryLabel}: {formatCurrency(topBarBookingStats.primaryTotal)}
                </Badge>
                {topBarBookingStats.displayMode === 'both' && (
                  <Badge className="border-amber-200 bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                    Excl Tax: {formatCurrency(topBarBookingStats.withoutTaxTotal)}
                  </Badge>
                )}
                {([
                  { key: 'cash', label: 'Cash', enabled: enabledPaymentMethods.cash, className: 'border-emerald-200 bg-emerald-100 text-emerald-800' },
                  { key: 'card', label: 'Card', enabled: enabledPaymentMethods.card, className: 'border-sky-200 bg-sky-100 text-sky-800' },
                  { key: 'check', label: 'Check', enabled: enabledPaymentMethods.check, className: 'border-orange-200 bg-orange-100 text-orange-800' },
                  { key: 'digital', label: 'Digital', enabled: enabledPaymentMethods.digital, className: 'border-violet-200 bg-violet-100 text-violet-800' },
                  { key: 'ewallet', label: 'E-Wallet', enabled: enabledPaymentMethods.ewallet, className: 'border-indigo-200 bg-indigo-100 text-indigo-800' },
                ] as const)
                  .filter((item) => item.enabled)
                  .map((item) => (
                    <Badge key={item.key} className={`px-2 py-0.5 text-xs ${item.className}`}>
                      {item.label}: {formatCurrency(topBarBookingStats.paymentTotals[item.key])}
                    </Badge>
                  ))}
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center gap-2 rounded-xl border bg-muted/30 p-1.5 md:w-auto md:justify-end">
              {!lockedBranch && (
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="h-8 w-[132px] text-xs">
                    <SelectValue placeholder="Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches ({branches.length})</SelectItem>
                    {branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.name}>
                        <div className="flex items-center gap-2">
                          <Building className="h-3.5 w-3.5" />
                          <span>{branch.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={selectedBarber} onValueChange={setSelectedBarber}>
                <SelectTrigger className="h-8 min-w-[132px] text-xs sm:min-w-[145px]">
                  <SelectValue placeholder="Staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff ({branchFilteredStaff.length})</SelectItem>
                  {branchFilteredStaff.map(staff => (
                    <SelectItem key={staff.id} value={staff.name}>
                      <div className="flex items-center gap-2">
                        <div className="relative h-4 w-4 overflow-hidden rounded-full">
                          <img
                            src={staff.avatar}
                            alt={staff.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop";
                            }}
                          />
                        </div>
                        <span>{staff.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {onCreateBooking && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    const defaultBarber = selectedBarber !== 'all' ? selectedBarber : (barbers[0] || '');
                    if (!firstBookableSlot || !defaultBarber) return;
                    onCreateBooking(defaultBarber, format(selectedDate, 'yyyy-MM-dd'), firstBookableSlot);
                  }}
                  className="h-8 gap-1 bg-green-600 px-2 text-xs hover:bg-green-700"
                  disabled={!firstBookableSlot || (selectedBarber === 'all' && barbers.length === 0)}
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  Quick Book
                </Button>
              )}

              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => navigateDate('prev')} className="h-8 w-8 p-0">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="min-w-[110px] px-1 text-center text-xs font-medium sm:min-w-[120px]">
                  {format(selectedDate, 'MMM dd, yyyy')}
                </span>
                <Button variant="outline" size="sm" onClick={() => navigateDate('next')} className="h-8 w-8 p-0">
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-1.5 pb-2 pt-1 sm:px-2">
          <div ref={calendarScrollRef} className="h-[calc(100vh-300px)] min-h-[420px] w-full overflow-x-auto overflow-y-auto sm:h-[calc(100vh-250px)] sm:min-h-[520px]">
            <div className="min-w-full" style={{ width: 'max-content' }}>
              {isSelectedDayClosed && (
                <div className="mb-2 px-3 py-2 rounded-md border border-amber-200 bg-amber-50 text-amber-800 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {`Business is closed on ${selectedWeekdayKey.charAt(0).toUpperCase()}${selectedWeekdayKey.slice(1)}. Booking slots are unavailable for this day.`}
                </div>
              )}

              {(isPastSelectedDate || isTodaySelected) && (
                <div className="mb-2 px-3 py-2 rounded-md border border-red-200 bg-red-50 text-red-700 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {isPastSelectedDate
                    ? 'Selected date is in the past. New bookings are disabled, but past bookings remain visible.'
                    : 'Bookings are disabled before the red line. Current and future slots are bookable.'}
                </div>
              )}

              {onCreateBooking && (
                <div className="mb-2 px-3 py-2 rounded-md border border-blue-200 bg-blue-50 text-blue-800 text-xs font-medium">
                  Multi-booking enabled: use Quick Book, Add Booking In Slot (on an appointment), or the small + icon in slots.
                </div>
              )}

              {layoutMode === 'time-top' ? (
                <>
                  <div className="grid gap-1 mb-2 sticky top-0 bg-background z-10 border-b pb-2" style={{ gridTemplateColumns: `clamp(110px, 18vw, 190px) repeat(${timeSlots.length}, minmax(40px, 1fr))` }}>
                    <div className="p-2 font-medium text-sm text-muted-foreground sticky left-0 bg-background">
                      Staff / Time
                    </div>
                    {timeSlots.map((slot, slotIndex) => {
                      const isRedLinePoint = redLineSlotIndex === slotIndex;
                      return (
                        <div
                          key={slot}
                          ref={isRedLinePoint ? redLineTimeHeaderRef : null}
                          className={`p-1 text-xs text-center font-medium text-muted-foreground border rounded bg-muted/50 min-w-10 sm:min-w-[50px] ${isRedLinePoint ? 'relative border-l-2 border-l-red-500' : ''}`}
                        >
                          {slot}
                          {isRedLinePoint && (
                            <div className="absolute -top-5 left-0 text-[10px] text-red-600 font-semibold whitespace-nowrap">
                              Red line: booking starts here
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {(selectedBarber === 'all' ? barbers : [selectedBarber]).map(barber => {
                    const rowElements = timeSlots.map((currentSlot, slotIndex) => {
                      const slotAppointments = getAppointmentsForSlot(currentSlot, barber);
                      const startingAppointments = slotAppointments.filter((appointment) =>
                        isAppointmentStart(appointment, currentSlot)
                      );
                      const hasRunningBooking = slotAppointments.length > 0;
                      const isBlockedSlot = isSlotBlockedForBooking(currentSlot);
                      const isRedLinePoint = redLineSlotIndex === slotIndex;

                      if (startingAppointments.length > 0) {
                        return (
                          <div
                            key={`${barber}-${currentSlot}`}
                            className={`relative p-1 border rounded transition-all duration-200 min-h-[60px] border-muted-foreground/20 bg-muted/10 ${isRedLinePoint ? 'border-l-2 border-l-red-500' : ''}`}
                            style={{ minHeight: `${Math.max(60, startingAppointments.length * 64)}px` }}
                          >
                            {renderSlotAddIcon(barber, currentSlot, isBlockedSlot)}
                            <div className="flex flex-col gap-1.5">
                              {startingAppointments.map((appointment, idx) => (
                                <div
                                  key={`${barber}-${currentSlot}-${appointment.firebaseId || appointment.id}-${idx}`}
                                  className={`relative p-1 rounded cursor-pointer hover:shadow-md transition-all duration-200 border border-white/20 ${getStatusColor(appointment.status)}`}
                                  onClick={() => handleAdvanceAppointmentClick(appointment)}
                                  title={getAppointmentHoverText(appointment, barber)}
                                >
                                  <div className="absolute top-1 right-1 z-10" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white hover:bg-white/20 hover:text-white">
                                          <MoreVertical className="w-3 h-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleAppointmentAction('reschedule', appointment)}>
                                          <RotateCcw className="w-4 h-4 mr-2" />
                                          Reschedule
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleAppointmentAction('edit', appointment)}>
                                          <Pencil className="w-4 h-4 mr-2" />
                                          Edit Booking
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleAppointmentAction('add-booking', appointment)}>
                                          <PlusCircle className="w-4 h-4 mr-2" />
                                          Add Booking In Slot
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleAppointmentAction('checkin', appointment)}>
                                          <CheckCircle className="w-4 h-4 mr-2" />
                                          Check In
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleAppointmentAction('cancel', appointment)}>
                                          <X className="w-4 h-4 mr-2" />
                                          Cancel Booking
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleAppointmentAction('checkout', appointment)}>
                                          <Receipt className="w-4 h-4 mr-2" />
                                          Checkout
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleAppointmentAction('download-invoice', appointment)}>
                                          <Download className="w-4 h-4 mr-2" />
                                          Download Invoice
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => handleAppointmentAction('close-booking', appointment)}
                                          disabled={String(appointment.status || '').toLowerCase() === 'closed'}
                                        >
                                          <FileCheck className="w-4 h-4 mr-2" />
                                          Close Booking
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleAppointmentAction('topup-wallet', appointment)}>
                                          <Wallet className="w-4 h-4 mr-2" />
                                          Topup Wallet
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600" onClick={() => handleAppointmentAction('delete', appointment)}>
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          Delete Booking
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                  <div className="w-full h-full flex flex-col items-center justify-center text-xs p-1 pr-7">
                                    <div className="w-2 h-2 rounded-full mb-1 bg-white/80" />
                                    <div className="font-medium w-full text-center leading-tight whitespace-normal wrap-break-word">
                                      {String(appointment.customer || appointment.customerName || 'Customer').trim()}
                                    </div>
                                    <div className="text-white/90 w-full text-center text-[10px] leading-tight whitespace-normal wrap-break-word">
                                      {formatServiceLabel(getAppointmentServiceNamesForStaff(appointment, barber))}
                                    </div>
                                    <div className="text-white/80 text-[9px] mt-1">
                                      {appointment.time || appointment.bookingTime || currentSlot}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      if (hasRunningBooking) {
                        return (
                          <div
                            key={`${barber}-${currentSlot}`}
                            className={`relative p-1 border rounded transition-all duration-200 min-h-[60px] flex flex-col items-center justify-center gap-1 border-muted-foreground/20 bg-muted/20 ${isRedLinePoint ? 'border-l-2 border-l-red-500' : ''}`}
                          >
                            {renderSlotAddIcon(barber, currentSlot, isBlockedSlot)}
                            <div className="text-[10px] text-muted-foreground text-center">
                              In progress ({slotAppointments.length})
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={`${barber}-${currentSlot}`}
                          className={`relative p-1 border rounded transition-all duration-200 min-h-[60px] flex items-center justify-center border-dashed ${isBlockedSlot ? 'cursor-not-allowed border-red-200 bg-red-50' : 'cursor-pointer border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-green-50'} ${isRedLinePoint ? 'border-l-2 border-l-red-500' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isBlockedSlot) return;
                            onCreateBooking && onCreateBooking(barber, format(selectedDate, 'yyyy-MM-dd'), currentSlot);
                          }}
                        >
                          {renderSlotAddIcon(barber, currentSlot, isBlockedSlot)}
                          {isBlockedSlot ? (
                            <div className="text-red-600/80 text-[10px] text-center flex flex-col items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Not Allowed
                            </div>
                          ) : (
                            <div className="text-muted-foreground/50 text-xs text-center cursor-pointer hover:text-green-600 transition-colors flex flex-col items-center gap-1">
                              <PlusCircle className="w-3 h-3" />
                              Book
                            </div>
                          )}
                        </div>
                      );
                    });
                    
                    const staffAvatar = getStaffAvatar(barber);
                    
                    return (
                      <div key={barber} className="grid gap-1 mb-1" style={{ gridTemplateColumns: `clamp(110px, 18vw, 190px) repeat(${timeSlots.length}, minmax(40px, 1fr))` }}>
                        <div className="p-2 sm:p-3 bg-muted rounded flex items-center gap-2 sticky left-0 border-r" style={{ minWidth: 'clamp(120px, 15vw, 200px)' }}>
                          <div className="relative w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden shrink-0 border border-gray-300">
                            <img 
                              src={staffAvatar} 
                              alt={barber} 
                              className="object-cover w-full h-full"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop";
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-xs sm:text-sm truncate">{barber}</div>
                          </div>
                        </div>
                        {rowElements}
                      </div>
                    );
                  })}
                </>
              ) : (
                <div 
                  className="grid gap-1" 
                  style={{ 
                    gridTemplateColumns: employeeTopGridTemplateColumns,
                  }}
                >
                  <div className="p-2 font-medium text-sm text-muted-foreground sticky top-0 bg-background z-20 border-b">
                    Time / Staff
                  </div>
                  {visibleBarbers.map(barber => {
                    const staffAvatar = getStaffAvatar(barber);
                    
                    return (
                      <div key={barber} className="p-2 text-xs text-center font-medium text-muted-foreground border rounded flex flex-col items-center justify-center gap-1 sticky top-0 bg-background z-20 border-b">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-gray-300 mb-1">
                          <img 
                            src={staffAvatar} 
                            alt={barber} 
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop";
                            }}
                          />
                        </div>
                        <div className="text-center w-full px-1">
                          <div className="font-medium text-[10px] leading-tight whitespace-normal wrap-break-word">
                            {barber}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {timeSlots.map((slot, slotIndex) => (
                    <React.Fragment key={slot}>
                      <div
                        ref={redLineSlotIndex === slotIndex ? redLineTimeRowRef : null}
                        className={`p-2 sm:p-3 bg-muted rounded flex items-center gap-2 sticky left-0 z-20 border-r min-h-20 ${redLineSlotIndex === slotIndex ? 'border-t-2 border-t-red-500' : ''}`}
                      >
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="font-medium text-xs sm:text-sm">{slot}</span>
                      </div>
                      
                      {visibleBarbers.map(barber => {
                        const slotAppointments = getAppointmentsForSlot(slot, barber);
                        const startingAppointments = getAppointmentsStartingAtSlot(slot, barber);
                        const hasRunningBooking = slotAppointments.length > 0;
                        const isBlockedSlot = isSlotBlockedForBooking(slot);
                        const isRedLinePoint = redLineSlotIndex === slotIndex;

                        if (startingAppointments.length > 0) {
                          return (
                            <div
                              key={`${slot}-${barber}`}
                              className={`relative p-1 border rounded transition-all duration-200 min-h-20 border-muted-foreground/20 bg-muted/10 ${isRedLinePoint ? 'border-t-2 border-t-red-500' : ''}`}
                              style={{ minHeight: `${Math.max(80, startingAppointments.length * 74)}px` }}
                            >
                              {renderSlotAddIcon(barber, slot, isBlockedSlot)}
                              <div className="flex flex-col gap-1.5">
                                {startingAppointments.map((appointment, idx) => (
                                  <div
                                    key={`${slot}-${barber}-${appointment.firebaseId || appointment.id}-${idx}`}
                                    className={`relative p-1 rounded cursor-pointer hover:shadow-md transition-all duration-200 border border-white/20 ${getStatusColor(appointment.status)}`}
                                    onClick={() => handleAdvanceAppointmentClick(appointment)}
                                    title={getAppointmentHoverText(appointment, barber)}
                                  >
                                    <div className="absolute top-1 right-1 z-10" onClick={(e) => e.stopPropagation()}>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white hover:bg-white/20 hover:text-white">
                                            <MoreVertical className="w-3 h-3" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => handleAppointmentAction('reschedule', appointment)}>
                                            <RotateCcw className="w-4 h-4 mr-2" />
                                            Reschedule
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleAppointmentAction('edit', appointment)}>
                                            <Pencil className="w-4 h-4 mr-2" />
                                            Edit Booking
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleAppointmentAction('add-booking', appointment)}>
                                            <PlusCircle className="w-4 h-4 mr-2" />
                                            Add Booking In Slot
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleAppointmentAction('checkin', appointment)}>
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Check In
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleAppointmentAction('cancel', appointment)}>
                                            <X className="w-4 h-4 mr-2" />
                                            Cancel Booking
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleAppointmentAction('checkout', appointment)}>
                                            <Receipt className="w-4 h-4 mr-2" />
                                            Checkout
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleAppointmentAction('download-invoice', appointment)}>
                                            <Download className="w-4 h-4 mr-2" />
                                            Download Invoice
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() => handleAppointmentAction('close-booking', appointment)}
                                            disabled={String(appointment.status || '').toLowerCase() === 'closed'}
                                          >
                                            <FileCheck className="w-4 h-4 mr-2" />
                                            Close Booking
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleAppointmentAction('topup-wallet', appointment)}>
                                            <Wallet className="w-4 h-4 mr-2" />
                                            Topup Wallet
                                          </DropdownMenuItem>
                                          <DropdownMenuItem className="text-red-600" onClick={() => handleAppointmentAction('delete', appointment)}>
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Booking
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                    <div className="w-full h-full flex flex-col items-center justify-center text-xs p-1 pr-7">
                                      <div className="w-2 h-2 rounded-full mb-1 bg-white/80" />
                                      <div className="text-white/80 text-[9px] mb-0.5 font-medium">
                                        {appointment.time || appointment.bookingTime || slot}
                                      </div>
                                      <div className="font-medium w-full text-center leading-tight whitespace-normal wrap-break-word">
                                        {String(appointment.customer || appointment.customerName || 'Customer').trim()}
                                      </div>
                                      <div className="text-white/90 w-full text-center text-[10px] leading-tight whitespace-normal wrap-break-word">
                                        {formatServiceLabel(getAppointmentServiceNamesForStaff(appointment, barber))}
                                      </div>
                                      <div className="text-white/80 text-[9px] mt-1">
                                        {appointment.duration}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }

                        if (hasRunningBooking) {
                          return (
                            <div
                              key={`${slot}-${barber}`}
                              className={`relative p-1 border rounded transition-all duration-200 flex flex-col items-center justify-center gap-1 min-h-20 border-muted-foreground/20 bg-muted/20 ${isRedLinePoint ? 'border-t-2 border-t-red-500' : ''}`}
                            >
                              {renderSlotAddIcon(barber, slot, isBlockedSlot)}
                              <div className="text-[10px] text-muted-foreground text-center">
                                In progress ({slotAppointments.length})
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={`${slot}-${barber}`}
                            className={`relative p-1 border rounded transition-all duration-200 flex items-center justify-center border-dashed min-h-20 ${isBlockedSlot ? 'cursor-not-allowed border-red-200 bg-red-50' : 'cursor-pointer border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-green-50'} ${isRedLinePoint ? 'border-t-2 border-t-red-500' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isBlockedSlot) return;
                              onCreateBooking && onCreateBooking(barber, format(selectedDate, 'yyyy-MM-dd'), slot);
                            }}
                          >
                            {renderSlotAddIcon(barber, slot, isBlockedSlot)}
                            {isBlockedSlot ? (
                              <div className="text-red-600/80 text-[10px] text-center flex flex-col items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Not Allowed
                              </div>
                            ) : (
                              <div className="text-muted-foreground/50 text-xs text-center cursor-pointer hover:text-green-600 transition-colors flex flex-col items-center gap-1">
                                <PlusCircle className="w-3 h-3" />
                                Book
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>

        </CardContent>
      </Card>
      
      {showAdvancePopup && (
        <AdvanceCalendarPopup
          appointment={selectedAdvanceAppointment}
          onClose={() => {
            setShowAdvancePopup(false);
            setSelectedAdvanceAppointment(null);
            setInitialPopupAction(null);
          }}
          onStatusChange={onStatusChange}
          initialAction={initialPopupAction}
          onGenerateInvoice={handleGenerateInvoiceClick}
          formatCurrency={formatCurrency}
        />
      )}
      
      {showInvoicePopup && (
        <InvoiceGenerationPopup
          appointment={selectedInvoiceAppointment}
          onClose={() => {
            setShowInvoicePopup(false);
            setSelectedInvoiceAppointment(null);
          }}
          selectedBranchName={lockedBranch || (selectedBranch !== 'all' ? selectedBranch : undefined)}
          branchDirectory={branches}
          formatCurrency={formatCurrency}
        />
      )}

      <Sheet open={showWalletTopupPopup} onOpenChange={setShowWalletTopupPopup}>
        <SheetContent className="w-full sm:max-w-md p-6 rounded-2xl mt-6">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-indigo-600" />
              Topup Wallet
            </SheetTitle>
            <SheetDescription>
              Add amount to customer wallet and update Firebase in real-time.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg border">
              <p className="text-xs text-gray-500">Customer</p>
              <p className="font-semibold text-gray-900">
                {selectedWalletAppointment?.customerName || selectedWalletAppointment?.customer || '—'}
              </p>
              <p className="text-sm text-gray-600 break-all">
                {selectedWalletAppointment?.customerEmail || selectedWalletAppointment?.email || '—'}
              </p>
            </div>

            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <p className="text-xs text-indigo-700">Current Wallet Balance</p>
              <p className="text-xl font-bold text-indigo-900">{formatCurrency(walletCurrentBalance)}</p>
            </div>

            <div className="space-y-2">
              <Label>Topup Amount</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter amount"
                value={walletTopupAmount}
                onChange={(e) => setWalletTopupAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Quick Topup</Label>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {WALLET_TOPUP_TIERS.map((tier) => {
                  const isSelected = selectedTopupTier?.amount === tier.amount;
                  return (
                    <Button
                      key={tier.amount}
                      type="button"
                      variant="outline"
                      className={`h-9 ${isSelected ? 'border-indigo-500 text-indigo-700 bg-indigo-50' : ''}`}
                      onClick={() => setWalletTopupAmount(String(tier.amount))}
                    >
                      AED {tier.amount}
                    </Button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500">
                1050 AED = 20% service discount, 2100 AED = 20%, 3150 AED = 25%, 5250 AED = 30%.
                Discount remains active while the customer has e-wallet balance.
              </p>
            </div>

            {walletLookupLoading && (
              <p className="text-xs text-indigo-700">Loading customer wallet...</p>
            )}

            {walletTopupError && (
              <p className="text-xs text-red-600">{walletTopupError}</p>
            )}

            {walletTopupAmount && Number(walletTopupAmount) > 0 && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-green-700">Balance After Topup</p>
                <p className="text-lg font-bold text-green-800">
                  {formatCurrency(walletCurrentBalance + Number(walletTopupAmount || 0))}
                </p>
              </div>
            )}

            {selectedTopupTier && (
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <p className="text-xs text-indigo-700">Service Discount Unlocked</p>
                <p className="text-sm font-semibold text-indigo-900">
                  {selectedTopupTier.discountPercent}% off services at checkout (valid while e-wallet balance is available)
                </p>
              </div>
            )}

            {latestTopupInvoice && (
              <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div>
                  <p className="text-xs text-blue-700">Top-up Invoice Ready</p>
                  <p className="text-sm font-semibold text-blue-900">
                    #{latestTopupInvoice.invoiceNumber} | AED {latestTopupInvoice.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-blue-700">
                    WhatsApp desk number: {WALLET_TOPUP_WHATSAPP_SENDER_NUMBER}
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-blue-300 text-blue-800"
                    onClick={handleDownloadTopupInvoice}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Invoice
                  </Button>
                  <Button
                    type="button"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleSendTopupInvoiceToWhatsApp}
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Send via WhatsApp
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowWalletTopupPopup(false)}
                disabled={walletTopupLoading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                onClick={handleWalletTopupSubmit}
                disabled={walletLookupLoading || walletTopupLoading || !walletDocId || !walletTopupAmount || Number(walletTopupAmount) <= 0}
              >
                {walletLookupLoading ? 'Loading...' : walletTopupLoading ? 'Processing...' : 'Topup Wallet'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

