"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, Building } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBranchStore } from "@/stores/branchStore"; // ✅ Global store import

export function Header() {
  // ✅ Global store se values lo
  const { 
    selectedBranch, 
    branches, 
    loading, 
    setSelectedBranch, 
    fetchBranches 
  } = useBranchStore();

  // Fetch branches on mount
  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  return (
    <header className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-secondary/10 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-lg transition-all duration-300 group-hover:rotate-12 group-hover:scale-110 shadow-md overflow-hidden">
            <Image 
              src="/manofcave.png" 
              alt="Man of Cave Logo" 
              width={40} 
              height={40} 
              className="object-contain group-hover:rotate-12 group-hover:scale-110 transition-all duration-300"
            />
          </div>
          <span className="text-xl font-serif font-bold text-primary tracking-tight hidden sm:block">
            Man OF <span className="text-secondary">CAVE</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            { name: "Home", href: "/" },
            { name: "Services", href: "/services" },
            { name: "Products", href: "/products" },
            { name: "Branches", href: "/branches" },
            { name: "Blogs", href: "/blog" },
             { name: "Menu", href: "/menu" },
          ].map((link) => (
            <Link 
              key={link.name}
              href={link.href} 
              className="text-xs uppercase tracking-widest font-semibold text-primary/70 hover:text-secondary transition-all duration-300 hover:translate-y-[-2px]"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* ✅ BRANCH FILTER DROPDOWN - GLOBAL STORE KE SAATH */}
        <div className="hidden md:flex items-center">
          <Select 
            value={selectedBranch} 
            onValueChange={(value) => setSelectedBranch(value)} // ✅ Global state update
            disabled={loading}
          >
            <SelectTrigger className="w-[180px] h-9 border-secondary/20 text-primary focus:ring-secondary/30">
              <SelectValue placeholder={loading ? "Loading branches..." : "Select Branch"} />
            </SelectTrigger>
            <SelectContent>
              {/* All Branches option */}
              <SelectItem value="all" className="text-primary/70">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  <span>All Branches ({branches.length})</span>
                </div>
              </SelectItem>
              
              {/* Individual branches */}
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.name} className="text-primary">
                  <div className="flex items-center gap-2">
                    {branch.image && (
                      <div className="w-5 h-5 rounded-full overflow-hidden">
                        <img 
                          src={branch.image} 
                          alt={branch.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://via.placeholder.com/20";
                          }}
                        />
                      </div>
                    )}
                    <span>{branch.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* User and Book Now Buttons */}
        <div className="flex items-center gap-15">
          <Link 
            href="/customer/portal" 
            className="group flex -mr-10 items-center justify-center w-10 h-10 rounded-full bg-secondary hover:bg-secondary-500 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <User className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-200" />
          </Link>

          <Button asChild className="bg-secondary hover:bg-secondary/90 text-primary rounded-lg px-6 py-2 text-xs tracking-widest font-bold shadow-md shadow-secondary/20 transition-all duration-300 hover:scale-105 active:scale-95">
            <Link href="/services">BOOK NOW</Link>
          </Button>
        </div>
      </div>

      {/* Mobile Branch Filter */}
      <div className="md:hidden px-4 pb-2">
        <Select 
          value={selectedBranch} 
          onValueChange={(value) => setSelectedBranch(value)} // ✅ Global state update
          disabled={loading}
        >
          <SelectTrigger className="w-full h-8 border-secondary/20 text-primary text-sm">
            <SelectValue placeholder={loading ? "Loading branches..." : "Select Branch"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches ({branches.length})</SelectItem>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.name}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </header>
  );
}