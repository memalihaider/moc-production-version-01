// 'use client';

// import { useAuth } from '@/contexts/AuthContext';

// import { AdminSidebar } from '@/components/admin/AdminSidebar';
// import { useRouter } from 'next/navigation';
// import { useEffect } from 'react';

// export default function AdminLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const { user, isLoading, logout } = useAuth();
//   const router = useRouter();
  
//   useEffect(() => {
//     // Debugging ke liye
//     console.log('🔍 Admin Layout - User:', user);
//     console.log('🔍 Admin Layout - Allowed Pages:', user?.allowedPages);
    
//     if (!isLoading && !user) {
//       router.push('/login');
//     }
    
//     // Agar customer admin page pe aaye toh redirect
//     if (user && user.role === 'customer') {
//       router.push('/customer/portal');
//     }
//   }, [user, isLoading, router]);
  
//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
//           <p className="mt-4 text-gray-600">Loading...</p>
//         </div>
//       </div>
//     );
//   }
  
//   if (!user || user.role === 'customer') {
//     return null; // Redirect ho jayega
//   }
  
//   // Role mapping
//   const sidebarRole = user.role === 'admin' ? 'branch_admin' : 'super_admin';
  
//   // Debug log
//   console.log('🎭 Sidebar Role:', sidebarRole);
//   console.log('📋 Passing allowedPages:', user.allowedPages || []);
  
//   return (
//     <div className="flex h-screen">
//       <AdminSidebar
//         role={sidebarRole}
//         onLogout={logout}
//         allowedPages={user.allowedPages || []} // 🔥 YEH LINE IMPORTANT HAI
//       />
//       <main className="flex-1 overflow-auto bg-gray-50">
//         <div className="p-6">
//           {children}
//         </div>
//       </main>
//     </div>
//   );
// }

// neww code final corrected cidee
// 'use client';

// import { useAuth } from '@/contexts/AuthContext';
// import { AdminSidebar } from '@/components/admin/AdminSidebar';
// import { useRouter } from 'next/navigation';
// import { useEffect } from 'react';

// export default function AdminLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const { user, isLoading, logout } = useAuth();
//   const router = useRouter();
  
//   useEffect(() => {
//     if (!isLoading && !user) {
//       router.push('/login');
//     }
//   }, [user, isLoading, router]);
  
//   if (isLoading) {
//     return <div>Loading...</div>;
//   }
  
//   if (!user) {
//     return null;
//   }
  
//   const sidebarRole = user.role === 'admin' ? 'branch_admin' : 'super_admin';
  
//   return (
//     <div className="flex h-screen">
//       <AdminSidebar
//         role={sidebarRole}
//         onLogout={logout}
//         allowedPages={user.allowedPages || []}
//       />
//       <main className="flex-1 overflow-auto">
//         {children}
//       </main>
//     </div>
//   );
// }

// new codee
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { hasPagePermission } from '@/lib/page-permissions';

// Map admin routes to their pageKey permission IDs
const routeToPageKey: Record<string, string> = {
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
  '/admin/messages': 'messages',
  '/admin/customer-chats': 'customer-chats',
  '/admin/custominvoice': 'custom invoice',
  '/admin/settings': 'settings',
  '/admin/branches': 'branches',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Permission enforcement for admin (non-super_admin) users
  useEffect(() => {
    if (isLoading || !user || !pathname) return;
    
    // Super admins have access to everything
    if (user.role === 'super_admin') return;

    // Find the matching pageKey for the current route
    const pageKey = routeToPageKey[pathname];
    
    // If not a recognized route, allow access (might be a sub-route)
    if (!pageKey) return;

    // Dashboard is always accessible
    if (pageKey === 'dashboard') return;

    if (!hasPagePermission(user.allowedPages, pageKey)) {
      // User does not have permission for this page
      router.push('/admin');
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}