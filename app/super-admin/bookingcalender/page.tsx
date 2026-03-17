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
import { Calendar, Clock, User, Search, Filter, CheckCircle, XCircle, AlertCircle, Bell, Smartphone, Globe, Plus, Edit, Trash2, Phone, Mail, RefreshCw, FileText, Scissors, Package, DollarSign, Receipt, CheckCircle2, Eye, Play, Star, FileCheck, Download, Printer, MoreVertical, CreditCard, Hash, Building, Tag, Calculator, MapPin, X } from "lucide-react";
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
import { collection, getDocs, query, orderBy, where, doc, updateDoc, addDoc, serverTimestamp, onSnapshot, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ===================== TYPE DEFINITIONS =====================

interface ServiceInvoiceDetail {
  serviceName: string;
  branch: string;
  staff: string;
  staffId?: string;
  price: number;
  tip?: number;
}

interface ExtendedInvoiceData extends InvoiceData {
  customerAddress?: string;
  paymentMethod?: string;
  subtotal?: number;
  total?: number;
  items?: InvoiceItem[];
  taxAmount?: number;
  discountAmount?: number;
  cardLast4Digits?: string;
  trnNumber?: string;
  serviceDetails?: ServiceInvoiceDetail[];
  serviceTip?: number;
  serviceCharges?: number;
  services?: string[];
  branch?: string;
}

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
    branch?: string;
    staff?: string;
    staffId?: string;
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
  teamMembers?: Array<{name: string, tip: number}>;
  products?: Array<{name: string, category: string, price: number, quantity: number}>;
  paymentMethods?: Array<string>;
  paymentAmounts?: {
    cash: number;
    card: number;
    check: number;
    digital: number;
  };
  discount?: number;
  discountType?: 'fixed' | 'percentage';
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
  branches: string[];
  branchNames: string[];
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

interface Appointment {
  servicePrice: number;
  id: string | number;
  firebaseId?: string;
  bookingNumber?: string;
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
  teamMembers?: Array<{name: string, tip: number}>;
  products?: Array<{name: string, category: string, price: number, quantity: number}>;
  paymentMethods?: Array<string>;
  paymentAmounts?: {
    cash: number;
    card: number;
    check: number;
    digital: number;
  };
  discount?: number;
  discountType?: 'fixed' | 'percentage';
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
  paymentMethods: Array<string>;
  paymentAmounts: {
    cash: number;
    card: number;
    check: number;
    digital: number;
  };
  status: string;
  generateInvoice: boolean;
  cardLast4Digits: string;
  trnNumber: string;
  category: string;
  branch: string;
}

interface ServiceItem {
  branch: string;
  service: string;
  serviceId?: string;
  staff: string;
  price: number;
}

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
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
        status: data.status || "upcoming",
        date: orderDate,
        payment: data.paymentMethod || "unknown",
        paymentStatus: data.paymentStatus || "upcoming",
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

const fetchBookings = async (addNotification: any): Promise<FirebaseBooking[]> => {
  try {
    const bookingsRef = collection(db, "bookings");
    const q = query(bookingsRef, orderBy("createdAt", "desc"));
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
        serviceDetails: Array.isArray(data.serviceDetails) ? data.serviceDetails : [],
        totalDuration: data.serviceDuration || 60,
        totalPrice: data.totalAmount || data.servicePrice || 0,
        status: data.status || "upcoming",
        bookingDate: data.bookingDate || data.date?.split(' ')[0] || "",
        bookingTime: data.time || data.timeSlot || "",
        paymentMethod: data.paymentMethod || "cash",
        paymentStatus: data.paymentStatus || "upcoming",
        branch: data.branch || "",
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
        teamMembers: Array.isArray(data.teamMembers) ? data.teamMembers : [],
        products: Array.isArray(data.products) ? data.products : [],
        paymentMethods: Array.isArray(data.paymentMethods) ? data.paymentMethods : [],
        paymentAmounts: data.paymentAmounts || { cash: 0, card: 0, check: 0, digital: 0 },
        discount: data.discount || 0,
        discountType: data.discountType || 'fixed',
        serviceTip: data.serviceTip || 0,
        tax: data.tax || 5,
        bookingNumber: data.bookingNumber || `BK-${doc.id.substring(0, 8)}`
      };
      
      bookings.push(bookingData);
    });
    
    return bookings;
  } catch (error) {
    console.error("Error fetching bookings:", error);
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
        branches: Array.isArray(data.branches) ? data.branches : [],
        branchNames: Array.isArray(data.branchNames) ? data.branchNames : [],
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
  selectedServices: ServiceItem[],
  addNotification: (notification: { type: 'error' | 'success' | 'warning' | 'info'; title: string; message: string }) => void,
  services: FirebaseService[],
  branches: FirebaseBranch[]
): Promise<{success: boolean, bookingId?: string}> => {
  try {
    const servicesPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
    const totalAmount = servicesPrice;
    
    // Calculate total duration from services
    const totalDuration = selectedServices.reduce((sum, s) => {
      const svc = services.find(sv => sv.name === s.service);
      return sum + (svc?.duration || 30);
    }, 0);
    
    // ✅ BOOKING NUMBER - EXACT 2nd FORMAT
    const bookingNumber = `BOOK-${Date.now()}`;
    
    // ✅ GET CURRENT DATE IN EXACT 2nd FORMAT
    const now = new Date();
    
    // Format date as "YYYY-MM-DD HH:MM:SS.mmmmmm"
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(6, '0');
    
    const dateTimeString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
    const bookingDateString = `${year}-${month}-${day}`;
    
    // ✅ Format time to "2:00 PM" style
    const formatTimeTo12Hour = (time: string): string => {
      if (time.includes('AM') || time.includes('PM')) return time;
      
      const [hour, minute] = time.split(':');
      const h = parseInt(hour);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 || 12;
      return `${hour12}:${minute} ${ampm}`;
    };
    
    const bookingTimeString = formatTimeTo12Hour(bookingData.time);
    const timeSlotString = bookingTimeString.split(' ')[0];
    
    // ✅ MAIN BRANCH
    const mainBranch = selectedServices[0]?.branch || "Main Branch";
    const mainBranchObj = branches.find(b => b.name === mainBranch);
    const mainBranchId = mainBranchObj?.firebaseId || '';
    
    // ✅ FIRST SERVICE
    const firstService = selectedServices[0];
    const firstServiceStaffId = firstService?.serviceId || "";
    
    // Look up service details from Firebase services list
    const firstServiceData = services.find(s => s.name === firstService?.service);
    
    // ✅ SERVICE DETAILS ARRAY
    const serviceDetails = selectedServices.map(service => ({
      name: service.service,
      branch: service.branch,
      staff: service.staff,
      staffId: service.serviceId || firstServiceStaffId,
      price: service.price,
      duration: 60
    }));
    
    // ✅ TEAM MEMBERS
    const teamMembers = selectedServices.map(service => ({
      name: service.staff,
      role: "Hair Barber",
      staffId: service.serviceId || firstServiceStaffId,
      tip: 0
    }));
    
    // ✅ PAYMENT AMOUNTS - EXACT 2nd FORMAT with ALL selected methods
    const paymentAmounts: any = {};
    
    // Add only the payment methods that were selected and have amounts
    bookingData.paymentMethods.forEach(method => {
      const methodKey = method.toLowerCase();
      const amount = bookingData.paymentAmounts[method as keyof typeof bookingData.paymentAmounts] || 0;
      if (amount > 0) {
        paymentAmounts[methodKey] = amount;
      }
    });
    
    // If no payment methods with amounts, add cash as 0
    if (Object.keys(paymentAmounts).length === 0) {
      paymentAmounts.cash = 0;
    }
    
    // ✅ Generate ID like "6QkECDD6Lrp7oc9Krg0u"
    const generateId = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < 20; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };
    
    // ✅ FIREBASE BOOKING DATA - EXACT 2nd FORMAT
    const firebaseBookingData = {
      bookingDate: bookingDateString,
      bookingNumber: bookingNumber,
      bookingTime: bookingTimeString,
      date: dateTimeString,
      time: bookingTimeString,
      
      branch: mainBranch,
      branchId: mainBranchId,
      branchNames: [mainBranch],
      branches: [mainBranchId],
      userBranchId: mainBranchId,
      userBranchName: mainBranch,
      
      customerName: bookingData.customer,
      customerEmail: bookingData.email || "",
      customerPhone: bookingData.phone || "",
      customerId: "",
      
      serviceCategory: firstServiceData?.category || "",
      serviceCategoryId: firstServiceData?.categoryId || "",
      serviceCharges: 0,
      serviceDuration: firstServiceData?.duration || 30,
      serviceId: firstServiceData?.firebaseId || firstServiceStaffId,
      serviceName: firstService?.service || "Classic Service",
      servicePrice: servicesPrice,
      serviceTip: 0,
      
      services: selectedServices.map(s => s.service),
      serviceDetails: serviceDetails,
      
      staff: firstService?.staff || "",
      staffName: firstService?.staff || "",
      staffId: firstServiceStaffId,
      staffRole: "Barber",
      
      teamMembers: teamMembers,
      
      subtotal: servicesPrice,
      totalAmount: totalAmount,
      price: totalAmount,
      
      duration: `${totalDuration} min`,
      totalDuration: totalDuration,
      timeSlot: timeSlotString,
      
      // ✅ PAYMENT DETAILS - MULTIPLE METHODS WITH AMOUNTS
      paymentMethod: bookingData.paymentMethods.join(', '),
      paymentStatus: "pending",
      paymentMethods: bookingData.paymentMethods,
      paymentAmounts: paymentAmounts,
      cardLast4Digits: "",
      trnNumber: "",
      
      discount: 0,
      discountAmount: 0,
      discountType: "none",
      tax: 0,
      taxAmount: 0,
      
      products: [],
      productsTotal: 0,
      
      status: "upcoming",
      
      // ✅ FIXED: SIRF MANUAL NOTES - NO PAYMENT METHODS ADDED
      notes: bookingData.notes || '',
      
      source: "customer_app",
      createdBy: "admin",
      userRole: "admin",
      
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      
      pointsAwarded: false,
      
      id: generateId(),
      totalTips: 0
    };

    console.log("📝 Payment Amounts being saved:", paymentAmounts);
    console.log("📝 Notes being saved:", firebaseBookingData.notes);
    console.log("📝 Full booking data:", JSON.stringify(firebaseBookingData, null, 2));
    
    const bookingsRef = collection(db, "bookings");
    const docRef = await addDoc(bookingsRef, firebaseBookingData);
    
    addNotification({
      type: 'success',
      title: 'Booking Created',
      message: `Booking #${bookingNumber} saved with payments: ${Object.entries(paymentAmounts).map(([k,v]) => `${k}: AED ${v}`).join(', ')}`
    });
    
    return {success: true, bookingId: docRef.id};
    
  } catch (error) {
    console.error("Error creating booking in Firebase:", error);
    addNotification({
      type: 'error',
      title: 'Booking Error',
      message: 'Failed to save booking to Firebase. Please try again.'
    });
    return {success: false};
  }
};

const updateBookingInFirebase = async (
  bookingId: string,
  bookingData: BookingFormData,
  selectedServices: ServiceItem[],
  services: FirebaseService[],
  branches: FirebaseBranch[]
): Promise<boolean> => {
  try {
    const servicesPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
    const totalDuration = selectedServices.reduce((sum, s) => {
      const svc = services.find((sv) => sv.name === s.service);
      return sum + (svc?.duration || 30);
    }, 0);

    const mainBranch = selectedServices[0]?.branch || bookingData.branch || "Main Branch";
    const mainBranchObj = branches.find((b) => b.name === mainBranch);
    const mainBranchId = mainBranchObj?.firebaseId || '';

    const serviceDetails = selectedServices.map((service) => ({
      name: service.service,
      branch: service.branch,
      staff: service.staff,
      staffId: service.serviceId || '',
      price: service.price,
      duration: services.find((sv) => sv.name === service.service)?.duration || 60,
    }));

    const firstService = selectedServices[0];

    const bookingRef = doc(db, "bookings", bookingId);
    await updateDoc(bookingRef, {
      customerName: bookingData.customer,
      customerEmail: bookingData.email || '',
      customerPhone: bookingData.phone || '',
      bookingDate: bookingData.date,
      bookingTime: bookingData.time,
      date: bookingData.date,
      time: bookingData.time,
      timeSlot: bookingData.time,
      serviceName: firstService?.service || bookingData.service || 'Service',
      services: selectedServices.map((s) => s.service),
      serviceDetails,
      servicePrice: servicesPrice,
      subtotal: servicesPrice,
      totalAmount: servicesPrice,
      totalDuration,
      duration: `${totalDuration} min`,
      staff: bookingData.barber || firstService?.staff || '',
      staffName: bookingData.barber || firstService?.staff || '',
      staffId: firstService?.serviceId || '',
      branch: mainBranch,
      branchId: mainBranchId,
      branchNames: [mainBranch],
      branches: mainBranchId ? [mainBranchId] : [],
      notes: bookingData.notes || '',
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error("Error updating booking in Firebase:", error);
    return false;
  }
};

const deleteBookingInFirebase = async (bookingId: string): Promise<boolean> => {
  try {
    const bookingRef = doc(db, "bookings", bookingId);
    await deleteDoc(bookingRef);
    return true;
  } catch (error) {
    console.error("Error deleting booking:", error);
    return false;
  }
};

const generatePDFInvoice = (invoiceData: ExtendedInvoiceData) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text('MAN OF CAVE', 20, 20);
    
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text('TAX INVOICE', pageWidth - 70, 20);
    
    // Customer Info
    const customerY = 45;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text('Customer Information:', 20, customerY);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    const customerDetails = [
      ['Name', invoiceData.customer],
      ['Mobile', invoiceData.phone || 'N/A'],
      ['Email', invoiceData.email || 'N/A'],
    ];
    
    let yPos = customerY + 8;
    customerDetails.forEach(([label, value]) => {
      if (value !== 'N/A') {
        doc.text(`${label} : ${value}`, 20, yPos);
        yPos += 6;
      }
    });
    
    // Invoice Info
    const invoiceY = customerY;
    const invoiceDetails = [
      ['Invoice No', invoiceData.invoiceNumber || '#INV6584'],
      ['Date', new Date().toLocaleDateString('en-GB')],
      ['Payment', invoiceData.paymentMethod || 'Cash']
    ];
    
    yPos = invoiceY;
    invoiceDetails.forEach(([label, value]) => {
      doc.text(`${label} : ${value}`, pageWidth - 80, yPos);
      yPos += 6;
    });
    
    // Services Table
    const tableY = Math.max(customerY + 35, invoiceY + 30);
    
    const tableBody: any[][] = [];
    
    if (invoiceData.serviceDetails && invoiceData.serviceDetails.length > 0) {
      invoiceData.serviceDetails.forEach((service) => {
        tableBody.push([
          service.serviceName,
          service.branch,
          service.staff,
          `AED ${service.price.toFixed(2)}`,
          service.tip ? `AED ${service.tip.toFixed(2)}` : '-'
        ]);
      });
    } else if (invoiceData.services && invoiceData.services.length > 0) {
      const pricePerService = invoiceData.price / invoiceData.services.length;
      invoiceData.services.forEach((service, index) => {
        tableBody.push([
          service,
          invoiceData.branch || '-',
          invoiceData.barber || '-',
          `AED ${pricePerService.toFixed(2)}`,
          '-'
        ]);
      });
    } else {
      tableBody.push([
        invoiceData.service || 'Service',
        invoiceData.branch || '-',
        invoiceData.barber || '-',
        `AED ${invoiceData.price.toFixed(2)}`,
        '-'
      ]);
    }
    
    autoTable(doc, {
      startY: tableY,
      head: [['Service', 'Branch', 'Staff', 'Price', 'Tip']],
      body: tableBody,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: { fontSize: 9 }
    });
    
    // Totals
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    const subtotal = invoiceData.subtotal || invoiceData.price || 0;
    const totalTips = invoiceData.serviceDetails?.reduce((sum, s) => sum + (s.tip || 0), 0) || 0;
    const grandTotal = subtotal + totalTips;
    
    doc.setFont("helvetica", "bold");
    doc.text(`Subtotal: AED ${subtotal.toFixed(2)}`, pageWidth - 70, finalY);
    doc.text(`Tips: AED ${totalTips.toFixed(2)}`, pageWidth - 70, finalY + 6);
    doc.text(`Grand Total: AED ${grandTotal.toFixed(2)}`, pageWidth - 70, finalY + 14);
    
    // Footer
    const footerY = doc.internal.pageSize.height - 15;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text('THANK YOU FOR YOUR BUSINESS', pageWidth / 2, footerY, { align: 'center' });
    
    doc.save(`Invoice-${invoiceData.invoiceNumber || 'MANOFCAVE'}.pdf`);
    return true;
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};

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
        <Button variant="ghost" size="sm" onClick={handlePrevMonth} className="p-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Button>
        
        <div className="text-center">
          <div className="font-semibold text-lg">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </div>
        </div>
        
        <Button variant="ghost" size="sm" onClick={handleNextMonth} className="p-2">
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
                focus:outline-none focus:ring-2 focus:ring-blue-500
              `}
            >
              <span className="text-sm">{day.date.getDate()}</span>
              
              {hasAppointments && day.isCurrentMonth && !isSelectedDate && (
                <div className="absolute bottom-1 flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-blue-500" />
                </div>
              )}
            </button>
          );
        })}
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
            apt.barber.toLowerCase()
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
          placeholder="Search by customer, service, or barber..."
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
    { value: 'upcoming', label: 'upcoming', color: 'bg-orange-100 text-orange-800' },
    { value: 'approved', label: 'Approved', color: 'bg-purple-100 text-purple-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">Filter by Status</label>
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
                <SelectItem key={option.value} value={option.value} className="cursor-pointer">
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
      </div>
    </div>
  );
};

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
  const [viewMode, setViewMode] = useState<'calendar' | 'advanced-calendar' | 'list' | 'approvals' | 'product-orders'>('calendar');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedAppointmentForInvoice, setSelectedAppointmentForInvoice] = useState<Appointment | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceData, setInvoiceData] = useState<ExtendedInvoiceData | null>(null);
  const [isEditingInvoice, setIsEditingInvoice] = useState(false);
  
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
  
  const [allowupcomingOrders] = useState(true);

  const [selectedServices, setSelectedServices] = useState<ServiceItem[]>([]);
  const [tempServiceData, setTempServiceData] = useState<ServiceItem>({
    branch: '',
    service: '',
    staff: '',
    price: 0
  });
  const [branchServices, setBranchServices] = useState<FirebaseService[]>([]);
  const [branchStaff, setBranchStaff] = useState<FirebaseStaff[]>([]);
  const [customPaymentMethod, setCustomPaymentMethod] = useState('');
  const [customPaymentMethods, setCustomPaymentMethods] = useState<string[]>([]);

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
    status: 'upcoming',
    generateInvoice: false,
    cardLast4Digits: '',
    trnNumber: '',
    category: '',
    branch: ''
  });

  useEffect(() => {
    let isMounted = true;
    let unsubscribeBookings: (() => void) | undefined;
    let unsubscribeStaff: (() => void) | undefined;
    
    const loadFirebaseData = async () => {
      setLoading({ orders: true, bookings: true, staff: true, services: true, categories: true, branches: true });
      
      try {
        const notificationWrapper = (notification: { type: string; title: string; message: string }) => {
          if (!isMounted) return;
          addNotification({
            type: notification.type as 'error' | 'success' | 'warning' | 'info',
            title: notification.title,
            message: notification.message
          });
        };

        const [ordersData, staffData, servicesData, categoriesData, branchesData] = await Promise.all([
          fetchProductOrders(notificationWrapper),
          fetchStaff(),
          fetchServices(),
          fetchCategories(),
          fetchBranches()
        ]);
        
        if (!isMounted) return;
        
        const bookingsRef = collection(db, "bookings");
        const q = query(bookingsRef, orderBy("createdAt", "desc"));
        
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
              serviceDetails: Array.isArray(data.serviceDetails) ? data.serviceDetails : [],
              serviceDuration: data.serviceDuration || 60,
              totalDuration: data.serviceDuration || 60,
              servicePrice: data.servicePrice || data.totalAmount || 0,
              totalPrice: data.servicePrice || data.totalAmount || 0,
              totalAmount: data.servicePrice || data.totalAmount || 0,
              status: data.status || "upcoming",
              bookingDate,
              bookingTime,
              paymentMethod: data.paymentMethod || "cash",
              paymentStatus: data.paymentStatus || "upcoming",
              branch: Array.isArray(data.branchNames) ? data.branchNames.join(", ") : "All Branches",
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
              serviceTip: data.serviceTip || 0,
              serviceCharges: data.serviceCharges || 0,
              tax: data.tax || 5,
              serviceName: ''
            };
            bookingsData.push(bookingData);
          });
          
          if (isMounted) {
            setBookings(bookingsData);
            setLoading(prev => ({ ...prev, bookings: false }));
          }
        }, (error) => {
          if (isMounted) {
            console.error("Error in real-time bookings listener:", error);
            setLoading(prev => ({ ...prev, bookings: false }));
          }
        });

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

          setStaffMembers(realtimeStaff.filter((staff) => isStaffActive(staff.status)));
          setLoading((prev) => ({ ...prev, staff: false }));
        }, (error) => {
          if (!isMounted) return;
          console.error("Error in real-time staff listener:", error);
          setLoading((prev) => ({ ...prev, staff: false }));
        });
        
        if (isMounted) {
          setProductOrders(ordersData);
          setStaffMembers(staffData);
          setServices(servicesData);
          setCategories(categoriesData);
          setBranches(branchesData);
          setLoading({ orders: false, bookings: false, staff: false, services: false, categories: false, branches: false });
        }
        
      } catch (error) {
        if (isMounted) {
          console.error("Error loading Firebase data:", error);
          addNotification({
            type: 'error',
            title: 'Data Load Error',
            message: 'Failed to load data from Firebase'
          });
          setLoading({ orders: false, bookings: false, staff: false, services: false, categories: false, branches: false });
        }
      }
    };

    loadFirebaseData();
    
    return () => {
      isMounted = false;
      if (unsubscribeBookings) unsubscribeBookings();
      if (unsubscribeStaff) unsubscribeStaff();
    };
  }, []);

  const mapBookingStatus = (firebaseStatus: string): string => {
    const statusMap: { [key: string]: string } = {
      'upcoming': 'upcoming',
      'approved': 'approved',
      'confirmed': 'scheduled',
      'scheduled': 'scheduled',
      'completed': 'completed',
      'cancelled': 'cancelled',
      'rejected': 'rejected',
      'delivered': 'delivered',
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
      serviceDetails: booking.serviceDetails || [],
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
                         appointment.barber.toLowerCase().includes(searchQuery.toLowerCase());
    const dateString = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
    const matchesDate = !selectedDate || appointment.date === dateString;
    return matchesStatus && matchesSearch && matchesDate;
  });

  const getAppointmentsForDate = (date: Date): Appointment[] => {
    if (!date || bookings.length === 0) return [];
    
    const selectedDateStr = date.toISOString().split('T')[0];
    
    const firebaseBookingsForDate = bookings.filter(booking => {
      if (booking.bookingDate === selectedDateStr) return true;
      return false;
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
        serviceCharges: booking.serviceCharges || 0,
        tax: booking.tax || 0
      };
    });
  };

  const upcomingAppointments: Appointment[] = bookings
    .filter(booking => booking.status === 'upcoming' || booking.status === 'approved' || booking.status === 'rejected' || booking.status === 'upcoming')
    .map((booking, index) => ({
      id: booking.firebaseId || `upcoming-${index}`,
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
      paymentAmounts: booking.paymentAmounts || { cash: 0, card: 0, check: 0, digital: 0 },
      discount: booking.discount || 0,
      discountType: booking.discountType || 'fixed',
      serviceTip: booking.serviceTip || 0,
      serviceCharges: booking.serviceCharges || 0,
      tax: booking.tax || 5
    }));

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "delivered": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "upcoming": return "bg-blue-100 text-blue-800 border-blue-200";
      case "in-progress": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "scheduled": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "approved": return "bg-purple-100 text-purple-800 border-purple-200";
      case "cancelled": return "bg-red-100 text-red-800 border-red-200";
      case "rejected": return "bg-red-100 text-red-800 border-red-200";
      case "rescheduled": return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4" />;
      case "delivered": return <Package className="w-4 h-4" />;
      case "upcoming": return <Calendar className="w-4 h-4" />;
      case "in-progress": return <Clock className="w-4 h-4" />;
      case "scheduled": return <Calendar className="w-4 h-4" />;
      case "approved": return <CheckCircle className="w-4 h-4" />;
      case "cancelled": return <XCircle className="w-4 h-4" />;
      case "rejected": return <XCircle className="w-4 h-4" />;
      case "rescheduled": return <RefreshCw className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
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
    paymentAmounts: { cash: 0, card: 0, check: 0, digital: 0 },
    discount: 0,
    discountType: 'fixed',
    serviceTip: 0,
    serviceCharges: 0,
    tax: 0,
    pointsAwarded: false
  }));

  const finalAppointments = [...mockAppointments, ...convertedBookings, ...additionalConvertedBookings];
  const unreadNotifications = notifications.filter(n => !n.read).length;

  const fetchServicesForBranch = (branchName: string) => {
    const branchObj = branches.find(b => b.name === branchName);
    const branchId = branchObj?.firebaseId;
    const filtered = services.filter(service => {
      if (service.status !== 'active') return false;
      const matchByName = service.branchNames?.some(b => b === branchName);
      const matchById = branchId && service.branches?.some(id => id === branchId);
      return matchByName || matchById;
    });
    setBranchServices(filtered);
  };

  const fetchStaffForBranch = (branchName: string) => {
    const branchId = branches.find((b) => b.name === branchName)?.firebaseId;
    const filtered = staffMembers.filter((staff) =>
      isStaffActive(staff.status) && staffBelongsToBranch(staff, branchName, branchId)
    );
    setBranchStaff(filtered);
  };

  useEffect(() => {
    if (!tempServiceData.branch) {
      setBranchStaff([]);
      return;
    }

    fetchStaffForBranch(tempServiceData.branch);
  }, [tempServiceData.branch, staffMembers, branches]);

  const handleAddService = () => {
    if (!tempServiceData.branch || !tempServiceData.service || !tempServiceData.staff || tempServiceData.price <= 0) {
      addNotification({
        type: 'error',
        title: 'Incomplete Service',
        message: 'Please select branch, service, and staff'
      });
      return;
    }
    
    setSelectedServices([...selectedServices, tempServiceData]);
    
    setTempServiceData({ branch: '', service: '', staff: '', price: 0 });
    setBranchServices([]);
    setBranchStaff([]);
  };

  const handleRemoveService = (index: number) => {
    setSelectedServices(selectedServices.filter((_, i) => i !== index));
  };

  const handleAddCustomPayment = () => {
    if (customPaymentMethod.trim()) {
      setCustomPaymentMethods([...customPaymentMethods, customPaymentMethod]);
      setCustomPaymentMethod('');
    }
  };

  const handlePaymentMethodToggle = (method: string) => {
    const newMethods = bookingData.paymentMethods.includes(method)
      ? bookingData.paymentMethods.filter(m => m !== method)
      : [...bookingData.paymentMethods, method];
    
    setBookingData({
      ...bookingData,
      paymentMethods: newMethods,
      paymentAmounts: {
        ...bookingData.paymentAmounts,
        [method]: bookingData.paymentAmounts[method as keyof typeof bookingData.paymentAmounts] || 0
      }
    });
  };

  const handlePaymentAmountChange = (method: string, amount: string) => {
    setBookingData({
      ...bookingData,
      paymentAmounts: {
        ...bookingData.paymentAmounts,
        [method]: parseFloat(amount) || 0
      }
    });
  };

  const buildCheckoutBookingData = (): BookingFormData => {
    const serviceNames = selectedServices.map((service) => service.service);
    const primaryBarber = bookingData.barber || selectedServices[0]?.staff || '';
    const normalizedPaymentMethods = bookingData.paymentMethods.length > 0 ? bookingData.paymentMethods : ['cash'];

    return {
      ...bookingData,
      customer: bookingData.customer.trim(),
      phone: bookingData.phone.trim(),
      email: bookingData.email.trim(),
      notes: bookingData.notes.trim(),
      barber: primaryBarber,
      services: serviceNames,
      paymentMethods: normalizedPaymentMethods,
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
      const serviceData = services.find((s) => s.name === service.service);

      addToCart({
        id: service.serviceId || serviceData?.firebaseId || service.service,
        name: service.service,
        price: Number(service.price) || 0,
        duration: `${Number(serviceData?.duration || 0)} min`,
        description: serviceData?.description || '',
        category: serviceData?.category || '',
        rating: 0,
        reviews: 0,
        image: serviceData?.imageUrl || '',
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
    setEditingBookingId(null);

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
      status: 'upcoming',
      generateInvoice: false,
      cardLast4Digits: '',
      trnNumber: '',
      category: '',
      branch: ''
    });
    setSelectedServices([]);
    setShowBookingDialog(true);
  };

  const normalizeTimeForInput = (timeValue?: string): string => {
    if (!timeValue) return '';
    if (timeValue.includes(':') && !timeValue.includes('AM') && !timeValue.includes('PM')) return timeValue.slice(0, 5);

    const [timePart, period] = timeValue.split(' ');
    if (!timePart || !period) return timeValue;
    const [h, m] = timePart.split(':').map((value) => parseInt(value, 10));
    if (Number.isNaN(h) || Number.isNaN(m)) return '';

    const hour24 = period.toUpperCase() === 'PM' ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
    return `${String(hour24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const handleEditBookingFromCalendar = (appointment: any) => {
    const appointmentId = appointment.firebaseId || String(appointment.id);
    if (!appointmentId) return;

    const mappedServices: ServiceItem[] = Array.isArray(appointment.serviceDetails) && appointment.serviceDetails.length > 0
      ? appointment.serviceDetails.map((detail: any, index: number) => ({
          branch: detail.branch || appointment.branch || '',
          service: detail.name || detail.serviceName || appointment.services?.[index] || appointment.service || 'Service',
          serviceId: detail.staffId || appointment.staffId || '',
          staff: detail.staff || appointment.barber || '',
          price: Number(detail.price) || 0,
        }))
      : (appointment.services && appointment.services.length > 0
          ? appointment.services.map((serviceName: string) => ({
              branch: appointment.branch || '',
              service: serviceName,
              serviceId: appointment.staffId || '',
              staff: appointment.barber || '',
              price: Number(appointment.price) / Math.max(appointment.services?.length || 1, 1) || 0,
            }))
          : [{
              branch: appointment.branch || '',
              service: appointment.service || 'Service',
              serviceId: appointment.staffId || '',
              staff: appointment.barber || '',
              price: Number(appointment.price) || 0,
            }]);

    setEditingBookingId(appointmentId);
    setSelectedServices(mappedServices);
    setBookingData((prev) => ({
      ...prev,
      customer: appointment.customer || '',
      phone: appointment.phone || '',
      email: appointment.email || '',
      barber: appointment.barber || mappedServices[0]?.staff || '',
      teamMembers: [{ name: appointment.barber || mappedServices[0]?.staff || '', tip: 0 }],
      date: appointment.date || '',
      time: normalizeTimeForInput(appointment.time || ''),
      notes: appointment.notes || '',
      service: mappedServices[0]?.service || '',
      services: mappedServices.map((service) => service.service),
      branch: appointment.branch || mappedServices[0]?.branch || '',
      paymentMethods: [],
      paymentAmounts: { cash: 0, card: 0, check: 0, digital: 0 },
      status: appointment.status || 'upcoming',
    }));

    setShowBookingDialog(true);
  };

  const handleDeleteBookingFromCalendar = async (appointment: any) => {
    if (!appointment.firebaseId) return;
    const success = await deleteBookingInFirebase(appointment.firebaseId);
    if (success) {
      addNotification({
        type: 'success',
        title: 'Booking Deleted',
        message: `${appointment.customer || 'Customer'} booking was deleted.`,
      });
    } else {
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete booking.',
      });
    }
  };

  const handleCheckoutFromCalendar = (appointment: any) => {
    setSelectedAppointment(appointment);
    handleGenerateInvoiceClick(appointment);
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

    if (editingBookingId) {
      const updated = await updateBookingInFirebase(
        editingBookingId,
        checkoutBookingData,
        selectedServices,
        services,
        branches
      );

      if (updated) {
        addNotification({
          type: 'success',
          title: 'Booking Updated Successfully',
          message: `Appointment for ${checkoutBookingData.customer} has been updated.`,
        });

        setShowBookingDialog(false);
        clearCart();
        setEditingBookingId(null);
        setSelectedServices([]);
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
          status: 'upcoming',
          generateInvoice: false,
          cardLast4Digits: '',
          trnNumber: '',
          category: '',
          branch: ''
        });
      } else {
        addNotification({
          type: 'error',
          title: 'Update Failed',
          message: 'Failed to update booking. Please try again.',
        });
      }
      return;
    }

    const result = await createBookingInFirebase(checkoutBookingData, selectedServices, addNotification, services, branches);
    
    if (result.success) {
      addNotification({
        type: 'success',
        title: 'Booking Created Successfully',
        message: `Appointment for ${checkoutBookingData.customer} has been saved with ${selectedServices.length} service(s).`,
      });

      setShowBookingDialog(false);
      clearCart();
      setEditingBookingId(null);
      
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
        status: 'upcoming',
        generateInvoice: false,
        cardLast4Digits: '',
        trnNumber: '',
        category: '',
        branch: ''
      });
      
      setSelectedServices([]);
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
      }
    } catch (error) {
      console.error("Error updating status:", error);
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
        }
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
        }
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to reject booking'
      });
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

    if (!confirm(`Are you sure you want to delete booking for ${appointment.customer}?`)) {
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
    }
  };

  const handleGenerateInvoiceClick = (appointment: Appointment) => {
    const newInvoiceNumber = generateInvoiceNumber();
    setInvoiceNumber(newInvoiceNumber);
    setSelectedAppointmentForInvoice(appointment);
    setIsEditingInvoice(true);
    
    let serviceDetails: ServiceInvoiceDetail[] = [];
    
    if (appointment.serviceDetails && Array.isArray(appointment.serviceDetails) && appointment.serviceDetails.length > 0) {
      serviceDetails = appointment.serviceDetails.map(s => ({
        serviceName: s.name || s.serviceName || 'Service',
        branch: s.branch || appointment.branch || 'Main Branch',
        staff: s.staff || appointment.barber,
        staffId: s.staffId || appointment.staffId,
        price: s.price || 0,
        tip: 0
      }));
    } 
    else if (appointment.services && Array.isArray(appointment.services) && appointment.services.length > 0) {
      const pricePerService = appointment.price / appointment.services.length;
      serviceDetails = appointment.services.map((service, index) => ({
        serviceName: service,
        branch: appointment.branch || 'Main Branch',
        staff: appointment.barber,
        staffId: appointment.staffId,
        price: pricePerService,
        tip: 0
      }));
    } 
    else {
      serviceDetails = [{
        serviceName: appointment.service,
        branch: appointment.branch || 'Main Branch',
        staff: appointment.barber,
        staffId: appointment.staffId,
        price: appointment.price,
        tip: 0
      }];
    }
    
    const subtotal = serviceDetails.reduce((sum, s) => sum + s.price, 0);
    
    const items: InvoiceItem[] = serviceDetails.map(s => ({
      name: s.serviceName,
      quantity: 1,
      price: s.price,
      total: s.price
    }));
    
    const initialInvoiceData: ExtendedInvoiceData = {
      id: Number(appointment.id) || Date.now(),
      invoiceNumber: newInvoiceNumber,
      customer: appointment.customer,
      email: appointment.email,
      phone: appointment.phone,
      service: appointment.service,
      services: appointment.services,
      serviceDetails: serviceDetails,
      branch: appointment.branch,
      date: appointment.date,
      time: appointment.time,
      duration: appointment.duration,
      price: subtotal,
      status: appointment.status,
      barber: appointment.barber,
      notes: appointment.notes || '',
      tax: 0,
      discount: 0,
      paymentMethod: appointment.paymentMethods?.join(', ') || 'Cash',
      subtotal: subtotal,
      total: subtotal,
      items: items
    };
    
    setInvoiceData(initialInvoiceData);
    setShowInvoiceModal(true);
  };

  const handleInvoiceDataChange = (field: keyof ExtendedInvoiceData, value: any) => {
    if (invoiceData) {
      const updatedData = {
        ...invoiceData,
        [field]: value
      };
      
      if (field === 'serviceDetails' && Array.isArray(value)) {
        const newSubtotal = value.reduce((sum, s) => sum + (s.price || 0), 0);
        updatedData.subtotal = newSubtotal;
        updatedData.total = newSubtotal;
        updatedData.price = newSubtotal;
        
        const newItems = value.map((s: ServiceInvoiceDetail) => ({
          name: s.serviceName,
          quantity: 1,
          price: s.price,
          total: s.price
        }));
        updatedData.items = newItems;
      }
      
      setInvoiceData(updatedData);
    }
  };

  const handleAddInvoiceItem = () => {
    if (invoiceData) {
      const newItems = [...(invoiceData.items || [])];
      newItems.push({
        name: 'New Item',
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

  const handleDownloadInvoicePDF = () => {
    if (!invoiceData) {
      addNotification({
        type: 'error',
        title: 'Invoice Error',
        message: 'No invoice data found'
      });
      return;
    }
    
    try {
      const success = generatePDFInvoice(invoiceData);
      
      if (success) {
        addNotification({
          type: 'success',
          title: 'Invoice Generated',
          message: `Invoice ${invoiceData.invoiceNumber} has been downloaded as PDF`
        });
        
        setTimeout(() => {
          setShowInvoiceModal(false);
        }, 1500);
      } else {
        addNotification({
          type: 'error',
          title: 'PDF Generation Failed',
          message: 'Failed to generate PDF invoice.'
        });
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
    }
  };

  return (
    <ProtectedRoute requiredRole="super_admin">
      {/* Remove main scrollbar and add pink scrollbar for this page only */}
      <style jsx global>{`
        /* Hide main scrollbar */
        body {
          overflow: hidden !important;
        }
        
        /* Pink scrollbar for this page only */
        .pink-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .pink-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .pink-scrollbar::-webkit-scrollbar-thumb {
          background: #ff69b4;
          border-radius: 10px;
        }
        
        .pink-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #ff1493;
        }
        
        /* Firefox scrollbar */
        .pink-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #ff69b4 #f1f1f1;
        }
      `}</style>

      <div className="flex h-screen overflow-hidden">
        <AdminSidebar
          role="super_admin"
          onLogout={handleLogout}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          key="admin-appointments-sidebar"
        />

        <div className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out h-screen overflow-hidden",
          sidebarOpen ? "lg:ml-0" : "lg:ml-1"
        )}>
          <header className="bg-white shadow-sm border-b shrink-0">
            <div className="flex items-center justify-between px-4 py-4 lg:px-8">
              <div className="flex items-center gap-4">
                <AdminMobileSidebar
                  role="super_admin"
                  onLogout={handleLogout}
                  isOpen={sidebarOpen}
                  onToggle={() => setSidebarOpen(!sidebarOpen)}
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Appointment Calendar</h1>
                  <p className="text-sm text-gray-600">Manage all bookings from website and mobile</p>
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
                        Recent appointment updates
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

          {/* Main content with pink scrollbar */}
          <div className="flex-1 overflow-auto pink-scrollbar min-h-0">
            <div className="h-full p-4 lg:p-8">
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'calendar' | 'advanced-calendar' | 'list' | 'approvals' | 'product-orders')}>
                <div className="flex items-center justify-between mb-6">
                  <TabsList>
                    <TabsTrigger value="calendar">Calendar View</TabsTrigger>
                    <TabsTrigger value="advanced-calendar">Advanced Calendar</TabsTrigger>
                    <TabsTrigger value="approvals">Booking Approvals</TabsTrigger>
                  </TabsList>
                </div>

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
                              <span className="font-semibold">{allAppointments.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-600">Today's Appointments:</span>
                              <span className="font-semibold">
                                {allAppointments.filter(apt => apt.date === new Date().toISOString().split('T')[0]).length}
                              </span>
                            </div>
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
                              Select a date to view appointments.
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
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setSelectedDate(undefined)}>
                              Clear Date Filter
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
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
                                  ? 'Try changing your filters'
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
                                      <div className="flex items-center gap-3 mb-2">
                                        <div className={`w-3 h-3 rounded-full ${getStatusColor(appointment.status).split(' ')[0]}`}></div>
                                        <h3 className="font-semibold">{appointment.customer}</h3>
                                        <Badge className={getStatusColor(appointment.status)}>
                                          {appointment.status}
                                        </Badge>
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
                    staff={staffMembers as any}
                    showFullDetails={true}
                  />
                </TabsContent>

                <TabsContent value="approvals" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="md:col-span-3">
                      <CardHeader className="pb-2 pt-3 px-4">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          Filter by Date
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4">
                        <div className="scale-90 origin-top-left">
                          <MobileFriendlyCalendar
                            selectedDate={selectedDate}
                            onDateSelect={setSelectedDate}
                            appointments={allAppointments}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="md:col-span-1">
                      <CardHeader className="pb-2 pt-3 px-4">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Filter className="w-4 h-4 text-primary" />
                          Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4">
                        <div className="space-y-3">
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all" className="text-xs">All Status</SelectItem>
                              <SelectItem value="upcoming" className="text-xs">Upcoming</SelectItem>
                              <SelectItem value="approved" className="text-xs">Approved</SelectItem>
                              <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                              <SelectItem value="rejected" className="text-xs">Rejected</SelectItem>
                            </SelectContent>
                          </Select>

                          <div className="flex flex-wrap gap-1">
                            {selectedDate && (
                              <Badge className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5">
                                <Calendar className="w-2.5 h-2.5 mr-1" />
                                {format(selectedDate, 'dd/MM')}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedDate(undefined)}
                                  className="h-3 w-3 p-0 ml-1"
                                >
                                  <XCircle className="w-2.5 h-2.5" />
                                </Button>
                              </Badge>
                            )}
                            {statusFilter !== 'all' && (
                              <Badge className={`${getStatusColor(statusFilter)} text-[10px] px-2 py-0.5`}>
                                {statusFilter}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setStatusFilter('all')}
                                  className="h-3 w-3 p-0 ml-1"
                                >
                                  <XCircle className="w-2.5 h-2.5" />
                                </Button>
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    {loading.bookings ? (
                      <div className="text-center py-16 px-8">
                        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading bookings...</p>
                      </div>
                    ) : filteredAppointments.length === 0 ? (
                      <div className="text-center py-16 px-8 bg-white rounded-lg border">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Calendar className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-2xl font-semibold text-gray-600 mb-3">No appointments found</h3>
                        <p className="text-gray-500 text-lg">
                          {selectedDate || statusFilter !== 'all' 
                            ? 'Try changing your filters' 
                            : 'No appointments available'}
                        </p>
                        {(selectedDate || statusFilter !== 'all') && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedDate(undefined);
                              setStatusFilter('all');
                            }}
                            className="mt-4"
                          >
                            Clear All Filters
                          </Button>
                        )}
                      </div>
                    ) : (
                      filteredAppointments.map((appointment) => (
                        <Card key={appointment.id.toString()} className={`border-l-4 shadow-sm hover:shadow-md transition-all ${
                          appointment.status === 'upcoming' ? 'border-l-blue-500' :
                          appointment.status === 'approved' ? 'border-l-purple-500' :
                          appointment.status === 'completed' ? 'border-l-green-500' :
                          appointment.status === 'rejected' ? 'border-l-red-500' :
                          'border-l-gray-500'
                        }`}>
                          <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                              <div className="md:col-span-3">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-primary" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm">{appointment.customer}</p>
                                    <p className="text-xs text-gray-600 truncate">{appointment.service}</p>
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
                                {appointment.status === 'upcoming' && appointment.firebaseId && (
                                  <>
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white flex-1 text-xs h-8"
                                      onClick={() => handleApproveBooking(appointment.firebaseId as string)}
                                    >
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="bg-red-600 hover:bg-red-700 text-white flex-1 text-xs h-8"
                                      onClick={() => handleRejectBooking(appointment.firebaseId as string)}
                                    >
                                      <XCircle className="w-3 h-3 mr-1" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                                
                                {appointment.status === 'approved' && appointment.firebaseId && (
                                  <>
                                    <Button
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700 text-white flex-1 text-xs h-8"
                                      onClick={() => handleStatusChange(appointment.firebaseId as string, 'completed')}
                                    >
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Complete
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="bg-red-600 hover:bg-red-700 text-white flex-1 text-xs h-8"
                                      onClick={() => handleRejectBooking(appointment.firebaseId as string)}
                                    >
                                      <XCircle className="w-3 h-3 mr-1" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                                
                                {appointment.status === 'completed' && appointment.firebaseId && (
                                  <div className="flex items-center justify-center w-full text-sm text-green-600 font-medium">
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Completed
                                  </div>
                                )}
                                
                                {appointment.status === 'rejected' && appointment.firebaseId && (
                                  <div className="flex items-center justify-center w-full text-sm text-red-600 font-medium">
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Rejected
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>

                  {filteredAppointments.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4">
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-3 flex items-center justify-between">
                          <div>
                            <p className="text-xs text-blue-700 font-medium">Upcoming</p>
                            <p className="text-lg font-bold text-blue-800">
                              {allAppointments.filter(a => a.status === 'upcoming').length}
                            </p>
                          </div>
                          <Calendar className="w-5 h-5 text-blue-500" />
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-purple-50 border-purple-200">
                        <CardContent className="p-3 flex items-center justify-between">
                          <div>
                            <p className="text-xs text-purple-700 font-medium">Approved</p>
                            <p className="text-lg font-bold text-purple-800">
                              {allAppointments.filter(a => a.status === 'approved').length}
                            </p>
                          </div>
                          <CheckCircle className="w-5 h-5 text-purple-500" />
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-green-50 border-green-200">
                        <CardContent className="p-3 flex items-center justify-between">
                          <div>
                            <p className="text-xs text-green-700 font-medium">Completed</p>
                            <p className="text-lg font-bold text-green-800">
                              {allAppointments.filter(a => a.status === 'completed').length}
                            </p>
                          </div>
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-red-50 border-red-200">
                        <CardContent className="p-3 flex items-center justify-between">
                          <div>
                            <p className="text-xs text-red-700 font-medium">Rejected</p>
                            <p className="text-lg font-bold text-red-800">
                              {allAppointments.filter(a => a.status === 'rejected').length}
                            </p>
                          </div>
                          <XCircle className="w-5 h-5 text-red-500" />
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

<Sheet open={showAppointmentDetails} onOpenChange={setShowAppointmentDetails}>
  <SheetContent className="w-full sm:max-w-3xl overflow-y-auto p-0">
    <div className="sticky top-0 bg-white border-b z-10 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
          <Calendar className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Appointment Details</h2>
          <p className="text-sm text-gray-500">Booking information</p>
        </div>
      </div>
      {selectedAppointment?.status === 'completed' && (
        <Button
          onClick={() => handleGenerateInvoiceClick(selectedAppointment)}
          className="bg-primary hover:bg-primary/90 text-white gap-2"
          size="sm"
        >
          <Receipt className="w-4 h-4" />
          Generate Invoice
        </Button>
      )}
    </div>

    <div className="p-6 space-y-6">
      {selectedAppointment && (
        <>
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <Badge className={`${getStatusColor(selectedAppointment.status)} px-3 py-1.5 text-sm`}>
              {getStatusIcon(selectedAppointment.status)}
              <span className="ml-2 capitalize">{selectedAppointment.status}</span>
            </Badge>
            <span className="text-sm text-gray-500">
              Ref: {selectedAppointment.bookingNumber || `BK-${selectedAppointment.id}`}
            </span>
          </div>

          {/* Customer Information - Clean Card */}
          <div className="bg-gray-50/80 rounded-xl p-5 border">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Full Name</p>
                <p className="font-medium text-gray-900">{selectedAppointment.customer}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Email Address</p>
                <p className="font-medium text-gray-900 break-all">{selectedAppointment.email || '—'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Phone Number</p>
                <p className="font-medium text-gray-900">{selectedAppointment.phone || '—'}</p>
              </div>
            </div>
          </div>

          {/* Services List - Clean Table */}
          <div className="bg-gray-50/80 rounded-xl p-5 border">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Scissors className="w-4 h-4 text-primary" />
              Services
            </h3>
            
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Service</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Branch</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">Staff</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selectedAppointment.serviceDetails && selectedAppointment.serviceDetails.length > 0 ? (
                    selectedAppointment.serviceDetails.map((service, idx) => (
                      <tr key={idx} className="bg-white hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{service.name || service.serviceName}</td>
                        <td className="px-4 py-3">{service.branch || selectedAppointment.branch}</td>
                        <td className="px-4 py-3">{service.staff || selectedAppointment.barber}</td>
                        <td className="px-4 py-3 text-right">AED {(service.price || 0).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : selectedAppointment.services && selectedAppointment.services.length > 0 ? (
                    selectedAppointment.services.map((service, idx) => (
                      <tr key={idx} className="bg-white hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{service}</td>
                        <td className="px-4 py-3">{selectedAppointment.branch}</td>
                        <td className="px-4 py-3">{selectedAppointment.barber}</td>
                        <td className="px-4 py-3 text-right">
                          AED {(selectedAppointment.price / selectedAppointment.services!.length).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="bg-white">
                      <td className="px-4 py-3 font-medium">{selectedAppointment.service}</td>
                      <td className="px-4 py-3">{selectedAppointment.branch}</td>
                      <td className="px-4 py-3">{selectedAppointment.barber}</td>
                      <td className="px-4 py-3 text-right">AED {selectedAppointment.price.toFixed(2)}</td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right font-medium">Total:</td>
                    <td className="px-4 py-3 text-right font-bold">AED {selectedAppointment.price.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Date, Time, Duration */}
          <div className="bg-gray-50/80 rounded-xl p-5 border">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Schedule
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Date</p>
                <p className="font-medium text-gray-900">{selectedAppointment.date}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Time</p>
                <p className="font-medium text-gray-900">{selectedAppointment.time}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Duration</p>
                <p className="font-medium text-gray-900">{selectedAppointment.duration}</p>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-gray-50/80 rounded-xl p-5 border">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Payment Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Payment Method</p>
                <p className="font-medium text-gray-900">
                  {selectedAppointment.paymentMethods?.length 
                    ? selectedAppointment.paymentMethods.join(', ') 
                    : selectedAppointment.paymentMethod || 'Not specified'}
                </p>
              </div>
              {selectedAppointment.cardLast4Digits && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Card (Last 4)</p>
                  <p className="font-medium text-gray-900">•••• {selectedAppointment.cardLast4Digits}</p>
                </div>
              )}
              {selectedAppointment.trnNumber && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">TRN Number</p>
                  <p className="font-medium text-gray-900">{selectedAppointment.trnNumber}</p>
                </div>
              )}
            </div>

            {/* Payment Breakdown */}
            {selectedAppointment.paymentAmounts && Object.values(selectedAppointment.paymentAmounts).some(v => v > 0) && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs font-medium text-gray-500 mb-2">Payment Breakdown</p>
                <div className="space-y-1.5">
                  {Object.entries(selectedAppointment.paymentAmounts).map(([method, amount]) => 
                    amount > 0 ? (
                      <div key={method} className="flex justify-between text-sm">
                        <span className="text-gray-600 capitalize">{method}:</span>
                        <span className="font-medium">AED {amount.toFixed(2)}</span>
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          {selectedAppointment.notes && (
            <div className="bg-gray-50/80 rounded-xl p-5 border">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Notes
              </h3>
              <p className="text-gray-700 bg-white p-3 rounded-lg border">{selectedAppointment.notes}</p>
            </div>
          )}
        </>
      )}
    </div>
  </SheetContent>
</Sheet>

      <Sheet open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <SheetContent className="w-[98vw] sm:max-w-6xl rounded-2xl z-[60] overflow-y-auto">
          <SheetHeader className="border-b pb-4 mb-6">
            <SheetTitle className="text-xl font-semibold">{editingBookingId ? 'Edit Booking' : 'Create New Booking'}</SheetTitle>
            <SheetDescription className="text-base">
              Capture customer details and select one or more services.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 pb-6">
            <div className="space-y-4 p-6 bg-gray-50/50 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Customer Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2 md:col-span-3">
                  <label className="text-sm font-medium text-gray-700">Name *</label>
                  <Input
                    placeholder="Customer name"
                    value={bookingData.customer}
                    onChange={(e) => setBookingData({...bookingData, customer: e.target.value})}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Phone</label>
                  <Input
                    placeholder="Phone number"
                    value={bookingData.phone}
                    onChange={(e) => setBookingData({...bookingData, phone: e.target.value})}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={bookingData.email}
                    onChange={(e) => setBookingData({...bookingData, email: e.target.value})}
                    className="h-11"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 p-6 bg-gray-50/50 rounded-lg border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-primary" />
                  Services
                </h3>
                {selectedServices.length > 0 && (
                  <Badge className="bg-green-500 text-white">
                    {selectedServices.length} Service(s)
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Branch</label>
                  <Select 
                    value={tempServiceData.branch} 
                    onValueChange={(value) => {
                      setTempServiceData({...tempServiceData, branch: value, service: '', staff: '', price: 0});
                      fetchServicesForBranch(value);
                    }}
                  >
                    <SelectTrigger className="h-11 w-full [&>span]:block [&>span]:truncate">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.firebaseId} value={branch.name} className="max-w-full">
                          <span className="block truncate">{branch.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-4">
                  <label className="text-sm font-medium text-gray-700">Service</label>
                  <Select 
                    value={tempServiceData.service}
                    onValueChange={(value) => {
                      const service = branchServices.find(s => s.name === value);
                      setTempServiceData({
                        ...tempServiceData, 
                        service: value, 
                        price: service?.price || 0,
                        serviceId: service?.firebaseId
                      });
                      fetchStaffForBranch(tempServiceData.branch);
                    }}
                    disabled={!tempServiceData.branch}
                  >
                    <SelectTrigger className="h-11 w-full [&>span]:block [&>span]:truncate">
                      <SelectValue placeholder={tempServiceData.branch ? "Select service" : "First select branch"} />
                    </SelectTrigger>
                    <SelectContent>
                      {branchServices.map((service) => (
                        <SelectItem key={service.firebaseId} value={service.name}>
                          <div className="flex justify-between items-center w-full gap-3 min-w-0">
                            <span className="truncate">{service.name}</span>
                            <span className="text-primary font-medium ml-2 shrink-0">AED {service.price}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-3">
                  <label className="text-sm font-medium text-gray-700">Staff</label>
                  <Select 
                    value={tempServiceData.staff}
                    onValueChange={(value) => setTempServiceData({...tempServiceData, staff: value})}
                    disabled={!tempServiceData.service}
                  >
                    <SelectTrigger className="h-11 w-full [&>span]:block [&>span]:truncate">
                      <SelectValue placeholder={tempServiceData.service ? "Select staff" : "First select service"} />
                    </SelectTrigger>
                    <SelectContent>
                      {branchStaff.map((staff) => (
                        <SelectItem key={staff.firebaseId} value={staff.name} className="max-w-full">
                          <span className="block truncate">{staff.name} - {staff.role}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end md:col-span-2">
                  <Button
                    type="button"
                    onClick={handleAddService}
                    disabled={!tempServiceData.branch || !tempServiceData.service || !tempServiceData.staff}
                    className="bg-secondary hover:bg-secondary/90 text-primary h-11"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>

              {selectedServices.length > 0 ? (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-700 mb-3">Selected Services</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left">Branch</th>
                          <th className="px-4 py-3 text-left">Service</th>
                          <th className="px-4 py-3 text-left">Staff</th>
                          <th className="px-4 py-3 text-right">Price</th>
                          <th className="px-4 py-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {selectedServices.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3">{item.branch}</td>
                            <td className="px-4 py-3 font-medium">{item.service}</td>
                            <td className="px-4 py-3">{item.staff}</td>
                            <td className="px-4 py-3 text-right font-medium">AED {item.price}</td>
                            <td className="px-4 py-3 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveService(index)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 font-medium">
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-right">Total:</td>
                          <td className="px-4 py-3 text-right font-bold">
                            AED {selectedServices.reduce((sum, item) => sum + (item.price || 0), 0)}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                  <Scissors className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No services added yet</p>
                  <p className="text-xs text-gray-500">Add services using the form above</p>
                </div>
              )}
            </div>


            <div className="space-y-4 p-6 bg-gray-50/50 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Date & Time
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          </div>

          <div className="flex justify-end gap-4 pt-8 border-t bg-white px-6 py-4 -mx-6 -mb-6">
            <Button variant="outline" onClick={() => setShowBookingDialog(false)} className="px-6 h-11">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitBooking} 
              disabled={selectedServices.length === 0}
              className="px-6 h-11 bg-primary hover:bg-primary/90"
            >
              {editingBookingId
                ? `Update Booking (${selectedServices.length} service${selectedServices.length !== 1 ? 's' : ''})`
                : `Create Booking (${selectedServices.length} service${selectedServices.length !== 1 ? 's' : ''})`}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* FIXED: Invoice Modal with Multiple Services + Tip Per Staff */}
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
              Edit service details, add tips per staff, and download PDF
            </SheetDescription>
          </SheetHeader>

          {invoiceData && selectedAppointmentForInvoice && (
            <div className="space-y-6">
              <div className="space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                
                {/* Customer Info */}
                <div className="space-y-4 p-4 bg-white border rounded-lg">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Customer Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Name</label>
                      <Input
                        value={invoiceData.customer}
                        onChange={(e) => handleInvoiceDataChange('customer', e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <Input
                        value={invoiceData.email}
                        onChange={(e) => handleInvoiceDataChange('email', e.target.value)}
                        className="h-10"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Phone</label>
                      <Input
                        value={invoiceData.phone}
                        onChange={(e) => handleInvoiceDataChange('phone', e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Services with Branch, Staff, Tip */}
                <div className="space-y-4 p-4 bg-white border rounded-lg">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-primary" />
                    Service Details
                  </h4>
                  
                  <div className="space-y-4">
                    {invoiceData.serviceDetails?.map((service, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="outline" className="bg-primary/10">
                            Service #{index + 1}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {/* Service Name */}
                          <div>
                            <label className="text-xs text-gray-500">Service</label>
                            <Input
                              value={service.serviceName}
                              onChange={(e) => {
                                const newDetails = [...(invoiceData.serviceDetails || [])];
                                newDetails[index].serviceName = e.target.value;
                                handleInvoiceDataChange('serviceDetails', newDetails);
                              }}
                              className="h-9"
                            />
                          </div>
                          
                          {/* Branch */}
                          <div>
                            <label className="text-xs text-gray-500">Branch</label>
                            <Input
                              value={service.branch}
                              onChange={(e) => {
                                const newDetails = [...(invoiceData.serviceDetails || [])];
                                newDetails[index].branch = e.target.value;
                                handleInvoiceDataChange('serviceDetails', newDetails);
                              }}
                              className="h-9"
                            />
                          </div>
                          
                          {/* Staff */}
                          <div>
                            <label className="text-xs text-gray-500">Staff</label>
                            <Input
                              value={service.staff}
                              onChange={(e) => {
                                const newDetails = [...(invoiceData.serviceDetails || [])];
                                newDetails[index].staff = e.target.value;
                                handleInvoiceDataChange('serviceDetails', newDetails);
                              }}
                              className="h-9"
                            />
                          </div>
                          
                          {/* Price */}
                          <div>
                            <label className="text-xs text-gray-500">Price</label>
                            <Input
                              type="number"
                              value={service.price}
                              onChange={(e) => {
                                const newDetails = [...(invoiceData.serviceDetails || [])];
                                newDetails[index].price = parseFloat(e.target.value) || 0;
                                handleInvoiceDataChange('serviceDetails', newDetails);
                              }}
                              className="h-9"
                            />
                          </div>
                          
                          {/* Tip Field - Important */}
                          <div className="md:col-span-4">
                            <label className="text-xs text-gray-500 flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-500" />
                              Tip for {service.staff}
                            </label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                placeholder="Tip amount"
                                value={service.tip || 0}
                                onChange={(e) => {
                                  const newDetails = [...(invoiceData.serviceDetails || [])];
                                  newDetails[index].tip = parseFloat(e.target.value) || 0;
                                  handleInvoiceDataChange('serviceDetails', newDetails);
                                }}
                                className="h-9 flex-1"
                              />
                              <Select 
                                value={(service.tip || 0) > 0 ? 'custom' : 'no-tip'}
                                onValueChange={(val) => {
                                  const newDetails = [...(invoiceData.serviceDetails || [])];
                                  if (val === '5') newDetails[index].tip = service.price * 0.05;
                                  else if (val === '10') newDetails[index].tip = service.price * 0.10;
                                  else if (val === '15') newDetails[index].tip = service.price * 0.15;
                                  else if (val === '20') newDetails[index].tip = service.price * 0.20;
                                  else if (val === 'custom') {}
                                  else newDetails[index].tip = 0;
                                  handleInvoiceDataChange('serviceDetails', newDetails);
                                }}
                              >
                                <SelectTrigger className="w-28">
                                  <SelectValue placeholder="Tip %" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="no-tip">No Tip</SelectItem>
                                  <SelectItem value="5">5%</SelectItem>
                                  <SelectItem value="10">10%</SelectItem>
                                  <SelectItem value="15">15%</SelectItem>
                                  <SelectItem value="20">20%</SelectItem>
                                  <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing Summary with Tips */}
                <div className="space-y-4 p-4 bg-white border rounded-lg">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-primary" />
                    Pricing Summary
                  </h4>
                  
                  {invoiceData.serviceDetails?.map((service, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {service.serviceName} ({service.staff})
                      </span>
                      <div className="text-right">
                        <div>AED {service.price.toFixed(2)}</div>
                        {service.tip ? (
                          <div className="text-xs text-green-600">+ Tip: AED {service.tip.toFixed(2)}</div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between font-medium">
                      <span>Subtotal:</span>
                      <span>AED {invoiceData.subtotal?.toFixed(2) || '0.00'}</span>
                    </div>
                    
                    {invoiceData.serviceDetails?.some(s => s.tip) && (
                      <div className="flex justify-between text-green-600">
                        <span>Total Tips:</span>
                        <span>
                          AED {invoiceData.serviceDetails.reduce((sum, s) => sum + (s.tip || 0), 0).toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-lg font-bold pt-3 border-t mt-3">
                      <span>Grand Total:</span>
                      <span className="text-green-600">
                        AED {((invoiceData.subtotal || 0) + (invoiceData.serviceDetails?.reduce((sum, s) => sum + (s.tip || 0), 0) || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-4 p-4 bg-white border rounded-lg">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Payment Method
                  </h4>
                  <Select 
                    value={invoiceData.paymentMethod} 
                    onValueChange={(value) => handleInvoiceDataChange('paymentMethod', value)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Credit Card">Credit Card</SelectItem>
                      <SelectItem value="Debit Card">Debit Card</SelectItem>
                      <SelectItem value="Digital Wallet">Digital Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-6 border-t sticky bottom-0 bg-white">
                <Button variant="outline" onClick={() => setShowInvoiceModal(false)} className="px-6 h-11">
                  Cancel
                </Button>
                <Button onClick={handleDownloadInvoicePDF} className="px-6 h-11 bg-primary hover:bg-primary/90 gap-2">
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </ProtectedRoute>
  );
}