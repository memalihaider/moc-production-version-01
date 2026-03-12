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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />
      
      <main className="pt-16 pb-12">
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
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
            <div className="max-w-6xl mx-auto text-center px-4">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full mb-6 border border-white/20">
                <Sparkles className="w-4 h-4 text-secondary" />
                <span className="text-secondary font-black tracking-[0.3em] uppercase text-[10px]">{menuHero?.badgeText || 'Premium Grooming'}</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-sans font-bold text-white mb-4 leading-tight">
                {menuHero?.heading || 'Our Service'} <span className="text-secondary italic">{menuHero?.headingHighlight || 'Menu'}</span>
              </h1>
              <p className="text-gray-300 max-w-2xl mx-auto text-lg font-light leading-relaxed">
                {menuHero?.subHeading || 'Explore our curated list of premium grooming services, tailored for the modern gentleman.'}
              </p>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 mt-8">

          {/* Filters Section */}
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/80">
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
            <Card className="overflow-hidden rounded-2xl shadow-md border-gray-200/80">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow>
                      <TableHead className="p-4 font-bold text-primary">Service</TableHead>
                      <TableHead className="p-4 font-bold text-primary text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServices.map((service) => (
                      <TableRow key={service.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                        <TableCell className="p-4">
                          <p className="font-sans font-bold text-primary text-base">{service.name}</p>
                          <p className="text-sm text-muted-foreground font-light mt-1 line-clamp-2">{service.description}</p>
                        </TableCell>
                        <TableCell className="p-4 text-right">
                          <span className="text-lg font-bold text-secondary">
                            AED {service.price}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
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