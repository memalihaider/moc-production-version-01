'use client';

// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import Link from 'next/link';
// import { Header } from '@/components/shared/Header';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Textarea } from '@/components/ui/textarea';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import {
//   User,
//   Mail,
//   Phone,
//   Calendar,
//   MapPin,
//   ChevronLeft,
//   Loader2,
//   Save,
//   CheckCircle,
//   Camera,
//   Building,
//   Lock,
//   Eye,
//   EyeOff,
// } from 'lucide-react';
// import { useCustomerStore, type Customer } from '@/stores/customer.store';

// export default function CustomerProfile() {
//   const router = useRouter();
//   const [customer, setCustomer] = useState<Customer | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isSaving, setIsSaving] = useState(false);
//   const [saveSuccess, setSaveSuccess] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
  
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     phone: '',
//     dateOfBirth: '',
//     gender: '',
//     address: '',
//     preferredBranch: '',
//     currentPassword: '',
//     newPassword: '',
//     confirmPassword: '',
//   });

//   const { getCustomerByEmail, updateCustomer } = useCustomerStore();

//   useEffect(() => {
//     const checkAuth = () => {
//       const authData = localStorage.getItem('customerAuth');
//       if (!authData) {
//         router.push('/customer/login');
//         return;
//       }

//       try {
//         const { isAuthenticated, customer: customerData } = JSON.parse(authData);
//         if (!isAuthenticated) {
//           router.push('/customer/login');
//           return;
//         }

//         const fullCustomer = getCustomerByEmail(customerData.email);
//         if (fullCustomer) {
//           setCustomer(fullCustomer);
//           setFormData({
//             name: fullCustomer.name || '',
//             email: fullCustomer.email || '',
//             phone: fullCustomer.phone || '',
//             dateOfBirth: fullCustomer.dateOfBirth || '',
//             gender: fullCustomer.gender || '',
//             address: fullCustomer.address || '',
//             preferredBranch: fullCustomer.preferredBranch || '',
//             currentPassword: '',
//             newPassword: '',
//             confirmPassword: '',
//           });
//         } else {
//           setCustomer({
//             id: 'temp-' + customerData.email,
//             email: customerData.email,
//             name: customerData.name,
//             phone: customerData.phone,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//           });
//           setFormData({
//             name: customerData.name || '',
//             email: customerData.email || '',
//             phone: customerData.phone || '',
//             dateOfBirth: '',
//             gender: '',
//             address: '',
//             preferredBranch: '',
//             currentPassword: '',
//             newPassword: '',
//             confirmPassword: '',
//           });
//         }
//       } catch (error) {
//         router.push('/customer/login');
//       }
//       setIsLoading(false);
//     };

//     checkAuth();
//   }, [router, getCustomerByEmail]);

//   const handleSave = async () => {
//     if (!customer) return;
    
//     setIsSaving(true);
    
//     // Simulate API call
//     await new Promise(resolve => setTimeout(resolve, 1000));
    
//     updateCustomer(customer.id, {
//       name: formData.name,
//       phone: formData.phone,
//       dateOfBirth: formData.dateOfBirth,
//       gender: formData.gender as 'male' | 'female' | 'other' | undefined,
//       address: formData.address,
//       preferredBranch: formData.preferredBranch,
//     });

//     // Update localStorage
//     const authData = localStorage.getItem('customerAuth');
//     if (authData) {
//       const parsed = JSON.parse(authData);
//       parsed.customer.name = formData.name;
//       parsed.customer.phone = formData.phone;
//       localStorage.setItem('customerAuth', JSON.stringify(parsed));
//     }
    
//     setIsSaving(false);
//     setSaveSuccess(true);
//     setTimeout(() => setSaveSuccess(false), 3000);
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center">
//         <div className="text-center">
//           <Loader2 className="w-8 h-8 animate-spin text-secondary mx-auto mb-4" />
//           <p className="text-muted-foreground">Loading your profile...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!customer) return null;

//   return (
//     <div className="min-h-screen bg-[#fcfcfc]">
//       <Header />

//       <div className="pt-24 pb-16 px-4">
//         <div className="max-w-3xl mx-auto">
//           {/* Header */}
//           <div className="flex items-center gap-4 mb-8">
//             <Link href="/customer/portal">
//               <Button variant="ghost" className="p-2 hover:bg-gray-100 rounded-xl">
//                 <ChevronLeft className="w-5 h-5" />
//               </Button>
//             </Link>
//             <div>
//               <h1 className="text-3xl font-sans font-bold text-primary">My Profile</h1>
//               <p className="text-muted-foreground">Manage your account settings</p>
//             </div>
//           </div>

//           {/* Profile Avatar Section */}
//           <Card className="border-none shadow-lg rounded-2xl mb-6">
//             <CardContent className="p-6">
//               <div className="flex flex-col md:flex-row items-center gap-6">
//                 <div className="relative">
//                   <Avatar className="w-24 h-24 border-4 border-secondary">
//                     <AvatarImage src={customer.avatar} />
//                     <AvatarFallback className="bg-secondary text-primary text-2xl font-bold">
//                       {customer.name?.charAt(0) || 'C'}
//                     </AvatarFallback>
//                   </Avatar>
//                   <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90">
//                     <Camera className="w-4 h-4" />
//                   </button>
//                 </div>
//                 <div className="text-center md:text-left">
//                   <h2 className="text-2xl font-bold text-primary">{customer.name}</h2>
//                   <p className="text-muted-foreground">{customer.email}</p>
//                   <p className="text-sm text-muted-foreground mt-1">
//                     Member since {new Date(customer.createdAt).toLocaleDateString()}
//                   </p>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Personal Information */}
//           <Card className="border-none shadow-lg rounded-2xl mb-6">
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <User className="w-5 h-5 text-secondary" />
//                 Personal Information
//               </CardTitle>
//               <CardDescription>Update your personal details</CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-6">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-2">
//                   <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest">
//                     Full Name
//                   </Label>
//                   <div className="relative">
//                     <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
//                     <Input
//                       id="name"
//                       value={formData.name}
//                       onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                       className="pl-10 h-12 rounded-xl border-gray-200"
//                       placeholder="Enter your name"
//                     />
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest">
//                     Email Address
//                   </Label>
//                   <div className="relative">
//                     <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
//                     <Input
//                       id="email"
//                       type="email"
//                       value={formData.email}
//                       disabled
//                       className="pl-10 h-12 rounded-xl border-gray-200 bg-gray-50"
//                     />
//                   </div>
//                   <p className="text-xs text-muted-foreground">Email cannot be changed</p>
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest">
//                     Phone Number
//                   </Label>
//                   <div className="relative">
//                     <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
//                     <Input
//                       id="phone"
//                       value={formData.phone}
//                       onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
//                       className="pl-10 h-12 rounded-xl border-gray-200"
//                       placeholder="Enter phone number"
//                     />
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="dob" className="text-xs font-bold uppercase tracking-widest">
//                     Date of Birth
//                   </Label>
//                   <div className="relative">
//                     <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
//                     <Input
//                       id="dob"
//                       type="date"
//                       value={formData.dateOfBirth}
//                       onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
//                       className="pl-10 h-12 rounded-xl border-gray-200"
//                     />
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="gender" className="text-xs font-bold uppercase tracking-widest">
//                     Gender
//                   </Label>
//                   <Select 
//                     value={formData.gender} 
//                     onValueChange={(value) => setFormData({ ...formData, gender: value })}
//                   >
//                     <SelectTrigger className="h-12 rounded-xl border-gray-200">
//                       <SelectValue placeholder="Select gender" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="male">Male</SelectItem>
//                       <SelectItem value="female">Female</SelectItem>
//                       <SelectItem value="other">Other</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="branch" className="text-xs font-bold uppercase tracking-widest">
//                     Preferred Branch
//                   </Label>
//                   <div className="relative">
//                     <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
//                     <Select 
//                       value={formData.preferredBranch} 
//                       onValueChange={(value) => setFormData({ ...formData, preferredBranch: value })}
//                     >
//                       <SelectTrigger className="pl-10 h-12 rounded-xl border-gray-200">
//                         <SelectValue placeholder="Select branch" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="branch1">Downtown Branch</SelectItem>
//                         <SelectItem value="branch2">Uptown Branch</SelectItem>
//                         <SelectItem value="branch3">Mall Branch</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="address" className="text-xs font-bold uppercase tracking-widest">
//                   Address
//                 </Label>
//                 <div className="relative">
//                   <MapPin className="absolute left-4 top-3 w-4 h-4 text-muted-foreground" />
//                   <Textarea
//                     id="address"
//                     value={formData.address}
//                     onChange={(e) => setFormData({ ...formData, address: e.target.value })}
//                     className="pl-10 rounded-xl border-gray-200 min-h-[100px]"
//                     placeholder="Enter your address"
//                   />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Change Password */}
//           <Card className="border-none shadow-lg rounded-2xl mb-6">
//             <CardHeader>
//               <CardTitle className="flex items-center gap-2">
//                 <Lock className="w-5 h-5 text-secondary" />
//                 Change Password
//               </CardTitle>
//               <CardDescription>Update your account password</CardDescription>
//             </CardHeader>
//             <CardContent className="space-y-6">
//               <div className="space-y-2">
//                 <Label htmlFor="currentPassword" className="text-xs font-bold uppercase tracking-widest">
//                   Current Password
//                 </Label>
//                 <div className="relative">
//                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
//                   <Input
//                     id="currentPassword"
//                     type={showPassword ? 'text' : 'password'}
//                     value={formData.currentPassword}
//                     onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
//                     className="pl-10 pr-10 h-12 rounded-xl border-gray-200"
//                     placeholder="Enter current password"
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
//                   >
//                     {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
//                   </button>
//                 </div>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                 <div className="space-y-2">
//                   <Label htmlFor="newPassword" className="text-xs font-bold uppercase tracking-widest">
//                     New Password
//                   </Label>
//                   <Input
//                     id="newPassword"
//                     type={showPassword ? 'text' : 'password'}
//                     value={formData.newPassword}
//                     onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
//                     className="h-12 rounded-xl border-gray-200"
//                     placeholder="Enter new password"
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-widest">
//                     Confirm New Password
//                   </Label>
//                   <Input
//                     id="confirmPassword"
//                     type={showPassword ? 'text' : 'password'}
//                     value={formData.confirmPassword}
//                     onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
//                     className="h-12 rounded-xl border-gray-200"
//                     placeholder="Confirm new password"
//                   />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Save Button */}
//           <div className="flex items-center justify-between">
//             {saveSuccess && (
//               <div className="flex items-center gap-2 text-green-600">
//                 <CheckCircle className="w-5 h-5" />
//                 <span className="font-medium">Profile updated successfully!</span>
//               </div>
//             )}
//             <div className="ml-auto">
//               <Button
//                 onClick={handleSave}
//                 disabled={isSaving}
//                 className="bg-secondary hover:bg-secondary/90 text-primary rounded-xl px-8 h-12 font-bold"
//               >
//                 {isSaving ? (
//                   <>
//                     <Loader2 className="w-4 h-4 mr-2 animate-spin" />
//                     Saving...
//                   </>
//                 ) : (
//                   <>
//                     <Save className="w-4 h-4 mr-2" />
//                     Save Changes
//                   </>
//                 )}
//               </Button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
/// new code

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/shared/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  ChevronLeft,
  Loader2,
  Save,
  CheckCircle,
  Camera,
  Building,
  Lock,
  Eye,
  EyeOff,
  X,
  Image as ImageIcon,
} from 'lucide-react';

// Firebase imports for password change
import { auth, db } from '@/lib/firebase';
import { 
  reauthenticateWithCredential, 
  EmailAuthProvider, 
  updatePassword,
  updateProfile as updateAuthProfile 
} from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

export default function CustomerProfile() {
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  
  // Avatar state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Gallery images (demo purposes)
  const [galleryImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1494790108755-2616c1138c69?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w-400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w-400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w-400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w-400&h=400&fit=crop',
  ]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    preferredBranch: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          router.push('/customer/login');
          return;
        }

        console.log('👤 Current user UID:', user.uid);
        console.log('👤 Current user email:', user.email);

        // Check in "users" collection first (where data is actually stored)
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          console.log('✅ User found in users collection:', userData);
          
          setCustomer({
            id: user.uid,
            uid: user.uid,
            name: userData.name || '',
            email: userData.email || user.email || '',
            phone: userData.phone || '',
            dateOfBirth: userData.dateOfBirth || '',
            gender: userData.gender || '',
            address: userData.address || '',
            preferredBranch: userData.preferredBranch || '',
            avatar: userData.avatar || '',
            createdAt: userData.createdAt?.toDate() || new Date(),
            updatedAt: userData.updatedAt?.toDate() || new Date(),
            role: userData.role || 'customer',
            status: userData.status || 'active'
          });
          
          setFormData({
            name: userData.name || '',
            email: userData.email || user.email || '',
            phone: userData.phone || '',
            dateOfBirth: userData.dateOfBirth || '',
            gender: userData.gender || '',
            address: userData.address || '',
            preferredBranch: userData.preferredBranch || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
          
          if (userData.avatar) {
            setAvatarPreview(userData.avatar);
          }
        } else {
          // If not in users, check in customers collection
          console.log('⚠️ User not found in users collection, checking customers...');
          const customerDocRef = doc(db, "customers", user.uid);
          const customerDocSnap = await getDoc(customerDocRef);
          
          if (customerDocSnap.exists()) {
            const customerData = customerDocSnap.data();
            console.log('✅ Customer found in customers collection:', customerData);
            
            setCustomer({
              id: user.uid,
              uid: user.uid,
              name: customerData.name || '',
              email: customerData.email || user.email || '',
              phone: customerData.phone || '',
              dateOfBirth: customerData.dateOfBirth || '',
              gender: customerData.gender || '',
              address: customerData.address || '',
              preferredBranch: customerData.preferredBranch || '',
              avatar: customerData.avatar || '',
              createdAt: customerData.createdAt?.toDate() || new Date(),
              updatedAt: customerData.updatedAt?.toDate() || new Date(),
              role: customerData.role || 'customer',
              status: customerData.status || 'active'
            });
            
            setFormData({
              name: customerData.name || '',
              email: customerData.email || user.email || '',
              phone: customerData.phone || '',
              dateOfBirth: customerData.dateOfBirth || '',
              gender: customerData.gender || '',
              address: customerData.address || '',
              preferredBranch: customerData.preferredBranch || '',
              currentPassword: '',
              newPassword: '',
              confirmPassword: '',
            });
            
            if (customerData.avatar) {
              setAvatarPreview(customerData.avatar);
            }
          } else {
            // User doesn't exist in any collection
            console.error('❌ User not found in any collection');
            alert('User data not found. Please contact support.');
            router.push('/customer/login');
            return;
          }
        }
        
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/customer/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Handle file upload from device
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size too large. Please select an image under 5MB.');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }
      
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle gallery image selection
  const handleGallerySelect = (imageUrl: string) => {
    setAvatarPreview(imageUrl);
    setAvatarFile(null);
    setShowGallery(false);
  };

  // Actual Firebase password verification
  const verifyCurrentPassword = async (currentPassword: string) => {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error('No user logged in');
      }

      console.log('🔐 Verifying current password for:', user.email);
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      console.log('✅ Password verified successfully');
      return true;
    } catch (error: any) {
      console.error('Password verification failed:', error);
      
      if (error.code === 'auth/wrong-password') {
        throw new Error('Current password is incorrect');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many attempts. Please try again later');
      } else {
        throw new Error('Failed to verify password. Please try again');
      }
    }
  };

  // Update password in Firebase Authentication
  const updateFirebasePassword = async (newPassword: string) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user logged in');
      }

      await updatePassword(user, newPassword);
      console.log('✅ Password updated in Firebase Auth');
      return true;
    } catch (error: any) {
      console.error('Password update failed:', error);
      throw new Error('Failed to update password');
    }
  };

  // Update user profile in Firebase Authentication
  const updateFirebaseProfile = async (name: string) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user logged in');
      }

      await updateAuthProfile(user, {
        displayName: name
      });
      console.log('✅ Firebase profile updated');
      return true;
    } catch (error) {
      console.error('Firebase profile update failed:', error);
    }
  };

  // Update Firestore document
  const updateFirestoreDocument = async (updatedData: any) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      console.log('📝 Updating Firestore document for UID:', user.uid);

      // First check where the data exists
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      const customerDocRef = doc(db, "customers", user.uid);
      const customerDocSnap = await getDoc(customerDocRef);

      // Update where data exists
      if (userDocSnap.exists()) {
        console.log('📝 Updating users collection');
        await updateDoc(userDocRef, {
          ...updatedData,
          updatedAt: new Date()
        });
      }
      
      if (customerDocSnap.exists()) {
        console.log('📝 Updating customers collection');
        await updateDoc(customerDocRef, {
          ...updatedData,
          updatedAt: new Date()
        });
      }
      
      // If doesn't exist in either, create in users collection
      if (!userDocSnap.exists() && !customerDocSnap.exists()) {
        console.log('📝 Creating in users collection');
        await updateDoc(userDocRef, {
          ...updatedData,
          uid: user.uid,
          email: user.email,
          role: 'customer',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      console.log('✅ Firestore updated successfully');
    } catch (error) {
      console.error('Firestore update failed:', error);
      throw error;
    }
  };

  // Password validation with actual Firebase check
  const validatePasswords = async () => {
    // If no password fields are filled, skip validation
    if (!formData.currentPassword && !formData.newPassword) {
      return true;
    }
    
    // If trying to change password, validate all fields
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        alert('Please enter your current password to change password.');
        return false;
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        alert("New passwords don't match!");
        return false;
      }
      
      if (formData.newPassword.length < 6) {
        alert("Password must be at least 6 characters long");
        return false;
      }
      
      try {
        // Verify current password with Firebase
        await verifyCurrentPassword(formData.currentPassword);
        return true;
      } catch (error: any) {
        alert(error.message || 'Current password verification failed');
        return false;
      }
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!customer) return;
    
    // Validate passwords with actual Firebase verification
    if (!(await validatePasswords())) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      // 1. Prepare updated data
      const updatedData = {
        name: formData.name,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        address: formData.address,
        preferredBranch: formData.preferredBranch,
        ...(avatarPreview && { avatar: avatarPreview }),
      };
      
      console.log('💾 Saving profile data:', updatedData);
      
      // 2. Update Firebase Authentication profile (for name)
      await updateFirebaseProfile(formData.name);
      
      // 3. Update password if new password provided
      if (formData.newPassword) {
        console.log('🔐 Updating password...');
        await updateFirebasePassword(formData.newPassword);
      }
      
      // 4. Update Firestore database
      await updateFirestoreDocument(updatedData);
      
      // 5. Update local state
      setCustomer({
        ...customer,
        ...updatedData,
      });
      
      // 6. Update localStorage
      const customerObj = {
        uid: customer.uid,
        email: customer.email,
        name: formData.name,
        phone: formData.phone,
        role: 'customer',
        createdAt: customer.createdAt
      };
      
      localStorage.setItem('customerAuth', JSON.stringify({
        isAuthenticated: true,
        customer: customerObj
      }));
      
      localStorage.setItem('user', JSON.stringify(customerObj));
      
      // 7. If password changed, clear fields and show success
      if (formData.newPassword) {
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        console.log('✅ Password changed successfully');
      }
      
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
    } catch (error: any) {
      console.error('Save failed:', error);
      alert(error.message || 'Failed to save changes. Please try again.');
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-secondary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="min-h-screen bg-[#fcfcfc]">
      <Header />

      <div className="pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/customer/portal">
              <Button variant="ghost" className="p-2 hover:bg-gray-100 rounded-xl">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-sans font-bold text-primary">My Profile</h1>
              <p className="text-muted-foreground">Manage your account settings</p>
            </div>
          </div>

          {/* Profile Avatar Section */}
          <Card className="border-none shadow-lg rounded-2xl mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-4 border-secondary">
                    <AvatarImage src={avatarPreview || customer.avatar} />
                    <AvatarFallback className="bg-secondary text-primary text-2xl font-bold">
                      {customer.name?.charAt(0) || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Camera Button with Upload Options */}
                  <div className="absolute bottom-0 right-0 flex flex-col gap-1">
                    <label 
                      htmlFor="avatar-upload" 
                      className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 cursor-pointer"
                      title="Upload photo"
                    >
                      <Camera className="w-4 h-4" />
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    
                   
                  </div>
                </div>
                
                <div className="text-center md:text-left">
                  <h2 className="text-2xl font-bold text-primary">{customer.name}</h2>
                  <p className="text-muted-foreground">{customer.email}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Member since {new Date(customer.createdAt).toLocaleDateString()}
                  </p>
                  {avatarFile && (
                    <p className="text-xs text-green-600 mt-1">
                      New image selected: {avatarFile.name}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card className="border-none shadow-lg rounded-2xl mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-secondary" />
                Personal Information
              </CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pl-10 h-12 rounded-xl border-gray-200"
                      placeholder="Enter your name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="pl-10 h-12 rounded-xl border-gray-200 bg-gray-50"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="pl-10 h-12 rounded-xl border-gray-200"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob" className="text-xs font-bold uppercase tracking-widest">
                    Date of Birth
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="dob"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="pl-10 h-12 rounded-xl border-gray-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-xs font-bold uppercase tracking-widest">
                    Gender
                  </Label>
                  <Select 
                    value={formData.gender} 
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-gray-200">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branch" className="text-xs font-bold uppercase tracking-widest">
                    Preferred Branch
                  </Label>
                  <div className="relative">
                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Select 
                      value={formData.preferredBranch} 
                      onValueChange={(value) => setFormData({ ...formData, preferredBranch: value })}
                    >
                      <SelectTrigger className="pl-10 h-12 rounded-xl border-gray-200">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="branch1">Downtown Branch</SelectItem>
                        <SelectItem value="branch2">Uptown Branch</SelectItem>
                        <SelectItem value="branch3">Mall Branch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-xs font-bold uppercase tracking-widest">
                  Address
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-3 w-4 h-4 text-muted-foreground" />
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="pl-10 rounded-xl border-gray-200 min-h-[100px]"
                    placeholder="Enter your address"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="border-none shadow-lg rounded-2xl mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-secondary" />
                Change Password
              </CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-xs font-bold uppercase tracking-widest">
                  Current Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="currentPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    className="pl-10 pr-10 h-12 rounded-xl border-gray-200"
                    placeholder="Enter your current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-xs font-bold uppercase tracking-widest">
                    New Password
                  </Label>
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="h-12 rounded-xl border-gray-200"
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-widest">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="h-12 rounded-xl border-gray-200"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>• Password must be at least 6 characters long</p>
                <p>• Enter your actual current password that you use to login</p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex items-center justify-between">
            {saveSuccess && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Profile updated successfully!</span>
              </div>
            )}
            <div className="ml-auto">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-secondary hover:bg-secondary/90 text-primary rounded-xl px-8 h-12 font-bold"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl max-w-3xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Choose Profile Picture</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowGallery(false)}
                className="rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {galleryImages.map((img, index) => (
                <div 
                  key={index}
                  className="relative group cursor-pointer"
                  onClick={() => handleGallerySelect(img)}
                >
                  <img 
                    src={img}
                    className="w-full h-48 object-cover rounded-lg"
                    alt={`Gallery option ${index + 1}`}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <span className="text-white font-medium">Select</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowGallery(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}