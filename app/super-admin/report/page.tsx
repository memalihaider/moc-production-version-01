'use client';

import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { CalendarIcon, Download, Filter, RefreshCw, Search, TrendingUp, DollarSign, ShoppingBag, Calendar as CalendarIcon2, Package, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

interface Order {
  id: string;
  orderDate: string;
  expectedDeliveryDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  createdAt: Date;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: string;
  shippingCity: string;
  shippingCountry: string;
  totalAmount: number;
  status: string;
  products: Array<{
    productName: string;
    quantity: number;
    price: number;
    productCost: number;
    productCategory: string;
  }>;
  transactionId: string;
  branchNames?: string[];
  productBranches?: string[];
}

interface FinancialSummary {
  totalOrders: number;
  totalOrderRevenue: number;
  totalProductsSold: number;
  averageOrderValue: number;
  pendingPayments: number;
  completedPayments: number;
  totalCost: number;
  totalProfit: number;
}

export default function OrderFinanceReportPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalOrders: 0,
    totalOrderRevenue: 0,
    totalProductsSold: 0,
    averageOrderValue: 0,
    pendingPayments: 0,
    completedPayments: 0,
    totalCost: 0,
    totalProfit: 0,
  });
  
  // Filters
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');
  const [showDateInputs, setShowDateInputs] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Fetch data from Firebase
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Prepare date queries
      const startDate = Timestamp.fromDate(dateRange.from);
      const endDate = Timestamp.fromDate(dateRange.to);
      
      // Fetch Orders
      let ordersQuery = query(
        collection(db, 'orders'),
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate),
        orderBy('createdAt', 'desc')
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersData = ordersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          orderDate: data.orderDate || '',
          expectedDeliveryDate: data.expectedDeliveryDate || '',
          customerName: data.customerName || '',
          customerEmail: data.customerEmail || '',
          customerPhone: data.customerPhone || '',
          createdAt: data.createdAt?.toDate() || new Date(),
          paymentMethod: data.paymentMethod || '',
          paymentStatus: data.paymentStatus || '',
          shippingAddress: data.shippingAddress || '',
          shippingCity: data.shippingCity || '',
          shippingCountry: data.shippingCountry || '',
          totalAmount: data.totalAmount || 0,
          status: data.status || '',
          products: data.products?.map((p: any) => ({
            productName: p.productName || '',
            quantity: p.quantity || 0,
            price: p.price || 0,
            productCost: p.productCost || 0,
            productCategory: p.productCategory || '',
          })) || [],
          transactionId: data.transactionId || '',
          branchNames: data.branchNames || [],
          productBranches: data.productBranches || [],
        };
      });
      
      setOrders(ordersData);
      
      // Calculate summary
      const totalOrderRevenue = ordersData.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const totalProductsSold = ordersData.reduce((sum, o) => 
        sum + o.products.reduce((prodSum: any, p: { quantity: any; }) => prodSum + (p.quantity || 0), 0), 0
      );
      const totalCost = ordersData.reduce((sum, o) => 
        sum + o.products.reduce((prodSum: number, p: { productCost: any; quantity: any; }) => prodSum + ((p.productCost || 0) * (p.quantity || 0)), 0), 0
      );
      const totalProfit = totalOrderRevenue - totalCost;
      const pendingOrders = ordersData.filter(o => o.paymentStatus === 'pending').length;
      const completedOrders = ordersData.filter(o => o.paymentStatus === 'completed').length;
      
      setSummary({
        totalOrders: ordersData.length,
        totalOrderRevenue,
        totalProductsSold,
        averageOrderValue: ordersData.length > 0 ? totalOrderRevenue / ordersData.length : 0,
        pendingPayments: pendingOrders,
        completedPayments: completedOrders,
        totalCost,
        totalProfit,
      });
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  // Apply filters
  const filteredOrders = orders.filter(order => {
    if (searchTerm && 
        !order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !order.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !order.customerPhone.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (selectedStatus !== 'all' && order.status !== selectedStatus) return false;
    if (selectedPaymentMethod !== 'all' && order.paymentMethod !== selectedPaymentMethod) return false;
    if (selectedPaymentStatus !== 'all' && order.paymentStatus !== selectedPaymentStatus) return false;
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
    const headers = ['Order ID', 'Date', 'Customer', 'Products', 'Quantity', 'Amount', 'Cost', 'Profit', 'Payment Method', 'Status', 'Payment Status'];
    const csvContent = [
      headers.join(','),
      ...filteredOrders.map(order => [
        order.transactionId,
        format(order.createdAt, 'yyyy-MM-dd'),
        order.customerName,
        order.products.map(p => p.productName).join('; '),
        order.products.reduce((sum, p) => sum + p.quantity, 0),
        order.totalAmount,
        order.products.reduce((sum, p) => sum + (p.productCost * p.quantity), 0),
        order.totalAmount - order.products.reduce((sum, p) => sum + (p.productCost * p.quantity), 0),
        order.paymentMethod,
        order.status,
        order.paymentStatus,
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-finance-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  // Get unique values for filters
  const statuses = Array.from(new Set(orders.map(o => o.status).filter(Boolean)));
  const paymentMethods = Array.from(new Set(orders.map(o => o.paymentMethod).filter(Boolean)));
  const paymentStatuses = Array.from(new Set(orders.map(o => o.paymentStatus).filter(Boolean)));

  // Logout handler (placeholder)
  const handleLogout = () => {
    console.log('Logging out...');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Fixed height full screen */}
      <div className={cn(
        "h-screen overflow-y-auto flex-shrink-0 sticky top-0",
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
              <h1 className="text-3xl font-bold">Order Finance Report</h1>
              <p className="text-muted-foreground">Track your orders, revenue, and profits</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={fetchData} disabled={loading}>
                <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
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
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">AED {summary.totalOrderRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.totalOrders} orders
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Products Sold</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalProductsSold}</div>
                <p className="text-xs text-muted-foreground">
                  Average: AED {summary.averageOrderValue.toFixed(2)} per order
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">AED {summary.totalProfit.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Revenue: AED {summary.totalOrderRevenue.toFixed(2)} • Cost: AED {summary.totalCost.toFixed(2)}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.completedPayments}/{summary.pendingPayments + summary.completedPayments}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.completedPayments} completed • {summary.pendingPayments} pending
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters Section */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Filter your order data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

                {/* Status Filter */}
                <div className="space-y-2">
                  <Label>Order Status</Label>
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
              </div>

              {/* Search */}
              <div className="mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by customer name, email, phone, or transaction ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Orders */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="all">All Orders</TabsTrigger>
              <TabsTrigger value="details">Order Details</TabsTrigger>
              <TabsTrigger value="products">Products Analysis</TabsTrigger>
            </TabsList>

            {/* All Orders Table */}
            <TabsContent value="all">
              <Card>
                <CardHeader>
                  <CardTitle>Orders Report</CardTitle>
                  <CardDescription>
                    {filteredOrders.length} orders found • Total Revenue: AED {filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Loading orders...</div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No orders found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Transaction ID</TableHead>
                            <TableHead>Order Date</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Delivery Date</TableHead>
                            <TableHead>Shipping</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Total Amount</TableHead>
                            <TableHead>Payment</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredOrders.map(order => (
                            <TableRow key={order.id}>
                              <TableCell className="font-medium">{order.transactionId}</TableCell>
                              <TableCell>
                                <div>{order.orderDate}</div>
                                <div className="text-sm text-muted-foreground">
                                  {format(order.createdAt, 'MMM dd, yyyy')}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>{order.customerName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {order.customerEmail}
                                </div>
                              </TableCell>
                              <TableCell>{order.expectedDeliveryDate}</TableCell>
                              <TableCell>
                                <div className="max-w-[150px] truncate">{order.shippingCity}, {order.shippingCountry}</div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  {order.products.reduce((sum, p) => sum + p.quantity, 0)} items
                                </div>
                              </TableCell>
                              <TableCell className="font-bold">AED {order.totalAmount.toFixed(2)}</TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <Badge variant={order.paymentStatus === 'completed' ? 'default' : 'secondary'}>
                                    {order.paymentMethod}
                                  </Badge>
                                  <div className="text-xs text-muted-foreground">
                                    {order.paymentStatus}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={
                                  order.status === 'delivered' ? 'default' :
                                  order.status === 'pending' ? 'outline' :
                                  order.status === 'cancelled' ? 'destructive' : 'secondary'
                                }>
                                  {order.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Order Details Table */}
            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Orders Report</CardTitle>
                  <CardDescription>
                    Detailed financial analysis of each order
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Loading orders...</div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No orders found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order #</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Products</TableHead>
                            <TableHead>Revenue</TableHead>
                            <TableHead>Cost</TableHead>
                            <TableHead>Profit</TableHead>
                            <TableHead>Margin</TableHead>
                            <TableHead>Payment</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredOrders.map(order => {
                            const totalCost = order.products.reduce((sum, p) => sum + (p.productCost * p.quantity), 0);
                            const profit = order.totalAmount - totalCost;
                            const margin = order.totalAmount > 0 ? (profit / order.totalAmount) * 100 : 0;
                            
                            return (
                              <TableRow key={order.id}>
                                <TableCell className="font-medium">{order.transactionId}</TableCell>
                                <TableCell>
                                  <div>{order.customerName}</div>
                                  <div className="text-sm text-muted-foreground">{order.customerEmail}</div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    {order.products.map((p, idx) => (
                                      <div key={idx} className="flex justify-between text-sm">
                                        <span className="truncate max-w-[120px]">{p.productName}</span>
                                        <span>{p.quantity} × AED {p.price}</span>
                                      </div>
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell className="font-bold text-green-600">
                                  AED {order.totalAmount.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-red-500">
                                  AED {totalCost.toFixed(2)}
                                </TableCell>
                                <TableCell className={cn(
                                  "font-bold",
                                  profit >= 0 ? "text-green-600" : "text-red-600"
                                )}>
                                  AED {profit.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={margin >= 30 ? "default" : margin >= 20 ? "secondary" : "outline"}>
                                    {margin.toFixed(1)}%
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={order.paymentStatus === 'completed' ? 'default' : 'secondary'}>
                                    {order.paymentMethod}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Products Analysis */}
            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <CardTitle>Products Analysis</CardTitle>
                  <CardDescription>
                    Product-wise sales and profit analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Loading data...</div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No orders found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Quantity Sold</TableHead>
                            <TableHead>Total Revenue</TableHead>
                            <TableHead>Total Cost</TableHead>
                            <TableHead>Total Profit</TableHead>
                            <TableHead>Average Price</TableHead>
                            <TableHead>Profit Margin</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(() => {
                            // Calculate product-wise summary
                            const productMap = new Map();
                            
                            filteredOrders.forEach(order => {
                              order.products.forEach(product => {
                                const key = `${product.productName}|${product.productCategory}`;
                                const existing = productMap.get(key) || {
                                  productName: product.productName,
                                  category: product.productCategory,
                                  quantity: 0,
                                  revenue: 0,
                                  cost: 0,
                                  profit: 0,
                                };
                                
                                existing.quantity += product.quantity;
                                existing.revenue += product.price * product.quantity;
                                existing.cost += product.productCost * product.quantity;
                                existing.profit = existing.revenue - existing.cost;
                                
                                productMap.set(key, existing);
                              });
                            });
                            
                            const products = Array.from(productMap.values())
                              .sort((a, b) => b.revenue - a.revenue);
                            
                            return products.map((product, idx) => {
                              const margin = product.revenue > 0 ? (product.profit / product.revenue) * 100 : 0;
                              const avgPrice = product.quantity > 0 ? product.revenue / product.quantity : 0;
                              
                              return (
                                <TableRow key={idx}>
                                  <TableCell className="font-medium">{product.productName}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {product.category}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{product.quantity}</TableCell>
                                  <TableCell className="font-bold text-green-600">
                                    AED {product.revenue.toFixed(2)}
                                  </TableCell>
                                  <TableCell className="text-red-500">
                                    AED {product.cost.toFixed(2)}
                                  </TableCell>
                                  <TableCell className={cn(
                                    "font-bold",
                                    product.profit >= 0 ? "text-green-600" : "text-red-600"
                                  )}>
                                    AED {product.profit.toFixed(2)}
                                  </TableCell>
                                  <TableCell>AED {avgPrice.toFixed(2)}</TableCell>
                                  <TableCell>
                                    <Badge variant={margin >= 30 ? "default" : margin >= 20 ? "secondary" : "outline"}>
                                      {margin.toFixed(1)}%
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              );
                            });
                          })()}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}