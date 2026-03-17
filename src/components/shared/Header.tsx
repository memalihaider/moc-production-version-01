"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, Building, Menu, X, LayoutDashboard, LogOut } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useBranchStore } from "@/stores/branchStore";
import { useAuth } from "@/contexts/AuthContext";

type ResolvedUser = {
  role: "customer" | "admin" | "super_admin";
  name?: string;
} | null;

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Services", href: "/services" },
  { name: "Products", href: "/products" },
  { name: "Branches", href: "/branches" },
  { name: "Blogs", href: "/blog" },
  { name: "Menu", href: "/menu" },
];

export function Header() {
  const { user, logout } = useAuth();
  const {
    selectedBranch,
    branches,
    loading,
    setSelectedBranch,
    fetchBranches,
  } = useBranchStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [resolvedUser, setResolvedUser] = useState<ResolvedUser>(null);

  const resolveUserFromStorage = () => {
    if (typeof window === "undefined") return;

    if (user?.role) {
      setResolvedUser({
        role: user.role,
        name: user.name,
      });
      return;
    }

    try {
      const storedUserRaw = localStorage.getItem("user");
      if (storedUserRaw) {
        const storedUser = JSON.parse(storedUserRaw);
        if (storedUser?.role) {
          setResolvedUser({
            role: storedUser.role,
            name: storedUser.name,
          });
          return;
        }
      }

      const customerAuthRaw = localStorage.getItem("customerAuth");
      if (customerAuthRaw) {
        const parsedCustomerAuth = JSON.parse(customerAuthRaw);
        if (parsedCustomerAuth?.isAuthenticated) {
          setResolvedUser({
            role: "customer",
            name: parsedCustomerAuth?.customer?.name,
          });
          return;
        }
      }
    } catch (error) {
      console.error("Error resolving header user state:", error);
    }

    setResolvedUser(null);
  };

  const getDashboardLink = () => {
    if (!resolvedUser) return "/customer/login";
    if (resolvedUser.role === "super_admin") return "/super-admin";
    if (resolvedUser.role === "admin") return "/admin";
    return "/customer/portal";
  };

  const getDashboardLabel = () => {
    if (!resolvedUser) return "Login";
    if (resolvedUser.role === "super_admin") return "View Dashboard";
    if (resolvedUser.role === "admin") return "View Dashboard";
    return "View Dashboard";
  };

  const handleAccountLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    resolveUserFromStorage();
    const onStorageChange = () => resolveUserFromStorage();
    window.addEventListener("storage", onStorageChange);
    return () => window.removeEventListener("storage", onStorageChange);
  }, [user]);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <header className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-secondary/10 z-50 shadow-sm">
      {/* Main bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0" onClick={() => setMobileOpen(false)}>
          <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-lg transition-all duration-300 group-hover:rotate-12 group-hover:scale-110 shadow-md overflow-hidden">
            <Image
              src="/manofcave.png"
              alt="MAN OF CAVE Logo"
              width={40}
              height={40}
              className="h-14 w-auto object-contain self-center"
            />
          </div>
          {/* <Image
            src="/manofcavebradning.png"
            alt="MAN OF CAVE"
            width={200}
            height={40}
            className="h-10 w-auto object-contain self-center"
            priority
          /> */}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-xs uppercase tracking-widest font-semibold text-primary/70 hover:text-secondary transition-all duration-300 hover:-translate-y-0.5"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Desktop branch selector */}
        <div className="hidden md:flex items-center shrink-0">
          <Select
            value={selectedBranch}
            onValueChange={setSelectedBranch}
            disabled={loading}
          >
            <SelectTrigger className="w-44 h-9 border-secondary/20 text-primary focus:ring-secondary/30">
              <SelectValue placeholder={loading ? "Loading..." : "Select Branch"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-primary/70">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  <span>All Branches ({branches.length})</span>
                </div>
              </SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.name} className="text-primary">
                  <div className="flex items-center gap-2">
                    {branch.image && (
                      <div className="w-5 h-5 rounded-full overflow-hidden shrink-0">
                        <img
                          src={branch.image}
                          alt={branch.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
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

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/90 transition-all duration-300 shadow-md"
                aria-label="Account Menu"
              >
                <User className="w-4 h-4 text-white" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem asChild>
                <Link href={getDashboardLink()} className="flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  {getDashboardLabel()}
                </Link>
              </DropdownMenuItem>
              {resolvedUser && (
                <DropdownMenuItem onClick={handleAccountLogout} className="text-red-600 focus:text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild className="bg-secondary hover:bg-secondary/90 text-primary rounded-lg px-5 py-2 text-xs tracking-widest font-bold shadow-md shadow-secondary/20 transition-all duration-300 hover:scale-105 active:scale-95">
            <Link href="/services">BOOK NOW</Link>
          </Button>
        </div>

        {/* Mobile right side: user icon + hamburger */}
        <div className="flex md:hidden items-center gap-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center justify-center w-9 h-9 rounded-full bg-secondary hover:bg-secondary/90 transition-all duration-300 shadow-md"
                aria-label="Account Menu"
              >
                <User className="w-4 h-4 text-white" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem asChild>
                <Link href={getDashboardLink()} className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                  <LayoutDashboard className="w-4 h-4" />
                  {getDashboardLabel()}
                </Link>
              </DropdownMenuItem>
              {resolvedUser && (
                <DropdownMenuItem
                  onClick={async () => {
                    setMobileOpen(false);
                    await handleAccountLogout();
                  }}
                  className="text-red-600 focus:text-red-600"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-secondary/20 text-primary hover:bg-secondary/10 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-secondary/10 px-4 pb-5 pt-3 flex flex-col gap-4 shadow-lg">
          {/* Nav links */}
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="py-2.5 px-3 rounded-lg text-sm font-semibold uppercase tracking-widest text-primary/70 hover:text-secondary hover:bg-secondary/5 transition-all duration-200"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Branch selector */}
          <Select
            value={selectedBranch}
            onValueChange={(v) => { setSelectedBranch(v); setMobileOpen(false); }}
            disabled={loading}
          >
            <SelectTrigger className="w-full h-10 border-secondary/20 text-primary">
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

          {/* Book now */}
          <Button asChild className="w-full bg-secondary hover:bg-secondary/90 text-primary font-bold tracking-widest text-sm">
            <Link href="/services" onClick={() => setMobileOpen(false)}>BOOK NOW</Link>
          </Button>
        </div>
      )}
    </header>
  );
}