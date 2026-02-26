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
import { collection, getDocs, query, orderBy, where, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  serviceName: string;
  createdBy: string;
  id: string;
  firebaseId: string;
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  services: string[]; // Array for multiple services
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
  // COMPLETE FIELDS
  cardLast4Digits?: string;
  trnNumber?: string;
  teamMembers?: Array<{name: string, tip: number}>;
  products?: Array<{name: string, category: string, price: number, quantity: number}>;
  paymentMethods?: Array<'cash' | 'card' | 'check' | 'digital'>;
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
  avatar: string;
  status: string;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

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
  id: string | number;
  firebaseId?: string;
  customer: string;
  service: string;
  services?: string[]; // Array for multiple services
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
  // COMPLETE FIELDS
  cardLast4Digits?: string;
  trnNumber?: string;
  teamMembers?: Array<{name: string, tip: number}>;
  products?: Array<{name: string, category: string, price: number, quantity: number}>;
  paymentMethods?: Array<'cash' | 'card' | 'check' | 'digital'>;
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

// UPDATED: Added services array
interface BookingFormData {
  customer: string;
  phone: string;
  email: string;
  service: string;
  services: string[]; // Array for multiple services
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
  paymentMethods: Array<'cash' | 'card' | 'check' | 'digital'>;
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

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
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

const fetchBookings = async (addNotification: (notification: { type: string; title: string; message: string }) => void): Promise<FirebaseBooking[]> => {
  try {
    const bookingsRef = collection(db, "bookings");
    const q = query(bookingsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    
    const bookings: FirebaseBooking[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // UPDATED: Handle multiple services
      const serviceName = data.serviceName || "Unknown Service";
      const services = Array.isArray(data.services) ? data.services : [serviceName];
      const serviceDetails = Array.isArray(data.servicesDetails) ? data.servicesDetails : [];
      
      const branchNames = Array.isArray(data.branchNames) 
        ? data.branchNames.join(", ") 
        : "All Branches";
      
      const staffName = data.staffName || data.staff || "Not Assigned";
      const staffId = data.staffId || "";
      const staffRole = data.staffRole || "hairstylist";
      
      const bookingDate = data.date || 
        (data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : 
        new Date().toISOString().split('T')[0]);
      
      const bookingTime = data.time || data.timeSlot || "10:00";
      const serviceDuration = data.serviceDuration || 60;
      const servicePrice = data.servicePrice || data.totalAmount || 0;
      const customerEmail = data.customerEmail || "";
      const customerPhone = data.customerPhone || "";
      const customerName = data.customerName || "Unknown Customer";
      
      const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
      const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date();
      
      // Parse array data
      const teamMembers = Array.isArray(data.teamMembers) ? data.teamMembers : [];
      const products = Array.isArray(data.products) ? data.products : [];
      const paymentMethods = Array.isArray(data.paymentMethods) ? data.paymentMethods : [];
      const paymentAmounts = data.paymentAmounts || { cash: 0, card: 0, check: 0, digital: 0 };
      
      const bookingData: FirebaseBooking = {
        id: doc.id,
        firebaseId: doc.id,
        bookingNumber: data.bookingNumber || `BK-${doc.id.substring(0, 5).toUpperCase()}`,
        customerName,
        customerEmail,
        customerPhone,
        services, // Array of services
        serviceDetails,
        totalDuration: serviceDuration,
        totalPrice: servicePrice,
        status: data.status || "pending",
        bookingDate,
        bookingTime,
        paymentMethod: data.paymentMethod || "cash",
        paymentStatus: data.paymentStatus || "pending",
        branch: branchNames,
        staff: staffName,
        staffId,
        staffRole,
        notes: data.notes || "",
        serviceCategory: data.serviceCategory || "",
        serviceId: data.serviceId || "",
        timeSlot: data.timeSlot || bookingTime,
        pointsAwarded: data.pointsAwarded || false,
        createdAt,
        updatedAt,
        customerId: data.customerId || "",
        createdBy: data.createdBy || '',
        // COMPLETE FIELDS
        cardLast4Digits: data.cardLast4Digits || "",
        trnNumber: data.trnNumber || "",
        teamMembers,
        products,
        paymentMethods,
        paymentAmounts,
        discount: data.discount || 0,
        discountType: data.discountType || 'fixed',
        serviceTip: data.serviceTip || 0,
        serviceCharges: data.serviceCharges || 0,
        tax: data.tax || 5,
        serviceName: ''
      };
      bookings.push(bookingData);
    });
    
    console.log("📊 Firebase Bookings Loaded with Complete Data:", {
      count: bookings.length,
      sample: bookings[0] ? {
        services: bookings[0].services,
        teamMembers: bookings[0].teamMembers,
        products: bookings[0].products,
        paymentMethods: bookings[0].paymentMethods
      } : 'No bookings'
    });
    
    return bookings;
  } catch (error) {
    console.error("Error fetching bookings:", error);
    addNotification({
      type: 'error',
      title: 'Bookings Load Error',
      message: 'Failed to load bookings from Firebase'
    });
    return [];
  }
};

const fetchStaff = async (): Promise<FirebaseStaff[]> => {
  try {
    const staffRef = collection(db, "staff");
    const q = query(staffRef, where("status", "==", "active"));
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

// ===================== UPDATED: CREATE BOOKING WITH MULTIPLE SERVICES =====================
const createBookingInFirebase = async (
  bookingData: BookingFormData, 
  selectedServices: FirebaseService[], // Array of services
  selectedCategory: FirebaseCategory | null,
  selectedBranch: FirebaseBranch | null,
  addNotification: (notification: { type: 'error' | 'success' | 'warning' | 'info'; title: string; message: string }) => void
): Promise<{success: boolean, bookingId?: string, booking?: FirebaseBooking}> => {
  try {
    // Calculate pricing with multiple services
    const servicesPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
    const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
    const productsTotal = bookingData.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    
    let subtotal = servicesPrice + productsTotal + bookingData.serviceCharges;
    
    // Apply discount
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
    
    // Get staff ID from team members
    const primaryStaff = bookingData.teamMembers.find(tm => tm.name === bookingData.barber);
    
    // Create a unique booking number
    const bookingNumber = `ADMIN-${Date.now()}`;
    
    // Prepare service details array
    const serviceDetails = selectedServices.map(service => ({
      id: service.firebaseId,
      name: service.name,
      price: service.price,
      duration: service.duration,
      category: service.category
    }));
    
    // Prepare booking data for Firebase
    const firebaseBookingData = {
      // Customer Information
      customerName: bookingData.customer,
      customerEmail: bookingData.email || "",
      customerPhone: bookingData.phone || "",
      customerId: "",
      
      // UPDATED: MULTIPLE SERVICES INFORMATION
      serviceName: bookingData.services[0] || "Multiple Services",
      services: bookingData.services, // Array of service names
      servicesDetails: serviceDetails, // Array of service details
      serviceCategory: selectedCategory?.name || selectedServices[0]?.category || "Multiple",
      serviceDuration: totalDuration,
      servicePrice: servicesPrice,
      totalAmount: totalAmount,
      totalDuration: totalDuration,
      
      // Staff/Barber Information
      staff: bookingData.barber,
      staffName: bookingData.barber,
      staffId: primaryStaff?.name || bookingData.barber,
      staffRole: "hairstylist",
      
      // Date & Time
      date: bookingData.date,
      time: bookingData.time,
      timeSlot: bookingData.time,
      bookingDate: bookingData.date,
      bookingTime: bookingData.time,
      
      // Status & Payment
      status: bookingData.status || 'pending',
      paymentMethod: bookingData.paymentMethods.length > 0 
        ? bookingData.paymentMethods.join(', ') 
        : 'cash',
      paymentStatus: bookingData.status === 'completed' ? 'paid' : 'pending',
      
      // Branch & Location
      branch: selectedBranch?.name || selectedServices[0]?.branchNames?.[0] || "All Branches",
      branchNames: selectedBranch?.name ? [selectedBranch.name] : (selectedServices[0]?.branchNames || ["All Branches"]),
      
      // Category
      category: selectedCategory?.name || "",
      categoryId: selectedCategory?.firebaseId || "",
      
      // Payment Details
      cardLast4Digits: bookingData.cardLast4Digits || "",
      trnNumber: bookingData.trnNumber || "",
      paymentAmounts: bookingData.paymentAmounts,
      
      // Additional Details
      notes: bookingData.notes || '',
      pointsAwarded: false,
      
      // Products (if any)
      products: bookingData.products.map(product => ({
        productName: product.name,
        name: product.name,
        category: product.category,
        price: product.price,
        quantity: product.quantity,
        total: product.price * product.quantity
      })),
      
      // Team Members
      teamMembers: bookingData.teamMembers,
      
      // Pricing Details
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
      
      // Payment Methods
      paymentMethods: bookingData.paymentMethods,
      
      // Source and unique identifiers
      source: 'admin_panel',
      createdBy: 'admin',
      bookingNumber: bookingNumber,
      
      // Timestamps
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    console.log("📤 Saving to Firebase with Complete Data:", {
      services: bookingData.services,
      serviceDetails,
      paymentMethods: bookingData.paymentMethods,
      teamMembers: bookingData.teamMembers,
      products: bookingData.products
    });

    // Add to Firebase
    const bookingsRef = collection(db, "bookings");
    const docRef = await addDoc(bookingsRef, firebaseBookingData);
    
    console.log("✅ Booking created in Firebase with ID:", docRef.id);
    
    // Create booking object for state
    const newBooking: FirebaseBooking = {
      id: docRef.id,
      firebaseId: docRef.id,
      bookingNumber: bookingNumber,
      customerName: bookingData.customer,
      customerEmail: bookingData.email || "",
      customerPhone: bookingData.phone || "",
      services: bookingData.services,
      serviceDetails: serviceDetails,
      totalDuration: totalDuration,
      totalPrice: totalAmount,
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
      // ALL FIELDS
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

// ===================== UPDATED: PDF GENERATION WITH MULTIPLE SERVICES =====================
const generatePDFInvoice = (invoiceData: ExtendedInvoiceData) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // ============ HEADER SECTION ============
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text('MAN OF CAVE', 20, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text('BASEMENT, NEAR TO CARRYFOUR, MARINA MALL', 20, 28);
    doc.text('Contact : 028766460', 20, 33);
    doc.text('Email : manofcave2020@gmail.com', 20, 38);
    doc.text('Website : www.manofcave.com', 20, 43);
    doc.text('VAT No : 104943305300003', 20, 48);
    
    // Invoice Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text('TAX INVOICE', pageWidth - 70, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text('(Branch : Marina Mall Branch)', pageWidth - 90, 28);
    
    // Horizontal Line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(20, 55, pageWidth - 20, 55);
    
    // ============ CUSTOMER INFORMATION ============
    const customerY = 65;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text('Customer Information:', 20, customerY);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    // Customer Details
    const customerDetails = [
      ['Customer Name', invoiceData.customer],
      ['Mobile No', invoiceData.phone || '971585389633'],
      ['Email', invoiceData.email || 'N/A'],
      ['Wallet Balance', 'AED 1,238.00/-'],
      ['Customer Address', invoiceData.customerAddress || 'N/A'],
      ['TRN Number', invoiceData.trnNumber || 'N/A']
    ];
    
    let yPos = customerY + 8;
    customerDetails.forEach(([label, value]) => {
      if (value !== 'N/A') {
        doc.text(`${label} : ${value}`, 20, yPos);
        yPos += 6;
      }
    });
    
    // Invoice Details
    const invoiceY = customerY;
    const invoiceDetails = [
      ['Invoice No', invoiceData.invoiceNumber || '#INV6584'],
      ['Invoice Date', `${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`],
      ['Card Last 4 Digits', invoiceData.cardLast4Digits || 'N/A'],
      ['Payment Method', invoiceData.paymentMethod || 'Multiple']
    ];
    
    yPos = invoiceY;
    invoiceDetails.forEach(([label, value]) => {
      if (value !== 'N/A') {
        doc.text(`${label} : ${value}`, pageWidth - 80, yPos);
        yPos += 6;
      }
    });
    
    // ============ SERVICES & PRODUCTS TABLE ============
    const tableY = Math.max(customerY + 35, invoiceY + 25);
    
    // Table Headers
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    
    // Draw table border
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(20, tableY - 5, pageWidth - 40, 100);
    
    // Table Headers
    const headers = ['Service & Product', 'Provider', 'Rate', 'Dis', 'Qty', 'Total'];
    const colPositions = [25, 95, 135, 160, 180, pageWidth - 50];
    
    headers.forEach((header, index) => {
      doc.text(header, colPositions[index], tableY);
    });
    
    // Horizontal line under headers
    doc.line(20, tableY + 2, pageWidth - 20, tableY + 2);
    
    // Table Rows
    let currentY = tableY + 10;
    
    // UPDATED: Multiple Services
    if (invoiceData.services && Array.isArray(invoiceData.services)) {
      invoiceData.services.forEach((service, index) => {
        doc.setFont("helvetica", "normal");
        const servicePrice = 85;
        const discountPercent = 25;
        const discountedPrice = servicePrice * (1 - discountPercent/100);
        
        doc.text(`Service ${service}`, 25, currentY);
        doc.text(invoiceData.barber || 'Vasid', 95, currentY);
        doc.text(`AED ${servicePrice.toFixed(2)}`, 135, currentY);
        doc.text(`${discountPercent}`, 160, currentY);
        doc.text('1', 180, currentY);
        doc.text(`AED ${discountedPrice.toFixed(2)}`, pageWidth - 50, currentY);
        currentY += 8;
      });
    } else {
      // Single Service
      if (invoiceData.service) {
        doc.setFont("helvetica", "normal");
        const servicePrice = invoiceData.price || 0;
        const discountPercent = 25;
        const discountedPrice = servicePrice * (1 - discountPercent/100);
        
        doc.text(`Service ${invoiceData.service}`, 25, currentY);
        doc.text(invoiceData.barber || 'Vasid', 95, currentY);
        doc.text(`AED ${servicePrice.toFixed(2)}`, 135, currentY);
        doc.text(`${discountPercent}`, 160, currentY);
        doc.text('1', 180, currentY);
        doc.text(`AED ${discountedPrice.toFixed(2)}`, pageWidth - 50, currentY);
        currentY += 8;
      }
    }
    
    // Additional Products
    if (invoiceData.items && invoiceData.items.length > 0) {
      invoiceData.items.forEach((item) => {
        doc.text(`Product ${item.name}`, 25, currentY);
        doc.text('N/A', 95, currentY);
        doc.text(`AED ${item.price.toFixed(2)}`, 135, currentY);
        doc.text('0', 160, currentY);
        doc.text(item.quantity.toString(), 180, currentY);
        doc.text(`AED ${item.total.toFixed(2)}`, pageWidth - 50, currentY);
        currentY += 8;
      });
    }
    
    // Sample service
    doc.text('Service FOOT MASSAGE 30MINS', 25, currentY);
    doc.text('Devi', 95, currentY);
    doc.text('AED 85.00', 135, currentY);
    doc.text('25', 160, currentY);
    doc.text('1', 180, currentY);
    doc.text('AED 63.75', pageWidth - 50, currentY);
    currentY += 8;
    
    // Horizontal line after table
    doc.line(20, currentY + 2, pageWidth - 20, currentY + 2);
    
    // ============ SUMMARY SECTION ============
    const summaryY = currentY + 10;
    
    // Calculate totals
    const subtotal = invoiceData.subtotal || 154.00;
    const taxPercent = 5;
    const taxAmount = 7.32;
    const discountAmount = invoiceData.discountAmount || 51.25;
    const total = invoiceData.total || 154.00;
    
    // Left side summary
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Qty : 2`, 20, summaryY);
    doc.text(`Payment Mode : Coupon Dis : 0`, 20, summaryY + 6);
    doc.text(`E-wallet Discount : ${discountAmount.toFixed(2)}`, 20, summaryY + 12);
    doc.text(`Tax Type : Inclusive`, 20, summaryY + 18);
    doc.text(`VAT(5%) : ${taxAmount.toFixed(2)}`, 20, summaryY + 24);
    
    // Right side summary with box
    const summaryRightX = pageWidth - 80;
    doc.setFillColor(240, 240, 240);
    doc.rect(summaryRightX - 10, summaryY - 5, 70, 60, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.text(`Total : AED ${total.toFixed(2)}`, summaryRightX, summaryY);
    doc.text(`Advance : AED 0.00`, summaryRightX, summaryY + 8);
    doc.text(`Amount Paid : AED ${total.toFixed(2)}`, summaryRightX, summaryY + 16);
    doc.text(`Amount Due : AED 0.00`, summaryRightX, summaryY + 24);
    
    // Additional info
    doc.setFont("helvetica", "normal");
    doc.text(`Service Charges : AED ${(invoiceData.serviceCharges || 0).toFixed(2)}`, summaryRightX, summaryY + 32);
    doc.text(`Total Tips : AED ${(invoiceData.serviceTip || 0).toFixed(2)}`, summaryRightX, summaryY + 40);
    
    // ============ FOOTER ============
    const footerY = pageHeight - 20;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text('****THANK YOU. PLEASE VISIT AGAIN****', pageWidth / 2, footerY, { align: 'center' });
    
    // Save PDF
    doc.save(`Invoice-${invoiceData.invoiceNumber || 'MANOFCAVE'}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};

// ===================== MAIN COMPONENT =====================

export default function AdminAppointments() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { formatCurrency } = useCurrencyStore();
  const { getConfirmedBookings } = useBookingStore();
  const { getBranchByName } = useBranchStore();
  const { addNotification, notifications, markAsRead } = useNotifications();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // State management
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'advanced-calendar' | 'list' | 'approvals' | 'product-orders'>('advanced-calendar');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  // State management mein yeh add karein
const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
const [showEditDialog, setShowEditDialog] = useState(false);
const [editBookingData, setEditBookingData] = useState<BookingFormData | null>(null);
const [editSelectedServices, setEditSelectedServices] = useState<FirebaseService[]>([]);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
  
  const [allowPendingOrders] = useState(true);

  // UPDATED: Multiple Services State
  const [selectedServices, setSelectedServices] = useState<FirebaseService[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<FirebaseCategory | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<FirebaseBranch | null>(null);

  // UPDATED: Booking Form State with Multiple Services
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
    branch: ''
  });

  // Load data from Firebase
  useEffect(() => {
    let isMounted = true;
    
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

        const [ordersData, bookingsData, staffData, servicesData, categoriesData, branchesData] = await Promise.all([
          fetchProductOrders(notificationWrapper),
          fetchBookings(notificationWrapper),
          fetchStaff(),
          fetchServices(),
          fetchCategories(),
          fetchBranches()
        ]);
        
        if (isMounted) {
          setProductOrders(ordersData);
          setBookings(bookingsData);
          setStaffMembers(staffData);
          setServices(servicesData);
          setCategories(categoriesData);
          setBranches(branchesData);
          
          console.log("🔥 Firebase Data Loaded with All Fields:", {
            bookings: bookingsData.length,
            firstBooking: bookingsData[0] ? {
              services: bookingsData[0].services,
              teamMembers: bookingsData[0].teamMembers,
              products: bookingsData[0].products,
              paymentMethods: bookingsData[0].paymentMethods
            } : 'No bookings'
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
        }
      } finally {
        if (isMounted) {
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
    };
  }, []);

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

  // UPDATED: Convert Bookings to Appointments with Complete Data
  const convertedBookings: Appointment[] = bookings.map((booking, index) => {
    const mappedStatus = mapBookingStatus(booking.status);
    
    // Use services array if available, otherwise fallback to single service
    const serviceText = Array.isArray(booking.services) && booking.services.length > 0 
      ? booking.services.join(', ') 
      : (booking.serviceName || 'Unknown Service');
    
    return {
      id: booking.firebaseId || `booking-${index}`,
      firebaseId: booking.firebaseId,
      customer: booking.customerName,
      service: serviceText,
      services: Array.isArray(booking.services) ? booking.services : [],
      barber: booking.staff || "Not Assigned",
      date: booking.bookingDate,
      time: booking.bookingTime || booking.timeSlot,
      duration: booking.totalDuration ? `${booking.totalDuration} min` : '60 min',
      price: booking.totalPrice || 0,
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
      // COMPLETE FIELDS
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
    };
  });

  const mockAppointments: Appointment[] = [
    
    
  ];

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
    const dateString = format(date, 'yyyy-MM-dd');
    return allAppointments.filter(apt => apt.date === dateString);
  };

  // UseMemo for filtered data
  const filteredCategories = useMemo(() => {
    if (!bookingData.branch) return [];
    
    return categories.filter(category => {
      if (!category.isActive || category.type !== 'service') return false;
      
      const selectedBranchLower = bookingData.branch.toLowerCase().trim();
      const categoryBranchLower = (category.branchName || '').toLowerCase().trim();
      
      const exactMatch = categoryBranchLower === selectedBranchLower;
      const partialMatch = categoryBranchLower.includes(selectedBranchLower) || 
                          selectedBranchLower.includes(categoryBranchLower);
      
      const branchIdMatch = selectedBranch?.firebaseId && 
                           category.branchId === selectedBranch.firebaseId;
      
      return exactMatch || partialMatch || branchIdMatch;
    });
  }, [bookingData.branch, selectedBranch, categories]);

  const filteredServices = useMemo(() => {
    if (!bookingData.branch) return [];
    
    return services.filter(service => {
      if (service.status !== 'active') return false;
      
      const selectedBranchLower = bookingData.branch.toLowerCase().trim();
      
      const hasInBranchNames = service.branchNames?.some(branch => 
        branch.toLowerCase().trim() === selectedBranchLower
      );
      
      const hasInBranches = service.branches?.some(branch => 
        branch.toLowerCase().trim() === selectedBranchLower
      );
      
      return hasInBranchNames || hasInBranches;
    });
  }, [bookingData.branch, services]);

  const filteredStaff = useMemo(() => {
    if (!bookingData.branch) return [];
    
    return staffMembers.filter(staff => {
      if (staff.status !== 'active') return false;
      
      const selectedBranchLower = bookingData.branch.toLowerCase().trim();
      const staffBranchLower = (staff.branch || '').toLowerCase().trim();
      
      return staffBranchLower === selectedBranchLower;
    });
  }, [bookingData.branch, staffMembers]);

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

  // ===================== UPDATED: Multiple Services Selection Handler =====================
  const handleServiceSelection = (serviceName: string) => {
    const service = services.find(s => s.name === serviceName);
    if (!service) return;

    const isAlreadySelected = selectedServices.some(s => s.name === serviceName);
    let updatedSelectedServices: FirebaseService[];
    let updatedServicesArray: string[];

    if (isAlreadySelected) {
      // Remove service
      updatedSelectedServices = selectedServices.filter(s => s.name !== serviceName);
      updatedServicesArray = bookingData.services.filter(s => s !== serviceName);
    } else {
      // Add service
      updatedSelectedServices = [...selectedServices, service];
      updatedServicesArray = [...bookingData.services, serviceName];
    }

    setSelectedServices(updatedSelectedServices);
    setBookingData(prev => ({
      ...prev,
      services: updatedServicesArray,
      service: updatedServicesArray.length > 0 ? updatedServicesArray[0] : ''
    }));

    console.log("📝 Updated Services:", {
      selectedCount: updatedSelectedServices.length,
      services: updatedServicesArray,
      primary: updatedServicesArray[0]
    });
  };

  const handleCategoryChange = (categoryName: string) => {
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
  // ===================== EDIT TOTAL CALCULATION =====================
const calculateEditTotal = (): number => {
  if (!editBookingData || editSelectedServices.length === 0) return 0;
  
  const servicesPrice = editSelectedServices.reduce((sum, s) => sum + s.price, 0);
  const productsTotal = editBookingData.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  let subtotal = servicesPrice + productsTotal + editBookingData.serviceCharges;
  
  // Apply discount
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

  // ===================== UPDATED: Calculate Total with Multiple Services =====================
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

  // ===================== UPDATED: Invoice Generation with Multiple Services =====================
  const handleGenerateInvoiceClick = (appointment: Appointment) => {
    if (appointment.status !== 'completed') {
      addNotification({
        type: 'error',
        title: 'Invoice Not Available',
        message: 'Invoice can only be generated for completed services'
      });
      return;
    }
    
    const branch = getBranchByName(appointment.branch);
    const branchInfo = branch || { name: appointment.branch, address: 'N/A', phone: 'N/A' };
    
    const newInvoiceNumber = generateInvoiceNumber();
    setInvoiceNumber(newInvoiceNumber);
    setSelectedAppointmentForInvoice(appointment);
    setIsEditingInvoice(true);
    
    // Calculate values
    const subtotal = appointment.price;
    const tax = appointment.tax || 5;
    const taxAmount = (subtotal * tax) / 100;
    const discount = appointment.discount || 0;
    const total = subtotal + taxAmount - discount;
    
    // Prepare items array
    const items: InvoiceItem[] = [];
    
    // UPDATED: Add multiple services
    if (appointment.services && Array.isArray(appointment.services) && appointment.services.length > 0) {
      appointment.services.forEach((service, index) => {
        items.push({
          name: service,
          quantity: 1,
          price: appointment.price / appointment.services!.length,
          total: appointment.price / appointment.services!.length
        });
      });
    } else {
      // Single service fallback
      items.push({
        name: appointment.service,
        quantity: 1,
        price: appointment.price,
        total: appointment.price
      });
    }
    
    // Add products
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
    
    // Initialize invoice data
    const initialInvoiceData: ExtendedInvoiceData = {
      id: Number(appointment.id) || Date.now(),
      invoiceNumber: newInvoiceNumber,
      customer: appointment.customer,
      email: appointment.email,
      phone: appointment.phone,
      service: appointment.service,
      services: appointment.services,
      date: appointment.date,
      time: appointment.time,
      duration: appointment.duration,
      price: appointment.price,
      status: appointment.status,
      barber: appointment.barber,
      notes: appointment.notes || '',
      tax: tax,
      discount: discount,
      customerAddress: `${branchInfo.name}, ${branchInfo.address || ''}`,
      paymentMethod: appointment.paymentMethods?.join(', ') || 'Cash',
      subtotal: subtotal,
      taxAmount: taxAmount,
      total: total,
      items: items,
      cardLast4Digits: appointment.cardLast4Digits || '',
      trnNumber: appointment.trnNumber || '',
      teamMembers: appointment.teamMembers || [],
      serviceTip: appointment.serviceTip || 0,
      serviceCharges: appointment.serviceCharges || 0
    };
    
    setInvoiceData(initialInvoiceData);
    setShowInvoiceModal(true);
    
    console.log("✅ Invoice modal opened with complete data:", initialInvoiceData);
  };

  const handleInvoiceDataChange = (field: keyof ExtendedInvoiceData, value: any) => {
    if (invoiceData) {
      const updatedData = {
        ...invoiceData,
        [field]: value
      };
      
      // Recalculate totals if items change
      if (field === 'items' || field === 'tax' || field === 'discount') {
        const subtotal = updatedData.items?.reduce((sum, item) => sum + item.total, 0) || 0;
        const taxAmount = subtotal * (updatedData.tax || 0) / 100;
        const discount = updatedData.discount || 0;
        
        updatedData.subtotal = subtotal;
        updatedData.taxAmount = taxAmount;
        updatedData.total = subtotal + taxAmount - discount;
      }
      
      setInvoiceData(updatedData);
    }
  };

  // Edit Appointment ka handler function
const handleEditAppointment = (appointment: Appointment) => {
  console.log("✏️ Editing appointment:", appointment);
  
  // Extract services array from appointment
  const servicesArray = appointment.services && Array.isArray(appointment.services) 
    ? appointment.services 
    : [appointment.service];
  
  // Create edit booking data
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
  
  // Find services from database
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
  
  console.log("📝 Edit data prepared:", {
    services: servicesArray,
    matchedServicesCount: matchedServices.length,
    teamMembers: appointment.teamMembers,
    products: appointment.products
  });
};
// Firebase mein appointment update karne ka function
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
    
    // Apply discount
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
    
    // Prepare service details
    const serviceDetails = selectedServices.map(service => ({
      id: service.firebaseId,
      name: service.name,
      price: service.price,
      duration: service.duration,
      category: service.category
    }));
    
    // Prepare update data
    const updateData = {
      // Updated customer information
      customerName: updatedData.customer,
      customerEmail: updatedData.email || "",
      customerPhone: updatedData.phone || "",
      
      // Updated services information
      serviceName: updatedData.services[0] || "Multiple Services",
      services: updatedData.services,
      servicesDetails: serviceDetails,
      serviceCategory: selectedCategory?.name || selectedServices[0]?.category || "Multiple",
      serviceDuration: totalDuration,
      servicePrice: servicesPrice,
      totalAmount: totalAmount,
      totalDuration: totalDuration,
      
      // Updated staff information
      staff: updatedData.barber,
      staffName: updatedData.barber,
      staffId: updatedData.teamMembers.find(tm => tm.name === updatedData.barber)?.name || updatedData.barber,
      
      // Updated date & time
      date: updatedData.date,
      time: updatedData.time,
      timeSlot: updatedData.time,
      bookingDate: updatedData.date,
      bookingTime: updatedData.time,
      
      // Updated status & payment
      status: updatedData.status,
      paymentMethod: updatedData.paymentMethods.length > 0 
        ? updatedData.paymentMethods.join(', ') 
        : 'cash',
      paymentStatus: updatedData.status === 'completed' ? 'paid' : 'pending',
      
      // Updated branch
      branch: selectedBranch?.name || selectedServices[0]?.branchNames?.[0] || "All Branches",
      branchNames: selectedBranch?.name ? [selectedBranch.name] : (selectedServices[0]?.branchNames || ["All Branches"]),
      
      // Updated category
      category: selectedCategory?.name || "",
      categoryId: selectedCategory?.firebaseId || "",
      
      // Updated payment details
      cardLast4Digits: updatedData.cardLast4Digits || "",
      trnNumber: updatedData.trnNumber || "",
      paymentAmounts: updatedData.paymentAmounts,
      
      // Updated notes
      notes: updatedData.notes || '',
      
      // Updated products
      products: updatedData.products.map(product => ({
        productName: product.name,
        name: product.name,
        category: product.category,
        price: product.price,
        quantity: product.quantity,
        total: product.price * product.quantity
      })),
      
      // Updated team members
      teamMembers: updatedData.teamMembers,
      
      // Updated pricing details
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
      
      // Updated payment methods
      paymentMethods: updatedData.paymentMethods,
      
      // Update timestamp
      updatedAt: serverTimestamp()
    };
    
    console.log("📤 Updating appointment in Firebase:", updateData);
    
    // Update in Firebase
    const bookingRef = doc(db, "bookings", appointmentId);
    await updateDoc(bookingRef, updateData);
    
    return true;
  } catch (error) {
    console.error("❌ Error updating appointment:", error);
    return false;
  }
};
// Edit submit handler
const handleEditSubmit = async () => {
  if (!editingAppointment || !editBookingData || !editingAppointment.firebaseId) {
    addNotification({
      type: 'error',
      title: 'Edit Error',
      message: 'No appointment selected for editing.'
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
  
  console.log('📤 Updating appointment:', {
    appointmentId: editingAppointment.firebaseId,
    services: editBookingData.services,
   totalPrice: calculateEditTotal(),

  });
  
  // Update in Firebase
  const success = await updateAppointmentInFirebase(
    editingAppointment.firebaseId,
    editBookingData,
    editSelectedServices,
    selectedCategory,
    selectedBranch,
    editingAppointment
  );
  
  if (success) {
    // Update local state
    setBookings(prev => prev.map(booking => 
      booking.firebaseId === editingAppointment.firebaseId ? {
        ...booking,
        customerName: editBookingData!.customer,
        customerEmail: editBookingData!.email,
        customerPhone: editBookingData!.phone,
        services: editBookingData!.services,
        totalDuration: editSelectedServices.reduce((sum, s) => sum + s.duration, 0),

        status: editBookingData!.status,
        bookingDate: editBookingData!.date,
        bookingTime: editBookingData!.time,
        staff: editBookingData!.barber,
        notes: editBookingData!.notes,
        // Update all fields
        cardLast4Digits: editBookingData!.cardLast4Digits,
        trnNumber: editBookingData!.trnNumber,
        teamMembers: editBookingData!.teamMembers,
        products: editBookingData!.products,
        paymentMethods: editBookingData!.paymentMethods,
        paymentAmounts: editBookingData!.paymentAmounts,
        discount: editBookingData!.discount,
        discountType: editBookingData!.discountType,
        serviceTip: editBookingData!.serviceTip,
        serviceCharges: editBookingData!.serviceCharges,
        tax: editBookingData!.tax
      } : booking
    ));
    
    addNotification({
      type: 'success',
      title: 'Appointment Updated',
      message: `Appointment for ${editBookingData.customer} has been successfully updated.`
    });
    
    // Close dialogs
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
// Firebase functions ke baad, updateStatus functions ke saath yeh add karein:

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
      // Update local state
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

  // ===================== EVENT HANDLERS =====================

  const handleCreateBooking = (barber: string, date: string, time: string) => {
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
      status: 'pending',
      generateInvoice: false,
      cardLast4Digits: '',
      trnNumber: '',
      category: '',
      branch: ''
    });
    setSelectedServices([]);
    setSelectedCategory(null);
    setSelectedBranch(null);
    setShowBookingDialog(true);
  };

  // UPDATED: Handle Submit Booking with Multiple Services
  const handleSubmitBooking = async () => {
    if (!bookingData.customer || !bookingData.barber || !bookingData.date || !bookingData.time || selectedServices.length === 0) {
      addNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fill in all required fields including at least one service.',
      });
      return;
    }

    console.log('📤 Creating booking with complete data:', {
      customer: bookingData.customer,
      services: bookingData.services,
      selectedServicesCount: selectedServices.length,
      teamMembers: bookingData.teamMembers,
      products: bookingData.products,
      paymentMethods: bookingData.paymentMethods
    });

    // Save to Firebase
    const result = await createBookingInFirebase(bookingData, selectedServices, selectedCategory, selectedBranch, addNotification);
    
    if (result.success && result.booking) {
      setBookings(prev => [result.booking!, ...prev]);
      
      addNotification({
        type: 'success',
        title: 'Booking Created Successfully',
        message: `Appointment for ${bookingData.customer} has been saved with ${selectedServices.length} service(s).`,
      });

      setShowBookingDialog(false);
      
      // Reset form
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
        status: 'pending',
        generateInvoice: false,
        cardLast4Digits: '',
        trnNumber: '',
        category: '',
        branch: ''
      });
      
      setSelectedServices([]);
      setSelectedCategory(null);
      setSelectedBranch(null);
    }
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentDetails(true);
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
    .filter(booking => 
      booking.status === 'pending' || 
      booking.status === 'approved' || 
      booking.status === 'rejected' ||
      booking.status === 'upcoming'
    )
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
      status: booking.status,
      phone: booking.customerPhone,
      email: booking.customerEmail,
      notes: booking.notes || '',
      source: booking.createdBy === 'admin' ? 'admin_panel' : 'website',
      branch: booking.branch || 'All Branches',
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      // Complete fields
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

  // Get confirmed bookings from store
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
    status: 'scheduled',
    phone: booking.customerPhone || '',
    email: booking.customerEmail || '',
    notes: booking.specialRequests || 'Booked via website',
    source: 'website',
    branch: 'All Branches',
    createdAt: booking.createdAt || new Date(),
    updatedAt: booking.createdAt || new Date()
  }));

  const finalAppointments = [...mockAppointments, ...convertedBookings, ...additionalConvertedBookings];
  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex h-screen ">
        {/* Sidebar */}
        <AdminSidebar
          role="branch_admin"
          onLogout={handleLogout}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          key="admin-appointments-sidebar"
        />

        {/* Main Content */}
        <div className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out min-h-0",
          sidebarOpen ? "lg:ml-0" : "lg:ml-1"
        )}>
          {/* Header */}
          <header className="bg-white shadow-sm border-b shrink-0">
            <div className="flex items-center justify-between px-4 py-4 lg:px-8">
              <div className="flex items-center gap-4">
                <AdminMobileSidebar
                  role="branch_admin"
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
                {/* Notifications */}
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

                <Button variant="outline" onClick={() => router.push('/admin/booking-approvals')} className="hidden sm:flex mr-2">
                  Booking Approvals
                </Button>
                <span className="text-sm text-gray-600 hidden sm:block">Welcome, {user?.email}</span>
                <Button variant="outline" onClick={handleLogout} className="hidden sm:flex">
                  Logout
                </Button>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-auto min-h-0">
            <div className="h-full p-4 lg:p-8">
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'calendar' | 'advanced-calendar' | 'list' | 'approvals' | 'product-orders')}>
                <div className="flex items-center justify-between mb-6">
                  <TabsList>
                    <TabsTrigger value="calendar">Calendar View</TabsTrigger>
                    <TabsTrigger value="advanced-calendar">Advanced Calendar</TabsTrigger>
                    <TabsTrigger value="list">List View</TabsTrigger>
                    <TabsTrigger value="approvals">Booking Approvals</TabsTrigger>
                    <TabsTrigger value="product-orders">Product Orders</TabsTrigger>
                  </TabsList>

                  <div className="flex items-center gap-4">
                    <div className="flex-1 max-w-sm">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search appointments..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Calendar View Tab */}
                <TabsContent value="calendar" className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <div></div>
                    {/* <Button onClick={() => setShowBookingDialog(true)} className="flex items-center gap-2 bg-primary hover:bg-primary/90">
                      <Plus className="w-4 h-4" />
                      Create Booking
                    </Button> */}
                  </div>
                 
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
                    {/* Calendar */}
                    <div className="lg:col-span-2">
                      <Card className="border-2 shadow-lg bg-white/50 backdrop-blur-sm">
                        <CardHeader className="pb-4 border-b bg-gradient-to-r from-primary/5 to-secondary/5">
                          <CardTitle className="flex items-center gap-3 text-xl">
                            <Calendar className="w-6 h-6 text-primary" />
                            Booking Calendar
                          </CardTitle>
                          <CardDescription className="text-base">
                            Click on a date to view appointments. Appointments from both website and mobile are shown.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <CalendarComponent
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            className="rounded-lg border-2 shadow-sm w-full bg-white"
                            modifiers={{
                              hasAppointments: (date) => getAppointmentsForDate(date).length > 0
                            }}
                            modifiersStyles={{
                              hasAppointments: {
                                backgroundColor: 'rgb(59 130 246 / 0.15)',
                                color: 'rgb(59 130 246)',
                                fontWeight: '600',
                                borderRadius: '8px',
                                border: '2px solid rgb(59 130 246 / 0.3)'
                              },
                              today: {
                                backgroundColor: 'rgb(251 146 60 / 0.1)',
                                color: 'rgb(251 146 60)',
                                fontWeight: '600',
                                border: '2px solid rgb(251 146 60 / 0.3)'
                              }
                            }}
                          />
                        </CardContent>
                      </Card>
                    </div>

                    {/* Selected Date Appointments Sidebar */}
                    <div className="lg:col-span-2">
                      <Card className="border-2 shadow-lg bg-white/50 backdrop-blur-sm h-fit sticky top-6">
                        <CardHeader className="pb-4 border-b bg-gradient-to-r from-primary/5 to-secondary/5">
                          <CardTitle className="text-lg lg:text-xl flex items-center gap-3">
                            <Clock className="w-6 h-6 text-primary" />
                            {selectedDate ? selectedDate.toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }) : 'Select a date'}
                          </CardTitle>
                          <CardDescription className="text-base font-medium">
                            {selectedDate ? (
                              <div className="flex items-center gap-3">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-primary/10 text-primary border border-primary/20">
                                  {getAppointmentsForDate(selectedDate).length} appointment(s)
                                </span>
                              </div>
                            ) : 'Choose a date from the calendar'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 px-6">
                          {selectedDate && (
                            <div className="space-y-4">
                              {getAppointmentsForDate(selectedDate).map((appointment) => (
                                <div
                                  key={appointment.id.toString()}
                                  className="group p-5 border-2 border-gray-100 rounded-2xl cursor-pointer hover:border-primary/30 hover:shadow-xl transition-all duration-300 bg-white hover:bg-gradient-to-r hover:from-primary/5 hover:to-secondary/5"
                                  onClick={() => handleAppointmentClick(appointment)}
                                >
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                        <User className="w-6 h-6 text-primary" />
                                      </div>
                                      <div>
                                        <span className="font-semibold text-base text-gray-900 group-hover:text-primary transition-colors">{appointment.time}</span>
                                        <div className={`flex items-center gap-2 mt-1 ${getSourceColor(appointment.source)}`}>
                                          {getSourceIcon(appointment.source)}
                                          <span className="text-xs font-medium capitalize px-2 py-1 rounded-full bg-current/10">{appointment.source}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <Badge className={`${getStatusColor(appointment.status)} border-2 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm`}>
                                      {appointment.status}
                                    </Badge>
                                  </div>
                                  <div className="space-y-3">
                                    <div>
                                      <p className="font-bold text-gray-900 text-lg group-hover:text-primary transition-colors">{appointment.customer}</p>
                                      <p className="text-gray-700 text-sm font-medium">{appointment.service}</p>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                      <p className="text-gray-600 text-sm flex items-center gap-2">
                                        <Scissors className="w-4 h-4 text-secondary" />
                                        with {appointment.barber}
                                      </p>
                                      <span className="text-lg font-bold text-primary">{formatCurrency(appointment.price)}</span>
                                    </div>
                                    {appointment.notes && (
                                      <div className="bg-gray-50 rounded-lg p-3 mt-3">
                                        <p className="text-xs text-gray-600 italic">"{appointment.notes}"</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {getAppointmentsForDate(selectedDate).length === 0 && (
                                <div className="text-center py-16 px-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl border-2 border-dashed border-gray-200">
                                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                    <Calendar className="w-10 h-10 text-gray-400" />
                                  </div>
                                  <h3 className="text-xl font-bold text-gray-600 mb-2">No appointments</h3>
                                  <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">No appointments scheduled for this date.</p>
                                  <Button 
                                    onClick={() => setShowBookingDialog(true)}
                                    className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-full"
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Booking
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                {/* Advanced Calendar Tab */}
                <TabsContent value="advanced-calendar" className="space-y-6">
                  <AdvancedCalendar
                    appointments={finalAppointments.map((apt: any) => {
                      // Normalize paymentAmounts to ensure all properties exist
                      const paymentAmounts = {
                        cash: apt.paymentAmounts?.cash ?? 0,
                        card: apt.paymentAmounts?.card ?? 0,
                        check: apt.paymentAmounts?.check ?? 0,
                        digital: apt.paymentAmounts?.digital ?? 0,
                        wallet: apt.paymentAmounts?.wallet ?? 0
                      };
                      
                      return {
                        ...apt,
                        // Pass all fields
                        teamMembers: apt.teamMembers || [],
                        products: apt.products || [],
                        cardLast4Digits: apt.cardLast4Digits || '',
                        trnNumber: apt.trnNumber || '',
                        paymentMethods: apt.paymentMethods || [],
                        paymentAmounts: paymentAmounts,
                        discount: apt.discount || 0,
                        discountType: apt.discountType || 'fixed',
                        serviceTip: apt.serviceTip || 0,
                        serviceCharges: apt.serviceCharges || 0,
                        tax: apt.tax || 5
                      };
                    })}
                    onAppointmentClick={(appointment: any) => {
                      const fullAppointment = allAppointments.find(apt => apt.id === appointment.id);
                      if (fullAppointment) {
                        setSelectedAppointment({
                          ...fullAppointment,
                          ...appointment
                        });
                        setShowAppointmentDetails(true);
                      }
                    }}
                    onStatusChange={(appointmentId, newStatus) => handleStatusChange(appointmentId.toString(), newStatus)}
                    onCreateBooking={handleCreateBooking}
                    staff={staffMembers}
                    showFullDetails={true}
                  
                  />
                </TabsContent>

                {/* List View Tab */}
                <TabsContent value="list" className="space-y-8">
                  <div className="space-y-6">
                    {filteredAppointments.map((appointment) => (
                      <Card key={appointment.id.toString()} className="border-2 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                        <CardHeader className="pb-4 border-b bg-linear-to-r from-gray-50/50 to-white">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-6">
                              <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                <User className="w-7 h-7 text-primary" />
                              </div>
                              <div className="space-y-2">
                                <CardTitle className="text-xl text-primary flex items-center gap-3">
                                  {appointment.customer}
                                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getSourceColor(appointment.source)} bg-current/10`}>
                                    {getSourceIcon(appointment.source)}
                                    <span className="capitalize">{appointment.source}</span>
                                  </div>
                                </CardTitle>
                                <CardDescription className="flex items-center gap-3 text-base">
                                  <span className="font-medium text-gray-700">{appointment.service}</span>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-gray-600">{appointment.barber}</span>
                                  <span className="text-gray-400">•</span>
                                  <span className="text-gray-600">{appointment.branch}</span>
                                  {appointment.services && appointment.services.length > 1 && (
                                    <Badge className="bg-purple-500 text-white">
                                      {appointment.services.length} services
                                    </Badge>
                                  )}
                                </CardDescription>
                              </div>
                            </div>
                            <Badge className={`${getStatusColor(appointment.status)} border-2 flex items-center gap-2 px-4 py-2 text-sm font-semibold`}>
                              {getStatusIcon(appointment.status)}
                              <span className="capitalize">{appointment.status}</span>
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                              <Calendar className="w-5 h-5 text-blue-600" />
                              <div>
                                <p className="text-sm font-medium text-blue-900">{appointment.date}</p>
                                <p className="text-xs text-blue-700">at {appointment.time}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                              <Clock className="w-5 h-5 text-green-600" />
                              <div>
                                <p className="text-sm font-medium text-green-900">{appointment.duration}</p>
                                <p className="text-xs text-green-700">Duration</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                              <DollarSign className="w-5 h-5 text-purple-600" />
                              <div>
                                <p className="text-sm font-medium text-purple-900">{formatCurrency(appointment.price)}</p>
                                <p className="text-xs text-purple-700">Total Price</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                              <Phone className="w-5 h-5 text-orange-600" />
                              <div>
                                <p className="text-sm font-medium text-orange-900">{appointment.phone}</p>
                                <p className="text-xs text-orange-700">Contact</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Additional Fields Display */}
                          {(appointment.cardLast4Digits || appointment.trnNumber || appointment.teamMembers?.length  || appointment.products?.length ) && (
                            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="flex items-start gap-2">
                                <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-blue-900 mb-2">Additional Details</p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                    {appointment.cardLast4Digits && (
                                      <div>
                                        <span className="text-blue-700">Card: </span>
                                        <span className="font-medium">****{appointment.cardLast4Digits}</span>
                                      </div>
                                    )}
                                    {appointment.trnNumber && (
                                      <div>
                                        <span className="text-blue-700">TRN: </span>
                                        <span className="font-medium">{appointment.trnNumber}</span>
                                      </div>
                                    )}
                                    {appointment.teamMembers && appointment.teamMembers.length > 0 && (
                                      <div>
                                        <span className="text-blue-700">Team: </span>
                                        <span className="font-medium">{appointment.teamMembers.length} members</span>
                                      </div>
                                    )}
                                    {appointment.products && appointment.products.length > 0 && (
                                      <div>
                                        <span className="text-blue-700">Products: </span>
                                        <span className="font-medium">{appointment.products.length} items</span>
                                      </div>
                                    )}
                                    {appointment.services && appointment.services.length > 1 && (
                                      <div>
                                        <span className="text-blue-700">Services: </span>
                                        <span className="font-medium">{appointment.services.length} services</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {appointment.notes && (
                            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <div className="flex items-start gap-2">
                                <FileText className="w-5 h-5 text-yellow-600 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-yellow-900 mb-1">Notes</p>
                                  <p className="text-sm text-yellow-800">{appointment.notes}</p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between pt-4 border-t">
                            <div className="flex items-center gap-6 text-sm text-gray-500">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                <span>Created: {new Date(appointment.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                <span>Updated: {new Date(appointment.updatedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex gap-3 flex-wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAppointmentClick(appointment)}
                                className="flex items-center gap-2 border-2 hover:bg-primary hover:text-white transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                                View Details
                              </Button>
                             
<Button
  size="sm"
  variant="outline"
  onClick={() => handleDeleteBooking(appointment)}
  className="flex items-center gap-2 text-red-600 hover:text-white hover:bg-red-600 border-red-300 border-2 transition-colors"
>
  <Trash2 className="w-4 h-4" />
  Delete
</Button>

                              {appointment.status === 'pending' && appointment.firebaseId && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleApproveBooking(appointment.firebaseId as string)}
                                    className="flex items-center gap-2 text-green-600 hover:text-white hover:bg-green-600 border-green-300 border-2 transition-colors"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRejectBooking(appointment.firebaseId as string)}
                                    className="flex items-center gap-2 text-red-600 hover:text-white hover:bg-red-600 border-red-300 border-2 transition-colors"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Reject
                                  </Button>
                                </>
                              )}

                              {(appointment.status === 'approved' || appointment.status === 'scheduled') && appointment.firebaseId && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatusChange(appointment.firebaseId as string, 'in-progress') }
                                    className="flex items-center gap-2 text-blue-600 hover:text-white hover:bg-blue-600 border-blue-300 border-2 transition-colors"
                                  >
                                    <Play className="w-4 h-4" />
                                    Start Service
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatusChange(appointment.firebaseId as string, 'cancelled')}
                                    className="flex items-center gap-2 text-red-600 hover:text-white hover:bg-red-600 border-red-300 border-2 transition-colors"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Cancel
                                  </Button>
                                </>
                              )}

                              {appointment.status === 'in-progress' && appointment.firebaseId && (
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 flex items-center gap-2 border-2 border-green-500 text-white shadow-sm"
                                  onClick={() => handleStatusChange(appointment.firebaseId as string, 'completed')}
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  Mark Complete
                                </Button>
                              )}

                              {appointment.status === 'completed' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleGenerateInvoiceClick(appointment)}
                                    className="flex items-center gap-2 text-blue-600 hover:text-white hover:bg-blue-600 border-blue-300 border-2 transition-colors"
                                  >
                                    <Receipt className="w-4 h-4" />
                                    Generate Invoice
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {filteredAppointments.length === 0 && (
                    <div className="text-center py-16 px-8">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Calendar className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-2xl font-semibold text-gray-600 mb-3">No appointments found</h3>
                      <p className="text-gray-500 text-lg">Try adjusting your filters or search query</p>
                    </div>
                  )}
                </TabsContent>

                {/* Booking Approvals Tab */}
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
                        <p className="text-gray-500 text-lg">No pending approvals at the moment</p>
                      </div>
                    ) : (
                      pendingAppointments.map((appointment) => (
                        <Card key={appointment.id.toString()} className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-all">
                          <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                              {/* Customer & Service Info */}
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

                              {/* Date & Time */}
                              <div className="md:col-span-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="w-4 h-4 text-blue-600" />
                                  <div>
                                    <p className="font-medium text-gray-900">{appointment.date}</p>
                                    <p className="text-xs text-gray-600">{appointment.time}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Duration */}
                              <div className="md:col-span-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <Clock className="w-4 h-4 text-green-600" />
                                  <span className="font-medium text-gray-900">{appointment.duration}</span>
                                </div>
                              </div>

                              {/* Price */}
                              <div className="md:col-span-1">
                                <div className="flex items-center gap-2 text-sm">
                                  <DollarSign className="w-4 h-4 text-purple-600" />
                                  <span className="font-medium text-gray-900">{formatCurrency(appointment.price)}</span>
                                </div>
                              </div>

                              {/* Status Badge */}
                              <div className="md:col-span-2">
                                <Badge className={`${getStatusColor(appointment.status)} border flex items-center justify-center gap-1 px-2 py-1 text-xs font-semibold w-full`}>
                                  {getStatusIcon(appointment.status)}
                                  <span className="capitalize">{appointment.status}</span>
                                </Badge>
                              </div>

                              {/* Action Buttons */}
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
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 text-xs h-9"
                                      onClick={() => handleStatusChange(appointment.firebaseId as string, 'delivered')}
                                    >
                                      <Package className="w-3 h-3 mr-1" />
                                      Mark Delivered
                                    </Button>
                                  </div>
                                )}

                                {appointment.status === 'approved' && appointment.firebaseId && (
                                  <Button
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 text-white flex-1 text-xs h-9 flex items-center justify-center gap-1"
                                    onClick={() => handleReschedule(appointment.id)}
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                    Reschedule
                                  </Button>
                                )}
                                {appointment.status === 'rejected' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-2 border-red-300 text-red-600 flex-1 text-xs h-9 cursor-not-allowed opacity-60"
                                    disabled
                                  >
                                    Rejected
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-2 flex-1 text-xs h-9"
                                  onClick={() => handleAppointmentClick(appointment)}
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>

                {/* Product Orders Tab */}
                <TabsContent value="product-orders" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Product Orders</h2>
                      <p className="text-gray-600 mt-1">Manage product sales and inventory from Firebase</p>
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      New Order
                    </Button>
                  </div>

                  {/* Product Orders Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Package className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Total Orders</p>
                          <p className="text-2xl font-bold text-gray-900">{productOrders.length}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Revenue</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(productOrders.reduce((sum, order) => sum + (order.total || 0), 0))}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Package className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Delivered</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {productOrders.filter(order => order.status === 'delivered').length}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Upcoming</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {productOrders.filter(order => order.status === 'upcoming').length}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Pending</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {productOrders.filter(order => order.status === 'pending').length}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Product Orders Table */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Orders from Firebase</CardTitle>
                      <CardDescription>Track all product orders and sales - Status updates sync with Firebase</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {loading.orders ? (
                          <div className="text-center py-8">
                            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading orders from Firebase...</p>
                          </div>
                        ) : productOrders.length === 0 ? (
                          <div className="text-center py-16 px-8">
                            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">No orders found</h3>
                            <p className="text-gray-500">No product orders available in Firebase</p>
                          </div>
                        ) : (
                          productOrders.map((order, index) => (
                            <div key={order.firebaseId || order.id || `order-${index}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                              <div className="flex-1">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Package className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-900">{order.orderNumber || `Order #${order.firebaseId?.substring(0, 8)}`}</p>
                                    <p className="text-sm text-gray-600">{order.customer}</p>
                                    <p className="text-xs text-gray-500">Firebase ID: {order.firebaseId?.substring(0, 8)}...</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex-1 text-center">
                                <p className="text-sm text-gray-600">Products</p>
                                <p className="font-semibold text-gray-900 text-sm">
                                  {Array.isArray(order.products) ? order.products.slice(0, 2).join(', ') : order.products}
                                  {Array.isArray(order.products) && order.products.length > 2 && '...'}
                                </p>
                              </div>
                              <div className="flex-1 text-center">
                                <p className="text-sm text-gray-600">Qty</p>
                                <p className="font-semibold text-gray-900">{order.quantity}</p>
                              </div>
                              <div className="flex-1 text-center">
                                <p className="text-sm text-gray-600">Total</p>
                                <p className="font-semibold text-lg text-gray-900">{formatCurrency(order.total)}</p>
                              </div>
                              <div className="flex-1 text-center">
                                <Badge className={cn(
                                  order.status === 'delivered' && 'bg-emerald-100 text-emerald-800',
                                  order.status === 'completed' && 'bg-green-100 text-green-800',
                                  order.status === 'upcoming' && 'bg-blue-100 text-blue-800',
                                  order.status === 'approved' && 'bg-purple-100 text-purple-800',
                                  order.status === 'rejected' && 'bg-red-100 text-red-800',
                                  order.status === 'pending' && 'bg-yellow-100 text-yellow-800',
                                  'border'
                                )}>
                                  {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1">
                                {/* COMPLETED BUTTON */}
                                {(order.status === 'upcoming' || order.status === 'pending' || order.status === 'approved') && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    title="Mark as Completed"
                                    onClick={() => handleOrderStatusChange(order.firebaseId, 'completed')}
                                    className="hover:bg-green-100 hover:text-green-700"
                                  >
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                  </Button>
                                )}
                                
                                {/* DELIVERED BUTTON */}
                                {(order.status === 'upcoming' || order.status === 'pending' || order.status === 'approved' || order.status === 'completed') && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    title="Mark as Delivered"
                                    onClick={() => handleOrderStatusChange(order.firebaseId, 'delivered')}
                                    className="hover:bg-emerald-100 hover:text-emerald-700"
                                  >
                                    <Package className="w-4 h-4 text-emerald-600" />
                                  </Button>
                                )}
                                
                                {/* UPCOMING BUTTON */}
                                {order.status !== 'upcoming' && order.status !== 'delivered' && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    title="Mark as Upcoming"
                                    onClick={() => handleOrderStatusChange(order.firebaseId, 'upcoming')}
                                    className="hover:bg-blue-100 hover:text-blue-700"
                                  >
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                  </Button>
                                )}
                                
                                {/* REJECT BUTTON */}
                                {order.status !== 'rejected' && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    title="Reject Order"
                                    onClick={() => handleOrderStatusChange(order.firebaseId, 'rejected')}
                                    className="hover:bg-red-100 hover:text-red-700"
                                  >
                                    <XCircle className="w-4 h-4 text-red-600" />
                                  </Button>
                                )}
                                
                                {/* PENDING BUTTON (if allowed) */}
                                {allowPendingOrders && order.status !== 'pending' && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    title="Mark as Pending"
                                    onClick={() => handleOrderStatusChange(order.firebaseId, 'pending')}
                                    className="hover:bg-yellow-100 hover:text-yellow-700"
                                  >
                                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                                  </Button>
                                )}
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit Order
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Download className="w-4 h-4 mr-2" />
                                      Download Invoice
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => handleDeleteOrder(order.firebaseId)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete Order
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* COMPLETE: Appointment Details Sheet with ALL FIELDS */}
      <Sheet open={showAppointmentDetails} onOpenChange={setShowAppointmentDetails}>
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
          <SheetHeader className="border-b-2 pb-6 mb-8 bg-linear-to-r from-primary/5 to-secondary/5 -mx-6 -mt-6 px-6 pt-6 rounded-t-lg">
            <SheetTitle className="flex items-center gap-3 text-2xl">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              Appointment Details
              {selectedAppointment && (
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${getSourceColor(selectedAppointment.source)} bg-current/10`}>
                  {getSourceIcon(selectedAppointment.source)}
                  <span className="capitalize">{selectedAppointment.source}</span>
                </div>
              )}
            </SheetTitle>
            <SheetDescription className="text-base mt-2">
              Complete appointment information and management options
            </SheetDescription>
          </SheetHeader>

          {selectedAppointment && (
            <div className="space-y-8 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
              {/* Status Overview */}
              <div className="p-6 bg-linear-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Appointment Status
                  </h3>
                  <Badge className={`${getStatusColor(selectedAppointment.status)} border-2 px-4 py-2 text-sm font-semibold flex items-center gap-2`}>
                    {getStatusIcon(selectedAppointment.status)}
                    <span className="capitalize">{selectedAppointment.status}</span>
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-blue-800">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Created: {new Date(selectedAppointment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-800">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Updated: {new Date(selectedAppointment.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* UPDATED: Multiple Services Display */}
              <div className="space-y-6 p-6 bg-white border-2 border-gray-200 rounded-xl shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <Scissors className="w-5 h-5 text-purple-600" />
                  </div>
                  Service Information
                  {selectedAppointment.services && selectedAppointment.services.length > 1 && (
                    <Badge className="bg-purple-500 text-white ml-2">
                      {selectedAppointment.services.length} Services
                    </Badge>
                  )}
                </h3>
                
                {/* Single Service Display */}
                {(!selectedAppointment.services || selectedAppointment.services.length <= 1) && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{selectedAppointment.service}</p>
                        <p className="text-sm text-purple-600">Primary Service</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary text-xl">{formatCurrency(selectedAppointment.price)}</p>
                        <p className="text-sm text-gray-500">{selectedAppointment.duration}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Multiple Services Display */}
                {selectedAppointment.services && selectedAppointment.services.length > 1 && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">Multiple services booked:</p>
                    <div className="space-y-3">
                      {selectedAppointment.services.map((service, index) => (
                        <div key={index} className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="font-bold text-purple-700">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{service}</p>
                              <p className="text-xs text-purple-600">Service {index + 1}</p>
                            </div>
                          </div>
                          <div className="text-right">
  <p className="font-bold text-gray-900">
    {formatCurrency(
      selectedAppointment.price / 
      (selectedAppointment.services?.length || 1)
    )}
  </p>
  <p className="text-xs text-gray-500">Approx. price</p>
</div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-4 border-t border-purple-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Total Services:</p>
                          <p className="text-lg font-bold text-purple-700">{selectedAppointment.services.length} services</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-700">Total Price:</p>
                          <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedAppointment.price)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Barber/Staff Information */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">Assigned Barber</p>
                        <p className="text-sm text-blue-700">{selectedAppointment.barber}</p>
                      </div>
                    </div>
                    <Badge className="bg-blue-500 text-white">
                      {selectedAppointment.staffRole || 'Hairstylist'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Customer Information - WITH ALL FIELDS */}
              <div className="space-y-6 p-6 bg-white border-2 border-gray-200 rounded-xl shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  Customer Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Customer Info */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Full Name</label>
                      <p className="text-base font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border">
                        {selectedAppointment.customer}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Email Address</label>
                      <p className="text-base font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border break-all">
                        {selectedAppointment.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700">Phone Number</label>
                      <p className="text-base font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border">
                        {selectedAppointment.phone}
                      </p>
                    </div>
                    
                    {/* Card & TRN Details */}
                    <div className="grid grid-cols-2 gap-4">
                      {selectedAppointment.cardLast4Digits && (
                        <div>
                          <label className="text-sm font-semibold text-gray-700">Card Last 4</label>
                          <p className="text-base font-medium text-gray-900 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                            ****{selectedAppointment.cardLast4Digits}
                          </p>
                        </div>
                      )}
                      {selectedAppointment.trnNumber && (
                        <div>
                          <label className="text-sm font-semibold text-gray-700">TRN Number</label>
                          <p className="text-base font-medium text-gray-900 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                            {selectedAppointment.trnNumber}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Members - COMPLETE DISPLAY */}
              {selectedAppointment.teamMembers && selectedAppointment.teamMembers.length > 0 && (
                <div className="space-y-6 p-6 bg-white border-2 border-gray-200 rounded-xl shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-orange-600" />
                    </div>
                    Team Members & Tips
                    <Badge className="bg-orange-500 text-white">
                      {selectedAppointment.teamMembers.length} members
                    </Badge>
                  </h3>
                  
                  <div className="space-y-4">
                    {selectedAppointment.teamMembers.map((member, index) => (
                      <div key={index} className="flex justify-between items-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-orange-500" />
                          </div>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-orange-600">
                              {member.name === selectedAppointment.barber ? 'Primary Barber' : 'Assistant'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatCurrency(member.tip)}</p>
                          <p className="text-xs text-gray-500">Tip Amount</p>
                        </div>
                      </div>
                    ))}
                    
                    {selectedAppointment.serviceTip && selectedAppointment.serviceTip > 0 && (
                      <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-3">
                          <DollarSign className="w-5 h-5 text-green-500" />
                          <div>
                            <p className="font-medium">Additional Service Tip</p>
                            <p className="text-sm text-green-600">For exceptional service</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatCurrency(selectedAppointment.serviceTip)}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-4 border-t border-orange-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">Total Team Tips:</span>
                       <span className="font-bold text-green-600">
  {formatCurrency(
    (selectedAppointment.serviceTip || 0) + 
    (selectedAppointment.teamMembers?.reduce((sum, tm) => sum + tm.tip, 0) || 0)
  )}
</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Products - COMPLETE DISPLAY */}
              {selectedAppointment.products && selectedAppointment.products.length > 0 && (
                <div className="space-y-6 p-6 bg-white border-2 border-gray-200 rounded-xl shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    Products Purchased
                    <Badge className="bg-blue-500 text-white">
                      {selectedAppointment.products.length} items
                    </Badge>
                  </h3>
                  
                  <div className="space-y-3">
                    {selectedAppointment.products.map((product, index) => (
                      <div key={index} className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-blue-600">{product.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(product.price)} each</p>
                          <p className="text-sm text-gray-500">
                            x{product.quantity} = {formatCurrency(product.price * product.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    <div className="pt-4 border-t border-blue-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">Total Products Value:</span>
                        <span className="font-bold text-blue-600">
                          {formatCurrency(
                            selectedAppointment.products.reduce((sum, p) => sum + (p.price * p.quantity), 0)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Information - COMPLETE DISPLAY */}
              <div className="space-y-6 p-6 bg-white border-2 border-gray-200 rounded-xl shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                  </div>
                  Payment Information
                </h3>
                
                <div className="space-y-6">
                  {/* Payment Methods */}
                  {selectedAppointment.paymentMethods && selectedAppointment.paymentMethods.length > 0 && (
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">Payment Methods Used</label>
                      <div className="flex flex-wrap gap-2">
                        {selectedAppointment.paymentMethods.map((method, index) => (
                          <Badge key={index} className="bg-indigo-100 text-indigo-800 px-3 py-1.5 border border-indigo-300">
                            {method.charAt(0).toUpperCase() + method.slice(1)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Payment Distribution */}
                  {selectedAppointment.paymentAmounts && (
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-3 block">Payment Distribution</label>
                      <div className="space-y-3">
                        {Object.entries(selectedAppointment.paymentAmounts).map(([method, amount]) => {
                          if (amount > 0) {
                            return (
                              <div key={method} className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <CreditCard className="w-4 h-4 text-indigo-600" />
                                  </div>
                                  <span className="font-medium capitalize">{method}:</span>
                                </div>
                                <span className="font-bold text-indigo-700">{formatCurrency(amount)}</span>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Pricing Details */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Discount */}
                    {selectedAppointment.discount && selectedAppointment.discount > 0 && (
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <label className="text-sm font-semibold text-gray-700">Discount Applied</label>
                        <p className="text-lg font-bold text-green-600 mt-1">
                          {selectedAppointment.discountType === 'percentage' 
                            ? `${selectedAppointment.discount}%` 
                            : formatCurrency(selectedAppointment.discount)}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Type: {selectedAppointment.discountType}
                        </p>
                      </div>
                    )}
                    
                    {/* Service Charges */}
                    {selectedAppointment.serviceCharges && selectedAppointment.serviceCharges > 0 && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <label className="text-sm font-semibold text-gray-700">Service Charges</label>
                        <p className="text-lg font-bold text-blue-600 mt-1">
                          {formatCurrency(selectedAppointment.serviceCharges)}
                        </p>
                      </div>
                    )}
                    
                    {/* Tax */}
                    {selectedAppointment.tax && (
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <label className="text-sm font-semibold text-gray-700">Tax Applied</label>
                        <p className="text-lg font-bold text-purple-600 mt-1">{selectedAppointment.tax}%</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Total Price Summary */}
                  <div className="p-5 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-300">
                    <h4 className="font-bold text-gray-900 mb-4 text-lg">Price Breakdown</h4>
                    
                    <div className="space-y-3">
                      {/* Services Total */}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Services:</span>
                        <span className="font-medium">
                          {formatCurrency(
                            selectedAppointment.price - 
                            (selectedAppointment.products?.reduce((sum, p) => sum + (p.price * p.quantity), 0) || 0)
                          )}
                        </span>
                      </div>
                      
                      {/* Products Total */}
                      {selectedAppointment.products && selectedAppointment.products.length > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Products:</span>
                          <span className="font-medium">
                            {formatCurrency(
                              selectedAppointment.products.reduce((sum, p) => sum + (p.price * p.quantity), 0)
                            )}
                          </span>
                        </div>
                      )}
                      
                      {/* Service Charges */}
                      {selectedAppointment.serviceCharges && selectedAppointment.serviceCharges > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Service Charges:</span>
                          <span className="font-medium">{formatCurrency(selectedAppointment.serviceCharges)}</span>
                        </div>
                      )}
                      
                      {/* Discount */}
                      {selectedAppointment.discount && selectedAppointment.discount > 0 && (
                        <div className="flex justify-between items-center text-green-600">
                          <span>Discount:</span>
                          <span className="font-medium">
                            -{formatCurrency(
                              selectedAppointment.discountType === 'percentage'
                                ? (selectedAppointment.price * selectedAppointment.discount) / 100
                                : selectedAppointment.discount
                            )}
                          </span>
                        </div>
                      )}
                      
                      {/* Tax */}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Tax ({selectedAppointment.tax || 5}%):</span>
                        <span className="font-medium">
                          {formatCurrency(
                            (selectedAppointment.price * (selectedAppointment.tax || 5)) / 100
                          )}
                        </span>
                      </div>
                      
                      {/* Tips */}
                      {(selectedAppointment.serviceTip || (selectedAppointment.teamMembers && selectedAppointment.teamMembers.length > 0)) && (
                        <div className="flex justify-between items-center text-blue-600">
                          <span>Tips:</span>
                          <span className="font-medium">
                            {formatCurrency(
                              (selectedAppointment.serviceTip || 0) + 
                              (selectedAppointment.teamMembers?.reduce((sum, tm) => sum + tm.tip, 0) || 0)
                            )}
                          </span>
                        </div>
                      )}
                      
                      {/* Divider */}
                      <div className="border-t pt-3 mt-3">
                        <div className="flex justify-between items-center text-xl font-bold">
                          <span className="text-gray-900">Total Amount:</span>
                          <span className="text-green-600">{formatCurrency(selectedAppointment.price)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-6 p-6 bg-white border-2 border-gray-200 rounded-xl shadow-sm">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <FileText className="w-5 h-5 text-yellow-600" />
                  </div>
                  Additional Information
                </h3>
                
                <div className="space-y-6">
                  {/* Notes */}
                  {selectedAppointment.notes && (
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Special Notes & Instructions
                      </label>
                      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                        <p className="text-gray-800 italic">{selectedAppointment.notes}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Branch Location */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Branch Location
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <p className="font-medium text-gray-900">{selectedAppointment.branch}</p>
                    </div>
                  </div>
                  
                  {/* Timestamps */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Created</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(selectedAppointment.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(selectedAppointment.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Last Updated</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(selectedAppointment.updatedAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(selectedAppointment.updatedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4 p-6 bg-gray-50 border-2 border-gray-200 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Quick Actions
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Generate Invoice Button */}
                  {selectedAppointment.status === 'completed' && (
                    <Button
                      variant="outline"
                      className="h-12 flex items-center justify-center gap-3 border-2 border-blue-300 text-blue-700 hover:bg-blue-50 transition-colors"
                      onClick={() => handleGenerateInvoiceClick(selectedAppointment)}
                    >
                      <Receipt className="w-5 h-5" />
                      Generate Invoice
                    </Button>
                  )}
                  
                  {/* Status-based actions */}
                  {selectedAppointment.status === 'pending' && selectedAppointment.firebaseId && (
                    <>
                      <Button 
                        variant="outline" 
                        className="h-12 flex items-center justify-center gap-3 border-2 border-green-300 text-green-700 hover:bg-green-50 transition-colors"
                        onClick={() => handleApproveBooking(selectedAppointment.firebaseId as string)}
                      >
                        <CheckCircle className="w-5 h-5" />
                        Approve
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-12 flex items-center justify-center gap-3 border-2 border-red-300 text-red-700 hover:bg-red-50 transition-colors"
                        onClick={() => handleRejectBooking(selectedAppointment.firebaseId as string)}
                      >
                        <XCircle className="w-5 h-5" />
                        Reject
                      </Button>
                    </>
                  )}
                  
                  {/* View Invoice Button for PDF */}
                  <Button
                    variant="outline"
                    className="h-12 flex items-center justify-center gap-3 border-2 border-purple-300 text-purple-700 hover:bg-purple-50 transition-colors"
                    onClick={() => {
                      handleGenerateInvoiceClick(selectedAppointment);
                      setShowAppointmentDetails(false);
                    }}
                  >
                    <FileText className="w-5 h-5" />
                    View/Download PDF
                  </Button>
                 {/* Edit Appointment Button - ADD THIS IN ACTION BUTTONS SECTION */}
<Button
  variant="outline"
  className="h-12 flex items-center justify-center gap-3 border-2 border-green-300 text-green-700 hover:bg-green-50 transition-colors"
  onClick={() => {
    if (selectedAppointment) {
      handleEditAppointment(selectedAppointment);
    }
  }}
>
  <Edit className="w-5 h-5" />
  Edit Appointment
</Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* UPDATED: Booking Creation Dialog with Multiple Services */}
      <Sheet open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <SheetContent className="sm:max-w-[900px] w-full z-[60] overflow-y-auto">
          <SheetHeader className="border-b pb-4 mb-6">
            <SheetTitle className="text-xl font-semibold">Create New Booking</SheetTitle>
            <SheetDescription className="text-base">
              Schedule a new appointment for a customer.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 pb-6">
            {/* Customer Information */}
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
                    value={bookingData.customer}
                    onChange={(e) => setBookingData({...bookingData, customer: e.target.value})}
                    className="h-11"
                  />
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

                {/* Card Last 4 Digits & TRN Number */}
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
              </div>
            </div>

            {/* Category & Branch Selection */}
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
                    value={bookingData.category} 
                    onValueChange={handleCategoryChange}
                    disabled={!bookingData.branch}
                  >
                    <SelectTrigger className="h-11">
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
                        filteredCategories.map((category) => (
                          <SelectItem key={category.firebaseId} value={category.name}>
                            <div className="flex flex-col">
                              <span className="font-medium">{category.name}</span>
                              <span className="text-xs text-gray-500">
                                {category.branchName || 'No branch'} • {category.branchCity || 'No city'}
                              </span>
                            </div>
                          </SelectItem>
                        ))
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
                    <SelectTrigger className="h-11">
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
                              <div className="flex flex-col">
                                <span className="font-medium">{branch.name}</span>
                                <span className="text-xs text-gray-500">{branch.city} • {branch.phone}</span>
                              </div>
                            </SelectItem>
                          ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            
            {/* UPDATED: Multiple Services Selection - DROPDOWN VERSION */}
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
    {/* Service Selection DROPDOWN */}
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        Select Services from Dropdown
      </label>
      <Select 
        value="" 
        onValueChange={(serviceName) => handleServiceSelection(serviceName)}
        disabled={!bookingData.branch}
      >
        <SelectTrigger className="h-11">
          <SelectValue placeholder={bookingData.branch ? "Select services from dropdown..." : "First select a branch"} />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {loading.services ? (
            <div className="text-center py-2">
              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-xs text-gray-600 mt-1">Loading services...</p>
            </div>
          ) : filteredServices.length === 0 && bookingData.branch ? (
            <div className="text-center py-2">
              <AlertCircle className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
              <p className="text-sm text-gray-600">No services available for {bookingData.branch}</p>
            </div>
          ) : (
            filteredServices.map((service) => {
              const isSelected = selectedServices.some(s => s.name === service.name);
              return (
                <SelectItem 
                  key={service.firebaseId} 
                  value={service.name}
                  className={`flex items-center justify-between py-3 ${isSelected ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    <div className="text-left">
                      <span className={isSelected ? 'font-medium' : ''}>
                        {service.name}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span>{service.category}</span>
                        <span>•</span>
                        <span>{service.duration}min</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-primary">
                    {formatCurrency(service.price)}
                  </span>
                </SelectItem>
              );
            })
          )}
        </SelectContent>
      </Select>
      <p className="text-xs text-gray-500">
        Use dropdown to select services. Select multiple times to add multiple services.
      </p>
    </div>
    
    {/* Selected Services Summary */}
    {selectedServices.length > 0 ? (
      <div className="mt-4 p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
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
            {/* Service Staff Selection */}
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

                {/* Additional Team Members */}
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

                {/* Team Members List with Tips */}
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
                              placeholder="0.00"
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

            {/* Products */}
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

                {/* Selected Products List */}
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

            {/* UPDATED: Pricing with Multiple Services */}
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
                      value={bookingData.discount}
                      onChange={(e) => setBookingData({...bookingData, discount: parseFloat(e.target.value) || 0})}
                      placeholder="0.00"
                      className="h-11 flex-1"
                    />
                    <Select value={bookingData.discountType} onValueChange={(value) => setBookingData({...bookingData, discountType: value as 'fixed' | 'percentage'})}>
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
                    value={bookingData.serviceTip}
                    onChange={(e) => setBookingData({...bookingData, serviceTip: parseFloat(e.target.value) || 0})}
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
                    value={bookingData.tax}
                    onChange={(e) => setBookingData({...bookingData, tax: parseFloat(e.target.value) || 0})}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Service Charges ($)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={bookingData.serviceCharges}
                    onChange={(e) => setBookingData({...bookingData, serviceCharges: parseFloat(e.target.value) || 0})}
                    className="h-11"
                  />
                  <p className="text-xs text-gray-500">
                    Service price: {formatCurrency(selectedServices.reduce((sum, s) => sum + s.price, 0))} (from {selectedServices.length} service(s))
                  </p>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-4 mt-6">
                <label className="text-sm font-medium text-gray-700">Payment Methods</label>
                <div className="grid grid-cols-2 gap-4">
                  {['cash', 'card', 'check', 'digital'].map((method) => {
                    const isSelected = bookingData.paymentMethods.includes(method as any);
                    return (
                      <div key={method} className="space-y-2">
                        <div 
                          className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-blue-50 border-blue-300' : 'border-gray-200 hover:bg-gray-50'}`}
                          onClick={() => handlePaymentMethodToggle(method as any)}
                        >
                          <input
                            type="checkbox"
                            id={`method-${method}`}
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 text-blue-600"
                          />
                          <label htmlFor={`method-${method}`} className="text-sm font-medium cursor-pointer capitalize flex-1">
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
                              value={bookingData.paymentAmounts[method as 'cash' | 'card' | 'check' | 'digital'] || ''}
                              onChange={(e) => handlePaymentAmountChange(method as any, e.target.value)}
                              className="h-9 text-sm"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {bookingData.paymentMethods.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm font-medium text-blue-800 mb-2">Payment Summary:</div>
                    <div className="space-y-1">
                      {bookingData.paymentMethods.map(method => {
                        const amount = bookingData.paymentAmounts[method];
                        return amount > 0 ? (
                          <div key={method} className="flex justify-between text-sm">
                            <span className="capitalize">{method}:</span>
                            <span className="font-medium">{formatCurrency(amount)}</span>
                          </div>
                        ) : null;
                      })}
                      <div className="border-t pt-1 mt-1 font-medium">
                        <div className="flex justify-between">
                          <span>Total Paid:</span>
                          <span className="text-green-600">
                            {formatCurrency(
                              bookingData.paymentMethods.reduce(
                                (sum, method) => sum + bookingData.paymentAmounts[method], 0
                              )
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* UPDATED: Price Summary with Multiple Services */}
              <div className="mt-6 p-5 bg-white rounded-xl border-2 border-blue-200 shadow-sm">
                <h4 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  Price Summary (Including {selectedServices.length} Service(s))
                </h4>
                
                <div className="space-y-3">
                  {/* Services Breakdown */}
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
                    <span className="font-medium">{formatCurrency(parseFloat(calculateTax()))}</span>
                  </div>
                  
                  <div className="border-t pt-3 mt-2">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span className="text-gray-900">Total Amount:</span>
                      <span className="text-green-600 text-xl">{formatCurrency(parseFloat(calculateTotal()))}</span>
                    </div>
                    
                    {bookingData.paymentMethods.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-sm font-medium text-gray-600 mb-2">Payment Distribution:</div>
                        <div className="flex flex-wrap gap-2">
                          {bookingData.paymentMethods.map(method => {
                            const amount = bookingData.paymentAmounts[method];
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
            </div>

            {/* Status */}
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

            {/* Date & Time */}
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

            {/* Invoice Generation */}
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

            {/* Notes */}
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


      {/* EDIT APPOINTMENT DIALOG - COMPLETE FUNCTIONAL */}
<Sheet open={showEditDialog} onOpenChange={setShowEditDialog}>
  <SheetContent className="sm:max-w-[900px] w-full z-[70] overflow-y-auto">
    <SheetHeader className="border-b pb-4 mb-6">
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
      <div className="space-y-6 pb-6">
        {/* Customer Information */}
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

        {/* Category & Branch Selection */}
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
            </div>
          </div>
        </div>

        {/* Services Selection for Edit */}
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

        {/* Staff Selection */}
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

            {/* Team Members List */}
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
                          placeholder="0.00"
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

        {/* Products for Edit */}
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

            {/* Selected Products List */}
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

        {/* Pricing for Edit */}
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

          {/* Payment Methods for Edit */}
          <div className="space-y-4 mt-6">
            <label className="text-sm font-medium text-gray-700">Payment Methods</label>
            <div className="grid grid-cols-2 gap-4">
              {['cash', 'card', 'check', 'digital'].map((method) => {
                const isSelected = editBookingData.paymentMethods.includes(method as any);
                return (
                  <div key={method} className="space-y-2">
                    <div 
                      className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-blue-50 border-blue-300' : 'border-gray-200 hover:bg-gray-50'}`}
                      onClick={() => {
                        const newMethods = isSelected 
                          ? editBookingData.paymentMethods.filter(m => m !== method)
                          : [...editBookingData.paymentMethods, method as any];
                        setEditBookingData({...editBookingData, paymentMethods: newMethods});
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
                            setEditBookingData({...editBookingData, paymentAmounts: newAmounts});
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

        {/* Date & Time for Edit */}
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

        {/* Status for Edit */}
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

        {/* Notes for Edit */}
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

      {/* UPDATED: Editable Invoice Popup with Multiple Services */}
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
              {/* Invoice Preview Header */}
              <div className="bg-gradient-to-r from-primary/5 to-secondary/5 p-6 rounded-lg border">
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

              {/* Editable Invoice Form */}
              <div className="space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                {/* Services Section - MULTIPLE SERVICES */}
                <div className="space-y-4 p-4 bg-white border rounded-lg">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Scissors className="w-5 h-5 text-primary" />
                    Services ({invoiceData.services ? invoiceData.services.length : 1})
                  </h4>
                  
                  <div className="space-y-3">
                    {/* Display Multiple Services */}
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
                
                {/* Customer Information */}
                <div className="space-y-4 p-4 bg-white border rounded-lg">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Customer Information
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Customer Name</label>
                      <Input
                        value={invoiceData.customer}
                        onChange={(e) => handleInvoiceDataChange('customer', e.target.value)}
                        className="h-10"
                      />
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

                {/* Service Details */}
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

                {/* Invoice Items */}
                <div className="space-y-4 p-4 bg-white border rounded-lg">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Invoice Items
                  </h4>
                  
                  <div className="space-y-3">
                    {invoiceData.items?.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <Input
                            value={item.name}
                            onChange={(e) => {
                              const newItems = [...(invoiceData.items || [])];
                              newItems[index].name = e.target.value;
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
                              newItems[index].quantity = parseInt(e.target.value) || 1;
                              newItems[index].total = newItems[index].quantity * newItems[index].price;
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
                              newItems[index].price = parseFloat(e.target.value) || 0;
                              newItems[index].total = newItems[index].quantity * newItems[index].price;
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
                          onClick={() => handleRemoveInvoiceItem(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddInvoiceItem}
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </div>

                {/* Team Members Tips */}
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

                {/* Pricing Summary */}
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
                    
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700">Tax (%)</label>
                        <Input
                          type="number"
                          value={invoiceData.tax}
                          onChange={(e) => handleInvoiceDataChange('tax', parseFloat(e.target.value) || 0)}
                          className="h-10"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700">Discount ($)</label>
                        <Input
                          type="number"
                          value={invoiceData.discount || 0}
                          onChange={(e) => handleInvoiceDataChange('discount', parseFloat(e.target.value) || 0)}
                          className="h-10"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700">Service Charges ($)</label>
                        <Input
                          type="number"
                          value={invoiceData.serviceCharges || 0}
                          onChange={(e) => handleInvoiceDataChange('serviceCharges', parseFloat(e.target.value) || 0)}
                          className="h-10"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-sm font-medium text-gray-700">Service Tip ($)</label>
                        <Input
                          type="number"
                          value={invoiceData.serviceTip || 0}
                          onChange={(e) => handleInvoiceDataChange('serviceTip', parseFloat(e.target.value) || 0)}
                          className="h-10"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t">
                      <span className="text-lg font-semibold text-gray-900">Total:</span>
                      <span className="text-xl font-bold text-green-600">
                        {formatCurrency(invoiceData.total || 0)}
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
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Digital Wallet">Digital Wallet</SelectItem>
                      <SelectItem value="Multiple">Multiple Methods</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
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

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-6 border-t sticky bottom-0 bg-white">
                <Button
                  variant="outline"
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-6 h-11"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDownloadInvoicePDF}
                  className="px-6 h-11 bg-primary hover:bg-primary/90 gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF Invoice with All Fields
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </ProtectedRoute>
  );
}