
'use client';

import { useState, useEffect, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Trash2, Calendar, User, Phone, Mail, CheckCircle, Clock, Scissors, ChevronLeft, Wallet, CreditCard, Banknote, Star, Gift, Info, AlertCircle, X, Layers, DollarSign, Award } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  collection, 
  addDoc, 
  serverTimestamp,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Types
interface BookingData {
  bookingDate: string;
  bookingNumber: string;
  bookingTime: string;
  branch: string;
  branchId: string;
  branchNames: string[];
  branches: string[];
  cardLast4Digits: string;
  createdAt: any;
  createdBy: string;
  customerEmail: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  date: string;
  notes: string;
  paymentAmounts: {
    wallet: number;
    cash: number;
  };
  paymentMethod: string;
  paymentStatus: string;
  pointsAwarded: boolean;
  products: any[];
  productsTotal: number;
  serviceCategory: string;
  serviceCategoryId: string;
  serviceCharges: number;
  serviceDuration: number;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceTip: number;
  services: string[];
  source: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  status: string;
  confirmedAt?: any;
  subtotal: number;
  tax: number;
  taxAmount: number;
  teamMembers: Array<{
    name: string;
    role: string;
    staffId: string;
    time: string;
    timeSlot: string;
  }>;
  time: string;
  timeSlot: string;
  tip: number;
  totalAmount: number;
  totalDuration: number;
  totalTips: number;
  trnNumber: string;
  updatedAt: any;
  userBranchId: string;
  userBranchName: string;
  userRole: string;
}

interface CartItem {
  id: string;
  name: string;
  category: string;
  duration: string;
  price: number;
  description: string;
  image: string;
  rating: number;
  reviews: number;
  staffMember?: string;
  serviceId?: string;
  serviceName?: string;
  serviceCategory?: string;
  serviceCategoryId?: string;
  branchNames?: string[];
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  address?: string;
  avatar?: string;
  bloodGroup?: string;
  branch: string; // Branch name where staff works
  dateOfBirth?: string;
  description?: string;
  documentId?: string;
  emergencyContact?: string;
  experience?: string;
  gender?: string;
  hireDate?: string;
  maritalStatus?: string;
  nationality?: string;
  rating?: number;
  reviews?: number;
  salary?: number;
  specialization?: string[];
  status?: string;
  visaExpiry?: string;
  weeklyTimings?: {
    monday?: { start: string; end: string; closed?: boolean };
    tuesday?: { start: string; end: string; closed?: boolean };
    wednesday?: { start: string; end: string; closed?: boolean };
    thursday?: { start: string; end: string; closed?: boolean };
    friday?: { start: string; end: string; closed?: boolean };
    saturday?: { start: string; end: string; closed?: boolean };
    sunday?: { start: string; end: string; closed?: boolean };
  };
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
  address?: string;
  city?: string;
  country?: string;
  email?: string;
  phone?: string;
  managerName?: string;
  managerEmail?: string;
  managerPhone?: string;
  openingTime?: string;
  closingTime?: string;
  status?: string;
  weeklyTimings?: any;
}

const useBookingStore = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  useEffect(() => {
    const savedCart = localStorage.getItem('bookingCart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        const cartWithUniqueIds = parsedCart.map((item: any, index: number) => ({
          ...item,
          cartItemId: `cart-${item.id}-${Date.now()}-${index}-${Math.random()}`
        }));
        setCartItems(cartWithUniqueIds);
      } catch (error) {
        console.error('Error parsing cart:', error);
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

  const updateServiceStaff = (serviceId: string, staff: string) => {
    setCartItems(prev => prev.map(item => 
      item.id === serviceId ? { ...item, staffMember: staff } : item
    ));
    const updatedCart = cartItems.map(item => 
      item.id === serviceId ? { ...item, staffMember: staff } : item
    );
    localStorage.setItem('bookingCart', JSON.stringify(updatedCart));
  };

  const removeFromCart = (serviceId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== serviceId));
    const updatedCart = cartItems.filter(item => item.id !== serviceId);
    localStorage.setItem('bookingCart', JSON.stringify(updatedCart));
  };

  const getCartTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price, 0);
  };

  const getTotalDuration = () => {
    return cartItems.reduce((sum, item) => sum + parseInt(item.duration || '0'), 0);
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('bookingCart');
  };

  return {
    cartItems,
    customerName,
    customerEmail,
    customerPhone,
    specialRequests,
    selectedStaff,
    selectedDate,
    selectedTime,
    removeFromCart,
    setCustomerName,
    setCustomerEmail,
    setCustomerPhone,
    setSpecialRequests,
    setSelectedStaff,
    setSelectedDate,
    setSelectedTime,
    updateServiceStaff,
    getCartTotal,
    getTotalDuration,
    clearCart,
  };
};

// Default time slots (will be filtered based on staff availability)
const DEFAULT_TIME_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00'];

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

export default function BookingCheckout() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Branch states
  const [branch, setBranch] = useState('');
  const [branchesList, setBranchesList] = useState<BranchData[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');

  // Mixed payment state
  const [walletAmount, setWalletAmount] = useState<string>('');
  const [cashAmount, setCashAmount] = useState<string>('');

  // Staff state
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  const {
    cartItems,
    customerName,
    customerEmail,
    customerPhone,
    specialRequests,
    selectedStaff,
    selectedDate,
    selectedTime,
    removeFromCart,
    setCustomerName,
    setCustomerEmail,
    setCustomerPhone,
    setSpecialRequests,
    setSelectedStaff,
    setSelectedDate,
    setSelectedTime,
    updateServiceStaff,
    getCartTotal,
    getTotalDuration,
    clearCart,
  } = useBookingStore();

  // ✅ FIXED: REAL-TIME BRANCHES FETCH - EXACT MATCH FOR YOUR FIREBASE STRUCTURE
  useEffect(() => {
    setBranchesLoading(true);
    
    // Collect branch names from cart items
    let allBranchNames: string[] = [];
    
    if (cartItems.length > 0) {
      console.log("========== 🔍 BRANCH DEBUGGING ==========");
      console.log("🛒 Cart Items:", cartItems.map(item => ({
        name: item.name,
        branchNames: item.branchNames
      })));
      
      cartItems.forEach(item => {
        if (item.branchNames && Array.isArray(item.branchNames) && item.branchNames.length > 0) {
          console.log(`✅ Service "${item.name}" has branchNames:`, item.branchNames);
          allBranchNames = [...allBranchNames, ...item.branchNames];
        } else {
          console.warn(`⚠️ Service "${item.name}" has NO branchNames array or it's empty!`);
        }
      });
      
      // Remove duplicates
      allBranchNames = [...new Set(allBranchNames)];
      console.log("🎯 Unique branch names to filter:", allBranchNames);
    }
    
    if (allBranchNames.length > 0) {
      console.log("🔍 Querying Firebase for branches with names IN:", allBranchNames);
      
      // EXACT MATCH query - works with your Firebase structure
      const branchesQuery = query(
        collection(db, 'branches'),
        where('name', 'in', allBranchNames)
      );
      
      const unsubscribe = onSnapshot(branchesQuery, (snapshot) => {
        console.log(`📦 Firebase returned ${snapshot.docs.length} branches`);
        
        const branchesData = snapshot.docs.map((doc) => {
          const data = doc.data();
          console.log(`🏢 Branch from DB: ID=${doc.id}, name="${data.name}"`);
          return {
            id: doc.id,
            ...data
          };
        }) as BranchData[];
        
        console.log("✅ Available branches:", branchesData.map(b => b.name));
        
        // Check if all requested branches were found
        allBranchNames.forEach(requestedName => {
          const found = branchesData.some(b => b.name === requestedName);
          console.log(`   - "${requestedName}": ${found ? '✅ FOUND' : '❌ NOT FOUND'}`);
        });
        
        setBranchesList(branchesData);
        setBranchesLoading(false);
        
        // Auto-select if only one branch
        if (branchesData.length === 1 && !branch) {
          console.log(`🤖 Auto-selecting branch: ${branchesData[0].name}`);
          setBranch(branchesData[0].id);
        }
        
        // Reset branch if no longer available
        if (branch) {
          const stillAvailable = branchesData.some(b => b.id === branch || b.name === branch);
          if (!stillAvailable) {
            console.log(`🔄 Resetting branch selection - previously selected branch no longer available`);
            setBranch('');
          }
        }
        
        console.log("========== 🔍 DEBUG END ==========");
      }, (error) => {
        console.error("❌ Firebase query error:", error);
        
        // Handle Firebase index error
        if (error.code === 'failed-precondition') {
          console.error("⚠️ Firebase index required! Please create index in Firebase console.");
          console.error("Index fields: name (Ascending), __name__ (Ascending)");
        }
        
        setBranchesList([]);
        setBranchesLoading(false);
      });
      
      return () => unsubscribe();
    } else {
      console.log("⚠️ No branch names found in cart items - showing empty dropdown");
      setBranchesList([]);
      setBranchesLoading(false);
      setBranch('');
    }
    
  }, [cartItems]);

  // 🔥 NEW: Fetch staff from Firebase and filter by selected branch
  useEffect(() => {
    const fetchStaffFromFirebase = async () => {
      try {
        setLoadingStaff(true);
        const staffCollection = collection(db, 'staff');
        const staffSnapshot = await getDocs(staffCollection);
        
        const staffList: StaffMember[] = [];
        staffSnapshot.forEach((doc) => {
          const data = doc.data();
          staffList.push({
            id: doc.id,
            name: data.name || 'Unknown',
            role: data.role || 'makeup',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || 'Pakistan, Punjab, Lahore',
            avatar: data.avatar || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRF7OgPn-8m_r8IFw3s7k2o0tXkcewFRkMcKQ&s',
            bloodGroup: data.bloodGroup || '',
            branch: data.branch || '', // Branch name where staff works
            dateOfBirth: data.dateOfBirth || '',
            description: data.description || '',
            documentId: data.documentId || '',
            emergencyContact: data.emergencyContact || '',
            experience: data.experience || '',
            gender: data.gender || '',
            hireDate: data.hireDate || '',
            maritalStatus: data.maritalStatus || '',
            nationality: data.nationality || '',
            rating: data.rating || 0,
            reviews: data.reviews || 0,
            salary: data.salary || 0,
            specialization: data.specialization || [],
            status: data.status || 'active',
            visaExpiry: data.visaExpiry || '',
            weeklyTimings: data.weeklyTimings || {}
          });
        });
        
        setStaffMembers(staffList);
        setLoadingStaff(false);
      } catch (error) {
        console.error('Error fetching staff:', error);
        setLoadingStaff(false);
      }
    };

    fetchStaffFromFirebase();
  }, []);

  // 🔥 NEW: Filter staff based on selected branch
  useEffect(() => {
    if (branch && branchesList.length > 0) {
      // Find selected branch name
      const selectedBranchData = branchesList.find(b => b.id === branch);
      const branchName = selectedBranchData?.name || '';
      
      console.log(`🔍 Filtering staff for branch: ${branchName}`);
      
      // Filter staff that work in this branch
      const filtered = staffMembers.filter(staff => 
        staff.branch === branchName && staff.status === 'active'
      );
      
      console.log(`✅ Found ${filtered.length} staff members in branch ${branchName}`);
      setFilteredStaff(filtered);
      
      // Reset selected staff if not available in this branch
      if (selectedStaff) {
        const staffAvailable = filtered.some(s => s.name === selectedStaff);
        if (!staffAvailable && filtered.length > 0) {
          console.log(`🔄 Auto-selecting first available staff: ${filtered[0].name}`);
          setSelectedStaff(filtered[0].name);
        } else if (!staffAvailable) {
          setSelectedStaff('');
        }
      } else if (filtered.length > 0) {
        setSelectedStaff(filtered[0].name);
      }
    } else {
      setFilteredStaff([]);
    }
  }, [branch, branchesList, staffMembers]);

  // 🔥 NEW: Generate available time slots based on selected staff and date
  useEffect(() => {
    if (selectedStaff && selectedDate) {
      const staff = staffMembers.find(s => s.name === selectedStaff);
      
      if (staff?.weeklyTimings) {
        // Get day of week from selected date
        const date = new Date(selectedDate);
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayOfWeek = dayNames[date.getDay()];
        
        console.log(`📅 Selected date: ${selectedDate} (${dayOfWeek})`);
        console.log(`👤 Staff ${staff.name} weeklyTimings:`, staff.weeklyTimings);
        
        // Get staff timings for this day
        const dayTiming = staff.weeklyTimings[dayOfWeek as keyof typeof staff.weeklyTimings];
        
        if (dayTiming && !dayTiming.closed) {
          console.log(`✅ Staff works on ${dayOfWeek}: ${dayTiming.start} - ${dayTiming.end}`);
          
          // Generate time slots based on staff's working hours
          const slots = generateTimeSlots(dayTiming.start, dayTiming.end);
          setAvailableTimeSlots(slots);
          
          // Reset selected time if not available
          if (selectedTime && !slots.includes(selectedTime)) {
            setSelectedTime('');
          }
        } else {
          console.log(`❌ Staff is not available on ${dayOfWeek} (closed or no timings)`);
          setAvailableTimeSlots([]);
          setSelectedTime('');
        }
      } else {
        // Fallback to default time slots if no weeklyTimings
        console.log(`⚠️ No weeklyTimings found for staff ${selectedStaff}, using default slots`);
        setAvailableTimeSlots(DEFAULT_TIME_SLOTS);
      }
    } else {
      setAvailableTimeSlots([]);
    }
  }, [selectedStaff, selectedDate]);

  // Helper function to generate time slots from start to end time
  const generateTimeSlots = (startTime: string, endTime: string): string[] => {
    const slots: string[] = [];
    
    // Parse start and end times
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    // Convert to minutes since midnight
    const startMinutes = startHour * 60 + (startMinute || 0);
    const endMinutes = endHour * 60 + (endMinute || 0);
    
    // Generate 30-minute slots
    for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }
    
    return slots;
  };

  // Convert loyalty points to AED
  const convertPointsToAED = (points: number): number => {
    return points / 100;
  };

  // Convert AED to loyalty points
  const convertAEDToPoints = (aed: number): number => {
    return aed * 100;
  };

  // Fetch customer data and wallet balance
  useEffect(() => {
    const fetchCustomerData = async () => {
      const authData = localStorage.getItem('customerAuth');
      if (authData) {
        try {
          const { isAuthenticated, customer: customerData } = JSON.parse(authData);
          if (isAuthenticated && customerData) {
            setIsLoggedIn(true);
            
            if (customerData.id) {
              try {
                const walletsQuery = query(
                  collection(db, 'wallets'),
                  where('customerId', '==', customerData.id)
                );
                
                const walletSnapshot = await getDocs(walletsQuery);
                
                if (!walletSnapshot.empty) {
                  const walletDoc = walletSnapshot.docs[0];
                  const walletData = walletDoc.data();
                  
                  setCustomer({
                    ...customerData,
                    walletBalance: walletData.balance || 0,
                    loyaltyPoints: walletData.loyaltyPoints || 0
                  });
                } else {
                  setCustomer({
                    ...customerData,
                    walletBalance: 0,
                    loyaltyPoints: 0
                  });
                }
              } catch (error) {
                console.error('Error fetching customer wallet:', error);
                setCustomer({
                  ...customerData,
                  walletBalance: 0,
                  loyaltyPoints: 0
                });
              }
            } else {
              setCustomer(customerData);
            }
          }
        } catch (error) {
          console.error('Error parsing auth data:', error);
        }
      }
    };

    fetchCustomerData();
  }, []);

  // Calculate total
  const cartTotal = getCartTotal();
  const finalTotal = cartTotal;

  // Get wallet balance in AED
  const getWalletBalanceInAED = () => {
    if (!customer || customer.loyaltyPoints === undefined) return 0;
    return convertPointsToAED(customer.loyaltyPoints);
  };

  // Calculate remaining balance after wallet payment
  const getRemainingBalanceInAED = () => {
    const walletBalance = getWalletBalanceInAED();
    const walletPayment = getNumericWalletAmount();
    return walletBalance - walletPayment;
  };

  // Calculate remaining loyalty points
  const getRemainingLoyaltyPoints = () => {
    if (!customer || customer.loyaltyPoints === undefined) return 0;
    const walletPayment = getNumericWalletAmount();
    const pointsToDeduct = convertAEDToPoints(walletPayment);
    return customer.loyaltyPoints - pointsToDeduct;
  };

  // Auto-calculate mixed payment amounts
  useEffect(() => {
    if (paymentMethod === 'mixed' && customer) {
      const walletBalanceAED = getWalletBalanceInAED();
      const walletPay = Math.min(walletBalanceAED, finalTotal);
      const cashPay = finalTotal - walletPay;
      
      setWalletAmount(walletPay === 0 ? '' : walletPay.toFixed(2));
      setCashAmount(cashPay === 0 ? '' : cashPay.toFixed(2));
    } else {
      setWalletAmount('');
      setCashAmount('');
    }
  }, [paymentMethod, finalTotal, customer]);

  // Handle wallet amount change
  const handleWalletAmountChange = (value: string) => {
    setWalletAmount(value);
    
    const numWallet = parseFloat(value) || 0;
    const walletBalanceAED = getWalletBalanceInAED();
    
    if (numWallet > walletBalanceAED) {
      setWalletAmount(walletBalanceAED.toFixed(2));
      const remaining = finalTotal - walletBalanceAED;
      setCashAmount(remaining > 0 ? remaining.toFixed(2) : '0.00');
    } else if (numWallet > finalTotal) {
      setWalletAmount(finalTotal.toFixed(2));
      setCashAmount('0.00');
    } else {
      const remaining = finalTotal - numWallet;
      setCashAmount(remaining.toFixed(2));
    }
  };

  // Handle cash amount change
  const handleCashAmountChange = (value: string) => {
    setCashAmount(value);
    
    const numCash = parseFloat(value) || 0;
    const walletBalanceAED = getWalletBalanceInAED();
    
    if (numCash > finalTotal) {
      setCashAmount(finalTotal.toFixed(2));
      setWalletAmount('0.00');
    } else {
      const remaining = finalTotal - numCash;
      const walletPay = Math.min(remaining, walletBalanceAED);
      setWalletAmount(walletPay.toFixed(2));
      
      if (walletPay < remaining) {
        const adjustedCash = finalTotal - walletPay;
        setCashAmount(adjustedCash.toFixed(2));
      }
    }
  };

  // Generate unique booking number
  const generateBookingNumber = () => {
    return `BOOK-${Date.now()}${Math.floor(Math.random() * 1000)}`;
  };

  // Format date for Firebase
  const formatFirebaseDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(6, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  };

  // Get current date
  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get numeric values
  const getNumericWalletAmount = () => parseFloat(walletAmount) || 0;
  const getNumericCashAmount = () => parseFloat(cashAmount) || 0;

  // Handle confirm booking
  const handleConfirmBooking = async () => {
    // Validation
    if (cartItems.length === 0) {
      setValidationError('Please add services to your cart first.');
      return;
    }
    
    if (!customerName || !customerEmail || !customerPhone) {
      setValidationError('Please fill in all customer information.');
      return;
    }
    
    if (!selectedDate || !selectedTime) {
      setValidationError('Please select date and time.');
      return;
    }

    if (!selectedStaff) {
      setValidationError('Please select a staff member.');
      return;
    }

    if (!branch) {
      setValidationError('Please select a branch.');
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

    const servicesTotal = cartItems.reduce((sum, item) => sum + item.price, 0);
    const finalAmount = servicesTotal;
    const walletBalanceAED = getWalletBalanceInAED();

    if (paymentMethod === 'wallet' && customer) {
      if (walletBalanceAED < finalAmount) {
        setValidationError(`Insufficient wallet balance. Your balance is AED ${walletBalanceAED.toFixed(2)} but total is AED ${finalAmount.toFixed(2)}. Please choose another payment method.`);
        return;
      }
    }

    if (paymentMethod === 'mixed') {
      const numWalletAmount = getNumericWalletAmount();
      const numCashAmount = getNumericCashAmount();
      const totalPaid = numWalletAmount + numCashAmount;
      
      if (Math.abs(totalPaid - finalAmount) > 0.01) {
        setValidationError(`Mixed payment amounts must equal the total of AED ${finalAmount.toFixed(2)}. Current: Wallet AED ${numWalletAmount.toFixed(2)} + Cash AED ${numCashAmount.toFixed(2)} = AED ${totalPaid.toFixed(2)}`);
        return;
      }
      
      if (numWalletAmount > walletBalanceAED) {
        setValidationError(`Wallet amount (AED ${numWalletAmount.toFixed(2)}) exceeds your balance (AED ${walletBalanceAED.toFixed(2)})`);
        return;
      }
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

      const staffMember = staffMembers.find(s => s.name === selectedStaff);
      
      // Find selected branch details
      const selectedBranchData = branchesList.find(b => b.id === branch || b.name === branch);
      const branchName = selectedBranchData?.name || branch;
      const branchId = selectedBranchData?.id || branch;
      
      const servicesTotal = cartItems.reduce((sum, item) => sum + item.price, 0);
      const finalAmount = servicesTotal;
      
      const numWalletAmount = getNumericWalletAmount();
      const numCashAmount = getNumericCashAmount();
      
      let walletPayment = 0;
      let cashPayment = 0;
      
      if (paymentMethod === 'wallet') {
        walletPayment = finalAmount;
        cashPayment = 0;
      } else if (paymentMethod === 'mixed') {
        walletPayment = numWalletAmount;
        cashPayment = numCashAmount;
      } else if (paymentMethod === 'cod') {
        walletPayment = 0;
        cashPayment = finalAmount;
      }
      
      const bookingData: BookingData = {
        bookingDate: selectedDate,
        bookingNumber: generateBookingNumber(),
        bookingTime: selectedTime,
        branch: branchName,
        branchId: branchId,
        branchNames: [branchName],
        branches: [branchId],
        cardLast4Digits: "",
        createdAt: serverTimestamp(),
        createdBy: "customer_booking",
        customerEmail: customerEmail,
        customerId: customerId,
        customerName: customerName,
        customerPhone: customerPhone,
        date: formatFirebaseDate(),
        notes: notes || specialRequests || (paymentMethod === 'mixed' 
          ? `Payment Method: Mixed Payment. Wallet: AED ${walletPayment.toFixed(2)}, Cash: AED ${cashPayment.toFixed(2)}` 
          : `Payment Method: ${paymentMethod}. Wallet: AED ${walletPayment.toFixed(2)}, Cash: AED ${cashPayment.toFixed(2)}`),
        paymentAmounts: {
          wallet: walletPayment,
          cash: cashPayment
        },
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'cod' || paymentMethod === 'mixed' ? 'pending' : "paid",
        pointsAwarded: false,
        products: [],
        productsTotal: 0,
        serviceCategory: cartItems.map(item => item.category).join(', ') || "third category",
        serviceCategoryId: cartItems[0]?.serviceCategoryId || "KfUizOHVXwD1rU7qhvKd",
        serviceCharges: 0,
        serviceDuration: getTotalDuration(),
        serviceId: cartItems[0]?.id || "wm4r0IVOcxZWoEfBNw9f",
        serviceName: cartItems[0]?.name || "Fifth Services",
        servicePrice: servicesTotal,
        serviceTip: 0,
        services: cartItems.map(item => item.name),
        source: "customer_app",
        staffId: staffMember?.id || "",
        staffName: selectedStaff,
        staffRole: staffMember?.role || "makeup",
        status: "confirmed",
        confirmedAt: serverTimestamp(),
        subtotal: servicesTotal,
        tax: 0,
        taxAmount: 0,
        teamMembers: cartItems.map(item => ({
          name: item.staffMember || selectedStaff,
          role: staffMember?.role || "makeup",
          staffId: staffMember?.id || "",
          time: selectedTime,
          timeSlot: selectedTime
        })),
        time: selectedTime,
        timeSlot: selectedTime,
        tip: 0,
        totalAmount: finalAmount,
        totalDuration: getTotalDuration(),
        totalTips: 0,
        trnNumber: "",
        updatedAt: serverTimestamp(),
        userBranchId: branchId,
        userBranchName: branchName,
        userRole: "admin"
      };

      const bookingsRef = collection(db, 'bookings');
      const docRef = await addDoc(bookingsRef, bookingData);
      
      if ((paymentMethod === 'wallet' || (paymentMethod === 'mixed' && walletPayment > 0)) && customer && customer.id) {
        try {
          const walletsQuery = query(
            collection(db, 'wallets'),
            where('customerId', '==', customer.id)
          );
          
          const walletSnapshot = await getDocs(walletsQuery);
          
          if (!walletSnapshot.empty) {
            const walletDoc = walletSnapshot.docs[0];
            const walletData = walletDoc.data();
            
            const pointsToDeduct = convertAEDToPoints(walletPayment);
            const newLoyaltyPoints = Math.max(0, (walletData.loyaltyPoints || 0) - pointsToDeduct);
            const newBalance = Math.max(0, (walletData.balance || 0) - walletPayment);
            
            await updateDoc(walletDoc.ref, {
              loyaltyPoints: newLoyaltyPoints,
              balance: newBalance,
              updatedAt: serverTimestamp()
            });
            
            await addDoc(collection(db, 'walletTransactions'), {
              customerId: customer.id,
              customerName: customer.name,
              amount: walletPayment,
              amountInPoints: pointsToDeduct,
              type: 'debit',
              description: `Booking payment: ${bookingData.bookingNumber}${paymentMethod === 'mixed' ? ' (Mixed Payment - Wallet Portion)' : ''}`,
              bookingId: docRef.id,
              bookingNumber: bookingData.bookingNumber,
              previousBalance: walletData.balance || 0,
              previousLoyaltyPoints: walletData.loyaltyPoints || 0,
              newBalance: newBalance,
              newLoyaltyPoints: newLoyaltyPoints,
              remainingBalance: newBalance,
              remainingLoyaltyPoints: newLoyaltyPoints,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            
            setCustomer({
              ...customer,
              loyaltyPoints: newLoyaltyPoints,
              walletBalance: newBalance
            });
          }
        } catch (walletError) {
          console.error('Error updating wallet balance:', walletError);
        }
      }
      
      setConfirmedBookingId(bookingData.bookingNumber);
      clearCart();
      setBookingConfirmed(true);
      
    } catch (error) {
      console.error('Error creating booking:', error);
      setValidationError('Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (bookingConfirmed) {
    return (
      <div className="min-h-screen bg-[#fcfcfc]">
      
        <div className="pt-32 pb-16 px-4">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-secondary" />
            </div>
            <h1 className="text-4xl font-sans font-bold text-primary">Booking Confirmed!</h1>
            <p className="text-lg text-muted-foreground font-light">
              Your booking has been successfully created.
            </p>
            <Card className="border-none bg-white shadow-xl rounded-none p-6">
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Booking Reference</p>
                  <p className="text-xl font-sans font-bold text-primary">{confirmedBookingId}</p>
                </div>
                <div className="grid grid-cols-2 gap-6 text-left">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Date & Time</p>
                    <p className="font-bold text-sm">{selectedDate} at {selectedTime}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Specialist</p>
                    <p className="font-bold text-sm">{selectedStaff}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100">
                </div>
              </div>
            </Card>
            <div className="pt-6">
              <Button onClick={() => router.push('/services')} className="bg-primary hover:bg-primary/90 text-white rounded-none px-8 py-5 font-bold tracking-widest text-xs">
                BOOK MORE SERVICES
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
              <Link href="/services" className="flex items-center text-xs font-bold tracking-widest">
                <ChevronLeft className="w-4 h-4 mr-1" /> BACK TO SERVICES
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Booking Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Sign-In Alert */}
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
                            Digital Wallet and Mixed Payment options require an account. Create an account to access all payment methods and use your wallet balance.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 pt-2">
                        <Link href="/customer/login">
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
                    
                    {/* ✅ FIXED BRANCH DROPDOWN - EXACT MATCH FOR YOUR FIREBASE STRUCTURE */}
                    <div className="space-y-1.5">
                      <Label htmlFor="branch" className="text-[10px] uppercase tracking-widest font-bold">Branch *</Label>
                      <Select 
                        value={branch} 
                        onValueChange={setBranch}
                        disabled={branchesLoading || branchesList.length === 0}
                      >
                        <SelectTrigger className="rounded-none border-gray-200 h-10 text-sm">
                          <SelectValue placeholder={
                            cartItems.length === 0 
                              ? "Select a service first" 
                              : branchesLoading 
                                ? "Loading branches..." 
                                : branchesList.length === 0 
                                  ? "No branches available" 
                                  : "Select branch"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {/* 🚫 NO DUMMY BRANCHES - ONLY REAL BRANCHES FROM FIREBASE */}
                          {branchesList.map((branchItem) => (
                            <SelectItem key={branchItem.id} value={branchItem.id}>
                              {branchItem.name} 
                              {branchItem.city && ` - ${branchItem.city}`}
                              {branchItem.country && `, ${branchItem.country}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {/* Helper Text */}
                      {cartItems.length > 0 && !branchesLoading && branchesList.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1">
                          ⚠️ This service is not available at any branch
                        </p>
                      )}
                      
                      {!branchesLoading && branchesList.length > 0 && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ {branchesList.length} branch{branchesList.length > 1 ? 'es' : ''} available
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="requests" className="text-[10px] uppercase tracking-widest font-bold">Special Requests / Notes</Label>
                    <Textarea 
                      id="requests" 
                      placeholder="Any special requests or notes for your booking..." 
                      className="rounded-none border-gray-200 min-h-20 text-sm"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Schedule */}
              <Card className="border-none shadow-sm rounded-none">
                <CardHeader className="border-b border-gray-50 py-4">
                  <CardTitle className="text-xl font-sans font-bold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-secondary" /> Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-bold">Select Date *</Label>
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
                      <Label className="text-[10px] uppercase tracking-widest font-bold">Select Time *</Label>
                      <Select 
                        value={selectedTime} 
                        onValueChange={setSelectedTime}
                        disabled={availableTimeSlots.length === 0}
                      >
                        <SelectTrigger className="rounded-none border-gray-200 h-10 text-sm">
                          <SelectValue placeholder={
                            !selectedStaff 
                              ? "Select staff first" 
                              : !selectedDate
                                ? "Select date first"
                                : availableTimeSlots.length === 0
                                  ? "No available slots"
                                  : "Select time"
                          } />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTimeSlots.map(time => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {/* Show availability info */}
                      {selectedStaff && selectedDate && availableTimeSlots.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1">
                          ⚠️ Staff is not available on this day
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Staff Selection - 🔥 UPDATED: Only show staff from selected branch */}
              <Card className="border-none shadow-sm rounded-none">
                <CardHeader className="border-b border-gray-50 py-4">
                  <CardTitle className="text-xl font-sans font-bold flex items-center gap-2">
                    <User className="w-5 h-5 text-secondary" /> Select Staff
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {loadingStaff ? (
                    <div className="py-4 text-center text-gray-500">
                      Loading staff members...
                    </div>
                  ) : !branch ? (
                    <div className="py-4 text-center text-gray-500">
                      Please select a branch first
                    </div>
                  ) : filteredStaff.length === 0 ? (
                    <div className="py-4 text-center text-amber-600">
                      No staff available at this branch
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase tracking-widest font-bold">Select Staff Member *</Label>
                        <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                          <SelectTrigger className="rounded-none border-gray-200 h-10 text-sm">
                            <SelectValue placeholder="Select a staff member" />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredStaff.map((staff) => (
                              <SelectItem key={staff.id} value={staff.name}>
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full overflow-hidden">
                                    <img 
                                      src={staff.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(staff.name)}&background=random`} 
                                      alt={staff.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <span>{staff.name}</span>
                                  <span className="text-xs text-gray-500 ml-auto">({staff.role})</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {selectedStaff && (
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                              <img 
                                src={staffMembers.find(s => s.name === selectedStaff)?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedStaff)}&background=random`} 
                                alt={selectedStaff}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-semibold">{selectedStaff}</p>
                              <p className="text-xs text-gray-500">
                                {staffMembers.find(s => s.name === selectedStaff)?.role || 'Staff'}
                              </p>
                            </div>
                          </div>
                          
                          {/* Show staff availability summary */}
                          {selectedDate && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs font-medium text-gray-700 mb-2">Available Hours:</p>
                              {(() => {
                                const staff = staffMembers.find(s => s.name === selectedStaff);
                                const date = new Date(selectedDate);
                                const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                                const dayOfWeek = dayNames[date.getDay()];
                                const dayTiming = staff?.weeklyTimings?.[dayOfWeek as keyof typeof staff.weeklyTimings];
                                
                                if (dayTiming && !dayTiming.closed) {
                                  return (
                                    <p className="text-sm text-green-600">
                                      {dayTiming.start} - {dayTiming.end}
                                    </p>
                                  );
                                } else {
                                  return (
                                    <p className="text-sm text-red-500">
                                      Not available on this day
                                    </p>
                                  );
                                }
                              })()}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
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
                    {/* Mixed Payment */}
                    <button
                      onClick={() => isLoggedIn && setPaymentMethod('mixed')}
                      disabled={!isLoggedIn}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 relative",
                        paymentMethod === 'mixed' 
                          ? "border-secondary bg-secondary/10" 
                          : isLoggedIn 
                            ? "border-gray-200 hover:border-gray-300 cursor-pointer" 
                            : "border-gray-100 cursor-not-allowed opacity-60"
                      )}
                    >
                      {!isLoggedIn && (
                        <div className="absolute -top-2 -right-2">
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                            <X className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}
                      <Layers className={cn("w-6 h-6", paymentMethod === 'mixed' ? "text-secondary" : "text-gray-500")} />
                      <span className="text-xs font-bold">Mixed Payment</span>
                      <span className="text-xs text-gray-500">Wallet + Cash</span>
                    </button>
                    
                    {/* Digital Wallet */}
                    <button
                      onClick={() => isLoggedIn && setPaymentMethod('wallet')}
                      disabled={!isLoggedIn}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 relative",
                        paymentMethod === 'wallet' 
                          ? "border-secondary bg-secondary/10" 
                          : isLoggedIn 
                            ? "border-gray-200 hover:border-gray-300 cursor-pointer" 
                            : "border-gray-100 cursor-not-allowed opacity-60"
                      )}
                    >
                      {!isLoggedIn && (
                        <div className="absolute -top-2 -right-2">
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                            <X className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}
                      <Wallet className={cn("w-6 h-6", paymentMethod === 'wallet' ? "text-secondary" : "text-gray-500")} />
                      <span className="text-xs font-bold">Digital Wallet</span>
                      <span className="text-xs text-gray-500">Online Payment</span>
                    </button>
                    
                    {/* COD Option */}
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
                      <span className="text-xs text-gray-500">Pay at Salon</span>
                    </button>
                  </div>

                  {/* Mixed Payment Fields */}
                  {paymentMethod === 'mixed' && customer && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <Layers className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-purple-900">Mixed Payment Breakdown</p>
                            <p className="text-xs text-purple-600">Specify amounts for wallet and cash payment</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          {/* Wallet Amount */}
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-purple-900">
                              Amount from Wallet (AED)
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max={getWalletBalanceInAED()}
                                value={walletAmount}
                                onChange={(e) => handleWalletAmountChange(e.target.value)}
                                className="rounded-none border-purple-200 h-9"
                                placeholder="Enter amount"
                              />
                              <span className="text-sm font-medium text-purple-700 whitespace-nowrap">AED</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-purple-500">
                                Available: {getWalletBalanceInAED().toFixed(2)} AED ({customer.loyaltyPoints?.toFixed(0) || '0'} points)
                              </span>
                              <span className="font-bold text-purple-700">
                                Remaining: {getRemainingBalanceInAED().toFixed(2)} AED ({getRemainingLoyaltyPoints().toFixed(0)} points)
                              </span>
                            </div>
                          </div>
                          
                          {/* Cash Amount */}
                          <div className="space-y-1.5">
                            <Label className="text-sm font-medium text-purple-900">
                              Amount from Cash (COD) AED
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={cashAmount}
                                onChange={(e) => handleCashAmountChange(e.target.value)}
                                className="rounded-none border-purple-200 h-9"
                                placeholder="Enter amount"
                              />
                              <span className="text-sm font-medium text-purple-700 whitespace-nowrap">AED</span>
                            </div>
                          </div>
                          
                          {/* Summary */}
                          <div className="p-3 bg-white border border-purple-100 rounded-lg mt-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-purple-700">Wallet Payment:</span>
                              <span className="font-bold text-purple-900">{getNumericWalletAmount().toFixed(2)} AED</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-purple-700">Wallet Remaining:</span>
                              <span className="font-bold text-green-600">{getRemainingBalanceInAED().toFixed(2)} AED</span>
                            </div>
                            <div className="flex justify-between text-sm mt-1">
                              <span className="text-purple-700">Cash Payment:</span>
                              <span className="font-bold text-purple-900">{getNumericCashAmount().toFixed(2)} AED</span>
                            </div>
                            <div className="flex justify-between text-sm mt-2 pt-2 border-t border-purple-100">
                              <span className="font-bold text-purple-900">Total Amount:</span>
                              <span className="font-bold text-purple-900">{finalTotal.toFixed(2)} AED</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Wallet balance and loyalty points */}
                  {isLoggedIn && customer && paymentMethod !== 'mixed' && (
                    <div className="space-y-3">
                      {/* Wallet Balance */}
                      <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <DollarSign className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-green-900">Your Wallet Balance</p>
                              <p className="text-2xl font-bold text-green-700">
                                 {getWalletBalanceInAED().toFixed(2)} AED
                              </p>
                              <p className="text-sm text-green-600">
                                ({customer.loyaltyPoints?.toFixed(0) || '0'} points)
                              </p>
                            </div>
                          </div>
                          {paymentMethod === 'wallet' && (
                            <div className="text-right">
                              <p className="text-xs text-green-600 font-semibold">Available for payment</p>
                              <p className="text-sm text-green-800">
                                 {getWalletBalanceInAED().toFixed(2)} AED
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {paymentMethod === 'wallet' && (
                          <div className="mt-3 p-3 bg-white border border-green-300 rounded-lg">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-xs text-green-700 font-semibold">After Payment:</p>
                                <p className="text-sm text-green-900">
                                  {(getWalletBalanceInAED() - finalTotal).toFixed(2)} AED will remain
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-green-600">
                                  {convertAEDToPoints(getWalletBalanceInAED() - finalTotal).toFixed(0)} points
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {paymentMethod === 'wallet' && getWalletBalanceInAED() < finalTotal && (
                          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-xs text-red-700">
                              <AlertCircle className="w-3 h-3 inline mr-1" />
                              Insufficient wallet balance. You need additional AED {(finalTotal - getWalletBalanceInAED()).toFixed(2)}.
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Loyalty Points */}
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Award className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-blue-900">Your Loyalty Points</p>
                              <p className="text-2xl font-bold text-blue-700">
                                {customer.loyaltyPoints?.toFixed(0) || '0'} points
                              </p>
                              <p className="text-sm text-blue-600">
                                = {getWalletBalanceInAED().toFixed(2)} AED
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-blue-600 font-semibold">Conversion Rate</p>
                            <p className="text-xs text-blue-800">
                              100 points = 1.00 AED
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Message for non-logged in users */}
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

            {/* Right Column: Summary */}
            <div className="space-y-6">
              <Card className="border-none shadow-lg rounded-none bg-primary text-white sticky top-24">
                {/* Staff Profile */}
                <div className="h-40 w-full bg-gradient-to-b from-secondary/20 to-primary flex items-center justify-center overflow-hidden">
                  {selectedStaff ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img
                        src={staffMembers.find(s => s.name === selectedStaff)?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedStaff)}&background=random`}
                        alt={selectedStaff}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-transparent"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
                        <p className="font-sans font-bold text-lg text-white">{selectedStaff}</p>
                        <p className="text-sm text-white/80">
                          {staffMembers.find(s => s.name === selectedStaff)?.role || 'Staff'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-white/50">
                      <Scissors className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-xs font-bold tracking-widest uppercase">Select a specialist</p>
                    </div>
                  )}
                </div>

                <CardHeader className="border-b border-white/10 py-4">
                  <CardTitle className="text-xl font-sans font-bold">Booking Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-4">
                    {cartItems.length === 0 ? (
                      <div className="text-center py-8 space-y-3">
                        <Scissors className="w-8 h-8 text-white/20 mx-auto" />
                        <p className="text-xs text-white/60">Your cart is empty</p>
                        <Button asChild variant="outline" className="border-white/20 text-white bg-white/10 rounded-lg text-[10px] font-bold tracking-widest">
                          <Link href="/services">BROWSE SERVICES</Link>
                        </Button>
                      </div>
                    ) : (
                      cartItems.map((item, index) => (
                        <div 
                          key={`cart-${item.id}-${index}-${Date.now()}`} 
                          className="space-y-3 pb-4 border-b border-white/10 last:border-0"
                        >
                          <div className="flex justify-between items-start group">
                            <div className="space-y-0.5">
                              <p className="font-sans font-bold text-sm">{item.name}</p>
                              <div className="flex items-center gap-2 text-[10px] text-white/60">
                                <Clock className="w-3 h-3" />
                                <span>{item.duration} min</span>
                                <span className="text-white/40">•</span>
                                <span>{item.category}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-sm">AED {item.price}</span>
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
                          <span>Subtotal ({cartItems.length} services)</span>
                          <span>AED {cartTotal.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between text-xs text-white/60">
                          <span>Total Duration</span>
                          <span>{getTotalDuration()} min</span>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-white/10">
                          <span className="text-sm font-sans font-bold">
                            Final Amount
                          </span>
                          <span className="text-2xl font-sans font-bold text-secondary">
                            AED {finalTotal.toFixed(2)}
                          </span>
                        </div>

                        {/* Mixed payment breakdown */}
                        {paymentMethod === 'mixed' && (
                          <div className="p-3 bg-white/10 rounded-lg">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-white/80">Wallet Payment:</span>
                              <span className="font-bold">{getNumericWalletAmount().toFixed(2)} AED</span>
                            </div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-white/80">Wallet Remaining:</span>
                              <span className="font-bold text-green-300">{getRemainingBalanceInAED().toFixed(2)} AED</span>
                            </div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-white/80">Cash Payment:</span>
                              <span className="font-bold">{getNumericCashAmount().toFixed(2)} AED</span>
                            </div>
                            <div className="flex justify-between text-xs mt-2 pt-2 border-t border-white/20">
                              <span className="font-bold">Total:</span>
                              <span className="font-bold">{finalTotal.toFixed(2)} AED</span>
                            </div>
                          </div>
                        )}

                        {/* Wallet info */}
                        {paymentMethod === 'wallet' && customer && (
                          <div className="p-3 bg-white/10 rounded-lg">
                            <div className="flex justify-between text-xs">
                              <span className="text-white/80">Current Balance:</span>
                              <span className="font-bold">{getWalletBalanceInAED().toFixed(2)} AED</span>
                            </div>
                            <div className="flex justify-between text-xs mt-1">
                              <span className="text-white/80">Payment Amount:</span>
                              <span className="font-bold">{finalTotal.toFixed(2)} AED</span>
                            </div>
                            <div className="flex justify-between text-xs mt-1">
                              <span className="text-white/80">Remaining after payment:</span>
                              <span className={cn(
                                "font-bold",
                                getWalletBalanceInAED() >= finalTotal 
                                  ? "text-green-300" 
                                  : "text-red-300"
                              )}>
                                {(getWalletBalanceInAED() - finalTotal).toFixed(2)} AED
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Payment Method Badge */}
                        {paymentMethod && (
                          <div className="flex justify-center">
                            <Badge variant="outline" className="border-white/20 text-white/80 text-[10px]">
                              {paymentMethod === 'cod' && 'Cash on Delivery'}
                              {paymentMethod === 'wallet' && 'Digital Wallet'}
                              {paymentMethod === 'mixed' && 'Mixed Payment'}
                            </Badge>
                          </div>
                        )}
                      </div>

                      <Button 
                        className="w-full bg-secondary hover:bg-secondary/90 text-primary font-bold py-6 rounded-lg tracking-[0.2em] text-xs shadow-lg shadow-secondary/20 transition-all duration-300 hover:scale-[1.02] active:scale-95"
                        disabled={isSubmitting || !customerName || !customerEmail || !customerPhone || !selectedDate || !selectedTime || !branch || cartItems.length === 0 || !paymentMethod || !selectedStaff ||
                          (paymentMethod === 'wallet' && getWalletBalanceInAED() < finalTotal) ||
                          (paymentMethod === 'mixed' && (Math.abs((getNumericWalletAmount() + getNumericCashAmount()) - finalTotal) > 0.01 || (getNumericWalletAmount() > getWalletBalanceInAED())))}
                        onClick={handleConfirmBooking}
                      >
                        {isSubmitting ? 'PROCESSING...' : 'CONFIRM BOOKING'}
                      </Button>
                      <p className="text-[9px] text-center text-white/40 uppercase tracking-widest">
                        Secure booking & instant confirmation
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