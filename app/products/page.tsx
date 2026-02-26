'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Star, ShoppingCart, Filter, Package, Check, Sparkles, ChevronRight, TrendingUp, Box, DollarSign, RefreshCw } from 'lucide-react';
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
        staffData.push({
          id: doc.id,
          name: data.name || data.fullName || 'Unknown Staff',
          image: data.imageUrl || data.image || data.photoURL || '/default-avatar.png',
          position: data.position || data.role || 'Barber',
        });
      });
      
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
}

const useCartStore = create<CartStore>((set, get) => ({
  cartItems: [],
  addToCart: (item: CartItem) => set((state) => {
    const existingItem = state.cartItems.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      return {
        cartItems: state.cartItems.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      };
    }
    return { cartItems: [...state.cartItems, { ...item, quantity: 1 }] };
  }),
  removeFromCart: (id: string) => set((state) => ({
    cartItems: state.cartItems.filter(item => item.id !== id)
  })),
  updateQuantity: (id: string, quantity: number) => set((state) => ({
    cartItems: state.cartItems.map(item =>
      item.id === id ? { ...item, quantity } : item
    )
  })),
  clearCart: () => set({ cartItems: [] }),
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

// Missing icon component
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
  const { products, fetchProducts } = useProductsStore();
  const { staff, fetchStaff } = useStaffStore();
  const { addToCart, cartItems } = useCartStore();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [addedProduct, setAddedProduct] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [isAddingToCart, setIsAddingToCart] = useState<string | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchProducts();
    fetchStaff();
  }, [fetchProducts, fetchStaff]);

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
      
      return matchesCategory && matchesSearch && matchesStaff;
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

  // Handle View Cart separately
  const handleViewCart = (productId: string) => {
    router.push('/checkout');
  };

  // Fixed: Handle add to cart with Firestore integration
  const handleAddToCart = async (product: Product) => {
    // Agar product already added hai aur "View Cart" mode mein hai
    if (addedProduct === product.id) {
      handleViewCart(product.id);
      return;
    }

    // Check if user is logged in
    const authData = localStorage.getItem('customerAuth');
    
    // If user IS logged in, then continue with Firestore
    if (authData) {
      try {
        const parsedAuth = JSON.parse(authData);
        const customerData = parsedAuth?.customer;
        
        // Check stock availability
        if (product.totalStock <= 0) {
          alert(`${product.name} is out of stock!`);
          return;
        }

        setIsAddingToCart(product.id);

        const customerId = customerData.id || customerData.uid;
        const customerName = customerData.name || '';
        const customerEmail = customerData.email || '';

        // Check if product already in cart in Firestore
        const cartQuery = query(
          collection(db, 'cart'),
          where('customerId', '==', customerId),
          where('productId', '==', product.id),
          where('status', '==', 'active')
        );
        const cartSnapshot = await getDocs(cartQuery);
        
        if (cartSnapshot.empty) {
          // Add new item to cart in Firestore
          await addDoc(collection(db, 'cart'), {
            customerId,
            customerName,
            customerEmail,
            productId: product.id,
            productName: product.name,
            productImage: product.imageUrl,
            price: product.price,
            quantity: 1,
            addedAt: serverTimestamp(),
            status: 'active'
          });
        } else {
          // Update quantity in Firestore
          const cartDoc = cartSnapshot.docs[0];
          await updateDoc(doc(db, 'cart', cartDoc.id), {
            quantity: increment(1),
            updatedAt: serverTimestamp()
          });
        }

        // Also update local cart store
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
          productImage: product.imageUrl
        };

        // Save cart to localStorage for checkout page
        const existingCart = JSON.parse(localStorage.getItem('productCart') || '[]');
        const existingItemIndex = existingCart.findIndex((item: CartItem) => item.id === product.id);
        
        if (existingItemIndex !== -1) {
          // Product already in cart, just update addedProduct state and redirect
          setAddedProduct(product.id);
          setTimeout(() => {
            router.push('/checkout');
          }, 100);
          return;
        } else {
          // New product, add to cart
          existingCart.push({
            ...cartItem,
            quantity: 1
          });
        }
        
        localStorage.setItem('productCart', JSON.stringify(existingCart));

        addToCart(cartItem);
        setAddedProduct(product.id);
        
        // Redirect to checkout page after short delay
        setTimeout(() => {
          router.push('/checkout');
        }, 500);
        
      } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Failed to add item to cart. Please try again.');
        setIsAddingToCart(null);
      }
      return;
    }
    
    // If user is NOT logged in (Guest user)
    try {
      // Check stock availability
      if (product.totalStock <= 0) {
        alert(`${product.name} is out of stock!`);
        return;
      }

      setIsAddingToCart(product.id);

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
        productImage: product.imageUrl
      };

      // Save cart to localStorage for checkout page
      const existingCart = JSON.parse(localStorage.getItem('productCart') || '[]');
      const existingItemIndex = existingCart.findIndex((item: CartItem) => item.id === product.id);
      
      // Agar product already cart mein hai, to quantity increase NAHI karein
      // Sirf "View Cart" mode mein chale jao
      if (existingItemIndex !== -1) {
        // Already in cart, just set addedProduct and redirect
        setAddedProduct(product.id);
        setTimeout(() => {
          router.push('/checkout');
        }, 100);
        return;
      }
      
      // Naya product add karein
      existingCart.push({
        ...cartItem,
        quantity: 1
      });
      
      localStorage.setItem('productCart', JSON.stringify(existingCart));

      // Add to Zustand store
      addToCart(cartItem);
      setAddedProduct(product.id);
      
      // Redirect to checkout page after short delay
      setTimeout(() => {
        router.push('/checkout');
      }, 500);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
      setIsAddingToCart(null);
    }
  };

  // Calculate statistics
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.totalStock), 0);
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

  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      <Header />

      {/* Premium Hero Section */}
      <section className="relative py-32 px-4 overflow-hidden bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-secondary blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary blur-[120px] animate-pulse"></div>
        </div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-secondary/20 px-4 py-2 rounded-full mb-6 border border-secondary/30">
            <Package className="w-4 h-4 text-secondary" />
            <span className="text-secondary font-black tracking-[0.3em] uppercase text-[10px]">The Apothecary</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-tight">
            Grooming <span className="text-secondary italic">Collection</span>
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg font-light leading-relaxed mb-8">
            Professional-grade essentials for the modern gentleman. 
          </p>
          
          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-3">
              <div className="flex items-center gap-3">
                <Box className="w-5 h-5 text-secondary" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Total Products</p>
                  <p className="text-2xl font-bold text-white">{totalProducts}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-3">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-secondary" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Inventory Value</p>
                  <p className="text-2xl font-bold text-white">AED {totalValue.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-3">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-secondary" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Total Sold</p>
                  <p className="text-2xl font-bold text-white">{totalSold.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className=" top-16 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 py-6 px-4 shadow-lg">
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

            {/* Category Filters */}
            <div className="flex items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "whitespace-nowrap px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all border rounded-2xl min-w-[120px] text-center",
                    selectedCategory === cat.id 
                      ? "bg-primary text-white border-primary shadow-xl scale-[1.02]" 
                      : "bg-white text-primary border-gray-200 hover:border-secondary hover:text-secondary hover:shadow-md"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Staff Filter Section */}
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-3 border-t border-gray-100">
            <div className="flex items-center gap-2 shrink-0">
              <Sparkles className="w-4 h-4 text-secondary" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600">Recommended by:</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedStaff('all')}
                className={cn(
                  "whitespace-nowrap px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border flex items-center gap-2",
                  selectedStaff === 'all' 
                    ? "bg-secondary/20 text-secondary border-secondary/40 shadow-sm" 
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-xs font-bold">
                  All
                </div>
                All Barbers
              </button>
              
              {staff.map((member) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedStaff(member.id)}
                  className={cn(
                    "whitespace-nowrap px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-3 border min-w-[140px]",
                    selectedStaff === member.id 
                      ? "bg-secondary/10 text-secondary border-secondary/30 shadow-sm" 
                      : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-sm"
                  )}
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-sm flex-shrink-0">
                    <img 
                      src={member.image} 
                      alt={member.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/default-avatar.png';
                      }}
                    />
                  </div>
                  <div className="text-left">
                    <div className="font-bold truncate">{member.name}</div>
                    <div className="text-[9px] text-gray-500 truncate">{member.position || 'Barber'}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-50/50 to-white">
        <div className="max-w-7xl mx-auto">
          {/* Products Count and Stats */}
          <div className="mb-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-serif font-bold text-primary">
                Premium Products Collection
                <span className="text-secondary ml-2">({filteredAndSortedProducts.length})</span>
              </h2>
              <p className="text-gray-600 mt-2">
                Real-time inventory fetched from Firebase database
              </p>
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
              <Badge variant="outline" className="text-gray-600">
                Total Revenue: ${totalRevenue.toLocaleString()}
              </Badge>
            </div>
          </div>

          {/* Products Grid */}
          {products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] shadow-sm border border-gray-100">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-12 h-12 text-gray-300" />
              </div>
              <h3 className="text-3xl font-serif font-bold text-primary mb-3">No Products Available</h3>
              <p className="text-gray-500 font-light mb-8 max-w-md mx-auto">
                No products found in the database. Please add products through Firebase console or contact administrator.
              </p>
              <Button 
                onClick={fetchProducts}
                className="rounded-full px-8 bg-primary hover:bg-primary/90 font-bold tracking-widest text-[10px]"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                REFRESH PRODUCTS
              </Button>
            </div>
          ) : filteredAndSortedProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] shadow-sm border border-gray-100">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 text-gray-300" />
              </div>
              <h3 className="text-3xl font-serif font-bold text-primary mb-3">No Matching Products</h3>
              <p className="text-gray-500 font-light mb-8 max-w-md mx-auto">
                No products match your current filters. Try adjusting your search criteria.
              </p>
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
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredAndSortedProducts.map((product) => {
                const stockStatus = getStockStatus(product.totalStock);
                
                return (
                  <div 
                    key={product.id} 
                    className={cn(
                      "group bg-white border-2 transition-all duration-500 p-6 rounded-[2.5rem] flex flex-col shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)] relative",
                      product.totalStock <= 0 
                        ? "border-gray-100 opacity-80" 
                        : "border-gray-100 hover:border-secondary/20"
                    )}
                  >
                    {/* Out of Stock Overlay */}
                    {product.totalStock <= 0 && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 rounded-[2.5rem] flex items-center justify-center">
                        <Badge className="bg-red-500 text-white border-none px-4 py-2 text-sm font-bold shadow-lg">
                          OUT OF STOCK
                        </Badge>
                      </div>
                    )}
                    
                    {/* Product Image */}
                    <div className="relative aspect-square overflow-hidden mb-6 bg-gray-50 rounded-[2rem] group-hover:rounded-[1.5rem] transition-all duration-500">
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1512690196222-7c7d3f993c1b?q=80&w=2070&auto=format&fit=crop';
                        }}
                      />
                      
                      {/* Image Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      
                      {/* Stock Status Badge */}
                      <div className="absolute top-4 left-4">
                        <Badge className={cn(
                          "border-none px-3 py-1.5 text-[9px] font-black tracking-widest uppercase shadow-lg",
                          stockStatus.badge
                        )}>
                          {stockStatus.label}
                        </Badge>
                      </div>
                      
                      {/* Price Badge */}
                      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                        <div className="bg-white/95 backdrop-blur-sm text-primary px-4 py-2 rounded-xl font-black text-sm shadow-2xl">
                          AED {product.price}
                        </div>
                      </div>
                      
                      {/* Profit Margin Indicator */}
                      {product.cost > 0 && (
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-black/70 text-white border-none px-2 py-1 text-[8px] font-bold">
                            {Math.round(((product.price - product.cost) / product.cost) * 100)}% Margin
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-1 space-y-3">
                      {/* Category and Rating */}
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="text-[10px] uppercase tracking-[0.2em] text-secondary border-secondary/30">
                          {product.category}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-bold">{product.rating.toFixed(1)}</span>
                          <span className="text-xs text-gray-500">({product.reviews})</span>
                        </div>
                      </div>
                      
                      {/* Product Name */}
                      <h4 className="text-xl font-serif font-bold text-primary group-hover:text-secondary transition-colors duration-300 line-clamp-2 h-14">
                        {product.name}
                      </h4>
                      
                      {/* Description */}
                      <p className="text-gray-600 text-sm font-light leading-relaxed line-clamp-2 min-h-[40px]">
                        {product.description || 'Premium grooming product for the modern gentleman.'}
                      </p>
                      
                      {/* SKU and Stock Info */}
                      <div className="space-y-2 pt-2 border-t border-gray-100">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500 font-medium">SKU:</span>
                          <span className="font-mono font-bold text-primary">{product.sku}</span>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500 font-medium">Stock:</span>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-bold",
                              product.totalStock <= 5 ? "text-yellow-600" : "text-green-600"
                            )}>
                              {product.totalStock} units
                            </span>
                            {product.totalSold > 0 && (
                              <span className="text-gray-400">
                                ({product.totalSold} sold)
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Branches */}
                        {product.branchNames && product.branchNames.length > 0 && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 font-medium">Available at:</span>
                            <span className="font-medium text-primary truncate max-w-[120px]">
                              {product.branchNames[0]}
                              {product.branchNames.length > 1 && ` +${product.branchNames.length - 1}`}
                            </span>
                          </div>
                        )}
                        
                        {/* Revenue */}
                        {product.revenue > 0 && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 font-medium">Revenue:</span>
                            <span className="font-bold text-green-600">
                              ${product.revenue.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Button - FIXED */}
                    <Button 
                      onClick={() => {
                        if (addedProduct === product.id) {
                          handleViewCart(product.id);
                        } else {
                          handleAddToCart(product);
                        }
                      }}
                      disabled={product.totalStock <= 0 || isAddingToCart === product.id}
                      className={cn(
                        "w-full mt-6 h-14 rounded-2xl font-black tracking-[0.2em] text-[10px] transition-all duration-500 shadow-lg",
                        addedProduct === product.id || isAddingToCart === product.id
                          ? "bg-green-600 hover:bg-green-600 text-white scale-95 cursor-pointer" 
                          : product.totalStock <= 0
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-primary hover:bg-secondary hover:text-primary text-white"
                      )}
                    >
                      {addedProduct === product.id ? (
                        <>
                          <Check className="w-4 h-4 mr-2" /> 
                          VIEW CART
                        </>
                      ) : isAddingToCart === product.id ? (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-2 animate-spin" /> 
                          ADDING...
                        </>
                      ) : product.totalStock <= 0 ? (
                        <>
                          <Package className="w-4 h-4 mr-2" /> 
                          OUT OF STOCK
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-2 group-hover:animate-bounce" /> 
                          ADD TO CART
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer Stats */}
          {filteredAndSortedProducts.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Inventory Value */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Inventory Value</p>
                      <p className="text-2xl font-bold text-primary">AED {totalValue.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                
                {/* Total Products */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                      <Box className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Products</p>
                      <p className="text-2xl font-bold text-secondary">{totalProducts}</p>
                    </div>
                  </div>
                </div>
                
                {/* Total Sold */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Sold</p>
                      <p className="text-2xl font-bold text-green-600">{totalSold.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                
                {/* Revenue */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Revenue</p>
                      <p className="text-2xl font-bold text-blue-600">${totalRevenue.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Refresh Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={() => {
            fetchProducts();
            fetchStaff();
          }}
          className="rounded-full w-12 h-12 bg-primary hover:bg-primary/90 shadow-xl"
          title="Refresh data from Firebase"
        >
          <RefreshCw className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}