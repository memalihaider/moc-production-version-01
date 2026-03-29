'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { BranchProvider } from '@/contexts/BranchContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ThemeSettingsProvider } from '@/components/ThemeSettingsProvider';


export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <BranchProvider>
        <AuthProvider>
          <ThemeSettingsProvider />
          {children}
        </AuthProvider>
      </BranchProvider>
    </LanguageProvider>
  );
}