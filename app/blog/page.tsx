

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

import { Footer } from "@/components/shared/Footer";
import { 
  CalendarDays, 
  Clock, 
  User, 
  Tag, 
  MessageSquare, 
  ArrowRight, 
  BookOpen,
  TrendingUp,
  Heart,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Firebase imports
import { 
  collection, 
  getDocs, 
  query, 
  orderBy,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';


// Types Definition for Blog
interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  category: string;
  tags: string[];
  readTime: string;
  publishedDate: string;
  views: number;
  likes: number;
  comments: number;
  featured: boolean;
  imageUrl: string;
}

export default function BlogPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set());
  const postsPerPage = 6;

  // ===== CHAT LOGIC (Copied from Home Page) =====
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check login status
  useEffect(() => {
    const checkLogin = () => {
      // Check if user is logged in (update this based on your auth system)
      const user = localStorage.getItem('user'); // or cookies, or context
      setIsLoggedIn(!!user);
    };
    
    checkLogin();
    
    // Optional: Listen for storage changes
    window.addEventListener('storage', checkLogin);
    return () => window.removeEventListener('storage', checkLogin);
  }, []);
  // =============================================

  const handleChatClick = () => {
    if (isLoggedIn) {
      // Agar login hai to chat page par jao
      window.location.href = '/customer/chat';
    } else {
      // Agar login nahi hai to popup dikhao
      setShowChatPopup(true);
    }
  };

  // Fetch blogs from Firebase
  const fetchBlogs = async () => {
    try {
      const blogsRef = collection(db, 'blogs');
      const q = query(blogsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const blogsData: BlogPost[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        blogsData.push({
          id: doc.id,
          title: data.title || '',
          excerpt: data.excerpt || '',
          content: data.content || '',
          author: {
            name: data.author?.name || 'Admin',
            role: data.author?.role || 'Author',
            avatar: data.author?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop'
          },
          category: data.category || 'Uncategorized',
          tags: Array.isArray(data.tags) ? data.tags : [],
          readTime: data.readTime || '5 min read',
          publishedDate: data.publishedDate || new Date().toISOString().split('T')[0],
          views: Number(data.views) || 0,
          likes: Number(data.likes) || 0,
          comments: Number(data.comments) || 0,
          featured: Boolean(data.featured) || false,
          imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074&auto=format&fit=crop'
        });
      });
      
      setBlogs(blogsData);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchBlogs();
  }, []);

  // Get unique categories from blogs
  const blogCategories = [
    { id: 'all', name: 'All Articles', count: blogs.length },
    ...Array.from(new Set(blogs.map(p => p.category)))
      .filter((category): category is string => Boolean(category && category.trim() !== ''))
      .map(category => ({
        id: category.toLowerCase().replace(/\s+/g, '-'),
        name: category,
        count: blogs.filter(p => p.category === category).length
      }))
  ];

  // Get all tags from blogs for popular tags
  const allTags = Array.from(new Set(blogs.flatMap(blog => blog.tags)));
  const popularTags = allTags.slice(0, 15);

  // Filter blog posts
  const filteredPosts = blogs.filter(post => {
    const matchesCategory = selectedCategory === 'all' || 
      post.category.toLowerCase().replace(/\s+/g, '-') === selectedCategory;
    
    const matchesSearch = searchQuery === '' || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  // Featured posts
  const featuredPosts = blogs.filter(post => post.featured);

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const paginatedPosts = filteredPosts.slice(startIndex, startIndex + postsPerPage);

  // Handle like
  const handleLike = (postId: string) => {
    const newLikedPosts = new Set(likedPosts);
    if (newLikedPosts.has(postId)) {
      newLikedPosts.delete(postId);
    } else {
      newLikedPosts.add(postId);
    }
    setLikedPosts(newLikedPosts);
  };

  // Handle bookmark
  const handleBookmark = (postId: string) => {
    const newBookmarkedPosts = new Set(bookmarkedPosts);
    if (newBookmarkedPosts.has(postId)) {
      newBookmarkedPosts.delete(postId);
    } else {
      newBookmarkedPosts.add(postId);
    }
    setBookmarkedPosts(newBookmarkedPosts);
  };

  return (
    <div className="min-h-screen bg-gray-400 flex flex-col ">
      <Header />

      {/* ==================== 3 BUTTONS - EXACT COPY FROM HOME PAGE ==================== */}
      {/* Fixed bottom right buttons - WhatsApp, Call, Chatbot */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4">
        
        {/* Simple Official WhatsApp Icon */}
        <a 
          href="https://wa.me/923001234567" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
          title="WhatsApp"
        >
          <svg 
            className="w-7 h-7" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            {/* Direct WhatsApp Logo */}
            <path
              fill="#25D366"
              d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.78 2.7 15.57 3.71 17.08L2.09 21.91L7.06 20.33C8.55 21.24 10.27 21.72 12.04 21.72C17.5 21.72 21.95 17.27 21.95 11.81C21.95 6.35 17.5 2 12.04 2ZM12.04 20.09C10.46 20.09 8.92 19.65 7.58 18.83L7.32 18.68L4.43 19.57L5.34 16.77L5.18 16.5C4.3 15.12 3.81 13.53 3.81 11.91C3.81 7.37 7.5 3.68 12.04 3.68C16.58 3.68 20.27 7.37 20.27 11.91C20.27 16.45 16.58 20.09 12.04 20.09ZM16.46 13.95C16.18 13.81 14.95 13.21 14.69 13.12C14.43 13.03 14.24 12.98 14.05 13.26C13.86 13.54 13.33 14.09 13.17 14.27C13.01 14.45 12.85 14.47 12.57 14.33C12.29 14.19 11.46 13.91 10.48 13.05C9.7 12.37 9.16 11.51 9.02 11.23C8.88 10.95 9 10.79 9.13 10.66C9.25 10.53 9.4 10.33 9.53 10.17C9.66 10.01 9.71 9.89 9.79 9.73C9.87 9.57 9.82 9.43 9.74 9.31C9.66 9.19 9.11 7.98 8.9 7.5C8.69 7.02 8.48 7.07 8.32 7.07C8.16 7.07 7.99 7.07 7.83 7.07C7.67 7.07 7.41 7.13 7.19 7.39C6.97 7.65 6.35 8.29 6.35 9.58C6.35 10.87 7.22 12.11 7.37 12.3C7.52 12.49 9.09 14.83 11.5 15.94C12.69 16.52 13.59 16.79 14.28 16.97C15.06 17.16 15.79 17.09 16.36 16.88C16.93 16.67 17.67 16.15 17.88 15.53C18.09 14.91 18.09 14.38 18.04 14.28C17.99 14.18 17.85 14.11 17.68 14.04C17.52 13.99 16.74 14.09 16.46 13.95Z"
            />
          </svg>
        </a>
  
        {/* Very Simple Phone Icon */}
        <a 
          href="tel:+1234567890"
          className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
          title="Call Now"
        >
          <svg 
            className="w-6 h-6 text-white" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            {/* Simple Phone Handset */}
            <path d="M20 10.999h2C22 5.869 18.127 2 12.99 2v2C17.052 4 20 6.943 20 10.999z"/>
            <path d="M13 8c2.103 0 3 .897 3 3h2c0-3.225-1.775-5-5-5v2z"/>
            <path d="M16.5 13.5c-.3-.3-.7-.5-1.1-.5-.4 0-.8.1-1.1.4l-1.4 1.4c-1.1-.6-2.1-1.3-3-2.2-.9-.9-1.6-1.9-2.2-3l1.4-1.4c.3-.3.4-.7.4-1.1 0-.4-.1-.8-.4-1.1l-2-2c-.3-.3-.7-.5-1.1-.5-.4 0-.8.1-1.1.4L3.5 6.5c-.3.3-.5.7-.5 1.1 0 3.9 2.1 7.6 5 10.5 2.9 2.9 6.6 5 10.5 5 .4 0 .8-.2 1.1-.5l1.4-1.4c.3-.3.5-.7.5-1.1 0-.4-.2-.8-.5-1.1l-2-2z"/>
          </svg>
        </a>

        {/* Chatbot Button with Login Logic */}
        <button
          onClick={handleChatClick}
          className="flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
          title="Chat with Bot"
        >
          <svg 
            className="w-6 h-6" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor"
          >
            <defs>
              <linearGradient id="chatbot-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#667eea" />   {/* Purple */}
                <stop offset="50%" stopColor="#764ba2" />  {/* Dark Purple */}
                <stop offset="100%" stopColor="#6b8cff" /> {/* Blue */}
              </linearGradient>
            </defs>
            
            {/* Background Circle */}
            <circle 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="url(#chatbot-gradient)" 
              strokeWidth="1.5" 
              fill="transparent"
            />
            
            {/* Chatbot Icon - Message Bubble with Dots */}
            <path 
              d="M20 12C20 16.4183 16.4183 20 12 20C10.5 20 9.1 19.6 7.9 18.9L4 20L5.1 16.1C4.4 14.9 4 13.5 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12Z" 
              stroke="url(#chatbot-gradient)" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              fill="white"
            />
            
            {/* Three Dots inside bubble */}
            <circle cx="9" cy="12" r="1" fill="url(#chatbot-gradient)" />
            <circle cx="12" cy="12" r="1" fill="url(#chatbot-gradient)" />
            <circle cx="15" cy="12" r="1" fill="url(#chatbot-gradient)" />
          </svg>
        </button>
      </div>

      {/* Chat Login Popup */}
      {showChatPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-[60]">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowChatPopup(false)}
          />
          
          {/* Popup Box */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 w-full animate-in fade-in zoom-in duration-300">
            {/* Close Button */}
            <button 
              onClick={() => setShowChatPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Icon */}
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-sans font-bold text-center text-gray-900 mb-2">
              Create Account First! ✋
            </h3>

            {/* Login/Signup Button */}
            <Link 
              href="/customer/login"
              className="block w-full text-center bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
              onClick={() => setShowChatPopup(false)}
            >
              Login / Sign Up
            </Link>

            {/* Continue as Guest (Optional) */}
            <button 
              onClick={() => setShowChatPopup(false)}
              className="block w-full text-center text-gray-500 text-sm mt-4 hover:text-gray-700 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      )}

      <main className="flex-1">
        {/* Premium Hero Section - CODE1 STYLE */}
      <section className="relative bg-gradient-to-br from-[#FA9DB7] via-white to-[#FA9DB7] py-32 px-4 overflow-hidden">
  {/* Video Background */}
  <div className="absolute inset-0 w-full h-full">
    <video
      autoPlay
      loop
      muted
      playsInline
      className="absolute inset-0 w-full h-full object-cover"
    >
      <source src="https://www.pexels.com/download/video/854416/" type="video/mp4" />
      Your browser does not support the video tag.
    </video>
    
    {/* Soft Overlay - video visible rahega aur text readable */}
    <div className="absolute inset-0 bg-gradient-to-br from-[#FA9DB7]/30 via-white/40 to-[#FA9DB7]/30"></div>
  </div>

  {/* Texture Overlay (optional - hata bhi sakte ho) */}
  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diamond-upholstery.png')] opacity-[0.02] mix-blend-overlay"></div>
  
  <div className="max-w-7xl mx-auto relative z-10">
    <div className="text-center space-y-8">
      <div className="inline-flex items-center gap-2 bg-secondary/20 px-4 py-2 rounded-full mb-6 border border-secondary/30">
            <BookOpen className="w-4 h-4 text-secondary" />
            <span className="text-black font-black tracking-[0.3em] uppercase text-[10px]">The ManofCave Journal</span>
          </div>
      
     <h1 className="text-5xl md:text-7xl font-sans font-bold text-white mb-6 leading-tight">
            The Grooming <span className="text-secondary italic">Chronicles</span>
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg font-light leading-relaxed mb-8">
            Expert insights, style guides, and timeless wisdom for the modern gentleman's journey to excellence.
          </p>
      {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-3">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-secondary" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Total Articles</p>
                  <p className="text-2xl font-bold text-white">{blogs.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-3">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-secondary" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Total Comments</p>
                  <p className="text-2xl font-bold text-white">
                    {blogs.reduce((sum, post) => sum + post.comments, 0)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-3">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-secondary" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Total Views</p>
                  <p className="text-2xl font-bold text-white">
                    {blogs.reduce((sum, post) => sum + post.views, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
    </div>
  </div>
</section>

        {/* Search and Filter Section - CODE1 STYLE */}
        <section className="py-16 px-4 border-b border-gray-100 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Search articles by title, content, or tags..."
                  className="pl-12 pr-4 py-3 border-gray-200 rounded-2xl focus:border-primary focus:ring-primary/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Categories - CODE1 STYLE */}
              <div className="flex flex-wrap gap-3">
                {blogCategories.map((cat) => (
                  <Button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setCurrentPage(1);
                    }}
                    className={`rounded-full px-6 py-2 text-sm font-medium transition-all duration-300 ${
                      selectedCategory === cat.id
                        ? "bg-primary text-white hover:bg-primary/90"
                        : "border border-gray-200 bg-white text-gray-600 hover:border-primary hover:text-primary"
                    }`}
                  >
                    {cat.name} ({cat.count})
                  </Button>
                ))}
              </div>
            </div>

            {/* Popular Tags Section - CODE1 STYLE */}
            {popularTags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
                  <div className="flex items-center gap-2 shrink-0">
                    <Tag className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-gray-600">Popular Topics:</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {popularTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSearchQuery(tag)}
                        className={cn(
                          "px-4 py-2 text-xs font-medium rounded-full transition-all border",
                          searchQuery === tag
                            ? "bg-secondary/20 text-secondary border-secondary/40"
                            : "bg-gray-50 text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
                        )}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Main Content */}
        <section className="py-20 px-4 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            {/* Featured Posts - CODE1 STYLE */}
            {selectedCategory === 'all' && featuredPosts.length > 0 && (
              <div className="mb-20">
                <div className="mb-12">
                  <h2 className="text-3xl font-sans font-bold text-primary mb-4">
                    Featured Articles
                  </h2>
                  <div className="w-24 h-1 bg-gradient-to-r from-gray-400 to-primary rounded-full"></div>
                 
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {featuredPosts.slice(0, 2).map((post) => (
                    <Card key={post.id} className="group bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 hover:shadow-3xl transition-all duration-500">
                      <div className="grid md:grid-cols-2 gap-0 h-full">
                        <div className="relative h-64 md:h-auto overflow-hidden">
                          <img 
                            src={post.imageUrl} 
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074&auto=format&fit=crop';
                            }}
                          />
                          <div className="absolute top-4 left-4">
                            <Badge className="bg-white  text-[#FA9DB7] px-4 py-2 rounded-full text-sm font-medium">
                              FEATURED
                            </Badge>
                          </div>
                        </div>
                        <div className="p-8 flex flex-col justify-center">
                          <div className="space-y-4">
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                {post.author.name}
                              </div>
                              <div className="flex items-center gap-2">
                                <CalendarDays className="w-4 h-4" />
                                {post.publishedDate}
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                {post.readTime}
                              </div>
                            </div>
                            <h3 className="text-2xl font-sans font-bold text-primary leading-tight group-hover:text-secondary transition-colors">
                              {post.title}
                            </h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                              {post.excerpt}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {post.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                            <Button 
                              className="w-fit bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-2xl font-medium group/btn"
                              onClick={() => router.push(`/blog/${post.id}`)}
                            >
                              Read Full Article
                              <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* All Articles Header - CODE1 STYLE */}
            <div className="mb-12">
              <h2 className="text-3xl font-sans font-bold text-primary mb-4">
                All Articles
                <span className="text-gray-800 ml-2">({filteredPosts.length})</span>
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-primary to-secondary rounded-full"></div>
              <p className="text-gray-600 mt-4">
                Browse our complete collection of grooming wisdom and insights
              </p>
            </div>

            {/* Blog Grid */}
            {filteredPosts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-12 h-12 text-gray-300" />
                </div>
                <h3 className="text-3xl font-sans font-bold text-primary mb-3">No Articles Found</h3>
                <p className="text-gray-500 font-light mb-8 max-w-md mx-auto">
                  {blogs.length === 0 
                    ? 'No blogs available. Check back soon for new articles!'
                    : 'No articles match your current filters. Try adjusting your search criteria or select a different category.'}
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedCategory('all'); 
                    setSearchQuery(''); 
                    setCurrentPage(1);
                  }}
                  className="rounded-full px-8 border-2 border-secondary text-secondary hover:bg-secondary hover:text-primary font-bold tracking-widest text-xs"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  CLEAR ALL FILTERS
                </Button>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {paginatedPosts.map((post) => (
                    <Card 
                      key={post.id} 
                      className="group bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 h-full"
                    >
                      {/* Post Image */}
                      <div className="relative h-48 overflow-hidden">
                        <img 
                          src={post.imageUrl} 
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074&auto=format&fit=crop';
                          }}
                        />
                        
                        {/* Category Badge - CODE1 STYLE */}
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-primary text-white px-3 py-1 rounded-full text-xs font-medium">
                            {post.category}
                          </Badge>
                        </div>
                        
                        {/* Bookmark Button */}
                        <button 
                          onClick={() => handleBookmark(post.id)}
                          className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center hover:bg-white transition-colors"
                        >
                          <Bookmark className={cn(
                            "w-4 h-4 transition-all",
                            bookmarkedPosts.has(post.id) ? "fill-current text-secondary" : "text-gray-400"
                          )} />
                        </button>
                      </div>
                      
                      <CardContent className="p-6 space-y-4">
                        {/* Post Metadata - CODE1 STYLE */}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {post.author.name}
                          </div>
                          <div className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {new Date(post.publishedDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {post.readTime}
                          </div>
                        </div>
                        
                        {/* Post Title - CODE1 STYLE */}
                        <h3 className="text-xl font-sans font-bold text-primary leading-tight line-clamp-2 group-hover:text-secondary transition-colors min-h-14">
                          {post.title}
                        </h3>
                        
                        {/* Excerpt - CODE1 STYLE */}
                        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 min-h-[60px]">
                          {post.excerpt}
                        </p>
                        
                        {/* Tags - CODE1 STYLE */}
                        <div className="flex flex-wrap gap-1">
                          {post.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs border-gray-200 text-gray-600">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                        
                        {/* Interaction Stats */}
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => handleLike(post.id)}
                              className={cn(
                                "flex items-center gap-1 text-xs transition-colors",
                                likedPosts.has(post.id) ? "text-red-500" : "text-gray-400 hover:text-red-500"
                              )}
                            >
                              <Heart className={cn(
                                "w-4 h-4 transition-all",
                                likedPosts.has(post.id) && "fill-current"
                              )} />
                              <span>{post.likes + (likedPosts.has(post.id) ? 1 : 0)}</span>
                            </button>
                            
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <MessageSquare className="w-4 h-4" />
                              <span>{post.comments}</span>
                            </div>
                            
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              <span>{post.views.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Read More Button - CODE1 STYLE */}
                        <Button 
                          variant="ghost" 
                          className="w-full justify-between text-primary hover:text-secondary hover:bg-secondary/5 p-0 h-auto font-medium group/btn mt-2"
                          onClick={() => router.push(`/blog/${post.id}`)}
                        >
                          Read More
                          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                {/* Pagination - CODE1 STYLE */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="rounded-full w-10 h-10 border-gray-200"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          onClick={() => setCurrentPage(pageNum)}
                          className={cn(
                            "rounded-full w-10 h-10 font-bold",
                            currentPage === pageNum 
                              ? "bg-primary text-white" 
                              : "border-gray-200 text-primary hover:border-secondary hover:text-secondary"
                          )}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="rounded-full w-10 h-10 border-gray-200"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Blog Stats - CODE1 STYLE */}
            {blogs.length > 0 && (
              <div className="mt-16 pt-8 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Total Articles */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Articles</p>
                        <p className="text-2xl font-bold text-primary">{blogs.length}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Total Authors */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Expert Authors</p>
                        <p className="text-2xl font-bold text-secondary">
                          {new Set(blogs.map(p => p.author.name)).size}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Total Views */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Views</p>
                        <p className="text-2xl font-bold text-green-600">
                          {blogs.reduce((sum, p) => sum + p.views, 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Total Engagement */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Engagement</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {blogs.reduce((sum, p) => sum + p.likes + p.comments, 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

          {/* Newsletter Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary to-primary/90">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-white font-black tracking-[0.3em] uppercase text-[10px]">Stay Informed</span>
          </div>
          <h2 className="text-4xl font-sans font-bold text-white mb-6">
            Join The Gentleman's Newsletter
          </h2>
          <p className="text-white/80 max-w-2xl mx-auto text-lg mb-8">
            Get weekly grooming tips, style insights, and exclusive content delivered to your inbox.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input 
              placeholder="Enter your email address" 
              className="flex-1 rounded-2xl border-white/20 bg-white/10 text-white placeholder:text-white/60 focus:ring-2 focus:ring-white focus:border-transparent"
            />
            <Button className="rounded-2xl bg-white text-primary hover:bg-white/90 font-black tracking-[0.2em] text-[10px] px-8 py-6">
              SUBSCRIBE NOW
            </Button>
          </div>
          
          <p className="text-white/60 text-sm mt-4">
            Join 15,000+ gentlemen who receive our weekly insights
          </p>
        </div>
      </section>
      
      </main>
     
    </div>
  );
}