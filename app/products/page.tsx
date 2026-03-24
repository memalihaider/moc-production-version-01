'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import { Search, Star, ShoppingCart, Filter, Package, Check, Sparkles, ChevronRight, TrendingUp, RefreshCw, Trash2, Building } from 'lucide-react';
import { useCMSStore } from '@/stores/cms.store';
import { create } from 'zustand';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  where, 
  addDoc, 
  serverTimestamp, 
  getDoc, 
  updateDoc, 
  increment,
  doc,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';

// ✅ IMPORT BRANCH STORE
import { useBranchStore } from '@/stores/branchStore';

// Types Definition
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
  createdAt: any;
  updatedAt: any;
}

interface StaffMember {
  id: string;
  name: string;
  image: string;
  position?: string;
  // Firebase fields
  avatar?: string;
  role?: string;
}

interface CartItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  rating: number;
  reviews: number;
  sku: string;
  quantity: number;
  cost: number;
  productCategoryId?: string;
  productSku?: string;
  productImage?: string;
  branches?: string[];
  branchNames?: string[];
}

interface ProductsStore {
  products: Product[];
  fetchProducts: () => Promise<void>;
}

const useProductsStore = create<ProductsStore>((set) => ({
  products: [],

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
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      
      set({ products: productsData });
    } catch (error) {
      console.error('Error fetching products:', error);
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
        
        // 🔥 FIXED: Proper image fetching from Firebase
        // Firebase mein field name "avatar" hai
        let imageUrl = '/default-avatar.png'; // Default fallback
        
        // Check karo ke konsa field available hai
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
          image: imageUrl, // ✅ Proper image URL
          position: data.position || data.role || 'Barber',
          // Store original fields for debugging
          avatar: data.avatar,
          role: data.role,
        });
      });
      
      console.log('✅ Staff fetched with images:', staffData.map(s => ({
        name: s.name,
        image: s.image
      })));
      
      set({ staff: staffData });
    } catch (error) {
      console.error('Error fetching staff:', error);
      set({ staff: [] });
    }
  },
}));

interface CartStore {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  loadCartFromStorage: () => void;
}

const useCartStore = create<CartStore>((set, get) => ({
  cartItems: [],
  
  loadCartFromStorage: () => {
    const savedCart = localStorage.getItem('productCart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        set({ cartItems: parsedCart });
      } catch (error) {
        console.error('Error loading cart from storage:', error);
      }
    }
  },
  
  addToCart: (item: CartItem) => set((state) => {
    const existingItem = state.cartItems.find(cartItem => cartItem.id === item.id);
    let newCart;
    
    if (existingItem) {
      newCart = state.cartItems.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );
    } else {
      newCart = [...state.cartItems, { ...item, quantity: 1 }];
    }
    
    // Save to localStorage
    localStorage.setItem('productCart', JSON.stringify(newCart));
    return { cartItems: newCart };
  }),
  
  removeFromCart: (id: string) => set((state) => {
    const newCart = state.cartItems.filter(item => item.id !== id);
    localStorage.setItem('productCart', JSON.stringify(newCart));
    return { cartItems: newCart };
  }),
  
  updateQuantity: (id: string, quantity: number) => set((state) => {
    const newCart = state.cartItems.map(item =>
      item.id === id ? { ...item, quantity } : item
    );
    localStorage.setItem('productCart', JSON.stringify(newCart));
    return { cartItems: newCart };
  }),
  
  clearCart: () => {
    localStorage.removeItem('productCart');
    set({ cartItems: [] });
  },
  
  getTotal: () => {
    const state = get();
    return state.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
}));

type SortOption = 'price-asc' | 'price-desc' | 'name' | 'rating' | 'newest';

interface StockStatus {
  label: string;
  color: string;
  badge: string;
}

// X Icon Component
function X(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

// Main Component
export default function ProductsPage() {
  const router = useRouter();
  
  // ✅ Branch store se values lo
  const { selectedBranch, branches, loading: branchesLoading } = useBranchStore();
  const { fetchCMSData, getPageHero } = useCMSStore();
  const productsHero = getPageHero('products');
  
  const { products, fetchProducts } = useProductsStore();
  const { staff, fetchStaff } = useStaffStore();
  const { addToCart, cartItems, loadCartFromStorage, clearCart } = useCartStore();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showClearCartConfirm, setShowClearCartConfirm] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  
  // ✅ Branch filter notification ke liye
  const [showBranchFilter, setShowBranchFilter] = useState<boolean>(false);

  // ===== CHAT LOGIC (Copied from Home Page) =====
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check login status
  useEffect(() => {
    fetchCMSData();
    const checkLogin = () => {
      // Check if user is logged in (update this based on your auth system)
      const user = localStorage.getItem('user'); // or cookies, or context
      setIsLoggedIn(!!user);
    };
    
    checkLogin;
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

  // Load cart from localStorage on mount
  useEffect(() => {
    loadCartFromStorage();
    fetchProducts();
    fetchStaff();
  }, [fetchProducts, fetchStaff, loadCartFromStorage]);

  // ✅ DEBUG: Log branch changes
  useEffect(() => {
    console.log('🔍 Products - Selected Branch:', selectedBranch);
    console.log('🔍 Products - Total Products:', products.length);
    console.log('🔍 Products - Filtered Products:', filteredAndSortedProducts.length);
  }, [selectedBranch, products]);

  // Get unique categories from products
  const categories = [
    { id: 'all', name: 'All Products' },
    ...Array.from(new Set(products.map(p => p.category)))
      .filter((category): category is string => Boolean(category && category.trim() !== ''))
      .map(category => ({
        id: category.toLowerCase().replace(/\s+/g, '-'),
        name: category
      }))
  ];

  // Get current selected branch name for display
  const currentBranchName = selectedBranch === 'all' 
    ? 'All Branches' 
    : branches.find(b => b.name === selectedBranch)?.name || selectedBranch;

  // ==================== FILTER PRODUCTS BY BRANCH ====================
  // Filter and sort products
  const filteredAndSortedProducts = products
    .filter(product => {
      // Category filter
      const matchesCategory = selectedCategory === 'all' || 
        product.category?.toLowerCase().replace(/\s+/g, '-') === selectedCategory;
      
      // Search filter
      const matchesSearch = searchQuery === '' || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Staff filter (if applicable)
      const matchesStaff = selectedStaff === 'all';
      
      // ===== BRANCH FILTER - YEH MAIN LOGIC HAI =====
      let matchesBranch = true;
      
      if (selectedBranch !== 'all') {
        // Check if product is available in selected branch
        if (product.branchNames && product.branchNames.length > 0) {
          matchesBranch = product.branchNames.includes(selectedBranch);
        } else if (product.branches && product.branches.length > 0) {
          matchesBranch = product.branches.includes(selectedBranch);
        } else {
          matchesBranch = false; // Sirf unhen dikhao jin ki branch info ho
        }
      }
      
      return matchesCategory && matchesSearch && matchesStaff && matchesBranch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return b.rating - a.rating;
        case 'newest':
          const aDate = a.createdAt?.toDate?.();
          const bDate = b.createdAt?.toDate?.();
          if (aDate && bDate) {
            return bDate.getTime() - aDate.getTime();
          }
          return 0;
        default:
          return 0;
      }
    });

  // Handle Clear Cart
  const handleClearCart = () => {
    clearCart();
    setShowClearCartConfirm(false);
  };

  // Handle View Cart - MANUAL REDIRECT only on button click
  const handleViewCart = () => {
    router.push('/checkout');
  };

  // Handle Add to Cart - NO REDIRECT, only button change
  const handleAddToCart = async (product: Product) => {
    // Check stock availability
    if (product.totalStock <= 0) {
      alert(`${product.name} is out of stock!`);
      return;
    }

    // Create cart item with branch data
    const cartItem: CartItem = {
      id: product.id,
      name: product.name,
      category: product.category || 'Product',
      price: product.price || 0,
      description: product.description || '',
      image: product.imageUrl || 'https://images.unsplash.com/photo-1512690196222-7c7d3f993c1b?q=80&w=2070&auto=format&fit=crop',
      rating: product.rating || 0,
      reviews: product.reviews || 0,
      sku: product.sku || 'N/A',
      quantity: 1,
      cost: product.cost || 0,
      productCategoryId: product.categoryId,
      productSku: product.sku,
      productImage: product.imageUrl,
      branches: product.branches || [],
      branchNames: product.branchNames || []
    };

    // Check if product already in cart
    const existingCart = JSON.parse(localStorage.getItem('productCart') || '[]');
    const existingItemIndex = existingCart.findIndex((item: CartItem) => item.id === product.id);
    
    if (existingItemIndex !== -1) {
      // Product already in cart - just increase quantity
      existingCart[existingItemIndex].quantity += 1;
    } else {
      // Add new product to cart
      existingCart.push(cartItem);
    }
    
    // Save to localStorage
    localStorage.setItem('productCart', JSON.stringify(existingCart));

    // Add to Zustand store
    addToCart(cartItem);
  };

  // Calculate statistics
  const totalSold = products.reduce((sum, p) => sum + p.totalSold, 0);
  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
  const outOfStockProducts = products.filter(p => p.totalStock <= 0).length;

  // Get stock status
  const getStockStatus = (stock: number): StockStatus => {
    if (stock <= 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800', badge: 'bg-red-500' };
    if (stock <= 5) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', badge: 'bg-yellow-500' };
    if (stock <= 20) return { label: 'In Stock', color: 'bg-blue-100 text-blue-800', badge: 'bg-blue-500' };
    return { label: 'High Stock', color: 'bg-green-100 text-green-800', badge: 'bg-green-500' };
  };

  // 🔥 Debug: Log staff data to console
  useEffect(() => {
    if (staff.length > 0) {
      console.log('Staff data with images:', staff);
    }
  }, [staff]);

  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      <Header />

      {/* ✅ Branch Filter Notification */}
      {showBranchFilter && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-secondary text-primary px-4 py-2 rounded-full shadow-lg animate-in fade-in slide-in-from-top-5">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            <span className="font-bold text-sm">Showing products for: {currentBranchName}</span>
          </div>
        </div>
      )}

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

      {/* Premium Hero Section with Video Background */}
      <section className="relative h-[500px] md:h-[500px] lg:h-[600px] overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full">
          {productsHero?.backgroundType === 'video' ? (
            <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
              <source src={productsHero?.backgroundUrl || 'https://www.pexels.com/download/video/7291771/'} type="video/mp4" />
            </video>
          ) : (
            <img src={productsHero?.backgroundUrl || ''} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          
          {/* Light Overlay - text readable with visible video */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-primary/70"></div>
        </div>

        {/* Content Overlay - Centered with better spacing */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
          <div className="max-w-6xl mx-auto text-center px-4 -mt-12 md:-mt-16">
            {/* Badge with proper spacing from top */}
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full mb-8 border border-white/20 shadow-lg">
              <Package className="w-4 h-4 text-secondary" />
              <span className="text-secondary font-black tracking-[0.3em] uppercase text-[10px]">{productsHero?.badgeText || 'The Apothecary'}</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-sans font-bold text-white mb-6 leading-tight">
              {productsHero?.heading || 'Grooming'} <span className="text-secondary italic">{productsHero?.headingHighlight || 'Collection'}</span>
            </h1>
            
            {/* Branch count badge - Updated */}
            <div className="flex items-center justify-center gap-4 text-white/80 text-sm mb-8">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <Building className="w-4 h-4 text-secondary" />
                <span>{branches.length} Branches</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <Package className="w-4 h-4 text-secondary" />
                <span>{products.length} Products</span>
              </div>
            </div>

            <p className="text-gray-300 max-w-2xl mx-auto text-lg font-light leading-relaxed mb-8">
              {productsHero?.subHeading || 'Professional-grade essentials for the modern gentleman.'}
            </p>

            {/* Optional: Call to Action Button */}
            <div className="pointer-events-auto">
              <button className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white font-semibold px-8 py-4 rounded-full border border-white/30 transition-all duration-300 hover:scale-105 shadow-xl">
                Explore Collection
              </button>
            </div>

            {/* Optional: Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce pointer-events-auto">
              <div className="w-8 h-12 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
                <div className="w-1 h-3 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    
      {/* Filters Section */}
      <section className="sticky top-16 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 py-6 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Search and Filters Row */}
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full lg:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-secondary transition-colors" />
              <Input 
                placeholder="Search products by name, SKU, or description..." 
                className="pl-11 rounded-2xl border-gray-200 bg-white/80 text-sm h-12 focus:ring-2 focus:ring-secondary focus:border-transparent transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* ✅ Branch Filter Dropdown */}
            <div className="w-full lg:w-64">
              <Select 
                value={selectedBranch} 
                onValueChange={(value) => {
                  setShowBranchFilter(true);
                  setTimeout(() => setShowBranchFilter(false), 3000);
                }}
                disabled={branchesLoading}
              >
                <SelectTrigger className="w-full h-12 border-secondary/20 text-primary focus:ring-secondary/30 rounded-2xl">
                  <SelectValue placeholder={branchesLoading ? "Loading branches..." : "Select Branch"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-primary/70">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      <span>All Branches ({branches.length})</span>
                    </div>
                  </SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.name} className="text-primary">
                      <div className="flex items-center gap-2">
                        {branch.image && (
                          <div className="w-5 h-5 rounded-full overflow-hidden">
                            <img 
                              src={branch.image} 
                              alt={branch.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://via.placeholder.com/20";
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

            {/* Sort Dropdown */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 font-medium">Sort by:</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:ring-2 focus:ring-secondary focus:border-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name">Name A-Z</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>

           
          </div>

          {/* ✅ Branch Filter Info */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Building className="w-3 h-3" />
              Showing products for: <span className="font-bold text-secondary">{currentBranchName}</span>
              {selectedBranch !== 'all' && (
                <button 
                  onClick={() => {
                    setShowBranchFilter(true);
                    setTimeout(() => setShowBranchFilter(false), 3000);
                  }}
                  className="ml-2 text-xs text-secondary underline"
                >
                  Show all
                </button>
              )}
            </p>
            {filteredAndSortedProducts.length > 0 && (
              <Badge variant="outline" className="text-gray-600">
                {filteredAndSortedProducts.length} products available
              </Badge>
            )}
          </div>
        </div>
      </section>

      {/* Products Grid Section */}
      <section className="py-20 px-4 bg-linear-to-b from-gray-50/50 to-white">
        <div className="max-w-7xl mx-auto">
          {/* Products Count and Stats with Clear Cart Button */}
          <div className="mb-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-sans font-bold text-primary">
                Premium Products Collection
                <span className="text-secondary ml-2">({filteredAndSortedProducts.length})</span>
              </h2>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                {products.filter(p => p.status === 'active').length} Active
              </Badge>
              <Badge className={cn(
                "hover:bg-red-100",
                outOfStockProducts > 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
              )}>
                <div className={cn(
                  "w-2 h-2 rounded-full mr-2",
                  outOfStockProducts > 0 ? "bg-red-500" : "bg-green-500"
                )}></div>
                {outOfStockProducts} Out of Stock
              </Badge>
            </div>
          </div>

          {/* Products Grid */}
          {filteredAndSortedProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-4xl shadow-sm border border-gray-100">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                {selectedBranch !== 'all' ? (
                  <Building className="w-12 h-12 text-gray-300" />
                ) : (
                  <Search className="w-12 h-12 text-gray-300" />
                )}
              </div>
              <h3 className="text-3xl font-sans font-bold text-primary mb-3">
                {selectedBranch !== 'all' ? 'No Products in this Branch' : 'No Matching Products'}
              </h3>
              <p className="text-gray-500 font-light mb-8 max-w-md mx-auto">
                {selectedBranch !== 'all' 
                  ? `No products available at ${selectedBranch}. Please select a different branch.`
                  : 'No products match your current filters. Try adjusting your search criteria.'}
              </p>
              <div className="flex gap-3 justify-center">
                {selectedBranch !== 'all' && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowBranchFilter(true);
                      setTimeout(() => setShowBranchFilter(false), 3000);
                    }}
                    className="rounded-full px-8 border-secondary text-secondary hover:bg-secondary hover:text-primary font-bold tracking-widest text-[10px]"
                  >
                    <Building className="w-4 h-4 mr-2" />
                    VIEW ALL BRANCHES
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedCategory('all'); 
                    setSearchQuery(''); 
                    setSelectedStaff('all'); 
                    setSortBy('newest');
                  }}
                  className="rounded-full px-8 border-secondary text-secondary hover:bg-secondary hover:text-primary font-bold tracking-widest text-[10px]"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  CLEAR ALL FILTERS
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredAndSortedProducts.map((product) => {
                const stockStatus = getStockStatus(product.totalStock);
                // Check if product is in cart
                const isInCart = cartItems.some(item => item.id === product.id);
                
                return (
                  <div 
                    key={product.id} 
                    className={cn(
                      "group bg-white border border-gray-100 transition-all duration-500 p-5 rounded-3xl flex flex-col shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] relative",
                      product.totalStock <= 0 
                        ? "opacity-80" 
                        : "hover:border-secondary/20"
                    )}
                  >
                    {/* Out of Stock Overlay */}
                    {product.totalStock <= 0 && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 rounded-3xl flex items-center justify-center">
                        <Badge className="bg-red-500 text-white border-none px-3 py-1.5 text-[10px] font-black tracking-widest shadow-lg">
                          OUT OF STOCK
                        </Badge>
                      </div>
                    )}
                    
                    {/* Product Image */}
                    <div className="relative aspect-square overflow-hidden mb-4 bg-gray-50 rounded-2xl transition-all duration-500">
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1512690196222-7c7d3f993c1b?q=80&w=2070&auto=format&fit=crop';
                        }}
                      />
                      
                      {/* Image Overlay */}
                      <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      {/* Stock Status Badge */}
                      <div className="absolute top-3 left-3">
                        <Badge className={cn(
                          "border-none px-2 py-1 text-[7px] font-black tracking-[0.2em] uppercase shadow-md",
                          stockStatus.badge
                        )}>
                          {stockStatus.label}
                        </Badge>
                      </div>
                      
                      {/* Price Badge */}
                      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                        <div className="bg-white/95 backdrop-blur-sm text-black px-3 py-1.5 rounded-lg font-black text-xs shadow-xl">
                          AED {product.price}
                        </div>
                      </div>
                      
                      {/* Profit Margin Indicator */}
                      {product.cost > 0 && (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-black/70 text-white border-none px-2 py-1 text-[7px] font-bold">
                            {Math.round(((product.price - product.cost) / product.cost) * 100)}%
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-1 space-y-2 flex flex-col">
                      {/* Rating */}
                      <div className="flex justify-end items-center">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-[10px] font-bold">{product.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      
                      {/* Product Name */}
                      <h4 className="text-base font-sans font-bold text-primary group-hover:text-secondary transition-colors duration-300 line-clamp-2 min-h-11">
                        {product.name}
                      </h4>
                      
                      {/* Description */}
                      <p className="text-gray-500 text-[11px] font-light leading-relaxed line-clamp-2 min-h-8">
                        {product.description || 'Premium grooming product for the modern gentleman.'}
                      </p>
                      
                      {/* ✅ Branch Availability Badge */}
                      {product.branchNames && product.branchNames.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {product.branchNames.slice(0, 2).map((branch, i) => (
                            <Badge 
                              key={i} 
                              variant="outline" 
                              className={cn(
                                "text-[6px] px-1 py-0.5",
                                branch === selectedBranch 
                                  ? "bg-secondary/20 border-secondary text-secondary font-bold" 
                                  : "border-gray-200 text-gray-500"
                              )}
                            >
                              {branch}
                            </Badge>
                          ))}
                          {product.branchNames.length > 2 && (
                            <Badge variant="outline" className="text-[6px] px-1 py-0.5 border-gray-200 text-gray-500">
                              +{product.branchNames.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {/* SKU and Stock Info */}
                      <div className="space-y-1 pt-2 border-t border-gray-50 mt-auto">
                        <div className="flex justify-between items-center text-[9px] text-gray-500">
                          <span className="font-medium uppercase tracking-widest text-[8px]">SKU: {product.sku}</span>
                          <span className={cn(
                            "font-bold uppercase tracking-widest text-[8px]",
                            product.totalStock <= 5 ? "text-yellow-600" : "text-green-600"
                          )}>
                            {product.totalStock} UNITS
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* BUTTON LOGIC - Manual redirect only on VIEW CART click */}
                    <Button 
                      onClick={() => {
                        if (isInCart) {
                          handleViewCart();
                        } else {
                          handleAddToCart(product);
                        }
                      }}
                      disabled={product.totalStock <= 0}
                      className={cn(
                        "w-full mt-4 h-11 rounded-xl font-black tracking-[0.2em] text-[9px] transition-all duration-500 shadow-md",
                        isInCart 
                          ? "bg-green-600 hover:bg-green-600 text-white" 
                          : product.totalStock <= 0
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-primary hover:bg-secondary hover:text-primary text-white"
                      )}
                    >
                      {isInCart ? (
                        <>
                          <Check className="w-3 h-3 mr-2" /> 
                          VIEW CART
                        </>
                      ) : product.totalStock <= 0 ? (
                        <>
                          <Package className="w-3 h-3 mr-2" /> 
                          OUT OF STOCK
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3 h-3 mr-2" /> 
                          ADD TO CART
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer Section */}
          {filteredAndSortedProducts.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-100">
              {/* Cart Summary - Only shows if items in cart */}
              {cartItems.length > 0 && (
                <div className="mt-6 bg-secondary/10 border border-secondary/20 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="w-5 h-5 text-secondary" />
                      <div>
                        <p className="font-bold text-primary">Your Cart</p>
                        <p className="text-sm text-gray-600">
                          {cartItems.reduce((sum, item) => sum + item.quantity, 0)} items • 
                          Total: AED {cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => setShowClearCartConfirm(true)}
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl font-bold text-xs"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        CLEAR CART ({cartItems.length})
                      </Button>
                      <Button 
                        onClick={() => router.push('/checkout')}
                        className="bg-secondary hover:bg-secondary/90 text-primary font-bold"
                      >
                        Proceed to Checkout
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Clear Cart Confirmation Modal */}
      {showClearCartConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-primary mb-2">Clear Cart?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove all {cartItems.length} items from your cart?
            </p>
            <div className="flex gap-3">
              <Button
                onClick={handleClearCart}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Yes, Clear Cart
              </Button>
              <Button
                onClick={() => setShowClearCartConfirm(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}