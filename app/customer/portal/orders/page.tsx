'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/shared/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Package,
  Clock,
  ChevronLeft,
  Search,
  Filter,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
  ShoppingBag,
  Star,
  MapPin,
} from 'lucide-react';
import { useCustomerStore, type Customer, type ProductOrder } from '@/stores/customer.store';

export default function CustomerOrders() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { getCustomerByEmail, getOrdersByCustomer } = useCustomerStore();

  useEffect(() => {
    const checkAuth = () => {
      const authData = localStorage.getItem('customerAuth');
      if (!authData) {
        router.push('/customer/login');
        return;
      }

      try {
        const { isAuthenticated, customer: customerData } = JSON.parse(authData);
        if (!isAuthenticated) {
          router.push('/customer/login');
          return;
        }

        const fullCustomer = getCustomerByEmail(customerData.email);
        if (fullCustomer) {
          setCustomer(fullCustomer);
        } else {
          setCustomer({
            id: 'temp-' + customerData.email,
            email: customerData.email,
            name: customerData.name,
            phone: customerData.phone,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      } catch (error) {
        router.push('/customer/login');
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [router, getCustomerByEmail]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-secondary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (!customer) return null;

  const orders = getOrdersByCustomer(customer.id);

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.products.some(p => 
      p.productName.toLowerCase().includes(searchQuery.toLowerCase())
    ) || order.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'shipped':
        return <Truck className="w-4 h-4 text-blue-600" />;
      case 'processing':
        return <Package className="w-4 h-4 text-purple-600" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'shipped':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'processing':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      <Header />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/customer/portal">
              <Button variant="ghost" className="p-2 hover:bg-gray-100 rounded-xl">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-serif font-bold text-primary">My Orders</h1>
              <p className="text-muted-foreground">Track and manage your product orders</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-xl border-gray-200"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48 h-12 rounded-xl border-gray-200">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card className="border-none shadow-md rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{orders.length}</p>
                <p className="text-xs text-muted-foreground">Total Orders</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">{orders.filter(o => o.status === 'pending').length}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">{orders.filter(o => o.status === 'processing').length}</p>
                <p className="text-xs text-muted-foreground">Processing</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{orders.filter(o => o.status === 'shipped').length}</p>
                <p className="text-xs text-muted-foreground">Shipped</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{orders.filter(o => o.status === 'delivered').length}</p>
                <p className="text-xs text-muted-foreground">Delivered</p>
              </CardContent>
            </Card>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <Card className="border-none shadow-lg rounded-2xl">
              <CardContent className="py-16 text-center">
                <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-primary mb-2">No Orders Found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter'
                    : "You haven't placed any orders yet"}
                </p>
                <Link href="/products">
                  <Button className="bg-secondary hover:bg-secondary/90 text-primary rounded-xl">
                    <Package className="w-4 h-4 mr-2" />
                    Shop Products
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.id} className="border-none shadow-lg rounded-2xl hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(order.status)}
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">Order ID</p>
                          <p className="font-mono font-bold text-primary">{order.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`${getStatusColor(order.status)} capitalize px-4 py-1`}>
                          {order.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {order.shippingAddress && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <MapPin className="w-4 h-4" />
                        <span>{order.shippingAddress}</span>
                      </div>
                    )}

                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Products</p>
                      <div className="space-y-2">
                        {order.products.map((product, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-3">
                              {product.image ? (
                                <img 
                                  src={product.image} 
                                  alt={product.productName}
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                  <Package className="w-6 h-6 text-primary" />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-sm">{product.productName}</p>
                                <p className="text-xs text-muted-foreground">Qty: {product.quantity}</p>
                              </div>
                            </div>
                            <span className="font-bold text-primary">AED {(product.price * product.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <div className="flex flex-wrap gap-4 text-sm">
                        {order.pointsEarned > 0 && (
                          <div className="flex items-center gap-1 text-green-600">
                            <Star className="w-4 h-4" />
                            <span>+{order.pointsEarned} points earned</span>
                          </div>
                        )}
                        {order.pointsUsed > 0 && (
                          <div className="flex items-center gap-1 text-secondary">
                            <Star className="w-4 h-4" />
                            <span>{order.pointsUsed} points used</span>
                          </div>
                        )}
                        {order.walletAmountUsed > 0 && (
                          <div className="text-blue-600">
                            AED {order.walletAmountUsed} from wallet
                          </div>
                        )}
                      </div>
                      <div className="mt-4 md:mt-0 text-right">
                        <p className="text-xs text-muted-foreground">Total Amount</p>
                        <p className="text-2xl font-bold text-primary">AED {order.totalAmount.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Shop Products CTA */}
          <div className="mt-8 text-center">
            <Link href="/products">
              <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-primary rounded-xl px-8">
                <Package className="w-5 h-5 mr-2" />
                Shop Products
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
