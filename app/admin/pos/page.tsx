'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import POSCheckoutPage from '@/components/pos/POSCheckoutPage';

export default function AdminPOSPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <POSCheckoutPage portalType="admin" />
    </ProtectedRoute>
  );
}
