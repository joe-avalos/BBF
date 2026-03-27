import { ui, type UIKey } from './ui';

export type Lang = 'en' | 'es';

export function getLang(url: URL): Lang {
  const [, lang] = url.pathname.split('/');
  return lang === 'es' ? 'es' : 'en';
}

export function t(lang: Lang, key: UIKey): string {
  return ui[lang][key] ?? ui['en'][key] ?? key;
}

export function getLocalePath(url: URL, targetLang: Lang): string {
  const currentLang = getLang(url);
  return url.pathname.replace(`/${currentLang}/`, `/${targetLang}/`);
}
