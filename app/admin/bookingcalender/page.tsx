'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar, Clock, User, Search, Filter, CheckCircle, XCircle, AlertCircle, Bell, Smartphone, Globe, Plus, Edit, Trash2, Phone, Mail, RefreshCw, FileText, Scissors, Package, DollarSign, Receipt, CheckCircle2, Eye, Play, Star, FileCheck, Download, Printer, MoreVertical, CreditCard, Hash, Building, Tag, Calculator, MapPin } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AdminSidebar, AdminMobileSidebar } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { AdvancedCalendar } from "@/components/ui/advanced-calendar";
import { useNotifications } from "@/components/ui/notification-system";
import { useCurrencyStore } from "@/stores/currency.store";
import { useBookingStore } from "@/stores/booking.store";
import { useBranchStore } from "@/stores/branch.store";
import { cn } from "@/lib/utils";
import { CurrencySwitcher } from "@/components/ui/currency-switcher";
import { getTemplate, InvoiceData } from "@/components/invoice-templates";
import { generateInvoiceNumber } from "@/lib/invoice-utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { collection, getDocs, query, orderBy, where, doc, updateDoc, addDoc, serverTimestamp, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generateUnifiedInvoicePdf } from "@/lib/unified-invoice-pdf";

// ===================== UPDATED TYPE DEFINITIONS =====================

interface FirebaseProductOrder {
  id: string;
  firebaseId: string;
  orderNumber: string;
  customer: string;
  customerEmail: string;
  customerPhone: string;
  products: string[];
  quantity: number;
  total: number;
  status: string;
  date: string;
  payment: string;
  paymentStatus: string;
  shippingAddress: string;
  branchNames: string;
  transactionId: string;
  createdAt: Date;
  updatedAt: Date;
  expectedDeliveryDate: Date | null;
  orderNotes: string;
  customerId: string;
}

interface FirebaseBooking {
  serviceDuration: number;
  serviceName: string;
  createdBy: string;
  servicePrice: number;
  totalAmount: number;
  subtotal?: number;
  taxAmount?: number;
  serviceCharges?: number;
  id: string;
  firebaseId: string;
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  services: string[];
  serviceDetails?: Array<{
    id: string;
    name: string;
    price: number;
    duration: number;
    category: string;
  }>;
  totalDuration: number;
  totalPrice: number;
  status: string;
  bookingDate: string;
  bookingTime: string;
  paymentMethod: string;
  paymentStatus: string;
  branch: string;
  staff: string;
  staffId: string;
  staffRole: string;
  notes: string;
  serviceCategory: string;
  serviceId: string;
  timeSlot: string;
  pointsAwarded: boolean;
  createdAt: Date;
  updatedAt: Date;
  customerId: string;
  cardLast4Digits?: string;
  trnNumber?: string;
  referenceNumber?: string;
  teamMembers?: Array<{name: string, tip: number}>;
  products?: Array<{name: string, category: string, price: number, quantity: number}>;
  paymentMethods?: Array<'cash' | 'card' | 'check' | 'digital' | 'wallet' | 'ewallet'>;
  paymentAmounts?: {
    cash: number;
    card: number;
    check: number;
    digital: number;
    wallet?: number;
    ewallet?: number;
  };
  discount?: number;
  discountType?: 'fixed' | 'percentage';
  discountSource?: string;
  discountDescription?: string;
  couponCode?: string;
  couponDiscountAmount?: number;
  taxType?: 'inclusive' | 'exclusive';
  serviceTip?: number;
  tax?: number;
}

interface FirebaseStaff {
  id: string;
  firebaseId: string;
  staffId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  specialization: string[];
  branch: string;
  branchId?: string;
  branchNames?: string[];
  branches?: string[];
  userBranchId?: string;
  userBranchName?: string;
  avatar: string;
  status: string;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

const normalizeBranchValue = (value: string | undefined | null): string =>
  (value || '').toLowerCase().trim();

const isStaffActive = (status?: string): boolean =>
  normalizeBranchValue(status) === 'active';

const staffBelongsToBranch = (
  staff: FirebaseStaff,
  branchName?: string,
  branchId?: string
): boolean => {
  if (!branchName && !branchId) return true;

  const normalizedBranchName = normalizeBranchValue(branchName);
  const normalizedPrimaryBranch = normalizeBranchValue(staff.branch);
  const normalizedBranchNames = (staff.branchNames || []).map((name) => normalizeBranchValue(name));
  const normalizedCommaBranches = (staff.branch || '')
    .split(/[,|]/)
    .map((name) => normalizeBranchValue(name))
    .filter(Boolean);
  const branchIds = staff.branches || [];

  const nameMatches =
    (!!normalizedBranchName && normalizedPrimaryBranch === normalizedBranchName) ||
    (!!normalizedBranchName && normalizedBranchNames.includes(normalizedBranchName)) ||
    (!!normalizedBranchName && normalizedCommaBranches.includes(normalizedBranchName));

  const idMatches =
    !!branchId && (
      branchIds.includes(branchId) ||
      staff.branchId === branchId ||
      staff.userBranchId === branchId
    );

  const userBranchNameMatch =
    !!normalizedBranchName && normalizeBranchValue(staff.userBranchName) === normalizedBranchName;

  return nameMatches || idMatches || userBranchNameMatch;
};

interface FirebaseService {
  id: string;
  firebaseId: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  categoryId: string;
  branchNames: string[];
  branches: string[];
  imageUrl: string;
  popularity: string;
  status: string;
  revenue: number;
  totalBookings: number;
  createdAt: Date;
  updatedAt: Date;
}

interface FirebaseCategory {
  id: string;
  firebaseId: string;
  name: string;
  description: string;
  type: string;
  isActive: boolean;
  image: string;
  branchId: string;
  branchName: string;
  branchCity: string;
  branches?: string[];
  branchNames?: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface FirebaseBranch {
  id: string;
  firebaseId: string;
  name: string;
  city: string;
  country: string;
  address: string;
  phone: string;
  email: string;
  openingTime: string;
  closingTime: string;
  status: string;
  managerName: string;
  managerEmail: string;
  managerPhone: string;
  image: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CalendarDisplaySettings {
  weeklyTimings: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
  timeSlotGap: number;
  layoutMode: 'time-top' | 'employee-top';
  businessHours: { start: number; end: number };
  hiddenHours: number[];
  totalValueDisplayMode: 'both' | 'with-tax' | 'without-tax';
  invoiceValueDisplayMode: 'with-tax' | 'without-tax';
}

const DEFAULT_WEEKLY_TIMINGS = {
  monday: { open: '09:00', close: '22:00', closed: false },
  tuesday: { open: '09:00', close: '22:00', closed: false },
  wednesday: { open: '09:00', close: '22:00', closed: false },
  thursday: { open: '09:00', close: '22:00', closed: false },
  friday: { open: '09:00', close: '22:00', closed: false },
  saturday: { open: '09:00', close: '22:00', closed: false },
  sunday: { open: '09:00', close: '22:00', closed: false },
};

const DEFAULT_INVOICE_DISCLAIMER_TEMPLATE =
  'This invoice is generated by system with current date and time: {{dateTime}}. No refund available on any service, product, or e-wallet transaction.';

type PaymentMethodAvailability = {
  cash: boolean;
  card: boolean;
  check: boolean;
  digital: boolean;
  ewallet: boolean;
};

const DEFAULT_PAYMENT_METHOD_AVAILABILITY: PaymentMethodAvailability = {
  cash: true,
  card: true,
  check: true,
  digital: true,
  ewallet: true,
};

interface Appointment {
  servicePrice: number;
  id: string | number;
  firebaseId?: string;
  bookingNumber?: string;
  customerId?: string;
  subtotal?: number;
  taxAmount?: number;
  totalAmount?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  customer: string;
  service: string;
  services?: string[];
  serviceDetails?: Array<{
    id?: string;
    name?: string;
    serviceName?: string;
    price: number;
    branch?: string;
    staff?: string;
    staffId?: string;
  }>;
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
  createdAt: Date;
  updatedAt: Date;
  staffId?: string;
  staffRole?: string;
  serviceCategory?: string;
  pointsAwarded?: boolean;
  cardLast4Digits?: string;
  trnNumber?: string;
  referenceNumber?: string;
  teamMembers?: Array<{name: string, tip: number}>;
  products?: Array<{name: string, category: string, price: number, quantity: number}>;
  paymentMethods?: Array<'cash' | 'card' | 'check' | 'digital' | 'wallet' | 'ewallet'>;
  paymentAmounts?: {
    cash: number;
    card: number;
    check: number;
    digital: number;
    wallet?: number;
    ewallet?: number;
  };
  discount?: number;
  discountType?: 'fixed' | 'percentage';
  couponCode?: string;
  couponDiscountAmount?: number;
  taxType?: 'inclusive' | 'exclusive';
  serviceTip?: number;
  serviceCharges?: number;
  tax?: number;
}

interface BookingFormData {
  customer: string;
  phone: string;
  email: string;
  service: string;
  services: string[];
  barber: string;
  teamMembers: Array<{name: string, tip: number}>;
  date: string;
  time: string;
  notes: string;
  products: Array<{name: string, category: string, price: number, quantity: number}>;
  tax: number;
  serviceCharges: number;
  discount: number;
  discountType: 'fixed' | 'percentage';
  serviceTip: number;
  paymentMethods: Array<'cash' | 'card' | 'check' | 'digital' | 'wallet' | 'ewallet'>;
  paymentAmounts: {
    cash: number;
    card: number;
    check: number;
    digital: number;
    wallet?: number;
    ewallet?: number;
  };
  status: string;
  generateInvoice: boolean;
  cardLast4Digits: string;
  trnNumber: string;
  category: string;
  branch: string;
}

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

interface ServiceInvoiceDetail {
  serviceName: string;
  branch: string;
  staff: string;
  staffId?: string;
  price: number;
  tip?: number;
}

interface ExtendedInvoiceData extends InvoiceData {
  customerId?: string;
  customerAddress?: string;
  paymentMethod?: string;
  paymentMethods?: string[];
  paymentAmounts?: {
    cash?: number;
    card?: number;
    check?: number;
    digital?: number;
    ewallet?: number;
    [key: string]: number | undefined;
  };
  branch?: string;
  subtotal?: number;
  total?: number;
  items?: InvoiceItem[];
  serviceDetails?: ServiceInvoiceDetail[];
  taxAmount?: number;
  discountAmount?: number;
  discountType?: 'fixed' | 'percentage';
  discountSource?: string;
  discountDescription?: string;
  couponCode?: string;
  couponDiscountAmount?: number;
  taxType?: 'inclusive' | 'exclusive';
  ewalletBalanceAvailable?: number;
  cardLast4Digits?: string;
  trnNumber?: string;
  referenceNumber?: string;
  disclaimerText?: string;
  teamMembers?: Array<{name: string, tip: number}>;
  serviceTip?: number;
  serviceCharges?: number;
  services?: string[];
}

// ===================== FIREBASE FUNCTIONS =====================

const fetchProductOrders = async (addNotification: (notification: { type: string; title: string; message: string }) => void): Promise<FirebaseProductOrder[]> => {
  try {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const orders: FirebaseProductOrder[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      const productsArray = data.products || [];
      const productNames = productsArray.map((p: any) => 
        p.productName || p.name || "Unknown Product"
      );
      
      const branchNames = Array.isArray(data.branchNames) 
        ? data.branchNames.join(", ") 
        : data.branchNames || "Unknown Branch";
      
      const totalQuantity = productsArray.reduce((sum: number, product: any) => 
        sum + (product.quantity || 1), 0
      );
      
      const orderDate = data.orderDate || 
        (data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : 
        new Date().toISOString().split('T')[0]);
      
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
      const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date();
      
      const orderData: FirebaseProductOrder = {
        id: doc.id,
        firebaseId: doc.id,
        orderNumber: `PO-${doc.id.substring(0, 5).toUpperCase()}`,
        customer: data.customerName || "Unknown Customer",
        customerEmail: data.customerEmail || "",
        customerPhone: data.customerPhone || "",
        products: productNames,
        quantity: totalQuantity,
        total: data.totalAmount || 0,
        status: data.status || "pending",
        date: orderDate,
        payment: data.paymentMethod || "unknown",
        paymentStatus: data.paymentStatus || "pending",
        shippingAddress: data.shippingAddress || "",
        branchNames: branchNames,
        transactionId: data.transactionId || "",
        createdAt,
        updatedAt,
        expectedDeliveryDate: data.expectedDeliveryDate?.toDate ? data.expectedDeliveryDate.toDate() : null,
        orderNotes: data.orderNotes || "",
        customerId: data.customerId || ""
      };
      orders.push(orderData);
    });
    
    return orders;
  } catch (error) {
    console.error("Error fetching orders:", error);
    addNotification({
      type: 'error',
      title: 'Orders Load Error',
      message: 'Failed to load orders from Firebase'
    });
    return [];
  }
};

// ✅ FIXED: fetchBookings with branch filtering and NO orderBy
const fetchBookings = async (addNotification: any, userBranch?: string): Promise<FirebaseBooking[]> => {
  try {
    const bookingsRef = collection(db, "bookings");
    
    // ✅ Create query based on user role - NO orderBy
    let q;
    if (userBranch) {
      // Branch admin - sirf apni branch ke bookings
      q = query(
        bookingsRef, 
        where('branchNames', 'array-contains', userBranch)
        // ❌ NO orderBy - index avoid karne ke liye
      );
      console.log(`🏢 Branch Admin (${userBranch}): Fetching bookings for branch`);
    } else {
      // Super admin - sab bookings with orderBy
      q = query(bookingsRef, orderBy("createdAt", "desc"));
      console.log('👑 Super Admin: Fetching all bookings');
    }
    
    const querySnapshot = await getDocs(q);
    
    const bookings: FirebaseBooking[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      const bookingData: FirebaseBooking = {
        id: doc.id,
        firebaseId: doc.id,
        servicePrice: data.servicePrice || 0,
        subtotal: data.subtotal || data.servicePrice || 0,
        totalAmount: data.totalAmount || data.servicePrice || 0,
        taxAmount: data.taxAmount || 0,
        serviceCharges: data.serviceCharges || 0,
        customerName: data.customerName || "Unknown",
        customerEmail: data.customerEmail || "",
        customerPhone: data.customerPhone || "",
        serviceName: data.serviceName || "",
        serviceDuration: data.serviceDuration || 60,
        services: Array.isArray(data.services) ? data.services : [data.serviceName || ""],
        totalDuration: data.serviceDuration || 60,
        totalPrice: data.totalAmount || data.servicePrice || 0,
        status: data.status || "pending",
        bookingDate: data.bookingDate || data.date?.split(' ')[0] || "",
        bookingTime: data.time || data.timeSlot || "",
        paymentMethod: data.paymentMethod || "cash",
        paymentStatus: data.paymentStatus || "pending",
        branch: Array.isArray(data.branchNames) ? data.branchNames[0] : data.branch || "All Branches",
        staff: data.staffName || data.staff || "Not Assigned",
        staffId: data.staffId || "",
        staffRole: data.staffRole || "",
        notes: data.notes || "",
        serviceCategory: data.serviceCategory || "",
        serviceId: data.serviceId || "",
        timeSlot: data.timeSlot || "",
        pointsAwarded: data.pointsAwarded || false,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        customerId: data.customerId || "",
        createdBy: data.createdBy || "",
        cardLast4Digits: data.cardLast4Digits || "",
        trnNumber: data.trnNumber || "",
        referenceNumber: data.referenceNumber || data.paymentReferenceNumber || "",
        teamMembers: Array.isArray(data.teamMembers) ? data.teamMembers : [],
        products: Array.isArray(data.products) ? data.products : [],
        paymentMethods: Array.isArray(data.paymentMethods) ? data.paymentMethods : [],
        paymentAmounts: data.paymentAmounts || { 
          cash: data.paymentAmounts?.cash || 0,
          card: data.paymentAmounts?.card || 0,
          check: data.paymentAmounts?.check || 0,
          digital: data.paymentAmounts?.digital || 0,
          wallet: data.paymentAmounts?.wallet || 0
        },
        discount: data.discount || 0,
        discountType: data.discountType || 'fixed',
        serviceTip: data.serviceTip || 0,
        tax: data.tax || 5,
        bookingNumber: data.bookingNumber || `BK-${doc.id.substring(0, 8)}`
      };
      
      bookings.push(bookingData);
    });
    
    // ✅ MANUAL SORTING for branch admin - index ki zaroorat nahi
    if (userBranch) {
      bookings.sort((a, b) => {
        const dateA = a.createdAt?.getTime() || 0;
        const dateB = b.createdAt?.getTime() || 0;
        return dateB - dateA; // descending
      });
    }
    
    console.log(`✅ Loaded ${bookings.length} bookings from Firebase for ${userBranch || 'all branches'}`);
    
    return bookings;
  } catch (error) {
    console.error("❌ Error fetching bookings:", error);
    return [];
  }
};

const fetchStaff = async (): Promise<FirebaseStaff[]> => {
  try {
    const staffRef = collection(db, "staff");
    const q = query(staffRef);
    const querySnapshot = await getDocs(q);
    
    const staff: FirebaseStaff[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
      const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date();
      
      const staffData: FirebaseStaff = {
        id: doc.id,
        firebaseId: doc.id,
        staffId: `STF-${doc.id.substring(0, 5).toUpperCase()}`,
        name: data.name || "Unknown Staff",
        email: data.email || "",
        phone: data.phone || "",
        role: data.role || "staff",
        specialization: Array.isArray(data.specialization) ? data.specialization : [],
        branch: data.branch || "Main Branch",
        branchId: data.branchId || data.userBranchId || '',
        branchNames: Array.isArray(data.branchNames) ? data.branchNames : [],
        branches: Array.isArray(data.branches) ? data.branches : [],
        userBranchId: data.userBranchId || data.branchId || '',
        userBranchName: data.userBranchName || '',
        avatar: data.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
        status: data.status || "active",
        rating: data.rating || 0,
        createdAt,
        updatedAt
      };
      staff.push(staffData);
    });
    
    return staff;
  } catch (error) {
    console.error("Error fetching staff:", error);
    return [];
  }
};

const fetchServices = async (): Promise<FirebaseService[]> => {
  try {
    const servicesRef = collection(db, "services");
    const q = query(servicesRef, where("status", "==", "active"));
    const querySnapshot = await getDocs(q);
    
    const services: FirebaseService[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
      const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date();
      
      const serviceData: FirebaseService = {
        id: doc.id,
        firebaseId: doc.id,
        name: data.name || "Unknown Service",
        description: data.description || "",
        price: data.price || 0,
        duration: data.duration || 60,
        category: data.category || "",
        categoryId: data.categoryId || "",
        branchNames: Array.isArray(data.branchNames) ? data.branchNames : [],
        branches: Array.isArray(data.branches) ? data.branches : [],
        imageUrl: data.imageUrl || "https://t4.ftcdn.net/jpg/02/44/16/37/360_F_244163733_ErNyvrHfOJcRlHd7t3doQcs4bEgclAfq.jpg",
        popularity: data.popularity || "low",
        status: data.status || "active",
        revenue: data.revenue || 0,
        totalBookings: data.totalBookings || 0,
        createdAt,
        updatedAt
      };
      services.push(serviceData);
    });
    
    return services;
  } catch (error) {
    console.error("Error fetching services:", error);
    return [];
  }
};

const fetchCategories = async (): Promise<FirebaseCategory[]> => {
  try {
    const categoriesRef = collection(db, "categories");
    const q = query(categoriesRef, where("isActive", "==", true));
    const querySnapshot = await getDocs(q);
    
    const categories: FirebaseCategory[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
      const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date();
      
      const categoryData: FirebaseCategory = {
        id: doc.id,
        firebaseId: doc.id,
        name: data.name || "Unknown Category",
        description: data.description || "",
        type: data.type || "service",
        isActive: data.isActive || true,
        image: data.image || "",
        branchId: data.branchId || "",
        branchName: data.branchName || "",
        branchCity: data.branchCity || "",
        branches: data.branches || [],
        branchNames: data.branchNames || [],
        createdAt,
        updatedAt
      };
      categories.push(categoryData);
    });
    
    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

const fetchBranches = async (): Promise<FirebaseBranch[]> => {
  try {
    const branchesRef = collection(db, "branches");
    const q = query(branchesRef, where("status", "==", "active"));
    const querySnapshot = await getDocs(q);
    
    const branches: FirebaseBranch[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
      const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date();
      
      const branchData: FirebaseBranch = {
        id: doc.id,
        firebaseId: doc.id,
        name: data.name || "Unknown Branch",
        city: data.city || "",
        country: data.country || "",
        address: data.address || "",
        phone: data.phone || "",
        email: data.email || "",
        openingTime: data.openingTime || "09:00",
        closingTime: data.closingTime || "18:00",
        status: data.status || "active",
        managerName: data.managerName || "",
        managerEmail: data.managerEmail || "",
        managerPhone: data.managerPhone || "",
        image: data.image || "",
        description: data.description || "",
        createdAt,
        updatedAt
      };
      branches.push(branchData);
    });
    
    return branches;
  } catch (error) {
    console.error("Error fetching branches:", error);
    return [];
  }
};

const updateBookingStatusInFirebase = async (bookingId: string, newStatus: string): Promise<boolean> => {
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingRef, {
      status: newStatus,
      updatedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error("Error updating booking status:", error);
    return false;
  }
};

const updateProductOrderStatusInFirebase = async (orderId: string, newStatus: string): Promise<boolean> => {
  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      status: newStatus,
      updatedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error("Error updating product order status:", error);
    return false;
  }
};

const deleteProductOrderInFirebase = async (orderId: string): Promise<boolean> => {
  try {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      status: "deleted",
      deletedAt: new Date(),
      updatedAt: new Date()
    });
    return true;
  } catch (error) {
    console.error("Error deleting product order:", error);
    return false;
  }
};

const createBookingInFirebase = async (
  bookingData: BookingFormData, 
  selectedServices: FirebaseService[],
  selectedCategory: FirebaseCategory | null,
  selectedBranch: FirebaseBranch | null,
  addNotification: (notification: { type: 'error' | 'success' | 'warning' | 'info'; title: string; message: string }) => void
): Promise<{success: boolean, bookingId?: string, booking?: FirebaseBooking}> => {
  try {
    const servicesPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
    const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
    const productsTotal = bookingData.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    
    let subtotal = servicesPrice + productsTotal + bookingData.serviceCharges;
    
    let discountAmount = 0;
    if (bookingData.discount > 0) {
      if (bookingData.discountType === 'percentage') {
        discountAmount = subtotal * (bookingData.discount / 100);
        subtotal = subtotal * (1 - bookingData.discount / 100);
      } else {
        discountAmount = bookingData.discount;
        subtotal = Math.max(0, subtotal - bookingData.discount);
      }
    }
    
    const taxAmount = (subtotal * bookingData.tax) / 100;
    const totalTips = bookingData.serviceTip + bookingData.teamMembers.reduce((sum, tm) => sum + tm.tip, 0);
    const totalAmount = subtotal + taxAmount + totalTips;
    
    const primaryStaff = bookingData.teamMembers.find(tm => tm.name === bookingData.barber);
    const bookingNumber = `ADMIN-${Date.now()}`;
    
    const serviceDetails = selectedServices.map(service => ({
      id: service.firebaseId,
      name: service.name,
      price: service.price,
      duration: service.duration,
      category: service.category
    }));
    
    const firebaseBookingData = {
      customerName: bookingData.customer,
      customerEmail: bookingData.email || "",
      customerPhone: bookingData.phone || "",
      customerId: "",
      serviceName: bookingData.services[0] || "Multiple Services",
      services: bookingData.services,
      servicesDetails: serviceDetails,
      serviceCategory: selectedCategory?.name || selectedServices[0]?.category || "Multiple",
      serviceDuration: totalDuration,
      servicePrice: servicesPrice,
      totalAmount: totalAmount,
      totalDuration: totalDuration,
      staff: bookingData.barber,
      staffName: bookingData.barber,
      staffId: primaryStaff?.name || bookingData.barber,
      staffRole: "hairstylist",
      date: bookingData.date,
      time: bookingData.time,
      timeSlot: bookingData.time,
      bookingDate: bookingData.date,
      bookingTime: bookingData.time,
      status: bookingData.status || 'pending',
      paymentMethod: bookingData.paymentMethods.length > 0 
        ? bookingData.paymentMethods.join(', ') 
        : 'cash',
      paymentStatus: bookingData.status === 'completed' ? 'paid' : 'pending',
      branch: selectedBranch?.name || selectedServices[0]?.branchNames?.[0] || "All Branches",
      branchId: selectedBranch?.firebaseId || '',
      branchNames: selectedBranch?.name ? [selectedBranch.name] : (selectedServices[0]?.branchNames || ["All Branches"]),
      branches: selectedBranch?.firebaseId ? [selectedBranch.firebaseId] : [],
      userBranchId: selectedBranch?.firebaseId || '',
      userBranchName: selectedBranch?.name || '',
      category: selectedCategory?.name || "",
      categoryId: selectedCategory?.firebaseId || "",
      cardLast4Digits: bookingData.cardLast4Digits || "",
      trnNumber: bookingData.trnNumber || "",
      paymentAmounts: bookingData.paymentAmounts,
      notes: bookingData.notes || '',
      pointsAwarded: false,
      products: bookingData.products.map(product => ({
        productName: product.name,
        name: product.name,
        category: product.category,
        price: product.price,
        quantity: product.quantity,
        total: product.price * product.quantity
      })),
      teamMembers: bookingData.teamMembers,
      subtotal: subtotal,
      tax: bookingData.tax,
      taxAmount: taxAmount,
      discount: bookingData.discount,
      discountType: bookingData.discountType,
      discountAmount: discountAmount,
      serviceTip: bookingData.serviceTip,
      serviceCharges: bookingData.serviceCharges,
      totalTips: totalTips,
      productsTotal: productsTotal,
      paymentMethods: bookingData.paymentMethods,
      source: 'admin_panel',
      createdBy: 'admin',
      bookingNumber: bookingNumber,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const bookingsRef = collection(db, "bookings");
    const docRef = await addDoc(bookingsRef, firebaseBookingData);
    
    const newBooking: FirebaseBooking = {
      id: docRef.id,
      firebaseId: docRef.id,
      bookingNumber: bookingNumber,
      customerName: bookingData.customer,
      customerEmail: bookingData.email || "",
      customerPhone: bookingData.phone || "",
      services: bookingData.services,
      serviceDetails: serviceDetails,
      serviceDuration: totalDuration,
      totalDuration: totalDuration,
      servicePrice: totalAmount,
      totalPrice: totalAmount,
      totalAmount: totalAmount,
      status: bookingData.status || 'pending',
      bookingDate: bookingData.date,
      bookingTime: bookingData.time,
      paymentMethod: bookingData.paymentMethods.join(', ') || 'cash',
      paymentStatus: bookingData.status === 'completed' ? 'paid' : 'pending',
      branch: selectedBranch?.name || selectedServices[0]?.branchNames?.[0] || "All Branches",
      staff: bookingData.barber,
      staffId: primaryStaff?.name || bookingData.barber,
      staffRole: "hairstylist",
      notes: bookingData.notes || "",
      serviceCategory: selectedCategory?.name || selectedServices[0]?.category || "Multiple",
      serviceId: selectedServices[0]?.firebaseId || "",
      timeSlot: bookingData.time,
      pointsAwarded: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      customerId: "",
      createdBy: '',
      cardLast4Digits: bookingData.cardLast4Digits || "",
      trnNumber: bookingData.trnNumber || "",
      teamMembers: bookingData.teamMembers,
      products: bookingData.products,
      paymentMethods: bookingData.paymentMethods,
      paymentAmounts: bookingData.paymentAmounts,
      discount: bookingData.discount,
      discountType: bookingData.discountType,
      serviceTip: bookingData.serviceTip,
      serviceCharges: bookingData.serviceCharges,
      tax: bookingData.tax,
      serviceName: ''
    };
    
    return {success: true, bookingId: docRef.id, booking: newBooking};
    
  } catch (error) {
    console.error("❌ Error creating booking in Firebase:", error);
    addNotification({
      type: 'error',
      title: 'Booking Error',
      message: 'Failed to save booking to Firebase. Please try again.'
    });
    return {success: false};
  }
};

const generatePDFInvoice = async (invoiceData: ExtendedInvoiceData) => {
  try {
    const serviceItems = (invoiceData.serviceDetails && invoiceData.serviceDetails.length > 0)
      ? invoiceData.serviceDetails.map((service) => ({
          description: service.serviceName || 'Service',
          quantity: 1,
          unitPrice: Number(service.price || 0),
          lineTotal: Number(service.price || 0),
          details: [service.branch, service.staff].filter(Boolean).join(' - '),
        }))
      : (invoiceData.services && invoiceData.services.length > 0)
      ? invoiceData.services.map((service) => ({
          description: service,
          quantity: 1,
          unitPrice: Number(invoiceData.price || 0),
          lineTotal: Number(invoiceData.price || 0),
          details: [invoiceData.branch, invoiceData.barber].filter(Boolean).join(' - '),
        }))
      : [];

    const manualItems = (invoiceData.items || []).map((item) => ({
      description: item.name,
      quantity: Number(item.quantity || 1),
      unitPrice: Number(item.price || 0),
      lineTotal: Number(item.total || item.price || 0),
      details: '',
    }));

    // Prefer manually prepared invoice items when available to avoid duplicating
    // services from both `items` and `serviceDetails/services`.
    const baseInvoiceItems = manualItems.length > 0 ? manualItems : serviceItems;
    if (baseInvoiceItems.length === 0) {
      baseInvoiceItems.push({
        description: invoiceData.service || 'Service',
        quantity: 1,
        unitPrice: Number(invoiceData.price || 0),
        lineTotal: Number(invoiceData.price || 0),
        details: [invoiceData.branch, invoiceData.barber].filter(Boolean).join(' - '),
      });
    }

    const subtotalWithoutCharges = baseInvoiceItems.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0);
    const serviceCharges = Number(invoiceData.serviceCharges || 0);
    const couponDiscountAmount = Math.max(0, Number(invoiceData.couponDiscountAmount || 0));

    const invoiceItems = serviceCharges > 0
      ? [
          ...baseInvoiceItems,
          {
            description: 'Service Charges',
            quantity: 1,
            unitPrice: serviceCharges,
            lineTotal: serviceCharges,
            details: 'Additional service charge',
          },
        ]
      : baseInvoiceItems;

    const discountValue = Number(invoiceData.discount || 0);
    const chargeableAmount = Math.max(0, subtotalWithoutCharges + serviceCharges - couponDiscountAmount);
    const discountAmount = invoiceData.discountType === 'percentage'
      ? Math.min(chargeableAmount, Math.max(0, (chargeableAmount * discountValue) / 100))
      : Math.min(chargeableAmount, Math.max(0, discountValue));

    const taxPercent = Number(invoiceData.tax || 0);
    const taxableAmount = Math.max(0, chargeableAmount - discountAmount);
    const normalizedTaxType = invoiceData.taxType === 'exclusive' ? 'exclusive' : 'inclusive';

    let taxAmount = 0;
    let totalWithoutVatCore = taxableAmount;
    let totalAmountCore = taxableAmount;

    if (taxPercent > 0) {
      if (normalizedTaxType === 'inclusive') {
        taxAmount = Math.max(0, (taxableAmount * taxPercent) / (100 + taxPercent));
        totalWithoutVatCore = Math.max(0, taxableAmount - taxAmount);
        totalAmountCore = taxableAmount;
      } else {
        taxAmount = Math.max(0, (taxableAmount * taxPercent) / 100);
        totalWithoutVatCore = taxableAmount;
        totalAmountCore = taxableAmount + taxAmount;
      }
    }

    const teamTips = Number(invoiceData.teamMembers?.reduce((sum, tm) => sum + Number(tm.tip || 0), 0) || 0);
    const tipAmount = Number(invoiceData.serviceTip || 0) + teamTips;
    const totalAmount = totalAmountCore + tipAmount;
    const totalWithoutVat = totalWithoutVatCore + tipAmount;

    const paymentMethods = invoiceData.paymentAmounts
      ? Object.entries(invoiceData.paymentAmounts)
          .filter(([, amount]) => Number(amount || 0) > 0)
          .map(([method, amount]) => ({
            label: method.replace(/_/g, ' ').toUpperCase(),
            amount: Number(amount || 0),
          }))
      : [];

    if (paymentMethods.length === 0) {
      const label = (invoiceData.paymentMethod || 'Cash').replace(/,/g, ' / ').toUpperCase();
      paymentMethods.push({ label, amount: totalAmount });
    }

    const amountPaid = Math.max(
      0,
      paymentMethods.reduce((sum, method) => sum + Number(method.amount || 0), 0)
    );
    const amountDue = Math.max(0, totalAmount - amountPaid);
    const ewalletUsed = Math.max(
      0,
      Number(invoiceData.paymentAmounts?.ewallet ?? invoiceData.paymentAmounts?.wallet ?? 0)
    );
    const hasEwalletAvailability = Number.isFinite(Number(invoiceData.ewalletBalanceAvailable));
    const ewalletBalanceAvailable = Math.max(0, Number(invoiceData.ewalletBalanceAvailable || 0));
    const ewalletBalanceLeft = Math.max(0, ewalletBalanceAvailable - ewalletUsed);
    const taxTypeLabel = normalizedTaxType === 'exclusive' ? 'Exclusive' : 'Inclusive';
    const couponCode = String(invoiceData.couponCode || '').trim();
    const finalNotes = [
      String(invoiceData.notes || '').trim(),
      couponCode ? `Coupon Code: ${couponCode}` : '',
    ].filter(Boolean).join('\n');

    await generateUnifiedInvoicePdf({
      invoiceNumber: invoiceData.invoiceNumber || `INV-${Date.now()}`,
      invoiceDate: invoiceData.date || new Date().toLocaleDateString(),
      companyName: 'MAN OF CAVE BARBERSHOP',
      customerName: invoiceData.customer || 'Customer',
      customerPhone: invoiceData.phone,
      customerEmail: invoiceData.email,
      serviceDate: invoiceData.date,
      serviceTime: invoiceData.time,
      branchName: invoiceData.branch || 'Main Branch',
      items: invoiceItems,
      subtotal: subtotalWithoutCharges,
      couponDiscountAmount,
      discountAmount,
      taxAmount,
      taxPercent,
      taxTypeLabel,
      totalWithoutVat,
      serviceCharges,
      tipAmount,
      totalAmount,
      amountPaid,
      amountDue,
      ewalletBalanceAvailable: hasEwalletAvailability ? ewalletBalanceAvailable : undefined,
      ewalletBalanceLeft: hasEwalletAvailability ? ewalletBalanceLeft : undefined,
      summaryLayout: 'booking-vat',
      paymentMethods,
      notes: finalNotes,
      disclaimerText: invoiceData.disclaimerText,
      trnNumber: invoiceData.trnNumber,
      logoPath: '/manofcave.png',
      fileName: `Invoice-${invoiceData.invoiceNumber || 'MANOFCAVE'}.pdf`,
    });

    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};

// ===================== ADDED COMPONENTS: FILTERS & CALENDAR =====================

const MobileFriendlyCalendar = ({ 
  selectedDate, 
  onDateSelect,
  appointments 
}: { 
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  appointments: Appointment[];
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const firstDayOfWeek = firstDay.getDay();
    
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        isCurrentMonth: false,
        appointments: appointments.filter(apt => 
          apt.date === date.toISOString().split('T')[0]
        )
      });
    }
    
    const totalDays = lastDay.getDate();
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        appointments: appointments.filter(apt => 
          apt.date === date.toISOString().split('T')[0]
        )
      });
    }
    
    const totalCells = 42;
    const nextMonthDays = totalCells - days.length;
    for (let i = 1; i <= nextMonthDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        appointments: appointments.filter(apt => 
          apt.date === date.toISOString().split('T')[0]
        )
      });
    }
    
    return days;
  }, [currentMonth, appointments]);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  return (
    <div className="w-full bg-white rounded-lg border shadow-sm">
      <div className="flex items-center justify-between p-4 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrevMonth}
          className="p-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Button>
        
        <div className="text-center">
          <div className="font-semibold text-lg">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNextMonth}
          className="p-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 p-2 text-xs font-medium text-gray-500">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center py-2">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 p-2">
        {daysInMonth.map((day, index) => {
          const isTodayDate = isToday(day.date);
          const isSelectedDate = isSelected(day.date);
          const hasAppointments = day.appointments.length > 0;
          
          return (
            <button
              key={index}
              onClick={() => onDateSelect(day.date)}
              disabled={!day.isCurrentMonth}
              className={`
                relative h-12 sm:h-14 rounded-lg flex flex-col items-center justify-center
                transition-all duration-200
                ${!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                ${isTodayDate ? 'bg-orange-50 border-2 border-orange-300' : ''}
                ${isSelectedDate ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}
                ${hasAppointments ? 'font-semibold' : ''}
                focus:outline-none focus:ring-2 focus:ring-blue-500
              `}
            >
              <span className="text-sm">{day.date.getDate()}</span>
              
              {hasAppointments && day.isCurrentMonth && !isSelectedDate && (
                <div className="absolute bottom-1 flex gap-1">
                  {day.appointments.slice(0, 3).map((_, i) => (
                    <div
                      key={i}
                      className={`
                        w-1 h-1 rounded-full
                        ${isTodayDate ? 'bg-orange-500' : 'bg-blue-500'}
                      `}
                    />
                  ))}
                  {day.appointments.length > 3 && (
                    <div className={`text-xs ${isTodayDate ? 'text-orange-600' : 'text-blue-600'}`}>
                      +{day.appointments.length - 3}
                    </div>
                  )}
                </div>
              )}
              
              {hasAppointments && day.isCurrentMonth && isSelectedDate && (
                <div className="absolute bottom-1 text-xs text-white bg-blue-800 px-1 rounded">
                  {day.appointments.length}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="border-t p-3 text-xs text-gray-600">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-300 rounded"></div>
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Has appointments</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const AppointmentSearchFilter = ({ 
  searchQuery, 
  setSearchQuery,
  appointments 
}: { 
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  appointments: Appointment[];
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  useEffect(() => {
    if (searchQuery.length > 1) {
      const uniqueSuggestions = Array.from(
        new Set(
          appointments.flatMap(apt => [
            apt.customer.toLowerCase(),
            apt.service.toLowerCase(),
            apt.barber.toLowerCase(),
            apt.email?.toLowerCase(),
            apt.phone
          ]).filter(Boolean)
        )
      )
      .filter(suggestion => 
        suggestion && suggestion.includes(searchQuery.toLowerCase())
      )
      .slice(0, 5);
      
      setSuggestions(uniqueSuggestions as string[]);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery, appointments]);

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Search by customer, service, barber, phone, or email..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          className="pl-10 pr-10 h-12 text-base"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 h-auto"
          >
            <XCircle className="w-5 h-5 text-gray-400" />
          </Button>
        )}
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <span className="text-gray-700">{suggestion}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {searchQuery && (
        <div className="mt-2 text-sm text-gray-600">
          Found {appointments.filter(apt => 
            apt.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            apt.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
            apt.barber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            apt.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            apt.phone?.includes(searchQuery)
          ).length} appointments matching "{searchQuery}"
        </div>
      )}
    </div>
  );
};

const StatusDropdownFilter = ({ 
  statusFilter, 
  setStatusFilter,
  appointments 
}: { 
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  appointments: Appointment[];
}) => {
  const statusCounts = useMemo(() => {
    const counts: { [key: string]: number } = { all: appointments.length };
    
    appointments.forEach(apt => {
      counts[apt.status] = (counts[apt.status] || 0) + 1;
    });
    
    return counts;
  }, [appointments]);

  const statusOptions = [
    { value: 'all', label: 'All Status', color: 'bg-gray-100 text-gray-800' },
    { value: 'pending', label: 'Pending', color: 'bg-orange-100 text-orange-800' },
    { value: 'approved', label: 'Approved', color: 'bg-purple-100 text-purple-800' },
    { value: 'scheduled', label: 'Scheduled', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'in-progress', label: 'In Progress', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'closed', label: 'Closed', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">Filter by Status</label>
        <span className="text-xs text-gray-500">
          {statusFilter !== 'all' ? `${statusCounts[statusFilter] || 0} appointments` : ''}
        </span>
      </div>
      
      <div className="relative">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full h-12 border-2">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            {statusOptions.map((option) => {
              const count = statusCounts[option.value] || 0;
              return (
                <SelectItem 
                  key={option.value} 
                  value={option.value}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${option.color.split(' ')[0]}`}></div>
                      <span>{option.label}</span>
                    </div>
                    <Badge className={option.color}>
                      {count}
                    </Badge>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        
        {statusFilter !== 'all' && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={`${statusOptions.find(o => o.value === statusFilter)?.color} px-3 py-1`}>
                {statusOptions.find(o => o.value === statusFilter)?.label}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                  className="ml-2 p-0 h-4 w-4"
                >
                  <XCircle className="w-3 h-3" />
                </Button>
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatusFilter('all')}
              className="text-sm"
            >
              Clear filter
            </Button>
          </div>
        )}
      </div>
      
      <div className="mt-4">
        <div className="text-xs text-gray-500 mb-2">Status Distribution:</div>
        <div className="flex flex-wrap gap-1">
          {statusOptions.slice(1).map(option => {
            const count = statusCounts[option.value] || 0;
            if (count === 0) return null;
            
            return (
              <div
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`
                  cursor-pointer px-2 py-1 rounded text-xs flex items-center gap-1
                  ${statusFilter === option.value ? 'ring-2 ring-offset-1' : ''}
                  ${option.color}
                `}
              >
                <div className="w-2 h-2 rounded-full bg-current opacity-70"></div>
                <span>{option.label}</span>
                <span className="font-semibold">({count})</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ===================== MAIN COMPONENT =====================

export default function AdminAppointments() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { formatCurrency } = useCurrencyStore();
  const {
    getConfirmedBookings,
    addToCart,
    clearCart,
    setCustomerName,
    setCustomerEmail,
    setCustomerPhone,
    setSpecialRequests,
    setSelectedStaff,
    setSelectedDate: setStoreSelectedDate,
    setSelectedTime: setStoreSelectedTime,
  } = useBookingStore();
  const { getBranchByName } = useBranchStore();
  const { addNotification, notifications, markAsRead } = useNotifications();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'advanced-calendar' | 'list' | 'approvals' | 'product-orders'>('advanced-calendar');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editBookingData, setEditBookingData] = useState<BookingFormData | null>(null);
  const [editSelectedServices, setEditSelectedServices] = useState<FirebaseService[]>([]);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedAppointmentForInvoice, setSelectedAppointmentForInvoice] = useState<Appointment | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceData, setInvoiceData] = useState<ExtendedInvoiceData | null>(null);
  const [isEditingInvoice, setIsEditingInvoice] = useState(false);
  const [invoiceProductSearchTerm, setInvoiceProductSearchTerm] = useState('');
  const [showInvoiceProductSuggestions, setShowInvoiceProductSuggestions] = useState(false);
  const [invoiceEwalletBalance, setInvoiceEwalletBalance] = useState<number | null>(null);
  const [invoiceEwalletDiscountPercent, setInvoiceEwalletDiscountPercent] = useState(0);
  const [invoiceEwalletLoading, setInvoiceEwalletLoading] = useState(false);
  const [closingInvoiceBooking, setClosingInvoiceBooking] = useState(false);
  
  const [loading, setLoading] = useState({
    orders: false,
    bookings: false,
    staff: false,
    services: false,
    categories: false,
    branches: false
  });
  
  const [productOrders, setProductOrders] = useState<FirebaseProductOrder[]>([]);
  const [bookings, setBookings] = useState<FirebaseBooking[]>([]);
  const [staffMembers, setStaffMembers] = useState<FirebaseStaff[]>([]);
  const [services, setServices] = useState<FirebaseService[]>([]);
  const [categories, setCategories] = useState<FirebaseCategory[]>([]);
  const [branches, setBranches] = useState<FirebaseBranch[]>([]);

  const [calendarDisplaySettings, setCalendarDisplaySettings] = useState<CalendarDisplaySettings>({
    weeklyTimings: DEFAULT_WEEKLY_TIMINGS,
    timeSlotGap: 30,
    layoutMode: 'time-top',
    businessHours: { start: 9, end: 22 },
    hiddenHours: [],
    totalValueDisplayMode: 'both',
    invoiceValueDisplayMode: 'with-tax',
  });
  const [invoiceDisclaimerTemplate, setInvoiceDisclaimerTemplate] = useState<string>(DEFAULT_INVOICE_DISCLAIMER_TEMPLATE);
  const [paymentMethodAvailability, setPaymentMethodAvailability] = useState<PaymentMethodAvailability>(
    DEFAULT_PAYMENT_METHOD_AVAILABILITY
  );
  const [taxRate, setTaxRate] = useState<number>(5);
  
  const [allowPendingOrders] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const loadCalendarSettings = async () => {
      try {
        let resolvedBranchId = user?.branchId || '';

        if (!resolvedBranchId && user?.branchName) {
          const branchQuery = query(collection(db, 'branches'), where('name', '==', user.branchName));
          const branchSnap = await getDocs(branchQuery);
          if (!branchSnap.empty) {
            resolvedBranchId = branchSnap.docs[0].id;
          }
        }

        if (!resolvedBranchId) return;

        unsubscribe = onSnapshot(doc(db, 'branches', resolvedBranchId), (snap) => {
          const snapshotData = snap.data() || {};
          const cfg = snapshotData.calendarDisplaySettings || {};
          const weekly = snapshotData.weeklyTimings || cfg.weeklyTimings || {};
          const normalizeDay = (value: any, fallback: { open: string; close: string; closed: boolean }) => ({
            open: String(value?.open ?? value?.opening ?? fallback.open),
            close: String(value?.close ?? value?.closing ?? fallback.close),
            closed: Boolean(value?.closed ?? fallback.closed),
          });

          setCalendarDisplaySettings({
            weeklyTimings: {
              monday: normalizeDay(weekly.monday, DEFAULT_WEEKLY_TIMINGS.monday),
              tuesday: normalizeDay(weekly.tuesday, DEFAULT_WEEKLY_TIMINGS.tuesday),
              wednesday: normalizeDay(weekly.wednesday, DEFAULT_WEEKLY_TIMINGS.wednesday),
              thursday: normalizeDay(weekly.thursday, DEFAULT_WEEKLY_TIMINGS.thursday),
              friday: normalizeDay(weekly.friday, DEFAULT_WEEKLY_TIMINGS.friday),
              saturday: normalizeDay(weekly.saturday, DEFAULT_WEEKLY_TIMINGS.saturday),
              sunday: normalizeDay(weekly.sunday, DEFAULT_WEEKLY_TIMINGS.sunday),
            },
            timeSlotGap: typeof cfg.timeSlotGap === 'number' ? cfg.timeSlotGap : 30,
            layoutMode: cfg.layoutMode === 'employee-top' ? 'employee-top' : 'time-top',
            businessHours: {
              start: typeof cfg.businessHours?.start === 'number' ? cfg.businessHours.start : 9,
              end: typeof cfg.businessHours?.end === 'number' ? cfg.businessHours.end : 22,
            },
            hiddenHours: Array.isArray(cfg.hiddenHours) ? cfg.hiddenHours : [],
            totalValueDisplayMode:
              cfg.totalValueDisplayMode === 'with-tax' || cfg.totalValueDisplayMode === 'without-tax'
                ? cfg.totalValueDisplayMode
                : 'both',
            invoiceValueDisplayMode:
              cfg.invoiceValueDisplayMode === 'without-tax'
                ? 'without-tax'
                : 'with-tax',
          });

          const configuredDisclaimer = String(snapshotData.invoiceDisclaimerTemplate || '').trim();
          setInvoiceDisclaimerTemplate(configuredDisclaimer || DEFAULT_INVOICE_DISCLAIMER_TEMPLATE);
          setPaymentMethodAvailability({
            cash: snapshotData.acceptCash !== false,
            card: snapshotData.acceptCard !== false,
            check: snapshotData.acceptCheck !== false,
            digital: snapshotData.acceptDigital !== false,
            ewallet: snapshotData.acceptEwallet !== false,
          });
          setTaxRate(Number.isFinite(Number(snapshotData.taxRate)) ? Number(snapshotData.taxRate) : 5);
        });
      } catch (error) {
        console.error('Error loading calendar display settings:', error);
      }
    };

    loadCalendarSettings();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.branchId, user?.branchName]);

  const [selectedServices, setSelectedServices] = useState<FirebaseService[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<FirebaseCategory | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<FirebaseBranch | null>(null);
  const [serviceSearchTerm, setServiceSearchTerm] = useState('');
  const [showServiceSuggestions, setShowServiceSuggestions] = useState(false);

  const [bookingData, setBookingData] = useState<BookingFormData>({
    customer: '',
    phone: '',
    email: '',
    service: '',
    services: [],
    barber: '',
    teamMembers: [],
    date: '',
    time: '',
    notes: '',
    products: [],
    tax: 5,
    serviceCharges: 0,
    discount: 0,
    discountType: 'fixed',
    serviceTip: 0,
    paymentMethods: [],
    paymentAmounts: {
      cash: 0,
      card: 0,
      check: 0,
      digital: 0
    },
    status: 'pending',
    generateInvoice: false,
    cardLast4Digits: '',
    trnNumber: '',
    category: '',
    branch: (user?.role === 'admin' && user?.branchName) ? user.branchName : ''
  });

  useEffect(() => {
    setBookingData((prev) => {
      const hasUserEdits = Boolean(
        prev.customer ||
        prev.services.length > 0 ||
        prev.barber ||
        prev.date ||
        prev.time ||
        prev.paymentMethods.length > 0
      );

      if (hasUserEdits || prev.tax === taxRate) {
        return prev;
      }

      return { ...prev, tax: taxRate };
    });
  }, [taxRate]);

  const [customerDirectory, setCustomerDirectory] = useState<Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
  }>>([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [showInvoiceCustomerSuggestions, setShowInvoiceCustomerSuggestions] = useState(false);

  const normalizeCustomerLookup = (value: string) => value.trim().toLowerCase();

  const bookingCustomerDirectory = useMemo(() => {
    const customerMap = new Map<string, { id: string; name: string; email: string; phone: string }>();

    bookings.forEach((booking) => {
      const name = String(booking.customerName || '').trim();
      if (!name) return;

      const email = String(booking.customerEmail || '').trim();
      const phone = String(booking.customerPhone || '').trim();
      const key = normalizeCustomerLookup(name);
      const existing = customerMap.get(key);

      if (!existing) {
        customerMap.set(key, { id: booking.firebaseId || key, name, email, phone });
        return;
      }

      customerMap.set(key, {
        ...existing,
        email: existing.email || email,
        phone: existing.phone || phone,
      });
    });

    return Array.from(customerMap.values());
  }, [bookings]);

  const customerSearchPool = useMemo(() => {
    const customerMap = new Map<string, { id: string; name: string; email: string; phone: string }>();

    [...customerDirectory, ...bookingCustomerDirectory].forEach((customer) => {
      const name = String(customer.name || '').trim();
      if (!name) return;

      const key = normalizeCustomerLookup(name);
      const existing = customerMap.get(key);

      if (!existing) {
        customerMap.set(key, {
          id: customer.id,
          name,
          email: String(customer.email || '').trim(),
          phone: String(customer.phone || '').trim(),
        });
        return;
      }

      customerMap.set(key, {
        ...existing,
        email: existing.email || String(customer.email || '').trim(),
        phone: existing.phone || String(customer.phone || '').trim(),
      });
    });

    return Array.from(customerMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [customerDirectory, bookingCustomerDirectory]);

  const customerSuggestions = useMemo(() => {
    const query = normalizeCustomerLookup(bookingData.customer || '');
    if (!query) return [];

    return customerSearchPool
      .filter((customer) => normalizeCustomerLookup(customer.name).includes(query))
      .slice(0, 8);
  }, [bookingData.customer, customerSearchPool]);

  const invoiceCustomerSuggestions = useMemo(() => {
    const query = normalizeCustomerLookup(invoiceData?.customer || '');
    if (!query) {
      return customerSearchPool.slice(0, 8);
    }

    return customerSearchPool
      .filter((customer) => normalizeCustomerLookup(customer.name).includes(query))
      .slice(0, 8);
  }, [invoiceData?.customer, customerSearchPool]);

  const applyCustomerSuggestion = (customer: { name: string; email?: string; phone?: string }) => {
    setBookingData((prev) => ({
      ...prev,
      customer: customer.name || prev.customer,
      email: customer.email ? customer.email : prev.email,
      phone: customer.phone ? customer.phone : prev.phone,
    }));
    setShowCustomerSuggestions(false);
  };

  const handleCustomerNameChange = (value: string) => {
    setBookingData((prev) => ({
      ...prev,
      customer: value,
    }));

    const exactMatch = customerSearchPool.find(
      (customer) => normalizeCustomerLookup(customer.name) === normalizeCustomerLookup(value)
    );

    if (exactMatch) {
      setBookingData((prev) => ({
        ...prev,
        customer: exactMatch.name || prev.customer,
        email: exactMatch.email || prev.email,
        phone: exactMatch.phone || prev.phone,
      }));
    }
  };

  const applyInvoiceCustomerSuggestion = (customer: { id: string; name: string; email?: string; phone?: string }) => {
    setInvoiceData((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        customer: customer.name || prev.customer,
        customerId: customer.id || prev.customerId,
        email: customer.email ? customer.email : prev.email,
        phone: customer.phone ? customer.phone : prev.phone,
      };
    });
    setShowInvoiceCustomerSuggestions(false);
  };

  const handleInvoiceCustomerNameChange = (value: string) => {
    const normalizedValue = normalizeCustomerLookup(value);
    const exactMatch = customerSearchPool.find(
      (customer) => normalizeCustomerLookup(customer.name) === normalizedValue
    );

    setInvoiceData((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        customer: value,
        customerId: exactMatch?.id || '',
        email: exactMatch?.email || prev.email,
        phone: exactMatch?.phone || prev.phone,
      };
    });
  };

  useEffect(() => {
    const loadCustomersDirectory = async () => {
      if (!showBookingDialog && !showInvoiceModal) return;

      try {
        const snapshot = await getDocs(collection(db, 'customers'));
        const customerMap = new Map<string, { id: string; name: string; email: string; phone: string }>();

        snapshot.forEach((customerDoc) => {
          const data: any = customerDoc.data();
          const name = String(data.name || data.customerName || '').trim();
          if (!name) return;

          const email = String(data.email || data.customerEmail || '').trim();
          const phone = String(data.phone || data.customerPhone || '').trim();
          const key = normalizeCustomerLookup(name);
          const existing = customerMap.get(key);

          if (!existing) {
            customerMap.set(key, { id: customerDoc.id, name, email, phone });
            return;
          }

          customerMap.set(key, {
            ...existing,
            email: existing.email || email,
            phone: existing.phone || phone,
          });
        });

        setCustomerDirectory(Array.from(customerMap.values()));
      } catch (error) {
        console.error('Error loading customer directory:', error);
      }
    };

    loadCustomersDirectory();
  }, [showBookingDialog, showInvoiceModal]);

  // Auto-set branch for branch admins (fallback if loadFirebaseData hasn't set it)
  useEffect(() => {
    if (user?.role === 'admin' && user?.branchName && !bookingData.branch) {
      // Set branch immediately even before branches array loads
      setBookingData(prev => ({
        ...prev,
        branch: user.branchName || ''
      }));
      // Also set selectedBranch object if branches are loaded
      if (branches.length > 0) {
        const adminBranch = branches.find(b => b.name === user.branchName);
        if (adminBranch) {
          setSelectedBranch(adminBranch);
        }
      }
    }
  }, [branches, user]);

  // ✅ FIXED: Load data from Firebase with branch filtering and NO orderBy
  useEffect(() => {
    let isMounted = true;
    let unsubscribeBookings: (() => void) | undefined;
    let unsubscribeStaff: (() => void) | undefined;
    
    const loadFirebaseData = async () => {
      setLoading({ 
        orders: true, 
        bookings: true, 
        staff: true, 
        services: true,
        categories: true,
        branches: true 
      });
      
      try {
        const notificationWrapper = (notification: { type: string; title: string; message: string }) => {
          if (!isMounted) return;
          
          const type = notification.type as 'error' | 'success' | 'warning' | 'info';
          addNotification({
            type,
            title: notification.title,
            message: notification.message
          });
        };

        const userBranch = user?.role === 'admin' ? user.branchName : undefined;
        
        const [ordersData, staffData, servicesData, categoriesData, branchesData] = await Promise.all([
          fetchProductOrders(notificationWrapper),
          fetchStaff(),
          fetchServices(),
          fetchCategories(),
          fetchBranches()
        ]);
        
        if (!isMounted) return;
        
        // ✅ REAL-TIME LISTENER FOR BOOKINGS WITH BRANCH FILTERING - NO orderBy
        const bookingsRef = collection(db, "bookings");
        
        let q;
        if (userBranch) {
          // Branch admin - sirf apni branch ke bookings - NO orderBy
          q = query(
            bookingsRef, 
            where('branchNames', 'array-contains', userBranch)
            // ❌ NO orderBy - index avoid karne ke liye
          );
        } else {
          // Super admin - sab bookings with orderBy
          q = query(bookingsRef, orderBy("createdAt", "desc"));
        }
        
        unsubscribeBookings = onSnapshot(q, (snapshot) => {
          if (!isMounted) return;
          
          const bookingsData: FirebaseBooking[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            
            const bookingDate = data.bookingDate || 
                              (data.date ? data.date.split(' ')[0] : 
                              (data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : 
                              new Date().toISOString().split('T')[0]));
            
            const bookingTime = data.time || data.timeSlot || "10:00";
            const serviceName = data.serviceName || "Unknown Service";
            const services = Array.isArray(data.services) ? data.services : [serviceName];
            
            const bookingData: FirebaseBooking = {
              id: doc.id,
              firebaseId: doc.id,
              bookingNumber: data.bookingNumber || `BK-${doc.id.substring(0, 5).toUpperCase()}`,
              customerName: data.customerName || "Unknown Customer",
              customerEmail: data.customerEmail || "",
              customerPhone: data.customerPhone || "",
              services,
              serviceDetails: Array.isArray(data.serviceDetails)
                ? data.serviceDetails
                : (Array.isArray(data.servicesDetails) ? data.servicesDetails : []),
              serviceDuration: data.serviceDuration || 60,
              totalDuration: data.serviceDuration || 60,
              servicePrice: data.servicePrice || data.totalAmount || 0,
              totalPrice: data.servicePrice || data.totalAmount || 0,
              totalAmount: data.servicePrice || data.totalAmount || 0,
              status: data.status || "pending",
              bookingDate,
              bookingTime,
              paymentMethod: data.paymentMethod || "cash",
              paymentStatus: data.paymentStatus || "pending",
              branch: Array.isArray(data.branchNames) 
                ? (data.branchNames.length > 0 ? data.branchNames[0] : "All Branches") 
                : data.branch || "All Branches",
              staff: data.staffName || data.staff || "Not Assigned",
              staffId: data.staffId || "",
              staffRole: data.staffRole || "hairstylist",
              notes: data.notes || "",
              serviceCategory: data.serviceCategory || "",
              serviceId: data.serviceId || "",
              timeSlot: data.timeSlot || bookingTime,
              pointsAwarded: data.pointsAwarded || false,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
              customerId: data.customerId || "",
              createdBy: data.createdBy || '',
              cardLast4Digits: data.cardLast4Digits || "",
              trnNumber: data.trnNumber || "",
              teamMembers: Array.isArray(data.teamMembers) ? data.teamMembers : [],
              products: Array.isArray(data.products) ? data.products : [],
              paymentMethods: Array.isArray(data.paymentMethods) ? data.paymentMethods : [],
              paymentAmounts: data.paymentAmounts || { cash: 0, card: 0, check: 0, digital: 0 },
              discount: data.discount || 0,
              discountType: data.discountType || 'fixed',
              couponCode: String(data.couponCode || ''),
              couponDiscountAmount: Number(data.couponDiscountAmount || 0),
              taxType: data.taxType === 'exclusive' ? 'exclusive' : 'inclusive',
              serviceTip: data.serviceTip || 0,
              serviceCharges: data.serviceCharges || 0,
              tax: data.tax || 5,
              serviceName: ''
            };
            bookingsData.push(bookingData);
          });
          
          // ✅ MANUAL SORTING for branch admin - index ki zaroorat nahi
          if (userBranch) {
            bookingsData.sort((a, b) => {
              const dateA = a.createdAt?.getTime() || 0;
              const dateB = b.createdAt?.getTime() || 0;
              return dateB - dateA; // descending
            });
          }
          
          if (isMounted) {
            setBookings(bookingsData);
            setLoading(prev => ({ ...prev, bookings: false }));
            
            console.log(`📅 Real-time Calendar Data Updated for ${userBranch || 'all branches'}:`, {
              count: bookingsData.length,
              todayCount: bookingsData.filter(b => b.bookingDate === new Date().toISOString().split('T')[0]).length
            });
          }
        }, (error) => {
          if (isMounted) {
            console.error("Error in real-time bookings listener:", error);
            setLoading(prev => ({ ...prev, bookings: false }));
          }
        });

        const adminBranch = userBranch ? branchesData.find((b) => b.name === userBranch) : null;
        const adminBranchId = adminBranch?.firebaseId;

        const applyStaffFilter = (staffList: FirebaseStaff[]) => {
          const activeStaff = staffList.filter((staff) => isStaffActive(staff.status));
          if (!userBranch) return activeStaff;
          return activeStaff.filter((staff) => staffBelongsToBranch(staff, userBranch, adminBranchId));
        };

        const staffRef = collection(db, "staff");
        const staffQ = query(staffRef);

        unsubscribeStaff = onSnapshot(staffQ, (snapshot) => {
          if (!isMounted) return;

          const realtimeStaff: FirebaseStaff[] = snapshot.docs.map((staffDoc) => {
            const staffRecord = staffDoc.data();
            const createdAt = staffRecord.createdAt?.toDate ? staffRecord.createdAt.toDate() : new Date();
            const updatedAt = staffRecord.updatedAt?.toDate ? staffRecord.updatedAt.toDate() : new Date();

            return {
              id: staffDoc.id,
              firebaseId: staffDoc.id,
              staffId: `STF-${staffDoc.id.substring(0, 5).toUpperCase()}`,
              name: staffRecord.name || "Unknown Staff",
              email: staffRecord.email || "",
              phone: staffRecord.phone || "",
              role: staffRecord.role || "staff",
              specialization: Array.isArray(staffRecord.specialization) ? staffRecord.specialization : [],
              branch: staffRecord.branch || "Main Branch",
              branchId: staffRecord.branchId || staffRecord.userBranchId || '',
              branchNames: Array.isArray(staffRecord.branchNames) ? staffRecord.branchNames : [],
              branches: Array.isArray(staffRecord.branches) ? staffRecord.branches : [],
              userBranchId: staffRecord.userBranchId || staffRecord.branchId || '',
              userBranchName: staffRecord.userBranchName || '',
              avatar: staffRecord.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
              status: staffRecord.status || "active",
              rating: staffRecord.rating || 0,
              createdAt,
              updatedAt,
            };
          });

          setStaffMembers(applyStaffFilter(realtimeStaff));
          setLoading((prev) => ({ ...prev, staff: false }));
        }, (error) => {
          if (!isMounted) return;
          console.error("Error in real-time staff listener:", error);
          setLoading((prev) => ({ ...prev, staff: false }));
        });
        
        if (isMounted) {
          setProductOrders(ordersData);

          // Filter staff, services, categories for branch admins
          if (userBranch) {
            const adminBranch = branchesData.find(b => b.name === userBranch);
            const adminBranchId = adminBranch?.firebaseId;

            setStaffMembers(staffData.filter(s => isStaffActive(s.status) && staffBelongsToBranch(s, userBranch, adminBranchId)));
            setServices(servicesData.filter(s =>
              // Global services (no branches assigned) are for ALL branches
              ((!s.branches || s.branches.length === 0) && (!s.branchNames || s.branchNames.length === 0)) ||
              s.branchNames?.includes(userBranch) ||
              (adminBranchId && s.branches?.includes(adminBranchId))
            ));
            setCategories(categoriesData.filter(c =>
              // Global categories (no branches assigned) are for ALL branches
              ((!c.branches || c.branches.length === 0) && (!c.branchNames || c.branchNames.length === 0) && !c.branchId && !c.branchName) ||
              c.branchNames?.includes(userBranch) ||
              (adminBranchId && c.branches?.includes(adminBranchId)) ||
              c.branchName === userBranch
            ));
            // For branch admin, show only their branch
            setBranches(adminBranch ? [adminBranch] : branchesData);
            
            // Auto-set branch in booking form immediately (no race condition)
            if (adminBranch) {
              setSelectedBranch(adminBranch);
              setBookingData(prev => ({
                ...prev,
                branch: userBranch
              }));
            }
          } else {
            setStaffMembers(staffData);
            setServices(servicesData);
            setCategories(categoriesData);
            setBranches(branchesData);
          }

          setLoading({ 
            orders: false, 
            bookings: false, 
            staff: false, 
            services: false,
            categories: false,
            branches: false 
          });
        }
        
      } catch (error) {
        if (isMounted) {
          console.error("Error loading Firebase data:", error);
          addNotification({
            type: 'error',
            title: 'Data Load Error',
            message: 'Failed to load data from Firebase'
          });
          setLoading({ 
            orders: false, 
            bookings: false, 
            staff: false, 
            services: false,
            categories: false,
            branches: false 
          });
        }
      }
    };

    loadFirebaseData();
    
    return () => {
      isMounted = false;
      if (unsubscribeBookings) unsubscribeBookings();
      if (unsubscribeStaff) unsubscribeStaff();
    };
  }, [user]);

  const mapBookingStatus = (firebaseStatus: string): string => {
    const statusMap: { [key: string]: string } = {
      'pending': 'pending',
      'approved': 'approved',
      'confirmed': 'scheduled',
      'scheduled': 'scheduled',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'rejected': 'rejected',
      'delivered': 'delivered',
      'upcoming': 'upcoming',
      'in-progress': 'in-progress',
      'rescheduled': 'rescheduled'
    };
    return statusMap[firebaseStatus] || firebaseStatus;
  };

  const convertedBookings: Appointment[] = bookings.map((booking, index) => {
    const mappedStatus = mapBookingStatus(booking.status);
    const serviceText = Array.isArray(booking.services) && booking.services.length > 0 
      ? booking.services.join(', ') 
      : (booking.serviceName || 'Unknown Service');
    
    return {
      id: booking.firebaseId || `booking-${index}`,
      firebaseId: booking.firebaseId,
      customer: booking.customerName || "Unknown Customer",
      service: serviceText,
      services: Array.isArray(booking.services) ? booking.services : [],
      serviceDetails: Array.isArray(booking.serviceDetails)
        ? booking.serviceDetails.map((detail) => ({
            id: detail.id,
            name: detail.name,
            serviceName: detail.name,
            price: Number(detail.price || 0),
            branch: booking.branch || 'All Branches',
            staff: booking.staff || 'Not Assigned',
            staffId: booking.staffId,
          }))
        : [],
      barber: booking.staff || "Not Assigned",
      date: booking.bookingDate || "",
      time: booking.bookingTime || booking.timeSlot || "",
      duration: booking.totalDuration ? `${booking.totalDuration} min` : '60 min',
      price: booking.totalAmount || booking.servicePrice || 0,
      servicePrice: booking.servicePrice || 0,
      totalAmount: booking.totalAmount || 0,
      subtotal: booking.subtotal || booking.servicePrice || 0,
      taxAmount: booking.taxAmount || 0,
      serviceCharges: booking.serviceCharges || 0,
      status: mappedStatus,
      phone: booking.customerPhone || "",
      email: booking.customerEmail || "",
      notes: booking.notes || 'Booked via website',
      source: booking.createdBy === 'admin' ? 'admin_panel' : 'website',
      branch: booking.branch || 'All Branches',
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      staffId: booking.staffId,
      staffRole: booking.staffRole,
      serviceCategory: booking.serviceCategory,
      pointsAwarded: booking.pointsAwarded || false,
      cardLast4Digits: booking.cardLast4Digits || '',
      trnNumber: booking.trnNumber || '',
      teamMembers: booking.teamMembers || [],
      products: booking.products || [],
      paymentMethods: booking.paymentMethods || [],
      paymentAmounts: booking.paymentAmounts || { cash: 0, card: 0, check: 0, digital: 0 },
      discount: booking.discount || 0,
      discountType: booking.discountType || 'fixed',
      serviceTip: booking.serviceTip || 0,
      tax: booking.tax || 5,
      paymentMethod: booking.paymentMethod || '',
      paymentStatus: booking.paymentStatus || '',
      bookingNumber: booking.bookingNumber || ''
    };
  });

  const mockAppointments: Appointment[] = [];

  const allAppointments = [...mockAppointments, ...convertedBookings];

  const filteredAppointments = allAppointments.filter(appointment => {
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    const matchesSearch = appointment.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         appointment.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         appointment.barber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         appointment.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         appointment.phone?.includes(searchQuery);
    const dateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
    const matchesDate = !selectedDate || appointment.date === dateString;
    
    const matchesBranch = user?.role === 'admin' && user?.branchName 
      ? appointment.branch === user.branchName
      : true;
    
    return matchesStatus && matchesSearch && matchesDate && matchesBranch;
  });

  const getAppointmentsForDate = (date: Date): Appointment[] => {
    if (!date || bookings.length === 0) return [];
    
    const selectedDateStr = date.toISOString().split('T')[0];
    
    const firebaseBookingsForDate = bookings.filter(booking => {
      if (booking.bookingDate !== selectedDateStr) {
        return false;
      }
      
      if (user?.role === 'admin' && user?.branchName) {
        const branchMatch = booking.branch === user.branchName;
        return branchMatch;
      }
      
      return true;
    });
    
    return firebaseBookingsForDate.map((booking, index) => {
      const mappedStatus = mapBookingStatus(booking.status);
      const serviceText = Array.isArray(booking.services) && booking.services.length > 0 
        ? booking.services.join(', ') 
        : (booking.serviceName || "Unknown Service");
      
      return {
        id: booking.firebaseId || `booking-${index}`,
        firebaseId: booking.firebaseId,
        customer: booking.customerName,
        service: serviceText,
        services: Array.isArray(booking.services) ? booking.services : [],
        barber: booking.staff || "Not Assigned",
        date: booking.bookingDate || selectedDateStr,
        time: booking.bookingTime || booking.timeSlot || "10:00 AM",
        duration: booking.totalDuration ? `${booking.totalDuration} min` : '60 min',
        price: booking.totalAmount || booking.servicePrice || 0,
        servicePrice: booking.servicePrice || 0,
        status: mappedStatus,
        phone: booking.customerPhone,
        email: booking.customerEmail,
        notes: booking.notes || 'Booked via website',
        source: booking.createdBy === 'admin' ? 'admin_panel' : 
                booking.createdBy === 'customer_booking' ? 'customer_app' : 'website',
        branch: booking.branch || 'All Branches',
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        staffId: booking.staffId,
        staffRole: booking.staffRole,
        serviceCategory: booking.serviceCategory,
        pointsAwarded: booking.pointsAwarded || false,
        cardLast4Digits: booking.cardLast4Digits || '',
        trnNumber: booking.trnNumber || '',
        teamMembers: Array.isArray(booking.teamMembers) ? booking.teamMembers : [],
        products: Array.isArray(booking.products) ? booking.products : [],
        paymentMethods: Array.isArray(booking.paymentMethods) ? booking.paymentMethods : [],
        paymentAmounts: booking.paymentAmounts || { 
          cash: 0, 
          card: 0, 
          check: 0, 
          digital: 0,
          wallet: 0
        },
        discount: booking.discount || 0,
        discountType: booking.discountType || 'fixed',
        serviceTip: booking.serviceTip || 0,
        serviceCharges: booking.serviceCharges || 0,
        tax: booking.tax || 0
      };
    });
  };

  const filteredCategories = useMemo(() => {
    if (!bookingData.branch) return [];
    
    return categories.filter(category => {
      if (!category.isActive || category.type !== 'service') return false;
      
      // Global categories (no branches assigned) are always visible
      if ((!category.branches || category.branches.length === 0) && 
          (!category.branchNames || category.branchNames.length === 0) &&
          !category.branchId && !category.branchName) {
        return true;
      }
      
      // Check multi-branch arrays (by ID and by name)
      if (category.branches && category.branches.length > 0) {
        if (selectedBranch?.firebaseId && category.branches.includes(selectedBranch.firebaseId)) return true;
        if (category.branchNames && category.branchNames.includes(bookingData.branch)) return true;
      }
      
      // Check branchNames array directly
      if (category.branchNames && category.branchNames.length > 0) {
        if (category.branchNames.includes(bookingData.branch)) return true;
      }
      
      // Backward compat: check old branchId field
      if (selectedBranch?.firebaseId && category.branchId === selectedBranch.firebaseId) return true;
      
      // Backward compat: check old branchName field
      const selectedBranchLower = bookingData.branch.toLowerCase().trim();
      const categoryBranchLower = (category.branchName || '').toLowerCase().trim();
      if (categoryBranchLower && categoryBranchLower === selectedBranchLower) return true;
      
      return false;
    });
  }, [bookingData.branch, selectedBranch, categories]);

  const filteredServices = useMemo(() => {
    if (!bookingData.branch) return [];
    
    return services.filter(service => {
      if (service.status !== 'active') return false;
      
      // Global services (no branches assigned) are for ALL branches
      if ((!service.branches || service.branches.length === 0) && 
          (!service.branchNames || service.branchNames.length === 0)) {
        // Still apply category filter if selected
        if (bookingData.category) {
          const categoryMatch = 
            service.category === bookingData.category ||
            (selectedCategory && service.categoryId === selectedCategory.firebaseId);
          if (!categoryMatch) return false;
        }
        return true;
      }
      
      // Filter by branch - check both name and ID
      const selectedBranchLower = bookingData.branch.toLowerCase().trim();
      
      const hasInBranchNames = service.branchNames?.some(branch => 
        branch.toLowerCase().trim() === selectedBranchLower
      );
      
      // Check branch ID match
      const hasInBranchIds = selectedBranch?.firebaseId && service.branches?.some(branchId => 
        branchId === selectedBranch.firebaseId
      );
      
      const branchMatch = hasInBranchNames || hasInBranchIds;
      if (!branchMatch) return false;
      
      // Filter by selected category (if one is selected) - category only filters, doesn't block
      if (bookingData.category) {
        const categoryMatch = 
          service.category === bookingData.category ||
          (selectedCategory && service.categoryId === selectedCategory.firebaseId);
        if (!categoryMatch) return false;
      }
      
      return true;
    });
  }, [bookingData.branch, bookingData.category, selectedCategory, selectedBranch, services]);

  const searchableServices = useMemo(() => {
    const search = serviceSearchTerm.trim().toLowerCase();
    if (!search) return filteredServices;

    return filteredServices.filter((service) => {
      const matchesName = service.name.toLowerCase().includes(search);
      const matchesCategory = (service.category || '').toLowerCase().includes(search);
      const matchesDuration = String(service.duration || '').includes(search);
      const matchesPrice = String(service.price || '').includes(search);

      return matchesName || matchesCategory || matchesDuration || matchesPrice;
    });
  }, [filteredServices, serviceSearchTerm]);

  const serviceSuggestions = useMemo(() => {
    const query = serviceSearchTerm.trim().toLowerCase();
    if (!query || !bookingData.branch) return [];

    return searchableServices
      .filter((service) => !selectedServices.some((selected) => selected.name === service.name))
      .slice(0, 8);
  }, [bookingData.branch, searchableServices, selectedServices, serviceSearchTerm]);

  const filteredStaff = useMemo(() => {
    if (!bookingData.branch) return [];
    
    return staffMembers.filter(staff => {
      if (!isStaffActive(staff.status)) return false;

      return staffBelongsToBranch(staff, bookingData.branch, selectedBranch?.firebaseId);
    });
  }, [bookingData.branch, selectedBranch?.firebaseId, staffMembers]);

  const mockProducts = [
    { name: "Premium Shampoo", category: "Hair Care", price: 15 },
    { name: "Beard Oil", category: "Grooming", price: 12 },
    { name: "Hair Wax", category: "Styling", price: 8 },
    { name: "Face Mask", category: "Skincare", price: 20 },
    { name: "Hair Clippers", category: "Tools", price: 45 },
    { name: "Styling Gel", category: "Styling", price: 10 },
    { name: "Aftershave", category: "Grooming", price: 18 },
    { name: "Hair Brush", category: "Tools", price: 25 }
  ];

  const normalizeProductLookup = (value: string) => value.trim().toLowerCase();

  const invoiceProductCatalog = useMemo(() => {
    const productMap = new Map<string, { name: string; category: string; price: number }>();

    const registerProduct = (nameRaw: any, categoryRaw: any, priceRaw: any) => {
      const name = String(nameRaw || '').trim();
      if (!name) return;

      const category = String(categoryRaw || 'Product').trim() || 'Product';
      const price = Number(priceRaw || 0);
      const key = normalizeProductLookup(name);
      const existing = productMap.get(key);

      if (!existing) {
        productMap.set(key, { name, category, price });
        return;
      }

      productMap.set(key, {
        ...existing,
        category: existing.category || category,
        price: existing.price > 0 ? existing.price : price,
      });
    };

    mockProducts.forEach((product) => registerProduct(product.name, product.category, product.price));

    bookings.forEach((booking) => {
      (booking.products || []).forEach((product) => {
        registerProduct(product.name, product.category, product.price);
      });
    });

    (selectedAppointmentForInvoice?.products || []).forEach((product) => {
      registerProduct(product.name, product.category, product.price);
    });

    return Array.from(productMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [bookings, selectedAppointmentForInvoice]);

  const invoiceProductSuggestions = useMemo(() => {
    const query = normalizeProductLookup(invoiceProductSearchTerm);
    if (!query) return [];

    return invoiceProductCatalog
      .filter((product) => {
        const name = normalizeProductLookup(product.name);
        const category = normalizeProductLookup(product.category);
        return name.includes(query) || category.includes(query);
      })
      .slice(0, 8);
  }, [invoiceProductCatalog, invoiceProductSearchTerm]);

  const handleServiceSelection = (serviceName: string) => {
    const service = filteredServices.find((s) => s.name === serviceName) || services.find((s) => s.name === serviceName);
    if (!service) return;

    const isAlreadySelected = selectedServices.some(s => s.name === serviceName);
    let updatedSelectedServices: FirebaseService[];
    let updatedServicesArray: string[];

    if (isAlreadySelected) {
      updatedSelectedServices = selectedServices.filter(s => s.name !== serviceName);
      updatedServicesArray = bookingData.services.filter(s => s !== serviceName);
    } else {
      updatedSelectedServices = [...selectedServices, service];
      updatedServicesArray = [...bookingData.services, serviceName];
    }

    setSelectedServices(updatedSelectedServices);
    setBookingData(prev => ({
      ...prev,
      services: updatedServicesArray,
      service: updatedServicesArray.length > 0 ? updatedServicesArray[0] : ''
    }));
  };

  const applyServiceSuggestion = (service: FirebaseService) => {
    handleServiceSelection(service.name);
    setServiceSearchTerm('');
    setShowServiceSuggestions(false);
  };

  const handleCategoryChange = (categoryName: string) => {
    if (categoryName === '__all__') {
      setSelectedCategory(null);
      setBookingData(prev => ({
        ...prev,
        category: ''
      }));
      return;
    }
    const category = categories.find(c => c.name === categoryName);
    setSelectedCategory(category || null);
    setBookingData(prev => ({
      ...prev,
      category: categoryName
    }));
  };

  const handleBranchChange = (branchName: string) => {
    const branch = branches.find(b => b.name === branchName);
    setSelectedBranch(branch || null);
    
    setBookingData(prev => ({
      ...prev,
      branch: branchName,
      category: '',
      services: [],
      service: '',
      barber: '',
      teamMembers: []
    }));
    
    setSelectedServices([]);
    setSelectedCategory(null);
    setServiceSearchTerm('');
    setShowServiceSuggestions(false);
  };

  const handlePaymentMethodToggle = (method: 'cash' | 'card' | 'check' | 'digital') => {
    const isSelected = bookingData.paymentMethods.includes(method);
    let updatedPaymentMethods;
    
    if (isSelected) {
      updatedPaymentMethods = bookingData.paymentMethods.filter(m => m !== method);
    } else {
      updatedPaymentMethods = [...bookingData.paymentMethods, method];
    }
    
    setBookingData(prev => ({
      ...prev,
      paymentMethods: updatedPaymentMethods
    }));
  };

  const handlePaymentAmountChange = (method: 'cash' | 'card' | 'check' | 'digital', amount: string) => {
    setBookingData(prev => ({
      ...prev,
      paymentAmounts: {
        ...prev.paymentAmounts,
        [method]: parseFloat(amount) || 0
      }
    }));
  };

  const calculateEditTotal = (): number => {
    if (!editBookingData || editSelectedServices.length === 0) return 0;
    
    const servicesPrice = editSelectedServices.reduce((sum, s) => sum + s.price, 0);
    const productsTotal = editBookingData.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    let subtotal = servicesPrice + productsTotal + editBookingData.serviceCharges;
    
    if (editBookingData.discount > 0) {
      if (editBookingData.discountType === 'percentage') {
        subtotal = subtotal * (1 - editBookingData.discount / 100);
      } else {
        subtotal = Math.max(0, subtotal - editBookingData.discount);
      }
    }
    
    const taxAmount = (subtotal * editBookingData.tax) / 100;
    const totalTips = editBookingData.serviceTip + editBookingData.teamMembers.reduce((sum, tm) => sum + tm.tip, 0);
    const totalAmount = subtotal + taxAmount + totalTips;
    
    return parseFloat(totalAmount.toFixed(2));
  };

  const calculateTotal = (): string => {
    const servicesPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
    const productsTotal = bookingData.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    let subtotal = servicesPrice + productsTotal + bookingData.serviceCharges;
    
    let discountAmount = 0;
    if (bookingData.discount > 0) {
      if (bookingData.discountType === 'percentage') {
        discountAmount = subtotal * (bookingData.discount / 100);
        subtotal = subtotal * (1 - bookingData.discount / 100);
      } else {
        discountAmount = bookingData.discount;
        subtotal = Math.max(0, subtotal - bookingData.discount);
      }
    }
    
    const taxAmount = (subtotal * bookingData.tax) / 100;
    const totalTips = bookingData.serviceTip + bookingData.teamMembers.reduce((sum, tm) => sum + tm.tip, 0);
    
    return (subtotal + taxAmount + totalTips).toFixed(2);
  };

  const calculateTax = (): string => {
    const servicesPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
    const productsTotal = bookingData.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    let subtotal = servicesPrice + productsTotal + bookingData.serviceCharges;
    
    if (bookingData.discount > 0) {
      if (bookingData.discountType === 'percentage') {
        subtotal = subtotal * (1 - bookingData.discount / 100);
      } else {
        subtotal = Math.max(0, subtotal - bookingData.discount);
      }
    }
    
    return ((subtotal * bookingData.tax) / 100).toFixed(2);
  };

  const totalValueDisplayMode = calendarDisplaySettings.totalValueDisplayMode || 'both';
  const invoiceValueDisplayMode = calendarDisplaySettings.invoiceValueDisplayMode || 'with-tax';
  const bookingTaxAmount = parseFloat(calculateTax());
  const bookingTotalWithTax = parseFloat(calculateTotal());
  const bookingTotalWithoutTax = Math.max(0, bookingTotalWithTax - bookingTaxAmount);
  const invoiceTaxAmount = invoiceValueDisplayMode === 'without-tax' ? 0 : Number(invoiceData?.taxAmount || 0);
  const invoiceTotalWithTax = Number(invoiceData?.total || 0);
  const invoiceTotalWithoutTax = invoiceValueDisplayMode === 'without-tax'
    ? invoiceTotalWithTax
    : Math.max(0, invoiceTotalWithTax - invoiceTaxAmount);

  type BookingPaymentMethod = 'cash' | 'card' | 'check' | 'digital';

  const availableBookingPaymentMethods = useMemo<BookingPaymentMethod[]>(() => {
    const methods: BookingPaymentMethod[] = [];
    if (paymentMethodAvailability.cash) methods.push('cash');
    if (paymentMethodAvailability.card) methods.push('card');
    if (paymentMethodAvailability.check) methods.push('check');
    if (paymentMethodAvailability.digital) methods.push('digital');

    return methods.length > 0 ? methods : ['cash'];
  }, [paymentMethodAvailability]);

  const sanitizeBookingPaymentSelection = (
    methods: Array<string>,
    amounts: BookingFormData['paymentAmounts']
  ) => {
    const allowed = new Set(availableBookingPaymentMethods);
    const normalizedMethods = methods.filter((method): method is BookingPaymentMethod =>
      allowed.has(method as BookingPaymentMethod)
    );
    const fallbackMethod = availableBookingPaymentMethods[0] || 'cash';
    const selectedMethods = normalizedMethods.length > 0 ? normalizedMethods : [fallbackMethod];

    return {
      paymentMethods: selectedMethods,
      paymentAmounts: {
        ...amounts,
        cash: selectedMethods.includes('cash') ? Number(amounts.cash || 0) : 0,
        card: selectedMethods.includes('card') ? Number(amounts.card || 0) : 0,
        check: selectedMethods.includes('check') ? Number(amounts.check || 0) : 0,
        digital: selectedMethods.includes('digital') ? Number(amounts.digital || 0) : 0,
      },
    };
  };

  type InvoiceSplitMethod = 'cash' | 'card' | 'check' | 'digital' | 'ewallet';

  const INVOICE_SPLIT_METHODS: InvoiceSplitMethod[] = ['cash', 'card', 'check', 'digital', 'ewallet'];
  const INVOICE_SPLIT_LABELS: Record<InvoiceSplitMethod, string> = {
    cash: 'Cash',
    card: 'Card',
    check: 'Check',
    digital: 'Digital',
    ewallet: 'E-Wallet',
  };

  const availableInvoiceSplitMethods = useMemo<InvoiceSplitMethod[]>(() => {
    const methods = INVOICE_SPLIT_METHODS.filter((method) => {
      if (method === 'cash') return paymentMethodAvailability.cash;
      if (method === 'card') return paymentMethodAvailability.card;
      if (method === 'check') return paymentMethodAvailability.check;
      if (method === 'digital') return paymentMethodAvailability.digital;
      return paymentMethodAvailability.ewallet;
    });

    return methods.length > 0 ? methods : ['cash'];
  }, [paymentMethodAvailability]);

  const fallbackInvoiceSplitMethod: InvoiceSplitMethod = availableInvoiceSplitMethods[0] || 'cash';

  const roundInvoiceAmount = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

  const normalizeInvoiceSplitMethod = (value: string): InvoiceSplitMethod | null => {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized) return null;
    if (normalized === 'cash') return 'cash';
    if (normalized.includes('card')) return 'card';
    if (normalized === 'check' || normalized.includes('bank')) return 'check';
    if (normalized === 'digital') return 'digital';
    if (normalized === 'wallet' || normalized === 'ewallet' || normalized.includes('wallet')) return 'ewallet';
    return null;
  };

  const normalizeInvoiceSplitMethods = (
    methods?: string[],
    paymentMethodText?: string
  ): InvoiceSplitMethod[] => {
    const set = new Set<InvoiceSplitMethod>();

    (methods || []).forEach((method) => {
      const normalized = normalizeInvoiceSplitMethod(method);
      if (normalized) set.add(normalized);
    });

    if (set.size === 0 && paymentMethodText) {
      paymentMethodText
        .split(',')
        .map((part) => part.trim())
        .forEach((method) => {
          const normalized = normalizeInvoiceSplitMethod(method);
          if (normalized) set.add(normalized);
        });
    }

    const filtered = Array.from(set).filter((method) => availableInvoiceSplitMethods.includes(method));
    return filtered.length > 0 ? filtered : [fallbackInvoiceSplitMethod];
  };

  const getInvoiceGrandTotal = (data: ExtendedInvoiceData): number => {
    const total = Number(data.total || 0);
    if (invoiceValueDisplayMode === 'without-tax') {
      return roundInvoiceAmount(Math.max(0, total - Number(data.taxAmount || 0)));
    }
    return roundInvoiceAmount(Math.max(0, total));
  };

  const buildInvoiceSplitAmounts = (
    total: number,
    methods: InvoiceSplitMethod[],
    existing?: Record<string, number | undefined>
  ) => {
    const allowedMethods = methods.filter((method) => availableInvoiceSplitMethods.includes(method));
    const selectedMethods: InvoiceSplitMethod[] = allowedMethods.length > 0 ? allowedMethods : [fallbackInvoiceSplitMethod];
    const amounts: Record<InvoiceSplitMethod, number> = {
      cash: 0,
      card: 0,
      check: 0,
      digital: 0,
      ewallet: 0,
    };

    const existingValues = selectedMethods.map((method) =>
      Math.max(0, Number(existing?.[method] ?? (method === 'ewallet' ? existing?.['wallet'] : 0) ?? 0))
    );
    const existingSum = existingValues.reduce((sum, value) => sum + value, 0);

    if (total <= 0) {
      return amounts;
    }

    if (existingSum > 0) {
      let assigned = 0;
      selectedMethods.forEach((method, index) => {
        if (index === selectedMethods.length - 1) {
          amounts[method] = roundInvoiceAmount(total - assigned);
        } else {
          const scaled = roundInvoiceAmount((existingValues[index] / existingSum) * total);
          amounts[method] = scaled;
          assigned += scaled;
        }
      });
      return amounts;
    }

    const splitAmount = roundInvoiceAmount(total / selectedMethods.length);
    let assigned = 0;

    selectedMethods.forEach((method, index) => {
      if (index === selectedMethods.length - 1) {
        amounts[method] = roundInvoiceAmount(total - assigned);
      } else {
        amounts[method] = splitAmount;
        assigned += splitAmount;
      }
    });

    return amounts;
  };

  const computeInvoiceTotals = (data: ExtendedInvoiceData, mode: 'with-tax' | 'without-tax') => {
    const itemsSubtotal = (data.items || []).reduce((sum, item) => {
      const lineTotal = Number(item.total ?? (Number(item.price || 0) * Number(item.quantity || 1)));
      return sum + lineTotal;
    }, 0);

    const serviceCharges = Number(data.serviceCharges || 0);
    const couponDiscountAmount = Math.max(0, Number(data.couponDiscountAmount || 0));
    const discountValue = Number(data.discount || 0);
    const subtotalWithCharges = Math.max(0, itemsSubtotal + serviceCharges - couponDiscountAmount);
    const discountAmount = data.discountType === 'percentage'
      ? Math.min(subtotalWithCharges, Math.max(0, (subtotalWithCharges * discountValue) / 100))
      : Math.min(subtotalWithCharges, Math.max(0, discountValue));

    const taxableAmount = Math.max(0, subtotalWithCharges - discountAmount);
    const resolvedTaxRate = mode === 'without-tax' ? 0 : Number(data.tax ?? taxRate);
    const effectiveTaxType = mode === 'without-tax'
      ? 'exclusive'
      : (data.taxType === 'exclusive' ? 'exclusive' : 'inclusive');

    let taxAmount = 0;
    let totalWithoutVatCore = taxableAmount;
    let totalAmountCore = taxableAmount;

    if (resolvedTaxRate > 0) {
      if (effectiveTaxType === 'inclusive') {
        taxAmount = Math.max(0, (taxableAmount * resolvedTaxRate) / (100 + resolvedTaxRate));
        totalWithoutVatCore = Math.max(0, taxableAmount - taxAmount);
        totalAmountCore = taxableAmount;
      } else {
        taxAmount = Math.max(0, (taxableAmount * resolvedTaxRate) / 100);
        totalWithoutVatCore = taxableAmount;
        totalAmountCore = taxableAmount + taxAmount;
      }
    }

    const teamTips = Number(data.teamMembers?.reduce((sum, tm) => sum + Number(tm.tip || 0), 0) || 0);
    const tipAmount = Number(data.serviceTip || 0) + teamTips;
    const total = totalAmountCore + tipAmount;

    return {
      subtotal: itemsSubtotal,
      taxRate: resolvedTaxRate,
      taxAmount,
      total,
      totalWithoutVat: totalWithoutVatCore + tipAmount,
    };
  };

  const buildInvoiceDataFromAppointment = (appointment: Appointment): ExtendedInvoiceData => {
    const branch = getBranchByName(appointment.branch);
    const branchInfo = branch || { name: appointment.branch, address: 'N/A', phone: 'N/A' };
    const newInvoiceNumber = generateInvoiceNumber();

    const fallbackServiceSubtotalRaw =
      appointment.subtotal ??
      appointment.servicePrice ??
      (typeof appointment.totalAmount === 'number'
        ? Math.max(0, Number(appointment.totalAmount || 0) - Number(appointment.taxAmount || 0))
        : undefined) ??
      appointment.price ??
      0;
    const fallbackServiceSubtotal = Math.max(0, Number(fallbackServiceSubtotalRaw || 0));

    let normalizedServiceDetails: ServiceInvoiceDetail[] = [];
    if (Array.isArray(appointment.serviceDetails) && appointment.serviceDetails.length > 0) {
      normalizedServiceDetails = appointment.serviceDetails.map((detail, index) => ({
        serviceName:
          detail.serviceName ||
          detail.name ||
          appointment.services?.[index] ||
          appointment.service ||
          `Service ${index + 1}`,
        branch: detail.branch || appointment.branch || 'Main Branch',
        staff: detail.staff || appointment.barber,
        staffId: detail.staffId || appointment.staffId,
        price: Number(detail.price || 0),
        tip: 0,
      }));
    } else if (Array.isArray(appointment.services) && appointment.services.length > 0) {
      const pricePerService = appointment.services.length > 0
        ? fallbackServiceSubtotal / appointment.services.length
        : fallbackServiceSubtotal;

      normalizedServiceDetails = appointment.services.map((service) => ({
        serviceName: service,
        branch: appointment.branch || 'Main Branch',
        staff: appointment.barber,
        staffId: appointment.staffId,
        price: Number(pricePerService || 0),
        tip: 0,
      }));
    } else {
      normalizedServiceDetails = [{
        serviceName: appointment.service || 'Service',
        branch: appointment.branch || 'Main Branch',
        staff: appointment.barber,
        staffId: appointment.staffId,
        price: Number(fallbackServiceSubtotal || 0),
        tip: 0,
      }];
    }

    const items: InvoiceItem[] = normalizedServiceDetails.map((service) => ({
      name: service.serviceName,
      quantity: 1,
      price: Number(service.price || 0),
      total: Number(service.price || 0),
    }));
    
    if (appointment.products && appointment.products.length > 0) {
      appointment.products.forEach(product => {
        items.push({
          name: product.name,
          quantity: product.quantity,
          price: product.price,
          total: product.price * product.quantity
        });
      });
    }
    
    const initialInvoiceData: ExtendedInvoiceData = {
      id: Number(appointment.id) || Date.now(),
      customerId: appointment.customerId || '',
      invoiceNumber: newInvoiceNumber,
      customer: appointment.customer,
      email: appointment.email,
      phone: appointment.phone,
      service: appointment.service,
      services: appointment.services,
      date: appointment.date,
      time: appointment.time,
      duration: appointment.duration,
      price: fallbackServiceSubtotal,
      status: appointment.status,
      barber: appointment.barber,
      notes: appointment.notes || '',
      tax: invoiceValueDisplayMode === 'without-tax' ? 0 : Number(appointment.tax ?? taxRate),
      discount: appointment.discount || 0,
      discountType: appointment.discountType || 'fixed',
      discountSource: appointment.discountSource,
      discountDescription: appointment.discountDescription,
      couponCode: appointment.couponCode || '',
      couponDiscountAmount: Number(appointment.couponDiscountAmount || 0),
      taxType: invoiceValueDisplayMode === 'without-tax' ? 'exclusive' : 'inclusive',
      customerAddress: `${branchInfo.name}, ${branchInfo.address || ''}`,
      paymentMethod: appointment.paymentMethods?.join(', ') || appointment.paymentMethod || 'Cash',
      paymentMethods: appointment.paymentMethods ? [...appointment.paymentMethods] : undefined,
      paymentAmounts: appointment.paymentAmounts || undefined,
      subtotal: items.reduce((sum, item) => sum + Number(item.total || 0), 0),
      taxAmount: 0,
      total: 0,
      items: items,
      serviceDetails: normalizedServiceDetails,
      cardLast4Digits: appointment.cardLast4Digits || '',
      trnNumber: appointment.trnNumber || '',
      referenceNumber: appointment.referenceNumber || '',
      teamMembers: appointment.teamMembers || [],
      serviceTip: appointment.serviceTip || 0,
      serviceCharges: appointment.serviceCharges || 0
    };

    const computed = computeInvoiceTotals(initialInvoiceData, invoiceValueDisplayMode);
    initialInvoiceData.price = computed.subtotal;
    initialInvoiceData.subtotal = computed.subtotal;
    initialInvoiceData.tax = computed.taxRate;
    initialInvoiceData.taxAmount = computed.taxAmount;
    initialInvoiceData.total = computed.total;

    const normalizedMethods = normalizeInvoiceSplitMethods(
      initialInvoiceData.paymentMethods,
      initialInvoiceData.paymentMethod
    );
    const normalizedAmounts = buildInvoiceSplitAmounts(
      getInvoiceGrandTotal(initialInvoiceData),
      normalizedMethods,
      initialInvoiceData.paymentAmounts as Record<string, number | undefined> | undefined
    );

    initialInvoiceData.paymentMethods = normalizedMethods;
    initialInvoiceData.paymentMethod = normalizedMethods.map((method) => INVOICE_SPLIT_LABELS[method]).join(', ');
    initialInvoiceData.paymentAmounts = normalizedAmounts;

    return initialInvoiceData;
  };

  const handleGenerateInvoiceClick = (appointment: Appointment, options?: { openModal?: boolean }) => {
    const normalizedStatus = String(appointment.status || '').toLowerCase();
    if (normalizedStatus !== 'completed' && normalizedStatus !== 'closed') {
      addNotification({
        type: 'error',
        title: 'Invoice Not Available',
        message: 'Invoice can only be generated for completed or closed services'
      });
      return null;
    }

    const initialInvoiceData = buildInvoiceDataFromAppointment(appointment);

    setInvoiceNumber(initialInvoiceData.invoiceNumber || generateInvoiceNumber());
    setSelectedAppointmentForInvoice(appointment);
    setIsEditingInvoice(true);
    
    setInvoiceData(initialInvoiceData);
    if (options?.openModal !== false) {
      setShowInvoiceModal(true);
    }

    return initialInvoiceData;
  };

  const handleInvoiceDataChange = (field: keyof ExtendedInvoiceData, value: any) => {
    if (invoiceData) {
      const isEwalletDiscountLocked =
        invoiceData.discountSource === 'ewallet_topup' && invoiceEwalletDiscountPercent > 0;
      if (isEwalletDiscountLocked && (field === 'discount' || field === 'discountType')) {
        return;
      }

      const normalizedValue =
        field === 'tax' && invoiceValueDisplayMode === 'without-tax'
          ? 0
          : value;

      const updatedData = {
        ...invoiceData,
        [field]: normalizedValue
      };

      if (invoiceValueDisplayMode === 'without-tax') {
        updatedData.tax = 0;
      }

      const computed = computeInvoiceTotals(updatedData, invoiceValueDisplayMode);
      updatedData.price = computed.subtotal;
      updatedData.subtotal = computed.subtotal;
      updatedData.taxAmount = computed.taxAmount;
      updatedData.total = computed.total;
      updatedData.taxType = invoiceValueDisplayMode === 'without-tax' ? 'exclusive' : 'inclusive';
      
      setInvoiceData(updatedData);
    }
  };

  const selectedInvoicePaymentMethods = useMemo(
    () => normalizeInvoiceSplitMethods(invoiceData?.paymentMethods, invoiceData?.paymentMethod),
    [invoiceData?.paymentMethods, invoiceData?.paymentMethod, availableInvoiceSplitMethods, fallbackInvoiceSplitMethod]
  );

  const isInvoiceEwalletDiscountLocked =
    invoiceData?.discountSource === 'ewallet_topup' && invoiceEwalletDiscountPercent > 0;

  const invoiceGrandTotal = useMemo(
    () => (invoiceData ? getInvoiceGrandTotal(invoiceData) : 0),
    [invoiceData?.total, invoiceData?.taxAmount, invoiceValueDisplayMode]
  );

  const selectedInvoicePaymentTotal = useMemo(
    () => roundInvoiceAmount(
      selectedInvoicePaymentMethods.reduce(
        (sum, method) => sum + Number(invoiceData?.paymentAmounts?.[method] || 0),
        0
      )
    ),
    [invoiceData?.paymentAmounts, selectedInvoicePaymentMethods]
  );

  const invoicePaymentRemaining = roundInvoiceAmount(invoiceGrandTotal - selectedInvoicePaymentTotal);

  const invoicePricingSummary = useMemo(() => {
    const subtotal = Number(invoiceData?.subtotal || 0);
    const serviceCharges = Number(invoiceData?.serviceCharges || 0);
    const couponDiscountAmount = Math.max(0, Number(invoiceData?.couponDiscountAmount || 0));
    const discountValue = Number(invoiceData?.discount || 0);
    const chargeableAmount = Math.max(0, subtotal + serviceCharges - couponDiscountAmount);
    const discountAmount = (invoiceData?.discountType || 'fixed') === 'percentage'
      ? Math.min(chargeableAmount, Math.max(0, (chargeableAmount * discountValue) / 100))
      : Math.min(chargeableAmount, Math.max(0, discountValue));
    const taxAmount = Math.max(0, Number(invoiceTaxAmount || 0));
    const totalAmount = Math.max(
      0,
      Number(invoiceValueDisplayMode === 'without-tax' ? invoiceTotalWithoutTax : invoiceTotalWithTax)
    );
    const amountPaid = Math.max(0, Number(selectedInvoicePaymentTotal || 0));
    const ewalletUsed = Math.max(
      0,
      Number(invoiceData?.paymentAmounts?.ewallet ?? invoiceData?.paymentAmounts?.wallet ?? 0)
    );
    const hasEwalletAvailability = Number.isFinite(Number(invoiceData?.ewalletBalanceAvailable));
    const ewalletBalanceAvailable = hasEwalletAvailability
      ? Math.max(0, Number(invoiceData?.ewalletBalanceAvailable || 0))
      : null;

    return {
      subtotal,
      serviceCharges,
      couponDiscountAmount,
      discountAmount,
      taxAmount,
      totalWithoutVat: Math.max(0, totalAmount - taxAmount),
      totalAmount,
      amountPaid,
      amountDue: Math.max(0, totalAmount - amountPaid),
      ewalletBalanceLeft: ewalletBalanceAvailable === null
        ? null
        : Math.max(0, ewalletBalanceAvailable - ewalletUsed),
      taxTypeLabel: invoiceValueDisplayMode === 'without-tax'
        ? 'Exclusive'
        : (invoiceData?.taxType === 'exclusive' ? 'Exclusive' : 'Inclusive'),
      vatRate: Number(invoiceData?.tax ?? taxRate),
    };
  }, [
    invoiceData?.subtotal,
    invoiceData?.serviceCharges,
    invoiceData?.couponDiscountAmount,
    invoiceData?.discount,
    invoiceData?.discountType,
    invoiceData?.tax,
    invoiceData?.paymentAmounts,
    invoiceData?.ewalletBalanceAvailable,
    invoiceTaxAmount,
    invoiceTotalWithTax,
    invoiceTotalWithoutTax,
    invoiceValueDisplayMode,
    selectedInvoicePaymentTotal,
    taxRate,
  ]);

  const handleInvoiceSplitMethodToggle = (method: InvoiceSplitMethod) => {
    if (!invoiceData) return;
    if (!availableInvoiceSplitMethods.includes(method)) return;

    const currentMethods = normalizeInvoiceSplitMethods(invoiceData.paymentMethods, invoiceData.paymentMethod);
    const updatedMethods = currentMethods.includes(method)
      ? currentMethods.filter((entry) => entry !== method)
      : [...currentMethods, method];
    const ensuredMethods: InvoiceSplitMethod[] = updatedMethods.length > 0 ? updatedMethods : [fallbackInvoiceSplitMethod];
    const updatedAmounts = buildInvoiceSplitAmounts(
      getInvoiceGrandTotal(invoiceData),
      ensuredMethods,
      invoiceData.paymentAmounts as Record<string, number | undefined> | undefined
    );

    setInvoiceData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        paymentMethods: ensuredMethods,
        paymentMethod: ensuredMethods.map((entry) => INVOICE_SPLIT_LABELS[entry]).join(', '),
        paymentAmounts: updatedAmounts,
      };
    });
  };

  const handleInvoiceSplitAmountChange = (method: InvoiceSplitMethod, amount: string) => {
    if (!invoiceData) return;
    if (!availableInvoiceSplitMethods.includes(method)) return;
    const numericAmount = Math.max(0, Number(amount || 0));

    setInvoiceData((prev) => {
      if (!prev) return prev;
      const methods = normalizeInvoiceSplitMethods(prev.paymentMethods, prev.paymentMethod);
      const nextAmounts = {
        ...(prev.paymentAmounts || {}),
        [method]: roundInvoiceAmount(numericAmount),
      };

      return {
        ...prev,
        paymentMethods: methods,
        paymentMethod: methods.map((entry) => INVOICE_SPLIT_LABELS[entry]).join(', '),
        paymentAmounts: nextAmounts,
      };
    });
  };

  useEffect(() => {
    if (!invoiceData) return;

    const methods = normalizeInvoiceSplitMethods(invoiceData.paymentMethods, invoiceData.paymentMethod);
    const splitAmounts = buildInvoiceSplitAmounts(
      getInvoiceGrandTotal(invoiceData),
      methods,
      invoiceData.paymentAmounts as Record<string, number | undefined> | undefined
    );

    const hasChanged = methods.some((method) =>
      roundInvoiceAmount(Number(invoiceData.paymentAmounts?.[method] || 0)) !== roundInvoiceAmount(splitAmounts[method])
    );

    const methodLabel = methods.map((method) => INVOICE_SPLIT_LABELS[method]).join(', ');
    if (!hasChanged && invoiceData.paymentMethod === methodLabel) return;

    setInvoiceData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        paymentMethods: methods,
        paymentMethod: methodLabel,
        paymentAmounts: splitAmounts,
      };
    });
  }, [invoiceData?.total, invoiceData?.taxAmount, invoiceValueDisplayMode, availableInvoiceSplitMethods, fallbackInvoiceSplitMethod]);

  useEffect(() => {
    if (!showInvoiceModal || !invoiceData) {
      setInvoiceEwalletBalance(null);
      setInvoiceEwalletDiscountPercent(0);
      setInvoiceEwalletLoading(false);
      return;
    }

    let cancelled = false;

    const loadInvoiceEwalletBalance = async () => {
      setInvoiceEwalletLoading(true);

      try {
        let resolvedCustomerId = String(invoiceData.customerId || selectedAppointmentForInvoice?.customerId || '').trim();

        if (!resolvedCustomerId) {
          const email = String(invoiceData.email || '').trim();
          const phone = String(invoiceData.phone || '').trim();
          const customerName = String(invoiceData.customer || '').trim();

          if (email) {
            const emailSnapshot = await getDocs(query(collection(db, 'customers'), where('email', '==', email)));
            if (!emailSnapshot.empty) {
              resolvedCustomerId = emailSnapshot.docs[0].id;
            }
          }

          if (!resolvedCustomerId && phone) {
            const phoneSnapshot = await getDocs(query(collection(db, 'customers'), where('phone', '==', phone)));
            if (!phoneSnapshot.empty) {
              resolvedCustomerId = phoneSnapshot.docs[0].id;
            }
          }

          if (!resolvedCustomerId && customerName) {
            const nameSnapshot = await getDocs(query(collection(db, 'customers'), where('name', '==', customerName)));
            if (!nameSnapshot.empty) {
              resolvedCustomerId = nameSnapshot.docs[0].id;
            }
          }
        }

        if (!resolvedCustomerId) {
          if (!cancelled) {
            setInvoiceEwalletBalance(null);
            setInvoiceData((prev) => {
              if (!prev || prev.ewalletBalanceAvailable === undefined) return prev;
              return {
                ...prev,
                ewalletBalanceAvailable: undefined,
              };
            });
          }
          return;
        }

        let balance: number | null = null;
        let walletDiscountPercent = 0;
        const walletDoc = await getDoc(doc(db, 'wallets', resolvedCustomerId));

        if (walletDoc.exists()) {
          const walletData: any = walletDoc.data();
          balance = Number(walletData.balance ?? walletData.walletBalance ?? walletData.wallet ?? 0);
          const rawDiscount = Number(walletData.serviceDiscountPercent ?? walletData.walletTopupDiscountPercent ?? 0);
          walletDiscountPercent = balance > 0 ? Math.min(100, Math.max(0, rawDiscount)) : 0;
        } else {
          const walletSnapshot = await getDocs(query(collection(db, 'wallets'), where('customerId', '==', resolvedCustomerId)));
          if (!walletSnapshot.empty) {
            const walletData: any = walletSnapshot.docs[0].data();
            balance = Number(walletData.balance ?? walletData.walletBalance ?? walletData.wallet ?? 0);
            const rawDiscount = Number(walletData.serviceDiscountPercent ?? walletData.walletTopupDiscountPercent ?? 0);
            walletDiscountPercent = balance > 0 ? Math.min(100, Math.max(0, rawDiscount)) : 0;
          }
        }

        if (!cancelled) {
          setInvoiceEwalletBalance(balance ?? 0);
          setInvoiceEwalletDiscountPercent(walletDiscountPercent);
          setInvoiceData((prev) => {
            if (!prev) return prev;
            const nextBalance = Math.max(0, Number(balance ?? 0));
            if (Number(prev.ewalletBalanceAvailable ?? -1) === nextBalance) return prev;
            return {
              ...prev,
              ewalletBalanceAvailable: nextBalance,
            };
          });

          if (walletDiscountPercent > 0) {
            setInvoiceData((prev) => {
              if (!prev) return prev;

              const currentPercent = prev.discountType === 'percentage'
                ? Number(prev.discount || 0)
                : 0;
              if (currentPercent >= walletDiscountPercent && prev.discountType === 'percentage') {
                return prev;
              }

              const updated: ExtendedInvoiceData = {
                ...prev,
                discountType: 'percentage',
                discount: walletDiscountPercent,
                discountSource: 'ewallet_topup',
                discountDescription: 'Discount applied due to eWallet top-up',
              };
              const computed = computeInvoiceTotals(updated, invoiceValueDisplayMode);
              updated.price = computed.subtotal;
              updated.subtotal = computed.subtotal;
              updated.tax = computed.taxRate;
              updated.taxAmount = computed.taxAmount;
              updated.total = computed.total;
              return updated;
            });
          } else {
            setInvoiceData((prev) => {
              if (!prev || prev.discountSource !== 'ewallet_topup') return prev;
              const updated: ExtendedInvoiceData = {
                ...prev,
                discountType: 'fixed',
                discount: 0,
                discountSource: undefined,
                discountDescription: undefined,
              };
              const computed = computeInvoiceTotals(updated, invoiceValueDisplayMode);
              updated.price = computed.subtotal;
              updated.subtotal = computed.subtotal;
              updated.tax = computed.taxRate;
              updated.taxAmount = computed.taxAmount;
              updated.total = computed.total;
              return updated;
            });
          }
        }
      } catch (error) {
        console.error('Error loading e-wallet balance:', error);
        if (!cancelled) {
          setInvoiceEwalletBalance(null);
          setInvoiceEwalletDiscountPercent(0);
          setInvoiceData((prev) => {
            if (!prev || prev.ewalletBalanceAvailable === undefined) return prev;
            return {
              ...prev,
              ewalletBalanceAvailable: undefined,
            };
          });
        }
      } finally {
        if (!cancelled) {
          setInvoiceEwalletLoading(false);
        }
      }
    };

    loadInvoiceEwalletBalance();

    return () => {
      cancelled = true;
    };
  }, [
    showInvoiceModal,
    invoiceData,
    selectedAppointmentForInvoice?.customerId,
  ]);

  const handleEditAppointment = (appointment: Appointment) => {
    if (String(appointment.status || '').toLowerCase() === 'closed') {
      addNotification({
        type: 'warning',
        title: 'Editing Restricted',
        message: 'Closed bookings cannot be edited by branch admin. Please contact super admin.'
      });
      return;
    }

    const servicesArray = appointment.services && Array.isArray(appointment.services) 
      ? appointment.services 
      : [appointment.service];
    
    const editData: BookingFormData = {
      customer: appointment.customer,
      phone: appointment.phone || '',
      email: appointment.email || '',
      service: servicesArray[0] || '',
      services: servicesArray,
      barber: appointment.barber,
      teamMembers: appointment.teamMembers || [],
      date: appointment.date,
      time: appointment.time,
      notes: appointment.notes || '',
      products: appointment.products || [],
      tax: appointment.tax || 5,
      serviceCharges: appointment.serviceCharges || 0,
      discount: appointment.discount || 0,
      discountType: appointment.discountType || 'fixed',
      serviceTip: appointment.serviceTip || 0,
      paymentMethods: appointment.paymentMethods || [],
      paymentAmounts: appointment.paymentAmounts || {
        cash: 0,
        card: 0,
        check: 0,
        digital: 0
      },
      status: appointment.status,
      generateInvoice: false,
      cardLast4Digits: appointment.cardLast4Digits || '',
      trnNumber: appointment.trnNumber || '',
      category: appointment.serviceCategory || '',
      branch: appointment.branch || ''
    };
    
    const matchedServices: FirebaseService[] = [];
    servicesArray.forEach(serviceName => {
      const foundService = services.find(s => s.name === serviceName);
      if (foundService) {
        matchedServices.push(foundService);
      }
    });
    
    setEditingAppointment(appointment);
    setEditBookingData(editData);
    setEditSelectedServices(matchedServices);
    setShowEditDialog(true);
  };

  const updateAppointmentInFirebase = async (
    appointmentId: string,
    updatedData: BookingFormData,
    selectedServices: FirebaseService[],
    selectedCategory: FirebaseCategory | null,
    selectedBranch: FirebaseBranch | null,
    originalAppointment: Appointment
  ): Promise<boolean> => {
    try {
      const servicesPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
      const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
      const productsTotal = updatedData.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
      
      let subtotal = servicesPrice + productsTotal + updatedData.serviceCharges;
      
      let discountAmount = 0;
      if (updatedData.discount > 0) {
        if (updatedData.discountType === 'percentage') {
          discountAmount = subtotal * (updatedData.discount / 100);
          subtotal = subtotal * (1 - updatedData.discount / 100);
        } else {
          discountAmount = updatedData.discount;
          subtotal = Math.max(0, subtotal - updatedData.discount);
        }
      }
      
      const taxAmount = (subtotal * updatedData.tax) / 100;
      const totalTips = updatedData.serviceTip + updatedData.teamMembers.reduce((sum, tm) => sum + tm.tip, 0);
      const totalAmount = subtotal + taxAmount + totalTips;
      
      const serviceDetails = selectedServices.map(service => ({
        id: service.firebaseId,
        name: service.name,
        price: service.price,
        duration: service.duration,
        category: service.category
      }));
      
      const updateData = {
        customerName: updatedData.customer,
        customerEmail: updatedData.email || "",
        customerPhone: updatedData.phone || "",
        serviceName: updatedData.services[0] || "Multiple Services",
        services: updatedData.services,
        servicesDetails: serviceDetails,
        serviceCategory: selectedCategory?.name || selectedServices[0]?.category || "Multiple",
        serviceDuration: totalDuration,
        servicePrice: servicesPrice,
        totalAmount: totalAmount,
        totalDuration: totalDuration,
        staff: updatedData.barber,
        staffName: updatedData.barber,
        staffId: updatedData.teamMembers.find(tm => tm.name === updatedData.barber)?.name || updatedData.barber,
        date: updatedData.date,
        time: updatedData.time,
        timeSlot: updatedData.time,
        bookingDate: updatedData.date,
        bookingTime: updatedData.time,
        status: updatedData.status,
        paymentMethod: updatedData.paymentMethods.length > 0 
          ? updatedData.paymentMethods.join(', ') 
          : 'cash',
        paymentStatus: updatedData.status === 'completed' ? 'paid' : 'pending',
        branch: selectedBranch?.name || selectedServices[0]?.branchNames?.[0] || "All Branches",
        branchNames: selectedBranch?.name ? [selectedBranch.name] : (selectedServices[0]?.branchNames || ["All Branches"]),
        category: selectedCategory?.name || "",
        categoryId: selectedCategory?.firebaseId || "",
        cardLast4Digits: updatedData.cardLast4Digits || "",
        trnNumber: updatedData.trnNumber || "",
        paymentAmounts: updatedData.paymentAmounts,
        notes: updatedData.notes || '',
        products: updatedData.products.map(product => ({
          productName: product.name,
          name: product.name,
          category: product.category,
          price: product.price,
          quantity: product.quantity,
          total: product.price * product.quantity
        })),
        teamMembers: updatedData.teamMembers,
        subtotal: subtotal,
        tax: updatedData.tax,
        taxAmount: taxAmount,
        discount: updatedData.discount,
        discountType: updatedData.discountType,
        discountAmount: discountAmount,
        serviceTip: updatedData.serviceTip,
        serviceCharges: updatedData.serviceCharges,
        totalTips: totalTips,
        productsTotal: productsTotal,
        paymentMethods: updatedData.paymentMethods,
        updatedAt: serverTimestamp()
      };
      
      const bookingRef = doc(db, "bookings", appointmentId);
      await updateDoc(bookingRef, updateData);
      
      return true;
    } catch (error) {
      console.error("❌ Error updating appointment:", error);
      return false;
    }
  };

  const handleEditSubmit = async () => {
    if (!editingAppointment || !editBookingData || !editingAppointment.firebaseId) {
      addNotification({
        type: 'error',
        title: 'Edit Error',
        message: 'No appointment selected for editing.'
      });
      return;
    }

    if (String(editingAppointment.status || '').toLowerCase() === 'closed') {
      addNotification({
        type: 'warning',
        title: 'Editing Restricted',
        message: 'Closed bookings cannot be edited by branch admin. Please contact super admin.'
      });
      return;
    }
    
    if (!editBookingData.customer || !editBookingData.barber || !editBookingData.date || !editBookingData.time || editSelectedServices.length === 0) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required fields including at least one service.',
      });
      return;
    }

    const editPaymentSelection = sanitizeBookingPaymentSelection(
      editBookingData.paymentMethods,
      editBookingData.paymentAmounts
    );
    const sanitizedEditBookingData: BookingFormData = {
      ...editBookingData,
      paymentMethods: editPaymentSelection.paymentMethods as BookingFormData['paymentMethods'],
      paymentAmounts: editPaymentSelection.paymentAmounts,
    };
    
    const success = await updateAppointmentInFirebase(
      editingAppointment.firebaseId,
      sanitizedEditBookingData,
      editSelectedServices,
      selectedCategory,
      selectedBranch,
      editingAppointment
    );
    
    if (success) {
      setBookings(prev => prev.map(booking => 
        booking.firebaseId === editingAppointment.firebaseId ? {
          ...booking,
          customerName: sanitizedEditBookingData.customer,
          customerEmail: sanitizedEditBookingData.email,
          customerPhone: sanitizedEditBookingData.phone,
          services: sanitizedEditBookingData.services,
          totalDuration: editSelectedServices.reduce((sum, s) => sum + s.duration, 0),
          status: sanitizedEditBookingData.status,
          bookingDate: sanitizedEditBookingData.date,
          bookingTime: sanitizedEditBookingData.time,
          staff: sanitizedEditBookingData.barber,
          notes: sanitizedEditBookingData.notes,
          cardLast4Digits: sanitizedEditBookingData.cardLast4Digits,
          trnNumber: sanitizedEditBookingData.trnNumber,
          teamMembers: sanitizedEditBookingData.teamMembers,
          products: sanitizedEditBookingData.products,
          paymentMethods: sanitizedEditBookingData.paymentMethods,
          paymentAmounts: sanitizedEditBookingData.paymentAmounts,
          discount: sanitizedEditBookingData.discount,
          discountType: sanitizedEditBookingData.discountType,
          serviceTip: sanitizedEditBookingData.serviceTip,
          serviceCharges: sanitizedEditBookingData.serviceCharges,
          tax: sanitizedEditBookingData.tax
        } : booking
      ));
      
      addNotification({
        type: 'success',
        title: 'Appointment Updated',
        message: `Appointment for ${sanitizedEditBookingData.customer} has been successfully updated.`
      });
      
      setShowEditDialog(false);
      setShowAppointmentDetails(false);
      setEditingAppointment(null);
      setEditBookingData(null);
      setEditSelectedServices([]);
    } else {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update appointment in Firebase. Please try again.'
      });
    }
  };

  const deleteBookingInFirebase = async (bookingId: string): Promise<boolean> => {
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      await updateDoc(bookingRef, {
        status: "deleted",
        deletedAt: new Date(),
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error("Error deleting booking:", error);
      return false;
    }
  };

  const handleDeleteBooking = async (appointment: Appointment) => {
    if (!appointment.firebaseId) {
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Cannot delete appointment without Firebase ID'
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete booking for ${appointment.customer}? This action cannot be undone.`)) {
      return;
    }

    try {
      const success = await deleteBookingInFirebase(appointment.firebaseId);
      
      if (success) {
        setBookings(prev => prev.filter(b => b.firebaseId !== appointment.firebaseId));
        
        addNotification({
          type: 'success',
          title: 'Booking Deleted',
          message: `Booking for ${appointment.customer} has been deleted successfully`
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Delete Failed',
          message: 'Failed to delete booking from Firebase'
        });
      }
    } catch (error) {
      console.error("Error deleting booking:", error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete booking'
      });
    }
  };

  const handleEditBookingFromCalendar = (appointment: any) => {
    const fullAppointment = allAppointments.find(
      (apt) => apt.id === appointment.id || apt.firebaseId === appointment.firebaseId
    );
    const resolvedAppointment = (fullAppointment || appointment) as Appointment;

    if (String(resolvedAppointment.status || '').toLowerCase() === 'closed') {
      addNotification({
        type: 'warning',
        title: 'Editing Restricted',
        message: 'Closed bookings cannot be edited by branch admin. Please contact super admin.'
      });
      return;
    }

    handleEditAppointment(resolvedAppointment);
  };

  const handleDeleteBookingFromCalendar = async (appointment: any) => {
    const fullAppointment = allAppointments.find(
      (apt) => apt.id === appointment.id || apt.firebaseId === appointment.firebaseId
    );
    await handleDeleteBooking((fullAppointment || appointment) as Appointment);
  };

  const handleCheckoutFromCalendar = (appointment: any) => {
    const fullAppointment = allAppointments.find(
      (apt) => apt.id === appointment.id || apt.firebaseId === appointment.firebaseId
    );
    const resolvedAppointment = (fullAppointment || appointment) as Appointment;
    setSelectedAppointment(resolvedAppointment);
    handleGenerateInvoiceClick(resolvedAppointment);
  };

  const handleDownloadInvoiceDirectFromCalendar = async (appointment: any) => {
    const fullAppointment = allAppointments.find(
      (apt) => apt.id === appointment.id || apt.firebaseId === appointment.firebaseId
    );
    const resolvedAppointment = (fullAppointment || appointment) as Appointment;
    const normalizedStatus = String(resolvedAppointment.status || '').toLowerCase();

    if (normalizedStatus !== 'completed' && normalizedStatus !== 'closed') {
      addNotification({
        type: 'warning',
        title: 'Invoice Not Available',
        message: 'Invoice can only be downloaded for completed or closed bookings.'
      });
      return;
    }

    try {
      const generatedAt = new Date().toLocaleString();
      const disclaimerText = (invoiceDisclaimerTemplate || DEFAULT_INVOICE_DISCLAIMER_TEMPLATE)
        .replace(/\{\{dateTime\}\}/gi, generatedAt)
        .trim();

      const preparedInvoice = buildInvoiceDataFromAppointment(resolvedAppointment);
      const success = await generatePDFInvoice({
        ...preparedInvoice,
        notes: String(preparedInvoice.notes || '').trim(),
        disclaimerText,
      });

      if (!success) {
        addNotification({
          type: 'error',
          title: 'PDF Generation Failed',
          message: 'Failed to download invoice. Please try again.'
        });
        return;
      }

      if (resolvedAppointment.firebaseId) {
        try {
          await updateDoc(doc(db, 'bookings', resolvedAppointment.firebaseId), {
            invoiceNumber: preparedInvoice.invoiceNumber || '',
            updatedAt: serverTimestamp(),
          });
        } catch (saveError) {
          console.error('Error saving invoice number after direct download:', saveError);
        }
      }

      addNotification({
        type: 'success',
        title: 'Invoice Downloaded',
        message: `Invoice ${preparedInvoice.invoiceNumber} downloaded successfully.`
      });
    } catch (error) {
      console.error('Error downloading invoice from booking menu:', error);
      addNotification({
        type: 'error',
        title: 'Download Failed',
        message: 'Could not download invoice from booking menu.'
      });
    }
  };

  const handleCloseBookingFromCalendar = async (appointment: any) => {
    const fullAppointment = allAppointments.find(
      (apt) => apt.id === appointment.id || apt.firebaseId === appointment.firebaseId
    );
    const resolvedAppointment = (fullAppointment || appointment) as Appointment;

    if (!resolvedAppointment.firebaseId) {
      addNotification({
        type: 'error',
        title: 'Close Failed',
        message: 'Booking record not found.'
      });
      return;
    }

    if (String(resolvedAppointment.status || '').toLowerCase() === 'closed') {
      addNotification({
        type: 'info',
        title: 'Already Closed',
        message: 'This booking is already closed.'
      });
      return;
    }

    if (!confirm(`Close booking for ${resolvedAppointment.customer || 'customer'}?`)) {
      return;
    }

    try {
      await updateDoc(doc(db, 'bookings', resolvedAppointment.firebaseId), {
        status: 'closed',
        updatedAt: serverTimestamp(),
      });

      setBookings((prev) => prev.map((booking) =>
        booking.firebaseId === resolvedAppointment.firebaseId
          ? { ...booking, status: 'closed' }
          : booking
      ));

      setSelectedAppointment((prev) =>
        prev && (prev.firebaseId === resolvedAppointment.firebaseId || prev.id === resolvedAppointment.id)
          ? { ...prev, status: 'closed' }
          : prev
      );

      setSelectedAppointmentForInvoice((prev) =>
        prev && (prev.firebaseId === resolvedAppointment.firebaseId || prev.id === resolvedAppointment.id)
          ? { ...prev, status: 'closed' }
          : prev
      );

      if (selectedAppointmentForInvoice?.firebaseId === resolvedAppointment.firebaseId) {
        setInvoiceData((prev) => (prev ? { ...prev, status: 'closed' } : prev));
      }

      addNotification({
        type: 'success',
        title: 'Booking Closed',
        message: 'Booking was closed successfully.'
      });
    } catch (error) {
      console.error('Error closing booking from menu:', error);
      addNotification({
        type: 'error',
        title: 'Close Failed',
        message: 'Failed to close booking. Please try again.'
      });
    }
  };

  const getInvoiceServiceItemCount = (data: ExtendedInvoiceData | null): number => {
    if (!data) return 0;
    if (Array.isArray(data.serviceDetails) && data.serviceDetails.length > 0) return data.serviceDetails.length;
    if (Array.isArray(data.services) && data.services.length > 0) return data.services.length;
    return data.service ? 1 : 0;
  };

  const getInvoiceProductItems = (data: ExtendedInvoiceData | null): InvoiceItem[] => {
    if (!data) return [];
    return (data.items || []).slice(getInvoiceServiceItemCount(data));
  };

  const handleAddInvoiceItem = () => {
    if (invoiceData) {
      const newItems = [...(invoiceData.items || [])];
      newItems.push({
        name: 'New Product',
        quantity: 1,
        price: 0,
        total: 0
      });
      handleInvoiceDataChange('items', newItems);
    }
  };

  const handleRemoveInvoiceItem = (index: number) => {
    if (invoiceData && invoiceData.items) {
      const newItems = invoiceData.items.filter((_, i) => i !== index);
      handleInvoiceDataChange('items', newItems);
    }
  };

  const handleAddInvoiceProductItem = (product: { name: string; category?: string; price: number }) => {
    if (!invoiceData) return;

    const newItems = [...(invoiceData.items || [])];
    const serviceItemCount = getInvoiceServiceItemCount(invoiceData);
    const existingProductOffset = newItems.slice(serviceItemCount).findIndex(
      (item) => normalizeProductLookup(item.name) === normalizeProductLookup(product.name)
    );

    if (existingProductOffset >= 0) {
      const existingIndex = serviceItemCount + existingProductOffset;
      const currentItem = newItems[existingIndex];
      const unitPrice = Number(currentItem.price || product.price || 0);
      const quantity = Number(currentItem.quantity || 0) + 1;

      newItems[existingIndex] = {
        ...currentItem,
        quantity,
        price: unitPrice,
        total: unitPrice * quantity,
      };
    } else {
      const unitPrice = Number(product.price || 0);
      newItems.push({
        name: product.name,
        quantity: 1,
        price: unitPrice,
        total: unitPrice,
      });
    }

    handleInvoiceDataChange('items', newItems);
    setInvoiceProductSearchTerm('');
    setShowInvoiceProductSuggestions(false);
  };

  const handleDownloadInvoicePDF = async () => {
    if (!invoiceData) {
      addNotification({
        type: 'error',
        title: 'Invoice Error',
        message: 'No invoice data found'
      });
      return;
    }
    
    try {
      const generatedAt = new Date().toLocaleString();
      const disclaimerText = (invoiceDisclaimerTemplate || DEFAULT_INVOICE_DISCLAIMER_TEMPLATE)
        .replace(/\{\{dateTime\}\}/gi, generatedAt)
        .trim();

      const success = await generatePDFInvoice({
        ...invoiceData,
        notes: String(invoiceData.notes || '').trim(),
        disclaimerText,
      });
      
      if (success) {
        if (selectedAppointmentForInvoice?.firebaseId) {
          try {
            const normalizedMethods = normalizeInvoiceSplitMethods(
              invoiceData.paymentMethods,
              invoiceData.paymentMethod
            );
            const normalizedReferenceNumber = String(invoiceData.referenceNumber || '').trim();

            await updateDoc(doc(db, 'bookings', selectedAppointmentForInvoice.firebaseId), {
              paymentMethod: normalizedMethods.map((method) => INVOICE_SPLIT_LABELS[method]).join(', '),
              paymentMethods: normalizedMethods,
              paymentAmounts: invoiceData.paymentAmounts || {},
              discount: Number(invoiceData.discount || 0),
              discountType: invoiceData.discountType || 'fixed',
              discountSource: invoiceData.discountSource || null,
              discountDescription: invoiceData.discountDescription || null,
              couponCode: String(invoiceData.couponCode || '').trim(),
              couponDiscountAmount: Number(invoiceData.couponDiscountAmount || 0),
              taxType: invoiceData.taxType || (invoiceValueDisplayMode === 'without-tax' ? 'exclusive' : 'inclusive'),
              referenceNumber: normalizedReferenceNumber,
              invoiceNumber: invoiceData.invoiceNumber || '',
              updatedAt: serverTimestamp(),
            });

            setBookings((prev) => prev.map((booking) =>
              booking.firebaseId === selectedAppointmentForInvoice.firebaseId
                ? {
                    ...booking,
                    paymentMethod: normalizedMethods.map((method) => INVOICE_SPLIT_LABELS[method]).join(', '),
                    paymentMethods: normalizedMethods,
                    paymentAmounts: (invoiceData.paymentAmounts as any) || booking.paymentAmounts,
                    discount: Number(invoiceData.discount || 0),
                    discountType: invoiceData.discountType || 'fixed',
                    couponCode: String(invoiceData.couponCode || '').trim(),
                    couponDiscountAmount: Number(invoiceData.couponDiscountAmount || 0),
                    taxType: invoiceData.taxType || (invoiceValueDisplayMode === 'without-tax' ? 'exclusive' : 'inclusive'),
                    referenceNumber: normalizedReferenceNumber,
                  }
                : booking
            ));
          } catch (firebaseSaveError) {
            console.error('Error saving invoice payment details to Firebase:', firebaseSaveError);
            addNotification({
              type: 'warning',
              title: 'Invoice Saved Partially',
              message: 'PDF downloaded, but payment reference number could not be saved to Firebase.'
            });
          }
        }

        addNotification({
          type: 'success',
          title: 'Invoice Generated',
          message: `Invoice ${invoiceData.invoiceNumber} has been downloaded as PDF`
        });
        
        setTimeout(() => {
          setShowInvoiceModal(false);
          setInvoiceProductSearchTerm('');
          setShowInvoiceProductSuggestions(false);
        }, 1500);
      } else {
        addNotification({
          type: 'error',
          title: 'PDF Generation Failed',
          message: 'Failed to generate PDF invoice. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      addNotification({
        type: 'error',
        title: 'Invoice Generation Failed',
        message: 'Failed to generate invoice. Please try again.'
      });
    }
  };

  const handleSendInvoiceWhatsApp = () => {
    if (!invoiceData) {
      addNotification({
        type: 'error',
        title: 'Invoice Error',
        message: 'No invoice data found'
      });
      return;
    }

    const rawPhone = String(invoiceData.phone || selectedAppointmentForInvoice?.phone || '').trim();
    const customerPhone = rawPhone.replace(/[^0-9]/g, '');

    if (!customerPhone) {
      addNotification({
        type: 'warning',
        title: 'WhatsApp Not Available',
        message: 'Customer phone number is missing. Please add phone number first.'
      });
      return;
    }

    const grandTotal = getInvoiceGrandTotal(invoiceData);
    const invoiceNo = String(invoiceData.invoiceNumber || invoiceNumber || 'N/A');
    const invoiceDateValue = String(invoiceData.date || selectedAppointmentForInvoice?.date || new Date().toISOString().split('T')[0]);
    const customerName = String(invoiceData.customer || selectedAppointmentForInvoice?.customer || 'Customer');
    const branchName = String(invoiceData.branch || selectedAppointmentForInvoice?.branch || 'Main Branch');

    const message = [
      `Hello ${customerName},`,
      `Your invoice is ready.`,
      `Invoice #: ${invoiceNo}`,
      `Date: ${invoiceDateValue}`,
      `Branch: ${branchName}`,
      `Total: AED ${grandTotal.toFixed(2)}`,
      `Thank you for choosing Man of Cave.`,
    ].join('\n');

    const whatsappUrl = `https://wa.me/${customerPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

    addNotification({
      type: 'success',
      title: 'WhatsApp Opened',
      message: 'Invoice details are ready to send on WhatsApp.'
    });
  };

  const handleCloseBookingFromInvoice = async () => {
    if (!selectedAppointmentForInvoice?.firebaseId || !invoiceData) {
      addNotification({
        type: 'error',
        title: 'Close Failed',
        message: 'Booking record not found for closing.'
      });
      return;
    }

    setClosingInvoiceBooking(true);

    try {
      await updateDoc(doc(db, 'bookings', selectedAppointmentForInvoice.firebaseId), {
        status: 'closed',
        updatedAt: serverTimestamp(),
      });

      setBookings((prev) => prev.map((booking) =>
        booking.firebaseId === selectedAppointmentForInvoice.firebaseId
          ? { ...booking, status: 'closed' }
          : booking
      ));

      setSelectedAppointmentForInvoice((prev) => prev ? { ...prev, status: 'closed' } : prev);
      setInvoiceData((prev) => prev ? { ...prev, status: 'closed' } : prev);

      addNotification({
        type: 'success',
        title: 'Booking Closed',
        message: 'Booking is now closed and marked with green status on the calendar.'
      });
    } catch (error) {
      console.error('Error closing booking from invoice modal:', error);
      addNotification({
        type: 'error',
        title: 'Close Failed',
        message: 'Failed to close booking. Please try again.'
      });
    } finally {
      setClosingInvoiceBooking(false);
    }
  };

  const buildCheckoutBookingData = (): BookingFormData => {
    const serviceNames = selectedServices.map((service) => service.name);
    const primaryBarber = bookingData.barber || bookingData.teamMembers[0]?.name || '';
    const paymentSelection = sanitizeBookingPaymentSelection(
      bookingData.paymentMethods,
      bookingData.paymentAmounts
    );

    return {
      ...bookingData,
      customer: bookingData.customer.trim(),
      phone: bookingData.phone.trim(),
      email: bookingData.email.trim(),
      notes: bookingData.notes.trim(),
      barber: primaryBarber,
      services: serviceNames,
      paymentMethods: paymentSelection.paymentMethods as BookingFormData['paymentMethods'],
      paymentAmounts: paymentSelection.paymentAmounts,
      teamMembers: bookingData.teamMembers.length > 0
        ? bookingData.teamMembers
        : (primaryBarber ? [{ name: primaryBarber, tip: 0 }] : []),
    };
  };

  const validateCheckoutBookingData = (data: BookingFormData): string | null => {
    if (!data.customer || !data.date || !data.time) {
      return 'Please fill customer name, date, and time.';
    }

    if (selectedServices.length === 0) {
      return 'Please add at least one service to the booking cart.';
    }

    if (!data.barber) {
      return 'Please assign a staff member.';
    }

    return null;
  };

  const syncCheckoutToBookingStore = (data: BookingFormData) => {
    clearCart();

    selectedServices.forEach((service) => {
      addToCart({
        id: service.firebaseId || service.id,
        name: service.name,
        price: Number(service.price) || 0,
        duration: `${Number(service.duration) || 0} min`,
        description: service.description || '',
        category: service.category || '',
        rating: 0,
        reviews: 0,
        image: service.imageUrl || '',
      });
    });

    setCustomerName(data.customer);
    setCustomerEmail(data.email);
    setCustomerPhone(data.phone);
    setSpecialRequests(data.notes);
    setSelectedStaff(data.barber);
    setStoreSelectedDate(data.date);
    setStoreSelectedTime(data.time);
  };

  const handleCreateBooking = (barber: string, date: string, time: string) => {
    clearCart();

    // For branch admin, preserve the branch selection
    const adminBranchName = (user?.role === 'admin' && user?.branchName) ? user.branchName : '';
    const adminBranch = adminBranchName ? branches.find(b => b.name === adminBranchName) || null : null;

    setBookingData({
      customer: '',
      phone: '',
      email: '',
      service: '',
      services: [],
      barber: barber,
      teamMembers: [{name: barber, tip: 0}],
      date: date,
      time: time,
      notes: '',
      products: [],
      tax: taxRate,
      serviceCharges: 0,
      discount: 0,
      discountType: 'fixed',
      serviceTip: 0,
      paymentMethods: [],
      paymentAmounts: {
        cash: 0,
        card: 0,
        check: 0,
        digital: 0
      },
      status: 'pending',
      generateInvoice: false,
      cardLast4Digits: '',
      trnNumber: '',
      category: '',
      branch: adminBranchName
    });
    setSelectedServices([]);
    setSelectedCategory(null);
    setSelectedBranch(adminBranch);
    setServiceSearchTerm('');
    setShowServiceSuggestions(false);
    setShowBookingDialog(true);
  };

  const handleSubmitBooking = async () => {
    const checkoutBookingData = buildCheckoutBookingData();
    const validationError = validateCheckoutBookingData(checkoutBookingData);

    if (validationError) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: validationError,
      });
      return;
    }

    syncCheckoutToBookingStore(checkoutBookingData);

    const result = await createBookingInFirebase(checkoutBookingData, selectedServices, selectedCategory, selectedBranch, addNotification);
    
    if (result.success && result.booking) {
      setBookings(prev => [result.booking!, ...prev]);
      
      addNotification({
        type: 'success',
        title: 'Booking Created Successfully',
        message: `Appointment for ${checkoutBookingData.customer} has been saved with ${selectedServices.length} service(s).`,
      });

      setShowBookingDialog(false);
      clearCart();
      
      // For branch admin, preserve branch selection after submission
      const adminBranchName = (user?.role === 'admin' && user?.branchName) ? user.branchName : '';
      const adminBranch = adminBranchName ? branches.find(b => b.name === adminBranchName) || null : null;

      setBookingData({
        customer: '',
        phone: '',
        email: '',
        service: '',
        services: [],
        barber: '',
        teamMembers: [],
        date: '',
        time: '',
        notes: '',
        products: [],
        tax: taxRate,
        serviceCharges: 0,
        discount: 0,
        discountType: 'fixed',
        serviceTip: 0,
        paymentMethods: [],
        paymentAmounts: {
          cash: 0,
          card: 0,
          check: 0,
          digital: 0
        },
        status: 'pending',
        generateInvoice: false,
        cardLast4Digits: '',
        trnNumber: '',
        category: '',
        branch: adminBranchName
      });
      
      setSelectedServices([]);
      setSelectedCategory(null);
      setSelectedBranch(adminBranch);
      setServiceSearchTerm('');
      setShowServiceSuggestions(false);
    }
  };

  const handleAppointmentClick = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentDetails(true);
    
    if (appointment.firebaseId) {
      try {
        const bookingRef = doc(db, "bookings", appointment.firebaseId);
        const bookingSnap = await getDoc(bookingRef);
        
        if (bookingSnap.exists()) {
          const firebaseData = bookingSnap.data();
          
          setSelectedAppointment(prev => ({
            ...prev!,
            servicePrice: firebaseData.servicePrice || 0,
            subtotal: firebaseData.subtotal || 0,
            totalAmount: firebaseData.totalAmount || 0,
            price: firebaseData.totalAmount || firebaseData.servicePrice || 0
          }));
        }
      } catch (error) {
        console.error("Error fetching fresh data:", error);
      }
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      const booking = bookings.find(b => b.firebaseId === appointmentId);
      
      if (booking && booking.firebaseId) {
        const success = await updateBookingStatusInFirebase(booking.firebaseId, newStatus);
        
        if (success) {
          setBookings(prev => prev.map(b => 
            b.firebaseId === booking.firebaseId ? { ...b, status: newStatus } : b
          ));
          
          addNotification({
            type: 'success',
            title: 'Status Updated',
            message: `Appointment status changed to ${newStatus}`
          });
        } else {
          addNotification({
            type: 'error',
            title: 'Update Failed',
            message: 'Failed to update status in Firebase'
          });
        }
      } else {
        addNotification({
          type: 'success',
          title: 'Status Updated',
          message: `Appointment status changed to ${newStatus}`
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update appointment status'
      });
    }
  };

  const handleApproveBooking = async (bookingId: string) => {
    try {
      const booking = bookings.find(b => b.firebaseId === bookingId);
      
      if (booking && booking.firebaseId) {
        const success = await updateBookingStatusInFirebase(booking.firebaseId, 'approved');
        
        if (success) {
          setBookings(prev => prev.map(b => 
            b.firebaseId === bookingId ? { ...b, status: 'approved' } : b
          ));
          
          addNotification({
            type: 'success',
            title: 'Booking Approved',
            message: 'Appointment has been approved and confirmed in Firebase.'
          });
        } else {
          addNotification({
            type: 'error',
            title: 'Approval Failed',
            message: 'Failed to update booking status in Firebase'
          });
        }
      } else {
        addNotification({
          type: 'error',
          title: 'Booking Not Found',
          message: 'Could not find booking in Firebase'
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to approve booking'
      });
    }
  };

  const handleRejectBooking = async (bookingId: string) => {
    try {
      const booking = bookings.find(b => b.firebaseId === bookingId);
      
      if (booking && booking.firebaseId) {
        const success = await updateBookingStatusInFirebase(booking.firebaseId, 'rejected');
        
        if (success) {
          setBookings(prev => prev.map(b => 
            b.firebaseId === bookingId ? { ...b, status: 'rejected' } : b
          ));
          
          addNotification({
            type: 'error',
            title: 'Booking Rejected',
            message: 'Appointment has been rejected in Firebase.'
          });
        } else {
          addNotification({
            type: 'error',
            title: 'Rejection Failed',
            message: 'Failed to update booking status in Firebase'
          });
        }
      } else {
        addNotification({
          type: 'error',
          title: 'Booking Not Found',
          message: 'Could not find booking in Firebase'
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to reject booking'
      });
    }
  };

  const handleOrderStatusChange = async (orderId: string, newStatus: string): Promise<boolean> => {
    if (newStatus === 'pending' && !allowPendingOrders) {
      addNotification({
        type: 'warning',
        title: 'Not Allowed',
        message: 'Pending status is disabled in settings'
      });
      return false;
    }

    try {
      const order = productOrders.find(o => o.firebaseId === orderId);
      
      if (order && order.firebaseId) {
        const success = await updateProductOrderStatusInFirebase(order.firebaseId, newStatus);
        
        if (success) {
          setProductOrders(productOrders.map(order =>
            order.firebaseId === orderId ? { ...order, status: newStatus } : order
          ));

          const statusMessages: { [key: string]: string } = {
            pending: 'Order marked as pending in Firebase',
            upcoming: 'Order marked as upcoming in Firebase',
            approved: 'Order approved successfully in Firebase',
            completed: 'Order marked as completed in Firebase',
            delivered: 'Order marked as delivered in Firebase',
            rejected: 'Order rejected in Firebase'
          };

          addNotification({
            type: 'success',
            title: 'Status Updated',
            message: statusMessages[newStatus] || `Status changed to ${newStatus}`
          });
          return true;
        } else {
          addNotification({
            type: 'error',
            title: 'Update Failed',
            message: 'Failed to update order status in Firebase'
          });
          return false;
        }
      } else {
        addNotification({
          type: 'error',
          title: 'Order Not Found',
          message: 'Could not find order in Firebase'
        });
        return false;
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update order status'
      });
      return false;
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const order = productOrders.find(o => o.firebaseId === orderId);
      
      if (order && order.firebaseId) {
        const success = await deleteProductOrderInFirebase(order.firebaseId);
        
        if (success) {
          setProductOrders(productOrders.filter(order => order.firebaseId !== orderId));
          addNotification({
            type: 'success',
            title: 'Order Deleted',
            message: 'Product order has been removed from Firebase'
          });
        } else {
          addNotification({
            type: 'error',
            title: 'Delete Failed',
            message: 'Failed to delete order from Firebase'
          });
        }
      } else {
        addNotification({
          type: 'error',
          title: 'Order Not Found',
          message: 'Could not find order in Firebase'
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete order'
      });
    }
  };

  const handleReschedule = (appointmentId: string | number) => {
    const appointment = allAppointments.find(apt => apt.id === appointmentId);
    if (!appointment) return;

    setSelectedAppointment(appointment);
    setShowAppointmentDetails(true);
    addNotification({
      type: 'info',
      title: 'Reschedule Mode',
      message: 'Please select a new date and time for this appointment.'
    });
  };

  const pendingAppointments: Appointment[] = bookings
    .filter(booking => {
      if (user?.role === 'admin' && user?.branchName) {
        return (booking.status === 'pending' || booking.status === 'approved' || 
                booking.status === 'rejected' || booking.status === 'upcoming') &&
               booking.branch === user.branchName;
      }
      return booking.status === 'pending' || booking.status === 'approved' || 
             booking.status === 'rejected' || booking.status === 'upcoming';
    })
    .map((booking, index) => ({
      id: booking.firebaseId || `pending-${index}`,
      firebaseId: booking.firebaseId,
      customer: booking.customerName,
      service: Array.isArray(booking.services) && booking.services.length > 0 ? booking.services.join(', ') : 'Unknown Service',
      services: booking.services || [],
      barber: booking.staff,
      date: booking.bookingDate,
      time: booking.bookingTime,
      duration: booking.totalDuration ? `${booking.totalDuration} min` : '60 min',
      price: booking.totalPrice,
      servicePrice: booking.servicePrice || 0,
      status: booking.status,
      phone: booking.customerPhone,
      email: booking.customerEmail,
      notes: booking.notes || '',
      source: booking.createdBy === 'admin' ? 'admin_panel' : 'website',
      branch: booking.branch || 'All Branches',
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      cardLast4Digits: booking.cardLast4Digits || '',
      trnNumber: booking.trnNumber || '',
      teamMembers: booking.teamMembers || [],
      products: booking.products || [],
      paymentMethods: booking.paymentMethods || [],
      paymentAmounts: booking.paymentAmounts 
        ? { 
            cash: booking.paymentAmounts?.cash || 0, 
            card: booking.paymentAmounts?.card || 0, 
            check: booking.paymentAmounts?.check || 0, 
            digital: booking.paymentAmounts?.digital || 0,
            wallet: 0
          } 
        : { cash: 0, card: 0, check: 0, digital: 0, wallet: 0 },
      discount: booking.discount || 0,
      discountType: booking.discountType || 'fixed',
      serviceTip: booking.serviceTip || 0,
      serviceCharges: booking.serviceCharges || 0,
      tax: booking.tax || 5
    }));

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "closed": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "delivered": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "upcoming": return "bg-blue-100 text-blue-800 border-blue-200";
      case "in-progress": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "scheduled": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "approved": return "bg-purple-100 text-purple-800 border-purple-200";
      case "pending": return "bg-orange-100 text-orange-800 border-orange-200";
      case "cancelled": return "bg-red-100 text-red-800 border-red-200";
      case "rejected": return "bg-red-100 text-red-800 border-red-200";
      case "rescheduled": return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4" />;
      case "closed": return <CheckCircle className="w-4 h-4" />;
      case "delivered": return <Package className="w-4 h-4" />;
      case "upcoming": return <Calendar className="w-4 h-4" />;
      case "in-progress": return <Clock className="w-4 h-4" />;
      case "scheduled": return <Calendar className="w-4 h-4" />;
      case "approved": return <CheckCircle className="w-4 h-4" />;
      case "pending": return <Clock className="w-4 h-4" />;
      case "cancelled": return <XCircle className="w-4 h-4" />;
      case "rejected": return <XCircle className="w-4 h-4" />;
      case "rescheduled": return <RefreshCw className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getSourceIcon = (source: string) => {
    if (source === "mobile") return <Smartphone className="w-4 h-4" />;
    if (source === "admin_panel") return <User className="w-4 h-4" />;
    return <Globe className="w-4 h-4" />;
  };

  const getSourceColor = (source: string): string => {
    if (source === "mobile") return "text-blue-600";
    if (source === "admin_panel") return "text-purple-600";
    return "text-green-600";
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  const confirmedBookings = getConfirmedBookings();
  
  const additionalConvertedBookings: Appointment[] = confirmedBookings.map((booking: any, index: number) => ({
    id: index + 3000,
    customer: booking.customerName || 'Unknown Customer',
    service: Array.isArray(booking.services) 
      ? booking.services.map((s: any) => s.serviceName || 'Unknown Service').join(', ') 
      : 'Unknown Service',
    services: Array.isArray(booking.services) 
      ? booking.services.map((s: any) => s.serviceName || 'Unknown Service')
      : [booking.service || 'Unknown Service'],
    barber: booking.staffMember || 'Not Assigned',
    date: booking.date || new Date().toISOString().split('T')[0],
    time: booking.time || '10:00 AM',
    duration: Array.isArray(booking.services) 
      ? booking.services.reduce((sum: number, s: any) => {
          const durationStr = s.duration || '0';
          const durationNum = typeof durationStr === 'string' 
            ? parseInt(durationStr.split(' ')[0]) || 0 
            : Number(durationStr) || 0;
          return sum + durationNum;
        }, 0) + ' min'
      : '60 min',
    price: booking.totalPrice || 0,
    servicePrice: booking.totalPrice || 0,
    status: 'scheduled',
    phone: booking.customerPhone || '',
    email: booking.customerEmail || '',
    notes: booking.specialRequests || 'Booked via website',
    source: 'website',
    branch: 'All Branches',
    createdAt: booking.createdAt || new Date(),
    updatedAt: booking.createdAt || new Date(),
    cardLast4Digits: '',
    trnNumber: '',
    teamMembers: [],
    products: [],
    paymentMethods: [],
    paymentAmounts: { cash: 0, card: 0, check: 0, digital: 0, wallet: 0 },
    discount: 0,
    discountType: 'fixed',
    serviceTip: 0,
    serviceCharges: 0,
    tax: 0,
    pointsAwarded: false
  }));

  const finalAppointments = [...mockAppointments, ...convertedBookings, ...additionalConvertedBookings];
  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div className={cn(
          "h-screen overflow-y-auto shrink-0 sticky top-0 hidden lg:block",
          sidebarOpen ? "w-64" : "w-16"
        )}>
          <AdminSidebar
            role={user?.role === 'admin' ? 'branch_admin' : 'super_admin'}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            onLogout={handleLogout}
            allowedPages={user?.allowedPages || []}
          />
        </div>

        <div className="flex-1 flex flex-col min-h-0 overflow-auto">
          <header className="bg-white shadow-sm border-b shrink-0">
            <div className="flex items-center justify-between px-4 py-4 lg:px-8">
              <div className="flex items-center gap-4">
                <AdminMobileSidebar
                  role={user?.role === 'admin' ? 'branch_admin' : 'super_admin'}
                  onLogout={handleLogout}
                  isOpen={sidebarOpen}
                  onToggle={() => setSidebarOpen(!sidebarOpen)}
                  allowedPages={user?.allowedPages || []}
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Appointment Calendar</h1>
                  <p className="text-sm text-gray-600">
                    {user?.role === 'admin' 
                      ? `Managing appointments for ${user?.branchName || 'your branch'}`
                      : 'Manage all bookings from website and mobile'
                    }
                  </p>
                  {user?.role === 'admin' && user?.branchName && (
                    <p className="text-xs text-green-600 font-medium mt-1">
                      🏢 Branch: {user.branchName}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <CurrencySwitcher />
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="relative">
                      <Bell className="w-4 h-4" />
                      {unreadNotifications > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadNotifications}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Notifications</SheetTitle>
                      <SheetDescription>
                        Recent appointment updates and reminders
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
                      {notifications.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No notifications yet</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                              notification.read
                                ? 'bg-muted/50 border-muted'
                                : 'bg-background border-border'
                            }`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="shrink-0 mt-1">
                                {getIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-medium truncate">
                                    {notification.title}
                                  </h4>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {notification.message}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </SheetContent>
                </Sheet>

                <span className="text-sm text-gray-600 hidden sm:block">Welcome, {user?.email}</span>
                <Button variant="outline" onClick={handleLogout} className="hidden sm:flex">
                  Logout
                </Button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto min-h-0">
            <div className="h-full p-2 lg:p-3">
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'calendar' | 'advanced-calendar' | 'list' | 'approvals' | 'product-orders')}>
                <TabsContent value="calendar" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1 space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Filters</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="lg:hidden">
                            <MobileFriendlyCalendar
                              selectedDate={selectedDate}
                              onDateSelect={setSelectedDate}
                              appointments={filteredAppointments}
                            />
                          </div>
                          
                          <div>
                            <AppointmentSearchFilter
                              searchQuery={searchQuery}
                              setSearchQuery={setSearchQuery}
                              appointments={allAppointments}
                            />
                          </div>
                          
                          <div>
                            <StatusDropdownFilter
                              statusFilter={statusFilter}
                              setStatusFilter={setStatusFilter}
                              appointments={allAppointments}
                            />
                          </div>
                          
                          {user?.role !== 'admin' && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Filter by Branch</label>
                            <Select 
                              onValueChange={(value) => {}}
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue placeholder="All Branches" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Branches</SelectItem>
                                {branches.map(branch => (
                                  <SelectItem key={branch.id} value={branch.name}>
                                    {branch.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          )}
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Total Appointments:</span>
                              <span className="font-semibold">
                                {user?.role === 'admin' 
                                  ? bookings.filter(b => b.branch === user.branchName).length
                                  : allAppointments.length
                                }
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Filtered:</span>
                              <span className="font-semibold">{filteredAppointments.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Today's Appointments:</span>
                              <span className="font-semibold">
                                {allAppointments.filter(apt => 
                                  apt.date === new Date().toISOString().split('T')[0] &&
                                  (user?.role !== 'admin' || apt.branch === user.branchName)
                                ).length}
                              </span>
                            </div>
                            {user?.role === 'admin' && user?.branchName && (
                              <div className="flex items-center justify-between text-green-600">
                                <span className="text-gray-600">Your Branch:</span>
                                <span className="font-semibold">{user.branchName}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="lg:col-span-3 space-y-6">
                      <div className="hidden lg:block">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Calendar View</CardTitle>
                            <CardDescription>
                              {user?.role === 'admin' 
                                ? `Showing appointments for ${user.branchName}`
                                : 'Select a date to view appointments. Showing appointments from all sources.'
                              }
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <MobileFriendlyCalendar
                              selectedDate={selectedDate}
                              onDateSelect={setSelectedDate}
                              appointments={filteredAppointments}
                            />
                          </CardContent>
                        </Card>
                      </div>
                      
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <div>
                            <CardTitle>Appointments</CardTitle>
                            <CardDescription>
                              {selectedDate 
                                ? `Appointments for ${selectedDate.toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}`
                                : 'All appointments'}
                              {user?.role === 'admin' && user?.branchName && (
                                <span className="ml-2 text-green-600">
                                  • {user.branchName}
                                </span>
                              )}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedDate(undefined)}
                            >
                              Clear Date Filter
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedDate(new Date())}
                            >
                              Today
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {loading.bookings ? (
                            <div className="text-center py-12">
                              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                              <p className="text-gray-600">Loading appointments...</p>
                            </div>
                          ) : filteredAppointments.length === 0 ? (
                            <div className="text-center py-12">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-8 h-8 text-gray-400" />
                              </div>
                              <h3 className="text-lg font-semibold text-gray-600 mb-2">No appointments found</h3>
                              <p className="text-gray-500">
                                {searchQuery || statusFilter !== 'all' || selectedDate
                                  ? 'Try changing your filters or search query'
                                  : user?.role === 'admin'
                                  ? `No appointments scheduled yet for ${user.branchName}`
                                  : 'No appointments scheduled yet'}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {filteredAppointments.map((appointment) => (
                                <div
                                  key={appointment.id.toString()}
                                  className="p-4 border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer"
                                  onClick={() => handleAppointmentClick(appointment)}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        <div className={`w-3 h-3 rounded-full ${getStatusColor(appointment.status).split(' ')[0]}`}></div>
                                        <h3 className="font-semibold">{appointment.customer}</h3>
                                        <Badge className={getStatusColor(appointment.status)}>
                                          {appointment.status}
                                        </Badge>
                                        {user?.role !== 'admin' && appointment.branch && (
                                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                            <Building className="w-3 h-3 mr-1" />
                                            {appointment.branch}
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                                        <div className="flex items-center gap-1">
                                          <Scissors className="w-3 h-3" />
                                          {appointment.service}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <User className="w-3 h-3" />
                                          {appointment.barber}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {appointment.time} ({appointment.duration})
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-xs text-gray-500">{appointment.date}</div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="advanced-calendar" className="space-y-6">
                                <AdvancedCalendar
                                  appointments={finalAppointments as any}
                                  onAppointmentClick={(appointment: any) => {
                                    const fullAppointment = allAppointments.find(apt => apt.id === appointment.id);
                                    if (fullAppointment) {
                                      setSelectedAppointment(fullAppointment);
                                      setShowAppointmentDetails(true);
                                    }
                                  }}
                                  onStatusChange={(appointmentId, newStatus) => handleStatusChange(appointmentId.toString(), newStatus)}
                                  onCreateBooking={handleCreateBooking}
                                  onEditBooking={(appointment: any) => handleEditBookingFromCalendar(appointment)}
                                  onDeleteBooking={(appointment: any) => { void handleDeleteBookingFromCalendar(appointment); }}
                                  onCheckoutBooking={(appointment: any) => handleCheckoutFromCalendar(appointment)}
                                  onDownloadInvoiceBooking={(appointment: any) => { void handleDownloadInvoiceDirectFromCalendar(appointment); }}
                                  onCloseBooking={(appointment: any) => { void handleCloseBookingFromCalendar(appointment); }}
                                  staff={
                                    (user?.role === 'admin' && user?.branchName
                                      ? staffMembers.filter(s =>
                                          isStaffActive(s.status) &&
                                          staffBelongsToBranch(
                                            s,
                                            user.branchName,
                                            branches.find((b) => b.name === user.branchName)?.firebaseId
                                          )
                                        )
                                      : staffMembers.filter((s) => isStaffActive(s.status))
                                    ) as any
                                  }
                                  lockedBranch={user?.role === 'admin' ? user.branchName : undefined}
                                  paymentMethodAvailability={paymentMethodAvailability}
                                  calendarDisplaySettings={calendarDisplaySettings}
                                  showFullDetails={true}
                                />
                              </TabsContent>




                <TabsContent value="approvals" className="space-y-6">
                  <div className="space-y-4">
                    {loading.bookings ? (
                      <div className="text-center py-16 px-8">
                        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading bookings from Firebase...</p>
                      </div>
                    ) : pendingAppointments.length === 0 ? (
                      <div className="text-center py-16 px-8">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <CheckCircle className="w-10 h-10 text-green-500" />
                        </div>
                        <h3 className="text-2xl font-semibold text-gray-600 mb-3">All caught up!</h3>
                        <p className="text-gray-500 text-lg">
                          {user?.role === 'admin' 
                            ? `No pending approvals for ${user.branchName}`
                            : 'No pending approvals at the moment'
                          }
                        </p>
                      </div>
                    ) : (
                      pendingAppointments.map((appointment) => (
                        <Card key={appointment.id.toString()} className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-all">
                          <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                              <div className="md:col-span-3">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-10 h-10 bg-linear-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-primary" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm">{appointment.customer}</p>
                                    <p className="text-xs text-gray-600 truncate">{appointment.service}</p>
                                    {user?.role !== 'admin' && appointment.branch && (
                                      <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                        <Building className="w-3 h-3" />
                                        {appointment.branch}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="md:col-span-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="w-4 h-4 text-blue-600" />
                                  <div>
                                    <p className="font-medium text-gray-900">{appointment.date}</p>
                                    <p className="text-xs text-gray-600">{appointment.time}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="md:col-span-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <Clock className="w-4 h-4 text-green-600" />
                                  <span className="font-medium text-gray-900">{appointment.duration}</span>
                                </div>
                              </div>

                              <div className="md:col-span-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <DollarSign className="w-4 h-4 text-purple-600" />
                                  <span className="font-medium text-gray-900">{formatCurrency(appointment.price)}</span>
                                </div>
                              </div>

                              <div className="md:col-span-2">
                                <Badge className={`${getStatusColor(appointment.status)} border flex items-center justify-center gap-1 px-2 py-1 text-xs font-semibold w-full`}>
                                  {getStatusIcon(appointment.status)}
                                  <span className="capitalize">{appointment.status}</span>
                                </Badge>
                              </div>

                              <div className="md:col-span-3 flex gap-2 flex-wrap">
                                {appointment.status === 'pending' && appointment.firebaseId && (
                                  <>
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white flex-1 text-xs h-9 flex items-center justify-center gap-1"
                                      onClick={() => handleApproveBooking(appointment.firebaseId as string )}
                                    >
                                      <CheckCircle className="w-3 h-3" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="bg-blue-600 hover:bg-blue-700 text-white flex-1 text-xs h-9 flex items-center justify-center gap-1"
                                      onClick={() => handleStatusChange(appointment.firebaseId as string, 'upcoming')}
                                    >
                                      <Calendar className="w-3 h-3" />
                                      Mark Upcoming
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="bg-red-600 hover:bg-red-700 text-white flex-1 text-xs h-9 flex items-center justify-center gap-1"
                                      onClick={() => handleRejectBooking(appointment.firebaseId as string)}
                                    >
                                      <XCircle className="w-3 h-3" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                                
                                {appointment.status === 'upcoming' && appointment.firebaseId && (
                                  <div className="flex gap-1 w-full">
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white flex-1 text-xs h-9"
                                      onClick={() => handleStatusChange(appointment.firebaseId as string, 'completed')}
                                    >
                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                      Mark Complete
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="bg-red-600 hover:bg-red-700 text-white flex-1 text-xs h-9 flex items-center justify-center gap-1"
                                      onClick={() => handleRejectBooking(appointment.firebaseId as string)}
                                    >
                                      <XCircle className="w-3 h-3" />
                                      Reject
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      <Sheet open={showAppointmentDetails} onOpenChange={setShowAppointmentDetails}>
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
          <SheetHeader className="border-b pb-4 mb-6">
            <SheetTitle className="flex items-center gap-3 text-2xl">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              Appointment Details
            </SheetTitle>
            <SheetDescription>
              Complete booking information from Firebase
            </SheetDescription>
          </SheetHeader>

          {selectedAppointment && (
            <div className="space-y-6">
              <div className="p-6 bg-linear-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">Booking Status</h3>
                    <Badge className={`${getStatusColor(selectedAppointment.status)} mt-2 px-4 py-2 text-base`}>
                      {getStatusIcon(selectedAppointment.status)}
                      <span className="ml-2 capitalize">{selectedAppointment.status}</span>
                    </Badge>
                    {selectedAppointment.branch && (
                      <div className="mt-2 flex items-center gap-1 text-sm text-blue-700">
                        <Building className="w-4 h-4" />
                        <span>Branch: {selectedAppointment.branch}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-700">Booking Reference</p>
                    <p className="text-xl font-bold text-blue-900">
                      {selectedAppointment.bookingNumber || `BK-${selectedAppointment.id}`}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">ID: {selectedAppointment.firebaseId}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white border-2 border-gray-200 rounded-xl">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
                  <Scissors className="w-6 h-6 text-purple-600" />
                  Service Information
                </h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Scissors className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Service Name</p>
                          <p className="text-lg font-medium text-gray-900">
                            {selectedAppointment.service || "No service specified"}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-purple-500 text-white">Service</Badge>
                    </div>
                  </div>

                  <div className="p-4 bg-linear-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <DollarSign className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Service Price</p>
                          <p className="text-3xl font-bold text-green-700">
                            {formatCurrency(selectedAppointment.servicePrice || 0)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Direct from Firebase • Verified
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-green-500 text-white mb-2 px-3 py-1">Firebase Value</Badge>
                        <div className="text-sm text-green-700">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            <span>servicePrice: {selectedAppointment.servicePrice || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-linear-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Calculator className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Subtotal</p>
                          <p className="text-2xl font-bold text-blue-700">
                            {formatCurrency(selectedAppointment.subtotal || selectedAppointment.servicePrice || 0)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {selectedAppointment.subtotal ? "From Firebase subtotal field" : "Calculated from servicePrice"}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-blue-500 text-white">Subtotal</Badge>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Duration</p>
                          <p className="text-lg font-medium text-gray-900">
                            {selectedAppointment.duration || "60 min"}
                          </p>
                        </div>
                      </div>
                      <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-indigo-600" />
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Assigned Staff</p>
                          <p className="text-lg font-medium text-gray-900">{selectedAppointment.barber}</p>
                          {selectedAppointment.staffRole && (
                            <p className="text-sm text-indigo-600">{selectedAppointment.staffRole}</p>
                          )}
                        </div>
                      </div>
                      {selectedAppointment.staffId && (
                        <Badge className="bg-indigo-500 text-white">
                          ID: {selectedAppointment.staffId}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white border-2 border-gray-200 rounded-xl">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-indigo-600" />
                  Payment Details
                </h3>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Payment Status</p>
                          <p className="text-lg font-medium text-gray-900">
                            {selectedAppointment.paymentStatus || "Pending"}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                      <div>
                        <p className="text-sm font-semibold text-gray-700">Payment Method</p>
                        <p className="text-lg font-medium text-gray-900">
                          {selectedAppointment.paymentMethod || 'Cash'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {selectedAppointment.paymentAmounts && (
                    <div className="p-4 bg-linear-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                      <h4 className="font-bold text-gray-900 mb-3">Payment Distribution</h4>
                      <div className="space-y-3">
                        {Object.entries(selectedAppointment.paymentAmounts).map(([method, amount]) => {
                          if (amount > 0) {
                            return (
                              <div key={method} className="flex justify-between items-center p-3 bg-white rounded-lg border">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <CreditCard className="w-4 h-4 text-green-600" />
                                  </div>
                                  <span className="font-medium capitalize">{method}:</span>
                                </div>
                                <span className="font-bold text-green-700">{formatCurrency(amount)}</span>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  )}

                  <div className="p-5 bg-linear-to-r from-primary/10 to-secondary/10 border-2 border-primary/20 rounded-xl">
                    <h4 className="font-bold text-gray-900 mb-4 text-lg">Price Summary</h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2">
                        <div className="flex items-center gap-2">
                          <Scissors className="w-4 h-4 text-primary" />
                          <span className="font-medium">Service Price:</span>
                        </div>
                        <span className="font-bold text-primary">
                          {formatCurrency(selectedAppointment.servicePrice || 0)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-2">
                        <div className="flex items-center gap-2">
                          <Calculator className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">Subtotal:</span>
                        </div>
                        <span className="font-bold text-blue-700">
                          {formatCurrency(selectedAppointment.subtotal || selectedAppointment.servicePrice || 0)}
                        </span>
                      </div>

                      {selectedAppointment.taxAmount && selectedAppointment.taxAmount > 0 ? (
                        <div className="flex justify-between items-center py-2">
                          <div className="flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-red-600" />
                            <span className="font-medium">Tax ({selectedAppointment.tax || 0}%):</span>
                          </div>
                          <span className="font-bold text-red-700">
                            {formatCurrency(selectedAppointment.taxAmount)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center py-2">
                          <div className="flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-gray-600" />
                            <span className="font-medium text-gray-500">Tax:</span>
                          </div>
                          <span className="text-gray-500">No tax applied</span>
                        </div>
                      )}

                      {selectedAppointment.serviceCharges && selectedAppointment.serviceCharges > 0 && (
                        <div className="flex justify-between items-center py-2">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-purple-600" />
                            <span className="font-medium">Service Charges:</span>
                          </div>
                          <span className="font-bold text-purple-700">
                            {formatCurrency(selectedAppointment.serviceCharges)}
                          </span>
                        </div>
                      )}

                      <div className="border-t pt-4 mt-2">
                        <div className="flex justify-between items-center text-xl font-bold">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-primary" />
                            <span className="text-gray-900">Total Amount:</span>
                          </div>
                          <span className="text-2xl text-primary">
                            {formatCurrency(
                              selectedAppointment.totalAmount ||
                              selectedAppointment.price ||
                              selectedAppointment.servicePrice ||
                              0
                            )}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 text-right">
                          {selectedAppointment.totalAmount 
                            ? "From Firebase totalAmount field"
                            : selectedAppointment.price 
                            ? "From price field" 
                            : "From servicePrice field"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white border-2 border-gray-200 rounded-xl">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
                  <User className="w-6 h-6 text-green-600" />
                  Customer Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-2">Full Name</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <p className="text-lg font-medium text-gray-900">
                          {selectedAppointment.customer}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-2">Email Address</label>
                      <div className="p-3 bg-gray-50 rounded-lg border break-all">
                        <p className="text-lg font-medium text-gray-900">
                          {selectedAppointment.email || "Not provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-2">Phone Number</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <p className="text-lg font-medium text-gray-900">
                          {selectedAppointment.phone || "Not provided"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {selectedAppointment.cardLast4Digits && (
                        <div>
                          <label className="text-sm font-semibold text-gray-700 block mb-2">Card Last 4</label>
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-lg font-medium text-gray-900">
                              ****{selectedAppointment.cardLast4Digits}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {selectedAppointment.trnNumber && (
                        <div>
                          <label className="text-sm font-semibold text-gray-700 block mb-2">TRN Number</label>
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-lg font-medium text-gray-900">
                              {selectedAppointment.trnNumber}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white border-2 border-gray-200 rounded-xl">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-orange-600" />
                  Booking Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-2">Booking Date</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <p className="text-lg font-medium text-gray-900">{selectedAppointment.date}</p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-2">Booking Time</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <p className="text-lg font-medium text-gray-900">{selectedAppointment.time}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-2">Branch</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <p className="text-lg font-medium text-gray-900">
                          {selectedAppointment.branch || "Not specified"}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-2">Service Category</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <p className="text-lg font-medium text-gray-900">
                          {selectedAppointment.serviceCategory || "General"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {selectedAppointment.notes && (
                  <div className="mt-6">
                    <label className="text-sm font-semibold text-gray-700 block mb-2">Special Notes</label>
                    <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                      <p className="text-gray-800 italic">{selectedAppointment.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4 p-6 bg-gray-50 border-2 border-gray-200 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Quick Actions
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {selectedAppointment.status === 'completed' && (
                    <Button
                      variant="outline"
                      className="h-12 flex items-center justify-center gap-3 border-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                      onClick={() => handleGenerateInvoiceClick(selectedAppointment)}
                    >
                      <Receipt className="w-5 h-5" />
                      Generate Invoice
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <SheetContent className="w-[98vw] sm:max-w-6xl z-60 overflow-y-auto">
          <SheetHeader className="border-b pb-4 mb-6">
            <SheetTitle className="text-xl font-semibold">Create New Booking</SheetTitle>
            <SheetDescription className="text-base">
              Schedule a new appointment for a customer.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 pb-6">
            <div className="space-y-6 p-6 bg-gray-50/50 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Customer Information
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Customer Name *</label>
                  <div className="relative">
                    <Input
                      placeholder="Enter customer name"
                      value={bookingData.customer}
                      onChange={(e) => {
                        handleCustomerNameChange(e.target.value);
                        setShowCustomerSuggestions(true);
                      }}
                      onFocus={() => setShowCustomerSuggestions(true)}
                      onBlur={() => {
                        setTimeout(() => setShowCustomerSuggestions(false), 150);
                      }}
                      className="h-11"
                    />

                    {showCustomerSuggestions && customerSuggestions.length > 0 && (
                      <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border bg-white shadow-lg">
                        {customerSuggestions.map((customer) => (
                          <button
                            key={customer.id}
                            type="button"
                            className="w-full border-b px-3 py-2 text-left hover:bg-gray-50"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => applyCustomerSuggestion(customer)}
                          >
                            <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                            <p className="text-xs text-gray-500">
                              {customer.phone || 'No phone'}{customer.email ? ` | ${customer.email}` : ''}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <Input
                      placeholder="(555) 123-4567"
                      value={bookingData.phone}
                      onChange={(e) => setBookingData({...bookingData, phone: e.target.value})}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <Input
                      type="email"
                      placeholder="customer@email.com"
                      value={bookingData.email}
                      onChange={(e) => setBookingData({...bookingData, email: e.target.value})}
                      className="h-11"
                    />
                  </div>
                </div>

                {user?.role !== 'admin' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-500" />
                        Card Last 4 Digits
                      </label>
                      <Input
                        placeholder="1234"
                        value={bookingData.cardLast4Digits}
                        onChange={(e) => setBookingData({...bookingData, cardLast4Digits: e.target.value})}
                        className="h-11"
                        maxLength={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Hash className="w-4 h-4 text-gray-500" />
                        TRN Number
                      </label>
                      <Input
                        placeholder="Enter TRN number"
                        value={bookingData.trnNumber}
                        onChange={(e) => setBookingData({...bookingData, trnNumber: e.target.value})}
                        className="h-11"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {user?.role === 'admin' ? (
              <div className="space-y-6 p-6 bg-gray-50/50 rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Building className="w-5 h-5 text-primary" />
                  Branch
                </h3>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Branch (Auto-selected)</label>
                  <Input
                    value={bookingData.branch || user?.branchName || ''}
                    readOnly
                    disabled
                    className="h-11 bg-gray-100"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6 p-6 bg-gray-50/50 rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary" />
                  Category & Branch
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Category <span className="text-xs font-normal text-gray-400">(optional - filters services)</span>
                    </label>
                    <Select 
                      value={bookingData.category} 
                      onValueChange={handleCategoryChange}
                      disabled={!bookingData.branch}
                    >
                      <SelectTrigger className="h-11 w-full [&>span]:block [&>span]:truncate">
                        <SelectValue placeholder={bookingData.branch ? "Select a category" : "First select a branch"} />
                      </SelectTrigger>
                      <SelectContent>
                        {loading.categories ? (
                          <div className="text-center py-4">
                            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                            <p className="text-sm text-gray-600">Loading categories...</p>
                          </div>
                        ) : filteredCategories.length === 0 && bookingData.branch ? (
                          <div className="text-center py-4">
                            <AlertCircle className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                            <div className="space-y-1">
                              <p className="text-sm text-gray-600">No categories found for <strong>{bookingData.branch}</strong></p>
                              <p className="text-xs text-gray-500">
                                Total categories in system: {categories.filter(c => c.isActive && c.type === 'service').length}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <SelectItem value="__all__">
                              <span className="font-medium">All Categories</span>
                            </SelectItem>
                            {filteredCategories.map((category) => (
                              <SelectItem key={category.firebaseId} value={category.name}>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-medium truncate">{category.name}</span>
                                  <span className="text-xs text-gray-500">
                                    {category.branchNames && category.branchNames.length > 0 
                                      ? category.branchNames.join(', ') 
                                      : category.branchName || 'Global'}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Branch
                    </label>
                    <Select 
                      value={bookingData.branch} 
                      onValueChange={handleBranchChange}
                    >
                      <SelectTrigger className="h-11 w-full [&>span]:block [&>span]:truncate">
                        <SelectValue placeholder="Select a branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {loading.branches ? (
                          <div className="text-center py-4">
                            <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                            <p className="text-sm text-gray-600">Loading branches...</p>
                          </div>
                        ) : branches.length === 0 ? (
                          <div className="text-center py-4">
                            <AlertCircle className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">No branches available</p>
                          </div>
                        ) : (
                          branches
                            .filter(branch => branch.status === 'active')
                            .map((branch) => (
                              <SelectItem key={branch.firebaseId} value={branch.name}>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-medium truncate">{branch.name}</span>
                                  <span className="text-xs text-gray-500 truncate">{branch.city} • {branch.phone}</span>
                                </div>
                              </SelectItem>
                            ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6 p-6 bg-gray-50/50 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Scissors className="w-5 h-5 text-primary" />
                Select Services (Choose Multiple)
                {selectedServices.length > 0 && (
                  <Badge className="bg-green-500 text-white ml-2">
                    {selectedServices.length} Selected
                  </Badge>
                )}
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Search & Add Services
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      value={serviceSearchTerm}
                      onChange={(e) => {
                        setServiceSearchTerm(e.target.value);
                        setShowServiceSuggestions(true);
                      }}
                      onFocus={() => setShowServiceSuggestions(true)}
                      onBlur={() => {
                        setTimeout(() => setShowServiceSuggestions(false), 150);
                      }}
                      placeholder={bookingData.branch ? "Search service by name, category, price..." : "First select a branch"}
                      disabled={!bookingData.branch || loading.services}
                      className="pl-9 h-11"
                    />

                    {showServiceSuggestions && bookingData.branch && serviceSuggestions.length > 0 && (
                      <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-white shadow-lg">
                        {serviceSuggestions.map((service) => (
                          <button
                            key={service.firebaseId}
                            type="button"
                            className="w-full border-b px-3 py-2 text-left hover:bg-gray-50"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => applyServiceSuggestion(service)}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-gray-900">{service.name}</p>
                                <p className="text-xs text-gray-500">
                                  {service.category || 'Service'} • {service.duration || 0} min
                                </p>
                              </div>
                              <span className="shrink-0 text-sm font-medium text-primary">
                                {formatCurrency(service.price)}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Type service name and click a suggestion to add it. Use remove on selected cards to delete a service.
                  </p>
                  {!loading.services && bookingData.branch && serviceSearchTerm.trim() && serviceSuggestions.length === 0 && (
                    <p className="text-xs text-amber-600">No matching services found for "{serviceSearchTerm}".</p>
                  )}
                </div>
                
                {selectedServices.length > 0 ? (
                  <div className="mt-4 p-5 bg-linear-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                    <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Selected Services Summary
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        {selectedServices.length} service(s)
                      </span>
                    </h4>
                    
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                      {selectedServices.map((service, index) => (
                        <div 
                          key={service.id} 
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-100"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="font-bold text-green-700">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{service.name}</p>
                              <p className="text-xs text-gray-500">{service.category} • {service.duration} min</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-gray-900">{formatCurrency(service.price)}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleServiceSelection(service.name)}
                              className="h-7 w-7 p-0 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-4 mt-4 border-t border-green-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-green-800 mb-1">Total Duration:</p>
                          <p className="text-lg font-bold text-green-900">
                            {selectedServices.reduce((sum, s) => sum + s.duration, 0)} minutes
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-green-800 mb-1">Total Services Price:</p>
                          <p className="text-2xl font-bold text-green-700">
                            {formatCurrency(selectedServices.reduce((sum, s) => sum + s.price, 0))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                    <Scissors className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No services selected yet</p>
                    <p className="text-xs text-gray-500">Select services from dropdown above</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6 p-6 bg-gray-50/50 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Service Staff
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Primary Team Member *</label>
                  <Select 
                    value={bookingData.barber} 
                    onValueChange={(value) => {
                      setBookingData({...bookingData, barber: value});
                      if (!bookingData.teamMembers.some(tm => tm.name === value)) {
                        setBookingData(prev => ({
                          ...prev,
                          teamMembers: [...prev.teamMembers, {name: value, tip: 0}]
                        }));
                      }
                    }}
                    disabled={!bookingData.branch}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={bookingData.branch ? "Select a team member" : "First select a branch"} />
                    </SelectTrigger>
                    <SelectContent>
                      {loading.staff ? (
                        <div className="text-center py-4">
                          <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600">Loading team members...</p>
                        </div>
                      ) : filteredStaff.length === 0 && bookingData.branch ? (
                        <div className="text-center py-4">
                          <AlertCircle className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600">No team members found for <strong>{bookingData.branch}</strong></p>
                            <p className="text-xs text-gray-500">
                              Total active staff: {staffMembers.filter(s => s.status === 'active').length}
                            </p>
                          </div>
                        </div>
                      ) : (
                        filteredStaff.map(staff => (
                          <SelectItem key={staff.id} value={staff.name}>
                            <div className="flex flex-col">
                              <span className="font-medium">{staff.name}</span>
                              <span className="text-xs text-gray-500">{staff.role} • ⭐ {staff.rating.toFixed(1)}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Additional Team Members</label>
                  <Select 
                    onValueChange={(value) => {
                      if (value && !bookingData.teamMembers.some(tm => tm.name === value)) {
                        setBookingData(prev => ({
                          ...prev,
                          teamMembers: [...prev.teamMembers, {name: value, tip: 0}]
                        }));
                      }
                    }}
                    disabled={!bookingData.branch}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder={bookingData.branch ? "Add more team members" : "First select a branch"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredStaff
                        .filter(staff => {
                          const alreadySelected = bookingData.teamMembers.some(tm => tm.name === staff.name);
                          return !alreadySelected;
                        })
                        .map(staff => (
                          <SelectItem key={staff.id} value={staff.name}>
                            <div className="flex flex-col">
                              <span className="font-medium">{staff.name}</span>
                              <span className="text-xs text-gray-500">{staff.role} • ⭐ {staff.rating.toFixed(1)}</span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {bookingData.teamMembers.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Team Members & Their Tips</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {bookingData.teamMembers.map((member, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-white rounded border">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="flex-1 text-sm font-medium">{member.name}</span>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-gray-600">Tip:</label>
                            <Input
                              type="number"
                              min="0"
                              step="0.1"
                              value={member.tip}
                              onChange={(e) => {
                                const newMembers = [...bookingData.teamMembers];
                                newMembers[index].tip = parseFloat(e.target.value) || 0;
                                setBookingData({...bookingData, teamMembers: newMembers});
                              }}
                              placeholder="AED 0.00"
                              className="h-9 w-24 text-right"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setBookingData(prev => ({
                                ...prev,
                                teamMembers: prev.teamMembers.filter((_, i) => i !== index),
                                barber: index === 0 && prev.teamMembers.length > 1 ? prev.teamMembers[1].name : prev.barber
                              }));
                            }}
                          >
                            <XCircle className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6 p-6 bg-gray-50/50 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Products
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Product</label>
                    <Select onValueChange={(value) => {
                      const product = mockProducts.find(p => p.name === value);
                      if (product) {
                        setBookingData(prev => ({
                          ...prev,
                          products: [...prev.products, { ...product, quantity: 1 }]
                        }));
                      }
                    }}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Add product" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockProducts.map((product) => (
                          <SelectItem key={product.name} value={product.name}>
                            {product.name} - {product.category} - {formatCurrency(product.price)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Quantity</label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="1"
                      className="h-11"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>

                {bookingData.products.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Selected Products</label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {bookingData.products.map((product, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{product.name}</div>
                            <div className="text-xs text-gray-500">{product.category}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{formatCurrency(product.price)}</span>
                            <span className="text-sm text-gray-500">x{product.quantity}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setBookingData(prev => ({
                                  ...prev,
                                  products: prev.products.filter((_, i) => i !== index)
                                }));
                              }}
                            >
                              <XCircle className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>



              <div className="mt-6 p-5 bg-white rounded-xl border-2 border-blue-200 shadow-sm">
                <h4 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  Price Summary (Including {selectedServices.length} Service(s))
                </h4>
                
                <div className="space-y-3">
                  {selectedServices.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Services:</p>
                      <div className="space-y-2 pl-4">
                        {selectedServices.map((service, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                              <span className="text-gray-600">{service.name}</span>
                            </div>
                            <span className="font-medium">{formatCurrency(service.price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700">Total Services:</span>
                    <span className="font-medium">{formatCurrency(selectedServices.reduce((sum, s) => sum + s.price, 0))}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700">Products:</span>
                    <span className="font-medium">{formatCurrency(bookingData.products.reduce((sum, p) => sum + (p.price * p.quantity), 0))}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700">Service Charges:</span>
                    <span className="font-medium">{formatCurrency(bookingData.serviceCharges)}</span>
                  </div>
                  
                  {bookingData.discount > 0 && (
                    <div className="flex justify-between items-center py-2 bg-green-50 rounded px-2">
                      <span className="text-green-700">Discount ({bookingData.discountType === 'percentage' ? bookingData.discount + '%' : 'Fixed'}):</span>
                      <span className="font-medium text-green-700">
                        -{formatCurrency(
                          bookingData.discountType === 'percentage'
                            ? (selectedServices.reduce((sum, s) => sum + s.price, 0) + bookingData.products.reduce((sum, p) => sum + (p.price * p.quantity), 0)) * (bookingData.discount / 100)
                            : bookingData.discount
                        )}
                      </span>
                    </div>
                  )}

                  {(bookingData.serviceTip > 0 || bookingData.teamMembers.some(tm => tm.tip > 0)) && (
                    <div className="flex justify-between items-center py-2 bg-blue-50 rounded px-2">
                      <span className="text-blue-700">Tips (Service + Team):</span>
                      <span className="font-medium text-blue-700">{formatCurrency(bookingData.serviceTip + bookingData.teamMembers.reduce((sum, tm) => sum + tm.tip, 0))}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-700">Tax ({bookingData.tax}%):</span>
                    <span className="font-medium">{formatCurrency(bookingTaxAmount)}</span>
                  </div>

                  {totalValueDisplayMode === 'both' && (
                    <>
                      <div className="flex justify-between items-center py-2 bg-gray-50 rounded px-2">
                        <span className="text-gray-700">Total (Excluding Tax):</span>
                        <span className="font-semibold">{formatCurrency(bookingTotalWithoutTax)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 bg-green-50 rounded px-2">
                        <span className="text-green-700">Total (With Tax):</span>
                        <span className="font-semibold text-green-700">{formatCurrency(bookingTotalWithTax)}</span>
                      </div>
                    </>
                  )}
                  
                  <div className="border-t pt-3 mt-2">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span className="text-gray-900">
                        {totalValueDisplayMode === 'without-tax' ? 'Total Amount (Excluding Tax):' : 'Total Amount (With Tax):'}
                      </span>
                      <span className="text-green-600 text-xl">
                        {formatCurrency(totalValueDisplayMode === 'without-tax' ? bookingTotalWithoutTax : bookingTotalWithTax)}
                      </span>
                    </div>
                    
                    {bookingData.paymentMethods.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-sm font-medium text-gray-600 mb-2">Payment Distribution:</div>
                        <div className="flex flex-wrap gap-2">
                          {bookingData.paymentMethods.map(method => {
                            const amount = Number(bookingData.paymentAmounts[method] || 0);
                            return amount > 0 ? (
                              <div key={method} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                <span className="capitalize">{method}:</span>
                                <span className="font-bold">{formatCurrency(amount)}</span>
                              </div>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            <div className="space-y-6 p-6 bg-gray-50/50 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                Booking Status
              </h3>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Select value={bookingData.status} onValueChange={(value) => setBookingData(prev => ({
                  ...prev,
                  status: value,
                  generateInvoice: value === 'completed' ? prev.generateInvoice : false
                }))}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rescheduled">Rescheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-6 p-6 bg-gray-50/50 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Date & Time
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Date *</label>
                  <Input
                    type="date"
                    value={bookingData.date}
                    onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Time *</label>
                  <Input
                    type="time"
                    value={bookingData.time}
                    onChange={(e) => setBookingData({...bookingData, time: e.target.value})}
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6 p-6 bg-gray-50/50 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                Invoice Options
              </h3>

              <div className="space-y-4">
                {bookingData.status === 'completed' ? (
                  <>
                    <div className="flex items-center justify-between">
                      <label htmlFor="generateInvoice" className="text-sm font-medium text-gray-700">
                        Generate invoice automatically after booking
                      </label>
                      <Switch
                        id="generateInvoice"
                        checked={bookingData.generateInvoice}
                        onCheckedChange={(checked) => setBookingData({...bookingData, generateInvoice: checked})}
                      />
                    </div>

                    {bookingData.generateInvoice && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-800">
                          <Receipt className="w-4 h-4" />
                          <span className="text-sm font-medium">Invoice will be generated with:</span>
                        </div>
                        <ul className="mt-2 text-sm text-blue-700 space-y-1">
                          <li>• Customer details and booking information</li>
                          <li>• Itemized services and products</li>
                          <li>• Tax calculation and total amount</li>
                          <li>• Payment terms and due date</li>
                          <li>• All selected services ({selectedServices.length})</li>
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Invoice generation is only available for completed services</span>
                    </div>
                    <p className="mt-2 text-sm text-yellow-700">
                      Set the booking status to "Completed" to enable invoice generation options.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6 p-6 bg-gray-50/50 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Additional Notes
              </h3>

              <div className="space-y-2">
                <Textarea
                  placeholder="Any special requests or notes..."
                  value={bookingData.notes}
                  onChange={(e) => setBookingData({...bookingData, notes: e.target.value})}
                  className="min-h-[100px] resize-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-8 border-t bg-white px-6 py-4 -mx-6 -mb-6">
            <Button variant="outline" onClick={() => setShowBookingDialog(false)} className="px-6 h-11">
              Cancel
            </Button>
            <Button onClick={handleSubmitBooking} className="px-6 h-11 bg-primary hover:bg-primary/90">
              Create Booking
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showEditDialog} onOpenChange={setShowEditDialog}>
        <SheetContent className="sm:max-w-[900px] w-full z-70 flex h-full flex-col overflow-hidden">
          <SheetHeader className="border-b pb-4 mb-6 shrink-0">
            <SheetTitle className="text-xl font-semibold flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Edit Appointment
              {editingAppointment && (
                <Badge className="bg-blue-500 text-white ml-2">
                  {editingAppointment.customer}
                </Badge>
              )}
            </SheetTitle>
            <SheetDescription className="text-base">
              Update appointment details and save changes.
            </SheetDescription>
          </SheetHeader>

          {editBookingData && (
            <div className="flex-1 space-y-6 overflow-y-auto pb-6 pr-2">
              <div className="space-y-6 p-6 bg-gray-50/50 rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Customer Information
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Customer Name *</label>
                    <Input
                      placeholder="Enter customer name"
                      value={editBookingData.customer}
                      onChange={(e) => setEditBookingData({...editBookingData, customer: e.target.value})}
                      className="h-11"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Phone</label>
                      <Input
                        placeholder="(555) 123-4567"
                        value={editBookingData.phone}
                        onChange={(e) => setEditBookingData({...editBookingData, phone: e.target.value})}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <Input
                        type="email"
                        placeholder="customer@email.com"
                        value={editBookingData.email}
                        onChange={(e) => setEditBookingData({...editBookingData, email: e.target.value})}
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-500" />
                        Card Last 4 Digits
                      </label>
                      <Input
                        placeholder="1234"
                        value={editBookingData.cardLast4Digits}
                        onChange={(e) => setEditBookingData({...editBookingData, cardLast4Digits: e.target.value})}
                        className="h-11"
                        maxLength={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Hash className="w-4 h-4 text-gray-500" />
                        TRN Number
                      </label>
                      <Input
                        placeholder="Enter TRN number"
                        value={editBookingData.trnNumber}
                        onChange={(e) => setEditBookingData({...editBookingData, trnNumber: e.target.value})}
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-6 bg-gray-50/50 rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary" />
                  Category & Branch
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Category
                    </label>
                    <Select 
                      value={editBookingData.category} 
                      onValueChange={(value) => {
                        const category = categories.find(c => c.name === value);
                        setSelectedCategory(category || null);
                        setEditBookingData({...editBookingData, category: value});
                      }}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories
                          .filter(c => c.isActive && c.type === 'service')
                          .map((category) => (
                            <SelectItem key={category.firebaseId} value={category.name}>
                              <div className="flex flex-col">
                                <span className="font-medium">{category.name}</span>
                                <span className="text-xs text-gray-500">
                                  {category.branchName || 'No branch'}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Branch
                    </label>
                    {user?.role === 'admin' && user?.branchName ? (
                      <div className="h-11 px-3 flex items-center border rounded-md bg-gray-50 text-sm font-medium text-gray-700">
                        🏢 {user.branchName}
                      </div>
                    ) : (
                    <Select 
                      value={editBookingData.branch} 
                      onValueChange={(value) => {
                        const branch = branches.find(b => b.name === value);
                        setSelectedBranch(branch || null);
                        setEditBookingData({...editBookingData, branch: value});
                      }}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select a branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches
                          .filter(branch => branch.status === 'active')
                          .map((branch) => (
                            <SelectItem key={branch.firebaseId} value={branch.name}>
                              <div className="flex flex-col">
                                <span className="font-medium">{branch.name}</span>
                                <span className="text-xs text-gray-500">{branch.city}</span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-6 bg-gray-50/50 rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-primary" />
                  Services
                  <Badge className="bg-blue-500 text-white">
                    {editSelectedServices.length} selected
                  </Badge>
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services
                      .filter(service => service.status === 'active')
                      .map((service) => {
                        const isSelected = editSelectedServices.some(s => s.name === service.name);
                        return (
                          <div
                            key={service.firebaseId}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                              isSelected 
                                ? 'bg-blue-50 border-blue-300 shadow-sm' 
                                : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/50'
                            }`}
                            onClick={() => {
                              if (isSelected) {
                                setEditSelectedServices(prev => prev.filter(s => s.name !== service.name));
                                setEditBookingData(prev => ({
                                  ...prev!,
                                  services: prev!.services.filter(s => s !== service.name),
                                  service: prev!.services.length > 1 ? prev!.services[0] : ''
                                }));
                              } else {
                                setEditSelectedServices(prev => [...prev, service]);
                                setEditBookingData(prev => ({
                                  ...prev!,
                                  services: [...prev!.services, service.name],
                                  service: prev!.services.length === 0 ? service.name : prev!.service
                                }));
                              }
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium text-gray-900">{service.name}</h4>
                                  {isSelected && (
                                    <Badge className="bg-green-500 text-white text-xs px-2 py-0.5">
                                      ✓ Selected
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center justify-between text-xs text-gray-500">
                                  <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {service.duration} min
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Tag className="w-3 h-3" />
                                      {service.category}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-primary text-base">
                                      {formatCurrency(service.price)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-6 bg-gray-50/50 rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Service Staff
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Primary Team Member *</label>
                    <Select 
                      value={editBookingData.barber} 
                      onValueChange={(value) => {
                        setEditBookingData({...editBookingData, barber: value});
                        if (!editBookingData.teamMembers.some(tm => tm.name === value)) {
                          setEditBookingData(prev => ({
                            ...prev!,
                            teamMembers: [...prev!.teamMembers, {name: value, tip: 0}]
                          }));
                        }
                      }}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select a team member" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffMembers
                          .filter(staff => staff.status === 'active')
                          .map(staff => (
                            <SelectItem key={staff.id} value={staff.name}>
                              <div className="flex flex-col">
                                <span className="font-medium">{staff.name}</span>
                                <span className="text-xs text-gray-500">{staff.role}</span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {editBookingData.teamMembers.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Team Members & Tips</label>
                      <div className="space-y-2">
                        {editBookingData.teamMembers.map((member, index) => (
                          <div key={index} className="flex items-center gap-2 p-3 bg-white rounded border">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="flex-1 text-sm font-medium">{member.name}</span>
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-600">Tip:</label>
                              <Input
                                type="number"
                                min="0"
                                step="0.1"
                                value={member.tip}
                                onChange={(e) => {
                                  const newMembers = [...editBookingData.teamMembers];
                                  newMembers[index].tip = parseFloat(e.target.value) || 0;
                                  setEditBookingData({...editBookingData, teamMembers: newMembers});
                                }}
                                placeholder="AED 0.00"
                                className="h-9 w-24 text-right"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newMembers = editBookingData.teamMembers.filter((_, i) => i !== index);
                                setEditBookingData({
                                  ...editBookingData,
                                  teamMembers: newMembers,
                                  barber: index === 0 && newMembers.length > 0 ? newMembers[0].name : editBookingData.barber
                                });
                              }}
                            >
                              <XCircle className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6 p-6 bg-gray-50/50 rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Products
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Product</label>
                      <Select onValueChange={(value) => {
                        const product = mockProducts.find(p => p.name === value);
                        if (product) {
                          setEditBookingData(prev => ({
                            ...prev!,
                            products: [...prev!.products, { ...product, quantity: 1 }]
                          }));
                        }
                      }}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Add product" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockProducts.map((product) => (
                            <SelectItem key={product.name} value={product.name}>
                              {product.name} - {formatCurrency(product.price)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {editBookingData.products.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Selected Products</label>
                      <div className="space-y-2">
                        {editBookingData.products.map((product, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{product.name}</div>
                              <div className="text-xs text-gray-500">{product.category}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="1"
                                value={product.quantity}
                                onChange={(e) => {
                                  const newProducts = [...editBookingData.products];
                                  newProducts[index].quantity = parseInt(e.target.value) || 1;
                                  setEditBookingData({...editBookingData, products: newProducts});
                                }}
                                className="h-8 w-16"
                              />
                              <span className="text-sm font-medium">{formatCurrency(product.price)}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditBookingData({
                                    ...editBookingData,
                                    products: editBookingData.products.filter((_, i) => i !== index)
                                  });
                                }}
                              >
                                <XCircle className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {user?.role !== 'admin' && (
                <div className="space-y-6 p-6 bg-gray-50/50 rounded-lg border">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Pricing & Charges
                  </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Discount Amount</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={editBookingData.discount}
                        onChange={(e) => setEditBookingData({...editBookingData, discount: parseFloat(e.target.value) || 0})}
                        placeholder="0.00"
                        className="h-11 flex-1"
                      />
                      <Select value={editBookingData.discountType} onValueChange={(value) => setEditBookingData({...editBookingData, discountType: value as 'fixed' | 'percentage'})}>
                        <SelectTrigger className="h-11 w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">$ Fixed</SelectItem>
                          <SelectItem value="percentage">% Percent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Service Tips ($)</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={editBookingData.serviceTip}
                      onChange={(e) => setEditBookingData({...editBookingData, serviceTip: parseFloat(e.target.value) || 0})}
                      placeholder="0.00"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Tax (%)</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={editBookingData.tax}
                      onChange={(e) => setEditBookingData({...editBookingData, tax: parseFloat(e.target.value) || 0})}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Service Charges ($)</label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={editBookingData.serviceCharges}
                      onChange={(e) => setEditBookingData({...editBookingData, serviceCharges: parseFloat(e.target.value) || 0})}
                      className="h-11"
                    />
                  </div>
                </div>

                  <div className="space-y-4 mt-6">
                  <label className="text-sm font-medium text-gray-700">Payment Methods</label>
                  <div className="grid grid-cols-2 gap-4">
                    {availableBookingPaymentMethods.map((method) => {
                      const isSelected = editBookingData.paymentMethods.includes(method as any);
                      return (
                        <div key={method} className="space-y-2">
                          <div 
                            className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-blue-50 border-blue-300' : 'border-gray-200 hover:bg-gray-50'}`}
                            onClick={() => {
                              const newMethods = isSelected 
                                ? editBookingData.paymentMethods.filter(m => m !== method)
                                : [...editBookingData.paymentMethods, method as any];
                              const nextPaymentSelection = sanitizeBookingPaymentSelection(
                                newMethods,
                                editBookingData.paymentAmounts
                              );
                              setEditBookingData({
                                ...editBookingData,
                                paymentMethods: nextPaymentSelection.paymentMethods as BookingFormData['paymentMethods'],
                                paymentAmounts: nextPaymentSelection.paymentAmounts,
                              });
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-4 h-4 text-blue-600"
                            />
                            <label className="text-sm font-medium cursor-pointer capitalize flex-1">
                              {method}
                            </label>
                          </div>
                          {isSelected && (
                            <div className="pl-2">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder={`Amount in ${method}`}
                                value={editBookingData.paymentAmounts[method as 'cash' | 'card' | 'check' | 'digital'] || ''}
                                onChange={(e) => {
                                  const newAmounts = {...editBookingData.paymentAmounts};
                                  newAmounts[method as 'cash' | 'card' | 'check' | 'digital'] = parseFloat(e.target.value) || 0;
                                  const nextPaymentSelection = sanitizeBookingPaymentSelection(
                                    editBookingData.paymentMethods,
                                    newAmounts
                                  );
                                  setEditBookingData({
                                    ...editBookingData,
                                    paymentMethods: nextPaymentSelection.paymentMethods as BookingFormData['paymentMethods'],
                                    paymentAmounts: nextPaymentSelection.paymentAmounts,
                                  });
                                }}
                                className="h-9 text-sm"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              )}

              <div className="space-y-6 p-6 bg-gray-50/50 rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Date & Time
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Date *</label>
                    <Input
                      type="date"
                      value={editBookingData.date}
                      onChange={(e) => setEditBookingData({...editBookingData, date: e.target.value})}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Time *</label>
                    <Input
                      type="time"
                      value={editBookingData.time}
                      onChange={(e) => setEditBookingData({...editBookingData, time: e.target.value})}
                      className="h-11"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-6 bg-gray-50/50 rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  Booking Status
                </h3>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Select value={editBookingData.status} onValueChange={(value) => setEditBookingData({...editBookingData, status: value})}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-6 p-6 bg-gray-50/50 rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Additional Notes
                </h3>

                <div className="space-y-2">
                  <Textarea
                    placeholder="Any special requests or notes..."
                    value={editBookingData.notes}
                    onChange={(e) => setEditBookingData({...editBookingData, notes: e.target.value})}
                    className="min-h-[100px] resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-8 border-t bg-white px-6 py-4 -mx-6 -mb-6">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="px-6 h-11">
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} className="px-6 h-11 bg-primary hover:bg-primary/90">
              <CheckCircle className="w-4 h-4 mr-2" />
              Update Appointment
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto">
          <SheetHeader className="border-b pb-4 mb-6">
            <SheetTitle className="text-2xl font-bold flex items-center gap-3">
              <Receipt className="w-6 h-6 text-primary" />
              Generate Invoice
              {invoiceData && (
                <Badge className="ml-2 bg-primary text-white">#{invoiceData.invoiceNumber}</Badge>
              )}
            </SheetTitle>
            <SheetDescription className="text-base">
              Edit invoice details and download as PDF - All fields will appear in PDF
            </SheetDescription>
          </SheetHeader>

          {invoiceData && selectedAppointmentForInvoice && (
            <div className="space-y-6">
              <div className="bg-linear-to-r from-primary/5 to-secondary/5 p-6 rounded-lg border">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Invoice Preview</h3>
                    <p className="text-sm text-gray-600">All fields will be included in PDF</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Invoice #</p>
                    <p className="font-bold text-lg">{invoiceData.invoiceNumber}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                <div className="space-y-4 p-4 bg-white border rounded-lg">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-primary" />
                    Services ({invoiceData.services ? invoiceData.services.length : 1})
                  </h4>
                  
                  <div className="space-y-3">
                    {invoiceData.services && Array.isArray(invoiceData.services) ? (
                      invoiceData.services.map((service, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="font-bold text-primary">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <Input
                              value={service}
                              onChange={(e) => {
                                const newServices = [...invoiceData.services!];
                                newServices[index] = e.target.value;
                                handleInvoiceDataChange('services', newServices);
                              }}
                              className="h-9"
                            />
                          </div>
                          <div className="w-32">
                            <Input
                              type="number"
                              value={
                                invoiceData.services && invoiceData.services.length > 0
                                  ? invoiceData.price / invoiceData.services.length
                                  : invoiceData.price
                              }
                              onChange={(e) => {
                                const newItems = [...(invoiceData.items || [])];
                                if (newItems[index]) {
                                  newItems[index].price = parseFloat(e.target.value) || 0;
                                  newItems[index].total = newItems[index].quantity * newItems[index].price;
                                  handleInvoiceDataChange('items', newItems);
                                }
                              }}
                              className="h-9 text-right"
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Service</label>
                        <Input
                          value={invoiceData.service}
                          onChange={(e) => handleInvoiceDataChange('service', e.target.value)}
                          className="h-10"
                        />
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      {invoiceData.services?.length || 1} service(s) will appear in the invoice
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4 p-4 bg-white border rounded-lg">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Customer Information
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 relative">
                      <label className="text-sm font-medium text-gray-700">Customer Name</label>
                      <Input
                        value={invoiceData.customer}
                        onChange={(e) => {
                          handleInvoiceCustomerNameChange(e.target.value);
                          setShowInvoiceCustomerSuggestions(true);
                        }}
                        onFocus={() => setShowInvoiceCustomerSuggestions(true)}
                        onBlur={() => {
                          setTimeout(() => setShowInvoiceCustomerSuggestions(false), 150);
                        }}
                        placeholder="Type customer name to search"
                        className="h-10"
                      />
                      {showInvoiceCustomerSuggestions && invoiceCustomerSuggestions.length > 0 && (
                        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-y-auto">
                          {invoiceCustomerSuggestions.map((customer) => (
                            <button
                              key={`invoice-customer-${customer.id}`}
                              type="button"
                              onMouseDown={(event) => {
                                event.preventDefault();
                                applyInvoiceCustomerSuggestion(customer);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                            >
                              <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                              <p className="text-xs text-gray-500">
                                {customer.phone || customer.email || 'No contact saved'}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <Input
                        value={invoiceData.email}
                        onChange={(e) => handleInvoiceDataChange('email', e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Phone</label>
                      <Input
                        value={invoiceData.phone}
                        onChange={(e) => handleInvoiceDataChange('phone', e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Address</label>
                      <Input
                        value={invoiceData.customerAddress || ''}
                        onChange={(e) => handleInvoiceDataChange('customerAddress', e.target.value)}
                        placeholder="Enter customer address"
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Card Last 4 Digits</label>
                      <Input
                        value={invoiceData.cardLast4Digits || ''}
                        onChange={(e) => handleInvoiceDataChange('cardLast4Digits', e.target.value)}
                        placeholder="1234"
                        className="h-10"
                        maxLength={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">TRN Number</label>
                      <Input
                        value={invoiceData.trnNumber || ''}
                        onChange={(e) => handleInvoiceDataChange('trnNumber', e.target.value)}
                        placeholder="Enter TRN number"
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-4 bg-white border rounded-lg">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-primary" />
                    Service Details
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Barber</label>
                      <Input
                        value={invoiceData.barber}
                        onChange={(e) => handleInvoiceDataChange('barber', e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Date</label>
                      <Input
                        value={invoiceData.date}
                        onChange={(e) => handleInvoiceDataChange('date', e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Time</label>
                      <Input
                        value={invoiceData.time}
                        onChange={(e) => handleInvoiceDataChange('time', e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Duration</label>
                      <Input
                        value={invoiceData.duration}
                        onChange={(e) => handleInvoiceDataChange('duration', e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-4 bg-white border rounded-lg">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Product Items
                  </h4>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Add Product Item</label>
                    <div className="relative">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        value={invoiceProductSearchTerm}
                        onChange={(e) => {
                          setInvoiceProductSearchTerm(e.target.value);
                          setShowInvoiceProductSuggestions(true);
                        }}
                        onFocus={() => setShowInvoiceProductSuggestions(true)}
                        onBlur={() => {
                          setTimeout(() => setShowInvoiceProductSuggestions(false), 150);
                        }}
                        placeholder="Type product name to add"
                        className="h-10 pl-9"
                      />

                      {showInvoiceProductSuggestions && invoiceProductSuggestions.length > 0 && (
                        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border bg-white shadow-lg">
                          {invoiceProductSuggestions.map((product) => (
                            <button
                              key={`${product.name}-${product.category}`}
                              type="button"
                              className="w-full border-b px-3 py-2 text-left hover:bg-gray-50"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handleAddInvoiceProductItem(product)}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-gray-900">{product.name}</p>
                                  <p className="text-xs text-gray-500">{product.category || 'Product'}</p>
                                </div>
                                <span className="shrink-0 text-sm font-medium text-primary">
                                  {formatCurrency(Number(product.price || 0))}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">Type and select a product to add it as an invoice item.</p>
                  </div>
                  
                  <div className="space-y-3">
                    {getInvoiceProductItems(invoiceData).map((item, index) => {
                      const actualIndex = getInvoiceServiceItemCount(invoiceData) + index;
                      return (
                      <div key={actualIndex} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <Input
                            value={item.name}
                            onChange={(e) => {
                              const newItems = [...(invoiceData.items || [])];
                              newItems[actualIndex].name = e.target.value;
                              handleInvoiceDataChange('items', newItems);
                            }}
                            className="h-9"
                          />
                        </div>
                        <div className="w-24">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...(invoiceData.items || [])];
                              newItems[actualIndex].quantity = parseInt(e.target.value) || 1;
                              newItems[actualIndex].total = newItems[actualIndex].quantity * newItems[actualIndex].price;
                              handleInvoiceDataChange('items', newItems);
                            }}
                            className="h-9"
                          />
                        </div>
                        <div className="w-32">
                          <Input
                            type="number"
                            value={item.price}
                            onChange={(e) => {
                              const newItems = [...(invoiceData.items || [])];
                              newItems[actualIndex].price = parseFloat(e.target.value) || 0;
                              newItems[actualIndex].total = newItems[actualIndex].quantity * newItems[actualIndex].price;
                              handleInvoiceDataChange('items', newItems);
                            }}
                            className="h-9"
                          />
                        </div>
                        <div className="w-32 font-medium">
                          {formatCurrency(item.total)}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveInvoiceItem(actualIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    )})}
                    {getInvoiceProductItems(invoiceData).length === 0 && (
                      <p className="text-sm text-gray-500">No products added yet.</p>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddInvoiceItem}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Manual Product
                    </Button>
                  </div>
                </div>

                {invoiceData.teamMembers && invoiceData.teamMembers.length > 0 && (
                  <div className="space-y-4 p-4 bg-white border rounded-lg">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      Team Members Tips
                    </h4>
                    
                    <div className="space-y-3">
                      {invoiceData.teamMembers.map((member, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">{member.name}</span>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={member.tip}
                              onChange={(e) => {
                                const newMembers = [...(invoiceData.teamMembers || [])];
                                newMembers[index].tip = parseFloat(e.target.value) || 0;
                                handleInvoiceDataChange('teamMembers', newMembers);
                              }}
                              className="h-9 w-32"
                              placeholder="Tip amount"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4 p-4 bg-white border rounded-lg">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Payment Split
                  </h4>

                  <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                    {availableInvoiceSplitMethods.map((method) => {
                      const selected = selectedInvoicePaymentMethods.includes(method);
                      return (
                        <Button
                          key={method}
                          type="button"
                          variant={selected ? 'default' : 'outline'}
                          onClick={() => handleInvoiceSplitMethodToggle(method)}
                          className="h-9"
                        >
                          {INVOICE_SPLIT_LABELS[method]}
                        </Button>
                      );
                    })}
                  </div>

                  <div className="space-y-3">
                    {selectedInvoicePaymentMethods.map((method) => (
                      <div key={method} className="flex items-center gap-3">
                        <label className="w-24 text-sm font-medium text-gray-700">
                          {INVOICE_SPLIT_LABELS[method]}
                        </label>
                        <Input
                          type="number"
                          value={Number(invoiceData.paymentAmounts?.[method] || 0)}
                          onChange={(e) => handleInvoiceSplitAmountChange(method, e.target.value)}
                          className="h-9"
                          max={method === 'ewallet' && invoiceEwalletBalance !== null ? Math.max(0, invoiceEwalletBalance) : undefined}
                        />
                      </div>
                    ))}
                  </div>

                  {selectedInvoicePaymentMethods.includes('ewallet') && (
                    <div className="rounded-md border bg-emerald-50 p-3 text-sm text-emerald-800">
                      <p className="font-medium">E-Wallet Balance</p>
                      <p>
                        {invoiceEwalletLoading
                          ? 'Loading balance...'
                          : invoiceEwalletBalance !== null
                          ? formatCurrency(invoiceEwalletBalance)
                          : 'Balance not available'}
                      </p>
                      {invoiceEwalletDiscountPercent > 0 && (
                        <p className="mt-1 text-xs text-indigo-700">
                          Active eWallet top-up discount: {invoiceEwalletDiscountPercent.toFixed(0)}% (applied while balance is available)
                        </p>
                      )}
                    </div>
                  )}

                  {selectedInvoicePaymentMethods.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Reference Number</label>
                      <Input
                        value={invoiceData.referenceNumber || ''}
                        onChange={(e) => handleInvoiceDataChange('referenceNumber', e.target.value)}
                        placeholder="Enter payment reference number"
                        className="h-10"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between rounded-md bg-gray-50 p-3 text-sm">
                    <span className="text-gray-600">Allocated Amount</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(selectedInvoicePaymentTotal)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Remaining Amount</span>
                    <span className={`font-semibold ${Math.abs(invoicePaymentRemaining) < 0.01 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {formatCurrency(invoicePaymentRemaining)}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 p-4 bg-white border rounded-lg">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-primary" />
                    Pricing Summary
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Subtotal:</span>
                      <span className="font-medium">
                        {formatCurrency(invoiceData.subtotal || 0)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Tax (%)</label>
                        <Input
                          type="number"
                          value={invoiceValueDisplayMode === 'without-tax' ? 0 : (invoiceData.tax ?? taxRate)}
                          onChange={(e) => handleInvoiceDataChange('tax', parseFloat(e.target.value) || 0)}
                          disabled={invoiceValueDisplayMode === 'without-tax'}
                          className="h-10"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Discount Type</label>
                        <Select
                          value={invoiceData.discountType || 'fixed'}
                          onValueChange={(value) => handleInvoiceDataChange('discountType', value as 'fixed' | 'percentage')}
                          disabled={isInvoiceEwalletDiscountLocked}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select discount type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">Fixed (AED)</SelectItem>
                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Discount ({invoiceData.discountType === 'percentage' ? '%' : 'AED'})
                        </label>
                        <Input
                          type="number"
                          value={invoiceData.discount || 0}
                          onChange={(e) => handleInvoiceDataChange('discount', parseFloat(e.target.value) || 0)}
                          className="h-10"
                          step={invoiceData.discountType === 'percentage' ? '0.01' : '0.1'}
                          disabled={isInvoiceEwalletDiscountLocked}
                        />
                      </div>
                    </div>

                    {invoiceEwalletDiscountPercent > 0 && (
                      <div className="rounded-md border bg-indigo-50 p-3 text-sm text-indigo-900">
                        <p className="font-medium">
                          eWallet Top-up Discount: {invoiceEwalletDiscountPercent.toFixed(0)}%
                        </p>
                        <p className="text-xs text-indigo-700">This discount is due to eWallet top-up.</p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700">Service Charges (AED)</label>
                        <Input
                          type="number"
                          value={invoiceData.serviceCharges || 0}
                          onChange={(e) => handleInvoiceDataChange('serviceCharges', parseFloat(e.target.value) || 0)}
                          className="h-10"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700">Service Tip (AED)</label>
                        <Input
                          type="number"
                          value={invoiceData.serviceTip || 0}
                          onChange={(e) => handleInvoiceDataChange('serviceTip', parseFloat(e.target.value) || 0)}
                          className="h-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 border-t pt-3">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Total Amount (Without VAT):</span>
                        <span className="font-medium">{formatCurrency(invoicePricingSummary.totalWithoutVat)}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span className="text-gray-700">
                          Coupon Code Discount{invoiceData.couponCode ? ` (${invoiceData.couponCode})` : ''}:
                        </span>
                        <span>- {formatCurrency(invoicePricingSummary.couponDiscountAmount)}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span className="text-gray-700">Discount Amount:</span>
                        <span>- {formatCurrency(invoicePricingSummary.discountAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Tax Type:</span>
                        <span className="font-medium">{invoicePricingSummary.taxTypeLabel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">VAT ({invoicePricingSummary.vatRate.toFixed(2)}%):</span>
                        <span className="font-medium">{formatCurrency(invoicePricingSummary.taxAmount)}</span>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t">
                        <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                        <span className="text-xl font-bold text-green-600">
                          {formatCurrency(invoicePricingSummary.totalAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Amount Paid:</span>
                        <span className="font-medium">{formatCurrency(invoicePricingSummary.amountPaid)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Amount Due:</span>
                        <span className="font-medium">{formatCurrency(invoicePricingSummary.amountDue)}</span>
                      </div>
                      {invoicePricingSummary.ewalletBalanceLeft !== null && (
                        <div className="flex justify-between">
                          <span className="text-gray-700">E-Wallet Balance Left:</span>
                          <span className="font-medium">{formatCurrency(invoicePricingSummary.ewalletBalanceLeft)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-4 bg-white border rounded-lg">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Additional Notes
                  </h4>
                  
                  <Textarea
                    value={invoiceData.notes || ''}
                    onChange={(e) => handleInvoiceDataChange('notes', e.target.value)}
                    placeholder="Add any additional notes or terms..."
                    className="min-h-[100px]"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-6 border-t sticky bottom-0 bg-white">
                <Button
                  variant="outline"
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-6 h-11"
                >
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleCloseBookingFromInvoice}
                  disabled={closingInvoiceBooking || String(invoiceData.status || '').toLowerCase() === 'closed'}
                  className="px-6 h-11 gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {String(invoiceData.status || '').toLowerCase() === 'closed'
                    ? 'Booking Closed'
                    : (closingInvoiceBooking ? 'Closing Booking...' : 'Close Booking')}
                </Button>
                <Button
                  onClick={handleDownloadInvoicePDF}
                  className="px-6 h-11 bg-primary hover:bg-primary/90 gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF Invoice with All Fields
                </Button>
                <Button
                  type="button"
                  onClick={handleSendInvoiceWhatsApp}
                  className="px-6 h-11 bg-green-600 hover:bg-green-700 gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Send via WhatsApp
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </ProtectedRoute>
  );
}