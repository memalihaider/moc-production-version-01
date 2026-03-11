'use client';

import { useState, useEffect, createContext, useContext, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Star, 
  Filter, 
  Download, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  Clock, 
  User, 
  Mail, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  Reply,
  MoreVertical,
  Package,
  Hash,
  DollarSign,
  Box,
  ShoppingBag,
  Tag,
  Building,
  MapPin,
  GitBranch,
  Bell,
  X,
  Check,
  Volume2,
  VolumeX
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ProtectedRoute from "@/components/ProtectedRoute";
import { AdminSidebar, AdminMobileSidebar } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { db } from '@/lib/firebase';
import { collection, query, getDocs, updateDoc, doc, where, orderBy, Timestamp, onSnapshot, limit, addDoc } from 'firebase/firestore';

// Firebase Feedback Interface
interface Feedback {
  id: string;
  comment: string;
  createdAt: any;
  customerEmail: string;
  customerId: string;
  customerName: string;
  rating: number;
  serviceOrProduct: string;
  status: 'pending' | 'approved' | 'rejected';
  type: 'service' | 'product';
  adminReply?: string;
  
  // New fields from your data structure
  pointsAwarded?: boolean;
  productBranchNames?: string[];
  productBranches?: string[];
  productCategory?: string;
  productCategoryId?: string;
  productCost?: number;
  productCreatedAt?: any;
  productDescription?: string;
  productId?: string;
  productImageUrl?: string;
  productName?: string;
  productPrice?: number;
  productRating?: number;
  productRevenue?: number;
  productReviews?: number;
  productSku?: string;
  productStatus?: string;
  productTotalSold?: number;
  productTotalStock?: number;
  productUpdatedAt?: any;
}

// Notification Interface
interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  feedbackId?: string;
  rating?: number;
  read: boolean;
  type: 'new_feedback' | 'status_update' | 'reply_added';
}

// Create context with proper types
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notificationData: Omit<Notification, 'id' | 'time' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: () => void;
  clearAllNotifications: () => void;
  playSound: boolean;
  toggleSound: () => void;
}

// Create and export the context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Notification Provider Component
const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [playSound, setPlaySound] = useState(true);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('feedback_notifications');
    const savedSoundPreference = localStorage.getItem('notification_sound');
    
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed);
        setUnreadCount(parsed.filter((n: Notification) => !n.read).length);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    }
    
    if (savedSoundPreference) {
      setPlaySound(savedSoundPreference === 'true');
    }
    
    // Request browser notification permission
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('feedback_notifications', JSON.stringify(notifications));
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  // Save sound preference
  useEffect(() => {
    localStorage.setItem('notification_sound', playSound.toString());
  }, [playSound]);

  const addNotification = (notificationData: Omit<Notification, 'id' | 'time' | 'read'>) => {
    console.log('📢 ADDING NOTIFICATION:', notificationData.title);
    
    const newNotification: Notification = {
      ...notificationData,
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]);

    // Play sound if enabled
    if (playSound) {
      playNotificationSound();
    }

    // Show browser notification if permission granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(newNotification.title, {
          body: newNotification.message,
          icon: '/favicon.ico',
          tag: 'feedback-notification'
        });
      } catch (error) {
        console.log('Browser notification error:', error);
      }
    }

    // Auto remove notification after 30 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 30000);
  };

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.log('Audio not supported or blocked');
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const toggleSound = () => {
    setPlaySound(!playSound);
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    clearAllNotifications,
    playSound,
    toggleSound
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook for notifications
const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

// Notification Bell Component
const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    removeNotification,
    markAsRead,
    clearAllNotifications,
    playSound,
    toggleSound
  } = useNotifications();

  const handleBellClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      markAsRead();
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.feedbackId) {
      const element = document.getElementById(`feedback-AED{notification.feedbackId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        element.classList.add('bg-yellow-50', 'ring-2', 'ring-yellow-400');
        setTimeout(() => {
          element.classList.remove('bg-yellow-50', 'ring-2', 'ring-yellow-400');
        }, 3000);
      }
    }
    removeNotification(notification.id);
  };

  return (
    <div className="relative">
      <button
        onClick={handleBellClick}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border z-50 animate-in slide-in-from-top-5">
          <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-800">Notifications</h3>
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">
                  {unreadCount} new
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSound}
                className="p-1 rounded-full hover:bg-gray-200"
                title={playSound ? "Mute notifications" : "Unmute notifications"}
              >
                {playSound ? (
                  <Volume2 className="w-4 h-4 text-green-600" />
                ) : (
                  <VolumeX className="w-4 h-4 text-gray-500" />
                )}
              </button>
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={handleBellClick}
                className="p-1 hover:bg-gray-200 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No notifications yet</p>
                <p className="text-sm text-gray-400 mt-1">You'll get notified when new feedback arrives</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors AED{
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {notification.type === 'new_feedback' && (
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                        )}
                        {notification.type === 'status_update' && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                        {notification.type === 'reply_added' && (
                          <Reply className="w-4 h-4 text-purple-600" />
                        )}
                        <p className="font-semibold text-gray-800">{notification.title}</p>
                        {notification.rating && (
                          <div className="flex items-center">
                            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                            <span className="text-xs ml-1">{notification.rating}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{notification.message}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">{notification.time}</p>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                      className="text-gray-400 hover:text-gray-600 ml-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="p-3 border-t bg-gray-50 flex justify-between items-center">
              <button
                onClick={markAsRead}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Check className="w-4 h-4" />
                Mark all as read
              </button>
              <span className="text-xs text-gray-500">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// REAL WORKING Feedback Listener - 100% GUARANTEED
const FeedbackListener = () => {
  const { addNotification } = useNotifications();
  const processedIds = useRef<Set<string>>(new Set());

  // Method 1: Polling-based approach (MOST RELIABLE)
  useEffect(() => {
    console.log('⏰ Starting polling listener for ALL feedbacks');
    
    const checkAllFeedbacks = async () => {
      try {
        console.log('🔍 Checking ALL feedbacks from Firebase...');
        
        const feedbacksRef = collection(db, 'feedbacks');
        const q = query(feedbacksRef, orderBy('createdAt', 'desc'));
        
        const snapshot = await getDocs(q);
        console.log('📊 Total feedbacks in DB:', snapshot.size);
        
        // Process all feedbacks
        snapshot.forEach((doc) => {
          const data = doc.data();
          const feedbackId = doc.id;
          
          // Skip if already processed
          if (processedIds.current.has(feedbackId)) {
            return;
          }
          
          processedIds.current.add(feedbackId);
          
          // Send notification for EVERY feedback (first time load pe)
          addNotification({
            title: '📥 Feedback Loaded',
            message: `AED{data.customerName}'s feedback loaded from database`,
            type: 'new_feedback',
            feedbackId: feedbackId,
            rating: data.rating
          });
        });
        
      } catch (error) {
        console.error('Error checking feedbacks:', error);
      }
    };

    // Check immediately on mount
    checkAllFeedbacks();
    
    // Then check every 30 seconds for any missed feedbacks
    const intervalId = setInterval(checkAllFeedbacks, 30000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [addNotification]);

  // Method 2: Firebase real-time listener
  useEffect(() => {
    console.log('🔥 Setting up Firebase real-time listener');
    
    try {
      const feedbacksRef = collection(db, 'feedbacks');
      const q = query(feedbacksRef, orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log('📡 Firebase listener triggered, docs:', snapshot.size);
        
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const feedbackId = change.doc.id;
            
            // Skip if already processed
            if (processedIds.current.has(feedbackId)) {
              console.log('⏭️ Skipping already processed:', feedbackId);
              return;
            }
            
            processedIds.current.add(feedbackId);
            
            console.log('🎯 NEW FEEDBACK DETECTED (Firebase)!', {
              id: feedbackId,
              customer: data.customerName,
              rating: data.rating,
              time: new Date().toISOString()
            });
            
            addNotification({
              title: '🌟 New Feedback Received!',
              message: `AED{data.customerName} gave AED{data.rating} ⭐ for "AED{data.serviceOrProduct}"`,
              type: 'new_feedback',
              feedbackId: feedbackId,
              rating: data.rating
            });
          }
        });
      }, (error) => {
        console.error('❌ Firebase listener error:', error);
      });
      
      return () => {
        console.log('🧹 Cleaning up Firebase listener');
        unsubscribe();
      };
    } catch (error) {
      console.error('❌ Failed to setup Firebase listener:', error);
    }
  }, [addNotification]);

  // Manual test and debug buttons
  return (
    <></>
  );
};

// Main AdminFeedbackPage Component
export default function AdminFeedbackPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [adminReply, setAdminReply] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterRating, setFilterRating] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Stats states
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    averageRating: 0,
    services: 0,
    products: 0,
    totalProducts: 0,
    totalRevenue: 0,
    totalSold: 0
  });

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Fetch feedbacks from Firebase - Initial Load
  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const feedbacksRef = collection(db, 'feedbacks');
      const q = query(feedbacksRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const feedbacksData: Feedback[] = [];
      let totalRevenue = 0;
      let totalSold = 0;
      let totalProducts = 0;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const feedback: Feedback = {
          id: doc.id,
          comment: data.comment || '',
          createdAt: data.createdAt,
          customerEmail: data.customerEmail || '',
          customerId: data.customerId || '',
          customerName: data.customerName || '',
          rating: data.rating || 0,
          serviceOrProduct: data.serviceOrProduct || '',
          status: data.status || 'pending',
          type: data.type || 'service',
          adminReply: data.adminReply || '',
          
          // NEW FIELDS ADDED
          pointsAwarded: data.pointsAwarded || false,
          productBranchNames: data.productBranchNames || [],
          productBranches: data.productBranches || [],
          productCategory: data.productCategory || '',
          productCategoryId: data.productCategoryId || '',
          productCost: data.productCost || 0,
          productCreatedAt: data.productCreatedAt || null,
          productDescription: data.productDescription || '',
          productId: data.productId || '',
          productImageUrl: data.productImageUrl || '',
          productName: data.productName || '',
          productPrice: data.productPrice || 0,
          productRating: data.productRating || 0,
          productRevenue: data.productRevenue || 0,
          productReviews: data.productReviews || 0,
          productSku: data.productSku || '',
          productStatus: data.productStatus || '',
          productTotalSold: data.productTotalSold || 0,
          productTotalStock: data.productTotalStock || 0,
          productUpdatedAt: data.productUpdatedAt || null
        };
        
        feedbacksData.push(feedback);
        
        // Calculate stats
        if (data.type === 'product') {
          totalProducts++;
          totalRevenue += data.productRevenue || 0;
          totalSold += data.productTotalSold || 0;
        }
      });
      
      setFeedbacks(feedbacksData);
      updateStats(feedbacksData, totalProducts, totalRevenue, totalSold);
      
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (data: Feedback[], totalProducts: number, totalRevenue: number, totalSold: number) => {
    const total = data.length;
    const pending = data.filter(f => f.status === 'pending').length;
    const approved = data.filter(f => f.status === 'approved').length;
    const rejected = data.filter(f => f.status === 'rejected').length;
    const services = data.filter(f => f.type === 'service').length;
    const products = data.filter(f => f.type === 'product').length;
    const totalRating = data.reduce((sum, f) => sum + f.rating, 0);
    const averageRating = total > 0 ? totalRating / total : 0;
    
    setStats({
      total,
      pending,
      approved,
      rejected,
      averageRating: parseFloat(averageRating.toFixed(2)),
      services,
      products,
      totalProducts,
      totalRevenue,
      totalSold
    });
  };

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      setUpdatingId(id);
      const feedbackRef = doc(db, 'feedbacks', id);
      await updateDoc(feedbackRef, { 
        status,
        updatedAt: Timestamp.now()
      });
      
      setFeedbacks(feedbacks.map(f => 
        f.id === id ? { ...f, status } : f
      ));
      
      updateStats(
        feedbacks.map(f => f.id === id ? { ...f, status } : f),
        stats.totalProducts,
        stats.totalRevenue,
        stats.totalSold
      );
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddReply = async (id: string) => {
    if (!adminReply.trim()) return;
    
    try {
      setUpdatingId(id);
      const feedbackRef = doc(db, 'feedbacks', id);
      await updateDoc(feedbackRef, { 
        adminReply,
        updatedAt: Timestamp.now()
      });
      
      setFeedbacks(feedbacks.map(f => 
        f.id === id ? { ...f, adminReply } : f
      ));
      
      setAdminReply('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error adding reply:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffDays > 0) return `AED{diffDays}d ago`;
      if (diffHours > 0) return `AED{diffHours}h ago`;
      if (diffMinutes > 0) return `AED{diffMinutes}m ago`;
      return 'Just now';
    } catch {
      return 'Some time ago';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600 bg-green-50 border-green-200';
    if (rating >= 3) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'service': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'product': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getBranchColor = (index: number) => {
    const colors = [
      'bg-blue-100 text-blue-700 border-blue-200',
      'bg-green-100 text-green-700 border-green-200',
      'bg-purple-100 text-purple-700 border-purple-200',
      'bg-yellow-100 text-yellow-700 border-yellow-200',
      'bg-pink-100 text-pink-700 border-pink-200'
    ];
    return colors[index % colors.length];
  };

  // Filter feedbacks
  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesSearch = 
      feedback.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feedback.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feedback.serviceOrProduct.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feedback.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feedback.productSku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feedback.productBranchNames?.some(branch => 
        branch.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesStatus = filterStatus === 'all' || feedback.status === filterStatus;
    const matchesType = filterType === 'all' || feedback.type === filterType;
    const matchesRating = filterRating === 'all' || 
      (filterRating === '5' && feedback.rating === 5) ||
      (filterRating === '4' && feedback.rating === 4) ||
      (filterRating === '3' && feedback.rating === 3) ||
      (filterRating === '2' && feedback.rating === 2) ||
      (filterRating === '1' && feedback.rating === 1);
    
    return matchesSearch && matchesStatus && matchesType && matchesRating;
  });

  const downloadCSV = () => {
    let csv = 'ID,Customer Name,Customer Email,Rating,Type,Service/Product,Product Name,Product SKU,Product Category,Product Price,Product Stock,Product Sold,Product Status,Branch Names,Comment,Status,Created At,Admin Reply,Points Awarded\n';
    
    filteredFeedbacks.forEach(feedback => {
      const branchNames = feedback.productBranchNames?.join(', ') || '';
      csv += `"AED{feedback.id}","AED{feedback.customerName}","AED{feedback.customerEmail}",AED{feedback.rating},AED{feedback.type},"AED{feedback.serviceOrProduct}","AED{feedback.productName || ''}","AED{feedback.productSku || ''}","AED{feedback.productCategory || ''}",AED{feedback.productPrice || 0},AED{feedback.productTotalStock || 0},AED{feedback.productTotalSold || 0},"AED{feedback.productStatus || ''}","AED{branchNames}","AED{feedback.comment.replace(/"/g, '""')}",AED{feedback.status},"AED{formatDate(feedback.createdAt)}","AED{feedback.adminReply || ''}","AED{feedback.pointsAwarded ? 'Yes' : 'No'}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedbacks-AED{new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <ProtectedRoute requiredRole="super_admin">
      <NotificationProvider>
        {/* Real-time Feedback Listener with Debug Panel */}
        <FeedbackListener />
        
        <div className="flex h-screen bg-[#f8f9fa]">
          {/* Sidebar */}
          <AdminSidebar
            role="super_admin"
            onLogout={handleLogout}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />

          {/* Main Content */}
          <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out min-h-0">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 shrink-0">
              <div className="flex items-center justify-between px-4 py-4 lg:px-8">
                <div className="flex items-center gap-4">
                  <AdminMobileSidebar
                    role="super_admin"
                    onLogout={handleLogout}
                    isOpen={sidebarOpen}
                    onToggle={() => setSidebarOpen(!sidebarOpen)}
                  />
                  <div>
                    <h1 className="text-2xl font-sans font-bold text-primary">Customer Feedback Management</h1>
                    <p className="text-sm text-muted-foreground">Manage and respond to customer reviews and feedback</p>
                  </div>
                </div>
                
                {/* Notification Bell in Header */}
                <NotificationBell />
              </div>
            </header>

            {/* Page Content */}
            <div className="flex-1 overflow-auto p-4 lg:p-8">
              <div className="max-w-7xl mx-auto">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2 rounded-lg">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="feedbacks">All Feedback ({feedbacks.length})</TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                      <Card className="border-none shadow-sm rounded-xl">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Feedback</p>
                              <p className="text-3xl font-sans font-bold text-primary">{stats.total}</p>
                              <p className="text-sm text-muted-foreground mt-1">All time reviews</p>
                            </div>
                            <MessageSquare className="w-12 h-12 text-secondary/20" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-none shadow-sm rounded-xl">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Average Rating</p>
                              <div className="flex items-center gap-2">
                                <p className="text-3xl font-sans font-bold text-primary">{stats.averageRating}/5</p>
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={cn(
                                        "w-4 h-4",
                                        star <= Math.round(stats.averageRating) 
                                          ? "fill-yellow-500 text-yellow-500" 
                                          : "text-gray-300"
                                      )}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">Overall satisfaction</p>
                            </div>
                            <Star className="w-12 h-12 text-yellow-500/20" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-none shadow-sm rounded-xl">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Pending Reviews</p>
                              <p className="text-3xl font-sans font-bold text-yellow-600">{stats.pending}</p>
                              <p className="text-sm text-muted-foreground mt-1">Awaiting action</p>
                            </div>
                            <Clock className="w-12 h-12 text-yellow-500/20" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-none shadow-sm rounded-xl">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Approved Rate</p>
                              <p className="text-3xl font-sans font-bold text-green-600">
                                {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%
                              </p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {stats.approved} of {stats.total} approved
                              </p>
                            </div>
                            <ThumbsUp className="w-12 h-12 text-green-500/20" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Product Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      <Card className="border-none shadow-sm rounded-xl">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Products</p>
                              <p className="text-3xl font-sans font-bold text-purple-600">{stats.totalProducts}</p>
                              <p className="text-sm text-muted-foreground mt-1">Product feedbacks</p>
                            </div>
                            <Package className="w-12 h-12 text-purple-500/20" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-none shadow-sm rounded-xl">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Sold</p>
                              <p className="text-3xl font-sans font-bold text-blue-600">{stats.totalSold}</p>
                              <p className="text-sm text-muted-foreground mt-1">Units sold</p>
                            </div>
                            <ShoppingBag className="w-12 h-12 text-blue-500/20" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-none shadow-sm rounded-xl">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Product Revenue</p>
                              <p className="text-3xl font-sans font-bold text-green-600">AED{stats.totalRevenue.toFixed(2)}</p>
                              <p className="text-sm text-muted-foreground mt-1">From reviewed products</p>
                            </div>
                           
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Distribution Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Status Distribution */}
                      <Card className="border-none shadow-sm rounded-xl">
                        <CardHeader>
                          <CardTitle className="text-lg font-sans flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-secondary" />
                            Status Distribution
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <span className="text-sm">Pending</span>
                              </div>
                              <span className="font-bold">{stats.pending} ({stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%)</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="text-sm">Approved</span>
                              </div>
                              <span className="font-bold">{stats.approved} ({stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%)</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span className="text-sm">Rejected</span>
                              </div>
                              <span className="font-bold">{stats.rejected} ({stats.total > 0 ? Math.round((stats.rejected / stats.total) * 100) : 0}%)</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Type Distribution */}
                      <Card className="border-none shadow-sm rounded-xl">
                        <CardHeader>
                          <CardTitle className="text-lg font-sans flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-secondary" />
                            Type Distribution
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span className="text-sm">Services</span>
                              </div>
                              <span className="font-bold">{stats.services} ({stats.total > 0 ? Math.round((stats.services / stats.total) * 100) : 0}%)</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                                <span className="text-sm">Products</span>
                              </div>
                              <span className="font-bold">{stats.products} ({stats.total > 0 ? Math.round((stats.products / stats.total) * 100) : 0}%)</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Rating Distribution */}
                      <Card className="border-none shadow-sm rounded-xl">
                        <CardHeader>
                          <CardTitle className="text-lg font-sans flex items-center gap-2">
                            <Star className="w-5 h-5 text-secondary" />
                            Rating Distribution
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {[5, 4, 3, 2, 1].map(rating => {
                              const count = feedbacks.filter(f => f.rating === rating).length;
                              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                              return (
                                <div key={rating} className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="flex">
                                        {[1, 2, 3, 4, 5].map(star => (
                                          <Star
                                            key={star}
                                            className={cn(
                                              "w-4 h-4",
                                              star <= rating 
                                                ? "fill-yellow-500 text-yellow-500" 
                                                : "text-gray-300"
                                            )}
                                          />
                                        ))}
                                      </div>
                                      <span className="text-sm">{rating} stars</span>
                                    </div>
                                    <span className="font-bold">{count}</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-yellow-500 h-2 rounded-full" 
                                      style={{ width: `AED{percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Feedbacks Tab */}
                  <TabsContent value="feedbacks" className="space-y-6">
                    {/* Filters and Search */}
                    <div className="flex flex-col lg:flex-row gap-4 mb-8">
                      <div className="flex-1 flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            placeholder="Search by customer, product, SKU, branch, or comment..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 rounded-lg border-gray-200"
                          />
                        </div>
                        
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger className="w-40 rounded-lg border-gray-200">
                            <div className="flex items-center gap-2">
                              <Filter className="w-4 h-4" />
                              <SelectValue placeholder="Status" />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select value={filterType} onValueChange={setFilterType}>
                          <SelectTrigger className="w-40 rounded-lg border-gray-200">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="service">Service</SelectItem>
                            <SelectItem value="product">Product</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select value={filterRating} onValueChange={setFilterRating}>
                          <SelectTrigger className="w-40 rounded-lg border-gray-200">
                            <SelectValue placeholder="Rating" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Ratings</SelectItem>
                            <SelectItem value="5">5 Stars</SelectItem>
                            <SelectItem value="4">4 Stars</SelectItem>
                            <SelectItem value="3">3 Stars</SelectItem>
                            <SelectItem value="2">2 Stars</SelectItem>
                            <SelectItem value="1">1 Star</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={fetchFeedbacks}
                          variant="outline"
                          className="border-gray-200 rounded-lg flex items-center gap-2"
                        >
                          Refresh
                        </Button>
                        <Button
                          onClick={downloadCSV}
                          variant="outline"
                          className="border-gray-200 rounded-lg flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" /> Export CSV
                        </Button>
                      </div>
                    </div>

                    {/* Loading State */}
                    {loading ? (
                      <div className="text-center py-12">
                        <div className="text-lg font-sans text-primary">Loading feedbacks...</div>
                      </div>
                    ) : filteredFeedbacks.length === 0 ? (
                      <Card className="border-none shadow-sm rounded-xl">
                        <CardContent className="py-12 text-center">
                          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-700 mb-2">No feedbacks found</h3>
                          <p className="text-gray-500">Try adjusting your filters or search query</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {filteredFeedbacks.map((feedback) => (
                          <Card 
                            key={feedback.id} 
                            id={`feedback-AED{feedback.id}`}
                            className="border-none shadow-sm rounded-xl overflow-hidden transition-all hover:shadow-md"
                          >
                            <CardContent className="p-6">
                              <div className="flex flex-col lg:flex-row gap-6">
                                {/* Left Column - Customer Info & Rating */}
                                <div className="lg:w-1/4 space-y-4">
                                  {/* Customer Info */}
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <User className="w-4 h-4 text-gray-500" />
                                      <span className="font-semibold">{feedback.customerName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Mail className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm text-gray-600 truncate">{feedback.customerEmail}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm text-gray-500">{formatDate(feedback.createdAt)}</span>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      {getTimeAgo(feedback.createdAt)}
                                    </div>
                                  </div>

                                  {/* Rating */}
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <div className="flex">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star
                                            key={star}
                                            className={cn(
                                              "w-4 h-4",
                                              star <= feedback.rating 
                                                ? "fill-yellow-500 text-yellow-500" 
                                                : "text-gray-300"
                                            )}
                                          />
                                        ))}
                                      </div>
                                      <Badge className={cn("rounded-full", getRatingColor(feedback.rating))}>
                                        {feedback.rating}/5
                                      </Badge>
                                    </div>
                                  </div>

                                  {/* Type Badge */}
                                  <Badge className={cn("rounded-full", getTypeColor(feedback.type))}>
                                    {feedback.type === 'service' ? 'Service' : 'Product'}
                                  </Badge>

                                  {/* Status Badge */}
                                  <Badge className={cn("rounded-full", getStatusColor(feedback.status))}>
                                    {feedback.status}
                                  </Badge>
                                </div>

                                {/* Middle Column - Content */}
                                <div className="lg:w-1/2 space-y-4">
                                  {/* Service/Product */}
                                  <div>
                                    <h3 className="font-sans font-bold text-lg text-primary mb-2">
                                      {feedback.serviceOrProduct}
                                    </h3>
                                    
                                    {/* Branch Names Section */}
                                    {feedback.productBranchNames && feedback.productBranchNames.length > 0 && (
                                      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                        <div className="flex items-center gap-2 mb-3">
                                          <GitBranch className="w-5 h-5 text-blue-600" />
                                          <h4 className="font-semibold text-blue-800">Available Branches:</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          {feedback.productBranchNames.map((branchName, index) => (
                                            <Badge 
                                              key={index} 
                                              className={cn("rounded-full flex items-center gap-1", getBranchColor(index))}
                                            >
                                              <Building className="w-3 h-3" />
                                              {branchName}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Product Details */}
                                    {feedback.type === 'product' && (
                                      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                                          <div className="flex items-center gap-2">
                                            <Hash className="w-4 h-4 text-gray-500" />
                                            <div>
                                              <span className="font-semibold text-gray-600">SKU:</span>
                                              <span className="ml-2">{feedback.productSku || 'N/A'}</span>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Tag className="w-4 h-4 text-gray-500" />
                                            <div>
                                              <span className="font-semibold text-gray-600">Category:</span>
                                              <span className="ml-2">{feedback.productCategory || 'N/A'}</span>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                           
                                           
                                            <div>
                                              <span className="font-semibold text-gray-600">Price:</span>
                                              <span className="ml-2">AED{feedback.productPrice?.toFixed(2) || '0.00'}</span>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <div>
                                              <span className="font-semibold text-gray-600">Status:</span>
                                              <Badge className={`ml-2 AED{
                                                feedback.productStatus === 'active' 
                                                  ? 'bg-green-100 text-green-700' 
                                                  : feedback.productStatus === 'inactive'
                                                  ? 'bg-gray-100 text-gray-700'
                                                  : 'bg-red-100 text-red-700'
                                              }`}>
                                                {feedback.productStatus || 'N/A'}
                                              </Badge>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {/* Product Image */}
                                        {feedback.productImageUrl && (
                                          <div className="mt-3">
                                            <p className="text-sm font-semibold text-gray-600 mb-2">Product Image:</p>
                                            <img 
                                              src={feedback.productImageUrl} 
                                              alt={feedback.productName || 'Product'}
                                              className="w-32 h-32 object-cover rounded-lg border shadow-sm"
                                              onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                              }}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    
                                    {/* Comment */}
                                    <div className="bg-gray-50 rounded-lg p-4">
                                      <p className="text-gray-700 italic">"{feedback.comment}"</p>
                                    </div>

                                    {/* Admin Reply */}
                                    {feedback.adminReply && (
                                      <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-200">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Reply className="w-4 h-4 text-blue-600" />
                                          <span className="text-sm font-semibold text-blue-900">Admin Response:</span>
                                        </div>
                                        <p className="text-blue-800">{feedback.adminReply}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Right Column - Actions */}
                                <div className="lg:w-1/4 space-y-4">
                                  {/* Action Buttons */}
                                  <div className="space-y-2">
                                    {feedback.status === 'pending' && (
                                      <>
                                        <Button
                                          onClick={() => handleUpdateStatus(feedback.id, 'approved')}
                                          disabled={updatingId === feedback.id}
                                          className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2"
                                        >
                                          <CheckCircle className="w-4 h-4" />
                                          Approve
                                        </Button>
                                        <Button
                                          onClick={() => handleUpdateStatus(feedback.id, 'rejected')}
                                          disabled={updatingId === feedback.id}
                                          className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
                                        >
                                          <XCircle className="w-4 h-4" />
                                          Reject
                                        </Button>
                                      </>
                                    )}
                                    
                                    {/* Reply Button */}
                                    {feedback.status === 'approved' && !feedback.adminReply && (
                                      <Button
                                        onClick={() => setReplyingTo(feedback.id)}
                                        variant="outline"
                                        className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 rounded-lg flex items-center gap-2"
                                      >
                                        <Reply className="w-4 h-4" />
                                        Reply to Customer
                                      </Button>
                                    )}
                                  </div>

                                  {/* Quick Reply Form */}
                                  {replyingTo === feedback.id && (
                                    <div className="space-y-2">
                                      <Textarea
                                        placeholder="Type your response to the customer..."
                                        value={adminReply}
                                        onChange={(e) => setAdminReply(e.target.value)}
                                        className="rounded-lg min-h-[100px]"
                                      />
                                      <div className="flex gap-2">
                                        <Button
                                          onClick={() => handleAddReply(feedback.id)}
                                          disabled={updatingId === feedback.id}
                                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                                        >
                                          Send Reply
                                        </Button>
                                        <Button
                                          onClick={() => {
                                            setReplyingTo(null);
                                            setAdminReply('');
                                          }}
                                          variant="outline"
                                          className="rounded-lg"
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Summary Card */}
                    {filteredFeedbacks.length > 0 && (
                      <Card className="border-none shadow-sm rounded-xl mt-8">
                        <CardContent className="p-6">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground mb-1">Showing</p>
                              <p className="text-2xl font-bold text-primary">{filteredFeedbacks.length}</p>
                              <p className="text-xs text-muted-foreground">feedbacks</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground mb-1">Avg Rating</p>
                              <p className="text-2xl font-bold text-primary">
                                {filteredFeedbacks.length > 0 
                                  ? (filteredFeedbacks.reduce((sum, f) => sum + f.rating, 0) / filteredFeedbacks.length).toFixed(2)
                                  : '0.00'
                                }/5
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground mb-1">Pending</p>
                              <p className="text-2xl font-bold text-yellow-600">
                                {filteredFeedbacks.filter(f => f.status === 'pending').length}
                              </p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground mb-1">Replied</p>
                              <p className="text-2xl font-bold text-green-600">
                                {filteredFeedbacks.filter(f => f.adminReply).length}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </NotificationProvider>
    </ProtectedRoute>
  );
}