'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminSidebar, AdminMobileSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { db } from '@/lib/firebase';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  setDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import {
  Minus,
  Plus,
  Scissors,
  Package,
  Search,
  Trash2,
  ShoppingCart,
  Loader2,
  CalendarDays,
  UserRound,
  Clock3,
  Eye,
  Printer,
  FileDown,
} from 'lucide-react';
import { generateUnifiedInvoicePdf } from '@/lib/unified-invoice-pdf';

type PortalType = 'admin' | 'super_admin';
type ItemType = 'service' | 'product';

type CatalogService = {
  id: string;
  name: string;
  price: number;
  duration?: number;
  status?: string;
  branchNames?: string[];
  branches?: string[];
};

type CatalogProduct = {
  id: string;
  name: string;
  price: number;
  status?: string;
  totalStock?: number;
  branchNames?: string[];
  branches?: string[];
};

type Branch = {
  id: string;
  name: string;
  status?: string;
};

type StaffMember = {
  id: string;
  name: string;
  role?: string;
  status?: string;
  branch?: string;
  branchNames?: string[];
  branches?: string[];
};

type Customer = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
};

type CartLine = {
  lineId: string;
  sourceId: string;
  itemType: ItemType;
  name: string;
  unitPrice: number;
  quantity: number;
};

interface POSCheckoutPageProps {
  portalType: PortalType;
}

type ReceiptData = {
  checkoutNumber: string;
  createdAt: Date;
  branchName: string;
  customerName: string;
  items: Array<{
    itemType: ItemType;
    itemName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentRows: Array<{ label: string; amount: number }>;
  notes: string;
  serviceDate?: string;
  serviceTime?: string;
};

const formatCurrency = (amount: number) => `AED ${amount.toFixed(2)}`;
const DEFAULT_TAX_PERCENT = 5;

export default function POSCheckoutPage({ portalType }: POSCheckoutPageProps) {
  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [services, setServices] = useState<CatalogService[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [recentCheckouts, setRecentCheckouts] = useState<any[]>([]);

  const [selectedBranchId, setSelectedBranchId] = useState('all');
  const [customerId, setCustomerId] = useState('walk-in');
  const [walkInName, setWalkInName] = useState('Walk-in Customer');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInEmail, setWalkInEmail] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('unassigned');
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('09:00');
  const [paymentMode, setPaymentMode] = useState<'single' | 'split'>('single');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [splitCashAmount, setSplitCashAmount] = useState('0');
  const [splitCardAmount, setSplitCardAmount] = useState('0');
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [discountValue, setDiscountValue] = useState('0');
  const [notes, setNotes] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [activeCatalogTab, setActiveCatalogTab] = useState<'services' | 'products'>('services');
  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null);
  const [selectedRecentReceipt, setSelectedRecentReceipt] = useState<ReceiptData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [cart, setCart] = useState<CartLine[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [branchesSnap, servicesSnap, productsSnap, staffSnap, customersSnap, checkoutsSnap] =
          await Promise.all([
            getDocs(query(collection(db, 'branches'))),
            getDocs(query(collection(db, 'services'))),
            getDocs(query(collection(db, 'products'))),
            getDocs(query(collection(db, 'staff'))),
            getDocs(query(collection(db, 'customers'), limit(200))),
            getDocs(query(collection(db, 'pos_checkouts'), orderBy('createdAt', 'desc'), limit(8))),
          ]);

        if (!isMounted) return;

        const nextBranches = branchesSnap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: data.name || 'Unknown Branch',
            status: data.status || 'active',
          };
        });
        setBranches(nextBranches.filter((b) => b.status === 'active'));

        const nextServices = servicesSnap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: data.name || 'Service',
            price: Number(data.price || 0),
            duration: Number(data.duration || 0),
            status: data.status || 'active',
            branchNames: Array.isArray(data.branchNames) ? data.branchNames : [],
            branches: Array.isArray(data.branches) ? data.branches : [],
          };
        });
        setServices(nextServices.filter((s) => (s.status || '').toLowerCase() === 'active'));

        const nextProducts = productsSnap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: data.name || 'Product',
            price: Number(data.price || 0),
            status: data.status || 'active',
            totalStock: Number(data.totalStock || 0),
            branchNames: Array.isArray(data.branchNames) ? data.branchNames : [],
            branches: Array.isArray(data.branches) ? data.branches : [],
          };
        });
        setProducts(nextProducts.filter((p) => ['active', 'low-stock'].includes((p.status || '').toLowerCase())));

        const nextStaff = staffSnap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: data.name || 'Staff',
            role: data.role || '',
            status: data.status || 'active',
            branch: data.branch || '',
            branchNames: Array.isArray(data.branchNames) ? data.branchNames : [],
            branches: Array.isArray(data.branches) ? data.branches : [],
          };
        });
        setStaffMembers(nextStaff.filter((s) => (s.status || '').toLowerCase() === 'active'));

        const nextCustomers = customersSnap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: data.name || data.customerName || 'Customer',
            email: data.email || '',
            phone: data.phone || '',
          };
        });
        setCustomers(nextCustomers);

        const nextCheckouts = checkoutsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        setRecentCheckouts(nextCheckouts);
      } catch (error) {
        console.error('POS data load error:', error);
        setUiError('Unable to load POS data right now. Please refresh.');
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (user?.role !== 'admin') return;

    if (user.branchId) {
      setSelectedBranchId(user.branchId);
      return;
    }

    if (user.branchName && branches.length > 0) {
      const matchedBranch = branches.find(
        (branch) => branch.name.trim().toLowerCase() === user.branchName?.trim().toLowerCase()
      );
      if (matchedBranch) {
        setSelectedBranchId(matchedBranch.id);
      }
    }
  }, [user?.role, user?.branchId, user?.branchName, branches.length]);

  useEffect(() => {
    if (user?.role !== 'admin' && selectedBranchId === 'all' && branches.length > 0) {
      setSelectedBranchId(branches[0].id);
    }
  }, [user?.role, selectedBranchId, branches.length, branches[0]?.id]);

  const selectedBranch = useMemo(() => {
    if (selectedBranchId === 'all') return null;
    return branches.find((b) => b.id === selectedBranchId) || null;
  }, [branches, selectedBranchId]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === customerId) || null,
    [customers, customerId]
  );

  const selectedStaff = useMemo(
    () => staffMembers.find((s) => s.id === selectedStaffId) || null,
    [staffMembers, selectedStaffId]
  );

  const branchAllows = (
    branchNames: string[] | undefined,
    branchIds: string[] | undefined,
    currentBranchId: string
  ) => {
    if (currentBranchId === 'all') return true;

    const byId = Array.isArray(branchIds) && branchIds.includes(currentBranchId);
    if (byId) return true;

    const branchName = branches.find((b) => b.id === currentBranchId)?.name || '';
    const byName = Array.isArray(branchNames) && branchName ? branchNames.includes(branchName) : false;

    return byName || (!branchNames?.length && !branchIds?.length);
  };

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchesBranch = branchAllows(s.branchNames, s.branches, selectedBranchId);
      const q = serviceSearch.trim().toLowerCase();
      const matchesSearch = !q || s.name.toLowerCase().includes(q);
      return matchesBranch && matchesSearch;
    });
  }, [services, selectedBranchId, serviceSearch, branches]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesBranch = branchAllows(p.branchNames, p.branches, selectedBranchId);
      const q = productSearch.trim().toLowerCase();
      const matchesSearch = !q || p.name.toLowerCase().includes(q);
      return matchesBranch && matchesSearch;
    });
  }, [products, selectedBranchId, productSearch, branches]);

  const filteredStaff = useMemo(() => {
    if (selectedBranchId === 'all') return staffMembers;

    const selectedBranchName =
      branches.find((branch) => branch.id === selectedBranchId)?.name?.trim().toLowerCase() || '';

    return staffMembers.filter((staff) => {
      const byId = Array.isArray(staff.branches) && staff.branches.includes(selectedBranchId);
      if (byId) return true;

      const normalizedPrimaryBranch = (staff.branch || '').trim().toLowerCase();
      const byPrimaryBranch = !!selectedBranchName && normalizedPrimaryBranch === selectedBranchName;
      if (byPrimaryBranch) return true;

      const byBranchNames =
        !!selectedBranchName &&
        Array.isArray(staff.branchNames) &&
        staff.branchNames.some((name) => name?.trim().toLowerCase() === selectedBranchName);

      return byBranchNames;
    });
  }, [staffMembers, selectedBranchId, branches]);

  useEffect(() => {
    if (selectedStaffId === 'unassigned') return;
    const existsInCurrentBranch = filteredStaff.some((s) => s.id === selectedStaffId);
    if (!existsInCurrentBranch) {
      setSelectedStaffId('unassigned');
    }
  }, [filteredStaff, selectedStaffId]);

  const availableTimeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = 9; hour < 22; hour++) {
      slots.push(`${String(hour).padStart(2, '0')}:00`);
      slots.push(`${String(hour).padStart(2, '0')}:30`);
    }

    const now = new Date();
    const isToday = bookingDate === now.toISOString().split('T')[0];
    if (!isToday) return slots;

    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return slots.filter((slot) => {
      const [h, m] = slot.split(':').map(Number);
      return h * 60 + m >= nowMinutes;
    });
  }, [bookingDate]);

  useEffect(() => {
    if (!availableTimeSlots.length) return;
    if (!availableTimeSlots.includes(bookingTime)) {
      setBookingTime(availableTimeSlots[0]);
    }
  }, [availableTimeSlots, bookingTime]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cart]
  );

  const discountAmount = useMemo(() => {
    const rawDiscount = Number(discountValue || 0);
    if (discountType === 'percentage') {
      return Math.min(subtotal, Math.max(0, (subtotal * rawDiscount) / 100));
    }
    return Math.min(subtotal, Math.max(0, rawDiscount));
  }, [discountType, discountValue, subtotal]);

  const taxableAmount = useMemo(() => Math.max(0, subtotal - discountAmount), [subtotal, discountAmount]);
  const taxAmount = useMemo(() => {
    return Math.max(0, (taxableAmount * DEFAULT_TAX_PERCENT) / 100);
  }, [taxableAmount]);
  const totalAmount = useMemo(() => taxableAmount + taxAmount, [taxableAmount, taxAmount]);

  const splitCash = Number(splitCashAmount || 0);
  const splitCard = Number(splitCardAmount || 0);
  const totalPaid = paymentMode === 'split' ? splitCash + splitCard : totalAmount;

  const addToCart = (itemType: ItemType, sourceId: string, name: string, unitPrice: number) => {
    if (itemType === 'product') {
      const product = products.find((p) => p.id === sourceId);
      const currentQty = cart.find((line) => line.itemType === 'product' && line.sourceId === sourceId)?.quantity || 0;
      if (!product || (product.totalStock || 0) <= currentQty) {
        alert('Insufficient stock for this product.');
        return;
      }
    }

    setCart((prev) => {
      const existing = prev.find((line) => line.itemType === itemType && line.sourceId === sourceId);
      if (existing) {
        return prev.map((line) =>
          line.lineId === existing.lineId
            ? { ...line, quantity: line.quantity + 1 }
            : line
        );
      }

      return [
        ...prev,
        {
          lineId: `${itemType}-${sourceId}`,
          sourceId,
          itemType,
          name,
          unitPrice,
          quantity: 1,
        },
      ];
    });
  };

  const handleCustomerChange = (value: string) => {
    if (value === '__create__') {
      setCreateCustomerOpen(true);
      setCustomerId('walk-in');
      return;
    }
    setCustomerId(value);
  };

  const handleCreateCustomer = async () => {
    const email = newCustomer.email.trim().toLowerCase();
    const name = newCustomer.name.trim();
    const phone = newCustomer.phone.trim();

    if (!name || !email) {
      alert('Customer name and email are required.');
      return;
    }

    const emailExists = customers.some((customer) => customer.email.toLowerCase() === email);
    if (emailExists) {
      alert('Email already exists.');
      return;
    }

    try {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: email }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error || 'Failed to create auth user');
      }

      const { uid } = await response.json();
      if (!uid) {
        throw new Error('Failed to create auth user');
      }

      await setDoc(doc(db, 'users', uid), {
        uid,
        name,
        email,
        phone,
        role: 'customer',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const customerRef = await addDoc(collection(db, 'customers'), {
        uid,
        name,
        email,
        phone,
        role: 'customer',
        status: 'active',
        loyaltyPoints: 0,
        walletBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setCustomers((prev) => [
        ...prev,
        { id: customerRef.id, name, email, phone },
      ]);
      setCustomerId(customerRef.id);
      setCreateCustomerOpen(false);
      setNewCustomer({ name: '', email: '', phone: '' });
      alert('Customer created. Default password is the email address.');
    } catch (error: any) {
      console.error('Create customer failed:', error);
      alert(error?.message || 'Failed to create customer.');
    }
  };

  const setQuantity = (lineId: string, nextQty: number) => {
    if (nextQty <= 0) {
      setCart((prev) => prev.filter((line) => line.lineId !== lineId));
      return;
    }

    const line = cart.find((item) => item.lineId === lineId);
    if (line?.itemType === 'product') {
      const product = products.find((p) => p.id === line.sourceId);
      if (product && nextQty > (product.totalStock || 0)) {
        alert('Quantity exceeds available stock.');
        return;
      }
    }

    setCart((prev) => prev.map((line) => (line.lineId === lineId ? { ...line, quantity: nextQty } : line)));
  };

  const removeLine = (lineId: string) => {
    setCart((prev) => prev.filter((line) => line.lineId !== lineId));
  };

  const printReceipt = (receipt: ReceiptData) => {
    const rows = receipt.items
      .map(
        (item) =>
          `<tr>
            <td>${item.itemName}</td>
            <td style="text-transform: capitalize;">${item.itemType}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.unitPrice)}</td>
            <td>${formatCurrency(item.lineTotal)}</td>
          </tr>`
      )
      .join('');

    const paymentRows = receipt.paymentRows
      .map((row) => `<p><strong>${row.label}:</strong> ${formatCurrency(row.amount)}</p>`)
      .join('');

    const html = `
      <!doctype html>
      <html>
      <head>
        <title>Receipt ${receipt.checkoutNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
          h1 { margin-bottom: 4px; }
          p { margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
          th { background: #f4f4f4; }
          .totals { margin-top: 16px; }
          .totals p { display: flex; justify-content: space-between; max-width: 320px; }
          .final { font-weight: bold; font-size: 15px; }
        </style>
      </head>
      <body>
        <h1>POS Receipt</h1>
        <p><strong>Receipt:</strong> ${receipt.checkoutNumber}</p>
        <p><strong>Date:</strong> ${receipt.createdAt.toLocaleString()}</p>
        <p><strong>Branch:</strong> ${receipt.branchName}</p>
        <p><strong>Customer:</strong> ${receipt.customerName}</p>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Type</th>
              <th>Qty</th>
              <th>Unit</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div class="totals">
          <p><span>Subtotal</span><span>${formatCurrency(receipt.subtotal)}</span></p>
          <p><span>Discount</span><span>- ${formatCurrency(receipt.discountAmount)}</span></p>
          <p><span>Tax</span><span>${formatCurrency(receipt.taxAmount)}</span></p>
          <p class="final"><span>Grand Total</span><span>${formatCurrency(receipt.totalAmount)}</span></p>
        </div>

        <div style="margin-top: 12px;">${paymentRows}</div>
        ${receipt.notes ? `<p style="margin-top:12px;"><strong>Notes:</strong> ${receipt.notes}</p>` : ''}
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const checkoutToReceipt = (checkout: any): ReceiptData => {
    const createdAtDate = checkout?.createdAt?.seconds
      ? new Date(checkout.createdAt.seconds * 1000)
      : checkout?.createdAt?.toDate
      ? checkout.createdAt.toDate()
      : new Date();

    const items = Array.isArray(checkout?.items)
      ? checkout.items.map((item: any) => ({
          itemType: item.itemType === 'product' ? 'product' : 'service',
          itemName: item.itemName || item.name || 'Item',
          quantity: Number(item.quantity || 0),
          unitPrice: Number(item.unitPrice || 0),
          lineTotal: Number(item.lineTotal || (Number(item.quantity || 0) * Number(item.unitPrice || 0))),
        }))
      : [];

    const paymentRows = (() => {
      if (checkout?.paymentMode === 'split') {
        const cash = Number(checkout?.paymentBreakdown?.cash || 0);
        const card = Number(checkout?.paymentBreakdown?.card || 0);
        return [
          { label: 'Cash', amount: cash },
          { label: 'Card', amount: card },
        ];
      }

      const method = String(checkout?.paymentMethod || 'cash').replaceAll('_', ' ').toUpperCase();
      return [{ label: method, amount: Number(checkout?.totalPaid || checkout?.totalAmount || 0) }];
    })();

    return {
      checkoutNumber: checkout?.checkoutNumber || checkout?.id || 'POS',
      createdAt: createdAtDate,
      branchName: checkout?.branchName || 'Branch',
      customerName: checkout?.customerName || 'Customer',
      items,
      subtotal: Number(checkout?.subtotal || 0),
      discountAmount: Number(checkout?.discountAmount || 0),
      taxAmount: Number(checkout?.taxAmount || 0),
      totalAmount: Number(checkout?.totalAmount || 0),
      paymentRows,
      notes: checkout?.notes || '',
      serviceDate: checkout?.bookingDate || checkout?.date || '',
      serviceTime: checkout?.bookingTime || checkout?.time || '',
    };
  };

  const downloadReceiptPdf = async (receipt: ReceiptData) => {
    const taxableAmount = Math.max(0, receipt.subtotal - receipt.discountAmount);
    const taxPercent = taxableAmount > 0 ? (receipt.taxAmount / taxableAmount) * 100 : DEFAULT_TAX_PERCENT;

    await generateUnifiedInvoicePdf({
      invoiceNumber: receipt.checkoutNumber,
      invoiceDate: receipt.createdAt.toLocaleDateString(),
      companyName: receipt.branchName || 'MAN OF CAVE BARBERSHOP',
      customerName: receipt.customerName,
      serviceDate: receipt.serviceDate || receipt.createdAt.toLocaleDateString(),
      serviceTime: receipt.serviceTime || receipt.createdAt.toLocaleTimeString(),
      branchName: receipt.branchName,
      items: receipt.items.map((item) => ({
        description: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        details: item.itemType === 'service' ? 'Service' : 'Product',
      })),
      subtotal: receipt.subtotal,
      discountAmount: receipt.discountAmount,
      taxAmount: receipt.taxAmount,
      taxPercent,
      totalAmount: receipt.totalAmount,
      paymentMethods: receipt.paymentRows,
      notes: receipt.notes,
      logoPath: '/manofcave.png',
      fileName: `${receipt.checkoutNumber}.pdf`,
    });
  };

  const handleCheckout = async () => {
    if (!user) return;
    if (cart.length === 0) {
      alert('Add at least one product or service before checkout.');
      return;
    }

    if (selectedBranchId === 'all') {
      alert('Select a branch for POS checkout.');
      return;
    }

    const hasService = cart.some((line) => line.itemType === 'service');
    if (!hasService) {
      alert('Add at least one service to create a booking from POS.');
      return;
    }

    if (paymentMode === 'split') {
      if (splitCash < 0 || splitCard < 0) {
        alert('Split payment amounts cannot be negative.');
        return;
      }

      if (Math.abs(totalPaid - totalAmount) > 0.01) {
        alert('For split payment, Cash + Card must equal the grand total.');
        return;
      }
    }

    if (!bookingDate || !bookingTime) {
      alert('Select booking date and time.');
      return;
    }

    if (!availableTimeSlots.includes(bookingTime)) {
      alert('Selected time is not available. Please choose a current or future time slot.');
      return;
    }

    const checkoutNumber = `POS-${Date.now()}`;
    const bookingNumber = `BOOK-${Date.now()}`;
    const customerName =
      customerId === 'walk-in'
        ? walkInName.trim() || 'Walk-in Customer'
        : selectedCustomer?.name || 'Customer';
    const customerEmail = customerId === 'walk-in' ? walkInEmail.trim() : selectedCustomer?.email || '';
    const customerPhone = customerId === 'walk-in' ? walkInPhone.trim() : selectedCustomer?.phone || '';
    const serviceLines = cart.filter((line) => line.itemType === 'service');
    const productLines = cart.filter((line) => line.itemType === 'product');
    const totalDuration = serviceLines.reduce((sum, line) => {
      const foundService = services.find((s) => s.id === line.sourceId);
      return sum + ((foundService?.duration || 30) * line.quantity);
    }, 0);

    setSubmitting(true);
    try {
      const payload = {
        checkoutNumber,
        branchId: selectedBranchId,
        branchName: selectedBranch?.name || user.branchName || 'Unknown Branch',
        customerId: selectedCustomer?.id || null,
        customerName,
        customerEmail,
        customerPhone,
        items: cart.map((line) => ({
          itemType: line.itemType,
          itemId: line.sourceId,
          itemName: line.name,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          lineTotal: line.unitPrice * line.quantity,
        })),
        subtotal,
        discountType,
        discountValue: Number(discountValue || 0),
        discountAmount,
        taxPercent: DEFAULT_TAX_PERCENT,
        taxAmount,
        totalAmount,
        paymentMode,
        paymentMethod: paymentMode === 'split' ? 'split_cash_card' : paymentMethod,
        paymentBreakdown:
          paymentMode === 'split'
            ? { cash: splitCash, card: splitCard }
            : { [paymentMethod]: totalAmount },
        totalPaid,
        balanceDue: Math.max(0, totalAmount - totalPaid),
        paymentStatus: Math.abs(totalAmount - totalPaid) <= 0.01 ? 'paid' : 'partial',
        status: 'completed',
        notes: notes.trim(),
        source: portalType === 'super_admin' ? 'super_admin_pos' : 'admin_pos',
        createdBy: user.role,
        createdById: user.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const checkoutRef = await addDoc(collection(db, 'pos_checkouts'), payload);

      const batch = writeBatch(db);
      cart
        .filter((line) => line.itemType === 'product')
        .forEach((line) => {
          const productRef = doc(db, 'products', line.sourceId);
          batch.update(productRef, {
            totalStock: increment(-line.quantity),
            totalSold: increment(line.quantity),
            revenue: increment(line.unitPrice * line.quantity),
            updatedAt: serverTimestamp(),
          });
        });

      await batch.commit();

      await addDoc(collection(db, 'transactions'), {
        customerId: selectedCustomer?.id || null,
        customerName,
        type: 'pos_checkout',
        amount: -totalAmount,
        status: 'success',
        paymentMethod: paymentMode === 'split' ? 'split_cash_card' : paymentMethod,
        referenceId: checkoutRef.id,
        description: `POS checkout ${checkoutNumber}`,
        branchId: selectedBranchId,
        branchName: selectedBranch?.name || user.branchName || 'Unknown Branch',
        createdAt: serverTimestamp(),
      });

      const paymentMethodsForBooking =
        paymentMode === 'split' ? ['cash', 'card'] : [paymentMethod];

      const paymentAmountsForBooking =
        paymentMode === 'split'
          ? { cash: splitCash, card: splitCard }
          : { [paymentMethod]: totalAmount };

      const assignedStaffName = selectedStaff?.name || 'Not Assigned';

      await addDoc(collection(db, 'bookings'), {
        bookingNumber,
        bookingDate,
        bookingTime,
        date: bookingDate,
        time: bookingTime,
        timeSlot: bookingTime,
        customerName,
        customerEmail,
        customerPhone,
        customerId: selectedCustomer?.id || '',
        serviceName: serviceLines[0]?.name || 'Service',
        serviceDuration: totalDuration,
        services: serviceLines.map((line) => line.name),
        serviceDetails: serviceLines.map((line) => {
          const foundService = services.find((s) => s.id === line.sourceId);
          return {
            id: line.sourceId,
            name: line.name,
            quantity: line.quantity,
            price: line.unitPrice,
            duration: foundService?.duration || 30,
            branch: selectedBranch?.name || user.branchName || 'Unknown Branch',
            staff: selectedStaff?.name || 'Unassigned',
            staffId: selectedStaff?.id || '',
          };
        }),
        products: productLines.map((line) => ({
          id: line.sourceId,
          name: line.name,
          quantity: line.quantity,
          price: line.unitPrice,
          total: line.unitPrice * line.quantity,
        })),
        productsTotal: productLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
        servicePrice: serviceLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0),
        subtotal,
        discount: Number(discountValue || 0),
        discountAmount,
        discountType,
        tax: DEFAULT_TAX_PERCENT,
        taxAmount,
        totalPrice: totalAmount,
        totalAmount,
        duration: `${totalDuration} min`,
        totalDuration,
        paymentMethod: paymentMode === 'split' ? 'split_cash_card' : paymentMethod,
        paymentMethods: paymentMethodsForBooking,
        paymentAmounts: paymentAmountsForBooking,
        paymentStatus: Math.abs(totalAmount - totalPaid) <= 0.01 ? 'paid' : 'partial',
        status: 'upcoming',
        notes: notes.trim(),
        branchId: selectedBranchId,
        branch: selectedBranch?.name || user.branchName || 'Unknown Branch',
        branchNames: [selectedBranch?.name || user.branchName || 'Unknown Branch'],
        branches: [selectedBranchId],
        staff: assignedStaffName,
        staffName: assignedStaffName,
        barber: assignedStaffName,
        staffId: selectedStaff?.id || '',
        source: 'pos_booking',
        createdBy: user.role,
        createdById: user.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const receipt: ReceiptData = {
        checkoutNumber,
        createdAt: new Date(),
        branchName: selectedBranch?.name || user.branchName || 'Unknown Branch',
        customerName:
          customerId === 'walk-in'
            ? walkInName.trim() || 'Walk-in Customer'
            : selectedCustomer?.name || 'Customer',
        items: cart.map((line) => ({
          itemType: line.itemType,
          itemName: line.name,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          lineTotal: line.unitPrice * line.quantity,
        })),
        subtotal,
        discountAmount,
        taxAmount,
        totalAmount,
        paymentRows:
          paymentMode === 'split'
            ? [
                { label: 'Cash', amount: splitCash },
                { label: 'Card', amount: splitCard },
              ]
            : [{ label: paymentMethod.toUpperCase(), amount: totalAmount }],
        notes: notes.trim(),
      };

      setLastReceipt(receipt);
      printReceipt(receipt);

      setCart([]);
      setNotes('');
      setPaymentMethod('cash');
      setPaymentMode('single');
      setSplitCashAmount('0');
      setSplitCardAmount('0');
      setDiscountType('fixed');
      setDiscountValue('0');
      setCustomerId('walk-in');
      setWalkInPhone('');
      setWalkInEmail('');
      setSelectedStaffId('unassigned');
      alert(`Checkout + booking created successfully: ${checkoutNumber}`);
    } catch (error) {
      console.error('POS checkout failed:', error);
      alert('Failed to complete POS checkout. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AdminSidebar
        role={user?.role === 'super_admin' ? 'super_admin' : 'branch_admin'}
        onLogout={logout}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        allowedPages={user?.allowedPages || []}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Fast POS Booking</h1>
            <p className="text-sm text-gray-500">Quickly book services and products from one clean checkout screen</p>
            {uiError && <p className="text-xs text-red-600 mt-1">{uiError}</p>}
          </div>
          <AdminMobileSidebar
            role={user?.role === 'super_admin' ? 'super_admin' : 'branch_admin'}
            onLogout={logout}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            allowedPages={user?.allowedPages || []}
          />
        </div>

        <div className="flex-1 overflow-auto">
          <div className="p-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Booking + Checkout Context</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Branch</Label>
                  <Select
                    value={selectedBranchId}
                    onValueChange={setSelectedBranchId}
                    disabled={user?.role === 'admin'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Customer</Label>
                  <Select value={customerId} onValueChange={handleCustomerChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__create__">+ Create Customer</SelectItem>
                      <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name || customer.email || customer.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Sheet open={createCustomerOpen} onOpenChange={setCreateCustomerOpen}>
                  <SheetContent className="sm:max-w-md">
                    <SheetHeader>
                      <SheetTitle>Create Customer</SheetTitle>
                      <SheetDescription>
                        Default password is the email address. Customer can reset it in the portal.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-4 space-y-4">
                      <div>
                        <Label>Customer Name</Label>
                        <Input
                          value={newCustomer.name}
                          onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                          placeholder="Customer name"
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={newCustomer.email}
                          onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                          placeholder="customer@email.com"
                        />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input
                          value={newCustomer.phone}
                          onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                          placeholder="0500000000"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setCreateCustomerOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateCustomer}>Create Customer</Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>

                <div>
                  <Label className="flex items-center gap-1">
                    <UserRound className="w-3 h-3" />
                    Staff
                  </Label>
                  <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {filteredStaff.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name}{staff.role ? ` • ${staff.role}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    Booking Date
                  </Label>
                  <Input
                    type="date"
                    value={bookingDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setBookingDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-1">
                    <Clock3 className="w-3 h-3" />
                    Booking Time
                  </Label>
                  <Select value={bookingTime} onValueChange={setBookingTime} disabled={availableTimeSlots.length === 0}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTimeSlots.length === 0 ? (
                        <SelectItem value="no-slots" disabled>No available slots</SelectItem>
                      ) : (
                        availableTimeSlots.map((slot) => (
                          <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Payment Mode</Label>
                  <Select value={paymentMode} onValueChange={(value: 'single' | 'split') => setPaymentMode(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single Payment</SelectItem>
                      <SelectItem value="split">Split (Cash + Card)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {customerId === 'walk-in' ? (
                  <>
                    <div>
                      <Label>Walk-in Name</Label>
                      <Input
                        value={walkInName}
                        onChange={(e) => setWalkInName(e.target.value)}
                        placeholder="Walk-in customer"
                      />
                    </div>
                    <div>
                      <Label>Walk-in Phone</Label>
                      <Input
                        value={walkInPhone}
                        onChange={(e) => setWalkInPhone(e.target.value)}
                        placeholder="03xx xxxxxxx"
                      />
                    </div>
                    <div>
                      <Label>Walk-in Email</Label>
                      <Input
                        type="email"
                        value={walkInEmail}
                        onChange={(e) => setWalkInEmail(e.target.value)}
                        placeholder="optional@email.com"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label>Customer Phone</Label>
                      <Input value={selectedCustomer?.phone || ''} disabled />
                    </div>
                    <div>
                      <Label>Customer Email</Label>
                      <Input value={selectedCustomer?.email || ''} disabled />
                    </div>
                  </>
                )}

                <div>
                  <Label>Discount Type</Label>
                  <Select value={discountType} onValueChange={(value: 'fixed' | 'percentage') => setDiscountType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Discount type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed (AED)</SelectItem>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>{discountType === 'fixed' ? 'Discount (AED)' : 'Discount (%)'}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Tax</Label>
                  <Input value={`${DEFAULT_TAX_PERCENT}% (Default)`} disabled />
                </div>

                {paymentMode === 'single' ? (
                  <div>
                    <Label>Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="digital">Digital</SelectItem>
                        <SelectItem value="wallet">Wallet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <>
                    <div>
                      <Label>Split Cash (AED)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={splitCashAmount}
                        onChange={(e) => setSplitCashAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Split Card (AED)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={splitCardAmount}
                        onChange={(e) => setSplitCardAmount(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base">Catalog</CardTitle>
                  <div className="inline-flex rounded-lg border bg-white p-1">
                    <Button
                      type="button"
                      size="sm"
                      variant={activeCatalogTab === 'services' ? 'default' : 'ghost'}
                      className="h-8"
                      onClick={() => setActiveCatalogTab('services')}
                    >
                      <Scissors className="w-4 h-4 mr-1" />
                      Services
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={activeCatalogTab === 'products' ? 'default' : 'ghost'}
                      className="h-8"
                      onClick={() => setActiveCatalogTab('products')}
                    >
                      <Package className="w-4 h-4 mr-1" />
                      Products
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {activeCatalogTab === 'services' ? (
                  <>
                    <div className="relative mb-3">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        className="pl-9"
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        placeholder="Search services"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                      {filteredServices.map((service) => (
                        <div key={service.id} className="border rounded-lg p-2 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{service.name}</p>
                            <p className="text-xs text-gray-500">
                              {formatCurrency(service.price)}{service.duration ? ` • ${service.duration} min` : ''}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => addToCart('service', service.id, service.name, service.price)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    {filteredServices.length === 0 && <p className="text-sm text-gray-500">No services found.</p>}
                  </>
                ) : (
                  <>
                    <div className="relative mb-3">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        className="pl-9"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Search products"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                      {filteredProducts.map((product) => (
                        <div key={product.id} className="border rounded-lg p-2 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{product.name}</p>
                            <p className="text-xs text-gray-500">
                              {formatCurrency(product.price)} • Stock {product.totalStock || 0}
                            </p>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            disabled={(product.totalStock || 0) <= 0}
                            onClick={() => addToCart('product', product.id, product.name, product.price)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    {filteredProducts.length === 0 && <p className="text-sm text-gray-500">No products found.</p>}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Checkout Cart
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {cart.map((line) => (
                    <div key={line.lineId} className="border rounded-lg p-2 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{line.name}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {line.itemType}
                          </Badge>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeLine(line.lineId)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" onClick={() => setQuantity(line.lineId, line.quantity - 1)}>
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center">{line.quantity}</span>
                          <Button variant="outline" size="icon" onClick={() => setQuantity(line.lineId, line.quantity + 1)}>
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="font-semibold">{formatCurrency(line.unitPrice * line.quantity)}</p>
                      </div>
                    </div>
                  ))}

                  {cart.length === 0 && <p className="text-sm text-gray-500">No items in cart.</p>}
                </div>

                <Separator />

                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Checkout notes"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Subtotal</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Discount</span>
                  <span className="font-semibold text-red-600">- {formatCurrency(discountAmount)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tax ({DEFAULT_TAX_PERCENT}%)</span>
                  <span className="font-semibold">{formatCurrency(taxAmount)}</span>
                </div>

                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-sm text-gray-800 font-semibold">Grand Total</span>
                  <span className="font-bold text-base">{formatCurrency(totalAmount)}</span>
                </div>

                {paymentMode === 'split' && (
                  <div className="text-xs rounded-md bg-blue-50 border border-blue-200 p-2 text-blue-700">
                    Split Paid: {formatCurrency(totalPaid)} / {formatCurrency(totalAmount)}
                  </div>
                )}

                <Button className="w-full" onClick={handleCheckout} disabled={submitting || cart.length === 0}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Complete Checkout (${formatCurrency(totalAmount)})`
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={!lastReceipt}
                  onClick={() => lastReceipt && printReceipt(lastReceipt)}
                >
                  Print Last Receipt
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recent POS Checkouts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {recentCheckouts.map((checkout) => (
                  <div key={checkout.id} className="border rounded-lg p-2">
                    <p className="text-sm font-semibold">{checkout.checkoutNumber || checkout.id}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {checkout.customerName || 'Customer'} • {checkout.branchName || 'Branch'}
                    </p>
                    <p className="text-sm font-medium mt-1">{formatCurrency(Number(checkout.totalAmount || 0))}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRecentReceipt(checkoutToReceipt(checkout));
                          setDetailsOpen(true);
                        }}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        View
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => printReceipt(checkoutToReceipt(checkout))}
                      >
                        <Printer className="w-3.5 h-3.5 mr-1" />
                        Print
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          void downloadReceiptPdf(checkoutToReceipt(checkout));
                        }}
                      >
                        <FileDown className="w-3.5 h-3.5 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </div>
                ))}
                {recentCheckouts.length === 0 && (
                  <p className="text-sm text-gray-500">No recent POS checkouts yet.</p>
                )}
              </CardContent>
            </Card>

            <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
              <SheetContent className="sm:max-w-xl w-full overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Checkout Details</SheetTitle>
                </SheetHeader>

                {selectedRecentReceipt && (
                  <div className="mt-4 space-y-3">
                    <div className="text-sm space-y-1">
                      <p><span className="text-gray-500">Receipt:</span> {selectedRecentReceipt.checkoutNumber}</p>
                      <p><span className="text-gray-500">Date:</span> {selectedRecentReceipt.createdAt.toLocaleString()}</p>
                      <p><span className="text-gray-500">Branch:</span> {selectedRecentReceipt.branchName}</p>
                      <p><span className="text-gray-500">Customer:</span> {selectedRecentReceipt.customerName}</p>
                    </div>

                    <div className="border rounded-lg divide-y">
                      {selectedRecentReceipt.items.map((item, idx) => (
                        <div key={`${item.itemName}-${idx}`} className="p-2 text-sm flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{item.itemName}</p>
                            <p className="text-xs text-gray-500">{item.itemType} • Qty {item.quantity} • {formatCurrency(item.unitPrice)}</p>
                          </div>
                          <p className="font-semibold">{formatCurrency(item.lineTotal)}</p>
                        </div>
                      ))}
                    </div>

                    <div className="text-sm space-y-1 border rounded-lg p-3">
                      <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(selectedRecentReceipt.subtotal)}</span></div>
                      <div className="flex justify-between"><span>Discount</span><span>- {formatCurrency(selectedRecentReceipt.discountAmount)}</span></div>
                      <div className="flex justify-between"><span>Tax</span><span>{formatCurrency(selectedRecentReceipt.taxAmount)}</span></div>
                      <div className="flex justify-between font-semibold border-t pt-1"><span>Total</span><span>{formatCurrency(selectedRecentReceipt.totalAmount)}</span></div>
                    </div>

                    {selectedRecentReceipt.notes && (
                      <p className="text-sm text-gray-600 border rounded-lg p-3">{selectedRecentReceipt.notes}</p>
                    )}

                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" onClick={() => printReceipt(selectedRecentReceipt)}>
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          void downloadReceiptPdf(selectedRecentReceipt);
                        }}
                      >
                        <FileDown className="w-4 h-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
