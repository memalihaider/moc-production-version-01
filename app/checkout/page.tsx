'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Calendar, User, Phone, Mail, CheckCircle, Clock, ChevronLeft, Wallet, CreditCard, Banknote, Info, AlertCircle, X, Layers, DollarSign, MapPin, Home, Building, Navigation, Clock as ClockIcon, MapPin as MapPinIcon, Phone as PhoneIcon, Mail as MailIcon, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { 
  collection, 
  addDoc, 
  serverTimestamp,
  getDocs,
  query,
  where,
  getDoc,
  doc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Package, Award, Loader2 } from 'lucide-react';

// Types
interface OrderData {
  branchNames: string[];
  createdAt: any;
  customerEmail: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  expectedDeliveryDate: string;
  orderDate: string;
  paymentMethod: string;
  paymentStatus: string;
  pointsAwarded: boolean;
  products: Array<{
    price: number;
    productBranchNames: string[];
    productBranches: string[];
    productCategory: string;
    productCategoryId: string;
    productCost: number;
    productId: string;
    productImage: string;
    productName: string;
    productSku: string;
    quantity: number;
  }>;
  pickupBranch: string;
  pickupBranchAddress: string;
  pickupBranchPhone: string;
  pickupBranchTiming: string;
  status: "upcoming" | "pending" | "completed" | "cancelled";
  totalAmount: number;
  transactionId: string;
  updatedAt: any;
}

// 🔥 IMPORTANT: CartItem with branches array
interface CartItem {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  description: string;
  image: string;
  rating: number;
  reviews: number;
  sku: string;
  quantity: number;
  productCategoryId?: string;
  productSku?: string;
  productImage?: string;
  branches?: string[];        // Branch IDs jahan product available hai
  branchNames?: string[];     // Branch names jahan product available hai
}

interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  walletBalance?: number;
  loyaltyPoints?: number;
}

interface BranchData {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  openingTime: string;
  closingTime: string;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
  status: string;
  image?: string;
}

const useOrderStore = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');

  // 🔥 Load cart from localStorage with branch validation
  useEffect(() => {
    const loadCart = () => {
      const savedCart = localStorage.getItem('productCart');
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          
          // Ensure each item has branches array
          const validatedCart = parsedCart.map((item: any) => ({
            ...item,
            branches: item.branches || [],
            branchNames: item.branchNames || []
          }));
          
          console.log('🛒 Cart loaded from localStorage:', validatedCart.map((item: any) => ({
            name: item.name,
            branches: item.branches,
            branchNames: item.branchNames
          })));
          
          setCartItems(validatedCart);
        } catch (error) {
          console.error('Error parsing product cart:', error);
        }
      }
    };

    loadCart();
    
    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'productCart') {
        loadCart();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Load customer data
  useEffect(() => {
    const authData = localStorage.getItem('customerAuth');
    if (authData) {
      try {
        const { customer } = JSON.parse(authData);
        if (customer) {
          setCustomerName(customer.name || '');
          setCustomerEmail(customer.email || '');
          setCustomerPhone(customer.phone || '');
        }
      } catch (error) {
        console.error('Error parsing auth data:', error);
      }
    }
  }, []);

  const removeFromCart = (productId: string) => {
    setCartItems(prev => {
      const updated = prev.filter(item => item.id !== productId);
      localStorage.setItem('productCart', JSON.stringify(updated));
      return updated;
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(prev => {
      const updated = prev.map(item => 
        item.id === productId ? { ...item, quantity } : item
      );
      localStorage.setItem('productCart', JSON.stringify(updated));
      return updated;
    });
  };

  const getCartTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('productCart');
  };

  return {
    cartItems,
    customerName,
    customerEmail,
    customerPhone,
    specialRequests,
    selectedBranch,
    selectedDate,
    expectedDeliveryDate,
    removeFromCart,
    updateQuantity,
    setCustomerName,
    setCustomerEmail,
    setCustomerPhone,
    setSpecialRequests,
    setSelectedBranch,
    setSelectedDate,
    setExpectedDeliveryDate,
    getCartTotal,
    getTotalItems,
    clearCart,
  };
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

export default function ProductsOrderCheckout() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  
  // Branch states
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [selectedBranchData, setSelectedBranchData] = useState<BranchData | null>(null);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const [branchesError, setBranchesError] = useState('');
  
  // 🔥 State for filtered branches
  const [availableBranchesForProducts, setAvailableBranchesForProducts] = useState<BranchData[]>([]);
  const [isLoadingAvailableBranches, setIsLoadingAvailableBranches] = useState(false);

  const {
    cartItems,
    customerName,
    customerEmail,
    customerPhone,
    specialRequests,
    selectedBranch,
    selectedDate,
    expectedDeliveryDate,
    removeFromCart,
    updateQuantity,
    setCustomerName,
    setCustomerEmail,
    setCustomerPhone,
    setSpecialRequests,
    setSelectedBranch,
    setSelectedDate,
    setExpectedDeliveryDate,
    getCartTotal,
    getTotalItems,
    clearCart,
  } = useOrderStore();

  // 🔥 Fetch all branches from Firebase
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setIsLoadingBranches(true);
        const branchesRef = collection(db, 'branches');
        const querySnapshot = await getDocs(branchesRef);
        
        const branchesList: BranchData[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          branchesList.push({
            id: doc.id,
            name: data.name || 'Unnamed Branch',
            address: data.address || '',
            city: data.city || '',
            country: data.country || '',
            phone: data.phone || '',
            email: data.email || '',
            openingTime: data.openingTime || '09:00',
            closingTime: data.closingTime || '18:00',
            managerName: data.managerName || '',
            managerPhone: data.managerPhone || '',
            managerEmail: data.managerEmail || '',
            status: data.status || 'active',
            image: data.image || ''
          });
        });
        
        console.log('🏢 All branches fetched:', branchesList.map(b => ({ id: b.id, name: b.name })));
        setBranches(branchesList);
      } catch (error) {
        console.error('Error fetching branches:', error);
        setBranchesError('Failed to load branches. Please try again.');
      } finally {
        setIsLoadingBranches(false);
      }
    };

    fetchBranches();
  }, []);

  // 🔥 CRITICAL: Filter branches based on cart items
  useEffect(() => {
    const filterBranchesByProducts = async () => {
      if (cartItems.length === 0) {
        setAvailableBranchesForProducts([]);
        setSelectedBranch('');
        setSelectedBranchData(null);
        return;
      }

      setIsLoadingAvailableBranches(true);

      try {
        console.log('🔍 Filtering branches for cart items:', cartItems.map(item => ({
          name: item.name,
          id: item.id,
          hasBranches: !!item.branches,
          branches: item.branches
        })));

        // Collect all branch IDs from all products
        const validBranchIds = new Set<string>();
        const productsNeedingFetch: string[] = [];

        cartItems.forEach(item => {
          if (item.branches && Array.isArray(item.branches) && item.branches.length > 0) {
            // Product has branches array
            item.branches.forEach((branchId: string) => {
              validBranchIds.add(branchId);
            });
            console.log(`✅ Product "${item.name}" has branches:`, item.branches);
          } else {
            // Product missing branches - will fetch from Firebase
            console.warn(`⚠️ Product "${item.name}" missing branches, will fetch from Firebase`);
            productsNeedingFetch.push(item.id);
          }
        });

        // Fetch missing branches from Firebase
        if (productsNeedingFetch.length > 0) {
          console.log('📡 Fetching missing branches for products:', productsNeedingFetch);
          
          for (const productId of productsNeedingFetch) {
            try {
              const productDoc = await getDoc(doc(db, 'products', productId));
              if (productDoc.exists()) {
                const data = productDoc.data();
                const productBranches = data.branches || [];
                console.log(`📦 Fetched branches for product ${productId}:`, productBranches);
                
                productBranches.forEach((branchId: string) => {
                  validBranchIds.add(branchId);
                });

                // Update cart item with branches
                const updatedCart = cartItems.map(item => 
                  item.id === productId 
                    ? { ...item, branches: productBranches, branchNames: data.branchNames || [] }
                    : item
                );
                localStorage.setItem('productCart', JSON.stringify(updatedCart));
              }
            } catch (error) {
              console.error(`Error fetching product ${productId}:`, error);
            }
          }
        }

        console.log('✅ Valid branch IDs from products:', Array.from(validBranchIds));

        // Filter branches that exist in validBranchIds
        const filtered = branches.filter(branch => validBranchIds.has(branch.id));
        
        console.log(`🏢 Filtered branches: ${filtered.length} out of ${branches.length}`);
        console.log('Filtered branch names:', filtered.map(b => b.name));

        // Set available branches
        if (filtered.length > 0) {
          setAvailableBranchesForProducts(filtered);
          
          // Auto-select first available branch if none selected or selected not available
          const currentBranchValid = selectedBranch && filtered.some(b => b.name === selectedBranch);
          if (!currentBranchValid) {
            const defaultBranch = filtered[0];
            setSelectedBranch(defaultBranch.name);
            setSelectedBranchData(defaultBranch);
          }
        } else {
          // Fallback: show all branches
          console.log('⚠️ No matching branches found, showing all branches as fallback');
          setAvailableBranchesForProducts(branches);
          
          if (branches.length > 0 && !selectedBranch) {
            setSelectedBranch(branches[0].name);
            setSelectedBranchData(branches[0]);
          }
        }

      } catch (error) {
        console.error('Error filtering branches:', error);
        setBranchesError('Error processing branch availability');
        setAvailableBranchesForProducts(branches); // Fallback
      } finally {
        setIsLoadingAvailableBranches(false);
      }
    };

    if (branches.length > 0) {
      filterBranchesByProducts();
    }
  }, [cartItems, branches]);

  // Fetch customer data
  useEffect(() => {
    const fetchCustomerData = async () => {
      const authData = localStorage.getItem('customerAuth');
      if (authData) {
        try {
          const { isAuthenticated, customer: customerData } = JSON.parse(authData);
          if (isAuthenticated && customerData) {
            setIsLoggedIn(true);
            setCustomer(customerData);
          }
        } catch (error) {
          console.error('Error parsing auth data:', error);
        }
      }
    };

    fetchCustomerData();
  }, []);

  // Handle branch selection
  const handleBranchSelect = (branchName: string) => {
    setSelectedBranch(branchName);
    const branch = branches.find(b => b.name === branchName);
    if (branch) {
      setSelectedBranchData(branch);
    } else {
      setSelectedBranchData(null);
    }
  };

  const cartTotal = getCartTotal();
  const totalItems = getTotalItems();
  const finalTotal = cartTotal;

  const generateTransactionId = () => {
    return `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  };

  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDefaultDeliveryDate = () => {
    const now = new Date();
    now.setDate(now.getDate() + 7);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(getCurrentDate());
    }
    if (!expectedDeliveryDate) {
      setExpectedDeliveryDate(getDefaultDeliveryDate());
    }
  }, []);

  const handleConfirmOrder = async () => {
    if (cartItems.length === 0) {
      setValidationError('Please add products to your cart first.');
      return;
    }
    
    if (!customerName || !customerEmail || !customerPhone) {
      setValidationError('Please fill in all customer information.');
      return;
    }
    
    if (!selectedBranch) {
      setValidationError('Please select a branch for pickup.');
      return;
    }
    
    if (!selectedBranchData) {
      setValidationError('Selected branch information is not available.');
      return;
    }
    
    if (!selectedDate) {
      setValidationError('Please select order date.');
      return;
    }

    if (!expectedDeliveryDate) {
      setValidationError('Please select expected delivery date.');
      return;
    }

    if (!paymentMethod) {
      setValidationError('Please select a payment method.');
      return;
    }
    
    if ((paymentMethod === 'wallet' || paymentMethod === 'mixed') && !isLoggedIn) {
      setValidationError('Wallet and Mixed Payment require account. Please sign in or use COD.');
      return;
    }

    setValidationError('');
    setIsSubmitting(true);

    try {
      const authData = localStorage.getItem('customerAuth');
      let customerId = 'guest';

      if (authData) {
        try {
          const parsedAuth = JSON.parse(authData);
          customerId = parsedAuth?.customer?.id || parsedAuth?.customer?.uid || 'guest';
        } catch (error) {
          console.error('Error parsing auth:', error);
        }
      }
      
      const orderData: OrderData = {
        branchNames: [selectedBranch],
        createdAt: serverTimestamp(),
        customerEmail: customerEmail,
        customerId: customerId,
        customerName: customerName,
        customerPhone: customerPhone,
        expectedDeliveryDate: expectedDeliveryDate,
        orderDate: selectedDate,
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'cod' || paymentMethod === 'mixed' ? 'pending' : "paid",
        pointsAwarded: false,
        products: cartItems.map(item => ({
          price: item.price,
          productBranchNames: item.branchNames || [selectedBranch],
          productBranches: item.branches || [selectedBranchData.id],
          productCategory: item.category || "Product Category",
          productCategoryId: item.productCategoryId || "default_category_id",
          productCost: item.cost || 0,
          productId: item.id,
          productImage: item.image || item.productImage || "https://images.unsplash.com/photo-1512690196222-7c7d3f993c1b?q=80&w=2070&auto=format&fit=crop",
          productName: item.name,
          productSku: item.sku || item.productSku || "N/A",
          quantity: item.quantity
        })),
        pickupBranch: selectedBranch,
        pickupBranchAddress: selectedBranchData.address,
        pickupBranchPhone: selectedBranchData.phone,
        pickupBranchTiming: `${selectedBranchData.openingTime} - ${selectedBranchData.closingTime}`,
        status: "upcoming",
        totalAmount: finalTotal,
        transactionId: generateTransactionId(),
        updatedAt: serverTimestamp()
      };

      const ordersRef = collection(db, 'orders');
      await addDoc(ordersRef, orderData);
      
      setConfirmedOrderId(orderData.transactionId);
      clearCart();
      setOrderConfirmed(true);
      
    } catch (error) {
      console.error('Error creating order:', error);
      setValidationError('Failed to create order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderConfirmed) {
    return (
      <div className="min-h-screen bg-[#fcfcfc]">
      
        <div className="pt-32 pb-16 px-4">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-secondary" />
            </div>
            <h1 className="text-4xl font-sans font-bold text-primary">Order Confirmed!</h1>
            <p className="text-lg text-muted-foreground font-light">
              Your order has been successfully placed and is now upcoming.
            </p>
            
            <div className="flex justify-center">
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border border-blue-200 px-4 py-1 rounded-full">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs font-bold">UPCOMING</span>
                </div>
              </Badge>
            </div>
            
            <Card className="border-none bg-white shadow-xl rounded-none p-6">
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Transaction ID</p>
                  <p className="text-xl font-sans font-bold text-primary">{confirmedOrderId}</p>
                </div>
                <div className="grid grid-cols-2 gap-6 text-left">
                 
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Order Date</p>
                    <p className="font-bold text-sm">{selectedDate}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Expected Pickup</p>
                    <p className="font-bold text-sm">{expectedDeliveryDate}</p>
                  </div>
                </div>
                
                {selectedBranchData && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Pickup Location Details</p>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <MapPinIcon className="w-4 h-4 text-gray-500 mt-0.5" />
                        <span className="text-sm">{selectedBranchData.address}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <PhoneIcon className="w-4 h-4 text-gray-500 mt-0.5" />
                        <span className="text-sm">{selectedBranchData.phone}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <ClockIcon className="w-4 h-4 text-gray-500 mt-0.5" />
                        <span className="text-sm">{selectedBranchData.openingTime} - {selectedBranchData.closingTime}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
            <div className="pt-6 space-y-3">
              <Button onClick={() => router.push('/products')} className="bg-primary hover:bg-primary/90 text-white rounded-none px-8 py-5 font-bold tracking-widest text-xs">
                CONTINUE SHOPPING
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc]">
    
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Button variant="ghost" asChild className="p-0 hover:bg-transparent text-muted-foreground hover:text-primary">
              <Link href="/products" className="flex items-center text-xs font-bold tracking-widest">
                <ChevronLeft className="w-4 h-4 mr-1" /> BACK TO PRODUCTS
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Order Details */}
            <div className="lg:col-span-2 space-y-6">
              {!isLoggedIn && (
                <Card className="border-2 border-red-200 shadow-lg rounded-2xl bg-linear-to-r from-red-50 to-red-50">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-red-900 text-lg">Account Login Required</p>
                          <p className="text-sm text-red-700 mt-1">
                           Create account to show all history of your account
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 pt-2">
                        <Link href="/customer/login?redirect=/products/checkout">
                          <Button className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold tracking-widest text-xs px-6">
                            Sign In / Create Account
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Customer Information */}
              <Card className="border-none shadow-sm rounded-none">
                <CardHeader className="border-b border-gray-50 py-4">
                  <CardTitle className="text-xl font-sans font-bold flex items-center gap-2">
                    <User className="w-5 h-5 text-secondary" /> Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="text-[10px] uppercase tracking-widest font-bold">Full Name *</Label>
                      <Input 
                        id="name" 
                        placeholder="John Doe" 
                        className="rounded-none border-gray-200 h-10 text-sm"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-[10px] uppercase tracking-widest font-bold">Email Address *</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="john@example.com" 
                        className="rounded-none border-gray-200 h-10 text-sm"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-[10px] uppercase tracking-widest font-bold">Phone Number *</Label>
                      <Input 
                        id="phone" 
                        placeholder="+1 (555) 000-0000" 
                        className="rounded-none border-gray-200 h-10 text-sm"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        required
                      />
                    </div>
                    
                    {/* 🔥 UPDATED BRANCH DROPDOWN - Only shows available branches */}
                    <div className="space-y-1.5">
                      <Label htmlFor="branch" className="text-[10px] uppercase tracking-widest font-bold">Pickup Branch *</Label>
                      {isLoadingBranches || isLoadingAvailableBranches ? (
                        <div className="flex items-center gap-2 h-10">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm text-gray-500">Loading available branches...</span>
                        </div>
                      ) : branchesError ? (
                        <div className="text-red-500 text-sm">{branchesError}</div>
                      ) : (
                        <>
                          <Select 
                            value={selectedBranch} 
                            onValueChange={handleBranchSelect}
                            disabled={availableBranchesForProducts.length === 0}
                          >
                            <SelectTrigger className="rounded-none border-gray-200 h-10 text-sm">
                              <SelectValue placeholder={
                                availableBranchesForProducts.length === 0 
                                  ? "No branches available for selected products" 
                                  : "Select pickup branch"
                              } />
                            </SelectTrigger>
                            <SelectContent>
                              {availableBranchesForProducts.map((branch) => (
                                <SelectItem key={branch.id} value={branch.name}>
                                  {branch.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {/* Branch availability info */}
                          {cartItems.length > 0 && availableBranchesForProducts.length === 0 && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-xs text-yellow-700 flex items-center gap-1">
                                <Info className="w-3 h-3" />
                                Selected products are not available at any branch. Please remove some products.
                              </p>
                            </div>
                          )}
                          
                          {/* Show count of available branches */}
                          {availableBranchesForProducts.length > 0 && (
                            <p className="text-xs text-green-600 mt-1">
                              ✓ {availableBranchesForProducts.length} branch(es) have these products
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="requests" className="text-[10px] uppercase tracking-widest font-bold">Special Requests / Notes</Label>
                    <Textarea 
                      id="requests" 
                      placeholder="Any special instructions for your order..." 
                      className="rounded-none border-gray-200 min-h-20 text-sm"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Branch Details */}
              <Card className="border-none shadow-sm rounded-none">
                <CardHeader className="border-b border-gray-50 py-4">
                  <CardTitle className="text-xl font-sans font-bold flex items-center gap-2">
                    <Building className="w-5 h-5 text-secondary" /> Selected Branch Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {isLoadingBranches || isLoadingAvailableBranches ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                      <span className="ml-2 text-gray-500">Loading branch details...</span>
                    </div>
                  ) : !selectedBranch ? (
                    <div className="text-center py-8">
                      <Building className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Please select a branch to view details</p>
                    </div>
                  ) : !selectedBranchData ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                      <p className="text-gray-500">Branch information not available</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-secondary/5 border border-secondary/20 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Building className="w-5 h-5 text-secondary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-lg">{selectedBranchData.name}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              You will pick up your order from this location
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 border border-gray-100 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPinIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-xs font-bold uppercase tracking-widest">Address</span>
                          </div>
                          <p className="text-sm">{selectedBranchData.address}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {selectedBranchData.city}, {selectedBranchData.country}
                          </p>
                        </div>

                        <div className="p-3 border border-gray-100 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <PhoneIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-xs font-bold uppercase tracking-widest">Contact</span>
                          </div>
                          <p className="text-sm">{selectedBranchData.phone}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {selectedBranchData.email}
                          </p>
                        </div>

                        <div className="p-3 border border-gray-100 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <ClockIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-xs font-bold uppercase tracking-widest">Working Hours</span>
                          </div>
                          <p className="text-sm">{selectedBranchData.openingTime} - {selectedBranchData.closingTime}</p>
                          <p className="text-xs text-gray-500 mt-1">Open Daily</p>
                        </div>

                        <div className="p-3 border border-gray-100 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <UserIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-xs font-bold uppercase tracking-widest">Branch Manager</span>
                          </div>
                          <p className="text-sm">{selectedBranchData.managerName}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {selectedBranchData.managerPhone}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Dates */}
              <Card className="border-none shadow-sm rounded-none">
                <CardHeader className="border-b border-gray-50 py-4">
                  <CardTitle className="text-xl font-sans font-bold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-secondary" /> Order Dates
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-bold">Order Date *</Label>
                      <Input 
                        type="date" 
                        className="rounded-none border-gray-200 h-10 text-sm"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={getCurrentDate()}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-bold">Expected Pickup Date *</Label>
                      <Input 
                        type="date" 
                        className="rounded-none border-gray-200 h-10 text-sm"
                        value={expectedDeliveryDate}
                        onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                        min={selectedDate || getCurrentDate()}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Options */}
              <Card className="border-none shadow-sm rounded-none">
                <CardHeader className="border-b border-gray-50 py-4">
                  <CardTitle className="text-xl font-sans font-bold flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-secondary" /> Payment Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setPaymentMethod('cod')}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                        paymentMethod === 'cod' 
                          ? "border-secondary bg-secondary/10" 
                          : "border-gray-200 hover:border-gray-300 cursor-pointer"
                      )}
                    >
                      <Banknote className={cn("w-6 h-6", paymentMethod === 'cod' ? "text-secondary" : "text-gray-500")} />
                      <span className="text-xs font-bold">Cash on Delivery</span>
                      <span className="text-xs text-gray-500">Pay on Pickup</span>
                    </button>
                  </div>

                  {!isLoggedIn && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <p className="text-xs text-yellow-700">
                        <Info className="w-4 h-4 inline mr-1" />
                        <span className="font-bold">Note:</span> Create an account for Mixed Payment and Digital Wallet options. COD is always available.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Order Summary */}
            <div className="space-y-6">
              <Card className="border-none shadow-lg rounded-none bg-primary text-white sticky top-24">
                <div className="h-40 w-full bg-gradient-to-b from-secondary/20 to-primary flex items-center justify-center overflow-hidden">
                  <div className="text-center text-white p-4">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Building className="w-8 h-8 text-white" />
                    </div>
                    <p className="font-sans font-bold text-xl text-white">Order Summary</p>
                    <p className="text-sm text-white/80">
                      {selectedBranch || "Select Branch"}
                    </p>
                    {selectedBranchData && (
                      <p className="text-xs text-white/60 mt-1">
                        {selectedBranchData.city}, {selectedBranchData.country}
                      </p>
                    )}
                  </div>
                </div>

                <CardHeader className="border-b border-white/10 py-4">
                  <CardTitle className="text-xl font-sans font-bold">Order Details</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-4">
                    {cartItems.length === 0 ? (
                      <div className="text-center py-8 space-y-3">
                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                          <Package className="w-6 h-6 text-white/40" />
                        </div>
                        <p className="text-xs text-white/60">Your cart is empty</p>
                        <Button asChild variant="outline" className="border-white/20 text-white bg-white/10 rounded-lg text-[10px] font-bold tracking-widest">
                          <Link href="/products">BROWSE PRODUCTS</Link>
                        </Button>
                      </div>
                    ) : (
                      cartItems.map((item) => (
                        <div key={item.id} className="space-y-3 pb-4 border-b border-white/10 last:border-0">
                          <div className="flex justify-between items-start group">
                            <div className="space-y-0.5 flex-1">
                              <p className="font-sans font-bold text-sm">{item.name}</p>
                              <div className="flex items-center gap-2 text-[10px] text-white/60">
                                <span>SKU: {item.sku}</span>
                                <span className="text-white/40">•</span>
                                <span>{item.category}</span>
                              </div>
                              <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center gap-1">
                                  <button 
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    className="w-6 h-6 rounded-full bg-white/10 text-white/80 hover:text-white flex items-center justify-center"
                                  >
                                    -
                                  </button>
                                  <span className="text-sm font-bold min-w-[30px] text-center">{item.quantity}</span>
                                  <button 
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="w-6 h-6 rounded-full bg-white/10 text-white/80 hover:text-white flex items-center justify-center"
                                  >
                                    +
                                  </button>
                                </div>
                                <span className="text-sm font-bold">AED {item.price.toFixed(2)} each</span>
                              </div>
                              
                              {/* Show available branches for this product */}
                              {item.branchNames && item.branchNames.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-[8px] text-white/40 uppercase tracking-wider mb-1">Available at:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {item.branchNames.map((branchName, idx) => (
                                      <Badge key={idx} variant="outline" className="text-[8px] bg-white/5 border-white/20 text-white/60">
                                        {branchName}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-sm">AED{(item.price * item.quantity).toFixed(2)}</span>
                              <button 
                                onClick={() => removeFromCart(item.id)}
                                className="text-white/40 hover:text-red-300 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {cartItems.length > 0 && (
                    <>
                      {validationError && (
                        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                          <p className="text-xs text-red-200 font-bold uppercase tracking-widest">{validationError}</p>
                        </div>
                      )}
                      
                      <div className="border-t border-white/10 pt-4 space-y-2">
                        <div className="flex justify-between text-xs text-white/60">
                          <span>Subtotal ({totalItems} items)</span>
                          <span>AED {cartTotal.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between text-xs text-white/60">
                          <span>Pickup</span>
                          <span>FREE</span>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-white/10">
                          <span className="text-sm font-sans font-bold">
                            Final Amount
                          </span>
                          <span className="text-2xl font-sans font-bold text-secondary">
                            AED {finalTotal.toFixed(2)}
                          </span>
                        </div>

                        {selectedBranchData && (
                          <div className="mt-4 p-3 bg-white/10 rounded-lg">
                            <p className="text-xs text-white/80 mb-2">Pickup at:</p>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <Building className="w-3 h-3 text-white/60" />
                                <span className="text-xs">{selectedBranchData.name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPinIcon className="w-3 h-3 text-white/60" />
                                <span className="text-xs truncate">{selectedBranchData.address}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <Button 
                        className="w-full bg-secondary hover:bg-secondary/90 text-primary font-bold py-6 rounded-lg tracking-[0.2em] text-xs shadow-lg shadow-secondary/20 transition-all duration-300 hover:scale-[1.02] active:scale-95"
                        disabled={isSubmitting || !customerName || !customerEmail || !customerPhone || !selectedDate || !expectedDeliveryDate || cartItems.length === 0 || !paymentMethod || !selectedBranch || !selectedBranchData || availableBranchesForProducts.length === 0}
                        onClick={handleConfirmOrder}
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            PROCESSING...
                          </div>
                        ) : 'CONFIRM ORDER'}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}