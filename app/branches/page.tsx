
'use client';

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/shared/Header";
import { MapPin, Star, Clock, Phone, Search, Filter, CheckCircle2, ArrowRight, Sparkles, Award, Users, Zap, Crown, Shield, Mail, User, RefreshCw, Navigation, X, MessageCircle, Share2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { create } from 'zustand';
import { collection, getDocs, query, orderBy, doc, getDoc, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from "@/lib/utils";

// Types Definition
interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  openingTime: string;
  closingTime: string;
  description: string;
  image: string;
  status: string;
  managerName: string;
  managerEmail: string;
  managerPhone: string;
  createdAt: any;
  updatedAt: any;
  rating?: number;
  reviews?: number;
  services?: string[];
  features?: string[];
}

// Service Interface Firebase collection ke hisaab se
interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  imageUrl: string;
  status: string;
  branchNames?: string[];
  branches?: string[];
}

// Store Definition with Real-time Updates
interface BranchesStore {
  branches: Branch[];
  error: string | null;
  hasFetchedInitialData: boolean;
  fetchBranches: () => Promise<void>;
  fetchBranchById: (id: string) => Promise<Branch | null>;
  fetchBranchServices: (branchName: string) => Promise<Service[]>;
  setupRealtimeUpdates: () => () => void;
}

const useBranchesStore = create<BranchesStore>((set, get) => ({
  branches: [],
  error: null,
  hasFetchedInitialData: false,

  fetchBranches: async () => {
    try {
      const branchesRef = collection(db, 'branches');
      const q = query(branchesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const branchesData: Branch[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        branchesData.push({
          id: doc.id,
          name: data.name || 'Unnamed Branch',
          address: data.address || 'Address not available',
          city: data.city || 'City not specified',
          country: data.country || 'Country not specified',
          phone: data.phone || 'Phone not available',
          email: data.email || 'Email not available',
          openingTime: data.openingTime || '09:00',
          closingTime: data.closingTime || '18:00',
          description: data.description || 'Premium grooming branch',
          image: data.image || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop',
          status: data.status || 'active',
          managerName: data.managerName || 'Not assigned',
          managerEmail: data.managerEmail || 'Not available',
          managerPhone: data.managerPhone || 'Not available',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          rating: Math.floor(Math.random() * 5) + 4,
          reviews: Math.floor(Math.random() * 200) + 50,
          services: ['Haircuts', 'Beard Grooming', 'Premium Packages', 'Color Services'],
          features: ['VIP Lounge', 'Free WiFi', 'Beverages', 'Premium Products', 'Parking', 'Private Rooms']
        });
      });
      
      set({ 
        branches: branchesData, 
        hasFetchedInitialData: true 
      });
    } catch (error) {
      console.error('Error fetching branches:', error);
      set({ 
        error: 'Failed to fetch branches. Please try again later.'
      });
    }
  },

  fetchBranchById: async (id: string) => {
    try {
      const branchRef = doc(db, 'branches', id);
      const branchSnap = await getDoc(branchRef);
      
      if (branchSnap.exists()) {
        const data = branchSnap.data();
        return {
          id: branchSnap.id,
          name: data.name || 'Unnamed Branch',
          address: data.address || 'Address not available',
          city: data.city || 'City not specified',
          country: data.country || 'Country not specified',
          phone: data.phone || 'Phone not available',
          email: data.email || 'Email not available',
          openingTime: data.openingTime || '09:00',
          closingTime: data.closingTime || '18:00',
          description: data.description || 'Premium grooming branch',
          image: data.image || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop',
          status: data.status || 'active',
          managerName: data.managerName || 'Not assigned',
          managerEmail: data.managerEmail || 'Not available',
          managerPhone: data.managerPhone || 'Not available',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          rating: Math.floor(Math.random() * 5) + 4,
          reviews: Math.floor(Math.random() * 200) + 50,
          services: ['Haircuts', 'Beard Grooming', 'Premium Packages', 'Color Services', 'Facial Treatments', 'Massage'],
          features: ['VIP Lounge', 'Free WiFi', 'Beverages', 'Premium Products', 'Parking', 'Private Rooms', 'TV Entertainment', 'Music System']
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching branch:', error);
      return null;
    }
  },

  fetchBranchServices: async (branchName: string): Promise<Service[]> => {
    try {
      const servicesRef = collection(db, 'services');
      const q = query(servicesRef, where('branchNames', 'array-contains', branchName));
      
      const querySnapshot = await getDocs(q);
      
      const servicesData: Service[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        servicesData.push({
          id: doc.id,
          name: data.name || 'Service',
          description: data.description || '',
          price: data.price || 0,
          duration: data.duration || 0,
          category: data.category || '',
          imageUrl: data.imageUrl || '',
          status: data.status || 'active',
          branchNames: data.branchNames || [],
          branches: data.branches || []
        });
      });
      
      return servicesData;
    } catch (error) {
      console.error('Error fetching branch services:', error);
      return [];
    }
  },

  setupRealtimeUpdates: () => {
    try {
      const branchesRef = collection(db, 'branches');
      const q = query(branchesRef, orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const branchesData: Branch[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          branchesData.push({
            id: doc.id,
            name: data.name || 'Unnamed Branch',
            address: data.address || 'Address not available',
            city: data.city || 'City not specified',
            country: data.country || 'Country not specified',
            phone: data.phone || 'Phone not available',
            email: data.email || 'Email not available',
            openingTime: data.openingTime || '09:00',
            closingTime: data.closingTime || '18:00',
            description: data.description || 'Premium grooming branch',
            image: data.image || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop',
            status: data.status || 'active',
            managerName: data.managerName || 'Not assigned',
            managerEmail: data.managerEmail || 'Not available',
            managerPhone: data.managerPhone || 'Not available',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            rating: Math.floor(Math.random() * 5) + 4,
            reviews: Math.floor(Math.random() * 200) + 50,
            services: ['Haircuts', 'Beard Grooming', 'Premium Packages', 'Color Services'],
            features: ['VIP Lounge', 'Free WiFi', 'Beverages', 'Premium Products', 'Parking', 'Private Rooms']
          });
        });
        
        set({ 
          branches: branchesData, 
          hasFetchedInitialData: true 
        });
      }, (error) => {
        console.error('Error in real-time update:', error);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up real-time updates:', error);
      return () => {};
    }
  },
}));

// WhatsApp contact function
const openWhatsApp = (phoneNumber: string) => {
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  window.open(`https://wa.me/${cleanNumber}`, '_blank');
};

// Main Component
export default function Branches() {
  const router = useRouter();
  const { 
    branches, 
    fetchBranches, 
    fetchBranchById, 
    fetchBranchServices,
    error,
    hasFetchedInitialData,
    setupRealtimeUpdates 
  } = useBranchesStore();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [branchServices, setBranchServices] = useState<Service[]>([]);

  const hasSetupRealtimeRef = useRef(false);

  // ===== CHAT LOGIC (Copied from Home Page) =====
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check login status
  useEffect(() => {
    const checkLogin = () => {
      // Check if user is logged in (update this based on your auth system)
      const user = localStorage.getItem('user'); // or cookies, or context
      setIsLoggedIn(!!user);
    };
    
    checkLogin();
    
    // Optional: Listen for storage changes
    window.addEventListener('storage', checkLogin);
    return () => window.removeEventListener('storage', checkLogin);
  }, []);

  const handleChatClick = () => {
    if (isLoggedIn) {
      // Agar login hai to chat page par jao
      window.location.href = '/customer/chat';
    } else {
      // Agar login nahi hai to popup dikhao
      setShowChatPopup(true);
    }
  };
  // =============================================

  // Fetch data on component mount - only once
  useEffect(() => {
    const loadData = async () => {
      if (!hasFetchedInitialData) {
        await fetchBranches();
      }
    };
    
    loadData();
  }, [fetchBranches, hasFetchedInitialData]);

  // Set up real-time updates - only once
  useEffect(() => {
    if (!hasSetupRealtimeRef.current && hasFetchedInitialData) {
      const cleanup = setupRealtimeUpdates();
      hasSetupRealtimeRef.current = true;
      
      return cleanup;
    }
  }, [hasFetchedInitialData, setupRealtimeUpdates]);

  // Get unique cities from branches
  const cities = ["All", ...Array.from(new Set(branches.map(b => b.city)))
    .filter(city => city && city.trim() !== '')];

  // Status options
  const statusOptions = ["All", "active", "inactive", "coming-soon"];

  // Filter branches
  const filteredBranches = branches.filter(branch => {
    const matchesSearch = searchQuery === "" || 
      branch.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      branch.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.managerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCity = selectedCity === "All" || branch.city === selectedCity;
    const matchesStatus = selectedStatus === "All" || branch.status === selectedStatus;
    
    return matchesSearch && matchesCity && matchesStatus;
  });

  // Get working hours status
  const getWorkingHoursStatus = (openingTime: string, closingTime: string) => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 100 + currentMinute;
    
    const [openHour, openMinute] = openingTime.split(':').map(Number);
    const [closeHour, closeMinute] = closingTime.split(':').map(Number);
    
    const opening = openHour * 100 + openMinute;
    const closing = closeHour * 100 + closeMinute;
    
    if (currentTime >= opening && currentTime <= closing) {
      return { status: 'Open Now', color: 'bg-green-100 text-green-800', badge: 'bg-green-500' };
    } else if (currentTime < opening) {
      return { status: 'Opens Later', color: 'bg-yellow-100 text-yellow-800', badge: 'bg-yellow-500' };
    } else {
      return { status: 'Closed Now', color: 'bg-red-100 text-red-800', badge: 'bg-red-500' };
    }
  };

  // Format phone number
  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11) {
      return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    
    return phone;
  };

  // Calculate stats
  const totalBranches = branches.length;
  const activeBranches = branches.filter(b => b.status === 'active').length;
  const totalManagers = new Set(branches.map(b => b.managerName)).size;
  const totalCities = new Set(branches.map(b => b.city)).size;

  // Handle view details
  const handleViewDetails = async (branchId: string, branchName: string) => {
    try {
      const branch = await fetchBranchById(branchId);
      if (branch) {
        const services = await fetchBranchServices(branchName);
        setBranchServices(services);
        setSelectedBranch(branch);
        setIsSidebarOpen(true);
      }
    } catch (error) {
      console.error('Error loading branch details:', error);
    }
  };

  // Handle share branch
  const handleShareBranch = (branch: Branch) => {
    if (navigator.share) {
      navigator.share({
        title: `${branch.name} - Premium Grooming`,
        text: `Check out ${branch.name} at ${branch.address}. ${branch.description}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(`${branch.name}\n${branch.address}\n${branch.phone}\n${window.location.href}`);
      alert('Branch details copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] ">
      <Header />

      {/* ==================== 3 BUTTONS - EXACT COPY FROM HOME PAGE ==================== */}
      {/* Fixed bottom right buttons - WhatsApp, Call, Chatbot */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4">
        
        {/* Simple Official WhatsApp Icon */}
        <a 
          href="https://wa.me/923001234567" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
          title="WhatsApp"
        >
          <svg 
            className="w-7 h-7" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            {/* Direct WhatsApp Logo */}
            <path
              fill="#25D366"
              d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.78 2.7 15.57 3.71 17.08L2.09 21.91L7.06 20.33C8.55 21.24 10.27 21.72 12.04 21.72C17.5 21.72 21.95 17.27 21.95 11.81C21.95 6.35 17.5 2 12.04 2ZM12.04 20.09C10.46 20.09 8.92 19.65 7.58 18.83L7.32 18.68L4.43 19.57L5.34 16.77L5.18 16.5C4.3 15.12 3.81 13.53 3.81 11.91C3.81 7.37 7.5 3.68 12.04 3.68C16.58 3.68 20.27 7.37 20.27 11.91C20.27 16.45 16.58 20.09 12.04 20.09ZM16.46 13.95C16.18 13.81 14.95 13.21 14.69 13.12C14.43 13.03 14.24 12.98 14.05 13.26C13.86 13.54 13.33 14.09 13.17 14.27C13.01 14.45 12.85 14.47 12.57 14.33C12.29 14.19 11.46 13.91 10.48 13.05C9.7 12.37 9.16 11.51 9.02 11.23C8.88 10.95 9 10.79 9.13 10.66C9.25 10.53 9.4 10.33 9.53 10.17C9.66 10.01 9.71 9.89 9.79 9.73C9.87 9.57 9.82 9.43 9.74 9.31C9.66 9.19 9.11 7.98 8.9 7.5C8.69 7.02 8.48 7.07 8.32 7.07C8.16 7.07 7.99 7.07 7.83 7.07C7.67 7.07 7.41 7.13 7.19 7.39C6.97 7.65 6.35 8.29 6.35 9.58C6.35 10.87 7.22 12.11 7.37 12.3C7.52 12.49 9.09 14.83 11.5 15.94C12.69 16.52 13.59 16.79 14.28 16.97C15.06 17.16 15.79 17.09 16.36 16.88C16.93 16.67 17.67 16.15 17.88 15.53C18.09 14.91 18.09 14.38 18.04 14.28C17.99 14.18 17.85 14.11 17.68 14.04C17.52 13.99 16.74 14.09 16.46 13.95Z"
            />
          </svg>
        </a>
  
        {/* Very Simple Phone Icon */}
        <a 
          href="tel:+1234567890"
          className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
          title="Call Now"
        >
          <svg 
            className="w-6 h-6 text-white" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            {/* Simple Phone Handset */}
            <path d="M20 10.999h2C22 5.869 18.127 2 12.99 2v2C17.052 4 20 6.943 20 10.999z"/>
            <path d="M13 8c2.103 0 3 .897 3 3h2c0-3.225-1.775-5-5-5v2z"/>
            <path d="M16.5 13.5c-.3-.3-.7-.5-1.1-.5-.4 0-.8.1-1.1.4l-1.4 1.4c-1.1-.6-2.1-1.3-3-2.2-.9-.9-1.6-1.9-2.2-3l1.4-1.4c.3-.3.4-.7.4-1.1 0-.4-.1-.8-.4-1.1l-2-2c-.3-.3-.7-.5-1.1-.5-.4 0-.8.1-1.1.4L3.5 6.5c-.3.3-.5.7-.5 1.1 0 3.9 2.1 7.6 5 10.5 2.9 2.9 6.6 5 10.5 5 .4 0 .8-.2 1.1-.5l1.4-1.4c.3-.3.5-.7.5-1.1 0-.4-.2-.8-.5-1.1l-2-2z"/>
          </svg>
        </a>

        {/* Chatbot Button with Login Logic */}
        <button
          onClick={handleChatClick}
          className="flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
          title="Chat with Bot"
        >
          <svg 
            className="w-6 h-6" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor"
          >
            <defs>
              <linearGradient id="chatbot-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#667eea" />   {/* Purple */}
                <stop offset="50%" stopColor="#764ba2" />  {/* Dark Purple */}
                <stop offset="100%" stopColor="#6b8cff" /> {/* Blue */}
              </linearGradient>
            </defs>
            
            {/* Background Circle */}
            <circle 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="url(#chatbot-gradient)" 
              strokeWidth="1.5" 
              fill="transparent"
            />
            
            {/* Chatbot Icon - Message Bubble with Dots */}
            <path 
              d="M20 12C20 16.4183 16.4183 20 12 20C10.5 20 9.1 19.6 7.9 18.9L4 20L5.1 16.1C4.4 14.9 4 13.5 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12Z" 
              stroke="url(#chatbot-gradient)" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              fill="white"
            />
            
            {/* Three Dots inside bubble */}
            <circle cx="9" cy="12" r="1" fill="url(#chatbot-gradient)" />
            <circle cx="12" cy="12" r="1" fill="url(#chatbot-gradient)" />
            <circle cx="15" cy="12" r="1" fill="url(#chatbot-gradient)" />
          </svg>
        </button>
      </div>

      {/* Chat Login Popup */}
      {showChatPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-[60]">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowChatPopup(false)}
          />
          
          {/* Popup Box */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 w-full animate-in fade-in zoom-in duration-300">
            {/* Close Button */}
            <button 
              onClick={() => setShowChatPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Icon */}
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-sans font-bold text-center text-gray-900 mb-2">
              Create Account First! ✋
            </h3>

            {/* Login/Signup Button */}
            <Link 
              href="/customer/login"
              className="block w-full text-center bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
              onClick={() => setShowChatPopup(false)}
            >
              Login / Sign Up
            </Link>

            {/* Continue as Guest (Optional) */}
            <button 
              onClick={() => setShowChatPopup(false)}
              className="block w-full text-center text-gray-500 text-sm mt-4 hover:text-gray-700 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}

      {/* Error State - CODE1 STYLE */}
      {error && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-primary">Error Loading Data</h3>
            <p className="text-gray-600">{error}</p>
            <Button 
              onClick={fetchBranches}
              className="mt-4 bg-primary hover:bg-primary/90 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}

  {/* Premium Hero with Video Background - Same as Blog */}
<section className="relative h-[600px] md:h-[700px] lg:h-[800px] overflow-hidden">
  {/* Video Background */}
  <div className="absolute inset-0 w-full h-full">
    <video
      autoPlay
      loop
      muted
      playsInline
      className="absolute inset-0 w-full h-full object-cover"
    >
      {/* Pexels Video - Direct URL */}
      <source src="https://www.pexels.com/download/video/3997168/" type="video/mp4" />
      
      {/* Fallback for browsers that don't support video */}
      Your browser does not support the video tag.
    </video>
    
    {/* Soft Overlay - video visible rahega aur text readable */}
    <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-black/40 to-black/30"></div>
  </div>

  {/* Content Overlay - Centered with proper spacing */}
  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
    <div className="max-w-6xl mx-auto text-center px-4 -mt-16 md:-mt-20">
      {/* Main Heading - Large spacing from top */}




 {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 animate-bounce delay-500">
            <Crown className="w-8 h-8 text-secondary/30" />
          </div>
          <div className="absolute top-40 right-20 animate-bounce delay-1000">
            <Award className="w-6 h-6 text-secondary/20" />
          </div>
          <div className="absolute bottom-32 left-20 animate-bounce delay-1500">
            <Shield className="w-7 h-7 text-secondary/25" />
          </div>
          <div className="absolute bottom-20 right-10 animate-bounce delay-2000">
            <Zap className="w-5 h-5 text-secondary/20" />
          </div>
        </div>














      <div className="inline-flex items-center gap-2 bg-secondary/20 px-4 py-2 rounded-full mb-6 border border-secondary/30 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-secondary animate-pulse" />
            <span className="text-white tracking-[0.3em] uppercase text-[10px]">Our Presence</span>
            <Sparkles className="w-4 h-4 text-secondary animate-pulse" />
          </div>
      <h1 className="text-5xl md:text-7xl lg:text-8xl font-sans font-bold text-white mb-8 leading-tight drop-shadow-lg">
        Premium <span className="text-secondary italic">Locations</span>
      </h1>
      
      {/* Subheading - More breathing room */}
      <p className="text-white/90 max-w-3xl mx-auto text-lg md:text-xl lg:text-2xl font-light leading-relaxed mb-12 drop-shadow px-4">
       Experience luxury grooming at any of our strategically located branches.
      </p>
      
      {/* Real-time Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all">
              <div className="text-3xl font-sans font-bold text-secondary mb-2">{totalBranches}</div>
              <div className="text-white/70 text-xs font-black uppercase tracking-widest">Premium Locations</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all">
              <div className="text-3xl font-sans font-bold text-secondary mb-2">{activeBranches}</div>
              <div className="text-white/70 text-xs font-black uppercase tracking-widest">Active Branches</div>
              <div className="text-[10px] text-white/50 mt-1">Currently operational</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all">
              <div className="text-3xl font-sans font-bold text-secondary mb-2">{totalManagers}</div>
              <div className="text-white/70 text-xs font-black uppercase tracking-widest">Dedicated Managers</div>
              <div className="text-[10px] text-white/50 mt-1">Professional team</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all">
              <div className="text-3xl font-sans font-bold text-secondary mb-2">{totalCities}</div>
              <div className="text-white/70 text-xs font-black uppercase tracking-widest">Cities Covered</div>
              <div className="text-[10px] text-white/50 mt-1">Nationwide presence</div>
            </div>
          </div>

      {/* Optional: Decorative Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce pointer-events-auto">
        <div className="w-10 h-16 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
          <div className="w-1 h-3 bg-white rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  </div>
</section>

     
     <div className="py-20 px-4 bg-linear-to-b  to-white">
        <div className="max-w-7xl mx-auto">
          {/* Filters Section */}
          <div className="flex flex-col lg:flex-row gap-8 mb-16 p-8 bg-white backdrop-blur-2xl rounded-[2.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-white/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-2xl -mr-16 -mt-16"></div>
            
            {/* Search Input */}
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-secondary transition-colors" />
              <Input 
                placeholder="Search by name, address, city, or manager..." 
                className="pl-11 h-14 rounded-2xl border-gray-100 bg-white/80 focus:border-secondary focus:ring-secondary transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* City Filter */}
            <div className="flex flex-col gap-2 min-w-[200px]">
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-gray-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">City:</span>
              </div>
              <select 
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-secondary focus:border-transparent"
              >
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            
            {/* Status Filter */}
            <div className="flex flex-col gap-2 min-w-[200px]">
              <div className="flex items-center gap-2">
                <Filter className="w-3 h-3 text-gray-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Status:</span>
              </div>
              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-secondary focus:border-transparent"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Branches Grid */}
          {branches.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <div className="relative z-10">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MapPin className="w-12 h-12 text-gray-300" />
                </div>
                <h3 className="text-3xl font-sans font-bold text-primary mb-3">No Branches Available</h3>
              
                <Button 
                  onClick={fetchBranches}
                  className="rounded-full px-8 bg-primary hover:bg-primary/90 text-white font-bold tracking-widest text-[10px]"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  REFRESH BRANCHES
                </Button>
              </div>
            </div>
          ) : filteredBranches.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <div className="relative z-10">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-12 h-12 text-gray-300" />
                </div>
                <h3 className="text-3xl font-sans font-bold text-primary mb-3">No Matching Branches</h3>
                <p className="text-gray-500 font-light mb-8 max-w-md mx-auto">
                  No branches match your current filters. Try adjusting your search criteria.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => { setSearchQuery(""); setSelectedCity("All"); setSelectedStatus("All"); }}
                  className="rounded-full px-8 border-secondary text-secondary hover:bg-secondary hover:text-primary font-bold tracking-widest text-[10px]"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  CLEAR ALL FILTERS
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {filteredBranches.map((branch) => {
                const hoursStatus = getWorkingHoursStatus(branch.openingTime, branch.closingTime);
                
                return (
                  <Card key={branch.id} className="group overflow-hidden border-2 border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.04)] bg-white rounded-[3rem] hover:shadow-[0_30px_60px_rgba(0,0,0,0.12)] transition-all duration-700 relative hover:border-secondary/20">
                    {/* Status Badge */}
                    <div className="absolute top-6 right-6 z-20 flex flex-col gap-2">
                     
                      
                      {/* Hours Status */}
                      <div className={cn(
                        "backdrop-blur-md text-xs border-none px-3 py-1.5 rounded-xl font-black shadow-xl flex items-center gap-1.5",
                        hoursStatus.color
                      )}>
                        <div className={cn("w-2 h-2 rounded-full", hoursStatus.badge)}></div>
                        {hoursStatus.status}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 h-full">
                      {/* Branch Image */}
                      <div className="md:col-span-2 relative overflow-hidden">
                        <img 
                          src={branch.image} 
                          alt={branch.name}
                          className="w-full h-64 md:h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop';
                          }}
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        {/* Rating Overlay - CODE1 STYLE */}
                        <div className="absolute bottom-6 left-6 z-10">
                          <div className="bg-white/90 backdrop-blur-md text-black border-none px-3 py-1.5 rounded-xl font-black text-xs shadow-xl flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                            {branch.rating?.toFixed(1) || '4.8'}
                            <span className="text-muted-foreground text-[10px] font-medium">({branch.reviews || 0})</span>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-4 group-hover:translate-y-0">
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              className="bg-white/90 backdrop-blur-md text-black hover:bg-white rounded-xl p-2"
                              onClick={() => window.open(`tel:${branch.phone}`, '_blank')}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              className="bg-white/90 backdrop-blur-md text-black hover:bg-white rounded-xl p-2"
                              onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(branch.address)}`, '_blank')}
                            >
                              <Navigation className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Branch Details */}
                      <div className="md:col-span-3 p-8 flex flex-col justify-between">
                        <div className="space-y-6">
                          <div>
                            <div className="inline-flex items-center gap-2 border border-secondary/30 text-secondary text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full mb-3">
                              <Award className="w-2.5 h-2.5" />
                            {branch.country.toUpperCase()}
                            </div>
                            <h3 className="text-2xl font-sans font-bold text-primary group-hover:text-secondary transition-colors duration-300">
                              {branch.name}
                            </h3>
                            <p className="text-sm text-gray-600 flex items-center gap-2 mt-2">
                              <MapPin className="w-3.5 h-3.5 text-secondary shrink-0" />
                              <span className="line-clamp-2">{branch.address}</span>
                            </p>
                          </div>

                          {/* Branch Info Grid */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-4">
                              {/* Working Hours */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-3 text-sm">
                                  <Clock className="w-4 h-4 text-secondary" />
                                  <div>
                                    <div className="font-bold text-primary">Working Hours</div>
                                    <div className="text-xs text-gray-600">
                                      {branch.openingTime} - {branch.closingTime}
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Phone */}
                                <div className="flex items-center gap-3 text-sm">
                                  <Phone className="w-4 h-4 text-secondary" />
                                  <div>
                                    <div className="font-bold text-primary">Phone</div>
                                    <div className="text-xs text-gray-600">
                                      {formatPhoneNumber(branch.phone)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Manager Info */}
                            <div className="space-y-2">
                              <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Branch Manager</div>
                              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                                  <User className="w-5 h-5 text-secondary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold text-primary truncate">{branch.managerName}</div>
                                  <div className="text-xs text-gray-600 truncate">{branch.managerEmail}</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Features */}
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Amenities & Services</div>
                            <div className="flex flex-wrap gap-2">
                              {branch.features?.slice(0, 4).map((feature, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-primary/70 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 group-hover:bg-secondary/10 transition-colors">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-secondary" />
                                  {feature}
                                </div>
                              ))}
                              {branch.features && branch.features.length > 4 && (
                                <div className="text-[9px] font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                  +{branch.features.length - 4} more
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Description */}
                          {branch.description && branch.description.trim() !== '' && (
                            <div className="pt-4 border-t border-gray-100">
                              <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Description</div>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {branch.description}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-8 flex items-center justify-between border-t border-gray-50 mt-8">
                          <Button 
                            variant="link" 
                            onClick={() => handleViewDetails(branch.id, branch.name)}
                            className="p-0 h-auto text-primary font-black text-[10px] tracking-[0.2em] group/btn uppercase border-b border-transparent hover:border-secondary pb-1 transition-all"
                          >
                            <span className="flex items-center gap-2">
                              VIEW DETAILS 
                              <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-2 transition-transform" />
                            </span>
                          </Button>
                          <div className="flex gap-3">
                            <Button 
                              size="sm" 
                              className="bg-gray-100 hover:bg-gray-200 text-primary font-black rounded-2xl px-4 h-10 transition-all duration-300"
                              onClick={() => window.open(`mailto:${branch.email}`, '_blank')}
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

            {/* Stats Summary */}
          {filteredBranches.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Total Branches */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Branches</p>
                      <p className="text-2xl font-bold text-primary">{branches.length}</p>
                    </div>
                  </div>
                </div>
                
                {/* Active Branches */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Active Branches</p>
                      <p className="text-2xl font-bold text-green-600">{activeBranches}</p>
                    </div>
                  </div>
                </div>
                
                {/* Cities Covered */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                      <Navigation className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Cities Covered</p>
                      <p className="text-2xl font-bold text-secondary">{totalCities}</p>
                    </div>
                  </div>
                </div>
                
                {/* Managers */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Dedicated Managers</p>
                      <p className="text-2xl font-bold text-blue-600">{totalManagers}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Contact Info */}
              <div className="mt-6 bg-secondary/10 border border-secondary/20 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-primary">Need Help Finding a Branch?</p>
                    <p className="text-sm text-gray-600">
                      Contact our support team for assistance or more information about our locations.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="border-secondary text-secondary"
                      onClick={() => window.open('mailto:support@largify.com', '_blank')}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email Support
                    </Button>
                    <Button
                      className="bg-primary hover:bg-primary/90"
                      onClick={() => window.open('tel:+1234567890', '_blank')}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call Support
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Branch Details Sidebar - CODE1 STYLE */}
      <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <SheetContent className="w-full sm:max-w-2xl lg:max-w-3xl overflow-y-auto p-5 rounded-3xl h-[750px] m-auto">
          {selectedBranch ? (
            <>
              {/* Sheet Header */}
              <SheetHeader className="sr-only">
                <SheetTitle>Branch Details - {selectedBranch.name}</SheetTitle>
                <SheetDescription>
                  Detailed information about {selectedBranch.name} branch located at {selectedBranch.address}
                </SheetDescription>
              </SheetHeader>
              
              <div className="h-full">
                {/* Header with Image */}
                <div className="relative h-64">
                  <img 
                    src={selectedBranch.image} 
                    alt={selectedBranch.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"></div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-3xl font-sans font-bold text-white mb-2">
                      {selectedBranch.name}
                    </h2>
                    <div className="flex items-center gap-2 text-white/90">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedBranch.address}</span>
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="p-6 space-y-6">
                  {/* Stats Row - CODE1 STYLE */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-primary">{selectedBranch.rating?.toFixed(1) || '4.8'}</div>
                      <div className="text-xs text-gray-600">Rating</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-primary">{selectedBranch.reviews || 150}</div>
                      <div className="text-xs text-gray-600">Reviews</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-primary">{selectedBranch.status === 'active' ? 'Open' : 'Closed'}</div>
                      <div className="text-xs text-gray-600">Status</div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid grid-cols-3 mb-6">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="services">Services</TabsTrigger>
                      <TabsTrigger value="contact">Contact</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview" className="space-y-4">
                      <div>
                        <h3 className="font-bold text-lg mb-2">About This Branch</h3>
                        <p className="text-gray-600">
                          {selectedBranch.description || 'Premium grooming branch offering luxury services in a sophisticated environment.'}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="font-bold text-lg mb-2">Working Hours</h3>
                        <div className="bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Monday - Saturday</span>
                            <span className="font-bold">{selectedBranch.openingTime} - {selectedBranch.closingTime}</span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="font-medium">Sunday</span>
                            <span className="font-bold">10:00 - 17:00</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-bold text-lg mb-2">Amenities</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {selectedBranch.features?.map((feature, i) => (
                            <div key={i} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                              <CheckCircle2 className="w-4 h-4 text-secondary" />
                              <span className="text-sm">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                    
                    {/* SERVICES TAB */}
                    <TabsContent value="services" className="space-y-4">
                      {branchServices.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-xl">
                          <p className="text-gray-500">No services available for this branch.</p>
                         
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600">
                            Showing {branchServices.length} service{branchServices.length !== 1 ? 's' : ''} available at this branch
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {branchServices.map((service) => (
                              <div key={service.id} className="bg-gray-50 p-4 rounded-xl border border-gray-200 hover:border-secondary/30 transition-colors">
                                <div className="flex items-start gap-3">
                                  {service.imageUrl && (
                                    <img 
                                      src={service.imageUrl} 
                                      alt={service.name}
                                      className="w-16 h-16 rounded-lg object-cover"
                                      onError={(e) => {
                                        e.currentTarget.src = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop';
                                      }}
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <div className="font-bold text-primary text-lg">{service.name}</div>
                                        <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                                          {service.description}
                                        </div>
                                      </div>
                                      <Badge 
                                        variant={service.status === 'active' ? 'default' : 'secondary'}
                                        className="ml-2"
                                      >
                                        {service.status}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 mt-3">
                                      <div className="text-sm text-gray-500">
                                        <span className="font-bold text-primary text-lg">AED {service.price}</span>
                                      </div>
                                      <div className="text-sm text-gray-500 flex items-center">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {service.duration} min
                                      </div>
                                      <div className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded">
                                        {service.category}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="contact" className="space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                          <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                            <User className="w-6 h-6 text-secondary" />
                          </div>
                          <div>
                            <div className="font-bold text-primary">{selectedBranch.managerName}</div>
                            <div className="text-sm text-gray-600">Branch Manager</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <Button 
                            variant="outline" 
                            className="flex items-center gap-2 border-gray-200 hover:border-secondary hover:text-secondary"
                            onClick={() => window.open(`tel:${selectedBranch.phone}`, '_blank')}
                          >
                            <Phone className="w-4 h-4" />
                            Call Now
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            className="flex items-center gap-2 border-gray-200 hover:border-secondary hover:text-secondary"
                            onClick={() => openWhatsApp(selectedBranch.phone)}
                          >
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            className="flex items-center gap-2 border-gray-200 hover:border-secondary hover:text-secondary"
                            onClick={() => window.open(`mailto:${selectedBranch.email}`, '_blank')}
                          >
                            <Mail className="w-4 h-4" />
                            Email
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            className="flex items-center gap-2 border-gray-200 hover:border-secondary hover:text-secondary"
                            onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(selectedBranch.address)}`, '_blank')}
                          >
                            <Navigation className="w-4 h-4" />
                            Directions
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Quick Actions */}
                  <div className="pt-6 border-t">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        variant="outline"
                        className="flex-1 border-gray-200 hover:border-secondary hover:text-secondary"
                        onClick={() => handleShareBranch(selectedBranch)}
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Branch
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-600">No branch details available.</p>
            </div>
          )}
        </SheetContent>
      </Sheet>

     
    </div>
  );
}