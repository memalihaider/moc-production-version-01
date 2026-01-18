// types/index.ts

export interface Appointment {
  id: number | string;
  firebaseId?: string;
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
  createdAt: Date | string;
  updatedAt: Date | string;
  staffId?: string;
  staffRole?: string;
  serviceCategory?: string;
  pointsAwarded?: boolean;
  tax?: number;
  discount?: number;
}

export interface Staff {
  id: string;
  firebaseId?: string;
  staffId?: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  specialization: string[];
  branch: string;
  avatar: string;
  status: string;
  rating: number;
  createdAt: Date | string | any;
  updatedAt: Date | string | any;
}

export interface ProductOrder {
  id: string;
  firebaseId: string;
  orderNumber: string;
  customer: string;
  customerEmail: string;
  customerPhone: string;
  products: string[];
  quantity: number;
  total: number;
  status: string;
  date: string;
  payment: string;
  paymentStatus: string;
  shippingAddress: string;
  branchNames: string;
  transactionId: string;
  createdAt: Date;
  updatedAt: Date;
  expectedDeliveryDate: Date | null;
  orderNotes: string;
  customerId: string;
}

export interface Booking {
  id: string;
  firebaseId: string;
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  services: string[];
  totalDuration: number;
  totalPrice: number;
  status: string;
  bookingDate: string;
  bookingTime: string;
  paymentMethod: string;
  paymentStatus: string;
  branch: string;
  staff: string;
  staffId: string;
  staffRole: string;
  notes: string;
  serviceCategory: string;
  serviceId: string;
  timeSlot: string;
  pointsAwarded: boolean;
  createdAt: Date;
  updatedAt: Date;
  customerId: string;
  serviceName?: string;
}

export interface BookingDataForm {
  customer: string;
  phone: string;
  email: string;
  service: string;
  barber: string;
  teamMembers: Array<{name: string, tip: number}>;
  date: string;
  time: string;
  notes: string;
  products: Array<{name: string, category: string, price: number, quantity: number}>;
  tax: number;
  serviceCharges: number;
  discount: number;
  discountType: 'fixed' | 'percentage';
  serviceTip: number;
  paymentMethods: Array<'cash' | 'card' | 'check' | 'digital'>;
  status: string;
  generateInvoice: boolean;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}