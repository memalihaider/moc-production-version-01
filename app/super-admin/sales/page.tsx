'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, getDocs, orderBy, where, Timestamp, documentId, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { CalendarIcon, Download, Filter, RefreshCw, Search, TrendingUp, DollarSign, Users, Scissors, Calendar as CalendarIcon2, Clock, MapPin, Wallet, CreditCard, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

interface Booking {
  id: string;
  bookingDate: string;
  bookingNumber: string;
  bookingTime: string;
  timeSlot: string;
  branch: string;
  branchId: string;
  branchNames: string[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerId: string;
  createdAt: Date;
  paymentMethod: string;
  paymentStatus: string;
  paymentAmounts: {
    cash: number;
    wallet: number;
    [key: string]: number;
  };
  serviceName: string;
  servicePrice: number;
  serviceDuration: number;
  serviceCategory: string;
  staffName: string;
  staffRole: string;
  subtotal: number;
  discount: number;
  discountAmount: number;
  tax: number;
  taxAmount: number;
  tip: number;
  totalAmount: number;
  status: string;
  source: string;
  notes: string;
  createdBy: string;
  teamMembers: Array<{
    name: string;
    role: string;
    staffId: string;
  }>;
  productsTotal: number;
  totalDuration: number;
  totalTips: number;
  pointsAwarded: boolean;
  userBranchName: string;
}

interface BookingSummary {
  totalBookings: number;
  totalBookingRevenue: number;
  totalWithVatRevenue: number;
  totalWithoutVatRevenue: number;
  totalVatAmount: number;
  totalServicesBooked: number;
  averageBookingValue: number;
  pendingPayments: number;
  completedPayments: number;
  totalDuration: number;
  totalTips: number;
  totalStaffMembers: number;
  paymentMethodTotals: {
    cash: number;
    card: number;
    check: number;
    digital: number;
    ewallet: number;
  };
}

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

export default function BookingReportPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [summary, setSummary] = useState<BookingSummary>({
    totalBookings: 0,
    totalBookingRevenue: 0,
    totalWithVatRevenue: 0,
    totalWithoutVatRevenue: 0,
    totalVatAmount: 0,
    totalServicesBooked: 0,
    averageBookingValue: 0,
    pendingPayments: 0,
    completedPayments: 0,
    totalDuration: 0,
    totalTips: 0,
    totalStaffMembers: 0,
    paymentMethodTotals: {
      cash: 0,
      card: 0,
      check: 0,
      digital: 0,
      ewallet: 0,
    },
  });
  const [paymentMethodAvailability, setPaymentMethodAvailability] = useState<PaymentMethodAvailability>(
    DEFAULT_PAYMENT_METHOD_AVAILABILITY
  );
  const [reportTaxRate, setReportTaxRate] = useState<number>(5);
  const [walletBalances, setWalletBalances] = useState<Record<string, number>>({});
  
  // Filters
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');
  const [showDateInputs, setShowDateInputs] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const enabledSalesPaymentMethods = useMemo<Array<{ key: keyof BookingSummary['paymentMethodTotals']; label: string; enabled: boolean }>>(
    () => {
      const allMethods: Array<{ key: keyof BookingSummary['paymentMethodTotals']; label: string; enabled: boolean }> = [
        { key: 'cash', label: 'Cash', enabled: paymentMethodAvailability.cash },
        { key: 'card', label: 'Card', enabled: paymentMethodAvailability.card },
        { key: 'check', label: 'Check', enabled: paymentMethodAvailability.check },
        { key: 'digital', label: 'Digital', enabled: paymentMethodAvailability.digital },
        { key: 'ewallet', label: 'E-Wallet', enabled: paymentMethodAvailability.ewallet },
      ];

      return allMethods.filter((method) => method.enabled);
    },
    [paymentMethodAvailability]
  );

  useEffect(() => {
    const settingsRef = doc(db, 'general', 'settings');
    const unsubscribe = onSnapshot(settingsRef, (snap) => {
      const data = snap.data() || {};
      setPaymentMethodAvailability({
        cash: data.acceptCash !== false,
        card: data.acceptCard !== false,
        check: data.acceptCheck !== false,
        digital: data.acceptDigital !== false,
        ewallet: data.acceptEwallet !== false,
      });
      const configuredTaxRate = Number(data.taxRate);
      setReportTaxRate(Number.isFinite(configuredTaxRate) ? configuredTaxRate : 5);
    });

    return () => unsubscribe();
  }, []);

  // Fetch data from Firebase
  const getVatBreakdown = (booking: Booking) => {
    const totalWithVat = Math.max(0, Number(booking.totalAmount || 0));
    const bookingTaxRate = Number.isFinite(Number(booking.tax))
      ? Number(booking.tax)
      : reportTaxRate;
    const explicitTaxAmount = Math.max(0, Number(booking.taxAmount || 0));
    const explicitSubtotal = Math.max(0, Number(booking.subtotal || 0));

    if (explicitTaxAmount > 0 && totalWithVat >= explicitTaxAmount) {
      return {
        withVat: totalWithVat,
        withoutVat: Math.max(0, totalWithVat - explicitTaxAmount),
        taxAmount: explicitTaxAmount,
      };
    }

    if (explicitSubtotal > 0) {
      if (totalWithVat > 0) {
        return {
          withVat: totalWithVat,
          withoutVat: explicitSubtotal,
          taxAmount: Math.max(0, totalWithVat - explicitSubtotal),
        };
      }

      const computedTax = bookingTaxRate > 0 ? (explicitSubtotal * bookingTaxRate) / 100 : 0;
      return {
        withVat: explicitSubtotal + computedTax,
        withoutVat: explicitSubtotal,
        taxAmount: computedTax,
      };
    }

    if (totalWithVat > 0 && bookingTaxRate > 0) {
      const withoutVat = totalWithVat / (1 + bookingTaxRate / 100);
      return {
        withVat: totalWithVat,
        withoutVat,
        taxAmount: Math.max(0, totalWithVat - withoutVat),
      };
    }

    return {
      withVat: totalWithVat,
      withoutVat: totalWithVat,
      taxAmount: 0,
    };
  };

  const fetchCustomerWalletBalances = async (customerIds: string[]) => {
    if (customerIds.length === 0) return {};

    const result: Record<string, number> = {};
    const chunks: string[][] = [];
    for (let i = 0; i < customerIds.length; i += 10) {
      chunks.push(customerIds.slice(i, i + 10));
    }

    for (const chunk of chunks) {
      const customersQuery = query(
        collection(db, 'customers'),
        where(documentId(), 'in', chunk)
      );
      const snapshot = await getDocs(customersQuery);
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        result[docSnap.id] = Number(data.walletBalance || 0);
      });
    }

    return result;
  };

  const fetchData = async () => {
    try {
      // Prepare date queries
      const startDate = Timestamp.fromDate(dateRange.from);
      const endDate = Timestamp.fromDate(dateRange.to);
      
      // Fetch Bookings
      let bookingsQuery = query(
        collection(db, 'bookings'),
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate),
        orderBy('createdAt', 'desc')
      );
      
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const bookingsData = bookingsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          bookingDate: data.bookingDate || '',
          bookingNumber: data.bookingNumber || '',
          bookingTime: data.bookingTime || '',
          timeSlot: data.timeSlot || '',
          branch: data.branch || data.userBranchName || '',
          branchId: data.branchId || data.userBranchId || '',
          branchNames: data.branchNames || [],
          customerName: data.customerName || '',
          customerEmail: data.customerEmail || '',
          customerPhone: data.customerPhone || '',
          customerId: data.customerId || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          paymentMethod: data.paymentMethod || '',
          paymentStatus: data.paymentStatus || '',
          paymentAmounts: data.paymentAmounts || { cash: 0, wallet: 0 },
          serviceName: data.serviceName || data.services?.[0] || '',
          servicePrice: data.servicePrice || 0,
          serviceDuration: data.serviceDuration || 0,
          serviceCategory: data.serviceCategory || '',
          staffName: data.staffName || '',
          staffRole: data.staffRole || '',
          subtotal: data.subtotal || 0,
          discount: data.discount || 0,
          discountAmount: data.discountAmount || 0,
          tax: data.tax || 0,
          taxAmount: data.taxAmount || 0,
          tip: data.tip || 0,
          totalAmount: data.totalAmount || 0,
          status: data.status || '',
          source: data.source || '',
          notes: data.notes || '',
          createdBy: data.createdBy || '',
          teamMembers: data.teamMembers || [],
          productsTotal: data.productsTotal || 0,
          totalDuration: data.totalDuration || 0,
          totalTips: data.totalTips || 0,
          pointsAwarded: data.pointsAwarded || false,
          userBranchName: data.userBranchName || data.branch || '',
        };
      });
      
      setBookings(bookingsData);

      const customerIds = Array.from(
        new Set(bookingsData.map((booking) => booking.customerId).filter(Boolean))
      ) as string[];
      const walletMap = await fetchCustomerWalletBalances(customerIds);
      setWalletBalances(walletMap);
      
      // Calculate summary
      const vatTotals = bookingsData.reduce(
        (acc, booking) => {
          const vat = getVatBreakdown(booking);
          acc.withVat += vat.withVat;
          acc.withoutVat += vat.withoutVat;
          acc.taxAmount += vat.taxAmount;
          return acc;
        },
        { withVat: 0, withoutVat: 0, taxAmount: 0 }
      );

      const totalBookingRevenue = vatTotals.withVat;
      const pendingBookings = bookingsData.filter(b => b.paymentStatus === 'pending').length;
      const completedBookings = bookingsData.filter(b => b.paymentStatus === 'completed').length;
      const totalDuration = bookingsData.reduce((sum, b) => sum + (b.totalDuration || 0), 0);
      const totalTips = bookingsData.reduce((sum, b) => sum + (b.totalTips || 0), 0);
      
      // Calculate payment breakdown by explicit method keys.
      const paymentMethodTotals = {
        cash: 0,
        card: 0,
        check: 0,
        digital: 0,
        ewallet: 0,
      };

      const readPaymentAmount = (paymentAmounts: Record<string, unknown>, keys: string[]) =>
        keys.reduce((sum, key) => sum + Math.max(0, Number(paymentAmounts?.[key] || 0)), 0);

      bookingsData.forEach((booking) => {
        const paymentAmounts = (booking.paymentAmounts || {}) as Record<string, unknown>;

        let cash = readPaymentAmount(paymentAmounts, ['cash', 'Cash']);
        let card = readPaymentAmount(paymentAmounts, ['card', 'Card']);
        let check = readPaymentAmount(paymentAmounts, ['check', 'Check']);
        let digital = readPaymentAmount(paymentAmounts, ['digital', 'Digital']);
        let ewallet = readPaymentAmount(paymentAmounts, ['ewallet', 'Ewallet', 'wallet', 'Wallet']);

        const assigned = cash + card + check + digital + ewallet;
        if (assigned <= 0 && Number(booking.totalAmount || 0) > 0) {
          const methodText = String(booking.paymentMethod || '').toLowerCase();
          if (methodText.includes('wallet') || methodText.includes('ewallet')) {
            ewallet += Number(booking.totalAmount || 0);
          } else if (methodText.includes('card') || methodText.includes('credit') || methodText.includes('debit')) {
            card += Number(booking.totalAmount || 0);
          } else if (methodText.includes('check')) {
            check += Number(booking.totalAmount || 0);
          } else if (
            methodText.includes('digital') ||
            methodText.includes('online') ||
            methodText.includes('bank')
          ) {
            digital += Number(booking.totalAmount || 0);
          } else if (methodText.includes('cash') || methodText.includes('cod')) {
            cash += Number(booking.totalAmount || 0);
          }
        }

        paymentMethodTotals.cash += cash;
        paymentMethodTotals.card += card;
        paymentMethodTotals.check += check;
        paymentMethodTotals.digital += digital;
        paymentMethodTotals.ewallet += ewallet;
      });
      
      // Get unique staff count
      const staffSet = new Set();
      bookingsData.forEach(booking => {
        if (booking.staffName) staffSet.add(booking.staffName);
        booking.teamMembers?.forEach((member: any) => {
          if (member.name) staffSet.add(member.name);
        });
      });
      
      setSummary({
        totalBookings: bookingsData.length,
        totalBookingRevenue,
        totalWithVatRevenue: vatTotals.withVat,
        totalWithoutVatRevenue: vatTotals.withoutVat,
        totalVatAmount: vatTotals.taxAmount,
        totalServicesBooked: bookingsData.length,
        averageBookingValue: bookingsData.length > 0 ? totalBookingRevenue / bookingsData.length : 0,
        pendingPayments: pendingBookings,
        completedPayments: completedBookings,
        totalDuration,
        totalTips,
        totalStaffMembers: staffSet.size,
        paymentMethodTotals,
      });
      
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange, reportTaxRate]);

  // Apply filters
  const filteredBookings = bookings.filter(booking => {
    if (searchTerm && 
        !booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !booking.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !booking.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !booking.customerPhone.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !booking.serviceName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (selectedBranch !== 'all' && booking.branch !== selectedBranch) return false;
    if (selectedStatus !== 'all' && booking.status !== selectedStatus) return false;
    if (selectedPaymentMethod !== 'all' && booking.paymentMethod !== selectedPaymentMethod) return false;
    if (selectedPaymentStatus !== 'all' && booking.paymentStatus !== selectedPaymentStatus) return false;
    if (selectedStaff !== 'all' && booking.staffName !== selectedStaff) return false;
    return true;
  });

  // Quick date filters
  const applyQuickFilter = (filter: string) => {
    const today = new Date();
    switch (filter) {
      case 'today':
        setDateRange({ from: today, to: today });
        break;
      case 'week':
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        setDateRange({ from: weekAgo, to: today });
        break;
      case 'month':
        setDateRange({ from: startOfMonth(today), to: today });
        break;
      case 'year':
        setDateRange({ from: startOfYear(today), to: today });
        break;
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        setDateRange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
        break;
    }
  };

  // Manual date input handlers
  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    if (!isNaN(date.getTime())) {
      setDateRange(prev => ({ ...prev, from: date }));
    }
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    if (!isNaN(date.getTime())) {
      setDateRange(prev => ({ ...prev, to: date }));
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Booking #', 'Date', 'Time', 'Customer', 'Service', 'Staff', 'Branch', 'With VAT', 'Without VAT', 'VAT Amount', 'Cash/COD', 'Wallet', 'Wallet Balance', 'Wallet Left', 'Payment Method', 'Status', 'Payment Status'];
    const csvContent = [
      headers.join(','),
      ...filteredBookings.map(booking => {
        const paymentAmounts = booking.paymentAmounts || {};
        const cashAmount = paymentAmounts.cash || 0;
        const walletAmount = paymentAmounts.wallet || 0;
        const vatBreakdown = getVatBreakdown(booking);
        const walletBalance = walletBalances[booking.customerId] || 0;
        const walletLeft = Math.max(0, walletBalance - walletAmount);
        
        // For COD, entire amount is cash
        const totalCashCOD = booking.paymentMethod === 'cod' ? booking.totalAmount : cashAmount;
        
        return [
          booking.bookingNumber,
          booking.bookingDate,
          booking.bookingTime,
          booking.customerName,
          booking.serviceName,
          booking.staffName,
          booking.branch,
          vatBreakdown.withVat.toFixed(2),
          vatBreakdown.withoutVat.toFixed(2),
          vatBreakdown.taxAmount.toFixed(2),
          totalCashCOD,
          walletAmount,
          walletBalance,
          walletLeft,
          booking.paymentMethod,
          booking.status,
          booking.paymentStatus,
        ].join(',');
      })
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking-report-AED{format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  // Get unique values for filters
  const branches = Array.from(new Set(bookings.map(b => b.branch).filter(Boolean)));
  const statuses = Array.from(new Set(bookings.map(b => b.status).filter(Boolean)));
  const isPaymentMethodEnabled = (method: string) => {
    const normalized = String(method || '').toLowerCase();
    if (normalized.includes('wallet') || normalized.includes('ewallet')) return paymentMethodAvailability.ewallet;
    if (normalized.includes('card') || normalized.includes('credit') || normalized.includes('debit')) return paymentMethodAvailability.card;
    if (normalized.includes('check')) return paymentMethodAvailability.check;
    if (normalized.includes('digital') || normalized.includes('online') || normalized.includes('bank')) return paymentMethodAvailability.digital;
    if (normalized.includes('cash') || normalized.includes('cod')) return paymentMethodAvailability.cash;
    return true;
  };

  const paymentMethods = Array.from(new Set(bookings.map(b => b.paymentMethod).filter(Boolean))).filter(isPaymentMethodEnabled);
  const paymentStatuses = Array.from(new Set(bookings.map(b => b.paymentStatus).filter(Boolean)));
  const staffMembers = Array.from(new Set(bookings.map(b => b.staffName).filter(Boolean)));

  // Logout handler
  const handleLogout = () => {
    console.log('Logging out...');
  };

  // Format time duration
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `AED{hours}h AED{mins}m` : `AED{mins}m`;
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Fixed height full screen */}
      <div className={cn(
        "h-screen overflow-y-auto shrink-0 sticky top-0",
        sidebarOpen ? "w-64" : "w-16"
      )}>
        <AdminSidebar 
          role="super_admin"
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
        />
      </div>

      {/* Main Content - Scrollable */}
      <div className={cn(
        "flex-1 overflow-y-auto transition-all duration-300",
        "min-h-screen"
      )}>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Booking Report</h1>
              <p className="text-muted-foreground">Track your appointments, services, and bookings</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={fetchData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue (With VAT)</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">AED{summary.totalWithVatRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.totalBookings} bookings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue (Without VAT)</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">AED{summary.totalWithoutVatRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Net sales before VAT
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">VAT Amount ({reportTaxRate.toFixed(0)}%)</CardTitle>
                <CalendarIcon2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">AED{summary.totalVatAmount.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Calculated from booking tax values
                </p>
              </CardContent>
            </Card>
            
            {enabledSalesPaymentMethods.map((method) => {
              const methodTotal = Number(summary.paymentMethodTotals[method.key] || 0);
              return (
                <Card key={method.key}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{method.label} Payments</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">AED{methodTotal.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">
                      {(methodTotal / summary.totalBookingRevenue * 100 || 0).toFixed(1)}% of total
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Filters Section */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Filter your booking data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Date Range */}
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      onClick={() => setShowDateInputs(!showDateInputs)}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dateRange.from, 'MMM dd, yyyy')} - {format(dateRange.to, 'MMM dd, yyyy')}
                    </Button>
                  </div>
                  {showDateInputs && (
                    <div className="space-y-2 mt-2 p-2 border rounded-md">
                      <div className="space-y-1">
                        <Label htmlFor="from-date" className="text-xs">From Date</Label>
                        <Input
                          id="from-date"
                          type="date"
                          value={format(dateRange.from, 'yyyy-MM-dd')}
                          onChange={handleDateFromChange}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="to-date" className="text-xs">To Date</Label>
                        <Input
                          id="to-date"
                          type="date"
                          value={format(dateRange.to, 'yyyy-MM-dd')}
                          onChange={handleDateToChange}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Filters */}
                <div className="space-y-2">
                  <Label>Quick Filters</Label>
                  <Select onValueChange={applyQuickFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="lastMonth">Last Month</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Branch Filter */}
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Branches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Branches</SelectItem>
                      {branches.map(branch => (
                        <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <Label>Booking Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {statuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Method Filter */}
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Methods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      {paymentMethods.map(method => (
                        <SelectItem key={method} value={method}>{method}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {/* Payment Status Filter */}
                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {paymentStatuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Staff Filter */}
                <div className="space-y-2">
                  <Label>Staff Member</Label>
                  <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Staff" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Staff</SelectItem>
                      {staffMembers.map(staff => (
                        <SelectItem key={staff} value={staff}>{staff}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Search */}
              <div className="mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by customer, booking number, service, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Bookings */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="all">All Bookings</TabsTrigger>
              <TabsTrigger value="details">Payment Details</TabsTrigger>
              <TabsTrigger value="staff">Staff Analysis</TabsTrigger>
            </TabsList>

            {/* All Bookings Table */}
            <TabsContent value="all">
              <Card>
                <CardHeader>
                  <CardTitle>Bookings Report</CardTitle>
                  <CardDescription>
                    {filteredBookings.length} bookings found • Total Revenue: AED{filteredBookings.reduce((sum, b) => sum + b.totalAmount, 0).toFixed(2)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Booking #</TableHead>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Staff</TableHead>
                          <TableHead>Branch</TableHead>
                          <TableHead>Payment Breakdown</TableHead>
                          <TableHead>Wallet Used</TableHead>
                          <TableHead>Wallet Balance</TableHead>
                          <TableHead>Wallet Left</TableHead>
                          <TableHead>With VAT</TableHead>
                          <TableHead>Without VAT</TableHead>
                          <TableHead>VAT</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBookings.map(booking => {
                          const paymentAmounts = booking.paymentAmounts || {};
                          const cashAmount = paymentAmounts.cash || 0;
                          const walletAmount = paymentAmounts.wallet || 0;
                          const vatBreakdown = getVatBreakdown(booking);
                          const walletBalance = walletBalances[booking.customerId] || 0;
                          const walletLeft = Math.max(0, walletBalance - walletAmount);
                          
                          // For COD, entire amount is cash
                          const totalCashCOD = booking.paymentMethod === 'cod' ? booking.totalAmount : cashAmount;
                          const otherAmount = booking.totalAmount - totalCashCOD - walletAmount;
                          
                          return (
                            <TableRow key={booking.id}>
                              <TableCell className="font-medium">{booking.bookingNumber}</TableCell>
                              <TableCell>
                                <div>{booking.bookingDate}</div>
                                <div className="text-sm text-muted-foreground">{booking.bookingTime}</div>
                                <div className="text-xs text-muted-foreground">
                                  {format(booking.createdAt, 'MMM dd, yyyy')}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>{booking.customerName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {booking.customerEmail}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>{booking.serviceName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {booking.serviceCategory}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>{booking.staffName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {booking.staffRole}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {booking.branch}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  {totalCashCOD > 0 && (
                                    <div className="flex justify-between text-sm">
                                      <span className={cn(
                                        "font-medium",
                                        booking.paymentMethod === 'cod' ? "text-orange-600" : "text-green-600"
                                      )}>
                                        {booking.paymentMethod === 'cod' ? 'COD' : 'Cash'}:
                                      </span>
                                      <span className="font-bold">AED{totalCashCOD.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {walletAmount > 0 && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-blue-600 font-medium">Wallet:</span>
                                      <span className="font-bold">AED{walletAmount.toFixed(2)}</span>
                                    </div>
                                  )}
                                  {otherAmount > 0 && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-purple-600 font-medium">Other:</span>
                                      <span className="font-bold">AED{otherAmount.toFixed(2)}</span>
                                    </div>
                                  )}
                                  <div className="pt-1 border-t">
                                    <div className="flex justify-between text-xs">
                                      <span>Method:</span>
                                      <Badge variant={
                                        booking.paymentMethod === 'cod' ? 'outline' :
                                        booking.paymentMethod === 'cash' ? 'default' :
                                        booking.paymentMethod === 'wallet' ? 'secondary' :
                                        'outline'
                                      } className="text-xs">
                                        {booking.paymentMethod}
                                      </Badge>
                                    </div>
                                    <div className="flex justify-between text-xs mt-1">
                                      <span>Status:</span>
                                      <span className={cn(
                                        "font-medium",
                                        booking.paymentStatus === 'completed' ? "text-green-600" :
                                        booking.paymentStatus === 'pending' ? "text-yellow-600" :
                                        "text-red-600"
                                      )}>
                                        {booking.paymentStatus}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium text-blue-700">
                                AED{walletAmount.toFixed(2)}
                              </TableCell>
                              <TableCell className="font-medium">
                                AED{walletBalance.toFixed(2)}
                              </TableCell>
                              <TableCell className="font-medium text-emerald-700">
                                AED{walletLeft.toFixed(2)}
                              </TableCell>
                              <TableCell className="font-bold text-lg">
                                AED{vatBreakdown.withVat.toFixed(2)}
                              </TableCell>
                              <TableCell className="font-medium">
                                AED{vatBreakdown.withoutVat.toFixed(2)}
                              </TableCell>
                              <TableCell className="font-medium text-orange-700">
                                AED{vatBreakdown.taxAmount.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Badge variant={
                                  booking.status === 'completed' ? 'default' :
                                  booking.status === 'confirmed' ? 'secondary' :
                                  booking.status === 'pending' ? 'outline' :
                                  booking.status === 'cancelled' ? 'destructive' : 'outline'
                                }>
                                  {booking.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payment Details Table */}
            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Details Report</CardTitle>
                  <CardDescription>
                    Complete payment breakdown for each booking
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Booking #</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>With VAT</TableHead>
                          <TableHead>Without VAT</TableHead>
                          <TableHead>VAT</TableHead>
                          <TableHead>Cash/COD</TableHead>
                          <TableHead>Wallet</TableHead>
                          <TableHead>Other</TableHead>
                          <TableHead>Payment Method</TableHead>
                          <TableHead>Payment Status</TableHead>
                          <TableHead>Booking Status</TableHead>
                          <TableHead>Wallet Balance</TableHead>
                          <TableHead>Wallet Left</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredBookings.map(booking => {
                          const paymentAmounts = booking.paymentAmounts || {};
                          const cashAmount = paymentAmounts.cash || 0;
                          const walletAmount = paymentAmounts.wallet || 0;
                          const vatBreakdown = getVatBreakdown(booking);
                          const walletBalance = walletBalances[booking.customerId] || 0;
                          const walletLeft = Math.max(0, walletBalance - walletAmount);
                          
                          // For COD, entire amount is cash
                          const totalCashCOD = booking.paymentMethod === 'cod' ? booking.totalAmount : cashAmount;
                          const otherAmount = booking.totalAmount - totalCashCOD - walletAmount;
                          
                          return (
                            <TableRow key={booking.id}>
                              <TableCell className="font-medium">{booking.bookingNumber}</TableCell>
                              <TableCell>
                                <div>{booking.customerName}</div>
                                <div className="text-sm text-muted-foreground">{booking.customerPhone}</div>
                              </TableCell>
                              <TableCell>
                                <div>{booking.serviceName}</div>
                                <div className="text-sm text-muted-foreground">
                                  AED{booking.servicePrice.toFixed(2)}
                                </div>
                              </TableCell>
                              <TableCell className="font-bold">AED{vatBreakdown.withVat.toFixed(2)}</TableCell>
                              <TableCell className="font-medium">AED{vatBreakdown.withoutVat.toFixed(2)}</TableCell>
                              <TableCell className="font-medium text-orange-700">AED{vatBreakdown.taxAmount.toFixed(2)}</TableCell>
                              <TableCell>
                                <div className={cn(
                                  "font-medium",
                                  totalCashCOD > 0 ? 
                                    (booking.paymentMethod === 'cod' ? "text-orange-600" : "text-green-600") : 
                                    "text-gray-400"
                                )}>
                                  AED{totalCashCOD.toFixed(2)}
                                </div>
                                {totalCashCOD > 0 && (
                                  <div className="text-xs text-muted-foreground">
                                    {(totalCashCOD / booking.totalAmount * 100).toFixed(1)}%
                                    {booking.paymentMethod === 'cod' && ' (COD)'}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className={cn(
                                  "font-medium",
                                  walletAmount > 0 ? "text-blue-600" : "text-gray-400"
                                )}>
                                  AED{walletAmount.toFixed(2)}
                                </div>
                                {walletAmount > 0 && (
                                  <div className="text-xs text-muted-foreground">
                                    {(walletAmount / booking.totalAmount * 100).toFixed(1)}%
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className={cn(
                                  "font-medium",
                                  otherAmount > 0 ? "text-purple-600" : "text-gray-400"
                                )}>
                                  AED{otherAmount.toFixed(2)}
                                </div>
                                {otherAmount > 0 && (
                                  <div className="text-xs text-muted-foreground">
                                    {(otherAmount / booking.totalAmount * 100).toFixed(1)}%
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant={
                                  booking.paymentMethod === 'mixed' ? 'default' :
                                  booking.paymentMethod === 'cod' ? 'outline' :
                                  booking.paymentMethod === 'wallet' ? 'secondary' :
                                  booking.paymentMethod === 'cash' ? 'default' :
                                  'outline'
                                }>
                                  {booking.paymentMethod}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={
                                  booking.paymentStatus === 'completed' ? 'default' :
                                  booking.paymentStatus === 'pending' ? 'outline' :
                                  booking.paymentStatus === 'failed' ? 'destructive' : 'secondary'
                                }>
                                  {booking.paymentStatus}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={
                                  booking.status === 'completed' ? 'default' :
                                  booking.status === 'confirmed' ? 'secondary' :
                                  booking.status === 'pending' ? 'outline' :
                                  booking.status === 'cancelled' ? 'destructive' : 'outline'
                                }>
                                  {booking.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">
                                AED{walletBalance.toFixed(2)}
                              </TableCell>
                              <TableCell className="font-medium text-emerald-700">
                                AED{walletLeft.toFixed(2)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Staff Analysis */}
            <TabsContent value="staff">
              <Card>
                <CardHeader>
                  <CardTitle>Staff Performance Analysis</CardTitle>
                  <CardDescription>
                    Staff-wise booking and revenue analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Staff Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Bookings</TableHead>
                          <TableHead>Total Revenue</TableHead>
                          <TableHead>Cash/COD Revenue</TableHead>
                          <TableHead>Wallet Revenue</TableHead>
                          <TableHead>Other Revenue</TableHead>
                          <TableHead>Average Revenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          // Calculate staff-wise summary
                          const staffMap = new Map();
                          
                          filteredBookings.forEach(booking => {
                            // Main staff
                            if (booking.staffName) {
                              const key = `AED{booking.staffName}|AED{booking.staffRole}`;
                              const existing = staffMap.get(key) || {
                                staffName: booking.staffName,
                                role: booking.staffRole,
                                bookings: 0,
                                revenue: 0,
                                cashCodRevenue: 0,
                                walletRevenue: 0,
                                otherRevenue: 0,
                              };
                              
                              existing.bookings += 1;
                              existing.revenue += booking.totalAmount;
                              
                              const paymentAmounts = booking.paymentAmounts || {};
                              const cashAmount = paymentAmounts.cash || 0;
                              const walletAmount = paymentAmounts.wallet || 0;
                              
                              // For COD, entire amount is cash
                              const totalCashCOD = booking.paymentMethod === 'cod' ? booking.totalAmount : cashAmount;
                              const otherAmount = booking.totalAmount - totalCashCOD - walletAmount;
                              
                              existing.cashCodRevenue += totalCashCOD;
                              existing.walletRevenue += walletAmount;
                              existing.otherRevenue += otherAmount;
                              
                              staffMap.set(key, existing);
                            }
                            
                            // Team members
                            booking.teamMembers?.forEach(member => {
                              const memberKey = `AED{member.name}|AED{member.role}`;
                              const memberExisting = staffMap.get(memberKey) || {
                                staffName: member.name,
                                role: member.role,
                                bookings: 0,
                                revenue: 0,
                                cashCodRevenue: 0,
                                walletRevenue: 0,
                                otherRevenue: 0,
                              };
                              
                              memberExisting.bookings += 1;
                              memberExisting.revenue += booking.totalAmount;
                              
                              const paymentAmounts = booking.paymentAmounts || {};
                              const cashAmount = paymentAmounts.cash || 0;
                              const walletAmount = paymentAmounts.wallet || 0;
                              
                              // For COD, entire amount is cash
                              const totalCashCOD = booking.paymentMethod === 'cod' ? booking.totalAmount : cashAmount;
                              const otherAmount = booking.totalAmount - totalCashCOD - walletAmount;
                              
                              memberExisting.cashCodRevenue += totalCashCOD;
                              memberExisting.walletRevenue += walletAmount;
                              memberExisting.otherRevenue += otherAmount;
                              
                              staffMap.set(memberKey, memberExisting);
                            });
                          });
                          
                          const staffArray = Array.from(staffMap.values())
                            .sort((a, b) => b.revenue - a.revenue);
                          
                          return staffArray.map((staff, idx) => {
                            const avgRevenue = staff.bookings > 0 ? staff.revenue / staff.bookings : 0;
                            
                            return (
                              <TableRow key={idx}>
                                <TableCell className="font-medium">{staff.staffName}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {staff.role}
                                  </Badge>
                                </TableCell>
                                <TableCell>{staff.bookings}</TableCell>
                                <TableCell className="font-bold text-green-600">
                                  AED{staff.revenue.toFixed(2)}
                                </TableCell>
                                <TableCell className={cn(
                                  "font-medium",
                                  staff.cashCodRevenue > 0 ? "text-green-600" : "text-gray-400"
                                )}>
                                  AED{staff.cashCodRevenue.toFixed(2)}
                                </TableCell>
                                <TableCell className={cn(
                                  "font-medium",
                                  staff.walletRevenue > 0 ? "text-blue-600" : "text-gray-400"
                                )}>
                                  AED{staff.walletRevenue.toFixed(2)}
                                </TableCell>
                                <TableCell className={cn(
                                  "font-medium",
                                  staff.otherRevenue > 0 ? "text-purple-600" : "text-gray-400"
                                )}>
                                  AED{staff.otherRevenue.toFixed(2)}
                                </TableCell>
                                <TableCell>AED{avgRevenue.toFixed(2)}</TableCell>
                              </TableRow>
                            );
                          });
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}