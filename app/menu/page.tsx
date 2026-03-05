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
  const [services, setServices] = useState<Service[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
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
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          
          {/* Page Header */}
          <header className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-2">
              Our Service <span className="text-secondary">Menu</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore our curated list of premium grooming services, tailored for the modern gentleman.
            </p>
          </header>

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
                          <p className="font-serif font-bold text-primary text-base">{service.name}</p>
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
              <h3 className="text-2xl font-serif font-bold text-gray-500 mb-2">No Services Found</h3>
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