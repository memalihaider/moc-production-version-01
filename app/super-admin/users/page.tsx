"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Users,
  Mail,
  Lock,
  Building,
  Plus,
  Edit,
  MoreVertical,
  Search,
  Filter,
  Trash2,
  X,
  Check,
  Eye,
  EyeOff,
  UserCheck,
  Shield,
  AlertCircle,
  Loader2,
  Key,
  UserPlus,
  UserMinus,
  Home,
  FileText,
  Settings,
  Calendar,
  DollarSign,
  BarChart,
  ShoppingCart,
  Package,
  Users as UsersIcon,
  Clipboard,
  Layers,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  AdminSidebar,
  AdminMobileSidebar,
} from "@/components/admin/AdminSidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

// Firebase imports
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { Unsubscribe } from "firebase/firestore";

// ✅ Page types and definitions
export interface Page {
  id: string;
  name: string;
  path: string;
  icon: any;
  category: "dashboard" | "management" | "operations" | "reports";
}

export const AVAILABLE_PAGES: Page[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    path: "/admin",
    icon: Home,
    category: "dashboard",
  },
  {
    id: "products",
    name: "Products",
    path: "/admin/products",
    icon: Package,
    category: "management",
  },
  {
    id: "messages",
    name: "Messages",
    path: "/admin/messages",
    icon: Package,
    category: "management",
  },
  {
    id: "customer-chats",
    name: "Customer Chats",
    path: "/admin/customer-chats",
    icon: Package,
    category: "management",
  },
  {
    id: "categories",
    name: "Categories",
    path: "/admin/categories",
    icon: Layers,
    category: "management",
  },
  {
    id: "services",
    name: "Services",
    path: "/admin/services",
    icon: Layers,
    category: "management",
  },
  {
    id: "appointments",
    name: "Appointments",
    path: "/admin/appointments",
    icon: ShoppingCart,
    category: "management",
  },
  {
    id: "booking calender",
    name: "Booking Calendar",
    path: "/admin/bookingcalender",
    icon: ShoppingCart,
    category: "management",
  },
  {
    id: "feedbacks",
    name: "Feedbacks",
    path: "/admin/feedbacks",
    icon: ShoppingCart,
    category: "management",
  },
  {
    id: "clients",
    name: "Clients",
    path: "/admin/clients",
    icon: UsersIcon,
    category: "management",
  },
  {
    id: "staff",
    name: "Staff",
    path: "/admin/staff",
    icon: UsersIcon,
    category: "management",
  },
  {
    id: "analytics",
    name: "Analytics",
    path: "/admin/analytics",
    icon: BarChart,
    category: "reports",
  },
  {
    id: "expenses",
    name: "Expenses",
    path: "/admin/expenses",
    icon: DollarSign,
    category: "operations",
  },
  {
    id: "orders",
    name: "Orders",
    path: "/admin/orders",
    icon: ShoppingCart,
    category: "management",
  },
  {
    id: "membership",
    name: "Membership",
    path: "/admin/membership",
    icon: Clipboard,
    category: "management",
  },
  {
    id: "custom invoice",
    name: "Custom Invoice",
    path: "/admin/custominvoice",
    icon: FileText,
    category: "operations",
  },
  {
    id: "settings",
    name: "Settings",
    path: "/admin/settings",
    icon: Settings,
    category: "operations",
  },
];

// ✅ User Types
export interface User {
  id: string;
  uid?: string;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "customer";
  branchId?: string;
  branchName?: string;
  allowedPages: string[];
  status: "active" | "inactive" | "suspended";
  createdAt: Date;
  updatedAt?: Date;
  lastLogin?: Date;
}

export interface Branch {
  id: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  status: "active" | "inactive";
  createdAt: Date;
}

// ✅ User Card Component
const UserCard = ({
  userItem,
  getRoleColor,
  getStatusColor,
  getBranchInfo,
  getPageIcon,
  getPageName,
  openEditDialog,
  openDeleteDialog,
  isDeleting,
  currentUser,
  onToggleStatus,
}: any) => {
  return (
    <Card key={userItem.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {userItem.name
                .split(" ")
                .map((n: string) => n[0])
                .join("")}
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{userItem.name}</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={getRoleColor(userItem.role)}>
                  {userItem.role.replace("_", " ")}
                </Badge>
                <Badge className={getStatusColor(userItem.status)}>
                  {userItem.status}
                </Badge>
              </div>
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {userItem.email}
              </div>
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Building className="w-3 h-3" />
                {getBranchInfo(userItem)}
              </div>
              {userItem.role === "admin" && (
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="outline" className="text-xs bg-blue-50">
                    {userItem.allowedPages?.length || 0} Pages
                  </Badge>
                  {userItem.allowedPages?.slice(0, 3).map((pageId: string) => {
                    const Icon = getPageIcon(pageId);
                    return (
                      <Badge key={pageId} variant="outline" className="text-xs">
                        <Icon className="w-2.5 h-2.5 mr-1" />
                        {getPageName(pageId)}
                      </Badge>
                    );
                  })}
                  {userItem.allowedPages?.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{userItem.allowedPages.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isDeleting === userItem.id}
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => openEditDialog(userItem)}
                disabled={isDeleting === userItem.id}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onToggleStatus(userItem)}
                disabled={isDeleting === userItem.id}
              >
                {userItem.status === "active" ? (
                  <>
                    <UserMinus className="w-4 h-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 mr-2" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openDeleteDialog(userItem)}
                className="text-red-600"
                disabled={
                  isDeleting === userItem.id ||
                  userItem.email === currentUser?.email
                }
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-xs text-gray-500 pt-2">
            Joined:{" "}
            {userItem.createdAt
              ? new Date(userItem.createdAt).toLocaleDateString()
              : "N/A"}
            {userItem.lastLogin && (
              <span className="ml-3">
                Last login: {new Date(userItem.lastLogin).toLocaleDateString()}
              </span>
            )}
            {userItem.uid && (
              <div className="text-xs text-gray-400 mt-1">
                ID: {userItem.uid.substring(0, 8)}...
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function SuperAdminUsers() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [activeTab, setActiveTab] = useState<string>("all");

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "admin" as "super_admin" | "admin" | "customer",
    branchId: "",
    allowedPages: ["dashboard"] as string[],
    status: "active" as "active" | "inactive" | "suspended",
  });

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 🔥 FINAL FIXED: Firebase se SIRF super_admin aur admin fetch - NO INDEX REQUIRED!
  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const usersRef = collection(db, "users");

        // ✅ FIXED: Sirf role filter, NO orderBy - Index ki zaroorat nahi!
        const q = query(
          usersRef,
          where("role", "in", ["super_admin", "admin"]),
        );

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const usersData: User[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              const createdAt = data.createdAt as Timestamp;
              const updatedAt = data.updatedAt as Timestamp;
              const lastLogin = data.lastLogin as Timestamp;

              usersData.push({
                id: doc.id,
                uid: data.uid || undefined,
                name: data.name || "",
                email: data.email || "",
                role: data.role || "admin",
                branchId: data.branchId || undefined,
                branchName: data.branchName || undefined,
                allowedPages: data.allowedPages || ["dashboard"],
                status: data.status || "active",
                createdAt: createdAt?.toDate() || new Date(),
                updatedAt: updatedAt?.toDate(),
                lastLogin: lastLogin?.toDate(),
              });
            });

            // ✅ CLIENT-SIDE SORTING - Index ki zaroorat nahi!
            usersData.sort(
              (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
            );

            setUsers(usersData);
            setLoading(false);
          },
          (error) => {
            console.error("Error fetching users: ", error);
            setLoading(false);
          },
        );
      } catch (error) {
        console.error("Error in fetchUsers: ", error);
        setLoading(false);
      }
    };

    fetchUsers();

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
        const branchesRef = collection(db, "branches");

        const q = query(branchesRef);

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const branchesData: Branch[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              const createdAt = data.createdAt as Timestamp;

              branchesData.push({
                id: doc.id,
                name: data.name || "",
                address: data.address || "",
                city: data.city || "",
                country: data.country || "",
                phone: data.phone || "",
                email: data.email || "",
                status: data.status || "active",
                createdAt: createdAt?.toDate() || new Date(),
              });
            });

            const activeBranches = branchesData
              .filter((branch) => branch.status === "active")
              .sort((a, b) => a.name.localeCompare(b.name));

            setBranches(activeBranches);
            setBranchesLoading(false);
          },
          (error) => {
            console.error("Error fetching branches: ", error);
            setBranchesLoading(false);
          },
        );
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

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "admin",
      branchId: "",
      allowedPages: ["dashboard"],
      status: "active",
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const togglePage = (pageId: string) => {
    setFormData((prev) => {
      const isCurrentlySelected = prev.allowedPages.includes(pageId);
      if (isCurrentlySelected) {
        if (pageId === "dashboard") return prev;
        return {
          ...prev,
          allowedPages: prev.allowedPages.filter((id) => id !== pageId),
        };
      } else {
        return {
          ...prev,
          allowedPages: [...prev.allowedPages, pageId],
        };
      }
    });
  };

  const selectAllPages = () => {
    setFormData((prev) => ({
      ...prev,
      allowedPages: AVAILABLE_PAGES.map((page) => page.id),
    }));
  };

  const deselectAllPages = () => {
    setFormData((prev) => ({
      ...prev,
      allowedPages: ["dashboard"],
    }));
  };

  const getPagesByCategory = (category: Page["category"]) => {
    return AVAILABLE_PAGES.filter((page) => page.category === category);
  };

  // ✅ FIXED: Add User - NO REDIRECT!
  const handleAddUser = async () => {
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password.trim()
    ) {
      alert("Please fill all required fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }

    const emailExists = users.some(
      (user) => user.email.toLowerCase() === formData.email.toLowerCase(),
    );
    if (emailExists) {
      alert("Email already exists");
      return;
    }

    if (formData.role === "admin" && formData.allowedPages.length === 0) {
      alert("Please select at least one page for the admin user");
      return;
    }

    setIsAdding(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email.trim().toLowerCase(),
        formData.password,
      );

      const userId = userCredential.user.uid;

      const selectedBranch = branches.find((b) => b.id === formData.branchId);

      const newUserData: any = {
        uid: userId,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        branchId: formData.branchId || null,
        branchName: selectedBranch ? selectedBranch.name : null,
        status: formData.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (formData.role === "admin") {
        newUserData.allowedPages = formData.allowedPages;
      } else if (formData.role === "super_admin") {
        newUserData.allowedPages = AVAILABLE_PAGES.map((page) => page.id);
      } else {
        newUserData.allowedPages = ["dashboard"];
      }

      await setDoc(doc(db, "users", userId), newUserData);

      setAddDialogOpen(false);
      resetForm();

      alert(
        `✅ AED{formData.role === "super_admin" ? "Super Admin" : formData.role} user "AED{formData.name}" added successfully!`,
      );
    } catch (error: any) {
      console.error("Error adding user: ", error);

      if (error.code === "auth/email-already-in-use") {
        alert("Email already exists in authentication system");
      } else if (error.code === "auth/invalid-email") {
        alert("Invalid email address");
      } else if (error.code === "auth/weak-password") {
        alert("Password is too weak. Use at least 6 characters");
      } else {
        alert(`Error adding user: AED{error.message}`);
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser || !formData.name.trim() || !formData.email.trim()) {
      alert("Please fill all required fields");
      return;
    }

    if (formData.email.toLowerCase() !== selectedUser.email.toLowerCase()) {
      const emailExists = users.some(
        (user) =>
          user.email.toLowerCase() === formData.email.toLowerCase() &&
          user.id !== selectedUser.id,
      );
      if (emailExists) {
        alert("Email already exists");
        return;
      }
    }

    if (formData.role === "admin" && formData.allowedPages.length === 0) {
      alert("Please select at least one page for the admin user");
      return;
    }

    setIsEditing(true);
    try {
      const userDoc = doc(db, "users", selectedUser.id);

      const selectedBranch = branches.find((b) => b.id === formData.branchId);

      const updateData: any = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        branchId: formData.branchId || null,
        branchName: selectedBranch ? selectedBranch.name : null,
        status: formData.status,
        updatedAt: serverTimestamp(),
      };

      if (formData.role === "admin") {
        updateData.allowedPages = formData.allowedPages;
      } else if (formData.role === "super_admin") {
        updateData.allowedPages = AVAILABLE_PAGES.map((page) => page.id);
      } else {
        updateData.allowedPages = ["dashboard"];
      }

      await updateDoc(userDoc, updateData);

      setEditDialogOpen(false);
      setSelectedUser(null);
      resetForm();
      alert(`✅ User updated successfully!`);
    } catch (error: any) {
      console.error("Error updating user: ", error);
      alert(`Error updating user: AED{error.message}`);
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    if (selectedUser.email === user?.email) {
      alert("You cannot delete your own account!");
      return;
    }

    setIsDeleting(selectedUser.id);
    try {
      // Delete from Firebase Auth via server API (uses Admin SDK)
      const uid = selectedUser.uid || selectedUser.id;
      const res = await fetch("/api/users/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete user from authentication");
      }

      // Delete from Firestore
      const userDoc = doc(db, "users", selectedUser.id);
      await deleteDoc(userDoc);

      setDeleteDialogOpen(false);
      setSelectedUser(null);
      alert("User deleted successfully!");
    } catch (error: any) {
      console.error("Error deleting user: ", error);
      alert(`Error deleting user: ${error.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleToggleStatus = async (userItem: User) => {
    try {
      const userDoc = doc(db, "users", userItem.id);
      const newStatus = userItem.status === "active" ? "inactive" : "active";
      await updateDoc(userDoc, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      alert(`User status changed to AED{newStatus}`);
    } catch (error: any) {
      console.error("Error toggling user status: ", error);
      alert(`Error updating user status: AED{error.message}`);
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      confirmPassword: "",
      role: user.role,
      branchId: user.branchId || "",
      allowedPages: user.allowedPages || ["dashboard"],
      status: user.status,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const getFilteredUsersByTab = () => {
    let filtered = users.filter((userItem) => {
      const matchesSearch =
        userItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userItem.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBranch =
        branchFilter === "all" ||
        (branchFilter === "global" && !userItem.branchId) ||
        userItem.branchId === branchFilter;
      const matchesStatus =
        statusFilter === "all" || userItem.status === statusFilter;

      return matchesSearch && matchesBranch && matchesStatus;
    });

    if (activeTab !== "all") {
      filtered = filtered.filter((user) => user.role === activeTab);
    }

    return filtered;
  };

  const filteredUsers = getFilteredUsersByTab();

  const getAllUsersCount = () => {
    return users.filter((userItem) => {
      const matchesSearch =
        userItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userItem.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBranch =
        branchFilter === "all" ||
        (branchFilter === "global" && !userItem.branchId) ||
        userItem.branchId === branchFilter;
      const matchesStatus =
        statusFilter === "all" || userItem.status === statusFilter;

      return matchesSearch && matchesBranch && matchesStatus;
    }).length;
  };

  const getRoleCount = (role: string) => {
    return users.filter((userItem) => {
      const matchesSearch =
        userItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userItem.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBranch =
        branchFilter === "all" ||
        (branchFilter === "global" && !userItem.branchId) ||
        userItem.branchId === branchFilter;
      const matchesStatus =
        statusFilter === "all" || userItem.status === statusFilter;
      const matchesRole = userItem.role === role;

      return matchesSearch && matchesBranch && matchesStatus && matchesRole;
    }).length;
  };

  const getBranchInfo = (user?: User) => {
    if (!user) return "No Branch";
    if (!user.branchId) return "Global User";
    return user.branchName || `Branch (AED{user.branchId?.substring(0, 8)}...)`;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-purple-100 text-purple-800";
      case "admin":
        return "bg-red-100 text-red-800";
      case "customer":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPageIcon = (pageId: string) => {
    const page = AVAILABLE_PAGES.find((p) => p.id === pageId);
    return page ? page.icon : FileText;
  };

  const getPageName = (pageId: string) => {
    const page = AVAILABLE_PAGES.find((p) => p.id === pageId);
    return page ? page.name : pageId;
  };

  const superAdmins = users.filter((u) => u.role === "super_admin");
  const admins = users.filter((u) => u.role === "admin");
  const customers = [];
  const activeUsers = users.filter((u) => u.status === "active");

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleAddDialogOpen = (open: boolean) => {
    if (open) {
      resetForm();
    }
    setAddDialogOpen(open);
  };

  if (loading && users.length === 0) {
    return (
      <>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-secondary" />
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar role="super_admin" onLogout={handleLogout} />
        <AdminMobileSidebar
          role="super_admin"
          onLogout={handleLogout}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Users Management
                </h1>
                <p className="text-sm text-gray-600">
                  Manage Super Admins & Branch Admins only
                </p>
              </div>
              <Button
                onClick={() => handleAddDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </header>

          {/* Filters */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  <SelectItem value="global">Global Users</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Total Users
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {users.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <UserCheck className="w-8 h-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Active Users
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {activeUsers.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <Shield className="w-8 h-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Super Admins
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {superAdmins.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="flex-1 overflow-hidden px-6 pb-6">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden h-full flex flex-col">
              {/* Tabs Header */}
              <div className="border-b border-gray-200 shrink-0">
                <div className="flex overflow-x-auto">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all AED{
                      activeTab === "all"
                        ? "border-blue-600 text-blue-600 bg-blue-50"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    All Users
                    <Badge
                      className={`ml-2 AED{
                        activeTab === "all"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {getAllUsersCount()}
                    </Badge>
                  </button>

                  <button
                    onClick={() => setActiveTab("super_admin")}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all AED{
                      activeTab === "super_admin"
                        ? "border-purple-600 text-purple-600 bg-purple-50"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    Super Admins
                    <Badge
                      className={`ml-2 AED{
                        activeTab === "super_admin"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {getRoleCount("super_admin")}
                    </Badge>
                  </button>

                  <button
                    onClick={() => setActiveTab("admin")}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all AED{
                      activeTab === "admin"
                        ? "border-red-600 text-red-600 bg-red-50"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Admins
                    <Badge
                      className={`ml-2 AED{
                        activeTab === "admin"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {getRoleCount("admin")}
                    </Badge>
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    {activeTab === "all" ? (
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    ) : activeTab === "super_admin" ? (
                      <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    ) : (
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    )}
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {activeTab === "all"
                        ? "No users found"
                        : activeTab === "super_admin"
                          ? "No super admins found"
                          : "No admins found"}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm ||
                      branchFilter !== "all" ||
                      statusFilter !== "all"
                        ? "Try adjusting your filters"
                        : "Get started by adding your first user"}
                    </p>
                    {!searchTerm &&
                      branchFilter === "all" &&
                      statusFilter === "all" && (
                        <Button onClick={() => handleAddDialogOpen(true)}>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add{" "}
                          {activeTab === "all"
                            ? "User"
                            : activeTab.replace("_", " ")}
                        </Button>
                      )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.map((userItem) => (
                      <UserCard
                        key={userItem.id}
                        userItem={userItem}
                        getRoleColor={getRoleColor}
                        getStatusColor={getStatusColor}
                        getBranchInfo={getBranchInfo}
                        getPageIcon={getPageIcon}
                        getPageName={getPageName}
                        openEditDialog={openEditDialog}
                        openDeleteDialog={openDeleteDialog}
                        isDeleting={isDeleting}
                        currentUser={user}
                        onToggleStatus={handleToggleStatus}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Sheet */}
      <Sheet open={addDialogOpen} onOpenChange={handleAddDialogOpen}>
        <SheetContent className="sm:max-w-2xl h-[90vh] m-auto rounded-3xl p-4 w-full overflow-y-auto">
          <div className="flex flex-col h-full">
            <div className="shrink-0 px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <SheetHeader className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shadow-sm">
                    <UserPlus className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <SheetTitle className="text-2xl font-bold text-gray-900">
                      Add New User
                    </SheetTitle>
                    <SheetDescription className="text-gray-600 mt-1">
                      Create a new user account with role, branch assignment,
                      and page permissions.
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Users className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Basic Information
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="name"
                        className="text-sm font-medium text-gray-700 flex items-center gap-2"
                      >
                        <Users className="w-4 h-4" />
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Enter full name"
                        className="mt-1"
                        disabled={isAdding}
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="email"
                        className="text-sm font-medium text-gray-700 flex items-center gap-2"
                      >
                        <Mail className="w-4 h-4" />
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        placeholder="Enter email address"
                        className="mt-1"
                        disabled={isAdding}
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="password"
                        className="text-sm font-medium text-gray-700 flex items-center gap-2"
                      >
                        <Lock className="w-4 h-4" />
                        Password *
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              password: e.target.value,
                            }))
                          }
                          placeholder="Enter password (min 6 characters)"
                          className="mt-1 pr-10"
                          disabled={isAdding}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isAdding}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label
                        htmlFor="confirmPassword"
                        className="text-sm font-medium text-gray-700 flex items-center gap-2"
                      >
                        <Key className="w-4 h-4" />
                        Confirm Password *
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              confirmPassword: e.target.value,
                            }))
                          }
                          placeholder="Confirm password"
                          className="mt-1 pr-10"
                          disabled={isAdding}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          disabled={isAdding}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role Selection */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Shield className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Role Selection
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all AED{
                        formData.role === "super_admin"
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          role: "super_admin",
                          allowedPages: AVAILABLE_PAGES.map((page) => page.id),
                        }));
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center AED{
                            formData.role === "super_admin"
                              ? "bg-purple-100"
                              : "bg-gray-100"
                          }`}
                        >
                          <Shield
                            className={`w-5 h-5 AED{
                              formData.role === "super_admin"
                                ? "text-purple-600"
                                : "text-gray-500"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            Super Admin
                          </p>
                          <p className="text-xs text-gray-600">
                            Full system access
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all AED{
                        formData.role === "admin"
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          role: "admin",
                          allowedPages: ["dashboard"],
                        }));
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center AED{
                            formData.role === "admin"
                              ? "bg-red-100"
                              : "bg-gray-100"
                          }`}
                        >
                          <Users
                            className={`w-5 h-5 AED{
                              formData.role === "admin"
                                ? "text-red-600"
                                : "text-gray-500"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Admin</p>
                          <p className="text-xs text-gray-600">
                            Custom page access
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 🔥 SIMPLE DROPDOWN PAGE PERMISSIONS - Only for Admin */}
                {formData.role === "admin" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                          Page Permissions ({formData.allowedPages.length}{" "}
                          selected)
                        </h3>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={selectAllPages}
                          disabled={isAdding}
                          className="text-xs"
                        >
                          Select All
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={deselectAllPages}
                          disabled={isAdding}
                          className="text-xs"
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>

                    {/* Dashboard Dropdown */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Home className="w-4 h-4 text-blue-600" />
                          <h4 className="text-sm font-medium text-gray-900">
                            Dashboard
                          </h4>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700"
                        >
                          {getPagesByCategory("dashboard").length} pages
                        </Badge>
                      </div>
                      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {getPagesByCategory("dashboard").map((page) => (
                          <div
                            key={page.id}
                            className={`flex items-center gap-3 p-2 rounded-lg border AED{
                              page.id === "dashboard"
                                ? "bg-gray-50"
                                : "hover:bg-gray-50 cursor-pointer"
                            }`}
                            onClick={() =>
                              page.id !== "dashboard" && togglePage(page.id)
                            }
                          >
                            <div
                              className={`p-1.5 rounded AED{
                                formData.allowedPages.includes(page.id)
                                  ? "bg-blue-100 text-blue-600"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              <page.icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-sm flex-1">{page.name}</span>
                            {page.id === "dashboard" ? (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                Required
                              </Badge>
                            ) : (
                              <input
                                type="checkbox"
                                checked={formData.allowedPages.includes(
                                  page.id,
                                )}
                                onChange={() => togglePage(page.id)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                disabled={isAdding}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Management Dropdown */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-purple-600" />
                          <h4 className="text-sm font-medium text-gray-900">
                            Management
                          </h4>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-purple-50 text-purple-700"
                        >
                          {getPagesByCategory("management").length} pages
                        </Badge>
                      </div>
                      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {getPagesByCategory("management").map((page) => (
                          <div
                            key={page.id}
                            className="flex items-center gap-3 p-2 rounded-lg border hover:bg-gray-50 cursor-pointer"
                            onClick={() => togglePage(page.id)}
                          >
                            <div
                              className={`p-1.5 rounded AED{
                                formData.allowedPages.includes(page.id)
                                  ? "bg-purple-100 text-purple-600"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              <page.icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-sm flex-1">{page.name}</span>
                            <input
                              type="checkbox"
                              checked={formData.allowedPages.includes(page.id)}
                              onChange={() => togglePage(page.id)}
                              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              disabled={isAdding}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Selected Pages Summary */}
                    {formData.allowedPages.length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-blue-900">
                              {formData.allowedPages.length} pages selected
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {formData.allowedPages
                                .slice(0, 5)
                                .map((pageId) => {
                                  const page = AVAILABLE_PAGES.find(
                                    (p) => p.id === pageId,
                                  );
                                  return (
                                    <Badge
                                      key={pageId}
                                      variant="outline"
                                      className="bg-white text-xs"
                                    >
                                      {page?.name || pageId}
                                    </Badge>
                                  );
                                })}
                              {formData.allowedPages.length > 5 && (
                                <Badge
                                  variant="outline"
                                  className="bg-white text-xs"
                                >
                                  +{formData.allowedPages.length - 5} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Super Admin Info Message */}
                {formData.role === "super_admin" && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-purple-900">
                          Super Admin Access
                        </h4>
                        <p className="text-xs text-purple-700 mt-1">
                          Super Admin automatically gets access to{" "}
                          <strong>all pages</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Branch Assignment */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Building className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Branch Assignment
                    </h3>
                  </div>

                  <div>
                    <Label
                      htmlFor="branch"
                      className="text-sm font-medium text-gray-700 flex items-center gap-2"
                    >
                      <Building className="w-4 h-4" />
                      Branch Assignment (Optional)
                    </Label>
                    <Select
                      value={formData.branchId}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, branchId: value }))
                      }
                      disabled={isAdding || branchesLoading}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select branch (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="global">
                          No Branch (Global User)
                        </SelectItem>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            <div className="flex items-center gap-2">
                              <Building className="w-3 h-3" />
                              {branch.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Settings */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Check className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Settings
                    </h3>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-gray-200">
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <Label
                          htmlFor="status"
                          className="text-sm font-medium text-gray-900 cursor-pointer"
                        >
                          User Status
                        </Label>
                        <p className="text-xs text-gray-600">
                          Set user account status
                        </p>
                      </div>
                    </div>
                    <Select
                      value={formData.status}
                      onValueChange={(
                        value: "active" | "inactive" | "suspended",
                      ) => setFormData((prev) => ({ ...prev, status: value }))}
                      disabled={isAdding}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

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
                  onClick={handleAddUser}
                  disabled={
                    isAdding ||
                    !formData.name.trim() ||
                    !formData.email.trim() ||
                    !formData.password.trim()
                  }
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding User...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add User
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      {/* Edit User Sheet */}
      <Sheet
        open={editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedUser(null);
            resetForm();
          }
          setEditDialogOpen(open);
        }}
      >
        <SheetContent className="sm:max-w-2xl h-[90vh] m-auto rounded-3xl p-4 w-full overflow-y-auto">
          <div className="flex flex-col h-full">
            <div className="shrink-0 px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
              <SheetHeader className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shadow-sm">
                    <Edit className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <SheetTitle className="text-2xl font-bold text-gray-900">
                      Edit User
                    </SheetTitle>
                    <SheetDescription className="text-gray-600 mt-1">
                      Update user information and settings.
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Users className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Basic Information
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="edit-name"
                        className="text-sm font-medium text-gray-700 flex items-center gap-2"
                      >
                        <Users className="w-4 h-4" />
                        Full Name *
                      </Label>
                      <Input
                        id="edit-name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Enter full name"
                        className="mt-1"
                        disabled={isEditing}
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="edit-email"
                        className="text-sm font-medium text-gray-700 flex items-center gap-2"
                      >
                        <Mail className="w-4 h-4" />
                        Email Address *
                      </Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        placeholder="Enter email address"
                        className="mt-1"
                        disabled={isEditing}
                      />
                    </div>
                  </div>
                </div>

                {/* Role Selection */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Shield className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Role Selection
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all AED{
                        formData.role === "super_admin"
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          role: "super_admin",
                          allowedPages: AVAILABLE_PAGES.map((page) => page.id),
                        }));
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center AED{
                            formData.role === "super_admin"
                              ? "bg-purple-100"
                              : "bg-gray-100"
                          }`}
                        >
                          <Shield
                            className={`w-5 h-5 AED{
                              formData.role === "super_admin"
                                ? "text-purple-600"
                                : "text-gray-500"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            Super Admin
                          </p>
                          <p className="text-xs text-gray-600">
                            Full system access
                          </p>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all AED{
                        formData.role === "admin"
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          role: "admin",
                          allowedPages: prev.allowedPages.includes("dashboard")
                            ? prev.allowedPages
                            : ["dashboard"],
                        }));
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center AED{
                            formData.role === "admin"
                              ? "bg-red-100"
                              : "bg-gray-100"
                          }`}
                        >
                          <Users
                            className={`w-5 h-5 AED{
                              formData.role === "admin"
                                ? "text-red-600"
                                : "text-gray-500"
                            }`}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Admin</p>
                          <p className="text-xs text-gray-600">
                            Custom page access
                          </p>
                        </div>
                      </div>
                    </div>

                  
                  </div>
                </div>

                {/* Page Permissions - Only for Admin */}
                {formData.role === "admin" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                          Page Permissions ({formData.allowedPages.length}{" "}
                          selected)
                        </h3>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={selectAllPages}
                          disabled={isEditing}
                          className="text-xs"
                        >
                          Select All
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={deselectAllPages}
                          disabled={isEditing}
                          className="text-xs"
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>

                    {/* Dashboard Pages */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        <Home className="w-4 h-4 text-blue-600" />
                        Dashboard
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {getPagesByCategory("dashboard").map((page) => (
                          <div
                            key={page.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all AED{
                              formData.allowedPages.includes(page.id)
                                ? "bg-blue-50 border-blue-200"
                                : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                            } AED{page.id === "dashboard" ? "cursor-not-allowed opacity-75" : ""}`}
                            onClick={() =>
                              page.id !== "dashboard" && togglePage(page.id)
                            }
                          >
                            <div
                              className={`p-2 rounded AED{
                                formData.allowedPages.includes(page.id)
                                  ? "bg-blue-100 text-blue-600"
                                  : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              <page.icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {page.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Required access
                              </p>
                            </div>
                            {page.id === "dashboard" ? (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                Required
                              </Badge>
                            ) : (
                              <input
                                type="checkbox"
                                checked={formData.allowedPages.includes(
                                  page.id,
                                )}
                                onChange={() => togglePage(page.id)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                disabled={page.id === "dashboard" || isEditing}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Management Pages */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-purple-600" />
                        Management
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {getPagesByCategory("management").map((page) => (
                          <div
                            key={page.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all AED{
                              formData.allowedPages.includes(page.id)
                                ? "bg-purple-50 border-purple-200"
                                : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                            }`}
                            onClick={() => togglePage(page.id)}
                          >
                            <div
                              className={`p-2 rounded AED{
                                formData.allowedPages.includes(page.id)
                                  ? "bg-purple-100 text-purple-600"
                                  : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              <page.icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {page.name}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={formData.allowedPages.includes(page.id)}
                              onChange={() => togglePage(page.id)}
                              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                              disabled={isEditing}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Operations Pages */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        <Package className="w-4 h-4 text-amber-600" />
                        Operations
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {getPagesByCategory("operations").map((page) => (
                          <div
                            key={page.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all AED{
                              formData.allowedPages.includes(page.id)
                                ? "bg-amber-50 border-amber-200"
                                : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                            }`}
                            onClick={() => togglePage(page.id)}
                          >
                            <div
                              className={`p-2 rounded AED{
                                formData.allowedPages.includes(page.id)
                                  ? "bg-amber-100 text-amber-600"
                                  : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              <page.icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {page.name}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={formData.allowedPages.includes(page.id)}
                              onChange={() => togglePage(page.id)}
                              className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                              disabled={isEditing}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Reports Pages */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        <BarChart className="w-4 h-4 text-green-600" />
                        Reports
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {getPagesByCategory("reports").map((page) => (
                          <div
                            key={page.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all AED{
                              formData.allowedPages.includes(page.id)
                                ? "bg-green-50 border-green-200"
                                : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                            }`}
                            onClick={() => togglePage(page.id)}
                          >
                            <div
                              className={`p-2 rounded AED{
                                formData.allowedPages.includes(page.id)
                                  ? "bg-green-100 text-green-600"
                                  : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              <page.icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {page.name}
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={formData.allowedPages.includes(page.id)}
                              onChange={() => togglePage(page.id)}
                              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                              disabled={isEditing}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Branch Assignment */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Building className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Branch Assignment
                    </h3>
                  </div>

                  <div>
                    <Label
                      htmlFor="edit-branch"
                      className="text-sm font-medium text-gray-700 flex items-center gap-2"
                    >
                      <Building className="w-4 h-4" />
                      Branch Assignment (Optional)
                    </Label>
                    <Select
                      value={formData.branchId}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, branchId: value }))
                      }
                      disabled={isEditing || branchesLoading}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select branch (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="global">
                          No Branch (Global User)
                        </SelectItem>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            <div className="flex items-center gap-2">
                              <Building className="w-3 h-3" />
                              {branch.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Settings */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <Check className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Settings
                    </h3>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-gray-200">
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <Label
                          htmlFor="edit-status"
                          className="text-sm font-medium text-gray-900 cursor-pointer"
                        >
                          User Status
                        </Label>
                        <p className="text-xs text-gray-600">
                          Set user account status
                        </p>
                      </div>
                    </div>
                    <Select
                      value={formData.status}
                      onValueChange={(
                        value: "active" | "inactive" | "suspended",
                      ) => setFormData((prev) => ({ ...prev, status: value }))}
                      disabled={isEditing}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 px-6 py-6 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false);
                    setSelectedUser(null);
                    resetForm();
                  }}
                  className="w-full sm:w-auto"
                  disabled={isEditing}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleEditUser}
                  disabled={
                    isEditing || !formData.name.trim() || !formData.email.trim()
                  }
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
                      Update User
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Sheet */}
      <Sheet
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedUser(null);
          }
          setDeleteDialogOpen(open);
        }}
      >
        <SheetContent className="sm:max-w-lg h-[700px] m-auto rounded-3xl p-4 w-full">
          <div className="flex flex-col h-full">
            <div className="shrink-0 px-6 py-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50">
              <SheetHeader className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shadow-sm">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <SheetTitle className="text-2xl font-bold text-gray-900">
                      Delete User
                    </SheetTitle>
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
                      Are you sure you want to delete this user?
                    </h3>
                    <p className="text-red-700 mb-4">
                      This will permanently delete{" "}
                      <strong>"{selectedUser?.name}"</strong>.
                    </p>
                    {selectedUser?.email === user?.email && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-yellow-600" />
                          <p className="text-yellow-700 font-medium">
                            You cannot delete your own account!
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="bg-white rounded-lg p-4 border border-red-300">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                          {selectedUser?.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {selectedUser?.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {selectedUser?.email}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              className={getRoleColor(selectedUser?.role || "")}
                            >
                              {selectedUser?.role?.replace("_", " ")}
                            </Badge>
                            <Badge
                              className={getStatusColor(
                                selectedUser?.status || "",
                              )}
                            >
                              {selectedUser?.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="shrink-0 px-6 py-6 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteDialogOpen(false);
                    setSelectedUser(null);
                  }}
                  className="w-full sm:w-auto"
                  disabled={isDeleting === selectedUser?.id}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteUser}
                  disabled={
                    isDeleting === selectedUser?.id ||
                    selectedUser?.email === user?.email
                  }
                  className="w-full sm:w-auto"
                >
                  {isDeleting === selectedUser?.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete User
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
