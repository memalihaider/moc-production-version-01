// 'use client';

// import { useState } from 'react';
// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
// import { cn } from '@/lib/utils';
// import { Button } from '@/components/ui/button';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import { ChevronDown, ChevronRight, Menu } from 'lucide-react';
// import {
//   BarChart3,
//   Calendar,
//   Users,
//   DollarSign,
//   Settings as SettingsIcon,
//   Building,
//   Award,
//   LogOut,
//   Scissors,
//   Package,
//   Tag,
//   MessageCircle,
//   PieChart,
//   FileText,
//   ShoppingCart,
//   Star,
//   TrendingUp,
//   Wrench,
//   Sparkles,
//   XCircle
// } from 'lucide-react';

// interface SidebarProps {
//   role: 'branch_admin' | 'super_admin';
//   onLogout: () => void;
//   isOpen?: boolean;
//   onToggle?: () => void;
//   className?: string;
//   allowedPages?: string[];
// }

// const branchAdminNavItems = [
//   {
//     title: 'Dashboard',
//     href: '/admin',
//     icon: BarChart3,
//     pageKey: 'dashboard'
//   },
//   {
//     title: 'Appointments',
//     href: '/admin/appointments',
//     icon: Calendar,
//     pageKey: 'appointments'
//   },
//   {
//     title: 'Booking Calender',
//     href: '/admin/bookingcalender',
//     icon: Calendar,
//     pageKey: 'booking calender'
//   },
//   {
//     title: 'Services',
//     href: '/admin/services',
//     icon: Scissors,
//     pageKey: 'services'
//   },
//   {
//     title: 'Products',
//     href: '/admin/products',
//     icon: Package,
//     pageKey: 'products'
//   },
//   {
//     title: 'Clients',
//     href: '/admin/clients',
//     icon: Users,
//     pageKey: 'clients'
//   },
//   {
//     title: 'Staff',
//     href: '/admin/staff',
//     icon: Users,
//     pageKey: 'staff'
//   },
//   {
//     title: 'Feedbacks',
//     href: '/admin/feedbacks',
//     icon: Star,
//     pageKey: 'feedbacks'
//   },
//   {
//     title: 'Categories',
//     href: '/admin/categories',
//     icon: Tag,
//     pageKey: 'categories'
//   },
//   {
//     title: 'Analytics',
//     href: '/admin/analytics',
//     icon: TrendingUp,
//     pageKey: 'analytics'
//   },
//   {
//     title: 'Expenses',
//     href: '/admin/expenses',
//     icon: DollarSign,
//     pageKey: 'expenses'
//   },
//   {
//     title: 'Orders',
//     href: '/admin/orders',
//     icon: ShoppingCart,
//     pageKey: 'orders'
//   },
//   {
//     title: 'Membership',
//     href: '/admin/membership',
//     icon: Award,
//     pageKey: 'membership'
//   },
//   {
//     title: 'Admin chat',
//     href: '/admin/messages',
//     icon: MessageCircle,
//     pageKey: 'messages'
//   },
//    {
//     title: 'Customer chat',
//     href: '/admin/customer-chats',
//     icon: MessageCircle,
//     pageKey: 'messages'
//   },

//   {
//     title: 'Custom Invoice',
//     href: '/admin/custominvoice',
//     icon: TrendingUp,
//     pageKey: 'custom invoice'
//   },
//   {
//     title: 'Settings',
//     href: '/admin/settings',
//     icon: SettingsIcon,
//     pageKey: 'settings'
//   },
// ];

// const superAdminNavItems = [
//   {
//     title: 'Dashboard',
//     href: '/super-admin',
//     icon: BarChart3,
//     pageKey: 'dashboard'
//   },
//   {
//     title: 'All Appointments',
//     href: '/super-admin/appointments',
//     icon: Calendar,
//     pageKey: 'appointments'
//   },
//   {
//     title: 'Booking Calender',
//     href: '/super-admin/bookingcalender',
//     icon: Calendar,
//     pageKey: 'booking calender'
//   },
//   {
//     title: 'Catalog',
//     icon: Package,
//     pageKey: 'catalog',
//     children: [
//       {
//         title: 'Services',
//         href: '/super-admin/services',
//         icon: Scissors,
//         pageKey: 'services'
//       },
//       {
//         title: 'Products',
//         href: '/super-admin/products',
//         icon: Package,
//         pageKey: 'products'
//       },
//       {
//         title: 'Categories',
//         href: '/super-admin/categories',
//         icon: Tag,
//         pageKey: 'categories'
//       }
//     ]
//   },
//   {
//     title: 'Finance Report',
//     icon: FileText,
//     pageKey: 'finance_report',
//     children: [
//       {
//         title: 'Report',
//         href: '/super-admin/report',
//         icon: FileText,
//         pageKey: 'report'
//       },
//       {
//         title: 'Sales page',
//         href: '/super-admin/sales',
//         icon: FileText,
//         pageKey: 'sales'
//       },
//     ]
//   },
//   {
//     title: 'Attendance',
//     href: '/super-admin/attendance',
//     icon: Award,
//     pageKey: 'Attendance'
//   },
//   {
//     title: 'Clients',
//     href: '/super-admin/clients',
//     icon: Users,
//     pageKey: 'clients'
//   },
//   {
//     title: 'Staff Management',
//     href: '/super-admin/staff',
//     icon: Users,
//     pageKey: 'staff'
//   },
//   {
//     title: 'All Feedback',
//     href: '/super-admin/feedback',
//     icon: Star,
//     pageKey: 'feedbacks'
//   },
//   {
//     title: 'Analytics',
//     href: '/super-admin/analytics',
//     icon: PieChart,
//     pageKey: 'analytics'
//   },
//   {
//     title: 'Expenses',
//     href: '/super-admin/expenses',
//     icon: DollarSign,
//     pageKey: 'expenses'
//   },
//   {
//     title: 'All Orders',
//     href: '/super-admin/orders',
//     icon: ShoppingCart,
//     pageKey: 'orders'
//   },
//   {
//     title: 'Membership',
//     href: '/super-admin/membership',
//     icon: Award,
//     pageKey: 'membership'
//   },
//   {
//     title: 'Branches',
//     href: '/super-admin/branches',
//     icon: Building,
//     pageKey: 'branches'
//   },
//   {
//     title: 'Users',
//     href: '/super-admin/users',
//     icon: Users,
//     pageKey: 'users'
//   },
//   {
//     title: 'Admin Tools',
//     icon: Wrench,
//     pageKey: 'admin_tools',
//     children: [
//       {
//         title: 'Blogs',
//         href: '/super-admin/blogs',
//         icon: FileText,
//         pageKey: 'blogs'
//       },
//       {
//         title: 'Custom Invoice',
//         href: '/super-admin/custom-invoice',
//         icon: FileText,
//         pageKey: 'custom_invoice'
//       },
//       {
//         title: 'Settings',
//         href: '/super-admin/settings',
//         icon: SettingsIcon,
//         pageKey: 'settings'
//       },
//     ]
//   },
//   {
//     title: 'Branch Chat',
//     href: '/super-admin/messages',
//     icon: MessageCircle,
//     pageKey: 'messages'
//   },

//    {
//     title: 'Customer Chat',
//     href: '/super-admin/customer-chat',
//     icon: MessageCircle,
//     pageKey: 'messages'
//   },
// ];

// export function AdminSidebar({ 
//   role, 
//   onLogout, 
//   isOpen = true, 
//   onToggle,
//   allowedPages = []
// }: SidebarProps) {
//   const pathname = usePathname();
//   const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
//     'catalog': false,
//     'admin_tools': false,
//     'finance_report': false
//   });
  
//   // ✅ Base navigation items based on role
//   let baseNavItems = role === 'super_admin' ? superAdminNavItems : branchAdminNavItems;
  
//   // ✅ Filter navigation items based on allowedPages
//   let navItems = baseNavItems;
  
//   if (role === 'branch_admin' && allowedPages && allowedPages.length > 0) {
//     const allowedPagesLower = allowedPages.map(page => page.toLowerCase());
    
//     navItems = baseNavItems.filter(item => {
//       if (item.pageKey) {
//         return allowedPagesLower.includes(item.pageKey.toLowerCase());
//       }
//       return true;
//     });
//   }
  
//   // ✅ If no items to show
//   if (navItems.length === 0) {
//     navItems = [{
//       title: 'No Access',
//       href: '#',
//       icon: XCircle,
//       pageKey: 'noaccess'
//     }];
//   }

//   // ✅ Toggle expansion
//   const toggleExpand = (pageKey: string) => {
//     setExpandedItems(prev => ({
//       ...prev,
//       [pageKey]: !prev[pageKey]
//     }));
//   };

//   return (
//     <>
//       {/* ✅ Mobile/Tablet Overlay - Only when sidebar is open on mobile */}
//       {isOpen && (
//         <div
//           className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
//           onClick={onToggle}
//         />
//       )}

//       {/* ✅ Sidebar - Single instance */}
//       <div className={cn(
//         "h-full shrink-0 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out",
//         "fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto",
//         isOpen ? "translate-x-0 w-64" : "-translate-x-full w-64 lg:translate-x-0 lg:w-16",
//         "lg:static"
//       )}>
//         <div className="flex flex-col h-full bg-white">
//           {/* Pink Top Border */}
//           <div className="h-1 w-full bg-[#FA9DB7]"></div>
          
//           {/* Logo */}
//           <div className="flex h-20 items-center px-4 lg:px-6 border-b border-gray-100">
//             <div className="flex items-center justify-between w-full">
//               <Link href="/" className="flex items-center gap-2 group">
//                 <div className="w-8 h-8 rounded-lg bg-[#FA9DB7]/10 flex items-center justify-center">
//                   <Sparkles className="w-4 h-4 text-[#FA9DB7]" />
//                 </div>
//                 {isOpen && (
//                   <span className="text-lg font-sans font-bold tracking-tighter">
//                     <span className="text-[#f48aa8]">Jam</span>
//                     <span className="text-gray-500">Beauty</span>
//                       <span className="text-gray-800">Lounge</span>
//                   </span>
//                 )}
//               </Link>
//             </div>
//           </div>

//           {/* Navigation */}
//           <ScrollArea className="flex-1 px-3 overflow-y-auto">
//             <div className="space-y-1 py-4">
//               {navItems.map((item) => {
//                 const isActive = pathname === item.href;
//                 const isDisabled = item.title === 'No Access';
                
//                 // ✅ Check if item has children
//                 if ((item as any).children) {
//                   const isExpanded = expandedItems[item.pageKey] && isOpen;
                  
//                   // ✅ Check if any child is active
//                   const isChildActive = (item as any).children?.some((child: any) => pathname === child.href);
                  
//                   return (
//                     <div key={`parent-${item.pageKey || item.title}`} className="space-y-1">
//                       {/* Parent item (Dropdown) */}
//                       <Button
//                         variant="ghost"
//                         onClick={() => toggleExpand(item.pageKey)}
//                         className={cn(
//                           "w-full justify-start gap-3 h-11 rounded-xl transition-all duration-200",
//                           !isOpen && "justify-center px-0",
//                           isChildActive
//                             ? "bg-[#FA9DB7]/10 text-[#B84A68] font-medium"
//                             : "text-gray-600 hover:text-[#FA9DB7] hover:bg-[#FA9DB7]/5"
//                         )}
//                       >
//                         <item.icon className={cn(
//                           "h-5 w-5",
//                           isChildActive ? "text-[#FA9DB7]" : "text-gray-400"
//                         )} />
//                         {isOpen && (
//                           <>
//                             <span className="text-sm flex-1 text-left">{item.title}</span>
//                             {isExpanded ? (
//                               <ChevronDown className="h-4 w-4 text-gray-400" />
//                             ) : (
//                               <ChevronRight className="h-4 w-4 text-gray-400" />
//                             )}
//                           </>
//                         )}
//                       </Button>
                      
//                       {/* Children items */}
//                       {isExpanded && isOpen && (
//                         <div className="ml-6 space-y-1 pl-3 border-l-2 border-[#FA9DB7]/20">
//                           {((item as any).children || []).map((child: any) => {
//                             const isChildActive = pathname === child.href;
//                             return (
//                               <Link 
//                                 key={`child-${child.href || child.pageKey}`} 
//                                 href={child.href}
//                               >
//                                 <Button
//                                   variant="ghost"
//                                   className={cn(
//                                     "w-full justify-start gap-3 h-10 rounded-xl transition-all duration-200",
//                                     isChildActive 
//                                       ? "bg-[#FA9DB7]/10 text-[#B84A68] font-medium" 
//                                       : "text-gray-500 hover:text-[#FA9DB7] hover:bg-[#FA9DB7]/5"
//                                   )}
//                                 >
//                                   <child.icon className={cn(
//                                     "h-4 w-4", 
//                                     isChildActive ? "text-[#FA9DB7]" : "text-gray-400"
//                                   )} />
//                                   <span className="text-sm">
//                                     {child.title}
//                                   </span>
//                                 </Button>
//                               </Link>
//                             );
//                           })}
//                         </div>
//                       )}
//                     </div>
//                   );
//                 }
                
//                 // ✅ Normal items (without children)
//                 return (
//                   <Link 
//                     key={item.href || `item-${item.pageKey}`} 
//                     href={isDisabled ? '#' : (item.href || '/')}
//                     className={isDisabled ? 'pointer-events-none cursor-not-allowed' : ''}
//                   >
//                     <Button
//                       variant="ghost"
//                       disabled={isDisabled}
//                       className={cn(
//                         "w-full justify-start gap-3 h-11 rounded-xl transition-all duration-200",
//                         !isOpen && "justify-center px-0",
//                         isActive 
//                           ? "bg-[#FA9DB7]/10 text-[#B84A68] font-medium shadow-sm" 
//                           : "text-gray-600 hover:text-[#FA9DB7] hover:bg-[#FA9DB7]/5",
//                         isDisabled && "opacity-50 cursor-not-allowed"
//                       )}
//                     >
//                       <item.icon className={cn(
//                         "h-5 w-5", 
//                         isActive ? "text-[#FA9DB7]" : "text-gray-400",
//                         isDisabled && "text-gray-300"
//                       )} />
//                       {isOpen && (
//                         <span className={cn(
//                           "text-sm",
//                           isDisabled && "text-gray-400"
//                         )}>
//                           {item.title}
//                         </span>
//                       )}
//                     </Button>
//                   </Link>
//                 );
//               })}
//             </div>
//           </ScrollArea>

//           {/* Logout */}
//           <div className="p-4 border-t border-gray-100">
//             <Button
//               variant="ghost"
//               className={cn(
//                 "w-full justify-start gap-3 h-11 rounded-xl text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200",
//                 !isOpen && "justify-center px-0"
//               )}
//               onClick={onLogout}
//             >
//               <LogOut className="h-5 w-5 text-gray-400 group-hover:text-red-500" />
//               {isOpen && (
//                 <span className="text-sm font-medium">Logout</span>
//               )}
//             </Button>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

// export function AdminMobileSidebar({ role, onLogout, isOpen, onToggle, allowedPages = [] }: SidebarProps) {
//   return (
//     <Button
//       variant="outline"
//       size="icon"
//       onClick={onToggle}
//       className="lg:hidden border-gray-200 hover:border-[#FA9DB7] hover:bg-[#FA9DB7]/5 transition-all duration-200"
//     >
//       <Menu className="h-5 w-5 text-gray-600" />
//     </Button>
//   );
// }

// // ✅ Helper function to get page key from href
// export function getPageKeyFromHref(href: string): string {
//   const pageMap: Record<string, string> = {
//     '/admin': 'dashboard',
//     '/admin/appointments': 'appointments',
//     '/admin/bookingcalender': 'booking calender',
//     '/admin/services': 'services',
//     '/admin/products': 'products',
//     '/admin/clients': 'clients',
//     '/admin/staff': 'staff',
//     '/admin/feedbacks': 'feedbacks',
//     '/admin/categories': 'categories',
//     '/admin/analytics': 'analytics',
//     '/admin/expenses': 'expenses',
//     '/admin/orders': 'orders',
//     '/admin/membership': 'membership',
//     '/admin/branches': 'branches',
//     '/admin/messages': 'messages',
//     '/admin/custominvoice': 'custom invoice',
//     '/admin/settings': 'settings',
//     '/super-admin': 'dashboard',
//     '/super-admin/appointments': 'appointments',
//     '/super-admin/bookingcalender': 'booking calender',
//     '/super-admin/services': 'services',
//     '/super-admin/products': 'products',
//     '/super-admin/categories': 'categories',
//     '/super-admin/report': 'report',
//     '/super-admin/sales': 'sales',
//     '/super-admin/attendance': 'attendance',
//     '/super-admin/clients': 'clients',
//     '/super-admin/staff': 'staff',
//     '/super-admin/feedback': 'feedbacks',
//     '/super-admin/analytics': 'analytics',
//     '/super-admin/expenses': 'expenses',
//     '/super-admin/orders': 'orders',
//     '/super-admin/membership': 'membership',
//     '/super-admin/branches': 'branches',
//     '/super-admin/users': 'users',
//     '/super-admin/blogs': 'blogs',
//     '/super-admin/custom-invoice': 'custom_invoice',
//     '/super-admin/settings': 'settings',
//     '/super-admin/messages': 'messages',
//   };
  
//   return pageMap[href] || '';
// }

// new code
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronRight, ChevronLeft, Menu } from 'lucide-react';
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
  FileText,
  ShoppingCart,
  Star,
  TrendingUp,
  Wrench,
  Sparkles,
  XCircle,
  Layout
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
    title: 'POS Checkout',
    href: '/admin/pos',
    icon: ShoppingCart,
    pageKey: 'pos'
  },
  {
    title: 'Membership',
    href: '/admin/membership',
    icon: Award,
    pageKey: 'membership'
  },
  {
    title: 'Admin chat',
    href: '/admin/messages',
    icon: MessageCircle,
    pageKey: 'messages'
  },
   {
    title: 'Customer chat',
    href: '/admin/customer-chats',
    icon: MessageCircle,
    pageKey: 'messages'
  },
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
      },
       {
        title: 'menu',
        href: '/super-admin/menu',
        icon: Tag,
        pageKey: 'menu'
      }
    ]
  },
  {
    title: 'Finance Report',
    icon: FileText,
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
    title: 'POS Checkout',
    href: '/super-admin/pos',
    icon: ShoppingCart,
    pageKey: 'pos'
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
    title: 'Users',
    href: '/super-admin/users',
    icon: Users,
    pageKey: 'users'
  },
  {
    title: 'Admin Tools',
    icon: Wrench,
    pageKey: 'admin_tools',
    children: [
      {
        title: 'CMS',
        href: '/super-admin/cms',
        icon: Layout,
        pageKey: 'cms'
      },
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
    ]
  },
  {
    title: 'Branch Chat',
    href: '/super-admin/messages',
    icon: MessageCircle,
    pageKey: 'messages'
  },
  {
    title: 'Customer Chat',
    href: '/super-admin/customer-chat',
    icon: MessageCircle,
    pageKey: 'messages'
  },
];

export function AdminSidebar({ 
  role, 
  onLogout, 
  isOpen: isOpenProp,
  onToggle: onToggleProp,
  allowedPages = []
}: SidebarProps) {
  const pathname = usePathname();
  const [internalOpen, setInternalOpen] = useState(true);
  const isOpen = isOpenProp !== undefined ? isOpenProp : internalOpen;
  const onToggle = onToggleProp ?? (() => setInternalOpen(prev => !prev));
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    'catalog': false,
    'admin_tools': false,
    'finance_report': false
  });
  
  // ✅ Base navigation items based on role
  let baseNavItems = role === 'super_admin' ? superAdminNavItems : branchAdminNavItems;
  
  // ✅ Filter navigation items based on allowedPages
  let navItems = baseNavItems;
  
  if (role === 'branch_admin' && allowedPages && allowedPages.length > 0) {
    const allowedPagesLower = allowedPages.map(page => page.toLowerCase());
    
    navItems = baseNavItems.filter(item => {
      if (item.pageKey) {
        return allowedPagesLower.includes(item.pageKey.toLowerCase());
      }
      return true;
    });
  }
  
  // ✅ If no items to show
  if (navItems.length === 0) {
    navItems = [{
      title: 'No Access',
      href: '#',
      icon: XCircle,
      pageKey: 'noaccess'
    }];
  }

  // ✅ Toggle expansion
  const toggleExpand = (pageKey: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [pageKey]: !prev[pageKey]
    }));
  };

  return (
    <>
      {/* ✅ Mobile/Tablet Overlay - Only when sidebar is open on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* ✅ Sidebar - Single instance with code2 colors */}
      <div className={cn(
        "h-full shrink-0 transition-all duration-300 ease-in-out",
        "fixed inset-y-0 left-0 z-50 lg:relative lg:z-auto",
        isOpen ? "translate-x-0 w-64" : "-translate-x-full w-64 lg:translate-x-0 lg:w-16",
        "lg:static"
      )}>
        <div className="flex flex-col h-full bg-primary border-r border-secondary/10">
          {/* Logo */}
          <div className="flex h-20 items-center px-4 lg:px-6">
            <div className="flex items-center justify-between w-full">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shadow-lg shadow-secondary/20">
                  <Scissors className="h-4 w-4 text-primary" />
                </div>
                {isOpen && (
                  <Image
                    src="/manofcavebradning.png"
                    alt="MAN OF CAVE"
                    width={140}
                    height={28}
                    className="h-6 w-auto object-contain brightness-0 invert"
                  />
                )}
              </Link>
              {/* Sidebar toggle button - always visible */}
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="h-8 w-8 rounded-lg text-gray-400 hover:text-secondary hover:bg-white/10 transition-all duration-200 flex-shrink-0"
                title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                {isOpen ? <ChevronLeft className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 overflow-y-auto">
            <div className="space-y-1 py-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const isDisabled = item.title === 'No Access';
                
                // ✅ Check if item has children
                if ((item as any).children) {
                  const isExpanded = expandedItems[item.pageKey] && isOpen;
                  
                  // ✅ Check if any child is active
                  const isChildActive = (item as any).children?.some((child: any) => pathname === child.href);
                  
                  return (
                    <div key={`parent-${item.pageKey || item.title}`} className="space-y-1">
                      {/* Parent item (Dropdown) */}
                      <Button
                        variant="ghost"
                        onClick={() => toggleExpand(item.pageKey)}
                        className={cn(
                          "w-full justify-start gap-3 h-11 rounded-lg transition-all duration-200",
                          !isOpen && "justify-center px-0",
                          isChildActive
                            ? "bg-secondary/20 text-secondary"
                            : "text-gray-400 hover:text-secondary hover:bg-white/5"
                        )}
                      >
                        <item.icon className={cn(
                          "h-5 w-5",
                          isChildActive ? "text-secondary" : "text-gray-400"
                        )} />
                        {isOpen && (
                          <>
                            <span className="text-sm flex-1 text-left">{item.title}</span>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                          </>
                        )}
                      </Button>
                      
                      {/* Children items */}
                      {isExpanded && isOpen && (
                        <div className="ml-6 space-y-1 pl-3 border-l-2 border-secondary/20">
                          {((item as any).children || []).map((child: any) => {
                            const isChildActive = pathname === child.href;
                            return (
                              <Link 
                                key={`child-${child.href || child.pageKey}`} 
                                href={child.href}
                              >
                                <Button
                                  variant="ghost"
                                  className={cn(
                                    "w-full justify-start gap-3 h-10 rounded-lg transition-all duration-200",
                                    isChildActive 
                                      ? "bg-secondary text-primary font-semibold shadow-lg shadow-secondary/20" 
                                      : "text-gray-400 hover:text-secondary hover:bg-white/5"
                                  )}
                                >
                                  <child.icon className={cn(
                                    "h-4 w-4", 
                                    isChildActive ? "text-primary" : "text-gray-400"
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
                
                // ✅ Normal items (without children)
                return (
                  <Link 
                    key={item.href || `item-${item.pageKey}`} 
                    href={isDisabled ? '#' : (item.href || '/')}
                    className={isDisabled ? 'pointer-events-none cursor-not-allowed' : ''}
                  >
                    <Button
                      variant="ghost"
                      disabled={isDisabled}
                      className={cn(
                        "w-full justify-start gap-3 h-11 rounded-lg transition-all duration-200",
                        !isOpen && "justify-center px-0",
                        isActive 
                          ? "bg-secondary text-primary font-semibold shadow-lg shadow-secondary/20" 
                          : "text-gray-400 hover:text-secondary hover:bg-white/5",
                        isDisabled && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <item.icon className={cn(
                        "h-5 w-5", 
                        isActive ? "text-primary" : "text-gray-400",
                        isDisabled && "text-gray-500"
                      )} />
                      {isOpen && (
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
          <div className="p-4 border-t border-secondary/10">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-11 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200",
                !isOpen && "justify-center px-0"
              )}
              onClick={onLogout}
            >
              <LogOut className="h-5 w-5" />
              {isOpen && (
                <span className="text-sm font-medium">Logout</span>
              )}
            </Button>
          </div>
        </div>
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
      className="lg:hidden border-gray-200 hover:border-secondary hover:bg-secondary/10 transition-all duration-200"
    >
      <Menu className="h-5 w-5 text-gray-600" />
    </Button>
  );
}

// ✅ Helper function to get page key from href
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
    '/admin/pos': 'pos',
    '/admin/membership': 'membership',
    '/admin/branches': 'branches',
    '/admin/messages': 'messages',
    '/admin/custominvoice': 'custom invoice',
    '/admin/settings': 'settings',
    '/super-admin': 'dashboard',
    '/super-admin/appointments': 'appointments',
    '/super-admin/bookingcalender': 'booking calender',
    '/super-admin/services': 'services',
    '/super-admin/products': 'products',
    '/super-admin/categories': 'categories',
    '/super-admin/report': 'report',
    '/super-admin/sales': 'sales',
    '/super-admin/attendance': 'attendance',
    '/super-admin/clients': 'clients',
    '/super-admin/staff': 'staff',
    '/super-admin/feedback': 'feedbacks',
    '/super-admin/analytics': 'analytics',
    '/super-admin/expenses': 'expenses',
    '/super-admin/orders': 'orders',
    '/super-admin/pos': 'pos',
    '/super-admin/membership': 'membership',
    '/super-admin/branches': 'branches',
    '/super-admin/users': 'users',
    '/super-admin/blogs': 'blogs',
    '/super-admin/custom-invoice': 'custom_invoice',
    '/super-admin/settings': 'settings',
    '/super-admin/messages': 'messages',
  };
  
  return pageMap[href] || '';
}