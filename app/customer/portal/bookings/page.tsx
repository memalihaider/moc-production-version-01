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
  Calendar,
  Clock,
  ChevronLeft,
  Search,
  Filter,
  MapPin,
  User,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
} from 'lucide-react';
import { useCustomerStore, type Customer, type CustomerBooking } from '@/stores/customer.store';

export default function CustomerBookings() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { getCustomerByEmail, getBookingsByCustomer } = useCustomerStore();

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
          <p className="text-muted-foreground">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  if (!customer) return null;

  const bookings = getBookingsByCustomer(customer.id);

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch = booking.services.some(s => 
      s.serviceName.toLowerCase().includes(searchQuery.toLowerCase())
    ) || booking.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
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
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-700 border-blue-200';
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
              <h1 className="text-3xl font-serif font-bold text-primary">My Bookings</h1>
              <p className="text-muted-foreground">View and manage your service appointments</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search bookings..."
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
                <SelectItem value="all">All Bookings</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="border-none shadow-md rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{bookings.length}</p>
                <p className="text-xs text-muted-foreground">Total Bookings</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-yellow-600">{bookings.filter(b => b.status === 'pending').length}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{bookings.filter(b => b.status === 'confirmed').length}</p>
                <p className="text-xs text-muted-foreground">Confirmed</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{bookings.filter(b => b.status === 'completed').length}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
          </div>

          {/* Bookings List */}
          {filteredBookings.length === 0 ? (
            <Card className="border-none shadow-lg rounded-2xl">
              <CardContent className="py-16 text-center">
                <Calendar className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-primary mb-2">No Bookings Found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter'
                    : "You haven't made any bookings yet"}
                </p>
                <Link href="/services">
                  <Button className="bg-secondary hover:bg-secondary/90 text-primary rounded-xl">
                    <Calendar className="w-4 h-4 mr-2" />
                    Book a Service
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <Card key={booking.id} className="border-none shadow-lg rounded-2xl hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(booking.status)}
                        <div>
                          <p className="text-xs text-muted-foreground font-medium">Booking ID</p>
                          <p className="font-mono font-bold text-primary">{booking.id}</p>
                        </div>
                      </div>
                      <Badge className={`${getStatusColor(booking.status)} capitalize px-4 py-1`}>
                        {booking.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <Calendar className="w-4 h-4 text-secondary" />
                          <span className="font-medium">{booking.date}</span>
                          <Clock className="w-4 h-4 text-secondary ml-2" />
                          <span className="font-medium">{booking.time}</span>
                        </div>
                        {booking.branchName && (
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>{booking.branchName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Services</p>
                      <div className="space-y-2">
                        {booking.services.map((service, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Star className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-semibold text-sm">{service.serviceName}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  <span>{service.duration} min</span>
                                  {service.staffMember && (
                                    <>
                                      <User className="w-3 h-3 ml-2" />
                                      <span>{service.staffMember}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span className="font-bold text-primary">AED {service.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <div className="flex flex-wrap gap-4 text-sm">
                        {booking.pointsEarned > 0 && (
                          <div className="flex items-center gap-1 text-green-600">
                            <Star className="w-4 h-4" />
                            <span>+{booking.pointsEarned} points earned</span>
                          </div>
                        )}
                        {booking.pointsUsed > 0 && (
                          <div className="flex items-center gap-1 text-secondary">
                            <Star className="w-4 h-4" />
                            <span>{booking.pointsUsed} points used</span>
                          </div>
                        )}
                        {booking.walletAmountUsed > 0 && (
                          <div className="text-blue-600">
                            ${booking.walletAmountUsed} from wallet
                          </div>
                        )}
                      </div>
                      <div className="mt-4 md:mt-0 text-right">
                        <p className="text-xs text-muted-foreground">Total Amount</p>
                        <p className="text-2xl font-bold text-primary">AED {booking.totalAmount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Book New Service CTA */}
          <div className="mt-8 text-center">
            <Link href="/services">
              <Button size="lg" className="bg-secondary hover:bg-secondary/90 text-primary rounded-xl px-8">
                <Calendar className="w-5 h-5 mr-2" />
                Book New Service
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
