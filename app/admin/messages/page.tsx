'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
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
  Building,
  MapPin,
  Clock,
  Check,
  CheckCheck,
  Loader2,
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
  ReplyAll
} from "lucide-react";
import { AdminSidebar, AdminMobileSidebar } from "@/components/admin/AdminSidebar";
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
import ProtectedRoute from '@/components/ProtectedRoute';

interface Message {
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
  status: 'sent' | 'delivered' | 'seen';
  collection: 'adminMessages' | 'branchMessages';
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

export default function BranchMessages() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [branches, setBranches] = useState<any[]>([]);
  const [myBranchId, setMyBranchId] = useState<string | null>(null);
  const [myBranchDetails, setMyBranchDetails] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedBranchDetails, setSelectedBranchDetails] = useState<any>(null);
  const [branchSearchQuery, setBranchSearchQuery] = useState('');
  
  // ✅ Reply State
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  // ✅ Edit Message States
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editContent, setEditContent] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  
  // ✅ Image States - NO LOADING
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // ✅ SCROLL FIX - Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);

  // Get current user ID
  const currentUserId = (user as any)?.uid || myBranchId || 'branch-user';

  // Fetch my branch
  useEffect(() => {
    const fetchMyBranch = async () => {
      try {
        const adminBranchId = 'uBqBBB2yL7PS1ODmWT9A'; // Your branch ID
        setMyBranchId(adminBranchId);
        
        const branchRef = doc(db, 'branches', adminBranchId);
        const branchSnap = await getDoc(branchRef);
        
        if (branchSnap.exists()) {
          setMyBranchDetails({
            id: branchSnap.id,
            ...branchSnap.data()
          });
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    fetchMyBranch();
  }, []);

  // ✅ Fetch branches - WITH BRANCH FILTERING
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchesRef = collection(db, 'branches');
        
        // ✅ BRANCH FILTERING - Sirf assigned branch dikhao
        // Branch admin ke liye - sirf apni branch
        if (user?.role === 'admin' && user?.branchId) {
          console.log(`🏢 Branch Admin - Showing only assigned branch: ${user.branchName}`);
          
          const branchDoc = await getDoc(doc(db, 'branches', user.branchId));
          if (branchDoc.exists()) {
            const branchData = [{
              id: branchDoc.id,
              ...branchDoc.data()
            }];
            setBranches(branchData);
            
            // ✅ Auto-select the branch
            setSelectedBranchId(user.branchId);
          }
        } 
        // Super admin ke liye - saari branches
        else {
          console.log('👑 Super Admin - Showing all branches');
          const q = query(branchesRef);
          const snapshot = await getDocs(q);
          
          let branchesData = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          })) as { id: string; name: string; [key: string]: any }[];
          
          branchesData = branchesData.sort((a, b) => 
            (a.name || '').localeCompare(b.name || '')
          );
          
          setBranches(branchesData);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };
    
    if (user) {
      fetchBranches();
    }
  }, [user]);

  // Update selected branch details
  useEffect(() => {
    if (selectedBranchId) {
      const branch = branches.find(b => b.id === selectedBranchId);
      setSelectedBranchDetails(branch || null);
      
      // ✅ Mark messages as read when opening chat
      if (branch && myBranchId) {
        markMessagesAsRead(selectedBranchId);
      }
    } else {
      setSelectedBranchDetails(null);
    }
  }, [selectedBranchId, branches, myBranchId]);

  // ✅ Mark messages as read
  const markMessagesAsRead = async (branchId: string) => {
    try {
      const adminMessagesQuery = query(
        collection(db, 'adminMessages'),
        where('recipientBranchId', '==', branchId),
        where('senderRole', '==', 'super_admin'),
        where('read', '==', false)
      );
      
      const snapshot = await getDocs(adminMessagesQuery);
      
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        const messageRef = doc.ref;
        batch.update(messageRef, {
          read: true,
          status: 'seen',
          readBy: [currentUserId],
          deliveredTo: [currentUserId]
        });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // ✅ Update message status when delivered
  const markMessageAsDelivered = async (messageId: string, collection: string) => {
    try {
      const messageRef = doc(db, collection, messageId);
      await updateDoc(messageRef, {
        status: 'delivered',
        deliveredTo: [currentUserId]
      });
    } catch (error) {
      console.error('Error marking message as delivered:', error);
    }
  };

  // ✅ Update message status when seen
  const markMessageAsSeen = async (messageId: string, collection: string) => {
    try {
      const messageRef = doc(db, collection, messageId);
      await updateDoc(messageRef, {
        read: true,
        status: 'seen',
        readBy: [currentUserId]
      });
    } catch (error) {
      console.error('Error marking message as seen:', error);
    }
  };

  // Scroll to top when branch changes
  useEffect(() => {
    if (selectedBranchId && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [selectedBranchId]);

  // Auto-scroll only if at bottom
  useEffect(() => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 50;
      
      if (isAtBottom) {
        scrollContainerRef.current.scrollTo({
          top: scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [messages]);

  // ✅ Fetch messages - WITH STATUS UPDATES
  useEffect(() => {
    if (!selectedBranchId || !myBranchId) return;

    const adminSentQuery = query(
      collection(db, 'adminMessages'),
      where('recipientBranchId', '==', selectedBranchId),
      where('senderRole', '==', 'super_admin')
    );

    const myBranchSentQuery = query(
      collection(db, 'branchMessages'),
      where('senderBranchId', '==', myBranchId),
      where('recipientBranchId', '==', selectedBranchId),
      where('senderRole', '==', 'branch_admin')
    );

    const unsubscribeAdmin = onSnapshot(adminSentQuery, (snapshot) => {
      const adminMsgs = snapshot.docs.map(doc => {
        const data = doc.data();
        // ✅ Mark super admin messages as delivered when we see them
        if (data.senderRole === 'super_admin' && !data.deliveredTo?.includes(currentUserId)) {
          setTimeout(() => {
            markMessageAsDelivered(doc.id, 'adminMessages');
          }, 500);
        }
        // ✅ Mark super admin messages as seen when we read them
        if (data.senderRole === 'super_admin' && !data.read) {
          setTimeout(() => {
            markMessageAsSeen(doc.id, 'adminMessages');
          }, 1000);
        }
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
          collection: 'adminMessages' as const
        };
      }) as Message[];
      
      setMessages(prev => {
        const myMsgs = prev.filter(m => m.collection === 'branchMessages');
        const allMsgs = [...adminMsgs, ...myMsgs].sort((a, b) => 
          (a.timestamp?.toDate?.() || new Date(a.timestamp)).getTime() - 
          (b.timestamp?.toDate?.() || new Date(b.timestamp)).getTime()
        );
        return allMsgs;
      });
    });

    const unsubscribeMyBranch = onSnapshot(myBranchSentQuery, (snapshot) => {
      const myMsgs = snapshot.docs.map(doc => {
        const data = doc.data();
        // ✅ Mark our own messages as delivered after sending
        if (data.senderId === currentUserId && data.status === 'sent') {
          setTimeout(() => {
            markMessageAsDelivered(doc.id, 'branchMessages');
          }, 500);
        }
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
          collection: 'branchMessages' as const
        };
      }) as Message[];
      
      setMessages(prev => {
        const adminMsgs = prev.filter(m => m.collection === 'adminMessages');
        const allMsgs = [...adminMsgs, ...myMsgs].sort((a, b) => 
          (a.timestamp?.toDate?.() || new Date(a.timestamp)).getTime() - 
          (b.timestamp?.toDate?.() || new Date(b.timestamp)).getTime()
        );
        return allMsgs;
      });
    });

    return () => {
      unsubscribeAdmin();
      unsubscribeMyBranch();
    };
  }, [selectedBranchId, myBranchId, currentUserId]);

  // ✅ Image Selection Handler
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

  // ✅ Clear Selected Image
  const clearSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ✅ Clear Reply
  const clearReply = () => {
    setReplyingTo(null);
  };

  // ✅ Convert Image to Base64
  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // ✅ Send message with 1-tick initially
  const handleSendReply = async () => {
    if ((!newMessage.trim() && !selectedImage) || !selectedBranchId || !myBranchId || !myBranchDetails) return;

    const selectedBranch = branches.find(b => b.id === selectedBranchId);
    if (!selectedBranch) return;

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

      const messageData: any = {
        content: messageContent,
        senderId: currentUserId,
        senderName: myBranchDetails.name,
        senderRole: 'branch_admin',
        senderBranchId: myBranchId,
        senderBranchName: myBranchDetails.name,
        recipientBranchId: selectedBranchId,
        recipientBranchName: selectedBranch.name,
        timestamp: serverTimestamp(),
        read: false,
        status: 'sent', // ✅ 1 tick initially
        deliveredTo: [],
        readBy: [],
        deletedFor: [],
        deletedForEveryone: false,
        edited: false
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

      await addDoc(collection(db, 'branchMessages'), messageData);
      clearReply();
      
    } catch (error) {
      console.error('Send error:', error);
      setNewMessage(messageContent);
    }
  };

  // ✅ COPY MESSAGE
  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      alert('Message copied to clipboard!');
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  // ✅ DELETE FOR ME
  const handleDeleteForMe = async (message: Message) => {
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

  // ✅ DELETE FOR EVERYONE
  const handleDeleteForEveryone = async (message: Message) => {
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

  // ✅ EDIT MESSAGE
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

  // ✅ Start editing
  const startEditing = (message: Message) => {
    setEditingMessage(message);
    setEditContent(message.content || '');
    setTimeout(() => {
      editInputRef.current?.focus();
    }, 100);
  };

  // ✅ Cancel editing
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

  // ✅ Filter out messages that are deleted for current user
  const visibleMessages = messages.filter(msg => {
    const deletedFor = msg.deletedFor || [];
    return !deletedFor.includes(currentUserId) && !msg.deletedForEveryone;
  });

  // Group messages
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

  // ✅ FILTER BRANCHES - SIRF ASSIGNED BRANCH FOR BRANCH ADMIN
  const filteredBranches = branches.filter(branch => {
    // Agar branch admin hai to sirf assigned branch dikhao
    if (user?.role === 'admin' && user?.branchId) {
      return branch.id === user.branchId;
    }
    // Super admin ke liye search filter
    return branch.name?.toLowerCase().includes(branchSearchQuery.toLowerCase()) ||
           branch.city?.toLowerCase().includes(branchSearchQuery.toLowerCase()) ||
           branch.managerName?.toLowerCase().includes(branchSearchQuery.toLowerCase());
  });

  return (
    <ProtectedRoute requiredRole='admin'>
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
     
      
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header - FIXED */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/80 px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <AdminMobileSidebar 
                role={user?.role === 'super_admin' ? 'super_admin' : 'branch_admin'} 
                onLogout={logout} 
                isOpen={sidebarOpen} 
                onToggle={() => setSidebarOpen(!sidebarOpen)}
                allowedPages={user?.allowedPages || []} 
              />
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FA9DB7] to-[#B84A68] flex items-center justify-center shadow-lg">
                    <Building className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-sans font-bold text-gray-900">Branch Communications</h1>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {user?.role === 'admin' 
                        ? `${user?.branchName || 'Branch'} Admin` 
                        : 'Branch Admin'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="px-4 py-2 border-[#FA9DB7]/30 text-[#B84A68] bg-white rounded-full">
                <Sparkles className="w-3.5 h-3.5 mr-2" />
                {user?.role === 'admin' && user?.branchName 
                  ? `${user.branchName} Chat` 
                  : 'Branch Chat'}
              </Badge>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-red-50 hover:text-red-600"
                onClick={logout}
              >
                {/* Add icon here if needed */}
              </Button>
            </div>
          </div>
        </header>

        {/* CARD CONTAINER - FIXED */}
        <div className="flex-1 overflow-hidden p-6 pt-0">
          <Card className="h-full border-0 shadow-2xl bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden flex flex-col">
            
            {/* CARD CONTENT - FIXED */}
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* SELECT BRANCH - WITH BRANCH FILTERING */}
              <div className="bg-gradient-to-r from-white to-gray-50/80 px-6 py-5 border-b border-gray-200/80 shrink-0">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-2 block">
                      {user?.role === 'admin' 
                        ? 'YOUR BRANCH' 
                        : 'SELECT BRANCH TO CHAT'}
                    </label>
                    
                    {user?.role === 'admin' && user?.branchId ? (
                      /* Branch Admin - Show branch name directly (no dropdown) */
                      <div className="w-full md:w-[400px] h-14 border-2 border-[#FA9DB7]/30 bg-gradient-to-r from-[#FA9DB7]/5 to-white rounded-2xl flex items-center px-4">
                        <div className="flex items-center gap-3">
                          <Building className="w-5 h-5 text-[#B84A68]" />
                          <span className="font-semibold text-gray-900">
                            {branches.find(b => b.id === user.branchId)?.name || user.branchName || 'Your Branch'}
                          </span>
                          <Badge className="bg-[#FA9DB7]/10 text-[#B84A68] border-0 ml-2">
                            Assigned Branch
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      /* Super Admin - Show dropdown with all branches */
                      <Select 
                        value={selectedBranchId} 
                        onValueChange={setSelectedBranchId}
                      >
                        <SelectTrigger className="w-full md:w-[400px] h-14 border-2 border-gray-200/80 hover:border-[#FA9DB7]/50 focus:ring-2 focus:ring-[#FA9DB7]/30 rounded-2xl bg-white/80">
                          <SelectValue placeholder={
                            <div className="flex items-center gap-3 text-gray-500">
                              <Building className="w-5 h-5 text-[#FA9DB7]" />
                              <span>All Branches ({branches.length})</span>
                            </div>
                          } />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-0 shadow-2xl p-2 bg-white/95">
                          <div className="px-3 py-2 border-b border-gray-100">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <Input
                                placeholder="Search by branch, city, or manager..."
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
                                        <span className="text-xs text-gray-500">{branch.country}</span>
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
                    )}
                  </div>
                  
                  {selectedBranchDetails && (
                    <div className="flex items-center gap-4 px-4 py-2 bg-blue-50 rounded-2xl border border-blue-200 shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                        <span className="text-xs font-medium text-blue-700">
                          {selectedBranchDetails.id === myBranchId ? 'Super Admin' : 'Super Admin'}
                        </span>
                      </div>
                      <div className="h-4 w-px bg-blue-200"></div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-xs text-blue-700">
                          {selectedBranchDetails.id === myBranchId ? 'Head office' : 'Head Office'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedBranchId && selectedBranchDetails ? (
                <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-gray-50 to-white">
                  
                  {/* BRANCH/SUPER ADMIN HEADER - DYNAMIC */}
                  <div className="bg-white border-b border-gray-200/80 px-6 py-5 shrink-0">
                    <div className="flex items-start gap-5">
                      <div className="relative">
                        <Avatar className="w-12 h-12 rounded-2xl border-4 border-white shadow-xl">
                          {selectedBranchDetails.id === myBranchId ? (
                            <AvatarFallback className="bg-gradient-to-br from-[#FA9DB7] to-[#B84A68] text-white text-2xl font-sans">
                              {selectedBranchDetails.name?.charAt(0)}
                            </AvatarFallback>
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-800 text-white text-2xl font-sans">
                              SA
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className={cn(
                          "absolute -bottom-1 -right-1 w-6 h-6 border-4 border-white rounded-full",
                          selectedBranchDetails.id === myBranchId ? "bg-green-500" : "bg-blue-500"
                        )}></div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-2xl font-sans font-bold text-gray-900">
                            {selectedBranchDetails.id === myBranchId 
                              ? selectedBranchDetails.name 
                              : 'Super Admin'
                            }
                          </h2>
                          <Badge className={cn(
                            "border-0 rounded-full px-4 py-1",
                            selectedBranchDetails.id === myBranchId 
                              ? "bg-[#FA9DB7]/10 text-[#B84A68]" 
                              : "bg-blue-50 text-blue-700"
                          )}>
                            {selectedBranchDetails.id === myBranchId ? 'Head Office' : 'Head Office'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                          {selectedBranchDetails.address && (
                            <>
                              <MapPin className="w-4 h-4 text-[#FA9DB7]" />
                              <span>{selectedBranchDetails.address}, {selectedBranchDetails.city}</span>
                            </>
                          )}
                          {selectedBranchDetails.phone && (
                            <>
                              <Phone className="w-4 h-4 text-[#FA9DB7]" />
                              <span>{selectedBranchDetails.phone}</span>
                            </>
                          )}
                          {selectedBranchDetails.email && (
                            <>
                              <Mail className="w-4 h-4 text-[#FA9DB7]" />
                              <span>{selectedBranchDetails.email}</span>
                            </>
                          )}
                          {selectedBranchDetails.managerName && (
                            <>
                              <Users className="w-4 h-4 text-[#FA9DB7]" />
                              <span>Manager: {selectedBranchDetails.managerName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* MESSAGES AREA - SIRF YAHI SCROLL HOGA */}
                  <div className="flex-1 bg-[#f3f2f1] relative min-h-0">
                    <ScrollArea 
                      ref={scrollContainerRef}
                      className="absolute inset-0 w-full h-full"
                    >
                      <div className="px-6 py-6">
                        {visibleMessages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-[300px]">
                            <div className="w-24 h-24 bg-gradient-to-br from-[#FA9DB7]/20 to-[#B84A68]/10 rounded-3xl flex items-center justify-center mb-4">
                              <MessageCircle className="w-12 h-12 text-[#B84A68]" />
                            </div>
                            <h3 className="text-xl font-sans font-bold text-gray-900 mb-2">
                              No messages yet
                            </h3>
                            <p className="text-gray-500 text-center max-w-md">
                              Start a conversation with {selectedBranchDetails.name}. Your messages will appear here.
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
                                  {(dateMessages as Message[]).map((msg) => {
                                    const isMe = msg.senderRole === 'branch_admin' && msg.senderBranchId === myBranchId;
                                    const isSuperAdmin = msg.senderRole === 'super_admin';
                                    const isSelfChat = selectedBranchDetails.id === myBranchId;
                                    
                                    return (
                                      <div key={msg.id} className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}>
                                        
                                        {isSuperAdmin && !isSelfChat && (
                                          <div className="relative group shrink-0">
                                            <Avatar className="w-8 h-8 ring-2 ring-white shadow-md">
                                              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-800 text-white text-xs">
                                                SA
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
                                            {isSuperAdmin && !isSelfChat && (
                                              <p className="text-xs font-semibold text-blue-600 mb-1">
                                                Super Admin
                                              </p>
                                            )}
                                            {isSelfChat && !isMe && (
                                              <p className="text-xs font-semibold text-[#B84A68] mb-1">
                                                {msg.senderBranchName || 'Branch'}
                                              </p>
                                            )}
                                            
                                            {/* Reply Indicator */}
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
                                            
                                            {/* Edit Mode */}
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
                                                {/* Message Content */}
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
                                                
                                                {/* Image Display */}
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
                                            
                                            {/* ✅ Time & Status - 1 Tick, 2 Ticks, Blue Ticks */}
                                            <div className={cn(
                                              "flex items-center justify-end gap-1 mt-1 text-[10px]",
                                              isMe ? "text-gray-600" : "text-gray-400"
                                            )}>
                                              <span>{formatMessageTime(msg.timestamp)}</span>
                                              {isMe && msg.status === 'sent' && <Check className="w-3 h-3" />}
                                              {isMe && msg.status === 'delivered' && <CheckCheck className="w-3 h-3" />}
                                              {isMe && msg.status === 'seen' && <CheckCheck className="w-3 h-3 text-blue-600" />}
                                            </div>

                                            {/* Actions Menu */}
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
                                                    
                                                    {/* Reply - Sab ke liye */}
                                                    <DropdownMenuItem onClick={() => setReplyingTo(msg)}>
                                                      <Reply className="w-4 h-4 mr-2" />
                                                      Reply
                                                    </DropdownMenuItem>
                                                    
                                                    {/* Copy - Sirf text messages ke liye */}
                                                    {msg.content && (
                                                      <DropdownMenuItem onClick={() => handleCopyMessage(msg.content)}>
                                                        <Copy className="w-4 h-4 mr-2" />
                                                        Copy Text
                                                      </DropdownMenuItem>
                                                    )}
                                                    
                                                    <DropdownMenuSeparator />
                                                    
                                                    {/* Edit - Sirf apne messages ke liye */}
                                                    {isMe && (
                                                      <DropdownMenuItem onClick={() => startEditing(msg)}>
                                                        <Edit className="w-4 h-4 mr-2" />
                                                        Edit Message
                                                      </DropdownMenuItem>
                                                    )}
                                                    
                                                    {/* Delete for me - Sirf apne messages ke liye */}
                                                    {isMe && (
                                                      <DropdownMenuItem onClick={() => handleDeleteForMe(msg)}>
                                                        <EyeOff className="w-4 h-4 mr-2" />
                                                        Delete for me
                                                      </DropdownMenuItem>
                                                    )}
                                                    
                                                    {/* Delete for everyone - Sirf apne messages ke liye */}
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
                                              <AvatarFallback className="bg-gradient-to-br from-[#FA9DB7] to-[#B84A68] text-white text-xs">
                                                {myBranchDetails?.name?.charAt(0) || 'B'}
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
                            <div ref={messagesEndRef} />
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* MESSAGE INPUT WITH REPLY & IMAGE UPLOAD - NO LOADING STATES */}
                  <div className="bg-white/80 backdrop-blur-xl border-t border-gray-200/80 px-6 py-1 shrink-0">
                    
                    {/* Reply Preview */}
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
                    
                    {/* Image Preview */}
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
                                : selectedBranchDetails?.id === myBranchId 
                                  ? `Write a note to yourself...` 
                                  : `Reply to ${selectedBranchDetails?.name || 'Super Admin'}...`
                            }
                            onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                            className="border-0 bg-transparent px-3 py-5 focus-visible:ring-0 text-sm"
                          />
                        </div>
                      </div>
                      
                      <Button 
                        onClick={handleSendReply} 
                        disabled={!newMessage.trim() && !selectedImage}
                        className={cn(
                          "h-12 px-6 bg-gradient-to-r rounded-2xl shadow-lg disabled:opacity-50 shrink-0",
                          replyingTo 
                            ? "from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800" 
                            : "from-[#FA9DB7] to-[#B84A68] hover:from-[#E87A9B] hover:to-[#9C3852]"
                        )}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {replyingTo ? 'Reply' : 'Send'}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
                  <div className="text-center max-w-md px-6">
                    <div className="w-28 h-28 bg-gradient-to-br from-[#FA9DB7]/20 to-[#B84A68]/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Building className="w-14 h-14 text-[#B84A68]/40" />
                    </div>
                    <h3 className="text-2xl font-sans font-bold text-gray-900 mb-3">
                      Welcome, {myBranchDetails?.name || 'Branch'}
                    </h3>
                    <p className="text-gray-500 mb-8">
                      {user?.role === 'admin' 
                        ? `You are chatting with your assigned branch.` 
                        : `Select a branch from the dropdown above to start chatting. You can chat with any branch including your own!`}
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-[#B84A68] bg-[#FA9DB7]/10 px-6 py-3 rounded-2xl">
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {user?.role === 'admin'
                          ? `Chatting as ${user?.branchName || 'Your Branch'}`
                          : `${branches.length} total branches available`}
                      </span>
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