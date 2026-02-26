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
  History,
  ChevronLeft,
  Search,
  Filter,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Star,
  Calendar,
  Package,
  Gift,
  RefreshCw,
} from 'lucide-react';
import { useCustomerStore, type Customer, type WalletTransaction } from '@/stores/customer.store';

export default function CustomerTransactions() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const { getCustomerByEmail, getTransactionsByCustomer } = useCustomerStore();

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
          <p className="text-muted-foreground">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (!customer) return null;

  const transactions = getTransactionsByCustomer(customer.id);

  // Filter transactions
  const filteredTransactions = transactions.filter((txn) => {
    const matchesSearch = txn.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = typeFilter === 'all' || txn.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'points_earned':
        return <Star className="w-5 h-5 text-green-600" />;
      case 'points_redeemed':
        return <Gift className="w-5 h-5 text-purple-600" />;
      case 'wallet_topup':
        return <ArrowUpRight className="w-5 h-5 text-green-600" />;
      case 'wallet_payment':
        return <ArrowDownRight className="w-5 h-5 text-red-600" />;
      case 'service_booking':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'product_purchase':
        return <Package className="w-5 h-5 text-purple-600" />;
      case 'refund':
        return <RefreshCw className="w-5 h-5 text-orange-600" />;
      default:
        return <Wallet className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'points_earned':
      case 'wallet_topup':
        return 'bg-green-100';
      case 'points_redeemed':
      case 'product_purchase':
        return 'bg-purple-100';
      case 'wallet_payment':
        return 'bg-red-100';
      case 'service_booking':
        return 'bg-blue-100';
      case 'refund':
        return 'bg-orange-100';
      default:
        return 'bg-gray-100';
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'points_earned':
        return 'Points Earned';
      case 'points_redeemed':
        return 'Points Redeemed';
      case 'wallet_topup':
        return 'Wallet Top-up';
      case 'wallet_payment':
        return 'Wallet Payment';
      case 'service_booking':
        return 'Service Booking';
      case 'product_purchase':
        return 'Product Purchase';
      case 'refund':
        return 'Refund';
      default:
        return type;
    }
  };

  // Calculate totals
  const totalPointsEarned = transactions
    .filter(t => t.type === 'points_earned')
    .reduce((sum, t) => sum + (t.pointsAmount || 0), 0);
  const totalPointsRedeemed = transactions
    .filter(t => t.type === 'points_redeemed')
    .reduce((sum, t) => sum + Math.abs(t.pointsAmount || 0), 0);
  const totalWalletIn = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalWalletOut = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

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
              <h1 className="text-3xl font-serif font-bold text-primary">Transaction History</h1>
              <p className="text-muted-foreground">View all your wallet and points activity</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="border-none shadow-md rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">+{totalPointsEarned}</p>
                <p className="text-xs text-muted-foreground">Points Earned</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">-{totalPointsRedeemed}</p>
                <p className="text-xs text-muted-foreground">Points Redeemed</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-600">+${totalWalletIn.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Wallet Credit</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md rounded-2xl">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600">-${totalWalletOut.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Wallet Debit</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-xl border-gray-200"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-56 h-12 rounded-xl border-gray-200">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="points_earned">Points Earned</SelectItem>
                <SelectItem value="points_redeemed">Points Redeemed</SelectItem>
                <SelectItem value="wallet_topup">Wallet Top-up</SelectItem>
                <SelectItem value="wallet_payment">Wallet Payment</SelectItem>
                <SelectItem value="service_booking">Service Booking</SelectItem>
                <SelectItem value="product_purchase">Product Purchase</SelectItem>
                <SelectItem value="refund">Refund</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transactions List */}
          <Card className="border-none shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-secondary" />
                All Transactions
              </CardTitle>
              <CardDescription>{filteredTransactions.length} transaction(s) found</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-primary mb-2">No Transactions Found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || typeFilter !== 'all'
                      ? 'Try adjusting your search or filter'
                      : 'Your transaction history will appear here'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTransactions.map((txn) => (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getTransactionColor(txn.type)}`}>
                          {getTransactionIcon(txn.type)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{txn.description}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge variant="outline" className="text-xs capitalize">
                              {getTransactionLabel(txn.type)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(txn.createdAt).toLocaleDateString()} at{' '}
                              {new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {txn.referenceId && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Ref: {txn.referenceId}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {txn.pointsAmount !== undefined && txn.pointsAmount !== 0 && (
                          <p className={`font-bold ${txn.pointsAmount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {txn.pointsAmount > 0 ? '+' : ''}{txn.pointsAmount} pts
                          </p>
                        )}
                        {txn.amount !== 0 && (
                          <p className={`font-bold ${txn.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {txn.amount > 0 ? '+' : ''}AED {Math.abs(txn.amount).toFixed(2)}
                          </p>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {txn.pointsAfter !== undefined && (
                            <span>Balance: {txn.pointsAfter} pts</span>
                          )}
                          {txn.balanceAfter !== undefined && txn.amount !== 0 && (
                            <span> | AED {txn.balanceAfter.toFixed(2)}</span>
                          )}
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
    </div>
  );
}
