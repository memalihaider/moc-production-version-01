'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, Phone, Mail, Calendar, Clock, Scissors, Building, 
  DollarSign, CreditCard, Hash, Package, Plus, XCircle, 
  FileText, Receipt, Printer, Download, Search, Filter,
  Trash2, Eye, FileEdit, History, Tag, Box, AlertCircle,
  CheckCircle2, Loader2, ChevronDown, ChevronUp, MoreVertical,
  Palette, Layout, Briefcase, Sparkles, Minimize2
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AdminSidebar, AdminMobileSidebar } from "@/components/admin/AdminSidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

// Firebase imports
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  where 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Unsubscribe } from 'firebase/firestore';

// Types
interface TeamMember {
  name: string;
  tip: number;
}

interface ProductItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
}

interface PaymentAmounts {
  cash: number;
  card: number;
  check: number;
  digital: number;
}

interface InvoiceData {
  id?: string;
  invoiceNumber: string;
  customer: string;
  email: string;
  phone: string;
  service: string;
  category: string;
  branch: string;
  date: string;
  time: string;
  staff: string;
  price: number;
  brandEmail: string;
  brandPhone: string;
  cardLast4Digits: string;
  trnNumber: string;
  teamMembers: TeamMember[];
  products: ProductItem[];
  discount: number;
  discountType: 'fixed' | 'percentage';
  serviceTip: number;
  tax: number;
  serviceCharges: number;
  paymentMethods: ('cash' | 'card' | 'check' | 'digital')[];
  paymentAmounts: PaymentAmounts;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  notes: string;
  createdAt: Date;
  updatedAt?: Date;
}

interface Service {
  id: string;
  name: string;
  price: number;
  category: string;
  duration: number;
  description?: string;
  status: 'active' | 'inactive';
  branchNames?: string[];
}

interface Branch {
  id: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive';
  invoiceTemplate?: string;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  type: 'product' | 'service';
  isActive: boolean;
  branchName?: string;
  branchCity?: string;
}

interface Staff {
  id: string;
  name: string;
  role: string;
  rating: number;
  branch: string;
  status: 'active' | 'inactive';
}

// Template Types
type TemplateType = 'classic' | 'modern' | 'professional' | 'colorful' | 'minimal';

export default function SuperAdminInvoices() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State for data
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Invoice Form State
  const [invoiceForm, setInvoiceForm] = useState<InvoiceData>({
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    customer: '',
    email: '',
    phone: '',
    service: '',
    category: '',
    branch: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    staff: '',
    price: 0,
    brandEmail: "info@company.com",
    brandPhone: "+1 (555) 123-4567",
    cardLast4Digits: '',
    trnNumber: '',
    teamMembers: [],
    products: [],
    discount: 0,
    discountType: 'fixed',
    serviceTip: 0,
    tax: 5, // Default 5%
    serviceCharges: 0,
    paymentMethods: [],
    paymentAmounts: { cash: 0, card: 0, check: 0, digital: 0 },
    status: 'draft',
    notes: '',
    createdAt: new Date()
  });

  // Dialog states
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('classic');
  const [previewTemplate, setPreviewTemplate] = useState<TemplateType>('classic');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // 🔥 Firebase se real-time invoices fetch
  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const invoicesRef = collection(db, 'customInvoices');
        const q = query(invoicesRef, orderBy('createdAt', 'desc'));
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const invoicesData: InvoiceData[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            const createdAt = data.createdAt as Timestamp;
            const updatedAt = data.updatedAt as Timestamp;
            
            invoicesData.push({
              id: doc.id,
              invoiceNumber: data.invoiceNumber || `INV-${doc.id.slice(-6)}`,
              customer: data.customer || '',
              email: data.email || '',
              phone: data.phone || '',
              service: data.service || '',
              category: data.category || '',
              branch: data.branch || '',
              date: data.date || '',
              time: data.time || '',
              staff: data.staff || '',
              price: data.price || 0,
              brandEmail: data.brandEmail || "info@company.com",
              brandPhone: data.brandPhone || "+1 (555) 123-4567",
              cardLast4Digits: data.cardLast4Digits || '',
              trnNumber: data.trnNumber || '',
              teamMembers: data.teamMembers || [],
              products: data.products || [],
              discount: data.discount || 0,
              discountType: data.discountType || 'fixed',
              serviceTip: data.serviceTip || 0,
              tax: data.tax || 5,
              serviceCharges: data.serviceCharges || 0,
              paymentMethods: data.paymentMethods || [],
              paymentAmounts: data.paymentAmounts || { cash: 0, card: 0, check: 0, digital: 0 },
              status: data.status || 'draft',
              notes: data.notes || '',
              createdAt: createdAt?.toDate() || new Date(),
              updatedAt: updatedAt?.toDate()
            });
          });
          
          setInvoices(invoicesData);
          setLoading(false);
        }, (error) => {
          console.error("Error fetching invoices: ", error);
          setLoading(false);
        });

      } catch (error) {
        console.error("Error in fetchInvoices: ", error);
        setLoading(false);
      }
    };

    fetchInvoices();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // 🔥 Fetch Services, Branches, Categories, Staff
  useEffect(() => {
    const unsubServices = onSnapshot(collection(db, 'services'), (snap) => {
      const srv = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Service[];
      setServices(srv.filter(s => s.status === 'active'));
    });

    const unsubBranches = onSnapshot(collection(db, 'branches'), (snap) => {
      const br = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Branch[];
      setBranches(br.filter(b => b.status === 'active'));
    });

    const unsubCategories = onSnapshot(collection(db, 'categories'), (snap) => {
      const cat = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];
      setCategories(cat.filter(c => c.isActive && c.type === 'service'));
    });

    const unsubStaff = onSnapshot(collection(db, 'staff'), (snap) => {
      const stf = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Staff[];
      setStaffList(stf.filter(s => s.status === 'active'));
    });

    return () => {
      unsubServices();
      unsubBranches();
      unsubCategories();
      unsubStaff();
    };
  }, []);

  // Calculate totals
  const calculateSubtotal = () => {
    const servicePrice = invoiceForm.price || 0;
    const productsTotal = invoiceForm.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const serviceCharges = invoiceForm.serviceCharges || 0;
    return servicePrice + productsTotal + serviceCharges;
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    if (invoiceForm.discountType === 'percentage') {
      return (subtotal * invoiceForm.discount) / 100;
    }
    return invoiceForm.discount || 0;
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    return ((subtotal - discount) * invoiceForm.tax) / 100;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const tax = calculateTax();
    const tips = invoiceForm.serviceTip + invoiceForm.teamMembers.reduce((sum, tm) => sum + tm.tip, 0);
    return (subtotal - discount + tax + tips);
  };

  const calculateTotalPaid = () => {
    return Object.values(invoiceForm.paymentAmounts).reduce((sum, amount) => sum + amount, 0);
  };

  // Payment Methods Handlers
  const handlePaymentMethodToggle = (method: 'cash' | 'card' | 'check' | 'digital') => {
    const currentMethods = [...invoiceForm.paymentMethods];
    const isSelected = currentMethods.includes(method);
    
    if (isSelected) {
      // Remove method and reset its amount
      const updatedMethods = currentMethods.filter(m => m !== method);
      const updatedAmounts = { ...invoiceForm.paymentAmounts, [method]: 0 };
      setInvoiceForm({
        ...invoiceForm,
        paymentMethods: updatedMethods,
        paymentAmounts: updatedAmounts
      });
    } else {
      // Add method
      setInvoiceForm({
        ...invoiceForm,
        paymentMethods: [...currentMethods, method]
      });
    }
  };

  const handlePaymentAmountChange = (method: 'cash' | 'card' | 'check' | 'digital', value: string) => {
    const amount = parseFloat(value) || 0;
    setInvoiceForm({
      ...invoiceForm,
      paymentAmounts: { ...invoiceForm.paymentAmounts, [method]: amount }
    });
  };

  // Product handlers
  const handleAddProduct = () => {
    // For demo - you can connect to actual products from Firebase
    const newProduct: ProductItem = {
      id: `prod-${Date.now()}`,
      name: 'Sample Product',
      category: 'General',
      price: 10,
      quantity: 1
    };
    setInvoiceForm({
      ...invoiceForm,
      products: [...invoiceForm.products, newProduct]
    });
  };

  const handleRemoveProduct = (index: number) => {
    const newProducts = [...invoiceForm.products];
    newProducts.splice(index, 1);
    setInvoiceForm({ ...invoiceForm, products: newProducts });
  };

  const handleUpdateProduct = (index: number, field: keyof ProductItem, value: any) => {
    const newProducts = [...invoiceForm.products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setInvoiceForm({ ...invoiceForm, products: newProducts });
  };

  // Team Members handlers
  const handleAddTeamMember = (name: string) => {
    if (name && !invoiceForm.teamMembers.some(tm => tm.name === name)) {
      setInvoiceForm({
        ...invoiceForm,
        teamMembers: [...invoiceForm.teamMembers, { name, tip: 0 }]
      });
    }
  };

  const handleRemoveTeamMember = (index: number) => {
    const newTeamMembers = [...invoiceForm.teamMembers];
    newTeamMembers.splice(index, 1);
    setInvoiceForm({ ...invoiceForm, teamMembers: newTeamMembers });
  };

  // ==================== PDF TEMPLATE GENERATORS ====================

  // 1. CLASSIC TEMPLATE (Original)
  const generateClassicTemplate = (doc: jsPDF, invoice: InvoiceData) => {
    // Brand Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(59, 130, 246); // Blue color
    doc.text("INVOICE", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`#${invoice.invoiceNumber}`, 105, 28, { align: "center" });
    
    // Brand Info
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text("Company Name", 20, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Email: ${invoice.brandEmail}`, 20, 46);
    doc.text(`Phone: ${invoice.brandPhone}`, 20, 52);
    
    // Invoice Details
    doc.setFont("helvetica", "bold");
    doc.text("Invoice Details", 150, 40);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${invoice.date}`, 150, 46);
    doc.text(`Time: ${invoice.time}`, 150, 52);
    doc.text(`Status: ${invoice.status.toUpperCase()}`, 150, 58);
    
    // Customer Info
    doc.setFont("helvetica", "bold");
    doc.text("Bill To:", 20, 70);
    doc.setFont("helvetica", "normal");
    doc.text(invoice.customer, 20, 76);
    doc.text(`Email: ${invoice.email}`, 20, 82);
    doc.text(`Phone: ${invoice.phone}`, 20, 88);
    if (invoice.trnNumber) {
      doc.text(`TRN: ${invoice.trnNumber}`, 20, 94);
    }
    
    // Service Details
    doc.setFont("helvetica", "bold");
    doc.text("Service Details", 20, 105);
    doc.setFont("helvetica", "normal");
    doc.text(`Service: ${invoice.service}`, 20, 111);
    doc.text(`Category: ${invoice.category}`, 20, 117);
    doc.text(`Branch: ${invoice.branch}`, 20, 123);
    doc.text(`Staff: ${invoice.staff}`, 20, 129);
    
    if (invoice.teamMembers.length > 0) {
      doc.text("Team Members:", 20, 135);
      invoice.teamMembers.forEach((tm, idx) => {
        doc.text(`  • ${tm.name} (Tip: $${tm.tip})`, 20, 141 + (idx * 6));
      });
    }
    
    // Items Table
    const tableStartY = invoice.teamMembers.length > 0 ? 141 + (invoice.teamMembers.length * 6) : 141;
    
    autoTable(doc, {
      startY: tableStartY,
      head: [['Description', 'Qty', 'Unit Price (AED)', 'Total (AED)']],
      body: [
        // Service row
        [invoice.service, '1', invoice.price.toFixed(2), invoice.price.toFixed(2)],
        // Products rows
        ...invoice.products.map(p => [
          p.name,
          p.quantity.toString(),
          p.price.toFixed(2),
          (p.price * p.quantity).toFixed(2)
        ]),
        // Service charges
        ['Service Charges', '1', invoice.serviceCharges.toFixed(2), invoice.serviceCharges.toFixed(2)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 20, right: 20 }
    });
    
    // Summary
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Subtotal:", 140, finalY);
    doc.text(`$${calculateSubtotal().toFixed(2)}`, 170, finalY, { align: "right" });
    
    doc.text(`Discount (${invoice.discountType}):`, 140, finalY + 6);
    doc.text(`-$${calculateDiscount().toFixed(2)}`, 170, finalY + 6, { align: "right" });
    
    doc.text(`Tax (${invoice.tax}%):`, 140, finalY + 12);
    doc.text(`$${calculateTax().toFixed(2)}`, 170, finalY + 12, { align: "right" });
    
    doc.text(`Tips:`, 140, finalY + 18);
    const totalTips = invoice.serviceTip + invoice.teamMembers.reduce((sum, tm) => sum + tm.tip, 0);
    doc.text(`$${totalTips.toFixed(2)}`, 170, finalY + 18, { align: "right" });
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("TOTAL:", 140, finalY + 28);
    doc.text(`$${calculateTotal().toFixed(2)}`, 170, finalY + 28, { align: "right" });
    
    // Payment Summary
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Payment Summary:", 20, finalY + 40);
    
    invoice.paymentMethods.forEach((method, idx) => {
      const amount = invoice.paymentAmounts[method];
      if (amount > 0) {
        doc.text(`${method.toUpperCase()}: $${amount.toFixed(2)}`, 20, finalY + 46 + (idx * 6));
      }
    });
    
    doc.text(`Total Paid: $${calculateTotalPaid().toFixed(2)}`, 20, finalY + 46 + (invoice.paymentMethods.length * 6));
    doc.text(`Balance: $${(calculateTotal() - calculateTotalPaid()).toFixed(2)}`, 20, finalY + 52 + (invoice.paymentMethods.length * 6));
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Thank you for your business!", 105, 280, { align: "center" });
    doc.text("Generated on: " + new Date().toLocaleDateString(), 105, 284, { align: "center" });
  };

  // 2. MODERN TEMPLATE
  const generateModernTemplate = (doc: jsPDF, invoice: InvoiceData) => {
    // Gradient Header
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, 210, 40, 'F');
    
    // White text on blue
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("INVOICE", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`#${invoice.invoiceNumber}`, 105, 28, { align: "center" });
    
    // White content area
    doc.setFillColor(255, 255, 255);
    doc.rect(15, 50, 180, 200, 'F');
    
    // Modern grid layout
    doc.setTextColor(51, 51, 51);
    doc.setFontSize(9);
    
    // Two column layout
    doc.setFont("helvetica", "bold");
    doc.text("FROM", 25, 60);
    doc.text("BILL TO", 120, 60);
    
    doc.setFont("helvetica", "normal");
    doc.text("Your Company Name", 25, 67);
    doc.text(invoice.brandEmail, 25, 73);
    doc.text(invoice.brandPhone, 25, 79);
    
    doc.text(invoice.customer, 120, 67);
    doc.text(invoice.email, 120, 73);
    doc.text(invoice.phone, 120, 79);
    
    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(25, 90, 185, 90);
    
    // Invoice details in cards
    const details = [
      { label: 'Date', value: invoice.date },
      { label: 'Service', value: invoice.service },
      { label: 'Branch', value: invoice.branch },
      { label: 'Staff', value: invoice.staff }
    ];
    
    details.forEach((detail, index) => {
      const x = 25 + (index % 2) * 80;
      const y = 100 + Math.floor(index / 2) * 20;
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(detail.label, x, y);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 51, 51);
      doc.text(detail.value, x, y + 5);
    });
    
    // Modern table
    const tableStartY = 140;
    
    autoTable(doc, {
      startY: tableStartY,
      head: [['ITEM', 'QTY', 'PRICE', 'TOTAL']],
      body: [
        [invoice.service, '1', `$${invoice.price.toFixed(2)}`, `$${invoice.price.toFixed(2)}`],
        ...invoice.products.map(p => [
          p.name,
          p.quantity.toString(),
          `$${p.price.toFixed(2)}`,
          `$${(p.price * p.quantity).toFixed(2)}`
        ])
      ],
      theme: 'grid',
      headStyles: { 
        fillColor: [248, 250, 252],
        textColor: [71, 85, 105],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 20 },
        2: { cellWidth: 40 },
        3: { cellWidth: 40 }
      },
      margin: { left: 25, right: 25 }
    });
    
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    // Totals in modern style
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    
    const totals = [
      { label: 'Subtotal', value: calculateSubtotal() },
      { label: `Discount (${invoice.discountType})`, value: -calculateDiscount() },
      { label: `Tax (${invoice.tax}%)`, value: calculateTax() },
      { label: 'Tips', value: invoice.serviceTip + invoice.teamMembers.reduce((sum, tm) => sum + tm.tip, 0) }
    ];
    
    totals.forEach((total, index) => {
      doc.text(total.label, 130, finalY + (index * 6));
      doc.text(`$${total.value.toFixed(2)}`, 180, finalY + (index * 6), { align: "right" });
    });
    
    // Grand total
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(59, 130, 246);
    doc.line(130, finalY + 28, 185, finalY + 28);
    doc.text("TOTAL", 130, finalY + 25);
    doc.text(`$${calculateTotal().toFixed(2)}`, 180, finalY + 25, { align: "right" });
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Thank you for choosing us!", 105, 280, { align: "center" });
  };

  // 3. PROFESSIONAL TEMPLATE
  const generateProfessionalTemplate = (doc: jsPDF, invoice: InvoiceData) => {
    // Formal header with lines
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    
    // Top border
    doc.line(20, 20, 190, 20);
    
    // Company name and logo area
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("COMPANY NAME", 105, 35, { align: "center" });
    
    // Tax Invoice title
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text("TAX INVOICE", 105, 45, { align: "center" });
    
    // Invoice number with border
    doc.setFillColor(240, 240, 240);
    doc.rect(140, 55, 50, 12, 'F');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 145, 63);
    
    // Formal details table
    const details = [
      { label: 'Invoice Date', value: invoice.date },
      { label: 'Customer Name', value: invoice.customer },
      { label: 'Customer Email', value: invoice.email },
      { label: 'Customer Phone', value: invoice.phone },
      { label: 'TRN Number', value: invoice.trnNumber || 'N/A' }
    ];
    
    let y = 75;
    details.forEach((detail) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(detail.label, 25, y);
      
      doc.setFont("helvetica", "normal");
      doc.text(detail.value, 80, y);
      y += 6;
    });
    
    // Service details
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Service Details", 25, y);
    y += 8;
    
    const serviceDetails = [
      { label: 'Service', value: invoice.service },
      { label: 'Category', value: invoice.category },
      { label: 'Branch', value: invoice.branch },
      { label: 'Staff', value: invoice.staff }
    ];
    
    serviceDetails.forEach((detail) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`${detail.label}:`, 25, y);
      doc.text(detail.value, 70, y);
      y += 5;
    });
    
    // Professional table
    const tableStartY = y + 10;
    
    autoTable(doc, {
      startY: tableStartY,
      head: [['Description', 'Quantity', 'Unit Price (USD)', 'Amount (USD)']],
      body: [
        [invoice.service, '1', invoice.price.toFixed(2), invoice.price.toFixed(2)],
        ...invoice.products.map(p => [
          p.name,
          p.quantity.toString(),
          p.price.toFixed(2),
          (p.price * p.quantity).toFixed(2)
        ])
      ],
      theme: 'striped',
      headStyles: { 
        fillColor: [50, 50, 50],
        textColor: [255, 255, 255],
        fontSize: 9
      },
      bodyStyles: { fontSize: 9 },
      margin: { left: 25, right: 25 }
    });
    
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    // Calculation table
    const calculations = [
      { label: 'Subtotal', value: calculateSubtotal() },
      { label: `Discount`, value: -calculateDiscount() },
      { label: `Tax (${invoice.tax}%)`, value: calculateTax() },
      { label: 'Service Charges', value: invoice.serviceCharges }
    ];
    
    calculations.forEach((calc, index) => {
      doc.setFontSize(9);
      doc.text(calc.label, 130, finalY + (index * 5));
      doc.text(`$${calc.value.toFixed(2)}`, 180, finalY + (index * 5), { align: "right" });
    });
    
    // Grand Total
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.line(130, finalY + 25, 180, finalY + 25);
    doc.text("GRAND TOTAL", 130, finalY + 22);
    doc.text(`$${calculateTotal().toFixed(2)}`, 180, finalY + 22, { align: "right" });
    
    // Payment summary
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Payment Summary", 25, finalY + 40);
    
    let paymentY = finalY + 47;
    invoice.paymentMethods.forEach((method) => {
      const amount = invoice.paymentAmounts[method];
      if (amount > 0) {
        doc.text(`${method.charAt(0).toUpperCase() + method.slice(1)}: $${amount.toFixed(2)}`, 25, paymentY);
        paymentY += 5;
      }
    });
    
    // Terms and conditions
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Terms & Conditions:", 25, 270);
    doc.text("1. Payment due within 30 days", 25, 275);
    doc.text("2. Late fees may apply", 25, 280);
    doc.text("3. All amounts in USD", 25, 285);
  };

  // 4. COLORFUL TEMPLATE
  const generateColorfulTemplate = (doc: jsPDF, invoice: InvoiceData) => {
    // Colorful header with multiple colors
    const colors = [
      [255, 107, 107], // Coral
      [255, 159, 67],  // Orange
      [255, 205, 86],  // Yellow
      [72, 187, 120],  // Green
      [54, 162, 235],  // Blue
    ];
    
    // Colorful header strips
    colors.forEach((color, index) => {
      doc.setFillColor(...(color as [number, number, number]));
      doc.rect(0, index * 10, 210, 10, 'F');
    });
    
    // White text on colorful background
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.text("INVOICE", 105, 32, { align: "center" });
    
    // Invoice number in bubble
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(85, 40, 40, 12, 6, 6, 'F');
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(10);
    doc.text(invoice.invoiceNumber, 105, 47, { align: "center" });
    
    // White content area
    doc.setFillColor(255, 255, 255);
    doc.rect(15, 65, 180, 190, 'F');
    
    // Colorful customer info boxes
    doc.setFillColor(240, 249, 255);
    doc.roundedRect(20, 70, 170, 40, 5, 5, 'F');
    
    doc.setTextColor(59, 130, 246);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("BILL TO", 25, 80);
    
    doc.setTextColor(51, 51, 51);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(invoice.customer, 25, 87);
    doc.text(invoice.email, 25, 93);
    doc.text(invoice.phone, 25, 99);
    
    // Colorful service details
    const serviceBoxes = [
      { label: 'Service', value: invoice.service, color: [255, 107, 107] },
      { label: 'Date', value: invoice.date, color: [255, 159, 67] },
      { label: 'Branch', value: invoice.branch, color: [72, 187, 120] },
      { label: 'Staff', value: invoice.staff, color: [54, 162, 235] }
    ];
    
    serviceBoxes.forEach((box, index) => {
      const x = 20 + (index % 2) * 85;
      const y = 120 + Math.floor(index / 2) * 25;
      
      doc.setFillColor(...(box.color as [number, number, number]));
      doc.roundedRect(x, y, 80, 20, 3, 3, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(box.label, x + 5, y + 8);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(box.value, x + 5, y + 15);
    });
    
    // Colorful table
    const tableStartY = 170;
    
    autoTable(doc, {
      startY: tableStartY,
      head: [['ITEM', 'QUANTITY', 'PRICE', 'TOTAL']],
      body: [
        [invoice.service, '1', `$${invoice.price.toFixed(2)}`, `$${invoice.price.toFixed(2)}`],
        ...invoice.products.map(p => [
          p.name,
          p.quantity.toString(),
          `$${p.price.toFixed(2)}`,
          `$${(p.price * p.quantity).toFixed(2)}`
        ])
      ],
      theme: 'grid',
      headStyles: { 
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255]
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 20, right: 20 }
    });
    
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    // Colorful totals
    doc.setFontSize(10);
    
    const colorfulTotals = [
      { label: 'Subtotal', value: calculateSubtotal(), color: [100, 116, 139] },
      { label: 'Discount', value: -calculateDiscount(), color: [34, 197, 94] },
      { label: `Tax (${invoice.tax}%)`, value: calculateTax(), color: [59, 130, 246] },
      { label: 'Tips', value: invoice.serviceTip + invoice.teamMembers.reduce((sum, tm) => sum + tm.tip, 0), color: [168, 85, 247] }
    ];
    
    colorfulTotals.forEach((total, index) => {
      doc.setTextColor(...(total.color as [number, number, number]));
      doc.text(total.label, 130, finalY + (index * 6));
      doc.text(`$${total.value.toFixed(2)}`, 180, finalY + (index * 6), { align: "right" });
    });
    
    // Grand total with colorful background
    doc.setFillColor(59, 130, 246);
    doc.roundedRect(130, finalY + 28, 50, 15, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("TOTAL", 135, finalY + 38);
    doc.text(`$${calculateTotal().toFixed(2)}`, 175, finalY + 38, { align: "right" });
    
    // Fun footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("🌟 Thank you for your awesome business! 🌟", 105, 280, { align: "center" });
  };

  // 5. MINIMAL TEMPLATE
  const generateMinimalTemplate = (doc: jsPDF, invoice: InvoiceData) => {
    // Minimal header with just invoice number
    doc.setTextColor(75, 85, 99);
    doc.setFont("helvetica", "light");
    doc.setFontSize(14);
    doc.text("INVOICE", 20, 25);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`#${invoice.invoiceNumber}`, 20, 32);
    
    // Simple divider
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(20, 38, 190, 38);
    
    // Minimal customer info
    doc.setFontSize(9);
    doc.text("BILL TO", 20, 48);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(invoice.customer, 20, 55);
    
    doc.setFontSize(9);
    doc.text(invoice.email, 20, 62);
    doc.text(invoice.phone, 20, 68);
    
    // Minimal service info in grid
    const serviceInfo = [
      { label: 'Date', value: invoice.date },
      { label: 'Service', value: invoice.service },
      { label: 'Staff', value: invoice.staff }
    ];
    
    let infoY = 80;
    serviceInfo.forEach((info) => {
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.text(info.label, 20, infoY);
      
      doc.setFontSize(9);
      doc.setTextColor(31, 41, 55);
      doc.text(info.value, 20, infoY + 4);
      
      infoY += 12;
    });
    
    // Simple table without borders
    const tableStartY = infoY + 10;
    
    autoTable(doc, {
      startY: tableStartY,
      head: [['Item', 'Qty', 'Price', 'Total']],
      body: [
        [invoice.service, '1', invoice.price.toFixed(2), invoice.price.toFixed(2)],
        ...invoice.products.map(p => [
          p.name,
          p.quantity.toString(),
          p.price.toFixed(2),
          (p.price * p.quantity).toFixed(2)
        ])
      ],
      theme: 'plain',
      headStyles: { 
        textColor: [75, 85, 99],
        fontStyle: 'bold',
        fontSize: 9,
        lineWidth: 0
      },
      bodyStyles: { 
        fontSize: 9,
        lineWidth: 0
      },
      margin: { left: 20, right: 20 }
    });
    
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    
    // Minimal totals
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    
    const minimalTotals = [
      { label: 'Subtotal', value: calculateSubtotal() },
      { label: 'Discount', value: -calculateDiscount() },
      { label: `Tax`, value: calculateTax() }
    ];
    
    minimalTotals.forEach((total, index) => {
      doc.text(total.label, 140, finalY + (index * 6));
      doc.text(`$${total.value.toFixed(2)}`, 180, finalY + (index * 6), { align: "right" });
    });
    
    // Grand total with minimal underline
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.5);
    doc.line(140, finalY + 25, 180, finalY + 25);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(31, 41, 55);
    doc.text("Total", 140, finalY + 22);
    doc.text(`$${calculateTotal().toFixed(2)}`, 180, finalY + 22, { align: "right" });
    
    // Minimal payment info
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    
    let paymentY = finalY + 40;
    doc.text("Payment Methods:", 20, paymentY);
    
    paymentY += 6;
    invoice.paymentMethods.forEach((method) => {
      const amount = invoice.paymentAmounts[method];
      if (amount > 0) {
        doc.text(`${method}: $${amount.toFixed(2)}`, 20, paymentY);
        paymentY += 4;
      }
    });
    
    // Ultra minimal footer
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text("Invoice generated electronically", 105, 285, { align: "center" });
  };

  // ==================== MAIN PDF GENERATOR ====================
  const generateInvoicePDF = async (
    invoice: InvoiceData, 
    templateType: TemplateType = selectedTemplate, 
    download = true
  ) => {
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      
      // Select template based on user choice
      switch(templateType) {
        case 'modern':
          generateModernTemplate(doc, invoice);
          break;
        case 'professional':
          generateProfessionalTemplate(doc, invoice);
          break;
        case 'colorful':
          generateColorfulTemplate(doc, invoice);
          break;
        case 'minimal':
          generateMinimalTemplate(doc, invoice);
          break;
        default:
          generateClassicTemplate(doc, invoice);
      }
      
      if (download) {
        doc.save(`Invoice_${invoice.invoiceNumber}_${templateType}.pdf`);
      }
      
      return doc;
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  // Save Invoice to Firebase
  const saveInvoice = async () => {
    try {
      setIsGenerating(true);
      
      // Validation
      if (!invoiceForm.customer.trim()) {
        alert('Please enter customer name');
        return;
      }
      
      if (!invoiceForm.service.trim()) {
        alert('Please select a service');
        return;
      }
      
      // Create invoice data
      const invoiceData = {
        ...invoiceForm,
        total: calculateTotal(),
        subtotal: calculateSubtotal(),
        discountAmount: calculateDiscount(),
        taxAmount: calculateTax(),
        totalPaid: calculateTotalPaid(),
        balance: calculateTotal() - calculateTotalPaid(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Save to Firebase
      const invoicesRef = collection(db, 'customInvoices');
      await addDoc(invoicesRef, invoiceData);
      
      // Generate PDF with selected template
      await generateInvoicePDF(invoiceForm, selectedTemplate, true);
      
      // Reset form
      setInvoiceForm({
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        customer: '',
        email: '',
        phone: '',
        service: '',
        category: '',
        branch: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        staff: '',
        price: 0,
        brandEmail: "info@company.com",
        brandPhone: "+1 (555) 123-4567",
        cardLast4Digits: '',
        trnNumber: '',
        teamMembers: [],
        products: [],
        discount: 0,
        discountType: 'fixed',
        serviceTip: 0,
        tax: 5,
        serviceCharges: 0,
        paymentMethods: [],
        paymentAmounts: { cash: 0, card: 0, check: 0, digital: 0 },
        status: 'draft',
        notes: '',
        createdAt: new Date()
      });
      
      setShowCreateInvoice(false);
      alert('Invoice created and saved successfully!');
      
    } catch (error) {
      console.error("Error saving invoice:", error);
      alert('Failed to save invoice. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesBranch = branchFilter === 'all' || invoice.branch === branchFilter;
    
    const matchesDate = dateFilter === 'all' || true; // Add date filtering logic here
    
    return matchesSearch && matchesStatus && matchesBranch && matchesDate;
  });

  // Calculate stats
  const totalInvoices = invoices.length;
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.price, 0);
  const pendingInvoices = invoices.filter(inv => inv.status === 'draft').length;
  const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Render loading state
  if (loading && invoices.length === 0) {
    return (
      <ProtectedRoute requiredRole="super_admin">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-secondary" />
            <p className="text-muted-foreground">Loading invoices...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="super_admin">
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar role="super_admin" onLogout={handleLogout} />
        <AdminMobileSidebar
          role="super_admin"
          onLogout={handleLogout}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          sidebarOpen ? "lg:ml-64" : "lg:ml-0"
        )}>
          {/* Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="flex items-center justify-between px-4 py-4 lg:px-8">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Invoice Generator</h1>
                  <p className="text-sm text-gray-600">Create, manage, and track all invoices</p>
                  {loading && invoices.length > 0 && (
                    <div className="flex items-center mt-1">
                      <Loader2 className="w-3 h-3 animate-spin mr-1 text-gray-400" />
                      <span className="text-xs text-gray-500">Syncing...</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button 
                  className="bg-secondary hover:bg-secondary/90"
                  onClick={() => setShowCreateInvoice(true)}
                  disabled={loading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Invoice
                </Button>
                <span className="text-sm text-gray-600 hidden sm:block">Welcome, {user?.email}</span>
                <Button variant="outline" onClick={handleLogout} className="hidden sm:flex">
                  Logout
                </Button>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            <div className="p-4 lg:p-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalInvoices}</div>
                    <p className="text-xs text-muted-foreground">
                      {pendingInvoices} pending
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(totalRevenue)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      From all invoices
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {paidInvoices}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Successfully collected
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(invoices.filter(inv => inv.status === 'draft').reduce((sum, inv) => sum + inv.price, 0))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Awaiting payment
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search invoices by customer, invoice #, or email..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter} disabled={loading}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={branchFilter} onValueChange={setBranchFilter} disabled={loading}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filter by branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Branches</SelectItem>
                        {branches.map(branch => (
                          <SelectItem key={branch.id} value={branch.name}>{branch.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Invoices History */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Invoice History</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                  >
                    {showHistory ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                    {showHistory ? 'Hide History' : 'Show History'}
                  </Button>
                </div>

                {showHistory && (
                  loading && invoices.length === 0 ? (
                    <div className="text-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600">Loading invoices...</p>
                    </div>
                  ) : filteredInvoices.length === 0 ? (
                    <div className="text-center py-12">
                      <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
                      <p className="text-gray-600 mb-4">
                        {searchTerm || statusFilter !== 'all' || branchFilter !== 'all'
                          ? 'Try adjusting your search or filter criteria'
                          : 'Get started by creating your first invoice'
                        }
                      </p>
                      <Button onClick={() => setShowCreateInvoice(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Invoice
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredInvoices.map((invoice) => (
                        <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-lg">{invoice.customer}</h3>
                                  <Badge className={cn(
                                    "capitalize",
                                    invoice.status === 'paid' ? "bg-green-100 text-green-800" :
                                    invoice.status === 'draft' ? "bg-yellow-100 text-yellow-800" :
                                    invoice.status === 'sent' ? "bg-blue-100 text-blue-800" :
                                    invoice.status === 'overdue' ? "bg-red-100 text-red-800" :
                                    "bg-gray-100 text-gray-800"
                                  )}>
                                    {invoice.status}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">
                                  {invoice.invoiceNumber} • {invoice.date} • {invoice.branch}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {invoice.service} • {formatCurrency(invoice.price)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedInvoice(invoice);
                                    setShowPreview(true);
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Download className="w-4 h-4 mr-2" />
                                      Download
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => generateInvoicePDF(invoice, 'classic', true)}>
                                      <Layout className="w-4 h-4 mr-2" />
                                      Classic Template
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => generateInvoicePDF(invoice, 'modern', true)}>
                                      <Sparkles className="w-4 h-4 mr-2" />
                                      Modern Template
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => generateInvoicePDF(invoice, 'professional', true)}>
                                      <Briefcase className="w-4 h-4 mr-2" />
                                      Professional Template
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => generateInvoicePDF(invoice, 'colorful', true)}>
                                      <Palette className="w-4 h-4 mr-2" />
                                      Colorful Template
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => generateInvoicePDF(invoice, 'minimal', true)}>
                                      <Minimize2 className="w-4 h-4 mr-2" />
                                      Minimal Template
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <FileEdit className="w-4 h-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Printer className="w-4 h-4 mr-2" />
                                      Print
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600">
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Create Invoice Sheet */}
        <Sheet open={showCreateInvoice} onOpenChange={setShowCreateInvoice}>
          <SheetContent className="overflow-y-auto sm:max-w-4xl w-full h-full">
            <SheetHeader className="border-b pb-4">
              <SheetTitle className="text-2xl font-bold">Create New Invoice</SheetTitle>
              <SheetDescription>
                Fill in all required details to generate a professional invoice
              </SheetDescription>
            </SheetHeader>

            <div className="py-6 space-y-8">
              {/* Template Selection */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Choose PDF Template
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedTemplate === 'classic' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                    onClick={() => setSelectedTemplate('classic')}
                  >
                    <div className="text-center">
                      <Layout className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                      <p className="text-sm font-medium">Classic</p>
                      <p className="text-xs text-gray-500">Standard design</p>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedTemplate === 'modern' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                    onClick={() => setSelectedTemplate('modern')}
                  >
                    <div className="text-center">
                      <Sparkles className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                      <p className="text-sm font-medium">Modern</p>
                      <p className="text-xs text-gray-500">Clean & sleek</p>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedTemplate === 'professional' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                    onClick={() => setSelectedTemplate('professional')}
                  >
                    <div className="text-center">
                      <Briefcase className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                      <p className="text-sm font-medium">Professional</p>
                      <p className="text-xs text-gray-500">Corporate style</p>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedTemplate === 'colorful' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                    onClick={() => setSelectedTemplate('colorful')}
                  >
                    <div className="text-center">
                      <Palette className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                      <p className="text-sm font-medium">Colorful</p>
                      <p className="text-xs text-gray-500">Vibrant design</p>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedTemplate === 'minimal' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                    onClick={() => setSelectedTemplate('minimal')}
                  >
                    <div className="text-center">
                      <Minimize2 className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                      <p className="text-sm font-medium">Minimal</p>
                      <p className="text-xs text-gray-500">Simple & clean</p>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500">
                  Selected template: <span className="font-medium capitalize">{selectedTemplate}</span>
                </p>
              </div>

              {/* Customer Information */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Customer Name *</Label>
                    <Input
                      placeholder="John Doe"
                      value={invoiceForm.customer}
                      onChange={(e) => setInvoiceForm({...invoiceForm, customer: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="customer@example.com"
                      value={invoiceForm.email}
                      onChange={(e) => setInvoiceForm({...invoiceForm, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      placeholder="(123) 456-7890"
                      value={invoiceForm.phone}
                      onChange={(e) => setInvoiceForm({...invoiceForm, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>TRN Number</Label>
                    <Input
                      placeholder="TRN Number"
                      value={invoiceForm.trnNumber}
                      onChange={(e) => setInvoiceForm({...invoiceForm, trnNumber: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Card Last 4 Digits</Label>
                    <Input
                      placeholder="1234"
                      maxLength={4}
                      value={invoiceForm.cardLast4Digits}
                      onChange={(e) => setInvoiceForm({...invoiceForm, cardLast4Digits: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Service & Branch */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Scissors className="w-5 h-5" />
                  Service Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Branch *</Label>
                    <Select value={invoiceForm.branch} onValueChange={(value) => setInvoiceForm({...invoiceForm, branch: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map(branch => (
                          <SelectItem key={branch.id} value={branch.name}>{branch.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Service *</Label>
                    <Select 
                      value={invoiceForm.service} 
                      onValueChange={(value) => {
                        const selectedService = services.find(s => s.name === value);
                        setInvoiceForm({
                          ...invoiceForm, 
                          service: value,
                          price: selectedService?.price || 0,
                          category: selectedService?.category || ''
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map(service => (
                          <SelectItem key={service.id} value={service.name}>
                            {service.name} - AED {service.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Staff *</Label>
                    <Select 
                      value={invoiceForm.staff} 
                      onValueChange={(value) => {
                        setInvoiceForm({...invoiceForm, staff: value});
                        handleAddTeamMember(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffList.map(staff => (
                          <SelectItem key={staff.id} value={staff.name}>
                            {staff.name} - {staff.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={invoiceForm.date}
                      onChange={(e) => setInvoiceForm({...invoiceForm, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Time *</Label>
                    <Input
                      type="time"
                      value={invoiceForm.time}
                      onChange={(e) => setInvoiceForm({...invoiceForm, time: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Service Price (AED)</Label>
                    <Input
                      type="number"
                      value={invoiceForm.price}
                      onChange={(e) => setInvoiceForm({...invoiceForm, price: parseFloat(e.target.value) || 0})}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Team Members */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Team Members & Tips
                  </h3>
                  <Select onValueChange={handleAddTeamMember}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Add team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffList
                        .filter(staff => !invoiceForm.teamMembers.some(tm => tm.name === staff.name))
                        .map(staff => (
                          <SelectItem key={staff.id} value={staff.name}>
                            {staff.name} - {staff.role}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {invoiceForm.teamMembers.length > 0 && (
                  <div className="space-y-2">
                    {invoiceForm.teamMembers.map((member, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-white rounded border">
                        <div className="flex-1">
                          <span className="font-medium">{member.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label>Tip ($):</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={member.tip}
                            onChange={(e) => {
                              const newMembers = [...invoiceForm.teamMembers];
                              newMembers[index].tip = parseFloat(e.target.value) || 0;
                              setInvoiceForm({...invoiceForm, teamMembers: newMembers});
                            }}
                            className="w-24"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTeamMember(index)}
                        >
                          <XCircle className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Products */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Products
                  </h3>
                  <Button onClick={handleAddProduct} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </div>

                {invoiceForm.products.length > 0 && (
                  <div className="space-y-3">
                    {invoiceForm.products.map((product, index) => (
                      <div key={index} className="grid grid-cols-5 gap-4 items-center p-3 bg-white rounded border">
                        <Input
                          placeholder="Product Name"
                          value={product.name}
                          onChange={(e) => handleUpdateProduct(index, 'name', e.target.value)}
                        />
                        <Input
                          placeholder="Category"
                          value={product.category}
                          onChange={(e) => handleUpdateProduct(index, 'category', e.target.value)}
                        />
                        <Input
                          type="number"
                          placeholder="Price"
                          value={product.price}
                          onChange={(e) => handleUpdateProduct(index, 'price', parseFloat(e.target.value) || 0)}
                        />
                        <Input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={product.quantity}
                          onChange={(e) => handleUpdateProduct(index, 'quantity', parseInt(e.target.value) || 1)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveProduct(index)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pricing & Payment */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Pricing & Payment
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Discount</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={invoiceForm.discount}
                        onChange={(e) => setInvoiceForm({...invoiceForm, discount: parseFloat(e.target.value) || 0})}
                      />
                      <Select 
                        value={invoiceForm.discountType} 
                        onValueChange={(value) => setInvoiceForm({...invoiceForm, discountType: value as 'fixed' | 'percentage'})}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">$ Fixed</SelectItem>
                          <SelectItem value="percentage">% Percent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Service Tip ($)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={invoiceForm.serviceTip}
                      onChange={(e) => setInvoiceForm({...invoiceForm, serviceTip: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label>Tax (%)</Label>
                    <Input
                      type="number"
                      placeholder="5"
                      value={invoiceForm.tax}
                      onChange={(e) => setInvoiceForm({...invoiceForm, tax: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label>Service Charges ($)</Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={invoiceForm.serviceCharges}
                      onChange={(e) => setInvoiceForm({...invoiceForm, serviceCharges: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>

                {/* Payment Methods */}
                <div className="space-y-3">
                  <Label>Payment Methods</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(['cash', 'card', 'check', 'digital'] as const).map((method) => {
                      const isSelected = invoiceForm.paymentMethods.includes(method);
                      return (
                        <div key={method} className="space-y-2">
                          <div 
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                              isSelected ? 'bg-blue-50 border-blue-300' : 'border-gray-200 hover:bg-gray-50'
                            }`}
                            onClick={() => handlePaymentMethodToggle(method)}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="w-4 h-4 text-blue-600"
                              />
                              <span className="font-medium capitalize">{method}</span>
                            </div>
                          </div>
                          {isSelected && (
                            <Input
                              type="number"
                              placeholder={`Amount in ${method}`}
                              value={invoiceForm.paymentAmounts[method] || ''}
                              onChange={(e) => handlePaymentAmountChange(method, e.target.value)}
                              className="text-sm"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Summary */}
                <div className="p-4 bg-white rounded-lg border mt-4">
                  <h4 className="font-semibold mb-4">Invoice Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(calculateSubtotal())}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>-{formatCurrency(calculateDiscount())}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax ({invoiceForm.tax}%):</span>
                      <span>{formatCurrency(calculateTax())}</span>
                    </div>
                    <div className="flex justify-between text-blue-600">
                      <span>Total Tips:</span>
                      <span>{formatCurrency(invoiceForm.serviceTip + invoiceForm.teamMembers.reduce((sum, tm) => sum + tm.tip, 0))}</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total Amount:</span>
                        <span>{formatCurrency(calculateTotal())}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600 mt-1">
                        <span>Total Paid:</span>
                        <span>{formatCurrency(calculateTotalPaid())}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Balance:</span>
                        <span>{formatCurrency(calculateTotal() - calculateTotalPaid())}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes & Brand Info */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Additional Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Brand Email</Label>
                    <Input
                      type="email"
                      value={invoiceForm.brandEmail}
                      onChange={(e) => setInvoiceForm({...invoiceForm, brandEmail: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Brand Phone</Label>
                    <Input
                      value={invoiceForm.brandPhone}
                      onChange={(e) => setInvoiceForm({...invoiceForm, brandPhone: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    placeholder="Any additional notes or instructions..."
                    value={invoiceForm.notes}
                    onChange={(e) => setInvoiceForm({...invoiceForm, notes: e.target.value})}
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Invoice Status</Label>
                  <Select 
                    value={invoiceForm.status} 
                    onValueChange={(value) => setInvoiceForm({...invoiceForm, status: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-end pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateInvoice(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => generateInvoicePDF(invoiceForm, selectedTemplate, true)}
                  variant="outline"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Printer className="w-4 h-4 mr-2" />
                  )}
                  Preview PDF
                </Button>
                <Button
                  onClick={saveInvoice}
                  disabled={isGenerating || !invoiceForm.customer || !invoiceForm.service}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Save & Download Invoice
                    </>
                  )}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Invoice Preview Sheet */}
        <Sheet open={showPreview} onOpenChange={setShowPreview}>
          <SheetContent className="sm:max-w-3xl w-full h-full">
            <SheetHeader>
              <SheetTitle>Invoice Preview</SheetTitle>
              <SheetDescription>
                Preview invoice before downloading. Select a template to preview.
              </SheetDescription>
            </SheetHeader>

            {selectedInvoice && (
              <div className="py-6">
                {/* Template Selection for Preview */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <Label className="mb-2 block">Select Template to Preview</Label>
                  <Select value={previewTemplate} onValueChange={(value: TemplateType) => setPreviewTemplate(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classic">
                        <div className="flex items-center gap-2">
                          <Layout className="w-4 h-4" />
                          Classic Template
                        </div>
                      </SelectItem>
                      <SelectItem value="modern">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Modern Template
                        </div>
                      </SelectItem>
                      <SelectItem value="professional">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          Professional Template
                        </div>
                      </SelectItem>
                      <SelectItem value="colorful">
                        <div className="flex items-center gap-2">
                          <Palette className="w-4 h-4" />
                          Colorful Template
                        </div>
                      </SelectItem>
                      <SelectItem value="minimal">
                        <div className="flex items-center gap-2">
                          <Minimize2 className="w-4 h-4" />
                          Minimal Template
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="mt-3 text-sm text-gray-500">
                    Previewing: <span className="font-medium capitalize">{previewTemplate}</span> template
                  </div>
                </div>

                {/* Preview Info */}
                <div className="bg-white p-6 rounded-lg border shadow-sm mb-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Invoice Number</p>
                      <p className="font-medium">{selectedInvoice.invoiceNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Customer</p>
                      <p className="font-medium">{selectedInvoice.customer}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium">{selectedInvoice.date}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Amount</p>
                      <p className="font-medium">{formatCurrency(selectedInvoice.price)}</p>
                    </div>
                  </div>
                  
                  <div className="text-center text-gray-400 italic">
                    PDF preview is generated on download. Template preview shows in the actual PDF.
                  </div>
                </div>

                <div className="flex gap-4 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(false)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => generateInvoicePDF(selectedInvoice, previewTemplate, true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download {previewTemplate} PDF
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        All Templates
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => generateInvoicePDF(selectedInvoice, 'classic', true)}>
                        Classic Template
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => generateInvoicePDF(selectedInvoice, 'modern', true)}>
                        Modern Template
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => generateInvoicePDF(selectedInvoice, 'professional', true)}>
                        Professional Template
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => generateInvoicePDF(selectedInvoice, 'colorful', true)}>
                        Colorful Template
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => generateInvoicePDF(selectedInvoice, 'minimal', true)}>
                        Minimal Template
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </ProtectedRoute>
  );
}