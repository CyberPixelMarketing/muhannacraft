#!/usr/bin/env node
/* ============================================================
   MUHANNA CRAFT — STATIC SITE BUILD
   ============================================================
   HOW TO EDIT THIS SITE — دليل تعديل الموقع
   ------------------------------------------------------------
   1. All content lives in products.json. Edit that file only.
      كل المحتوى في ملف products.json — عدّل هذا الملف فقط.
   2. Then run:  node build.js
      ثم شغّل الأمر:  node build.js
   3. Commit and push. Vercel deploys automatically.
      ارفع التغييرات إلى GitHub وسينشر Vercel الموقع تلقائياً.

   WHAT THIS GENERATES — ما الذي يُنشئه هذا الملف
   ------------------------------------------------------------
     /index.html                    Arabic homepage (default)
     /en/index.html                 English homepage
     /p/<slug>/index.html           Arabic product page
     /en/p/<slug>/index.html        English product page
     /sitemap.xml  /robots.txt  /llms.txt

   IMAGES — الصور
   ------------------------------------------------------------
   Put product photos in the site root using the exact filename
   from each product's "img" field in products.json.
   ضع صور المنتجات في المجلد الرئيسي بنفس الاسم الموجود في
   حقل "img" لكل منتج داخل products.json.
   ============================================================ */

const fs = require('fs');
const path = require('path');

const D = JSON.parse(fs.readFileSync(path.join(__dirname, 'products.json'), 'utf8'));
const C = D.config;
const ORIGIN = C.domain.replace(/\/$/, '');

/* ---------- helpers ---------- */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const jsonld = o => JSON.stringify(o).replace(/</g, '\\u003c');
const wa = (txt) => `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(txt)}`;
const out = (rel, html) => {
  const f = path.join(__dirname, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, html, 'utf8');
};

// Each product's URL in a given language
const purl = (p, lang) => lang === 'ar' ? `/p/${p.slug}/` : `/en/p/${p.slug}/`;
const home = lang => lang === 'ar' ? '/' : '/en/';

// Short plain-text description for meta tags (no markup, <=160 chars)
const metaDesc = (p, lang) => {
  const feats = (lang === 'ar' ? p.featAr : p.featEn).slice(0, 3).join('، ');
  const d = (lang === 'ar' ? p.dimsAr : p.dims);
  return (feats + ' · ' + d).replace(/\s+/g, ' ').slice(0, 158);
};

/* ---------- shared CSS (brand palette taken from the live site) ---------- */
const CSS = `
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
:root{
  --deep:#0a0a0a; --deep-soft:#141414; --card:#171717;
  --sand:#f5f0e8; --sand-soft:#ece5d9;
  --accent:#c9a962; --accent-light:#e4d4a5;
  --ink:#1d1d1d; --border:#2a2a2a;
  --r-lg:48px; --r-sm:8px;
}
@media(max-width:768px){:root{--r-lg:28px}}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
body{background:var(--deep);color:var(--sand);overflow-x:hidden;line-height:1.7;
  font-family:'Cormorant Garamond',Georgia,serif;font-size:1.0625rem}
body[dir=rtl]{font-family:'Tajawal','Cairo',system-ui,sans-serif;font-size:1rem}
img,video{max-width:100%;height:auto;display:block}
a{color:inherit;text-decoration:none}
.wrap{max-width:1280px;margin:0 auto;padding:0 24px}
@media(min-width:768px){.wrap{padding:0 48px}}
@media(min-width:1024px){.wrap{padding:0 80px}}
section{padding:80px 0}
@media(min-width:768px){section{padding:120px 0}}
@media(min-width:1024px){section{padding:160px 0}}
.light{background:var(--sand);color:var(--ink)}
h1,h2,h3{font-family:'Cormorant Garamond',Georgia,serif;font-weight:500;line-height:1.05;letter-spacing:.015em}
body[dir=rtl] h1,body[dir=rtl] h2,body[dir=rtl] h3{font-family:'Tajawal','Cairo',sans-serif;font-weight:700;line-height:1.3}
h1{font-size:clamp(2.6rem,7vw,5.5rem);text-transform:uppercase}
h2{font-size:clamp(2rem,4.5vw,3.5rem);text-transform:uppercase}
body[dir=rtl] h1,body[dir=rtl] h2{text-transform:none}
h3{font-size:1.25rem;font-weight:600;text-transform:none}
.eyebrow{font-family:'Jost',system-ui,sans-serif;text-transform:uppercase;
  font-size:.75rem;letter-spacing:.2em;color:var(--accent);font-weight:500;margin-bottom:18px}
body[dir=rtl] .eyebrow{font-family:'Tajawal',sans-serif;letter-spacing:0}
.lede{max-width:60ch;opacity:.82;margin:20px auto 0}
.center{text-align:center}
.rule{width:160px;height:1px;background:var(--accent);opacity:.4;margin:32px auto}
/* header */
header{position:fixed;inset:0 0 auto 0;z-index:100;transition:background .3s,border-color .3s;
  border-bottom:1px solid transparent}
header.on{background:rgba(10,10,10,.95);backdrop-filter:blur(10px);border-bottom-color:rgba(201,169,98,.15)}
.bar{display:flex;align-items:center;justify-content:space-between;height:74px}
.logo img{height:26px;width:auto}
.tools{display:flex;align-items:center;gap:22px}
.lang{font-family:'Jost',system-ui,sans-serif;font-size:.75rem;letter-spacing:.16em;
  text-transform:uppercase;color:var(--sand);opacity:.85;border:1px solid rgba(245,240,232,.3);
  padding:7px 14px;border-radius:999px 999px 12px 999px;transition:.25s}
.lang:hover{background:var(--sand);color:var(--deep)}
.burger{width:30px;height:20px;position:relative;background:none;border:0;cursor:pointer;padding:0}
.burger span{position:absolute;left:0;width:100%;height:1.5px;background:var(--sand);transition:.3s}
.burger span:nth-child(1){top:0}.burger span:nth-child(2){top:9px}.burger span:nth-child(3){top:18px}
nav.overlay{position:fixed;inset:0;background:var(--deep);z-index:99;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:26px;opacity:0;pointer-events:none;transition:opacity .35s}
nav.overlay.open{opacity:1;pointer-events:auto}
nav.overlay a{font-size:clamp(1.6rem,5vw,2.4rem);text-transform:uppercase;
  font-family:'Cormorant Garamond',serif;color:var(--sand);transition:color .25s}
body[dir=rtl] nav.overlay a{font-family:'Tajawal',sans-serif;text-transform:none}
nav.overlay a:hover{color:var(--accent)}
/* hero */
.hero{position:relative;height:100svh;min-height:560px;display:grid;place-items:center;text-align:center;overflow:hidden}
.hero video,.hero .fallback{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0}
.hero::after{content:'';position:absolute;inset:0;z-index:1;
  background:linear-gradient(to bottom,rgba(10,10,10,.6),rgba(10,10,10,.3) 45%,rgba(10,10,10,.85))}
.hero .inner{position:relative;z-index:2;padding:0 24px}
.hero h1{margin-bottom:22px}
.hero p{max-width:34rem;margin:0 auto 34px;opacity:.9}
.btns{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
.btn{font-family:'Jost',system-ui,sans-serif;text-transform:uppercase;font-size:.75rem;
  letter-spacing:.16em;font-weight:500;padding:15px 30px;border-radius:999px 999px 12px 999px;
  border:1px solid var(--sand);transition:.28s;display:inline-block;min-height:44px}
body[dir=rtl] .btn{font-family:'Tajawal',sans-serif;letter-spacing:0;font-size:.875rem}
.btn.solid{background:var(--sand);color:var(--deep)}
.btn.solid:hover{background:var(--accent);border-color:var(--accent)}
.btn.ghost{color:var(--sand)}
.btn.ghost:hover{background:var(--sand);color:var(--deep)}
.light .btn.solid{background:var(--deep);color:var(--sand);border-color:var(--deep)}
.light .btn.ghost{color:var(--ink);border-color:var(--ink)}
.light .btn.ghost:hover{background:var(--deep);color:var(--sand)}
/* grid */
.grid{display:grid;grid-template-columns:1fr;gap:26px;margin-top:56px}
@media(min-width:600px){.grid{grid-template-columns:repeat(2,1fr)}}
@media(min-width:1024px){.grid{grid-template-columns:repeat(3,1fr)}}
.card{display:block;border-radius:24px 24px 24px 4px;overflow:hidden;background:var(--card);transition:transform .3s}
.card:nth-child(even){border-radius:24px 24px 4px 24px}
.light .card{background:var(--sand-soft)}
.card:hover{transform:translateY(-4px)}
.card .ph{aspect-ratio:4/5;overflow:hidden;background:var(--deep-soft)}
.light .card .ph{background:#ded5c6}
/* graceful placeholder when a product photo has not been uploaded yet */
.ph.noimg,.pimg.noimg{display:grid;place-items:center;position:relative;
  background:linear-gradient(145deg,var(--deep-soft),var(--card))}
.light .ph.noimg{background:linear-gradient(145deg,#e4dbcc,#d8cebc)}
.ph.noimg::after,.pimg.noimg::after{content:'M';font-family:'Cormorant Garamond',serif;
  font-size:3.4rem;color:var(--accent);opacity:.32;letter-spacing:.1em}
.card img{width:100%;height:100%;object-fit:cover;transition:transform .6s ease-out}
.card:hover img{transform:scale(1.05)}
.card .meta{padding:22px}
.card .idx{font-family:'Jost',sans-serif;font-size:.6875rem;letter-spacing:.2em;color:var(--accent);margin-bottom:8px}
.card h3{margin-bottom:6px}
.card .sub{font-size:.875rem;opacity:.65}
/* chips */
.chips{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:34px}
.chip{font-family:'Jost',sans-serif;text-transform:uppercase;font-size:.6875rem;letter-spacing:.16em;
  padding:9px 18px;border:1px solid rgba(29,29,29,.25);border-radius:999px 999px 12px 999px;
  cursor:pointer;background:none;color:inherit;transition:.25s;min-height:40px}
body[dir=rtl] .chip{font-family:'Tajawal',sans-serif;letter-spacing:0;font-size:.8125rem}
.chip:hover,.chip[aria-pressed=true]{background:var(--deep);color:var(--sand);border-color:var(--deep)}
/* materials */
.mats{display:grid;grid-template-columns:1fr;gap:30px;margin-top:56px}
@media(min-width:768px){.mats{grid-template-columns:repeat(3,1fr)}}
.mat{border-radius:32px 8px 32px 8px;overflow:hidden;background:var(--card)}
.mat .ph{aspect-ratio:3/2;background:var(--deep-soft)}
.mat img{width:100%;height:100%;object-fit:cover}
.mat .meta{padding:24px}
/* faq */
.faq{max-width:820px;margin:52px auto 0}
.faq details{border-bottom:1px solid rgba(29,29,29,.15);padding:20px 0}
.faq summary{cursor:pointer;font-weight:600;font-size:1.0625rem;list-style:none;
  display:flex;justify-content:space-between;gap:16px;align-items:flex-start;min-height:32px}
.faq summary::-webkit-details-marker{display:none}
.faq summary::after{content:'+';color:var(--accent);font-size:1.5rem;line-height:1;flex-shrink:0}
.faq details[open] summary::after{content:'\\2212'}
.faq p{margin-top:14px;opacity:.8;font-size:.9375rem}
/* contact */
.cts{display:grid;grid-template-columns:1fr;gap:26px;margin-top:48px;text-align:center}
@media(min-width:600px){.cts{grid-template-columns:repeat(2,1fr)}}
@media(min-width:1024px){.cts{grid-template-columns:repeat(4,1fr)}}
.ct .lbl{font-family:'Jost',sans-serif;font-size:.6875rem;letter-spacing:.2em;text-transform:uppercase;
  color:var(--accent);margin-bottom:8px}
body[dir=rtl] .ct .lbl{font-family:'Tajawal',sans-serif;letter-spacing:0;font-size:.8125rem}
/* product page */
.pwrap{padding-top:130px}
.crumb{font-family:'Jost',sans-serif;font-size:.6875rem;letter-spacing:.16em;text-transform:uppercase;opacity:.6;margin-bottom:26px}
body[dir=rtl] .crumb{font-family:'Tajawal',sans-serif;letter-spacing:0;font-size:.8125rem}
.crumb a:hover{color:var(--accent)}
.pgrid{display:grid;grid-template-columns:1fr;gap:44px;align-items:start}
@media(min-width:900px){.pgrid{grid-template-columns:1fr 1fr;gap:64px}}
.pimg{border-radius:24px 24px 24px 4px;overflow:hidden;background:var(--deep-soft);aspect-ratio:4/5}
.pimg img{width:100%;height:100%;object-fit:cover}
.ptitle{font-size:clamp(1.7rem,3.4vw,2.6rem);text-transform:none;margin-bottom:18px;line-height:1.2}
.feats{list-style:none;margin:26px 0}
.feats li{padding:9px 0 9px 24px;position:relative;opacity:.85;font-size:.9375rem;
  border-bottom:1px solid rgba(245,240,232,.08)}
body[dir=rtl] .feats li{padding:9px 24px 9px 0}
.feats li::before{content:'';position:absolute;top:18px;width:5px;height:5px;
  background:var(--accent);transform:rotate(45deg)}
body[dir=ltr] .feats li::before{left:4px}
body[dir=rtl] .feats li::before{right:4px}
.spec{border:1px solid rgba(201,169,98,.25);border-radius:24px 8px 24px 8px;padding:20px 24px;margin:26px 0;font-size:.9375rem}
.spec .k{color:var(--accent);font-size:.75rem;letter-spacing:.16em;text-transform:uppercase;
  font-family:'Jost',sans-serif;margin-bottom:6px}
body[dir=rtl] .spec .k{font-family:'Tajawal',sans-serif;letter-spacing:0;font-size:.8125rem}
.note{font-size:.875rem;opacity:.7;margin-top:18px}
/* footer */
footer{background:var(--sand);color:var(--ink);padding:70px 0 34px}
.flogo img{height:30px;filter:invert(1)}
.fsoc{display:flex;gap:16px;margin:22px 0 30px}
.fsoc a{width:40px;height:40px;border:1px solid rgba(29,29,29,.25);border-radius:50%;
  display:grid;place-items:center;transition:.25s}
.fsoc a:hover{background:var(--deep);color:var(--sand);border-color:var(--deep)}
.frow{display:flex;gap:10px;align-items:center;margin-bottom:10px;font-size:.9375rem}
.fbot{border-top:1px solid rgba(29,29,29,.15);margin-top:34px;padding-top:22px;
  font-family:'Jost',sans-serif;font-size:.75rem;letter-spacing:.12em;text-transform:uppercase;opacity:.6}
body[dir=rtl] .fbot{font-family:'Tajawal',sans-serif;letter-spacing:0}
/* floating whatsapp */
.float{position:fixed;bottom:22px;z-index:90;background:var(--accent);color:var(--deep);
  width:56px;height:56px;border-radius:50%;display:grid;place-items:center;
  box-shadow:0 12px 40px rgba(0,0,0,.35);transition:transform .25s}
body[dir=ltr] .float{right:22px}
body[dir=rtl] .float{left:22px}
.float:hover{transform:scale(1.08)}
/* reveal */
.rv{opacity:0;transform:translateY(24px);transition:opacity .7s cubic-bezier(.22,1,.36,1),transform .7s cubic-bezier(.22,1,.36,1)}
.rv.in{opacity:1;transform:none}
@media(prefers-reduced-motion:reduce){
  *{animation:none!important;transition-duration:.01ms!important}
  .rv{opacity:1;transform:none}
  html{scroll-behavior:auto}
}
`;

/* ---------- shared <head> ---------- */
function head({ lang, title, desc, canonical, altUrl, image, ld }) {
  const isAr = lang === 'ar';
  const fonts = isAr
    ? 'family=Tajawal:wght@300;400;500;700&family=Cormorant+Garamond:wght@400;500;600'
    : 'family=Cormorant+Garamond:wght@300;400;500;600;700&family=Jost:wght@300;400;500';
  return `<!DOCTYPE html>
<html lang="${lang}" dir="${isAr ? 'rtl' : 'ltr'}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${ORIGIN}${canonical}">
<link rel="alternate" hreflang="ar" href="${ORIGIN}${isAr ? canonical : altUrl}">
<link rel="alternate" hreflang="ar-AE" href="${ORIGIN}${isAr ? canonical : altUrl}">
<link rel="alternate" hreflang="en" href="${ORIGIN}${isAr ? altUrl : canonical}">
<link rel="alternate" hreflang="x-default" href="${ORIGIN}${isAr ? canonical : altUrl}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(isAr ? C.brandAr : C.brand)}">
<meta property="og:locale" content="${isAr ? 'ar_AE' : 'en_AE'}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${ORIGIN}${canonical}">
<meta property="og:image" content="${ORIGIN}/${image}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${ORIGIN}/${image}">
<meta name="theme-color" content="#0a0a0a">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?${fonts}&display=swap" rel="stylesheet">
<style>${CSS}</style>
${ld.map(o => `<script type="application/ld+json">${jsonld(o)}</script>`).join('\n')}
</head>`;
}

/* ---------- header + nav + footer ---------- */
const T = {
  ar: {
    nav: ['المجموعة', 'قصتنا', 'الخامات', 'الأسئلة الشائعة', 'تواصل معنا'],
    collection: 'المجموعة', story: 'قصتنا', materials: 'الخامات', faq: 'الأسئلة الشائعة',
    contact: 'تواصل معنا', all: 'الكل', order: 'اطلب عبر واتساب', explore: 'تصفّح المجموعة',
    back: 'العودة إلى المجموعة', home: 'الرئيسية', dims: 'المقاسات', shipping: 'الشحن',
    viewAll: 'عرض كل القطع', phone: 'الهاتف', email: 'البريد الإلكتروني',
    whatsapp: 'واتساب', location: 'الموقع', rights: 'جميع الحقوق محفوظة',
    heroTitle: 'حرفة تُصنع<br>بالصبر واليد',
    heroSub: 'قطع فاخرة مصنوعة يدوياً من خشب الجوز والجلد الطبيعي والصدف اللامع — من دبي إلى الخليج.',
    matsTitle: 'خامات استثنائية',
    matsLede: 'ثلاث خامات فقط، مختارة بعناية، تتكرر في كل قطعة نصنعها.',
    mats: [
      ['خشب الجوز', 'خشب جوز طبيعي، يُنتقى بعناية ويُشكّل يدوياً حتى تبرز عروقه في كل قطعة.'],
      ['الصدف اللامع', 'صدف طبيعي لامع، يُطعّم داخل الخشب بدقة عالية ليعكس الضوء من كل زاوية.'],
      ['الجلد الطبيعي', 'جلد طبيعي بنقشة التمساح، مخيط يدوياً ليمنح القطعة ملمساً وفخامة لا تُضاهى.']
    ],
    storyEyebrow: 'قصتنا', collEyebrow: 'المجموعة', matsEyebrow: 'الخامات',
    faqEyebrow: 'الأسئلة الشائعة', ctEyebrow: 'تواصل معنا',
    collTitle: 'المجموعة',
    collLede: 'كل قطعة تُصنع يدوياً عند الطلب، فلا تتشابه قطعتان تماماً.',
    ctTitle: 'لنصنع شيئاً معاً',
    ctLede: 'للطلبات، هدايا الشركات، أو التخصيص — تواصل معنا مباشرة عبر واتساب.',
    faqTitle: 'أسئلة شائعة'
  },
  en: {
    nav: ['Collection', 'Our Story', 'Materials', 'FAQ', 'Contact'],
    collection: 'Collection', story: 'Our Story', materials: 'Materials', faq: 'FAQ',
    contact: 'Contact', all: 'All', order: 'Order on WhatsApp', explore: 'Explore the collection',
    back: 'Back to the collection', home: 'Home', dims: 'Dimensions', shipping: 'Shipping',
    viewAll: 'View all pieces', phone: 'Phone', email: 'Email',
    whatsapp: 'WhatsApp', location: 'Location', rights: 'All rights reserved',
    heroTitle: 'Craft Made<br>By Patient Hands',
    heroSub: 'Luxury pieces handcrafted from walnut wood, natural leather and lustrous mother-of-pearl — from Dubai to the Gulf.',
    matsTitle: 'Exceptional Materials',
    matsLede: 'Three materials only, carefully chosen, recurring in every piece we make.',
    mats: [
      ['Walnut Wood', 'Natural walnut, carefully selected and shaped by hand so the grain reads in every piece.'],
      ['Mother of Pearl', 'Lustrous natural shell, precisely inlaid within the wood to catch light from every angle.'],
      ['Natural Leather', 'Crocodile-pattern natural leather, hand-stitched for texture and unmatched luxury.']
    ],
    storyEyebrow: 'Our Story', collEyebrow: 'The Collection', matsEyebrow: 'Materials',
    faqEyebrow: 'FAQ', ctEyebrow: 'Contact',
    collTitle: 'The Collection',
    collLede: 'Every piece is handcrafted to order, so no two are exactly alike.',
    ctTitle: "Let's Create Something",
    ctLede: 'For orders, corporate gifting or customisation — reach us directly on WhatsApp.',
    faqTitle: 'Frequently Asked Questions'
  }
};

function header(lang) {
  const t = T[lang], other = lang === 'ar' ? 'en' : 'ar';
  const ids = ['collection', 'story', 'materials', 'faq', 'contact'];
  return `<header id="hd"><div class="wrap bar">
<a class="logo" href="${home(lang)}" aria-label="${esc(lang === 'ar' ? C.brandAr : C.brand)}"><img src="/muhanna-logo.png" alt="${esc(lang === 'ar' ? C.brandAr : C.brand)}" width="120" height="26"></a>
<div class="tools">
<a class="lang" href="${home(other)}" hreflang="${other}" lang="${other}">${other === 'ar' ? 'العربية' : 'EN'}</a>
<button class="burger" id="bg" aria-label="${lang === 'ar' ? 'القائمة' : 'Menu'}" aria-expanded="false" aria-controls="nv"><span></span><span></span><span></span></button>
</div></div></header>
<nav class="overlay" id="nv" aria-label="${lang === 'ar' ? 'القائمة الرئيسية' : 'Main menu'}">
${ids.map((id, i) => `<a href="${home(lang)}#${id}">${esc(t.nav[i])}</a>`).join('\n')}
</nav>`;
}

function footer(lang) {
  const t = T[lang];
  return `<footer><div class="wrap">
<a class="flogo" href="${home(lang)}"><img src="/muhanna-logo.png" alt="${esc(lang === 'ar' ? C.brandAr : C.brand)}" width="140" height="30"></a>
<div class="fsoc">
<a href="${C.instagram}" target="_blank" rel="noopener" aria-label="Instagram"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg></a>
<a href="${wa(lang === 'ar' ? 'مرحباً، أود الاستفسار عن منتجاتكم' : 'Hello, I would like to ask about your pieces')}" target="_blank" rel="noopener" aria-label="WhatsApp"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 20.5l1.8-5.2A8.5 8.5 0 1 1 21 11.5z"/></svg></a>
<a href="mailto:${C.email}" aria-label="${esc(t.email)}"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg></a>
</div>
<div class="frow">${esc(t.phone)}: <a href="tel:${C.phone.replace(/\s/g, '')}">${esc(C.phone)}</a></div>
<div class="frow">${esc(t.email)}: <a href="mailto:${C.email}">${esc(C.email)}</a></div>
<div class="frow">${esc(t.location)}: ${esc(lang === 'ar' ? C.cityAr + '، الإمارات العربية المتحدة' : C.city + ', United Arab Emirates')}</div>
<div class="fbot">&copy; ${new Date().getFullYear()} ${esc(lang === 'ar' ? C.brandAr : C.brand)}. ${esc(t.rights)}.</div>
</div></footer>
<a class="float" href="${wa(lang === 'ar' ? 'مرحباً، أود الاستفسار عن منتجاتكم' : 'Hello, I would like to ask about your pieces')}" target="_blank" rel="noopener" aria-label="WhatsApp">
<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 20.5l1.8-5.2A8.5 8.5 0 1 1 21 11.5z"/></svg></a>
<script>
(function(){
 var hd=document.getElementById('hd');
 addEventListener('scroll',function(){hd.classList.toggle('on',scrollY>80)},{passive:true});
 var bg=document.getElementById('bg'),nv=document.getElementById('nv');
 function close(){nv.classList.remove('open');bg.setAttribute('aria-expanded','false')}
 bg.onclick=function(){var o=nv.classList.toggle('open');bg.setAttribute('aria-expanded',o)};
 nv.addEventListener('click',function(e){if(e.target.tagName==='A')close()});
 addEventListener('keydown',function(e){if(e.key==='Escape')close()});
 var io=new IntersectionObserver(function(es){es.forEach(function(e){
   if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.15});
 document.querySelectorAll('.rv').forEach(function(el){io.observe(el)});
 var ch=document.querySelectorAll('.chip'),cd=document.querySelectorAll('[data-cat]');
 ch.forEach(function(b){b.onclick=function(){
   ch.forEach(function(x){x.setAttribute('aria-pressed','false')});
   b.setAttribute('aria-pressed','true');
   var f=b.dataset.filter;
   cd.forEach(function(c){c.style.display=(f==='all'||c.dataset.cat===f)?'':'none'})}});
})();
</script>
</body></html>`;
}

/* ---------- structured data ---------- */
const orgLD = lang => ({
  '@context': 'https://schema.org', '@type': 'Organization',
  '@id': ORIGIN + '/#org',
  name: lang === 'ar' ? C.brandAr : C.brand,
  alternateName: lang === 'ar' ? C.brand : C.brandAr,
  url: ORIGIN, logo: ORIGIN + '/muhanna-logo.png',
  description: lang === 'ar' ? C.taglineAr : C.tagline,
  founder: { '@type': 'Person', name: lang === 'ar' ? C.founderAr : C.founder },
  address: { '@type': 'PostalAddress', addressLocality: C.city, addressCountry: C.country },
  contactPoint: {
    '@type': 'ContactPoint', telephone: C.phone.replace(/\s/g, ''),
    contactType: 'sales', email: C.email, availableLanguage: ['ar', 'en']
  },
  sameAs: [C.instagram, 'https://wa.me/' + C.whatsapp]
});

const bizLD = lang => ({
  '@context': 'https://schema.org', '@type': 'LocalBusiness',
  '@id': ORIGIN + '/#biz', name: lang === 'ar' ? C.brandAr : C.brand,
  image: ORIGIN + '/muhanna-logo.png', url: ORIGIN,
  telephone: C.phone.replace(/\s/g, ''), email: C.email,
  priceRange: '$$$',
  address: { '@type': 'PostalAddress', addressLocality: C.city, addressRegion: C.city, addressCountry: C.country },
  areaServed: ['AE', 'SA', 'QA', 'KW', 'BH', 'OM'],
  sameAs: [C.instagram]
});

const siteLD = lang => ({
  '@context': 'https://schema.org', '@type': 'WebSite',
  '@id': ORIGIN + '/#site', url: ORIGIN,
  name: lang === 'ar' ? C.brandAr : C.brand,
  inLanguage: lang, publisher: { '@id': ORIGIN + '/#org' }
});

const faqLD = lang => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: D.faq.map(f => ({
    '@type': 'Question', name: lang === 'ar' ? f.qAr : f.qEn,
    acceptedAnswer: { '@type': 'Answer', text: lang === 'ar' ? f.aAr : f.aEn }
  }))
});

const productLD = (p, lang) => ({
  '@context': 'https://schema.org', '@type': 'Product',
  name: lang === 'ar' ? p.ar : p.en,
  description: (lang === 'ar' ? p.featAr : p.featEn).join(' · '),
  image: ORIGIN + '/' + p.img,
  sku: p.slug, url: ORIGIN + purl(p, lang),
  brand: { '@type': 'Brand', name: lang === 'ar' ? C.brandAr : C.brand },
  material: lang === 'ar' ? 'خشب الجوز، الجلد الطبيعي، الصدف' : 'Walnut wood, natural leather, mother-of-pearl',
  offers: {
    '@type': 'Offer', url: ORIGIN + purl(p, lang),
    availability: 'https://schema.org/MadeToOrder',
    priceCurrency: 'AED', seller: { '@id': ORIGIN + '/#org' },
    areaServed: 'AE'
  }
});

const crumbLD = (p, lang) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: T[lang].home, item: ORIGIN + home(lang) },
    { '@type': 'ListItem', position: 2, name: T[lang].collection, item: ORIGIN + home(lang) + '#collection' },
    { '@type': 'ListItem', position: 3, name: lang === 'ar' ? p.ar : p.en, item: ORIGIN + purl(p, lang) }
  ]
});

/* ---------- homepage ---------- */
function buildHome(lang) {
  const t = T[lang], isAr = lang === 'ar';
  const title = isAr
    ? `${C.brandAr} | قطع فاخرة مصنوعة يدوياً من خشب الجوز والصدف — دبي`
    : `${C.brand} | Luxury Handcrafted Walnut & Mother-of-Pearl — Dubai`;
  const desc = isAr
    ? 'مهنّا كرافت — قطع ضيافة وأعمال وهدايا فاخرة مصنوعة يدوياً من خشب الجوز والجلد الطبيعي والصدف اللامع. تُصنع عند الطلب في دبي، وتُشحن خلال 7 أيام عمل.'
    : 'Muhanna Craft — hospitality, business and gift pieces handcrafted from walnut wood, natural leather and lustrous mother-of-pearl. Made to order in Dubai, shipped within 7 working days.';

  const itemList = {
    '@context': 'https://schema.org', '@type': 'ItemList',
    name: isAr ? 'مجموعة مهنّا كرافت' : 'The Muhanna Craft Collection',
    numberOfItems: D.products.length,
    itemListElement: D.products.map((p, i) => ({
      '@type': 'ListItem', position: i + 1,
      name: isAr ? p.ar : p.en, url: ORIGIN + purl(p, lang)
    }))
  };

  const cards = D.products.map((p, i) => `
<a class="card rv" data-cat="${p.cat}" href="${purl(p, lang)}">
  <div class="ph"><img src="/${p.img}" alt="${esc(isAr ? p.ar : p.en)}" width="800" height="1000" loading="${i < 3 ? 'eager' : 'lazy'}" decoding="async" onerror="var p=this.parentNode;if(p)p.classList.add(&quot;noimg&quot;);this.remove()"></div>
  <div class="meta">
    <div class="idx">${String(i + 1).padStart(2, '0')}</div>
    <h3>${esc(isAr ? p.ar : p.en)}</h3>
    <div class="sub">${esc(isAr ? p.dimsAr : p.dims)}</div>
  </div>
</a>`).join('');

  const chips = `<button class="chip" data-filter="all" aria-pressed="true">${esc(t.all)}</button>` +
    D.categories.map(c => `<button class="chip" data-filter="${c.slug}" aria-pressed="false">${esc(isAr ? c.ar : c.en)}</button>`).join('');

  const body = `<body dir="${isAr ? 'rtl' : 'ltr'}">
${header(lang)}
<main>
<section class="hero" id="top">
  <video autoplay muted loop playsinline poster="/${D.products[0].img}" aria-hidden="true"><source src="/banner.mp4" type="video/mp4"></video>
  <div class="inner">
    <h1>${t.heroTitle}</h1>
    <p>${esc(t.heroSub)}</p>
    <div class="btns">
      <a class="btn solid" href="#collection">${esc(t.explore)}</a>
      <a class="btn ghost" href="${wa(isAr ? 'مرحباً، أود الاستفسار عن منتجاتكم' : 'Hello, I would like to ask about your pieces')}" target="_blank" rel="noopener">${esc(t.order)}</a>
    </div>
  </div>
</section>

<section class="light" id="collection">
  <div class="wrap center">
    <div class="eyebrow rv">${esc(t.collEyebrow)}</div>
    <h2 class="rv">${esc(t.collTitle)}</h2>
    <p class="lede rv">${esc(t.collLede)}</p>
    <div class="rule"></div>
    <div class="chips rv">${chips}</div>
    <div class="grid">${cards}</div>
  </div>
</section>

<section id="story">
  <div class="wrap center">
    <div class="eyebrow rv">${esc(t.storyEyebrow)}</div>
    <h2 class="rv">${esc(isAr ? 'قصة عائلة' : 'A Family Story')}</h2>
    <div class="rule"></div>
    <p class="lede rv" style="max-width:68ch">${esc(isAr ? D.story.ar : D.story.en)}</p>
    <p class="lede rv" style="margin-top:26px;color:var(--accent);opacity:1">${esc(isAr ? D.story.signatureAr : D.story.signatureEn)}</p>
  </div>
</section>

<section class="light" id="materials">
  <div class="wrap center">
    <div class="eyebrow rv">${esc(t.matsEyebrow)}</div>
    <h2 class="rv">${esc(t.matsTitle)}</h2>
    <p class="lede rv">${esc(t.matsLede)}</p>
    <div class="rule"></div>
    <div class="mats">
      ${t.mats.map((m, i) => `<div class="mat rv"><div class="ph"><img src="/material-${['walnut', 'pearl', 'leather'][i]}.${i === 2 ? 'jpg' : 'webp'}" alt="${esc(m[0])}" width="900" height="600" loading="lazy" decoding="async"></div><div class="meta"><h3>${esc(m[0])}</h3><p style="opacity:.75;font-size:.9375rem;margin-top:8px">${esc(m[1])}</p></div></div>`).join('')}
    </div>
  </div>
</section>

<section id="faq">
  <div class="wrap">
    <div class="center"><div class="eyebrow rv">${esc(t.faqEyebrow)}</div>
    <h2 class="rv">${esc(t.faqTitle)}</h2><div class="rule"></div></div>
    <div class="faq">
      ${D.faq.map(f => `<details class="rv"><summary>${esc(isAr ? f.qAr : f.qEn)}</summary><p>${esc(isAr ? f.aAr : f.aEn)}</p></details>`).join('')}
    </div>
  </div>
</section>

<section class="light" id="contact">
  <div class="wrap center">
    <div class="eyebrow rv">${esc(t.ctEyebrow)}</div>
    <h2 class="rv">${esc(t.ctTitle)}</h2>
    <p class="lede rv">${esc(t.ctLede)}</p>
    <div class="rule"></div>
    <div class="btns rv"><a class="btn solid" href="${wa(isAr ? 'مرحباً، أود الاستفسار عن منتجاتكم' : 'Hello, I would like to ask about your pieces')}" target="_blank" rel="noopener">${esc(t.order)}</a></div>
    <div class="cts">
      <div class="ct rv"><div class="lbl">${esc(t.phone)}</div><a href="tel:${C.phone.replace(/\s/g, '')}">${esc(C.phone)}</a></div>
      <div class="ct rv"><div class="lbl">${esc(t.whatsapp)}</div><a href="https://wa.me/${C.whatsapp}" target="_blank" rel="noopener">${esc(C.phone)}</a></div>
      <div class="ct rv"><div class="lbl">${esc(t.email)}</div><a href="mailto:${C.email}">${esc(C.email)}</a></div>
      <div class="ct rv"><div class="lbl">${esc(t.location)}</div>${esc(isAr ? C.cityAr + '، الإمارات' : C.city + ', UAE')}</div>
    </div>
  </div>
</section>
</main>
${footer(lang)}`;

  return head({
    lang, title, desc,
    canonical: home(lang), altUrl: home(lang === 'ar' ? 'en' : 'ar'),
    image: D.products[0].img,
    ld: [orgLD(lang), bizLD(lang), siteLD(lang), faqLD(lang), itemList]
  }) + body;
}

/* ---------- product page ---------- */
function buildProduct(p, lang) {
  const t = T[lang], isAr = lang === 'ar';
  const name = isAr ? p.ar : p.en;
  const feats = isAr ? p.featAr : p.featEn;
  const title = `${name} | ${isAr ? C.brandAr : C.brand}`;
  const ship = p.bags
    ? (isAr ? C.bagsShippingNoteAr : C.bagsShippingNote)
    : (isAr ? C.shippingNoteAr : C.shippingNote);

  const body = `<body dir="${isAr ? 'rtl' : 'ltr'}">
${header(lang)}
<main class="pwrap">
<div class="wrap">
  <div class="crumb"><a href="${home(lang)}">${esc(t.home)}</a> / <a href="${home(lang)}#collection">${esc(t.collection)}</a></div>
  <div class="pgrid">
    <div class="pimg rv"><img src="/${p.img}" alt="${esc(name)}" width="900" height="1125" fetchpriority="high" decoding="async" onerror="var p=this.parentNode;if(p)p.classList.add(&quot;noimg&quot;);this.remove()"></div>
    <div class="rv">
      <h1 class="ptitle">${esc(name)}</h1>
      <ul class="feats">${feats.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
      <div class="spec">
        <div class="k">${esc(t.dims)}</div>
        <div>${esc(isAr ? p.dimsAr : p.dims)}</div>
      </div>
      <div class="spec">
        <div class="k">${esc(t.shipping)}</div>
        <div>${esc(ship)}</div>
      </div>
      <div class="btns" style="justify-content:flex-start">
        <a class="btn solid" href="${wa((isAr ? 'مرحباً، أود طلب: ' : 'Hello, I would like to order: ') + name)}" target="_blank" rel="noopener">${esc(t.order)}</a>
        <a class="btn ghost" href="${home(lang)}#collection">${esc(t.back)}</a>
      </div>
      <p class="note">${esc(isAr ? C.madeToOrderAr : C.madeToOrder)}</p>
    </div>
  </div>
</div>
<section><div class="wrap center">
  <div class="eyebrow">${esc(t.collEyebrow)}</div>
  <h2>${esc(t.collTitle)}</h2><div class="rule"></div>
  <div class="grid">
    ${D.products.filter(x => x.cat === p.cat && x.slug !== p.slug).slice(0, 3).map(x => `
    <a class="card rv" href="${purl(x, lang)}">
      <div class="ph"><img src="/${x.img}" alt="${esc(isAr ? x.ar : x.en)}" width="800" height="1000" loading="lazy" decoding="async" onerror="var p=this.parentNode;if(p)p.classList.add(&quot;noimg&quot;);this.remove()"></div>
      <div class="meta"><h3>${esc(isAr ? x.ar : x.en)}</h3><div class="sub">${esc(isAr ? x.dimsAr : x.dims)}</div></div>
    </a>`).join('')}
  </div>
  <div class="btns" style="margin-top:44px"><a class="btn ghost" href="${home(lang)}#collection">${esc(t.viewAll)}</a></div>
</div></section>
</main>
${footer(lang)}`;

  return head({
    lang, title, desc: metaDesc(p, lang),
    canonical: purl(p, lang), altUrl: purl(p, lang === 'ar' ? 'en' : 'ar'),
    image: p.img,
    ld: [productLD(p, lang), crumbLD(p, lang), orgLD(lang)]
  }) + body;
}

/* ---------- sitemap / robots / llms ---------- */
function buildSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const entry = (loc, arAlt, enAlt, pri) =>
`  <url>
    <loc>${ORIGIN}${loc}</loc>
    <lastmod>${today}</lastmod>
    <priority>${pri}</priority>
    <xhtml:link rel="alternate" hreflang="ar" href="${ORIGIN}${arAlt}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${ORIGIN}${enAlt}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}${arAlt}"/>
  </url>`;
  const rows = [
    entry('/', '/', '/en/', '1.0'),
    entry('/en/', '/', '/en/', '0.9'),
    ...D.products.flatMap(p => [
      entry(purl(p, 'ar'), purl(p, 'ar'), purl(p, 'en'), '0.8'),
      entry(purl(p, 'en'), purl(p, 'ar'), purl(p, 'en'), '0.7')
    ])
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${rows.join('\n')}
</urlset>
`;
}

function buildRobots() {
  return `# ${C.brand} — ${ORIGIN}
User-agent: *
Allow: /

# AI search and answer engines — explicitly welcomed
User-agent: GPTBot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Perplexity-User
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Claude-Web
Allow: /
User-agent: anthropic-ai
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: Applebot
Allow: /
User-agent: Applebot-Extended
Allow: /
User-agent: Bingbot
Allow: /
User-agent: CCBot
Allow: /
User-agent: Amazonbot
Allow: /
User-agent: meta-externalagent
Allow: /

Sitemap: ${ORIGIN}/sitemap.xml
`;
}

function buildLlms() {
  const cat = s => D.categories.find(c => c.slug === s);
  return `# ${C.brand} (${C.brandAr})

> ${C.tagline}. ${C.taglineAr}

${C.brand} is a Dubai-based atelier producing luxury objects handcrafted from
walnut wood, natural crocodile-pattern leather and lustrous mother-of-pearl.
Every piece is made to order by hand. The house was founded by ${C.founder},
continuing a family craft tradition that began with his grandfather,
Mohammad Khaled Tayara, who started making leather bags in the Salhieh district
of Damascus in 1971.

## Key facts
- Location: ${C.city}, United Arab Emirates
- Founded on a family craft lineage dating to 1971 (Damascus)
- Founder: ${C.founder} (${C.founderAr})
- Materials: walnut wood, natural leather (crocodile pattern), mother-of-pearl inlay
- Production: fully handcrafted, made to order
- Shipping: ${C.shippingNote}; ${C.bagsShippingNote}
- Languages: Arabic (primary), English
- Orders and enquiries: WhatsApp ${C.phone} — https://wa.me/${C.whatsapp}
- Email: ${C.email}
- Instagram: ${C.instagram}
- Website: ${ORIGIN} (Arabic) · ${ORIGIN}/en/ (English)

## Categories
${D.categories.map(c => `- ${c.en} (${c.ar})`).join('\n')}

## Products
${D.products.map(p => {
  const c = cat(p.cat);
  return `### ${p.en}
- Arabic name: ${p.ar}
- Category: ${c ? c.en : p.cat}
- Dimensions: ${p.dims}
- Materials & details: ${p.featEn.join('; ')}
- URL (EN): ${ORIGIN}${purl(p, 'en')}
- URL (AR): ${ORIGIN}${purl(p, 'ar')}
`;
}).join('\n')}

## FAQ
${D.faq.map(f => `**Q: ${f.qEn}**\nA: ${f.aEn}\n\n**س: ${f.qAr}**\nج: ${f.aAr}\n`).join('\n')}

## Full story
${D.story.en}

${D.story.ar}
`;
}

/* ---------- vercel.json (redirects stay in sync with products.json) ---------- */
function buildVercel() {
  const R = [];
  const add = (source, destination) => R.push({ source, destination, permanent: true });

  // 1. Old Shopify product URLs -> the matching NEW product page (preserves ranking)
  //    الروابط القديمة لكل منتج -> صفحة المنتج الجديدة المطابقة
  for (const p of D.products) {
    if (!p.oldSlug) continue;
    add(`/products/${p.oldSlug}`, purl(p, 'ar'));
    add(`/en/products/${p.oldSlug}`, purl(p, 'en'));
    add(`/collections/:c/products/${p.oldSlug}`, purl(p, 'ar'));
    add(`/en/collections/:c/products/${p.oldSlug}`, purl(p, 'en'));
  }

  // 2. Old collection URLs -> the collection section, per language
  for (const c of D.categories) {
    add(`/collections/${c.slug}`, '/#collection');
    add(`/en/collections/${c.slug}`, '/en/#collection');
  }
  // legacy slugs that existed on the old store
  for (const s of ['vip-collection', 'all', 'buisness', 'hospitality', 'candles', 'bags', 'gifts']) {
    if (!R.some(r => r.source === `/collections/${s}`)) {
      add(`/collections/${s}`, '/#collection');
      add(`/en/collections/${s}`, '/en/#collection');
    }
  }
  add('/vip-collection', '/#collection');

  // 3. Old Shopify pages
  for (const [s, d] of [['our-story', '#story'], ['about', '#story'], ['about-us', '#story'],
                        ['contact', '#contact'], ['contact-us', '#contact'], ['materials', '#materials'],
                        ['faq', '#faq']]) {
    add(`/pages/${s}`, '/' + d);
    add(`/en/pages/${s}`, '/en/' + d);
  }

  // 4. Catch-alls for anything on the old store not listed above
  add('/en/products/:handle*', '/en/#collection');
  add('/products/:handle*', '/#collection');
  add('/en/collections/:slug*', '/en/#collection');
  add('/collections/:slug*', '/#collection');
  add('/en/pages/:handle*', '/en/#story');
  add('/pages/:handle*', '/#story');
  add('/en/blogs/:path*', '/en/#story');
  add('/blogs/:path*', '/#story');
  add('/en/policies/:path*', '/en/#contact');
  add('/policies/:path*', '/#contact');
  add('/en/search', '/en/#collection');
  add('/search', '/#collection');
  for (const s of ['cart', 'checkout', 'account']) {
    add(`/en/${s}`, '/en/#contact'); add(`/en/${s}/:path*`, '/en/#contact');
    add(`/${s}`, '/#contact');       add(`/${s}/:path*`, '/#contact');
  }
  add('/checkouts/:path*', '/#contact');
  for (const s of ['apps', 'a', 'tools']) add(`/${s}/:path*`, '/');
  add('/challenge', '/'); add('/password', '/');
  for (const s of ['products', 'collections', 'pages']) add(`/sitemap_${s}_1.xml`, '/sitemap.xml');

  // 5. Arabic is served at the root, so /ar is an alias
  add('/ar', '/'); add('/ar/:path*', '/');

  return JSON.stringify({
    $schema: 'https://openapi.vercel.sh/vercel.json',
    trailingSlash: true,
    redirects: R,
    headers: [
      { source: '/(.*)', headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }
      ]},
      { source: '/(.*)\\.(jpg|jpeg|png|webp|avif|svg|ico|woff2|mp4)', headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
      ]},
      { source: '/(robots.txt|sitemap.xml|llms.txt)', headers: [
        { key: 'Cache-Control', value: 'public, max-age=3600' }
      ]}
    ]
  }, null, 2) + '\n';
}

/* ---------- run ---------- */
let n = 0;
out('vercel.json', buildVercel()); n++;
out('index.html', buildHome('ar')); n++;
out('en/index.html', buildHome('en')); n++;
for (const p of D.products) {
  out(`p/${p.slug}/index.html`, buildProduct(p, 'ar')); n++;
  out(`en/p/${p.slug}/index.html`, buildProduct(p, 'en')); n++;
}
out('sitemap.xml', buildSitemap()); n++;
out('robots.txt', buildRobots()); n++;
out('llms.txt', buildLlms()); n++;

console.log(`Built ${n} files · ${D.products.length} products × 2 languages`);
console.log(`Images required in site root:`);
console.log(D.products.map(p => '  ' + p.img).join('\n'));
