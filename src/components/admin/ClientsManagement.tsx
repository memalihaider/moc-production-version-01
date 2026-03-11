"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Plus,
  Trash2,
  Edit,
  Download,
  Upload,
  Search,
  Mail,
  Phone,
  DollarSign,
  Gift,
  ShoppingCart,
  Calendar,
  Eye,
  Building,
  Clock,
  Package,
  CreditCard,
  Star,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Interface for Branch
export interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  isActive: boolean;
}

// Interface for Booking
export interface Booking {
  id: string;
  bookingNumber: string;
  bookingDate: string;
  bookingTime: string;
  branch: string;
  branchId: string;
  serviceName: string;
  servicePrice: number;
  staffName: string;
  status: string;
  totalAmount: number;
  createdAt: Date;
}

// Interface for Order
export interface Order {
  id: string;
  orderDate: string;
  expectedDeliveryDate: string;
  pickupBranch: string;
  products: Array<{
    productName: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: string;
  transactionId: string;
  createdAt: Date;
}

// Interface for Wallet
export interface Wallet {
  balance: number;
  loyaltyPoints: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
}

// Updated Client Interface (from users collection)
export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: 'active' | 'inactive' | 'blocked';
  loyaltyPoints: number;
  spendingAmount: number;
  totalOrders: number;
  totalBookings: number;
  membershipTier: "bronze" | "silver" | "gold" | "platinum";
  registrationDate: string;
  lastBookingDate?: string;
  address?: string;
  notes?: string;
  branch?: string;
  branchName?: string;
  createdAt?: Date;
  
  // New fields for additional data
  bookings?: Booking[];
  orders?: Order[];
  wallet?: Wallet;
}

interface ClientsManagementProps {
  role?: "admin" | "super_admin";
}

const MEMBERSHIP_COLORS: Record<
  "bronze" | "silver" | "gold" | "platinum",
  string
> = {
  bronze: "bg-orange-100 text-orange-800",
  silver: "bg-gray-100 text-gray-800",
  gold: "bg-yellow-100 text-yellow-800",
  platinum: "bg-blue-100 text-blue-800",
};

type MembershipTier = "bronze" | "silver" | "gold" | "platinum";

export default function ClientsManagement({
  role = "super_admin",
}: ClientsManagementProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMembership, setFilterMembership] = useState<string>("all");
  const [filterBranch, setFilterBranch] = useState<string>("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "bookings" | "orders" | "wallet">("details");

  // Branches state
  const [branches, setBranches] = useState<Branch[]>([]);

  // Add Client State
  const [newClient, setNewClient] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    branch: "",
    membershipTier: "bronze" as MembershipTier,
  });

  // Edit Client State
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);

  // 🔥 Fetch branches from Firebase
  useEffect(() => {
    const branchesRef = collection(db, "branches");
    const q = query(branchesRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const branchesData: Branch[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        branchesData.push({
          id: doc.id,
          name: data.name || "",
          address: data.address || "",
          phone: data.phone || "",
          isActive: data.isActive !== false,
        });
      });
      setBranches(branchesData);
    });

    return () => unsubscribe();
  }, []);

  // 🔥 Fetch customer's bookings from Firebase
  const fetchCustomerBookings = async (customerId: string, customerEmail: string): Promise<Booking[]> => {
    try {
      const bookingsRef = collection(db, "bookings");
      // Bookings mein customerId ya customerEmail se search karo
      const q = query(
        bookingsRef,
        where("customerId", "==", customerId)
      );
      
      const querySnapshot = await getDocs(q);
      const bookings: Booking[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        bookings.push({
          id: doc.id,
          bookingNumber: data.bookingNumber || "",
          bookingDate: data.bookingDate || "",
          bookingTime: data.bookingTime || "",
          branch: data.branch || "",
          branchId: data.branchId || "",
          serviceName: data.serviceName || data.services?.[0] || "Unknown Service",
          servicePrice: data.servicePrice || data.totalAmount || 0,
          staffName: data.staffName || data.teamMembers?.[0]?.name || "Unknown Staff",
          status: data.status || "pending",
          totalAmount: data.totalAmount || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });
      
      return bookings;
    } catch (error) {
      console.error("Error fetching customer bookings:", error);
      return [];
    }
  };

  // 🔥 Fetch customer's orders from Firebase
  const fetchCustomerOrders = async (customerId: string, customerEmail: string): Promise<Order[]> => {
    try {
      const ordersRef = collection(db, "orders");
      // Orders mein customerId ya customerEmail se search karo
      const q = query(
        ordersRef,
        where("customerId", "==", customerId)
      );
      
      const querySnapshot = await getDocs(q);
      const orders: Order[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({
          id: doc.id,
          orderDate: data.orderDate || "",
          expectedDeliveryDate: data.expectedDeliveryDate || "",
          pickupBranch: data.pickupBranch || "",
          products: data.products || [],
          totalAmount: data.totalAmount || 0,
          status: data.status || "pending",
          transactionId: data.transactionId || "",
          createdAt: data.createdAt?.toDate() || new Date(),
        });
      });
      
      return orders;
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      return [];
    }
  };

  // 🔥 Fetch customer's wallet from Firebase
  const fetchCustomerWallet = async (customerId: string): Promise<Wallet | null> => {
    try {
      const walletsRef = collection(db, "wallets");
      const q = query(
        walletsRef,
        where("customerId", "==", customerId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        return {
          balance: data.balance || 0,
          loyaltyPoints: data.loyaltyPoints || 0,
          totalPointsEarned: data.totalPointsEarned || 0,
          totalPointsRedeemed: data.totalPointsRedeemed || 0,
        };
      }
      
      return null;
    } catch (error) {
      console.error("Error fetching customer wallet:", error);
      return null;
    }
  };

  // 🔥 Fetch ONLY customers from users collection
  useEffect(() => {
    const usersRef = collection(db, "users");
    const q = query(
      usersRef, 
      where('role', '==', 'customer')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const clientsData: Client[] = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        const branchId = data.branch || "";
        const branch = branches.find(b => b.id === branchId);
        const customerId = doc.id;
        const customerEmail = data.email || "";
        
        // Fetch additional data for this customer
        const [bookings, orders, wallet] = await Promise.all([
          fetchCustomerBookings(customerId, customerEmail),
          fetchCustomerOrders(customerId, customerEmail),
          fetchCustomerWallet(customerId)
        ]);
        
        // Calculate totals from bookings and orders
        const totalBookings = bookings.length;
        const totalOrders = orders.length;
        const totalSpending = 
          bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0) +
          orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        
        // Get last booking date
        const lastBooking = bookings.length > 0 
          ? bookings.sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime())[0]
          : null;
        
        // Get loyalty points from wallet or use existing
        const loyaltyPoints = wallet?.loyaltyPoints || data.loyaltyPoints || 0;
        
        clientsData.push({
          id: doc.id,
          firstName: data.firstName || data.name?.split(' ')[0] || "",
          lastName: data.lastName || data.name?.split(' ')[1] || "",
          email: data.email || "",
          phone: data.phone || "",
          role: data.role || "customer",
          status: data.status || "active",
          loyaltyPoints: loyaltyPoints,
          spendingAmount: totalSpending,
          totalOrders: totalOrders,
          totalBookings: totalBookings,
          membershipTier: calculateMembershipTier(totalSpending, loyaltyPoints),
          registrationDate: data.registrationDate || 
            data.createdAt?.toDate?.().toISOString().split("T")[0] || 
            new Date().toISOString().split("T")[0],
          lastBookingDate: lastBooking?.bookingDate || undefined,
          address: data.address || undefined,
          notes: data.notes || undefined,
          branch: branchId,
          branchName: branch ? branch.name : undefined,
          createdAt: data.createdAt?.toDate() || new Date(),
          
          // Store additional data
          bookings: bookings,
          orders: orders,
          wallet: wallet?? undefined,
        });
      }

      // Client-side sorting
      const sortedClients = clientsData.sort((a, b) => {
        const dateA = a.createdAt?.getTime() || 0;
        const dateB = b.createdAt?.getTime() || 0;
        return dateB - dateA;
      });

      setClients(sortedClients);
    });

    return () => unsubscribe();
  }, [branches]);

  // Calculate membership tier based on spending and points
  const calculateMembershipTier = (spending: number, points: number): MembershipTier => {
    const total = spending + (points * 0.1); // Rough calculation
    if (total >= 10000) return "platinum";
    if (total >= 5000) return "gold";
    if (total >= 1000) return "silver";
    return "bronze";
  };

  // Filter clients
  const filteredClients = clients.filter((client) => {
    const searchMatch =
      client.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone.includes(searchQuery);

    const membershipMatch =
      filterMembership === "all" || client.membershipTier === filterMembership;

    const branchMatch =
      filterBranch === "all" || client.branch === filterBranch;

    return searchMatch && membershipMatch && branchMatch;
  });

  // Calculate metrics
  const totalClients = clients.length;
  const totalSpending = clients.reduce((sum, c) => sum + c.spendingAmount, 0);
  const totalLoyaltyPoints = clients.reduce(
    (sum, c) => sum + c.loyaltyPoints,
    0
  );
  const totalOrders = clients.reduce((sum, c) => sum + c.totalOrders, 0);
  const totalBookings = clients.reduce((sum, c) => sum + c.totalBookings, 0);
  const avgOrderValue = totalOrders > 0 ? totalSpending / totalOrders : 0;

  // Get branch name by ID
  const getBranchName = (branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    return branch ? branch.name : "No Branch";
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      case 'blocked':
        return <Badge className="bg-red-100 text-red-800">Blocked</Badge>;
      default:
        return <Badge className="bg-gray-100">{status}</Badge>;
    }
  };

  // Get booking status badge
  const getBookingStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100">{status}</Badge>;
    }
  };

  // Get order status badge
  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Delivered</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100">{status}</Badge>;
    }
  };

  // 🔥 Add Client to Firebase (users collection)
  const handleAddClient = async () => {
    if (
      !newClient.firstName ||
      !newClient.lastName ||
      !newClient.email ||
      !newClient.phone
    ) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const usersRef = collection(db, "users");
      const selectedBranch = branches.find(b => b.id === newClient.branch);
      
      const newClientData = {
        firstName: newClient.firstName.trim(),
        lastName: newClient.lastName.trim(),
        name: `${newClient.firstName.trim()} ${newClient.lastName.trim()}`,
        email: newClient.email.trim().toLowerCase(),
        phone: newClient.phone.trim(),
        role: "customer",
        status: "active",
        address: newClient.address.trim(),
        notes: newClient.notes.trim(),
        branch: newClient.branch || null,
        branchName: selectedBranch ? selectedBranch.name : null,
        loyaltyPoints: 0,
        spendingAmount: 0,
        totalOrders: 0,
        totalBookings: 0,
        membershipTier: newClient.membershipTier,
        registrationDate: new Date().toISOString().split("T")[0],
        createdAt: new Date(),
      };

      await addDoc(usersRef, newClientData);

      // Reset form
      setNewClient({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
        branch: "",
        membershipTier: "bronze",
      });

      // Close sheet
      setIsAddSheetOpen(false);
      alert("Client added successfully!");
    } catch (error) {
      console.error("Error adding client: ", error);
      alert("Error adding client. Please try again.");
    }
  };

  // 🔥 Edit Client in Firebase (users collection)
  const handleEditClient = async () => {
    if (!editingClient) return;

    if (
      !editingClient.firstName ||
      !editingClient.lastName ||
      !editingClient.email ||
      !editingClient.phone
    ) {
      alert("Please fill all required fields");
      return;
    }

    try {
      const clientDoc = doc(db, "users", editingClient.id);
      const selectedBranch = branches.find(b => b.id === editingClient.branch);
      
      await updateDoc(clientDoc, {
        firstName: editingClient.firstName.trim(),
        lastName: editingClient.lastName.trim(),
        name: `${editingClient.firstName.trim()} ${editingClient.lastName.trim()}`,
        email: editingClient.email.trim().toLowerCase(),
        phone: editingClient.phone.trim(),
        address: editingClient.address?.trim() || "",
        notes: editingClient.notes?.trim() || "",
        branch: editingClient.branch || null,
        branchName: selectedBranch ? selectedBranch.name : null,
        membershipTier: editingClient.membershipTier,
        updatedAt: new Date(),
      });

      // Close edit sheet
      setIsEditSheetOpen(false);
      setEditingClient(null);
      alert("Client updated successfully!");
    } catch (error) {
      console.error("Error updating client: ", error);
      alert("Error updating client. Please try again.");
    }
  };

  // 🔥 Delete Client from Firebase (users collection)
  const handleDeleteClient = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this client?")) {
      return;
    }

    try {
      const clientDoc = doc(db, "users", id);
      await deleteDoc(clientDoc);
      alert("Client deleted successfully!");
    } catch (error) {
      console.error("Error deleting client: ", error);
      alert("Error deleting client. Please try again.");
    }
  };

  // Open Edit Sheet with client data
  const openEditSheet = (client: Client) => {
    setEditingClient({ ...client });
    setIsEditSheetOpen(true);
  };

  // Handle Export Clients
  const handleExportClients = () => {
    const csv = [
      [
        "First Name",
        "Last Name",
        "Email",
        "Phone",
        "Status",
        "Branch",
        "Loyalty Points",
        "Spending Amount",
        "Total Orders",
        "Total Bookings",
        "Membership Tier",
        "Registration Date",
        "Last Booking Date",
        "Address",
        "Notes",
      ],
      ...filteredClients.map((c) => [
        c.firstName,
        c.lastName,
        c.email,
        c.phone,
        c.status,
        c.branchName || getBranchName(c.branch || "") || "No Branch",
        c.loyaltyPoints,
        c.spendingAmount,
        c.totalOrders,
        c.totalBookings,
        c.membershipTier,
        c.registrationDate,
        c.lastBookingDate || "",
        c.address || "",
        c.notes || "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/csv;charset=utf-8," + encodeURIComponent(csv)
    );
    element.setAttribute(
      "download",
      `clients-export-${new Date().toISOString().split("T")[0]}.csv`
    );
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Handle Import Clients
  const handleImportClients = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.trim().split("\n");

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map((v) => v.replace(/"/g, ""));

          if (values.length >= 11) {
            const branchName = values[5] || "";
            const branch = branches.find(b => b.name === branchName);
            
            const clientData = {
              firstName: values[0] || "",
              lastName: values[1] || "",
              name: `${values[0] || ""} ${values[1] || ""}`.trim(),
              email: values[2] || "",
              phone: values[3] || "",
              role: "customer",
              status: values[4] || "active",
              branch: branch ? branch.id : null,
              branchName: branchName || null,
              loyaltyPoints: parseInt(values[6]) || 0,
              spendingAmount: parseFloat(values[7]) || 0,
              totalOrders: parseInt(values[8]) || 0,
              totalBookings: parseInt(values[9]) || 0,
              membershipTier: (values[10] || "bronze") as MembershipTier,
              registrationDate:
                values[11] || new Date().toISOString().split("T")[0],
              lastBookingDate: values[12] || undefined,
              address: values[13] || undefined,
              notes: values[14] || undefined,
              createdAt: new Date(),
            };

            await addDoc(collection(db, "users"), clientData);
          }
        }

        alert("Clients imported successfully!");
      } catch (error) {
        console.error("Error importing clients:", error);
        alert("Error importing file. Please ensure it's a valid CSV.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-none shadow-sm rounded-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Total Customers
                </p>
                <p className="text-3xl font-sans font-bold text-primary">
                  {totalClients}
                </p>
              </div>
              <ShoppingCart className="w-12 h-12 text-secondary/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Total Spending
                </p>
                <p className="text-3xl font-sans font-bold text-primary">
                  AED{totalSpending.toLocaleString()}
                </p>
              </div>
              
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Loyalty Points
                </p>
                <p className="text-3xl font-sans font-bold text-primary">
                  {totalLoyaltyPoints.toLocaleString()}
                </p>
              </div>
              <Gift className="w-12 h-12 text-secondary/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Total Bookings
                </p>
                <p className="text-3xl font-sans font-bold text-primary">
                  {totalBookings}
                </p>
              </div>
              <Calendar className="w-12 h-12 text-secondary/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Total Orders
                </p>
                <p className="text-3xl font-sans font-bold text-primary">
                  {totalOrders}
                </p>
              </div>
              <Package className="w-12 h-12 text-secondary/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-lg border-gray-200"
          />
          <select
            value={filterMembership}
            onChange={(e) => setFilterMembership(e.target.value)}
            className="w-40 px-3 py-2 border border-gray-200 rounded-lg text-sm"
          >
            <option value="all">All Tiers</option>
            <option value="bronze">Bronze</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
            <option value="platinum">Platinum</option>
          </select>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleExportClients}
            variant="outline"
            className="border-gray-200 rounded-lg flex items-center gap-2"
            disabled={filteredClients.length === 0}
          >
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button
            variant="outline"
            className="border-gray-200 rounded-lg flex items-center gap-2"
            asChild
          >
            <label className="cursor-pointer flex items-center gap-2">
              <Upload className="w-4 h-4" /> Import
              <input
                type="file"
                accept=".csv"
                onChange={handleImportClients}
                className="hidden"
              />
            </label>
          </Button>

          {/* Add Client Sheet */}
          <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
            <SheetTrigger asChild>
              <Button className="bg-secondary hover:bg-secondary/90 text-primary rounded-lg flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Customer
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto sm:max-w-xl h-[700px] m-auto rounded-3xl p-5">
              <SheetHeader>
                <SheetTitle className="font-bold text-4xl text-center text-slate-700">
                  Add New Customer
                </SheetTitle>
                <SheetDescription className="font-bold text-md text-center text-slate-800">
                  Create a new customer record
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 mt-6">
                <div>
                  <Label className="text-xs font-bold uppercase">
                    First Name *
                  </Label>
                  <Input
                    placeholder="First name"
                    value={newClient.firstName}
                    onChange={(e) =>
                      setNewClient({ ...newClient, firstName: e.target.value })
                    }
                    className="mt-1 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase">
                    Last Name *
                  </Label>
                  <Input
                    placeholder="Last name"
                    value={newClient.lastName}
                    onChange={(e) =>
                      setNewClient({ ...newClient, lastName: e.target.value })
                    }
                    className="mt-1 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase">Email *</Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={newClient.email}
                    onChange={(e) =>
                      setNewClient({ ...newClient, email: e.target.value })
                    }
                    className="mt-1 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase">Phone *</Label>
                  <Input
                    placeholder="(555) 123-4567"
                    value={newClient.phone}
                    onChange={(e) =>
                      setNewClient({ ...newClient, phone: e.target.value })
                    }
                    className="mt-1 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase">
                    Branch
                  </Label>
                  <select
                    value={newClient.branch}
                    onChange={(e) =>
                      setNewClient({ ...newClient, branch: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase">
                    Membership Tier
                  </Label>
                  <select
                    value={newClient.membershipTier}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        membershipTier: e.target.value as MembershipTier,
                      })
                    }
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  >
                    <option value="bronze">Bronze</option>
                    <option value="silver">Silver</option>
                    <option value="gold">Gold</option>
                    <option value="platinum">Platinum</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase">Address</Label>
                  <Input
                    placeholder="Street address"
                    value={newClient.address}
                    onChange={(e) =>
                      setNewClient({ ...newClient, address: e.target.value })
                    }
                    className="mt-1 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase">Notes</Label>
                  <textarea
                    placeholder="Any additional notes..."
                    value={newClient.notes}
                    onChange={(e) =>
                      setNewClient({ ...newClient, notes: e.target.value })
                    }
                    className="mt-1 rounded-lg w-full border border-gray-200 p-2 text-sm"
                    rows={3}
                  />
                </div>
                <Button
                  onClick={handleAddClient}
                  className="w-full bg-secondary hover:bg-secondary/90 text-primary rounded-lg font-bold"
                  disabled={
                    !newClient.firstName ||
                    !newClient.lastName ||
                    !newClient.email ||
                    !newClient.phone
                  }
                >
                  Add Customer
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Clients Table */}
      <Card className="border-none shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="border-b border-gray-100 bg-gray-50">
          <CardTitle className="text-lg font-sans">
            All Customers ({filteredClients.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {filteredClients.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-muted-foreground">
                  {searchQuery || filterMembership !== "all" || filterBranch !== "all"
                    ? "No customers match your search criteria"
                    : "No customers found. Add your first customer!"}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-600">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-widest text-gray-600">
                      Tier
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-widest text-gray-600">
                      Spending
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-widest text-gray-600">
                      Points
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-widest text-gray-600">
                      Bookings
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-widest text-gray-600">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-widest text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredClients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-semibold">
                        {client.firstName} {client.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span>{client.email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{client.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {getStatusBadge(client.status)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge
                          className={cn(
                            MEMBERSHIP_COLORS[client.membershipTier],
                            "rounded-full"
                          )}
                        >
                          {client.membershipTier}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-green-600">
                        ${client.spendingAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-primary">
                        {client.loyaltyPoints.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold">
                        {client.totalBookings}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold">
                        {client.totalOrders}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* View Details Button */}
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedClient(client);
                                  setActiveTab("details");
                                }}
                                className="text-secondary hover:bg-secondary rounded-lg"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </SheetTrigger>
                            <SheetContent className="overflow-y-auto sm:max-w-4xl w-[90vw] h-[90vh] m-auto rounded-3xl p-5">
                              <SheetHeader>
                                <SheetTitle className="text-2xl font-sans font-bold">
                                  Customer Profile
                                </SheetTitle>
                                <SheetDescription>
                                  Complete customer information and history
                                </SheetDescription>
                              </SheetHeader>
                              
                              {selectedClient && (
                                <div className="space-y-6 mt-6">
                                  {/* Customer Header */}
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center text-white text-2xl font-bold">
                                        {selectedClient.firstName.charAt(0)}
                                        {selectedClient.lastName.charAt(0)}
                                      </div>
                                      <div>
                                        <h3 className="text-xl font-sans font-bold">
                                          {selectedClient.firstName} {selectedClient.lastName}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Mail className="w-4 h-4 text-gray-400" />
                                          <span className="text-sm">{selectedClient.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Phone className="w-4 h-4 text-gray-400" />
                                          <span className="text-sm">{selectedClient.phone}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <Badge
                                      className={cn(
                                        MEMBERSHIP_COLORS[selectedClient.membershipTier],
                                        "rounded-full px-4 py-2"
                                      )}
                                    >
                                      {selectedClient.membershipTier.toUpperCase()} MEMBER
                                    </Badge>
                                  </div>

                                  {/* Tabs */}
                                  <div className="border-b border-gray-200">
                                    <div className="flex gap-4">
                                      <button
                                        onClick={() => setActiveTab("details")}
                                        className={cn(
                                          "px-4 py-2 text-sm font-medium transition-colors relative",
                                          activeTab === "details"
                                            ? "text-secondary border-b-2 border-secondary"
                                            : "text-gray-500 hover:text-gray-700"
                                        )}
                                      >
                                        Details
                                      </button>
                                      <button
                                        onClick={() => setActiveTab("bookings")}
                                        className={cn(
                                          "px-4 py-2 text-sm font-medium transition-colors relative",
                                          activeTab === "bookings"
                                            ? "text-secondary border-b-2 border-secondary"
                                            : "text-gray-500 hover:text-gray-700"
                                        )}
                                      >
                                        Bookings ({selectedClient.bookings?.length || 0})
                                      </button>
                                      <button
                                        onClick={() => setActiveTab("orders")}
                                        className={cn(
                                          "px-4 py-2 text-sm font-medium transition-colors relative",
                                          activeTab === "orders"
                                            ? "text-secondary border-b-2 border-secondary"
                                            : "text-gray-500 hover:text-gray-700"
                                        )}
                                      >
                                        Orders ({selectedClient.orders?.length || 0})
                                      </button>
                                      <button
                                        onClick={() => setActiveTab("wallet")}
                                        className={cn(
                                          "px-4 py-2 text-sm font-medium transition-colors relative",
                                          activeTab === "wallet"
                                            ? "text-secondary border-b-2 border-secondary"
                                            : "text-gray-500 hover:text-gray-700"
                                        )}
                                      >
                                        Wallet
                                      </button>
                                    </div>
                                  </div>

                                  {/* Tab Content */}
                                  <div className="space-y-4">
                                    {/* Details Tab */}
                                    {activeTab === "details" && (
                                      <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                          <p className="text-xs font-bold uppercase text-muted-foreground">
                                            Branch
                                          </p>
                                          <p className="text-sm font-semibold flex items-center gap-1">
                                            <Building className="w-4 h-4 text-gray-400" />
                                            {selectedClient.branchName || 
                                             getBranchName(selectedClient.branch || "") || 
                                             "N/A"}
                                          </p>
                                        </div>
                                        <div className="space-y-1">
                                          <p className="text-xs font-bold uppercase text-muted-foreground">
                                            Status
                                          </p>
                                          {getStatusBadge(selectedClient.status)}
                                        </div>
                                        <div className="space-y-1">
                                          <p className="text-xs font-bold uppercase text-muted-foreground">
                                            Registration Date
                                          </p>
                                          <p className="text-sm font-semibold flex items-center gap-1">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            {selectedClient.registrationDate}
                                          </p>
                                        </div>
                                        <div className="space-y-1">
                                          <p className="text-xs font-bold uppercase text-muted-foreground">
                                            Last Booking
                                          </p>
                                          <p className="text-sm font-semibold flex items-center gap-1">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            {selectedClient.lastBookingDate || "No bookings yet"}
                                          </p>
                                        </div>
                                        <div className="col-span-2 space-y-1">
                                          <p className="text-xs font-bold uppercase text-muted-foreground">
                                            Address
                                          </p>
                                          <p className="text-sm flex items-center gap-1">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            {selectedClient.address || "No address provided"}
                                          </p>
                                        </div>
                                        <div className="col-span-2 space-y-1">
                                          <p className="text-xs font-bold uppercase text-muted-foreground">
                                            Notes
                                          </p>
                                          <p className="text-sm">
                                            {selectedClient.notes || "No notes"}
                                          </p>
                                        </div>
                                      </div>
                                    )}

                                    {/* Bookings Tab */}
                                    {activeTab === "bookings" && (
                                      <div className="space-y-4">
                                        {selectedClient.bookings && selectedClient.bookings.length > 0 ? (
                                          selectedClient.bookings.map((booking) => (
                                            <Card key={booking.id} className="border border-gray-100">
                                              <CardContent className="p-4">
                                                <div className="flex justify-between items-start">
                                                  <div>
                                                    <p className="font-semibold text-primary">
                                                      {booking.serviceName}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                      Booking #{booking.bookingNumber}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2 text-sm">
                                                      <Calendar className="w-4 h-4 text-gray-400" />
                                                      <span>{booking.bookingDate}</span>
                                                      <Clock className="w-4 h-4 text-gray-400 ml-2" />
                                                      <span>{booking.bookingTime}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1 text-sm">
                                                      <Building className="w-4 h-4 text-gray-400" />
                                                      <span>{booking.branch}</span>
                                                      <span className="text-gray-300">|</span>
                                                      <span>Staff: {booking.staffName}</span>
                                                    </div>
                                                  </div>
                                                  <div className="text-right">
                                                    <p className="font-bold text-lg text-primary">
                                                      ${booking.totalAmount}
                                                    </p>
                                                    {getBookingStatusBadge(booking.status)}
                                                  </div>
                                                </div>
                                              </CardContent>
                                            </Card>
                                          ))
                                        ) : (
                                          <p className="text-center text-gray-500 py-8">
                                            No bookings found for this customer
                                          </p>
                                        )}
                                      </div>
                                    )}

                                    {/* Orders Tab */}
                                    {activeTab === "orders" && (
                                      <div className="space-y-4">
                                        {selectedClient.orders && selectedClient.orders.length > 0 ? (
                                          selectedClient.orders.map((order) => (
                                            <Card key={order.id} className="border border-gray-100">
                                              <CardContent className="p-4">
                                                <div className="flex justify-between items-start">
                                                  <div>
                                                    <p className="font-semibold text-primary">
                                                      Order #{order.transactionId}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2 text-sm">
                                                      <Calendar className="w-4 h-4 text-gray-400" />
                                                      <span>Order: {order.orderDate}</span>
                                                      <Clock className="w-4 h-4 text-gray-400 ml-2" />
                                                      <span>Pickup: {order.expectedDeliveryDate}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1 text-sm">
                                                      <Building className="w-4 h-4 text-gray-400" />
                                                      <span>{order.pickupBranch}</span>
                                                    </div>
                                                    <div className="mt-2">
                                                      <p className="text-xs font-medium text-gray-500 mb-1">
                                                        Products ({order.products?.length || 0}):
                                                      </p>
                                                      {order.products?.map((product, idx) => (
                                                        <div key={idx} className="text-sm flex items-center gap-2">
                                                          <Package className="w-3 h-3 text-gray-400" />
                                                          <span>{product.productName} x{product.quantity}</span>
                                                          <span className="text-gray-400">-</span>
                                                          <span>AED {product.price}</span>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  </div>
                                                  <div className="text-right">
                                                    <p className="font-bold text-lg text-primary">
                                                      AED {order.totalAmount}
                                                    </p>
                                                    {getOrderStatusBadge(order.status)}
                                                  </div>
                                                </div>
                                              </CardContent>
                                            </Card>
                                          ))
                                        ) : (
                                          <p className="text-center text-gray-500 py-8">
                                            No orders found for this customer
                                          </p>
                                        )}
                                      </div>
                                    )}

                                    {/* Wallet Tab */}
                                    {activeTab === "wallet" && (
                                      <div className="space-y-4">
                                        {selectedClient.wallet ? (
                                          <div className="grid grid-cols-2 gap-4">
                                            <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                                              <CardContent className="p-6">
                                                <p className="text-xs font-bold uppercase text-muted-foreground mb-2">
                                                  Wallet Balance
                                                </p>
                                                <p className="text-3xl font-bold text-blue-600">
                                                  ${selectedClient.wallet.balance}
                                                </p>
                                              </CardContent>
                                            </Card>
                                            
                                            <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                                              <CardContent className="p-6">
                                                <p className="text-xs font-bold uppercase text-muted-foreground mb-2">
                                                  Current Points
                                                </p>
                                                <p className="text-3xl font-bold text-purple-600">
                                                  {selectedClient.wallet.loyaltyPoints}
                                                </p>
                                              </CardContent>
                                            </Card>
                                            
                                            <Card className="bg-gradient-to-br from-green-50 to-green-100">
                                              <CardContent className="p-6">
                                                <p className="text-xs font-bold uppercase text-muted-foreground mb-2">
                                                  Points Earned
                                                </p>
                                                <p className="text-3xl font-bold text-green-600">
                                                  {selectedClient.wallet.totalPointsEarned}
                                                </p>
                                              </CardContent>
                                            </Card>
                                            
                                            <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
                                              <CardContent className="p-6">
                                                <p className="text-xs font-bold uppercase text-muted-foreground mb-2">
                                                  Points Redeemed
                                                </p>
                                                <p className="text-3xl font-bold text-orange-600">
                                                  {selectedClient.wallet.totalPointsRedeemed}
                                                </p>
                                              </CardContent>
                                            </Card>
                                          </div>
                                        ) : (
                                          <p className="text-center text-gray-500 py-8">
                                            No wallet found for this customer
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Edit Button at Bottom */}
                                  <div className="flex justify-end pt-4 border-t border-gray-100">
                                    <Button
                                      onClick={() => {
                                        openEditSheet(selectedClient);
                                        setSelectedClient(null);
                                      }}
                                      className="bg-secondary hover:bg-secondary/90 text-primary"
                                    >
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit Customer
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </SheetContent>
                          </Sheet>

                          {/* Edit Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditSheet(client)}
                            className="text-green-700 hover:bg-green-700 rounded-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>

                          {/* Delete Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteClient(client.id)}
                            className="text-red-600 hover:bg-red-600 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Client Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-xl h-[700px] m-auto rounded-3xl p-5">
          <SheetHeader>
            <SheetTitle>Edit Customer</SheetTitle>
            <SheetDescription>Update customer information</SheetDescription>
          </SheetHeader>
          {editingClient && (
            <div className="space-y-4 mt-6">
              <div>
                <Label className="text-xs font-bold uppercase">
                  First Name *
                </Label>
                <Input
                  placeholder="First name"
                  value={editingClient.firstName}
                  onChange={(e) =>
                    setEditingClient({
                      ...editingClient,
                      firstName: e.target.value,
                    })
                  }
                  className="mt-1 rounded-lg"
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase">
                  Last Name *
                </Label>
                <Input
                  placeholder="Last name"
                  value={editingClient.lastName}
                  onChange={(e) =>
                    setEditingClient({
                      ...editingClient,
                      lastName: e.target.value,
                    })
                  }
                  className="mt-1 rounded-lg"
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase">Email *</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={editingClient.email}
                  onChange={(e) =>
                    setEditingClient({
                      ...editingClient,
                      email: e.target.value,
                    })
                  }
                  className="mt-1 rounded-lg"
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase">Phone *</Label>
                <Input
                  placeholder="(555) 123-4567"
                  value={editingClient.phone}
                  onChange={(e) =>
                    setEditingClient({
                      ...editingClient,
                      phone: e.target.value,
                    })
                  }
                  className="mt-1 rounded-lg"
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase">
                  Branch
                </Label>
                <select
                  value={editingClient.branch || ""}
                  onChange={(e) =>
                    setEditingClient({
                      ...editingClient,
                      branch: e.target.value,
                    })
                  }
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="">Select Branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs font-bold uppercase">
                  Membership Tier
                </Label>
                <select
                  value={editingClient.membershipTier}
                  onChange={(e) =>
                    setEditingClient({
                      ...editingClient,
                      membershipTier: e.target.value as MembershipTier,
                    })
                  }
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="bronze">Bronze</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="platinum">Platinum</option>
                </select>
              </div>
              <div>
                <Label className="text-xs font-bold uppercase">Address</Label>
                <Input
                  placeholder="Street address"
                  value={editingClient.address || ""}
                  onChange={(e) =>
                    setEditingClient({
                      ...editingClient,
                      address: e.target.value,
                    })
                  }
                  className="mt-1 rounded-lg"
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase">Notes</Label>
                <textarea
                  placeholder="Any additional notes..."
                  value={editingClient.notes || ""}
                  onChange={(e) =>
                    setEditingClient({
                      ...editingClient,
                      notes: e.target.value,
                    })
                  }
                  className="mt-1 rounded-lg w-full border border-gray-200 p-2 text-sm"
                  rows={3}
                />
              </div>
              <Button
                onClick={handleEditClient}
                className="w-full bg-secondary hover:bg-secondary/90 text-primary rounded-lg font-bold"
                disabled={
                  !editingClient.firstName ||
                  !editingClient.lastName ||
                  !editingClient.email ||
                  !editingClient.phone
                }
              >
                Update Customer
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}