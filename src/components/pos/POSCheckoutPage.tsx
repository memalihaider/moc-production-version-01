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
import { db } from '@/lib/firebase';
import {
  addDoc,
  collection,
  doc,
  increment,
  onSnapshot,
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
} from 'lucide-react';

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
};

const formatCurrency = (amount: number) => `AED ${amount.toFixed(2)}`;

export default function POSCheckoutPage({ portalType }: POSCheckoutPageProps) {
  const { user, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uiError, setUiError] = useState<string | null>(null);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [services, setServices] = useState<CatalogService[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [recentCheckouts, setRecentCheckouts] = useState<any[]>([]);

  const [selectedBranchId, setSelectedBranchId] = useState('all');
  const [customerId, setCustomerId] = useState('walk-in');
  const [walkInName, setWalkInName] = useState('Walk-in Customer');
  const [paymentMode, setPaymentMode] = useState<'single' | 'split'>('single');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [splitCashAmount, setSplitCashAmount] = useState('0');
  const [splitCardAmount, setSplitCardAmount] = useState('0');
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [discountValue, setDiscountValue] = useState('0');
  const [taxPercent, setTaxPercent] = useState('0');
  const [notes, setNotes] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null);

  const [cart, setCart] = useState<CartLine[]>([]);

  useEffect(() => {
    const unsubscribers: Array<() => void> = [];

    unsubscribers.push(
      onSnapshot(
        collection(db, 'branches'),
        (snapshot) => {
          const next = snapshot.docs.map((d) => {
            const data = d.data() as any;
            return {
              id: d.id,
              name: data.name || 'Unknown Branch',
              status: data.status || 'active',
            };
          });

          setBranches(next.filter((b) => b.status === 'active'));
        },
        (error) => {
          console.error('POS branches listener error:', error);
          setUiError('Unable to load branches right now. Please refresh.');
        }
      )
    );

    unsubscribers.push(
      onSnapshot(
        collection(db, 'services'),
        (snapshot) => {
          const next = snapshot.docs.map((d) => {
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

          setServices(next.filter((s) => (s.status || '').toLowerCase() === 'active'));
        },
        (error) => {
          console.error('POS services listener error:', error);
          setUiError('Unable to load services right now. Please refresh.');
        }
      )
    );

    unsubscribers.push(
      onSnapshot(
        collection(db, 'products'),
        (snapshot) => {
          const next = snapshot.docs.map((d) => {
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

          setProducts(next.filter((p) => ['active', 'low-stock'].includes((p.status || '').toLowerCase())));
        },
        (error) => {
          console.error('POS products listener error:', error);
          setUiError('Unable to load products right now. Please refresh.');
        }
      )
    );

    unsubscribers.push(
      onSnapshot(
        collection(db, 'customers'),
        (snapshot) => {
          const next = snapshot.docs.map((d) => {
            const data = d.data() as any;
            return {
              id: d.id,
              name: data.name || data.customerName || 'Customer',
              email: data.email || '',
              phone: data.phone || '',
            };
          });
          setCustomers(next);
        },
        (error) => {
          console.error('POS customers listener error:', error);
        }
      )
    );

    unsubscribers.push(
      onSnapshot(
        collection(db, 'pos_checkouts'),
        (snapshot) => {
          const next = snapshot.docs
            .map((d) => ({ id: d.id, ...(d.data() as any) }))
            .sort((a, b) => {
              const aMs = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
              const bMs = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
              return bMs - aMs;
            })
            .slice(0, 8);

          setRecentCheckouts(next);
        },
        (error) => {
          console.error('POS recent checkouts listener error:', error);
          setRecentCheckouts([]);
        }
      )
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []);

  useEffect(() => {
    if (user?.role === 'admin' && user.branchId) {
      setSelectedBranchId(user.branchId);
    }
  }, [user]);

  const selectedBranch = useMemo(() => {
    if (selectedBranchId === 'all') return null;
    return branches.find((b) => b.id === selectedBranchId) || null;
  }, [branches, selectedBranchId]);

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
    const rawTax = Number(taxPercent || 0);
    return Math.max(0, (taxableAmount * rawTax) / 100);
  }, [taxPercent, taxableAmount]);
  const totalAmount = useMemo(() => taxableAmount + taxAmount, [taxableAmount, taxAmount]);

  const splitCash = Number(splitCashAmount || 0);
  const splitCard = Number(splitCardAmount || 0);
  const totalPaid = paymentMode === 'split' ? splitCash + splitCard : totalAmount;

  const addToCart = (itemType: ItemType, sourceId: string, name: string, unitPrice: number) => {
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

  const setQuantity = (lineId: string, nextQty: number) => {
    if (nextQty <= 0) {
      setCart((prev) => prev.filter((line) => line.lineId !== lineId));
      return;
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

    const selectedCustomer = customers.find((c) => c.id === customerId);
    const checkoutNumber = `POS-${Date.now()}`;

    setSubmitting(true);
    try {
      const payload = {
        checkoutNumber,
        branchId: selectedBranchId,
        branchName: selectedBranch?.name || user.branchName || 'Unknown Branch',
        customerId: selectedCustomer?.id || null,
        customerName:
          customerId === 'walk-in'
            ? walkInName.trim() || 'Walk-in Customer'
            : selectedCustomer?.name || 'Customer',
        customerEmail: selectedCustomer?.email || '',
        customerPhone: selectedCustomer?.phone || '',
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
        taxPercent: Number(taxPercent || 0),
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
        customerName:
          customerId === 'walk-in'
            ? walkInName.trim() || 'Walk-in Customer'
            : selectedCustomer?.name || 'Customer',
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
      setTaxPercent('0');
      setCustomerId('walk-in');
      alert(`Checkout completed successfully: ${checkoutNumber}`);
    } catch (error) {
      console.error('POS checkout failed:', error);
      alert('Failed to complete POS checkout. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar
        role={user?.role === 'super_admin' ? 'super_admin' : 'branch_admin'}
        onLogout={logout}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        allowedPages={user?.allowedPages || []}
      />

      <div className="lg:pl-64 transition-all duration-300">
        <div className="sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">POS Checkout</h1>
            <p className="text-sm text-gray-500">Live product + service checkout with Firebase sync</p>
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

        <div className="p-4 grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Checkout Context</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <Label>Branch</Label>
                  <Select
                    value={selectedBranchId}
                    onValueChange={setSelectedBranchId}
                    disabled={user?.role === 'admin' && !!user.branchId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {user?.role !== 'admin' && <SelectItem value="all">All Branches</SelectItem>}
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
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name || customer.email || customer.id}
                        </SelectItem>
                      ))}
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

                <div>
                  <Label>Walk-in Name</Label>
                  <Input
                    value={walkInName}
                    onChange={(e) => setWalkInName(e.target.value)}
                    disabled={customerId !== 'walk-in'}
                    placeholder="Walk-in customer"
                  />
                </div>

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
                  <Label>Tax (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(e.target.value)}
                  />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Scissors className="w-4 h-4" />
                    Services
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative mb-3">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      className="pl-9"
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      placeholder="Search services"
                    />
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {filteredServices.map((service) => (
                      <div key={service.id} className="border rounded-lg p-2 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{service.name}</p>
                          <p className="text-xs text-gray-500">{formatCurrency(service.price)}</p>
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
                    {filteredServices.length === 0 && (
                      <p className="text-sm text-gray-500">No services found.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative mb-3">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      className="pl-9"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search products"
                    />
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
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
                          onClick={() => addToCart('product', product.id, product.name, product.price)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {filteredProducts.length === 0 && (
                      <p className="text-sm text-gray-500">No products found.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
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
                  <span className="text-sm text-gray-600">Tax</span>
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
                  </div>
                ))}
                {recentCheckouts.length === 0 && (
                  <p className="text-sm text-gray-500">No recent POS checkouts yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
