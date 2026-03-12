'use client';

import { format } from 'date-fns';
import { BranchSettings } from '@/stores/branch.store';

export interface InvoiceData {
  id: number;
  invoiceNumber: string;
  customer: string;
  email: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  duration: string;
  price: number;
  status: string;
  barber: string;
  notes?: string;
  products?: Array<{ name: string; price: number; quantity: number }>;
  tax?: number;
  discount?: number;
  paymentMethod?: string;
}

interface InvoiceTemplateProps {
  invoice: InvoiceData;
  branch: BranchSettings;
}

// Modern Template
export function ModernTemplate({ invoice, branch }: InvoiceTemplateProps) {
  const subtotal = invoice.price;
  const tax = invoice.tax || 0;
  const discount = invoice.discount || 0;
  const total = subtotal + tax - discount;

  return (
    <div className="bg-white p-12 max-w-4xl mx-auto font-sans">
      {/* Header */}
      <div className="flex justify-between items-start mb-12 border-b-2 border-primary pb-8">
        <div>
          <h1 className="text-4xl font-bold text-primary mb-2">MAN OF CAVE</h1>
          <p className="text-gray-600">{branch.name}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-secondary">INVOICE</p>
          <p className="text-gray-600 mt-2">#{invoice.invoiceNumber}</p>
        </div>
      </div>

      {/* Branch and Customer Info */}
      <div className="grid grid-cols-2 gap-8 mb-12">
        <div>
          <h3 className="font-bold text-primary mb-4">FROM</h3>
          <p className="font-semibold">{branch.name}</p>
          <p className="text-gray-600">{branch.address}</p>
          <p className="text-gray-600">{branch.city}, {branch.postalCode}</p>
          <p className="text-gray-600">{branch.country}</p>
          <p className="text-gray-600 mt-2">Phone: {branch.phone}</p>
          <p className="text-gray-600">Email: {branch.email}</p>
          <p className="text-gray-600">TRN: {branch.trn}</p>
        </div>
        <div>
          <h3 className="font-bold text-primary mb-4">BILL TO</h3>
          <p className="font-semibold">{invoice.customer}</p>
          <p className="text-gray-600">Email: {invoice.email}</p>
          <p className="text-gray-600">Phone: {invoice.phone}</p>
        </div>
      </div>

      {/* Details */}
      <div className="mb-12">
        <div className="grid grid-cols-2 gap-8 text-sm text-gray-600 mb-4">
          <div>
            <p><span className="font-semibold">Invoice Date:</span> {format(new Date(invoice.date), 'MMM dd, yyyy')}</p>
            <p><span className="font-semibold">Appointment Time:</span> {invoice.time}</p>
          </div>
          <div className="text-right">
            <p><span className="font-semibold">Barber:</span> {invoice.barber}</p>
            <p><span className="font-semibold">Status:</span> <span className="capitalize px-2 py-1 bg-gray-100 rounded">{invoice.status}</span></p>
          </div>
        </div>
      </div>

      {/* Services Table */}
      <table className="w-full mb-12 border-collapse">
        <thead>
          <tr className="border-b-2 border-primary">
            <th className="text-left py-4 text-primary font-bold">DESCRIPTION</th>
            <th className="text-center py-4 text-primary font-bold">DURATION</th>
            <th className="text-right py-4 text-primary font-bold">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-200">
            <td className="py-4">{invoice.service}</td>
            <td className="text-center py-4">{invoice.duration}</td>
            <td className="text-right py-4 font-semibold">AED {subtotal.toFixed(2)}</td>
          </tr>
          {invoice.products && invoice.products.map((product, idx) => (
            <tr key={idx} className="border-b border-gray-200">
              <td className="py-4">{product.name}</td>
              <td className="text-center py-4">x{product.quantity}</td>
              <td className="text-right py-4 font-semibold">AED {(product.price * product.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary */}
      <div className="flex justify-end mb-12">
        <div className="w-64">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span>Subtotal:</span>
            <span>AED {subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-200 text-red-600">
              <span>Discount:</span>
              <span>-AED {discount.toFixed(2)}</span>
            </div>
          )}
          {tax > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span>Tax (5%):</span>
              <span>AED {tax.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between py-4 text-lg font-bold text-primary bg-secondary/10 px-4 py-3 rounded mt-4">
            <span>TOTAL:</span>
            <span>AED {total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {invoice.notes && (
        <div className="border-t-2 border-gray-200 pt-6">
          <p className="font-semibold text-primary mb-2">NOTES</p>
          <p className="text-gray-600">{invoice.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t-2 border-primary mt-12 pt-8 text-center text-gray-600 text-sm">
        <p>Thank you for your business!</p>
        <p className="mt-2">{branch.website}</p>
      </div>
    </div>
  );
}

// Classic Template
export function ClassicTemplate({ invoice, branch }: InvoiceTemplateProps) {
  const subtotal = invoice.price;
  const tax = invoice.tax || 0;
  const discount = invoice.discount || 0;
  const total = subtotal + tax - discount;

  return (
    <div className="bg-white p-12 max-w-4xl mx-auto font-sans">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-primary mb-2">MAN OF CAVE</h1>
        <p className="text-xl text-secondary font-semibold">{branch.name}</p>
        <p className="text-gray-600 mt-4">{branch.address} | {branch.phone} | {branch.email}</p>
      </div>

      <div className="text-center mb-12 border-b-2 border-primary pb-8">
        <p className="text-4xl font-bold text-primary">INVOICE</p>
        <p className="text-lg text-gray-600">#{invoice.invoiceNumber}</p>
      </div>

      {/* Invoice Details */}
      <div className="flex justify-between mb-12 text-sm">
        <div>
          <p className="font-bold mb-2">ISSUED TO:</p>
          <p>{invoice.customer}</p>
          <p>{invoice.email}</p>
          <p>{invoice.phone}</p>
        </div>
        <div className="text-right">
          <p><span className="font-bold">Date:</span> {format(new Date(invoice.date), 'MMM dd, yyyy')}</p>
          <p><span className="font-bold">Invoice #:</span> {invoice.invoiceNumber}</p>
          <p><span className="font-bold">TRN:</span> {branch.trn}</p>
        </div>
      </div>

      {/* Service Details */}
      <table className="w-full mb-12 border-collapse">
        <thead>
          <tr className="border-t-2 border-b-2 border-primary">
            <th className="text-left py-4 text-primary font-bold">SERVICE</th>
            <th className="text-center py-4 text-primary font-bold">DURATION</th>
            <th className="text-right py-4 text-primary font-bold">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-300">
            <td className="py-4">{invoice.service}</td>
            <td className="text-center py-4">{invoice.duration}</td>
            <td className="text-right py-4">AED {subtotal.toFixed(2)}</td>
          </tr>
          {invoice.products && invoice.products.map((product, idx) => (
            <tr key={idx} className="border-b border-gray-300">
              <td className="py-4">{product.name}</td>
              <td className="text-center py-4">x{product.quantity}</td>
              <td className="text-right py-4">AED {(product.price * product.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-12">
        <div className="w-72">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>AED {subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount:</span>
                <span>-AED {discount.toFixed(2)}</span>
              </div>
            )}
            {tax > 0 && (
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>AED {tax.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t-2 border-primary pt-4 mt-4">
              <span>TOTAL:</span>
              <span>AED {total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-primary text-center pt-8 text-gray-600 text-sm">
        <p className="font-semibold mb-2">{branch.name}</p>
        <p>{branch.address}</p>
        <p className="mt-2">Phone: {branch.phone} | Email: {branch.email}</p>
        <p className="mt-4 italic">Thank you for choosing MAN OF CAVE</p>
      </div>
    </div>
  );
}

// Minimalist Template
export function MinimalistTemplate({ invoice, branch }: InvoiceTemplateProps) {
  const subtotal = invoice.price;
  const tax = invoice.tax || 0;
  const discount = invoice.discount || 0;
  const total = subtotal + tax - discount;

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto font-sans">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">MAN OF CAVE</h1>
        <p className="text-gray-500">{branch.name}</p>
        <p className="text-xs text-gray-400 mt-4">{branch.address} · {branch.city} · {branch.phone}</p>
      </div>

      <div className="grid grid-cols-3 gap-8 mb-12 text-sm">
        <div>
          <p className="text-gray-500 mb-2">INVOICE NUMBER</p>
          <p className="font-semibold text-gray-900">{invoice.invoiceNumber}</p>
        </div>
        <div>
          <p className="text-gray-500 mb-2">DATE</p>
          <p className="font-semibold text-gray-900">{format(new Date(invoice.date), 'MMM dd, yyyy')}</p>
        </div>
        <div>
          <p className="text-gray-500 mb-2">TRN</p>
          <p className="font-semibold text-gray-900">{branch.trn}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-12 text-sm border-b border-gray-200 pb-8">
        <div>
          <p className="text-gray-500 mb-2">FROM</p>
          <p className="font-semibold">{branch.name}</p>
          <p className="text-gray-600">{branch.email}</p>
          <p className="text-gray-600">{branch.phone}</p>
        </div>
        <div>
          <p className="text-gray-500 mb-2">TO</p>
          <p className="font-semibold">{invoice.customer}</p>
          <p className="text-gray-600">{invoice.email}</p>
          <p className="text-gray-600">{invoice.phone}</p>
        </div>
      </div>

      {/* Line Items */}
      <div className="mb-12">
        <div className="flex justify-between text-sm mb-4 pb-2 border-b border-gray-200 font-semibold text-gray-900">
          <span>DESCRIPTION</span>
          <span>AMOUNT</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span>{invoice.service} ({invoice.duration})</span>
          <span>AED {subtotal.toFixed(2)}</span>
        </div>
        {invoice.products && invoice.products.map((product, idx) => (
          <div key={idx} className="flex justify-between text-sm mb-2">
            <span>{product.name} x{product.quantity}</span>
            <span>AED {(product.price * product.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="flex justify-end mb-8">
        <div className="w-56">
          <div className="space-y-2 text-sm mb-4 pb-4 border-t border-gray-200 pt-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span>AED {subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount</span>
                <span>-AED {discount.toFixed(2)}</span>
              </div>
            )}
            {tax > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span>AED {tax.toFixed(2)}</span>
              </div>
            )}
          </div>
          <div className="flex justify-between font-semibold text-lg border-t border-gray-900 pt-4">
            <span>TOTAL</span>
            <span>AED {total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 border-t border-gray-200 pt-8 mt-8">
        <p>www.manofcave.com</p>
      </div>
    </div>
  );
}

// Premium Template
export function PremiumTemplate({ invoice, branch }: InvoiceTemplateProps) {
  const subtotal = invoice.price;
  const tax = invoice.tax || 0;
  const discount = invoice.discount || 0;
  const total = subtotal + tax - discount;

  return (
    <div className="bg-white min-h-screen">
      {/* Colored Header */}
      <div className="bg-gradient-to-r from-primary to-secondary/80 text-white p-12">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2">MAN OF CAVE</h1>
            <p className="text-white/90">{branch.name}</p>
          </div>
          <div className="text-right">
            <p className="text-5xl font-bold mb-2">INVOICE</p>
            <p className="text-white/90">#{invoice.invoiceNumber}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-12">
        {/* Details Grid */}
        <div className="grid grid-cols-3 gap-8 mb-12">
          <div>
            <h3 className="font-bold text-primary mb-4 text-sm uppercase tracking-wide">FROM</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p className="font-semibold">{branch.name}</p>
              <p>{branch.address}</p>
              <p>{branch.city}, {branch.postalCode}</p>
              <p className="mt-3">
                <span className="text-gray-500">Ph:</span> {branch.phone}
              </p>
              <p>
                <span className="text-gray-500">Email:</span> {branch.email}
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-primary mb-4 text-sm uppercase tracking-wide">INVOICE DETAILS</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <div>
                <span className="text-gray-500">Date:</span> {format(new Date(invoice.date), 'MMM dd, yyyy')}
              </div>
              <div>
                <span className="text-gray-500">Time:</span> {invoice.time}
              </div>
              <div>
                <span className="text-gray-500">Barber:</span> {invoice.barber}
              </div>
              <div>
                <span className="text-gray-500">Status:</span> <span className="capitalize font-semibold text-secondary">{invoice.status}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-primary mb-4 text-sm uppercase tracking-wide">BILL TO</h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p className="font-semibold">{invoice.customer}</p>
              <p>{invoice.email}</p>
              <p>{invoice.phone}</p>
              <p className="mt-3 pt-3 border-t">
                <span className="text-gray-500">TRN:</span> {branch.trn}
              </p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-12">
          <thead>
            <tr className="bg-primary text-white">
              <th className="text-left py-3 px-4 font-semibold">DESCRIPTION</th>
              <th className="text-center py-3 px-4 font-semibold">DURATION</th>
              <th className="text-right py-3 px-4 font-semibold">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-4 px-4">{invoice.service}</td>
              <td className="text-center py-4 px-4">{invoice.duration}</td>
              <td className="text-right py-4 px-4 font-semibold">AED {subtotal.toFixed(2)}</td>
            </tr>
            {invoice.products && invoice.products.map((product, idx) => (
              <tr key={idx} className="border-b border-gray-200">
                <td className="py-4 px-4">{product.name}</td>
                <td className="text-center py-4 px-4">x{product.quantity}</td>
                <td className="text-right py-4 px-4 font-semibold">AED {(product.price * product.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        <div className="flex justify-end mb-12">
          <div className="w-72">
            <div className="bg-gray-50 p-6 rounded-lg space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">AED {subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount:</span>
                  <span className="font-semibold">-AED {discount.toFixed(2)}</span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (5%):</span>
                  <span className="font-semibold">AED {tax.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-300 pt-3 flex justify-between">
                <span className="font-bold">TOTAL</span>
                <span className="text-xl font-bold text-secondary">AED {total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-primary pt-8 text-center">
          <p className="text-gray-600 text-sm mb-4">Thank you for your business with MAN OF CAVE</p>
          <p className="text-gray-500 text-xs">{branch.website} · {branch.phone} · {branch.email}</p>
        </div>
      </div>
    </div>
  );
}

// Template Selector
export function getTemplate(templateType: 'modern' | 'classic' | 'minimalist' | 'premium') {
  switch (templateType) {
    case 'modern':
      return ModernTemplate;
    case 'classic':
      return ClassicTemplate;
    case 'minimalist':
      return MinimalistTemplate;
    case 'premium':
      return PremiumTemplate;
    default:
      return ModernTemplate;
  }
}
