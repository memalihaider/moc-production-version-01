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
import { Search, Building, FolderTree } from 'lucide-react';

interface Service {
  id: string;
  name: string;
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="pt-24 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="mb-6">
            <h1 className="text-4xl font-serif font-bold text-primary mb-2">
              Our Services <span className="text-secondary">Menu</span>
            </h1>
            
            {/* Filter Info */}
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <Badge variant="outline" className="border-secondary/30 text-secondary px-4 py-2">
                <Building className="w-4 h-4 mr-2" />
                <span className="font-medium">Branch:</span>
                <span className="ml-2 font-bold">{currentBranchName}</span>
              </Badge>
              
              {selectedCategory !== 'all' && (
                <Badge variant="outline" className="border-secondary/30 text-secondary px-4 py-2">
                  <FolderTree className="w-4 h-4 mr-2" />
                  <span className="font-medium">Category:</span>
                  <span className="ml-2 font-bold">{selectedCategory}</span>
                </Badge>
              )}
              
              <Badge className="bg-secondary text-primary">
                {filteredServices.length} services
              </Badge>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              {/* Filters Row */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Category Dropdown */}
                <div className="w-full md:w-64">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name} {cat.id !== 'all' && 
                            `(${services.filter(s => s.category === cat.id).length})`
                          }
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Services Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-100">
                    <TableRow>
                      <TableHead className="font-bold">Service Name</TableHead>
                      <TableHead className="font-bold">Category</TableHead>
                      <TableHead className="font-bold text-right">Duration (min)</TableHead>
                      <TableHead className="font-bold text-right">Price </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2">
                            {selectedBranch !== 'all' ? (
                              <Building className="w-12 h-12 text-gray-300" />
                            ) : selectedCategory !== 'all' ? (
                              <FolderTree className="w-12 h-12 text-gray-300" />
                            ) : (
                              <Search className="w-12 h-12 text-gray-300" />
                            )}
                            <p className="text-gray-500 font-medium">
                              {selectedBranch !== 'all' 
                                ? `No services available at ${selectedBranch}`
                                : selectedCategory !== 'all'
                                ? `No services in ${selectedCategory} category`
                                : searchQuery
                                ? 'No services match your search'
                                : 'No services found'}
                            </p>
                            <p className="text-sm text-gray-400">
                              Try adjusting your filters
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredServices.map((service) => (
                        <TableRow key={service.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{service.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {service.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{service.duration}</TableCell>
                          <TableCell className="text-right font-bold text-secondary">
                            Aed {service.price}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Footer Stats */}
              {filteredServices.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-between items-center gap-2 text-sm text-gray-500">
                  <span>
                    Showing {filteredServices.length} of {services.length} services
                  </span>
                  <div className="flex gap-3">
                    {selectedBranch !== 'all' && (
                      <span className="text-secondary">
                        Branch: {currentBranchName}
                      </span>
                    )}
                    {selectedCategory !== 'all' && (
                      <span className="text-secondary">
                        Category: {selectedCategory}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}