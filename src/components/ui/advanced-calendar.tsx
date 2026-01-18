// // components/ui/advanced-calendar.tsx
// 'use client';

// import React, { useState, useEffect, useMemo } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Switch } from "@/components/ui/switch";
// import { Label } from "@/components/ui/label";
// import { Calendar, Clock, User, ChevronLeft, ChevronRight, Settings, RotateCcw, Grid3X3, Users } from "lucide-react";
// import { format, addDays, startOfDay, addMinutes, isSameDay, parseISO } from "date-fns";
// import { collection, getDocs, query, where } from "firebase/firestore";
// import { db } from "@/lib/firebase";

// interface Appointment {
//   id: number;
//   customer: string;
//   service: string;
//   barber: string;
//   date: string;
//   time: string;
//   duration: string;
//   price: number;
//   status: string;
//   phone: string;
//   email: string;
//   notes: string;
//   source: string;
//   branch: string;
//   createdAt: string;
//   updatedAt: string;
// }

// interface StaffMember {
//   id: string;
//   name: string;
//   email: string;
//   phone: string;
//   role: string;
//   specialization: string[];
//   branch: string;
//   avatar: string;
//   status: string;
//   rating: number;
//   createdAt: any;
//   updatedAt: any;
// }

// interface AdvancedCalendarProps {
//   appointments: Appointment[];
//   onAppointmentClick: (appointment: Appointment) => void;
//   onStatusChange: (appointmentId: number, newStatus: string) => void;
//   onCreateBooking?: (barber: string, date: string, time: string) => void;
// }

// // Firebase se staff fetch karne ka function
// const fetchStaffFromFirebase = async (): Promise<StaffMember[]> => {
//   try {
//     const staffRef = collection(db, "staff");
//     const q = query(staffRef, where("status", "==", "active"));
//     const querySnapshot = await getDocs(q);
    
//     const staff: StaffMember[] = [];
//     querySnapshot.forEach((doc) => {
//       const data = doc.data();
//       const staffData: StaffMember = {
//         id: doc.id,
//         name: data.name || "Unknown Staff",
//         email: data.email || "",
//         phone: data.phone || "",
//         role: data.role || "staff",
//         specialization: Array.isArray(data.specialization) ? data.specialization : [],
//         branch: data.branch || "Main Branch",
//         avatar: data.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
//         status: data.status || "active",
//         rating: data.rating || 0,
//         createdAt: data.createdAt || new Date(),
//         updatedAt: data.updatedAt || new Date()
//       };
//       staff.push(staffData);
//     });
    
//     return staff;
//   } catch (error) {
//     console.error("Error fetching staff from Firebase:", error);
//     return [];
//   }
// };

// export function AdvancedCalendar({ appointments, onAppointmentClick, onStatusChange, onCreateBooking }: AdvancedCalendarProps) {
//   const [selectedDate, setSelectedDate] = useState(new Date());
//   const [selectedBarber, setSelectedBarber] = useState<string>('all');
//   const [timeSlotGap, setTimeSlotGap] = useState(30);
//   const [layoutMode, setLayoutMode] = useState<'time-top' | 'employee-top'>('time-top');
//   const [businessHours, setBusinessHours] = useState({ start: 9, end: 18 });
//   const [hiddenHours, setHiddenHours] = useState<number[]>([]);
//   const [showSettings, setShowSettings] = useState(false);
//   const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  
//   // Firebase se staff data fetch karen - NO loading state
//   useEffect(() => {
//     const loadStaffData = async () => {
//       const staffData = await fetchStaffFromFirebase();
//       setStaffMembers(staffData);
//     };
    
//     loadStaffData();
//   }, []);

//   // Firebase staff se barber list banayein
//   const barbers = useMemo(() => staffMembers.map(staff => staff.name), [staffMembers]);

//   // Generate time slots based on business hours, gap, and hidden hours
//   const generateTimeSlots = () => {
//     const slots = [];
//     const startTime = new Date(selectedDate);
//     startTime.setHours(businessHours.start, 0, 0, 0);

//     const endTime = new Date(selectedDate);
//     endTime.setHours(businessHours.end, 0, 0, 0);

//     let currentTime = startTime;
//     while (currentTime < endTime) {
//       const hour = currentTime.getHours();
//       if (!hiddenHours.includes(hour)) {
//         slots.push(format(currentTime, 'HH:mm'));
//       }
//       currentTime = addMinutes(currentTime, timeSlotGap);
//     }

//     return slots;
//   };

//   const timeSlots = useMemo(() => generateTimeSlots(), [selectedDate, businessHours, timeSlotGap, hiddenHours]);

//   // Filter appointments for selected date and barber
//   const filteredAppointments = useMemo(() => 
//     appointments.filter(apt => {
//       const aptDate = parseISO(apt.date);
//       const isSameDate = isSameDay(aptDate, selectedDate);
//       const isSameBarber = selectedBarber === 'all' || apt.barber === selectedBarber;
//       return isSameDate && isSameBarber;
//     }),
//     [appointments, selectedDate, selectedBarber]
//   );

//   // Helper function to convert 12-hour time to 24-hour format
//   const convertTo24Hour = (time12h: string): string => {
//     const [time, period] = time12h.split(' ');
//     const [hours, minutes] = time.split(':');
//     let hour24 = parseInt(hours);
    
//     if (period === 'PM' && hour24 !== 12) {
//       hour24 += 12;
//     } else if (period === 'AM' && hour24 === 12) {
//       hour24 = 0;
//     }
    
//     return `${hour24.toString().padStart(2, '0')}:${minutes}`;
//   };

//   // Helper function to parse duration string to minutes
//   const parseDuration = (duration: string): number => {
//     const match = duration.match(/(\d+)\s*min/);
//     return match ? parseInt(match[1]) : 30;
//   };

//   // Check if an appointment covers a specific time slot
//   const doesAppointmentCoverSlot = (appointment: Appointment, slot: string): boolean => {
//     const appointmentTime24 = convertTo24Hour(appointment.time);
//     const appointmentDuration = parseDuration(appointment.duration);
    
//     const [slotHours, slotMinutes] = slot.split(':').map(Number);
//     const [aptHours, aptMinutes] = appointmentTime24.split(':').map(Number);
    
//     const slotMinutesSinceStart = slotHours * 60 + slotMinutes;
//     const appointmentStartMinutes = aptHours * 60 + aptMinutes;
//     const appointmentEndMinutes = appointmentStartMinutes + appointmentDuration;
    
//     return slotMinutesSinceStart >= appointmentStartMinutes && slotMinutesSinceStart < appointmentEndMinutes;
//   };

//   // Get appointment for specific time slot and barber
//   const getAppointmentForSlot = (timeSlot: string, barber: string) => {
//     return filteredAppointments.find(apt =>
//       apt.barber === barber && doesAppointmentCoverSlot(apt, timeSlot)
//     );
//   };

//   // Check if this is the start slot of an appointment
//   const isAppointmentStart = (appointment: Appointment, timeSlot: string): boolean => {
//     const appointmentTime24 = convertTo24Hour(appointment.time);
//     const [aptHours, aptMinutes] = appointmentTime24.split(':').map(Number);
//     const appointmentStartMinutes = aptHours * 60 + aptMinutes;
    
//     const [slotHours, slotMinutes] = timeSlot.split(':').map(Number);
//     const slotStart = slotHours * 60 + slotMinutes;
//     const slotEnd = slotStart + timeSlotGap;
    
//     return appointmentStartMinutes >= slotStart && appointmentStartMinutes < slotEnd;
//   };

//   // Calculate how many slots an appointment spans
//   const getAppointmentSpan = (appointment: Appointment, startTimeSlot: string): number => {
//     const appointmentTime24 = convertTo24Hour(appointment.time);
//     const duration = parseDuration(appointment.duration);
//     const [aptHours, aptMinutes] = appointmentTime24.split(':').map(Number);
//     const appointmentEndMinutes = aptHours * 60 + aptMinutes + duration;
    
//     let span = 0;
//     let foundStart = false;
//     for (const slot of timeSlots) {
//       if (slot === startTimeSlot) foundStart = true;
//       if (foundStart) {
//         const [h, m] = slot.split(':').map(Number);
//         const slotStart = h * 60 + m;
//         if (slotStart < appointmentEndMinutes) {
//           span++;
//         } else {
//           break;
//         }
//       }
//     }
//     return span || 1;
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "completed": return "bg-green-500";
//       case "in-progress": return "bg-blue-500";
//       case "scheduled": return "bg-yellow-500";
//       case "approved": return "bg-purple-500";
//       case "pending": return "bg-orange-500";
//       case "cancelled": return "bg-red-500";
//       case "rejected": return "bg-gray-500";
//       default: return "bg-gray-300";
//     }
//   };

//   const navigateDate = (direction: 'prev' | 'next') => {
//     const newDate = direction === 'next'
//       ? addDays(selectedDate, 1)
//       : addDays(selectedDate, -1);
//     setSelectedDate(newDate);
//   };

//   const toggleHiddenHour = (hour: number) => {
//     setHiddenHours(prev =>
//       prev.includes(hour)
//         ? prev.filter(h => h !== hour)
//         : [...prev, hour]
//     );
//   };

//   const resetHiddenHours = () => {
//     setHiddenHours([]);
//   };

//   // Staff ki avatar image get karna
//   const getStaffAvatar = (barberName: string) => {
//     const staff = staffMembers.find(s => s.name === barberName);
//     return staff?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop";
//   };

//   // Staff ki role get karna
//   const getStaffRole = (barberName: string) => {
//     const staff = staffMembers.find(s => s.name === barberName);
//     return staff?.role || "Staff";
//   };

//   return (
//     <Card className="w-full">
//       <CardHeader>
//         <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
//           <CardTitle className="flex items-center gap-2">
//             <Calendar className="w-5 h-5" />
//             Advanced Booking Calendar
//             <Badge variant="outline" className="ml-2">
//               {staffMembers.length} Staff
//             </Badge>
//           </CardTitle>
//           <div className="flex flex-wrap items-center gap-2">
//             {/* Layout Toggle */}
//             <div className="flex items-center gap-2">
//               <Button
//                 variant={layoutMode === 'time-top' ? 'default' : 'outline'}
//                 size="sm"
//                 onClick={() => setLayoutMode('time-top')}
//                 className="flex items-center gap-1"
//               >
//                 <Grid3X3 className="w-4 h-4" />
//                 Time Top
//               </Button>
//               <Button
//                 variant={layoutMode === 'employee-top' ? 'default' : 'outline'}
//                 size="sm"
//                 onClick={() => setLayoutMode('employee-top')}
//                 className="flex items-center gap-1"
//               >
//                 <RotateCcw className="w-4 h-4" />
//                 Employee Top
//               </Button>
//             </div>

//             {/* Time Gap Selector */}
//             <Select value={timeSlotGap.toString()} onValueChange={(value) => setTimeSlotGap(parseInt(value))}>
//               <SelectTrigger className="w-24">
//                 <SelectValue />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="15">15 min</SelectItem>
//                 <SelectItem value="30">30 min</SelectItem>
//                 <SelectItem value="45">45 min</SelectItem>
//                 <SelectItem value="60">1 hour</SelectItem>
//                 <SelectItem value="120">2 hours</SelectItem>
//               </SelectContent>
//             </Select>

//             {/* Settings Toggle */}
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => setShowSettings(!showSettings)}
//               className="flex items-center gap-1"
//             >
//               <Settings className="w-4 h-4" />
//               Settings
//             </Button>

//             {/* Date Navigation */}
//             <div className="flex items-center gap-1">
//               <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
//                 <ChevronLeft className="w-4 h-4" />
//               </Button>
//               <span className="font-medium min-w-[120px] text-center px-2">
//                 {format(selectedDate, 'MMM dd, yyyy')}
//               </span>
//               <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
//                 <ChevronRight className="w-4 h-4" />
//               </Button>
//             </div>
//           </div>
//         </div>

//         {/* Settings Panel */}
//         {showSettings && (
//           <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {/* Business Hours */}
//               <div className="space-y-2">
//                 <Label className="text-sm font-medium">Business Hours</Label>
//                 <div className="flex items-center gap-2">
//                   <Select
//                     value={businessHours.start.toString()}
//                     onValueChange={(value) => setBusinessHours(prev => ({ ...prev, start: parseInt(value) }))}
//                   >
//                     <SelectTrigger className="w-20">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {Array.from({ length: 12 }, (_, i) => i + 6).map(hour => (
//                         <SelectItem key={hour} value={hour.toString()}>
//                           {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                   <span>to</span>
//                   <Select
//                     value={businessHours.end.toString()}
//                     onValueChange={(value) => setBusinessHours(prev => ({ ...prev, end: parseInt(value) }))}
//                   >
//                     <SelectTrigger className="w-20">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {Array.from({ length: 12 }, (_, i) => i + 12).map(hour => (
//                         <SelectItem key={hour} value={hour.toString()}>
//                           {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>

//               {/* Hidden Hours */}
//               <div className="space-y-2">
//                 <div className="flex items-center justify-between">
//                   <Label className="text-sm font-medium">Hidden Hours</Label>
//                   <Button variant="ghost" size="sm" onClick={resetHiddenHours}>
//                     Reset
//                   </Button>
//                 </div>
//                 <div className="flex flex-wrap gap-1">
//                   {Array.from({ length: businessHours.end - businessHours.start }, (_, i) => businessHours.start + i).map(hour => (
//                     <Button
//                       key={hour}
//                       variant={hiddenHours.includes(hour) ? "destructive" : "outline"}
//                       size="sm"
//                       className="w-12 h-8 text-xs"
//                       onClick={() => toggleHiddenHour(hour)}
//                     >
//                       {hour > 12 ? `${hour - 12}P` : `${hour}A`}
//                     </Button>
//                   ))}
//                 </div>
//               </div>

//               {/* Staff Filter */}
//               <div className="space-y-2">
//                 <Label className="text-sm font-medium">Filter Staff</Label>
//                 <Select value={selectedBarber} onValueChange={setSelectedBarber}>
//                   <SelectTrigger>
//                     <SelectValue placeholder="Select Staff" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     <SelectItem value="all">All Staff ({staffMembers.length})</SelectItem>
//                     {staffMembers.map(staff => (
//                       <SelectItem key={staff.id} value={staff.name}>
//                         <div className="flex items-center gap-2">
//                           <div className="relative w-4 h-4 rounded-full overflow-hidden">
//                             <img 
//                               src={staff.avatar} 
//                               alt={staff.name} 
//                               className="object-cover w-full h-full"
//                             />
//                           </div>
//                           <span>{staff.name}</span>
//                           <Badge variant="outline" className="text-xs">{staff.role}</Badge>
//                         </div>
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>
//           </div>
//         )}
//       </CardHeader>
//       <CardContent>
//         <div className="overflow-x-auto overflow-y-auto max-h-[900px] sm:max-h-[600px] w-full">
//           <div className="min-w-full" style={{ width: 'max-content' }}>
//             {layoutMode === 'time-top' ? (
//               // Time on top, Employees on left (current layout)
//               <>
//                 {/* Header with time slots */}
//                 <div className="grid gap-1 mb-2 sticky top-0 bg-background z-10 border-b pb-2" style={{ gridTemplateColumns: `clamp(120px, 15vw, 200px) repeat(${timeSlots.length}, minmax(50px, 1fr))` }}>
//                   <div className="p-2 font-medium text-sm text-muted-foreground sticky left-0 bg-background">
//                     Staff / Time
//                   </div>
//                   {timeSlots.map(slot => (
//                     <div key={slot} className="p-1 text-xs text-center font-medium text-muted-foreground border rounded bg-muted/50 min-w-[50px]">
//                       {slot}
//                     </div>
//                   ))}
//                 </div>

//                 {/* Staff rows */}
//                 {(selectedBarber === 'all' ? barbers : [selectedBarber]).map(barber => {
//                   let slotIndex = 0;
//                   const rowElements: React.JSX.Element[] = [];
                  
//                   while (slotIndex < timeSlots.length) {
//                     const currentSlot = timeSlots[slotIndex];
//                     const appointment = getAppointmentForSlot(currentSlot, barber);
                    
//                     if (appointment && isAppointmentStart(appointment, currentSlot)) {
//                       // This is the start of a multi-slot appointment
//                       const span = Math.min(getAppointmentSpan(appointment, currentSlot), timeSlots.length - slotIndex);
                      
//                       rowElements.push(
//                         <div
//                           key={`${barber}-${currentSlot}`}
//                           className={`p-1 border rounded cursor-pointer hover:shadow-md transition-all duration-200 min-h-[60px] flex items-center justify-center border-2 border-primary/50 bg-primary/5`}
//                           style={{ gridColumn: `span ${span}` }}
//                           onClick={() => onAppointmentClick(appointment)}
//                         >
//                           <div className="w-full h-full flex flex-col items-center justify-center text-xs p-1">
//                             <div className={`w-3 h-3 rounded-full mb-1 ${getStatusColor(appointment.status)}`} />
//                             <div className="font-medium truncate w-full text-center leading-tight">
//                               {appointment.customer.split(' ')[0]}
//                             </div>
//                             <div className="text-muted-foreground truncate w-full text-center text-[10px] leading-tight">
//                               {appointment.service}
//                             </div>
//                             <div className="text-muted-foreground text-[9px] mt-1">
//                               {appointment.duration}
//                             </div>
//                           </div>
//                         </div>
//                       );
                      
//                       slotIndex += span;
//                     } else if (appointment) {
//                       // This slot is covered by an appointment that started earlier - skip it
//                       slotIndex += 1;
//                     } else {
//                       // Empty slot
//                       rowElements.push(
//                         <div
//                           key={`${barber}-${currentSlot}`}
//                           className="p-1 border rounded cursor-pointer hover:shadow-md transition-all duration-200 min-h-[60px] flex items-center justify-center border-dashed border-muted-foreground/30 hover:border-muted-foreground/50"
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             onCreateBooking && onCreateBooking(barber, format(selectedDate, 'yyyy-MM-dd'), currentSlot);
//                           }}
//                         >
//                           <div className="text-muted-foreground/50 text-xs text-center cursor-pointer hover:text-primary transition-colors">
//                             + Book
//                           </div>
//                         </div>
//                       );
//                       slotIndex += 1;
//                     }
//                   }
                  
//                   const staff = staffMembers.find(s => s.name === barber);
//                   const staffAvatar = staff?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop";
//                   const staffRole = staff?.role || "Staff";
                  
//                   return (
//                     <div key={barber} className="grid gap-1 mb-1" style={{ gridTemplateColumns: `clamp(120px, 15vw, 200px) repeat(${timeSlots.length}, minmax(50px, 1fr))` }}>
//                       <div className="p-2 sm:p-3 bg-muted rounded flex items-center gap-2 sticky left-0 border-r" style={{ minWidth: 'clamp(120px, 15vw, 200px)' }}>
//                         <div className="relative w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden shrink-0 border border-gray-300">
//                           <img 
//                             src={staffAvatar} 
//                             alt={barber} 
//                             className="object-cover w-full h-full"
//                           />
//                         </div>
//                         <div className="flex-1 min-w-0">
//                           <div className="font-medium text-xs sm:text-sm truncate">{barber}</div>
//                           <div className="text-[10px] text-muted-foreground truncate">{staffRole}</div>
//                         </div>
//                       </div>
//                       {rowElements}
//                     </div>
//                   );
//                 })}
//               </>
//             ) : (
//               // Staff on top, Time on left (rotated layout)
//               <div 
//                 className="grid gap-1" 
//                 style={{ 
//                   gridTemplateColumns: `clamp(120px, 15vw, 150px) repeat(${(selectedBarber === 'all' ? barbers : [selectedBarber]).length}, minmax(80px, 1fr))`,
//                 }}
//               >
//                 {/* Header row */}
//                 <div className="p-2 font-medium text-sm text-muted-foreground sticky top-0 bg-background z-20 border-b">
//                   Time / Staff
//                 </div>
//                 {(selectedBarber === 'all' ? barbers : [selectedBarber]).map(barber => {
//                   const staff = staffMembers.find(s => s.name === barber);
//                   const staffAvatar = staff?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop";
//                   const staffRole = staff?.role || "Staff";
                  
//                   return (
//                     <div key={barber} className="p-2 text-xs text-center font-medium text-muted-foreground border rounded bg-muted/50 flex flex-col items-center justify-center gap-1 sticky top-0 bg-background z-20 border-b">
//                       <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-gray-300 mb-1">
//                         <img 
//                           src={staffAvatar} 
//                           alt={barber} 
//                           className="object-cover w-full h-full"
//                         />
//                       </div>
//                       <div className="text-center">
//                         <div className="font-medium truncate">{barber.split(' ')[0]}</div>
//                         <div className="text-[10px] text-muted-foreground truncate">{staffRole}</div>
//                       </div>
//                     </div>
//                   );
//                 })}

//                 {/* Grid cells */}
//                 {timeSlots.map((slot, slotIndex) => (
//                   <React.Fragment key={slot}>
//                     {/* Time label for this row */}
//                     <div className="p-2 sm:p-3 bg-muted rounded flex items-center gap-2 sticky left-0 z-20 border-r min-h-[80px]">
//                       <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
//                       <span className="font-medium text-xs sm:text-sm">{slot}</span>
//                     </div>
                    
//                     {/* Staff cells for this row */}
//                     {(selectedBarber === 'all' ? barbers : [selectedBarber]).map(barber => {
//                       const appointment = getAppointmentForSlot(slot, barber);
                      
//                       if (appointment && isAppointmentStart(appointment, slot)) {
//                         const span = Math.min(getAppointmentSpan(appointment, slot), timeSlots.length - slotIndex);
//                         return (
//                           <div
//                             key={`${slot}-${barber}`}
//                             className="p-1 border rounded cursor-pointer hover:shadow-md transition-all duration-200 flex items-center justify-center border-2 border-primary/50 bg-primary/5"
//                             style={{ gridRow: `span ${span}` }}
//                             onClick={() => onAppointmentClick(appointment)}
//                           >
//                             <div className="w-full h-full flex flex-col items-center justify-center text-xs p-1">
//                               <div className={`w-3 h-3 rounded-full mb-1 ${getStatusColor(appointment.status)}`} />
//                               <div className="text-muted-foreground text-[9px] mb-0.5 font-medium">
//                                 {appointment.time}
//                               </div>
//                               <div className="font-medium truncate w-full text-center leading-tight">
//                                 {appointment.customer.split(' ')[0]}
//                               </div>
//                               <div className="text-muted-foreground truncate w-full text-center text-[10px] leading-tight">
//                                 {appointment.service}
//                               </div>
//                               <div className="text-muted-foreground text-[9px] mt-1">
//                                 {appointment.duration}
//                               </div>
//                             </div>
//                           </div>
//                         );
//                       } else if (appointment) {
//                         // Covered by an ongoing appointment - skip rendering
//                         return null;
//                       } else {
//                         // Empty slot
//                         return (
//                           <div
//                             key={`${slot}-${barber}`}
//                             className="p-1 border rounded cursor-pointer hover:shadow-md transition-all duration-200 flex items-center justify-center border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 min-h-[80px]"
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               onCreateBooking && onCreateBooking(barber, format(selectedDate, 'yyyy-MM-dd'), slot);
//                             }}
//                           >
//                             <div className="text-muted-foreground/50 text-xs text-center cursor-pointer hover:text-primary transition-colors">
//                               + Book
//                             </div>
//                           </div>
//                         );
//                       }
//                     })}
//                   </React.Fragment>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Legend and Info */}
//         <div className="mt-6 space-y-4">
//           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//             <div className="flex flex-wrap gap-4 text-xs">
//               <div className="flex items-center gap-2">
//                 <div className="w-3 h-3 rounded-full bg-green-500" />
//                 <span>Completed</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <div className="w-3 h-3 rounded-full bg-blue-500" />
//                 <span>In Progress</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <div className="w-3 h-3 rounded-full bg-yellow-500" />
//                 <span>Scheduled</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <div className="w-3 h-3 rounded-full bg-purple-500" />
//                 <span>Approved</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <div className="w-3 h-3 rounded-full bg-orange-500" />
//                 <span>Pending</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <div className="w-3 h-3 rounded-full bg-red-500" />
//                 <span>Cancelled/Rejected</span>
//               </div>
//             </div>

//             <div className="text-xs text-muted-foreground">
//               <div className="flex items-center gap-4">
//                 <span>Gap: {timeSlotGap}min</span>
//                 <span>Hours: {businessHours.start > 12 ? `${businessHours.start - 12}PM` : `${businessHours.start}AM`} - {businessHours.end > 12 ? `${businessHours.end - 12}PM` : `${businessHours.end}AM`}</span>
//                 <span>Layout: {layoutMode === 'time-top' ? 'Time → Staff' : 'Staff → Time'}</span>
//               </div>
//             </div>
//           </div>

//           {/* Info */}
//           {staffMembers.length > 0 && (
//             <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
//               <div className="flex items-center gap-2 mb-1">
//                 <Users className="w-4 h-4" />
//                 <strong>Staff from Firebase:</strong> {staffMembers.length} active staff members loaded
//               </div>
//               <div className="flex flex-wrap gap-2">
//                 {staffMembers.slice(0, 3).map(staff => (
//                   <div key={staff.id} className="flex items-center gap-1 text-xs px-2 py-1 bg-background rounded">
//                     <div className="relative w-3 h-3 rounded-full overflow-hidden">
//                       <img 
//                         src={staff.avatar} 
//                         alt={staff.name} 
//                         className="object-cover w-full h-full"
//                       />
//                     </div>
//                     <span>{staff.name.split(' ')[0]}</span>
//                   </div>
//                 ))}
//                 {staffMembers.length > 3 && (
//                   <span className="text-xs">+{staffMembers.length - 3} more</span>
//                 )}
//               </div>
//             </div>
//           )}
//         </div>
//       </CardContent>
//     </Card>
//   );
// }

// new code
// components/ui/advanced-calendar.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, User, ChevronLeft, ChevronRight, Settings, RotateCcw, Grid3X3, Users } from "lucide-react";
import { format, addDays, startOfDay, addMinutes, isSameDay, parseISO } from "date-fns";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Appointment {
  id: string | number;
  customer: string;
  service: string;
  barber: string;
  date: string;
  time: string;
  duration: string;
  price: number;
  status: string;
  phone: string;
  email: string;
  notes: string;
  source: string;
  branch: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  specialization: string[];
  branch: string;
  avatar: string;
  status: string;
  rating: number;
  createdAt: any;
  updatedAt: any;
}

interface AdvancedCalendarProps {
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
  onStatusChange: (appointmentId: string | number, newStatus: string) => void;
  onCreateBooking?: (barber: string, date: string, time: string) => void;
  staff?: StaffMember[];
}

const fetchStaffFromFirebase = async (): Promise<StaffMember[]> => {
  try {
    const staffRef = collection(db, "staff");
    const q = query(staffRef, where("status", "==", "active"));
    const querySnapshot = await getDocs(q);
    
    const staff: StaffMember[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const staffData: StaffMember = {
        id: doc.id,
        name: data.name || "Unknown Staff",
        email: data.email || "",
        phone: data.phone || "",
        role: data.role || "staff",
        specialization: Array.isArray(data.specialization) ? data.specialization : [],
        branch: data.branch || "Main Branch",
        avatar: data.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
        status: data.status || "active",
        rating: data.rating || 0,
        createdAt: data.createdAt || new Date(),
        updatedAt: data.updatedAt || new Date()
      };
      staff.push(staffData);
    });
    
    return staff;
  } catch (error) {
    console.error("Error fetching staff from Firebase:", error);
    return [];
  }
};

export function AdvancedCalendar({ 
  appointments, 
  onAppointmentClick, 
  onStatusChange, 
  onCreateBooking,
  staff: propStaff 
}: AdvancedCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedBarber, setSelectedBarber] = useState<string>('all');
  const [timeSlotGap, setTimeSlotGap] = useState(30);
  const [layoutMode, setLayoutMode] = useState<'time-top' | 'employee-top'>('time-top');
  const [businessHours, setBusinessHours] = useState({ start: 9, end: 18 });
  const [hiddenHours, setHiddenHours] = useState<number[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(propStaff || []);
  
  useEffect(() => {
    const loadStaffData = async () => {
      if (propStaff && propStaff.length > 0) {
        setStaffMembers(propStaff);
      } else {
        const staffData = await fetchStaffFromFirebase();
        setStaffMembers(staffData);
      }
    };
    
    loadStaffData();
  }, [propStaff]);

  const barbers = useMemo(() => staffMembers.map(staff => staff.name), [staffMembers]);

  const generateTimeSlots = () => {
    const slots = [];
    const startTime = new Date(selectedDate);
    startTime.setHours(businessHours.start, 0, 0, 0);

    const endTime = new Date(selectedDate);
    endTime.setHours(businessHours.end, 0, 0, 0);

    let currentTime = startTime;
    while (currentTime < endTime) {
      const hour = currentTime.getHours();
      if (!hiddenHours.includes(hour)) {
        slots.push(format(currentTime, 'HH:mm'));
      }
      currentTime = addMinutes(currentTime, timeSlotGap);
    }

    return slots;
  };

  const timeSlots = useMemo(() => generateTimeSlots(), [selectedDate, businessHours, timeSlotGap, hiddenHours]);

  const filteredAppointments = useMemo(() => 
    appointments.filter(apt => {
      const aptDate = typeof apt.date === 'string' ? parseISO(apt.date) : new Date(apt.date);
      const isSameDate = isSameDay(aptDate, selectedDate);
      const isSameBarber = selectedBarber === 'all' || apt.barber === selectedBarber;
      return isSameDate && isSameBarber;
    }),
    [appointments, selectedDate, selectedBarber]
  );

  const convertTo24Hour = (time12h: string): string => {
    if (!time12h.includes(' ')) return time12h;
    
    const [time, period] = time12h.split(' ');
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    
    if (period === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minutes}`;
  };

  const parseDuration = (duration: string): number => {
    const match = duration.match(/(\d+)\s*min/);
    return match ? parseInt(match[1]) : 30;
  };

  const doesAppointmentCoverSlot = (appointment: Appointment, slot: string): boolean => {
    const appointmentTime24 = convertTo24Hour(appointment.time);
    const appointmentDuration = parseDuration(appointment.duration);
    
    const [slotHours, slotMinutes] = slot.split(':').map(Number);
    const [aptHours, aptMinutes] = appointmentTime24.split(':').map(Number);
    
    const slotMinutesSinceStart = slotHours * 60 + slotMinutes;
    const appointmentStartMinutes = aptHours * 60 + aptMinutes;
    const appointmentEndMinutes = appointmentStartMinutes + appointmentDuration;
    
    return slotMinutesSinceStart >= appointmentStartMinutes && slotMinutesSinceStart < appointmentEndMinutes;
  };

  const getAppointmentForSlot = (timeSlot: string, barber: string): Appointment | undefined => {
    return filteredAppointments.find(apt =>
      apt.barber === barber && doesAppointmentCoverSlot(apt, timeSlot)
    );
  };

  const isAppointmentStart = (appointment: Appointment, timeSlot: string): boolean => {
    const appointmentTime24 = convertTo24Hour(appointment.time);
    const [aptHours, aptMinutes] = appointmentTime24.split(':').map(Number);
    const appointmentStartMinutes = aptHours * 60 + aptMinutes;
    
    const [slotHours, slotMinutes] = timeSlot.split(':').map(Number);
    const slotStart = slotHours * 60 + slotMinutes;
    const slotEnd = slotStart + timeSlotGap;
    
    return appointmentStartMinutes >= slotStart && appointmentStartMinutes < slotEnd;
  };

  const getAppointmentSpan = (appointment: Appointment, startTimeSlot: string): number => {
    const appointmentTime24 = convertTo24Hour(appointment.time);
    const duration = parseDuration(appointment.duration);
    const [aptHours, aptMinutes] = appointmentTime24.split(':').map(Number);
    const appointmentEndMinutes = aptHours * 60 + aptMinutes + duration;
    
    let span = 0;
    let foundStart = false;
    for (const slot of timeSlots) {
      if (slot === startTimeSlot) foundStart = true;
      if (foundStart) {
        const [h, m] = slot.split(':').map(Number);
        const slotStart = h * 60 + m;
        if (slotStart < appointmentEndMinutes) {
          span++;
        } else {
          break;
        }
      }
    }
    return span || 1;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "in-progress": return "bg-blue-500";
      case "scheduled": return "bg-yellow-500";
      case "approved": return "bg-purple-500";
      case "pending": return "bg-orange-500";
      case "cancelled": return "bg-red-500";
      case "rejected": return "bg-gray-500";
      default: return "bg-gray-300";
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = direction === 'next'
      ? addDays(selectedDate, 1)
      : addDays(selectedDate, -1);
    setSelectedDate(newDate);
  };

  const toggleHiddenHour = (hour: number) => {
    setHiddenHours(prev =>
      prev.includes(hour)
        ? prev.filter(h => h !== hour)
        : [...prev, hour]
    );
  };

  const resetHiddenHours = () => {
    setHiddenHours([]);
  };

  const getStaffAvatar = (barberName: string): string => {
    const staff = staffMembers.find(s => s.name === barberName);
    return staff?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop";
  };

  const getStaffRole = (barberName: string): string => {
    const staff = staffMembers.find(s => s.name === barberName);
    return staff?.role || "Staff";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Advanced Booking Calendar
            <Badge variant="outline" className="ml-2">
              {staffMembers.length} Staff
            </Badge>
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {/* Layout Toggle */}
            <div className="flex items-center gap-2">
              <Button
                variant={layoutMode === 'time-top' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLayoutMode('time-top')}
                className="flex items-center gap-1"
              >
                <Grid3X3 className="w-4 h-4" />
                Time Top
              </Button>
              <Button
                variant={layoutMode === 'employee-top' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLayoutMode('employee-top')}
                className="flex items-center gap-1"
              >
                <RotateCcw className="w-4 h-4" />
                Employee Top
              </Button>
            </div>

            {/* Time Gap Selector */}
            <Select value={timeSlotGap.toString()} onValueChange={(value) => setTimeSlotGap(parseInt(value))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="45">45 min</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>

            {/* Settings Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-1"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Button>

            {/* Date Navigation */}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-medium min-w-[120px] text-center px-2">
                {format(selectedDate, 'MMM dd, yyyy')}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Business Hours */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Business Hours</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={businessHours.start.toString()}
                    onValueChange={(value) => setBusinessHours(prev => ({ ...prev, start: parseInt(value) }))}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 6).map(hour => (
                        <SelectItem key={hour} value={hour.toString()}>
                          {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span>to</span>
                  <Select
                    value={businessHours.end.toString()}
                    onValueChange={(value) => setBusinessHours(prev => ({ ...prev, end: parseInt(value) }))}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 12).map(hour => (
                        <SelectItem key={hour} value={hour.toString()}>
                          {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Hidden Hours */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Hidden Hours</Label>
                  <Button variant="ghost" size="sm" onClick={resetHiddenHours}>
                    Reset
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: businessHours.end - businessHours.start }, (_, i) => businessHours.start + i).map(hour => (
                    <Button
                      key={hour}
                      variant={hiddenHours.includes(hour) ? "destructive" : "outline"}
                      size="sm"
                      className="w-12 h-8 text-xs"
                      onClick={() => toggleHiddenHour(hour)}
                    >
                      {hour > 12 ? `${hour - 12}P` : `${hour}A`}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Staff Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Filter Staff</Label>
                <Select value={selectedBarber} onValueChange={setSelectedBarber}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Staff" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Staff ({staffMembers.length})</SelectItem>
                    {staffMembers.map(staff => (
                      <SelectItem key={staff.id} value={staff.name}>
                        <div className="flex items-center gap-2">
                          <div className="relative w-4 h-4 rounded-full overflow-hidden">
                            <img 
                              src={staff.avatar} 
                              alt={staff.name} 
                              className="object-cover w-full h-full"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop";
                              }}
                            />
                          </div>
                          <span>{staff.name}</span>
                          <Badge variant="outline" className="text-xs">{staff.role}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto overflow-y-auto max-h-[900px] sm:max-h-[600px] w-full">
          <div className="min-w-full" style={{ width: 'max-content' }}>
            {layoutMode === 'time-top' ? (
              // Time on top, Employees on left (current layout)
              <>
                {/* Header with time slots */}
                <div className="grid gap-1 mb-2 sticky top-0 bg-background z-10 border-b pb-2" style={{ gridTemplateColumns: `clamp(120px, 15vw, 200px) repeat(${timeSlots.length}, minmax(50px, 1fr))` }}>
                  <div className="p-2 font-medium text-sm text-muted-foreground sticky left-0 bg-background">
                    Staff / Time
                  </div>
                  {timeSlots.map(slot => (
                    <div key={slot} className="p-1 text-xs text-center font-medium text-muted-foreground border rounded bg-muted/50 min-w-[50px]">
                      {slot}
                    </div>
                  ))}
                </div>

                {/* Staff rows */}
                {(selectedBarber === 'all' ? barbers : [selectedBarber]).map(barber => {
                  let slotIndex = 0;
                  const rowElements: React.ReactElement[] = [];
                  
                  while (slotIndex < timeSlots.length) {
                    const currentSlot = timeSlots[slotIndex];
                    const appointment = getAppointmentForSlot(currentSlot, barber);
                    
                    if (appointment && isAppointmentStart(appointment, currentSlot)) {
                      const span = Math.min(getAppointmentSpan(appointment, currentSlot), timeSlots.length - slotIndex);
                      
                      rowElements.push(
                        <div
                          key={`${barber}-${currentSlot}`}
                          className={`p-1 border rounded cursor-pointer hover:shadow-md transition-all duration-200 min-h-[60px] flex items-center justify-center border-2 border-primary/50 bg-primary/5`}
                          style={{ gridColumn: `span ${span}` }}
                          onClick={() => onAppointmentClick(appointment)}
                        >
                          <div className="w-full h-full flex flex-col items-center justify-center text-xs p-1">
                            <div className={`w-3 h-3 rounded-full mb-1 ${getStatusColor(appointment.status)}`} />
                            <div className="font-medium truncate w-full text-center leading-tight">
                              {appointment.customer.split(' ')[0]}
                            </div>
                            <div className="text-muted-foreground truncate w-full text-center text-[10px] leading-tight">
                              {appointment.service}
                            </div>
                            <div className="text-muted-foreground text-[9px] mt-1">
                              {appointment.duration}
                            </div>
                          </div>
                        </div>
                      );
                      
                      slotIndex += span;
                    } else if (appointment) {
                      slotIndex += 1;
                    } else {
                      rowElements.push(
                        <div
                          key={`${barber}-${currentSlot}`}
                          className="p-1 border rounded cursor-pointer hover:shadow-md transition-all duration-200 min-h-[60px] flex items-center justify-center border-dashed border-muted-foreground/30 hover:border-muted-foreground/50"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCreateBooking && onCreateBooking(barber, format(selectedDate, 'yyyy-MM-dd'), currentSlot);
                          }}
                        >
                          <div className="text-muted-foreground/50 text-xs text-center cursor-pointer hover:text-primary transition-colors">
                            + Book
                          </div>
                        </div>
                      );
                      slotIndex += 1;
                    }
                  }
                  
                  const staff = staffMembers.find(s => s.name === barber);
                  const staffAvatar = getStaffAvatar(barber);
                  const staffRole = getStaffRole(barber);
                  
                  return (
                    <div key={barber} className="grid gap-1 mb-1" style={{ gridTemplateColumns: `clamp(120px, 15vw, 200px) repeat(${timeSlots.length}, minmax(50px, 1fr))` }}>
                      <div className="p-2 sm:p-3 bg-muted rounded flex items-center gap-2 sticky left-0 border-r" style={{ minWidth: 'clamp(120px, 15vw, 200px)' }}>
                        <div className="relative w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden shrink-0 border border-gray-300">
                          <img 
                            src={staffAvatar} 
                            alt={barber} 
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop";
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs sm:text-sm truncate">{barber}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{staffRole}</div>
                        </div>
                      </div>
                      {rowElements}
                    </div>
                  );
                })}
              </>
            ) : (
              // Staff on top, Time on left (rotated layout)
              <div 
                className="grid gap-1" 
                style={{ 
                  gridTemplateColumns: `clamp(120px, 15vw, 150px) repeat(${(selectedBarber === 'all' ? barbers : [selectedBarber]).length}, minmax(80px, 1fr))`,
                }}
              >
                {/* Header row */}
                <div className="p-2 font-medium text-sm text-muted-foreground sticky top-0 bg-background z-20 border-b">
                  Time / Staff
                </div>
                {(selectedBarber === 'all' ? barbers : [selectedBarber]).map(barber => {
                  const staff = staffMembers.find(s => s.name === barber);
                  const staffAvatar = getStaffAvatar(barber);
                  const staffRole = getStaffRole(barber);
                  
                  return (
                    <div key={barber} className="p-2 text-xs text-center font-medium text-muted-foreground border rounded bg-muted/50 flex flex-col items-center justify-center gap-1 sticky top-0 bg-background z-20 border-b">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-gray-300 mb-1">
                        <img 
                          src={staffAvatar} 
                          alt={barber} 
                          className="object-cover w-full h-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop";
                          }}
                        />
                      </div>
                      <div className="text-center">
                        <div className="font-medium truncate">{barber.split(' ')[0]}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{staffRole}</div>
                      </div>
                    </div>
                  );
                })}

                {/* Grid cells */}
                {timeSlots.map((slot, slotIndex) => (
                  <React.Fragment key={slot}>
                    {/* Time label for this row */}
                    <div className="p-2 sm:p-3 bg-muted rounded flex items-center gap-2 sticky left-0 z-20 border-r min-h-[80px]">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="font-medium text-xs sm:text-sm">{slot}</span>
                    </div>
                    
                    {/* Staff cells for this row */}
                    {(selectedBarber === 'all' ? barbers : [selectedBarber]).map(barber => {
                      const appointment = getAppointmentForSlot(slot, barber);
                      
                      if (appointment && isAppointmentStart(appointment, slot)) {
                        const span = Math.min(getAppointmentSpan(appointment, slot), timeSlots.length - slotIndex);
                        return (
                          <div
                            key={`${slot}-${barber}`}
                            className="p-1 border rounded cursor-pointer hover:shadow-md transition-all duration-200 flex items-center justify-center border-2 border-primary/50 bg-primary/5"
                            style={{ gridRow: `span ${span}` }}
                            onClick={() => onAppointmentClick(appointment)}
                          >
                            <div className="w-full h-full flex flex-col items-center justify-center text-xs p-1">
                              <div className={`w-3 h-3 rounded-full mb-1 ${getStatusColor(appointment.status)}`} />
                              <div className="text-muted-foreground text-[9px] mb-0.5 font-medium">
                                {appointment.time}
                              </div>
                              <div className="font-medium truncate w-full text-center leading-tight">
                                {appointment.customer.split(' ')[0]}
                              </div>
                              <div className="text-muted-foreground truncate w-full text-center text-[10px] leading-tight">
                                {appointment.service}
                              </div>
                              <div className="text-muted-foreground text-[9px] mt-1">
                                {appointment.duration}
                              </div>
                            </div>
                          </div>
                        );
                      } else if (appointment) {
                        return null;
                      } else {
                        return (
                          <div
                            key={`${slot}-${barber}`}
                            className="p-1 border rounded cursor-pointer hover:shadow-md transition-all duration-200 flex items-center justify-center border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 min-h-[80px]"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCreateBooking && onCreateBooking(barber, format(selectedDate, 'yyyy-MM-dd'), slot);
                            }}
                          >
                            <div className="text-muted-foreground/50 text-xs text-center cursor-pointer hover:text-primary transition-colors">
                              + Book
                            </div>
                          </div>
                        );
                      }
                    })}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Legend and Info */}
        <div className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>Scheduled</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span>Approved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>Cancelled/Rejected</span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>Gap: {timeSlotGap}min</span>
                <span>Hours: {businessHours.start > 12 ? `${businessHours.start - 12}PM` : `${businessHours.start}AM`} - {businessHours.end > 12 ? `${businessHours.end - 12}PM` : `${businessHours.end}AM`}</span>
                <span>Layout: {layoutMode === 'time-top' ? 'Time → Staff' : 'Staff → Time'}</span>
              </div>
            </div>
          </div>

          {/* Info */}
          {staffMembers.length > 0 && (
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4" />
                <strong>Staff from Firebase:</strong> {staffMembers.length} active staff members loaded
              </div>
              <div className="flex flex-wrap gap-2">
                {staffMembers.slice(0, 3).map(staff => (
                  <div key={staff.id} className="flex items-center gap-1 text-xs px-2 py-1 bg-background rounded">
                    <div className="relative w-3 h-3 rounded-full overflow-hidden">
                      <img 
                        src={staff.avatar} 
                        alt={staff.name} 
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop";
                        }}
                      />
                    </div>
                    <span>{staff.name.split(' ')[0]}</span>
                  </div>
                ))}
                {staffMembers.length > 3 && (
                  <span className="text-xs">+{staffMembers.length - 3} more</span>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}