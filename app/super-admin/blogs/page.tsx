'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Save, 
  X, 
  Upload, 
  Image as ImageIcon,
  Calendar,
  Clock,
  User,
  Tag,
  MessageSquare,
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Firebase imports
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  query,
  orderBy,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ImageField } from '@/components/ui/image-field';
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
  updatedAt: any;
}

// Categories for dropdown
const categories = [
  'Grooming',
  'Skincare',
  'Tools',
  'Psychology',
  'Hair Care',
  'Products',
  'Style',
  'Wellness',
  'Fashion'
];

// Popular tags for suggestions
const tagSuggestions = [
  'Beard Care', 'Grooming Tips', 'Skincare', 'Wellness', 'Barber Tools',
  'Home Grooming', 'Psychology', 'Success', 'Confidence', 'Hair Care',
  'Seasonal', 'Ingredients', 'Natural Products', 'Style', 'Health',
  'Fashion', 'Lifestyle', 'Professional', 'Routine', 'Maintenance'
];

export default function AdminBlogPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [currentBlog, setCurrentBlog] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    authorName: '',
    authorRole: '',
    authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop',
    category: 'Grooming',
    tags: [] as string[],
    readTime: '5 min read',
    imageUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074&auto=format&fit=crop',
    featured: false,
    views: 0,
    likes: 0,
    comments: 0
  });

  // Alert state
  const [alert, setAlert] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info';
    message: string;
  }>({
    show: false,
    type: 'info',
    message: ''
  });

  // Fetch blogs from Firebase
  const fetchBlogs = async () => {
    try {
      setLoading(true);
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
          imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074&auto=format&fit=crop',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });
      
      setBlogs(blogsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      showAlert('error', 'Failed to fetch blogs');
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchBlogs();
  }, []);

  // Show alert function
  const showAlert = (type: 'success' | 'error' | 'info', message: string) => {
    setAlert({ show: true, type, message });
    setTimeout(() => {
      setAlert(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle tag input
  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      const newTag = e.currentTarget.value.trim();
      if (!formData.tags.includes(newTag)) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
      }
      e.currentTarget.value = '';
      e.preventDefault();
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Add tag from suggestions
  const addTagFromSuggestion = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      authorName: '',
      authorRole: '',
      authorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop',
      category: 'Grooming',
      tags: [],
      readTime: '5 min read',
      imageUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074&auto=format&fit=crop',
      featured: false,
      views: 0,
      likes: 0,
      comments: 0
    });
    setIsEditing(false);
    setCurrentBlog(null);
  };

  // Edit blog
  const handleEdit = (blog: BlogPost) => {
    setFormData({
      title: blog.title,
      excerpt: blog.excerpt,
      content: blog.content,
      authorName: blog.author.name,
      authorRole: blog.author.role,
      authorAvatar: blog.author.avatar,
      category: blog.category,
      tags: [...blog.tags],
      readTime: blog.readTime,
      imageUrl: blog.imageUrl,
      featured: blog.featured,
      views: blog.views,
      likes: blog.likes,
      comments: blog.comments
    });
    setCurrentBlog(blog);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save blog (Create or Update)
  const handleSave = async () => {
    // Validation
    if (!formData.title.trim() || !formData.excerpt.trim() || !formData.content.trim()) {
      showAlert('error', 'Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const blogData = {
        title: formData.title.trim(),
        excerpt: formData.excerpt.trim(),
        content: formData.content.trim(),
        author: {
          name: formData.authorName.trim() || 'Admin',
          role: formData.authorRole.trim() || 'Author',
          avatar: formData.authorAvatar.trim()
        },
        category: formData.category,
        tags: formData.tags,
        readTime: formData.readTime,
        imageUrl: formData.imageUrl.trim(),
        featured: formData.featured,
        views: formData.views,
        likes: formData.likes,
        comments: formData.comments,
        publishedDate: new Date().toISOString().split('T')[0],
        updatedAt: serverTimestamp()
      };

      if (isEditing && currentBlog) {
        // Update existing blog
        await updateDoc(doc(db, 'blogs', currentBlog.id), blogData);
        showAlert('success', 'Blog updated successfully!');
      } else {
        // Create new blog
        await addDoc(collection(db, 'blogs'), {
          ...blogData,
          createdAt: serverTimestamp()
        });
        showAlert('success', 'Blog created successfully!');
      }

      // Refresh blogs
      fetchBlogs();
      resetForm();
      
    } catch (error) {
      console.error('Error saving blog:', error);
      showAlert('error', 'Failed to save blog');
    } finally {
      setSaving(false);
    }
  };

  // Delete blog
  const handleDelete = async (blogId: string) => {
    if (!confirm('Are you sure you want to delete this blog? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'blogs', blogId));
      showAlert('success', 'Blog deleted successfully!');
      fetchBlogs();
    } catch (error) {
      console.error('Error deleting blog:', error);
      showAlert('error', 'Failed to delete blog');
    }
  };

  // Filter blogs
  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = searchQuery === '' || 
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
      blog.category === selectedCategory;
    
    const matchesFeatured = !showFeaturedOnly || blog.featured;
    
    return matchesSearch && matchesCategory && matchesFeatured;
  });

  // Stats
  const totalBlogs = blogs.length;
  const featuredBlogs = blogs.filter(blog => blog.featured).length;
  const totalViews = blogs.reduce((sum, blog) => sum + blog.views, 0);
  const totalEngagement = blogs.reduce((sum, blog) => sum + blog.likes + blog.comments, 0);

  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      <Header />

      {/* Alert */}
      {alert.show && (
        <div className={cn(
          "fixed top-20 right-4 z-50 max-w-md animate-in slide-in-from-right",
          "p-4 rounded-lg shadow-lg border",
          alert.type === 'success' ? "bg-green-50 text-green-800 border-green-200" :
          alert.type === 'error' ? "bg-red-50 text-red-800 border-red-200" :
          "bg-blue-50 text-blue-800 border-blue-200"
        )}>
          <div className="flex items-center gap-3">
            {alert.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : alert.type === 'error' ? (
              <AlertCircle className="w-5 h-5" />
            ) : null}
            <p className="font-medium">{alert.message}</p>
          </div>
        </div>
      )}

      {/* Admin Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-secondary blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary blur-[120px] animate-pulse"></div>
        </div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-secondary/20 px-4 py-2 rounded-full mb-6 border border-secondary/30">
            <Edit className="w-4 h-4 text-secondary" />
            <span className="text-secondary font-black tracking-[0.3em] uppercase text-[10px]">Admin Portal</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-sans font-bold text-white mb-6 leading-tight">
            Blog Content <span className="text-secondary italic">Manager</span>
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg font-light leading-relaxed mb-8">
            Manage and publish articles for The ManofCave Journal
          </p>
          
          {/* Admin Stats */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-3">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-secondary" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Total Blogs</p>
                  <p className="text-2xl font-bold text-white">{totalBlogs}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-3">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-secondary" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Total Views</p>
                  <p className="text-2xl font-bold text-white">{totalViews.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-3">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-secondary" />
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Featured</p>
                  <p className="text-2xl font-bold text-white">{featuredBlogs}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Blog Form */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-0 shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2.5rem]">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-sans font-bold text-primary">
                  {isEditing ? 'Edit Blog Post' : 'Create New Blog'}
                </CardTitle>
                <CardDescription>
                  {isEditing ? 'Update the blog post details' : 'Fill in the details for a new blog post'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Title *
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter blog title"
                    className="rounded-xl"
                  />
                </div>

                {/* Excerpt */}
                <div className="space-y-2">
                  <Label htmlFor="excerpt" className="text-sm font-medium">
                    Excerpt *
                  </Label>
                  <Textarea
                    id="excerpt"
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleInputChange}
                    placeholder="Enter short description"
                    rows={3}
                    className="rounded-xl"
                  />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label htmlFor="content" className="text-sm font-medium">
                    Content *
                  </Label>
                  <Textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="Enter blog content"
                    rows={6}
                    className="rounded-xl font-mono text-sm"
                  />
                </div>

                {/* Author Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="authorName" className="text-sm font-medium">
                      Author Name
                    </Label>
                    <Input
                      id="authorName"
                      name="authorName"
                      value={formData.authorName}
                      onChange={handleInputChange}
                      placeholder="Author name"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="authorRole" className="text-sm font-medium">
                      Author Role
                    </Label>
                    <Input
                      id="authorRole"
                      name="authorRole"
                      value={formData.authorRole}
                      onChange={handleInputChange}
                      placeholder="Author role"
                      className="rounded-xl"
                    />
                  </div>
                </div>

                {/* Featured Image */}
                <div className="space-y-2">
                  <ImageField
                    label="Featured Image"
                    value={formData.imageUrl}
                    onChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
                    folder="images/blogs"
                    placeholder="https://images.unsplash.com/..."
                    inputId="sa-blog-imageUrl"
                  />
                </div>

                {/* Category and Read Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-medium">
                      Category
                    </Label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-secondary focus:border-transparent"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="readTime" className="text-sm font-medium">
                      Read Time
                    </Label>
                    <Input
                      id="readTime"
                      name="readTime"
                      value={formData.readTime}
                      onChange={handleInputChange}
                      placeholder="5 min read"
                      className="rounded-xl"
                    />
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label htmlFor="tags" className="text-sm font-medium">
                    Tags
                  </Label>
                  <Input
                    id="tags"
                    placeholder="Type tag and press Enter"
                    onKeyDown={handleTagInput}
                    className="rounded-xl"
                  />
                  
                  {/* Tag Suggestions */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tagSuggestions.slice(0, 5).map(tag => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer hover:bg-secondary hover:text-white transition-colors"
                        onClick={() => addTagFromSuggestion(tag)}
                      >
                        + {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Selected Tags */}
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formData.tags.map(tag => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="gap-1 pr-2"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Featured Switch */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Featured Post</Label>
                    <p className="text-xs text-gray-500">Show this post in featured section</p>
                  </div>
                  <Switch
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                  />
                </div>

                {/* Stats Inputs */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="views" className="text-sm font-medium">
                      Views
                    </Label>
                    <Input
                      id="views"
                      name="views"
                      type="number"
                      value={formData.views}
                      onChange={(e) => setFormData(prev => ({ ...prev, views: parseInt(e.target.value) || 0 }))}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="likes" className="text-sm font-medium">
                      Likes
                    </Label>
                    <Input
                      id="likes"
                      name="likes"
                      type="number"
                      value={formData.likes}
                      onChange={(e) => setFormData(prev => ({ ...prev, likes: parseInt(e.target.value) || 0 }))}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comments" className="text-sm font-medium">
                      Comments
                    </Label>
                    <Input
                      id="comments"
                      name="comments"
                      type="number"
                      value={formData.comments}
                      onChange={(e) => setFormData(prev => ({ ...prev, comments: parseInt(e.target.value) || 0 }))}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6">
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 rounded-2xl bg-primary hover:bg-primary/90 font-black tracking-[0.2em] text-[10px] h-12"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        SAVING...
                      </>
                    ) : isEditing ? (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        UPDATE BLOG
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        CREATE BLOG
                      </>
                    )}
                  </Button>
                  
                  {(isEditing || formData.title || formData.excerpt) && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      className="rounded-2xl font-black tracking-[0.2em] text-[10px] h-12"
                    >
                      <X className="w-4 h-4 mr-2" />
                      CLEAR
                    </Button>
                  )}
                </div>

                {/* Preview Button */}
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full rounded-xl"
                  onClick={() => {
                    if (currentBlog) {
                      router.push(`/blog/${currentBlog.id}`);
                    } else {
                      showAlert('info', 'Save the blog first to preview');
                    }
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Blog
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-0 shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2.5rem]">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-sans font-bold text-primary">
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Blogs</span>
                  <span className="font-bold text-primary">{totalBlogs}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Featured Blogs</span>
                  <span className="font-bold text-secondary">{featuredBlogs}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Views</span>
                  <span className="font-bold text-green-600">{totalViews.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Engagement</span>
                  <span className="font-bold text-blue-600">{totalEngagement.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Blogs List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters Bar */}
            <Card className="border-0 shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2.5rem]">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                  {/* Search */}
                  <div className="relative w-full lg:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search blogs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 rounded-xl"
                    />
                  </div>

                  {/* Category Filter */}
                  <div className="flex items-center gap-4">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-secondary focus:border-transparent"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>

                    {/* Featured Filter */}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={showFeaturedOnly}
                        onCheckedChange={setShowFeaturedOnly}
                      />
                      <Label className="text-sm">Featured Only</Label>
                    </div>

                    {/* Refresh Button */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={fetchBlogs}
                      className="rounded-xl"
                      disabled={loading}
                    >
                      <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Blogs List */}
            {loading ? (
              <Card className="border-0 shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2.5rem]">
                <CardContent className="p-12 text-center">
                  <RefreshCw className="w-12 h-12 text-gray-300 animate-spin mx-auto mb-4" />
                  <p className="text-gray-500">Loading blogs...</p>
                </CardContent>
              </Card>
            ) : filteredBlogs.length === 0 ? (
              <Card className="border-0 shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2.5rem]">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Edit className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-2xl font-sans font-bold text-primary mb-3">No Blogs Found</h3>
                  <p className="text-gray-500 font-light mb-8 max-w-md mx-auto">
                    {searchQuery || selectedCategory !== 'all' || showFeaturedOnly
                      ? 'No blogs match your current filters.'
                      : 'No blogs found. Create your first blog post!'}
                  </p>
                  <Button
                    onClick={resetForm}
                    className="rounded-full px-8 bg-primary hover:bg-primary/90 font-bold tracking-widest text-[10px]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    CREATE FIRST BLOG
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {filteredBlogs.map(blog => (
                  <Card 
                    key={blog.id} 
                    className={cn(
                      "border-2 transition-all duration-300 rounded-[2.5rem] overflow-hidden",
                      blog.featured ? "border-secondary/30 shadow-lg" : "border-gray-100 shadow-sm"
                    )}
                  >
                    <div className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Blog Image */}
                        <div className="lg:w-48 lg:h-32 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                          <img 
                            src={blog.imageUrl} 
                            alt={blog.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Blog Content */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                {blog.featured && (
                                  <Badge className="bg-secondary border-none px-2 py-1 text-[10px] font-black">
                                    FEATURED
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-[10px]">
                                  {blog.category}
                                </Badge>
                              </div>
                              <h3 className="text-xl font-sans font-bold text-primary line-clamp-1">
                                {blog.title}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(blog)}
                                className="rounded-xl"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(blog.id)}
                                className="rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {blog.excerpt}
                          </p>
                          
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            {/* Author and Date */}
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
                                <img 
                                  src={blog.author.avatar} 
                                  alt={blog.author.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-primary">{blog.author.name}</p>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{blog.publishedDate}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{blog.readTime}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Stats */}
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Eye className="w-4 h-4" />
                                <span>{blog.views.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <TrendingUp className="w-4 h-4" />
                                <span>{blog.likes}</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <MessageSquare className="w-4 h-4" />
                                <span>{blog.comments}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Tags */}
                          {blog.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                              {blog.tags.slice(0, 3).map(tag => (
                                <Badge 
                                  key={tag}
                                  variant="outline"
                                  className="text-[10px]"
                                >
                                  #{tag}
                                </Badge>
                              ))}
                              {blog.tags.length > 3 && (
                                <Badge variant="outline" className="text-[10px] text-gray-400">
                                  +{blog.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Firebase Instructions */}
            
          </div>
        </div>
      </div>
    </div>
  );
}