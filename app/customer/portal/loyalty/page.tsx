// 'use client';

// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import Link from 'next/link';
// import { Header } from '@/components/shared/Header';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import {
//   Star,
//   Gift,
//   ChevronLeft,
//   Loader2,
//   Award,
//   TrendingUp,
//   Wallet,
//   ArrowRight,
//   Sparkles,
//   CheckCircle,
//   Info,
//   History,
//   Zap,
//   Target,
// } from 'lucide-react';
// import { useCustomerStore, type Customer, type CustomerWallet } from '@/stores/customer.store';

// export default function CustomerLoyalty() {
//   const router = useRouter();
//   const [customer, setCustomer] = useState<Customer | null>(null);
//   const [wallet, setWallet] = useState<CustomerWallet | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [redeemAmount, setRedeemAmount] = useState('');
//   const [redeemSuccess, setRedeemSuccess] = useState(false);
//   const [redeemError, setRedeemError] = useState('');

//   const {
//     getCustomerByEmail,
//     getWalletByCustomerId,
//     getActiveLoyaltySettings,
//     calculatePointsValue,
//     convertPointsToWallet,
//     getTransactionsByCustomer,
//   } = useCustomerStore();

//   useEffect(() => {
//     const checkAuth = () => {
//       const authData = localStorage.getItem('customerAuth');
//       if (!authData) {
//         router.push('/customer/login');
//         return;
//       }

//       try {
//         const { isAuthenticated, customer: customerData } = JSON.parse(authData);
//         if (!isAuthenticated) {
//           router.push('/customer/login');
//           return;
//         }

//         const fullCustomer = getCustomerByEmail(customerData.email);
//         if (fullCustomer) {
//           setCustomer(fullCustomer);
//           const customerWallet = getWalletByCustomerId(fullCustomer.id);
//           setWallet(customerWallet || null);
//         } else {
//           setCustomer({
//             id: 'temp-' + customerData.email,
//             email: customerData.email,
//             name: customerData.name,
//             phone: customerData.phone,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//           });
//         }
//       } catch (error) {
//         router.push('/customer/login');
//       }
//       setIsLoading(false);
//     };

//     checkAuth();
//   }, [router, getCustomerByEmail, getWalletByCustomerId]);

//   const handleRedeem = () => {
//     if (!customer || !wallet) return;
    
//     const points = parseInt(redeemAmount);
//     const loyaltySettings = getActiveLoyaltySettings();
    
//     if (!loyaltySettings) {
//       setRedeemError('Loyalty program is not available');
//       return;
//     }
    
//     if (isNaN(points) || points <= 0) {
//       setRedeemError('Please enter a valid number of points');
//       return;
//     }
    
//     if (points > wallet.loyaltyPoints) {
//       setRedeemError('Insufficient points');
//       return;
//     }
    
//     if (points < loyaltySettings.minimumPointsToRedeem) {
//       setRedeemError(`Minimum ${loyaltySettings.minimumPointsToRedeem} points required to redeem`);
//       return;
//     }
    
//     if (points > loyaltySettings.maximumPointsPerTransaction) {
//       setRedeemError(`Maximum ${loyaltySettings.maximumPointsPerTransaction} points can be redeemed at once`);
//       return;
//     }
    
//     const success = convertPointsToWallet(customer.id, points);
    
//     if (success) {
//       setRedeemSuccess(true);
//       setRedeemAmount('');
//       setRedeemError('');
//       // Refresh wallet data
//       const updatedWallet = getWalletByCustomerId(customer.id);
//       setWallet(updatedWallet || null);
      
//       setTimeout(() => setRedeemSuccess(false), 3000);
//     } else {
//       setRedeemError('Failed to redeem points. Please try again.');
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center">
//         <div className="text-center">
//           <Loader2 className="w-8 h-8 animate-spin text-secondary mx-auto mb-4" />
//           <p className="text-muted-foreground">Loading loyalty details...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!customer) return null;

//   const loyaltySettings = getActiveLoyaltySettings();
//   const walletPointsValue = wallet ? calculatePointsValue(wallet.loyaltyPoints) : 0;
//   const transactions = customer.id ? getTransactionsByCustomer(customer.id) : [];
//   const pointsTransactions = transactions.filter(t => t.type === 'points_earned' || t.type === 'points_redeemed');

//   // Calculate progress to next tier (example tiers)
//   const tiers = [
//     { name: 'Bronze', minPoints: 0, color: 'bg-orange-400' },
//     { name: 'Silver', minPoints: 1000, color: 'bg-gray-400' },
//     { name: 'Gold', minPoints: 5000, color: 'bg-yellow-400' },
//     { name: 'Platinum', minPoints: 10000, color: 'bg-blue-400' },
//     { name: 'Diamond', minPoints: 25000, color: 'bg-purple-400' },
//   ];

//   const totalEarned = wallet?.totalPointsEarned || 0;
//   const currentTier = [...tiers].reverse().find(t => totalEarned >= t.minPoints) || tiers[0];
//   const nextTier = tiers.find(t => t.minPoints > totalEarned);
//   const progressToNextTier = nextTier 
//     ? ((totalEarned - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
//     : 100;

//   return (
//     <div className="min-h-screen bg-[#fcfcfc]">
//       <Header />

//       <div className="pt-24 pb-16 px-4">
//         <div className="max-w-5xl mx-auto">
//           {/* Header */}
//           <div className="flex items-center gap-4 mb-8">
//             <Link href="/customer/portal">
//               <Button variant="ghost" className="p-2 hover:bg-gray-100 rounded-xl">
//                 <ChevronLeft className="w-5 h-5" />
//               </Button>
//             </Link>
//             <div>
//               <h1 className="text-3xl font-sans font-bold text-primary">Loyalty Points</h1>
//               <p className="text-muted-foreground">Earn and redeem points for rewards</p>
//             </div>
//           </div>

//           {/* Main Loyalty Card */}
//           <Card className="border-none shadow-2xl rounded-3xl bg-gradient-to-br from-secondary via-secondary to-secondary/80 text-primary mb-8 overflow-hidden relative">
//             <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
//             <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            
//             <CardContent className="p-8 relative z-10">
//               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
//                 <div>
//                   <div className="flex items-center gap-2 mb-4">
//                     <Award className="w-6 h-6" />
//                     <span className="text-sm font-bold uppercase tracking-widest">Loyalty Rewards</span>
//                   </div>
//                   <p className="text-6xl font-bold mb-2">{wallet?.loyaltyPoints?.toLocaleString() || '0'}</p>
//                   <p className="text-lg opacity-80">Available Points</p>
//                   <p className="text-sm mt-2 flex items-center gap-2">
//                     <Wallet className="w-4 h-4" />
//                     Worth <span className="font-bold">${walletPointsValue.toFixed(2)}</span>
//                   </p>
//                 </div>

//                 <div className="space-y-4">
//                   <div className="bg-white/10 rounded-2xl p-6">
//                     <div className="grid grid-cols-2 gap-6">
//                       <div>
//                         <p className="text-3xl font-bold">{wallet?.totalPointsEarned?.toLocaleString() || '0'}</p>
//                         <p className="text-sm opacity-80">Total Earned</p>
//                       </div>
//                       <div>
//                         <p className="text-3xl font-bold">{wallet?.totalPointsRedeemed?.toLocaleString() || '0'}</p>
//                         <p className="text-sm opacity-80">Total Redeemed</p>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Tier Progress */}
//               <div className="mt-8 pt-6 border-t border-white/20">
//                 <div className="flex items-center justify-between mb-3">
//                   <div className="flex items-center gap-2">
//                     <div className={`w-4 h-4 rounded-full ${currentTier.color}`} />
//                     <span className="font-bold">{currentTier.name} Member</span>
//                   </div>
//                   {nextTier && (
//                     <span className="text-sm opacity-80">
//                       {(nextTier.minPoints - totalEarned).toLocaleString()} points to {nextTier.name}
//                     </span>
//                   )}
//                 </div>
//                 <div className="h-3 bg-white/20 rounded-full overflow-hidden">
//                   <div 
//                     className="h-full bg-white rounded-full transition-all duration-500"
//                     style={{ width: `${Math.min(progressToNextTier, 100)}%` }}
//                   />
//                 </div>
//                 <div className="flex justify-between mt-2 text-xs opacity-60">
//                   {tiers.map((tier, idx) => (
//                     <span key={tier.name} className={totalEarned >= tier.minPoints ? 'font-bold opacity-100' : ''}>
//                       {tier.name}
//                     </span>
//                   ))}
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//             {/* Redeem Points */}
//             <Card className="border-none shadow-lg rounded-2xl">
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <Gift className="w-5 h-5 text-secondary" />
//                   Redeem Points
//                 </CardTitle>
//                 <CardDescription>Convert your points to wallet balance</CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-6">
//                 {loyaltySettings ? (
//                   <>
//                     <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
//                       <div className="flex items-start gap-3">
//                         <Info className="w-5 h-5 text-blue-600 mt-0.5" />
//                         <div className="text-sm text-blue-800">
//                           <p className="font-semibold mb-1">Redemption Rate</p>
//                           <p>{(1 / loyaltySettings.pointsValueInDollars).toFixed(0)} points = $1.00</p>
//                           <p className="mt-2">Min: {loyaltySettings.minimumPointsToRedeem} points</p>
//                           <p>Max per transaction: {loyaltySettings.maximumPointsPerTransaction} points</p>
//                         </div>
//                       </div>
//                     </div>

//                     <div className="space-y-4">
//                       <div className="space-y-2">
//                         <Label htmlFor="redeemAmount" className="text-xs font-bold uppercase tracking-widest">
//                           Points to Redeem
//                         </Label>
//                         <Input
//                           id="redeemAmount"
//                           type="number"
//                           placeholder={`Enter amount (min ${loyaltySettings.minimumPointsToRedeem})`}
//                           value={redeemAmount}
//                           onChange={(e) => {
//                             setRedeemAmount(e.target.value);
//                             setRedeemError('');
//                           }}
//                           className="h-12 rounded-xl border-gray-200"
//                           min={loyaltySettings.minimumPointsToRedeem}
//                           max={Math.min(wallet?.loyaltyPoints || 0, loyaltySettings.maximumPointsPerTransaction)}
//                         />
//                       </div>

//                       {redeemAmount && parseInt(redeemAmount) > 0 && (
//                         <div className="bg-gray-50 rounded-xl p-4">
//                           <p className="text-sm text-muted-foreground">You will receive:</p>
//                           <p className="text-2xl font-bold text-primary">
//                             ${calculatePointsValue(parseInt(redeemAmount) || 0).toFixed(2)}
//                           </p>
//                           <p className="text-xs text-muted-foreground">in wallet balance</p>
//                         </div>
//                       )}

//                       {redeemError && (
//                         <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
//                           {redeemError}
//                         </div>
//                       )}

//                       {redeemSuccess && (
//                         <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
//                           <CheckCircle className="w-4 h-4" />
//                           Points redeemed successfully!
//                         </div>
//                       )}

//                       <Button
//                         onClick={handleRedeem}
//                         disabled={!redeemAmount || parseInt(redeemAmount) <= 0}
//                         className="w-full h-12 bg-secondary hover:bg-secondary/90 text-primary rounded-xl font-bold"
//                       >
//                         Redeem Points
//                         <ArrowRight className="w-4 h-4 ml-2" />
//                       </Button>
//                     </div>

//                     {/* Quick Redeem Options */}
//                     <div className="pt-4 border-t border-gray-100">
//                       <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
//                         Quick Redeem
//                       </p>
//                       <div className="grid grid-cols-3 gap-2">
//                         {[100, 500, 1000].filter(p => p <= (wallet?.loyaltyPoints || 0)).map((points) => (
//                           <Button
//                             key={points}
//                             variant="outline"
//                             onClick={() => setRedeemAmount(points.toString())}
//                             className="rounded-xl h-auto py-3"
//                           >
//                             <div className="text-center">
//                               <p className="font-bold">{points}</p>
//                               <p className="text-xs text-muted-foreground">
//                                 ${calculatePointsValue(points).toFixed(2)}
//                               </p>
//                             </div>
//                           </Button>
//                         ))}
//                       </div>
//                     </div>
//                   </>
//                 ) : (
//                   <div className="text-center py-8">
//                     <Sparkles className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
//                     <p className="text-muted-foreground">Loyalty program is currently unavailable</p>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>

//             {/* How to Earn */}
//             <Card className="border-none shadow-lg rounded-2xl">
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <Zap className="w-5 h-5 text-secondary" />
//                   How to Earn Points
//                 </CardTitle>
//                 <CardDescription>Ways to collect loyalty points</CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 {loyaltySettings && (
//                   <>
//                     <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
//                       <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
//                         <Target className="w-6 h-6 text-green-600" />
//                       </div>
//                       <div>
//                         <p className="font-semibold">Book Services</p>
//                         <p className="text-sm text-muted-foreground">
//                           Earn {loyaltySettings.pointsPerDollarSpent} points per $1 spent
//                         </p>
//                       </div>
//                     </div>

//                     <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
//                       <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
//                         <Gift className="w-6 h-6 text-blue-600" />
//                       </div>
//                       <div>
//                         <p className="font-semibold">Buy Products</p>
//                         <p className="text-sm text-muted-foreground">
//                           Earn {loyaltySettings.pointsPerDollarSpent} points per $1 spent
//                         </p>
//                       </div>
//                     </div>

//                     {loyaltySettings.bonusPointsFirstBooking > 0 && (
//                       <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
//                         <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
//                           <Sparkles className="w-6 h-6 text-purple-600" />
//                         </div>
//                         <div>
//                           <p className="font-semibold">First Registration</p>
//                           <p className="text-sm text-muted-foreground">
//                             Get {loyaltySettings.bonusPointsFirstBooking} bonus points
//                           </p>
//                         </div>
//                       </div>
//                     )}

//                     {loyaltySettings.bonusPointsOnBirthday > 0 && (
//                       <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
//                         <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
//                           <Award className="w-6 h-6 text-pink-600" />
//                         </div>
//                         <div>
//                           <p className="font-semibold">Birthday Bonus</p>
//                           <p className="text-sm text-muted-foreground">
//                             Get {loyaltySettings.bonusPointsOnBirthday} points on your birthday
//                           </p>
//                         </div>
//                       </div>
//                     )}
//                   </>
//                 )}
//               </CardContent>
//             </Card>
//           </div>

//           {/* Points History */}
//           <Card className="border-none shadow-lg rounded-2xl mt-8">
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <History className="w-5 h-5 text-secondary" />
//                 Points History
//               </CardTitle>
//               <CardDescription>Your recent points activity</CardDescription>
//             </CardHeader>
//             <CardContent>
//               {pointsTransactions.length === 0 ? (
//                 <div className="text-center py-8">
//                   <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
//                   <p className="text-muted-foreground">No points activity yet</p>
//                   <Link href="/services">
//                     <Button className="mt-4 bg-secondary hover:bg-secondary/90 text-primary rounded-xl">
//                       Start Earning Points
//                     </Button>
//                   </Link>
//                 </div>
//               ) : (
//                 <div className="space-y-3">
//                   {pointsTransactions.slice(0, 10).map((txn) => (
//                     <div key={txn.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
//                       <div className="flex items-center gap-4">
//                         <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
//                           txn.type === 'points_earned' ? 'bg-green-100' : 'bg-red-100'
//                         }`}>
//                           {txn.type === 'points_earned' ? (
//                             <TrendingUp className="w-5 h-5 text-green-600" />
//                           ) : (
//                             <Gift className="w-5 h-5 text-red-600" />
//                           )}
//                         </div>
//                         <div>
//                           <p className="font-semibold text-sm">{txn.description}</p>
//                           <p className="text-xs text-muted-foreground">
//                             {new Date(txn.createdAt).toLocaleDateString()} at {new Date(txn.createdAt).toLocaleTimeString()}
//                           </p>
//                         </div>
//                       </div>
//                       <span className={`text-lg font-bold ${
//                         (txn.pointsAmount || 0) > 0 ? 'text-green-600' : 'text-red-600'
//                       }`}>
//                         {(txn.pointsAmount || 0) > 0 ? '+' : ''}{txn.pointsAmount} pts
//                       </span>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   );
// }

// neww
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/shared/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Star,
  Gift,
  ChevronLeft,
  Loader2,
  Award,
  TrendingUp,
  Wallet,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Info,
  History,
  Zap,
  Target,
  Calendar,
  Package,
  ArrowUpRight,
  Clock,
  Check,
  X,
  Plus,
  ShoppingCart,
  Users,
  Home,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

// Firebase imports
import { db, auth } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

// Types
interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  createdAt?: any;
  birthday?: string;
}

interface CustomerWallet {
  id: string;
  customerId: string;
  balance: number;
  loyaltyPoints: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  lastBirthdayPoints?: number;
  updatedAt: any;
}

interface Transaction {
  id: string;
  customerId: string;
  type:
    | "wallet_topup"
    | "points_earned"
    | "points_redeemed"
    | "purchase"
    | "refund"
    | "booking"
    | "order"
    | "registration"
    | "birthday";
  amount: number;
  pointsAmount?: number;
  description: string;
  createdAt: any;
  status: "success" | "failed" | "pending";
  referenceId?: string;
}

interface LoyaltySettings {
  id: string;
  name: string;
  pointsPerDollarSpent: number;
  pointsValueInDollars: number;
  minimumPointsToRedeem: number;
  maximumPointsPerTransaction: number;
  bonusPointsFirstBooking: number;
  bonusPointsOnBirthday: number;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

export default function CustomerLoyalty() {
  const router = useRouter();
  
  // States
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [wallet, setWallet] = useState<CustomerWallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings | null>(null);
  const [redeemAmount, setRedeemAmount] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const [redeemError, setRedeemError] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Refs for cleanup
  const unsubscribeRefs = useRef<(() => void)[]>([]);

  // Helper function for deep comparison
  const arraysEqual = useCallback((a: any[], b: any[]) => {
    if (a.length !== b.length) return false;
    return JSON.stringify(a) === JSON.stringify(b);
  }, []);

  // 🔥 Calculate points value
  const calculatePointsValue = (points: number) => {
    if (!loyaltySettings || points <= 0) return 0;
    return points / loyaltySettings.pointsValueInDollars;
  };

  // 🔥 Get wallet points value
  const walletPointsValue = wallet ? calculatePointsValue(wallet.loyaltyPoints) : 0;

  // 🔥 Filter points transactions
  const pointsTransactions = transactions.filter(t => 
    t.type === 'points_earned' || t.type === 'points_redeemed'
  );

  // 🔥 Fetch loyalty settings
  const fetchLoyaltySettings = async () => {
    try {
      const settingsQuery = query(
        collection(db, "loyalty_settings"),
        where("isActive", "==", true)
      );
      const settingsSnapshot = await getDocs(settingsQuery);
      
      if (!settingsSnapshot.empty) {
        const settingsDoc = settingsSnapshot.docs[0];
        const settingsData = settingsDoc.data();
        
        const settings: LoyaltySettings = {
          id: settingsDoc.id,
          name: settingsData.name || "Loyalty Program",
          pointsPerDollarSpent: settingsData.pointsPerDollarSpent || 10,
          pointsValueInDollars: settingsData.pointsValueInDollars || 100,
          minimumPointsToRedeem: settingsData.minimumPointsToRedeem || 100,
          maximumPointsPerTransaction: settingsData.maximumPointsPerTransaction || 10000,
          bonusPointsFirstBooking: settingsData.bonusPointsFirstBooking || 100,
          bonusPointsOnBirthday: settingsData.bonusPointsOnBirthday || 200,
          isActive: settingsData.isActive || true,
          createdAt: settingsData.createdAt || serverTimestamp(),
          updatedAt: settingsData.updatedAt || serverTimestamp(),
        };
        
        setLoyaltySettings(settings);
        console.log("🎯 Loyalty settings loaded:", settings);
      } else {
        console.log("⚠️ No active loyalty settings found");
        setLoyaltySettings(null);
      }
    } catch (error) {
      console.error("❌ Error fetching loyalty settings:", error);
      setLoyaltySettings(null);
    }
  };

  // 🔥 Fetch all initial data
  useEffect(() => {
    const initializeData = async () => {
      // Check authentication
      const authData = localStorage.getItem("customerAuth");
      if (!authData) {
        router.push("/customer/login");
        return;
      }

      try {
        const { customer: customerData } = JSON.parse(authData);
        
        // 🔥 Fetch user data from Firebase
        let avatarUrl = "";
        try {
          // First check in "users" collection
          const userDoc = await getDoc(doc(db, "users", customerData.uid));
          if (userDoc.exists() && userDoc.data().avatar) {
            avatarUrl = userDoc.data().avatar;
          } else {
            // Check in "customers" collection
            const customerDoc = await getDoc(doc(db, "customers", customerData.uid));
            if (customerDoc.exists() && customerDoc.data().avatar) {
              avatarUrl = customerDoc.data().avatar;
            }
          }
        } catch (error) {
          console.log("Could not fetch avatar:", error);
        }

        const customerObj: Customer = {
          id: customerData.uid || customerData.id || "cust_" + Date.now(),
          name: customerData.name || "Customer",
          email: customerData.email || "",
          phone: customerData.phone || "",
          avatar: avatarUrl,
          birthday: customerData.birthday,
        };

        console.log("👤 Setting customer:", customerObj);
        setCustomer(customerObj);

        // Fetch all data
        await fetchCustomerData(customerObj.id);
        await fetchLoyaltySettings();

        // Setup real-time listeners
        setupRealtimeListeners(customerObj.id);
        
        setDataLoaded(true);
      } catch (error) {
        console.error("❌ Initialization error:", error);
      }
    };

    initializeData();

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up loyalty listeners");
      unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
      unsubscribeRefs.current = [];
    };
  }, [router]);

  // 🔥 Fetch customer data from Firebase
  const fetchCustomerData = async (customerId: string) => {
    if (!customerId) {
      console.error("❌ No customer ID provided");
      return;
    }

    try {
      // Fetch wallet
      try {
        const walletDoc = await getDoc(doc(db, "wallets", customerId));
        if (walletDoc.exists()) {
          console.log("💰 Wallet found:", walletDoc.data());
          const walletData = walletDoc.data();
          const walletObj: CustomerWallet = {
            id: walletDoc.id,
            customerId: walletData.customerId || customerId,
            balance:
              typeof walletData.balance === "number" ? walletData.balance : 0,
            loyaltyPoints:
              typeof walletData.loyaltyPoints === "number"
                ? walletData.loyaltyPoints
                : 0,
            totalPointsEarned:
              typeof walletData.totalPointsEarned === "number"
                ? walletData.totalPointsEarned
                : 0,
            totalPointsRedeemed:
              typeof walletData.totalPointsRedeemed === "number"
                ? walletData.totalPointsRedeemed
                : 0,
            lastBirthdayPoints: walletData.lastBirthdayPoints,
            updatedAt: walletData.updatedAt || new Date(),
          };
          setWallet(walletObj);
        } else {
          console.log("💰 No wallet found, creating default");
          const defaultWallet: CustomerWallet = {
            id: customerId,
            customerId,
            balance: 0,
            loyaltyPoints: 0,
            totalPointsEarned: 0,
            totalPointsRedeemed: 0,
            updatedAt: new Date(),
          };
          setWallet(defaultWallet);

          // Create wallet in Firebase
          await setDoc(doc(db, "wallets", customerId), defaultWallet);
        }
      } catch (walletError) {
        console.error("❌ Error fetching wallet:", walletError);
      }

      // Fetch transactions
      try {
        const transactionsQuery = query(
          collection(db, "transactions"),
          where("customerId", "==", customerId)
        );
        const transactionsSnapshot = await getDocs(transactionsQuery);
        const transactionsData: Transaction[] = [];

        transactionsSnapshot.forEach((doc) => {
          const data = doc.data();
          transactionsData.push({
            id: doc.id,
            customerId: data.customerId || customerId,
            type: (data.type || "purchase") as Transaction["type"],
            amount: typeof data.amount === "number" ? data.amount : 0,
            pointsAmount:
              typeof data.pointsAmount === "number" ? data.pointsAmount : 0,
            description: data.description || "",
            createdAt: data.createdAt || serverTimestamp(),
            status: (data.status || "success") as
              | "success"
              | "failed"
              | "pending",
            referenceId: data.referenceId || "",
          });
        });

        // Client-side sorting
        transactionsData.sort((a, b) => {
          try {
            const dateA = a.createdAt?.toDate
              ? a.createdAt.toDate()
              : new Date(0);
            const dateB = b.createdAt?.toDate
              ? b.createdAt.toDate()
              : new Date(0);
            return dateB.getTime() - dateA.getTime();
          } catch {
            return 0;
          }
        });

        setTransactions(transactionsData);
      } catch (error) {
        console.error("❌ Error fetching transactions:", error);
        setTransactions([]);
      }

    } catch (error) {
      console.error("❌ Error fetching customer data:", error);
    }
  };

  // 🔥 Set up real-time listeners
  const setupRealtimeListeners = (customerId: string) => {
    if (!customerId) return;

    console.log("🎯 Setting up real-time listeners for loyalty:", customerId);

    // Clean up existing listeners
    unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
    unsubscribeRefs.current = [];

    try {
      // Real-time wallet listener
      const unsubscribeWallet = onSnapshot(
        doc(db, "wallets", customerId),
        (doc) => {
          if (doc.exists()) {
            console.log("💰 Wallet updated - Real-time:", doc.data());

            const walletData = doc.data();

            const updatedWallet: CustomerWallet = {
              id: doc.id,
              customerId: walletData.customerId || customerId,
              balance:
                typeof walletData.balance === "number" ? walletData.balance : 0,
              loyaltyPoints:
                typeof walletData.loyaltyPoints === "number"
                  ? walletData.loyaltyPoints
                  : 0,
              totalPointsEarned:
                typeof walletData.totalPointsEarned === "number"
                  ? walletData.totalPointsEarned
                  : 0,
              totalPointsRedeemed:
                typeof walletData.totalPointsRedeemed === "number"
                  ? walletData.totalPointsRedeemed
                  : 0,
              lastBirthdayPoints: walletData.lastBirthdayPoints,
              updatedAt: walletData.updatedAt || serverTimestamp(),
            };

            console.log("💰 Updated wallet object:", updatedWallet);
            setWallet(updatedWallet);
          } else {
            console.log("💰 No wallet found, creating default");
            const defaultWallet: CustomerWallet = {
              id: customerId,
              customerId: customerId,
              balance: 0,
              loyaltyPoints: 0,
              totalPointsEarned: 0,
              totalPointsRedeemed: 0,
              updatedAt: new Date(),
            };
            setWallet(defaultWallet);
          }
        },
        (error) => {
          console.error("❌ Wallet listener error:", error);
        }
      );

      unsubscribeRefs.current.push(unsubscribeWallet);

      // Real-time transactions listener
      const transactionsQuery = query(
        collection(db, "transactions"),
        where("customerId", "==", customerId)
      );

      const unsubscribeTransactions = onSnapshot(
        transactionsQuery,
        (snapshot) => {
          const transactionsData: Transaction[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            transactionsData.push({
              id: doc.id,
              customerId: data.customerId || customerId,
              type: (data.type || "purchase") as Transaction["type"],
              amount: typeof data.amount === "number" ? data.amount : 0,
              pointsAmount:
                typeof data.pointsAmount === "number" ? data.pointsAmount : 0,
              description: data.description || "",
              createdAt: data.createdAt || serverTimestamp(),
              status: (data.status || "success") as
                | "success"
                | "failed"
                | "pending",
              referenceId: data.referenceId || "",
            });
          });

          // Client-side sorting
          transactionsData.sort((a, b) => {
            try {
              const dateA = a.createdAt?.toDate
                ? a.createdAt.toDate()
                : new Date(0);
              const dateB = b.createdAt?.toDate
                ? b.createdAt.toDate()
                : new Date(0);
              return dateB.getTime() - dateA.getTime();
            } catch {
              return 0;
            }
          });

          setTransactions((prev) => {
            if (arraysEqual(prev, transactionsData)) {
              return prev;
            }
            return transactionsData;
          });
        },
        (error) => {
          console.error("❌ Transactions listener error:", error);
        }
      );

      unsubscribeRefs.current.push(unsubscribeTransactions);

      // Real-time loyalty settings listener
      const unsubscribeSettings = onSnapshot(
        query(collection(db, "loyalty_settings"), where("isActive", "==", true)),
        (snapshot) => {
          if (!snapshot.empty) {
            const settingsDoc = snapshot.docs[0];
            const settingsData = settingsDoc.data();
            
            const settings: LoyaltySettings = {
              id: settingsDoc.id,
              name: settingsData.name || "Loyalty Program",
              pointsPerDollarSpent: settingsData.pointsPerDollarSpent || 10,
              pointsValueInDollars: settingsData.pointsValueInDollars || 100,
              minimumPointsToRedeem: settingsData.minimumPointsToRedeem || 100,
              maximumPointsPerTransaction: settingsData.maximumPointsPerTransaction || 10000,
              bonusPointsFirstBooking: settingsData.bonusPointsFirstBooking || 100,
              bonusPointsOnBirthday: settingsData.bonusPointsOnBirthday || 200,
              isActive: settingsData.isActive || true,
              createdAt: settingsData.createdAt || serverTimestamp(),
              updatedAt: settingsData.updatedAt || serverTimestamp(),
            };
            
            console.log("🔄 Loyalty settings updated in real-time:", settings);
            setLoyaltySettings(settings);
          } else {
            console.log("⚠️ No active loyalty settings found");
            setLoyaltySettings(null);
          }
        },
        (error) => {
          console.error("❌ Loyalty settings listener error:", error);
        }
      );

      unsubscribeRefs.current.push(unsubscribeSettings);

      // Real-time user data listener
      const unsubscribeUser = onSnapshot(
        doc(db, "users", customerId),
        (doc) => {
          if (doc.exists()) {
            const userData = doc.data();
            if (userData.avatar) {
              console.log("🔄 Avatar updated in real-time:", userData.avatar);
              setCustomer(prev => prev ? {...prev, avatar: userData.avatar} : prev);
            }
          }
        },
        (error) => {
          console.error("❌ User data listener error:", error);
        }
      );

      unsubscribeRefs.current.push(unsubscribeUser);
    } catch (error) {
      console.warn("⚠️ Could not set up real-time listeners:", error);
    }
  };

  // 🔥 Handle redeem points
  const handleRedeem = async () => {
    if (!customer || !wallet || !loyaltySettings) return;
    
    setIsRedeeming(true);
    setRedeemError('');
    
    const points = parseInt(redeemAmount);
    
    if (isNaN(points) || points <= 0) {
      setRedeemError('Please enter a valid number of points');
      setIsRedeeming(false);
      return;
    }
    
    if (points > wallet.loyaltyPoints) {
      setRedeemError('Insufficient points');
      setIsRedeeming(false);
      return;
    }
    
    if (points < loyaltySettings.minimumPointsToRedeem) {
      setRedeemError(`Minimum ${loyaltySettings.minimumPointsToRedeem} points required to redeem`);
      setIsRedeeming(false);
      return;
    }
    
    if (points > loyaltySettings.maximumPointsPerTransaction) {
      setRedeemError(`Maximum ${loyaltySettings.maximumPointsPerTransaction} points can be redeemed at once`);
      setIsRedeeming(false);
      return;
    }
    
    try {
      // Calculate amount in dollars
      const amountInDollars = calculatePointsValue(points);
      
      // Create transaction record
      await addDoc(collection(db, "transactions"), {
        customerId: customer.id,
        type: "points_redeemed",
        amount: amountInDollars,
        pointsAmount: -points,
        description: `Points redeemed for AED ${amountInDollars.toFixed(2)}`,
        status: "success",
        referenceId: `REDEEM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: serverTimestamp(),
      });

      // Update wallet
      const newLoyaltyPoints = wallet.loyaltyPoints - points;
      const newTotalRedeemed = (wallet.totalPointsRedeemed || 0) + points;
      const newBalance = (wallet.balance || 0) + amountInDollars;

      await updateDoc(doc(db, "wallets", customer.id), {
        loyaltyPoints: newLoyaltyPoints,
        totalPointsRedeemed: newTotalRedeemed,
        balance: newBalance,
        updatedAt: serverTimestamp(),
      });

      // Success
      setRedeemSuccess(true);
      setRedeemAmount('');
      
      // Show success message
      setTimeout(() => setRedeemSuccess(false), 3000);
      
      console.log(`✅ Points redeemed: ${points} points for AED ${amountInDollars.toFixed(2)}`);
    } catch (error) {
      console.error("❌ Error redeeming points:", error);
      setRedeemError('Failed to redeem points. Please try again.');
    } finally {
      setIsRedeeming(false);
    }
  };

  // Helper functions
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, "MMM dd, yyyy");
    } catch {
      return "Invalid date";
    }
  };

  const formatDateTime = (timestamp: any) => {
    if (!timestamp) return "N/A";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, "MMM dd, yyyy hh:mm a");
    } catch {
      return "Invalid date";
    }
  };

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return "N/A";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "Some time ago";
    }
  };

  // 🔥 Early return if not authenticated
  if (!customer) {
    return null; // Will redirect automatically
  }

  // Calculate progress to next tier
  const tiers = [
    { name: 'Bronze', minPoints: 0, color: 'bg-orange-400' },
    { name: 'Silver', minPoints: 1000, color: 'bg-gray-400' },
    { name: 'Gold', minPoints: 5000, color: 'bg-yellow-400' },
    { name: 'Platinum', minPoints: 10000, color: 'bg-blue-400' },
    { name: 'Diamond', minPoints: 25000, color: 'bg-purple-400' },
  ];

  const totalEarned = wallet?.totalPointsEarned || 0;
  const currentTier = [...tiers].reverse().find(t => totalEarned >= t.minPoints) || tiers[0];
  const nextTier = tiers.find(t => t.minPoints > totalEarned);
  const progressToNextTier = nextTier 
    ? ((totalEarned - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
    : 100;

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
              <h1 className="text-3xl font-sans font-bold text-primary">Loyalty Points</h1>
              <p className="text-muted-foreground">Earn and redeem points for rewards</p>
            </div>
          </div>

          {/* Main Loyalty Card */}
          <Card className="border-none shadow-2xl rounded-3xl bg-gradient-to-br from-secondary via-secondary to-secondary/80 text-primary mb-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <CardContent className="p-8 relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="w-6 h-6" />
                    <span className="text-sm font-bold uppercase tracking-widest">Loyalty Rewards</span>
                  </div>
                  <p className="text-6xl font-bold mb-2">{wallet?.loyaltyPoints?.toLocaleString() || '0'}</p>
                  <p className="text-lg opacity-80">Available Points</p>
                  <p className="text-sm mt-2 flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    Worth <span className="font-bold">{walletPointsValue.toFixed(2)}</span>
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/10 rounded-2xl p-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-3xl font-bold">{wallet?.totalPointsEarned?.toLocaleString() || '0'}</p>
                        <p className="text-sm opacity-80">Total Points Earned</p>
                      </div>
                     
                    </div>
                  </div>
                </div>
              </div>

              {/* Tier Progress */}
              <div className="mt-8 pt-6 border-t border-white/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${currentTier.color}`} />
                    <span className="font-bold">{currentTier.name} Member</span>
                  </div>
                  {nextTier && (
                    <span className="text-sm opacity-80">
                      {(nextTier.minPoints - totalEarned).toLocaleString()} points to {nextTier.name}
                    </span>
                  )}
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(progressToNextTier, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs opacity-60">
                  {tiers.map((tier, idx) => (
                    <span key={tier.name} className={totalEarned >= tier.minPoints ? 'font-bold opacity-100' : ''}>
                      {tier.name}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="w-full gap-8">
            {/* Redeem Points */}
           
            {/* How to Earn */}
            <Card className="border-none shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-secondary" />
                  How to Earn Points
                </CardTitle>
                <CardDescription>Ways to collect loyalty points</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
               <div className="flex justify-center gap-6 mt-8">
  <Link href="/services">
    <button className="relative px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white font-bold text-lg overflow-hidden group transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/30">
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      
      {/* Main content */}
      <div className="relative flex items-center gap-3">
        <Calendar className="w-6 h-6" />
        <span>Book Service Now</span>
        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
      </div>
      
      {/* Bottom glow */}
      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-primary/50 blur-md group-hover:bg-primary/70 transition-colors" />
    </button>
  </Link>

  <Link href="/products">
    <button className="relative px-8 py-4 rounded-xl bg-gradient-to-r from-secondary to-secondary/80 text-primary font-bold text-lg overflow-hidden group transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-secondary/30">
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      
      {/* Main content */}
      <div className="relative flex items-center gap-3">
        <ShoppingCart className="w-6 h-6" />
        <span>Shop Products</span>
        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
      </div>
      
      {/* Bottom glow */}
      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-secondary/50 blur-md group-hover:bg-secondary/70 transition-colors" />
    </button>
  </Link>
</div>
              </CardContent>
            </Card>
          </div>

          {/* Points History */}
          <Card className="border-none shadow-lg rounded-2xl mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-secondary" />
                Points History
              </CardTitle>
              <CardDescription>Your recent points activity</CardDescription>
            </CardHeader>
            <CardContent>
              {pointsTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">No points activity yet</p>
                  <div className="flex gap-3 justify-center mt-4">
                    <Link href="/services">
                      <Button className="bg-secondary hover:bg-secondary/90 text-primary rounded-xl">
                        <Calendar className="w-4 h-4 mr-2" />
                        Book Services
                      </Button>
                    </Link>
                    <Link href="/products">
                      <Button variant="outline" className="rounded-xl">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Shop Products
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {pointsTransactions.slice(0, 10).map((txn) => (
                    <div 
                      key={txn.id} 
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          txn.type === 'points_earned' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {txn.type === 'points_earned' ? (
                            <ArrowUpRight className="w-5 h-5 text-green-600" />
                          ) : (
                            <ArrowUpRight className="w-5 h-5 text-red-600 rotate-180" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{txn.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <p className="text-xs text-muted-foreground">
                              {getTimeAgo(txn.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <span className={`text-lg font-bold ${
                        (txn.pointsAmount || 0) > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(txn.pointsAmount || 0) > 0 ? '+' : ''}{txn.pointsAmount} pts
                      </span>
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