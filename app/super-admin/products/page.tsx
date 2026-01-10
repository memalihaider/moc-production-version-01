'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Package, DollarSign, TrendingUp, Plus, Edit, MoreVertical, Search, Filter, Building, Star, Image as ImageIcon, Trash2, Eye, EyeOff, Loader2, Tag, Box } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AdminSidebar, AdminMobileSidebar } from "@/components/admin/AdminSidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

// Firebase imports
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Unsubscribe } from 'firebase/firestore';

// Types
export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  cost: number;
  sku?: string;
  imageUrl?: string;
  status: 'active' | 'inactive' | 'low-stock' | 'out-of-stock';
  branches: string[];
  branchNames?: string[];
  categoryId?: string;
  totalStock: number;
  rating?: number;
  reviews?: number;
  totalSold: number;
  revenue: number;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Branch {
  id: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  type: 'product' | 'service';
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export default function SuperAdminProducts() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State for data
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  
  // State for operations
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  // Dialog states
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Form state
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    categoryId: '',
    description: '',
    price: '',
    cost: '',
    sku: '',
    totalStock: '',
    imageUrl: '',
    status: 'active' as 'active' | 'inactive' | 'low-stock' | 'out-of-stock',
    branchId: ''
  });

  // 🔥 Firebase se real-time products fetch
  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productsRef = collection(db, 'products');
        const q = query(productsRef, orderBy('createdAt', 'desc'));
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const productsData: Product[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            const createdAt = data.createdAt as Timestamp;
            const updatedAt = data.updatedAt as Timestamp;
            
            productsData.push({
              id: doc.id,
              name: data.name || '',
              category: data.category || '',
              description: data.description || '',
              price: data.price || 0,
              cost: data.cost || 0,
              sku: data.sku || '',
              imageUrl: data.imageUrl || '',
              status: data.status || 'active',
              branches: data.branches || [],
              branchNames: data.branchNames || [],
              categoryId: data.categoryId || '',
              totalStock: data.totalStock || 0,
              rating: data.rating || 0,
              reviews: data.reviews || 0,
              totalSold: data.totalSold || 0,
              revenue: data.revenue || 0,
              createdAt: createdAt?.toDate() || new Date(),
              updatedAt: updatedAt?.toDate()
            });
          });
          
          setProducts(productsData);
          setLoading(false);
        }, (error) => {
          console.error("Error fetching products: ", error);
          setLoading(false);
        });

      } catch (error) {
        console.error("Error in fetchProducts: ", error);
        setLoading(false);
      }
    };

    fetchProducts();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // 🔥 Firebase se branches fetch
  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    const fetchBranches = async () => {
      try {
        setBranchesLoading(true);
        const branchesRef = collection(db, 'branches');
        const q = query(branchesRef, orderBy('name'));
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const branchesData: Branch[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            const createdAt = data.createdAt as Timestamp;
            
            branchesData.push({
              id: doc.id,
              name: data.name || '',
              address: data.address || '',
              city: data.city || '',
              country: data.country || '',
              status: data.status || 'active',
              createdAt: createdAt?.toDate() || new Date()
            });
          });
          
          setBranches(branchesData);
          setBranchesLoading(false);
        }, (error) => {
          console.error("Error fetching branches: ", error);
          setBranchesLoading(false);
        });

      } catch (error) {
        console.error("Error in fetchBranches: ", error);
        setBranchesLoading(false);
      }
    };

    fetchBranches();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // 🔥 Firebase se categories fetch (product type only)
  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const categoriesRef = collection(db, 'categories');
        
        // Simple query without complex where clauses
        const q = query(categoriesRef, orderBy('name'));
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const allCategories: Category[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            const createdAt = data.createdAt as Timestamp;
            const updatedAt = data.updatedAt as Timestamp;
            
            allCategories.push({
              id: doc.id,
              name: data.name || '',
              description: data.description || '',
              type: data.type || 'product',
              isActive: data.isActive !== false,
              createdAt: createdAt?.toDate() || new Date(),
              updatedAt: updatedAt?.toDate()
            });
          });
          
          // Filter for product categories on client side
          const productCategories = allCategories.filter(
            cat => cat.type === 'product' && cat.isActive === true
          );
          
          setCategories(productCategories);
          setCategoriesLoading(false);
        }, (error) => {
          console.error("Error fetching categories: ", error);
          setCategoriesLoading(false);
        });

      } catch (error) {
        console.error("Error in fetchCategories: ", error);
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // 🔥 Add Product to Firebase
  const handleAddProduct = async () => {
    // Validation checks
    if (!productForm.name.trim()) {
      alert('Please enter product name');
      return;
    }
    
    if (!productForm.categoryId) {
      alert('Please select a category');
      return;
    }
    
    if (!productForm.price || isNaN(parseFloat(productForm.price)) || parseFloat(productForm.price) <= 0) {
      alert('Please enter a valid price');
      return;
    }
    
    if (!productForm.cost || isNaN(parseFloat(productForm.cost)) || parseFloat(productForm.cost) <= 0) {
      alert('Please enter a valid cost');
      return;
    }
    
    if (!productForm.totalStock || isNaN(parseInt(productForm.totalStock)) || parseInt(productForm.totalStock) < 0) {
      alert('Please enter a valid stock quantity');
      return;
    }
    
    if (!productForm.branchId) {
      alert('Please select a branch');
      return;
    }

    setIsAdding(true);
    try {
      const productsRef = collection(db, 'products');
      
      // Get selected branch
      const selectedBranch = branches.find(b => b.id === productForm.branchId);
      const branchName = selectedBranch ? selectedBranch.name : '';
      
      // Get selected category
      const selectedCategory = categories.find(cat => cat.id === productForm.categoryId);
      const categoryName = selectedCategory?.name || productForm.category;
      
      // Calculate initial status based on stock
      let status: 'active' | 'inactive' | 'low-stock' | 'out-of-stock' = 'active';
      const stock = parseInt(productForm.totalStock);
      if (stock === 0) {
        status = 'out-of-stock';
      } else if (stock < 10) {
        status = 'low-stock';
      }
      
      const newProductData = {
        name: productForm.name.trim(),
        category: categoryName,
        categoryId: productForm.categoryId,
        description: productForm.description.trim(),
        sku: productForm.sku.trim() || `PROD-${Date.now()}`,
        price: parseFloat(productForm.price),
        cost: parseFloat(productForm.cost),
        totalStock: parseInt(productForm.totalStock),
        imageUrl: productForm.imageUrl.trim(),
        status: status,
        branches: [productForm.branchId],
        branchNames: branchName ? [branchName] : [],
        rating: 0,
        reviews: 0,
        totalSold: 0,
        revenue: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(productsRef, newProductData);
      
      setShowAddProductDialog(false);
      resetProductForm();
      alert('Product added successfully!');
      
    } catch (error) {
      console.error("Error adding product: ", error);
      alert('Error adding product. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  // 🔥 Edit Product in Firebase
  const handleEditProduct = async () => {
    if (!selectedProduct) return;

    // Validation checks
    if (!productForm.name.trim()) {
      alert('Please enter product name');
      return;
    }
    
    if (!productForm.categoryId) {
      alert('Please select a category');
      return;
    }
    
    if (!productForm.price || isNaN(parseFloat(productForm.price)) || parseFloat(productForm.price) <= 0) {
      alert('Please enter a valid price');
      return;
    }
    
    if (!productForm.cost || isNaN(parseFloat(productForm.cost)) || parseFloat(productForm.cost) <= 0) {
      alert('Please enter a valid cost');
      return;
    }
    
    if (!productForm.totalStock || isNaN(parseInt(productForm.totalStock)) || parseInt(productForm.totalStock) < 0) {
      alert('Please enter a valid stock quantity');
      return;
    }
    
    if (!productForm.branchId) {
      alert('Please select a branch');
      return;
    }

    setIsEditing(true);
    try {
      const productDoc = doc(db, 'products', selectedProduct.id);
      
      // Get selected branch
      const selectedBranch = branches.find(b => b.id === productForm.branchId);
      const branchName = selectedBranch ? selectedBranch.name : '';
      
      // Get selected category
      const selectedCategory = categories.find(cat => cat.id === productForm.categoryId);
      const categoryName = selectedCategory?.name || productForm.category;
      
      // Calculate status based on stock
      let status: 'active' | 'inactive' | 'low-stock' | 'out-of-stock' = productForm.status;
      const stock = parseInt(productForm.totalStock);
      if (stock === 0) {
        status = 'out-of-stock';
      } else if (stock < 10) {
        status = 'low-stock';
      } else if (productForm.status !== 'inactive') {
        status = 'active';
      }
      
      await updateDoc(productDoc, {
        name: productForm.name.trim(),
        category: categoryName,
        categoryId: productForm.categoryId,
        description: productForm.description.trim(),
        sku: productForm.sku.trim(),
        price: parseFloat(productForm.price),
        cost: parseFloat(productForm.cost),
        totalStock: parseInt(productForm.totalStock),
        imageUrl: productForm.imageUrl.trim(),
        status: status,
        branches: [productForm.branchId],
        branchNames: branchName ? [branchName] : [],
        updatedAt: serverTimestamp()
      });
      
      setShowAddProductDialog(false);
      setSelectedProduct(null);
      resetProductForm();
      alert('Product updated successfully!');
      
    } catch (error) {
      console.error("Error updating product: ", error);
      alert('Error updating product. Please try again.');
    } finally {
      setIsEditing(false);
    }
  };

  // 🔥 Delete Product from Firebase
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    setIsDeleting(selectedProduct.id);
    try {
      const productDoc = doc(db, 'products', selectedProduct.id);
      await deleteDoc(productDoc);
      
      setDeleteDialogOpen(false);
      setSelectedProduct(null);
      alert('Product deleted successfully!');
    } catch (error) {
      console.error("Error deleting product: ", error);
      alert('Error deleting product. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  // Toggle product status
  const toggleProductStatus = async (product: Product) => {
    try {
      const productDoc = doc(db, 'products', product.id);
      const newStatus = product.status === 'active' || product.status === 'low-stock' || product.status === 'out-of-stock' 
        ? 'inactive' 
        : 'active';
      
      await updateDoc(productDoc, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      alert(`Product ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error("Error updating product status: ", error);
      alert('Error updating product status. Please try again.');
    }
  };

  // Update stock
  const updateProductStock = async (product: Product, newStock: number) => {
    try {
      const productDoc = doc(db, 'products', product.id);
      
      // Calculate new status based on stock
      let newStatus: 'active' | 'inactive' | 'low-stock' | 'out-of-stock' = product.status;
      
      if (product.status !== 'inactive') {
        if (newStock === 0) {
          newStatus = 'out-of-stock';
        } else if (newStock < 10) {
          newStatus = 'low-stock';
        } else {
          newStatus = 'active';
        }
      }
      
      await updateDoc(productDoc, {
        totalStock: newStock,
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      alert(`Stock updated to ${newStock} successfully!`);
    } catch (error) {
      console.error("Error updating stock: ", error);
      alert('Error updating stock. Please try again.');
    }
  };

  const resetProductForm = () => {
    setProductForm({
      name: '',
      category: '',
      categoryId: '',
      description: '',
      price: '',
      cost: '',
      sku: '',
      totalStock: '',
      imageUrl: '',
      status: 'active',
      branchId: ''
    });
  };

  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      categoryId: product.categoryId || '',
      description: product.description,
      price: product.price.toString(),
      cost: product.cost.toString(),
      sku: product.sku || '',
      totalStock: product.totalStock.toString(),
      imageUrl: product.imageUrl || '',
      status: product.status,
      branchId: product.branches[0] || ''
    });
    setShowAddProductDialog(true);
  };

  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  // Get unique categories from products for filter dropdown
  const productCategories = [...new Set(products.map(product => product.category))];

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    const matchesPrice = priceFilter === 'all' ||
                        (priceFilter === 'under-20' && product.price < 20) ||
                        (priceFilter === '20-50' && product.price >= 20 && product.price <= 50) ||
                        (priceFilter === 'over-50' && product.price > 50);
    
    const matchesStock = stockFilter === 'all' ||
                         (stockFilter === 'in-stock' && product.status === 'active') ||
                         (stockFilter === 'low-stock' && product.status === 'low-stock') ||
                         (stockFilter === 'out-of-stock' && product.status === 'out-of-stock');
    
    return matchesSearch && matchesCategory && matchesPrice && matchesStock;
  });

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "low-stock": return "bg-yellow-100 text-yellow-800";
      case "out-of-stock": return "bg-red-100 text-red-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Calculate stats
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.status === 'active' || p.status === 'low-stock').length;
  const totalStockValue = products.reduce((acc, product) => acc + (product.price * product.totalStock), 0);
  const totalRevenue = products.reduce((acc, product) => acc + product.revenue, 0);
  const lowStockItems = products.filter(p => p.status === 'low-stock' || p.status === 'out-of-stock').length;
  const avgMargin = products.length > 0 
    ? products.reduce((acc, product) => acc + ((product.price - product.cost) / product.price * 100), 0) / products.length 
    : 0;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Calculate margin percentage
  const calculateMargin = (price: number, cost: number) => {
    return (((price - cost) / price) * 100).toFixed(1);
  };

  // Render loading state
  if (loading && products.length === 0) {
    return (
      <ProtectedRoute requiredRole="super_admin">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-secondary" />
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="super_admin">
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar role="super_admin" onLogout={handleLogout} />
        <AdminMobileSidebar
          role="super_admin"
          onLogout={handleLogout}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          sidebarOpen ? "lg:ml-64" : "lg:ml-0"
        )}>
          {/* Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="flex items-center justify-between px-4 py-4 lg:px-8">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Products Management</h1>
                  <p className="text-sm text-gray-600">Manage retail inventory across all branches</p>
                  {loading && products.length > 0 && (
                    <div className="flex items-center mt-1">
                      <Loader2 className="w-3 h-3 animate-spin mr-1 text-gray-400" />
                      <span className="text-xs text-gray-500">Syncing...</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button 
                  className="bg-secondary hover:bg-secondary/90"
                  onClick={() => {
                    setSelectedProduct(null);
                    resetProductForm();
                    setShowAddProductDialog(true);
                  }}
                  disabled={loading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
                <span className="text-sm text-gray-600 hidden sm:block">Welcome, {user?.email}</span>
                <Button variant="outline" onClick={handleLogout} className="hidden sm:flex">
                  Logout
                </Button>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            <div className="p-4 lg:p-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalProducts}</div>
                    <p className="text-xs text-muted-foreground">
                      {activeProducts} active products
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${totalStockValue.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Current stock value
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${totalRevenue.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      From product sales
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                    <Filter className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {lowStockItems}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Need restocking
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search products by name, SKU, or description..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter} disabled={loading}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {productCategories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={priceFilter} onValueChange={setPriceFilter} disabled={loading}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filter by price" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Prices</SelectItem>
                        <SelectItem value="under-20">Under $20</SelectItem>
                        <SelectItem value="20-50">$20 - $50</SelectItem>
                        <SelectItem value="over-50">Over $50</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={stockFilter} onValueChange={setStockFilter} disabled={loading}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filter by stock" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Stock Status</SelectItem>
                        <SelectItem value="in-stock">In Stock</SelectItem>
                        <SelectItem value="low-stock">Low Stock</SelectItem>
                        <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Products Grid */}
              {loading && products.length === 0 ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Loading products...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || categoryFilter !== 'all' || priceFilter !== 'all' || stockFilter !== 'all'
                      ? 'Try adjusting your search or filter criteria'
                      : 'Get started by adding your first product'
                    }
                  </p>
                  {!searchTerm && categoryFilter === 'all' && priceFilter === 'all' && stockFilter === 'all' && (
                    <Button onClick={() => setShowAddProductDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <Card key={product.id} className="hover:shadow-lg transition-shadow">
                      {/* Product Image */}
                      <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden relative">
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                            <Package className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge className={getStatusColor(product.status)}>
                            {product.status.replace('-', ' ')}
                          </Badge>
                        </div>
                        {product.sku && (
                          <div className="absolute top-2 left-2">
                            <Badge variant="outline" className="bg-white/90 text-xs">
                              SKU: {product.sku}
                            </Badge>
                          </div>
                        )}
                      </div>

                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg text-primary">{product.name}</CardTitle>
                            <CardDescription className="text-secondary font-medium">
                              {product.category}
                            </CardDescription>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" disabled={isDeleting === product.id}>
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(product)} disabled={isDeleting === product.id}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Product
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateProductStock(product, product.totalStock + 10)} disabled={isDeleting === product.id}>
                                <Package className="w-4 h-4 mr-2" />
                                Restock (+10)
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleProductStatus(product)} disabled={isDeleting === product.id}>
                                {product.status === 'active' || product.status === 'low-stock' || product.status === 'out-of-stock' ? (
                                  <>
                                    <EyeOff className="w-4 h-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => openDeleteDialog(product)} 
                                className="text-red-600"
                                disabled={isDeleting === product.id}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1 text-sm">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                <span className="font-semibold">${product.price}</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm">
                                <Package className="w-4 h-4 text-blue-600" />
                                <span>{product.totalStock} in stock</span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Cost:</span>
                              <span className="font-medium ml-1">${product.cost}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Margin:</span>
                              <span className="font-medium ml-1 text-green-600">
                                {calculateMargin(product.price, product.cost)}%
                              </span>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-900 mb-2 text-sm">Available at Branch</h4>
                            <div className="flex flex-wrap gap-1">
                              {product.branchNames && product.branchNames.length > 0 ? (
                                product.branchNames.map((branchName, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {branchName}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-gray-500">No branch assigned</span>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditDialog(product)}>
                              Edit
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => updateProductStock(product, product.totalStock + 5)}>
                              Restock
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add/Edit Product Sheet */}
        <Sheet open={showAddProductDialog} onOpenChange={(open) => {
          if (!open) {
            setSelectedProduct(null);
            resetProductForm();
          }
          setShowAddProductDialog(open);
        }}>
          <SheetContent className="overflow-y-auto sm:max-w-xl h-[700px] m-auto rounded-3xl p-5">
            <SheetHeader>
              <SheetTitle className="font-bold text-4xl text-center text-slate-700">
                {selectedProduct ? 'Edit Product' : 'Add New Product'}
              </SheetTitle>
              <SheetDescription className="font-bold text-md text-center text-slate-800">
                {selectedProduct ? 'Update product details' : 'Create a new product record'}
              </SheetDescription>
            </SheetHeader>
            
            <div className="space-y-4 mt-6">
              {/* Product Image URL */}
              <div>
                <Label className="text-xs font-bold uppercase">
                  Product Image URL
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <ImageIcon className="w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="https://example.com/product-image.jpg"
                    value={productForm.imageUrl}
                    onChange={(e) => setProductForm({...productForm, imageUrl: e.target.value})}
                    className="rounded-lg"
                    disabled={isAdding || isEditing}
                  />
                </div>
                {productForm.imageUrl && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Image Preview:</p>
                    <div className="w-full h-32 rounded-lg overflow-hidden border">
                      <img 
                        src={productForm.imageUrl} 
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNlNWU1ZTUiLz48cmVjdCB4PSI0MCIgeT0iNDAiIHdpZHRoPSIxMjAiIGhlaWdodD0iODAiIHJ4PSI4IiBmaWxsPSIjY2NjIi8+PHJlY3QgeD0iNjUiIHk9IjU1IiB3aWR0aD0iNzAiIGhlaWdodD0iMTAiIHJ4PSI1IiBmaWxsPSIjZWVlIi8+PHJlY3QgeD0iNjUiIHk9IjcwIiB3aWR0aD0iNTAiIGhlaWdodD0iOCIgb3BhY2l0eT0iMC42IiBmaWxsPSIjZWVlIi8+PHJlY3QgeD0iNjUiIHk9Ijg1IiB3aWR0aD0iMzAiIGhlaWdodD0iOCIgb3BhY2l0eT0iMC40IiBmaWxsPSIjZWVlIi8+PC9zdmc+';
                        }}
                      />
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Paste a direct image URL (optional)
                </p>
              </div>

              {/* Product Name */}
              <div>
                <Label className="text-xs font-bold uppercase">
                  Product Name *
                </Label>
                <Input
                  placeholder="e.g., Premium Shampoo"
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  className="mt-1 rounded-lg"
                  disabled={isAdding || isEditing}
                />
              </div>

              {/* SKU */}
              <div>
                <Label className="text-xs font-bold uppercase">
                  SKU (Stock Keeping Unit)
                </Label>
                <Input
                  placeholder="e.g., PROD-001"
                  value={productForm.sku}
                  onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
                  className="mt-1 rounded-lg"
                  disabled={isAdding || isEditing}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for auto-generated SKU
                </p>
              </div>

              {/* Category Dropdown */}
              <div>
                <Label className="text-xs font-bold uppercase">
                  Category *
                </Label>
                <select
                  value={productForm.categoryId}
                  onChange={(e) => {
                    const selectedCat = categories.find(cat => cat.id === e.target.value);
                    setProductForm({
                      ...productForm, 
                      categoryId: e.target.value,
                      category: selectedCat?.name || ''
                    });
                  }}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  disabled={isAdding || isEditing || categoriesLoading}
                >
                  <option value="">Select a category</option>
                  {categoriesLoading ? (
                    <option value="" disabled>Loading categories...</option>
                  ) : categories.length === 0 ? (
                    <option value="" disabled>No product categories available</option>
                  ) : (
                    categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))
                  )}
                </select>
                {categoriesLoading && (
                  <p className="text-xs text-gray-500 mt-1">Loading categories...</p>
                )}
                {!categoriesLoading && categories.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">No product categories found. Please add categories first.</p>
                )}
              </div>

              {/* Description */}
              <div>
                <Label className="text-xs font-bold uppercase">
                  Description
                </Label>
                <Textarea
                  placeholder="Describe the product..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  className="mt-1 rounded-lg w-full border border-gray-200 p-2 text-sm"
                  disabled={isAdding || isEditing}
                  rows={3}
                />
              </div>

              {/* Price, Cost, and Stock */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-bold uppercase">
                    Price ($) *
                  </Label>
                  <Input
                    type="number"
                    placeholder="24.99"
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                    className="mt-1 rounded-lg"
                    disabled={isAdding || isEditing}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase">
                    Cost ($) *
                  </Label>
                  <Input
                    type="number"
                    placeholder="12.50"
                    value={productForm.cost}
                    onChange={(e) => setProductForm({...productForm, cost: e.target.value})}
                    className="mt-1 rounded-lg"
                    disabled={isAdding || isEditing}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase">
                    Stock *
                  </Label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={productForm.totalStock}
                    onChange={(e) => setProductForm({...productForm, totalStock: e.target.value})}
                    className="mt-1 rounded-lg"
                    disabled={isAdding || isEditing}
                    min="0"
                  />
                </div>
              </div>

              {/* Margin Display */}
              {productForm.price && productForm.cost && 
               !isNaN(parseFloat(productForm.price)) && 
               !isNaN(parseFloat(productForm.cost)) &&
               parseFloat(productForm.price) > 0 && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm font-semibold text-green-800">
                    Margin: {calculateMargin(parseFloat(productForm.price), parseFloat(productForm.cost))}%
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Profit per unit: ${(parseFloat(productForm.price) - parseFloat(productForm.cost)).toFixed(2)}
                  </p>
                </div>
              )}

              {/* Branch Dropdown */}
              <div>
                <Label className="text-xs font-bold uppercase">
                  Select Branch *
                </Label>
                <select
                  value={productForm.branchId}
                  onChange={(e) => setProductForm({
                    ...productForm, 
                    branchId: e.target.value
                  })}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  disabled={isAdding || isEditing || branchesLoading}
                >
                  <option value="">Select a branch</option>
                  {branchesLoading ? (
                    <option value="" disabled>Loading branches...</option>
                  ) : branches.length === 0 ? (
                    <option value="" disabled>No branches available</option>
                  ) : (
                    branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                        {branch.city && ` (${branch.city})`}
                      </option>
                    ))
                  )}
                </select>
                {branchesLoading && (
                  <p className="text-xs text-gray-500 mt-1">Loading branches...</p>
                )}
                {!branchesLoading && branches.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">No branches available. Please add branches first.</p>
                )}
              </div>

              {/* Status Dropdown */}
              <div>
                <Label className="text-xs font-bold uppercase">
                  Status
                </Label>
                <select
                  value={productForm.status}
                  onChange={(e) => setProductForm({
                    ...productForm, 
                    status: e.target.value as 'active' | 'inactive' | 'low-stock' | 'out-of-stock'
                  })}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  disabled={isAdding || isEditing}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="low-stock">Low Stock</option>
                  <option value="out-of-stock">Out of Stock</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Note: Status will auto-update based on stock levels
                </p>
              </div>

              {/* Save Button */}
              <Button
                onClick={selectedProduct ? handleEditProduct : handleAddProduct}
                className="w-full bg-secondary hover:bg-secondary/90 text-primary rounded-lg font-bold mt-6"
                disabled={isAdding || isEditing}
              >
                {isAdding || isEditing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {selectedProduct ? 'Updating...' : 'Adding...'}
                  </>
                ) : selectedProduct ? (
                  'Update Product'
                ) : (
                  'Add Product'
                )}
              </Button>
              
              {/* Show which fields are missing */}
              {(!productForm.name.trim() || !productForm.categoryId || !productForm.price || 
                !productForm.cost || !productForm.totalStock || !productForm.branchId) && (
                <div className="text-xs text-red-500 mt-2">
                  * Required fields must be filled
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Delete Confirmation Sheet */}
        <Sheet open={deleteDialogOpen} onOpenChange={(open) => {
          if (!open) setSelectedProduct(null);
          setDeleteDialogOpen(open);
        }}>
          <SheetContent className="sm:max-w-lg">
            <div className="flex flex-col h-full">
              <div className="shrink-0 px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50">
                <SheetHeader className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                      <Trash2 className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <SheetTitle className="text-2xl font-bold text-gray-900">Delete Product</SheetTitle>
                      <SheetDescription className="text-gray-600 mt-1">
                        This action cannot be undone.
                      </SheetDescription>
                    </div>
                  </div>
                </SheetHeader>
              </div>

              <div className="flex-1 px-6 py-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-red-900 mb-2">
                        Are you sure you want to delete this product?
                      </h3>
                      <p className="text-red-700 mb-4">
                        This will permanently delete <strong>"{selectedProduct?.name}"</strong>.
                      </p>
                      <div className="bg-white rounded-lg p-4 border border-red-300">
                        <div className="flex items-center gap-3">
                          {selectedProduct?.imageUrl ? (
                            <div className="w-12 h-12 rounded-lg overflow-hidden">
                              <img 
                                src={selectedProduct.imageUrl} 
                                alt={selectedProduct.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <Package className="w-12 h-12 text-gray-400" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{selectedProduct?.name}</p>
                            <p className="text-sm text-gray-600">{selectedProduct?.sku}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-1 rounded-md text-xs ${getStatusColor(selectedProduct?.status || '')}`}>
                                {selectedProduct?.status?.replace('-', ' ')}
                              </span>
                              <span className="px-2 py-1 rounded-md text-xs border border-gray-300">
                                ${selectedProduct?.price}
                              </span>
                              <span className="px-2 py-1 rounded-md text-xs border border-gray-300">
                                Stock: {selectedProduct?.totalStock}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="shrink-0 px-6 py-6 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDeleteDialogOpen(false);
                      setSelectedProduct(null);
                    }}
                    className="px-6 py-3"
                    disabled={isDeleting === selectedProduct?.id}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteProduct}
                    disabled={isDeleting === selectedProduct?.id}
                    className="px-8 py-3"
                  >
                    {isDeleting === selectedProduct?.id ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-5 h-5 mr-2" />
                        Delete Product
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </ProtectedRoute>
  );
}