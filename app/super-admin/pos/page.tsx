'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import POSCheckoutPage from '@/components/pos/POSCheckoutPage';

export default function SuperAdminPOSPage() {
  return (
    <ProtectedRoute requiredRole="super_admin">
      <POSCheckoutPage portalType="super_admin" />
    </ProtectedRoute>
  );
}
