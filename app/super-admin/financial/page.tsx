'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Banknote, PieChart, Download, RefreshCw, Building, AlertTriangle, CheckCircle } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AdminSidebar, AdminMobileSidebar } from "@/components/admin/AdminSidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function SuperAdminFinancial() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const [timeRange, setTimeRange] = useState('30d');

  // Mock financial data across all branches
  const financial = {
    overview: {
      totalRevenue: 156780,
      totalExpenses: 89450,
      netProfit: 67330,
      profitMargin: 42.9,
      revenueChange: 18.5,
      expensesChange: 12.3,
      profitChange: 28.7,
      marginChange: 2.1
    },
    branchFinancials: [
      { name: "Downtown Premium", revenue: 45230, expenses: 25890, profit: 19340, margin: 42.8, status: "profitable" },
      { name: "Midtown Elite", revenue: 38750, expenses: 22180, profit: 16570, margin: 42.7, status: "profitable" },
      { name: "Uptown Luxury", revenue: 42380, expenses: 24230, profit: 18150, margin: 42.8, status: "profitable" },
      { name: "Suburban Comfort", revenue: 15620, expenses: 8920, profit: 6700, margin: 42.9, status: "profitable" },
      { name: "Westside Modern", revenue: 9870, expenses: 5630, profit: 4240, margin: 42.9, status: "profitable" },
      { name: "Eastside Classic", revenue: 4930, expenses: 2810, profit: 2120, margin: 43.0, status: "profitable" },
      { name: "Northgate Plaza", revenue: 2980, expenses: 1700, profit: 1280, margin: 43.0, status: "break-even" },
      { name: "Southpoint Mall", revenue: 2020, expenses: 1150, profit: 870, margin: 43.1, status: "break-even" }
    ],
    expenseCategories: [
      { category: "Staff Salaries", amount: 45230, percentage: 50.6, change: 8.5 },
      { category: "Rent & Utilities", amount: 18750, percentage: 21.0, change: 3.2 },
      { category: "Equipment & Supplies", amount: 12340, percentage: 13.8, change: 15.7 },
      { category: "Marketing", amount: 6780, percentage: 7.6, change: 22.1 },
      { category: "Insurance & Taxes", amount: 6350, percentage: 7.0, change: 5.3 }
    ],
    monthlyCashFlow: [
      { month: "Aug", revenue: 12450, expenses: 7120, profit: 5330 },
      { month: "Sep", revenue: 13890, expenses: 7940, profit: 5950 },
      { month: "Oct", revenue: 15230, expenses: 8700, profit: 6530 },
      { month: "Nov", revenue: 16890, expenses: 9650, profit: 7240 },
      { month: "Dec", revenue: 18320, expenses: 10480, profit: 7840 }
    ],
    pendingPayments: [
      { id: "PAY-001", branch: "Downtown Premium", amount: 2450, dueDate: "2024-01-15", status: "pending", type: "rent" },
      { id: "PAY-002", branch: "Midtown Elite", amount: 1890, dueDate: "2024-01-15", status: "pending", type: "utilities" },
      { id: "PAY-003", branch: "Uptown Luxury", amount: 3200, dueDate: "2024-01-20", status: "overdue", type: "salary" },
      { id: "PAY-004", branch: "Suburban Comfort", amount: 890, dueDate: "2024-01-18", status: "pending", type: "supplies" },
      { id: "PAY-005", branch: "Westside Modern", amount: 1560, dueDate: "2024-01-22", status: "pending", type: "insurance" }
    ]
  };

  const formatCurrency = (amount: number) => {
    return `AED ${amount.toFixed(2)}`;
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'profitable':
        return <Badge className="bg-green-100 text-green-800">Profitable</Badge>;
      case 'break-even':
        return <Badge className="bg-yellow-100 text-yellow-800">Break-even</Badge>;
      case 'loss':
        return <Badge className="bg-red-100 text-red-800">Loss</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>;
      case 'overdue':
        return <Badge variant="outline" className="text-red-600 border-red-600">Overdue</Badge>;
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <ProtectedRoute requiredRole="super_admin">
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <AdminSidebar role="super_admin" onLogout={handleLogout}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)} />

        {/* Main Content */}
        <div className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          sidebarOpen ? "lg:ml-64" : "lg:ml-0"
        )}>
          {/* Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="flex items-center justify-between px-4 py-4 lg:px-8">
              <div className="flex items-center gap-4">
                <AdminMobileSidebar role="super_admin" onLogout={handleLogout}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)} />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Financial Management</h1>
                  <p className="text-sm text-gray-600">Financial overview across all branches</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline">
                  <RefreshCw className="w-4 h-4" />
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
              {/* Financial Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(financial.overview.totalRevenue)}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600">{formatPercentage(financial.overview.revenueChange)}</span> from last period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(financial.overview.totalExpenses)}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-red-600">{formatPercentage(financial.overview.expensesChange)}</span> from last period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(financial.overview.netProfit)}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600">{formatPercentage(financial.overview.profitChange)}</span> from last period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
                    <PieChart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{financial.overview.profitMargin.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">
                      <span className="text-green-600">{formatPercentage(financial.overview.marginChange)}</span> from last period
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Branch Financial Performance */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>Branch Financial Performance</CardTitle>
                  <CardDescription>Revenue, expenses, and profitability by location</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Branch</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Expenses</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                        <TableHead className="text-right">Margin</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financial.branchFinancials.map((branch, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{branch.name}</TableCell>
                          <TableCell className="text-right">{formatCurrency(branch.revenue)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(branch.expenses)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(branch.profit)}</TableCell>
                          <TableCell className="text-right">{branch.margin.toFixed(1)}%</TableCell>
                          <TableCell>{getStatusBadge(branch.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Expense Breakdown and Cash Flow */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Expense Breakdown</CardTitle>
                    <CardDescription>Major expense categories across all branches</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {financial.expenseCategories.map((expense, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{expense.category}</span>
                              <span className="text-sm text-gray-600">{formatCurrency(expense.amount)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-red-500 h-2 rounded-full"
                                style={{ width: `${expense.percentage}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>{expense.percentage}% of total</span>
                              <span className={expense.change > 0 ? 'text-red-600' : 'text-green-600'}>
                                {formatPercentage(expense.change)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Cash Flow</CardTitle>
                    <CardDescription>Revenue vs expenses over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {financial.monthlyCashFlow.map((month, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm font-medium w-12">{month.month}</span>
                          <div className="flex-1 mx-4">
                            <div className="flex items-center gap-1">
                              <div className="flex-1 bg-green-200 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full"
                                  style={{ width: `${(month.revenue / Math.max(...financial.monthlyCashFlow.map(m => m.revenue))) * 100}%` }}
                                ></div>
                              </div>
                              <div className="flex-1 bg-red-200 rounded-full h-2">
                                <div
                                  className="bg-red-500 h-2 rounded-full"
                                  style={{ width: `${(month.expenses / Math.max(...financial.monthlyCashFlow.map(m => m.expenses))) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-green-600">{formatCurrency(month.revenue)}</div>
                            <div className="text-sm font-medium text-red-600">{formatCurrency(month.expenses)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Pending Payments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    Pending Payments
                  </CardTitle>
                  <CardDescription>Outstanding payments that need attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payment ID</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financial.pendingPayments.map((payment, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{payment.id}</TableCell>
                          <TableCell>{payment.branch}</TableCell>
                          <TableCell className="capitalize">{payment.type}</TableCell>
                          <TableCell className="text-right">{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>{payment.dueDate}</TableCell>
                          <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Mark Paid
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}