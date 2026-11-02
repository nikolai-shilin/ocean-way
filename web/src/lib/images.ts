/** Responsive photos: each photo is offered in a few widths (srcset) together with the width it takes on screen
 *  (sizes), so phones and small cards download a smaller file. Unsplash resizes by its `w` parameter; local photos
 *  (/fleet, /people in /public) go through the Next.js image resizer, which also converts them to AVIF/WebP.
 *
 *  On-screen widths were measured on the live pages (phones below 680 px):
 *  cards ≤ 362 px, gallery 560 / 300 px (landscape) and 432 / 232 px (portrait), detail photo 736 px;
 *  cover row (cover.css) up to 754 px / 84vw (landscape) and 464 px / 66vw (portrait). */
export type PhotoKind = 'card' | 'land' | 'port' | 'wide' | 'cvl' | 'cvp';

const SIZES: Record<PhotoKind, string> = {
  card: '(max-width: 680px) calc(100vw - 40px), 362px',
  land: '(max-width: 680px) 300px, 560px',
  port: '(max-width: 680px) 232px, 432px',
  wide: '(max-width: 760px) calc(100vw - 40px), 740px',
  cvl: '(max-width: 680px) 84vw, 760px',
  cvp: '(max-width: 680px) 66vw, 470px',
};
/** Unsplash takes any width. */
const UNSPLASH_W: Record<PhotoKind, number[]> = { card: [400, 600, 800], land: [600, 900, 1200], port: [480, 700, 900], wide: [700, 1100, 1480], cvl: [700, 1100, 1500], cvp: [500, 800, 1000] };
/** The Next.js resizer only takes its configured widths (default imageSizes + deviceSizes). */
const LOCAL_W: Record<PhotoKind, number[]> = { card: [384, 640, 828], land: [640, 828, 1200], port: [384, 640, 828], wide: [640, 1080, 1920], cvl: [828, 1200, 1920], cvp: [640, 828, 1080] };

const LOCAL = /^\/(fleet|people)\/[\w.-]+\.(webp|jpe?g|png|avif)$/;
const unsplashAt = (src: string, w: number) => src.replace(/([?&])w=\d+/, `$1w=${w}`);
const localAt = (src: string, w: number) => `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75`;

/** src, srcset and sizes for one photo, or null when the address can't be resized (face crops, other hosts). */
export function responsive(src: string, kind: PhotoKind, lazy = false) {
  let at: ((w: number) => string) | null = null;
  let widths: number[] = [];
  if (src.startsWith('https://images.unsplash.com/') && /[?&]w=\d+/.test(src) && !src.includes('fit=facearea')) {
    at = (w) => unsplashAt(src, w); widths = UNSPLASH_W[kind];
  } else if (LOCAL.test(src)) {
    at = (w) => localAt(src, w); widths = LOCAL_W[kind];
  }
  if (!at) return null;
  return {
    src: at(widths[1]),
    srcSet: widths.map((w) => `${at(w)} ${w}w`).join(', '),
    // "auto" lets the browser use the laid-out width for lazy photos; older browsers skip it and use the list.
    sizes: (lazy ? 'auto, ' : '') + SIZES[kind],
  };
}

/** React props for a photo (cards, detail photos). */
export function photoProps(src: string, kind: PhotoKind, opts: { lazy?: boolean; priority?: boolean } = {}) {
  const r = responsive(src, kind, opts.lazy);
  return {
    src: r?.src ?? src,
    srcSet: r?.srcSet,
    sizes: r?.sizes,
    decoding: 'async' as const,
    loading: opts.lazy ? ('lazy' as const) : undefined,
    fetchPriority: opts.priority ? ('high' as const) : undefined,
  };
}

/** The photo frame an <img> sits in, from the markup just before it (the prototype and render.ts markup). */
const FRAMES: [string, PhotoKind][] = [['class="g-l"', 'land'], ['class="g-p"', 'port'], ['class="clip"', 'card'], ['class="ow-photo"', 'wide'], ['class="cv-ph l"', 'cvl'], ['class="cv-ph p"', 'cvp']];
function frameOf(before: string): PhotoKind | null {
  let best: PhotoKind | null = null, at = -1;
  for (const [mark, kind] of FRAMES) {
    const i = before.lastIndexOf(mark);
    if (i > at) { at = i; best = kind; }
  }
  // The frame must belong to this image, not to an earlier one.
  return at >= 0 && !before.slice(at).includes('<img') ? best : null;
}

/** Adds srcset/sizes, async decoding and (optionally) high fetch priority for the first eager photo
 *  to every <img> in an HTML string. */
export function responsiveImages(html: string, opts: { priorityFirst?: boolean } = {}) {
  let first = true;
  return html.replace(/<img\b([^>]*?)\s*(\/?)>/g, (tag: string, attrs: string, slash: string, offset: number) => {
    let a = attrs;
    const lazy = /\sloading="lazy"/.test(a);
    if (!/\sdecoding=/.test(a)) a += ' decoding="async"';
    const src = /\ssrc="([^"]+)"/.exec(a)?.[1];
    const kind = frameOf(html.slice(Math.max(0, offset - 240), offset));
    // Only the first photo in a frame (not an avatar or icon) is likely the largest thing on screen.
    if (kind && first) {
      first = false;
      if (opts.priorityFirst && !lazy && !/\sfetchpriority=/.test(a)) a += ' fetchpriority="high"';
    }
    if (src && kind && !/\ssrcset=/.test(a)) {
      const r = responsive(src.replace(/&amp;/g, '&'), kind, lazy);
      if (r) {
        const enc = (s: string) => s.replace(/&/g, '&amp;');
        a = a.replace(/\ssrc="[^"]+"/, ` src="${enc(r.src)}"`) + ` srcset="${enc(r.srcSet)}" sizes="${r.sizes}"`;
      }
    }
    return `<img${a}${slash ? ' /' : ''}>`;
  });
}
