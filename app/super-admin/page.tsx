"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Building,
  Settings,
  UserPlus,
  LogOut,
  ChevronRight,
  Package,
  Layers,
  Star,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Eye,
  Download,
  Filter,
  Bell,
  Activity,
  BarChart3,
  PieChart,
  ShoppingCart,
  Award,
  Scissors,
  Tag,
  MessageCircle,
  Wrench,
  Sparkles,
  Mail,
  Phone,
  MapPin,
  Globe,
  CreditCard,
  FileText,
  HelpCircle,
  Briefcase,
  Target,
  Zap,
  Heart,
  Gift,
  Truck,
  Repeat,
  Shield,
  Moon,
  Sun,
  Search,
  Menu,
  X,
  Edit,
  Trash2,
  MoreVertical,
  Copy,
  Check,
  CheckCheck,
  CheckCheckIcon
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  AdminSidebar,
  AdminMobileSidebar,
} from "@/components/admin/AdminSidebar";
import { cn } from "@/lib/utils";

// Firebase imports
import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  limit,
  doc,
  updateDoc,
  DocumentData,
  QuerySnapshot,
  DocumentChange
} from "firebase/firestore";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";

// Define TypeScript interfaces
interface OverallStats {
  totalBranches: number;
  totalRevenue: number;
  totalCustomers: number;
  totalStaff: number;
  avgRating: number;
  monthlyGrowth: number;
  totalServices: number;
  totalProducts: number;
  totalCategories: number;
  totalBookings: number;
}

interface BranchPerformance {
  id: string;
  name: string;
  revenue: number;
  customers: number;
  rating: number;
  status: string;
  city: string;
  manager: string;
  bookings: number;
}

interface RecentActivity {
  id: string;
  type: string;
  message: string;
  time: string;
  branch?: string;
  timestamp?: any;
  read?: boolean;
  senderBranch?: string;
  recipientBranch?: string;
  senderRole?: string;
  readBy?: string[];
  status?: string;
}

interface RecentCategory {
  id: string;
  name: string;
  type: string;
  branch: string;
  time: string;
  isActive: boolean;
}

interface RecentProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  time: string;
  status: string;
}

interface RecentService {
  id: string;
  name: string;
  price: number;
  duration: number;
  category: string;
  time: string;
  status: string;
}

interface RecentBooking {
  id: string;
  serviceName: string;
  customerName: string;
  date: string;
  time: string;
  totalAmount: number;
  status: string;
  timeAgo: string;
}

interface Notification {
  id: string;
  type: 'message' | 'booking' | 'feedback' | 'system';
  title: string;
  message: string;
  timestamp: any;
  read: boolean;
  data?: any;
}

// Firebase document interfaces
interface BranchDocument {
  id: string;
  name?: string;
  city?: string;
  managerName?: string;
  [key: string]: any;
}

interface FeedbackDocument {
  id: string;
  rating?: number;
  customerName?: string;
  branchName?: string;
  branchId?: string;
  createdAt?: { toDate: () => Date };
  [key: string]: any;
}

interface ServiceDocument {
  id: string;
  name?: string;
  price?: number;
  revenue?: number;
  duration?: number;
  category?: string;
  status?: string;
  branches?: string[];
  branchNames?: string[];
  createdAt?: { toDate: () => Date };
  [key: string]: any;
}

interface ProductDocument {
  id: string;
  name?: string;
  price?: number;
  revenue?: number;
  category?: string;
  status?: string;
  branches?: string[];
  branchNames?: string[];
  createdAt?: { toDate: () => Date };
  [key: string]: any;
}

interface CategoryDocument {
  id: string;
  name?: string;
  type?: string;
  branchName?: string;
  isActive?: boolean;
  createdAt?: { toDate: () => Date };
  [key: string]: any;
}

interface BookingDocument {
  id: string;
  serviceName?: string;
  customerName?: string;
  date?: string;
  time?: string;
  totalAmount?: number;
  status?: string;
  branchId?: string;
  branchName?: string;
  createdAt?: { toDate: () => Date };
  [key: string]: any;
}

// Updated interface for branchMessages
interface BranchMessageDocument {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: 'super_admin' | 'branch_admin';
  senderBranchId?: string;
  senderBranchName?: string;
  recipientBranchId: string;
  recipientBranchName: string;
  timestamp: any;
  read: boolean;
  readBy?: string[];
  deliveredTo?: string[];
  deletedFor?: string[];
  deletedForEveryone?: boolean;
  edited?: boolean;
  status: 'sent' | 'delivered' | 'seen';
}

// Extended booking data type
interface BookingData extends DocumentData {
  branchId?: string;
  branchName?: string;
  customerName?: string;
  serviceName?: string;
  createdAt?: any;
  totalAmount?: number;
  status?: string;
  date?: string;
  time?: string;
}

// Extended feedback data type
interface FeedbackData extends DocumentData {
  branchId?: string;
  branchName?: string;
  customerName?: string;
  rating?: number;
  createdAt?: any;
}

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("bookings");
  
  // ✅ Real-time notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  
  // ✅ AUDIO FIX
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const [showAudioPermissionPrompt, setShowAudioPermissionPrompt] = useState<boolean>(false);

  // ✅ Load read notifications from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const readNotifications = localStorage.getItem('super_admin_read_notifications');
      if (readNotifications) {
        try {
          const readIds = JSON.parse(readNotifications) as string[];
          setNotifications(prev => prev.filter(n => !readIds.includes(n.id)));
        } catch (error) {
          console.log('Error loading read notifications:', error);
        }
      }
    }
  }, []);

  // Initial state with cached data
  const [overallStats, setOverallStats] = useState<OverallStats>(() => {
    if (typeof window !== 'undefined') {
      const cachedStats = localStorage.getItem('super_admin_dashboard_stats');
      if (cachedStats) {
        try {
          return JSON.parse(cachedStats) as OverallStats;
        } catch {
          // Fallback to defaults
        }
      }
    }
    return {
      totalBranches: 0,
      totalRevenue: 0,
      totalCustomers: 0,
      totalStaff: 0,
      avgRating: 0,
      monthlyGrowth: 0,
      totalServices: 0,
      totalProducts: 0,
      totalCategories: 0,
      totalBookings: 0,
    };
  });

  const [branchPerformance, setBranchPerformance] = useState<BranchPerformance[]>(
    () => {
      if (typeof window !== 'undefined') {
        const cachedBranches = localStorage.getItem('super_admin_branch_performance');
        if (cachedBranches) {
          try {
            return JSON.parse(cachedBranches) as BranchPerformance[];
          } catch {
            // Fallback to empty array
          }
        }
      }
      return [];
    }
  );

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>(
    () => {
      if (typeof window !== 'undefined') {
        const cachedActivities = localStorage.getItem('super_admin_recent_activities');
        if (cachedActivities) {
          try {
            return JSON.parse(cachedActivities) as RecentActivity[];
          } catch {
            // Fallback to empty array
          }
        }
      }
      return [];
    }
  );

  const [recentCategories, setRecentCategories] = useState<RecentCategory[]>(
    () => {
      if (typeof window !== 'undefined') {
        const cachedCategories = localStorage.getItem('super_admin_recent_categories');
        if (cachedCategories) {
          try {
            return JSON.parse(cachedCategories) as RecentCategory[];
          } catch {
            // Fallback to empty array
          }
        }
      }
      return [];
    }
  );
  
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>(
    () => {
      if (typeof window !== 'undefined') {
        const cachedProducts = localStorage.getItem('super_admin_recent_products');
        if (cachedProducts) {
          try {
            return JSON.parse(cachedProducts) as RecentProduct[];
          } catch {
            // Fallback to empty array
          }
        }
      }
      return [];
    }
  );
  
  const [recentServices, setRecentServices] = useState<RecentService[]>(
    () => {
      if (typeof window !== 'undefined') {
        const cachedServices = localStorage.getItem('super_admin_recent_services');
        if (cachedServices) {
          try {
            return JSON.parse(cachedServices) as RecentService[];
          } catch {
            // Fallback to empty array
          }
        }
      }
      return [];
    }
  );
  
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>(
    () => {
      if (typeof window !== 'undefined') {
        const cachedBookings = localStorage.getItem('super_admin_recent_bookings');
        if (cachedBookings) {
          try {
            return JSON.parse(cachedBookings) as RecentBooking[];
          } catch {
            // Fallback to empty array
          }
        }
      }
      return [];
    }
  );

  // ✅ AUDIO FIX - Initialize audio
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/notification.mp3');
      audio.preload = 'auto';
      audio.volume = 0.7;
      audioRef.current = audio;
      audio.load();
      
      const enableAudio = () => {
        if (!audioRef.current) return;
        
        audioRef.current.volume = 0.01;
        audioRef.current.play()
          .then(() => {
            console.log('✅ Audio initialized successfully');
            setAudioEnabled(true);
            setShowAudioPermissionPrompt(false);
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
              audioRef.current.volume = 0.7;
            }
          })
          .catch((error: Error) => {
            console.log('❌ Audio initialization failed:', error);
            setAudioEnabled(false);
            setShowAudioPermissionPrompt(true);
          });
      };

      const handleUserInteraction = () => {
        enableAudio();
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('touchstart', handleUserInteraction);
        document.removeEventListener('keydown', handleUserInteraction);
      };

      document.addEventListener('click', handleUserInteraction);
      document.addEventListener('touchstart', handleUserInteraction);
      document.addEventListener('keydown', handleUserInteraction);

      enableAudio();

      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('touchstart', handleUserInteraction);
        document.removeEventListener('keydown', handleUserInteraction);
      };
    }
  }, []);

  // ✅ Play notification sound
  const playNotificationSound = async (): Promise<boolean> => {
    if (!audioRef.current) return false;

    if (!audioEnabled) {
      try {
        audioRef.current.volume = 0.01;
        await audioRef.current.play();
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.volume = 0.7;
        setAudioEnabled(true);
        setShowAudioPermissionPrompt(false);
      } catch (error) {
        setShowAudioPermissionPrompt(true);
        return false;
      }
    }

    try {
      audioRef.current.currentTime = 0;
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error: Error) => {
          console.log('❌ Failed to play sound:', error);
          setAudioEnabled(false);
          setShowAudioPermissionPrompt(true);
        });
      }
      return true;
    } catch (error) {
      return false;
    }
  };

  // ✅ Manual enable audio
  const enableAudioManually = async (): Promise<boolean> => {
    if (!audioRef.current) return false;
    
    try {
      audioRef.current.volume = 0.01;
      await audioRef.current.play();
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0.7;
      setAudioEnabled(true);
      setShowAudioPermissionPrompt(false);
      setTimeout(() => playNotificationSound(), 100);
      return true;
    } catch (error) {
      return false;
    }
  };

  // ✅ Show browser notification
  const showBrowserNotification = (title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/icon.png' });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, { body, icon: '/icon.png' });
          }
        });
      }
    }
  };

  // ✅ Request notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }, []);

  // ✅ MESSAGES NOTIFICATIONS - FROM BRANCHMESSAGES COLLECTION
  useEffect(() => {
    if (!user) return;

    console.log("🔔 Setting up branchMessages listener...");
    
    const messagesQuery = query(
      collection(db, 'branchMessages'),
      orderBy('timestamp', 'desc')
    );

    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot: QuerySnapshot) => {
  snapshot.docChanges().forEach((change: DocumentChange) => {
    if (change.type === 'added') {
      const data = change.doc.data() as BranchMessageDocument;
      
      // ✅ FIX: Pehle data lo, phir id add karo taake overwrite na ho
      const messageData = {
        ...data,
        id: change.doc.id
      };
          
          console.log("📨 NEW MESSAGE in branchMessages:", messageData);
          
          // ✅ SUPER ADMIN - No branch filter, sab messages dikhao
          
          const readNotifications = localStorage.getItem('super_admin_read_notifications');
          if (readNotifications) {
            const readIds = JSON.parse(readNotifications) as string[];
            if (readIds.includes(messageData.id)) {
              return;
            }
          }
          
          const senderName = messageData.senderName || 'Unknown';
          const senderRole = messageData.senderRole || 'user';
          const messageContent = messageData.content || '📷 Image';
          const recipientBranch = messageData.recipientBranchName || 'Unknown Branch';
          const senderBranch = messageData.senderBranchName || 'Unknown';
          
          // ✅ Create title based on sender role
          let notificationTitle = '';
          let fromTo = '';
          let roleIcon = '';
          
          if (senderRole === 'super_admin') {
            roleIcon = '👑';
            notificationTitle = `📢 Super Admin → ${recipientBranch}`;
            fromTo = `Super Admin → ${recipientBranch}`;
          } else {
            roleIcon = '🏢';
            notificationTitle = `💬 ${senderBranch} Admin → Super Admin`;
            fromTo = `${senderBranch} Admin → Super Admin`;
          }
          
          // ✅ Check if message is read by super admin
          const isReadBySuperAdmin = messageData.readBy?.includes('super-admin') || false;
          
          // Play sound
          playNotificationSound();
          
          // Show browser notification
          showBrowserNotification(
            notificationTitle,
            messageContent
          );
          
          // ✅ Create notification object with all details
          const notification: Notification = {
            id: messageData.id,
            type: 'message',
            title: notificationTitle,
            message: messageContent,
            timestamp: messageData.timestamp,
            read: false,
            data: {
              ...messageData,
              fromTo: fromTo,
              senderBranch: senderBranch,
              recipientBranch: recipientBranch,
              senderRole: senderRole,
              roleIcon: roleIcon,
              readBy: messageData.readBy || [],
              status: messageData.status,
              isReadBySuperAdmin: isReadBySuperAdmin
            }
          };

          setNotifications(prev => {
            const exists = prev.some(n => n.id === messageData.id);
            if (exists) return prev;
            return [notification, ...prev].slice(0, 50);
          });
          
          setUnreadCount(prev => prev + 1);
          
          // ✅ Add to recent activities with full details
          const timeAgo = calculateTimeAgo(messageData.timestamp?.toDate?.() || new Date());
          
          let activityMessage = '';
          if (senderRole === 'super_admin') {
            activityMessage = `📢 Super Admin → ${recipientBranch}: ${messageContent.substring(0, 30)}${messageContent.length > 30 ? '...' : ''}`;
          } else {
            activityMessage = `💬 ${senderBranch} Admin → Super Admin: ${messageContent.substring(0, 30)}${messageContent.length > 30 ? '...' : ''}`;
          }
          
          const activity: RecentActivity = {
            id: messageData.id,
            type: 'message',
            message: activityMessage,
            time: timeAgo,
            branch: recipientBranch,
            senderBranch: senderBranch,
            recipientBranch: recipientBranch,
            senderRole: senderRole,
            readBy: messageData.readBy,
            status: messageData.status,
            timestamp: messageData.timestamp,
            read: false
          };
          
          setRecentActivities(prev => {
            const exists = prev.some(a => a.id === messageData.id);
            if (exists) return prev;
            return [activity, ...prev].slice(0, 10);
          });
        }
      });
    }, (error: Error) => {
      console.error("❌ branchMessages listener error:", error);
    });

    return () => unsubscribeMessages();
  }, [user]);

  // ✅ BOOKINGS NOTIFICATIONS - SUPER ADMIN SEES ALL
  useEffect(() => {
    if (!user) return;

    const bookingsQuery = query(
      collection(db, 'bookings')
    );

    const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot: QuerySnapshot) => {
      snapshot.docChanges().forEach((change: DocumentChange) => {
        if (change.type === 'added') {
          const data = change.doc.data() as BookingData;
          const bookingData = {
            id: change.doc.id,
            branchName: data.branchName,
            customerName: data.customerName,
            serviceName: data.serviceName,
            createdAt: data.createdAt,
            ...data
          };
          
          const readNotifications = localStorage.getItem('super_admin_read_notifications');
          if (readNotifications) {
            const readIds = JSON.parse(readNotifications) as string[];
            if (readIds.includes(bookingData.id)) {
              return;
            }
          }
          
          const notification: Notification = {
            id: bookingData.id,
            type: 'booking',
            title: '📅 New Booking',
            message: `${bookingData.customerName || 'Customer'} booked ${bookingData.serviceName || 'a service'} at ${bookingData.branchName || 'branch'}`,
            timestamp: bookingData.createdAt,
            read: false,
            data: bookingData
          };

          setNotifications(prev => [notification, ...prev].slice(0, 50));
          setUnreadCount(prev => prev + 1);
          
          playNotificationSound();
          showBrowserNotification(notification.title, notification.message);
        }
      });
    });

    return () => unsubscribeBookings();
  }, [user]);

  // ✅ FEEDBACKS NOTIFICATIONS - SUPER ADMIN SEES ALL
  useEffect(() => {
    if (!user) return;

    const feedbackQuery = query(
      collection(db, 'feedbacks')
    );

    const unsubscribeFeedback = onSnapshot(feedbackQuery, (snapshot: QuerySnapshot) => {
      snapshot.docChanges().forEach((change: DocumentChange) => {
        if (change.type === 'added') {
          const data = change.doc.data() as FeedbackData;
          const feedbackData = {
            id: change.doc.id,
            branchName: data.branchName,
            customerName: data.customerName,
            rating: data.rating,
            createdAt: data.createdAt,
            ...data
          };
          
          const readNotifications = localStorage.getItem('super_admin_read_notifications');
          if (readNotifications) {
            const readIds = JSON.parse(readNotifications) as string[];
            if (readIds.includes(feedbackData.id)) {
              return;
            }
          }
          
          const notification: Notification = {
            id: feedbackData.id,
            type: 'feedback',
            title: '⭐ New Review',
            message: `${feedbackData.customerName || 'Customer'} left a ${feedbackData.rating}★ review at ${feedbackData.branchName || 'branch'}`,
            timestamp: feedbackData.createdAt,
            read: false,
            data: feedbackData
          };

          setNotifications(prev => [notification, ...prev].slice(0, 50));
          setUnreadCount(prev => prev + 1);
          
          playNotificationSound();
          showBrowserNotification(notification.title, notification.message);
        }
      });
    });

    return () => unsubscribeFeedback();
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // ✅ Mark notification as read
  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    const readNotifications = localStorage.getItem('super_admin_read_notifications');
    let readIds: string[] = [];
    
    if (readNotifications) {
      readIds = JSON.parse(readNotifications) as string[];
    }
    
    if (!readIds.includes(notificationId)) {
      readIds.push(notificationId);
      localStorage.setItem('super_admin_read_notifications', JSON.stringify(readIds));
    }
  };

  // ✅ Mark all as read
  const markAllAsRead = () => {
    const currentIds = notifications.map(n => n.id);
    setNotifications([]);
    setUnreadCount(0);
    
    const readNotifications = localStorage.getItem('super_admin_read_notifications');
    let readIds: string[] = [];
    
    if (readNotifications) {
      readIds = JSON.parse(readNotifications) as string[];
    }
    
    currentIds.forEach(id => {
      if (!readIds.includes(id)) {
        readIds.push(id);
      }
    });
    
    localStorage.setItem('super_admin_read_notifications', JSON.stringify(readIds));
  };

  // Helper function to calculate time ago
  const calculateTimeAgo = (date: Date | null | undefined): string => {
    if (!date) return "Recently";

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hour${
        Math.floor(diffInSeconds / 3600) > 1 ? "s" : ""
      } ago`;
    return `${Math.floor(diffInSeconds / 86400)} day${
      Math.floor(diffInSeconds / 86400) > 1 ? "s" : ""
    } ago`;
  };

  // ✅ MAIN FETCH FUNCTION - SUPER ADMIN, NO BRANCH FILTERING
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log("🔄 Fetching super admin dashboard data...");

        const fetchPromises = [
          getDocs(collection(db, "branches")),
          getDocs(collection(db, "feedbacks")),
          getDocs(collection(db, "services")),
          getDocs(collection(db, "products")),
          getDocs(collection(db, "categories")),
          getDocs(collection(db, "bookings")),
          getDocs(collection(db, "staff"))
        ];

        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Data fetch timeout')), 5000)
        );

        const results = await Promise.race([
          Promise.all(fetchPromises),
          timeoutPromise
        ]) as QuerySnapshot[];

        const [
          branchesSnapshot,
          feedbacksSnapshot,
          servicesSnapshot,
          productsSnapshot,
          categoriesSnapshot,
          bookingsSnapshot,
          staffSnapshot
        ] = results;

        const allBranches: BranchDocument[] = branchesSnapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as BranchDocument[];

        const allServices: ServiceDocument[] = servicesSnapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as ServiceDocument[];

        const allProducts: ProductDocument[] = productsSnapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as ProductDocument[];

        const allCategories: CategoryDocument[] = categoriesSnapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as CategoryDocument[];

        const allBookings: BookingDocument[] = bookingsSnapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as BookingDocument[];

        const allFeedbacks: FeedbackDocument[] = feedbacksSnapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as FeedbackDocument[];

        const allStaff = staffSnapshot.size;

        // ✅ Fetch customers from users collection with role="customer"
        let totalCustomers = 0;
        try {
          const customersQuery = query(
            collection(db, "users"),
            where("role", "==", "customer")
          );
          const customersSnapshot = await getDocs(customersQuery);
          totalCustomers = customersSnapshot.size;
        } catch (error) {
          console.error("❌ Error fetching customers:", error);
        }

        // ✅ SUPER ADMIN - NO FILTERING, SAB DATA DIKHAO
        const totalRevenue = allBookings.reduce(
          (sum, booking) => sum + (booking.totalAmount || 0),
          0,
        );

        const totalRating = allFeedbacks.reduce(
          (sum, feedback) => sum + (feedback.rating || 0),
          0,
        );
        
        const avgRating =
          allFeedbacks.length > 0
            ? parseFloat((totalRating / allFeedbacks.length).toFixed(1))
            : 0;

        const newStats: OverallStats = {
          totalBranches: allBranches.length,
          totalRevenue: totalRevenue,
          totalCustomers: totalCustomers,
          totalStaff: allStaff,
          avgRating: avgRating,
          monthlyGrowth: 12.5,
          totalServices: allServices.length,
          totalProducts: allProducts.length,
          totalCategories: allCategories.length,
          totalBookings: allBookings.length,
        };

        setOverallStats(newStats);

        // ✅ Branch Performance - ALL BRANCHES
        const branchPerformanceData: BranchPerformance[] = allBranches.map((branch) => {
          const branchBookings = allBookings.filter(
            (b) => b.branchId === branch.id || b.branchName === branch.name,
          );
          const branchFeedbacks = allFeedbacks.filter(
            (f) => f.branchId === branch.id || f.branchName === branch.name,
          );
          const branchRevenue = branchBookings.reduce(
            (sum, b) => sum + (b.totalAmount || 0),
            0,
          );
          const branchRatingTotal = branchFeedbacks.reduce(
            (sum, f) => sum + (f.rating || 0),
            0,
          );
          const branchRating =
            branchFeedbacks.length > 0
              ? branchRatingTotal / branchFeedbacks.length
              : 0;

          return {
            id: branch.id,
            name: branch.name || "Unnamed Branch",
            revenue: branchRevenue,
            customers: branchFeedbacks.length,
            rating: parseFloat(branchRating.toFixed(1)),
            status:
              branchRating >= 4.5
                ? "excellent"
                : branchRating >= 4.0
                  ? "good"
                  : branchRating >= 3.5
                    ? "average"
                    : "needs_attention",
            city: branch.city || "N/A",
            manager: branch.managerName || "N/A",
            bookings: branchBookings.length,
          };
        });

        setBranchPerformance(branchPerformanceData);

        // ✅ Recent items - ALL DATA
        const recentCategoriesData: RecentCategory[] = allCategories
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate?.()?.getTime() || 0;
            const dateB = b.createdAt?.toDate?.()?.getTime() || 0;
            return dateB - dateA;
          })
          .slice(0, 5)
          .map((category) => ({
            id: category.id,
            name: category.name || "Unnamed Category",
            type: category.type || "service",
            branch: category.branchName || "All Branches",
            time: calculateTimeAgo(category.createdAt?.toDate()),
            isActive: category.isActive || false,
          }));

        const recentProductsData: RecentProduct[] = allProducts
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate?.()?.getTime() || 0;
            const dateB = b.createdAt?.toDate?.()?.getTime() || 0;
            return dateB - dateA;
          })
          .slice(0, 5)
          .map((product) => ({
            id: product.id,
            name: product.name || "Unnamed Product",
            price: product.price || 0,
            category: product.category || "Uncategorized",
            time: calculateTimeAgo(product.createdAt?.toDate()),
            status: product.status || "active",
          }));

        const recentServicesData: RecentService[] = allServices
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate?.()?.getTime() || 0;
            const dateB = b.createdAt?.toDate?.()?.getTime() || 0;
            return dateB - dateA;
          })
          .slice(0, 5)
          .map((service) => ({
            id: service.id,
            name: service.name || "Unnamed Service",
            price: service.price || 0,
            duration: service.duration || 0,
            category: service.category || "Uncategorized",
            time: calculateTimeAgo(service.createdAt?.toDate()),
            status: service.status || "active",
          }));

        const recentBookingsData: RecentBooking[] = allBookings
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate?.()?.getTime() || 0;
            const dateB = b.createdAt?.toDate?.()?.getTime() || 0;
            return dateB - dateA;
          })
          .slice(0, 5)
          .map((booking) => ({
            id: booking.id,
            serviceName: booking.serviceName || "Service",
            customerName: booking.customerName || "Customer",
            date: booking.date || "N/A",
            time: booking.time || "N/A",
            totalAmount: booking.totalAmount || 0,
            status: booking.status || "pending",
            timeAgo: calculateTimeAgo(booking.createdAt?.toDate()),
          }));

        setRecentCategories(recentCategoriesData);
        setRecentProducts(recentProductsData);
        setRecentServices(recentServicesData);
        setRecentBookings(recentBookingsData);

        // ✅ Cache the data
        try {
          localStorage.setItem('super_admin_dashboard_stats', JSON.stringify(newStats));
          localStorage.setItem('super_admin_branch_performance', JSON.stringify(branchPerformanceData));
          localStorage.setItem('super_admin_recent_categories', JSON.stringify(recentCategoriesData));
          localStorage.setItem('super_admin_recent_products', JSON.stringify(recentProductsData));
          localStorage.setItem('super_admin_recent_services', JSON.stringify(recentServicesData));
          localStorage.setItem('super_admin_recent_bookings', JSON.stringify(recentBookingsData));
          localStorage.setItem('super_admin_dashboard_last_fetched', Date.now().toString());
        } catch (error) {
          console.log('Could not cache dashboard data');
        }

        console.log("✅ Super Admin Dashboard loaded successfully!");
      } catch (error) {
        console.log("Dashboard data fetch:", error);
      }
    };

    const lastFetched = localStorage.getItem('super_admin_dashboard_last_fetched');
    const shouldFetch = !lastFetched || (Date.now() - parseInt(lastFetched)) > 300000;
    
    if (shouldFetch) {
      fetchDashboardData();
    }
  }, []);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "active":
      case "completed":
      case "excellent":
        return "bg-gradient-to-r from-green-100 to-green-50 text-green-800 border-green-200";
      case "good":
      case "pending":
        return "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border-blue-200";
      case "average":
        return "bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border-yellow-200";
      case "needs_attention":
      case "cancelled":
        return "bg-gradient-to-r from-red-100 to-red-50 text-red-800 border-red-200";
      default:
        return "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
      case "completed":
      case "excellent":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "cancelled":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <ProtectedRoute requiredRole="super_admin">
       <style jsx global>{`
        html, body {
          overflow: hidden !important;
          height: 100vh;
          margin: 0;
          padding: 0;
        }
        #__next {
          height: 100vh;
          overflow: hidden;
        }
        .sidebar-container {
          height: 100vh;
          overflow: visible !important;
          position: relative;
          z-index: 50;
        }
        .sidebar-container::-webkit-scrollbar {
          display: none;
        }
        .main-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .main-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .main-scrollbar::-webkit-scrollbar-thumb {
          background: #FA9DB7;
          border-radius: 10px;
        }
        .main-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #B84A68;
        }
        .admin-sidebar {
          height: 100vh;
          overflow-y: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .admin-sidebar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar
        role="super_admin"
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <div
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out overflow-hidden",
          sidebarOpen ? "lg:ml-0" : "lg:ml-0",
        )}
      >
        {/* Modern Header - Updated with code2 colors */}
        <header className="bg-primary border-b border-secondary/10 shadow-lg shrink-0">
          <div className="flex items-center justify-between px-1 py-1">
            <div className="flex items-center gap-4">
              <AdminMobileSidebar
                role="super_admin"
                onLogout={handleLogout}
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
              />
              <div className="flex items-center gap-4">
                <div className="p-3 bg-secondary rounded-2xl shadow-lg shadow-secondary/20">
                  <Building className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-white font-sans">
                      Super Admin Dashboard
                    </h1>
                    <Badge className="bg-secondary text-primary border-0 px-3 py-1 rounded-full shadow-lg shadow-secondary/20">
                      👑 Super Admin
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-300 mt-1 flex items-center gap-2">
                    <Activity className="h-3 w-3 animate-pulse text-secondary" />
                    Multi-Branch Management System - All Data
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* ✅ AUDIO PERMISSION PROMPT */}
              
              {/* ✅ Real-time Notifications - WITH RECIPIENT BRANCH AND READ BY */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-xl bg-white/10 hover:bg-white/20 text-white"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-secondary text-primary text-xs rounded-full flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>

                {/* Notifications Dropdown - WITH FULL DETAILS */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50">
                    <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-secondary hover:text-secondary/80 h-8"
                          onClick={markAllAsRead}
                        >
                          Mark all as read
                        </Button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                          <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No notifications</p>
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((notification) => (
                          <div
                            key={notification.id}
                            className={cn(
                              "p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors relative group",
                              !notification.read && "bg-secondary/5"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "p-2 rounded-lg",
                                notification.type === 'message' ? 'bg-blue-100' :
                                notification.type === 'booking' ? 'bg-green-100' :
                                notification.type === 'feedback' ? 'bg-purple-100' : 'bg-gray-100'
                              )}>
                                {notification.type === 'message' && <MessageCircle className="h-4 w-4 text-blue-600" />}
                                {notification.type === 'booking' && <Calendar className="h-4 w-4 text-green-600" />}
                                {notification.type === 'feedback' && <Star className="h-4 w-4 text-purple-600" />}
                              </div>
                              <div className="flex-1">
                                {/* Title with role and recipient */}
                                <p className="text-sm font-medium text-gray-900">
                                  {notification.type === 'message' && notification.data?.senderRole === 'super_admin' ? (
                                    <span>👑 Super Admin → {notification.data?.recipientBranch || 'Branch'}</span>
                                  ) : notification.type === 'message' && notification.data?.senderRole === 'branch_admin' ? (
                                    <span>🏢 {notification.data.senderBranch} Admin → Super Admin</span>
                                  ) : (
                                    notification.title
                                  )}
                                </p>
                                
                                {/* Message content */}
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {notification.message}
                                </p>
                                
                                {/* Read by status */}
                                {notification.type === 'message' && notification.data?.readBy?.includes('super-admin') && (
                                  <div className="mt-1 flex items-center gap-1">
                                    <CheckCheckIcon className="h-3 w-3 text-green-600" />
                                    <span className="text-[10px] text-green-600">Read</span>
                                  </div>
                                )}
                                
                                {/* Timestamp */}
                                <p className="text-xs text-gray-400 mt-1">
                                  {calculateTimeAgo(notification.timestamp?.toDate?.())}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-secondary rounded-full"></div>
                              )}
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2 h-6 w-6 p-0 opacity-100 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                markNotificationAsRead(notification.id);
                              }}
                              title="Mark as read"
                            >
                              <Check className="h-3 w-3 text-green-600" /> 
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-2 border-t border-gray-100"></div>
                  </div>
                )}
              </div>

              {/* User Profile */}
              <div className="flex items-center gap-3 bg-white/10 px-4 py-2.5 rounded-2xl backdrop-blur-sm hover:bg-white/20 transition-colors cursor-pointer">
                <Avatar className="h-10 w-10 border-2 border-secondary/30">
                  <AvatarFallback className="bg-secondary text-primary font-bold">
                    {user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-white">
                  <p className="text-sm font-semibold">{user?.email}</p>
                  <p className="text-xs opacity-90 capitalize">
                    Super Admin
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <Button
                onClick={handleLogout}
                className="bg-secondary text-primary hover:bg-secondary/90 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-4"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area - Stats Cards and Tabs */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-white">
          <div className="h-full p-4 lg:p-6">
            {/* Dashboard Stats Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 font-sans">
                    Dashboard Overview
                  </h2>
                  <p className="text-gray-600">
                    Real-time statistics for all branches
                  </p>
                </div>
              </div>

              {/* Main Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Revenue Card */}
                <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-green-50/50 hover-lift group overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-green-200/20 rounded-full -translate-y-12 translate-x-12 group-hover:scale-110 transition-transform duration-500"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
                    <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Total Revenue
                    </CardTitle>
                    <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl shadow-lg">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="flex items-end gap-2 mb-3">
                      <div className="text-3xl font-bold text-gray-900">
                        AED {overallStats.totalRevenue.toLocaleString()}
                      </div>
                      <div className="text-sm text-green-600 font-semibold flex items-center mb-2 bg-green-100 px-2 py-1 rounded-full">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +{overallStats.monthlyGrowth}%
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">All branches revenue</p>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                        style={{ width: '75%' }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Total Customers Card */}
                <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-purple-50/50 hover-lift group overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-200/20 rounded-full -translate-y-12 translate-x-12 group-hover:scale-110 transition-transform duration-500"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
                    <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Total Customers
                    </CardTitle>
                    <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl shadow-lg">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="flex items-end gap-2 mb-3">
                      <div className="text-3xl font-bold text-gray-900">
                        {overallStats.totalCustomers}
                      </div>
                      <div className="text-sm text-green-600 font-semibold flex items-center mb-2 bg-purple-100 px-2 py-1 rounded-full">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +5.2%
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      Registered customers
                    </p>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                        style={{ width: '65%' }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Total Staff Card */}
                <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-blue-50/50 hover-lift group overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200/20 rounded-full -translate-y-12 translate-x-12 group-hover:scale-110 transition-transform duration-500"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
                    <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Total Staff
                    </CardTitle>
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                      <UserPlus className="h-5 w-5 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="flex items-end gap-2 mb-3">
                      <div className="text-3xl font-bold text-gray-900">
                        {overallStats.totalStaff}
                      </div>
                      <div className="text-sm text-green-600 font-semibold flex items-center mb-2 bg-blue-100 px-2 py-1 rounded-full">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        +8.3%
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      Staff members
                    </p>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                        style={{ width: '70%' }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Total Branches Card */}
                <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-primary/5 hover-lift group overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -translate-y-12 translate-x-12 group-hover:scale-110 transition-transform duration-500"></div>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
                    <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Total Branches
                    </CardTitle>
                    <div className="p-3 bg-secondary rounded-2xl shadow-lg shadow-secondary/20">
                      <Building className="h-5 w-5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="flex items-end gap-2 mb-3">
                      <div className="text-3xl font-bold text-gray-900">
                        {overallStats.totalBranches}
                      </div>
                      <div className="text-sm text-secondary font-semibold flex items-center mb-2 bg-secondary/10 px-2 py-1 rounded-full">
                        <CheckCircle className="h-3 w-3 mr-1 text-secondary" />
                        Active
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      All locations operational
                    </p>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-secondary rounded-full"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Secondary Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-pink-50/30">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Services
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {overallStats.totalServices}
                      </p>
                    </div>
                    <div className="p-2 bg-pink-100 rounded-lg">
                      <Settings className="h-5 w-5 text-pink-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-cyan-50/30">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Products
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {overallStats.totalProducts}
                      </p>
                    </div>
                    <div className="p-2 bg-cyan-100 rounded-lg">
                      <Package className="h-5 w-5 text-cyan-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-orange-50/30">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Categories
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {overallStats.totalCategories}
                      </p>
                    </div>
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Layers className="h-5 w-5 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-teal-50/30">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Bookings
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {overallStats.totalBookings}
                      </p>
                    </div>
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <Calendar className="h-5 w-5 text-teal-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-indigo-50/30">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Growth Rate
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        +{overallStats.monthlyGrowth}%
                      </p>
                    </div>
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-indigo-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Tabs Section for Recent Items */}
            <Card className="border-none shadow-xl mb-8 overflow-hidden">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900 font-sans">
                          Recent Items
                        </CardTitle>
                        <CardDescription>
                          Latest items from all branches
                        </CardDescription>
                      </div>
                    </div>
                    <TabsList className="grid grid-cols-4 w-full bg-gray-100/50 p-1 rounded-xl">
                      <TabsTrigger
                        value="bookings"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-secondary rounded-lg transition-all"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Bookings
                        {recentBookings.length > 0 && (
                          <Badge className="ml-2 h-5 w-5 p-0 bg-secondary text-primary">
                            {recentBookings.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger
                        value="services"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-pink-600 rounded-lg transition-all"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Services
                        {recentServices.length > 0 && (
                          <Badge className="ml-2 h-5 w-5 p-0 bg-pink-500 text-white">
                            {recentServices.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger
                        value="products"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-cyan-600 rounded-lg transition-all"
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Products
                        {recentProducts.length > 0 && (
                          <Badge className="ml-2 h-5 w-5 p-0 bg-cyan-500 text-white">
                            {recentProducts.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger
                        value="categories"
                        className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-orange-600 rounded-lg transition-all"
                      >
                        <Layers className="h-4 w-4 mr-2" />
                        Categories
                        {recentCategories.length > 0 && (
                          <Badge className="ml-2 h-5 w-5 p-0 bg-orange-500 text-white">
                            {recentCategories.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {/* Bookings Tab */}
                  <TabsContent value="bookings" className="mt-0">
                    {recentBookings.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-4">
                          <Calendar className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No Recent Bookings
                        </h3>
                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                          Bookings will appear here once customers start booking
                          services
                        </p>
                        <Link
                          href="/admin/bookings"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-primary rounded-xl hover:bg-secondary/90 transition-colors shadow-md"
                        >
                          <Calendar className="h-4 w-4" />
                          View All Bookings
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {recentBookings.map((booking) => (
                          <div
                            key={booking.id}
                            className="flex items-center justify-between p-5 bg-gradient-to-r from-white to-gray-50/50 border border-gray-100 rounded-2xl hover:border-secondary/30 hover:shadow-lg transition-all duration-300 group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-gradient-to-r from-blue-100 to-blue-50 rounded-xl">
                                <Calendar className="h-6 w-6 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className="font-bold text-lg text-gray-900">
                                    {booking.serviceName}
                                  </h3>
                                  <Badge
                                    className={cn(
                                      "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                                      getStatusColor(booking.status),
                                    )}
                                  >
                                    <span className="flex items-center gap-1">
                                      {getStatusIcon(booking.status)}
                                      {booking.status}
                                    </span>
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div>
                                    <p className="text-xs text-gray-500">
                                      Customer
                                    </p>
                                    <p className="font-semibold">
                                      {booking.customerName}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Date</p>
                                    <p className="font-semibold">{booking.date}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Time</p>
                                    <p className="font-semibold">{booking.time}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500">Amount</p>
                                    <p className="font-semibold text-lg text-secondary">
                                      ${booking.totalAmount}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-secondary transition-colors ml-4" />
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Services Tab */}
                  <TabsContent value="services" className="mt-0">
                    {recentServices.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-pink-100 to-pink-200 rounded-full flex items-center justify-center mb-4">
                          <Settings className="h-10 w-10 text-pink-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No Services Yet
                        </h3>
                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                          Start adding services to see them here
                        </p>
                        <Link
                          href="/admin/services"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors shadow-md"
                        >
                          <Settings className="h-4 w-4" />
                          Add First Service
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recentServices.map((service) => (
                          <div
                            key={service.id}
                            className="p-5 bg-gradient-to-br from-white to-pink-50/30 border border-gray-100 rounded-2xl hover:border-pink-200 hover:shadow-xl transition-all duration-300 group"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl">
                                  <Settings className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-lg text-gray-900">
                                    {service.name}
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    {service.category}
                                  </p>
                                </div>
                              </div>
                              <Badge
                                className={cn(
                                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                                  getStatusColor(service.status),
                                )}
                              >
                                {service.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-xs text-gray-500">Price</p>
                                <p className="text-xl font-bold text-secondary">
                                  AED {service.price}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Duration</p>
                                <p className="text-lg font-semibold">
                                  {service.duration} mins
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">
                                Added {service.time}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Products Tab */}
                  <TabsContent value="products" className="mt-0">
                    {recentProducts.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-full flex items-center justify-center mb-4">
                          <Package className="h-10 w-10 text-cyan-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No Products Yet
                        </h3>
                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                          Start adding products to see them here
                        </p>
                        <Link
                          href="/admin/products"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 transition-colors shadow-md"
                        >
                          <Package className="h-4 w-4" />
                          Add First Product
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recentProducts.map((product) => (
                          <div
                            key={product.id}
                            className="p-5 bg-gradient-to-br from-white to-cyan-50/30 border border-gray-100 rounded-2xl hover:border-cyan-200 hover:shadow-xl transition-all duration-300 group"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl">
                                  <Package className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-lg text-gray-900">
                                    {product.name}
                                  </h3>
                                  <p className="text-sm text-gray-500">
                                    {product.category}
                                  </p>
                                </div>
                              </div>
                              <Badge
                                className={cn(
                                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                                  getStatusColor(product.status),
                                )}
                              >
                                {product.status}
                              </Badge>
                            </div>
                            <div className="mb-4">
                              <p className="text-xs text-gray-500 mb-1">Price</p>
                              <p className="text-2xl font-bold text-secondary">
                                AED {product.price}
                              </p>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">
                                Added {product.time}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {/* Categories Tab */}
                  <TabsContent value="categories" className="mt-0">
                    {recentCategories.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mb-4">
                          <Layers className="h-10 w-10 text-orange-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No Categories Yet
                        </h3>
                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                          Start adding categories to organize your services and
                          products
                        </p>
                        <Link
                          href="/admin/categories"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors shadow-md"
                        >
                          <Layers className="h-4 w-4" />
                          Add First Category
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {recentCategories.map((category) => (
                          <div
                            key={category.id}
                            className="p-5 bg-gradient-to-br from-white to-orange-50/30 border border-gray-100 rounded-2xl hover:border-orange-200 hover:shadow-xl transition-all duration-300 group"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl">
                                  <Layers className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-lg text-gray-900">
                                    {category.name}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge className="bg-blue-100 text-blue-700 px-2 py-0.5 text-xs">
                                      {category.type}
                                    </Badge>
                                    <Badge
                                      className={cn(
                                        "px-2 py-0.5 text-xs",
                                        category.isActive
                                          ? "bg-green-100 text-green-700"
                                          : "bg-gray-100 text-gray-700",
                                      )}
                                    >
                                      {category.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <p className="text-xs text-gray-500">Branch</p>
                                <p className="font-semibold">{category.branch}</p>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">
                                  Added {category.time}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>

            {/* Branch Performance and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Branch Performance */}
              <div className="lg:col-span-2">
                <Card className="border-none shadow-xl">
                  <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <CardTitle className="text-lg font-bold text-gray-900 font-sans">
                      Branch Performance Overview
                    </CardTitle>
                    <CardDescription>
                      Revenue, customers, and ratings across all locations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {branchPerformance.length === 0 ? (
                      <div className="text-center py-8">
                        <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No branch data available</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {branchPerformance.map((branch) => (
                          <div
                            key={branch.id}
                            className="flex items-center justify-between p-5 bg-gradient-to-r from-white to-gray-50/50 border border-gray-100 rounded-2xl hover:border-secondary/30 hover:shadow-lg transition-all duration-300 group"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <h3 className="font-bold text-lg text-gray-900">
                                  {branch.name}
                                </h3>
                                <Badge
                                  className={cn(
                                    "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                                    branch.status === "excellent"
                                      ? "bg-gradient-to-r from-green-100 to-green-50 text-green-800 border-green-200"
                                      : branch.status === "good"
                                      ? "bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border-blue-200"
                                      : branch.status === "average"
                                      ? "bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border-yellow-200"
                                      : "bg-gradient-to-r from-red-100 to-red-50 text-red-800 border-red-200"
                                  )}
                                >
                                  {branch.status.replace("_", " ")}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-xs text-gray-500">Revenue</p>
                                  <p className="font-bold text-gray-900">
                                    AED {branch.revenue.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Customers</p>
                                  <p className="font-bold text-gray-900">
                                    {branch.customers}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Rating</p>
                                  <p className="font-bold text-secondary">
                                    ⭐ {branch.rating}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Bookings</p>
                                  <p className="font-bold text-gray-900">
                                    {branch.bookings}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-3">
                                <p className="text-xs text-gray-500">
                                  Manager: <span className="font-semibold">{branch.manager}</span>
                                </p>
                                <p className="text-xs text-gray-500">
                                  Location: <span className="font-semibold">{branch.city}</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="space-y-6">
                <Card className="border-none shadow-xl">
                  <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <CardTitle className="text-lg font-bold text-gray-900 font-sans">
                      Quick Actions
                    </CardTitle>
                    <CardDescription>
                      System-wide administrative tasks
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3">
                    <Link
                      href="/super-admin/branches"
                      className="flex items-center justify-between h-14 px-4 rounded-xl border-2 border-gray-100 hover:border-secondary/30 hover:bg-gradient-to-br hover:from-secondary/5 hover:to-white hover:shadow-lg transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-secondary rounded-lg">
                          <Building className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          Manage Branches
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-secondary transition-colors" />
                    </Link>

                    <Link
                      href="/super-admin/staff"
                      className="flex items-center justify-between h-14 px-4 rounded-xl border-2 border-gray-100 hover:border-green-500/30 hover:bg-gradient-to-br hover:from-green-500/5 hover:to-white hover:shadow-lg transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                          <Users className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          Manage Staff
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-green-600 transition-colors" />
                    </Link>

                    <Link
                      href="/super-admin/categories"
                      className="flex items-center justify-between h-14 px-4 rounded-xl border-2 border-gray-100 hover:border-purple-500/30 hover:bg-gradient-to-br hover:from-purple-500/5 hover:to-white hover:shadow-lg transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                          <Layers className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          Manage Categories
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-purple-600 transition-colors" />
                    </Link>

                    <Link
                      href="/super-admin/products"
                      className="flex items-center justify-between h-14 px-4 rounded-xl border-2 border-gray-100 hover:border-cyan-500/30 hover:bg-gradient-to-br hover:from-cyan-500/5 hover:to-white hover:shadow-lg transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg">
                          <Package className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          Manage Products
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-cyan-600 transition-colors" />
                    </Link>

                    <Link
                      href="/super-admin/services"
                      className="flex items-center justify-between h-14 px-4 rounded-xl border-2 border-gray-100 hover:border-pink-500/30 hover:bg-gradient-to-br hover:from-pink-500/5 hover:to-white hover:shadow-lg transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg">
                          <Settings className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          Manage Services
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-pink-600 transition-colors" />
                    </Link>

                    <Link
                      href="/super-admin/bookings"
                      className="flex items-center justify-between h-14 px-4 rounded-xl border-2 border-gray-100 hover:border-amber-500/30 hover:bg-gradient-to-br hover:from-amber-500/5 hover:to-white hover:shadow-lg transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg">
                          <Calendar className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">
                          Manage Bookings
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-amber-600 transition-colors" />
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}