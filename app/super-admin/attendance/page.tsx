'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar, 
  Clock, 
  User, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Eye,
  Phone, 
  Mail, 
  CalendarDays,
  Check,
  X,
  Users,
  Clock4,
  Clock8,
  MapPin,
  PhoneCall,
  Star,
  IdCard,
  DollarSign,
  Award,
  CalendarRange,
  RefreshCw,
  Home,
  Briefcase,
  Activity,
  Shield,
  PhoneOutgoing,
  Heart,
  Droplets,
  Globe,
  ClipboardCheck,
  UserCheck,
  UserX,
  Loader2,
  AlertTriangle,
  TrendingUp,
  CalendarOff,
  Coffee,
  Zap
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { create } from 'zustand';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy,
  where,
  updateDoc,
  doc,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
  setDoc,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ==================== ZUSTAND STORE ====================
interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  branch: string;
  status: 'active' | 'inactive' | 'on-leave';
  avatar: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  hireDate: string;
  salary: number;
  rating: number;
  reviews: number;
  specialization: string[];
  experience: string;
  nationality: string;
  bloodGroup: string;
  emergencyContact: string;
  maritalStatus: string;
  visaExpiry: string;
  documentId: string;
  description: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  branch: string;
  date: string; // YYYY-MM-DD format
  checkIn: string | null; // HH:MM format
  checkOut: string | null; // HH:MM format
  totalHours: number | null;
  status: 'select' | 'present' | 'absent' | 'late' | 'half-day' | 'on-leave' | 'holiday';
  lateMinutes: number;
  notes: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface AttendanceStore {
  staffMembers: StaffMember[];
  attendanceRecords: AttendanceRecord[];
  isLoading: boolean;
  error: string | null;
  selectedDate: string;
  
  setSelectedDate: (date: string) => void;
  fetchStaffMembers: () => Promise<void>;
  fetchAttendanceRecords: (date: string) => Promise<void>;
  updateAttendanceStatus: (staffId: string, status: AttendanceRecord['status'], notes?: string) => Promise<boolean>;
}

const useAttendanceStore = create<AttendanceStore>((set, get) => ({
  staffMembers: [],
  attendanceRecords: [],
  isLoading: false,
  error: null,
  selectedDate: new Date().toISOString().split('T')[0],

  setSelectedDate: (date: string) => {
    set({ selectedDate: date });
    if (typeof window !== 'undefined') {
      localStorage.setItem('attendance_selected_date', date);
    }
  },

  fetchStaffMembers: async () => {
    try {
      set({ isLoading: true, error: null });
      const staffRef = collection(db, 'staff');
      const q = query(staffRef, orderBy('name'));
      const querySnapshot = await getDocs(q);
      
      const staffData: StaffMember[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        staffData.push({
          id: doc.id,
          name: data.name || 'Unknown Staff',
          email: data.email || '',
          phone: data.phone || '',
          role: data.role || 'staff',
          branch: data.branch || 'Unknown Branch',
          status: data.status || 'active',
          avatar: data.avatar || '',
          address: data.address || '',
          dateOfBirth: data.dateOfBirth || '',
          gender: data.gender || '',
          hireDate: data.hireDate || '',
          salary: Number(data.salary) || 0,
          rating: Number(data.rating) || 0,
          reviews: Number(data.reviews) || 0,
          specialization: data.specialization || [],
          experience: data.experience || '',
          nationality: data.nationality || '',
          bloodGroup: data.bloodGroup || '',
          emergencyContact: data.emergencyContact || '',
          maritalStatus: data.maritalStatus || '',
          visaExpiry: data.visaExpiry || '',
          documentId: data.documentId || '',
          description: data.description || '',
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt || Timestamp.now()
        });
      });
      
      set({ staffMembers: staffData, isLoading: false });
      
      // Cache in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('staff_members', JSON.stringify(staffData));
      }
      
    } catch (error: any) {
      console.error('Error fetching staff members:', error);
      
      // Try cached data
      if (typeof window !== 'undefined') {
        const cachedStaff = localStorage.getItem('staff_members');
        if (cachedStaff) {
          const staffData = JSON.parse(cachedStaff);
          set({ staffMembers: staffData, isLoading: false, error: 'Using cached data' });
          return;
        }
      }
      
      set({ 
        error: 'Failed to load staff members', 
        isLoading: false 
      });
    }
  },

  fetchAttendanceRecords: async (date: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const attendanceRef = collection(db, 'attendance');
      const q = query(attendanceRef, where('date', '==', date));
      
      const querySnapshot = await getDocs(q);
      
      const attendanceData: AttendanceRecord[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        attendanceData.push({
          id: doc.id,
          staffId: data.staffId || '',
          staffName: data.staffName || 'Unknown Staff',
          staffRole: data.staffRole || 'staff',
          branch: data.branch || '',
          date: data.date || '',
          checkIn: data.checkIn || null,
          checkOut: data.checkOut || null,
          totalHours: data.totalHours || null,
          status: data.status || 'select',
          lateMinutes: data.lateMinutes || 0,
          notes: data.notes || '',
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt || Timestamp.now()
        });
      });
      
      // Sort locally
      attendanceData.sort((a, b) => a.staffName.localeCompare(b.staffName));
      
      set({ attendanceRecords: attendanceData, isLoading: false });
      
      // Cache in localStorage
      if (typeof window !== 'undefined') {
        const cacheKey = `attendance_${date}`;
        localStorage.setItem(cacheKey, JSON.stringify(attendanceData));
      }
      
    } catch (error: any) {
      console.error('Error fetching attendance:', error);
      
      // Try cached data
      if (typeof window !== 'undefined') {
        const cacheKey = `attendance_${date}`;
        const cachedAttendance = localStorage.getItem(cacheKey);
        if (cachedAttendance) {
          const attendanceData = JSON.parse(cachedAttendance);
          set({ attendanceRecords: attendanceData, isLoading: false, error: 'Using cached data' });
          return;
        }
      }
      
      // Create default records with 'select' status
      const { staffMembers } = get();
      const defaultAttendance: AttendanceRecord[] = staffMembers.map(staff => ({
        id: `${staff.id}_${date}`,
        staffId: staff.id,
        staffName: staff.name,
        staffRole: staff.role,
        branch: staff.branch,
        date: date,
        checkIn: null,
        checkOut: null,
        totalHours: null,
        status: 'select',
        lateMinutes: 0,
        notes: '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }));
      
      set({ 
        attendanceRecords: defaultAttendance, 
        isLoading: false, 
        error: 'Created default records' 
      });
    }
  },

  updateAttendanceStatus: async (staffId: string, status: AttendanceRecord['status'], notes?: string): Promise<boolean> => {
    try {
      const { staffMembers, selectedDate } = get();
      const staff = staffMembers.find(s => s.id === staffId);
      if (!staff) return false;

      const attendanceId = `${staffId}_${selectedDate}`;
      const attendanceRef = doc(db, 'attendance', attendanceId);
      
      // Check if document exists
      const existingDoc = await getDoc(attendanceRef);
      
      let attendanceData: any;
      
      if (existingDoc.exists()) {
        // Update existing document
        attendanceData = existingDoc.data();
        await updateDoc(attendanceRef, {
          status,
          notes: notes || '',
          updatedAt: Timestamp.now()
        });
      } else {
        // Create new document
        attendanceData = {
          staffId: staff.id,
          staffName: staff.name,
          staffRole: staff.role,
          branch: staff.branch,
          date: selectedDate,
          status: status,
          checkIn: null,
          checkOut: null,
          totalHours: null,
          lateMinutes: 0,
          notes: notes || '',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        
        await setDoc(attendanceRef, attendanceData);
      }

      // Update local state
      set(state => {
        const newRecord: AttendanceRecord = {
          id: attendanceId,
          ...attendanceData,
          status: status,
          notes: notes || attendanceData.notes || '',
          updatedAt: Timestamp.now()
        };
        
        const existingIndex = state.attendanceRecords.findIndex(r => r.id === attendanceId);
        let updatedRecords;
        
        if (existingIndex >= 0) {
          updatedRecords = [...state.attendanceRecords];
          updatedRecords[existingIndex] = newRecord;
        } else {
          updatedRecords = [...state.attendanceRecords, newRecord];
        }
        
        // Update cache
        if (typeof window !== 'undefined') {
          localStorage.setItem(`attendance_${selectedDate}`, JSON.stringify(updatedRecords));
        }
        
        return { attendanceRecords: updatedRecords };
      });

      return true;
      
    } catch (error: any) {
      console.error('Error updating attendance status:', error);
      
      // Fallback to localStorage
      const { staffMembers, selectedDate, attendanceRecords } = get();
      const staff = staffMembers.find(s => s.id === staffId);
      if (!staff) return false;

      const attendanceId = `${staffId}_${selectedDate}`;

      set(state => {
        const existingIndex = state.attendanceRecords.findIndex(r => r.id === attendanceId);
        let updatedRecords;
        
        if (existingIndex >= 0) {
          // Update existing
          const updatedRecord = {
            ...state.attendanceRecords[existingIndex],
            status,
            notes: notes || state.attendanceRecords[existingIndex].notes,
            updatedAt: Timestamp.now()
          };
          
          updatedRecords = [...state.attendanceRecords];
          updatedRecords[existingIndex] = updatedRecord;
        } else {
          // Create new
          const newRecord: AttendanceRecord = {
            id: attendanceId,
            staffId: staff.id,
            staffName: staff.name,
            staffRole: staff.role,
            branch: staff.branch,
            date: selectedDate,
            checkIn: null,
            checkOut: null,
            totalHours: null,
            status: status,
            lateMinutes: 0,
            notes: notes || '',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          };
          
          updatedRecords = [...state.attendanceRecords, newRecord];
        }
        
        // Update cache
        if (typeof window !== 'undefined') {
          localStorage.setItem(`attendance_${selectedDate}`, JSON.stringify(updatedRecords));
        }
        
        return { attendanceRecords: updatedRecords };
      });

      return true;
    }
  }
}));

// ==================== MODAL COMPONENT ====================
interface StaffDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffMember | null;
  attendance: AttendanceRecord | null;
}

const StaffDetailModal = ({ isOpen, onClose, staff, attendance }: StaffDetailModalProps) => {
  if (!isOpen || !staff) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">Staff Details</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            ×
          </Button>
        </div>
        
        <div className="p-6">
          {/* Header with Avatar */}
          <div className="flex items-start mb-6">
            <img 
              src={staff.avatar || '/default-avatar.png'} 
              alt={staff.name}
              className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/default-avatar.png';
              }}
            />
            <div className="ml-6">
              <h3 className="text-2xl font-bold">{staff.name}</h3>
              <div className="flex items-center mt-2">
                <Badge className={cn(
                  staff.status === 'active' ? 'bg-green-100 text-green-800' :
                  staff.status === 'inactive' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                )}>
                  {staff.status}
                </Badge>
                <Badge variant="outline" className="ml-2">
                  {staff.role}
                </Badge>
                <div className="ml-4 flex items-center">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="ml-1 font-bold">{staff.rating}</span>
                  <span className="text-gray-500 ml-1">({staff.reviews} reviews)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Personal Info */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center">
                    <IdCard className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-sm">Document ID: <strong>{staff.documentId}</strong></span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-sm">DOB: <strong>{staff.dateOfBirth}</strong></span>
                  </div>
                  <div className="flex items-center">
                    <Heart className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-sm">Gender: <strong>{staff.gender}</strong></span>
                  </div>
                  <div className="flex items-center">
                    <Droplets className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-sm">Blood Group: <strong>{staff.bloodGroup}</strong></span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Phone className="w-5 h-5 mr-2" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center">
                    <PhoneCall className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-sm">{staff.phone}</span>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-sm">{staff.email}</span>
                  </div>
                  <div className="flex items-center">
                    <PhoneOutgoing className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-sm">Emergency: {staff.emergencyContact}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Professional Info */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Briefcase className="w-5 h-5 mr-2" />
                    Professional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center">
                    <Award className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-sm">Experience: <strong>{staff.experience} years</strong></span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-sm">Salary: <strong>${staff.salary}/month</strong></span>
                  </div>
                  <div className="flex items-center">
                    <CalendarDays className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-sm">Hire Date: <strong>{staff.hireDate}</strong></span>
                  </div>
                  <div className="flex items-center">
                    <CalendarRange className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-sm">Visa Expiry: <strong>{staff.visaExpiry}</strong></span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Home className="w-5 h-5 mr-2" />
                    Branch Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-sm"><strong>{staff.branch}</strong></span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-sm">{staff.address}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Attendance & Specialization */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <ClipboardCheck className="w-5 h-5 mr-2" />
                    Today's Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {attendance ? (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Status:</span>
                        <Badge className={cn(
                          attendance.status === 'present' ? 'bg-green-100 text-green-800' :
                          attendance.status === 'absent' ? 'bg-red-100 text-red-800' :
                          attendance.status === 'late' ? 'bg-orange-100 text-orange-800' :
                          attendance.status === 'half-day' ? 'bg-blue-100 text-blue-800' :
                          attendance.status === 'on-leave' ? 'bg-purple-100 text-purple-800' :
                          attendance.status === 'select' ? 'bg-gray-100 text-gray-800' :
                          'bg-gray-100 text-gray-800'
                        )}>
                          {attendance.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Check In:</span>
                        <span className="font-bold">{attendance.checkIn || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Check Out:</span>
                        <span className="font-bold">{attendance.checkOut || 'N/A'}</span>
                      </div>
                      {attendance.totalHours && (
                        <div className="flex justify-between">
                          <span className="text-sm">Total Hours:</span>
                          <span className="font-bold">{attendance.totalHours.toFixed(2)} hrs</span>
                        </div>
                      )}
                      {attendance.lateMinutes > 0 && (
                        <div className="flex justify-between text-orange-600">
                          <span className="text-sm">Late by:</span>
                          <span className="font-bold">{attendance.lateMinutes} mins</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No attendance recorded
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Specializations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {staff.specialization && staff.specialization.length > 0 ? (
                      staff.specialization.map((spec, index) => (
                        <Badge key={index} variant="outline" className="bg-blue-50">
                          {spec}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">No specializations</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
export default function StaffAttendancePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [branchFilter, setBranchFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [selectedAttendance, setSelectedAttendance] = useState<AttendanceRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Use attendance store
  const { 
    staffMembers, 
    attendanceRecords, 
    isLoading, 
    error, 
    selectedDate,
    setSelectedDate,
    fetchStaffMembers, 
    fetchAttendanceRecords,
    updateAttendanceStatus
  } = useAttendanceStore();

  // Initialize from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDate = localStorage.getItem('attendance_selected_date');
      if (savedDate) {
        setSelectedDate(savedDate);
      }
    }
  }, []);

  useEffect(() => {
    fetchStaffMembers();
  }, [fetchStaffMembers]);

  useEffect(() => {
    if (selectedDate) {
      fetchAttendanceRecords(selectedDate);
    }
  }, [selectedDate, fetchAttendanceRecords]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleViewClick = (staff: StaffMember) => {
    const staffAttendance = attendanceRecords.find(r => r.staffId === staff.id);
    setSelectedStaff(staff);
    setSelectedAttendance(staffAttendance || null);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (staffId: string, newStatus: AttendanceRecord['status']) => {
    try {
      const success = await updateAttendanceStatus(staffId, newStatus);
      if (success) {
        setActionSuccess(`Status updated to ${newStatus}!`);
        setTimeout(() => setActionSuccess(null), 3000);
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  // Calculate ALL stats including late, half-day, on-leave
  const calculateStats = () => {
    const todayRecords = attendanceRecords;
    
    const presentCount = todayRecords.filter(r => r.status === 'present').length;
    const absentCount = todayRecords.filter(r => r.status === 'absent').length;
    const lateCount = todayRecords.filter(r => r.status === 'late').length;
    const onLeaveCount = todayRecords.filter(r => r.status === 'on-leave').length;
    const halfDayCount = todayRecords.filter(r => r.status === 'half-day').length;
    const pendingCount = todayRecords.filter(r => r.status === 'select').length;
    
    const totalStaff = staffMembers.length;
    const attendanceRate = totalStaff > 0 ? (presentCount / totalStaff) * 100 : 0;
    
    // Calculate percentages
    const presentPercentage = totalStaff > 0 ? (presentCount / totalStaff) * 100 : 0;
    const absentPercentage = totalStaff > 0 ? (absentCount / totalStaff) * 100 : 0;
    const pendingPercentage = totalStaff > 0 ? (pendingCount / totalStaff) * 100 : 0;
    const latePercentage = totalStaff > 0 ? (lateCount / totalStaff) * 100 : 0;
    const halfDayPercentage = totalStaff > 0 ? (halfDayCount / totalStaff) * 100 : 0;
    const onLeavePercentage = totalStaff > 0 ? (onLeaveCount / totalStaff) * 100 : 0;

    return {
      totalStaff,
      presentCount,
      absentCount,
      lateCount,
      onLeaveCount,
      halfDayCount,
      pendingCount,
      attendanceRate,
      presentPercentage,
      absentPercentage,
      pendingPercentage,
      latePercentage,
      halfDayPercentage,
      onLeavePercentage,
      todayRecords
    };
  };

  const stats = calculateStats();

  // Get branches
  const branches = Array.from(new Set(staffMembers.map(s => s.branch || 'Unknown Branch')));

  // Status config for badges
  const statusConfig = {
    'select': { 
      label: 'Select', 
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: AlertCircle
    },
    present: { 
      label: 'Present', 
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: UserCheck
    },
    absent: { 
      label: 'Absent', 
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: UserX
    },
    late: { 
      label: 'Late', 
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: Clock8
    },
    'half-day': { 
      label: 'Half Day', 
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Clock4
    },
    'on-leave': { 
      label: 'On Leave', 
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: Calendar
    }
  };

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'select', label: 'Select' },
    { value: 'present', label: 'Present' },
    { value: 'absent', label: 'Absent' },
    { value: 'late', label: 'Late' },
    { value: 'half-day', label: 'Half Day' },
    { value: 'on-leave', label: 'On Leave' }
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Filter staff based on search and filters
  const filteredStaff = staffMembers.filter(staff => {
    const attendance = attendanceRecords.find(r => r.staffId === staff.id);
    const status = attendance?.status || 'select';
    
    const matchesSearch = 
      staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.phone.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesBranch = branchFilter === 'all' || staff.branch === branchFilter;
    const matchesStatus = statusFilter === 'all' || status === statusFilter;

    return matchesSearch && matchesBranch && matchesStatus;
  });

  return (
    <ProtectedRoute requiredRole="super_admin">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div className={cn(
          "h-screen overflow-y-auto flex-shrink-0 sticky top-0",
          sidebarOpen ? "w-64" : "w-16"
        )}>
          <AdminSidebar 
            role="super_admin"
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            onLogout={handleLogout}
          />
        </div>

        {/* Main Content */}
        <div className={cn(
          "flex-1 overflow-auto transition-all duration-300",
          "min-h-screen"
        )}>
          <div className="p-4 lg:p-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Staff Attendance</h1>
                <p className="text-sm lg:text-base text-gray-600">Manage daily staff attendance</p>
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <CalendarDays className="w-4 h-4 mr-2" />
                  {formatDate(selectedDate)}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full sm:w-40"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setSelectedDate(today);
                  }}
                  className="whitespace-nowrap"
                >
                  Today
                </Button>
              </div>
            </div>

            {/* Success Message */}
            {actionSuccess && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-fadeIn">
                <div className="flex items-center text-green-800">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span>{actionSuccess}</span>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center text-yellow-800">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* COMPLETE STATS CARDS - 2 Rows of 4 Cards Each */}
            <div className="space-y-4 mb-6">
              {/* Row 1: Main Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Staff */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                    <Users className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalStaff}</div>
                    <p className="text-xs text-muted-foreground">
                      All active staff members
                    </p>
                  </CardContent>
                </Card>

                {/* Present Today */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Present Today</CardTitle>
                    <UserCheck className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats.presentCount}</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {stats.presentPercentage.toFixed(1)}% of total
                    </div>
                  </CardContent>
                </Card>

                {/* Pending Today */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                    <AlertCircle className="h-4 w-4 text-gray-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-600">{stats.pendingCount}</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      {stats.pendingPercentage.toFixed(1)}% awaiting selection
                    </div>
                  </CardContent>
                </Card>

                {/* Absent Today */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
                    <UserX className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{stats.absentCount}</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      {stats.absentPercentage.toFixed(1)}% of total
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Row 2: Detailed Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Late Today */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Late Today</CardTitle>
                    <Clock8 className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{stats.lateCount}</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Zap className="w-3 h-3 mr-1" />
                      {stats.latePercentage.toFixed(1)}% of total
                    </div>
                  </CardContent>
                </Card>

                {/* Half Day */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Half Day</CardTitle>
                    <Clock4 className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{stats.halfDayCount}</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Coffee className="w-3 h-3 mr-1" />
                      {stats.halfDayPercentage.toFixed(1)}% of total
                    </div>
                  </CardContent>
                </Card>

                {/* On Leave */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">On Leave</CardTitle>
                    <CalendarOff className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">{stats.onLeaveCount}</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      {stats.onLeavePercentage.toFixed(1)}% of total
                    </div>
                  </CardContent>
                </Card>

                {/* Attendance Rate */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-teal-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-teal-600">{stats.attendanceRate.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">
                      Based on present count
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search staff..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Branch Filter */}
                  <Select value={branchFilter} onValueChange={setBranchFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Branches</SelectItem>
                      {branches.map(branch => (
                        <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Refresh Button */}
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      fetchStaffMembers();
                      fetchAttendanceRecords(selectedDate);
                    }}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* ATTENDANCE TABLE */}
            <div className="overflow-x-auto bg-white rounded-lg border shadow-sm">
                <>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Info</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStaff.map((staff) => {
                        const attendance = attendanceRecords.find(r => r.staffId === staff.id);
                        const status = attendance?.status || 'select';
                        const StatusIcon = statusConfig[status as keyof typeof statusConfig]?.icon || AlertCircle;

                        return (
                          <tr key={staff.id} className="hover:bg-gray-50">
                            {/* Staff Info */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <img 
                                  src={staff.avatar || '/default-avatar.png'} 
                                  alt={staff.name}
                                  className="w-10 h-10 rounded-full mr-3"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/default-avatar.png';
                                  }}
                                />
                                <div>
                                  <div className="font-bold text-sm">{staff.name}</div>
                                  <div className="text-xs text-gray-500">{staff.phone}</div>
                                </div>
                              </div>
                            </td>
                            
                            {/* Branch */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-700">{staff.branch}</div>
                            </td>
                            
                            {/* Role */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium">{staff.role}</div>
                            </td>
                            
                            {/* Email */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-gray-600">{staff.email}</div>
                            </td>
                            
                            {/* Status */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Badge className={cn(
                                "gap-2 px-3 py-1 font-medium justify-center",
                                statusConfig[status as keyof typeof statusConfig]?.color
                              )}>
                                <StatusIcon className="w-3 h-3" />
                                <span>{statusConfig[status as keyof typeof statusConfig]?.label || status}</span>
                              </Badge>
                            </td>
                            
                            {/* Actions */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {/* View Details */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewClick(staff)}
                                  className="hover:bg-blue-50 hover:text-blue-600"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                
                                {/* Status Dropdown */}
                                <Select
                                  value={status}
                                  onValueChange={(value: AttendanceRecord['status']) => {
                                    handleStatusChange(staff.id, value);
                                  }}
                                >
                                  <SelectTrigger className="w-28 text-xs h-8">
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="select">Select</SelectItem>
                                    <SelectItem value="present">Present</SelectItem>
                                    <SelectItem value="absent">Absent</SelectItem>
                                    <SelectItem value="late">Late</SelectItem>
                                    <SelectItem value="half-day">Half Day</SelectItem>
                                    <SelectItem value="on-leave">On Leave</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* No Results */}
                  {filteredStaff.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members found</h3>
                      <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria.</p>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setBranchFilter('all');
                          setStatusFilter('all');
                          setSearchQuery('');
                        }}
                      >
                        Clear all filters
                      </Button>
                    </div>
                  )}
                </>
            </div>

            {/* Summary Footer */}
            <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-gray-500">
              <div>
                Showing {filteredStaff.length} of {stats.totalStaff} staff members
                {selectedDate !== new Date().toISOString().split('T')[0] && ` for ${selectedDate}`}
              </div>
              <div className="text-xs text-gray-400">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* Modal for Staff Details */}
        <StaffDetailModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedStaff(null);
            setSelectedAttendance(null);
          }}
          staff={selectedStaff}
          attendance={selectedAttendance}
        />
      </div>
    </ProtectedRoute>
  );
}