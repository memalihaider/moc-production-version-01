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
  CheckCircle2, Loader2, ChevronDown, ChevronUp,MoreVertical 
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

  // Generate Invoice PDF
  const generateInvoicePDF = async (invoice: InvoiceData, download = true) => {
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      
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
        head: [['Description', 'Qty', 'Unit Price ($)', 'Total ($)']],
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
      
      if (download) {
        doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
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
      
      // Generate PDF
      await generateInvoicePDF(invoiceForm, true);
      
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
      <ProtectedRoute requiredRole="admin">
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
    <ProtectedRoute requiredRole="admin">
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar role="super_admin" onLogout={handleLogout} />
        <AdminMobileSidebar
          role="branch_admin"
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
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => generateInvoicePDF(invoice, true)}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </Button>
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
                            {service.name} - ${service.price}
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
                    <Label>Service Price ($)</Label>
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
                  onClick={() => generateInvoicePDF(invoiceForm, true)}
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
                Preview invoice before downloading
              </SheetDescription>
            </SheetHeader>

            {selectedInvoice && (
              <div className="py-6">
                <div id="invoice-preview" className="bg-white p-8 rounded-lg border shadow-sm">
                  {/* Invoice Header */}
                  <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-blue-600 mb-2">INVOICE</h1>
                    <p className="text-gray-600">#{selectedInvoice.invoiceNumber}</p>
                  </div>

                  {/* Company & Customer Info */}
                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                      <h3 className="font-semibold mb-2">From:</h3>
                      <p className="font-bold">Your Company Name</p>
                      <p>Email: {selectedInvoice.brandEmail}</p>
                      <p>Phone: {selectedInvoice.brandPhone}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Bill To:</h3>
                      <p className="font-bold">{selectedInvoice.customer}</p>
                      <p>Email: {selectedInvoice.email}</p>
                      <p>Phone: {selectedInvoice.phone}</p>
                      {selectedInvoice.trnNumber && <p>TRN: {selectedInvoice.trnNumber}</p>}
                    </div>
                  </div>

                  {/* Invoice Details */}
                  <div className="border rounded-lg overflow-hidden mb-8">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-3 text-left">Description</th>
                          <th className="p-3 text-left">Qty</th>
                          <th className="p-3 text-left">Unit Price</th>
                          <th className="p-3 text-left">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-3">{selectedInvoice.service}</td>
                          <td className="p-3">1</td>
                          <td className="p-3">{formatCurrency(selectedInvoice.price)}</td>
                          <td className="p-3">{formatCurrency(selectedInvoice.price)}</td>
                        </tr>
                        {selectedInvoice.products.map((product, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-3">{product.name}</td>
                            <td className="p-3">{product.quantity}</td>
                            <td className="p-3">{formatCurrency(product.price)}</td>
                            <td className="p-3">{formatCurrency(product.price * product.quantity)}</td>
                          </tr>
                        ))}
                        {selectedInvoice.serviceCharges > 0 && (
                          <tr className="border-b">
                            <td className="p-3">Service Charges</td>
                            <td className="p-3">1</td>
                            <td className="p-3">{formatCurrency(selectedInvoice.serviceCharges)}</td>
                            <td className="p-3">{formatCurrency(selectedInvoice.serviceCharges)}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary */}
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(selectedInvoice.price + selectedInvoice.products.reduce((sum, p) => sum + (p.price * p.quantity), 0) + selectedInvoice.serviceCharges)}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-{formatCurrency(selectedInvoice.discount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax ({selectedInvoice.tax}%):</span>
                        <span>{formatCurrency(selectedInvoice.tax)}</span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total:</span>
                          <span>{formatCurrency(selectedInvoice.price)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-12 pt-8 border-t text-center text-gray-600 text-sm">
                    <p>Thank you for your business!</p>
                    <p className="mt-1">Invoice generated on {new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex gap-4 justify-end mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(false)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => generateInvoicePDF(selectedInvoice, true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </ProtectedRoute>
  );
}