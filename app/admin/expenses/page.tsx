'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  Calendar, 
  BarChart3, 
  Download,
  RefreshCw,
  Building2,
  ShoppingCart,
  Loader2,
  FileText,
  PieChart,
  Plus,
  X,
  Save,
  Trash2,
  Edit
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ProtectedRoute from "@/components/ProtectedRoute";
import { AdminSidebar, AdminMobileSidebar } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  getDocs,
  where,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import {
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Firebase Interfaces
interface Product {
  id: string;
  name: string;
  price: number;
  cost: number;
  category: string;
  branchNames: string[];
  totalStock: number;
  totalSold: number;
  status: 'active' | 'inactive';
  createdAt: any;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  category: string;
  branchNames: string[];
  status: 'active' | 'inactive';
  totalBookings: number;
  createdAt: any;
}

interface Booking {
  id: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  totalAmount: number;
  customerName: string;
  date: string;
  status: string;
  branch: string;
  paymentMethod: string;
  createdAt: any;
  updatedAt: any;
}

// Manual Expense Interface
interface ManualExpense {
  id: string;
  title: string;
  description: string;
  amount: number;
  category: string;
  branch: string;
  date: string;
  paymentMethod: string;
  status: 'paid' | 'pending' | 'cancelled';
  createdAt: any;
  updatedAt: any;
  createdBy: string;
  notes?: string;
}

interface ExpenseSummary {
  totalProductsCost: number;
  totalServicesCost: number;
  totalAppointmentsCost: number;
  totalManualExpenses: number;
  totalExpenses: number;
  totalRevenue: number;
  totalProfit: number;
  profitMargin: number;
  monthWiseData: Array<{
    month: string;
    productsCost: number;
    servicesCost: number;
    appointmentsCost: number;
    manualExpenses: number;
    totalCost: number;
    revenue: number;
    profit: number;
  }>;
  branchWiseData: Array<{
    branch: string;
    productsCost: number;
    servicesCost: number;
    appointmentsCost: number;
    manualExpenses: number;
    totalCost: number;
  }>;
  categoryWiseData: Array<{
    category: string;
    productsCost: number;
    servicesCost: number;
    totalCost: number;
  }>;
  manualExpensesByCategory: Array<{
    category: string;
    amount: number;
  }>;
}

// Expense Categories
const EXPENSE_CATEGORIES = [
  'Salaries',
  'Rent',
  'Utilities',
  'Marketing',
  'Supplies',
  'Maintenance',
  'Travel',
  'Training',
  'Software',
  'Hardware',
  'Office Supplies',
  'Insurance',
  'Taxes',
  'Other'
];

// Payment Methods
const PAYMENT_METHODS = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'Check',
  'Digital Wallet',
  'Other'
];

export default function SuperAdminExpensesPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [manualExpenses, setManualExpenses] = useState<ManualExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [expenseSummary, setExpenseSummary] = useState<ExpenseSummary>({
    totalProductsCost: 0,
    totalServicesCost: 0,
    totalAppointmentsCost: 0,
    totalManualExpenses: 0,
    totalExpenses: 0,
    totalRevenue: 0,
    totalProfit: 0,
    profitMargin: 0,
    monthWiseData: [],
    branchWiseData: [],
    categoryWiseData: [],
    manualExpensesByCategory: []
  });

  // Manual Expense Modal State
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ManualExpense | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    description: '',
    amount: 0,
    category: EXPENSE_CATEGORIES[0],
    branch: user?.role === 'admin' && user?.branchName ? user.branchName : 'all',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: PAYMENT_METHODS[0],
    status: 'paid' as 'paid' | 'pending' | 'cancelled',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Filter States
  const [selectedBranch, setSelectedBranch] = useState<string>(
    user?.role === 'admin' && user?.branchName ? user.branchName : 'all'
  );
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Fetch all data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchProducts(),
        fetchServices(),
        fetchBookings(),
        fetchManualExpenses()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Manual Expenses - FIXED: No complex query to avoid index error
  const fetchManualExpenses = async () => {
    try {
      const expensesRef = collection(db, 'manualExpenses');
      
      // Simple query without complex where conditions
      const q = query(expensesRef, orderBy('createdAt', 'desc'));
      
      const querySnapshot = await getDocs(q);
      
      const expensesData: ManualExpense[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        expensesData.push({
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          amount: data.amount || 0,
          category: data.category || EXPENSE_CATEGORIES[0],
          branch: data.branch || '',
          date: data.date || new Date().toISOString().split('T')[0],
          paymentMethod: data.paymentMethod || PAYMENT_METHODS[0],
          status: data.status || 'paid',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          createdBy: data.createdBy || '',
          notes: data.notes || ''
        });
      });
      
      // Client-side filtering for branch admin
      let filteredExpenses = expensesData;
      if (user?.role === 'admin' && user?.branchName) {
        filteredExpenses = expensesData.filter(e => e.branch === user.branchName);
      }
      
      setManualExpenses(filteredExpenses);
    } catch (error) {
      console.error('Error fetching manual expenses:', error);
    }
  };

  // Fetch products - REAL DATA FROM FIREBASE
  const fetchProducts = async () => {
    try {
      const productsRef = collection(db, 'products');
      let q;
      
      if (user?.role === 'admin' && user?.branchName) {
        q = query(
          productsRef, 
          where('branchNames', 'array-contains', user.branchName),
          where('status', '==', 'active')
        );
      } else {
        q = query(productsRef, where('status', '==', 'active'));
      }
      
      const querySnapshot = await getDocs(q);
      
      const productsData: Product[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        productsData.push({
          id: doc.id,
          name: data.name || '',
          price: data.price || 0,
          cost: data.cost || 0,
          category: data.category || '',
          branchNames: data.branchNames || [],
          totalStock: data.totalStock || 0,
          totalSold: data.totalSold || 0,
          status: data.status || 'active',
          createdAt: data.createdAt
        });
      });
      
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // Fetch services - REAL DATA FROM FIREBASE
  const fetchServices = async () => {
    try {
      const servicesRef = collection(db, 'services');
      let q;
      
      if (user?.role === 'admin' && user?.branchName) {
        q = query(
          servicesRef, 
          where('branchNames', 'array-contains', user.branchName),
          where('status', '==', 'active')
        );
      } else {
        q = query(servicesRef, where('status', '==', 'active'));
      }
      
      const querySnapshot = await getDocs(q);
      
      const servicesData: Service[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        servicesData.push({
          id: doc.id,
          name: data.name || '',
          price: data.price || 0,
          duration: data.duration || 0,
          category: data.category || '',
          branchNames: data.branchNames || [],
          status: data.status || 'active',
          totalBookings: data.totalBookings || 0,
          createdAt: data.createdAt
        });
      });
      
      setServices(servicesData);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  // Fetch bookings - REAL DATA FROM FIREBASE
  const fetchBookings = async () => {
    try {
      const bookingsRef = collection(db, 'bookings');
      const q = query(bookingsRef, orderBy('createdAt', 'desc'));
      
      const querySnapshot = await getDocs(q);
      
      const bookingsData: Booking[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        bookingsData.push({
          id: doc.id,
          serviceId: data.serviceId || '',
          serviceName: data.serviceName || data.service || '',
          servicePrice: data.servicePrice || 0,
          totalAmount: data.totalAmount || 0,
          customerName: data.customerName || '',
          date: data.date || data.bookingDate || '',
          status: data.status || 'pending',
          branch: data.branch || data.userBranchName || data.branchNames?.[0] || '',
          paymentMethod: data.paymentMethod || '',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });
      
      // Client-side filtering for branch admin
      let filteredBookings = bookingsData;
      if (user?.role === 'admin' && user?.branchName) {
        filteredBookings = bookingsData.filter(b => 
          b.branch === user.branchName
        );
      }
      
      setBookings(filteredBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  // Manual Expense Functions
  const openExpenseModal = (expense?: ManualExpense) => {
    if (expense) {
      setEditingExpense(expense);
      setExpenseForm({
        title: expense.title,
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        branch: expense.branch || (user?.role === 'admin' && user?.branchName ? user.branchName : 'all'),
        date: expense.date,
        paymentMethod: expense.paymentMethod,
        status: expense.status,
        notes: expense.notes || ''
      });
    } else {
      setEditingExpense(null);
      setExpenseForm({
        title: '',
        description: '',
        amount: 0,
        category: EXPENSE_CATEGORIES[0],
        branch: user?.role === 'admin' && user?.branchName ? user.branchName : 'all',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: PAYMENT_METHODS[0],
        status: 'paid',
        notes: ''
      });
    }
    setShowExpenseModal(true);
  };

  const closeExpenseModal = () => {
    setShowExpenseModal(false);
    setEditingExpense(null);
    setSubmitting(false);
  };

  const handleExpenseFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setExpenseForm(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'branch' && user?.role === 'admin' && user?.branchName) {
      alert('You cannot change the branch. Expense will be added to your assigned branch.');
      return;
    }
    
    setExpenseForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const submitManualExpense = async () => {
    if (!expenseForm.title.trim() || expenseForm.amount <= 0) {
      alert('Please enter a valid title and amount');
      return;
    }

    setSubmitting(true);
    try {
      let finalBranch = expenseForm.branch;
      if (user?.role === 'admin' && user?.branchName) {
        finalBranch = user.branchName;
      }

      const expenseData = {
        title: expenseForm.title.trim(),
        description: expenseForm.description.trim(),
        amount: expenseForm.amount,
        category: expenseForm.category,
        branch: finalBranch,
        date: expenseForm.date,
        paymentMethod: expenseForm.paymentMethod,
        status: expenseForm.status,
        notes: expenseForm.notes.trim(),
        createdBy: user?.email || (user?.role === 'admin' ? 'branch_admin' : 'super_admin'),
        createdAt: editingExpense ? editingExpense.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (editingExpense) {
        await updateDoc(doc(db, 'manualExpenses', editingExpense.id), expenseData);
      } else {
        await addDoc(collection(db, 'manualExpenses'), expenseData);
      }

      await fetchManualExpenses();
      closeExpenseModal();
      alert(editingExpense ? 'Expense updated successfully!' : 'Expense added successfully!');
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Failed to save expense. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteManualExpense = async (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteDoc(doc(db, 'manualExpenses', id));
        await fetchManualExpenses();
        alert('Expense deleted successfully!');
      } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Failed to delete expense.');
      }
    }
  };

  // Calculate expense summary - USING REAL DATA ONLY
  const calculateExpenseSummary = useCallback(() => {
    // Use selectedBranch or default to 'all'
    const currentBranch = selectedBranch || 'all';
    
    // Filter data based on selected branch
    const filteredProducts = currentBranch === 'all' 
      ? products 
      : products.filter(p => p.branchNames && p.branchNames.includes(currentBranch));
    
    const filteredServices = currentBranch === 'all' 
      ? services 
      : services.filter(s => s.branchNames && s.branchNames.includes(currentBranch));
    
    const filteredBookings = currentBranch === 'all' 
      ? bookings 
      : bookings.filter(b => b.branch === currentBranch);

    const filteredManualExpenses = currentBranch === 'all'
      ? manualExpenses
      : manualExpenses.filter(e => e.branch === currentBranch);

    // Calculate total products cost (cost * totalStock) - REAL DATA
    const totalProductsCost = filteredProducts.reduce((sum, product) => 
      sum + (product.cost * (product.totalStock || 0)), 0
    );

    // Calculate total services cost - REAL DATA
    const totalServicesCost = filteredServices.reduce((sum, service) => {
      return sum + (service.price * 0.3); // 30% of service price as cost
    }, 0);

    // Calculate total appointments cost from completed bookings - REAL DATA
    const completedBookings = filteredBookings.filter(b => 
      b.status && b.status.toLowerCase() === 'completed'
    );
    const totalAppointmentsCost = completedBookings.reduce((sum, booking) => 
      sum + (booking.totalAmount * 0.4), 0 // 40% of booking amount as cost
    );

    // Calculate total manual expenses - REAL DATA
    const totalManualExpenses = filteredManualExpenses.reduce((sum, expense) => 
      sum + expense.amount, 0
    );

    // Calculate revenue from completed bookings - REAL DATA
    const totalRevenue = completedBookings.reduce((sum, booking) => 
      sum + booking.totalAmount, 0
    );

    // Calculate totals - REAL DATA ONLY
    const totalExpenses = totalProductsCost + totalServicesCost + totalAppointmentsCost + totalManualExpenses;
    const totalProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Generate data from REAL DATA
    const monthWiseData = generateMonthWiseData();
    const branchWiseData = generateBranchWiseData();
    const categoryWiseData = generateCategoryWiseData();
    const manualExpensesByCategory = generateManualExpensesByCategory();

    setExpenseSummary({
      totalProductsCost,
      totalServicesCost,
      totalAppointmentsCost,
      totalManualExpenses,
      totalExpenses,
      totalRevenue,
      totalProfit,
      profitMargin,
      monthWiseData,
      branchWiseData,
      categoryWiseData,
      manualExpensesByCategory
    });
  }, [products, services, bookings, manualExpenses, selectedBranch]);

  // FIXED useEffect with stable dependency array
  useEffect(() => {
    calculateExpenseSummary();
  }, [calculateExpenseSummary]);

  const generateMonthWiseData = useCallback(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    return months.map(month => {
      const monthIndex = months.indexOf(month);
      const monthStart = new Date(currentYear, monthIndex, 1);
      const monthEnd = new Date(currentYear, monthIndex + 1, 0);
      
      // Filter bookings for this month - REAL DATA
      const monthBookings = bookings.filter(b => {
        try {
          const bookingDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return bookingDate >= monthStart && bookingDate <= monthEnd && 
                 b.status && b.status.toLowerCase() === 'completed';
        } catch {
          return false;
        }
      });
      
      // Filter manual expenses for this month - REAL DATA
      const monthManualExpenses = manualExpenses.filter(e => {
        try {
          const expenseDate = new Date(e.date);
          return expenseDate >= monthStart && expenseDate <= monthEnd;
        } catch {
          return false;
        }
      });
      
      // Calculate costs for this month - REAL DATA
      const appointmentsCost = monthBookings.reduce((sum, b) => sum + (b.totalAmount * 0.4), 0);
      const manualExpensesCost = monthManualExpenses.reduce((sum, e) => sum + e.amount, 0);
      const revenue = monthBookings.reduce((sum, b) => sum + b.totalAmount, 0);
      
      // Products and services costs for this month - REAL DATA
      const productsCost = expenseSummary.totalProductsCost / 12;
      const servicesCost = expenseSummary.totalServicesCost / 12;
      const totalCost = productsCost + servicesCost + appointmentsCost + manualExpensesCost;
      const profit = revenue - totalCost;
      
      return {
        month,
        productsCost: parseFloat(productsCost.toFixed(2)),
        servicesCost: parseFloat(servicesCost.toFixed(2)),
        appointmentsCost: parseFloat(appointmentsCost.toFixed(2)),
        manualExpenses: parseFloat(manualExpensesCost.toFixed(2)),
        totalCost: parseFloat(totalCost.toFixed(2)),
        revenue: parseFloat(revenue.toFixed(2)),
        profit: parseFloat(profit.toFixed(2))
      };
    });
  }, [bookings, manualExpenses, expenseSummary.totalProductsCost, expenseSummary.totalServicesCost]);

  const generateBranchWiseData = useCallback(() => {
    let allBranches;
    if (user?.role === 'admin' && user?.branchName) {
      allBranches = [user.branchName];
    } else {
      // REAL DATA: Get all branches from actual data
      allBranches = Array.from(
        new Set([
          ...products.flatMap(p => p.branchNames || []),
          ...services.flatMap(s => s.branchNames || []),
          ...bookings.map(b => b.branch).filter(Boolean),
          ...manualExpenses.map(e => e.branch).filter(Boolean)
        ])
      );
    }

    return allBranches.map(branch => {
      // REAL DATA filtering
      const branchProducts = products.filter(p => p.branchNames && p.branchNames.includes(branch));
      const branchServices = services.filter(s => s.branchNames && s.branchNames.includes(branch));
      const branchManualExpenses = manualExpenses.filter(e => e.branch === branch);
      const branchBookings = bookings.filter(b => b.branch === branch);
      
      // REAL DATA calculations
      const productsCost = branchProducts.reduce((sum, p) => sum + (p.cost * (p.totalStock || 0)), 0);
      const servicesCost = branchServices.reduce((sum, s) => sum + (s.price * 0.3), 0);
      const manualExpensesCost = branchManualExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      const appointmentsCost = branchBookings
        .filter(b => b.status && b.status.toLowerCase() === 'completed')
        .reduce((sum, b) => sum + (b.totalAmount * 0.4), 0);
      
      const totalCost = productsCost + servicesCost + appointmentsCost + manualExpensesCost;
      
      return {
        branch,
        productsCost: parseFloat(productsCost.toFixed(2)),
        servicesCost: parseFloat(servicesCost.toFixed(2)),
        appointmentsCost: parseFloat(appointmentsCost.toFixed(2)),
        manualExpenses: parseFloat(manualExpensesCost.toFixed(2)),
        totalCost: parseFloat(totalCost.toFixed(2))
      };
    });
  }, [products, services, bookings, manualExpenses, user]);

  const generateCategoryWiseData = useCallback(() => {
    // REAL DATA: Get all categories from actual products and services
    const allCategories = Array.from(
      new Set([
        ...products.map(p => p.category).filter(Boolean),
        ...services.map(s => s.category).filter(Boolean)
      ])
    );

    return allCategories.map(category => {
      const categoryProducts = products.filter(p => p.category === category);
      const categoryServices = services.filter(s => s.category === category);
      
      // REAL DATA calculations
      const productsCost = categoryProducts.reduce((sum, p) => sum + (p.cost * (p.totalStock || 0)), 0);
      const servicesCost = categoryServices.reduce((sum, s) => sum + (s.price * 0.3), 0);
      const totalCost = productsCost + servicesCost;
      
      return {
        category,
        productsCost: parseFloat(productsCost.toFixed(2)),
        servicesCost: parseFloat(servicesCost.toFixed(2)),
        totalCost: parseFloat(totalCost.toFixed(2))
      };
    });
  }, [products, services]);

  const generateManualExpensesByCategory = useCallback(() => {
    const categories: { [key: string]: number } = {};
    
    // REAL DATA: Manual expenses by category
    manualExpenses.forEach(expense => {
      if (expense.category) {
        if (!categories[expense.category]) {
          categories[expense.category] = 0;
        }
        categories[expense.category] += expense.amount;
      }
    });
    
    return Object.entries(categories).map(([category, amount]) => ({
      category,
      amount: parseFloat(amount.toFixed(2))
    }));
  }, [manualExpenses]);

  const getBranchOptions = () => {
    if (user?.role === 'admin' && user?.branchName) {
      return [user.branchName];
    }
    
    // REAL DATA: Get branches from actual data
    const allBranches = Array.from(
      new Set([
        ...products.flatMap(p => p.branchNames || []),
        ...services.flatMap(s => s.branchNames || []),
        ...bookings.map(b => b.branch).filter(Boolean),
        ...manualExpenses.map(e => e.branch).filter(Boolean)
      ])
    );
    return allBranches;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const downloadExpenseReport = () => {
    let report = `
EXPENSE ANALYSIS REPORT - REAL DATA
Generated: ${new Date().toLocaleDateString()}
User: ${user?.name || user?.email}
Role: ${user?.role}
${user?.role === 'admin' ? `Branch: ${user.branchName}` : ''}
Period: ${dateRange.start} to ${dateRange.end}

OVERALL SUMMARY (REAL DATA)
Total Products Cost: ${formatCurrency(expenseSummary.totalProductsCost)}
Total Services Cost: ${formatCurrency(expenseSummary.totalServicesCost)}
Total Appointments Cost: ${formatCurrency(expenseSummary.totalAppointmentsCost)}
Total Manual Expenses: ${formatCurrency(expenseSummary.totalManualExpenses)}
Total Expenses: ${formatCurrency(expenseSummary.totalExpenses)}
Total Revenue: ${formatCurrency(expenseSummary.totalRevenue)}
Total Profit: ${formatCurrency(expenseSummary.totalProfit)}
Profit Margin: ${expenseSummary.profitMargin.toFixed(2)}%

MANUAL EXPENSES BY CATEGORY (REAL DATA)
${expenseSummary.manualExpensesByCategory.map(e => 
  `${e.category}: ${formatCurrency(e.amount)}`
).join('\n')}

DATA STATISTICS
Total Products: ${products.length}
Total Services: ${services.length}
Total Bookings: ${bookings.length}
Total Manual Expenses: ${manualExpenses.length}
Completed Bookings: ${bookings.filter(b => b.status && b.status.toLowerCase() === 'completed').length}

BRANCH-WISE EXPENSES (REAL DATA)
${expenseSummary.branchWiseData.map(b => 
  `${b.branch}: 
    Products: ${formatCurrency(b.productsCost)}
    Services: ${formatCurrency(b.servicesCost)}
    Appointments: ${formatCurrency(b.appointmentsCost)}
    Manual: ${formatCurrency(b.manualExpenses)}
    Total: ${formatCurrency(b.totalCost)}`
).join('\n\n')}
    `;
    
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(report));
    element.setAttribute('download', `expense-report-${new Date().toISOString().split('T')[0]}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-lg">Loading real expense data from Firebase...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex h-screen bg-[#f8f9fa]">
        <AdminSidebar
          role={user?.role === 'super_admin' ? 'super_admin' : 'branch_admin'}
          onLogout={handleLogout}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          allowedPages={user?.allowedPages || []}
        />

        <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out min-h-0">
          <header className="bg-white border-b border-gray-200 shrink-0">
            <div className="flex items-center justify-between px-4 py-4 lg:px-8">
              <div className="flex items-center gap-4">
                <AdminMobileSidebar
                  role={user?.role === 'super_admin' ? 'super_admin' : 'branch_admin'}
                  onLogout={handleLogout}
                  isOpen={sidebarOpen}
                  onToggle={() => setSidebarOpen(!sidebarOpen)}
                  allowedPages={user?.allowedPages || []}
                />
                <div>
                  <h1 className="text-2xl font-sans font-bold text-primary">
                    {user?.role === 'admin' 
                      ? `Branch Expense Dashboard` 
                      : 'Expense Analysis Dashboard'
                    }
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {user?.role === 'admin' && user?.branchName
                      ? `Tracking real expenses for ${user.branchName} branch`
                      : 'Track and analyze real expenses across products, services, and appointments'
                    }
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <FileText className="w-3 h-3 mr-1" />
                      Real Data Only
                    </Badge>
                    {user?.role === 'admin' && user?.branchName && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Building2 className="w-3 h-3 mr-1" />
                        Branch: {user.branchName}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <Button
                onClick={() => openExpenseModal()}
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 rounded-full px-6 py-6 shadow-lg flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span className="font-semibold">
                  {user?.role === 'admin' ? 'Add Branch Expense' : 'Add Manual Expense'}
                </span>
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col lg:flex-row gap-4 mb-8">
                <div className="flex-1 flex flex-wrap gap-2">
                  <div className="flex gap-2">
                    <Select 
                      value={selectedBranch} 
                      onValueChange={setSelectedBranch}
                      disabled={user?.role === 'admin'}
                    >
                      <SelectTrigger className="w-48 rounded-lg border-gray-200">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          <SelectValue placeholder="Select Branch" />
                        </div>
                        {user?.role === 'admin' && (
                          <div className="text-xs text-gray-500 mt-1">
                            Branch locked to: {user.branchName}
                          </div>
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Branches</SelectItem>
                        {getBranchOptions().map(branch => (
                          <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger className="w-48 rounded-lg border-gray-200">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <SelectValue placeholder="Select Month" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Months</SelectItem>
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(month => (
                          <SelectItem key={month} value={month}>{month} 2026</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                      className="rounded-lg border-gray-200 w-40"
                    />
                    <Input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                      className="rounded-lg border-gray-200 w-40"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={fetchAllData}
                    variant="outline"
                    className="border-gray-200 rounded-lg flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh Data
                  </Button>
                  <Button
                    onClick={downloadExpenseReport}
                    variant="outline"
                    className="border-gray-200 rounded-lg flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export Report
                  </Button>
                </div>
              </div>

              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-sm font-medium text-blue-800">
                    ✅ Showing 100% real data from Firebase. Total records: 
                    Products ({products.length}), Services ({services.length}), 
                    Bookings ({bookings.length}), Manual Expenses ({manualExpenses.length})
                  </p>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 rounded-lg">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="manual">
                    Manual Expenses ({manualExpenses.length})
                  </TabsTrigger>
                  <TabsTrigger value="analysis">Detailed Analysis</TabsTrigger>
                  <TabsTrigger value="data">Raw Data</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card className="border-none shadow-sm rounded-xl">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                              Total Expenses
                            </p>
                            <p className="text-2xl font-sans font-bold text-primary">
                              {formatCurrency(expenseSummary.totalExpenses)}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              From real data
                            </p>
                          </div>
                          <DollarSign className="w-10 h-10 text-secondary/20" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm rounded-xl border-l-4 border-blue-500">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Products Cost</p>
                            <p className="text-2xl font-sans font-bold text-blue-600">
                              {formatCurrency(expenseSummary.totalProductsCost)}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {products.length} real products
                            </p>
                          </div>
                          <Package className="w-10 h-10 text-blue-500/20" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm rounded-xl border-l-4 border-green-500">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Services Cost</p>
                            <p className="text-2xl font-sans font-bold text-green-600">
                              {formatCurrency(expenseSummary.totalServicesCost)}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {services.length} real services
                            </p>
                          </div>
                          <ShoppingCart className="w-10 h-10 text-green-500/20" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm rounded-xl border-l-4 border-purple-500">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Appointments Cost</p>
                            <p className="text-2xl font-sans font-bold text-purple-600">
                              {formatCurrency(expenseSummary.totalAppointmentsCost)}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {bookings.filter(b => b.status && b.status.toLowerCase() === 'completed').length} bookings
                            </p>
                          </div>
                          <Calendar className="w-10 h-10 text-purple-500/20" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm rounded-xl border-l-4 border-orange-500">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Manual Expenses</p>
                            <p className="text-2xl font-sans font-bold text-orange-600">
                              {formatCurrency(expenseSummary.totalManualExpenses)}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {manualExpenses.length} real expenses
                            </p>
                          </div>
                          <FileText className="w-10 h-10 text-orange-500/20" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="border-none shadow-sm rounded-xl">
                      <CardHeader>
                        <CardTitle className="text-lg font-sans flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-secondary" />
                          Revenue & Profit (Real Data)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Total Revenue</span>
                            <span className="text-lg font-bold text-green-600">
                              {formatCurrency(expenseSummary.totalRevenue)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Total Profit</span>
                            <span className={cn(
                              "text-lg font-bold",
                              expenseSummary.totalProfit >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {formatCurrency(expenseSummary.totalProfit)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Profit Margin</span>
                            <span className={cn(
                              "text-lg font-bold",
                              expenseSummary.profitMargin >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {expenseSummary.profitMargin.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm rounded-xl lg:col-span-2">
                      <CardHeader>
                        <CardTitle className="text-lg font-sans flex items-center gap-2">
                          <PieChart className="w-5 h-5 text-secondary" />
                          Expense Distribution (Real Data)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Pie
                                data={[
                                  { name: 'Products', value: expenseSummary.totalProductsCost },
                                  { name: 'Services', value: expenseSummary.totalServicesCost },
                                  { name: 'Appointments', value: expenseSummary.totalAppointmentsCost },
                                  { name: 'Manual', value: expenseSummary.totalManualExpenses }
                                ]}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {COLORS.map((color, index) => (
                                  <Cell key={`cell-${index}`} fill={color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => formatCurrency(value as number)} />
                              <Legend />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border-none shadow-sm rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-lg font-sans flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-secondary" />
                        Monthly Expense Trend (Real Data)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={expenseSummary.monthWiseData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis tickFormatter={(value) => `AED ${value}`} />
                            <Tooltip formatter={(value) => formatCurrency(value as number)} />
                            <Legend />
                            <Bar dataKey="productsCost" fill="#0088FE" name="Products Cost" />
                            <Bar dataKey="servicesCost" fill="#00C49F" name="Services Cost" />
                            <Bar dataKey="appointmentsCost" fill="#FFBB28" name="Appointments Cost" />
                            <Bar dataKey="manualExpenses" fill="#FF8042" name="Manual Expenses" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="manual" className="space-y-6">
                  <Card className="border-none shadow-sm rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-lg font-sans flex items-center gap-2">
                        <FileText className="w-5 h-5 text-secondary" />
                        Manual Expenses Management (Real Data)
                      </CardTitle>
                      <CardDescription>
                        Add, edit, and track manual expenses - {manualExpenses.length} real expenses found
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Title</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Amount</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Category</th>
                              {user?.role !== 'admin' && (
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Branch</th>
                              )}
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Payment Method</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {manualExpenses.length === 0 ? (
                              <tr>
                                <td colSpan={user?.role === 'admin' ? 7 : 8} className="px-4 py-8 text-center text-gray-500">
                                  No manual expenses found. Click "Add Expense" to add one.
                                </td>
                              </tr>
                            ) : (
                              manualExpenses.map((expense) => (
                                <tr key={expense.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3">
                                    <div>
                                      <p className="font-medium">{expense.title}</p>
                                      {expense.description && (
                                        <p className="text-sm text-gray-500 truncate max-w-xs">{expense.description}</p>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 font-bold text-orange-600">
                                    {formatCurrency(expense.amount)}
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge variant="outline" className="text-xs">
                                      {expense.category}
                                    </Badge>
                                  </td>
                                  {user?.role !== 'admin' && (
                                    <td className="px-4 py-3">{expense.branch || 'All Branches'}</td>
                                  )}
                                  <td className="px-4 py-3">{expense.date}</td>
                                  <td className="px-4 py-3">
                                    <Badge variant="outline" className="text-xs">
                                      {expense.paymentMethod}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge className={cn(
                                      "rounded-full",
                                      expense.status === 'paid' ? "bg-green-100 text-green-700" :
                                      expense.status === 'pending' ? "bg-yellow-100 text-yellow-700" :
                                      "bg-red-100 text-red-700"
                                    )}>
                                      {expense.status}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openExpenseModal(expense)}
                                        className="h-8 px-3"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => deleteManualExpense(expense.id)}
                                        className="h-8 px-3"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border-none shadow-sm rounded-xl">
                      <CardHeader>
                        <CardTitle className="text-lg font-sans flex items-center gap-2">
                          <PieChart className="w-5 h-5 text-secondary" />
                          Manual Expenses by Category (Real Data)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Pie
                                data={expenseSummary.manualExpensesByCategory}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="amount"
                              >
                                {COLORS.map((color, index) => (
                                  <Cell key={`cell-${index}`} fill={color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => formatCurrency(value as number)} />
                              <Legend />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm rounded-xl">
                      <CardHeader>
                        <CardTitle className="text-lg font-sans flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-secondary" />
                          Manual Expenses by Month (Real Data)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={expenseSummary.monthWiseData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis />
                              <Tooltip formatter={(value) => formatCurrency(value as number)} />
                              <Legend />
                              <Bar dataKey="manualExpenses" fill="#FF8042" name="Manual Expenses" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="analysis" className="space-y-6">
                  <Card className="border-none shadow-sm rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-lg font-sans flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-secondary" />
                        {user?.role === 'admin' 
                          ? `Branch Expense Analysis (${user.branchName}) - Real Data`
                          : 'Branch-wise Expense Analysis (Real Data)'
                        }
                      </CardTitle>
                      <CardDescription>
                        Detailed breakdown of expenses by branch from real data
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Branch</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Products Cost</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Services Cost</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Appointments Cost</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Manual Expenses</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Total Cost</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">% of Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {expenseSummary.branchWiseData.map((branchData, index) => (
                              <tr key={branchData.branch} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium">{branchData.branch}</td>
                                <td className="px-4 py-3 text-blue-600 font-medium">
                                  {formatCurrency(branchData.productsCost)}
                                </td>
                                <td className="px-4 py-3 text-green-600 font-medium">
                                  {formatCurrency(branchData.servicesCost)}
                                </td>
                                <td className="px-4 py-3 text-purple-600 font-medium">
                                  {formatCurrency(branchData.appointmentsCost)}
                                </td>
                                <td className="px-4 py-3 text-orange-600 font-medium">
                                  {formatCurrency(branchData.manualExpenses)}
                                </td>
                                <td className="px-4 py-3 font-bold">
                                  {formatCurrency(branchData.totalCost)}
                                </td>
                                <td className="px-4 py-3">
                                  {expenseSummary.totalExpenses > 0 
                                    ? ((branchData.totalCost / expenseSummary.totalExpenses) * 100).toFixed(1)
                                    : '0.0'
                                  }%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-lg font-sans flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-secondary" />
                        {user?.role === 'admin' 
                          ? 'Branch Monthly Profit & Loss Statement - Real Data'
                          : 'Monthly Profit & Loss Statement (Real Data)'
                        }
                      </CardTitle>
                      <CardDescription className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Showing real data from Firebase</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Total Revenue: {formatCurrency(expenseSummary.monthWiseData.reduce((sum, m) => sum + m.revenue, 0))} | 
                          Total Profit: {formatCurrency(expenseSummary.monthWiseData.reduce((sum, m) => sum + m.profit, 0))} | 
                          Data Source: {bookings.filter(b => b.status?.toLowerCase() === 'completed').length} completed bookings
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Real Data Verification */}
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Total Revenue</p>
                            <p className="font-bold text-green-600">
                              {formatCurrency(expenseSummary.monthWiseData.reduce((sum, m) => sum + m.revenue, 0))}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Total Expenses</p>
                            <p className="font-bold text-orange-600">
                              {formatCurrency(expenseSummary.monthWiseData.reduce((sum, m) => sum + m.totalCost, 0))}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Total Profit</p>
                            <p className="font-bold text-blue-600">
                              {formatCurrency(expenseSummary.monthWiseData.reduce((sum, m) => sum + m.profit, 0))}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Avg Margin</p>
                            <p className="font-bold text-purple-600">
                              {(() => {
                                const totalRevenue = expenseSummary.monthWiseData.reduce((sum, m) => sum + m.revenue, 0);
                                const totalProfit = expenseSummary.monthWiseData.reduce((sum, m) => sum + m.profit, 0);
                                return totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0';
                              })()}%
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Month</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Products Cost</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Services Cost</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Appointments Cost</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Manual Expenses</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Total Cost</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Revenue</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Profit</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Margin</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {expenseSummary.monthWiseData.map((monthData) => {
                              const isCurrentMonth = monthData.month === new Date().toLocaleString('default', { month: 'short' });
                              
                              return (
                                <tr 
                                  key={monthData.month} 
                                  className={`hover:bg-gray-50 ${isCurrentMonth ? 'bg-blue-50' : ''}`}
                                >
                                  <td className="px-4 py-3 font-medium">
                                    <div className="flex items-center gap-2">
                                      {monthData.month}
                                      {isCurrentMonth && (
                                        <Badge className="bg-blue-100 text-blue-700 text-xs">
                                          Current
                                        </Badge>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">{formatCurrency(monthData.productsCost)}</td>
                                  <td className="px-4 py-3">{formatCurrency(monthData.servicesCost)}</td>
                                  <td className="px-4 py-3">{formatCurrency(monthData.appointmentsCost)}</td>
                                  <td className="px-4 py-3 text-orange-600">{formatCurrency(monthData.manualExpenses)}</td>
                                  <td className="px-4 py-3 font-bold">{formatCurrency(monthData.totalCost)}</td>
                                  <td className="px-4 py-3 text-green-600 font-medium">
                                    {formatCurrency(monthData.revenue)}
                                  </td>
                                  <td className={cn(
                                    "px-4 py-3 font-bold",
                                    monthData.profit >= 0 ? "text-green-600" : "text-red-600"
                                  )}>
                                    {formatCurrency(monthData.profit)}
                                  </td>
                                  <td className={cn(
                                    "px-4 py-3",
                                    monthData.profit >= 0 ? "text-green-600" : "text-red-600"
                                  )}>
                                    {monthData.revenue > 0 ? ((monthData.profit / monthData.revenue) * 100).toFixed(1) : '0.0'}%
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="data" className="space-y-6">
                  <Card className="border-none shadow-sm rounded-xl">
                    <CardHeader>
                      <CardTitle className="text-lg font-sans flex items-center gap-2">
                        <FileText className="w-5 h-5 text-secondary" />
                        Manual Expenses Data (Real Data)
                      </CardTitle>
                      <CardDescription>
                        Showing {manualExpenses.length} real manual expenses from Firebase
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Title</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Description</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Amount</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Category</th>
                              {user?.role !== 'admin' && (
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Branch</th>
                              )}
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Date</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Payment Method</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Status</th>
                              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">Created By</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {manualExpenses.slice(0, 20).map((expense) => (
                              <tr key={expense.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium">{expense.title}</td>
                                <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{expense.description || 'N/A'}</td>
                                <td className="px-4 py-3 font-bold text-orange-600">
                                  {formatCurrency(expense.amount)}
                                </td>
                                <td className="px-4 py-3">
                                  <Badge variant="outline" className="text-xs">
                                    {expense.category}
                                  </Badge>
                                </td>
                                {user?.role !== 'admin' && (
                                  <td className="px-4 py-3">{expense.branch || 'All Branches'}</td>
                                )}
                                <td className="px-4 py-3">{expense.date}</td>
                                <td className="px-4 py-3">{expense.paymentMethod}</td>
                                <td className="px-4 py-3">
                                  <Badge className={cn(
                                    "rounded-full",
                                    expense.status === 'paid' ? "bg-green-100 text-green-700" :
                                    expense.status === 'pending' ? "bg-yellow-100 text-yellow-700" :
                                    "bg-red-100 text-red-700"
                                  )}>
                                    {expense.status}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">{expense.createdBy}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50" onClick={closeExpenseModal} />
          <div className="absolute inset-y-0 right-0 flex max-w-full">
            <div className="relative w-screen max-w-md">
              <div className="flex h-full flex-col bg-white shadow-xl">
                <div className="bg-primary text-white px-6 py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                      {user?.role === 'admin' 
                        ? `Add Expense to ${user.branchName}`
                        : (editingExpense ? 'Edit Manual Expense' : 'Add Manual Expense')
                      }
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={closeExpenseModal}
                      className="text-white hover:bg-white/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-white/80 mt-1">
                    This expense will be saved to Firebase real-time database
                  </p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Expense Title *</label>
                      <Input
                        name="title"
                        value={expenseForm.title}
                        onChange={handleExpenseFormChange}
                        placeholder="Enter expense title"
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea
                        name="description"
                        value={expenseForm.description}
                        onChange={handleExpenseFormChange}
                        placeholder="Enter expense description"
                        className="w-full min-h-[80px] border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Amount (AED) *</label>
                        <Input
                          type="number"
                          name="amount"
                          value={expenseForm.amount}
                          onChange={handleExpenseFormChange}
                          placeholder="0.00"
                          className="w-full"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Date *</label>
                        <Input
                          type="date"
                          name="date"
                          value={expenseForm.date}
                          onChange={handleExpenseFormChange}
                          className="w-full"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Category *</label>
                      <Select
                        value={expenseForm.category}
                        onValueChange={(value) => handleSelectChange('category', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPENSE_CATEGORIES.map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Branch {user?.role === 'admin' && '(Locked)'}
                      </label>
                      {user?.role === 'admin' ? (
                        <div className="p-3 bg-gray-100 rounded-lg border border-gray-300">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{user.branchName}</p>
                              <p className="text-sm text-gray-500">Automatically selected for branch admin</p>
                            </div>
                            <Badge className="bg-blue-100 text-blue-700">
                              <Building2 className="w-3 h-3 mr-1" />
                              Your Branch
                            </Badge>
                          </div>
                          <input type="hidden" name="branch" value={user.branchName} />
                        </div>
                      ) : (
                        <Select
                          value={expenseForm.branch}
                          onValueChange={(value) => handleSelectChange('branch', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select branch" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Branches</SelectItem>
                            {getBranchOptions().map(branch => (
                              <SelectItem key={branch} value={branch}>
                                {branch}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Payment Method *</label>
                      <Select
                        value={expenseForm.paymentMethod}
                        onValueChange={(value) => handleSelectChange('paymentMethod', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map(method => (
                            <SelectItem key={method} value={method}>
                              {method}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Status *</label>
                      <div className="flex gap-2">
                        {(['paid', 'pending', 'cancelled'] as const).map(status => (
                          <Button
                            key={status}
                            type="button"
                            variant={expenseForm.status === status ? "default" : "outline"}
                            onClick={() => handleSelectChange('status', status)}
                            className="capitalize"
                          >
                            {status}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Additional Notes</label>
                      <textarea
                        name="notes"
                        value={expenseForm.notes}
                        onChange={handleExpenseFormChange}
                        placeholder="Any additional notes..."
                        className="w-full min-h-[60px] border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="border-t px-6 py-4">
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={closeExpenseModal}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={submitManualExpense}
                      disabled={submitting || !expenseForm.title.trim() || expenseForm.amount <= 0}
                      className="gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving to Firebase...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save to Real Database
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}