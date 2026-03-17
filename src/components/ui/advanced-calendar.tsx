'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Calendar, Clock, User, ChevronLeft, ChevronRight, Settings, 
  RotateCcw, Grid3X3, Users, PlusCircle, X, DollarSign, CheckCircle, 
  Scissors, Phone, Mail, MapPin, FileText, CreditCard, Calculator, 
  AlertCircle, Receipt, Trash2, Plus, Minus, Download, Hash, 
  Building, Tag, Package, Smartphone, Wallet, FileCheck, Printer,
  Search, Filter, Banknote, Coins, Smartphone as Mobile, QrCode,
  CheckSquare, Percent, CalendarDays, ClipboardList, MoreVertical, Pencil
} from "lucide-react";
import { format, addDays, startOfDay, addMinutes, isSameDay, parseISO } from "date-fns";
import { collection, getDocs, query, where, doc, getDoc ,updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Appointment {
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
  staff?: StaffMember[];
  showFullDetails?: boolean;
  formatCurrency?: (amount: number) => string;
  /** When set, locks the calendar to this branch and hides the branch filter dropdown */
  lockedBranch?: string;
}

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
  formatCurrency = (amount) => `AED ${amount.toFixed(2)}`
}: { 
  appointment: Appointment | null; 
  onClose: () => void;
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
            discountType: 'percentage',
            tax: firebaseData.tax || 5,
            cardLast4Digits: firebaseData.cardLast4Digits || '',
            trnNumber: firebaseData.trnNumber || '',
            paymentAmounts: firebaseData.paymentAmounts || {}
          };
        }
      }
      
      // Create items array from serviceDetails with all fields
      const items: InvoiceItem[] = [];
      
      if (freshData.serviceDetails && freshData.serviceDetails.length > 0) {
        freshData.serviceDetails.forEach((service: any, index: number) => {
          items.push({
            id: `service-${index}-${Date.now()}`,
            description: service.name,
            branch: service.branch || freshData.branch || 'Main Branch',
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
          branch: freshData.branch || 'Main Branch',
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
      
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const totalTips = items.reduce((sum, item) => sum + (item.tip || 0), 0);
      
      const discountPercentage = freshData.discount || 0;
      const discountAmount = (subtotal * discountPercentage) / 100;
      
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = (taxableAmount * (freshData.tax || 5)) / 100;
      const totalAmount = subtotal - discountAmount + taxAmount + (freshData.serviceCharges || 0) + totalTips;
      const totalPaid = paymentMethods.reduce((sum, pm) => sum + pm.amount, 0);
      
      setInvoiceData({
        invoiceNumber: generateInvoiceNumber(),
        invoiceDate: new Date().toISOString().split('T')[0],
        customerName: freshData.customerName || freshData.customer,
        customerEmail: freshData.customerEmail || freshData.email || '',
        customerPhone: freshData.customerPhone || freshData.phone || '',
        customerAddress: `${freshData.branch || ''}, Dubai, UAE`,
        trnNumber: freshData.trnNumber || '',
        service: freshData.service || '',
        services: freshData.services || [freshData.service],
        barber: freshData.staffName || freshData.staff || freshData.barber,
        serviceDate: freshData.bookingDate || freshData.date,
        serviceTime: freshData.bookingTime || freshData.time,
        duration: freshData.duration || '60 min',
        servicePrice: freshData.servicePrice || freshData.price || 0,
        subtotal,
        discount: discountPercentage,
        discountType: 'percentage',
        tax: freshData.tax || 5,
        taxAmount,
        serviceTip: totalTips,
        serviceCharges: freshData.serviceCharges || 0,
        totalAmount,
        cardLast4Digits: freshData.cardLast4Digits || '',
        paymentMethods,
        totalPaid,
        balanceDue: totalAmount - totalPaid,
        items,
        notes: freshData.notes || '',
        branch: freshData.branch || 'Main Branch'
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
    
    const discountPercentage = invoiceData.discount;
    const discountAmount = (subtotal * discountPercentage) / 100;
    
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = (taxableAmount * invoiceData.tax) / 100;
    const totalAmount = subtotal - discountAmount + taxAmount + invoiceData.serviceCharges + totalTips;
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
    
    const discountPercentage = value;
    const discountAmount = (invoiceData.subtotal * discountPercentage) / 100;
    const taxableAmount = invoiceData.subtotal - discountAmount;
    const taxAmount = (taxableAmount * invoiceData.tax) / 100;
    const totalAmount = invoiceData.subtotal - discountAmount + taxAmount + invoiceData.serviceCharges + invoiceData.serviceTip;
    
    setInvoiceData({
      ...invoiceData,
      discount: discountPercentage,
      taxAmount,
      totalAmount,
      balanceDue: totalAmount - invoiceData.totalPaid
    });
  };
  
  const updateTax = (value: number) => {
    if (!invoiceData) return;
    
    const discountAmount = (invoiceData.subtotal * invoiceData.discount) / 100;
    const taxableAmount = invoiceData.subtotal - discountAmount;
    const taxAmount = (taxableAmount * value) / 100;
    const totalAmount = invoiceData.subtotal - discountAmount + taxAmount + invoiceData.serviceCharges + invoiceData.serviceTip;
    
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
    
    const discountAmount = (invoiceData.subtotal * invoiceData.discount) / 100;
    const taxableAmount = invoiceData.subtotal - discountAmount;
    const taxAmount = (taxableAmount * invoiceData.tax) / 100;
    const totalAmount = invoiceData.subtotal - discountAmount + taxAmount + value + invoiceData.serviceTip;
    
    setInvoiceData({
      ...invoiceData,
      serviceCharges: value,
      totalAmount,
      balanceDue: totalAmount - invoiceData.totalPaid
    });
  };
  
 const generatePDF = () => {
  if (!invoiceData) return;
  
  const doc = new jsPDF(); // Portrait mode for better layout
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  
  // ===== COMPANY HEADER =====
  doc.setFontSize(22);
  doc.setTextColor(0, 51, 102);
  doc.setFont("helvetica", "bold");
  doc.text("Jam Beauty Lounge", margin, 20);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("BASEMENT, NEAR TO CARRYFOUR, MARINA MALL", margin, 28);
  doc.text(`Contact: 028766460 | Email: jambeauty@gmail.com`, margin, 34);
  
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text('TAX INVOICE', pageWidth - margin - 40, 20);
  
  doc.setDrawColor(0, 51, 102);
  doc.line(margin, 40, pageWidth - margin, 40);
  
  // ===== CUSTOMER INFORMATION =====
  let yPos = 50;
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text('Customer Information:', margin, yPos);
  
  yPos += 7;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${invoiceData.customerName}`, margin, yPos);
  yPos += 6;
  doc.text(`Phone: ${invoiceData.customerPhone}`, margin, yPos);
  yPos += 6;
  doc.text(`Email: ${invoiceData.customerEmail}`, margin, yPos);
  yPos += 6;
  doc.text(`Date: ${invoiceData.serviceDate}  Time: ${invoiceData.serviceTime}`, margin, yPos);
  
  // TRN Number (if available)
  if (invoiceData.trnNumber) {
    yPos += 6;
    doc.text(`TRN: ${invoiceData.trnNumber}`, margin, yPos);
  }
  
  // Invoice Details on Right
  doc.setFont("helvetica", "bold");
  doc.text(`Invoice: ${invoiceData.invoiceNumber}`, pageWidth - margin - 60, 50);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${invoiceData.invoiceDate}`, pageWidth - margin - 60, 57);
  
  // ===== SERVICES TABLE =====
  yPos = 90;
  if (invoiceData.trnNumber) {
    yPos = 100; // Adjust if TRN was added
  }
  
  const tableHeaders = [['Service', 'Branch', 'Staff', 'Duration', 'Qty', 'Price', 'Tip', 'Total']];
  const tableData = invoiceData.items.map(item => [
    item.description,
    item.branch || 'Main Branch',
    item.staff || 'Not Assigned',
    item.duration || '60 min',
    item.quantity.toString(),
    formatCurrency(item.price),
    formatCurrency(item.tip || 0),
    formatCurrency(item.total + (item.tip || 0))
  ]);
  
  autoTable(doc, {
    startY: yPos,
    head: tableHeaders,
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [0, 51, 102], textColor: 255, fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 25 },
      2: { cellWidth: 25 },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 25, halign: 'right' }
    }
  });
  
  const tableEndY = (doc as any).lastAutoTable.finalY + 15;
  
  // ===== PAYMENT METHODS =====
  yPos = tableEndY;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text('Payment Methods:', margin, yPos);
  
  yPos += 7;
  invoiceData.paymentMethods.forEach((payment, index) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${payment.label}: ${formatCurrency(payment.amount)}`, margin + 5, yPos);
    if (payment.details) {
      doc.text(`  ${payment.details}`, margin + 15, yPos + 5);
      yPos += 10;
    } else {
      yPos += 6;
    }
  });
  
  if (invoiceData.cardLast4Digits) {
    doc.text(`Card: ****${invoiceData.cardLast4Digits}`, margin + 5, yPos);
    yPos += 6;
  }
  
  // ===== SUMMARY SECTION (RIGHT SIDE) =====
  const summaryX = pageWidth - margin - 85;
  let summaryY = tableEndY;
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text('Summary:', summaryX, summaryY);
  
  summaryY += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  // Subtotal
  doc.text(`Subtotal:`, summaryX, summaryY);
  doc.text(formatCurrency(invoiceData.subtotal), summaryX + 55, summaryY, { align: 'right' });
  summaryY += 6;
  
  // Tips
  if (invoiceData.serviceTip > 0) {
    doc.text(`Tips:`, summaryX, summaryY);
    doc.text(formatCurrency(invoiceData.serviceTip), summaryX + 55, summaryY, { align: 'right' });
    summaryY += 6;
  }
  
  // Discount
  if (invoiceData.discount > 0) {
    const discountAmount = (invoiceData.subtotal * invoiceData.discount) / 100;
    doc.text(`Discount (${invoiceData.discount}%):`, summaryX, summaryY);
    doc.text(`-${formatCurrency(discountAmount)}`, summaryX + 55, summaryY, { align: 'right' });
    summaryY += 6;
  }
  
  // Tax
  doc.text(`Tax (${invoiceData.tax}%):`, summaryX, summaryY);
  doc.text(formatCurrency(invoiceData.taxAmount), summaryX + 55, summaryY, { align: 'right' });
  summaryY += 6;
  
  // Service Charges
  if (invoiceData.serviceCharges > 0) {
    doc.text(`Service Charges:`, summaryX, summaryY);
    doc.text(formatCurrency(invoiceData.serviceCharges), summaryX + 55, summaryY, { align: 'right' });
    summaryY += 6;
  }
  
  // Total (Bold) - with separator line
  summaryY += 4;
  doc.setDrawColor(200, 200, 200);
  doc.line(summaryX, summaryY - 2, summaryX + 65, summaryY - 2);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Total:`, summaryX, summaryY + 4);
  doc.text(formatCurrency(invoiceData.totalAmount), summaryX + 55, summaryY + 4, { align: 'right' });
  
  // ===== FOOTER =====
  const footerY = doc.internal.pageSize.height - 15;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text('THANK YOU FOR YOUR BUSINESS', pageWidth / 2, footerY, { align: 'center' });
  
  doc.save(`Invoice-${invoiceData.invoiceNumber}.pdf`);
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
  staff: propStaff,
  showFullDetails = true,
  formatCurrency = (amount) => `AED ${amount.toFixed(2)}`,
  lockedBranch
}: AdvancedCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBarber, setSelectedBarber] = useState<string>('all');
  // NEW: Selected branch for filtering - locked for branch admins
  const [selectedBranch, setSelectedBranch] = useState<string>(lockedBranch || 'all');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [timeSlotGap, setTimeSlotGap] = useState(30);
  const [layoutMode, setLayoutMode] = useState<'time-top' | 'employee-top'>('time-top');
  const [businessHours, setBusinessHours] = useState({ start: 9, end: 18 });
  const [hiddenHours, setHiddenHours] = useState<number[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(propStaff || []);
  
  const [showAdvancePopup, setShowAdvancePopup] = useState(false);
  const [selectedAdvanceAppointment, setSelectedAdvanceAppointment] = useState<Appointment | null>(null);
  const [initialPopupAction, setInitialPopupAction] = useState<'reschedule' | null>(null);
  const [showInvoicePopup, setShowInvoicePopup] = useState(false);
  const [selectedInvoiceAppointment, setSelectedInvoiceAppointment] = useState<Appointment | null>(null);
  
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
    return staffMembers.filter(s =>
      (s.branch || '').toLowerCase().trim() === activeBranch.toLowerCase().trim()
    );
  }, [staffMembers, selectedBranch, lockedBranch]);

  // Reset barber filter when branch changes
  useEffect(() => {
    setSelectedBarber('all');
  }, [selectedBranch]);

  const barbers = useMemo(() => branchFilteredStaff.map(staff => staff.name), [branchFilteredStaff]);

  const generateTimeSlots = () => {
    const slots = [];
    const startTime = new Date(selectedDate);
    startTime.setHours(businessHours.start, 0, 0, 0);

    const endTime = new Date(selectedDate);
    endTime.setHours(businessHours.end, 0, 0, 0);

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

  const timeSlots = useMemo(() => generateTimeSlots(), [selectedDate, businessHours, timeSlotGap, hiddenHours]);

  // ==================== MAIN FILTER LOGIC - EXACT BRANCH MATCH ====================
 // ==================== MAIN FILTER LOGIC - FIXED BRANCH MATCH ====================
const filteredAppointments = useMemo(() => {
  console.log("========== BRANCH FILTER DEBUG ==========");
  console.log("1️⃣ Selected Branch from Dropdown:", selectedBranch);
  console.log("2️⃣ Total Appointments Received:", appointments.length);
  
  // List all unique branches in appointments
  const uniqueBranches = [...new Set(appointments.map(apt => apt.branch))];
  console.log("3️⃣ Unique Branches in Appointments:", uniqueBranches);
  
  // First filter by date and barber
  const dateAndBarberFiltered = appointments.filter(apt => {
    const aptDate = typeof apt.date === 'string' ? parseISO(apt.date) : new Date(apt.date);
    const isSameDate = isSameDay(aptDate, selectedDate);
    const isSameBarber = selectedBarber === 'all' || apt.barber === selectedBarber;
    
    return isSameDate && isSameBarber;
  });
  
  console.log(`4️⃣ After Date/Barber filter: ${dateAndBarberFiltered.length} bookings`);
  
  // AGAR "ALL BRANCHES" SELECT HAI TO SAB DIKHAO
  if (selectedBranch === 'all') {
    console.log("5️⃣ Showing ALL branches - NO branch filter applied");
    return dateAndBarberFiltered;
  }
  
  // SPECIFIC BRANCH SELECT HAI - SIRF EXACT MATCH WALI BOOKINGS DIKHAO
  console.log(`5️⃣ Filtering for branch: "${selectedBranch}"`);
  
  const filtered = dateAndBarberFiltered.filter(apt => {
    // EXACT MATCH - Booking mein branch "Mubaraka" hai aur selected branch "Mubaraka" hai
    const aptBranch = apt.branch || '';
    
    // Convert both to strings and trim for exact comparison
    const aptBranchStr = String(aptBranch).trim();
    const selectedBranchStr = String(selectedBranch).trim();
    
    // Exact match comparison
    const isSameBranch = aptBranchStr === selectedBranchStr;
    
    console.log(`   🔸 ${apt.customerName || apt.customer}: branch="${aptBranchStr}" | match=${isSameBranch}`);
    
    return isSameBranch;
  });
  
  console.log(`6️⃣ Final Filtered Count: ${filtered.length} bookings for branch "${selectedBranch}"`);
  console.log("==========================================");
  
  return filtered;
}, [appointments, selectedDate, selectedBarber, selectedBranch]);

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

  const getAppointmentForSlot = (timeSlot: string, barber: string): Appointment | undefined => {
    return filteredAppointments.find(apt =>
      apt.barber === barber && doesAppointmentCoverSlot(apt, timeSlot)
    );
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

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = direction === 'next'
      ? addDays(selectedDate, 1)
      : addDays(selectedDate, -1);
    setSelectedDate(newDate);
  };

  const toggleHiddenHour = (hour: number) => {
    setHiddenHours(prev =>
      prev.includes(hour)
        ? prev.filter(h => h !== hour)
        : [...prev, hour]
    );
  };

  const resetHiddenHours = () => {
    setHiddenHours([]);
  };

  const getStaffAvatar = (barberName: string): string => {
    const staff = staffMembers.find(s => s.name === barberName);
    return staff?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop";
  };

  const getStaffRole = (barberName: string): string => {
    const staff = staffMembers.find(s => s.name === barberName);
    return staff?.role || "Staff";
  };

  const handleAdvanceAppointmentClick = (appointment: Appointment) => {
    console.log("🎯 ADVANCE CALENDAR Click:", appointment);
    setSelectedAdvanceAppointment(appointment);
    setInitialPopupAction(null);
    setShowAdvancePopup(true);
  };

  const handleAppointmentAction = (action: 'reschedule' | 'edit' | 'checkin' | 'cancel' | 'delete' | 'checkout', appointment: Appointment) => {
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
    }
  };

  const handleGenerateInvoiceClick = (appointment: Appointment) => {
    console.log("💰 Generate Invoice for:", appointment);
    setSelectedInvoiceAppointment(appointment);
    setShowInvoicePopup(true);
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
           <CardTitle className="flex items-center gap-2">
  <Calendar className="w-6 h-6 text-pink-600 " />
  <span className="text-xl font-extrabold bg-linear-to-r from-pink-600 to-pink-600 bg-clip-text text-pink-600">
     Booking Calendar
  </span>
 
</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {/* Branch Filter Dropdown - hidden for locked (branch admin) */}
              {!lockedBranch && (
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches ({branches.length})</SelectItem>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.name}>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        <span>{branch.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              )}



  
                 
              

               




 <Select value={selectedBarber} onValueChange={setSelectedBarber}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Staff" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Staff ({branchFilteredStaff.length})</SelectItem>
                      {branchFilteredStaff.map(staff => (
                        <SelectItem key={staff.id} value={staff.name}>
                          <div className="flex items-center gap-2">
                            <div className="relative w-4 h-4 rounded-full overflow-hidden">
                              <img 
                                src={staff.avatar} 
                                alt={staff.name} 
                                className="object-cover w-full h-full"
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















              <div className="flex items-center gap-2">
                <Button
                  variant={layoutMode === 'time-top' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLayoutMode('time-top')}
                  className="flex items-center gap-1"
                >
                  <Grid3X3 className="w-4 h-4" />
                  Time Top
                </Button>
                <Button
                  variant={layoutMode === 'employee-top' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLayoutMode('employee-top')}
                  className="flex items-center gap-1"
                >
                  <RotateCcw className="w-4 h-4" />
                  Employee Top
                </Button>
              </div>

              <Select value={timeSlotGap.toString()} onValueChange={(value) => setTimeSlotGap(parseInt(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-1"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Button>

              {onCreateBooking && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    const defaultBarber = barbers.length > 0 ? barbers[0] : 'all';
                    const defaultTime = timeSlots.length > 0 ? timeSlots[0] : '09:00';
                    onCreateBooking(defaultBarber, format(selectedDate, 'yyyy-MM-dd'), defaultTime);
                  }}
                  className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                >
                  <PlusCircle className="w-4 h-4" />
                  Quick Book
                </Button>
              )}

              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-medium min-w-[120px] text-center px-2">
                  {format(selectedDate, 'MMM dd, yyyy')}
                </span>
                <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {showSettings && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Business Hours</Label>
                  <div className="flex items-center gap-2">
                    <Select
                      value={businessHours.start.toString()}
                      onValueChange={(value) => setBusinessHours(prev => ({ ...prev, start: parseInt(value) }))}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 6).map(hour => (
                          <SelectItem key={hour} value={hour.toString()}>
                            {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span>to</span>
                    <Select
                      value={businessHours.end.toString()}
                      onValueChange={(value) => setBusinessHours(prev => ({ ...prev, end: parseInt(value) }))}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 12).map(hour => (
                          <SelectItem key={hour} value={hour.toString()}>
                            {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Hidden Hours</Label>
                    <Button variant="ghost" size="sm" onClick={resetHiddenHours}>
                      Reset
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Array.from({ length: businessHours.end - businessHours.start }, (_, i) => businessHours.start + i).map(hour => (
                      <Button
                        key={hour}
                        variant={hiddenHours.includes(hour) ? "destructive" : "outline"}
                        size="sm"
                        className="w-12 h-8 text-xs"
                        onClick={() => toggleHiddenHour(hour)}
                      >
                        {hour > 12 ? `${hour - 12}P` : `${hour}A`}
                      </Button>
                    ))}
                  </div>
                </div>

               
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto overflow-y-auto max-h-[900px] sm:max-h-[600px] w-full">
            <div className="min-w-full" style={{ width: 'max-content' }}>
              {layoutMode === 'time-top' ? (
                <>
                  <div className="grid gap-1 mb-2 sticky top-0 bg-background z-10 border-b pb-2" style={{ gridTemplateColumns: `clamp(120px, 15vw, 200px) repeat(${timeSlots.length}, minmax(50px, 1fr))` }}>
                    <div className="p-2 font-medium text-sm text-muted-foreground sticky left-0 bg-background">
                      Staff / Time
                    </div>
                    {timeSlots.map(slot => (
                      <div key={slot} className="p-1 text-xs text-center font-medium text-muted-foreground border rounded bg-muted/50 min-w-[50px]">
                        {slot}
                      </div>
                    ))}
                  </div>

                  {(selectedBarber === 'all' ? barbers : [selectedBarber]).map(barber => {
                    let slotIndex = 0;
                    const rowElements: React.ReactElement[] = [];
                    
                    while (slotIndex < timeSlots.length) {
                      const currentSlot = timeSlots[slotIndex];
                      const appointment = getAppointmentForSlot(currentSlot, barber);
                      
                      if (appointment && isAppointmentStart(appointment, currentSlot)) {
                        const span = Math.min(getAppointmentSpan(appointment, currentSlot), timeSlots.length - slotIndex);
                        
                        rowElements.push(
                          <div
                            key={`${barber}-${currentSlot}`}
                            className={`relative p-1 rounded cursor-pointer hover:shadow-md transition-all duration-200 min-h-[60px] flex items-center justify-center border-2 border-transparent ${getStatusColor(appointment.status)}`}
                            style={{ gridColumn: `span ${span}` }}
                            onClick={() => handleAdvanceAppointmentClick(appointment)}
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
                                  <DropdownMenuItem className="text-red-600" onClick={() => handleAppointmentAction('delete', appointment)}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Booking
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <div className="w-full h-full flex flex-col items-center justify-center text-xs p-1">
                              <div className="w-2 h-2 rounded-full mb-1 bg-white/80" />
                              <div className="font-medium truncate w-full text-center leading-tight">
                                {appointment.customer.split(' ')[0]}
                              </div>
                              <div className="text-white/90 truncate w-full text-center text-[10px] leading-tight">
                                {appointment.service}
                              </div>
                              <div className="text-white/80 text-[9px] mt-1">
                                {appointment.duration}
                              </div>
                            </div>
                          </div>
                        );
                        
                        slotIndex += span;
                      } else if (appointment) {
                        slotIndex += 1;
                      } else {
                        rowElements.push(
                          <div
                            key={`${barber}-${currentSlot}`}
                            className="p-1 border rounded cursor-pointer hover:shadow-md transition-all duration-200 min-h-[60px] flex items-center justify-center border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-green-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCreateBooking && onCreateBooking(barber, format(selectedDate, 'yyyy-MM-dd'), currentSlot);
                            }}
                          >
                            <div className="text-muted-foreground/50 text-xs text-center cursor-pointer hover:text-green-600 transition-colors flex flex-col items-center gap-1">
                              <PlusCircle className="w-3 h-3" />
                              Book
                            </div>
                          </div>
                        );
                        slotIndex += 1;
                      }
                    }
                    
                    const staff = staffMembers.find(s => s.name === barber);
                    const staffAvatar = getStaffAvatar(barber);
                    const staffRole = getStaffRole(barber);
                    
                    return (
                      <div key={barber} className="grid gap-1 mb-1" style={{ gridTemplateColumns: `clamp(120px, 15vw, 200px) repeat(${timeSlots.length}, minmax(50px, 1fr))` }}>
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
                            <div className="text-[10px] text-muted-foreground truncate">{staffRole}</div>
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
                    gridTemplateColumns: `clamp(120px, 15vw, 150px) repeat(${(selectedBarber === 'all' ? barbers : [selectedBarber]).length}, minmax(80px, 1fr))`,
                  }}
                >
                  <div className="p-2 font-medium text-sm text-muted-foreground sticky top-0 bg-background z-20 border-b">
                    Time / Staff
                  </div>
                  {(selectedBarber === 'all' ? barbers : [selectedBarber]).map(barber => {
                    const staff = staffMembers.find(s => s.name === barber);
                    const staffAvatar = getStaffAvatar(barber);
                    const staffRole = getStaffRole(barber);
                    
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
                        <div className="text-center">
                          <div className="font-medium truncate">{barber.split(' ')[0]}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{staffRole}</div>
                        </div>
                      </div>
                    );
                  })}

                  {timeSlots.map((slot, slotIndex) => (
                    <React.Fragment key={slot}>
                      <div className="p-2 sm:p-3 bg-muted rounded flex items-center gap-2 sticky left-0 z-20 border-r min-h-20">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="font-medium text-xs sm:text-sm">{slot}</span>
                      </div>
                      
                      {(selectedBarber === 'all' ? barbers : [selectedBarber]).map(barber => {
                        const appointment = getAppointmentForSlot(slot, barber);
                        
                        if (appointment && isAppointmentStart(appointment, slot)) {
                          const span = Math.min(getAppointmentSpan(appointment, slot), timeSlots.length - slotIndex);
                          return (
                            <div
                              key={`${slot}-${barber}`}
                              className={`relative p-1 rounded cursor-pointer hover:shadow-md transition-all duration-200 flex items-center justify-center border-2 border-transparent ${getStatusColor(appointment.status)}`}
                              style={{ gridRow: `span ${span}` }}
                              onClick={() => handleAdvanceAppointmentClick(appointment)}
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
                                    <DropdownMenuItem className="text-red-600" onClick={() => handleAppointmentAction('delete', appointment)}>
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete Booking
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              <div className="w-full h-full flex flex-col items-center justify-center text-xs p-1">
                                <div className="w-2 h-2 rounded-full mb-1 bg-white/80" />
                                <div className="text-white/80 text-[9px] mb-0.5 font-medium">
                                  {appointment.time}
                                </div>
                                <div className="font-medium truncate w-full text-center leading-tight">
                                  {appointment.customer.split(' ')[0]}
                                </div>
                                <div className="text-white/90 truncate w-full text-center text-[10px] leading-tight">
                                  {appointment.service}
                                </div>
                                <div className="text-white/80 text-[9px] mt-1">
                                  {appointment.duration}
                                </div>
                              </div>
                            </div>
                          );
                        } else if (appointment) {
                          return null;
                        } else {
                          return (
                            <div
                              key={`${slot}-${barber}`}
                              className="p-1 border rounded cursor-pointer hover:shadow-md transition-all duration-200 flex items-center justify-center border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 hover:bg-green-50 min-h-20"
                              onClick={(e) => {
                                e.stopPropagation();
                                onCreateBooking && onCreateBooking(barber, format(selectedDate, 'yyyy-MM-dd'), slot);
                              }}
                            >
                              <div className="text-muted-foreground/50 text-xs text-center cursor-pointer hover:text-green-600 transition-colors flex flex-col items-center gap-1">
                                <PlusCircle className="w-3 h-3" />
                                Book
                              </div>
                            </div>
                          );
                        }
                      })}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600" />
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span>Scheduled</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span>Approved</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span>Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-500" />
                  <span>Rescheduled</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span>Cancelled/Rejected</span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>Gap: {timeSlotGap}min</span>
                  <span>Hours: {businessHours.start > 12 ? `${businessHours.start - 12}PM` : `${businessHours.start}AM`} - {businessHours.end > 12 ? `${businessHours.end - 12}PM` : `${businessHours.end}AM`}</span>
                  <span>Layout: {layoutMode === 'time-top' ? 'Time → Staff' : 'Staff → Time'}</span>
                </div>
              </div>
            </div>

            {branchFilteredStaff.length > 0 && (
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                
                <div className="flex flex-wrap gap-2">
                  {branchFilteredStaff.slice(0, 3).map(staff => (
                    <div key={staff.id} className="flex items-center gap-1 text-xs px-2 py-1 bg-background rounded">
                      <div className="relative w-3 h-3 rounded-full overflow-hidden">
                        <img 
                          src={staff.avatar} 
                          alt={staff.name} 
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop";
                          }}
                        />
                      </div>
                      <span>{staff.name.split(' ')[0]}</span>
                    </div>
                  ))}
                  {branchFilteredStaff.length > 3 && (
                    <span className="text-xs">+{branchFilteredStaff.length - 3} more</span>
                  )}
                </div>
              </div>
            )}
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
          formatCurrency={formatCurrency}
        />
      )}
    </>
  );
}

