// // 'use client';

// // import { useState } from 'react';
// // import Link from 'next/link';
// // import { usePathname } from 'next/navigation';
// // import { cn } from '@/lib/utils';
// // import { Button } from '@/components/ui/button';
// // import { ScrollArea } from '@/components/ui/scroll-area';
// // import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
// // import {
// //   BarChart3,
// //   Calendar,
// //   Users,
// //   DollarSign,
// //   Settings,
// //   Building,
// //   UserPlus,
// //   Bell,
// //   Image,
// //   FileText,
// //   TrendingUp,
// //   Clock,
// //   CheckCircle,
// //   XCircle,
// //   Menu,
// //   Scissors,
// //   Package,
// //   ShoppingCart,
// //   Star,
// //   MapPin,
// //   Phone,
// //   Mail,
// //   CreditCard,
// //   PieChart,
// //   Activity,
// //   Target,
// //   Award,
// //   LogOut,
// //   ChevronLeft,
// //   ChevronRight,
// //   MessageCircle,
// //   Tag
// // } from 'lucide-react';

// // interface SidebarProps {
// //   role: 'branch_admin' | 'super_admin';
// //   onLogout: () => void;
// //   isOpen?: boolean;
// //   onToggle?: () => void;
// //   className?:string;
// // }

// // const branchAdminNavItems = [
// //   {
// //     title: 'Dashboard',
// //     href: '/admin',
// //     icon: BarChart3,
// //   },
// //   {
// //     title: 'Clients',
// //     href: '/admin/clients',
// //     icon: Users,
// //   },
// //   {
// //     title: 'Appointments',
// //     href: '/admin/appointments',
// //     icon: Calendar,
// //   },
// //   {
// //     title: 'Staff',
// //     href: '/admin/staff',
// //     icon: Users,
// //   },
// //   {
// //     title: 'Services',
// //     href: '/admin/services',
// //     icon: Scissors,
// //   },
// //   {
// //     title: 'Products',
// //     href: '/admin/products',
// //     icon: Package,
// //   },
// //   {
// //     title: 'Categories',
// //     href: '/admin/categories',
// //     icon: Tag,
// //   },
// //   {
// //     title: 'Feedbacks',
// //     href: '/admin/feedbacks',
// //     icon: Tag,
// //   },
// //   {
// //     title: 'Orders',
// //     href: '/admin/orders',
// //     icon: Tag,
// //   },
// //   {
// //     title: 'Membership',
// //     href: '/admin/membership',
// //     icon: Award,
// //   },
// //    {
// //     title: 'Booking Calender',
// //     href: '/admin/bookingcalender',
// //     icon: Award,
// //   },
   
// //   {
// //     title: 'Expenses',
// //     href: '/admin/expenses',
// //     icon: DollarSign,
// //   },
// //   {
// //     title: 'Analytics',
// //     href: '/admin/analytics',
// //     icon: TrendingUp,
// //   },
  
// //   {
// //     title: 'Messages',
// //     href: '/admin/messages',
// //     icon: MessageCircle,
// //   },
// //   {
// //     title: 'Settings',
// //     href: '/admin/settings',
// //     icon: Settings,
// //   },
// // ];

// // const superAdminNavItems = [
// //   {
// //     title: 'Dashboard',
// //     href: '/super-admin',
// //     icon: BarChart3,
// //   },
// //   {
// //     title: 'All Appointments',
// //     href: '/super-admin/appointments',
// //     icon: Calendar,
// //   },
// //   {
// //     title: 'Booking Calender',
// //     href: '/super-admin/bookingcalender',
// //     icon: DollarSign,
// //   },
// //   {
// //     title: 'Services',
// //     href: '/super-admin/services',
// //     icon: Scissors,
// //   },
// //   {
// //     title: 'Products',
// //     href: '/super-admin/products',
// //     icon: Package,
// //   },
// //   {
// //     title: 'Clients',
// //     href: '/super-admin/clients',
// //     icon: Users,
// //   },
// //   {
// //     title: 'Staff Management',
// //     href: '/super-admin/staff',
// //     icon: Users,
// //   },
// //   {
// //     title: 'All Feedback',
// //     href: '/super-admin/feedback',
// //     icon: Calendar,
// //   },
// //   {
// //     title: 'Categories',
// //     href: '/super-admin/categories',
// //     icon: Tag,
// //   },
// //    {
// //     title: 'Analytics',
// //     href: '/super-admin/analytics',
// //     icon: PieChart,
// //   },
// //   {
// //     title: 'Expenses',
// //     href: '/super-admin/expenses',
// //     icon: DollarSign,
// //   },
// //    {
// //     title: 'All Orders',
// //     href: '/super-admin/orders',
// //     icon: Calendar,
// //   },
  
// //    {
// //     title: 'Membership',
// //     href: '/super-admin/membership',
// //     icon: Award,
// //   },
// //   {
// //     title: 'Branches',
// //     href: '/super-admin/branches',
// //     icon: Building,
// //   },
  
  
   
 

// //   {
// //     title: 'Users',
// //     href: '/super-admin/users',
// //     icon: Award,
// //   },
  
  
  
  
  
// //  {
// //     title: 'Analytics',
// //     href: '/super-admin/analytics',
// //     icon: PieChart,
// //   },
// //   {
// //     title: 'Expenses',
// //     href: '/super-admin/expenses',
// //     icon: DollarSign,
// //   },
  
// //  {
// //     title: '  Custom Invoice Generator',
// //     href: '/super-admin/custom-invoice',
// //     icon: DollarSign,
// //   },

// //   // {
// //   //   title: 'Financial',
// //   //   href: '/super-admin/financial',
// //   //   icon: DollarSign,
// //   // },
  
// //   {
// //     title: 'Mobile App',
// //     href: '/mobile-app',
// //     icon: Phone,
// //   },
// //   {
// //     title: 'CMS',
// //     href: '/cms',
// //     icon: FileText,
// //   },
  
// //   {
// //     title: 'Messages',
// //     href: '/super-admin/messages',
// //     icon: MessageCircle,
// //   },
  
  
// //   // {
// //   //   title: 'Settings',
// //   //   href: '/super-admin/settings',
// //   //   icon: Settings,
// //   // },
// // ];

// // function SidebarContent({ role, onLogout, onToggle, isCollapsed = false }: Omit<SidebarProps, 'isOpen'> & { isCollapsed?: boolean }) {
// //   const pathname = usePathname();
// //   const navItems = role === 'super_admin' ? superAdminNavItems : branchAdminNavItems;

// //   return (
// //     <div className="flex h-full flex-col  bg-primary border-r border-secondary/10">
// //       {/* Logo */}
// //       <div className="flex h-16 items-center  px-4 lg:px-6">
// //         <div className="flex items-center justify-between w-full">
// //           <Link href="/" className="flex items-center gap-2 group">
// //             <div className="w-8 h-8 mt-1 bg-secondary flex items-center justify-center rounded-lg transition-all duration-300 group-hover:rotate-12 shadow-lg shadow-secondary/20">
// //               <Scissors className="h-4 w-4 text-primary" />
// //             </div>
// //             {!isCollapsed && (
// //               <span className="text-lg font-serif font-bold text-white tracking-tighter mt-1">
// //                 MAN OF <span className="text-secondary">CAVE</span>
// //               </span>
// //             )}
// //           </Link>
        
// //         </div>
// //       </div>

// //       {/* Navigation */}
// //       <ScrollArea className="flex-1 px-3 h-full -mt-2">
// //         <div className="space-y-1 py-4">
// //           {navItems.map((item) => {
// //             const isActive = pathname === item.href;
// //             return (
// //               <Link key={item.href} href={item.href}>
// //                 <Button
// //                   variant="ghost"
// //                   className={cn(
// //                     "w-full justify-start gap-3 h-10 rounded-lg transition-all duration-200",
// //                     isCollapsed && "justify-center px-0",
// //                     isActive 
// //                       ? "bg-secondary text-primary font-semibold shadow-lg shadow-secondary/20" 
// //                       : "text-gray-400 hover:text-secondary hover:bg-white/5"
// //                   )}
// //                 >
// //                   <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-gray-400 group-hover:text-secondary")} />
// //                   {!isCollapsed && <span className="text-sm">{item.title}</span>}
// //                 </Button>
// //               </Link>
// //             );
// //           })}
// //         </div>
// //       </ScrollArea>

// //       {/* Logout */}
// //       <div className="p-4  -mt-7 ml-7">
// //         <Button
// //           variant="ghost"
// //           className={cn(
// //             "w-full justify-start gap-3 text-gray-400 hover:text-red-400 hover:bg-red-400/10",
// //             isCollapsed && "justify-center px-0"
// //           )}
// //           onClick={onLogout}
// //         >
// //           <LogOut className="h-5 w-5" />
// //           {!isCollapsed && "Logout"}
// //         </Button>
// //       </div>
// //     </div>
// //   );
// // }

// // export function AdminSidebar({ role, onLogout, isOpen = true, onToggle }: SidebarProps) {
// //   return (
// //     <>
// //       {/* Mobile/Tablet Overlay */}
// //       {isOpen && (
// //         <div
// //           className="fixed inset-0 z-40 bg-black/50 lg:hidden"
// //           onClick={onToggle}
// //         />
// //       )}

// //       {/* Sidebar */}
// //       <div className={cn(
// //         "h-full shrink-0 bg-white border-r transition-all duration-300 ease-in-out",
// //         // Mobile: slide in/out completely (fixed positioning for mobile overlay)
// //         "fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto lg:translate-x-0",
// //         isOpen ? "translate-x-0 w-64" : "-translate-x-full w-64",
// //         // Desktop: normal flex item with appropriate width
// //         "lg:static lg:w-16",
// //         isOpen && "lg:w-64"
// //       )}>
// //         <SidebarContent role={role} onLogout={onLogout} onToggle={onToggle} isCollapsed={!isOpen} />
// //       </div>
// //     </>
// //   );
// // }

// // export function AdminMobileSidebar({ role, onLogout, isOpen, onToggle }: SidebarProps) {
// //   return (
// //     <Button
// //       variant="outline"
// //       size="icon"
// //       onClick={onToggle}
// //       className="lg:hidden"
// //     >
// //       <Menu className="h-5 w-5" />
// //     </Button>
// //   );
// // }

// // new code

// 'use client';

// import { useState } from 'react';
// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
// import { cn } from '@/lib/utils';
// import { Button } from '@/components/ui/button';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
// import {
//   BarChart3,
//   Calendar,
//   Users,
//   DollarSign,
//   Settings,
//   Building,
//   Award,
//   LogOut,
//   Scissors,
//   Package,
//   Tag,
//   MessageCircle,
//   PieChart,
//   Phone,
//   FileText,
//   CreditCard,
//   ShoppingCart,
//   Star,
//   TrendingUp,
//   Activity,
//   Target,
//   Bell,
//   Image,
//   UserPlus,
//   Clock,
//   CheckCircle,
//   XCircle,
//   Menu,
//   ChevronLeft,
//   ChevronRight,
//   MapPin,
//   Mail
// } from 'lucide-react';

// interface SidebarProps {
//   role: 'branch_admin' | 'super_admin';
//   onLogout: () => void;
//   isOpen?: boolean;
//   onToggle?: () => void;
//   className?: string;
// }

// const branchAdminNavItems = [
//   {
//     title: 'Dashboard',
//     href: '/admin',
//     icon: BarChart3,
//   },
  
//   {
//     title: 'Appointments',
//     href: '/admin/appointments',
//     icon: Calendar,
//   },
//    {
//     title: 'Booking Calender',
//     href: '/admin/bookingcalender',
//     icon: Calendar,
//   },
//   {
//     title: 'Services',
//     href: '/admin/services',
//     icon: Scissors,
//   },
//   {
//     title: 'Products',
//     href: '/admin/products',
//     icon: Package,
//   },
//   {
//     title: 'Clients',
//     href: '/admin/clients',
//     icon: Users,
//   },
//   {
//     title: 'Staff',
//     href: '/admin/staff',
//     icon: Users,
//   },
//   {
//     title: 'Feedbacks',
//     href: '/admin/feedbacks',
//     icon: Star,
//   },
  
  
//   {
//     title: 'Categories',
//     href: '/admin/categories',
//     icon: Tag,
//   },
//   {
//     title: 'Analytics',
//     href: '/admin/analytics',
//     icon: TrendingUp,
//   },
//   {
//     title: 'Expenses',
//     href: '/admin/expenses',
//     icon: DollarSign,
//   },
  
//   {
//     title: 'Orders',
//     href: '/admin/orders',
//     icon: ShoppingCart,
//   },
//   {
//     title: 'Membership',
//     href: '/admin/membership',
//     icon: Award,
//   },
//    {
//     title: 'Branches',
//     href: '/admin/branches',
//     icon: Building,
//   },
//  {
//     title: 'Messages',
//     href: '/admin/messages',
//     icon: MessageCircle,
//   },
  
//   {
//     title: 'custom Invoice',
//     href: '/admin/custominvoice',
//     icon: TrendingUp,
//   },
  
//   {
//     title: 'Settings',
//     href: '/admin/settings',
//     icon: Settings,
//   },
// ];

// const superAdminNavItems = [
//   {
//     title: 'Dashboard',
//     href: '/super-admin',
//     icon: BarChart3,
//   },
//   {
//     title: 'All Appointments',
//     href: '/super-admin/appointments',
//     icon: Calendar,
//   },
//   {
//     title: 'Booking Calender',
//     href: '/super-admin/bookingcalender',
//     icon: Calendar,
//   },
//   {
//     title: 'Services',
//     href: '/super-admin/services',
//     icon: Scissors,
//   },
//   {
//     title: 'Products',
//     href: '/super-admin/products',
//     icon: Package,
//   },
//   {
//     title: 'Clients',
//     href: '/super-admin/clients',
//     icon: Users,
//   },
//   {
//     title: 'Staff Management',
//     href: '/super-admin/staff',
//     icon: Users,
//   },
//   {
//     title: 'All Feedback',
//     href: '/super-admin/feedback',
//     icon: Star,
//   },
//   {
//     title: 'Categories',
//     href: '/super-admin/categories',
//     icon: Tag,
//   },
//   {
//     title: 'Analytics',
//     href: '/super-admin/analytics',
//     icon: PieChart,
//   },
//   {
//     title: 'Expenses',
//     href: '/super-admin/expenses',
//     icon: DollarSign,
//   },
//   {
//     title: 'All Orders',
//     href: '/super-admin/orders',
//     icon: ShoppingCart,
//   },
//   {
//     title: 'Membership',
//     href: '/super-admin/membership',
//     icon: Award,
//   },
//   {
//     title: 'Branches',
//     href: '/super-admin/branches',
//     icon: Building,
//   },
//   {
//     title: 'Users',
//     href: '/super-admin/users',
//     icon: Users,
//   },
//   {
//     title: 'Custom Invoice Generator',
//     href: '/super-admin/custom-invoice',
//     icon: FileText,
//   },
//   // {
//   //   title: 'Mobile App',
//   //   href: '/mobile-app',
//   //   icon: Phone,
//   // },
//   {
//     title: 'setting',
//     href: '/super-admin/settings',
//     icon: FileText,
//   },
//   {
//     title: 'Messages',
//     href: '/super-admin/messages',
//     icon: MessageCircle,
//   },
// ];

// function SidebarContent({ role, onLogout, onToggle, isCollapsed = false }: Omit<SidebarProps, 'isOpen'> & { isCollapsed?: boolean }) {
//   const pathname = usePathname();
//   const navItems = role === 'super_admin' ? superAdminNavItems : branchAdminNavItems;

//   return (
//     <div className="flex h-full flex-col bg-primary border-r border-secondary/10">
//       {/* Logo */}
//       <div className="flex h-16 items-center px-4 lg:px-6">
//         <div className="flex items-center justify-between w-full">
//           <Link href="/" className="flex items-center gap-2 group">
//             <div className="w-8 h-8 mt-1 bg-secondary flex items-center justify-center rounded-lg transition-all duration-300 group-hover:rotate-12 shadow-lg shadow-secondary/20">
//               <Scissors className="h-4 w-4 text-primary" />
//             </div>
//             {!isCollapsed && (
//               <span className="text-lg font-serif font-bold text-white tracking-tighter mt-1">
//                 MAN OF <span className="text-secondary">CAVE</span>
//               </span>
//             )}
//           </Link>
//         </div>
//       </div>

//       {/* Navigation */}
//       <ScrollArea className="flex-1 px-3 h-full -mt-2">
//         <div className="space-y-1 py-4">
//           {navItems.map((item) => {
//             const isActive = pathname === item.href;
//             return (
//               <Link key={item.href} href={item.href}>
//                 <Button
//                   variant="ghost"
//                   className={cn(
//                     "w-full justify-start gap-3 h-10 rounded-lg transition-all duration-200",
//                     isCollapsed && "justify-center px-0",
//                     isActive 
//                       ? "bg-secondary text-primary font-semibold shadow-lg shadow-secondary/20" 
//                       : "text-gray-400 hover:text-secondary hover:bg-white/5"
//                   )}
//                 >
//                   <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-gray-400 group-hover:text-secondary")} />
//                   {!isCollapsed && <span className="text-sm">{item.title}</span>}
//                 </Button>
//               </Link>
//             );
//           })}
//         </div>
//       </ScrollArea>

//       {/* Logout */}
//       <div className="p-4 -mt-7 ml-7">
//         <Button
//           variant="ghost"
//           className={cn(
//             "w-full justify-start gap-3 text-gray-400 hover:text-red-400 hover:bg-red-400/10",
//             isCollapsed && "justify-center px-0"
//           )}
//           onClick={onLogout}
//         >
//           <LogOut className="h-5 w-5" />
//           {!isCollapsed && "Logout"}
//         </Button>
//       </div>
//     </div>
//   );
// }

// export function AdminSidebar({ role, onLogout, isOpen = true, onToggle }: SidebarProps) {
//   return (
//     <>
//       {/* Mobile/Tablet Overlay */}
//       {isOpen && (
//         <div
//           className="fixed inset-0 z-40 bg-black/50 lg:hidden"
//           onClick={onToggle}
//         />
//       )}

//       {/* Sidebar */}
//       <div className={cn(
//         "h-full shrink-0 bg-white border-r transition-all duration-300 ease-in-out",
//         // Mobile: slide in/out completely (fixed positioning for mobile overlay)
//         "fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto lg:translate-x-0",
//         isOpen ? "translate-x-0 w-64" : "-translate-x-full w-64",
//         // Desktop: normal flex item with appropriate width
//         "lg:static lg:w-16",
//         isOpen && "lg:w-64"
//       )}>
//         <SidebarContent role={role} onLogout={onLogout} onToggle={onToggle} isCollapsed={!isOpen} />
//       </div>
//     </>
//   );
// }

// export function AdminMobileSidebar({ role, onLogout, isOpen, onToggle }: SidebarProps) {
//   return (
//     <Button
//       variant="outline"
//       size="icon"
//       onClick={onToggle}
//       className="lg:hidden"
//     >
//       <Menu className="h-5 w-5" />
//     </Button>
//   );
// }
// new codee

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  BarChart3,
  Calendar,
  Users,
  DollarSign,
  Settings as SettingsIcon,
  Building,
  Award,
  LogOut,
  Scissors,
  Package,
  Tag,
  MessageCircle,
  PieChart,
  Phone,
  FileText,
  CreditCard,
  ShoppingCart,
  Star,
  TrendingUp,
  Activity,
  Target,
  Bell,
  Image,
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
  Menu,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  MapPin,
  Mail,
  Wrench // Added for Admin Tools icon
} from 'lucide-react';

interface SidebarProps {
  role: 'branch_admin' | 'super_admin';
  onLogout: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
  allowedPages?: string[];
}

const branchAdminNavItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: BarChart3,
    pageKey: 'dashboard'
  },
  {
    title: 'Appointments',
    href: '/admin/appointments',
    icon: Calendar,
    pageKey: 'appointments'
  },
  {
    title: 'Booking Calender',
    href: '/admin/bookingcalender',
    icon: Calendar,
    pageKey: 'booking calender'
  },
  {
    title: 'Services',
    href: '/admin/services',
    icon: Scissors,
    pageKey: 'services'
  },
  {
    title: 'Products',
    href: '/admin/products',
    icon: Package,
    pageKey: 'products'
  },
  {
    title: 'Clients',
    href: '/admin/clients',
    icon: Users,
    pageKey: 'clients'
  },
  {
    title: 'Staff',
    href: '/admin/staff',
    icon: Users,
    pageKey: 'staff'
  },
  {
    title: 'Feedbacks',
    href: '/admin/feedbacks',
    icon: Star,
    pageKey: 'feedbacks'
  },
  {
    title: 'Categories',
    href: '/admin/categories',
    icon: Tag,
    pageKey: 'categories'
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: TrendingUp,
    pageKey: 'analytics'
  },
  {
    title: 'Expenses',
    href: '/admin/expenses',
    icon: DollarSign,
    pageKey: 'expenses'
  },
  {
    title: 'Orders',
    href: '/admin/orders',
    icon: ShoppingCart,
    pageKey: 'orders'
  },
  {
    title: 'Membership',
    href: '/admin/membership',
    icon: Award,
    pageKey: 'membership'
  },
 
  // {
  //   title: 'Messages',
  //   href: '/admin/messages',
  //   icon: MessageCircle,
  //   pageKey: 'messages'
  // },
  {
    title: 'Custom Invoice',
    href: '/admin/custominvoice',
    icon: TrendingUp,
    pageKey: 'custom invoice'
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: SettingsIcon,
    pageKey: 'settings'
  },
];

const superAdminNavItems = [
  {
    title: 'Dashboard',
    href: '/super-admin',
    icon: BarChart3,
    pageKey: 'dashboard'
  },
  {
    title: 'All Appointments',
    href: '/super-admin/appointments',
    icon: Calendar,
    pageKey: 'appointments'
  },
  {
    title: 'Booking Calender',
    href: '/super-admin/bookingcalender',
    icon: Calendar,
    pageKey: 'booking calender'
  },
  {
    title: 'Catalog',
    icon: Package,
    pageKey: 'catalog',
    children: [
      {
        title: 'Services',
        href: '/super-admin/services',
        icon: Scissors,
        pageKey: 'services'
      },
      {
        title: 'Products',
        href: '/super-admin/products',
        icon: Package,
        pageKey: 'products'
      },
      {
        title: 'Categories',
        href: '/super-admin/categories',
        icon: Tag,
        pageKey: 'categories'
      }
    ]
  },






 {
    title: 'Finance Report',
    icon: Wrench, // Changed to Wrench icon
    pageKey: 'finance_report',
    children: [
      {
        title: 'Report',
        href: '/super-admin/report',
        icon: FileText,
        pageKey: 'report'
      },
      {
        title: 'Sales page',
        href: '/super-admin/sales',
        icon: FileText,
        pageKey: 'sales'
      },
     
    ]
  },



















 {
    title: 'Attendance',
    href: '/super-admin/attendance',
    icon: Award,
    pageKey: 'Attendance'
  },


  {
    title: 'Clients',
    href: '/super-admin/clients',
    icon: Users,
    pageKey: 'clients'
  },
  {
    title: 'Staff Management',
    href: '/super-admin/staff',
    icon: Users,
    pageKey: 'staff'
  },
  {
    title: 'All Feedback',
    href: '/super-admin/feedback',
    icon: Star,
    pageKey: 'feedbacks'
  },
  {
    title: 'Categories',
    href: '/super-admin/categories',
    icon: Tag,
    pageKey: 'categories'
  },
  {
    title: 'Analytics',
    href: '/super-admin/analytics',
    icon: PieChart,
    pageKey: 'analytics'
  },
  {
    title: 'Expenses',
    href: '/super-admin/expenses',
    icon: DollarSign,
    pageKey: 'expenses'
  },
  {
    title: 'All Orders',
    href: '/super-admin/orders',
    icon: ShoppingCart,
    pageKey: 'orders'
  },
  {
    title: 'Membership',
    href: '/super-admin/membership',
    icon: Award,
    pageKey: 'membership'
  },
  {
    title: 'Branches',
    href: '/super-admin/branches',
    icon: Building,
    pageKey: 'branches'
  },
  
  

  {
    title: 'Admin Tools',
    icon: Wrench, // Changed to Wrench icon
    pageKey: 'admin_tools',
    children: [
      {
        title: 'Blogs',
        href: '/super-admin/blogs',
        icon: FileText,
        pageKey: 'blogs'
      },
      {
        title: 'Custom Invoice',
        href: '/super-admin/custom-invoice',
        icon: FileText,
        pageKey: 'custom_invoice'
      },
      {
        title: 'Settings',
        href: '/super-admin/settings',
        icon: SettingsIcon,
        pageKey: 'settings'
      },
      {
    title: 'Users',
    href: '/super-admin/users',
    icon: Users,
    pageKey: 'users'
  },
    ]
  },
  // {
  //   title: 'Messages',
  //   href: '/super-admin/messages',
  //   icon: MessageCircle,
  //   pageKey: 'messages'
  // },
];

interface SidebarContentProps extends Omit<SidebarProps, 'isOpen'> {
  isCollapsed?: boolean;
}

function SidebarContent({ 
  role, 
  onLogout, 
  onToggle, 
  isCollapsed = false,
  allowedPages = []
}: SidebarContentProps & { isCollapsed?: boolean }) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    'catalog': false,
    'admin_tools': false
  });
  
  // Base navigation items based on role
  let baseNavItems = role === 'super_admin' ? superAdminNavItems : branchAdminNavItems;
  
  // Filter navigation items based on allowedPages
  let navItems = baseNavItems;
  
  if (role === 'branch_admin' && allowedPages && allowedPages.length > 0) {
    const allowedPagesLower = allowedPages.map(page => page.toLowerCase());
    
    navItems = baseNavItems.filter(item => {
      if (item.pageKey === 'dashboard') {
        return allowedPagesLower.includes('dashboard') || allowedPages.length === 0;
      }
      
      if (item.pageKey) {
        return allowedPagesLower.includes(item.pageKey.toLowerCase());
      }
      
      return true;
    });
  }
  
  // If no items to show (edge case), show a message
  if (navItems.length === 0) {
    navItems = [{
      title: 'No Access',
      href: '#',
      icon: XCircle,
      pageKey: 'noaccess'
    }];
  }

  // Function to toggle expansion
  const toggleExpand = (pageKey: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [pageKey]: !prev[pageKey]
    }));
  };

  return (
    <div className="flex h-full flex-col bg-primary border-r border-secondary/10 ">
      {/* Logo */}
      <div className="flex h-16 items-center px-4 lg:px-6">
        <div className="flex items-center justify-between w-full">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 mt-1 bg-secondary flex items-center justify-center rounded-lg transition-all duration-300 group-hover:rotate-12 shadow-lg shadow-secondary/20">
              <Scissors className="h-4 w-4 text-primary" />
            </div>
            {!isCollapsed && (
              <span className="text-lg font-serif font-bold text-white tracking-tighter mt-1">
                MAN OF <span className="text-secondary">CAVE</span>
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 h-full -mt-2">
        <div className="space-y-1 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const isDisabled = item.title === 'No Access';
            
            // Check if item has children
            if (item.children) {
              const isExpanded = expandedItems[item.pageKey] && !isCollapsed;
              
              // Check if any child is active for parent highlight
              const isChildActive = item.children.some(child => pathname === child.href);
              
              return (
                <div key={`parent-${item.pageKey || item.title}`} className="space-y-1">
                  {/* Parent item (Dropdown) - Clickable to expand/collapse */}
                  <Button
                    variant="ghost"
                    onClick={() => toggleExpand(item.pageKey)}
                    className={cn(
                      "w-full justify-start gap-3 h-10 rounded-lg transition-all duration-200",
                      isCollapsed && "justify-center px-0",
                      isChildActive
                        ? "bg-secondary/20 text-secondary"
                        : "text-gray-400 hover:text-secondary hover:bg-white/5"
                    )}
                  >
                    <item.icon className={cn(
                      "h-5 w-5",
                      isChildActive && "text-secondary"
                    )} />
                    {!isCollapsed && (
                      <>
                        <span className="text-sm flex-1 text-left">{item.title}</span>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </>
                    )}
                  </Button>
                  
                  {/* Children items - Show only when expanded */}
                  {isExpanded && (
                    <div className="ml-6 space-y-1">
                      {item.children.map((child) => {
                        const isChildActive = pathname === child.href;
                        return (
                          <Link 
                            key={`child-${child.href || child.pageKey}`} 
                            href={child.href}
                          >
                            <Button
                              variant="ghost"
                              className={cn(
                                "w-full justify-start gap-3 h-9 rounded-lg transition-all duration-200",
                                isChildActive 
                                  ? "bg-secondary text-primary font-semibold shadow-lg shadow-secondary/20" 
                                  : "text-gray-400 hover:text-secondary hover:bg-white/5"
                              )}
                            >
                              <child.icon className={cn(
                                "h-4 w-4", 
                                isChildActive ? "text-primary" : "text-gray-400 group-hover:text-secondary"
                              )} />
                              <span className="text-sm">
                                {child.title}
                              </span>
                            </Button>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }
            
            // Normal items (without children)
            return (
              <Link 
                key={item.href || `item-${item.pageKey}`} 
                href={isDisabled ? '#' : item.href}
                className={isDisabled ? 'pointer-events-none cursor-not-allowed' : ''}
              >
                <Button
                  variant="ghost"
                  disabled={isDisabled}
                  className={cn(
                    "w-full justify-start gap-3 h-10 rounded-lg transition-all duration-200",
                    isCollapsed && "justify-center px-0",
                    isActive 
                      ? "bg-secondary text-primary font-semibold shadow-lg shadow-secondary/20" 
                      : "text-gray-400 hover:text-secondary hover:bg-white/5",
                    isDisabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <item.icon className={cn(
                    "h-5 w-5", 
                    isActive ? "text-primary" : "text-gray-400 group-hover:text-secondary",
                    isDisabled && "text-gray-500"
                  )} />
                  {!isCollapsed && (
                    <span className={cn(
                      "text-sm",
                      isDisabled && "text-gray-500"
                    )}>
                      {item.title}
                    </span>
                  )}
                </Button>
              </Link>
            );
          })}
        </div>
      </ScrollArea>

      {/* Logout */}
      <div className="p-4 -mt-7 ml-7">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-gray-400 hover:text-red-400 hover:bg-red-400/10",
            isCollapsed && "justify-center px-0"
          )}
          onClick={onLogout}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && "Logout"}
        </Button>
      </div>
    </div>
  );
}

export function AdminSidebar({ 
  role, 
  onLogout, 
  isOpen = true, 
  onToggle,
  allowedPages = []
}: SidebarProps) {
  return (
    <>
      {/* Mobile/Tablet Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "h-full shrink-0 bg-white border-r transition-all duration-300 ease-in-out",
        "fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto lg:translate-x-0",
        isOpen ? "translate-x-0 w-64" : "-translate-x-full w-64",
        "lg:static lg:w-16",
        isOpen && "lg:w-64"
      )}>
        <SidebarContent 
          role={role} 
          onLogout={onLogout} 
          onToggle={onToggle} 
          isCollapsed={!isOpen}
          allowedPages={allowedPages}
        />
      </div>
    </>
  );
}

export function AdminMobileSidebar({ role, onLogout, isOpen, onToggle, allowedPages = [] }: SidebarProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onToggle}
      className="lg:hidden"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}

// Helper function to get page key from href
export function getPageKeyFromHref(href: string): string {
  const pageMap: Record<string, string> = {
    '/admin': 'dashboard',
    '/admin/appointments': 'appointments',
    '/admin/bookingcalender': 'booking calender',
    '/admin/services': 'services',
    '/admin/products': 'products',
    '/admin/clients': 'clients',
    '/admin/staff': 'staff',
    '/admin/feedbacks': 'feedbacks',
    '/admin/categories': 'categories',
    '/admin/analytics': 'analytics',
    '/admin/expenses': 'expenses',
    '/admin/orders': 'orders',
    '/admin/membership': 'membership',
    '/admin/branches': 'branches',
    '/admin/messages': 'messages',
    '/admin/custominvoice': 'custom invoice',
    '/admin/settings': 'settings',
  };
  
  return pageMap[href] || '';
}