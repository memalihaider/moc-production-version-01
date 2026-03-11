'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/shared/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarDays, 
  Clock, 
  User, 
  Tag, 
  MessageSquare, 
  ArrowLeft,
  Eye,
  Heart,
  Share2,
  Bookmark,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Firebase imports
import { 
  doc, 
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Types Definition
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
  createdAt: any;
}

interface RelatedPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  imageUrl: string;
  readTime: string;
  publishedDate: string;
}

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [comment, setComment] = useState('');

  // Fetch blog details
  useEffect(() => {
    if (slug) {
      fetchBlogDetails();
    }
  }, [slug]);

  const fetchBlogDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch the specific blog
      const blogDoc = await getDoc(doc(db, 'blogs', slug));
      
      if (blogDoc.exists()) {
        const data = blogDoc.data();
        const blogData: BlogPost = {
          id: blogDoc.id,
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
          imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074&auto=format&fit=crop',
          createdAt: data.createdAt
        };
        
        setBlog(blogData);
        
        // Fetch latest posts for related section
        await fetchLatestPosts(blogDoc.id);
      } else {
        // Blog not found
        setBlog(null);
      }
    } catch (error) {
      console.error('Error fetching blog details:', error);
      setBlog(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestPosts = async (currentBlogId: string) => {
    try {
      const blogsRef = collection(db, 'blogs');
      const q = query(
        blogsRef,
        orderBy('createdAt', 'desc'),
        limit(6)
      );
      
      const querySnapshot = await getDocs(q);
      const related: RelatedPost[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (doc.id !== currentBlogId && related.length < 3) {
          related.push({
            id: doc.id,
            title: data.title || '',
            excerpt: data.excerpt || '',
            category: data.category || 'Uncategorized',
            imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074&auto=format&fit=crop',
            readTime: data.readTime || '5 min read',
            publishedDate: data.publishedDate || new Date().toISOString().split('T')[0]
          });
        }
      });
      
      setRelatedPosts(related);
    } catch (error) {
      console.error('Error fetching latest posts:', error);
      setRelatedPosts([]);
    }
  };

  const handleLike = () => {
    setLiked(!liked);
    if (blog) {
      setBlog({
        ...blog,
        likes: liked ? blog.likes - 1 : blog.likes + 1
      });
    }
  };

  const handleBookmark = () => {
    setBookmarked(!bookmarked);
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = blog?.title || '';
    const text = blog?.excerpt || '';
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(text)}`,
      email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\nRead more: ${url}`)}`
    };
    
    if (platform === 'email') {
      window.location.href = shareUrls.email;
    } else {
      window.open(shareUrls[platform as keyof typeof shareUrls], '_blank', 'width=600,height=400');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfcfc]">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-gray-600">Loading article...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-[#fcfcfc]">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-20">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Eye className="w-12 h-12 text-gray-300" />
            </div>
            <h1 className="text-3xl font-sans font-bold text-primary mb-4">Article Not Found</h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              The blog article you're looking for doesn't exist or has been removed.
            </p>
            <Button
              onClick={() => router.push('/blog')}
              className="rounded-full px-8 bg-primary hover:bg-primary/90 font-bold tracking-widest text-[10px]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              BACK TO BLOGS
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      <Header />

      {/* Blog Hero Image */}
      <div className="relative h-[60vh] md:h-[70vh] overflow-hidden">
        <img 
          src={blog.imageUrl} 
          alt={blog.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074&auto=format&fit=crop';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>
        
        {/* Back Button */}
        <div className="absolute top-4 left-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/blog')}
            className="bg-white/90 backdrop-blur-sm hover:bg-white text-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blogs
          </Button>
        </div>
        
        {/* Featured Badge */}
        {blog.featured && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-secondary border-none px-3 py-1.5 text-[10px] font-black tracking-widest">
              FEATURED
            </Badge>
          </div>
        )}
        
        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-4xl mx-auto">
            <Badge className="bg-white/90 backdrop-blur-sm text-primary border-none px-3 py-1.5 text-[10px] font-black mb-4">
              {blog.category}
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-sans font-bold text-white mb-6 leading-tight">
              {blog.title}
            </h1>
            
            <p className="text-gray-200 text-lg md:text-xl max-w-3xl mb-8">
              {blog.excerpt}
            </p>
            
            {/* Author and Metadata */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-white border-2 border-white">
                  <img 
                    src={blog.author.avatar} 
                    alt={blog.author.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop';
                    }}
                  />
                </div>
                <div>
                  <p className="text-white font-bold text-lg">{blog.author.name}</p>
                  <p className="text-gray-300 text-sm">{blog.author.role}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6 text-white">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5" />
                  <span>{blog.publishedDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{blog.readTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  <span>{blog.views.toLocaleString()} views</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column - Main Article */}
          <div className="lg:col-span-2">
            {/* Tags */}
            {blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-8">
                {blog.tags.map((tag, index) => (
                  <Badge 
                    key={index}
                    variant="outline"
                    className="text-sm py-2 px-4 border-secondary/30 text-secondary hover:bg-secondary/10 cursor-pointer"
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Article Content */}
            <div className="mb-12">
              <div className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">
                {blog.content}
              </div>
              
              {!blog.content && (
                <div className="text-gray-500 italic">
                  Content will be added soon...
                </div>
              )}
            </div>

            {/* Interaction Bar */}
            <div className="flex items-center justify-between py-8 border-y border-gray-200 mb-12">
              <div className="flex items-center gap-6">
                <button 
                  onClick={handleLike}
                  className={cn(
                    "flex items-center gap-3 text-lg font-semibold transition-all",
                    liked ? "text-red-500" : "text-gray-600 hover:text-red-500"
                  )}
                >
                  <Heart className={cn(
                    "w-6 h-6 transition-all",
                    liked && "fill-current animate-pulse"
                  )} />
                  <span>{blog.likes} Likes</span>
                </button>
                
                <div className="flex items-center gap-3 text-lg font-semibold text-gray-600">
                  <MessageSquare className="w-6 h-6" />
                  <span>{blog.comments} Comments</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleBookmark}
                  className={cn(
                    "p-3 rounded-full transition-colors",
                    bookmarked 
                      ? "bg-secondary/20 text-secondary" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  <Bookmark className={cn(
                    "w-5 h-5",
                    bookmarked && "fill-current"
                  )} />
                </button>
                
                <div className="relative group">
                  <button className="p-3 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                    <Share2 className="w-5 h-5" />
                  </button>
                  
                  {/* Share Dropdown */}
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border p-3 min-w-[200px] hidden group-hover:block z-10">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Share this article</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => handleShare('facebook')}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                      >
                        <Facebook className="w-4 h-4" />
                        <span className="text-sm">Facebook</span>
                      </button>
                      <button 
                        onClick={() => handleShare('twitter')}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-sky-50 text-sky-500 transition-colors"
                      >
                        <Twitter className="w-4 h-4" />
                        <span className="text-sm">Twitter</span>
                      </button>
                      <button 
                        onClick={() => handleShare('linkedin')}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 text-blue-700 transition-colors"
                      >
                        <Linkedin className="w-4 h-4" />
                        <span className="text-sm">LinkedIn</span>
                      </button>
                      <button 
                        onClick={() => handleShare('email')}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">Email</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            {/* Author Bio */}
            <Card className="border-0 shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center mb-6">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 mb-4 border-4 border-white shadow-lg">
                    <img 
                      src={blog.author.avatar} 
                      alt={blog.author.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop';
                      }}
                    />
                  </div>
                  <h4 className="text-xl font-sans font-bold text-primary mb-2">{blog.author.name}</h4>
                  <p className="text-secondary font-semibold mb-3">{blog.author.role}</p>
                  <p className="text-gray-600 text-sm">
                    Expert in grooming and men's lifestyle. Passionate about sharing knowledge and helping gentlemen look their best.
                  </p>
                </div>
                
                <Button 
                  className="w-full rounded-2xl bg-primary hover:bg-primary/90 font-bold tracking-[0.2em] text-[10px] h-12"
                  onClick={() => router.push('/blog')}
                >
                  VIEW ALL ARTICLES
                </Button>
              </CardContent>
            </Card>

            {/* Latest Articles */}
            {relatedPosts.length > 0 && (
              <Card className="border-0 shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="w-5 h-5 text-secondary" />
                    <h3 className="text-xl font-sans font-bold text-primary">Latest Articles</h3>
                  </div>
                  
                  <div className="space-y-6">
                    {relatedPosts.map((post) => (
                      <Link 
                        key={post.id} 
                        href={`/blog/${post.id}`}
                        className="group block"
                      >
                        <div className="flex gap-4">
                          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                            <img 
                              src={post.imageUrl} 
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.currentTarget.src = 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074&auto=format&fit=crop';
                              }}
                            />
                          </div>
                          <div>
                            <Badge variant="outline" className="text-[10px] mb-2">
                              {post.category}
                            </Badge>
                            <h4 className="font-bold text-primary group-hover:text-secondary transition-colors line-clamp-2">
                              {post.title}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                              <Clock className="w-3 h-3" />
                              <span>{post.readTime}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  
                  <Button
                    variant="ghost"
                    className="w-full mt-6 rounded-xl text-secondary hover:text-primary hover:bg-secondary/10"
                    onClick={() => router.push('/blog')}
                  >
                    View All Articles <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Popular Tags */}
            <Card className="border-0 shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2.5rem] overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-center gap-2 mb-6">
                  <Tag className="w-5 h-5 text-secondary" />
                  <h3 className="text-xl font-sans font-bold text-primary">Article Tags</h3>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  {blog.tags.slice(0, 8).map((tag, index) => (
                    <Badge 
                      key={index}
                      variant="outline"
                      className="text-sm py-2 px-4 border-gray-200 text-gray-600 hover:border-secondary hover:text-secondary hover:bg-secondary/10 cursor-pointer transition-all"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-sans font-bold text-primary mb-6">
            Explore More Articles
          </h2>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
            Discover more grooming wisdom, style guides, and expert insights in our complete collection.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push('/blog')}
              className="rounded-full px-8 bg-primary hover:bg-primary/90 font-bold tracking-widest text-[10px] py-6"
            >
              BROWSE ALL ARTICLES
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="rounded-full px-8 border-secondary text-secondary hover:bg-secondary hover:text-primary font-bold tracking-widest text-[10px] py-6"
            >
              BACK TO HOME
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}