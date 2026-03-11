// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { useAuth } from '@/contexts/AuthContext';
// import { Scissors, Eye, EyeOff, Loader2, Lock, Sparkles } from 'lucide-react';

// export default function LoginPage() {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [error, setError] = useState('');
//   const { login, isLoading } = useAuth();
//   const router = useRouter();

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('');

//     if (!email || !password) {
//       setError('Please fill in all fields');
//       return;
//     }

//     try {
//       const success = await login(email, password);
//       if (!success) {
//         setError('Invalid email or password');
//       }
//     } catch (error: any) {
//       setError(error.message || 'Login failed. Please check your credentials.');
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
      
//       {/* Premium Background Elements - Soft Pink */}
//       <div className="absolute inset-0 opacity-20">
//         <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#FA9DB7] blur-[150px] animate-pulse"></div>
//         <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#FA9DB7] blur-[150px] animate-pulse"></div>
//       </div>
      
//       {/* Subtle Texture */}
//       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] pointer-events-none"></div>

//       {/* Main Card - White with Pink Accents */}
//       <Card className="w-full max-w-md border border-gray-200 bg-white shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-[#FA9DB7]/20 transition-all duration-500 rounded-3xl relative z-10 overflow-hidden">
        
//         {/* Pink Top Border - #FA9DB7 */}
//         <div className="h-1.5 w-full bg-[#FA9DB7]"></div>
        
//         <CardHeader className="text-center pt-12 pb-8 px-10">
//           {/* Admin Badge - Gray */}
//           <div className="inline-flex items-center justify-center mb-4 mx-auto">
//             <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-gray-100 border border-gray-200">
//               <Lock className="w-3.5 h-3.5 mr-2 text-[#FA9DB7]" />
//               <span className="text-gray-700 font-medium tracking-[0.2em] uppercase text-[9px]">
//                 ADMIN PORTAL
//               </span>
//             </span>
//           </div>
          
//           {/* Brand Name - Pink #FA9DB7 */}
//           <CardTitle className="text-3xl font-sans font-bold mb-2">
//             <span className="text-[#FA9DB7]">Jam</span>
//             <span className="text-gray-800">Beauty Lounge</span>
//           </CardTitle>
          
//           {/* Description - Gray */}
//           <CardDescription className="text-gray-500 font-light tracking-widest uppercase text-[10px]">
//             Administrative Concierge
//           </CardDescription>
          
//           {/* Pink Accent Line */}
//           <div className="flex justify-center mt-4">
//             <div className="w-12 h-0.5 bg-[#FA9DB7]/30 rounded-full"></div>
//           </div>
//         </CardHeader>

//         <CardContent className="px-10 pb-12">
//           <form onSubmit={handleSubmit} className="space-y-6">
//             {/* Email Field */}
//             <div className="space-y-2">
//               <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-600 ml-1">
//                 Email Address
//               </label>
//               <div className="relative group">
//                 <Input
//                   type="email"
//                   placeholder="admin@jamlounge.com"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   className="h-14 rounded-2xl border-gray-200 bg-gray-50/50 text-gray-800 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#FA9DB7] focus:border-transparent transition-all pl-4"
//                   disabled={isLoading}
//                 />
//               </div>
//             </div>
            
//             {/* Password Field */}
//             <div className="space-y-2">
//               <label className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gray-600 ml-1">
//                 Security Key
//               </label>
//               <div className="relative group">
//                 <Input
//                   type={showPassword ? 'text' : 'password'}
//                   placeholder="••••••••"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   className="h-14 rounded-2xl border-gray-200 bg-gray-50/50 text-gray-800 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-[#FA9DB7] focus:border-transparent transition-all pr-12 pl-4"
//                   disabled={isLoading}
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#FA9DB7] transition-colors"
//                   disabled={isLoading}
//                 >
//                   {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
//                 </button>
//               </div>
//             </div>

//             {/* Error Message */}
//             {error && (
//               <Alert className="bg-red-50 border border-red-200 text-red-600 rounded-2xl">
//                 <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
//               </Alert>
//             )}

//             {/* Submit Button - Pink #FA9DB7 */}
//             <Button
//               type="submit"
//               className="relative w-full h-14 bg-[#FA9DB7] hover:bg-[#E87A9B] text-white font-semibold tracking-[0.15em] text-xs rounded-2xl transition-all duration-500 shadow-md shadow-[#FA9DB7]/30 hover:shadow-lg hover:shadow-[#FA9DB7]/40 hover:-translate-y-0.5 overflow-hidden group"
//               disabled={isLoading}
//             >
//               <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
//               {isLoading ? (
//                 <>
//                   <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//                   AUTHENTICATING...
//                 </>
//               ) : (
//                 'ACCESS PANEL'
//               )}
//             </Button>
//           </form>

          
          
//           {/* Back to Home Link */}
//           <div className="mt-6 text-center">
//             <a 
//               href="/" 
//               className="text-gray-400 hover:text-[#FA9DB7] text-sm transition-colors inline-flex items-center gap-2"
//             >
//               ← Back to Home
//             </a>
//           </div>
//         </CardContent>
//       </Card>
      
//       {/* Footer Note */}
//       <div className="absolute bottom-6 left-0 right-0 text-center">
//         <p className="text-gray-400 text-xs">
//           © 2026 Jam Beauty Lounge. All rights reserved.
//         </p>
//       </div>
//     </div>
//   );
// }

// new code

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { Scissors, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const success = await login(email, password);
      if (!success) {
        setError('Invalid email or password');
      }
    } catch (error: any) {
      setError(error.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Premium Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-secondary blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-secondary blur-[150px] animate-pulse"></div>
      </div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05] pointer-events-none"></div>

      <Card className="w-full max-w-md border-white/5 bg-white/[0.02] backdrop-blur-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-secondary to-transparent"></div>
        
        <CardHeader className="text-center pt-12 pb-8">
          <div className="w-20 h-20 bg-secondary/20 border border-secondary/30 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Scissors className="w-10 h-10 text-secondary" />
          </div>
          <CardTitle className="text-3xl font-sans font-bold text-white mb-2">MAN OF<span className="text-secondary">CAVE</span></CardTitle>
          <CardDescription className="text-gray-400 font-light tracking-widest uppercase text-[10px]">Administrative Concierge</CardDescription>
        </CardHeader>

        <CardContent className="px-10 pb-12">
        
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary ml-1">Email Address</label>
              <Input
                type="email"
                placeholder="concierge@manofcave.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 rounded-2xl border-white/5 bg-white/5 text-white placeholder:text-gray-600 focus:border-secondary focus:ring-secondary transition-all"
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary ml-1">Security Key</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-14 rounded-2xl border-white/5 bg-white/5 text-white placeholder:text-gray-600 focus:border-secondary focus:ring-secondary transition-all pr-12"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-secondary transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <Alert className="bg-red-500/10 border-red-500/20 text-red-500 rounded-2xl">
                <AlertDescription className="text-xs font-bold tracking-wide">{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-16 bg-secondary hover:bg-white text-primary font-black tracking-[0.2em] text-xs rounded-2xl transition-all duration-500 shadow-xl shadow-secondary/10"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  AUTHENTICATING...
                </>
              ) : (
                'ACCESS PANEL'
              )}
            </Button>
          </form>

          {/* Demo Credentials Section */}
          
        </CardContent>
      </Card>
    </div>
  );
}