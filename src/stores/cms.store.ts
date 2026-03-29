'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ==================== TYPES ====================

export interface HeroSlide {
  id: string;
  type: 'image' | 'video';
  url: string;
  heading: string;
  subHeading: string;
  ctaText: string;
  ctaLink: string;
  ctaSecondaryText: string;
  ctaSecondaryLink: string;
  order: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CMSSection {
  id: string;
  sectionKey: string; // e.g., 'stats', 'featured_in', 'services', 'products', 'offers', 'memberships', 'staff', 'branches', 'cta', 'footer'
  heading: string;
  subHeading: string;
  description: string;
  badgeText: string;
  ctaText: string;
  ctaLink: string;
  ctaSecondaryText: string;
  ctaSecondaryLink: string;
  isVisible: boolean;
  order: number;
  extraData: Record<string, string>;
  updatedAt: number;
}

export interface PageHero {
  id: string;
  pageKey: string;
  pageName: string;
  backgroundType: 'image' | 'video';
  backgroundUrl: string;
  badgeText: string;
  heading: string;
  headingHighlight: string;
  subHeading: string;
  updatedAt: number;
}

export interface CMSSettings {
  siteName: string;
  siteDescription: string;
  heroTagline: string;
  footerDescription: string;
  copyrightText: string;
  whatsappNumber: string;
  phoneNumber: string;
  email: string;
  instagramUrl: string;
  facebookUrl: string;
  updatedAt: number;
}

interface CMSStore {
  heroSlides: HeroSlide[];
  sections: CMSSection[];
  settings: CMSSettings;
  pageHeroes: PageHero[];
  lastFetched: number | null;
  isLoading: boolean;

  // Actions
  fetchCMSData: () => Promise<void>;
  subscribeToHeroSlides: () => Unsubscribe;
  subscribeToSections: () => Unsubscribe;
  subscribeToSettings: () => Unsubscribe;
  subscribeToPageHeroes: () => Unsubscribe;

  // Hero slides
  saveHeroSlide: (slide: Partial<HeroSlide> & { id?: string }) => Promise<void>;
  deleteHeroSlide: (id: string) => Promise<void>;

  // Sections
  saveSection: (section: Partial<CMSSection> & { sectionKey: string }) => Promise<void>;

  // Settings
  saveSettings: (settings: Partial<CMSSettings>) => Promise<void>;

  // Page heroes
  savePageHero: (hero: Partial<PageHero> & { pageKey: string }) => Promise<void>;
  getPageHero: (pageKey: string) => PageHero | undefined;

  // Helpers
  getSectionByKey: (key: string) => CMSSection | undefined;
  getActiveHeroSlides: () => HeroSlide[];
}

const CACHE_DURATION = 2 * 60 * 1000; // 2 min cache

const DEFAULT_PAGE_HEROES: Omit<PageHero, 'id'>[] = [
  {
    pageKey: 'services',
    pageName: 'Services',
    backgroundType: 'video',
    backgroundUrl: 'https://www.pexels.com/download/video/7291771/',
    badgeText: 'The Service Menu',
    heading: 'Signature',
    headingHighlight: 'Rituals',
    subHeading: 'Artistry is not just a service, it\'s a transformation.',
    updatedAt: Date.now(),
  },
  {
    pageKey: 'products',
    pageName: 'Products',
    backgroundType: 'video',
    backgroundUrl: 'https://www.pexels.com/download/video/7291771/',
    badgeText: 'The Apothecary',
    heading: 'Grooming',
    headingHighlight: 'Collection',
    subHeading: 'Professional-grade essentials for the modern gentleman.',
    updatedAt: Date.now(),
  },
  {
    pageKey: 'branches',
    pageName: 'Branches',
    backgroundType: 'video',
    backgroundUrl: 'https://www.pexels.com/download/video/3997168/',
    badgeText: 'Our Presence',
    heading: 'Premium',
    headingHighlight: 'Locations',
    subHeading: 'Experience luxury grooming at any of our strategically located branches.',
    updatedAt: Date.now(),
  },
  {
    pageKey: 'blog',
    pageName: 'Blog',
    backgroundType: 'video',
    backgroundUrl: 'https://www.pexels.com/download/video/854416/',
    badgeText: 'The ManofCave Journal',
    heading: 'The Grooming',
    headingHighlight: 'Chronicles',
    subHeading: 'Expert insights, style guides, and timeless wisdom for the modern gentleman\'s journey to excellence.',
    updatedAt: Date.now(),
  },
  {
    pageKey: 'menu',
    pageName: 'Menu',
    backgroundType: 'video',
    backgroundUrl: 'https://www.pexels.com/download/video/7291771/',
    badgeText: 'Premium Grooming',
    heading: 'Our Service',
    headingHighlight: 'Menu',
    subHeading: 'Explore our curated list of premium grooming services, tailored for the modern gentleman.',
    updatedAt: Date.now(),
  },
];

const DEFAULT_SETTINGS: CMSSettings = {
  siteName: 'MAN OF CAVE',
  siteDescription: 'The city\'s premier destination for luxury grooming and traditional barbering since 2020.',
  heroTagline: 'For The Modern Caveman',
  footerDescription: 'The city\'s premier destination for luxury grooming and traditional barbering since 2020.',
  copyrightText: '© 2026 MAN OF CAVE. ALL RIGHTS RESERVED.',
  whatsappNumber: '+9660545354361',
  phoneNumber: '+9660545354361',
  email: 'manofcave2024@gmail.com',
  instagramUrl: '',
  facebookUrl: '',
  updatedAt: Date.now(),
};

const DEFAULT_SECTIONS: Omit<CMSSection, 'id'>[] = [
  {
    sectionKey: 'services',
    heading: 'Bespoke Services',
    subHeading: 'Signature Collection',
    description: 'Indulge in meticulously crafted grooming experiences designed for the modern gentleman.',
    badgeText: 'Signature Collection',
    ctaText: 'VIEW ALL SERVICES',
    ctaLink: '/services',
    ctaSecondaryText: '',
    ctaSecondaryLink: '',
    isVisible: true,
    order: 1,
    extraData: {},
    updatedAt: Date.now(),
  },
  {
    sectionKey: 'products',
    heading: 'Grooming Essentials',
    subHeading: 'Premium Apothecary',
    description: 'Premium grooming products curated for the distinguished gentleman.',
    badgeText: 'Premium Apothecary',
    ctaText: 'EXPLORE COLLECTION',
    ctaLink: '/products',
    ctaSecondaryText: '',
    ctaSecondaryLink: '',
    isVisible: true,
    order: 2,
    extraData: {},
    updatedAt: Date.now(),
  },
  {
    sectionKey: 'offers',
    heading: 'Member Rewards',
    subHeading: 'Active Promotions',
    description: 'Exclusive offers and rewards for our valued members.',
    badgeText: 'Active Promotions',
    ctaText: '',
    ctaLink: '',
    ctaSecondaryText: '',
    ctaSecondaryLink: '',
    isVisible: true,
    order: 3,
    extraData: {},
    updatedAt: Date.now(),
  },
  {
    sectionKey: 'memberships',
    heading: 'Exclusive Memberships',
    subHeading: 'Elite Access',
    description: 'Join our elite community and unlock unprecedented benefits, priority access, and exclusive privileges.',
    badgeText: 'Elite Access',
    ctaText: '',
    ctaLink: '',
    ctaSecondaryText: '',
    ctaSecondaryLink: '',
    isVisible: true,
    order: 4,
    extraData: {},
    updatedAt: Date.now(),
  },
  {
    sectionKey: 'staff',
    heading: 'Meet The Masters',
    subHeading: 'Expert Artisans',
    description: 'Our team of skilled professionals dedicated to perfecting your look.',
    badgeText: 'Expert Artisans',
    ctaText: '',
    ctaLink: '',
    ctaSecondaryText: '',
    ctaSecondaryLink: '',
    isVisible: true,
    order: 5,
    extraData: {},
    updatedAt: Date.now(),
  },
  {
    sectionKey: 'branches',
    heading: 'Global Presence',
    subHeading: 'Our Locations',
    description: 'Visit any of our premium locations for an unparalleled grooming experience.',
    badgeText: 'Our Locations',
    ctaText: 'EXPLORE ALL BRANCHES',
    ctaLink: '/branches',
    ctaSecondaryText: '',
    ctaSecondaryLink: '',
    isVisible: true,
    order: 6,
    extraData: {},
    updatedAt: Date.now(),
  },
  {
    sectionKey: 'cta',
    heading: 'Your Chair',
    subHeading: 'Awaits',
    description: 'Experience premium grooming at its finest. Book your appointment today and discover why discerning gentlemen choose MAN OF CAVE.',
    badgeText: '',
    ctaText: 'BOOK APPOINTMENT',
    ctaLink: '/booking',
    ctaSecondaryText: 'JOIN THE CLUB',
    ctaSecondaryLink: '/login',
    isVisible: true,
    order: 7,
    extraData: {},
    updatedAt: Date.now(),
  },
  {
    sectionKey: 'featured_in',
    heading: '',
    subHeading: 'As Seen In',
    description: '',
    badgeText: '',
    ctaText: '',
    ctaLink: '',
    ctaSecondaryText: '',
    ctaSecondaryLink: '',
    isVisible: true,
    order: 0,
    extraData: { brands: 'GQ,VOGUE,ESQUIRE,FORBES,MEN\'S HEALTH' },
    updatedAt: Date.now(),
  },
];

export const useCMSStore = create<CMSStore>()(
  persist(
    (set, get) => ({
      heroSlides: [],
      sections: [],
      settings: DEFAULT_SETTINGS,
      pageHeroes: [],
      lastFetched: null,
      isLoading: false,

      fetchCMSData: async () => {
        const now = Date.now();
        const lastFetched = get().lastFetched;
        if (lastFetched && (now - lastFetched) < CACHE_DURATION && get().heroSlides.length > 0) {
          return;
        }

        set({ isLoading: true });
        try {
          const [slidesSnap, sectionsSnap, settingsSnap, pageHeroesSnap] = await Promise.all([
            getDocs(query(collection(db, 'cms_hero_slides'), orderBy('order', 'asc'))),
            getDocs(collection(db, 'cms_sections')),
            getDocs(collection(db, 'cms_settings')),
            getDocs(collection(db, 'cms_page_heroes')),
          ]);

          const heroSlides = slidesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as HeroSlide[];
          const sections = sectionsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as CMSSection[];
          const settingsDoc = settingsSnap.docs[0];
          const settings = settingsDoc ? { ...DEFAULT_SETTINGS, ...settingsDoc.data() } as CMSSettings : DEFAULT_SETTINGS;
          const pageHeroes = pageHeroesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as PageHero[];

          set({ heroSlides, sections, settings, pageHeroes, lastFetched: Date.now(), isLoading: false });
        } catch (error) {
          console.error('Error fetching CMS data:', error);
          set({ isLoading: false });
        }
      },

      subscribeToHeroSlides: () => {
        const q = query(collection(db, 'cms_hero_slides'), orderBy('order', 'asc'));
        return onSnapshot(q, (snap) => {
          const heroSlides = snap.docs.map(d => ({ id: d.id, ...d.data() })) as HeroSlide[];
          set({ heroSlides });
        });
      },

      subscribeToSections: () => {
        return onSnapshot(collection(db, 'cms_sections'), (snap) => {
          const sections = snap.docs.map(d => ({ id: d.id, ...d.data() })) as CMSSection[];
          set({ sections });
        });
      },

      subscribeToSettings: () => {
        return onSnapshot(collection(db, 'cms_settings'), (snap) => {
          if (snap.docs.length > 0) {
            const settings = { ...DEFAULT_SETTINGS, ...snap.docs[0].data() } as CMSSettings;
            set({ settings });
          }
        });
      },

      subscribeToPageHeroes: () => {
        return onSnapshot(collection(db, 'cms_page_heroes'), (snap) => {
          const pageHeroes = snap.docs.map(d => ({ id: d.id, ...d.data() })) as PageHero[];
          set({ pageHeroes });
        });
      },

      saveHeroSlide: async (slide) => {
        const id = slide.id || doc(collection(db, 'cms_hero_slides')).id;
        const now = Date.now();
        const data: HeroSlide = {
          id,
          type: slide.type || 'image',
          url: slide.url || '',
          heading: slide.heading || '',
          subHeading: slide.subHeading || '',
          ctaText: slide.ctaText || '',
          ctaLink: slide.ctaLink || '',
          ctaSecondaryText: slide.ctaSecondaryText || '',
          ctaSecondaryLink: slide.ctaSecondaryLink || '',
          order: slide.order ?? get().heroSlides.length,
          isActive: slide.isActive ?? true,
          createdAt: slide.createdAt || now,
          updatedAt: now,
        };
        await setDoc(doc(db, 'cms_hero_slides', id), data);
      },

      deleteHeroSlide: async (id) => {
        await deleteDoc(doc(db, 'cms_hero_slides', id));
      },

      saveSection: async (section) => {
        const id = section.sectionKey;
        const existing = get().sections.find(s => s.sectionKey === id);
        const data: CMSSection = {
          id,
          sectionKey: section.sectionKey,
          heading: section.heading ?? existing?.heading ?? '',
          subHeading: section.subHeading ?? existing?.subHeading ?? '',
          description: section.description ?? existing?.description ?? '',
          badgeText: section.badgeText ?? existing?.badgeText ?? '',
          ctaText: section.ctaText ?? existing?.ctaText ?? '',
          ctaLink: section.ctaLink ?? existing?.ctaLink ?? '',
          ctaSecondaryText: section.ctaSecondaryText ?? existing?.ctaSecondaryText ?? '',
          ctaSecondaryLink: section.ctaSecondaryLink ?? existing?.ctaSecondaryLink ?? '',
          isVisible: section.isVisible ?? existing?.isVisible ?? true,
          order: section.order ?? existing?.order ?? 0,
          extraData: section.extraData ?? existing?.extraData ?? {},
          updatedAt: Date.now(),
        };
        await setDoc(doc(db, 'cms_sections', id), data);
      },

      saveSettings: async (settings) => {
        const data = { ...get().settings, ...settings, updatedAt: Date.now() };
        await setDoc(doc(db, 'cms_settings', 'global'), data);
        set({ settings: data });
      },

      savePageHero: async (hero) => {
        const id = hero.pageKey;
        const existing = get().pageHeroes.find(h => h.pageKey === id);
        const data: PageHero = {
          id,
          pageKey: hero.pageKey,
          pageName: hero.pageName ?? existing?.pageName ?? '',
          backgroundType: hero.backgroundType ?? existing?.backgroundType ?? 'video',
          backgroundUrl: hero.backgroundUrl ?? existing?.backgroundUrl ?? '',
          badgeText: hero.badgeText ?? existing?.badgeText ?? '',
          heading: hero.heading ?? existing?.heading ?? '',
          headingHighlight: hero.headingHighlight ?? existing?.headingHighlight ?? '',
          subHeading: hero.subHeading ?? existing?.subHeading ?? '',
          updatedAt: Date.now(),
        };
        await setDoc(doc(db, 'cms_page_heroes', id), data);
      },

      getPageHero: (pageKey) => {
        const fromStore = get().pageHeroes.find(h => h.pageKey === pageKey);
        if (fromStore) return fromStore;
        const def = DEFAULT_PAGE_HEROES.find(h => h.pageKey === pageKey);
        if (def) return { ...def, id: pageKey } as PageHero;
        return undefined;
      },

      getSectionByKey: (key) => {
        const fromStore = get().sections.find(s => s.sectionKey === key);
        if (fromStore) return fromStore;
        const def = DEFAULT_SECTIONS.find(s => s.sectionKey === key);
        if (def) return { ...def, id: key } as CMSSection;
        return undefined;
      },

      getActiveHeroSlides: () => {
        return get().heroSlides.filter(s => s.isActive).sort((a, b) => a.order - b.order);
      },
    }),
    {
      name: 'cms-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        heroSlides: state.heroSlides,
        sections: state.sections,
        settings: state.settings,
        pageHeroes: state.pageHeroes,
        lastFetched: state.lastFetched,
      }),
    }
  )
);
