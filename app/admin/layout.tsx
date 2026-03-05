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
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

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