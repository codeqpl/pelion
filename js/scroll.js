/* ────────────────────────────────────────────────────────
   SMOOTH SCROLL + REVEAL ANIMATIONS
   Lenis (inertia) → GSAP ScrollTrigger (reveals)
──────────────────────────────────────────────────────── */
(function initScroll() {
    'use strict';

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ── 1. Lenis smooth scroll ──────────────────────────
       Wyłączamy na touch-only mobile (smoothTouch: false)
       i przy prefers-reduced-motion.
    ── */
    if (!reduced) {
        const lenis = new Lenis({
            duration:        1.1,
            easing:          t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothTouch:     false,
            touchMultiplier: 2,
        });

        /* Zablokuj scroll podczas animacji K1→K2 hero.
           main.js wyśle 'hero:headlineVisible' gdy nagłówek
           będzie w pełni widoczny — wtedy odblokuj.          */
        lenis.stop();
        window.addEventListener('hero:headlineVisible',
            () => lenis.start(), { once: true });

        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(time => lenis.raf(time * 1000));
        gsap.ticker.lagSmoothing(0);
    } else {
        /* Bez Lenis — blokada przez CSS overflow */
        document.documentElement.style.overflow = 'hidden';
        window.addEventListener('hero:headlineVisible', () => {
            document.documentElement.style.overflow = '';
        }, { once: true });
    }

    /* ── 2. Scroll-reveal helper ─────────────────────────
       Fade-in + slide-up; stagger dla grup elementów.
    ── */
    if (reduced) return;

    /**
     * @param {string|Element|Element[]} targets  — selektor lub elementy
     * @param {object} opts
     *   trigger  {string|Element}  — element wyzwalający (domyślnie: pierwszy target)
     *   start    {string}          — ScrollTrigger start (domyślnie: 'top 85%')
     *   stagger  {number}          — opóźnienie między elementami (s)
     *   y        {number}          — przesunięcie startowe w px (domyślnie 28)
     *   duration {number}          — czas fade-in (s, domyślnie 0.75)
     */
    function reveal(targets, {
        trigger,
        start   = 'top 85%',
        stagger = 0,
        y       = 28,
        duration = 0.75,
    } = {}) {
        const els = gsap.utils.toArray(targets);
        if (!els.length) return;

        gsap.fromTo(els,
            { opacity: 0, y },
            {
                opacity:  1,
                y:        0,
                duration,
                ease:     'power2.out',
                stagger,
                scrollTrigger: {
                    trigger: trigger || els[0],
                    start,
                },
            }
        );
    }

    /* ── 4. Sekcja: PELION W LICZBACH 2 (statyczna) ─────── */
    reveal(['.liczby2__head .sec-title', '.liczby2__head .sec-line'], {
        trigger: '.liczby2',
        stagger: 0.12,
    });
    reveal('.lb2', {
        trigger: '.liczby2__scene',
        start:   'top 80%',
        stagger: 0.1,
        y:       36,
    });

    /* ── 5. Sekcja: MARKI ───────────────────────────────── */
    reveal(['.marki .sec-title', '.marki .sec-line'], {
        trigger: '.marki',
        stagger: 0.12,
    });

    /* ── 6. Sekcja: AKTUALNOŚCI ─────────────────────────── */
    reveal(['.aktual .sec-title', '.aktual .sec-line'], {
        trigger: '.aktual',
        stagger: 0.12,
    });
    reveal('.acard', {
        trigger: '.aktual__cards',
        start:   'top 82%',
        stagger: 0.15,
        y:       36,
    });

    /* ── 7. FOOTER ──────────────────────────────────────── */
    reveal('.footer__col', {
        trigger: '.footer__inner',
        start:   'top 88%',
        stagger: 0.1,
        y:       20,
    });

    /* ── 3. O NAS — kaskadowy scroll ────────────────────── */
    (function initOnasScroll() {
        const wrap   = document.querySelector('.onas-scroll-wrap');
        const items  = Array.from(document.querySelectorAll('.onas__item'));
        const photos = Array.from(document.querySelectorAll('.onas__photo'));
        if (!wrap || !items.length) return;

        let current = -1;

        function setActive(idx) {
            if (idx === current) return;
            current = idx;
            items.forEach((item, i) =>
                item.classList.toggle('onas__item--open', i === idx));
            photos.forEach((photo, i) =>
                photo.classList.toggle('onas__photo--active', i === idx));
        }

        setActive(0);   /* stan startowy: Misja otwarta */

        ScrollTrigger.create({
            trigger: wrap,
            start:   'top top',
            end:     'bottom bottom',
            invalidateOnRefresh: true,
            onUpdate(self) {
                const idx = Math.min(
                    Math.floor(self.progress * items.length),
                    items.length - 1
                );
                setActive(idx);
            },
        });
    })();

    /* ── 8. NAV — compact po zejściu z hero ─────────────── */
    const heroWrap = document.querySelector('.hero-scroll-wrap');
    function updateNavCompact() {
        const nav = document.querySelector('.nav');
        if (!nav || !heroWrap) return;
        nav.classList.toggle('nav--compact', heroWrap.getBoundingClientRect().bottom < 0);
    }
    window.addEventListener('scroll', updateNavCompact, { passive: true });
})();
