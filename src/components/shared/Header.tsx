'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {  User, ShoppingBag} from "lucide-react";
import Image from "next/image"; // ✅ Image component import karein
import { useState, useEffect } from "react";

export function Header() {
  const [cartCount, setCartCount] = useState(0);
  
  useEffect(() => {
    // Load cart items from localStorage
    const savedCart = localStorage.getItem('bookingCart');
    if (savedCart) {
      try {
        const cart = JSON.parse(savedCart);
        setCartCount(Array.isArray(cart) ? cart.length : 0);
      } catch {
        setCartCount(0);
      }
    }
    
    // Listen for storage changes
    const handleStorageChange = () => {
      const savedCart = localStorage.getItem('bookingCart');
      if (savedCart) {
        try {
          const cart = JSON.parse(savedCart);
          setCartCount(Array.isArray(cart) ? cart.length : 0);
        } catch {
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <header className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-secondary/10 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-lg transition-all duration-300 group-hover:rotate-12 group-hover:scale-110 shadow-md overflow-hidden"> {/* ✅ overflow-hidden add karein */}
            {/* ✅ Yahan Image component use karein */}
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
        <nav className="hidden md:flex items-center gap-8">
          {[
            { name: "Home", href: "/" },
            { name: "Services", href: "/services" },
            { name: "Products", href: "/products" },
            { name: "Branches", href: "/branches" },
             { name: "Blogs", href: "/blog" },
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
        <div className="flex items-center gap-3">
          {/* Cart Icon */}
          <Link 
            href="/booking" 
            className="group relative flex items-center justify-center w-10 h-10 rounded-full bg-secondary/10 hover:bg-secondary hover:text-white text-secondary transition-all duration-300 shadow-md hover:shadow-lg"
            title="View Cart"
          >
            <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-secondary text-white text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                {cartCount}
              </span>
            )}
          </Link>

          {/* User Profile Icon */}
          <Link 
            href="/customer/portal" 
            className="group flex items-center justify-center w-10 h-10 rounded-full bg-secondary hover:bg-secondary-500 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <User className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-200" />
          </Link>

          {/* Book Now Button */}




          <Button asChild className="bg-secondary hover:bg-secondary/90 text-primary rounded-lg px-6 py-2 text-xs tracking-widest font-bold shadow-md shadow-secondary/20 transition-all duration-300 hover:scale-105 active:scale-95">
            <Link href="/services">BOOK NOW</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}