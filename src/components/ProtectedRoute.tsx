// // 'use client';

// // import { useEffect } from 'react';
// // import { useRouter } from 'next/navigation';
// // import { useAuth } from '@/contexts/AuthContext';
// // import { Card, CardContent } from '@/components/ui/card';
// // import { Scissors } from 'lucide-react';

// // interface ProtectedRouteProps {
// //   children: React.ReactNode;
// //   requiredRole?: 'branch_admin' | 'super_admin';
// // }

// // export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
// //   const { user, isLoading } = useAuth();
// //   const router = useRouter();

// //   useEffect(() => {
// //     if (!isLoading && !user) {
// //       router.push('/login');
// //     } else if (!isLoading && user && requiredRole && user.role !== requiredRole) {
// //       // If user doesn't have required role, redirect to appropriate admin page
// //       if (user.role === 'admin') {
// //         router.push('/admin');
// //       } else {
// //         router.push('/super-admin');
// //       }
// //     }
// //   }, [user, isLoading, router, requiredRole]);

// //   if (isLoading) {
// //     return (
// //       <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-secondary flex items-center justify-center">
// //         <Card className="w-96">
// //           <CardContent className="p-8 text-center">
// //             <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
// //               <Scissors className="w-8 h-8 text-primary" />
// //             </div>
// //             <h2 className="text-xl font-sans text-primary mb-2">Loading...</h2>
// //             <p className="text-gray-600">Please wait while we verify your access.</p>
// //           </CardContent>
// //         </Card>
// //       </div>
// //     );
// //   }

// //   if (!user) {
// //     return null; // Will redirect in useEffect
// //   }

// //   if (requiredRole && user.role !== requiredRole) {
// //     return null; // Will redirect in useEffect
// //   }

// //   return <>{children}</>;
// // }

// // new code
// 'use client';

// import { useEffect, useState } from 'react';
// import { useRouter, usePathname } from 'next/navigation';
// import { useAuth } from '@/contexts/AuthContext';
// import { Card, CardContent } from '@/components/ui/card';
// import { Scissors, ShieldAlert } from 'lucide-react';

// interface ProtectedRouteProps {
//   children: React.ReactNode;
//   requiredRole?: 'admin' | 'super_admin'|'customer';
// }

// export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
//   const { user, isLoading } = useAuth();
//   const router = useRouter();
//   const pathname = usePathname();
//   const [accessDenied, setAccessDenied] = useState(false);

//   useEffect(() => {
//     // Skip check during loading
//     if (isLoading) return;

//     console.log('🔐 Protected Route Check:', {
//       pathname,
//       userRole: user?.role,
//       requiredRole,
//       hasUser: !!user
//     });

//     // Case 1: No user at all
//     if (!user) {
//       console.log('❌ No user found, redirecting to login');
//       router.push('/login');
//       return;
//     }

//     // Case 2: User exists but wrong role
//     if (requiredRole && user.role !== requiredRole) {
//       console.log(`❌ Role mismatch. User: ${user.role}, Required: ${requiredRole}`);
//       setAccessDenied(true);
      
//       // Show alert
//       alert(`ACCESS DENIED!\n\nYou are logged in as: ${user.role.toUpperCase()}\nThis page requires: ${requiredRole.toUpperCase()}\n\nYou will be redirected to your dashboard.`);
      
//       // Redirect to appropriate dashboard
//       if (user.role === 'super_admin') {
//         router.push('/super-admin');
//       } else {
//         router.push('/admin');
//       }
//       return;
//     }

//     // Case 3: Admin trying to access super-admin routes
//     if (user.role === 'admin' && pathname.startsWith('/super-admin')) {
//       console.log('❌ Admin trying to access super-admin route');
//       setAccessDenied(true);
//       alert('ADMIN ACCESS DENIED!\n\nYou cannot access Super Admin pages.\nRedirecting to Admin Dashboard.');
//       router.push('/admin');
//       return;
//     }

//     // Case 4: Super admin accessing admin routes (optional - allow if you want)
//     // if (user.role === 'super_admin' && pathname.startsWith('/admin')) {
//     //   // Allow super admin to access admin pages
//     //   console.log('✅ Super admin accessing admin route - Allowed');
//     // }

//     setAccessDenied(false);
//   }, [user, isLoading, router, requiredRole, pathname]);

//   // Show loading state
//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-secondary flex items-center justify-center">
//         <Card className="w-96">
//           <CardContent className="p-8 text-center">
//             <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
//               <Scissors className="w-8 h-8 text-primary" />
//             </div>
//             <h2 className="text-xl font-sans text-primary mb-2">Verifying Access...</h2>
//             <p className="text-gray-600">Checking your permissions</p>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   // Show access denied state
//   if (accessDenied) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
//         <Card className="w-full max-w-md">
//           <CardContent className="p-8 text-center">
//             <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
//               <ShieldAlert className="w-10 h-10 text-red-600" />
//             </div>
            
//             <h1 className="text-3xl font-bold text-gray-900 mb-3">Access Restricted</h1>
//             <p className="text-gray-600 mb-4">
//               You don't have permission to access this page.
//             </p>
//             <p className="text-sm text-gray-500 mb-6">
//               Logged in as: <span className="font-bold">{user?.role?.toUpperCase() || 'Unknown'}</span>
//             </p>
            
//             <div className="space-y-3">
//               <Button
//                 onClick={() => {
//                   if (user?.role === 'super_admin') {
//                     router.push('/super-admin');
//                   } else {
//                     router.push('/admin');
//                   }
//                 }}
//                 className="w-full bg-blue-600 hover:bg-blue-700"
//               >
//                 Go to Your Dashboard
//               </Button>
              
//               <Button
//                 onClick={() => router.push('/login')}
//                 variant="outline"
//                 className="w-full"
//               >
//                 Login as Different User
//               </Button>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   // Show content if authorized
//   if (!user || (requiredRole && user.role !== requiredRole)) {
//     return null; // Will be handled by useEffect
//   }

//   return <>{children}</>;
// }

// // Add Button import if not already imported
// import { Button } from '@/components/ui/button';


// new code
// 'use client';

// import { useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { useAuth } from '@/contexts/AuthContext';
// import { Card, CardContent } from '@/components/ui/card';
// import { Scissors } from 'lucide-react';

// interface ProtectedRouteProps {
//   children: React.ReactNode;
//   requiredRole?: 'branch_admin' | 'super_admin';
// }

// export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
//   const { user, isLoading } = useAuth();
//   const router = useRouter();

//   useEffect(() => {
//     if (!isLoading && !user) {
//       router.push('/login');
//     } else if (!isLoading && user && requiredRole && user.role !== requiredRole) {
//       // If user doesn't have required role, redirect to appropriate admin page
//       if (user.role === 'admin') {
//         router.push('/admin');
//       } else {
//         router.push('/super-admin');
//       }
//     }
//   }, [user, isLoading, router, requiredRole]);

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-secondary flex items-center justify-center">
//         <Card className="w-96">
//           <CardContent className="p-8 text-center">
//             <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
//               <Scissors className="w-8 h-8 text-primary" />
//             </div>
//             <h2 className="text-xl font-sans text-primary mb-2">Loading...</h2>
//             <p className="text-gray-600">Please wait while we verify your access.</p>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   if (!user) {
//     return null; // Will redirect in useEffect
//   }

//   if (requiredRole && user.role !== requiredRole) {
//     return null; // Will redirect in useEffect
//   }

//   return <>{children}</>;
// }

// new code
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Scissors, ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'super_admin'|'customer';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    // Skip check during loading
    if (isLoading) return;

    console.log('🔐 Protected Route Check:', {
      pathname,
      userRole: user?.role,
      requiredRole,
      hasUser: !!user
    });

    // Case 1: No user at all
    if (!user) {
      console.log('❌ No user found, redirecting to login');
      router.push('/login');
      return;
    }

    // Case 2: User exists but wrong role
    if (requiredRole && user.role !== requiredRole) {
      console.log(`❌ Role mismatch. User: ${user.role}, Required: ${requiredRole}`);
      setAccessDenied(true);
      
      // // Show alert
      // alert(`ACCESS DENIED!\n\nYou are logged in as: ${user.role.toUpperCase()}\nThis page requires: ${requiredRole.toUpperCase()}.`);
      
      // Redirect to appropriate dashboard
     
    }

    // Case 3: Admin trying to access super-admin routes
    if (user.role === 'admin' && pathname.startsWith('/super-admin')) {
      console.log('❌ Admin trying to access super-admin route');
      setAccessDenied(true);
      alert('ADMIN ACCESS DENIED!\n\nYou cannot access Super Admin pages.\nRedirecting to Admin Dashboard.');
      router.push('/admin');
      return;
    }

    // Case 4: Super admin accessing admin routes (optional - allow if you want)
    // if (user.role === 'super_admin' && pathname.startsWith('/admin')) {
    //   // Allow super admin to access admin pages
    //   console.log('✅ Super admin accessing admin route - Allowed');
    // }

    setAccessDenied(false);
  }, [user, isLoading, router, requiredRole, pathname]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-secondary flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Scissors className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-sans text-primary mb-2">Verifying Access...</h2>
            <p className="text-gray-600">Checking your permissions</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show access denied state
  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-10 h-10 text-red-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Access Restricted</h1>
            <p className="text-gray-600 mb-4">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Logged in as: <span className="font-bold">{user?.role?.toUpperCase() || 'Unknown'}</span>
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={() => {
                  if (user?.role === 'super_admin') {
                    router.push('/super-admin');
                  } else {
                    router.push('/admin');
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Go to Your Dashboard
              </Button>
              
              <Button
                onClick={() => router.push('/login')}
                variant="outline"
                className="w-full"
              >
                Login as Different User
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show content if authorized
  if (!user || (requiredRole && user.role !== requiredRole)) {
    return null; // Will be handled by useEffect
  }

  return <>{children}</>;
}

// Add Button import if not already imported
import { Button } from '@/components/ui/button';