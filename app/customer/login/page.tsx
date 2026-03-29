'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Sparkles } from 'lucide-react';

// Firebase imports
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useAuth } from '@/contexts/AuthContext';

export default function CustomerLogin() {
  const router = useRouter();
  const { login: authLogin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  // Register form state
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await authLogin(loginData.email, loginData.password, true);
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (registerData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        registerData.email,
        registerData.password
      );

      const user = userCredential.user;
      
      const customerData = {
        uid: user.uid,
        name: registerData.name,
        email: registerData.email,
        phone: registerData.phone,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "active",
        role: "customer",
        emailVerified: false,
        lastLogin: serverTimestamp()
      };

      await setDoc(doc(db, "customers", user.uid), customerData);
      
      await setDoc(doc(db, "users", user.uid), {
        email: registerData.email,
        name: registerData.name,
        role: "customer",
        createdAt: serverTimestamp(),
        status: "active"
      });

      const customerObj = {
        uid: user.uid,
        email: registerData.email,
        name: registerData.name,
        phone: registerData.phone,
        role: 'customer',
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem('customerAuth', JSON.stringify({
        isAuthenticated: true,
        customer: customerObj
      }));
      
      localStorage.setItem('user', JSON.stringify(customerObj));
      
      await signInWithEmailAndPassword(auth, registerData.email, registerData.password);
      
      setSuccess('Account created successfully! Redirecting...');
      
      setTimeout(() => {
        router.push('/customer/portal');
      }, 1500);

    } catch (firebaseError: any) {
      console.error("❌ Firebase Error: ", firebaseError);
      
      if (firebaseError.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please login instead.');
      } else if (firebaseError.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else if (firebaseError.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a stronger password.');
      } else if (firebaseError.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(`Registration failed: ${firebaseError.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const email = loginData.email.trim().toLowerCase();
    if (!email) {
      setError('Please enter your email to reset your password.');
      setSuccess('');
      return;
    }

    setIsResetting(true);
    setError('');
    setSuccess('');

    try {
      const continueUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/customer/login`
        : 'http://localhost:3000/customer/login';

      await sendPasswordResetEmail(auth, email, {
        url: continueUrl,
        handleCodeInApp: false,
      });
      setSuccess('Password reset email sent. Check your inbox.');
    } catch (firebaseError: any) {
      console.error('Password reset error:', firebaseError);
      if (firebaseError.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else if (firebaseError.code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else if (firebaseError.code === 'auth/unauthorized-continue-uri') {
        setError('Password reset is not authorized for this domain. Add localhost:3000 to Firebase Auth authorized domains.');
      } else if (firebaseError.code === 'auth/operation-not-allowed') {
        setError('Password reset is disabled in Firebase Auth settings.');
      } else if (firebaseError.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(`Password reset failed: ${firebaseError.message}`);
      }
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900">
      
      <div className="pt-16 pb-16 px-4">
        <div className="max-w-md mx-auto">
          {/* Premium Hero Section */}
          <div className="text-center mb-10">
            {/* Gold Accent Line */}
            <div className="flex justify-center mb-5">
              <div className="w-20 h-1 bg-[#c5a059] rounded-full"></div>
            </div>
            
            {/* Customer Portal Badge */}
            <div className="inline-block mb-4">
              <span className="inline-flex items-center px-5 py-2 rounded-full bg-zinc-800 border border-zinc-700 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 mr-2 text-[#c5a059]" />
                <span className="text-zinc-300 font-medium tracking-[0.2em] uppercase text-[10px]">
                  CUSTOMER PORTAL
                </span>
              </span>
            </div>
            
            {/* Brand Name */}
            <h1 className="text-4xl md:text-5xl font-sans font-bold mb-3">
              <span className="text-[#c5a059] italic drop-shadow-sm">
                Man of Cave
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-zinc-400 text-sm font-light tracking-wide">
              Premium grooming for the modern man
            </p>
          </div>

          {/* Premium Card - Dark with Gold Accents */}
          <Card className="border border-zinc-700 bg-zinc-900 shadow-xl shadow-black/50 hover:shadow-2xl hover:shadow-[#c5a059]/20 transition-all duration-500 rounded-3xl overflow-hidden">
            
            {/* Gold Top Border */}
            <div className="h-1.5 w-full bg-[#c5a059]"></div>
            
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-zinc-800 p-1.5 rounded-none border-b border-zinc-700">
                <TabsTrigger 
                  value="login" 
                  className="rounded-xl font-semibold text-xs tracking-[0.15em] uppercase py-3 data-[state=active]:bg-[#c5a059] data-[state=active]:text-black data-[state=active]:shadow-md text-zinc-400 hover:text-zinc-200 transition-all"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  className="rounded-xl font-semibold text-xs tracking-[0.15em] uppercase py-3 data-[state=active]:bg-[#c5a059] data-[state=active]:text-black data-[state=active]:shadow-md text-zinc-400 hover:text-zinc-200 transition-all"
                >
                  Register
                </TabsTrigger>
              </TabsList>
              
              {/* Login Tab */}
              <TabsContent value="login" className="p-0">
                <CardHeader className="pb-4 pt-8 px-8">
                  <CardTitle className="text-2xl font-sans font-bold text-zinc-100">
                    Welcome Back
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Enter your credentials to access your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                      <div className="bg-red-950/50 border border-red-800 text-red-400 px-4 py-3 rounded-xl text-sm">
                        {error}
                      </div>
                    )}
                    
                    {success && (
                      <div className="bg-green-950/50 border border-green-800 text-green-400 px-4 py-3 rounded-xl text-sm">
                        {success}
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
                        Email Address
                      </Label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-[#c5a059] transition-colors" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="you@example.com"
                          value={loginData.email}
                          onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                          className="pl-11 h-14 rounded-2xl border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:bg-zinc-800 focus:ring-2 focus:ring-[#c5a059] focus:border-transparent transition-all"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
                        Password
                      </Label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-[#c5a059] transition-colors" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={loginData.password}
                          onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                          className="pl-11 pr-11 h-14 rounded-2xl border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:bg-zinc-800 focus:ring-2 focus:ring-[#c5a059] focus:border-transparent transition-all"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-[#c5a059] transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handlePasswordReset}
                          disabled={isResetting}
                          className="text-xs text-[#c5a059] hover:text-[#b08a45] transition-colors disabled:opacity-60"
                        >
                          {isResetting ? 'SENDING RESET...' : 'Forgot password?'}
                        </button>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="relative w-full h-14 bg-[#c5a059] hover:bg-[#b08a45] text-black font-semibold tracking-[0.15em] text-xs rounded-2xl transition-all duration-500 shadow-md shadow-[#c5a059]/30 hover:shadow-lg hover:shadow-[#c5a059]/40 hover:-translate-y-0.5 overflow-hidden group"
                      disabled={isLoading}
                    >
                      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                      {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </form>

                  <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
                    <p className="text-zinc-400 text-sm">
                      Don't have an account?{' '}
                      <Link href="#register" className="text-[#c5a059] font-semibold hover:text-[#b08a45] transition-colors">
                        Register here
                      </Link>
                    </p>
                    <div className="mt-3">
                      <Link href="/" className="text-zinc-500 hover:text-[#c5a059] text-sm flex items-center justify-center gap-2 transition-colors">
                        ← Back to Home
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </TabsContent>
              
              {/* Register Tab */}
              <TabsContent value="register" className="p-0">
                <CardHeader className="pb-4 pt-8 px-8">
                  <CardTitle className="text-2xl font-sans font-bold text-zinc-100">
                    Create Account
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Join our exclusive members club
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <form onSubmit={handleRegister} className="space-y-5">
                    {success && (
                      <div className="bg-green-950/50 border border-green-800 text-green-400 px-4 py-3 rounded-xl text-sm">
                        {success}
                      </div>
                    )}
                    
                    {error && (
                      <div className="bg-red-950/50 border border-red-800 text-red-400 px-4 py-3 rounded-xl text-sm">
                        {error}
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
                        Full Name
                      </Label>
                      <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-[#c5a059] transition-colors" />
                        <Input
                          id="name"
                          type="text"
                          placeholder="John Doe"
                          value={registerData.name}
                          onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                          className="pl-11 h-14 rounded-2xl border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:bg-zinc-800 focus:ring-2 focus:ring-[#c5a059] focus:border-transparent transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reg-email" className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
                        Email Address
                      </Label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-[#c5a059] transition-colors" />
                        <Input
                          id="reg-email"
                          type="email"
                          placeholder="you@example.com"
                          value={registerData.email}
                          onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                          className="pl-11 h-14 rounded-2xl border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:bg-zinc-800 focus:ring-2 focus:ring-[#c5a059] focus:border-transparent transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
                        Phone Number
                      </Label>
                      <div className="relative group">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-[#c5a059] transition-colors" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="(555) 123-4567"
                          value={registerData.phone}
                          onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                          className="pl-11 h-14 rounded-2xl border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:bg-zinc-800 focus:ring-2 focus:ring-[#c5a059] focus:border-transparent transition-all"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reg-password" className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
                        Password
                      </Label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-[#c5a059] transition-colors" />
                        <Input
                          id="reg-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create a password (min 6 characters)"
                          value={registerData.password}
                          onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                          className="pl-11 h-14 rounded-2xl border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:bg-zinc-800 focus:ring-2 focus:ring-[#c5a059] focus:border-transparent transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400">
                        Confirm Password
                      </Label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-[#c5a059] transition-colors" />
                        <Input
                          id="confirm-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Confirm your password"
                          value={registerData.confirmPassword}
                          onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                          className="pl-11 h-14 rounded-2xl border-zinc-700 bg-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:bg-zinc-800 focus:ring-2 focus:ring-[#c5a059] focus:border-transparent transition-all"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-[#c5a059] transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="relative w-full h-14 bg-[#c5a059] hover:bg-[#b08a45] text-black font-semibold tracking-[0.15em] text-xs rounded-2xl transition-all duration-500 shadow-md shadow-[#c5a059]/30 hover:shadow-lg hover:shadow-[#c5a059]/40 hover:-translate-y-0.5 overflow-hidden group"
                      disabled={isLoading}
                    >
                      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                      {isLoading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </form>
                </CardContent>
              </TabsContent>
            </Tabs>
          </Card>

         
          
          {/* Footer Note */}
          <div className="text-center mt-8">
            <p className="text-zinc-500 text-xs">
              © 2026 Man of Cave. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}