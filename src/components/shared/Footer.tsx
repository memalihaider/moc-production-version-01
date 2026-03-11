'use client';

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { MapPin, Mail, Phone, Instagram, Facebook, Twitter, Linkedin, Youtube } from "lucide-react";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
}

interface Stats {
  totalBranches: number;
  totalServices: number;
  totalProducts: number;
  totalStaff: number;
}

export function Footer() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalBranches: 0,
    totalServices: 0,
    totalProducts: 0,
    totalStaff: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get branches
        const branchesSnapshot = await getDocs(collection(db, "branches"));
        setBranches(branchesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || '',
          address: doc.data().address || '',
          city: doc.data().city || '',
          country: doc.data().country || ''
        })));

        // Get counts
        const servicesSnapshot = await getDocs(collection(db, "services"));
        const productsSnapshot = await getDocs(collection(db, "products"));
        const staffSnapshot = await getDocs(collection(db, "staff"));

        setStats({
          totalBranches: branchesSnapshot.size,
          totalServices: servicesSnapshot.size,
          totalProducts: productsSnapshot.size,
          totalStaff: staffSnapshot.size,
        });
      } catch (error) {
        console.error("Error fetching footer stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <footer className="bg-primary text-white py-40 px-4 border-t border-white/5 relative overflow-hidden mt-20">
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05] pointer-events-none"></div>
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-24">
          <div className="space-y-12">
            <Link href="/" className="inline-block group">
              <div className="flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-2xl transition-transform duration-500 group-hover:scale-110 overflow-hidden">
                  <Image
                    src="/logoo.jpeg"
                    alt="JAM Beauty Lounge"
                    fill
                    className="object-contain"
                  />
                </div>
                <h3 className="text-3xl font-sans font-bold tracking-tighter group-hover:text-gray-500 transition-colors">
                  JAM <span className=" text-[#FA9DB7]">BEAUTY</span>
                </h3>
              </div>
            </Link>
            <div className="space-y-6">
              <p className="text-[#FA9DB7] text-lg leading-relaxed font-light max-w-xs italic">
                "Defining the future of luxury beauty experiences through artistic expression and technical mastery."
              </p>
              <div className="flex items-center gap-4">
                <a 
                  href="https://instagram.com/jambeautylounge" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center text-[#FA9DB7] transition-all duration-700 shadow-2xl"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a 
                  href="https://facebook.com/jambeautylounge" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center text-[#FA9DB7] transition-all duration-700 shadow-2xl"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a 
                  href="https://twitter.com/jambeautylounge" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center text-[#FA9DB7] transition-all duration-700 shadow-2xl"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a 
                  href="https://youtube.com/jambeautylounge" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center  text-[#FA9DB7] transition-all duration-700 shadow-2xl"
                >
                  <Youtube className="w-5 h-5" />
                </a>
                <a 
                  href="https://linkedin.com/company/jambeautylounge" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center hover:bg-slate/60 text-[#FA9DB7] transition-all duration-700 shadow-2xl"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
          
          <div className="space-y-12">
            <h4 className="font-black uppercase tracking-[0.5em] text-[10px] text-[#FA9DB7]">The Menu</h4>
            <ul className="space-y-6 text-[#FA9DB7] text-sm font-light">
              {[
                { label: 'Signature Rituals', href: '/services' },
                { label: 'The Boutique', href: '/products' },
                { label: 'Secure Booking', href: '/booking' },
                { label: 'Our Artisans', href: '/staff' },
                { label: 'Flagship Stores', href: '/branches' }
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="hover:text-gray-500 transition-colors flex items-center group">
                    <span className="w-0 group-hover:w-6 h-px bg-secondary transition-all duration-500 mr-0 group-hover:mr-4"></span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-12">
            <h4 className="font-black uppercase tracking-[0.5em] text-[10px] text-[#FA9DB7]">Global Reach</h4>
            <div className="space-y-4 text-[#FA9DB7]">
              {[
                { label: 'Locations', count: stats.totalBranches },
                { label: 'Services', count: stats.totalServices },
                { label: 'Products', count: stats.totalProducts },
                { label: 'Artisans', count: stats.totalStaff }
              ].map(s => (
                <div key={s.label} className="flex items-end justify-between border-b border-white/5 pb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#FA9DB7]">{s.label}</span>
                  <span className="font-sans italic text-2xl text-[#FA9DB7]">{s.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-12">
            <h4 className="font-black uppercase tracking-[0.5em] text-[10px] text-[#FA9DB7]">Concierge</h4>
            <ul className="space-y-10 text-white/70 text-sm font-light">
              <li className="flex items-start gap-5 group">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#FA9DB7] group-hover:bg-secondary group-hover:text-white transition-all duration-700 shadow-xl border border-white/5">
                  <MapPin className="w-6 h-6" />
                </div>
                <span className="leading-relaxed text-xs text-[#FA9DB7]">
                  {branches[0]?.address || "123 Luxury Way"}<br />
                  {branches[0]?.city || "Manhattan"}, {branches[0]?.country || "NY"}
                </span>
              </li>
              <li className="flex items-center gap-5 group">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#FA9DB7] group-hover:bg-secondary group-hover:text-white transition-all duration-700 shadow-xl border border-white/5">
                  <Phone className="w-6 h-6" />
                </div>
                <a href="tel:+1234567890" className="text-xs text-[#FA9DB7] transition-colors">
                  +971 54 535 4361
                </a>
              </li>
              <li className="flex items-center gap-5 group">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#FA9DB7] group-hover:bg-secondary group-hover:text-white transition-all duration-700 shadow-xl border border-white/5">
                  <Mail className="w-6 h-6" />
                </div>
                <a href="mailto:Manofcave2020@gmail.com" className="text-xs text-[#FA9DB7] transition-colors">
                  manofcave2020@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-40 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10 text-[#FA9DB7] text-[9px] tracking-[0.5em] font-black uppercase">
          <p>&copy; 2015-2026 MAN OF CAVE. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-16">
            <Link href="/blogs" className="hover:text-white transition-colors">Blog</Link>
            <Link href="/terms-and-conditions" className="hover:text-white transition-colors">Terms</Link>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Accessibility</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
