'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Header } from '@/components/shared/Header';
import { useBranchStore } from '@/stores/branchStore';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Building, FolderTree, Sparkles, Tag } from 'lucide-react';
import { useCMSStore } from '@/stores/cms.store';

interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  branchNames: string[];
}

export default function MenuPage() {
  const { selectedBranch, branches } = useBranchStore();
  const { fetchCMSData, getPageHero } = useCMSStore();
  const menuHero = getPageHero('menu');
  const [services, setServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchCMSData();
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const servicesRef = collection(db, 'services');
      const q = query(servicesRef, orderBy('name'));
      const querySnapshot = await getDocs(q);
      
      const servicesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || 'Unnamed Service',
        description: doc.data().description || 'No description available.',
        duration: doc.data().duration || 0,
        price: doc.data().price || 0,
        category: doc.data().category || 'Uncategorized',
        branchNames: doc.data().branchNames || []
      }));
      
      setServices(servicesData);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  // Get unique categories
  const categories = [
    { id: 'all', name: 'All Categories' },
    ...Array.from(new Set(services.map(s => s.category)))
      .filter(Boolean)
      .map(category => ({
        id: category,
        name: category
      }))
  ];

  // Filter services by branch, category, and search
  const filteredServices = services.filter(service => {
    // Branch filter
    const matchesBranch = selectedBranch === 'all' || 
      (service.branchNames && service.branchNames.includes(selectedBranch));
    
    // Category filter
    const matchesCategory = selectedCategory === 'all' || 
      service.category === selectedCategory;
    
    // Search filter
    const matchesSearch = searchQuery === '' ||
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesBranch && matchesCategory && matchesSearch;
  });

  // Get current branch name for display
  const currentBranchName = selectedBranch === 'all' 
    ? 'All Branches' 
    : branches.find(b => b.name === selectedBranch)?.name || selectedBranch;

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="fixed inset-0 z-0">
        {menuHero?.backgroundType === 'video' ? (
          <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
            <source src={menuHero?.backgroundUrl || 'https://www.pexels.com/download/video/7291771/'} type="video/mp4" />
          </video>
        ) : menuHero?.backgroundUrl ? (
          <img src={menuHero.backgroundUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80" />
        )}
        <div className="absolute inset-0 bg-black/70" />
      </div>
      {/* Luxury Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Subtle gradient orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute top-2/3 -right-32 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-[pulse_10s_ease-in-out_infinite_2s]" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-secondary/3 rounded-full blur-3xl animate-[pulse_12s_ease-in-out_infinite_4s]" />
        
        {/* Diamond pattern overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, currentColor 35px, currentColor 36px), repeating-linear-gradient(-45deg, transparent, transparent 35px, currentColor 35px, currentColor 36px)' }} />
        
        {/* Decorative gold lines */}
        <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-secondary/10 to-transparent" />
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-secondary/5 to-transparent" />
        <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-transparent via-secondary/5 to-transparent" />
      </div>

      <Header />
      
      <main className="pt-16 pb-12 relative z-10 text-white">
        {/* Hero Section */}
        <section className="relative h-[350px] md:h-[400px] overflow-hidden">
          <div className="absolute inset-0 w-full h-full">
            {menuHero?.backgroundType === 'video' ? (
              <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
                <source src={menuHero?.backgroundUrl || 'https://www.pexels.com/download/video/7291771/'} type="video/mp4" />
              </video>
            ) : menuHero?.backgroundUrl ? (
              <img src={menuHero.backgroundUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-primary/70"></div>
          </div>
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white">
            <div className="max-w-6xl mx-auto text-center px-4">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full mb-6 border border-white/20">
                <Sparkles className="w-4 h-4 text-secondary" />
                <span className="text-secondary font-black tracking-[0.3em] uppercase text-[10px]">{menuHero?.badgeText || 'Premium Grooming'}</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-sans font-bold text-white mb-4 leading-tight">
                {menuHero?.heading || 'Our Service'} <span className="text-white italic">{menuHero?.headingHighlight || 'Menu'}</span>
              </h1>
              <p className="text-gray-100 max-w-2xl mx-auto text-lg font-light leading-relaxed">
                {menuHero?.subHeading || 'Explore our curated list of premium grooming services, tailored for the modern gentleman.'}
              </p>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 mt-8">

          {/* Filters Section */}
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-secondary/10">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search for any service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-12 text-base rounded-xl border-gray-300 focus:border-secondary focus:ring-secondary"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Badge variant="outline" className="border-secondary/30 text-secondary px-3 py-1.5 h-12 rounded-xl whitespace-nowrap">
                  <Building className="w-4 h-4 mr-2" />
                  <span className="font-medium">{currentBranchName}</span>
                </Badge>
                <Badge className="bg-secondary text-primary h-12 rounded-xl px-3 py-1.5 whitespace-nowrap">
                  {filteredServices.length} Services
                </Badge>
              </div>
            </div>
          </div>

          {/* Services Table */}
          {filteredServices.length > 0 ? (
            <>
              {/* Mobile cards */}
              <div className="space-y-3 sm:hidden">
                {filteredServices.map((service) => (
                  <Card key={service.id} className="rounded-2xl border-secondary/10 bg-white/85 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-sans font-bold text-primary text-base leading-snug">
                            {service.name}
                          </p>
                          <p className="text-xs text-muted-foreground font-light mt-1 line-clamp-2 leading-snug">
                            {service.description}
                          </p>
                        </div>
                        <span className="text-base font-bold text-secondary whitespace-nowrap">
                          AED {service.price}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop/tablet table */}
              <Card className="hidden sm:block overflow-hidden rounded-2xl shadow-lg border-secondary/10 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-0">
                  <Table className="w-full table-fixed">
                    <TableHeader className="bg-gray-50/50">
                      <TableRow>
                        <TableHead className="p-3 sm:p-4 font-bold text-primary">Service</TableHead>
                        <TableHead className="p-3 sm:p-4 font-bold text-primary text-right w-28">Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredServices.map((service) => (
                        <TableRow key={service.id} className="border-t border-secondary/5 hover:bg-secondary/5 transition-colors duration-300">
                          <TableCell className="p-3 sm:p-4 pr-2">
                            <p className="font-sans font-bold text-primary text-sm sm:text-base leading-snug">
                              {service.name}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground font-light mt-0.5 sm:mt-1 line-clamp-2 leading-snug">
                              {service.description}
                            </p>
                          </TableCell>
                          <TableCell className="p-3 sm:p-4 text-right align-top w-28">
                            <span className="text-base sm:text-lg font-bold text-secondary whitespace-nowrap">
                              AED {service.price}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
              <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-sans font-bold text-gray-500 mb-2">No Services Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter settings.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}