export interface NavItem {
  key: string;
  href: string;
}

export const navLinks: Record<'en' | 'es', NavItem[]> = {
  en: [
    { key: 'nav.ourStory', href: '/en/our-story/' },
    { key: 'nav.howWeHelp', href: '/en/how-we-help/' },
    { key: 'nav.scholars', href: '/en/scholars/' },
    { key: 'nav.yourImpact', href: '/en/your-impact/' },
  ],
  es: [
    { key: 'nav.ourStory', href: '/es/our-story/' },
    { key: 'nav.howWeHelp', href: '/es/how-we-help/' },
    { key: 'nav.scholars', href: '/es/scholars/' },
    { key: 'nav.howToApply', href: '/es/how-to-apply/' },
  ],
};

/** All pages across both languages, for the footer sitemap */
export const allPages: Record<'en' | 'es', NavItem[]> = {
  en: [
    { key: 'nav.home', href: '/en/' },
    { key: 'nav.ourStory', href: '/en/our-story/' },
    { key: 'nav.howWeHelp', href: '/en/how-we-help/' },
    { key: 'nav.scholars', href: '/en/scholars/' },
    { key: 'nav.yourImpact', href: '/en/your-impact/' },
    { key: 'nav.howToDonate', href: '/en/how-to-donate/' },
    { key: 'nav.friendsOfBbf', href: '/en/friends-of-bbf/' },
    { key: 'nav.newsletter', href: '/en/newsletter/' },
    { key: 'nav.howToApply', href: '/en/how-to-apply/' },
    { key: 'nav.studentResources', href: '/en/student-resources/' },
  ],
  es: [
    { key: 'nav.home', href: '/es/' },
    { key: 'nav.ourStory', href: '/es/our-story/' },
    { key: 'nav.howWeHelp', href: '/es/how-we-help/' },
    { key: 'nav.scholars', href: '/es/scholars/' },
    { key: 'nav.howToApply', href: '/es/how-to-apply/' },
    { key: 'nav.studentResources', href: '/es/student-resources/' },
    { key: 'nav.newsletter', href: '/es/newsletter/' },
    { key: 'nav.howToDonate', href: '/es/how-to-donate/' },
    { key: 'nav.friendsOfBbf', href: '/es/friends-of-bbf/' },
    { key: 'nav.yourImpact', href: '/es/your-impact/' },
  ],
};

/**
 * Maps each page path to its counterpart in the other language.
 * Used by the language toggle. Pages without a counterpart map to
 * the other language's homepage.
 */
export const langCounterparts: Record<string, string> = {
  // Shared pages — direct counterpart
  '/en/': '/es/',
  '/es/': '/en/',
  '/en/our-story/': '/es/our-story/',
  '/es/our-story/': '/en/our-story/',
  '/en/how-we-help/': '/es/how-we-help/',
  '/es/how-we-help/': '/en/how-we-help/',
  '/en/scholars/': '/es/scholars/',
  '/es/scholars/': '/en/scholars/',
  '/en/newsletter/': '/es/newsletter/',
  '/es/newsletter/': '/en/newsletter/',
  // EN-exclusive → ES homepage
  '/en/how-to-donate/': '/es/',
  '/en/friends-of-bbf/': '/es/',
  '/en/your-impact/': '/es/',
  // ES-exclusive → EN homepage
  '/es/how-to-apply/': '/en/',
  '/es/student-resources/': '/en/',
  // Footer sitemap cross-links (exclusive pages in "wrong" language)
  '/es/how-to-donate/': '/en/how-to-donate/',
  '/es/friends-of-bbf/': '/en/friends-of-bbf/',
  '/es/your-impact/': '/en/your-impact/',
  '/en/how-to-apply/': '/es/how-to-apply/',
  '/en/student-resources/': '/es/student-resources/',
};

export function getCounterpart(pathname: string): string {
  const normalized = pathname.endsWith('/') ? pathname : pathname + '/';
  return langCounterparts[normalized] ?? (normalized.startsWith('/es/') ? '/en/' : '/es/');
}
