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
import { Scissors, Clock, DollarSign, Plus, Edit, MoreVertical, Search, Filter, Building, Check, Trash2, Eye, EyeOff, Loader2, Tag, Image as ImageIcon } from "lucide-react";
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
export interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  duration: number;
  status: 'active' | 'inactive';
  branches: string[];
  branchNames?: string[];
  categoryId?: string;
  imageUrl?: string; // ✅ Added imageUrl field
  createdAt: Date;
  updatedAt?: Date;
  totalBookings?: number;
  revenue?: number;
  popularity?: 'high' | 'medium' | 'low';
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

export default function SuperAdminServices() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State for data
  const [services, setServices] = useState<Service[]>([]);
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

  // Dialog states
  const [showAddServiceDialog, setShowAddServiceDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Form state - WITH IMAGE URL
  const [serviceForm, setServiceForm] = useState({
    name: '',
    category: '',
    categoryId: '',
    description: '',
    price: '',
    duration: '',
    imageUrl: '', // ✅ Added imageUrl field
    status: 'active' as 'active' | 'inactive',
    branchId: ''
  });

  // 🔥 Firebase se real-time services fetch
  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    const fetchServices = async () => {
      try {
        setLoading(true);
        const servicesRef = collection(db, 'services');
        const q = query(servicesRef, orderBy('createdAt', 'desc'));
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const servicesData: Service[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            const createdAt = data.createdAt as Timestamp;
            const updatedAt = data.updatedAt as Timestamp;
            
            servicesData.push({
              id: doc.id,
              name: data.name || '',
              category: data.category || '',
              description: data.description || '',
              price: data.price || 0,
              duration: data.duration || 0,
              imageUrl: data.imageUrl || '', // ✅ Added imageUrl
              status: data.status || 'active',
              branches: data.branches || [],
              branchNames: data.branchNames || [],
              categoryId: data.categoryId || '',
              totalBookings: data.totalBookings || 0,
              revenue: data.revenue || 0,
              popularity: data.popularity || 'low',
              createdAt: createdAt?.toDate() || new Date(),
              updatedAt: updatedAt?.toDate()
            });
          });
          
          setServices(servicesData);
          setLoading(false);
        }, (error) => {
          console.error("Error fetching services: ", error);
          setLoading(false);
        });

      } catch (error) {
        console.error("Error in fetchServices: ", error);
        setLoading(false);
      }
    };

    fetchServices();
    
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

  // 🔥 Firebase se categories fetch (FIXED - No complex queries)
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
              type: data.type || 'service',
              isActive: data.isActive !== false,
              createdAt: createdAt?.toDate() || new Date(),
              updatedAt: updatedAt?.toDate()
            });
          });
          
          // Filter for service categories on client side
          const serviceCategories = allCategories.filter(
            cat => cat.type === 'service' && cat.isActive === true
          );
          
          setCategories(serviceCategories);
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

  // 🔥 Add Service to Firebase (WITH IMAGE URL)
  const handleAddService = async () => {
    // Validation checks
    if (!serviceForm.name.trim()) {
      alert('Please enter service name');
      return;
    }
    
    if (!serviceForm.categoryId) {
      alert('Please select a category');
      return;
    }
    
    if (!serviceForm.price || isNaN(parseFloat(serviceForm.price)) || parseFloat(serviceForm.price) <= 0) {
      alert('Please enter a valid price');
      return;
    }
    
    if (!serviceForm.duration || isNaN(parseInt(serviceForm.duration)) || parseInt(serviceForm.duration) <= 0) {
      alert('Please enter a valid duration');
      return;
    }
    
    if (!serviceForm.branchId) {
      alert('Please select a branch');
      return;
    }

    setIsAdding(true);
    try {
      const servicesRef = collection(db, 'services');
      
      // Get selected branch
      const selectedBranch = branches.find(b => b.id === serviceForm.branchId);
      const branchName = selectedBranch ? selectedBranch.name : '';
      
      // Get selected category
      const selectedCategory = categories.find(cat => cat.id === serviceForm.categoryId);
      const categoryName = selectedCategory?.name || serviceForm.category;
      
      const newServiceData = {
        name: serviceForm.name.trim(),
        category: categoryName,
        categoryId: serviceForm.categoryId,
        description: serviceForm.description.trim(),
        price: parseFloat(serviceForm.price),
        duration: parseInt(serviceForm.duration),
        imageUrl: serviceForm.imageUrl.trim(), // ✅ Added imageUrl
        status: serviceForm.status,
        branches: [serviceForm.branchId],
        branchNames: branchName ? [branchName] : [],
        totalBookings: 0,
        revenue: 0,
        popularity: 'low',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(servicesRef, newServiceData);
      
      setShowAddServiceDialog(false);
      resetServiceForm();
      alert('Service added successfully!');
      
    } catch (error) {
      console.error("Error adding service: ", error);
      alert('Error adding service. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  // 🔥 Edit Service in Firebase (WITH IMAGE URL)
  const handleEditService = async () => {
    if (!selectedService) return;

    // Validation checks
    if (!serviceForm.name.trim()) {
      alert('Please enter service name');
      return;
    }
    
    if (!serviceForm.categoryId) {
      alert('Please select a category');
      return;
    }
    
    if (!serviceForm.price || isNaN(parseFloat(serviceForm.price)) || parseFloat(serviceForm.price) <= 0) {
      alert('Please enter a valid price');
      return;
    }
    
    if (!serviceForm.duration || isNaN(parseInt(serviceForm.duration)) || parseInt(serviceForm.duration) <= 0) {
      alert('Please enter a valid duration');
      return;
    }
    
    if (!serviceForm.branchId) {
      alert('Please select a branch');
      return;
    }

    setIsEditing(true);
    try {
      const serviceDoc = doc(db, 'services', selectedService.id);
      
      // Get selected branch
      const selectedBranch = branches.find(b => b.id === serviceForm.branchId);
      const branchName = selectedBranch ? selectedBranch.name : '';
      
      // Get selected category
      const selectedCategory = categories.find(cat => cat.id === serviceForm.categoryId);
      const categoryName = selectedCategory?.name || serviceForm.category;
      
      await updateDoc(serviceDoc, {
        name: serviceForm.name.trim(),
        category: categoryName,
        categoryId: serviceForm.categoryId,
        description: serviceForm.description.trim(),
        price: parseFloat(serviceForm.price),
        duration: parseInt(serviceForm.duration),
        imageUrl: serviceForm.imageUrl.trim(), // ✅ Added imageUrl
        status: serviceForm.status,
        branches: [serviceForm.branchId],
        branchNames: branchName ? [branchName] : [],
        updatedAt: serverTimestamp()
      });
      
      setShowAddServiceDialog(false);
      setSelectedService(null);
      resetServiceForm();
      alert('Service updated successfully!');
      
    } catch (error) {
      console.error("Error updating service: ", error);
      alert('Error updating service. Please try again.');
    } finally {
      setIsEditing(false);
    }
  };

  // 🔥 Delete Service from Firebase
  const handleDeleteService = async () => {
    if (!selectedService) return;

    setIsDeleting(selectedService.id);
    try {
      const serviceDoc = doc(db, 'services', selectedService.id);
      await deleteDoc(serviceDoc);
      
      setDeleteDialogOpen(false);
      setSelectedService(null);
      alert('Service deleted successfully!');
    } catch (error) {
      console.error("Error deleting service: ", error);
      alert('Error deleting service. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  // Toggle service status
  const toggleServiceStatus = async (service: Service) => {
    try {
      const serviceDoc = doc(db, 'services', service.id);
      const newStatus = service.status === 'active' ? 'inactive' : 'active';
      
      await updateDoc(serviceDoc, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      
      alert(`Service ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error("Error updating service status: ", error);
      alert('Error updating service status. Please try again.');
    }
  };

  const resetServiceForm = () => {
    setServiceForm({
      name: '',
      category: '',
      categoryId: '',
      description: '',
      price: '',
      duration: '',
      imageUrl: '', // ✅ Added imageUrl
      status: 'active',
      branchId: ''
    });
  };

  const openEditDialog = (service: Service) => {
    setSelectedService(service);
    setServiceForm({
      name: service.name,
      category: service.category,
      categoryId: service.categoryId || '',
      description: service.description,
      price: service.price.toString(),
      duration: service.duration.toString(),
      imageUrl: service.imageUrl || '', // ✅ Added imageUrl
      status: service.status,
      branchId: service.branches[0] || ''
    });
    setShowAddServiceDialog(true);
  };

  const openDeleteDialog = (service: Service) => {
    setSelectedService(service);
    setDeleteDialogOpen(true);
  };

  // Get unique categories from services for filter dropdown
  const serviceCategories = [...new Set(services.map(service => service.category))];

  // Filter services
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Get popularity color
  const getPopularityColor = (popularity?: string) => {
    switch (popularity) {
      case "high": return "bg-blue-100 text-blue-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Calculate stats
  const totalServices = services.length;
  const activeServices = services.filter(s => s.status === 'active').length;
  const totalRevenue = services.reduce((acc, service) => acc + (service.revenue || 0), 0);
  const totalBookings = services.reduce((acc, service) => acc + (service.totalBookings || 0), 0);
  const avgPrice = services.length > 0 ? services.reduce((acc, service) => acc + service.price, 0) / services.length : 0;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Render loading state
  if (loading && services.length === 0) {
    return (
      <ProtectedRoute requiredRole="super_admin">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-secondary" />
            <p className="text-muted-foreground">Loading services...</p>
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
                  <h1 className="text-2xl font-bold text-gray-900">Services Management</h1>
                  <p className="text-sm text-gray-600">Manage services across all branches</p>
                  {loading && services.length > 0 && (
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
                    setSelectedService(null);
                    resetServiceForm();
                    setShowAddServiceDialog(true);
                  }}
                  disabled={loading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service
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
                    <CardTitle className="text-sm font-medium">Total Services</CardTitle>
                    <Scissors className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalServices}</div>
                    <p className="text-xs text-muted-foreground">
                      {activeServices} active services
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${totalRevenue.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      From all services
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {totalBookings.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Across all branches
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Price</CardTitle>
                    <Filter className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${avgPrice.toFixed(0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Per service
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
                          placeholder="Search services..."
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
                        {serviceCategories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Services Grid */}
              {loading && services.length === 0 ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Loading services...</p>
                </div>
              ) : filteredServices.length === 0 ? (
                <div className="text-center py-12">
                  <Scissors className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || categoryFilter !== 'all'
                      ? 'Try adjusting your search or filter criteria'
                      : 'Get started by adding your first service'
                    }
                  </p>
                  {!searchTerm && categoryFilter === 'all' && (
                    <Button onClick={() => setShowAddServiceDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Service
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredServices.map((service) => (
                    <Card key={service.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg text-primary">{service.name}</CardTitle>
                            <CardDescription className="text-secondary font-medium">
                              {service.category}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(service.status)}>
                              {service.status}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" disabled={isDeleting === service.id}>
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(service)} disabled={isDeleting === service.id}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Service
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleServiceStatus(service)} disabled={isDeleting === service.id}>
                                  {service.status === 'active' ? (
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
                                  onClick={() => openDeleteDialog(service)} 
                                  className="text-red-600"
                                  disabled={isDeleting === service.id}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* ✅ Service Image Preview */}
                          {service.imageUrl && (
                            <div className="w-full h-40 rounded-lg overflow-hidden">
                              <img 
                                src={service.imageUrl} 
                                alt={service.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          
                          <p className="text-sm text-gray-600 line-clamp-2">{service.description}</p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1 text-sm">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                <span className="font-semibold">${service.price}</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm">
                                <Clock className="w-4 h-4 text-blue-600" />
                                <span>{service.duration} min</span>
                              </div>
                            </div>
                            <Badge className={getPopularityColor(service.popularity)}>
                              {service.popularity}
                            </Badge>
                          </div>

                         

                          <div>
                            <h4 className="font-medium text-gray-900 mb-2 text-sm">Available at Branch</h4>
                            <div className="flex flex-wrap gap-1">
                              {service.branchNames && service.branchNames.length > 0 ? (
                                service.branchNames.map((branchName, index) => (
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
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditDialog(service)}>
                              Edit
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => toggleServiceStatus(service)}>
                              {service.status === 'active' ? 'Deactivate' : 'Activate'}
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

        {/* Add/Edit Service Sheet WITH IMAGE URL */}
        <Sheet open={showAddServiceDialog} onOpenChange={(open) => {
          if (!open) {
            setSelectedService(null);
            resetServiceForm();
          }
          setShowAddServiceDialog(open);
        }}>
          <SheetContent className="overflow-y-auto sm:max-w-xl h-[700px] m-auto rounded-3xl p-5">
            <SheetHeader>
              <SheetTitle className="font-bold text-4xl text-center text-slate-700">
                {selectedService ? 'Edit Service' : 'Add New Service'}
              </SheetTitle>
              <SheetDescription className="font-bold text-md text-center text-slate-800">
                {selectedService ? 'Update service details' : 'Create a new service record'}
              </SheetDescription>
            </SheetHeader>
            
            <div className="space-y-4 mt-6">
              {/* ✅ Service Image URL */}
              <div>
                <Label className="text-xs font-bold uppercase">
                  Service Image URL
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <ImageIcon className="w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={serviceForm.imageUrl}
                    onChange={(e) => setServiceForm({...serviceForm, imageUrl: e.target.value})}
                    className="rounded-lg"
                    disabled={isAdding || isEditing}
                  />
                </div>
                {serviceForm.imageUrl && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Image Preview:</p>
                    <div className="w-full h-32 rounded-lg overflow-hidden border">
                      <img 
                        src={serviceForm.imageUrl} 
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNlNWU1ZTUiLz48cGF0aCBkPSJNNjAgODBDNzcuNjczMSA4MCA5MiA2NS42NzMxIDkyIDQ4QzkyIDMwLjMyNjkgNzcuNjczMSAxNiA2MCAxNkM0Mi4zMjY5IDE2IDI4IDMwLjMyNjkgMjggNDhDMjggNjUuNjczMSA0Mi4zMjY5IDgwIDYwIDgwWiIgZmlsbD0iI2NjYyIvPjxwYXRoIGQ9Ik0xNiAxNTZIMTg0TDE0Ni4xMiAxMDQuOTZMMTEyIDE0NEw3My44IDk2TDE2IDE1NloiIGZpbGw9IiNjY2MiLz48L3N2Zz4=';
                        }}
                      />
                    </div>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Paste a direct image URL (e.g., from Firebase Storage, Cloudinary, etc.)
                </p>
              </div>

              {/* Service Name */}
              <div>
                <Label className="text-xs font-bold uppercase">
                  Service Name *
                </Label>
                <Input
                  placeholder="e.g., Classic Haircut"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({...serviceForm, name: e.target.value})}
                  className="mt-1 rounded-lg"
                  disabled={isAdding || isEditing}
                />
              </div>

              {/* Category Dropdown */}
              <div>
                <Label className="text-xs font-bold uppercase">
                  Category *
                </Label>
                <select
                  value={serviceForm.categoryId}
                  onChange={(e) => {
                    const selectedCat = categories.find(cat => cat.id === e.target.value);
                    setServiceForm({
                      ...serviceForm, 
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
                    <option value="" disabled>No categories available</option>
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
                  <p className="text-xs text-red-500 mt-1">No categories available. Please add categories first.</p>
                )}
              </div>

              {/* Description */}
              <div>
                <Label className="text-xs font-bold uppercase">
                  Description
                </Label>
                <Textarea
                  placeholder="Describe the service..."
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({...serviceForm, description: e.target.value})}
                  className="mt-1 rounded-lg w-full border border-gray-200 p-2 text-sm"
                  disabled={isAdding || isEditing}
                  rows={3}
                />
              </div>

              {/* Price and Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-bold uppercase">
                    Price ($) *
                  </Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({...serviceForm, price: e.target.value})}
                    className="mt-1 rounded-lg"
                    disabled={isAdding || isEditing}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase">
                    Duration (minutes) *
                  </Label>
                  <Input
                    type="number"
                    placeholder="30"
                    value={serviceForm.duration}
                    onChange={(e) => setServiceForm({...serviceForm, duration: e.target.value})}
                    className="mt-1 rounded-lg"
                    disabled={isAdding || isEditing}
                    min="1"
                  />
                </div>
              </div>

              {/* Branch Dropdown */}
              <div>
                <Label className="text-xs font-bold uppercase">
                  Select Branch *
                </Label>
                <select
                  value={serviceForm.branchId}
                  onChange={(e) => setServiceForm({
                    ...serviceForm, 
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
                  value={serviceForm.status}
                  onChange={(e) => setServiceForm({
                    ...serviceForm, 
                    status: e.target.value as 'active' | 'inactive'
                  })}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  disabled={isAdding || isEditing}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* Save Button */}
              <Button
                onClick={selectedService ? handleEditService : handleAddService}
                className="w-full bg-secondary hover:bg-secondary/90 text-primary rounded-lg font-bold mt-6"
                disabled={isAdding || isEditing}
              >
                {isAdding || isEditing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {selectedService ? 'Updating...' : 'Adding...'}
                  </>
                ) : selectedService ? (
                  'Update Service'
                ) : (
                  'Add Service'
                )}
              </Button>
              
              {/* Show which fields are missing */}
              {(!serviceForm.name.trim() || !serviceForm.categoryId || !serviceForm.price || 
                !serviceForm.duration || !serviceForm.branchId) && (
                <div className="text-xs text-red-500 mt-2">
                  * Required fields must be filled
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Delete Confirmation Sheet */}
        <Sheet open={deleteDialogOpen} onOpenChange={(open) => {
          if (!open) setSelectedService(null);
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
                      <SheetTitle className="text-2xl font-bold text-gray-900">Delete Service</SheetTitle>
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
                        Are you sure you want to delete this service?
                      </h3>
                      <p className="text-red-700 mb-4">
                        This will permanently delete <strong>"{selectedService?.name}"</strong>.
                      </p>
                      <div className="bg-white rounded-lg p-4 border border-red-300">
                        <div className="flex items-center gap-3">
                          {selectedService?.imageUrl ? (
                            <div className="w-12 h-12 rounded-lg overflow-hidden">
                              <img 
                                src={selectedService.imageUrl} 
                                alt={selectedService.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <Scissors className="w-12 h-12 text-gray-400" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{selectedService?.name}</p>
                            <p className="text-sm text-gray-600">{selectedService?.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-1 rounded-md text-xs ${getStatusColor(selectedService?.status || '')}`}>
                                {selectedService?.status}
                              </span>
                              <span className="px-2 py-1 rounded-md text-xs border border-gray-300">
                                ${selectedService?.price}
                              </span>
                              <span className="px-2 py-1 rounded-md text-xs border border-gray-300">
                                {selectedService?.duration} min
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
                      setSelectedService(null);
                    }}
                    className="px-6 py-3"
                    disabled={isDeleting === selectedService?.id}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteService}
                    disabled={isDeleting === selectedService?.id}
                    className="px-8 py-3"
                  >
                    {isDeleting === selectedService?.id ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-5 h-5 mr-2" />
                        Delete Service
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