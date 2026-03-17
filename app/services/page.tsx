'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Scissors, Star, Clock, Search, Filter, Check, ShoppingCart, ChevronRight, Sparkles, Plus, X, Calendar, Users, MapPin, Award, Info, DollarSign, TrendingUp, Package, Shield, MessageCircle, Phone, Mail, Navigation, Share2, Loader2, RefreshCw, Building, CreditCard, Tag, Hash, CalendarClock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { create } from 'zustand';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  doc, 
  getDoc, 
  onSnapshot,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { useBranchStore } from '@/stores/branchStore';
import { useCMSStore } from '@/stores/cms.store';

// Types Definition
interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  categoryId: string;
  imageUrl: string;
  branchNames: string[];
  branches: string[];
  popularity: string;
  revenue: number;
  status: string;
  totalBookings: number;
  createdAt: any;
  updatedAt: any;
}

interface StaffMember {
  id: string;
  name: string;
  image: string;
  position?: string;
  avatar?: string;
  role?: string;
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
  branchNames?: string[];
  reviews: number;
}

// Services Store Definition with Real-time Updates
interface ServicesStore {
  services: Service[];
  error: string | null;
  hasFetchedInitialData: boolean;
  fetchServices: () => Promise<void>;
  fetchServiceById: (id: string) => Promise<Service | null>;
  setupRealtimeUpdates: () => () => void;
}

const useServicesStore = create<ServicesStore>((set, get) => ({
  services: [],
  error: null,
  hasFetchedInitialData: false,

  fetchServices: async () => {
    if (get().hasFetchedInitialData) return;
    
    set({ error: null });
    try {
      const servicesRef = collection(db, 'services');
      const q = query(servicesRef, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      
      const servicesData: Service[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        servicesData.push({
          id: doc.id,
          name: data.name || 'Unnamed Service',
          description: data.description || 'No description available',
          price: Number(data.price) || 0,
          duration: Number(data.duration) || 30,
          category: data.category || 'Uncategorized',
          categoryId: data.categoryId || '',
          imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1599351431247-f5094021186d?q=80&w=2070&auto=format&fit=crop',
          branchNames: Array.isArray(data.branchNames) ? data.branchNames : [],
          branches: Array.isArray(data.branches) ? data.branches : [],
          popularity: data.popularity || 'medium',
          revenue: Number(data.revenue) || 0,
          status: data.status || 'active',
          totalBookings: Number(data.totalBookings) || 0,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      
      set({ 
        services: servicesData, 
        hasFetchedInitialData: true 
      });
    } catch (error) {
      console.error('Error fetching services:', error);
      set({ 
        error: 'Failed to fetch services. Please try again later.' 
      });
    }
  },

  fetchServiceById: async (id: string): Promise<Service | null> => {
    try {
      const serviceRef = doc(db, 'services', id);
      const serviceSnap = await getDoc(serviceRef);
      
      if (serviceSnap.exists()) {
        const data = serviceSnap.data();
        return {
          id: serviceSnap.id,
          name: data.name || 'Unnamed Service',
          description: data.description || 'No description available',
          price: Number(data.price) || 0,
          duration: Number(data.duration) || 30,
          category: data.category || 'Uncategorized',
          categoryId: data.categoryId || '',
          imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1599351431247-f5094021186d?q=80&w=2070&auto=format&fit=crop',
          branchNames: Array.isArray(data.branchNames) ? data.branchNames : [],
          branches: Array.isArray(data.branches) ? data.branches : [],
          popularity: data.popularity || 'medium',
          revenue: Number(data.revenue) || 0,
          status: data.status || 'active',
          totalBookings: Number(data.totalBookings) || 0,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching service:', error);
      return null;
    }
  },

  setupRealtimeUpdates: () => {
    try {
      const servicesRef = collection(db, 'services');
      const q = query(servicesRef, orderBy('name', 'asc'));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const servicesData: Service[] = [];
        querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          servicesData.push({
            id: doc.id,
            name: data.name || 'Unnamed Service',
            description: data.description || 'No description available',
            price: Number(data.price) || 0,
            duration: Number(data.duration) || 30,
            category: data.category || 'Uncategorized',
            categoryId: data.categoryId || '',
            imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1599351431247-f5094021186d?q=80&w=2070&auto=format&fit=crop',
            branchNames: Array.isArray(data.branchNames) ? data.branchNames : [],
            branches: Array.isArray(data.branches) ? data.branches : [],
            popularity: data.popularity || 'medium',
            revenue: Number(data.revenue) || 0,
            status: data.status || 'active',
            totalBookings: Number(data.totalBookings) || 0,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        });
        
        set({ 
          services: servicesData, 
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

interface StaffStore {
  staff: StaffMember[];
  fetchStaff: () => Promise<void>;
}

const useStaffStore = create<StaffStore>((set) => ({
  staff: [],

  fetchStaff: async () => {
    try {
      const staffRef = collection(db, 'staff');
      const querySnapshot = await getDocs(staffRef);
      
      const staffData: StaffMember[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        
        let imageUrl = '/default-avatar.png';
        
        if (data.avatar) {
          imageUrl = data.avatar;
        } else if (data.imageUrl) {
          imageUrl = data.imageUrl;
        } else if (data.image) {
          imageUrl = data.image;
        } else if (data.photoURL) {
          imageUrl = data.photoURL;
        }
        
        staffData.push({
          id: doc.id,
          name: data.name || data.fullName || 'Unknown Staff',
          image: imageUrl,
          position: data.position || data.role || 'Barber',
          avatar: data.avatar,
          role: data.role,
        });
      });
      
      set({ staff: staffData });
    } catch (error) {
      console.error('Error fetching staff:', error);
      set({ staff: [] });
    }
  },
}));

// Booking Store with Cart Management
interface BookingStore {
  cartItems: CartItem[];
  addedServices: Set<string>;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  markServiceAdded: (serviceId: string) => void;
  markServiceRemoved: (serviceId: string) => void;
  isServiceInCart: (serviceId: string) => boolean;
}

const useBookingStore = create<BookingStore>((set, get) => ({
  cartItems: [],
  addedServices: new Set(),
  
  addToCart: (item: CartItem) => set((state) => ({ 
    cartItems: [...state.cartItems, item],
    addedServices: new Set(state.addedServices).add(item.id)
  })),
  
  removeFromCart: (id: string) => set((state) => ({
    cartItems: state.cartItems.filter(item => item.id !== id),
    addedServices: new Set([...state.addedServices].filter(serviceId => serviceId !== id))
  })),
  
  clearCart: () => set({ cartItems: [], addedServices: new Set() }),
  
  markServiceAdded: (serviceId: string) => set((state) => ({
    addedServices: new Set(state.addedServices).add(serviceId)
  })),
  
  markServiceRemoved: (serviceId: string) => set((state) => ({
    addedServices: new Set([...state.addedServices].filter(id => id !== serviceId))
  })),
  
  isServiceInCart: (serviceId: string) => get().addedServices.has(serviceId)
}));

// WhatsApp contact function
const openWhatsApp = (message: string) => {
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
};

// Helper function to truncate description to 10 words
const truncateDescription = (description: string, wordLimit: number = 8) => {
  if (!description) return '';
  const words = description.split(' ');
  if (words.length <= wordLimit) return description;
  return words.slice(0, wordLimit).join(' ') + '...';
};

// Get branch name from branch ID
const getBranchNameFromId = (branchId: string, branches: any[]) => {
  const branch = branches.find(b => b.id === branchId);
  return branch?.name || branchId;
};

// Format date function
const formatDate = (timestamp: any) => {
  if (!timestamp) return 'N/A';
  
  try {
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    if (timestamp instanceof Date) {
      return timestamp.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

// Main Component
export default function ServicesPage() {
  const router = useRouter();
  
  const { selectedBranch, branches, loading: branchesLoading, setSelectedBranch, fetchBranches } = useBranchStore();
  const { fetchCMSData, getPageHero } = useCMSStore();
  const servicesHero = getPageHero('services');
  
  const { 
    addToCart, 
    cartItems, 
    markServiceAdded, 
    markServiceRemoved,
    isServiceInCart,
    clearCart 
  } = useBookingStore();
  
  const { 
    services, 
    fetchServices, 
    fetchServiceById, 
    hasFetchedInitialData,
    setupRealtimeUpdates 
  } = useServicesStore();
  
  const { staff, fetchStaff } = useStaffStore();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [addedService, setAddedService] = useState<string | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState<string | null>(null);
  
  // Service details sidebar ke liye state
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isServiceSidebarOpen, setIsServiceSidebarOpen] = useState<boolean>(false);
  
  // Branch filter ke liye local state (UI mein show karne ke liye)
  const [showBranchFilter, setShowBranchFilter] = useState<boolean>(false);
  
  const hasSetupRealtimeRef = useRef<boolean>(false);

  // ===== CHAT LOGIC =====
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Keep first server/client render identical; apply persisted CMS hero after hydration.
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const heroForRender = isHydrated ? servicesHero : undefined;

  // Check login status
  useEffect(() => {
    fetchCMSData();
    const checkLogin = () => {
      const user = localStorage.getItem('user');
      setIsLoggedIn(!!user);
    };
    
    checkLogin();
    window.addEventListener('storage', checkLogin);
    return () => window.removeEventListener('storage', checkLogin);
  }, []);

  const handleChatClick = () => {
    if (isLoggedIn) {
      window.location.href = '/customer/chat';
    } else {
      setShowChatPopup(true);
    }
  };

  // Fetch branches on mount
  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  // Fetch services on mount
  useEffect(() => {
    const loadData = async () => {
      if (!hasFetchedInitialData) {
        await fetchServices();
        await fetchStaff();
      }
    };
    
    loadData();
  }, [fetchServices, fetchStaff, hasFetchedInitialData]);

  // Set up real-time updates for services
  useEffect(() => {
    if (!hasSetupRealtimeRef.current && hasFetchedInitialData) {
      const cleanup = setupRealtimeUpdates();
      hasSetupRealtimeRef.current = true;
      return cleanup;
    }
  }, [hasFetchedInitialData, setupRealtimeUpdates]);

  // DEBUG: Log branch changes
  useEffect(() => {
    console.log('🔍 Selected Branch:', selectedBranch);
    console.log('🔍 Total Services:', services.length);
    console.log('🔍 Filtered Services:', services.filter(s => 
      selectedBranch === 'all' || 
      (s.branchNames && s.branchNames.includes(selectedBranch)) ||
      (s.branches && s.branches.includes(selectedBranch))
    ).length);
  }, [selectedBranch, services]);

  // Get unique categories from services
  const categories = [
    { id: 'all', name: 'All Categories' },
    ...Array.from(new Set(services.map(s => s.category)))
      .filter((category): category is string => Boolean(category && category.trim() !== ''))
      .map(category => ({
        id: category.toLowerCase().replace(/\s+/g, '-'),
        name: category
      }))
  ];

  // ==================== FILTER SERVICES BY BRANCH ====================
  // Filter services based on selected branch AND other filters
  const filteredServices = services.filter(service => {
    // Category filter
    const matchesCategory = selectedCategory === 'all' || 
      service.category?.toLowerCase().replace(/\s+/g, '-') === selectedCategory;
    
    // Search filter
    const matchesSearch = searchQuery === '' || 
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      service.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Staff filter (abhi sirf placeholder)
    const matchesStaff = selectedStaff === 'all';
    
    // ===== BRANCH FILTER =====
    let matchesBranch = true;
    
    if (selectedBranch !== 'all') {
      if (service.branchNames && service.branchNames.length > 0) {
        matchesBranch = service.branchNames.includes(selectedBranch);
      } else if (service.branches && service.branches.length > 0) {
        // Convert branch IDs to names for comparison
        const branchNamesFromIds = service.branches.map(id => 
          getBranchNameFromId(id, branches)
        );
        matchesBranch = branchNamesFromIds.includes(selectedBranch) || 
                        service.branches.includes(selectedBranch);
      } else {
        matchesBranch = false;
      }
    }
    
    return matchesCategory && matchesSearch && matchesStaff && matchesBranch;
  });

  // Deduplicate services by name (same service offered at multiple branches) and sort alphabetically
  const displayServices = (() => {
    const seen = new Map<string, Service>();
    filteredServices.forEach(service => {
      const key = service.name.toLowerCase().trim();
      if (seen.has(key)) {
        const existing = seen.get(key)!;
        seen.set(key, {
          ...existing,
          branchNames: [...new Set([...existing.branchNames, ...service.branchNames])],
          branches: [...new Set([...existing.branches, ...service.branches])],
        });
      } else {
        seen.set(key, { ...service });
      }
    });
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  })();

  // Get current selected branch name for display
  const currentBranchName = selectedBranch === 'all' 
    ? 'All Branches' 
    : branches.find(b => b.name === selectedBranch)?.name || selectedBranch;

  // Handle branch change
  const handleBranchChange = (branchName: string) => {
    console.log('🔄 Changing branch to:', branchName);
    setSelectedBranch(branchName);
    setShowBranchFilter(true);
    setTimeout(() => setShowBranchFilter(false), 3000);
  };

  // Handle add to cart
  const handleAddToCart = (service: Service) => {
    setIsAddingToCart(service.id);

    const cartItem: CartItem = {
      id: service.id,
      name: service.name,
      category: service.category || 'Service',
      duration: service.duration.toString() || '0',
      price: service.price || 0,
      description: service.description || '',
      image: service.imageUrl || 'https://images.unsplash.com/photo-1599351431247-f5094021186d?q=80&w=2070&auto=format&fit=crop',
      rating: 5,
      reviews: 0,
      branchNames: service.branchNames || []
    };

    addToCart(cartItem);
    markServiceAdded(service.id);
    
    const currentCart = JSON.parse(localStorage.getItem('bookingCart') || '[]');
    const updatedCart = [...currentCart, cartItem];
    localStorage.setItem('bookingCart', JSON.stringify(updatedCart));
    
    setAddedService(service.id);
    
    setTimeout(() => {
      setAddedService(null);
      setIsAddingToCart(null);
    }, 2000);
  };

  // Handle View Cart
  const handleViewCart = () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty. Please add services first.');
      return;
    }
    router.push('/booking');
  };

  // Handle view service details
  const handleViewServiceDetails = async (serviceId: string) => {
    try {
      const service = await fetchServiceById(serviceId);
      if (service) {
        setSelectedService(service);
        setIsServiceSidebarOpen(true);
      }
    } catch (error) {
      console.error('Error loading service details:', error);
    }
  };

  // Handle share service
  const handleShareService = (service: Service) => {
    const shareText = `Check out ${service.name} - ${service.description}. Price: AED${service.price}. Duration: ${service.duration} minutes.`;
    
    if (navigator.share) {
      navigator.share({
        title: `${service.name} - Premium Grooming`,
        text: shareText,
        url: window.location.href,
      }).catch(err => console.log('Error sharing:', err));
    } else {
      navigator.clipboard.writeText(`${service.name}\n${shareText}\n${window.location.href}`).then(() => {
        alert('Service details copied to clipboard!');
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      <Header />

      {/* Branch Filter Notification */}
      {showBranchFilter && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-secondary text-primary px-4 py-2 rounded-full shadow-lg animate-in fade-in slide-in-from-top-5">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            <span className="font-bold text-sm">Showing services for: {currentBranchName}</span>
          </div>
        </div>
      )}

      {/* 3 BUTTONS */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4">
        {/* WhatsApp */}
        <a 
          href="https://wa.me/923001234567" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
          title="WhatsApp"
        >
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
            <path
              fill="#25D366"
              d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.78 2.7 15.57 3.71 17.08L2.09 21.91L7.06 20.33C8.55 21.24 10.27 21.72 12.04 21.72C17.5 21.72 21.95 17.27 21.95 11.81C21.95 6.35 17.5 2 12.04 2ZM12.04 20.09C10.46 20.09 8.92 19.65 7.58 18.83L7.32 18.68L4.43 19.57L5.34 16.77L5.18 16.5C4.3 15.12 3.81 13.53 3.81 11.91C3.81 7.37 7.5 3.68 12.04 3.68C16.58 3.68 20.27 7.37 20.27 11.91C20.27 16.45 16.58 20.09 12.04 20.09ZM16.46 13.95C16.18 13.81 14.95 13.21 14.69 13.12C14.43 13.03 14.24 12.98 14.05 13.26C13.86 13.54 13.33 14.09 13.17 14.27C13.01 14.45 12.85 14.47 12.57 14.33C12.29 14.19 11.46 13.91 10.48 13.05C9.7 12.37 9.16 11.51 9.02 11.23C8.88 10.95 9 10.79 9.13 10.66C9.25 10.53 9.4 10.33 9.53 10.17C9.66 10.01 9.71 9.89 9.79 9.73C9.87 9.57 9.82 9.43 9.74 9.31C9.66 9.19 9.11 7.98 8.9 7.5C8.69 7.02 8.48 7.07 8.32 7.07C8.16 7.07 7.99 7.07 7.83 7.07C7.67 7.07 7.41 7.13 7.19 7.39C6.97 7.65 6.35 8.29 6.35 9.58C6.35 10.87 7.22 12.11 7.37 12.3C7.52 12.49 9.09 14.83 11.5 15.94C12.69 16.52 13.59 16.79 14.28 16.97C15.06 17.16 15.79 17.09 16.36 16.88C16.93 16.67 17.67 16.15 17.88 15.53C18.09 14.91 18.09 14.38 18.04 14.28C17.99 14.18 17.85 14.11 17.68 14.04C17.52 13.99 16.74 14.09 16.46 13.95Z"
            />
          </svg>
        </a>
  
        {/* Phone */}
        <a 
          href="tel:+1234567890"
          className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
          title="Call Now"
        >
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 10.999h2C22 5.869 18.127 2 12.99 2v2C17.052 4 20 6.943 20 10.999z"/>
            <path d="M13 8c2.103 0 3 .897 3 3h2c0-3.225-1.775-5-5-5v2z"/>
            <path d="M16.5 13.5c-.3-.3-.7-.5-1.1-.5-.4 0-.8.1-1.1.4l-1.4 1.4c-1.1-.6-2.1-1.3-3-2.2-.9-.9-1.6-1.9-2.2-3l1.4-1.4c.3-.3.4-.7.4-1.1 0-.4-.1-.8-.4-1.1l-2-2c-.3-.3-.7-.5-1.1-.5-.4 0-.8.1-1.1.4L3.5 6.5c-.3.3-.5.7-.5 1.1 0 3.9 2.1 7.6 5 10.5 2.9 2.9 6.6 5 10.5 5 .4 0 .8-.2 1.1-.5l1.4-1.4c.3-.3.5-.7.5-1.1 0-.4-.2-.8-.5-1.1l-2-2z"/>
          </svg>
        </a>

        {/* Chatbot */}
        <button
          onClick={handleChatClick}
          className="flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
          title="Chat with Bot"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <defs>
              <linearGradient id="chatbot-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#667eea" />
                <stop offset="50%" stopColor="#764ba2" />
                <stop offset="100%" stopColor="#6b8cff" />
              </linearGradient>
            </defs>
            <circle cx="12" cy="12" r="10" stroke="url(#chatbot-gradient)" strokeWidth="1.5" fill="transparent"/>
            <path d="M20 12C20 16.4183 16.4183 20 12 20C10.5 20 9.1 19.6 7.9 18.9L4 20L5.1 16.1C4.4 14.9 4 13.5 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12Z" stroke="url(#chatbot-gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="white"/>
            <circle cx="9" cy="12" r="1" fill="url(#chatbot-gradient)" />
            <circle cx="12" cy="12" r="1" fill="url(#chatbot-gradient)" />
            <circle cx="15" cy="12" r="1" fill="url(#chatbot-gradient)" />
          </svg>
        </button>
      </div>

      {/* Chat Login Popup */}
      {showChatPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-60">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowChatPopup(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 w-full animate-in fade-in zoom-in duration-300">
            <button onClick={() => setShowChatPopup(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 bg-linear-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-2xl font-sans font-bold text-center text-gray-900 mb-2">Create Account First! ✋</h3>
            <Link href="/customer/login" className="block w-full text-center bg-linear-to-r from-purple-500 to-blue-500 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300" onClick={() => setShowChatPopup(false)}>
              Login / Sign Up
            </Link>
            <button onClick={() => setShowChatPopup(false)} className="block w-full text-center text-gray-500 text-sm mt-4 hover:text-gray-700">
              Maybe Later
            </button>
          </div>
        </div>
      )}

      {/* Premium Hero Section with Video Background */}
      <section className="relative py-32 px-4 overflow-hidden h-[350px] md:h-[400px]">
        <div className="absolute inset-0 w-full h-full">
          {heroForRender?.backgroundType === 'video' ? (
            <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
              <source src={heroForRender?.backgroundUrl || 'https://www.pexels.com/download/video/7291771/'} type="video/mp4" />
            </video>
          ) : (
            <img src={heroForRender?.backgroundUrl || ''} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/30 to-primary/70"></div>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10 h-full flex flex-col justify-center items-center">
          <div className="inline-block bg-white/10 backdrop-blur-md px-6 py-2 rounded-full mb-2 mt-8 border border-white/10">
            <span className="text-white font-black tracking-[0.5em] uppercase text-[10px]">{heroForRender?.badgeText || 'The Service Menu'}</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-sans font-bold text-white mb-2 leading-[0.85] tracking-tighter">
            <div className="mb-6">{heroForRender?.heading || 'Signature'}</div>
            <span className="text-secondary italic">{heroForRender?.headingHighlight || 'Rituals'}</span>
          </h1>
          
          <p className="text-secondary max-w-2xl mx-auto text-base font-light leading-relaxed italic mb-6">
            &quot;{heroForRender?.subHeading || "Artistry is not just a service, it's a transformation."}&quot;
          </p>
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <div className="h-px w-12 bg-white/20 hidden md:block"></div>
            <span className="text-white/50 font-black tracking-[0.3em] text-[10px] uppercase">
              {services.length} MASTER SERVICES
            </span>
            <div className="h-px w-12 bg-white/20 hidden md:block"></div>
            <span className="text-secondary/80 font-black tracking-[0.3em] text-[10px] uppercase">
              {branches.length} BRANCHES
            </span>
          </div>
        </div>
      </section>
     
      {/* Filters Section */}
      <section className="top-16 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 py-3 px-2 shadow-lg">
        <div className="max-w-7xl mx-auto space-y-3">
          {/* Search and Filter Row */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground group-focus-within:text-secondary transition-colors" />
              <Input 
                placeholder="Search services..." 
                className="pl-9 rounded-lg border-gray-200 bg-white/80 text-xs h-9 focus:ring-2 focus:ring-secondary focus:border-transparent transition-all shadow-sm"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="w-full md:w-56">
              <Select 
                value={selectedCategory} 
                onValueChange={(value) => setSelectedCategory(value)}
              >
                <SelectTrigger className="w-full h-9 border-gray-200 text-xs focus:ring-secondary/30 rounded-lg">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id} className="text-xs">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Branch Filter */}
            <div className="w-full md:w-56">
              <Select 
                value={selectedBranch} 
                onValueChange={handleBranchChange}
                disabled={branchesLoading}
              >
                <SelectTrigger className="w-full h-9 border-gray-200 text-xs focus:ring-secondary/30 rounded-lg">
                  <SelectValue placeholder={branchesLoading ? "Loading..." : "Select Branch"} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="all" className="text-xs">
                    <div className="flex items-center gap-2">
                      <Building className="w-3 h-3" />
                      <span>All Branches ({branches.length})</span>
                    </div>
                  </SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.name} className="text-xs">
                      <div className="flex items-center gap-2">
                        {branch.image && (
                          <div className="w-4 h-4 rounded-full overflow-hidden">
                            <img 
                              src={branch.image} 
                              alt={branch.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://via.placeholder.com/16";
                              }}
                            />
                          </div>
                        )}
                        <span>{branch.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* View Cart Button */}
            {cartItems.length > 0 && (
              <Button 
                onClick={handleViewCart}
                className="flex items-center gap-1 bg-secondary hover:bg-secondary/90 text-primary font-bold px-3 py-1.5 rounded-lg h-9 text-xs shadow-lg"
              >
                <ShoppingCart className="w-3 h-3" />
                CART ({cartItems.length})
              </Button>
            )}
          </div>

          {/* Active Filters Info */}
          <div className="flex items-center gap-2 text-[20px] text-gray-500 px-2">
           
            <Badge variant="outline" className="text-[15px] border-secondary/30 px-1.5 py-0">
              Branch: {currentBranchName}
            </Badge>
            {selectedCategory !== 'all' && (
              <Badge variant="outline" className="text-[8px] border-secondary/30 px-1.5 py-0">
                Cat: {categories.find(c => c.id === selectedCategory)?.name}
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="outline" className="text-[8px] border-secondary/30 px-1.5 py-0">
                "{searchQuery}"
              </Badge>
            )}
            {(selectedCategory !== 'all' || searchQuery) && (
              <button 
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="text-secondary hover:text-secondary/80 underline text-[8px]"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Services Grid Section */}
      <section className="py-10 px-4 bg-linear-to-b from-gray-50/50 to-white">
        <div className="max-w-7xl mx-auto">
          {/* Services Count */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-sans font-bold text-primary">
                Premium Services
                <span className="text-secondary ml-2 text-sm">({displayServices.length})</span>
              </h2>
              
            </div>
            {cartItems.length > 0 && (
              <Button 
                onClick={handleViewCart}
                className="bg-secondary hover:bg-secondary/90 text-primary font-bold text-xs h-7 px-3 rounded-lg"
              >
                <ShoppingCart className="w-3 h-3 mr-1" />
                Cart ({cartItems.length})
              </Button>
            )}
          </div>

          {/* Services Grid */}
          {services.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Scissors className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-xl font-sans font-bold text-primary mb-2">No Services Available</h3>
              <Button onClick={fetchServices} className="rounded-full px-5 bg-primary hover:bg-primary/90 font-bold tracking-widest text-[9px] h-8" type="button">
                <RefreshCw className="w-3 h-3 mr-1" />
                REFRESH
              </Button>
            </div>
          ) : displayServices.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Building className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-xl font-sans font-bold text-primary mb-2">No Services Found</h3>
              <p className="text-gray-500 font-light mb-4 max-w-md mx-auto text-xs">
                {selectedBranch !== 'all' 
                  ? `No services at ${selectedBranch}`
                  : 'No services match your filters.'}
              </p>
              <div className="flex gap-2 justify-center">
                {selectedBranch !== 'all' && (
                  <Button 
                    variant="outline" 
                    onClick={() => handleBranchChange('all')}
                    className="rounded-full px-4 border-secondary text-secondary hover:bg-secondary hover:text-primary font-bold tracking-widest text-[9px] h-8"
                  >
                    <Building className="w-3 h-3 mr-1" />
                    ALL BRANCHES
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => {setSelectedCategory('all'); setSearchQuery(''); setSelectedStaff('all');}}
                  className="rounded-full px-4 border-secondary text-secondary hover:bg-secondary hover:text-primary font-bold tracking-widest text-[9px] h-8"
                  type="button"
                >
                  <Filter className="w-3 h-3 mr-1" />
                  CLEAR
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {displayServices.map((service) => {
                const isServiceAdded = isServiceInCart(service.id);
                // Truncate description to 8 words
                const shortDescription = truncateDescription(service.description, 8);
                
                // Get branch display names
                const branchDisplayNames = service.branchNames?.length > 0 
                  ? service.branchNames 
                  : service.branches?.map(id => getBranchNameFromId(id, branches)) || [];
                
                return (
                  <Card 
                    key={service.id} 
                    className="group border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-500 rounded-lg overflow-hidden flex flex-col hover:border-secondary/20 h-full"
                  >
                    {/* Service Image - Further Compressed */}
                    <div className="relative aspect-3/2 overflow-hidden">
                      <img 
                        src={service.imageUrl} 
                        alt={service.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1599351431247-f5094021186d?q=80&w=2070&auto=format&fit=crop';
                        }}
                      />
                      
                      {/* Price Badge */}
                      <div className="absolute top-2 right-2">
                        <div className="bg-secondary/90 backdrop-blur-sm text-primary border-none px-2 py-1 rounded-md font-bold text-xs shadow-sm">
                          AED{service.price}
                        </div>
                      </div>
                      
                      {/* Duration Badge */}
                      <div className="absolute bottom-2 left-2">
                        <div className="bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-md text-[9px] font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {service.duration}min
                        </div>
                      </div>

                      
                    </div>

                    {/* Card Content - Minimal */}
                    <CardHeader className="px-3 pt-2 pb-0">
                      <CardTitle className="text-sm font-sans font-bold text-primary group-hover:text-secondary transition-colors duration-300 leading-tight line-clamp-1">
                        {service.name}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="px-3 py-2 flex-1 flex flex-col">
                      {/* Description - 8 words only */}
                      <p className="text-gray-600 text-[13px] font-light leading-relaxed line-clamp-2 mb-2">
                        {shortDescription}
                      </p>

                      {/* Branches - Compressed */}
                      {branchDisplayNames.length > 0 && (
                        <div className="mb-2">
                          <div className="flex flex-wrap gap-1">
                            {branchDisplayNames.slice(0, 1).map((branch, index) => (
                              <Badge 
                                key={index} 
                                variant="outline" 
                                className={cn(
                                  "text-[11px] px-1 py-0 rounded",
                                  branch === selectedBranch 
                                    ? "bg-secondary/20 border-secondary text-secondary font-bold" 
                                    : "border-gray-200 text-gray-600"
                                )}
                              >
                                {branch}
                              </Badge>
                            ))}
                            {branchDisplayNames.length > 1 && (
                              <Badge variant="outline" className="text-[7px] px-1 py-0 border-gray-200 text-gray-600">
                                +{branchDisplayNames.length - 1}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons - Compressed */}
                      <div className="mt-auto flex gap-1">
                        {isServiceAdded ? (
                          <Button 
                            onClick={handleViewCart}
                            className="flex-1 h-7 rounded-md font-bold text-[9px] transition-all duration-500 shadow-sm bg-secondary hover:bg-secondary/90 text-primary"
                            type="button"
                          >
                            <ShoppingCart className="w-3 h-3 mr-1" /> 
                            CART
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => handleAddToCart(service)}
                            disabled={isAddingToCart === service.id}
                            className={cn(
                              "flex-1 h-7 rounded-md font-bold text-[9px] transition-all duration-500 shadow-sm group/btn",
                              addedService === service.id 
                                ? "bg-green-600 hover:bg-green-600 text-white scale-95" 
                                : isAddingToCart === service.id
                                ? "bg-gray-400 text-white cursor-not-allowed"
                                : "bg-primary hover:bg-secondary hover:text-primary text-white"
                            )}
                            type="button"
                          >
                            {addedService === service.id ? (
                              <Check className="w-3 h-3 mx-auto" />
                            ) : (
                              <>
                                ADD
                              </>
                            )}
                          </Button>
                        )}
                        
                        <Button 
                          variant="outline" 
                          onClick={() => handleViewServiceDetails(service.id)}
                          className="w-7 h-7 rounded-md border-gray-200 text-primary hover:border-secondary hover:text-secondary hover:bg-secondary/10 transition-all duration-500"
                          type="button"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

    <Sheet open={isServiceSidebarOpen} onOpenChange={setIsServiceSidebarOpen}>
  <SheetContent className="w-full sm:max-w-2xl lg:max-w-3xl overflow-y-auto p-0 rounded-l-3xl">
    {selectedService ? (
      <>
        {/* ✅ Add SheetTitle for accessibility (visually hidden) */}
        <SheetTitle className="sr-only">
          Service Details - {selectedService.name}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Detailed information about {selectedService.name} service
        </SheetDescription>
        
        {/* Header with Image */}
        <div className="relative h-64 w-full">
          <img 
            src={selectedService.imageUrl} 
            alt={selectedService.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent"></div>
          
          {/* Close Button */}
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white w-8 h-8 rounded-full"
            onClick={() => setIsServiceSidebarOpen(false)}
            type="button"
          >
            <X className="w-4 h-4" />
          </Button>
          
          {/* Service Title Overlay */}
          <div className="absolute bottom-4 left-6 right-6">
            <Badge className="bg-secondary text-primary border-none mb-2 text-xs inline-block">
              {selectedService.category}
            </Badge>
            <h2 className="text-3xl font-sans font-bold text-white mb-1">
              {selectedService.name}
            </h2>
            <div className="flex items-center gap-3 text-white/80">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{selectedService.duration} min</span>
              </div>
             
            </div>
          </div>
        </div>

        {/* Content Area - Rest remains exactly the same */}
        <div className="p-6 space-y-6">
          {/* Price Card */}
          <div className="bg-linear-to-r from-secondary/20 to-secondary/5 p-4 rounded-xl border border-secondary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-secondary font-bold uppercase tracking-wider">Price</p>
                <p className="text-3xl font-sans font-bold text-primary">AED {selectedService.price}</p>
              </div>
              <div className="bg-secondary text-primary p-3 rounded-full">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Description - FULL */}
          <div className="space-y-2">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Info className="w-5 h-5 text-secondary" />
              Description
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {selectedService.description}
            </p>
          </div>

          {/* Branch Availability */}
          {(selectedService.branchNames?.length > 0 || selectedService.branches?.length > 0) && (
            <div className="space-y-2">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Building className="w-5 h-5 text-secondary" />
                Available Branches
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(selectedService.branchNames?.length > 0 
                  ? selectedService.branchNames 
                  : selectedService.branches?.map(id => getBranchNameFromId(id, branches)) || []
                ).map((branch, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border",
                      branch === selectedBranch 
                        ? "bg-secondary/10 border-secondary" 
                        : "bg-gray-50 border-gray-200"
                    )}
                  >
                    <MapPin className={cn(
                      "w-5 h-5",
                      branch === selectedBranch ? "text-secondary" : "text-gray-400"
                    )} />
                    <span className="font-medium flex-1">{branch}</span>
                    {branch === selectedBranch && (
                      <Badge className="bg-secondary text-primary text-[10px]">Current</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}


         

        

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t">
            {isServiceInCart(selectedService.id) ? (
              <Button 
                onClick={handleViewCart}
                className="col-span-2 bg-secondary hover:bg-secondary/90 text-primary font-bold py-6 rounded-xl text-base"
                type="button"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                VIEW CART ({cartItems.length})
              </Button>
            ) : (
              <Button 
                onClick={() => handleAddToCart(selectedService)}
                disabled={isAddingToCart === selectedService.id}
                className="col-span-2 bg-primary hover:bg-secondary hover:text-primary text-white font-bold py-6 rounded-xl text-base transition-all"
                type="button"
              >
                {isAddingToCart === selectedService.id ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ADDING...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    ADD TO BOOKING
                  </>
                )}
              </Button>
            )}
            
           
            
            
            
            
          </div>
        </div>
      </>
    ) : (
      <div className="p-8 text-center">
        <p className="text-gray-600">No service details available.</p>
      </div>
    )}
  </SheetContent>
</Sheet>
    </div>
  );
}