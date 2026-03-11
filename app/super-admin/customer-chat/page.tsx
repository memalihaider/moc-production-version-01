'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle,
  Send,
  Phone,
  Mail,
  User,
  MapPin,
  Clock,
  Check,
  CheckCheck,
  Search,
  Users,
  Sparkles,
  Image as ImageIcon,
  X,
  MoreVertical,
  Trash2,
  Edit,
  EyeOff,
  CheckCircle,
  Reply,
  Copy,
  ReplyAll,
  ChevronRight,
  Menu,
  Building
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { format, isToday, isYesterday } from "date-fns";
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc,
  getDoc,
  onSnapshot,
  addDoc,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminSidebar, AdminMobileSidebar } from "@/components/admin/AdminSidebar";
import ProtectedRoute from '@/components/ProtectedRoute';

interface CustomerMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderRole: 'customer' | 'branch_admin';
  senderPhone?: string;
  recipientBranchId: string;
  recipientBranchName: string;
  recipientRole: 'branch_admin' | 'customer';
  recipientCustomerId?: string;
  recipientCustomerName?: string;
  recipientCustomerEmail?: string;
  timestamp: any;
  read: boolean;
  readBy?: string[];
  status: 'sent' | 'delivered' | 'seen';
  collection: 'customerMessages' | 'customerReplies';
  imageBase64?: string;
  imageName?: string;
  deletedFor?: string[];
  deletedForEveryone?: boolean;
  edited?: boolean;
  editedAt?: any;
  replyToId?: string;
  replyToContent?: string;
  replyToSender?: string;
  replyToImage?: string;
}

interface CustomerChat {
  customerId: string;
  customerName: string;
  customerEmail: string;
  lastMessage?: CustomerMessage;
  unreadCount: number;
  lastMessageTime?: any;
}

export default function BranchCustomerChatsPage() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatsSidebarOpen, setChatsSidebarOpen] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  
  // ✅ Branch selection state
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchDetails, setSelectedBranchDetails] = useState<any>(null);
  const [branchSearchQuery, setBranchSearchQuery] = useState('');
  
  const [messages, setMessages] = useState<CustomerMessage[]>([]);
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState<any>(null);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  
  const [chats, setChats] = useState<CustomerChat[]>([]);
  
  const [replyingTo, setReplyingTo] = useState<CustomerMessage | null>(null);
  
  const [editingMessage, setEditingMessage] = useState<CustomerMessage | null>(null);
  const [editContent, setEditContent] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const customerDetailsRef = useRef<any>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);

  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Use user.id from AuthContext
  const currentUserId = user?.id || '';
  const currentUserEmail = user?.email || '';
  const currentUserName = user?.name || user?.email?.split('@')[0] || 'Admin';

  // Debug auth
  useEffect(() => {
    console.log('🔐 Auth State:', { user, id: user?.id, role: user?.role });
    if (user) {
      setIsLoading(false);
    }
  }, [user]);

  // ✅ Fetch ALL branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        console.log('🔍 Fetching all branches...');
        const branchesRef = collection(db, 'branches');
        const q = query(branchesRef);
        const snapshot = await getDocs(q);
        
        let branchesData = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as { id: string; name: string; [key: string]: any }[];
        
        branchesData = branchesData.sort((a, b) => 
          (a.name || '').localeCompare(b.name || '')
        );
        
        console.log(`✅ Found ${branchesData.length} branches`);
        setBranches(branchesData);
        
        // Auto-select first branch
        if (branchesData.length > 0 && !selectedBranchId) {
          setSelectedBranchId(branchesData[0].id);
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    };
    
    if (user) {
      fetchBranches();
    }
  }, [user]);

  // ✅ Update selected branch details when branch changes
  useEffect(() => {
    if (selectedBranchId) {
      const branch = branches.find(b => b.id === selectedBranchId);
      if (branch) {
        setSelectedBranchDetails(branch);
        console.log(`📌 Selected branch: ${branch.name}`);
        
        // Clear selected customer when branch changes
        setSelectedCustomerId('');
        setSelectedCustomerDetails(null);
        setMessages([]);
      }
    } else {
      setSelectedBranchDetails(null);
    }
  }, [selectedBranchId, branches]);

  // ✅ Fetch customers for SELECTED branch only
  useEffect(() => {
    if (!selectedBranchId) return;
    
    const fetchCustomersForBranch = async () => {
      try {
        console.log(`🔍 Fetching customers for branch: ${selectedBranchId} - ${selectedBranchDetails?.name}`);
        
        // Get messages only for this branch
        const messagesQuery = query(
          collection(db, 'customerMessages'),
          where('recipientBranchId', '==', selectedBranchId)
        );
        
        const snapshot = await getDocs(messagesQuery);
        
        const customerMap = new Map<string, CustomerChat>();
        
        snapshot.forEach(doc => {
          const data = doc.data();
          const msg = {
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date(),
            collection: 'customerMessages'
          } as CustomerMessage;
          
          const customerId = msg.senderId;
          
          if (!customerMap.has(customerId)) {
            customerMap.set(customerId, {
              customerId,
              customerName: msg.senderName,
              customerEmail: msg.senderEmail,
              lastMessage: msg,
              unreadCount: 0,
              lastMessageTime: msg.timestamp
            });
          } else {
            const chat = customerMap.get(customerId)!;
            if (msg.timestamp > chat.lastMessageTime) {
              chat.lastMessage = msg;
              chat.lastMessageTime = msg.timestamp;
            }
          }
          
          if (!data.read && data.senderRole === 'customer') {
            const chat = customerMap.get(customerId);
            if (chat) {
              chat.unreadCount++;
            }
          }
        });
        
        const chatsData = Array.from(customerMap.values());
        
        chatsData.sort((a, b) => {
          const timeA = a.lastMessageTime?.toDate?.() || new Date(a.lastMessageTime);
          const timeB = b.lastMessageTime?.toDate?.() || new Date(b.lastMessageTime);
          return timeB.getTime() - timeA.getTime();
        });
        
        console.log(`✅ Found ${chatsData.length} customers for branch ${selectedBranchDetails?.name}`);
        setChats(chatsData);
      } catch (error) {
        console.error('Error fetching customers for branch:', error);
      }
    };
    
    fetchCustomersForBranch();
  }, [selectedBranchId, selectedBranchDetails?.name]);

  // Update customer details when selected
  useEffect(() => {
    if (selectedCustomerId) {
      const customer = chats.find(c => c.customerId === selectedCustomerId);
      if (customer) {
        customerDetailsRef.current = customer;
        setSelectedCustomerDetails(customer);
        
        markMessagesAsRead(selectedCustomerId);
      }
    } else {
      customerDetailsRef.current = null;
      setSelectedCustomerDetails(null);
    }
  }, [selectedCustomerId, chats]);

  // Scroll to top when customer changes
  useEffect(() => {
    if (selectedCustomerId && messagesScrollRef.current) {
      messagesScrollRef.current.scrollTop = 0;
    }
  }, [selectedCustomerId]);

  // Auto-scroll only if at bottom
  useEffect(() => {
    if (messagesScrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesScrollRef.current;
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 50;
      if (isAtBottom) {
        messagesScrollRef.current.scrollTo({
          top: scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [messages]);

  // Mark messages as read
  const markMessagesAsRead = async (customerId: string) => {
    if (!selectedBranchId) return;
    
    try {
      const messagesQuery = query(
        collection(db, 'customerMessages'),
        where('recipientBranchId', '==', selectedBranchId),
        where('senderId', '==', customerId),
        where('read', '==', false)
      );
      
      const snapshot = await getDocs(messagesQuery);
      
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          read: true,
          status: 'seen',
          readBy: [currentUserId]
        });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Mark message as delivered
  const markMessageAsDelivered = async (messageId: string) => {
    try {
      const messageRef = doc(db, 'customerReplies', messageId);
      await updateDoc(messageRef, {
        status: 'delivered',
        deliveredTo: [currentUserId]
      });
    } catch (error) {
      console.error('Error marking message as delivered:', error);
    }
  };

  // Mark message as seen
  const markMessageAsSeen = async (messageId: string) => {
    try {
      const messageRef = doc(db, 'customerReplies', messageId);
      await updateDoc(messageRef, {
        read: true,
        status: 'seen',
        readBy: [currentUserId]
      });
    } catch (error) {
      console.error('Error marking message as seen:', error);
    }
  };

  // Image selection handler
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert('Image size should be less than 1MB');
        return;
      }
      
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearReply = () => {
    setReplyingTo(null);
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Send message to customer (customerReplies collection)
  const handleSendMessage = async () => {
    console.log('📤 Send button clicked');
    console.log('📤 User:', user);
    console.log('📤 User ID:', user?.id);
    console.log('📤 Selected Customer:', selectedCustomerId);
    console.log('📤 Selected Branch:', selectedBranchId);
    console.log('📤 Message:', newMessage);

    // Validation
    if (!user) {
      alert('You must be logged in to send messages');
      return;
    }

    if (!user.id) {
      alert('User ID not found. Please try logging in again.');
      console.error('User object missing id:', user);
      return;
    }

    if (!selectedCustomerId) {
      alert('Please select a customer first');
      return;
    }

    if (!selectedBranchId || !selectedBranchDetails) {
      alert('Please select a branch first');
      return;
    }

    if (!newMessage.trim() && !selectedImage) {
      alert('Please enter a message or select an image');
      return;
    }

    const selectedCustomer = chats.find(c => c.customerId === selectedCustomerId);
    if (!selectedCustomer) {
      alert('Selected customer not found');
      return;
    }

    setIsSending(true);
    const messageContent = newMessage;
    setNewMessage('');

    try {
      let imageBase64 = null;
      let imageName = null;

      if (selectedImage) {
        imageBase64 = await convertImageToBase64(selectedImage);
        imageName = selectedImage.name;
        clearSelectedImage();
      }

      // Message data for branch admin to customer
      const messageData: any = {
        content: messageContent,
        senderId: user.id,
        senderName: user?.name || selectedBranchDetails.name || 'Admin',
        senderEmail: user?.email || '',
        senderRole: 'branch_admin',
        recipientBranchId: selectedBranchId,
        recipientBranchName: selectedBranchDetails.name,
        recipientRole: 'customer',
        recipientCustomerId: selectedCustomerId,
        recipientCustomerName: selectedCustomer.customerName,
        recipientCustomerEmail: selectedCustomer.customerEmail,
        timestamp: serverTimestamp(),
        read: false,
        status: 'sent',
        readBy: [],
        deliveredTo: [],
        deletedFor: [],
        deletedForEveryone: false,
        edited: false,
        createdAt: new Date().toISOString()
      };

      if (imageBase64) {
        messageData.imageBase64 = imageBase64;
        messageData.imageName = imageName;
      }

      if (replyingTo) {
        messageData.replyToId = replyingTo.id;
        messageData.replyToContent = replyingTo.content || '';
        messageData.replyToSender = replyingTo.senderName || 'Someone';
        if (replyingTo.imageBase64) {
          messageData.replyToImage = replyingTo.imageBase64;
        }
      }

      console.log('📤 Sending message to customerReplies collection:', messageData);

      // Save in 'customerReplies' collection
      const docRef = await addDoc(collection(db, 'customerReplies'), messageData);
      
      console.log('✅ Message sent successfully! Document ID:', docRef.id);
      
      clearReply();
      
    } catch (error) {
      console.error('❌ Send error:', error);
      alert('Message send failed. Check console for details.');
      setNewMessage(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  // Copy message
  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      alert('Message copied to clipboard!');
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  // Delete for me
  const handleDeleteForMe = async (message: CustomerMessage) => {
    try {
      const messageRef = doc(db, message.collection, message.id);
      const deletedFor = message.deletedFor || [];
      
      if (!deletedFor.includes(currentUserId)) {
        deletedFor.push(currentUserId);
        await updateDoc(messageRef, { deletedFor });
      }
    } catch (error) {
      console.error('Delete for me error:', error);
    }
  };

  // Delete for everyone
  const handleDeleteForEveryone = async (message: CustomerMessage) => {
    if (!confirm('Are you sure you want to delete this message for everyone? This action cannot be undone.')) {
      return;
    }
    
    try {
      const messageRef = doc(db, message.collection, message.id);
      await deleteDoc(messageRef);
    } catch (error) {
      console.error('Delete for everyone error:', error);
    }
  };

  // Edit message
  const handleEditMessage = async () => {
    if (!editingMessage || !editContent.trim()) return;

    try {
      const messageRef = doc(db, editingMessage.collection, editingMessage.id);
      await updateDoc(messageRef, {
        content: editContent,
        edited: true,
        editedAt: serverTimestamp()
      });
      
      setEditingMessage(null);
      setEditContent('');
    } catch (error) {
      console.error('Edit message error:', error);
    }
  };

  const startEditing = (message: CustomerMessage) => {
    setEditingMessage(message);
    setEditContent(message.content || '');
    setTimeout(() => {
      editInputRef.current?.focus();
    }, 100);
  };

  const cancelEditing = () => {
    setEditingMessage(null);
    setEditContent('');
  };

  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      if (isToday(date)) return format(date, 'hh:mm a');
      if (isYesterday(date)) return `Yesterday ${format(date, 'hh:mm a')}`;
      return format(date, 'dd/MM/yy hh:mm a');
    } catch {
      return '';
    }
  };

  const formatChatTime = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      if (isToday(date)) return format(date, 'hh:mm a');
      if (isYesterday(date)) return 'Yesterday';
      return format(date, 'dd/MM/yy');
    } catch {
      return '';
    }
  };

  // Filter out messages deleted for current user
  const visibleMessages = messages.filter(msg => {
    const deletedFor = msg.deletedFor || [];
    return !deletedFor.includes(currentUserId) && !msg.deletedForEveryone;
  });

  // Group messages by date
  const groupedMessages = visibleMessages.reduce((groups: any, msg) => {
    try {
      const date = msg.timestamp?.toDate 
        ? format(msg.timestamp.toDate(), 'yyyy-MM-dd')
        : format(new Date(msg.timestamp), 'yyyy-MM-dd');
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    } catch {
      const date = format(new Date(), 'yyyy-MM-dd');
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    }
    return groups;
  }, {});

  const formatDateHeader = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isToday(date)) return 'Today';
      if (isYesterday(date)) return 'Yesterday';
      return format(date, 'MMMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  // Fetch messages for selected customer from BOTH collections
  useEffect(() => {
    if (!selectedCustomerId || !selectedBranchId) {
      setMessages([]);
      return;
    }

    // Query customerMessages (incoming from customer) - filtered by branch
    const customerMessagesQuery = query(
      collection(db, 'customerMessages'),
      where('recipientBranchId', '==', selectedBranchId),
      where('senderId', '==', selectedCustomerId)
    );

    // Query customerReplies (outgoing from branch admin) - filtered by branch
    const customerRepliesQuery = query(
      collection(db, 'customerReplies'),
      where('recipientBranchId', '==', selectedBranchId),
      where('recipientCustomerId', '==', selectedCustomerId)
    );

    const unsubscribeCustomerMessages = onSnapshot(customerMessagesQuery, (snapshot) => {
      const customerMsgs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
          collection: 'customerMessages'
        };
      }) as CustomerMessage[];

      // Merge with existing replies
      setMessages(prev => {
        const replies = prev.filter(m => m.collection === 'customerReplies');
        const allMsgs = [...customerMsgs, ...replies].sort((a, b) => a.timestamp - b.timestamp);
        return allMsgs;
      });
    });

    const unsubscribeCustomerReplies = onSnapshot(customerRepliesQuery, (snapshot) => {
      const replyMsgs = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Mark replies as delivered/seen
        if (data.senderRole === 'branch_admin' && data.status === 'sent') {
          setTimeout(() => {
            markMessageAsDelivered(doc.id);
          }, 500);
        }
        
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
          collection: 'customerReplies'
        };
      }) as CustomerMessage[];

      // Merge with customer messages
      setMessages(prev => {
        const customerMsgs = prev.filter(m => m.collection === 'customerMessages');
        const allMsgs = [...customerMsgs, ...replyMsgs].sort((a, b) => a.timestamp - b.timestamp);
        return allMsgs;
      });
    });

    return () => {
      unsubscribeCustomerMessages();
      unsubscribeCustomerReplies();
    };
  }, [selectedCustomerId, selectedBranchId]);

  // Filter branches based on search
  const filteredBranches = branches.filter(branch => 
    branch.name?.toLowerCase().includes(branchSearchQuery.toLowerCase()) ||
    branch.city?.toLowerCase().includes(branchSearchQuery.toLowerCase())
  );

  // Filter customers based on search
  const filteredChats = chats.filter(chat => 
    chat.customerName?.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
    chat.customerEmail?.toLowerCase().includes(chatSearchQuery.toLowerCase())
  );

  const displayCustomerDetails = selectedCustomerDetails || customerDetailsRef.current;

  const handleChatSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
    if (window.innerWidth < 768) {
      setChatsSidebarOpen(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FA9DB7] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔐</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Not Logged In</h2>
          <p className="text-gray-600 mb-6">Please log in to access customer support.</p>
          <Button 
            onClick={() => window.location.href = '/login'}
            className="bg-gradient-to-r from-[#FA9DB7] to-[#B84A68] text-white px-8 py-3 rounded-xl"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole='super_admin'>
      <div className="h-screen flex overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <AdminSidebar 
          role="super_admin" 
          onLogout={logout} 
          isOpen={sidebarOpen} 
          onToggle={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        {/* Chats Sidebar */}
        <div className={cn(
          "flex flex-col bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden",
          chatsSidebarOpen ? "w-80" : "w-0"
        )}>
          {chatsSidebarOpen && (
            <>
              <div className="shrink-0 bg-white border-b border-gray-200 px-4 py-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-sans font-bold text-gray-900">
                    {selectedBranchId ? `${selectedBranchDetails?.name || 'Branch'} Customers (${chats.length})` : 'Select Branch'}
                  </h2>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search customers..."
                    value={chatSearchQuery}
                    onChange={(e) => setChatSearchQuery(e.target.value)}
                    className="pl-9 h-10 rounded-xl bg-gray-100 border-0 focus:ring-2 focus:ring-[#FA9DB7]/30"
                    disabled={!selectedBranchId}
                  />
                </div>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-2">
                  {!selectedBranchId ? (
                    <div className="text-center py-8 px-4">
                      <Building className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">Select a branch first</p>
                    </div>
                  ) : filteredChats.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No customers for this branch yet</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Customers will appear here when they message
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredChats.map((chat) => (
                        <button
                          key={chat.customerId}
                          onClick={() => handleChatSelect(chat.customerId)}
                          className={cn(
                            "w-full flex items-start gap-3 p-3 rounded-xl transition-all",
                            selectedCustomerId === chat.customerId
                              ? "bg-[#FA9DB7]/10 border border-[#FA9DB7]/30"
                              : "hover:bg-gray-50"
                          )}
                        >
                          <Avatar className="w-12 h-12 rounded-xl border-2 border-white shadow-sm">
                            <AvatarFallback className={cn(
                              "text-white text-lg font-sans",
                              selectedCustomerId === chat.customerId
                                ? "bg-gradient-to-br from-[#FA9DB7] to-[#B84A68]"
                                : "bg-gradient-to-br from-gray-400 to-gray-600"
                            )}>
                              {chat.customerName?.charAt(0) || 'C'}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className={cn(
                                "font-medium truncate",
                                selectedCustomerId === chat.customerId ? "text-[#B84A68]" : "text-gray-900"
                              )}>
                                {chat.customerName}
                              </h3>
                              {chat.lastMessageTime && (
                                <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                  {formatChatTime(chat.lastMessageTime)}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-xs text-gray-500 truncate max-w-[140px]">
                                  {chat.customerEmail}
                                </p>
                                {chat.lastMessage ? (
                                  <p className="text-xs text-gray-400 truncate mt-0.5">
                                    {chat.lastMessage.senderRole === 'branch_admin' ? 'You: ' : ''}
                                    {chat.lastMessage.content || (chat.lastMessage.imageBase64 ? '📷 Image' : '')}
                                  </p>
                                ) : (
                                  <p className="text-xs text-gray-400 italic mt-0.5">
                                    No messages yet
                                  </p>
                                )}
                              </div>
                              
                              {chat.unreadCount > 0 && (
                                <Badge className="bg-[#FA9DB7] text-white border-0 rounded-full ml-2">
                                  {chat.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        {!chatsSidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-[72px] top-20 z-40 h-8 w-8 rounded-full bg-white shadow-md hover:bg-gray-100"
            onClick={() => setChatsSidebarOpen(true)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
        
        <div className="flex-1 flex flex-col overflow-hidden">
          
          <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/80 px-6 py-4 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 md:hidden">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-gray-100"
                    onClick={() => setChatsSidebarOpen(!chatsSidebarOpen)}
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                  <AdminMobileSidebar 
                    role="super_admin" 
                    onLogout={logout} 
                    isOpen={sidebarOpen} 
                    onToggle={() => setSidebarOpen(!sidebarOpen)} 
                  />
                </div>
                
                <div className="hidden md:flex items-center gap-4">
                  <AdminMobileSidebar 
                    role="super_admin" 
                    onLogout={logout} 
                    isOpen={sidebarOpen} 
                    onToggle={() => setSidebarOpen(!sidebarOpen)} 
                  />
                </div>
                
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FA9DB7] to-[#B84A68] flex items-center justify-center shadow-lg">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-sans font-bold text-gray-900">Customer Support</h1>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {selectedBranchDetails?.name || 'Select Branch'} - Customer Chats
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="px-4 py-2 border-[#FA9DB7]/30 text-[#B84A68] bg-white rounded-full">
                  <Users className="w-3.5 h-3.5 mr-2" />
                  {chats.length} Customers
                </Badge>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full hover:bg-red-50 hover:text-red-600"
                  onClick={logout}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-700">
                      {user?.email?.charAt(0)?.toUpperCase() || 'A'}
                    </span>
                  </div>
                </Button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-hidden p-6 pt-0">
            <Card className="h-full border-0 shadow-2xl bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden flex flex-col ">
              
              <div className="flex-1 flex flex-col min-h-0">
                
                <div className="bg-gradient-to-r from-white to-gray-50/80 px-6 py-5 border-b border-gray-200/80 shrink-0">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2 block">
                        SELECT BRANCH
                      </label>
                      
                      {/* Branch Dropdown */}
                      <Select 
                        value={selectedBranchId} 
                        onValueChange={setSelectedBranchId}
                      >
                        <SelectTrigger className="w-full md:w-[400px] h-14 border-2 border-gray-200/80 hover:border-[#FA9DB7]/50 focus:ring-2 focus:ring-[#FA9DB7]/30 rounded-2xl bg-white/80">
                          <SelectValue placeholder={
                            <div className="flex items-center gap-3 text-gray-500">
                              <Building className="w-5 h-5 text-[#FA9DB7]" />
                              <span>Choose a branch to view customers</span>
                            </div>
                          } />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-0 shadow-2xl p-2 bg-white/95">
                          <div className="px-3 py-2 border-b border-gray-100">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <Input
                                placeholder="Search branches..."
                                value={branchSearchQuery}
                                onChange={(e) => setBranchSearchQuery(e.target.value)}
                                className="pl-9 h-11 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-[#FA9DB7]/30"
                              />
                            </div>
                          </div>
                          <ScrollArea className="h-[280px]">
                            {filteredBranches.length > 0 ? (
                              filteredBranches.map(branch => (
                                <SelectItem 
                                  key={branch.id} 
                                  value={branch.id}
                                  className="rounded-xl py-3 px-3 cursor-pointer hover:bg-[#FA9DB7]/5"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 mt-1 rounded-xl bg-gradient-to-br from-[#FA9DB7]/20 to-[#B84A68]/10 flex items-center justify-center">
                                      <Building className="w-5 h-5 text-[#B84A68]" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-semibold text-gray-900">{branch.name}</div>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-gray-500">
                                          {branch.city || branch.country || 'No location'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <div className="py-8 text-center text-gray-500">
                                No branches found
                              </div>
                            )}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {selectedBranchId && displayCustomerDetails && (
                      <div className="flex items-center gap-4 px-4 py-2 bg-[#FA9DB7]/5 rounded-2xl border border-[#FA9DB7]/20 shrink-0">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-xs font-medium text-gray-600">
                            {selectedBranchDetails?.name || 'Branch'} Customer
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {selectedBranchId ? (
                  selectedCustomerId && displayCustomerDetails ? (
                    <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-gray-50 to-white">
                      
                      <div className="bg-white border-b border-gray-200/80 px-6 py-5 shrink-0">
                        <div className="flex items-start gap-5">
                          <div className="relative">
                            <Avatar className="w-14 h-14 rounded-2xl border-4 border-white shadow-xl">
                              <AvatarFallback className="bg-gradient-to-br from-[#FA9DB7] to-[#B84A68] text-white text-2xl font-sans">
                                {displayCustomerDetails.customerName?.charAt(0) || 'C'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h2 className="text-2xl font-sans font-bold text-gray-900">
                                {displayCustomerDetails.customerName}
                              </h2>
                              <Badge className="bg-[#FA9DB7]/10 text-[#B84A68] border-0 rounded-full px-4 py-1">
                                {selectedBranchDetails?.name || 'Branch'} Customer
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                              <Mail className="w-4 h-4 text-[#FA9DB7]" />
                              <span>{displayCustomerDetails.customerEmail}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 bg-[#f3f2f1] relative min-h-0">
                        <ScrollArea 
                          ref={messagesScrollRef}
                          className="absolute inset-0 w-full h-full"
                        >
                          <div className="px-6 py-6">
                            {visibleMessages.length === 0 ? (
                              <div className="flex flex-col items-center justify-center h-[300px]">
                                <div className="w-24 h-24 bg-gradient-to-br from-[#FA9DB7]/20 to-[#B84A68]/10 rounded-3xl flex items-center justify-center mb-4">
                                  <MessageCircle className="w-12 h-12 text-[#B84A68]" />
                                </div>
                                <h3 className="text-xl font-sans font-bold text-gray-900 mb-2">No messages yet</h3>
                                <p className="text-gray-500 text-center max-w-md">
                                  Start a conversation with {displayCustomerDetails.customerName}. Your messages will appear here.
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-6">
                                {Object.entries(groupedMessages).map(([date, dateMessages]: [string, any]) => (
                                  <div key={date}>
                                    <div className="flex justify-center mb-4">
                                      <span className="bg-gray-900/80 backdrop-blur-md text-white text-xs px-4 py-2 rounded-full shadow-lg">
                                        {formatDateHeader(date)}
                                      </span>
                                    </div>
                                    
                                    <div className="space-y-3">
                                      {(dateMessages as CustomerMessage[]).map((msg) => {
                                        const isMe = msg.senderRole === 'branch_admin';
                                        
                                        return (
                                          <div key={msg.id} className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}>
                                            
                                            {!isMe && (
                                              <div className="relative group shrink-0">
                                                <Avatar className="w-8 h-8 ring-2 ring-white shadow-md">
                                                  <AvatarFallback className="bg-gradient-to-br from-[#FA9DB7] to-[#B84A68] text-white text-xs">
                                                    {msg.senderName?.charAt(0) || 'C'}
                                                  </AvatarFallback>
                                                </Avatar>
                                              </div>
                                            )}
                                            
                                            <div className={cn("max-w-xs lg:max-w-md", isMe ? "order-2" : "order-1")}>
                                              <div className={cn(
                                                "px-4 py-2.5 rounded-2xl text-sm shadow-sm relative group/message",
                                                isMe 
                                                  ? "bg-gradient-to-br from-[#dcf8c6] to-[#c8e6b5] text-gray-800 rounded-br-none" 
                                                  : "bg-white text-gray-800 rounded-bl-none border border-gray-100"
                                              )}>
                                                {!isMe && (
                                                  <p className="text-xs font-semibold text-[#B84A68] mb-1">
                                                    {msg.senderName} (Customer)
                                                  </p>
                                                )}
                                                {isMe && (
                                                  <p className="text-xs font-semibold text-blue-600 mb-1">
                                                    {selectedBranchDetails?.name || 'Branch'} (You)
                                                  </p>
                                                )}
                                                
                                                {msg.replyToId && (
                                                  <div className="mb-2 pl-2 border-l-3 border-[#FA9DB7] bg-gray-50 p-2 rounded-lg text-xs">
                                                    <p className="text-[#B84A68] font-semibold flex items-center gap-1">
                                                      <ReplyAll className="w-3 h-3" />
                                                      Replying to {msg.replyToSender || 'someone'}
                                                    </p>
                                                    <p className="text-gray-600 line-clamp-2">
                                                      {msg.replyToContent || '📷 Image'}
                                                    </p>
                                                  </div>
                                                )}
                                                
                                                {editingMessage?.id === msg.id ? (
                                                  <div className="flex items-center gap-2">
                                                    <Input
                                                      ref={editInputRef}
                                                      value={editContent}
                                                      onChange={(e) => setEditContent(e.target.value)}
                                                      className="flex-1 bg-white border-gray-200 focus:border-[#FA9DB7] rounded-lg"
                                                      onKeyPress={(e) => e.key === 'Enter' && handleEditMessage()}
                                                    />
                                                    <Button
                                                      size="sm"
                                                      variant="ghost"
                                                      className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                      onClick={handleEditMessage}
                                                    >
                                                      <CheckCircle className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                      size="sm"
                                                      variant="ghost"
                                                      className="h-8 px-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                                                      onClick={cancelEditing}
                                                    >
                                                      <X className="w-4 h-4" />
                                                    </Button>
                                                  </div>
                                                ) : (
                                                  <>
                                                    {msg.content && (
                                                      <p className="whitespace-pre-wrap break-words leading-relaxed mb-2">
                                                        {msg.content}
                                                        {msg.edited && (
                                                          <span className="text-[10px] text-gray-500 ml-1 italic">
                                                            (edited)
                                                          </span>
                                                        )}
                                                      </p>
                                                    )}
                                                    
                                                    {msg.imageBase64 && (
                                                      <div className="mb-2 rounded-lg overflow-hidden border border-gray-200">
                                                        <img 
                                                          src={msg.imageBase64} 
                                                          alt={msg.imageName || 'Shared image'}
                                                          className="max-w-full h-auto max-h-64 object-contain"
                                                          loading="lazy"
                                                        />
                                                      </div>
                                                    )}
                                                  </>
                                                )}
                                                
                                                <div className={cn(
                                                  "flex items-center justify-end gap-1 mt-1 text-[10px]",
                                                  isMe ? "text-gray-600" : "text-gray-400"
                                                )}>
                                                  <span>{formatMessageTime(msg.timestamp)}</span>
                                                  {isMe && msg.status === 'sent' && <Check className="w-3 h-3" />}
                                                  {isMe && msg.status === 'delivered' && <CheckCheck className="w-3 h-3" />}
                                                  {isMe && msg.status === 'seen' && <CheckCheck className="w-3 h-3 text-blue-600" />}
                                                </div>

                                                {editingMessage?.id !== msg.id && (
                                                  <div className="absolute -top-2 -right-2 opacity-0 group-hover/message:opacity-100 transition-opacity">
                                                    <DropdownMenu>
                                                      <DropdownMenuTrigger asChild>
                                                        <Button
                                                          variant="ghost"
                                                          size="icon"
                                                          className="h-8 w-8 rounded-full bg-white shadow-md hover:bg-gray-100"
                                                        >
                                                          <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                      </DropdownMenuTrigger>
                                                      <DropdownMenuContent align="end" className="w-56">
                                                        <DropdownMenuLabel>Message Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        
                                                        <DropdownMenuItem onClick={() => setReplyingTo(msg)}>
                                                          <Reply className="w-4 h-4 mr-2" />
                                                          Reply
                                                        </DropdownMenuItem>
                                                        
                                                        {msg.content && (
                                                          <DropdownMenuItem onClick={() => handleCopyMessage(msg.content)}>
                                                            <Copy className="w-4 h-4 mr-2" />
                                                            Copy Text
                                                          </DropdownMenuItem>
                                                        )}
                                                        
                                                        <DropdownMenuSeparator />
                                                        
                                                        {isMe && (
                                                          <DropdownMenuItem onClick={() => startEditing(msg)}>
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            Edit Message
                                                          </DropdownMenuItem>
                                                        )}
                                                        
                                                        {isMe && (
                                                          <DropdownMenuItem onClick={() => handleDeleteForMe(msg)}>
                                                            <EyeOff className="w-4 h-4 mr-2" />
                                                            Delete for me
                                                          </DropdownMenuItem>
                                                        )}
                                                        
                                                        {isMe && (
                                                          <DropdownMenuItem 
                                                            onClick={() => handleDeleteForEveryone(msg)}
                                                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                                          >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Delete for everyone
                                                          </DropdownMenuItem>
                                                        )}
                                                      </DropdownMenuContent>
                                                    </DropdownMenu>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                            
                                            {isMe && (
                                              <div className="relative group shrink-0">
                                                <Avatar className="w-8 h-8 ring-2 ring-white shadow-md">
                                                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-800 text-white text-xs">
                                                    A
                                                  </AvatarFallback>
                                                </Avatar>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </div>

                      <div className="bg-white/80 backdrop-blur-xl border-t border-gray-200/80 px-6 py-1 shrink-0">
                        
                        {replyingTo && (
                          <div className="mb-3 p-3 bg-blue-50 rounded-lg flex items-center gap-3 border-l-4 border-blue-500">
                            <ReplyAll className="w-4 h-4 text-blue-600 shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-blue-700">
                                Replying to {replyingTo.senderName}
                              </p>
                              <p className="text-xs text-gray-600 line-clamp-1">
                                {replyingTo.content || (replyingTo.imageBase64 ? '📷 Image' : '')}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-full hover:bg-blue-100"
                              onClick={clearReply}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                        
                        {imagePreview && (
                          <div className="mb-3 p-2 bg-gray-50 rounded-lg flex items-center gap-3">
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                              <img 
                                src={imagePreview} 
                                alt="Preview" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 text-sm text-gray-600 truncate">
                              {selectedImage?.name}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-600"
                              onClick={clearSelectedImage}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageSelect}
                            accept="image/*"
                            className="hidden"
                          />
                          
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-12 w-12 rounded-full border-gray-200 hover:border-[#FA9DB7] hover:bg-[#FA9DB7]/5 shrink-0"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <ImageIcon className="w-5 h-5 text-gray-600" />
                          </Button>
                          
                          <div className="flex-1 bg-gray-100/80 rounded-2xl border border-gray-200/50 hover:border-[#FA9DB7]/30 focus-within:border-[#FA9DB7]/50 focus-within:ring-2 focus-within:ring-[#FA9DB7]/20">
                            <div className="flex items-center px-4">
                              {replyingTo && (
                                <ReplyAll className="w-4 h-4 text-blue-500 mr-2" />
                              )}
                              <MessageCircle className="w-5 h-5 text-gray-400" />
                              <Input
                                ref={replyInputRef}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={
                                  replyingTo 
                                    ? `Reply to ${replyingTo.senderName}...` 
                                    : `Reply to ${displayCustomerDetails?.customerName || 'customer'}...`
                                }
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                className="border-0 bg-transparent px-3 py-5 focus-visible:ring-0 text-sm"
                              />
                            </div>
                          </div>
                          
                          <Button 
                            onClick={handleSendMessage} 
                            disabled={!newMessage.trim() && !selectedImage || isSending}
                            className={cn(
                              "h-12 px-6 bg-gradient-to-r rounded-2xl shadow-lg disabled:opacity-50 shrink-0",
                              replyingTo 
                                ? "from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800" 
                                : "from-[#FA9DB7] to-[#B84A68] hover:from-[#E87A9B] hover:to-[#9C3852]"
                            )}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            {isSending ? 'Sending...' : (replyingTo ? 'Reply' : 'Send')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
                      <div className="text-center max-w-md px-6">
                        <div className="w-28 h-28 bg-gradient-to-br from-[#FA9DB7]/20 to-[#B84A68]/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                          <Users className="w-14 h-14 text-[#B84A68]/40" />
                        </div>
                        <h3 className="text-2xl font-sans font-bold text-gray-900 mb-3">
                          {chats.length > 0 ? 'Select a Customer' : 'No Customers Yet'}
                        </h3>
                        <p className="text-gray-500 mb-8">
                          {chats.length > 0 
                            ? `Select a customer from the sidebar to view and reply to their messages.`
                            : `No customers have messaged ${selectedBranchDetails?.name || 'this branch'} yet.`}
                        </p>
                        {chats.length > 0 ? (
                          <div className="flex items-center justify-center gap-2 text-sm text-[#B84A68] bg-[#FA9DB7]/10 px-6 py-3 rounded-2xl">
                            <Sparkles className="w-4 h-4" />
                            <span>{chats.length} customers found for {selectedBranchDetails?.name}</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 bg-gray-100 px-6 py-3 rounded-2xl">
                            <MessageCircle className="w-4 h-4" />
                            <span>Waiting for customers at {selectedBranchDetails?.name}...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
                    <div className="text-center max-w-md px-6">
                      <div className="w-28 h-28 bg-gradient-to-br from-[#FA9DB7]/20 to-[#B84A68]/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Building className="w-14 h-14 text-[#B84A68]/40" />
                      </div>
                      <h3 className="text-2xl font-sans font-bold text-gray-900 mb-3">
                        Select a Branch
                      </h3>
                      <p className="text-gray-500 mb-8">
                        Choose a branch from the dropdown above to view its customers and start chatting.
                      </p>
                      <div className="flex items-center justify-center gap-2 text-sm text-[#B84A68] bg-[#FA9DB7]/10 px-6 py-3 rounded-2xl">
                        <Sparkles className="w-4 h-4" />
                        <span>{branches.length} branches available</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}