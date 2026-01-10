'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { 
  Building, MapPin, Phone, Users, DollarSign, TrendingUp, Plus, 
  Search, Filter, Star, X, Check, Loader2, Mail, Globe, Clock, 
  FileText, Upload, Eye, EyeOff, Edit, Trash2, MoreVertical,
  Menu
} from "lucide-react";
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

export interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
  openingTime: string;
  closingTime: string;
  description: string;
  image?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt?: Date;
}

export default function SuperAdminBranches() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    country: '',
    phone: '',
    email: '',
    managerName: '',
    managerPhone: '',
    managerEmail: '',
    openingTime: '09:00',
    closingTime: '18:00',
    description: '',
    image: '',
    status: 'active' as 'active' | 'inactive'
  });

  // 🔥 Firebase se real-time branches fetch
  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    const fetchBranches = async () => {
      try {
        setLoading(true);
        const branchesRef = collection(db, 'branches');
        const q = query(branchesRef, orderBy('createdAt', 'desc'));
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const branchesData: Branch[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            const createdAt = data.createdAt as Timestamp;
            const updatedAt = data.updatedAt as Timestamp;
            
            branchesData.push({
              id: doc.id,
              name: data.name || '',
              address: data.address || '',
              city: data.city || '',
              country: data.country || '',
              phone: data.phone || '',
              email: data.email || '',
              managerName: data.managerName || '',
              managerPhone: data.managerPhone || '',
              managerEmail: data.managerEmail || '',
              openingTime: data.openingTime || '09:00',
              closingTime: data.closingTime || '18:00',
              description: data.description || '',
              image: data.image || '',
              status: data.status || 'active',
              createdAt: createdAt?.toDate() || new Date(),
              updatedAt: updatedAt?.toDate()
            });
          });
          
          setBranches(branchesData);
          setLoading(false);
        }, (error) => {
          console.error("Error fetching branches: ", error);
          setLoading(false);
        });

      } catch (error) {
        console.error("Error in fetchBranches: ", error);
        setLoading(false);
      }
    };

    fetchBranches();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      country: '',
      phone: '',
      email: '',
      managerName: '',
      managerPhone: '',
      managerEmail: '',
      openingTime: '09:00',
      closingTime: '18:00',
      description: '',
      image: '',
      status: 'active'
    });
  };

  // 🔥 Add Branch to Firebase
  const handleAddBranch = async () => {
    if (!formData.name.trim() || !formData.address.trim()) {
      alert('Please fill all required fields');
      return;
    }

    setIsAdding(true);
    try {
      const branchesRef = collection(db, 'branches');
      const newBranchData = {
        ...formData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(branchesRef, newBranchData);
      
      setAddDialogOpen(false);
      resetForm();
      alert('Branch added successfully!');
      
    } catch (error) {
      console.error("Error adding branch: ", error);
      alert('Error adding branch. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  // 🔥 Edit Branch in Firebase
  const handleEditBranch = async () => {
    if (!selectedBranch || !formData.name.trim()) {
      alert('Please fill all required fields');
      return;
    }

    setIsEditing(true);
    try {
      const branchDoc = doc(db, 'branches', selectedBranch.id);
      await updateDoc(branchDoc, {
        ...formData,
        updatedAt: serverTimestamp()
      });
      
      setEditDialogOpen(false);
      setSelectedBranch(null);
      resetForm();
      alert('Branch updated successfully!');
      
    } catch (error) {
      console.error("Error updating branch: ", error);
      alert('Error updating branch. Please try again.');
    } finally {
      setIsEditing(false);
    }
  };

  // 🔥 Delete Branch from Firebase
  const handleDeleteBranch = async () => {
    if (!selectedBranch) return;

    setIsDeleting(selectedBranch.id);
    try {
      const branchDoc = doc(db, 'branches', selectedBranch.id);
      await deleteDoc(branchDoc);
      
      setDeleteDialogOpen(false);
      setSelectedBranch(null);
      alert('Branch deleted successfully!');
    } catch (error) {
      console.error("Error deleting branch: ", error);
      alert('Error deleting branch. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  const openEditDialog = (branch: Branch) => {
    setSelectedBranch(branch);
    setFormData({
      name: branch.name,
      address: branch.address,
      city: branch.city,
      country: branch.country,
      phone: branch.phone,
      email: branch.email,
      managerName: branch.managerName,
      managerPhone: branch.managerPhone,
      managerEmail: branch.managerEmail,
      openingTime: branch.openingTime,
      closingTime: branch.closingTime,
      description: branch.description,
      image: branch.image || '',
      status: branch.status
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (branch: Branch) => {
    setSelectedBranch(branch);
    setDeleteDialogOpen(true);
  };

  const filteredBranches = branches.filter(branch => {
    const matchesSearch = branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         branch.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         branch.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         branch.managerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || branch.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleAddDialogOpen = (open: boolean) => {
    if (open) {
      resetForm();
    }
    setAddDialogOpen(open);
  };

  const activeBranches = branches.filter(b => b.status === 'active');
  const inactiveBranches = branches.filter(b => b.status === 'inactive');

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Render loading state
  if (loading && branches.length === 0) {
    return (
      <ProtectedRoute requiredRole="super_admin">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-secondary" />
            <p className="text-muted-foreground">Loading branches...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="super_admin">
      <div className="flex h-screen bg-gray-50">
        {/* Desktop Sidebar - Always visible on large screens */}
        <div className="hidden lg:block">
          <AdminSidebar role="super_admin" onLogout={handleLogout} />
        </div>

        {/* Mobile Sidebar Sheet */}
        <AdminMobileSidebar 
          role="super_admin" 
          onLogout={handleLogout}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Main Content Area */}
        <div className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          sidebarOpen ? "lg:ml-64" : "lg:ml-0"
        )}>
          {/* Header */}
          <header className="bg-white shadow-sm border-b">
            <div className="flex items-center justify-between px-4 py-4 lg:px-8">
              <div className="flex items-center gap-4">
                {/* Mobile Menu Button - Only visible on small screens */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <Menu className="w-5 h-5" />
                </button>
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Branch Management</h1>
                  <p className="text-sm text-gray-600">Manage all your locations</p>
                  {loading && branches.length > 0 && (
                    <div className="flex items-center mt-1">
                      <Loader2 className="w-3 h-3 animate-spin mr-1 text-gray-400" />
                      <span className="text-xs text-gray-500">Syncing...</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Button 
                  onClick={() => handleAddDialogOpen(true)} 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Branch
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
                    <CardTitle className="text-sm font-medium">Total Branches</CardTitle>
                    <Building className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{branches.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {activeBranches.length} active locations
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Branches</CardTitle>
                    <Check className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{activeBranches.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Currently operational
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Inactive Branches</CardTitle>
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-600">{inactiveBranches.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Temporarily closed
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Last Added</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {branches.length > 0 ? 
                        new Date(branches[0].createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
                        : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Most recent branch
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
                          placeholder="Search branches by name, address, city, or manager..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter} disabled={loading}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Branches</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Branches Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBranches.map((branch) => (
                  <Card key={branch.id} className="hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden relative">
                      {branch.image ? (
                        <img
                          src={branch.image}
                          alt={branch.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.parentElement?.querySelector('.fallback')?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ${branch.image ? 'hidden fallback' : ''}`}>
                        <Building className="w-12 h-12 text-white" />
                      </div>
                      <div className="absolute top-2 right-2 flex gap-2">
                        <Badge className={getStatusColor(branch.status)}>
                          {branch.status}
                        </Badge>
                      </div>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg text-primary">{branch.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {branch.address}, {branch.city}, {branch.country}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{branch.phone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="truncate">{branch.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span>Manager: {branch.managerName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>{branch.openingTime} - {branch.closingTime}</span>
                          </div>
                        </div>

                        {branch.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{branch.description}</p>
                        )}

                        <div className="flex gap-2 pt-4">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => openEditDialog(branch)}
                            disabled={isDeleting === branch.id}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => openDeleteDialog(branch)}
                            disabled={isDeleting === branch.id}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredBranches.length === 0 && (
                <div className="text-center py-12">
                  <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No branches found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Try adjusting your search or filter criteria'
                      : 'Get started by adding your first branch'
                    }
                  </p>
                  {!searchTerm && statusFilter === 'all' && (
                    <Button onClick={() => handleAddDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Branch
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Branch Sheet */}
      <Sheet open={addDialogOpen} onOpenChange={handleAddDialogOpen}>
        <SheetContent className="sm:max-w-lg h-[700px] m-auto rounded-3xl p-4 w-full">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="shrink-0 px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <SheetHeader className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shadow-sm">
                    <Plus className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <SheetTitle className="text-2xl font-bold text-gray-900">Add New Branch</SheetTitle>
                    <SheetDescription className="text-gray-600 mt-1">
                      Add a new branch location with all necessary details.
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-6">
                {/* Basic Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Building className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Branch Information</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                        Branch Name *
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter branch name"
                        className="mt-1"
                        disabled={isAdding}
                      />
                    </div>

                    <div>
                      <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                        Address *
                      </Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Enter full address"
                        rows={2}
                        className="mt-1"
                        disabled={isAdding}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                          City *
                        </Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="Enter city"
                          className="mt-1"
                          disabled={isAdding}
                        />
                      </div>
                      <div>
                        <Label htmlFor="country" className="text-sm font-medium text-gray-700">
                          Country *
                        </Label>
                        <Input
                          id="country"
                          value={formData.country}
                          onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                          placeholder="Enter country"
                          className="mt-1"
                          disabled={isAdding}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                          Phone Number *
                        </Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="Enter phone number"
                          className="mt-1"
                          disabled={isAdding}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Enter email address"
                          className="mt-1"
                          disabled={isAdding}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="openingTime" className="text-sm font-medium text-gray-700">
                          Opening Time
                        </Label>
                        <Input
                          id="openingTime"
                          type="time"
                          value={formData.openingTime}
                          onChange={(e) => setFormData(prev => ({ ...prev, openingTime: e.target.value }))}
                          className="mt-1"
                          disabled={isAdding}
                        />
                      </div>
                      <div>
                        <Label htmlFor="closingTime" className="text-sm font-medium text-gray-700">
                          Closing Time
                        </Label>
                        <Input
                          id="closingTime"
                          type="time"
                          value={formData.closingTime}
                          onChange={(e) => setFormData(prev => ({ ...prev, closingTime: e.target.value }))}
                          className="mt-1"
                          disabled={isAdding}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Manager Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Users className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Manager Information</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="managerName" className="text-sm font-medium text-gray-700">
                        Manager Name *
                      </Label>
                      <Input
                        id="managerName"
                        value={formData.managerName}
                        onChange={(e) => setFormData(prev => ({ ...prev, managerName: e.target.value }))}
                        placeholder="Enter manager name"
                        className="mt-1"
                        disabled={isAdding}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="managerPhone" className="text-sm font-medium text-gray-700">
                          Manager Phone *
                        </Label>
                        <Input
                          id="managerPhone"
                          value={formData.managerPhone}
                          onChange={(e) => setFormData(prev => ({ ...prev, managerPhone: e.target.value }))}
                          placeholder="Enter manager phone"
                          className="mt-1"
                          disabled={isAdding}
                        />
                      </div>
                      <div>
                        <Label htmlFor="managerEmail" className="text-sm font-medium text-gray-700">
                          Manager Email
                        </Label>
                        <Input
                          id="managerEmail"
                          type="email"
                          value={formData.managerEmail}
                          onChange={(e) => setFormData(prev => ({ ...prev, managerEmail: e.target.value }))}
                          placeholder="Enter manager email"
                          className="mt-1"
                          disabled={isAdding}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Additional Information</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter branch description"
                        rows={3}
                        className="mt-1"
                        disabled={isAdding}
                      />
                    </div>

                    <div>
                      <Label htmlFor="image" className="text-sm font-medium text-gray-700">
                        Image URL
                      </Label>
                      <Input
                        id="image"
                        value={formData.image}
                        onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                        placeholder="Enter image URL (optional)"
                        className="mt-1"
                        disabled={isAdding}
                      />
                    </div>

                    <div>
                      <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                        Status
                      </Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: 'active' | 'inactive') =>
                          setFormData(prev => ({ ...prev, status: value }))
                        }
                        disabled={isAdding}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-6 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setAddDialogOpen(false)}
                  className="w-full sm:w-auto"
                  disabled={isAdding}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleAddBranch}
                  disabled={isAdding || !formData.name.trim() || !formData.address.trim()}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Branch
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Branch Sheet */}
      <Sheet open={editDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setSelectedBranch(null);
          resetForm();
        }
        setEditDialogOpen(open);
      }}>
        <SheetContent className="sm:max-w-lg h-[700px] m-auto rounded-3xl p-4 w-full">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="shrink-0 px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
              <SheetHeader className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shadow-sm">
                    <Edit className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <SheetTitle className="text-2xl font-bold text-gray-900">Edit Branch</SheetTitle>
                    <SheetDescription className="text-gray-600 mt-1">
                      Update branch information and settings.
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-6">
                {/* Basic Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Building className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Branch Information</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-name" className="text-sm font-medium text-gray-700">
                        Branch Name *
                      </Label>
                      <Input
                        id="edit-name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter branch name"
                        className="mt-1"
                        disabled={isEditing}
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-address" className="text-sm font-medium text-gray-700">
                        Address *
                      </Label>
                      <Textarea
                        id="edit-address"
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Enter full address"
                        rows={2}
                        className="mt-1"
                        disabled={isEditing}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-city" className="text-sm font-medium text-gray-700">
                          City *
                        </Label>
                        <Input
                          id="edit-city"
                          value={formData.city}
                          onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="Enter city"
                          className="mt-1"
                          disabled={isEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-country" className="text-sm font-medium text-gray-700">
                          Country *
                        </Label>
                        <Input
                          id="edit-country"
                          value={formData.country}
                          onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                          placeholder="Enter country"
                          className="mt-1"
                          disabled={isEditing}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-phone" className="text-sm font-medium text-gray-700">
                          Phone Number *
                        </Label>
                        <Input
                          id="edit-phone"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="Enter phone number"
                          className="mt-1"
                          disabled={isEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-email" className="text-sm font-medium text-gray-700">
                          Email Address
                        </Label>
                        <Input
                          id="edit-email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="Enter email address"
                          className="mt-1"
                          disabled={isEditing}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-openingTime" className="text-sm font-medium text-gray-700">
                          Opening Time
                        </Label>
                        <Input
                          id="edit-openingTime"
                          type="time"
                          value={formData.openingTime}
                          onChange={(e) => setFormData(prev => ({ ...prev, openingTime: e.target.value }))}
                          className="mt-1"
                          disabled={isEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-closingTime" className="text-sm font-medium text-gray-700">
                          Closing Time
                        </Label>
                        <Input
                          id="edit-closingTime"
                          type="time"
                          value={formData.closingTime}
                          onChange={(e) => setFormData(prev => ({ ...prev, closingTime: e.target.value }))}
                          className="mt-1"
                          disabled={isEditing}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Manager Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Users className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Manager Information</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-managerName" className="text-sm font-medium text-gray-700">
                        Manager Name *
                      </Label>
                      <Input
                        id="edit-managerName"
                        value={formData.managerName}
                        onChange={(e) => setFormData(prev => ({ ...prev, managerName: e.target.value }))}
                        placeholder="Enter manager name"
                        className="mt-1"
                        disabled={isEditing}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-managerPhone" className="text-sm font-medium text-gray-700">
                          Manager Phone *
                        </Label>
                        <Input
                          id="edit-managerPhone"
                          value={formData.managerPhone}
                          onChange={(e) => setFormData(prev => ({ ...prev, managerPhone: e.target.value }))}
                          placeholder="Enter manager phone"
                          className="mt-1"
                          disabled={isEditing}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-managerEmail" className="text-sm font-medium text-gray-700">
                          Manager Email
                        </Label>
                        <Input
                          id="edit-managerEmail"
                          type="email"
                          value={formData.managerEmail}
                          onChange={(e) => setFormData(prev => ({ ...prev, managerEmail: e.target.value }))}
                          placeholder="Enter manager email"
                          className="mt-1"
                          disabled={isEditing}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Additional Information</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-description" className="text-sm font-medium text-gray-700">
                        Description
                      </Label>
                      <Textarea
                        id="edit-description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter branch description"
                        rows={3}
                        className="mt-1"
                        disabled={isEditing}
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-image" className="text-sm font-medium text-gray-700">
                        Image URL
                      </Label>
                      <Input
                        id="edit-image"
                        value={formData.image}
                        onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                        placeholder="Enter image URL (optional)"
                        className="mt-1"
                        disabled={isEditing}
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-status" className="text-sm font-medium text-gray-700">
                        Status
                      </Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: 'active' | 'inactive') =>
                          setFormData(prev => ({ ...prev, status: value }))
                        }
                        disabled={isEditing}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-6 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false);
                    setSelectedBranch(null);
                    resetForm();
                  }}
                  className="w-full sm:w-auto"
                  disabled={isEditing}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleEditBranch}
                  disabled={isEditing || !formData.name.trim() || !formData.address.trim()}
                  className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700"
                >
                  {isEditing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Update Branch
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Sheet */}
      <Sheet open={deleteDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setSelectedBranch(null);
        }
        setDeleteDialogOpen(open);
      }}>
        <SheetContent className="sm:max-w-md m-auto rounded-3xl p-4 w-full">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="shrink-0 px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50">
              <SheetHeader className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shadow-sm">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <SheetTitle className="text-2xl font-bold text-gray-900">Delete Branch</SheetTitle>
                    <SheetDescription className="text-gray-600 mt-1">
                      This action cannot be undone.
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>
            </div>

            {/* Content */}
            <div className="flex-1 px-6 py-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">
                      Are you sure you want to delete this branch?
                    </h3>
                    <p className="text-red-700 mb-4">
                      This will permanently delete <strong>"{selectedBranch?.name}"</strong>.
                      All associated data will be removed.
                    </p>
                    <div className="bg-white rounded-lg p-4 border border-red-300">
                      <div className="flex items-center gap-3">
                        {selectedBranch?.image ? (
                          <img
                            src={selectedBranch.image}
                            alt={selectedBranch.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Building className="w-6 h-6 text-blue-600" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{selectedBranch?.name}</p>
                          <p className="text-sm text-gray-600">{selectedBranch?.address}, {selectedBranch?.city}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {selectedBranch?.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-6 py-6 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteDialogOpen(false);
                    setSelectedBranch(null);
                  }}
                  className="w-full sm:w-auto"
                  disabled={isDeleting === selectedBranch?.id}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteBranch}
                  disabled={isDeleting === selectedBranch?.id}
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
                >
                  {isDeleting === selectedBranch?.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Branch
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </ProtectedRoute>
  );
}