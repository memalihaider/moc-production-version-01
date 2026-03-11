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
  ReplyAll,
  ChevronLeft,
  ChevronRight,
  Menu
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
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  getDoc,
  writeBatch,
  increment
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
  readBy?: string[];        // ✅ Users who have read this message
  deliveredTo?: string[];   // ✅ Users who have received this message
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

interface ChatBranch {
  id: string;
  name: string;
  lastMessage?: Message;
  unreadCount: number;
  lastMessageTime?: any;
  branchDetails: any;
}

export default function SuperAdminMessages() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatsSidebarOpen, setChatsSidebarOpen] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [branches, setBranches] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedBranchDetails, setSelectedBranchDetails] = useState<any>(null);
  const [branchSearchQuery, setBranchSearchQuery] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  
  const [chats, setChats] = useState<ChatBranch[]>([]);
  
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editContent, setEditContent] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const branchDetailsRef = useRef<any>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);

  const currentUserId = (user as any)?.uid || 'super-admin';

  useEffect(() => {
    if (selectedBranchId && messagesScrollRef.current) {
      messagesScrollRef.current.scrollTop = 0;
    }
  }, [selectedBranchId]);

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

  // ✅ Fetch ALL branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
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
        
        setBranches(branchesData);
      } catch (error) {
        console.error('Error:', error);
      }
    };
    fetchBranches();
  }, []);

  // ✅ Fetch ALL chats for ALL branches
  useEffect(() => {
    if (branches.length === 0) return;
    
    const fetchAllChats = async () => {
      try {
        const chatsData: ChatBranch[] = [];
        
        for (const branch of branches) {
          const adminMessagesQuery = query(
            collection(db, 'adminMessages'),
            where('recipientBranchId', '==', branch.id)
          );
          
          const branchMessagesQuery = query(
            collection(db, 'branchMessages'),
            where('recipientBranchId', '==', branch.id)
          );
          
          const [adminSnapshot, branchMsgsSnapshot] = await Promise.all([
            getDocs(adminMessagesQuery),
            getDocs(branchMessagesQuery)
          ]);
          
          const allMessages: Message[] = [];
          
          adminSnapshot.forEach(doc => {
            allMessages.push({
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp?.toDate() || new Date(),
              collection: 'adminMessages'
            } as Message);
          });
          
          branchMsgsSnapshot.forEach(doc => {
            allMessages.push({
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp?.toDate() || new Date(),
              collection: 'branchMessages'
            } as Message);
          });
          
          allMessages.sort((a, b) => {
            const timeA = a.timestamp?.toDate?.() || new Date(a.timestamp);
            const timeB = b.timestamp?.toDate?.() || new Date(b.timestamp);
            return timeB.getTime() - timeA.getTime();
          });
          
          const lastMessage = allMessages[0];
          
          // ✅ Calculate unread count for this branch
          let unreadCount = 0;
          if (selectedBranchId !== branch.id) {
            allMessages.forEach(msg => {
              if (msg.senderRole === 'branch_admin' && 
                  (!msg.readBy || !msg.readBy.includes(currentUserId))) {
                unreadCount++;
              }
            });
          }
          
          chatsData.push({
            id: branch.id,
            name: branch.name,
            lastMessage,
            unreadCount,
            lastMessageTime: lastMessage?.timestamp,
            branchDetails: branch
          });
        }
        
        chatsData.sort((a, b) => {
          if (!a.lastMessageTime && !b.lastMessageTime) {
            return a.name.localeCompare(b.name);
          }
          if (!a.lastMessageTime) return 1;
          if (!b.lastMessageTime) return -1;
          const timeA = a.lastMessageTime?.toDate?.() || new Date(a.lastMessageTime);
          const timeB = b.lastMessageTime?.toDate?.() || new Date(b.lastMessageTime);
          return timeB.getTime() - timeA.getTime();
        });
        
        setChats(chatsData);
      } catch (error) {
        console.error('Error fetching chats:', error);
      }
    };
    
    fetchAllChats();
  }, [branches, messages, selectedBranchId, currentUserId]);

  // Branch details
  useEffect(() => {
    if (selectedBranchId) {
      const branch = branches.find(b => b.id === selectedBranchId);
      if (branch) {
        branchDetailsRef.current = branch;
        setSelectedBranchDetails(branch);
        
        // ✅ Mark all messages as read when opening chat
        markMessagesAsRead(selectedBranchId);
      }
    } else {
      branchDetailsRef.current = null;
      setSelectedBranchDetails(null);
    }
  }, [selectedBranchId, branches]);

  // ✅ Mark messages as read
  const markMessagesAsRead = async (branchId: string) => {
    try {
      const branchMessagesQuery = query(
        collection(db, 'branchMessages'),
        where('recipientBranchId', '==', branchId),
        where('senderRole', '==', 'branch_admin'),
        where('read', '==', false)
      );
      
      const snapshot = await getDocs(branchMessagesQuery);
      
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

  // ✅ Send Message with 1-tick initially
  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedImage) || !selectedBranchId) return;

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
        senderName: 'Super Admin',
        senderRole: 'super_admin',
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

      await addDoc(collection(db, 'adminMessages'), messageData);
      clearReply();
      
      // ✅ Simulate delivery after 1 second (in real app, this would be from Firebase Functions)
      setTimeout(() => {
        // This would be handled by a Firebase Function in production
      }, 1000);
      
    } catch (error) {
      console.error('Send error:', error);
      setNewMessage(messageContent);
    }
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      alert('Message copied to clipboard!');
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

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

  const startEditing = (message: Message) => {
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

  // ✅ Filter out messages that are deleted for current user
  const visibleMessages = messages.filter(msg => {
    const deletedFor = msg.deletedFor || [];
    return !deletedFor.includes(currentUserId) && !msg.deletedForEveryone;
  });

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

  // ✅ Fetch messages for selected branch with status updates
  useEffect(() => {
    if (!selectedBranchId) {
      setMessages([]);
      return;
    }

    const adminSentQuery = query(
      collection(db, 'adminMessages'),
      where('recipientBranchId', '==', selectedBranchId),
      where('senderRole', '==', 'super_admin')
    );

    const branchReceivedQuery = query(
      collection(db, 'branchMessages'),
      where('recipientBranchId', '==', selectedBranchId),
      where('senderRole', '==', 'branch_admin')
    );

    const unsubscribeAdmin = onSnapshot(adminSentQuery, (snapshot) => {
      const adminMsgs = snapshot.docs.map(doc => {
        const data = doc.data();
        // ✅ Mark own messages as delivered when they appear
        if (data.senderId === currentUserId && data.status === 'sent') {
          setTimeout(() => {
            markMessageAsDelivered(doc.id, 'adminMessages');
          }, 500);
        }
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
          collection: 'adminMessages' as const
        };
      }) as Message[];
      
      setMessages(prev => {
        const branchMsgs = prev.filter(m => m.collection === 'branchMessages');
        const allMsgs = [...adminMsgs, ...branchMsgs].sort((a, b) => 
          (a.timestamp?.toDate?.() || new Date(a.timestamp)).getTime() - 
          (b.timestamp?.toDate?.() || new Date(b.timestamp)).getTime()
        );
        return allMsgs;
      });
    });

    const unsubscribeBranch = onSnapshot(branchReceivedQuery, (snapshot) => {
      const branchMsgs = snapshot.docs.map(doc => {
        const data = doc.data();
        // ✅ Mark branch messages as seen when viewed
        if (data.senderRole === 'branch_admin' && !data.read) {
          setTimeout(() => {
            markMessageAsSeen(doc.id, 'branchMessages');
          }, 1000);
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
        const allMsgs = [...adminMsgs, ...branchMsgs].sort((a, b) => 
          (a.timestamp?.toDate?.() || new Date(a.timestamp)).getTime() - 
          (b.timestamp?.toDate?.() || new Date(b.timestamp)).getTime()
        );
        return allMsgs;
      });
    });

    return () => {
      unsubscribeAdmin();
      unsubscribeBranch();
    };
  }, [selectedBranchId, currentUserId]);

  const filteredBranches = branches.filter(branch => 
    branch.name?.toLowerCase().includes(branchSearchQuery.toLowerCase()) ||
    branch.city?.toLowerCase().includes(branchSearchQuery.toLowerCase()) ||
    branch.managerName?.toLowerCase().includes(branchSearchQuery.toLowerCase())
  );

  const filteredChats = chats.filter(chat => 
    chat.name?.toLowerCase().includes(chatSearchQuery.toLowerCase()) ||
    chat.branchDetails?.city?.toLowerCase().includes(chatSearchQuery.toLowerCase())
  );

  const displayBranchDetails = selectedBranchDetails || branchDetailsRef.current;

  const handleChatSelect = (branchId: string) => {
    setSelectedBranchId(branchId);
    if (window.innerWidth < 768) {
      setChatsSidebarOpen(false);
    }
  };

  return (
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
                  Branches ({chats.length})
                </h2>
                
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search branches..."
                  value={chatSearchQuery}
                  onChange={(e) => setChatSearchQuery(e.target.value)}
                  className="pl-9 h-10 rounded-xl bg-gray-100 border-0 focus:ring-2 focus:ring-[#FA9DB7]/30"
                />
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-2">
                {filteredChats.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <Building className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No branches found</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredChats.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => handleChatSelect(chat.id)}
                        className={cn(
                          "w-full flex items-start gap-3 p-3 rounded-xl transition-all",
                          selectedBranchId === chat.id
                            ? "bg-[#FA9DB7]/10 border border-[#FA9DB7]/30"
                            : "hover:bg-gray-50"
                        )}
                      >
                        <Avatar className="w-12 h-12 rounded-xl border-2 border-white shadow-sm">
                          <AvatarFallback className={cn(
                            "text-white text-lg font-sans",
                            selectedBranchId === chat.id
                              ? "bg-gradient-to-br from-[#FA9DB7] to-[#B84A68]"
                              : "bg-gradient-to-br from-gray-400 to-gray-600"
                          )}>
                            {chat.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className={cn(
                              "font-medium truncate",
                              selectedBranchId === chat.id ? "text-[#B84A68]" : "text-gray-900"
                            )}>
                              {chat.name}
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
                                {chat.branchDetails?.city || 'No location'}
                              </p>
                              {chat.lastMessage ? (
                                <p className="text-xs text-gray-400 truncate mt-0.5">
                                  {chat.lastMessage.senderRole === 'super_admin' ? 'You: ' : ''}
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
                    <h1 className="text-2xl font-sans font-bold text-gray-900">Executive Communications</h1>
                    <p className="text-xs text-gray-500 mt-0.5">Super Admin Portal</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="px-4 py-2 border-[#FA9DB7]/30 text-[#B84A68] bg-white rounded-full">
                <Sparkles className="w-3.5 h-3.5 mr-2" />
                {branches.length} Branches
              </Badge>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-red-50 hover:text-red-600"
                onClick={logout}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-700">SA</span>
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
                      SELECT BRANCH TO CHAT
                    </label>
                    <Select 
                      value={selectedBranchId} 
                      onValueChange={setSelectedBranchId}
                    >
                      <SelectTrigger className="w-full md:w-[400px] h-14 border-2 border-gray-200/80 hover:border-[#FA9DB7]/50 focus:ring-2 focus:ring-[#FA9DB7]/30 rounded-2xl bg-white/80">
                        <SelectValue placeholder={
                          <div className="flex items-center gap-3 text-gray-500">
                            <Building className="w-3 h-3 text-[#FA9DB7]" />
                            <span>Choose a branch to start conversation</span>
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
                          {filteredBranches.map(branch => (
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
                                    <span className="text-xs text-gray-500">{branch.city || branch.country || 'No location'}</span>
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </ScrollArea>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {displayBranchDetails && (
                    <div className="flex items-center gap-4 px-4 py-2 bg-[#FA9DB7]/5 rounded-2xl border border-[#FA9DB7]/20 shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs font-medium text-gray-600">Active</span>
                      </div>
                      <div className="h-4 w-px bg-gray-200"></div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-600">{displayBranchDetails.openingTime || '09:00'} - {displayBranchDetails.closingTime || '18:00'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedBranchId && displayBranchDetails ? (
                <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-gray-50 to-white">
                  
                  <div className="bg-white border-b border-gray-200/80 px-6 py-5 shrink-0">
                    <div className="flex items-start gap-5">
                      <div className="relative">
                        <Avatar className="w-14 h-14 rounded-2xl border-4 border-white shadow-xl">
                          <AvatarImage src={displayBranchDetails.image} />
                          <AvatarFallback className="bg-gradient-to-br from-[#FA9DB7] to-[#B84A68] text-white text-2xl font-sans">
                            {displayBranchDetails.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h2 className="text-2xl font-sans font-bold text-gray-900">
                            {displayBranchDetails.name}
                          </h2>
                          <Badge className="bg-[#FA9DB7]/10 text-[#B84A68] border-0 rounded-full px-4 py-1">
                            Branch Admin
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                          {displayBranchDetails.address && (
                            <>
                              <MapPin className="w-4 h-4 text-[#FA9DB7]" />
                              <span>{displayBranchDetails.address}, {displayBranchDetails.city}</span>
                            </>
                          )}
                          {displayBranchDetails.phone && (
                            <>
                              <Phone className="w-4 h-4 text-[#FA9DB7]" />
                              <span>{displayBranchDetails.phone}</span>
                            </>
                          )}
                          {displayBranchDetails.email && (
                            <>
                              <Mail className="w-4 h-4 text-[#FA9DB7]" />
                              <span>{displayBranchDetails.email}</span>
                            </>
                          )}
                          {displayBranchDetails.managerName && (
                            <>
                              <Users className="w-4 h-4 text-[#FA9DB7]" />
                              <span>Manager: {displayBranchDetails.managerName}</span>
                            </>
                          )}
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
                              Start a conversation with {displayBranchDetails.name}. Your messages will appear here.
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
                                    const isMe = msg.senderRole === 'super_admin';
                                    
                                    return (
                                      <div key={msg.id} className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}>
                                        
                                        {!isMe && (
                                          <div className="relative group shrink-0">
                                            <Avatar className="w-8 h-8 ring-2 ring-white shadow-md">
                                              <AvatarFallback className="bg-gradient-to-br from-[#FA9DB7] to-[#B84A68] text-white text-xs">
                                                {msg.senderBranchName?.charAt(0) || 'B'}
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
                                                {msg.senderBranchName || 'Branch Admin'}
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
                                                SA
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
                                : `Message ${displayBranchDetails?.name || 'branch'}...`
                            }
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            className="border-0 bg-transparent px-3 py-5 focus-visible:ring-0 text-sm"
                          />
                        </div>
                      </div>
                      
                      <Button 
                        onClick={handleSendMessage} 
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
                    <h3 className="text-2xl font-sans font-bold text-gray-900 mb-3">Welcome to Executive Communications</h3>
                    <p className="text-gray-500 mb-8">
                      Select a branch from the dropdown above or choose a branch from the sidebar to start messaging.
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
  );
}