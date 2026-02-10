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
  InstagramIcon,
  Facebook
} from "lucide-react";
import { Header } from "@/components/shared/Header";
import Link from "next/link";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { create } from 'zustand';
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

const useHomeStore = create<HomeStore>((set, get) => ({
  services: [],
  products: [],
  staff: [],
  branches: [],
  offers: [],
  memberships: [],
  categories: [],
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
    try {
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
    } catch (error) {
      console.error('Error fetching home data:', error);
    }
  },

  fetchServices: async () => {
    try {
      const servicesRef = collection(db, 'services');
      const q = query(servicesRef, orderBy('createdAt', 'desc'), limit(6));
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
      const q = query(productsRef, orderBy('createdAt', 'desc'), limit(8));
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
      const q = query(staffRef, orderBy('name', 'asc'), limit(6));
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
      const q = query(branchesRef, orderBy('name', 'asc'), limit(4));
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
      const q = query(offersRef, orderBy('createdAt', 'desc'), limit(12));
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
      const q = query(membershipsRef, orderBy('createdAt', 'desc'), limit(8));
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
      // ⚠️ FIXED: Removed complex where clause causing index error
      // Simple query se data fetch karo, phir client side filter karo
      const q = query(categoriesRef, orderBy('createdAt', 'desc'), limit(8));
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
          type: data.type || 'general',
          isActive: data.isActive || true,
          createdAt,
          updatedAt
        });
      });
      
      // ✅ Client side filter for active categories
      const activeCategories = categoriesData.filter(cat => cat.isActive);
      set({ categories: activeCategories.slice(0, 5) }); // Limit to 5 active categories
    } catch (error) {
      console.error('Error fetching categories:', error);
      // ✅ Fallback: Agar error aaye to empty array set karo
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
}));

// ==================== MAIN COMPONENT ====================
export default function Home() {
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

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  const totalActiveServices = services.filter(s => s.status === 'active').length;
  const totalActiveProducts = products.filter(p => p.status === 'active').length;
  const totalActiveStaff = staff.filter(s => s.status === 'active').length;
  const totalActiveBranches = branches.filter(b => b.status === 'active').length;
  const totalActiveOffers = offers.length;
  const totalActiveMemberships = memberships.length;
  const totalActiveCategories = categories.length;

  const totalServicesRevenue = services.reduce((sum, service) => sum + service.revenue, 0);
  const totalProductsRevenue = products.reduce((sum, product) => sum + product.revenue, 0);
  const totalRevenue = totalServicesRevenue + totalProductsRevenue;

  const getOfferBadgeColor = (offerType: string) => {
    switch (offerType) {
      case 'service': return 'bg-blue-500 text-white';
      case 'product': return 'bg-green-500 text-white';
      case 'both': return 'bg-purple-500 text-white';
      default: return 'bg-secondary text-primary';
    }
  };

  const formatDiscount = (offer: Offer) => {
    if (offer.discountType === 'percentage') {
      return `${offer.discountValue}% OFF`;
    } else {
      return `$${offer.discountValue} OFF`;
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
      case 'basic': return 'bg-gray-600';
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

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4">
  
  {/* WhatsApp Icon - Green */}
  <a 
    href="https://wa.me/923001234567" // Aapka WhatsApp number daalo
    target="_blank" 
    rel="noopener noreferrer"
    className="flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 group"
    title="Contact on WhatsApp"
  >
    <svg 
      className="w-6 h-6" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor"
    >
      <defs>
        <linearGradient id="whatsapp-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#25D366" />
          <stop offset="50%" stopColor="#128C7E" />
          <stop offset="100%" stopColor="#075E54" />
        </linearGradient>
      </defs>
      
      {/* Background Circle */}
      <circle 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="url(#whatsapp-gradient)" 
        strokeWidth="1.5" 
        fill="transparent"
      />
      
      {/* WhatsApp Symbol */}
      <path 
        d="M12 2C6.48 2 2 6.48 2 12C2 13.81 2.47 15.5 3.32 16.96L2 22L7.04 20.68C8.5 21.53 10.19 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" 
        fill="url(#whatsapp-gradient)"
      />
      <path 
        d="M16.75 13.27C16.53 13.03 15.78 12.77 15.5 12.7C15.24 12.63 15.04 12.61 14.85 12.84C14.66 13.07 14.11 13.63 13.97 13.79C13.83 13.95 13.69 13.97 13.42 13.84C13.15 13.71 12.32 13.46 11.34 12.59C10.55 11.88 10.02 10.98 9.88 10.71C9.74 10.44 9.86 10.29 9.97 10.18C10.07 10.07 10.21 9.89 10.34 9.74C10.47 9.59 10.51 9.48 10.58 9.33C10.65 9.18 10.6 9.04 10.53 8.92C10.46 8.8 9.83 7.64 9.59 7.18C9.36 6.73 9.12 6.79 8.95 6.79C8.78 6.79 8.6 6.77 8.43 6.77C8.26 6.77 7.97 6.84 7.74 7.11C7.51 7.38 6.85 8.05 6.85 9.36C6.85 10.67 7.67 11.93 7.81 12.12C7.95 12.31 9.89 15.05 12.58 16.26C13.89 16.89 14.85 17.21 15.61 17.35C16.37 17.49 17.14 17.4 17.7 17.2C18.26 17 18.99 16.49 19.19 15.91C19.39 15.33 19.39 14.85 19.33 14.75C19.27 14.65 19.12 14.58 18.95 14.51C18.78 14.44 17.12 13.68 16.75 13.27Z" 
        fill="white"
      />
    </svg>
  </a>

  {/* Email Icon - Blue */}
  <a 
    href="mailto:contact@manofcave.com" // Aapka email address daalo
    target="_blank" 
    rel="noopener noreferrer"
    className="flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 group"
    title="Send Email"
  >
    <svg 
      className="w-6 h-6" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor"
    >
      <defs>
        <linearGradient id="email-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="50%" stopColor="#34A853" />
          <stop offset="100%" stopColor="#EA4335" />
        </linearGradient>
      </defs>
      
      {/* Background Circle */}
      <circle 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="url(#email-gradient)" 
        strokeWidth="1.5" 
        fill="transparent"
      />
      
      {/* Envelope */}
      <path 
        d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" 
        stroke="url(#email-gradient)" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="white"
      />
      <path 
        d="M22 6L12 13L2 6" 
        stroke="url(#email-gradient)" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  </a>

  {/* Instagram Icon - Original wala */}
  <a 
    href="https://instagram.com" 
    target="_blank" 
    rel="noopener noreferrer"
    className="flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
    title="Follow on Instagram"
  >
    <svg 
      className="w-6 h-6" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor"
    >
      <defs>
        <linearGradient id="instagram-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#405DE6" />
          <stop offset="25%" stopColor="#5851DB" />
          <stop offset="50%" stopColor="#833AB4" />
          <stop offset="75%" stopColor="#C13584" />
          <stop offset="100%" stopColor="#E1306C" />
        </linearGradient>
      </defs>
      
      {/* Background Circle */}
      <rect 
        x="2" 
        y="2" 
        width="20" 
        height="20" 
        rx="6" 
        stroke="url(#instagram-gradient)" 
        strokeWidth="2" 
        fill="transparent"
      />
      
      {/* Inner Circle */}
      <circle 
        cx="12" 
        cy="12" 
        r="4.5" 
        stroke="url(#instagram-gradient)" 
        strokeWidth="2" 
        fill="transparent"
      />
      
      {/* Top Right Dot */}
      <circle 
        cx="17.5" 
        cy="6.5" 
        r="1" 
        fill="url(#instagram-gradient)"
      />
    </svg>
  </a>
  
</div>

    

      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden mt-[3.5rem]">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 animate-slow-zoom"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop')",
          }}
        >
          <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/40 to-black/70 backdrop-blur-[2px]"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        </div>
        
        <div className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 mb-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 animate-fade-in">
            <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
            <span className="text-[10px] tracking-[0.3em] uppercase font-bold text-secondary">For The Modern Caveman</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-serif font-bold mb-6 leading-[1.1] tracking-tight drop-shadow-2xl">
            Unleash Your <br />
            <span className="text-secondary italic">Raw</span> Potential
          </h1>
          
          <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto font-light text-gray-300 leading-relaxed drop-shadow-lg">
            Primal grooming for the modern man. Embrace your inner strength with bold, authentic style.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <Button size="lg" asChild className="bg-secondary hover:bg-secondary/90 text-primary font-bold px-10 py-7 text-base rounded-xl transition-all duration-500 shadow-[0_0_30px_rgba(197,160,89,0.3)] hover:shadow-[0_0_50px_rgba(197,160,89,0.5)] hover:scale-105 active:scale-95">
              <Link href="/services">RESERVE YOUR SERVICE</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white/30 text-primary hover:bg-white hover:text-primary px-10 py-7 text-base rounded-xl transition-all duration-500 backdrop-blur-sm hover:scale-105 active:scale-95">
              <Link href="/services">VIEW OUR MENU</Link>
            </Button>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce hidden md:block">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center p-1">
            <div className="w-1 h-2 bg-secondary rounded-full"></div>
          </div>
        </div>
      </section>

      <section className="py-8 border-b border-gray-100 bg-white relative z-20 -mt-8 mx-4 md:mx-10 rounded-2xl shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
              { 
                icon: TrendingUp, 
                label: "Total Revenue", 
                value: `$${Math.floor(totalRevenue/1000)}k+`, 
                desc: "Generated Value",
                data: totalRevenue
              },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center mb-3 group-hover:bg-secondary group-hover:text-primary transition-all duration-500">
                  <stat.icon className="w-6 h-6 text-secondary group-hover:text-primary transition-colors" />
                </div>
                <span className="text-2xl font-serif font-bold text-primary mb-0.5">{stat.value}</span>
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

      <section className="py-8 bg-white border-b border-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-6 font-bold">As Featured In</p>
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
            {['GQ', 'VOGUE', 'ESQUIRE', 'FORBES', 'MEN\'S HEALTH'].map((brand) => (
              <span key={brand} className="text-2xl md:text-3xl font-serif font-black tracking-tighter text-primary">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      
    

      <section className="py-20 px-4 bg-gradient-to-b from-white via-white to-gray-50/80">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div className="space-y-3">
              <div className="inline-block bg-secondary/10 px-3 py-1 rounded-full">
                <span className="text-secondary font-bold tracking-[0.2em] uppercase text-[10px]">Our Collections</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary">Featured Categories</h2>
              <Badge variant="outline" className="text-xs border-secondary/30 text-secondary">
                {categories.length} Premium Categories Available
              </Badge>
            </div>
            <p className="text-muted-foreground max-w-md text-sm font-light">
              Explore our curated collections designed for the modern gentleman's grooming needs.
            </p>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
              <Grid3X3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-serif font-bold text-gray-400 mb-2">No Categories Available</h3>
              <p className="text-gray-400 font-light">Add categories to Firebase to see them here</p>
              <Button 
                onClick={fetchHomeData} 
                className="mt-4 bg-secondary hover:bg-secondary/90 text-primary"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {categories.map((category) => (
                <div 
                  key={category.id} 
                  className="group cursor-pointer bg-white border border-gray-100 rounded-[2rem] overflow-hidden hover:border-secondary/50 hover:shadow-[0_12px_40px_rgba(197,160,89,0.12)] transition-all duration-500 hover:-translate-y-1.5"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=2070&auto=format&fit=crop';
                      }}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute top-6 right-6">
                      <Badge className="bg-white/90 backdrop-blur-md text-primary border-none px-3 py-1 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl">
                        {category.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-xl font-serif font-bold text-primary group-hover:text-secondary transition-colors duration-300">
                          {category.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-2">
                          <MapPin className="w-3 h-3 text-secondary" />
                          <span className="text-[10px] text-gray-500 uppercase tracking-widest">
                            {category.branchCity}
                          </span>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center group-hover:from-secondary group-hover:to-secondary/80 group-hover:text-primary transition-all duration-500 shadow-sm">
                        <Grid3X3 className="w-5 h-5 text-secondary group-hover:text-primary" />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-5 font-light leading-relaxed">
                      {category.description || "Premium collection for the modern gentleman"}
                    </p>
                    <div className="flex items-center justify-between pt-5 border-t border-gray-100">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-gray-500 block mb-1">
                          Available At
                        </span>
                        <span className="text-xs font-semibold text-primary">
                          {category.branchName}
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full bg-secondary/10 text-secondary hover:bg-secondary hover:text-primary transition-all duration-500"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-b from-gray-50/80 via-white to-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div className="space-y-3">
              <div className="inline-block bg-secondary/10 px-3 py-1 rounded-full">
                <span className="text-secondary font-bold tracking-[0.2em] uppercase text-[10px]">Our Signature Menu</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary">Bespoke Services</h2>
              <Badge variant="outline" className="text-xs border-secondary/30 text-secondary">
                {services.length} Premium Services Available
              </Badge>
            </div>
            <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white rounded-full px-8 py-6 font-bold tracking-widest group transition-all duration-500">
              <Link href="/services" className="flex items-center">
                EXPLORE FULL MENU <ChevronRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          {services.length === 0 ? (
            <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
              <Scissors className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-serif font-bold text-gray-400 mb-2">No Services Available</h3>
              <p className="text-gray-400 font-light">Add services to Firebase to see them here</p>
            </div>
          ) : (
            <Carousel opts={{ align: "start" }} className="w-full">
              <CarouselContent className="-ml-6">
                {services.map((service) => (
                  <CarouselItem key={service.id} className="pl-6 md:basis-1/2 lg:basis-1/4">
                    <Card className="group border border-gray-100 bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_40px_rgba(197,160,89,0.15)] hover:border-secondary/40 overflow-hidden rounded-[2rem] transition-all duration-500">
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <img 
                          src={service.imageUrl || "https://images.unsplash.com/photo-1599351431247-f5094021186d?q=80&w=2070&auto=format&fit=crop"} 
                          alt={service.name} 
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1599351431247-f5094021186d?q=80&w=2070&auto=format&fit=crop';
                          }}
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="absolute top-6 right-6">
                          <div className="bg-white/90 backdrop-blur-md text-primary border-none px-4 py-2 rounded-2xl font-black text-sm shadow-xl">
                            ${service.price}
                          </div>
                        </div>
                        <div className="absolute bottom-6 left-6 right-6 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                          <Button asChild className="w-full bg-secondary hover:bg-secondary/90 text-primary font-black rounded-xl py-6 shadow-2xl">
                            <Link href={`/booking?service=${service.id}`}>BOOK THIS SERVICE</Link>
                          </Button>
                        </div>
                      </div>
                      <CardHeader className="px-6 pt-6 pb-2">
                        <div className="flex justify-between items-center mb-3">
                          <Badge variant="outline" className="text-[10px] uppercase tracking-[0.2em] text-secondary border-secondary/30">
                            {service.category}
                          </Badge>
                          <div className="flex items-center gap-2 text-muted-foreground bg-gray-50 px-3 py-1 rounded-full">
                            <Clock className="w-3 h-3 text-secondary" />
                            <span className="text-[10px] uppercase tracking-widest font-bold">{service.duration} MIN</span>
                          </div>
                        </div>
                        <CardTitle className="text-2xl font-serif font-bold text-primary group-hover:text-secondary transition-colors duration-300">
                          {service.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-6 pb-6">
                        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 font-light">
                          {service.description || "Premium grooming service for the modern gentleman"}
                        </p>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-secondary" />
                            <span className="text-[10px] text-gray-500">
                              {service.branchNames?.length || 0} branch(es)
                            </span>
                          </div>
                          <Badge className={cn(
                            "text-[9px]",
                            service.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          )}>
                            {service.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="hidden md:flex justify-center gap-3 mt-10">
                <CarouselPrevious className="static translate-y-0 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all" />
                <CarouselNext className="static translate-y-0 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all" />
              </div>
            </Carousel>
          )}
        </div>
      </section>

      <section className="py-20 px-4 bg-[#0f0f0f] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-secondary/8 blur-[150px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div className="space-y-3">
              <div className="inline-block bg-secondary/20 px-3 py-1 rounded-full border border-secondary/40">
                <span className="text-secondary font-bold tracking-[0.2em] uppercase text-[10px]">Premium Apothecary</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-white">Grooming Essentials</h2>
              <Badge variant="outline" className="text-xs border-white/25 text-white">
                {products.length} Premium Products Available
              </Badge>
            </div>
            <Button asChild variant="outline" className="border-white/20 text-black bg-white hover:text-primary rounded-full px-8 py-6 font-bold tracking-widest group transition-all duration-500">
              <Link href="/products" className="flex items-center">
                SHOP ALL PRODUCTS <ChevronRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-serif font-bold text-gray-300 mb-2">No Products Available</h3>
              <p className="text-gray-400 font-light">Add products to Firebase to see them here</p>
            </div>
          ) : (
            <Carousel opts={{ align: "start" }} className="w-full">
              <CarouselContent className="-ml-6">
                {products.map((product) => (
                  <CarouselItem key={product.id} className="pl-6 md:basis-1/2 lg:basis-1/4">
                    <div className="group cursor-pointer bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-5 border border-white/10 rounded-[2.5rem] hover:bg-gradient-to-br hover:from-white/[0.08] hover:to-white/[0.02] hover:border-secondary/50 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(197,160,89,0.15)]">
                      <div className="relative aspect-square overflow-hidden mb-5 rounded-[2rem] bg-white/3">
                        <img 
                          src={product.imageUrl || "https://images.unsplash.com/photo-1512690196222-7c7d3f993c1b?q=80&w=2070&auto=format&fit=crop"} 
                          alt={product.name} 
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1512690196222-7c7d3f993c1b?q=80&w=2070&auto=format&fit=crop';
                          }}
                        />
                        {product.totalStock <= 5 && (
                          <div className="absolute top-4 left-4 bg-secondary text-primary px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase shadow-2xl">
                            LIMITED STOCK
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                          <Button asChild className="bg-white text-primary hover:bg-secondary hover:text-primary rounded-full w-12 h-12 p-0 shadow-2xl">
                            <Link href={`/products#${product.id}`}>
                              <ShoppingBag className="w-5 h-5" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <Badge variant="outline" className="text-[9px] uppercase tracking-[0.3em] text-gray-500 font-black border-gray-700">
                            {product.category}
                          </Badge>
                          <span className="text-secondary font-black text-lg">${product.price}</span>
                        </div>
                        <h4 className="text-xl font-serif font-bold group-hover:text-secondary transition-colors duration-300 truncate">
                          {product.name}
                        </h4>
                        <div className="flex items-center gap-1.5 pt-1">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={cn(
                                "w-2.5 h-2.5", 
                                s <= Math.floor(product.rating) ? "fill-secondary text-secondary" : "text-gray-700"
                              )} />
                            ))}
                          </div>
                          <span className="text-[10px] font-black text-gray-400">{product.rating.toFixed(1)}</span>
                          <span className="text-[9px] text-gray-600">({product.reviews})</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mt-4">
                          <span>SKU: {product.sku}</span>
                          <span>Stock: {product.totalStock}</span>
                        </div>
                        <Button 
                          onClick={() => {
                            // Add product to cart
                            const cartItem = {
                              id: product.id,
                              name: product.name,
                              category: product.category,
                              duration: '0',
                              price: product.price,
                              description: product.description,
                              image: product.imageUrl,
                              rating: product.rating,
                              reviews: product.reviews
                            };
                            
                            const savedCart = localStorage.getItem('bookingCart');
                            let cart = savedCart ? JSON.parse(savedCart) : [];
                            
                            // Check if item already exists
                            const existingIndex = cart.findIndex((item: any) => item.id === product.id);
                            if (existingIndex > -1) {
                              cart.splice(existingIndex, 1);
                            }
                            cart.push(cartItem);
                            
                            localStorage.setItem('bookingCart', JSON.stringify(cart));
                            
                            // Dispatch event for header update
                            window.dispatchEvent(new StorageEvent('storage', {
                              key: 'bookingCart',
                              newValue: JSON.stringify(cart),
                              oldValue: savedCart
                            }));
                            
                            // Show feedback
                            alert('Added to cart! Visit booking page to proceed.');
                          }}
                          className="w-full mt-6 bg-white/10 hover:bg-secondary hover:text-primary text-white rounded-2xl py-6 text-[10px] font-black tracking-[0.2em] transition-all duration-500 border border-white/5 hover:border-secondary"
                        >
                          ADD TO CART
                        </Button>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="hidden md:flex justify-end gap-3 mt-10">
                <CarouselPrevious className="static translate-y-0 border-white/15 text-white hover:bg-white/15 hover:border-secondary/50 transition-all" />
                <CarouselNext className="static translate-y-0 border-white/15 text-white hover:bg-white/15 hover:border-secondary/50 transition-all" />
              </div>
            </Carousel>
          )}
        </div>
      </section>


<section className="py-16 px-4 bg-gray-50/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div className="space-y-2">
              <div className="inline-block bg-secondary/10 px-3 py-1 rounded-full">
                <span className="text-secondary font-bold tracking-[0.2em] uppercase text-[10px]">Exclusive Privileges</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary">Member Rewards</h2>
              <Badge variant="outline" className="border-secondary/30 text-secondary mt-2">
                {totalActiveOffers} Active Offers Available
              </Badge>
            </div>
            <p className="text-muted-foreground max-w-md text-sm font-light">
              Unlock premium benefits and exclusive savings designed for our most loyal patrons.
            </p>
          </div>
          
          {offers.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-serif font-bold text-gray-400 mb-2">No Offers Available</h3>
              <p className="text-gray-400 font-light">Add active offers to Firebase to see them here</p>
              <Button 
                onClick={fetchHomeData} 
                className="mt-4 bg-secondary hover:bg-secondary/90 text-primary"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          ) : (
            <Carousel opts={{ align: "start", loop: true }} className="w-full">
              <CarouselContent className="-ml-6">
                {offers.map((offer) => {
                  const discountText = formatDiscount(offer);
                  const offerBgColor = getOfferBgColor(offer.offerType);
                  
                  return (
                    <CarouselItem key={offer.id} className="pl-6 md:basis-1/2 lg:basis-1/4">
                      <div className={cn(
                        "p-8 rounded-3xl text-white relative overflow-hidden group cursor-pointer transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] hover:-translate-y-2",
                        offerBgColor
                      )}>
                        {offer.usageLimit && (
                          <div className="absolute top-4 left-4 bg-black/30 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-full z-20">
                            {offer.usedCount}/{offer.usageLimit} USED
                          </div>
                        )}
                        
                        <div className="absolute -right-6 -top-6 opacity-10 group-hover:scale-125 group-hover:rotate-45 transition-all duration-700">
                          <Ticket className="w-32 h-32 rotate-12" />
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
                        
                        <div className="relative z-10 space-y-6">
                          <div className="flex items-start justify-between">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                              <Zap className="w-5 h-5 text-white" />
                            </div>
                            <Badge className={cn(
                              "text-[9px] font-black uppercase tracking-wider border-0",
                              getOfferBadgeColor(offer.offerType)
                            )}>
                              {offer.offerType.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <div>
                            <span className="text-xs font-bold tracking-widest opacity-70 uppercase block mb-1">
                              {offer.branchNames?.length > 0 
                                ? `${offer.branchNames[0]}${offer.branchNames.length > 1 ? ` +${offer.branchNames.length - 1} more` : ''}`
                                : 'All Branches'}
                            </span>
                            <h4 className="text-4xl font-serif font-bold">{discountText}</h4>
                            <h5 className="text-xl font-semibold mt-2">{offer.title}</h5>
                          </div>
                          
                          <p className="text-sm opacity-90 line-clamp-2">
                            {offer.description}
                          </p>
                          
                          <div className="pt-4 flex items-center justify-between border-t border-white/20">
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase tracking-widest opacity-60">Valid Until</span>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span className="text-xs font-semibold">
                                  {offer.validTo.toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                            </div>
                            
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="rounded-full bg-white/10 hover:bg-white/20 text-white"
                            >
                              <ArrowRight className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <div className="hidden md:flex justify-end gap-3 mt-8">
                <CarouselPrevious className="static translate-y-0 border-primary/10 hover:bg-primary hover:text-white transition-all" />
                <CarouselNext className="static translate-y-0 border-primary/10 hover:bg-primary hover:text-white transition-all" />
              </div>
            </Carousel>
          )}
        </div>
      </section>


  <section className="py-20 px-4 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/diamond.png')] opacity-[0.02] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div className="space-y-2">
              <div className="inline-block bg-secondary/10 px-3 py-1 rounded-full">
                <span className="text-secondary font-bold tracking-[0.2em] uppercase text-[10px]">Elite Access</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary">Exclusive Memberships</h2>
              <Badge variant="outline" className="border-secondary/30 text-secondary mt-2">
                {totalActiveMemberships} Premium Plans Available
              </Badge>
            </div>
            <p className="text-muted-foreground max-w-md text-sm font-light">
              Join our elite community and unlock unprecedented benefits, priority access, and exclusive privileges.
            </p>
          </div>
          
          {memberships.length === 0 ? (
            <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
              <Crown className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-serif font-bold text-gray-400 mb-2">No Memberships Available</h3>
              <p className="text-gray-400 font-light">Add membership plans to Firebase to see them here</p>
              <Button 
                onClick={fetchHomeData} 
                className="mt-4 bg-secondary hover:bg-secondary/90 text-primary"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          ) : (
            <Carousel opts={{ align: "start", loop: true }} className="w-full">
              <CarouselContent className="-ml-6">
                {memberships.map((membership) => {
                  const TierIcon = getMembershipTierIcon(membership.tier);
                  const membershipBgColor = getMembershipTierColor(membership.tier);
                  const durationText = formatDuration(membership.duration);
                  const branchName = getFirstBranchName(membership);
                  const branchCountText = getBranchCountText(membership);
                  
                  return (
                    <CarouselItem key={membership.id} className="pl-6 md:basis-1/2 lg:basis-1/4">
                      <div className={cn(
                        "p-8 rounded-3xl text-white relative overflow-hidden group cursor-pointer transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] hover:-translate-y-2",
                        membershipBgColor
                      )}>
                        {membership.totalSubscriptions > 10 && (
                          <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-full z-20">
                            POPULAR
                          </div>
                        )}
                        
                        <div className="absolute -right-6 -top-6 opacity-10 group-hover:scale-125 group-hover:rotate-45 transition-all duration-700">
                          <Crown className="w-32 h-32 rotate-12" />
                        </div>
                        
                        <div className="relative z-10 space-y-6">
                          <div className="flex items-start justify-between">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                              <TierIcon className="w-5 h-5 text-white" />
                            </div>
                            <Badge className={cn(
                              "text-[9px] font-black uppercase tracking-wider border-0",
                              membership.tier === 'exclusive' 
                                ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-black'
                                : 'bg-white/20 text-white'
                            )}>
                              {membership.tier.toUpperCase()}
                            </Badge>
                          </div>
                          
                          <div>
                            <span className="text-xs font-bold tracking-widest opacity-70 uppercase block mb-1">
                              {durationText} • {branchName}
                            </span>
                            <h4 className="text-4xl font-serif font-bold">${membership.price}</h4>
                            <h5 className="text-xl font-semibold mt-2">{membership.name}</h5>
                          </div>
                          
                          <p className="text-sm opacity-90 line-clamp-2">
                            {membership.description}
                          </p>
                          
                          <div className="space-y-2">
                            <span className="text-[10px] uppercase tracking-widest opacity-60 block">Key Benefits</span>
                            <div className="space-y-1.5">
                              {membership.benefits.slice(0, 3).map((benefit, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <Check className="w-3 h-3 text-green-300" />
                                  <span className="text-xs opacity-90">{benefit}</span>
                                </div>
                              ))}
                              {membership.benefits.length > 3 && (
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
                                  </div>
                                  <span className="text-xs opacity-70">
                                    +{membership.benefits.length - 3} more benefits
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="pt-4 flex items-center justify-between border-t border-white/20">
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase tracking-widest opacity-60">Available At</span>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span className="text-xs font-semibold">
                                  {branchCountText}
                                </span>
                              </div>
                            </div>
                            
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="rounded-full bg-white/10 hover:bg-white/20 text-white"
                            >
                              <ArrowRight className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <div className="hidden md:flex justify-end gap-3 mt-8">
                <CarouselPrevious className="static translate-y-0 border-primary/10 hover:bg-primary hover:text-white transition-all" />
                <CarouselNext className="static translate-y-0 border-primary/10 hover:bg-primary hover:text-white transition-all" />
              </div>
            </Carousel>
          )}
        </div>
      </section>
      <section className="py-32 px-4 bg-gray-50/50 overflow-hidden relative">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <div className="inline-block bg-secondary/10 px-3 py-1 rounded-full mb-4">
              <span className="text-secondary font-bold tracking-[0.2em] uppercase text-[10px]">The Artisans</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-serif font-bold text-primary mb-6">Meet The Masters</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto font-light text-lg">
              Our barbers are more than just stylists; they are highly trained artisans dedicated to the perfection of their craft.
            </p>
            <Badge variant="outline" className="mt-4 border-secondary/30 text-secondary">
              {staff.length} Professional Staff Members
            </Badge>
          </div>

          {staff.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-serif font-bold text-gray-400 mb-2">No Staff Available</h3>
              <p className="text-gray-400 font-light">Add staff to Firebase to see them here</p>
            </div>
          ) : (
            <Carousel opts={{ align: "start", loop: true }} className="w-full">
              <CarouselContent className="-ml-8">
                {staff.map((member) => (
                  <CarouselItem key={member.id} className="pl-8 basis-1/2 md:basis-1/3 lg:basis-1/6">
                    <Card className="group overflow-hidden border-none shadow-none bg-transparent">
                      <div className="relative aspect-[3/4] overflow-hidden rounded-[2.5rem] mb-8 shadow-2xl">
                        <img 
                          src={member.image} 
                          alt={member.name}
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                            e.currentTarget.src = '/default-avatar.png';
                          }}
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-primary/90 via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 flex flex-col justify-end p-10">
                          <div className="flex gap-4 mb-6 translate-y-10 group-hover:translate-y-0 transition-transform duration-500">
                            <a href="#" className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-primary hover:scale-110 transition-all shadow-xl">
                              <Instagram className="w-5 h-5" />
                            </a>
                            <Button asChild className="bg-white text-primary hover:bg-secondary hover:text-primary rounded-2xl px-6 font-black text-[10px] tracking-widest shadow-xl">
                              <Link href={`/staff/${member.id}`}>VIEW PROFILE</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="text-center px-4">
                        <div className="inline-block border border-secondary/30 text-secondary text-[9px] font-black uppercase tracking-[0.3em] px-4 py-1 rounded-full mb-4">
                          {member.role}
                        </div>
                        <h3 className="text-3xl font-serif font-bold text-primary mb-3 group-hover:text-secondary transition-colors duration-300">
                          {member.name}
                        </h3>
                        <p className="text-sm text-muted-foreground font-light line-clamp-2 mb-6 leading-relaxed">
                          {member.bio || "Professional barber with extensive experience in modern grooming techniques."}
                        </p>
                        <div className="flex items-center justify-center gap-3 py-4 border-t border-gray-100">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={cn(
                                "w-3 h-3",
                                s <= Math.floor(member.rating) ? "fill-secondary text-secondary" : "text-gray-300"
                              )} />
                            ))}
                          </div>
                          <span className="text-xs font-black text-primary">{member.rating.toFixed(1)}</span>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                            ({member.reviews} REVIEWS)
                          </span>
                        </div>
                      </div>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-center gap-6 mt-16">
                <CarouselPrevious className="static translate-y-0 w-14 h-14 border-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-lg" />
                <CarouselNext className="static translate-y-0 w-14 h-14 border-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-lg" />
              </div>
            </Carousel>
          )}
        </div>
      </section>

      <section className="py-24 px-4 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.01] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-end justify-between mb-12 gap-4">
            <div className="space-y-3">
              <div className="inline-block bg-secondary/10 px-3 py-1 rounded-full">
                <span className="text-secondary font-bold tracking-[0.2em] uppercase text-[10px]">Our Global Presence</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-serif font-bold text-primary leading-[1.1]">
                Luxury Grooming, <br /><span className="text-secondary italic">Everywhere.</span>
              </h2>
              <Badge variant="outline" className="border-secondary/30 text-secondary">
                {branches.length} Premium Branches
              </Badge>
            </div>
            <p className="text-muted-foreground max-w-xl font-light leading-relaxed">
              With {branches.length} flagship studios across prime locations, we bring the ultimate grooming experience closer to you. Each location is a sanctuary of style.
            </p>
          </div>

          {branches.length === 0 ? (
            <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
              <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-serif font-bold text-gray-400 mb-2">No Branches Available</h3>
              <p className="text-gray-400 font-light">Add branches to Firebase to see them here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {branches.map((branch) => (
                <div key={branch.id} className="flex items-start gap-6 p-6 rounded-[2rem] bg-gray-50 border border-transparent hover:border-secondary/30 hover:bg-white hover:shadow-2xl transition-all duration-500 group cursor-pointer">
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-primary transition-all duration-500 shadow-sm">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <h4 className="font-black text-primary text-sm uppercase tracking-widest mb-1">
                        {branch.name}
                      </h4>
                      <Badge className={cn(
                        "text-[9px]",
                        branch.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      )}>
                        {branch.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium line-clamp-2">
                      {branch.address}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {branch.city}, {branch.country}
                    </p>
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-[9px] text-gray-600">
                        Hours: {branch.openingTime} - {branch.closingTime}
                      </p>
                      <p className="text-[9px] text-gray-600">
                        Phone: {branch.phone}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {branches.length > 0 && (
            <div className="text-center mt-12">
              <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-white px-10 py-8 rounded-2xl group shadow-2xl transition-all duration-500 hover:scale-105">
                <Link href="/branches" className="flex items-center justify-center gap-3 font-black tracking-[0.2em] text-xs">
                  EXPLORE ALL {branches.length} BRANCHES <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="py-32 px-4 bg-primary relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-secondary blur-[150px] animate-pulse"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-secondary blur-[150px] animate-pulse"></div>
        </div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-block bg-secondary/20 px-4 py-1.5 rounded-full mb-8 border border-secondary/30">
            <span className="text-secondary font-black tracking-[0.3em] uppercase text-[10px]">The Inner Circle</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-serif font-bold text-white mb-8 leading-tight">
            Join The <span className="text-secondary italic">Elite</span>
          </h2>
          <p className="text-xl text-gray-400 mb-12 font-light max-w-2xl mx-auto leading-relaxed">
            Subscribe to receive exclusive invitations, grooming insights, and priority access to our most sought-after events.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 max-w-3xl mx-auto bg-white/5 p-3 rounded-[2.5rem] border border-white/10 backdrop-blur-xl shadow-2xl">
            <input 
              placeholder="Your prestigious email address" 
              className="h-16 bg-transparent text-white rounded-2xl px-8 focus:outline-none transition-all w-full font-light text-lg"
            />
            <Button size="lg" className="h-16 bg-secondary text-primary hover:bg-white hover:scale-105 transition-all font-black px-12 rounded-[1.8rem] shrink-0 tracking-[0.2em] text-xs">
              SUBSCRIBE NOW
            </Button>
          </div>
          <p className="text-[10px] text-gray-500 mt-10 uppercase tracking-[0.3em] font-bold">
            Privacy is our priority. Unsubscribe at any time.
          </p>
        </div>
      </section>

      <section className="relative py-40 px-4 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-fixed bg-center scale-110"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1512690196222-7c7d3f993c1b?q=80&w=2070&auto=format&fit=crop')" }}
        >
          <div className="absolute inset-0 bg-linear-to-b from-primary/95 via-primary/80 to-primary/95"></div>
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto text-center text-white space-y-12">
          <h2 className="text-6xl md:text-8xl font-serif font-bold leading-[1.1] tracking-tight">
            Your Chair <br />
            <span className="text-secondary italic">Awaits.</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto font-light leading-relaxed">
            Step into a world where time slows down and style takes center stage. Experience the pinnacle of luxury grooming today.
          </p>
          <div className="flex flex-col sm:flex-row gap-8 justify-center pt-8">
            <Button size="lg" asChild className="bg-secondary hover:bg-white text-primary font-black px-14 py-10 text-sm rounded-2xl shadow-[0_20px_50px_rgba(197,160,89,0.3)] transition-all duration-500 hover:scale-110 tracking-[0.2em]">
              <Link href="/services">BOOK APPOINTMENT</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white/30 text-primary hover:bg-white hover:text-primary px-14 py-10 text-sm rounded-2xl backdrop-blur-md transition-all duration-500 hover:scale-110 tracking-[0.2em]">
              <Link href="/login">JOIN THE CLUB</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="bg-[#050505] text-white py-32 px-4 border-t border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20">
            <div className="space-y-10">
              <Link href="/" className="inline-block">
                <h3 className="text-3xl font-serif font-bold tracking-tighter">
                  PREMIUM<span className="text-secondary">CUTS</span>
                </h3>
              </Link>
              <div className="space-y-4">
                <p className="text-gray-500 text-base leading-relaxed font-light max-w-xs">
                  The city's premier destination for luxury grooming and traditional barbering since 2015.
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
                {[Instagram, Phone, Mail,Facebook].map((Icon, i) => (
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
                  { label: 'Total Revenue', value: `$${Math.floor(totalRevenue/1000)}k` }
                ].map((item) => (
                  <li key={item.label} className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="font-light">{item.label}</span>
                    <span className="text-white font-bold">{item.value}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-black mb-10 uppercase tracking-[0.3em] text-[10px] text-secondary">Headquarters</h4>
              <ul className="space-y-8 text-gray-400 text-sm font-medium">
                <li className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-primary transition-all duration-500">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <span className="font-light leading-relaxed">
                    {branches[0]?.address || "123 Luxury Way, Suite 100"}<br />
                    {branches[0]?.city || "Financial District"}, {branches[0]?.country || "NY 10004"}
                  </span>
                </li>
                <li className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-primary transition-all duration-500">
                    <Phone className="w-5 h-5" />
                  </div>
                  <span className="font-light">{branches[0]?.phone || "+1 (555) 000-1234"}</span>
                </li>
                <li className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-primary transition-all duration-500">
                    <Mail className="w-5 h-5" />
                  </div>
                  <span className="font-light">{branches[0]?.email || "concierge@premiumcuts.com"}</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-32 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-gray-600 text-[9px] tracking-[0.4em] font-black uppercase">
            <p>&copy; 2026 PREMIUM CUTS LUXURY GROOMING. ALL RIGHTS RESERVED.</p>
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