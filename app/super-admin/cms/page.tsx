'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/shared/Header';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus, Edit, Trash2, Save, X, Upload, Image as ImageIcon,
  Video, GripVertical, Eye, EyeOff, Settings, Layout,
  Layers, Monitor, RefreshCw, ChevronUp, ChevronDown, Globe
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useCMSStore, HeroSlide, CMSSection, CMSSettings, PageHero } from '@/stores/cms.store';
import { uploadImageToStorage, deleteImageFromStorage } from '@/lib/firebase-storage';
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// Upload media (image or video) to Firebase Storage
async function uploadMedia(
  file: File,
  folder: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${folder}/${timestamp}_${safeName}`;
  const storageRef = ref(storage, path);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
    });
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress) {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(progress);
        }
      },
      (error) => reject(new Error(`Upload failed: ${error.message}`)),
      async () => {
        try {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

export default function SuperAdminCMSPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const {
    heroSlides, sections, settings, pageHeroes,
    fetchCMSData, subscribeToHeroSlides, subscribeToSections, subscribeToSettings, subscribeToPageHeroes,
    saveHeroSlide, deleteHeroSlide, saveSection, saveSettings, savePageHero,
    getSectionByKey, getPageHero,
  } = useCMSStore();

  const [activeTab, setActiveTab] = useState('hero');
  const [editingSlide, setEditingSlide] = useState<Partial<HeroSlide> | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [sectionForm, setSectionForm] = useState<Partial<CMSSection>>({});
  const [settingsForm, setSettingsForm] = useState<Partial<CMSSettings>>({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [editingPageHero, setEditingPageHero] = useState<string | null>(null);
  const [pageHeroForm, setPageHeroForm] = useState<Partial<PageHero>>({});
  const [pageHeroUploading, setPageHeroUploading] = useState(false);
  const [pageHeroUploadProgress, setPageHeroUploadProgress] = useState(0);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch + subscribe
  useEffect(() => {
    fetchCMSData();
    const unsub1 = subscribeToHeroSlides();
    const unsub2 = subscribeToSections();
    const unsub3 = subscribeToSettings();
    const unsub4 = subscribeToPageHeroes();
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
  }, [fetchCMSData, subscribeToHeroSlides, subscribeToSections, subscribeToSettings, subscribeToPageHeroes]);

  // Init settings form
  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  const showSave = (msg: string) => {
    setSaveMessage(msg);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  // ==================== HERO SLIDE HANDLERS ====================
  const handleNewSlide = () => {
    setEditingSlide({
      type: 'image',
      url: '',
      heading: '',
      subHeading: '',
      ctaText: 'RESERVE YOUR SERVICE',
      ctaLink: '/services',
      ctaSecondaryText: 'VIEW OUR MENU',
      ctaSecondaryLink: '/services',
      order: heroSlides.length,
      isActive: true,
    });
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB video, 10MB image

    if (file.size > maxSize) {
      alert(`File too large. Max ${isVideo ? '100MB' : '10MB'}.`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    try {
      const url = await uploadMedia(file, 'cms/hero', (p) => setUploadProgress(p));
      setEditingSlide(prev => ({
        ...prev,
        url,
        type: isVideo ? 'video' : 'image',
      }));
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload media. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSaveSlide = async () => {
    if (!editingSlide?.url) {
      alert('Please upload an image or video first.');
      return;
    }
    setIsSaving(true);
    try {
      await saveHeroSlide(editingSlide);
      setEditingSlide(null);
      showSave('Hero slide saved!');
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save slide.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSlide = async (slide: HeroSlide) => {
    if (!confirm('Delete this slide?')) return;
    try {
      if (slide.url) {
        await deleteImageFromStorage(slide.url).catch(() => {});
      }
      await deleteHeroSlide(slide.id);
      showSave('Slide deleted!');
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleMoveSlide = async (slide: HeroSlide, direction: 'up' | 'down') => {
    const sorted = [...heroSlides].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(s => s.id === slide.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    await saveHeroSlide({ ...sorted[idx], order: sorted[swapIdx].order });
    await saveHeroSlide({ ...sorted[swapIdx], order: sorted[idx].order });
  };

  // ==================== SECTION HANDLERS ====================
  const sectionKeys = ['services', 'products', 'offers', 'memberships', 'staff', 'branches', 'cta', 'featured_in'];

  const handleEditSection = (key: string) => {
    const section = getSectionByKey(key);
    if (section) {
      setSectionForm(section);
      setEditingSection(key);
    }
  };

  const handleSaveSection = async () => {
    if (!editingSection) return;
    setIsSaving(true);
    try {
      await saveSection({ ...sectionForm, sectionKey: editingSection });
      setEditingSection(null);
      setSectionForm({});
      showSave('Section updated!');
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save section.');
    } finally {
      setIsSaving(false);
    }
  };

  // ==================== SETTINGS HANDLERS ====================
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await saveSettings(settingsForm);
      showSave('Settings saved!');
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // ==================== PAGE HERO HANDLERS ====================
  const pageHeroKeys = ['services', 'products', 'branches', 'blog', 'menu'];

  const handleEditPageHero = (key: string) => {
    const hero = getPageHero(key);
    if (hero) {
      setPageHeroForm(hero);
      setEditingPageHero(key);
    }
  };

  const handlePageHeroMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;

    if (file.size > maxSize) {
      alert(`File too large. Max ${isVideo ? '100MB' : '10MB'}.`);
      return;
    }

    setPageHeroUploading(true);
    setPageHeroUploadProgress(0);
    try {
      const url = await uploadMedia(file, 'cms/page-heroes', (p) => setPageHeroUploadProgress(p));
      setPageHeroForm(prev => ({
        ...prev,
        backgroundUrl: url,
        backgroundType: isVideo ? 'video' : 'image',
      }));
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload media.');
    } finally {
      setPageHeroUploading(false);
      setPageHeroUploadProgress(0);
    }
  };

  const handleSavePageHero = async () => {
    if (!editingPageHero) return;
    setIsSaving(true);
    try {
      await savePageHero({ ...pageHeroForm, pageKey: editingPageHero });
      setEditingPageHero(null);
      setPageHeroForm({});
      showSave('Page hero updated!');
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save page hero.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => router.push('/login');

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <RefreshCw className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex pt-14">
        <AdminSidebar role="super_admin" onLogout={handleLogout} />
        <main className="flex-1 md:ml-0 p-4 md:p-6 lg:p-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Layout className="w-7 h-7 text-secondary" />
                CMS Manager
              </h1>
              <p className="text-gray-500 text-sm mt-1">Manage your website content, hero slides, and sections</p>
            </div>
            {saveMessage && (
              <Badge className="bg-green-100 text-green-800 px-4 py-2 text-sm animate-in fade-in">
                {saveMessage}
              </Badge>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white border shadow-sm p-1 rounded-xl">
              <TabsTrigger value="hero" className="rounded-lg gap-2 data-[state=active]:bg-secondary data-[state=active]:text-primary">
                <Monitor className="w-4 h-4" /> Hero Slides
              </TabsTrigger>
              <TabsTrigger value="sections" className="rounded-lg gap-2 data-[state=active]:bg-secondary data-[state=active]:text-primary">
                <Layers className="w-4 h-4" /> Sections
              </TabsTrigger>
              <TabsTrigger value="page-heroes" className="rounded-lg gap-2 data-[state=active]:bg-secondary data-[state=active]:text-primary">
                <Globe className="w-4 h-4" /> Page Heroes
              </TabsTrigger>
              <TabsTrigger value="settings" className="rounded-lg gap-2 data-[state=active]:bg-secondary data-[state=active]:text-primary">
                <Settings className="w-4 h-4" /> Site Settings
              </TabsTrigger>
            </TabsList>

            {/* ==================== HERO SLIDES TAB ==================== */}
            <TabsContent value="hero" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Hero Background Slides</h2>
                <Button onClick={handleNewSlide} className="bg-secondary hover:bg-secondary/90 text-primary gap-2">
                  <Plus className="w-4 h-4" /> Add Slide
                </Button>
              </div>

              {/* Slide Editor Modal */}
              {editingSlide && (
                <Card className="border-secondary/30 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {editingSlide.id ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                      {editingSlide.id ? 'Edit Slide' : 'New Slide'}
                    </CardTitle>
                    <CardDescription>Upload an image or video for the hero background slider</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Media Upload */}
                    <div className="space-y-3">
                      <Label className="font-semibold">Background Media</Label>
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-secondary/50 transition-colors">
                        {editingSlide.url ? (
                          <div className="space-y-3">
                            {editingSlide.type === 'video' ? (
                              <video src={editingSlide.url} className="w-full max-h-48 object-cover rounded-lg" controls muted />
                            ) : (
                              <div className="relative w-full h-48 rounded-lg overflow-hidden">
                                <Image src={editingSlide.url} alt="Slide preview" fill className="object-cover" />
                              </div>
                            )}
                            <Badge variant="outline" className="uppercase">
                              {editingSlide.type}
                            </Badge>
                          </div>
                        ) : (
                          <div className="py-4">
                            <div className="flex justify-center gap-3 mb-3">
                              <ImageIcon className="w-8 h-8 text-gray-400" />
                              <Video className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-500">Drop image or video, or click to browse</p>
                            <p className="text-xs text-gray-400 mt-1">Images: JPG, PNG, WebP (max 10MB) • Videos: MP4, WebM (max 100MB)</p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleMediaUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          style={{ position: 'relative' }}
                          disabled={isUploading}
                        />
                        {isUploading && (
                          <div className="mt-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-secondary h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{uploadProgress}% uploaded</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Heading</Label>
                        <Input
                          value={editingSlide.heading || ''}
                          onChange={(e) => setEditingSlide(prev => ({ ...prev, heading: e.target.value }))}
                          placeholder="Unleash Your Raw Potential"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Sub Heading</Label>
                        <Input
                          value={editingSlide.subHeading || ''}
                          onChange={(e) => setEditingSlide(prev => ({ ...prev, subHeading: e.target.value }))}
                          placeholder="Primal grooming for the modern man"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Primary CTA Text</Label>
                        <Input
                          value={editingSlide.ctaText || ''}
                          onChange={(e) => setEditingSlide(prev => ({ ...prev, ctaText: e.target.value }))}
                          placeholder="RESERVE YOUR SERVICE"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Primary CTA Link</Label>
                        <Input
                          value={editingSlide.ctaLink || ''}
                          onChange={(e) => setEditingSlide(prev => ({ ...prev, ctaLink: e.target.value }))}
                          placeholder="/services"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Secondary CTA Text</Label>
                        <Input
                          value={editingSlide.ctaSecondaryText || ''}
                          onChange={(e) => setEditingSlide(prev => ({ ...prev, ctaSecondaryText: e.target.value }))}
                          placeholder="VIEW OUR MENU"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Secondary CTA Link</Label>
                        <Input
                          value={editingSlide.ctaSecondaryLink || ''}
                          onChange={(e) => setEditingSlide(prev => ({ ...prev, ctaSecondaryLink: e.target.value }))}
                          placeholder="/services"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Switch
                        checked={editingSlide.isActive ?? true}
                        onCheckedChange={(checked) => setEditingSlide(prev => ({ ...prev, isActive: checked }))}
                      />
                      <Label>Active</Label>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button onClick={handleSaveSlide} disabled={isSaving || isUploading} className="bg-secondary hover:bg-secondary/90 text-primary gap-2">
                        <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Slide'}
                      </Button>
                      <Button variant="outline" onClick={() => setEditingSlide(null)}>
                        <X className="w-4 h-4 mr-1" /> Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Slides List */}
              <div className="grid gap-4">
                {heroSlides.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-12 text-center text-gray-500">
                      <Monitor className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">No hero slides yet</p>
                      <p className="text-sm">Add your first slide to create a beautiful hero background slider</p>
                    </CardContent>
                  </Card>
                ) : (
                  heroSlides.sort((a, b) => a.order - b.order).map((slide, index) => (
                    <Card key={slide.id} className={cn('transition-all', !slide.isActive && 'opacity-50')}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col gap-1">
                            <button onClick={() => handleMoveSlide(slide, 'up')} disabled={index === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <GripVertical className="w-4 h-4 text-gray-300" />
                            <button onClick={() => handleMoveSlide(slide, 'down')} disabled={index === heroSlides.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30">
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Preview */}
                          <div className="w-32 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                            {slide.type === 'video' ? (
                              <video src={slide.url} className="w-full h-full object-cover" muted />
                            ) : (
                              <div className="relative w-full h-full">
                                <Image src={slide.url} alt={slide.heading || 'Slide'} fill className="object-cover" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-[10px] uppercase">
                                {slide.type === 'video' ? <Video className="w-3 h-3 mr-1" /> : <ImageIcon className="w-3 h-3 mr-1" />}
                                {slide.type}
                              </Badge>
                              {slide.isActive ? (
                                <Badge className="bg-green-100 text-green-700 text-[10px]"><Eye className="w-3 h-3 mr-1" /> Active</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px]"><EyeOff className="w-3 h-3 mr-1" /> Hidden</Badge>
                              )}
                              <span className="text-[10px] text-gray-400">#{index + 1}</span>
                            </div>
                            <p className="font-semibold text-sm truncate">{slide.heading || 'No heading'}</p>
                            <p className="text-xs text-gray-500 truncate">{slide.subHeading || 'No sub heading'}</p>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2 shrink-0">
                            <Button size="sm" variant="outline" onClick={() => setEditingSlide(slide)} className="gap-1">
                              <Edit className="w-3 h-3" /> Edit
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteSlide(slide)} className="gap-1 text-red-600 hover:bg-red-50 hover:text-red-700">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* ==================== SECTIONS TAB ==================== */}
            <TabsContent value="sections" className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900">Home Page Sections</h2>
              <p className="text-sm text-gray-500">Customize headings, descriptions, badges, and visibility for each section on your website.</p>

              {/* Section Editor Modal */}
              {editingSection && (
                <Card className="border-secondary/30 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Edit className="w-5 h-5" /> Edit: {editingSection.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Section Heading</Label>
                        <Input
                          value={sectionForm.heading || ''}
                          onChange={(e) => setSectionForm(p => ({ ...p, heading: e.target.value }))}
                          placeholder="Section heading..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Sub Heading / Badge</Label>
                        <Input
                          value={sectionForm.badgeText || ''}
                          onChange={(e) => setSectionForm(p => ({ ...p, badgeText: e.target.value }))}
                          placeholder="Badge text..."
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={sectionForm.description || ''}
                        onChange={(e) => setSectionForm(p => ({ ...p, description: e.target.value }))}
                        placeholder="Section description..."
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>CTA Button Text</Label>
                        <Input
                          value={sectionForm.ctaText || ''}
                          onChange={(e) => setSectionForm(p => ({ ...p, ctaText: e.target.value }))}
                          placeholder="VIEW ALL"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>CTA Button Link</Label>
                        <Input
                          value={sectionForm.ctaLink || ''}
                          onChange={(e) => setSectionForm(p => ({ ...p, ctaLink: e.target.value }))}
                          placeholder="/services"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Secondary CTA Text</Label>
                        <Input
                          value={sectionForm.ctaSecondaryText || ''}
                          onChange={(e) => setSectionForm(p => ({ ...p, ctaSecondaryText: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Secondary CTA Link</Label>
                        <Input
                          value={sectionForm.ctaSecondaryLink || ''}
                          onChange={(e) => setSectionForm(p => ({ ...p, ctaSecondaryLink: e.target.value }))}
                        />
                      </div>
                    </div>

                    {editingSection === 'featured_in' && (
                      <div className="space-y-2">
                        <Label>Brand Names (comma separated)</Label>
                        <Input
                          value={sectionForm.extraData?.brands || ''}
                          onChange={(e) => setSectionForm(p => ({
                            ...p,
                            extraData: { ...p.extraData, brands: e.target.value }
                          }))}
                          placeholder="GQ, VOGUE, ESQUIRE, FORBES"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <Switch
                        checked={sectionForm.isVisible ?? true}
                        onCheckedChange={(checked) => setSectionForm(p => ({ ...p, isVisible: checked }))}
                      />
                      <Label>Visible on website</Label>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button onClick={handleSaveSection} disabled={isSaving} className="bg-secondary hover:bg-secondary/90 text-primary gap-2">
                        <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Section'}
                      </Button>
                      <Button variant="outline" onClick={() => { setEditingSection(null); setSectionForm({}); }}>
                        <X className="w-4 h-4 mr-1" /> Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sections Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sectionKeys.map((key) => {
                  const section = getSectionByKey(key);
                  if (!section) return null;
                  return (
                    <Card key={key} className={cn('transition-all hover:shadow-md', !section.isVisible && 'opacity-50')}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                              {key.replace('_', ' ')}
                            </Badge>
                            {section.isVisible ? (
                              <Badge className="bg-green-100 text-green-700 text-[10px]">Visible</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-gray-400">Hidden</Badge>
                            )}
                          </div>
                          <Button size="sm" variant="outline" onClick={() => handleEditSection(key)} className="gap-1">
                            <Edit className="w-3 h-3" /> Edit
                          </Button>
                        </div>
                        <h3 className="font-bold text-base mb-1">{section.heading || '(no heading)'}</h3>
                        <p className="text-sm text-gray-500 line-clamp-2">{section.description || '(no description)'}</p>
                        {section.badgeText && (
                          <Badge className="mt-2 bg-secondary/10 text-secondary border-secondary/20 text-[10px]">
                            {section.badgeText}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* ==================== PAGE HEROES TAB ==================== */}
            <TabsContent value="page-heroes" className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900">Page Hero Sections</h2>
              <p className="text-sm text-gray-500">Customize the hero/banner section for each page — background media, headings, and descriptions.</p>

              {/* Page Hero Editor */}
              {editingPageHero && (
                <Card className="border-secondary/30 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Edit className="w-5 h-5" /> Edit Hero: {pageHeroForm.pageName || editingPageHero}
                    </CardTitle>
                    <CardDescription>Upload a background image or video and customize the hero content</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Background Media */}
                    <div className="space-y-3">
                      <Label className="font-semibold">Background Media</Label>
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-secondary/50 transition-colors relative">
                        {pageHeroForm.backgroundUrl ? (
                          <div className="space-y-3">
                            {pageHeroForm.backgroundType === 'video' ? (
                              <video src={pageHeroForm.backgroundUrl} className="w-full max-h-48 object-cover rounded-lg" controls muted />
                            ) : (
                              <div className="relative w-full h-48 rounded-lg overflow-hidden">
                                <Image src={pageHeroForm.backgroundUrl} alt="Hero preview" fill className="object-cover" />
                              </div>
                            )}
                            <Badge variant="outline" className="uppercase">
                              {pageHeroForm.backgroundType}
                            </Badge>
                          </div>
                        ) : (
                          <div className="py-4">
                            <div className="flex justify-center gap-3 mb-3">
                              <ImageIcon className="w-8 h-8 text-gray-400" />
                              <Video className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-500">Upload image or video for hero background</p>
                            <p className="text-xs text-gray-400 mt-1">Images: JPG, PNG, WebP (max 10MB) • Videos: MP4, WebM (max 100MB)</p>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={handlePageHeroMediaUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          disabled={pageHeroUploading}
                        />
                        {pageHeroUploading && (
                          <div className="mt-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-secondary h-2 rounded-full transition-all duration-300" style={{ width: `${pageHeroUploadProgress}%` }} />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{pageHeroUploadProgress}% uploaded</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Badge Text</Label>
                        <Input
                          value={pageHeroForm.badgeText || ''}
                          onChange={(e) => setPageHeroForm(p => ({ ...p, badgeText: e.target.value }))}
                          placeholder="The Service Menu"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Heading (Main)</Label>
                        <Input
                          value={pageHeroForm.heading || ''}
                          onChange={(e) => setPageHeroForm(p => ({ ...p, heading: e.target.value }))}
                          placeholder="Signature"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Heading (Highlighted)</Label>
                        <Input
                          value={pageHeroForm.headingHighlight || ''}
                          onChange={(e) => setPageHeroForm(p => ({ ...p, headingHighlight: e.target.value }))}
                          placeholder="Rituals"
                        />
                        <p className="text-[10px] text-gray-400">This part appears in gold/accent color</p>
                      </div>
                      <div className="space-y-2">
                        <Label>Sub Heading / Description</Label>
                        <Input
                          value={pageHeroForm.subHeading || ''}
                          onChange={(e) => setPageHeroForm(p => ({ ...p, subHeading: e.target.value }))}
                          placeholder="Artistry is not just a service..."
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button onClick={handleSavePageHero} disabled={isSaving || pageHeroUploading} className="bg-secondary hover:bg-secondary/90 text-primary gap-2">
                        <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Hero'}
                      </Button>
                      <Button variant="outline" onClick={() => { setEditingPageHero(null); setPageHeroForm({}); }}>
                        <X className="w-4 h-4 mr-1" /> Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Page Heroes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pageHeroKeys.map((key) => {
                  const hero = getPageHero(key);
                  if (!hero) return null;
                  return (
                    <Card key={key} className="transition-all hover:shadow-md overflow-hidden">
                      {/* Preview */}
                      <div className="relative h-32 bg-gray-100">
                        {hero.backgroundUrl && (
                          hero.backgroundType === 'video' ? (
                            <video src={hero.backgroundUrl} className="w-full h-full object-cover" muted />
                          ) : (
                            <Image src={hero.backgroundUrl} alt={hero.pageName} fill className="object-cover" />
                          )
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-white font-bold text-lg">{hero.heading} <span className="text-secondary italic">{hero.headingHighlight}</span></p>
                          </div>
                        </div>
                        <Badge className="absolute top-2 left-2 bg-white/20 backdrop-blur-sm text-white text-[10px] uppercase">
                          {hero.pageName}
                        </Badge>
                        {hero.backgroundType && (
                          <Badge variant="outline" className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm text-white text-[10px] uppercase border-white/30">
                            {hero.backgroundType === 'video' ? <Video className="w-3 h-3 mr-1" /> : <ImageIcon className="w-3 h-3 mr-1" />}
                            {hero.backgroundType}
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <p className="text-xs text-gray-500 mb-1">{hero.badgeText}</p>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{hero.subHeading}</p>
                        <Button size="sm" variant="outline" onClick={() => handleEditPageHero(key)} className="w-full gap-1">
                          <Edit className="w-3 h-3" /> Edit Hero
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* ==================== SETTINGS TAB ==================== */}
            <TabsContent value="settings" className="space-y-6">
              <h2 className="text-lg font-bold text-gray-900">Site Settings</h2>
              <p className="text-sm text-gray-500">Global settings for your website — contact info, social links, footer text.</p>

              <Card>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-semibold">Site Name</Label>
                      <Input
                        value={settingsForm.siteName || ''}
                        onChange={(e) => setSettingsForm(p => ({ ...p, siteName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold">Hero Tagline</Label>
                      <Input
                        value={settingsForm.heroTagline || ''}
                        onChange={(e) => setSettingsForm(p => ({ ...p, heroTagline: e.target.value }))}
                        placeholder="For The Modern Caveman"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold">Site Description</Label>
                    <Textarea
                      value={settingsForm.siteDescription || ''}
                      onChange={(e) => setSettingsForm(p => ({ ...p, siteDescription: e.target.value }))}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold">Footer Description</Label>
                    <Textarea
                      value={settingsForm.footerDescription || ''}
                      onChange={(e) => setSettingsForm(p => ({ ...p, footerDescription: e.target.value }))}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-semibold">Copyright Text</Label>
                    <Input
                      value={settingsForm.copyrightText || ''}
                      onChange={(e) => setSettingsForm(p => ({ ...p, copyrightText: e.target.value }))}
                    />
                  </div>

                  <hr className="border-gray-100" />

                  <h3 className="font-bold text-base flex items-center gap-2">
                    <Globe className="w-4 h-4 text-secondary" /> Contact & Social
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>WhatsApp Number</Label>
                      <Input
                        value={settingsForm.whatsappNumber || ''}
                        onChange={(e) => setSettingsForm(p => ({ ...p, whatsappNumber: e.target.value }))}
                        placeholder="+923001234567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input
                        value={settingsForm.phoneNumber || ''}
                        onChange={(e) => setSettingsForm(p => ({ ...p, phoneNumber: e.target.value }))}
                        placeholder="+1234567890"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={settingsForm.email || ''}
                        onChange={(e) => setSettingsForm(p => ({ ...p, email: e.target.value }))}
                        placeholder="manofcave2024@gmail.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Instagram URL</Label>
                      <Input
                        value={settingsForm.instagramUrl || ''}
                        onChange={(e) => setSettingsForm(p => ({ ...p, instagramUrl: e.target.value }))}
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Facebook URL</Label>
                      <Input
                        value={settingsForm.facebookUrl || ''}
                        onChange={(e) => setSettingsForm(p => ({ ...p, facebookUrl: e.target.value }))}
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleSaveSettings} disabled={isSaving} className="bg-secondary hover:bg-secondary/90 text-primary gap-2">
                      <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
