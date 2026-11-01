import { NextResponse, type NextRequest } from 'next/server';

const LANGS = ['en', 'ru', 'de', 'es'];

/** Send visitors without a language prefix to their preferred language (from Accept-Language), English by default. */
function pick(req: NextRequest) {
  const header = req.headers.get('accept-language') || '';
  for (const part of header.split(',')) {
    const code = part.split(';')[0].trim().slice(0, 2).toLowerCase();
    if (LANGS.includes(code)) return code;
  }
  return 'en';
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (LANGS.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) return;
  const url = req.nextUrl.clone();
  url.pathname = `/${pick(req)}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)'],
};
