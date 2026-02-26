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
    <div className="min-h-screen bg-[#fcfcfc]">
      <Header />

      {/* Error State */}
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
              className="mt-4 bg-primary hover:bg-primary/90"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Premium Hero */}
      <section className="relative py-32 px-4 overflow-hidden bg-gradient-to-br from-primary to-primary/90">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-secondary blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary blur-[120px] animate-pulse"></div>
          <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] rounded-full bg-white/10 blur-[80px] animate-pulse delay-1000"></div>
        </div>
        
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

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-secondary/20 px-4 py-2 rounded-full mb-6 border border-secondary/30 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-secondary animate-pulse" />
            <span className="text-secondary font-black tracking-[0.3em] uppercase text-[10px]">Our Presence</span>
            <Sparkles className="w-4 h-4 text-secondary animate-pulse" />
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-tight">
            Premium <span className="text-secondary italic relative">Locations
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-secondary/50 rounded-full"></div>
            </span>
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg font-light leading-relaxed mb-12">
            Experience luxury grooming at any of our strategically located branches.
          </p>
          
          {/* Real-time Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all">
              <div className="text-3xl font-serif font-bold text-secondary mb-2">{totalBranches}</div>
              <div className="text-white/70 text-xs font-black uppercase tracking-widest">Premium Locations</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all">
              <div className="text-3xl font-serif font-bold text-secondary mb-2">{activeBranches}</div>
              <div className="text-white/70 text-xs font-black uppercase tracking-widest">Active Branches</div>
              <div className="text-[10px] text-white/50 mt-1">Currently operational</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all">
              <div className="text-3xl font-serif font-bold text-secondary mb-2">{totalManagers}</div>
              <div className="text-white/70 text-xs font-black uppercase tracking-widest">Dedicated Managers</div>
              <div className="text-[10px] text-white/50 mt-1">Professional team</div>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all">
              <div className="text-3xl font-serif font-bold text-secondary mb-2">{totalCities}</div>
              <div className="text-white/70 text-xs font-black uppercase tracking-widest">Cities Covered</div>
              <div className="text-[10px] text-white/50 mt-1">Nationwide presence</div>
            </div>
          </div>
        </div>
      </section>

      <div className="py-20 px-4 bg-gradient-to-b from-gray-50/50 to-white">
        <div className="max-w-7xl mx-auto">
          {/* Filters Section */}
          <div className="flex flex-col lg:flex-row gap-8 mb-16 p-8 bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-white/20 relative overflow-hidden">
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
                <MapPin className="w-3 h-3 text-secondary" />
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
                <Filter className="w-3 h-3 text-secondary" />
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
                <h3 className="text-3xl font-serif font-bold text-primary mb-3">No Branches Available</h3>
                <p className="text-gray-500 font-light mb-8 max-w-md mx-auto">
                  No branches found in the database. Please add branches through Firebase console or contact administrator.
                </p>
                <Button 
                  onClick={fetchBranches}
                  className="rounded-full px-8 bg-primary hover:bg-primary/90 font-bold tracking-widest text-[10px]"
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
                <h3 className="text-3xl font-serif font-bold text-primary mb-3">No Matching Branches</h3>
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
                      <div className={cn(
                        "backdrop-blur-md text-xs border-none px-3 py-1.5 rounded-xl font-black shadow-xl flex items-center gap-1.5",
                        branch.status === 'active' ? 'bg-green-100 text-green-800' :
                        branch.status === 'inactive' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      )}>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          branch.status === 'active' ? 'bg-green-500' :
                          branch.status === 'inactive' ? 'bg-red-500' :
                          'bg-yellow-500'
                        )}></div>
                        {branch.status === 'active' ? 'ACTIVE' :
                         branch.status === 'inactive' ? 'INACTIVE' :
                         'COMING SOON'}
                      </div>
                      
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
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        
                        {/* Rating Overlay */}
                        <div className="absolute bottom-6 left-6 z-10">
                          <div className="bg-white/90 backdrop-blur-md text-primary border-none px-3 py-1.5 rounded-xl font-black text-xs shadow-xl flex items-center gap-1.5">
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
                              className="bg-white/90 backdrop-blur-md text-primary hover:bg-white rounded-xl p-2"
                              onClick={() => window.open(`tel:${branch.phone}`, '_blank')}
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              className="bg-white/90 backdrop-blur-md text-primary hover:bg-white rounded-xl p-2"
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
                            <h3 className="text-2xl font-serif font-bold text-primary group-hover:text-secondary transition-colors duration-300">
                              {branch.name}
                            </h3>
                            <p className="text-sm text-gray-600 flex items-center gap-2 mt-2">
                              <MapPin className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
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

      {/* Branch Details Sidebar */}
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="text-3xl font-serif font-bold text-white mb-2">
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
                  {/* Stats Row */}
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
                          <p className="text-sm text-gray-400 mt-2">
                            Please add services to this branch through Firebase console.
                          </p>
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
                            className="flex items-center gap-2"
                            onClick={() => window.open(`tel:${selectedBranch.phone}`, '_blank')}
                          >
                            <Phone className="w-4 h-4" />
                            Call Now
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            className="flex items-center gap-2"
                            onClick={() => openWhatsApp(selectedBranch.phone)}
                          >
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            className="flex items-center gap-2"
                            onClick={() => window.open(`mailto:${selectedBranch.email}`, '_blank')}
                          >
                            <Mail className="w-4 h-4" />
                            Email
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            className="flex items-center gap-2"
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
                        className="flex-1"
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

      {/* WhatsApp Floating Button */}
      <Button
        className="fixed bottom-24 right-6 z-40 rounded-full w-14 h-14 bg-green-500 hover:bg-green-600 shadow-xl"
        onClick={() => openWhatsApp('+1234567890')}
        title="Contact on WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>

      {/* Refresh Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={fetchBranches}
          className="rounded-full w-12 h-12 bg-primary hover:bg-primary/90 shadow-xl"
          title="Refresh data from Firebase"
        >
          <RefreshCw className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}