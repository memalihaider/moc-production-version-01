// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { Header } from '@/components/shared/Header';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Textarea } from '@/components/ui/textarea';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Badge } from '@/components/ui/badge';
// import { Trash2, Calendar, User, Phone, Mail, CheckCircle, Clock, ChevronLeft, Wallet, CreditCard, Banknote, Info, AlertCircle, X, Layers, DollarSign, MapPin, Home, Building, Navigation } from 'lucide-react';
// import Link from 'next/link';
// import { 
//   collection, 
//   addDoc, 
//   serverTimestamp,
//   getDocs,
//   query,
//   where
// } from 'firebase/firestore';
// import { db } from '@/lib/firebase';
// import { Package,Award } from 'lucide-react';

// // Types
// interface OrderData {
//   branchNames: string[];
//   createdAt: any;
//   customerEmail: string;
//   customerId: string;
//   customerName: string;
//   customerPhone: string;
//   expectedDeliveryDate: string;
//   orderDate: string;
//   paymentMethod: string;
//   paymentStatus: string;
//   pointsAwarded: boolean;
//   products: Array<{
//     price: number;
//     productBranchNames: string[];
//     productBranches: string[];
//     productCategory: string;
//     productCategoryId: string;
//     productCost: number;
//     productId: string;
//     productImage: string;
//     productName: string;
//     productSku: string;
//     quantity: number;
//   }>;
//   shippingAddress: string;
//   shippingCity: string;
//   shippingCountry: string;
//   shippingPhone: string;
//   shippingState: string;
//   shippingZipCode: string;
//   status: string;
//   totalAmount: number;
//   transactionId: string;
//   updatedAt: any;
// }

// interface CartItem {
//   id: string;
//   name: string;
//   category: string;
//   price: number;
//   cost: number;
//   description: string;
//   image: string;
//   rating: number;
//   reviews: number;
//   sku: string;
//   quantity: number;
//   productCategoryId?: string;
//   productSku?: string;
//   productImage?: string;
// }

// interface CustomerData {
//   id: string;
//   name: string;
//   email: string;
//   phone: string;
//   walletBalance?: number;
//   loyaltyPoints?: number;
// }

// const useOrderStore = () => {
//   const [cartItems, setCartItems] = useState<CartItem[]>([]);
//   const [customerName, setCustomerName] = useState('');
//   const [customerEmail, setCustomerEmail] = useState('');
//   const [customerPhone, setCustomerPhone] = useState('');
//   const [specialRequests, setSpecialRequests] = useState('');
//   const [selectedBranch, setSelectedBranch] = useState('first branch');
//   const [selectedDate, setSelectedDate] = useState('');
//   const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');

//   useEffect(() => {
//     // Load cart items from localStorage for products
//     const savedCart = localStorage.getItem('productCart');
//     if (savedCart) {
//       try {
//         const parsedCart = JSON.parse(savedCart);
//         setCartItems(parsedCart);
//       } catch (error) {
//         console.error('Error parsing product cart:', error);
//       }
//     }
    
//     // Load customer info if available
//     const authData = localStorage.getItem('customerAuth');
//     if (authData) {
//       try {
//         const { customer } = JSON.parse(authData);
//         if (customer) {
//           setCustomerName(customer.name || '');
//           setCustomerEmail(customer.email || '');
//           setCustomerPhone(customer.phone || '');
//         }
//       } catch (error) {
//         console.error('Error parsing auth data:', error);
//       }
//     }
//   }, []);

//   const removeFromCart = (productId: string) => {
//     setCartItems(prev => prev.filter(item => item.id !== productId));
//     // Update localStorage
//     const updatedCart = cartItems.filter(item => item.id !== productId);
//     localStorage.setItem('productCart', JSON.stringify(updatedCart));
//   };

//   const updateQuantity = (productId: string, quantity: number) => {
//     if (quantity < 1) {
//       removeFromCart(productId);
//       return;
//     }
    
//     setCartItems(prev => prev.map(item => 
//       item.id === productId ? { ...item, quantity } : item
//     ));
    
//     // Update localStorage
//     const updatedCart = cartItems.map(item => 
//       item.id === productId ? { ...item, quantity } : item
//     );
//     localStorage.setItem('productCart', JSON.stringify(updatedCart));
//   };

//   const getCartTotal = () => {
//     return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
//   };

//   const getTotalItems = () => {
//     return cartItems.reduce((sum, item) => sum + item.quantity, 0);
//   };

//   const clearCart = () => {
//     setCartItems([]);
//     localStorage.removeItem('productCart');
//   };

//   return {
//     cartItems,
//     customerName,
//     customerEmail,
//     customerPhone,
//     specialRequests,
//     selectedBranch,
//     selectedDate,
//     expectedDeliveryDate,
//     removeFromCart,
//     updateQuantity,
//     setCustomerName,
//     setCustomerEmail,
//     setCustomerPhone,
//     setSpecialRequests,
//     setSelectedBranch,
//     setSelectedDate,
//     setExpectedDeliveryDate,
//     getCartTotal,
//     getTotalItems,
//     clearCart,
//   };
// };

// function cn(...inputs: any[]) {
//   return inputs.filter(Boolean).join(" ");
// }

// export default function ProductsOrderCheckout() {
//   const router = useRouter();
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [customer, setCustomer] = useState<CustomerData | null>(null);
//   const [orderConfirmed, setOrderConfirmed] = useState(false);
//   const [confirmedOrderId, setConfirmedOrderId] = useState('');
//   const [validationError, setValidationError] = useState('');
//   const [isSubmitting, setIsSubmitting] = useState(false);
  
//   const [paymentMethod, setPaymentMethod] = useState('');
//   const [notes, setNotes] = useState('');

//   // Shipping Address Fields
//   const [shippingAddress, setShippingAddress] = useState('');
//   const [shippingCity, setShippingCity] = useState('');
//   const [shippingState, setShippingState] = useState('');
//   const [shippingZipCode, setShippingZipCode] = useState('');
//   const [shippingCountry, setShippingCountry] = useState('');
//   const [shippingPhone, setShippingPhone] = useState('');

//   // Mixed payment state
//   const [walletAmount, setWalletAmount] = useState<number>(0);
//   const [cashAmount, setCashAmount] = useState<number>(0);

//   const {
//     cartItems,
//     customerName,
//     customerEmail,
//     customerPhone,
//     specialRequests,
//     selectedBranch,
//     selectedDate,
//     expectedDeliveryDate,
//     removeFromCart,
//     updateQuantity,
//     setCustomerName,
//     setCustomerEmail,
//     setCustomerPhone,
//     setSpecialRequests,
//     setSelectedBranch,
//     setSelectedDate,
//     setExpectedDeliveryDate,
//     getCartTotal,
//     getTotalItems,
//     clearCart,
//   } = useOrderStore();

//   // Check for logged in customer
//   useEffect(() => {
//     const fetchCustomerData = async () => {
//       const authData = localStorage.getItem('customerAuth');
//       if (authData) {
//         try {
//           const { isAuthenticated, customer: customerData } = JSON.parse(authData);
//           if (isAuthenticated && customerData) {
//             setIsLoggedIn(true);
//             setCustomer(customerData);
//           }
//         } catch (error) {
//           console.error('Error parsing auth data:', error);
//         }
//       }
//     };

//     fetchCustomerData();
//   }, []);

//   // Calculate cart total
//   const cartTotal = getCartTotal();
//   const totalItems = getTotalItems();
  
//   // Calculate final amounts
//   const finalTotal = cartTotal;

//   // Auto-calculate mixed payment amounts when payment method changes
//   useEffect(() => {
//     if (paymentMethod === 'mixed' && customer) {
//       const walletBalance = customer.walletBalance || 0;
//       const walletPay = Math.min(walletBalance, finalTotal);
//       const cashPay = finalTotal - walletPay;
      
//       setWalletAmount(walletPay);
//       setCashAmount(cashPay);
//     } else {
//       setWalletAmount(0);
//       setCashAmount(0);
//     }
//   }, [paymentMethod, finalTotal, customer]);

//   // Handle wallet amount change
//   const handleWalletAmountChange = (value: number) => {
//     if (value > finalTotal) {
//       setWalletAmount(finalTotal);
//       setCashAmount(0);
//     } else if (value < 0) {
//       setWalletAmount(0);
//       setCashAmount(finalTotal);
//     } else {
//       setWalletAmount(value);
//       setCashAmount(finalTotal - value);
//     }
//   };

//   // Generate unique transaction ID
//   const generateTransactionId = () => {
//     return `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
//   };

//   // Get current date for order
//   const getCurrentDate = () => {
//     const now = new Date();
//     const year = now.getFullYear();
//     const month = String(now.getMonth() + 1).padStart(2, '0');
//     const day = String(now.getDate()).padStart(2, '0');
//     return `${year}-${month}-${day}`;
//   };

//   // Get expected delivery date (default 7 days from order)
//   const getDefaultDeliveryDate = () => {
//     const now = new Date();
//     now.setDate(now.getDate() + 7);
//     const year = now.getFullYear();
//     const month = String(now.getMonth() + 1).padStart(2, '0');
//     const day = String(now.getDate()).padStart(2, '0');
//     return `${year}-${month}-${day}`;
//   };

//   // Set default dates on component mount
//   useEffect(() => {
//     if (!selectedDate) {
//       setSelectedDate(getCurrentDate());
//     }
//     if (!expectedDeliveryDate) {
//       setExpectedDeliveryDate(getDefaultDeliveryDate());
//     }
//   }, []);

//   // Handle confirm order with Firebase
//   const handleConfirmOrder = async () => {
//     // Validation
//     if (cartItems.length === 0) {
//       setValidationError('Please add products to your cart first.');
//       return;
//     }
    
//     if (!customerName || !customerEmail || !customerPhone) {
//       setValidationError('Please fill in all customer information.');
//       return;
//     }
    
//     if (!shippingAddress || !shippingCity || !shippingState || !shippingZipCode || !shippingCountry) {
//       setValidationError('Please fill in all shipping address fields.');
//       return;
//     }
    
//     if (!selectedDate) {
//       setValidationError('Please select order date.');
//       return;
//     }

//     if (!expectedDeliveryDate) {
//       setValidationError('Please select expected delivery date.');
//       return;
//     }

//     // Payment method validation
//     if (!paymentMethod) {
//       setValidationError('Please select a payment method.');
//       return;
//     }
    
//     // If wallet or mixed payment selected but not logged in
//     if ((paymentMethod === 'wallet' || paymentMethod === 'mixed') && !isLoggedIn) {
//       setValidationError('Wallet and Mixed Payment require account. Please sign in or use COD.');
//       return;
//     }

//     // Check if wallet has sufficient balance for digital wallet payment
//     if (paymentMethod === 'wallet' && customer && customer.walletBalance !== undefined) {
//       if (customer.walletBalance < finalTotal) {
//         setValidationError(`Insufficient wallet balance. Your balance is $${customer.walletBalance.toFixed(2)} but total is $${finalTotal.toFixed(2)}. Please choose another payment method.`);
//         return;
//       }
//     }

//     // Validate mixed payment amounts
//     if (paymentMethod === 'mixed') {
//       if (walletAmount + cashAmount !== finalTotal) {
//         setValidationError(`Mixed payment amounts must equal the total of $${finalTotal.toFixed(2)}. Current: Wallet $${walletAmount.toFixed(2)} + Cash $${cashAmount.toFixed(2)} = $${(walletAmount + cashAmount).toFixed(2)}`);
//         return;
//       }
      
//       if (customer && customer.walletBalance !== undefined && walletAmount > customer.walletBalance) {
//         setValidationError(`Wallet amount ($${walletAmount.toFixed(2)}) exceeds your balance ($${customer.walletBalance.toFixed(2)})`);
//         return;
//       }
//     }

//     setValidationError('');
//     setIsSubmitting(true);

//     try {
//       // Get customer data
//       const authData = localStorage.getItem('customerAuth');
//       let customerId = 'guest';
//       let customerData = null;

//       if (authData) {
//         try {
//           const parsedAuth = JSON.parse(authData);
//           customerData = parsedAuth?.customer;
//           customerId = customerData?.id || customerData?.uid || 'guest';
//         } catch (error) {
//           console.error('Error parsing auth:', error);
//         }
//       }
      
//       // Prepare order data according to your EXACT structure
//       const orderData: OrderData = {
//         branchNames: [selectedBranch],
//         createdAt: serverTimestamp(),
//         customerEmail: customerEmail,
//         customerId: customerId,
//         customerName: customerName,
//         customerPhone: customerPhone,
//         expectedDeliveryDate: expectedDeliveryDate,
//         orderDate: selectedDate,
//         paymentMethod: paymentMethod,
//         paymentStatus: paymentMethod === 'cod' || paymentMethod === 'mixed' ? 'pending' : "paid",
//         pointsAwarded: false,
//         products: cartItems.map(item => ({
//           price: item.price,
//           productBranchNames: [selectedBranch],
//           productBranches: [selectedBranch.replace(/\s+/g, '_')],
//           productCategory: item.category || "Product Category",
//           productCategoryId: item.productCategoryId || "default_category_id",
//           productCost: item.cost || 0,
//           productId: item.id,
//           productImage: item.image || item.productImage || "https://images.unsplash.com/photo-1512690196222-7c7d3f993c1b?q=80&w=2070&auto=format&fit=crop",
//           productName: item.name,
//           productSku: item.sku || item.productSku || "N/A",
//           quantity: item.quantity
//         })),
//         shippingAddress: shippingAddress,
//         shippingCity: shippingCity,
//         shippingCountry: shippingCountry,
//         shippingPhone: shippingPhone || customerPhone,
//         shippingState: shippingState,
//         shippingZipCode: shippingZipCode,
//         status: "pending",
//         totalAmount: finalTotal,
//         transactionId: generateTransactionId(),
//         updatedAt: serverTimestamp()
//       };

//       // Save to Firebase orders collection
//       const ordersRef = collection(db, 'orders');
//       const docRef = await addDoc(ordersRef, orderData);
      
//       // If payment is by wallet or mixed with wallet portion, update wallet balance
//       if ((paymentMethod === 'wallet' || (paymentMethod === 'mixed' && walletAmount > 0)) && customer && customer.id) {
//         try {
//           // Find wallet document
//           const walletsQuery = query(
//             collection(db, 'wallets'),
//             where('customerId', '==', customer.id)
//           );
          
//           const walletSnapshot = await getDocs(walletsQuery);
          
//           if (!walletSnapshot.empty) {
//             const walletDoc = walletSnapshot.docs[0];
//             const walletData = walletDoc.data();
//             const amountToDeduct = paymentMethod === 'wallet' ? finalTotal : walletAmount;
//             const newBalance = (walletData.balance || 0) - amountToDeduct;
            
//             // Update wallet balance transaction record
//             await addDoc(collection(db, 'walletTransactions'), {
//               customerId: customer.id,
//               customerName: customer.name,
//               amount: amountToDeduct,
//               type: 'debit',
//               description: `Order payment: ${orderData.transactionId}${paymentMethod === 'mixed' ? ' (Mixed Payment - Wallet Portion)' : ''}`,
//               orderId: docRef.id,
//               transactionId: orderData.transactionId,
//               previousBalance: walletData.balance || 0,
//               newBalance: newBalance,
//               createdAt: serverTimestamp(),
//               updatedAt: serverTimestamp()
//             });
//           }
//         } catch (walletError) {
//           console.error('Error updating wallet balance:', walletError);
//           // Don't fail the order if wallet update fails
//         }
//       }
      
//       setConfirmedOrderId(orderData.transactionId);
      
//       // Clear cart
//       clearCart();
      
//       // Show success
//       setOrderConfirmed(true);
      
//     } catch (error) {
//       console.error('Error creating order:', error);
//       setValidationError('Failed to create order. Please try again.');
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   if (orderConfirmed) {
//     return (
//       <div className="min-h-screen bg-[#fcfcfc]">
//         <Header />
//         <div className="pt-32 pb-16 px-4">
//           <div className="max-w-2xl mx-auto text-center space-y-6">
//             <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
//               <CheckCircle className="w-10 h-10 text-secondary" />
//             </div>
//             <h1 className="text-4xl font-serif font-bold text-primary">Order Confirmed!</h1>
//             <p className="text-lg text-muted-foreground font-light">
//               Your order has been successfully placed.
//             </p>
//             <Card className="border-none bg-white shadow-xl rounded-none p-6">
//               <div className="space-y-4">
//                 <div className="border-b border-gray-100 pb-3">
//                   <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Transaction ID</p>
//                   <p className="text-xl font-serif font-bold text-primary">{confirmedOrderId}</p>
//                 </div>
//                 <div className="grid grid-cols-2 gap-6 text-left">
//                   <div>
//                     <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Order Date</p>
//                     <p className="font-bold text-sm">{selectedDate}</p>
//                   </div>
//                   <div>
//                     <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Expected Delivery</p>
//                     <p className="font-bold text-sm">{expectedDeliveryDate}</p>
//                   </div>
//                   <div>
//                     <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Shipping To</p>
//                     <p className="font-bold text-sm">{shippingCity}, {shippingState}</p>
//                   </div>
//                   <div>
//                     <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Total Amount</p>
//                     <p className="font-bold text-sm">${finalTotal.toFixed(2)}</p>
//                   </div>
//                 </div>
//                 <div className="pt-4 border-t border-gray-100">
//                   <p className="text-sm text-muted-foreground">
//                     We'll send shipping confirmation to <span className="font-bold">{customerEmail}</span>
//                   </p>
//                 </div>
//               </div>
//             </Card>
//             <div className="pt-6 space-y-3">
//               <Button onClick={() => router.push('/products')} className="bg-primary hover:bg-primary/90 text-white rounded-none px-8 py-5 font-bold tracking-widest text-xs">
//                 CONTINUE SHOPPING
//               </Button>
              
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-[#fcfcfc]">
//       <Header />
      
//       <div className="pt-24 pb-16 px-4">
//         <div className="max-w-6xl mx-auto">
//           <div className="flex items-center gap-2 mb-6">
//             <Button variant="ghost" asChild className="p-0 hover:bg-transparent text-muted-foreground hover:text-primary">
//               <Link href="/products" className="flex items-center text-xs font-bold tracking-widest">
//                 <ChevronLeft className="w-4 h-4 mr-1" /> BACK TO PRODUCTS
//               </Link>
//             </Button>
//           </div>

//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//             {/* Left Column: Order Details */}
//             <div className="lg:col-span-2 space-y-6">
//               {/* Sign-In Alert */}
//               {!isLoggedIn && (
//                 <Card className="border-2 border-red-200 shadow-lg rounded-2xl bg-linear-to-r from-red-50 to-red-50">
//                   <CardContent className="p-6">
//                     <div className="space-y-4">
//                       <div className="flex items-start gap-4">
//                         <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
//                           <AlertCircle className="w-6 h-6 text-red-600" />
//                         </div>
//                         <div className="flex-1">
//                           <p className="font-bold text-red-900 text-lg">Account Login Required</p>
//                           <p className="text-sm text-red-700 mt-1">
//                            Create account to show all history of your account
//                           </p>
//                         </div>
//                       </div>
                      
//                       <div className="flex gap-3 pt-2">
//                         <Link href="/customer/login?redirect=/products/checkout">
//                           <Button className="bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold tracking-widest text-xs px-6">
//                             Sign In / Create Account
//                           </Button>
//                         </Link>
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               )}

//               {/* Customer Information */}
//               <Card className="border-none shadow-sm rounded-none">
//                 <CardHeader className="border-b border-gray-50 py-4">
//                   <CardTitle className="text-xl font-serif font-bold flex items-center gap-2">
//                     <User className="w-5 h-5 text-secondary" /> Customer Information
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent className="pt-6 space-y-4">
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div className="space-y-1.5">
//                       <Label htmlFor="name" className="text-[10px] uppercase tracking-widest font-bold">Full Name *</Label>
//                       <Input 
//                         id="name" 
//                         placeholder="John Doe" 
//                         className="rounded-none border-gray-200 h-10 text-sm"
//                         value={customerName}
//                         onChange={(e) => setCustomerName(e.target.value)}
//                         required
//                       />
//                     </div>
//                     <div className="space-y-1.5">
//                       <Label htmlFor="email" className="text-[10px] uppercase tracking-widest font-bold">Email Address *</Label>
//                       <Input 
//                         id="email" 
//                         type="email" 
//                         placeholder="john@example.com" 
//                         className="rounded-none border-gray-200 h-10 text-sm"
//                         value={customerEmail}
//                         onChange={(e) => setCustomerEmail(e.target.value)}
//                         required
//                       />
//                     </div>
//                     <div className="space-y-1.5">
//                       <Label htmlFor="phone" className="text-[10px] uppercase tracking-widest font-bold">Phone Number *</Label>
//                       <Input 
//                         id="phone" 
//                         placeholder="+1 (555) 000-0000" 
//                         className="rounded-none border-gray-200 h-10 text-sm"
//                         value={customerPhone}
//                         onChange={(e) => setCustomerPhone(e.target.value)}
//                         required
//                       />
//                     </div>
//                     <div className="space-y-1.5">
//                       <Label htmlFor="branch" className="text-[10px] uppercase tracking-widest font-bold">Branch *</Label>
//                       <Select value={selectedBranch} onValueChange={setSelectedBranch}>
//                         <SelectTrigger className="rounded-none border-gray-200 h-10 text-sm">
//                           <SelectValue placeholder="Select branch" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="first branch">First Branch</SelectItem>
//                           <SelectItem value="second branch">Second Branch</SelectItem>
//                           <SelectItem value="third branch">Third Branch</SelectItem>
//                         </SelectContent>
//                       </Select>
//                     </div>
//                   </div>
//                   <div className="space-y-1.5">
//                     <Label htmlFor="requests" className="text-[10px] uppercase tracking-widest font-bold">Special Requests / Notes</Label>
//                     <Textarea 
//                       id="requests" 
//                       placeholder="Any special instructions for your order..." 
//                       className="rounded-none border-gray-200 min-h-20 text-sm"
//                       value={notes}
//                       onChange={(e) => setNotes(e.target.value)}
//                     />
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* Shipping Address */}
//               <Card className="border-none shadow-sm rounded-none">
//                 <CardHeader className="border-b border-gray-50 py-4">
//                   <CardTitle className="text-xl font-serif font-bold flex items-center gap-2">
//                     <MapPin className="w-5 h-5 text-secondary" /> Shipping Address
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent className="pt-6 space-y-4">
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div className="space-y-1.5">
//                       <Label className="text-[10px] uppercase tracking-widest font-bold">Address *</Label>
//                       <Input 
//                         placeholder="Street address" 
//                         className="rounded-none border-gray-200 h-10 text-sm"
//                         value={shippingAddress}
//                         onChange={(e) => setShippingAddress(e.target.value)}
//                         required
//                       />
//                     </div>
//                     <div className="space-y-1.5">
//                       <Label className="text-[10px] uppercase tracking-widest font-bold">City *</Label>
//                       <Input 
//                         placeholder="City" 
//                         className="rounded-none border-gray-200 h-10 text-sm"
//                         value={shippingCity}
//                         onChange={(e) => setShippingCity(e.target.value)}
//                         required
//                       />
//                     </div>
//                     <div className="space-y-1.5">
//                       <Label className="text-[10px] uppercase tracking-widest font-bold">State / Province *</Label>
//                       <Input 
//                         placeholder="State or Province" 
//                         className="rounded-none border-gray-200 h-10 text-sm"
//                         value={shippingState}
//                         onChange={(e) => setShippingState(e.target.value)}
//                         required
//                       />
//                     </div>
//                     <div className="space-y-1.5">
//                       <Label className="text-[10px] uppercase tracking-widest font-bold">ZIP / Postal Code *</Label>
//                       <Input 
//                         placeholder="ZIP or Postal Code" 
//                         className="rounded-none border-gray-200 h-10 text-sm"
//                         value={shippingZipCode}
//                         onChange={(e) => setShippingZipCode(e.target.value)}
//                         required
//                       />
//                     </div>
//                     <div className="space-y-1.5 md:col-span-2">
//                       <Label className="text-[10px] uppercase tracking-widest font-bold">Country *</Label>
//                       <Input 
//                         placeholder="Country" 
//                         className="rounded-none border-gray-200 h-10 text-sm"
//                         value={shippingCountry}
//                         onChange={(e) => setShippingCountry(e.target.value)}
//                         required
//                       />
//                     </div>
//                     <div className="space-y-1.5 md:col-span-2">
//                       <Label className="text-[10px] uppercase tracking-widest font-bold">Shipping Phone</Label>
//                       <Input 
//                         placeholder="Phone for shipping updates" 
//                         className="rounded-none border-gray-200 h-10 text-sm"
//                         value={shippingPhone}
//                         onChange={(e) => setShippingPhone(e.target.value)}
//                       />
//                       <p className="text-xs text-gray-500">If different from customer phone</p>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* Order Dates */}
//               <Card className="border-none shadow-sm rounded-none">
//                 <CardHeader className="border-b border-gray-50 py-4">
//                   <CardTitle className="text-xl font-serif font-bold flex items-center gap-2">
//                     <Calendar className="w-5 h-5 text-secondary" /> Order Dates
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent className="pt-6 space-y-6">
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div className="space-y-2">
//                       <Label className="text-[10px] uppercase tracking-widest font-bold">Order Date *</Label>
//                       <Input 
//                         type="date" 
//                         className="rounded-none border-gray-200 h-10 text-sm"
//                         value={selectedDate}
//                         onChange={(e) => setSelectedDate(e.target.value)}
//                         min={getCurrentDate()}
//                         required
//                       />
//                     </div>
//                     <div className="space-y-2">
//                       <Label className="text-[10px] uppercase tracking-widest font-bold">Expected Delivery Date *</Label>
//                       <Input 
//                         type="date" 
//                         className="rounded-none border-gray-200 h-10 text-sm"
//                         value={expectedDeliveryDate}
//                         onChange={(e) => setExpectedDeliveryDate(e.target.value)}
//                         min={selectedDate || getCurrentDate()}
//                         required
//                       />
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* Payment Options */}
//               <Card className="border-none shadow-sm rounded-none">
//                 <CardHeader className="border-b border-gray-50 py-4">
//                   <CardTitle className="text-xl font-serif font-bold flex items-center gap-2">
//                     <CreditCard className="w-5 h-5 text-secondary" /> Payment Options
//                   </CardTitle>
//                 </CardHeader>
//                 <CardContent className="pt-6 space-y-4">
//                   <div className="grid grid-cols-3 gap-3">
//                     {/* Mixed Payment - Only show if user is logged in */}
                    
                    
//                     {/* Digital Wallet - Only show if user is logged in */}
                    
                    
//                     {/* COD Option - Always show and enabled */}
//                     <button
//                       onClick={() => setPaymentMethod('cod')}
//                       className={cn(
//                         "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
//                         paymentMethod === 'cod' 
//                           ? "border-secondary bg-secondary/10" 
//                           : "border-gray-200 hover:border-gray-300 cursor-pointer"
//                       )}
//                     >
//                       <Banknote className={cn("w-6 h-6", paymentMethod === 'cod' ? "text-secondary" : "text-gray-500")} />
//                       <span className="text-xs font-bold">Cash on Delivery</span>
//                       <span className="text-xs text-gray-500">Pay on Delivery</span>
//                     </button>
//                   </div>

//                   {/* Mixed Payment Fields */}
                

//                   {/* Message for non-logged in users */}
//                   {!isLoggedIn && (
//                     <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
//                       <p className="text-xs text-yellow-700">
//                         <Info className="w-4 h-4 inline mr-1" />
//                         <span className="font-bold">Note:</span> "Create an account for Mixed Payment and Digital Wallet options. COD is always available."
//                       </p>
//                     </div>
//                   )}
//                 </CardContent>
//               </Card>
//             </div>

//             {/* Right Column: Order Summary */}
//             <div className="space-y-6">
//               <Card className="border-none shadow-lg rounded-none bg-primary text-white sticky top-24">
//                 {/* Order Summary Header */}
//                 <div className="h-40 w-full bg-gradient-to-b from-secondary/20 to-primary flex items-center justify-center overflow-hidden">
//                   <div className="text-center text-white p-4">
//                     <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
//                       <Building className="w-8 h-8 text-white" />
//                     </div>
//                     <p className="font-serif font-bold text-xl text-white">Order Summary</p>
//                     <p className="text-sm text-white/80">
//                       {selectedBranch}
//                     </p>
//                   </div>
//                 </div>

//                 <CardHeader className="border-b border-white/10 py-4">
//                   <CardTitle className="text-xl font-serif font-bold">Order Details</CardTitle>
//                 </CardHeader>
//                 <CardContent className="pt-6 space-y-6">
//                   <div className="space-y-4">
//                     {cartItems.length === 0 ? (
//                       <div className="text-center py-8 space-y-3">
//                         <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto">
//                           <Package className="w-6 h-6 text-white/40" />
//                         </div>
//                         <p className="text-xs text-white/60">Your cart is empty</p>
//                         <Button asChild variant="outline" className="border-white/20 text-white bg-white/10 rounded-lg text-[10px] font-bold tracking-widest">
//                           <Link href="/products">BROWSE PRODUCTS</Link>
//                         </Button>
//                       </div>
//                     ) : (
//                       cartItems.map((item) => (
//                         <div key={item.id} className="space-y-3 pb-4 border-b border-white/10 last:border-0">
//                           <div className="flex justify-between items-start group">
//                             <div className="space-y-0.5 flex-1">
//                               <p className="font-serif font-bold text-sm">{item.name}</p>
//                               <div className="flex items-center gap-2 text-[10px] text-white/60">
//                                 <span>SKU: {item.sku}</span>
//                                 <span className="text-white/40">•</span>
//                                 <span>{item.category}</span>
//                               </div>
//                               <div className="flex items-center gap-3 mt-2">
//                                 <div className="flex items-center gap-1">
//                                   <button 
//                                     onClick={() => updateQuantity(item.id, item.quantity - 1)}
//                                     className="w-6 h-6 rounded-full bg-white/10 text-white/80 hover:text-white flex items-center justify-center"
//                                   >
//                                     -
//                                   </button>
//                                   <span className="text-sm font-bold min-w-[30px] text-center">{item.quantity}</span>
//                                   <button 
//                                     onClick={() => updateQuantity(item.id, item.quantity + 1)}
//                                     className="w-6 h-6 rounded-full bg-white/10 text-white/80 hover:text-white flex items-center justify-center"
//                                   >
//                                     +
//                                   </button>
//                                 </div>
//                                 <span className="text-sm font-bold">${item.price.toFixed(2)} each</span>
//                               </div>
//                             </div>
//                             <div className="flex items-center gap-3">
//                               <span className="font-bold text-sm">${(item.price * item.quantity).toFixed(2)}</span>
//                               <button 
//                                 onClick={() => removeFromCart(item.id)}
//                                 className="text-white/40 hover:text-red-300 transition-colors"
//                               >
//                                 <Trash2 className="w-3.5 h-3.5" />
//                               </button>
//                             </div>
//                           </div>
//                         </div>
//                       ))
//                     )}
//                   </div>

//                   {cartItems.length > 0 && (
//                     <>
//                       {validationError && (
//                         <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
//                           <p className="text-xs text-red-200 font-bold uppercase tracking-widest">{validationError}</p>
//                         </div>
//                       )}
                      
//                       <div className="border-t border-white/10 pt-4 space-y-2">
//                         <div className="flex justify-between text-xs text-white/60">
//                           <span>Subtotal ({totalItems} items)</span>
//                           <span>${cartTotal.toFixed(2)}</span>
//                         </div>
                        
//                         <div className="flex justify-between text-xs text-white/60">
//                           <span>Shipping</span>
//                           <span>$0.00</span>
//                         </div>

//                         <div className="flex justify-between text-xs text-white/60">
//                           <span>Tax</span>
//                           <span>$0.00</span>
//                         </div>

//                         <div className="flex justify-between items-center pt-3 border-t border-white/10">
//                           <span className="text-sm font-serif font-bold">
//                             Final Amount
//                           </span>
//                           <span className="text-2xl font-serif font-bold text-secondary">
//                             ${finalTotal.toFixed(2)}
//                           </span>
//                         </div>

//                         {/* Show mixed payment breakdown */}
//                         {paymentMethod === 'mixed' && (
//                           <div className="p-2 bg-white/10 rounded-lg">
//                             <div className="flex justify-between text-xs mb-1">
//                               <span className="text-white/80">Wallet Payment:</span>
//                               <span className="font-bold">${walletAmount.toFixed(2)}</span>
//                             </div>
//                             <div className="flex justify-between text-xs mb-1">
//                               <span className="text-white/80">Cash Payment:</span>
//                               <span className="font-bold">${cashAmount.toFixed(2)}</span>
//                             </div>
//                             <div className="flex justify-between text-xs mt-2 pt-2 border-t border-white/20">
//                               <span className="font-bold">Total:</span>
//                               <span className="font-bold">${(walletAmount + cashAmount).toFixed(2)}</span>
//                             </div>
//                           </div>
//                         )}

//                         {/* Show wallet info if using digital wallet */}
//                         {paymentMethod === 'wallet' && customer && (
//                           <div className="p-2 bg-white/10 rounded-lg">
//                             <div className="flex justify-between text-xs">
//                               <span className="text-white/80">Wallet Balance:</span>
//                               <span className="font-bold">${customer.walletBalance?.toFixed(2) || '0.00'}</span>
//                             </div>
//                             <div className="flex justify-between text-xs mt-1">
//                               <span className="text-white/80">Remaining after payment:</span>
//                               <span className={cn(
//                                 "font-bold",
//                                 customer.walletBalance && customer.walletBalance >= finalTotal 
//                                   ? "text-green-300" 
//                                   : "text-red-300"
//                               )}>
//                                 ${(customer.walletBalance ? customer.walletBalance - finalTotal : 0).toFixed(2)}
//                               </span>
//                             </div>
//                           </div>
//                         )}

//                         {/* Payment Method Badge */}
//                         {paymentMethod && (
//                           <div className="flex justify-center">
//                             <Badge variant="outline" className="border-white/20 text-white/80 text-[10px]">
//                               {paymentMethod === 'cod' && 'Cash on Delivery'}
//                               {paymentMethod === 'wallet' && 'Digital Wallet'}
//                               {paymentMethod === 'mixed' && 'Mixed Payment'}
//                             </Badge>
//                           </div>
//                         )}
//                       </div>

//                       <Button 
//                         className="w-full bg-secondary hover:bg-secondary/90 text-primary font-bold py-6 rounded-lg tracking-[0.2em] text-xs shadow-lg shadow-secondary/20 transition-all duration-300 hover:scale-[1.02] active:scale-95"
//                         disabled={isSubmitting || !customerName || !customerEmail || !customerPhone || !selectedDate || !expectedDeliveryDate || cartItems.length === 0 || !paymentMethod || 
//                           !shippingAddress || !shippingCity || !shippingState || !shippingZipCode || !shippingCountry ||
//                           (paymentMethod === 'wallet' && customer && customer.walletBalance !== undefined && customer.walletBalance < finalTotal) ||
//                           (paymentMethod === 'mixed' && (walletAmount + cashAmount !== finalTotal || (customer && customer.walletBalance !== undefined && walletAmount > customer.walletBalance)))}
//                         onClick={handleConfirmOrder}
//                       >
//                         {isSubmitting ? 'PROCESSING...' : 'CONFIRM ORDER'}
//                       </Button>
//                       <p className="text-[9px] text-center text-white/40 uppercase tracking-widest">
//                         Secure checkout & instant confirmation
//                       </p>
//                     </>
//                   )}
//                 </CardContent>
//               </Card>

//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// neww
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

// Types - UPDATED with upcoming status
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
  status: "upcoming" | "pending" | "completed" | "cancelled"; // Updated
  totalAmount: number;
  transactionId: string;
  updatedAt: any;
}

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

  useEffect(() => {
    const savedCart = localStorage.getItem('productCart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(parsedCart);
      } catch (error) {
        console.error('Error parsing product cart:', error);
      }
    }
    
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
    setCartItems(prev => prev.filter(item => item.id !== productId));
    const updatedCart = cartItems.filter(item => item.id !== productId);
    localStorage.setItem('productCart', JSON.stringify(updatedCart));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(prev => prev.map(item => 
      item.id === productId ? { ...item, quantity } : item
    ));
    
    const updatedCart = cartItems.map(item => 
      item.id === productId ? { ...item, quantity } : item
    );
    localStorage.setItem('productCart', JSON.stringify(updatedCart));
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
  
  // New state for branches
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [selectedBranchData, setSelectedBranchData] = useState<BranchData | null>(null);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const [branchesError, setBranchesError] = useState('');

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

  // Fetch branches from Firebase on component mount
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
        
        setBranches(branchesList);
        
        // Set default branch if available
        if (branchesList.length > 0 && !selectedBranch) {
          const defaultBranch = branchesList[0];
          setSelectedBranch(defaultBranch.name);
          setSelectedBranchData(defaultBranch);
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
        setBranchesError('Failed to load branches. Please try again.');
      } finally {
        setIsLoadingBranches(false);
      }
    };

    fetchBranches();
  }, []);

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
      let customerData = null;

      if (authData) {
        try {
          const parsedAuth = JSON.parse(authData);
          customerData = parsedAuth?.customer;
          customerId = customerData?.id || customerData?.uid || 'guest';
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
          productBranchNames: [selectedBranch],
          productBranches: [selectedBranch.replace(/\s+/g, '_')],
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
        status: "upcoming", // CHANGED: "pending" to "upcoming"
        totalAmount: finalTotal,
        transactionId: generateTransactionId(),
        updatedAt: serverTimestamp()
      };

      const ordersRef = collection(db, 'orders');
      const docRef = await addDoc(ordersRef, orderData);
      
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
        <Header />
        <div className="pt-32 pb-16 px-4">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-secondary" />
            </div>
            <h1 className="text-4xl font-serif font-bold text-primary">Order Confirmed!</h1>
            <p className="text-lg text-muted-foreground font-light">
              Your order has been successfully placed and is now upcoming.
            </p>
            
            {/* Status Badge - Updated */}
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
                  <p className="text-xl font-serif font-bold text-primary">{confirmedOrderId}</p>
                </div>
                <div className="grid grid-cols-2 gap-6 text-left">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Pickup Branch</p>
                    <p className="font-bold text-sm">{selectedBranch}</p>
                  </div>
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
                
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-muted-foreground">
                    Your order status is now <span className="font-bold text-blue-600">Upcoming</span>. 
                   
                  </p>
                </div>
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
      <Header />
      
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
                  <CardTitle className="text-xl font-serif font-bold flex items-center gap-2">
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
                    <div className="space-y-1.5">
                      <Label htmlFor="branch" className="text-[10px] uppercase tracking-widest font-bold">Pickup Branch *</Label>
                      {isLoadingBranches ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm text-gray-500">Loading branches...</span>
                        </div>
                      ) : branchesError ? (
                        <div className="text-red-500 text-sm">{branchesError}</div>
                      ) : (
                        <Select 
                          value={selectedBranch} 
                          onValueChange={handleBranchSelect}
                          disabled={branches.length === 0}
                        >
                          <SelectTrigger className="rounded-none border-gray-200 h-10 text-sm">
                            <SelectValue placeholder={branches.length === 0 ? "No branches available" : "Select pickup branch"} />
                          </SelectTrigger>
                          <SelectContent>
                            {branches.map((branch) => (
                              <SelectItem key={branch.id} value={branch.name}>
                                {branch.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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

              {/* Branch Details - Dynamic based on selection */}
              <Card className="border-none shadow-sm rounded-none">
                <CardHeader className="border-b border-gray-50 py-4">
                  <CardTitle className="text-xl font-serif font-bold flex items-center gap-2">
                    <Building className="w-5 h-5 text-secondary" /> Selected Branch Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {isLoadingBranches ? (
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
                        {/* Branch Address */}
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

                        {/* Contact Info */}
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

                        {/* Timings */}
                        <div className="p-3 border border-gray-100 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <ClockIcon className="w-4 h-4 text-gray-500" />
                            <span className="text-xs font-bold uppercase tracking-widest">Working Hours</span>
                          </div>
                          <p className="text-sm">{selectedBranchData.openingTime} - {selectedBranchData.closingTime}</p>
                          <p className="text-xs text-gray-500 mt-1">Open Daily</p>
                        </div>

                        {/* Manager Info */}
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

                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Info className="w-4 h-4" />
                          <span>You will receive a notification when your order is ready for pickup.</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Dates */}
              <Card className="border-none shadow-sm rounded-none">
                <CardHeader className="border-b border-gray-50 py-4">
                  <CardTitle className="text-xl font-serif font-bold flex items-center gap-2">
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
                  <CardTitle className="text-xl font-serif font-bold flex items-center gap-2">
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
                    <p className="font-serif font-bold text-xl text-white">Order Summary</p>
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
                  <CardTitle className="text-xl font-serif font-bold">Order Details</CardTitle>
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
                              <p className="font-serif font-bold text-sm">{item.name}</p>
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
                                <span className="text-sm font-bold">${item.price.toFixed(2)} each</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-sm">${(item.price * item.quantity).toFixed(2)}</span>
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
                        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
                          <p className="text-xs text-red-200 font-bold uppercase tracking-widest">{validationError}</p>
                        </div>
                      )}
                      
                      <div className="border-t border-white/10 pt-4 space-y-2">
                        <div className="flex justify-between text-xs text-white/60">
                          <span>Subtotal ({totalItems} items)</span>
                          <span>${cartTotal.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between text-xs text-white/60">
                          <span>Pickup</span>
                          <span>FREE</span>
                        </div>

                        <div className="flex justify-between text-xs text-white/60">
                          <span>Tax</span>
                          <span>AED 0.00</span>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-white/10">
                          <span className="text-sm font-serif font-bold">
                            Final Amount
                          </span>
                          <span className="text-2xl font-serif font-bold text-secondary">
                            ${finalTotal.toFixed(2)}
                          </span>
                        </div>

                        {/* Branch Information in Order Summary */}
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
                              <div className="flex items-center gap-1">
                                <ClockIcon className="w-3 h-3 text-white/60" />
                                <span className="text-xs">{selectedBranchData.openingTime} - {selectedBranchData.closingTime}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {paymentMethod && (
                          <div className="flex justify-center">
                            <Badge variant="outline" className="border-white/20 text-white/80 text-[10px]">
                              {paymentMethod === 'cod' && 'Cash on Pickup'}
                            </Badge>
                          </div>
                        )}
                      </div>

                      <Button 
                        className="w-full bg-secondary hover:bg-secondary/90 text-primary font-bold py-6 rounded-lg tracking-[0.2em] text-xs shadow-lg shadow-secondary/20 transition-all duration-300 hover:scale-[1.02] active:scale-95"
                        disabled={isSubmitting || !customerName || !customerEmail || !customerPhone || !selectedDate || !expectedDeliveryDate || cartItems.length === 0 || !paymentMethod || !selectedBranch || !selectedBranchData}
                        onClick={handleConfirmOrder}
                      >
                        {isSubmitting ? 'PROCESSING...' : 'CONFIRM ORDER'}
                      </Button>
                      <p className="text-[9px] text-center text-white/40 uppercase tracking-widest">
                        Secure checkout & instant confirmation
                      </p>
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