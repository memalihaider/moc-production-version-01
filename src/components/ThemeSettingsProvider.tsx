'use client';

import { useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const DEFAULT_COLORS = {
  primary: '#111111',
  secondary: '#c5a059',
  accent: '#5c4033',
};

export function ThemeSettingsProvider() {
  useEffect(() => {
    const settingsRef = doc(db, 'general', 'settings');

    const applyColors = (colors: typeof DEFAULT_COLORS) => {
      const root = document.documentElement;
      root.style.setProperty('--primary', colors.primary);
      root.style.setProperty('--secondary', colors.secondary);
      root.style.setProperty('--accent', colors.accent);
      root.style.setProperty('--chart-1', colors.secondary);
      root.style.setProperty('--chart-2', colors.accent);
      root.style.setProperty('--ring', colors.primary);
    };

    applyColors(DEFAULT_COLORS);

    const unsubscribe = onSnapshot(settingsRef, (snap) => {
      if (!snap.exists()) {
        applyColors(DEFAULT_COLORS);
        return;
      }

      const data = snap.data() as {
        primaryColor?: string;
        secondaryColor?: string;
        accentColor?: string;
      };

      applyColors({
        primary: data.primaryColor || DEFAULT_COLORS.primary,
        secondary: data.secondaryColor || DEFAULT_COLORS.secondary,
        accent: data.accentColor || DEFAULT_COLORS.accent,
      });
    });

    return () => unsubscribe();
  }, []);

  return null;
}
