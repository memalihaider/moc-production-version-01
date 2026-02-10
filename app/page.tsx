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
      const q = query(servicesRef, orderBy('createdAt', 'desc'), limit(4));
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
      const q = query(productsRef, orderBy('createdAt', 'desc'), limit(6));
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

    

      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden mt-[3.5rem]">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 animate-slow-zoom"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop')",
          }}
        >
          <div className="absolute inset-0 bg-linear-to-b from-black/80 via-black/30 to-black/80 backdrop-blur-[1px]"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-15"></div>
          <div className="absolute inset-0 bg-linear-to-r from-primary/40 via-transparent to-primary/40"></div>
        </div>
        
        <div className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-3 mb-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-5 py-2 animate-fade-in shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <div className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse shadow-[0_0_10px_#c5a059]"></div>
            <span className="text-[11px] tracking-[0.4em] uppercase font-black text-secondary">The Ultimate Grooming Destination</span>
          </div>
          
          <h1 className="text-6xl md:text-9xl font-serif font-black mb-8 leading-[1] tracking-tighter drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]">
            ELEVATE YOUR <br />
            <span className="text-secondary italic bg-gradient-to-r from-secondary via-white/80 to-secondary bg-clip-text text-transparent">CHARACTER</span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto font-light text-gray-200 leading-relaxed drop-shadow-xl opacity-90">
            Precision engineering for the modern man. Experience a heritage of excellence and a future of bold, authentic style.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button size="lg" asChild className="bg-secondary hover:bg-white text-primary font-black px-12 py-8 text-sm rounded-2xl transition-all duration-700 shadow-[0_15px_40px_rgba(197,160,89,0.3)] hover:shadow-[0_25px_60px_rgba(197,160,89,0.5)] hover:scale-110 active:scale-95 tracking-[0.2em]">
              <Link href="/services">BOOK APPOINTMENT</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white/20 text-white hover:bg-white/10 hover:border-white/40 px-12 py-8 text-sm rounded-2xl transition-all duration-700 backdrop-blur-md hover:scale-110 active:scale-95 tracking-[0.2em]">
              <Link href="/services">VIEW MENU</Link>
            </Button>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce hidden md:block">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center p-1">
            <div className="w-1 h-2 bg-secondary rounded-full"></div>
          </div>
        </div>
      </section>

      <section className="py-12 border-b border-gray-100 bg-white relative z-20 -mt-12 mx-4 md:mx-10 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.1)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {[
              { 
                icon: Award, 
                label: "Master Artists", 
                value: `${totalActiveStaff}+`, 
                desc: "Expertly Vetted",
                data: totalActiveStaff
              },
              { 
                icon: Scissors, 
                label: "Luxury Services", 
                value: `${totalActiveServices}+`, 
                desc: "Premium Range",
                data: totalActiveServices
              },
              { 
                icon: MapPin, 
                label: "Global Studios", 
                value: `${totalActiveBranches}+`, 
                desc: "Prime Locations",
                data: totalActiveBranches
              },
              { 
                icon: Star, 
                label: "Guest Rating", 
                value: `4.9/5`, 
                desc: "Client Satisfaction",
                data: 100
              },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center text-center group">
                <div className="w-16 h-16 rounded-2xl bg-secondary/5 border border-secondary/10 flex items-center justify-center mb-4 group-hover:bg-secondary group-hover:text-primary transition-all duration-700 shadow-sm group-hover:shadow-[0_10px_20px_rgba(197,160,89,0.3)]">
                  <stat.icon className="w-7 h-7 text-secondary group-hover:text-primary transition-colors" />
                </div>
                <span className="text-3xl font-serif font-black text-primary mb-1 tracking-tighter">{stat.value}</span>
                <span className="text-[10px] uppercase tracking-[0.3em] text-primary font-black mb-1">{stat.label}</span>
                <span className="text-[9px] text-muted-foreground font-bold tracking-widest">{stat.desc}</span>
                <div className="w-12 h-1 bg-secondary/10 rounded-full mt-4 overflow-hidden">
                  <div 
                    className="h-full bg-secondary rounded-full transition-all duration-1000 group-hover:w-full"
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

      
    

      <section className="py-24 px-4 bg-gradient-to-b from-white via-white to-gray-50/80">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="space-y-4">
              <div className="inline-block bg-secondary/10 px-4 py-1 rounded-full border border-secondary/20">
                <span className="text-secondary font-black tracking-[0.3em] uppercase text-[10px]">Curated Collections</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-serif font-bold text-primary tracking-tighter">Featured <span className="text-secondary italic">Categories</span></h2>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-[10px] border-secondary/30 text-secondary uppercase tracking-widest font-black px-3">
                  {categories.length} Styles Available
                </Badge>
                <div className="h-[1px] w-20 bg-secondary/30"></div>
              </div>
            </div>
            <p className="text-muted-foreground max-w-sm text-sm font-light leading-relaxed">
              Explore our meticulously curated grooming collections designed for the discerning modern gentleman.
            </p>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-24 bg-gray-50/30 rounded-[3rem] border border-dashed border-gray-200">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Grid3X3 className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-3xl font-serif font-bold text-gray-400 mb-3">Awaiting Collections</h3>
              <p className="text-gray-400 font-light mb-8">Synchronize with our artisan database to view categories.</p>
              <Button 
                onClick={fetchHomeData} 
                className="bg-primary hover:bg-secondary text-white hover:text-primary transition-all duration-500 rounded-xl px-8 h-12 font-black tracking-widest text-xs"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                REFRESH DATABASE
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {categories.map((category) => (
                <Link key={category.id} href={`/services?category=${encodeURIComponent(category.name.toLowerCase().replace(/\s+/g, '-'))}`}>
                  <div className="group cursor-pointer bg-white border border-gray-100/50 rounded-[2.5rem] overflow-hidden hover:border-secondary/40 hover:shadow-[0_20px_50px_rgba(197,160,89,0.15)] transition-all duration-700 hover:-translate-y-3 h-full">
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img 
                        src={category.image} 
                        alt={category.name}
                        className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=2070&auto=format&fit=crop';
                        }}
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-700"></div>
                      
                      <div className="absolute top-5 right-5">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest">
                          {category.type}
                        </div>
                      </div>

                      <div className="absolute bottom-6 left-6 right-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-700">
                        <h4 className="text-2xl font-serif font-bold text-white mb-2 leading-tight">
                          {category.name}
                        </h4>
                        <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                          <MapPin className="w-3 h-3 text-secondary" />
                          <span className="text-[9px] text-white uppercase tracking-[0.2em] font-black">
                            {category.branchCity}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6 bg-white">
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-6 font-light leading-relaxed">
                        {category.description || "Premium bespoke collection tailored for individual character."}
                      </p>
                      <div className="flex items-center justify-between pt-5 border-t border-gray-100">
                        <div className="w-10 h-10 rounded-2xl bg-secondary/5 flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-primary transition-all duration-500 shadow-xs">
                          <Grid3X3 className="w-5 h-5" />
                        </div>
                        <div className="rounded-full text-[10px] font-black tracking-widest text-primary group-hover:text-secondary group/btn transition-colors">
                          EXPLORE <ArrowRight className="ml-2 w-3 h-3 inline-block group-hover/btn:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-24 px-4 bg-gradient-to-b from-gray-50/80 via-white to-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="space-y-4">
              <div className="inline-block bg-secondary/10 px-4 py-1 rounded-full border border-secondary/20">
                <span className="text-secondary font-black tracking-[0.3em] uppercase text-[10px]">Artisan Mastery</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-serif font-bold text-primary tracking-tighter">Bespoke <span className="text-secondary italic">Services</span></h2>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-[10px] border-secondary/30 text-secondary uppercase tracking-widest font-black px-3">
                  {services.length} Signature Rituals
                </Badge>
                <div className="h-[1px] w-20 bg-secondary/30"></div>
              </div>
            </div>
            <Button asChild variant="outline" className="border-primary/20 text-primary hover:bg-primary hover:text-white rounded-2xl px-10 py-7 text-xs font-black tracking-[0.2em] group transition-all duration-700 shadow-sm hover:shadow-xl">
              <Link href="/services" className="flex items-center">
                EXPLORE FULL MENU <ChevronRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          {services.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-gray-200 shadow-xs">
              <Scissors className="w-16 h-16 text-gray-200 mx-auto mb-6" />
              <h3 className="text-2xl font-serif font-bold text-gray-300 mb-2">Curating Perfection</h3>
              <p className="text-gray-400 font-light">The service menu is currently being refined by our masters.</p>
            </div>
          ) : (
            <Carousel opts={{ align: "start" }} className="w-full">
              <CarouselContent className="-ml-8">
                {services.map((service) => (
                  <CarouselItem key={service.id} className="pl-8 md:basis-1/2 lg:basis-1/4">
                    <Card className="group relative border-none bg-white shadow-[0_15px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_30px_70px_rgba(197,160,89,0.2)] overflow-hidden rounded-[3rem] transition-all duration-700 hover:-translate-y-4">
                      <div className="relative aspect-[10/11] overflow-hidden">
                        <img 
                          src={service.imageUrl || "https://images.unsplash.com/photo-1599351431247-f5094021186d?q=80&w=2070&auto=format&fit=crop"} 
                          alt={service.name} 
                          className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-primary/90 via-primary/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-700"></div>
                        
                        <div className="absolute top-6 left-6">
                          <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl">
                            {service.category}
                          </div>
                        </div>

                        <div className="absolute bottom-8 left-8 right-8 text-white">
                          <div className="flex items-center gap-2 mb-3">
                            <Clock className="w-3.5 h-3.5 text-secondary" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{service.duration} MIN Ritual</span>
                          </div>
                          <h3 className="text-2xl font-serif font-bold mb-4 line-clamp-1">{service.name}</h3>
                          <div className="flex items-center justify-between">
                            <div className="text-3xl font-serif font-black text-secondary">
                              <span className="text-xs mr-1 opacity-70">AED</span>{service.price}
                            </div>
                            <Button 
                              onClick={(e) => {
                                e.preventDefault();
                                addToCart(service);
                              }}
                              className="bg-secondary hover:bg-white text-primary font-black rounded-xl h-12 px-6 shadow-xl transition-all duration-500 hover:scale-105"
                            >
                              BOOK NOW
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-8">
                        <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2 font-light mb-6">
                          {service.description || "A master-level grooming experience designed for the modern dignitary."}
                        </p>
                        <div className="flex items-center gap-2 pt-6 border-t border-gray-50">
                          <MapPin className="w-3 h-3 text-secondary" />
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                            Available in {service.branchNames?.length || 1} Studios
                          </span>
                        </div>
                      </div>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-center gap-4 mt-12">
                <CarouselPrevious className="static translate-y-0 w-12 h-12 border-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm" />
                <CarouselNext className="static translate-y-0 w-12 h-12 border-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm" />
              </div>
            </Carousel>
          )}
        </div>
      </section>

      <section className="py-24 px-4 bg-[#0a0a0a] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_30%,rgba(197,160,89,0.08),transparent_50%)] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_80%,rgba(197,160,89,0.05),transparent_50%)] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="space-y-4">
              <div className="inline-block bg-secondary/20 px-4 py-1 rounded-full border border-secondary/40">
                <span className="text-secondary font-black tracking-[0.3em] uppercase text-[10px]">The Apothecary</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-serif font-bold text-white tracking-tighter">Premium <span className="text-secondary italic">Essentials</span></h2>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-[10px] border-white/20 text-white/60 uppercase tracking-widest font-black px-3">
                  {products.length} Curated formulas
                </Badge>
                <div className="h-[1px] w-20 bg-secondary/40"></div>
              </div>
            </div>
            <Button asChild variant="outline" className="border-white/10 text-white bg-white/5 hover:bg-white hover:text-primary rounded-2xl px-10 py-7 text-xs font-black tracking-[0.2em] group transition-all duration-700 backdrop-blur-md">
              <Link href="/products" className="flex items-center">
                VIEW FULL COLLECTION <ChevronRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-24 bg-white/5 rounded-[3rem] border border-dashed border-white/10 backdrop-blur-sm">
              <Package className="w-16 h-16 text-white/10 mx-auto mb-6" />
              <h3 className="text-2xl font-serif font-bold text-white/20 mb-2">Restocking Boutique</h3>
              <p className="text-white/20 font-light">Our signature range of formulas will return shortly.</p>
            </div>
          ) : (
            <Carousel opts={{ align: "start" }} className="w-full">
              <CarouselContent className="-ml-8">
                {products.map((product) => (
                  <CarouselItem key={product.id} className="pl-8 md:basis-1/2 lg:basis-1/5">
                    <Card className="group relative border-none bg-white/5 backdrop-blur-md overflow-hidden rounded-[2.5rem] transition-all duration-700 hover:bg-white/10 hover:-translate-y-4">
                      <div className="relative aspect-[1/1.2] overflow-hidden p-4">
                        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                        <img 
                          src={product.imageUrl || 'https://images.unsplash.com/photo-1512690196222-7c7d3f993c1b?q=80&w=2070&auto=format&fit=crop'} 
                          alt={product.name} 
                          className="w-full h-full object-contain mix-blend-lighten transition-transform duration-[1500ms] group-hover:scale-110"
                          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1512690196222-7c7d3f993c1b?q=80&w=2070&auto=format&fit=crop';
                          }}
                        />
                        <div className="absolute top-4 right-4">
                          <button 
                            onClick={() => addToCart(product)}
                            className="bg-secondary/10 hover:bg-secondary text-secondary hover:text-primary w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-secondary/20 transition-all duration-500 shadow-2xl"
                          >
                            <ShoppingBag className="w-5 h-5" />
                          </button>
                        </div>
                        {product.stock <= 5 && (
                          <div className="absolute top-4 left-4">
                            <span className="bg-red-500/80 backdrop-blur-md text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-red-500/50">
                              Limited Edition
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-6 pb-8">
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-secondary/60 mb-2 block">{product.category}</span>
                        <h3 className="text-lg font-serif font-bold text-white mb-4 line-clamp-1 group-hover:text-secondary transition-colors">{product.name}</h3>
                        <div className="flex items-center justify-between">
                          <div className="text-2xl font-serif font-black text-white">
                            <span className="text-xs text-secondary mr-1">AED</span>{product.price}
                          </div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className="w-2.5 h-2.5 fill-secondary text-secondary" />
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-center gap-4 mt-12">
                <CarouselPrevious className="static translate-y-0 w-12 h-12 border-white/10 text-white hover:bg-white hover:text-primary transition-all backdrop-blur-md" />
                <CarouselNext className="static translate-y-0 w-12 h-12 border-white/10 text-white hover:bg-white hover:text-primary transition-all backdrop-blur-md" />
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


      <section className="py-24 px-4 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="space-y-4">
              <div className="inline-block bg-secondary/10 px-4 py-1 rounded-full border border-secondary/20">
                <span className="text-secondary font-black tracking-[0.3em] uppercase text-[10px]">Elite Privileges</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-serif font-bold text-primary tracking-tighter">Exclusive <span className="text-secondary italic">Memberships</span></h2>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-[10px] border-secondary/30 text-secondary uppercase tracking-widest font-black px-3">
                  {totalActiveMemberships} Tiered Programs
                </Badge>
                <div className="h-[1px] w-20 bg-secondary/30"></div>
              </div>
            </div>
            <p className="text-muted-foreground max-w-sm text-sm font-light leading-relaxed">
              Unlock a world of priority access, curated benefits, and unparalleled grooming privileges designed for our most distinguished guests.
            </p>
          </div>
          
          {memberships.length === 0 ? (
            <div className="text-center py-24 bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-200">
              <Crown className="w-20 h-20 text-gray-200 mx-auto mb-6" />
              <h3 className="text-2xl font-serif font-bold text-gray-300 mb-2">Refining the Tiers</h3>
              <p className="text-gray-400 font-light">Our elite membership programs are currently being curated.</p>
            </div>
          ) : (
            <Carousel opts={{ align: "start", loop: true }} className="w-full">
              <CarouselContent className="-ml-8">
                {memberships.map((membership) => {
                  const TierIcon = getMembershipTierIcon(membership.tier);
                  const membershipBgColor = getMembershipTierColor(membership.tier);
                  const durationText = formatDuration(membership.duration);
                  const branchName = getFirstBranchName(membership);
                  const branchCountText = getBranchCountText(membership);
                  
                  return (
                    <CarouselItem key={membership.id} className="pl-8 md:basis-1/2 lg:basis-1/4">
                      <div className={cn(
                        "p-10 rounded-[3rem] text-white relative overflow-hidden group cursor-pointer transition-all duration-700 hover:shadow-[0_40px_80px_rgba(0,0,0,0.15)] hover:-translate-y-4 min-h-[500px] flex flex-col justify-between border border-transparent",
                        membershipBgColor
                      )}>
                        <div className="absolute inset-0 bg-linear-to-tr from-black/20 via-transparent to-white/10 opacity-50"></div>
                        
                        {membership.totalSubscriptions > 10 && (
                          <div className="absolute top-6 left-6 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[9px] font-black px-4 py-1.5 rounded-full z-20 uppercase tracking-[0.2em] shadow-xl">
                            MOST COVETED
                          </div>
                        )}
                        
                        <div className="absolute -right-10 -top-10 opacity-10 group-hover:scale-125 group-hover:rotate-45 transition-all duration-1000">
                          <Crown className="w-48 h-48 rotate-12" />
                        </div>
                        
                        <div className="relative z-10 space-y-8">
                          <div className="flex items-start justify-between">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-2xl">
                              <TierIcon className="w-7 h-7 text-white" />
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 block mb-1">Duration</span>
                              <span className="text-sm font-serif font-bold italic">{durationText}</span>
                            </div>
                          </div>
                          
                          <div>
                            <div className="inline-block px-3 py-1 bg-white/10 rounded-full border border-white/20 text-[9px] font-black uppercase tracking-widest mb-4">
                              {membership.tier.toUpperCase()} TIER
                            </div>
                            <h4 className="text-5xl font-serif font-black mb-2 leading-none flex items-baseline">
                              <span className="text-lg opacity-60 mr-1 font-sans">AED</span>{membership.price}
                            </h4>
                            <h5 className="text-2xl font-serif font-bold mt-2 tracking-tight">{membership.name}</h5>
                          </div>
                          
                          <p className="text-xs opacity-70 font-light leading-relaxed line-clamp-2">
                            {membership.description || "The ultimate blueprint for modern grooming excellence and lifestyle benefits."}
                          </p>
                          
                          <div className="space-y-4">
                            <span className="text-[10px] uppercase tracking-[0.3em] font-black opacity-50 block">Exclusive Benefits</span>
                            <div className="space-y-3">
                              {membership.benefits.slice(0, 3).map((benefit, index) => (
                                <div key={index} className="flex items-center gap-3">
                                  <div className="w-5 h-5 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                                    <Check className="w-3 h-3 text-white" />
                                  </div>
                                  <span className="text-xs font-medium opacity-90">{benefit}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="relative z-10 pt-8 mt-8 border-t border-white/10 flex items-center justify-between">
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase tracking-widest opacity-50 font-black">Regional Access</span>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3 text-white/60" />
                              <span className="text-[10px] font-bold tracking-widest">
                                {branchCountText.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          
                          <Button 
                            variant="ghost" 
                            className="rounded-2xl bg-white/10 hover:bg-white text-white hover:text-primary w-14 h-14 p-0 shadow-2xl transition-all duration-500"
                          >
                            <ArrowRight className="w-6 h-6" />
                          </Button>
                        </div>
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <div className="flex justify-center gap-4 mt-12">
                <CarouselPrevious className="static translate-y-0 w-12 h-12 border-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm" />
                <CarouselNext className="static translate-y-0 w-12 h-12 border-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm" />
              </div>
            </Carousel>
          )}
        </div>
      </section>

      <section className="py-32 px-4 bg-gray-50/50 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20 space-y-6">
            <div className="inline-block bg-secondary/10 px-5 py-2 rounded-full border border-secondary/20">
              <span className="text-secondary font-black tracking-[0.4em] uppercase text-[10px]">The Masters of Craft</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-serif font-black text-primary tracking-tighter">Artisans & <span className="text-secondary italic">Visionaries</span></h2>
            <p className="text-muted-foreground max-w-2xl mx-auto font-light text-xl leading-relaxed">
              Our masters are more than just barbers; they are the architects of character and the guardians of traditional excellence.
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="h-[1px] w-12 bg-secondary/30"></div>
              <Badge variant="outline" className="border-secondary/30 text-secondary text-[10px] font-black tracking-widest px-4 uppercase">
                {staff.length} Elite Masters
              </Badge>
              <div className="h-[1px] w-12 bg-secondary/30"></div>
            </div>
          </div>

          {staff.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-gray-200 shadow-xs">
              <Users className="w-20 h-20 text-gray-200 mx-auto mb-6" />
              <h3 className="text-2xl font-serif font-bold text-gray-400 mb-2">Summoning the Masters</h3>
              <p className="text-gray-400 font-light">Our artisans are currently in session.</p>
            </div>
          ) : (
            <Carousel opts={{ align: "start", loop: true }} className="w-full">
              <CarouselContent className="-ml-8">
                {staff.map((member) => (
                  <CarouselItem key={member.id} className="pl-8 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/6">
                    <div className="group cursor-pointer">
                      <div className="relative aspect-[3/4.5] overflow-hidden rounded-[2.5rem] mb-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] group-hover:shadow-[0_40px_80px_rgba(197,160,89,0.2)] transition-all duration-700">
                        <img 
                          src={member.image} 
                          alt={member.name}
                          className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-primary/95 via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 flex flex-col justify-end p-8">
                          <div className="translate-y-10 group-hover:translate-y-0 transition-transform duration-700 space-y-4">
                            <div className="flex gap-3">
                              <a href="#" className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary hover:scale-110 transition-all shadow-2xl">
                                <Instagram className="w-4 h-4" />
                              </a>
                              <a href="#" className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-secondary hover:text-primary transition-all shadow-2xl">
                                <Phone className="w-4 h-4" />
                              </a>
                            </div>
                            <Button asChild className="w-full bg-white text-primary hover:bg-secondary hover:text-primary rounded-xl h-12 font-black text-[9px] tracking-[0.2em] shadow-2xl">
                              <Link href={`/staff/${member.id}`}>VIEW PORTFOLIO</Link>
                            </Button>
                          </div>
                        </div>
                        
                        <div className="absolute top-6 left-6 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                           <div className="bg-secondary/90 backdrop-blur-md text-primary px-3 py-1 rounded-lg font-black text-[8px] uppercase tracking-widest shadow-2xl">
                             LEVEL: {member.role.split(' ')[0]}
                           </div>
                        </div>
                      </div>

                      <div className="text-center px-2">
                        <h3 className="text-2xl font-serif font-black text-primary mb-2 group-hover:text-secondary transition-colors duration-500 tracking-tight lowercase first-letter:uppercase">
                          {member.name}
                        </h3>
                        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-secondary mb-4 opacity-70 group-hover:opacity-100 transition-opacity">
                          {member.role}
                        </div>
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <div className="flex gap-0.5">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} className={cn(
                                "w-2.5 h-2.5",
                                s <= Math.floor(member.rating) ? "fill-secondary text-secondary" : "text-gray-200"
                              )} />
                            ))}
                          </div>
                          <span className="text-[10px] font-black text-primary">{member.rating.toFixed(1)}</span>
                        </div>
                        <div className="h-[1px] w-8 bg-gray-100 mx-auto group-hover:w-full group-hover:bg-secondary/20 transition-all duration-700"></div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="flex justify-center gap-6 mt-16">
                <CarouselPrevious className="static translate-y-0 w-12 h-12 border-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm" />
                <CarouselNext className="static translate-y-0 w-12 h-12 border-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-sm" />
              </div>
            </Carousel>
          )}
        </div>
      </section>

      <section className="py-24 px-4 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.01] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
            <div className="space-y-4">
              <div className="inline-block bg-secondary/10 px-4 py-1 rounded-full border border-secondary/20">
                <span className="text-secondary font-black tracking-[0.3em] uppercase text-[10px]">Territorial Mastery</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-serif font-black text-primary leading-[1] tracking-tighter">
                Luxury Presence, <br /><span className="text-secondary italic">Everywhere.</span>
              </h2>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-[10px] border-secondary/30 text-secondary uppercase tracking-widest font-black px-3">
                  {branches.length} Flagship Studios
                </Badge>
                <div className="h-[1px] w-20 bg-secondary/30"></div>
              </div>
            </div>
            <p className="text-muted-foreground max-w-sm text-sm font-light leading-relaxed">
              Experience the pinnacle of grooming at any of our {branches.length} curated sanctuaries across the region.
            </p>
          </div>

          {branches.length === 0 ? (
            <div className="text-center py-24 bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-200">
              <Building className="w-16 h-16 text-gray-200 mx-auto mb-6" />
              <h3 className="text-2xl font-serif font-bold text-gray-300 mb-2">Establishing Footprints</h3>
              <p className="text-gray-400 font-light">New studios are currently under commission.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {branches.map((branch) => (
                <div key={branch.id} className="flex flex-col p-8 rounded-[2.5rem] bg-gray-50 border border-gray-100 hover:border-secondary/30 hover:bg-white hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)] transition-all duration-700 group cursor-pointer relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-16 -mt-16 group-hover:bg-secondary/10 transition-colors"></div>
                  
                  <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-primary transition-all duration-500 shadow-sm mb-8 z-10">
                    <MapPin className="w-7 h-7" />
                  </div>
                  
                  <div className="space-y-4 z-10">
                    <div>
                      <h4 className="font-serif font-black text-primary text-xl tracking-tight mb-2">
                        {branch.name}
                      </h4>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full scale-100 group-hover:scale-125 transition-transform",
                          branch.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'
                        )}></div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                          {branch.status} studio
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground font-light leading-relaxed">
                      {branch.address}, {branch.city}
                    </p>
                    
                    <div className="pt-6 border-t border-gray-100 space-y-3">
                      <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold tracking-widest uppercase">
                        <span>Lobby:</span>
                        <span className="text-primary">{branch.openingTime} - {branch.closingTime}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold tracking-widest uppercase">
                        <span>Direct:</span>
                        <span className="text-primary">{branch.phone}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 flex justify-end group-hover:translate-x-2 transition-transform opacity-0 group-hover:opacity-100">
                    <ArrowRight className="w-5 h-5 text-secondary" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {branches.length > 0 && (
            <div className="text-center mt-20">
              <Button size="lg" asChild className="bg-primary hover:bg-white border-2 border-primary hover:text-primary px-12 py-8 rounded-2xl group shadow-2xl transition-all duration-700 hover:scale-110 active:scale-95">
                <Link href="/branches" className="flex items-center justify-center gap-4 font-black tracking-[0.3em] text-[10px]">
                  EXPLORE ALL STUDIOS <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="py-32 px-4 bg-primary relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-30%] left-[-10%] w-[70%] h-[70%] rounded-full bg-secondary blur-[180px] animate-slow-pulse"></div>
          <div className="absolute bottom-[-30%] right-[-10%] w-[70%] h-[70%] rounded-full bg-secondary blur-[180px] animate-slow-pulse"></div>
        </div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-block bg-secondary/20 px-6 py-2 rounded-full mb-10 border border-secondary/30 backdrop-blur-md">
            <span className="text-secondary font-black tracking-[0.4em] uppercase text-[10px]">The Signature Dispatch</span>
          </div>
          <h2 className="text-6xl md:text-8xl font-serif font-black text-white mb-10 leading-[1] tracking-tighter">
            Enter The <br /><span className="text-secondary italic">Inner Circle</span>
          </h2>
          <p className="text-xl text-gray-400 mb-16 font-light max-w-2xl mx-auto leading-relaxed opacity-80">
            Subscribe to our private dispatch for exclusive invitations, masterclass insights, and first access to our most prestigious studio events.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 max-w-3xl mx-auto bg-white/5 p-4 rounded-[3rem] border border-white/10 backdrop-blur-2xl shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
            <input 
              placeholder="Your email for exclusive access" 
              className="h-20 bg-transparent text-white rounded-[2rem] px-10 focus:outline-none transition-all w-full font-light text-xl placeholder:text-gray-600"
            />
            <Button size="lg" className="h-20 bg-secondary text-primary hover:bg-white hover:scale-105 transition-all duration-700 font-black px-14 rounded-[2rem] shrink-0 tracking-[0.3em] text-[10px] shadow-2xl">
              SECURE ACCESS
            </Button>
          </div>
          <div className="mt-12 flex items-center justify-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></div>
             <p className="text-[10px] text-gray-500 uppercase tracking-[0.4em] font-black">
                Privacy is our absolute philosophy.
             </p>
          </div>
        </div>
      </section>

      <section className="relative py-56 px-4 overflow-hidden group">
        <div 
          className="absolute inset-0 bg-cover bg-fixed bg-center scale-105 transition-transform duration-[3000ms] group-hover:scale-110"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1512690196222-7c7d3f993c1b?q=80&w=2070&auto=format&fit=crop')" }}
        >
          <div className="absolute inset-0 bg-linear-to-b from-primary/95 via-primary/70 to-primary/95"></div>
          <div className="absolute inset-0 bg-linear-to-r from-primary via-transparent to-primary opacity-60"></div>
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto text-center text-white space-y-16">
          <div className="space-y-6">
            <span className="text-[11px] font-black uppercase tracking-[0.6em] text-secondary opacity-80 mb-4 block">Final Invitation</span>
            <h2 className="text-7xl md:text-9xl font-serif font-black leading-[0.9] tracking-tighter drop-shadow-2xl">
              The Chair <br />
              <span className="text-secondary italic">Awaits.</span>
            </h2>
          </div>
          
          <p className="text-xl md:text-3xl text-gray-300 max-w-4xl mx-auto font-light leading-relaxed opacity-90 drop-shadow-xl italic font-serif">
            "Every cut is a signature, every service a ritual, every visit an evolution of self."
          </p>
          
          <div className="flex flex-col sm:flex-row gap-10 justify-center pt-10">
            <Button size="lg" asChild className="bg-secondary hover:bg-white text-primary font-black px-16 py-12 text-sm rounded-[2rem] shadow-[0_30px_70px_rgba(197,160,89,0.4)] transition-all duration-700 hover:scale-110 active:scale-95 tracking-[0.3em] border-none">
              <Link href="/services">BOOK APPOINTMENT</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white/20 text-white hover:bg-white/10 hover:border-white/40 px-16 py-12 text-sm rounded-[2rem] backdrop-blur-xl transition-all duration-700 hover:scale-110 active:scale-95 tracking-[0.3em]">
              <Link href="/login">BECOME A MEMBER</Link>
            </Button>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 w-full h-32 bg-linear-to-t from-[#050505] to-transparent"></div>
      </section>

      <footer className="bg-[#050505] text-white py-32 px-4 border-t border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20">
            <div className="space-y-12">
              <Link href="/" className="inline-block group">
                <h3 className="text-4xl font-serif font-black tracking-tighter group-hover:scale-105 transition-transform duration-500">
                  PREMIUM<span className="text-secondary">CUTS</span>
                </h3>
                <div className="h-[2px] w-0 group-hover:w-full bg-secondary transition-all duration-700"></div>
              </Link>
              <div className="space-y-6">
                <p className="text-gray-500 text-lg leading-relaxed font-light max-w-xs italic font-serif">
                  "Excellence is not an act, but a habit. Since 2015, we've defined the standard of luxury grooming."
                </p>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center border border-secondary/20">
                      <CheckCircle2 className="w-4 h-4 text-secondary" />
                    </div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-black">
                      {stats.totalServices} Signature Rituals
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center border border-secondary/20">
                      <Users className="w-4 h-4 text-secondary" />
                    </div>
                    <span className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-black">
                      {stats.totalStaff} Master Artisans
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                {[Instagram, Facebook, Phone, Mail].map((Icon, i) => (
                  <div key={i} className="w-14 h-14 rounded-2xl border border-white/5 bg-white/5 flex items-center justify-center hover:bg-secondary hover:text-primary transition-all duration-700 cursor-pointer group shadow-2xl">
                    <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="lg:pl-10">
              <h4 className="font-black mb-12 uppercase tracking-[0.4em] text-[10px] text-secondary">The Collection</h4>
              <ul className="space-y-5 text-gray-500 text-sm font-medium">
                {[
                  { label: 'Artisan Services', href: '/services' },
                  { label: 'Grooming Boutique', href: '/products' },
                  { label: 'Studio Locator', href: '/branches' },
                  { label: 'Elite Membership', href: '/membership' },
                  { label: 'The Masters', href: '/staff' }
                ].map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="hover:text-secondary transition-all duration-500 flex items-center group tracking-widest text-[11px] uppercase font-black">
                      <span className="w-0 group-hover:w-4 h-[1px] bg-secondary mr-0 group-hover:mr-3 transition-all duration-500"></span>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:pl-10">
              <h4 className="font-black mb-12 uppercase tracking-[0.4em] text-[10px] text-secondary">Support</h4>
              <ul className="space-y-6 text-gray-500 text-sm font-medium">
                {[
                  { label: 'Guest Concierge', href: '/contact' },
                  { label: 'Booking Guide', href: '/faq' },
                  { label: 'Terms of Honor', href: '/terms' },
                  { label: 'Privacy Sanctum', href: '/privacy' },
                  { label: 'Careers', href: '/careers' }
                ].map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="hover:text-secondary transition-all duration-500 flex items-center group tracking-widest text-[11px] uppercase font-black">
                      <span className="w-0 group-hover:w-4 h-[1px] bg-secondary mr-0 group-hover:mr-3 transition-all duration-500"></span>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-12">
              <h4 className="font-black mb-12 uppercase tracking-[0.4em] text-[10px] text-secondary">Headquarters</h4>
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <MapPin className="w-5 h-5 text-secondary shrink-0 mt-1" />
                  <div>
                    <p className="text-white font-serif font-black text-lg mb-2">Dubai Design District</p>
                    <p className="text-gray-500 text-sm font-light leading-relaxed">
                      Studio 402, Building 7<br />
                      Dubai, United Arab Emirates
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Phone className="w-5 h-5 text-secondary shrink-0 mt-1" />
                  <div>
                    <p className="text-white font-serif font-black text-lg mb-2">Concierge</p>
                    <p className="text-gray-500 text-sm font-light">+971 (0) 4 123 4567</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-32 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
            <p className="text-[10px] text-gray-600 uppercase tracking-[0.4em] font-black">
              © {new Date().getFullYear()} Premium Cuts Intl. All Rights Reserved.
            </p>
            <div className="flex gap-10">
              <span className="text-[9px] text-gray-600 uppercase tracking-widest font-black hover:text-white cursor-pointer transition-colors">United Arab Emirates</span>
              <span className="text-[9px] text-gray-600 uppercase tracking-widest font-black hover:text-white cursor-pointer transition-colors">English (INTL)</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}