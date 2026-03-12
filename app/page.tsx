'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Scissors, MapPin, Star, Clock, Phone, Mail, Award, Users, 
  Calendar, ChevronRight, ShoppingBag, Ticket, ArrowRight,
  Quote, Instagram, CheckCircle2, ShieldCheck, Zap, Building,
  TrendingUp, Package, DollarSign, RefreshCw,
  Crown, Gem, Shield, Sparkles, Check, UserCheck,
  Grid3X3,
  Facebook
} from "lucide-react";
import { Header } from "@/components/shared/Header";
import Link from "next/link";
import Image from "next/image";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useBranchStore } from '@/stores/branchStore';
import { useCMSStore } from '@/stores/cms.store';
import { HeroSlider } from '@/components/shared/HeroSlider';

// ==================== STORE DEFINITION ====================
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
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  cost: number;
  category: string;
  categoryId: string;
  imageUrl: string;
  sku: string;
  rating: number;
  reviews: number;
  revenue: number;
  status: string;
  totalSold: number;
  totalStock: number;
  branchNames: string[];
  branches: string[];
}

interface StaffMember {
  id: string;
  name: string;
  image: string;
  role: string;
  rating: number;
  reviews: number;
  status: string;
  bio?: string;
  branchNames?: string[];
  branchId?: string;
}

interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  openingTime: string;
  closingTime: string;
  phone: string;
  email: string;
  status: string;
}

interface Offer {
  id: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  imageUrl: string;
  offerType: 'service' | 'product' | 'both';
  applicableProducts: string[];
  applicableServices: string[];
  branchNames: string[];
  branches: string[];
  status: 'active' | 'inactive' | 'expired';
  usageLimit: number | null;
  usedCount: number;
  validFrom: Date;
  validTo: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Membership {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  tier: 'basic' | 'premium' | 'vip' | 'exclusive';
  benefits: string[];
  branchNames: string[];
  branches: string[];
  status: 'active' | 'inactive';
  revenue: number;
  totalSubscriptions: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  branchId: string;
  branchName: string;
  branchCity: string;
  branches?: string[];
  branchNames?: string[];
  type: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface HomeStore {
  services: Service[];
  products: Product[];
  staff: StaffMember[];
  branches: Branch[];
  offers: Offer[];
  memberships: Membership[];
  categories: Category[];
  stats: {
    totalStaff: number;
    totalServices: number;
    totalProducts: number;
    totalBranches: number;
    totalOffers: number;
    totalMemberships: number;
    totalCategories: number;
  };
  lastFetched: number | null;
  
  fetchHomeData: () => Promise<void>;
  fetchServices: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchStaff: () => Promise<void>;
  fetchBranches: () => Promise<void>;
  fetchOffers: () => Promise<void>;
  fetchMemberships: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  calculateStats: () => void;
}

// Cache duration: 5 minutes (300000 ms) - means data shows instantly for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

const useHomeStore = create<HomeStore>()(
  persist(
    (set, get) => ({
      services: [],
      products: [],
      staff: [],
      branches: [],
      offers: [],
      memberships: [],
      categories: [],
      lastFetched: null,
      stats: {
        totalStaff: 0,
        totalServices: 0,
        totalProducts: 0,
        totalBranches: 0,
        totalOffers: 0,
        totalMemberships: 0,
        totalCategories: 0,
      },

      fetchHomeData: async () => {
        const now = Date.now();
        const lastFetched = get().lastFetched;
        
        // If data is cached and less than 5 minutes old, don't fetch again
        if (lastFetched && (now - lastFetched) < CACHE_DURATION) {
          console.log('📦 Using cached home data');
          return;
        }

        console.log('🔄 Fetching fresh home data');
        
        try {
          // Fetch all data in PARALLEL for maximum speed
          await Promise.all([
            get().fetchServices(),
            get().fetchProducts(),
            get().fetchStaff(),
            get().fetchBranches(),
            get().fetchOffers(),
            get().fetchMemberships(),
            get().fetchCategories()
          ]);
          
          get().calculateStats();
          
          // Update last fetched timestamp
          set({ lastFetched: Date.now() });
        } catch (error) {
          console.error('Error fetching home data:', error);
        }
      },

      fetchServices: async () => {
        try {
          const servicesRef = collection(db, 'services');
          const q = query(servicesRef, orderBy('createdAt', 'desc'));
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
            });
          });
          
          set({ services: servicesData });
        } catch (error) {
          console.error('Error fetching services:', error);
        }
      },

      fetchProducts: async () => {
        try {
          const productsRef = collection(db, 'products');
          const q = query(productsRef, orderBy('createdAt', 'desc'));
          const querySnapshot = await getDocs(q);
          
          const productsData: Product[] = [];
          querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            productsData.push({
              id: doc.id,
              name: data.name || 'Unnamed Product',
              description: data.description || 'No description available',
              price: Number(data.price) || 0,
              cost: Number(data.cost) || 0,
              category: data.category || 'Uncategorized',
              categoryId: data.categoryId || '',
              imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1512690196222-7c7d3f993c1b?q=80&w=2070&auto=format&fit=crop',
              sku: data.sku || 'N/A',
              rating: Number(data.rating) || 0,
              reviews: Number(data.reviews) || 0,
              revenue: Number(data.revenue) || 0,
              status: data.status || 'active',
              totalSold: Number(data.totalSold) || 0,
              totalStock: Number(data.totalStock) || 0,
              branchNames: Array.isArray(data.branchNames) ? data.branchNames : [],
              branches: Array.isArray(data.branches) ? data.branches : [],
            });
          });
          
          set({ products: productsData });
        } catch (error) {
          console.error('Error fetching products:', error);
        }
      },

      fetchStaff: async () => {
        try {
          const staffRef = collection(db, 'staff');
          const q = query(staffRef, orderBy('name', 'asc'));
          const querySnapshot = await getDocs(q);
          
          const staffData: StaffMember[] = [];
          querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            staffData.push({
              id: doc.id,
              name: data.name || 'Unknown Staff',
              image: data.imageUrl || data.avatar || data.photoURL || '/default-avatar.png',
              role: data.role || data.position || 'Barber',
              rating: Number(data.rating) || 4.5,
              reviews: Number(data.reviews) || 0,
              status: data.status || 'active',
              bio: data.description || data.experience || 'Professional barber with extensive experience.',
              branchNames: Array.isArray(data.branchNames) ? data.branchNames : [],
              branchId: data.branchId || '',
            });
          });
          
          set({ staff: staffData });
        } catch (error) {
          console.error('Error fetching staff:', error);
        }
      },

      fetchBranches: async () => {
        try {
          const branchesRef = collection(db, 'branches');
          const q = query(branchesRef, orderBy('name', 'asc'));
          const querySnapshot = await getDocs(q);
          
          const branchesData: Branch[] = [];
          querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            branchesData.push({
              id: doc.id,
              name: data.name || 'Unnamed Branch',
              address: data.address || 'Address not available',
              city: data.city || 'City not available',
              country: data.country || 'Country not available',
              openingTime: data.openingTime || '09:00',
              closingTime: data.closingTime || '18:00',
              phone: data.phone || 'N/A',
              email: data.email || 'N/A',
              status: data.status || 'active',
            });
          });
          
          set({ branches: branchesData });
        } catch (error) {
          console.error('Error fetching branches:', error);
        }
      },

      fetchOffers: async () => {
        try {
          const offersRef = collection(db, 'offers');
          const q = query(offersRef, orderBy('createdAt', 'desc'));
          const querySnapshot = await getDocs(q);
          
          const offersData: Offer[] = [];
          const now = new Date();
          
          querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            
            const validFrom = data.validFrom?.toDate() || new Date();
            const validTo = data.validTo?.toDate() || new Date();
            const createdAt = data.createdAt?.toDate() || new Date();
            const updatedAt = data.updatedAt?.toDate() || new Date();
            
            const isActive = data.status === 'active';
            const isNotExpired = now <= validTo;
            
            if (isActive && isNotExpired) {
              offersData.push({
                id: doc.id,
                title: data.title || 'Special Offer',
                description: data.description || 'Limited time offer',
                discountType: data.discountType || 'percentage',
                discountValue: Number(data.discountValue) || 0,
                imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=2070&auto=format&fit=crop',
                offerType: data.offerType || 'service',
                applicableProducts: Array.isArray(data.applicableProducts) ? data.applicableProducts : [],
                applicableServices: Array.isArray(data.applicableServices) ? data.applicableServices : [],
                branchNames: Array.isArray(data.branchNames) ? data.branchNames : [],
                branches: Array.isArray(data.branches) ? data.branches : [],
                status: data.status || 'active',
                usageLimit: data.usageLimit || null,
                usedCount: Number(data.usedCount) || 0,
                validFrom,
                validTo,
                createdAt,
                updatedAt
              });
            }
          });
          
          const finalOffers = offersData.slice(0, 8);
          set({ offers: finalOffers });
        } catch (error) {
          console.error('Error fetching offers:', error);
          set({ offers: [] });
        }
      },

      fetchMemberships: async () => {
        try {
          const membershipsRef = collection(db, 'memberships');
          const q = query(membershipsRef, orderBy('createdAt', 'desc'));
          const querySnapshot = await getDocs(q);
          
          const membershipsData: Membership[] = [];
          
          querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            
            const createdAt = data.createdAt?.toDate() || new Date();
            const updatedAt = data.updatedAt?.toDate() || new Date();
            
            const isActive = data.status === 'active';
            
            if (isActive) {
              membershipsData.push({
                id: doc.id,
                name: data.name || 'Membership',
                description: data.description || 'Premium membership plan',
                price: Number(data.price) || 0,
                duration: Number(data.duration) || 30,
                tier: data.tier || 'premium',
                benefits: Array.isArray(data.benefits) ? data.benefits : [],
                branchNames: Array.isArray(data.branchNames) ? data.branchNames : [],
                branches: Array.isArray(data.branches) ? data.branches : [],
                status: data.status || 'active',
                revenue: Number(data.revenue) || 0,
                totalSubscriptions: Number(data.totalSubscriptions) || 0,
                createdAt,
                updatedAt
              });
            }
          });
          
          set({ memberships: membershipsData });
        } catch (error) {
          console.error('Error fetching memberships:', error);
          set({ memberships: [] });
        }
      },

      fetchCategories: async () => {
        try {
          const categoriesRef = collection(db, 'categories');
          const q = query(categoriesRef, orderBy('createdAt', 'desc'));
          const querySnapshot = await getDocs(q);
          
          const categoriesData: Category[] = [];
          querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            const createdAt = data.createdAt?.toDate() || new Date();
            const updatedAt = data.updatedAt?.toDate() || new Date();
            
            categoriesData.push({
              id: doc.id,
              name: data.name || 'Unnamed Category',
              description: data.description || 'No description available',
              image: data.image || 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=2070&auto=format&fit=crop',
              branchId: data.branchId || '',
              branchName: data.branchName || 'Unknown Branch',
              branchCity: data.branchCity || 'Unknown City',
              branches: data.branches || [],
              branchNames: data.branchNames || [],
              type: data.type || 'general',
              isActive: data.isActive || true,
              createdAt,
              updatedAt
            });
          });
          
          const activeCategories = categoriesData.filter(cat => cat.isActive);
          set({ categories: activeCategories});
        } catch (error) {
          console.error('Error fetching categories:', error);
          set({ categories: [] });
        }
      },

      calculateStats: () => {
        const state = get();
        set({
          stats: {
            totalStaff: state.staff.length,
            totalServices: state.services.length,
            totalProducts: state.products.length,
            totalBranches: state.branches.length,
            totalOffers: state.offers.length,
            totalMemberships: state.memberships.length,
            totalCategories: state.categories.length
          }
        });
      },
    }),
    {
      name: 'home-storage', // unique name for localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        services: state.services,
        products: state.products,
        staff: state.staff,
        branches: state.branches,
        offers: state.offers,
        memberships: state.memberships,
        categories: state.categories,
        stats: state.stats,
        lastFetched: state.lastFetched,
      }),
    }
  )
);

// ==================== MAIN COMPONENT ====================
export default function Home() {
  const { selectedBranch, branches: allBranches } = useBranchStore();
  const activeBranch = selectedBranch === 'all'
    ? allBranches[0]
    : allBranches.find(b => b.name === selectedBranch) ?? allBranches[0];
  
  const { 
    services, 
    products, 
    staff, 
    branches, 
    offers,
    memberships,
    categories,
    stats,
    fetchHomeData 
  } = useHomeStore();

  // ===== CHAT LOGIC =====
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showBranchFilter, setShowBranchFilter] = useState(false);

  // Check login status
  useEffect(() => {
    const checkLogin = () => {
      const user = localStorage.getItem('user');
      setIsLoggedIn(!!user);
    };
    
    checkLogin();
    window.addEventListener('storage', checkLogin);
    return () => window.removeEventListener('storage', checkLogin);
  }, []);

  // Fetch data on mount - THIS WILL SHOW INSTANTLY FROM CACHE
  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  // CMS data
  const { 
    fetchCMSData, getActiveHeroSlides, getSectionByKey, settings: cmsSettings 
  } = useCMSStore();

  useEffect(() => {
    fetchCMSData();
  }, [fetchCMSData]);

  const heroSlides = getActiveHeroSlides();
  const svcSection = getSectionByKey('services');
  const prodSection = getSectionByKey('products');
  const offersSection = getSectionByKey('offers');
  const memberSection = getSectionByKey('memberships');
  const staffSection = getSectionByKey('staff');
  const branchSection = getSectionByKey('branches');
  const ctaSection = getSectionByKey('cta');
  const featuredSection = getSectionByKey('featured_in');
  const featuredBrands = (featuredSection?.extraData?.brands || 'GQ,VOGUE,ESQUIRE,FORBES,MEN\'S HEALTH').split(',').map(b => b.trim());

  // Show branch notification when selected branch changes
  useEffect(() => {
    if (selectedBranch !== 'all') {
      setShowBranchFilter(true);
      const timer = setTimeout(() => setShowBranchFilter(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [selectedBranch]);

  // Log for debugging
  useEffect(() => {
    console.log('🏠 Home - Selected Branch:', selectedBranch);
    console.log('🏠 Home - Filtered Services:', filteredServices.length);
    console.log('🏠 Home - Filtered Products:', filteredProducts.length);
    console.log('🏠 Home - Filtered Offers:', filteredOffers.length);
    console.log('🏠 Home - Filtered Memberships:', filteredMemberships.length);
    console.log('🏠 Home - Filtered Categories:', filteredCategories.length);
  }, [selectedBranch, services, products, offers, memberships, categories]);

  const handleChatClick = () => {
    if (isLoggedIn) {
      window.location.href = '/customer/chat';
    } else {
      setShowChatPopup(true);
    }
  };

  // Get current selected branch name for display
  const currentBranchName = selectedBranch === 'all' 
    ? 'All Branches' 
    : allBranches.find(b => b.name === selectedBranch)?.name || selectedBranch;

  // ==================== FILTER FUNCTIONS ====================
  
  // Filter services by branch
  const filteredServices = services.filter(service => {
    if (selectedBranch === 'all') return true;
    
    if (service.branchNames && service.branchNames.length > 0) {
      return service.branchNames.includes(selectedBranch);
    } else if (service.branches && service.branches.length > 0) {
      return service.branches.includes(selectedBranch);
    }
    return false;
  });

  // Filter products by branch
  const filteredProducts = products.filter(product => {
    if (selectedBranch === 'all') return true;
    
    if (product.branchNames && product.branchNames.length > 0) {
      return product.branchNames.includes(selectedBranch);
    } else if (product.branches && product.branches.length > 0) {
      return product.branches.includes(selectedBranch);
    }
    return false;
  });

  // Filter offers by branch
  const filteredOffers = offers.filter(offer => {
    if (selectedBranch === 'all') return true;
    
    if (offer.branchNames && offer.branchNames.length > 0) {
      return offer.branchNames.includes(selectedBranch);
    } else if (offer.branches && offer.branches.length > 0) {
      return offer.branches.includes(selectedBranch);
    }
    return false;
  });

  // Filter memberships by branch
  const filteredMemberships = memberships.filter(membership => {
    if (selectedBranch === 'all') return true;
    
    if (membership.branchNames && membership.branchNames.length > 0) {
      return membership.branchNames.includes(selectedBranch);
    } else if (membership.branches && membership.branches.length > 0) {
      return membership.branches.includes(selectedBranch);
    }
    return false;
  });

  // Filter categories by branch
  const filteredCategories = categories.filter(category => {
    if (selectedBranch === 'all') return true;
    if (category.branchNames && category.branchNames.length > 0) {
      return category.branchNames.includes(selectedBranch);
    }
    if (category.branches && category.branches.length > 0) {
      return category.branches.includes(selectedBranch);
    }
    // Backward compat for old single-field docs
    return category.branchName === selectedBranch || category.branchId === selectedBranch;
  });

  // Filter staff by branch
  const filteredStaff = selectedBranch === 'all'
    ? staff
    : staff.filter(member => {
        if (member.branchNames && member.branchNames.length > 0) {
          return member.branchNames.includes(selectedBranch);
        }
        return false;
      });

  // Calculate stats based on filtered data
  const totalActiveServices = filteredServices.filter(s => s.status === 'active').length;
  const totalActiveProducts = filteredProducts.filter(p => p.status === 'active').length;
  const totalActiveStaff = filteredStaff.filter(s => s.status === 'active').length;
  const totalActiveBranches = branches.filter(b => b.status === 'active').length;
  const totalActiveOffers = filteredOffers.length;
  const totalActiveMemberships = filteredMemberships.length;
  const totalActiveCategories = filteredCategories.length;

  const totalServicesRevenue = filteredServices.reduce((sum, service) => sum + service.revenue, 0);
  const totalProductsRevenue = filteredProducts.reduce((sum, product) => sum + product.revenue, 0);
  const totalRevenue = totalServicesRevenue + totalProductsRevenue;

  const getOfferBadgeColor = (offerType: string) => {
    switch (offerType) {
      case 'service': return 'bg-blue-500 text-white';
      case 'product': return 'bg-green-500 text-white';
      case 'both': return 'bg-purple-500 text-white';
      default: return 'bg-secondary text-white';
    }
  };

  const formatDiscount = (offer: Offer) => {
    if (offer.discountType === 'percentage') {
      return `${offer.discountValue}% OFF`;
    } else {
      return `AED ${offer.discountValue} OFF`;
    }
  };

  const getOfferBgColor = (offerType: string) => {
    switch (offerType) {
      case 'service': return 'bg-blue-600';
      case 'product': return 'bg-green-600';
      case 'both': return 'bg-purple-600';
      default: return 'bg-secondary';
    }
  };

  const getMembershipTierColor = (tier: string) => {
    switch (tier) {
      case 'basic': return 'bg-secondary';
      case 'premium': return 'bg-secondary';
      case 'vip': return 'bg-purple-600';
      case 'exclusive': return 'bg-gradient-to-r from-yellow-600 to-orange-600';
      default: return 'bg-gray-600';
    }
  };

  const getMembershipTierIcon = (tier: string) => {
    switch (tier) {
      case 'basic': return Shield;
      case 'premium': return Gem;
      case 'vip': return Crown;
      case 'exclusive': return Sparkles;
      default: return Shield;
    }
  };

  const formatDuration = (days: number) => {
    if (days >= 365) {
      const years = Math.floor(days / 365);
      return `${years} year${years > 1 ? 's' : ''}`;
    } else if (days >= 30) {
      const months = Math.floor(days / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      return `${days} day${days > 1 ? 's' : ''}`;
    }
  };

  const getFirstBranchName = (membership: Membership) => {
    if (membership.branchNames && membership.branchNames.length > 0) {
      return membership.branchNames[0];
    }
    
    if (membership.branches && membership.branches.length > 0) {
      const branchId = membership.branches[0];
      const branch = branches.find(b => b.id === branchId);
      return branch?.name || 'Multiple Branches';
    }
    
    return 'All Branches';
  };

  const getBranchCountText = (membership: Membership) => {
    if (membership.branches && membership.branches.length > 0) {
      return `${membership.branches.length} ${membership.branches.length === 1 ? 'Branch' : 'Branches'}`;
    }
    
    if (membership.branchNames && membership.branchNames.length > 0) {
      return `${membership.branchNames.length} ${membership.branchNames.length === 1 ? 'Branch' : 'Branches'}`;
    }
    
    return 'All Branches';
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      <Header />

      {/* ✅ Branch Filter Notification */}
      {showBranchFilter && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-secondary text-primary px-4 py-2 rounded-full shadow-lg animate-in fade-in slide-in-from-top-5">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            <span className="font-bold text-sm">Showing content for: {currentBranchName}</span>
          </div>
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4">
        {/* WhatsApp */}
        <a 
          href={`https://wa.me/${cmsSettings.whatsappNumber.replace(/[^0-9]/g, '')}`} 
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
          href={`tel:${cmsSettings.phoneNumber}`}
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
        <div className="fixed inset-0 flex items-center justify-center z-[60]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowChatPopup(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 w-full animate-in fade-in zoom-in duration-300">
            <button onClick={() => setShowChatPopup(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-2xl font-sans font-bold text-center text-gray-900 mb-2">Create Account First! ✋</h3>
            <Link href="/customer/login" className="block w-full text-center bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300" onClick={() => setShowChatPopup(false)}>
              Login / Sign Up
            </Link>
            <button onClick={() => setShowChatPopup(false)} className="block w-full text-center text-gray-500 text-sm mt-4 hover:text-gray-700">
              Maybe Later
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <HeroSlider slides={heroSlides}>
        <div className="text-center text-white px-4 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 animate-fade-in">
            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
            <span className="text-[10px] tracking-[0.3em] uppercase font-bold text-secondary">{cmsSettings.heroTagline}</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-cinzel font-bold mb-6 leading-[1.1] tracking-tight drop-shadow-2xl">
            {heroSlides[0]?.heading || 'Unleash Your'} <br />
            <span className="text-secondary italic">{heroSlides[0]?.subHeading || 'Raw Potential'}</span>
          </h1>
          
          {/* ✅ Branch Info in Hero */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <Badge className="bg-secondary/20 text-secondary border-secondary/30 px-4 py-2 rounded-full">
              <Building className="w-3 h-3 mr-2" />
              {currentBranchName}
            </Badge>
          </div>
          
          <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto font-light text-gray-300 leading-relaxed drop-shadow-lg">
            Primal grooming for the modern man. Embrace your inner strength with bold, authentic style.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
            <Button size="lg" asChild className="w-full sm:w-auto bg-secondary hover:bg-secondary/90 text-primary font-bold px-8 py-5 sm:px-10 sm:py-7 text-sm sm:text-base rounded-xl transition-all duration-500 shadow-[0_0_30px_rgba(197,160,89,0.3)] hover:shadow-[0_0_50px_rgba(197,160,89,0.5)] hover:scale-105 active:scale-95">
              <Link href={heroSlides[0]?.ctaLink || '/services'}>{heroSlides[0]?.ctaText || 'RESERVE YOUR SERVICE'}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto border-white/30 text-primary hover:bg-white hover:text-primary px-8 py-5 sm:px-10 sm:py-7 text-sm sm:text-base rounded-xl transition-all duration-500 backdrop-blur-sm hover:scale-105 active:scale-95">
              <Link href={heroSlides[0]?.ctaSecondaryLink || '/services'}>{heroSlides[0]?.ctaSecondaryText || 'VIEW OUR MENU'}</Link>
            </Button>
          </div>
        </div>
      </HeroSlider>

      {/* Stats Section */}
      <section className="py-8 md:py-10 border-b border-gray-100 bg-white relative z-20 -mt-6 md:-mt-10 mx-3 md:mx-10 rounded-2xl shadow-2xl">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            {[
              { 
                icon: Award, 
                label: "Master Barbers", 
                value: `${totalActiveStaff}+`, 
                desc: "Expertly Trained",
                data: totalActiveStaff
              },
              { 
                icon: Users, 
                label: "Active Services", 
                value: `${totalActiveServices}+`, 
                desc: "Premium Offerings",
                data: totalActiveServices
              },
              { 
                icon: MapPin, 
                label: "Luxury Studios", 
                value: `${totalActiveBranches}+`, 
                desc: "Prime Locations",
                data: totalActiveBranches
              },
             
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center mb-3 group-hover:bg-secondary group-hover:text-primary transition-all duration-500">
                  <stat.icon className="w-6 h-6 text-secondary group-hover:text-primary transition-colors" />
                </div>
                <span className="text-2xl font-sans font-bold text-primary mb-0.5">{stat.value}</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold mb-1">{stat.label}</span>
                <span className="text-[9px] text-muted-foreground font-medium">{stat.desc}</span>
                <div className="w-16 h-1 bg-secondary/20 rounded-full mt-2">
                  <div 
                    className="h-full bg-secondary rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, (stat.data || 0) * 10)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured In Section */}
      {featuredSection?.isVisible !== false && (
      <section className="py-10 md:py-12 bg-white border-b border-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-6 md:mb-8 font-bold">{featuredSection?.subHeading || 'As Featured In'}</p>
          <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10 md:gap-20 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
            {featuredBrands.map((brand) => (
              <span key={brand} className="text-xl sm:text-2xl md:text-3xl font-sans font-black tracking-tighter text-primary">{brand}</span>
            ))}
          </div>
        </div>
      </section>
      )}


     {/* Services Section */}
{(svcSection?.isVisible !== false) && (
<section className="py-16 px-4 bg-gray-50">
  <div className="max-w-7xl mx-auto">
    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
      <div className="space-y-2">
        <div className="inline-block bg-secondary/10 px-3 py-1 rounded-full">
          <span className="text-secondary font-bold tracking-[0.2em] uppercase text-[10px]">{svcSection?.badgeText || 'Signature Collection'}</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-cinzel font-bold text-primary">{svcSection?.heading || 'Bespoke Services'}</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-secondary/30 text-secondary">
            {filteredServices.length} Services Available
          </Badge>
          {selectedBranch !== 'all' && (
            <Badge className="bg-secondary/10 text-secondary border-secondary/30">
              <Building className="w-3 h-3 mr-1" />
              {currentBranchName}
            </Badge>
          )}
        </div>
      </div>
      <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white rounded-full px-6 py-3 text-xs font-bold tracking-widest group transition-all duration-500">
        <Link href={svcSection?.ctaLink || '/services'} className="flex items-center">
          {svcSection?.ctaText || 'VIEW ALL'} <ChevronRight className="ml-1 w-3 h-3 transition-transform group-hover:translate-x-1" />
        </Link>
      </Button>
    </div>

    {filteredServices.length === 0 ? (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
        <Scissors className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-xl font-sans font-bold text-gray-400 mb-2">
          {selectedBranch !== 'all' ? 'No Services in this Branch' : 'No Services Available'}
        </h3>
      </div>
    ) : (
      <Carousel 
        opts={{ 
          align: "start",
          loop: true,
          slidesToScroll: 1
        }} 
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {filteredServices.map((service) => (
            <CarouselItem key={service.id} className="pl-4 md:basis-1/2 lg:basis-1/4">
              <div className="group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                {/* Image Container */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                  <img 
                    src={service.imageUrl} 
                    alt={service.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1599351431247-f5094021186d?q=80&w=2070&auto=format&fit=crop';
                    }}
                  />
                  
                  {/* Dark Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Price Badge - Always visible */}
                  <div className="absolute top-3 right-3">
                    <div className="bg-white/90 backdrop-blur-sm text-primary px-3 py-1 rounded-full text-sm font-bold shadow-md">
                      AED {service.price}
                    </div>
                  </div>
                  
                  {/* Duration Badge - Always visible */}
                  <div className="absolute top-3 left-3">
                    <div className="bg-white/90 backdrop-blur-sm text-primary px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {service.duration} min
                    </div>
                  </div>
                  
                  {/* Book Button - Appears on Hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button 
                      asChild 
                      className="bg-secondary hover:bg-secondary/90 text-primary font-bold px-6 py-3 rounded-full shadow-xl transform scale-90 group-hover:scale-100 transition-transform duration-300"
                    >
                      <Link href={`/booking?service=${service.id}`}>
                        BOOK NOW
                      </Link>
                    </Button>
                  </div>
                </div>
                
                {/* Service Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-sans font-bold text-primary line-clamp-1">
                      {service.name}
                    </h3>
                    <Badge variant="outline" className="text-[9px] uppercase tracking-wider text-secondary border-secondary/30">
                      {service.category}
                    </Badge>
                  </div>
                  
                  {/* Branch Indicator */}
                  {service.branchNames && service.branchNames.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                      <MapPin className="w-3 h-3 text-secondary" />
                      <span className="truncate">{service.branchNames[0]}</span>
                      {service.branchNames.length > 1 && (
                        <span>+{service.branchNames.length - 1}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Navigation Buttons */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <CarouselPrevious className="static translate-y-0 w-10 h-10 rounded-full border border-secondary/30 text-secondary hover:bg-secondary hover:text-primary transition-all duration-300" />
          <CarouselNext className="static translate-y-0 w-10 h-10 rounded-full border border-secondary/30 text-secondary hover:bg-secondary hover:text-primary transition-all duration-300" />
        </div>
      </Carousel>
    )}
  </div>
</section>
)}
     {/* Products Section */}
{(prodSection?.isVisible !== false) && (
<section className="py-20 px-4 bg-[#0f0f0f] text-white relative overflow-hidden">
  <div className="absolute top-0 right-0 w-1/2 h-full bg-secondary/5 blur-[150px] pointer-events-none"></div>
  <div className="max-w-7xl mx-auto relative z-10">
    <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
      <div className="space-y-3">
        <div className="inline-block bg-secondary/20 px-3 py-1 rounded-full border border-secondary/30">
          <span className="text-secondary font-bold tracking-[0.2em] uppercase text-[10px]">{prodSection?.badgeText || 'Premium Apothecary'}</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-cinzel font-bold text-white">{prodSection?.heading || 'Grooming Essentials'}</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-white/20 text-white text-xs">
            {filteredProducts.length} Premium Products
          </Badge>
          {selectedBranch !== 'all' && (
            <Badge className="bg-secondary/20 text-secondary border-secondary/30">
              <Building className="w-3 h-3 mr-1" />
              {currentBranchName}
            </Badge>
          )}
        </div>
      </div>
      <Button asChild variant="outline" className="border-white/20 text-black bg-white hover:bg-secondary hover:text-primary hover:border-secondary rounded-full px-6 py-5 font-bold tracking-widest group transition-all duration-500">
        <Link href="/products" className="flex items-center text-xs">
          SHOP ALL <ChevronRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </Button>
    </div>

    {filteredProducts.length === 0 ? (
      <div className="text-center py-16 bg-white/5 rounded-3xl border border-dashed border-white/10">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-xl font-sans font-bold text-gray-300 mb-2">
          {selectedBranch !== 'all' ? 'No Products in this Branch' : 'No Products Available'}
        </h3>
      </div>
    ) : (
      <Carousel 
        opts={{ 
          align: "start",
          loop: true,
          slidesToScroll: 1
        }} 
        className="w-full"
      >
        <CarouselContent className="-ml-5">
          {filteredProducts.map((product) => (
            <CarouselItem key={product.id} className="pl-5 md:basis-1/2 lg:basis-1/4">
              <div className="group cursor-pointer bg-white/[0.03] p-5 border border-white/10 rounded-2xl hover:bg-white/[0.07] hover:border-secondary/50 transition-all duration-500 h-full">
                <div className="relative aspect-square overflow-hidden mb-4 rounded-xl bg-white/5">
                  <img 
                    src={product.imageUrl || "https://images.unsplash.com/photo-1512690196222-7c7d3f993c1b?q=80&w=2070&auto=format&fit=crop"} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1512690196222-7c7d3f993c1b?q=80&w=2070&auto=format&fit=crop';
                    }}
                  />
                  {product.totalStock <= 5 && (
                    <div className="absolute top-3 left-3 bg-secondary text-primary px-2 py-0.5 rounded-full text-[8px] font-black tracking-widest uppercase shadow-lg">
                      LIMITED
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                    <Button asChild className="bg-white text-primary hover:bg-secondary hover:text-primary rounded-full w-10 h-10 p-0 shadow-xl">
                      <Link href={`/products#${product.id}`}>
                        <ShoppingBag className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-[8px] uppercase tracking-[0.2em] text-gray-500 font-black border-gray-700 px-2 py-0.5">
                      {product.category}
                    </Badge>
                    <span className="text-secondary font-black text-base">AED {product.price}</span>
                  </div>
                  
                  <h4 className="text-lg font-sans font-bold group-hover:text-secondary transition-colors duration-300 truncate">
                    {product.name}
                  </h4>
                  
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={cn(
                          "w-2.5 h-2.5", 
                          s <= Math.floor(product.rating) ? "fill-secondary text-secondary" : "text-gray-700"
                        )} />
                      ))}
                    </div>
                    <span className="text-[9px] font-black text-gray-400">{product.rating.toFixed(1)}</span>
                    <span className="text-[8px] text-gray-600">({product.reviews})</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-[9px] text-gray-500 pt-1">
                    <span>SKU: {product.sku}</span>
                    <span>Stock: {product.totalStock}</span>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Navigation Buttons - Centered */}
        <div className="flex justify-center gap-3 mt-8">
          <CarouselPrevious className="static translate-y-0 w-10 h-10 rounded-full border border-white/20 text-white hover:bg-secondary hover:text-primary hover:border-secondary transition-all duration-300" />
          <CarouselNext className="static translate-y-0 w-10 h-10 rounded-full border border-white/20 text-white hover:bg-secondary hover:text-primary hover:border-secondary transition-all duration-300" />
        </div>
      </Carousel>
    )}
  </div>
</section>
)}

    
    {/* Offers Section */}
{(offersSection?.isVisible !== false) && (
<section className="py-16 px-4 bg-gray-50/50 relative overflow-hidden">
  <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
  <div className="max-w-7xl mx-auto relative z-10">
    <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
      <div className="space-y-2">
        <div className="inline-block bg-secondary/10 px-3 py-1 rounded-full">
          <span className="text-secondary font-bold tracking-[0.2em] uppercase text-[10px]">{offersSection?.badgeText || 'Active Promotions'}</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-cinzel font-bold text-primary">{offersSection?.heading || 'Member Rewards'}</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-secondary/30 text-secondary text-xs">
            {filteredOffers.length} Active Offers
          </Badge>
          {selectedBranch !== 'all' && (
            <Badge className="bg-secondary/10 text-secondary border-secondary/30">
              <Building className="w-3 h-3 mr-1" />
              {currentBranchName}
            </Badge>
          )}
        </div>
      </div>
      <p className="text-muted-foreground max-w-md text-sm font-light">
        {offersSection?.description || 'Unlock premium benefits and exclusive savings designed for our most loyal patrons.'}
      </p>
    </div>
    
    {filteredOffers.length === 0 ? (
      <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
        <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-xl font-sans font-bold text-gray-400 mb-2">
          {selectedBranch !== 'all' ? 'No Offers in this Branch' : 'No Offers Available'}
        </h3>
      </div>
    ) : (
      <Carousel 
        opts={{ 
          align: "start", 
          loop: true,
          slidesToScroll: 1
        }} 
        className="w-full"
      >
        <CarouselContent className="-ml-5">
          {filteredOffers.map((offer) => {
            const discountText = formatDiscount(offer);
            const offerBgColor = getOfferBgColor(offer.offerType);
            
            return (
              <CarouselItem key={offer.id} className="pl-5 md:basis-1/2 lg:basis-1/4">
                <div className={cn(
                  "p-6 rounded-2xl text-white relative overflow-hidden group cursor-pointer transition-all duration-500 hover:shadow-[0_15px_30px_rgba(0,0,0,0.1)] hover:-translate-y-1 h-full",
                  offerBgColor
                )}>
                  {offer.usageLimit && (
                    <div className="absolute top-3 left-3 bg-black/30 backdrop-blur-sm text-white text-[8px] font-bold px-2 py-0.5 rounded-full z-20">
                      {offer.usedCount}/{offer.usageLimit}
                    </div>
                  )}
                  
                  <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-125 group-hover:rotate-45 transition-all duration-700">
                    <Ticket className="w-20 h-20 rotate-12" />
                  </div>
                  
                  {offer.imageUrl && (
                    <div className="absolute inset-0 opacity-20">
                      <img 
                        src={offer.imageUrl} 
                        alt={offer.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                      <Badge className={cn(
                        "text-[8px] font-black uppercase tracking-wider border-0 px-2 py-0.5",
                        getOfferBadgeColor(offer.offerType)
                      )}>
                        {offer.offerType}
                      </Badge>
                    </div>
                    
                    <div>
                      <span className="text-[9px] font-bold tracking-widest opacity-70 uppercase block mb-1">
                        {offer.branchNames?.length > 0 
                          ? `${offer.branchNames[0]}${offer.branchNames.length > 1 ? ` +${offer.branchNames.length - 1}` : ''}`
                          : 'All Branches'}
                      </span>
                      <h4 className="text-3xl font-sans font-bold">{discountText}</h4>
                      <h5 className="text-base font-semibold mt-1 line-clamp-1">{offer.title}</h5>
                    </div>
                    
                    <p className="text-xs opacity-90 line-clamp-2">
                      {offer.description}
                    </p>
                    
                    <div className="pt-3 flex items-center justify-between border-t border-white/20">
                      <div className="space-y-1">
                        <span className="text-[8px] uppercase tracking-widest opacity-60">Valid Until</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span className="text-[10px] font-semibold">
                            {offer.validTo.toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full bg-white/10 hover:bg-white/20 text-white w-7 h-7"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        
        {/* Navigation Buttons - Centered */}
        <div className="flex justify-center gap-3 mt-8">
          <CarouselPrevious className="static translate-y-0 w-10 h-10 rounded-full border border-secondary/30 text-secondary hover:bg-secondary hover:text-primary transition-all duration-300" />
          <CarouselNext className="static translate-y-0 w-10 h-10 rounded-full border border-secondary/30 text-secondary hover:bg-secondary hover:text-primary transition-all duration-300" />
        </div>
      </Carousel>
    )}
  </div>
</section>
)}

     {/* Memberships Section */}
{(memberSection?.isVisible !== false) && (
<section className="py-16 px-4 bg-white relative overflow-hidden">
  <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/diamond.png')] opacity-[0.02] pointer-events-none"></div>
  <div className="max-w-7xl mx-auto relative z-10">
    <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
      <div className="space-y-2">
        <div className="inline-block bg-secondary/10 px-3 py-1 rounded-full">
          <span className="text-secondary font-bold tracking-[0.2em] uppercase text-[10px]">{memberSection?.badgeText || 'Elite Access'}</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-cinzel font-bold text-primary">{memberSection?.heading || 'Exclusive Memberships'}</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-secondary/30 text-secondary text-xs">
            {filteredMemberships.length} Premium Plans
          </Badge>
          {selectedBranch !== 'all' && (
            <Badge className="bg-secondary/10 text-secondary border-secondary/30">
              <Building className="w-3 h-3 mr-1" />
              {currentBranchName}
            </Badge>
          )}
        </div>
      </div>
      <p className="text-muted-foreground max-w-md text-sm font-light">
        {memberSection?.description || 'Join our elite community and unlock unprecedented benefits, priority access, and exclusive privileges.'}
      </p>
    </div>
    
    {filteredMemberships.length === 0 ? (
      <div className="text-center py-16 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
        <Crown className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-xl font-sans font-bold text-gray-400 mb-2">
          {selectedBranch !== 'all' ? 'No Memberships in this Branch' : 'No Memberships Available'}
        </h3>
      </div>
    ) : (
      <Carousel 
        opts={{ 
          align: "start", 
          loop: true,
          slidesToScroll: 1
        }} 
        className="w-full"
      >
        <CarouselContent className="-ml-5">
          {filteredMemberships.map((membership) => {
            const TierIcon = getMembershipTierIcon(membership.tier);
            const membershipBgColor = getMembershipTierColor(membership.tier);
            const durationText = formatDuration(membership.duration);
            const branchName = getFirstBranchName(membership);
            const branchCountText = getBranchCountText(membership);
            
            return (
              <CarouselItem key={membership.id} className="pl-5 md:basis-1/2 lg:basis-1/4">
                <div className={cn(
                  "p-6 rounded-2xl text-white relative overflow-hidden group cursor-pointer transition-all duration-500 hover:shadow-[0_15px_30px_rgba(0,0,0,0.1)] hover:-translate-y-1 h-full",
                  membershipBgColor
                )}>
                  {membership.totalSubscriptions > 10 && (
                    <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-sm text-white text-[8px] font-bold px-2 py-0.5 rounded-full z-20">
                      POPULAR
                    </div>
                  )}
                  
                  <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-125 group-hover:rotate-45 transition-all duration-700">
                    <Crown className="w-20 h-20 rotate-12" />
                  </div>
                  
                  <div className="relative z-10 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                        <TierIcon className="w-4 h-4 text-white" />
                      </div>
                      <Badge className={cn(
                        "text-[8px] font-black uppercase tracking-wider border-0 px-2 py-0.5",
                        membership.tier === 'exclusive' 
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-black'
                          : 'bg-white/20 text-white'
                      )}>
                        {membership.tier}
                      </Badge>
                    </div>
                    
                    <div>
                      <span className="text-[9px] font-bold tracking-widest opacity-70 uppercase block mb-1">
                        {durationText} • {branchName}
                      </span>
                      <h4 className="text-3xl font-sans font-bold">AED {membership.price}</h4>
                      <h5 className="text-base font-semibold mt-1 line-clamp-1">{membership.name}</h5>
                    </div>
                    
                    <p className="text-xs opacity-90 line-clamp-2">
                      {membership.description}
                    </p>
                    
                    <div className="space-y-1.5">
                      <span className="text-[8px] uppercase tracking-widest opacity-60 block">Key Benefits</span>
                      <div className="space-y-1">
                        {membership.benefits.slice(0, 2).map((benefit, index) => (
                          <div key={index} className="flex items-center gap-1.5">
                            <Check className="w-2.5 h-2.5 text-green-300 shrink-0" />
                            <span className="text-[9px] opacity-90 line-clamp-1">{benefit}</span>
                          </div>
                        ))}
                        {membership.benefits.length > 2 && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 flex items-center justify-center">
                              <div className="w-1 h-1 rounded-full bg-white/50"></div>
                            </div>
                            <span className="text-[8px] opacity-70">
                              +{membership.benefits.length - 2} more
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="pt-3 flex items-center justify-between border-t border-white/20">
                      <div className="space-y-1">
                        <span className="text-[8px] uppercase tracking-widest opacity-60">Available At</span>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span className="text-[9px] font-semibold">
                            {branchCountText}
                          </span>
                        </div>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full bg-white/10 hover:bg-white/20 text-white w-7 h-7"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        
        {/* Navigation Buttons - Centered */}
        <div className="flex justify-center gap-3 mt-8">
          <CarouselPrevious className="static translate-y-0 w-10 h-10 rounded-full border border-secondary/30 text-secondary hover:bg-secondary hover:text-primary transition-all duration-300" />
          <CarouselNext className="static translate-y-0 w-10 h-10 rounded-full border border-secondary/30 text-secondary hover:bg-secondary hover:text-primary transition-all duration-300" />
        </div>
      </Carousel>
    )}
  </div>
</section>
)}

     
     {/* Staff Section */}
{(staffSection?.isVisible !== false) && (
<section className="py-16 px-4 bg-gray-50/50 overflow-hidden relative">
  <div className="max-w-7xl mx-auto relative z-10">
    <div className="text-center mb-10">
      <div className="inline-block bg-secondary/10 px-3 py-1 rounded-full mb-4">
        <span className="text-secondary font-bold tracking-[0.2em] uppercase text-[10px]">{staffSection?.badgeText || 'The Artisans'}</span>
      </div>
      <h2 className="text-3xl md:text-4xl font-cinzel font-bold text-primary mb-3">{staffSection?.heading || 'Meet The Masters'}</h2>
      <p className="text-muted-foreground max-w-2xl mx-auto font-light text-sm">
        {staffSection?.description || 'Our barbers are more than just stylists; they are highly trained artisans dedicated to the perfection of their craft.'}
      </p>
      {selectedBranch !== 'all' && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <Badge className="bg-secondary/10 text-secondary border-secondary/30">
            <Building className="w-3 h-3 mr-1" />
            {currentBranchName}
          </Badge>
        </div>
      )}
    </div>

    {filteredStaff.length === 0 ? (
      <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-2xl font-sans font-bold text-gray-400 mb-2">No Staff Available</h3>
      </div>
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredStaff.map((member) => (
          <div key={member.id} className="group cursor-pointer">
            {/* Image */}
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-md">
              <img
                src={member.image}
                alt={member.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  e.currentTarget.src = '/default-avatar.png';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>
            {/* Info below image */}
            <div className="mt-2 px-1">
              <p className="font-sans font-bold text-primary text-sm leading-tight group-hover:text-secondary transition-colors truncate">{member.name}</p>
              <p className="text-[11px] text-gray-500 mt-0.5 truncate">{member.role}</p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
</section>
)}

     {/* Branches Section */}
{(branchSection?.isVisible !== false) && (
<section className="py-12 md:py-20 px-4 bg-white relative overflow-hidden">
  <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] pointer-events-none"></div>
  <div className="max-w-7xl mx-auto relative z-10">
    <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
      <div className="space-y-3">
        <div className="inline-block bg-secondary/10 px-3 py-1 rounded-full">
          <span className="text-secondary font-bold tracking-[0.2em] uppercase text-[10px]">{branchSection?.badgeText || 'Our Locations'}</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-cinzel font-bold text-primary leading-[1.1]">
          {branchSection?.heading || 'Luxury Grooming,'} <br /><span className="text-secondary italic">{branchSection?.subHeading || 'Everywhere.'}</span>
        </h2>
        <div className="flex items-center gap-2">
         
          {selectedBranch !== 'all' && (
            <Badge className="bg-secondary/10 text-secondary border-secondary/30">
              <Building className="w-3 h-3 mr-1" />
              Showing: {currentBranchName}
            </Badge>
          )}
        </div>
      </div>
      <p className="text-muted-foreground max-w-xl font-light leading-relaxed text-sm">
        With {branches.length} flagship studios across prime locations, we bring the ultimate grooming experience closer to you. Each location is a sanctuary of style.
      </p>
    </div>

    {branches.length === 0 ? (
      <div className="text-center py-16 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
        <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-2xl font-sans font-bold text-gray-400 mb-2">No Branches Available</h3>
      </div>
    ) : (
      <>
        <Carousel 
          opts={{ 
            align: "start",
            loop: true,
            slidesToScroll: 1
          }} 
          className="w-full"
        >
          <CarouselContent className="-ml-6">
            {branches.map((branch) => {
              const isSelected = selectedBranch !== 'all' && (branch.name === selectedBranch || branch.id === selectedBranch);
              
              return (
                <CarouselItem key={branch.id} className="pl-6 md:basis-1/2 lg:basis-1/4">
                  <div 
                    className={cn(
                      "p-6 rounded-2xl border transition-all duration-500 group cursor-pointer h-full",
                      isSelected 
                        ? "bg-secondary/10 border-secondary shadow-xl" 
                        : "bg-gray-50 border-transparent hover:border-secondary/30 hover:bg-white hover:shadow-xl"
                    )}
                  >
                    <div className="flex flex-col h-full">
                      {/* Header with Icon and Status */}
                      <div className="flex items-start justify-between mb-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500",
                          isSelected 
                            ? "bg-secondary text-primary" 
                            : "bg-white text-secondary group-hover:bg-secondary group-hover:text-primary"
                        )}>
                          <MapPin className="w-5 h-5" />
                        </div>
                        <Badge className={cn(
                          "text-[8px] px-2 py-0.5",
                          branch.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        )}>
                          {branch.status}
                        </Badge>
                      </div>

                      {/* Branch Details */}
                      <div className="space-y-3 flex-1">
                        <div>
                          <h4 className="font-bold text-primary text-base mb-1 group-hover:text-secondary transition-colors">
                            {branch.name}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {branch.address}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-1">
                            {branch.city}, {branch.country}
                          </p>
                        </div>

                        {/* Contact Info - Compact */}
                        <div className="pt-3 border-t border-gray-100 space-y-2">
                          <div className="flex items-center gap-2 text-[10px] text-gray-600">
                            <Clock className="w-3 h-3 text-secondary shrink-0" />
                            <span className="truncate">{branch.openingTime} - {branch.closingTime}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-gray-600">
                            <Phone className="w-3 h-3 text-secondary shrink-0" />
                            <span className="truncate">{branch.phone}</span>
                          </div>
                        </div>
                      </div>

                      {/* View Details Link */}
                      <div className="mt-4 pt-2">
                        <Link 
                          href={`/branches/${branch.id}`}
                          className="inline-flex items-center text-[9px] font-bold uppercase tracking-wider text-secondary group-hover:gap-2 transition-all"
                        >
                          View Details 
                          <ChevronRight className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>

          {/* Navigation Buttons */}
          <div className="flex justify-center gap-3 mt-8">
            <CarouselPrevious className="static translate-y-0 w-10 h-10 rounded-full border border-secondary/30 text-secondary hover:bg-secondary hover:text-primary transition-all duration-300" />
            <CarouselNext className="static translate-y-0 w-10 h-10 rounded-full border border-secondary/30 text-secondary hover:bg-secondary hover:text-primary transition-all duration-300" />
          </div>
        </Carousel>

        {/* Explore All Button */}
        <div className="text-center mt-10">
          <Button asChild className="bg-primary hover:bg-primary/90 text-white px-8 py-6 rounded-xl group shadow-xl transition-all duration-500 hover:scale-105">
            <Link href={branchSection?.ctaLink || '/branches'} className="flex items-center justify-center gap-2 font-bold tracking-wider text-xs">
              {branchSection?.ctaText || 'EXPLORE ALL BRANCHES'} 
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </>
    )}
  </div>
</section>
)}

      {/* CTA Section */}
      {(ctaSection?.isVisible !== false) && (
      <section className="relative py-20 sm:py-32 md:py-40 px-4 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center scale-110"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1512690196222-7c7d3f993c1b?q=80&w=2070&auto=format&fit=crop')" }}
        >
          <div className="absolute inset-0 bg-linear-to-b from-primary/95 via-primary/80 to-primary/95"></div>
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto text-center text-white space-y-8 md:space-y-12">
          <h2 className="text-4xl sm:text-6xl md:text-8xl font-sans font-bold leading-[1.1] tracking-tight">
            {ctaSection?.heading || 'Your Chair'} <br />
            <span className="text-secondary italic">{ctaSection?.subHeading || 'Awaits.'}</span>
          </h2>
          <p className="text-base sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto font-light leading-relaxed">
            {ctaSection?.description || 'Step into a world where time slows down and style takes center stage. Experience the pinnacle of luxury grooming today.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center pt-4 sm:pt-8">
            <Button size="lg" asChild className="w-full sm:w-auto bg-secondary hover:bg-white text-primary font-black px-8 py-6 sm:px-14 sm:py-10 text-sm rounded-2xl shadow-[0_20px_50px_rgba(197,160,89,0.3)] transition-all duration-500 hover:scale-110 tracking-[0.2em]">
              <Link href={ctaSection?.ctaLink || '/services'}>{ctaSection?.ctaText || 'BOOK APPOINTMENT'}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto border-white/30 text-primary hover:bg-white hover:text-primary px-8 py-6 sm:px-14 sm:py-10 text-sm rounded-2xl backdrop-blur-md transition-all duration-500 hover:scale-110 tracking-[0.2em]">
              <Link href={ctaSection?.ctaSecondaryLink || '/login'}>{ctaSection?.ctaSecondaryText || 'JOIN THE CLUB'}</Link>
            </Button>
          </div>
        </div>
      </section>
      )}

      {/* Footer */}
      <footer className="bg-[#050505] text-white py-16 md:py-32 px-4 border-t border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-16 lg:gap-20">
            <div className="space-y-10">
              <Link href="/" className="inline-block">
                <Image
                  src="/manofcavebradning.png"
                  alt="MAN OF CAVE"
                  width={300}
                  height={80}
                  className="h-24 w-auto object-contain brightness-0 invert"
                />
              </Link>
              <div className="space-y-4">
                <p className="text-gray-500 text-base leading-relaxed font-light max-w-xs">
                  {cmsSettings.footerDescription}
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-secondary" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">
                      {stats.totalServices} Services
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-secondary" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">
                      {stats.totalStaff} Masters
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-6">
                {[Instagram, Phone, Mail, Facebook].map((Icon, i) => (
                  <div key={i} className="w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center hover:bg-secondary hover:text-primary transition-all duration-500 cursor-pointer group shadow-xl">
                    <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-black mb-10 uppercase tracking-[0.3em] text-[10px] text-secondary">Navigation</h4>
              <ul className="space-y-5 text-gray-400 text-sm font-medium">
                {[
                  { label: 'Our Services', href: '/services' },
                  { label: 'Shop Products', href: '/products' },
                  { label: 'Book Appointment', href: '/booking' },
                  { label: 'Our Staff', href: '/staff' },
                  { label: 'Our Branches', href: '/branches' }
                ].map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="hover:text-secondary transition-colors flex items-center group">
                      <div className="w-0 group-hover:w-4 h-[1px] bg-secondary transition-all duration-300 mr-0 group-hover:mr-3"></div>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-black mb-10 uppercase tracking-[0.3em] text-[10px] text-secondary">Business Stats</h4>
              <ul className="space-y-6 text-gray-400 text-sm font-medium">
                {[
                  { label: 'Total Services', value: stats.totalServices },
                  { label: 'Total Products', value: stats.totalProducts },
                  { label: 'Active Staff', value: stats.totalStaff },
                  { label: 'Active Branches', value: stats.totalBranches },
                 
                ].map((item) => (
                  <li key={item.label} className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="font-light">{item.label}</span>
                    <span className="text-white font-bold">{item.value}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-black mb-2 uppercase tracking-[0.3em] text-[10px] text-secondary">Headquarters</h4>
              {activeBranch && (
                <p className="text-[10px] uppercase tracking-[0.3em] text-secondary/60 font-black mb-8 transition-all duration-500">
                  {selectedBranch === 'all' ? 'All Branches' : activeBranch.name}
                </p>
              )}
              <ul className="space-y-8 text-gray-400 text-sm font-medium">
                <li className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-primary transition-all duration-500">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <span className="font-light leading-relaxed transition-all duration-500">
                    {activeBranch?.address || ""}<br />
                    {activeBranch?.city || "Abu Dhabi"}{activeBranch?.city && activeBranch?.country ? " " : ""}{activeBranch?.country || ""}
                  </span>
                </li>
                <li className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-primary transition-all duration-500">
                    <Phone className="w-5 h-5" />
                  </div>
                  <a href={`tel:${activeBranch?.phone || '+971 02 550 3984'}`} className="font-light transition-colors hover:text-secondary">
                    {activeBranch?.phone || "+971 02 550 3984"}
                  </a>
                </li>
                <li className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-primary transition-all duration-500">
                    <Mail className="w-5 h-5" />
                  </div>
                  <a href={`mailto:${activeBranch?.email || 'manofcave2024@gmail.com'}`} className="font-light transition-colors hover:text-secondary">
                    {activeBranch?.email || "manofcave2024@gmail.com"}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 md:mt-32 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-8 text-gray-600 text-[9px] tracking-[0.4em] font-black uppercase">
            <p>{cmsSettings.copyrightText}</p>
            <div className="flex gap-12">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}