/**
 * Real-browser UI checks. Headless Chrome via CDP can't be trusted here:
 * it starves requestAnimationFrame under --virtual-time-budget (so framer-style
 * animations look broken) and Windows clamps --window-size to ~497px (so mobile
 * screenshots silently crop instead of reflowing). Playwright avoids both.
 *
 *   npm run dev          # in one terminal
 *   npm run verify       # in another
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4321';
const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
};

const browser = await chromium.launch({ channel: 'chrome', headless: true });

for (const width of [1280, 390]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));

  for (const path of ['/', '/projects', '/experience', '/contact']) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    // walk the page so scroll-driven reveals run, then settle mid-page
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.8;
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo(0, Math.round(document.body.scrollHeight / 3));
    });
    await page.waitForTimeout(700);

    // No horizontal overflow at any width.
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    check(`${width}px ${path} no horizontal overflow`, over <= 0, `${over}px`);

    // Nothing that draws its border with box-shadow may sit under a clip-path,
    // or the border is silently clipped away.
    const clipped = await page.evaluate(() => {
      const bad = [];
      const vh = window.innerHeight;
      document.querySelectorAll('.pixel-box, .pixel-lift').forEach((el) => {
        // Only judge what's actually on screen. A scroll-reveal element that
        // hasn't entered yet is *supposed* to be clipped shut.
        const r = el.getBoundingClientRect();
        if (r.bottom <= 0 || r.top >= vh) return;

        let p = el;
        for (let i = 0; i < 8 && p; i++) {
          const cs = getComputedStyle(p);
          // A negative inset clips outside the border box, which is what keeps
          // box-shadow borders alive. Anything else would eat them.
          if (cs.clipPath !== 'none' && !cs.clipPath.includes('-')) {
            bad.push(`${el.tagName.toLowerCase()} under ${cs.clipPath}`);
            break;
          }
          p = p.parentElement;
        }
      });
      return bad;
    });
    check(`${width}px ${path} borders not clipped`, clipped.length === 0, clipped.slice(0, 2).join('; '));

    if (width < 768) {
      // Touch targets. Exempt: the focus-only skip link, links sitting inside a
      // sentence (WCAG 2.5.8 carves those out), and off-screen inputs.
      const smallTargets = await page.evaluate(() => {
        const bad = [];
        document.querySelectorAll('a, button, input, textarea, select').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return;
          if (r.right < 0 || r.left > window.innerWidth) return;
          if (el.classList.contains('skip-link')) return;
          const inProse = el.tagName === 'A' && el.parentElement &&
            ['P', 'LI', 'DD', 'SPAN'].includes(el.parentElement.tagName) &&
            el.parentElement.textContent.trim().length > el.textContent.trim().length + 12;
          if (inProse) return;
          if (r.width < 44 || r.height < 43.5) {
            bad.push(`${Math.round(r.width)}x${Math.round(r.height)} ${(el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 24)}`);
          }
        });
        return bad;
      });
      check(`${width}px ${path} touch targets >= 44px`, smallTargets.length === 0, smallTargets.slice(0, 3).join('; '));

      // Inputs under 16px make iOS Safari zoom the page on focus and leave it
      // zoomed, which is how the old site behaved before a text-sm crept in.
      const smallInputs = await page.evaluate(() =>
        [...document.querySelectorAll('input:not([type=hidden]), textarea, select')]
          .filter((el) => el.getBoundingClientRect().left > -1000)
          .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 16)
          .map((el) => `${el.id || el.name}@${getComputedStyle(el).fontSize}`));
      check(`${width}px ${path} inputs >= 16px (no iOS zoom)`, smallInputs.length === 0, smallInputs.join(', '));
    }
  }

  check(`${width}px no page errors`, errs.length === 0, errs.slice(0, 2).join(' | '));
  await page.close();
}

// Interactions (desktop only).
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(BASE + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

const btn = page.locator('button', { hasText: 'INSPECT ENTRY' }).first();
await btn.scrollIntoViewIfNeeded();
await page.waitForTimeout(700);
await btn.click();
await page.waitForTimeout(700);
const flipped = await page.locator('.card-flip').first()
  .evaluate((el) => getComputedStyle(el).transform);
check('card flip rotates', flipped.startsWith('matrix3d'), flipped.slice(0, 32));
check('CLOSE ENTRY reachable', await page.locator('button', { hasText: 'CLOSE ENTRY' }).first().isVisible());

const lcd = page.locator('#main .bg-screen-0').nth(1);
const before = (await lcd.innerText()).trim();
await page.locator('button[aria-label="Show next title"]').click();
await page.waitForTimeout(900);
check('D-pad cycles title', (await lcd.innerText()).trim() !== before);

const y0 = await page.evaluate(() => window.scrollY);
await page.locator('button[aria-label="Jump to next section"]').click();
await page.waitForTimeout(1100);
check('D-pad steps sections', (await page.evaluate(() => window.scrollY)) !== y0);

// Fast-scroll behaviour on the longest page. The reveal used to be a
// scroll-scrubbed animation-timeline animation, which replayed backwards on the
// way up and repainted clip-path every frame.
// NOTE: html has scroll-behavior:smooth, so programmatic scrolling must pass
// behavior:'instant' or it animates and never actually moves.
await page.goto(BASE + '/experience', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
const scrollStats = await page.evaluate(async () => {
  const deltas = [];
  let last = performance.now(), running = true;
  const tick = (t) => { deltas.push(t - last); last = t; if (running) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  const maxY = () => document.documentElement.scrollHeight - window.innerHeight;
  let g = 0;
  while (window.scrollY < maxY() - 2 && g++ < 200) {
    window.scrollTo({ top: window.scrollY + 420, behavior: 'instant' });
    await new Promise((r) => requestAnimationFrame(r));
  }
  const revealedAtBottom = document.querySelectorAll('.reveal-band.is-in').length;
  g = 0;
  while (window.scrollY > 0 && g++ < 200) {
    window.scrollTo({ top: window.scrollY - 420, behavior: 'instant' });
    await new Promise((r) => requestAnimationFrame(r));
  }
  running = false;
  await new Promise((r) => setTimeout(r, 150));
  const d = deltas.slice(3);
  return {
    janky: d.filter((x) => x > 33).length,
    total: document.querySelectorAll('.reveal-band').length,
    revealedAtBottom,
    stillFaded: [...document.querySelectorAll('.reveal-band')]
      .filter((el) => parseFloat(getComputedStyle(el).opacity) < 0.99).length,
  };
});
check('fast scroll drops no frames', scrollStats.janky === 0, `${scrollStats.janky} frames >33ms`);
check('all entries reveal on the way down',
  scrollStats.revealedAtBottom === scrollStats.total,
  `${scrollStats.revealedAtBottom}/${scrollStats.total}`);
check('reveal is one-shot (nothing re-hides on the way up)',
  scrollStats.stillFaded === 0, `${scrollStats.stillFaded} re-hidden`);

await page.close();

// Regression guard: islands must hydrate even where IntersectionObserver never
// fires. Arc's split view and Cursor's embedded browser are such contexts, and
// client:visible silently never hydrates there — CSS hover still works, so it
// looks like "clicking does nothing" rather than like broken JS.
const blind = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await blind.addInitScript(() => {
  window.IntersectionObserver = class {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  };
});
await blind.goto(BASE + '/', { waitUntil: 'networkidle' });
await blind.waitForTimeout(2500);

const unhydrated = await blind.evaluate(() =>
  [...document.querySelectorAll('astro-island')]
    .filter((n) => n.hasAttribute('ssr'))
    .map((n) => (n.getAttribute('component-url') || '').split('/').pop())
);
check('islands hydrate without IntersectionObserver', unhydrated.length === 0, unhydrated.join(', '));

const blindCard = blind.locator('.card-flip').first();
await blindCard.scrollIntoViewIfNeeded();
await blind.waitForTimeout(600);
const bBefore = await blindCard.evaluate((el) => getComputedStyle(el).transform);
const bBox = await blindCard.boundingBox();
await blind.mouse.click(bBox.x + bBox.width / 2, bBox.y + 40);
await blind.waitForTimeout(800);
const bAfter = await blindCard.evaluate((el) => getComputedStyle(el).transform);
check('card body click flips without IntersectionObserver', bBefore !== bAfter);

await browser.close();

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
