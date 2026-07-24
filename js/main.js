/**
 * main.js — Pelion Hero V2
 *
 * Brak animacji wjazdu (K1→K2) — grid widoczny od razu.
 * K3: wideo rośnie do pełnego ekranu przy scrollu
 *     lub automatycznie po 20 s braku aktywności.
 */

gsap.registerPlugin(ScrollTrigger);

const videoCard  = document.getElementById('videoCard');
const heroText   = document.getElementById('heroText');
const photoWraps = Array.from(document.querySelectorAll('.hero__img-wrap'));

/* K3 setup — krótki delay by upewnić się, że layout jest obliczony */
gsap.delayedCall(0.15, runPhase3setup);

/* ────────────────────────────────────────────────────────
   K3  fixed overlay rośnie do 100vw × 100vh,
       następnie 3 hasła pojawiają się kolejno przy scrollu
       lub automatycznie po 10 s od załadowania.
──────────────────────────────────────────────────────── */
function runPhase3setup() {
    const vw   = window.innerWidth;
    const vh   = window.innerHeight;
    const rect = videoCard.getBoundingClientRect();

    /* Przenieś nav do body — wyrywa go ze stacking context .hero */
    const nav = document.querySelector('.nav');
    document.body.appendChild(nav);

    /* Wydłuż wrapper — daje przestrzeń na rozwinięcie video */
    document.querySelector('.hero-scroll-wrap').style.height = '180vh';

    /* ── overlay ── */
    const overlay = document.createElement('div');
    overlay.id = 'videoOverlay';
    Object.assign(overlay.style, {
        position:      'fixed',
        top:           rect.top    + 'px',
        left:          rect.left   + 'px',
        width:         rect.width  + 'px',
        height:        rect.height + 'px',
        overflow:      'hidden',
        zIndex:        '500',
        pointerEvents: 'none',
    });

    /* ── wideo ── */
    const vid = document.createElement('video');
    vid.src         = 'wideo/pelion_scalone_wideo.mp4';
    vid.autoplay    = true;
    vid.muted       = true;
    vid.loop        = true;
    vid.playsInline = true;
    Object.assign(vid.style, {
        width: '100%', height: '100%', objectFit: 'cover', display: 'block',
    });
    overlay.appendChild(vid);

    /* ── helper: tworzy warstwę tekstową ── */
    function makeTextLayer(text) {
        const layer = document.createElement('div');
        Object.assign(layer.style, {
            position: 'absolute', inset: '0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: '0', pointerEvents: 'none',
        });
        const box = document.createElement('div');
        Object.assign(box.style, {
            display:       'flex',
            flexDirection: 'column',
            alignItems:    'center',
            gap:           '16px',
            maxWidth:      '680px',
            padding:       '0 24px',
        });
        const p = document.createElement('p');
        p.textContent = text;
        Object.assign(p.style, {
            fontFamily:    "'Montserrat', sans-serif",
            fontSize:      '48px', fontWeight: '500',
            lineHeight:    '1.3', letterSpacing: '0.04em',
            textTransform: 'uppercase', textAlign: 'center',
            color:         '#fff',
            textShadow:    '0 2px 20px rgba(0,0,0,0.65), 0 1px 6px rgba(0,0,0,0.45)',
        });
        const uline = document.createElement('div');
        Object.assign(uline.style, {
            width: '80px', height: '3px',
            background: '#009641', flexShrink: '0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        });
        box.appendChild(p);
        box.appendChild(uline);
        layer.appendChild(box);
        overlay.appendChild(layer);
        return layer;
    }

    const layer1 = makeTextLayer('Budujemy polską gospodarkę');
    const layer2 = makeTextLayer('Inwestujemy w rozwój i innowacje');
    const layer3 = makeTextLayer('Dynamicznie rozszerzamy zasięg w Europie');

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reducedMotion) {
        [layer1, layer2, layer3].forEach(l => gsap.set(l.firstElementChild, { y: 14 }));
    }

    let textsStarted     = false;
    let textTl           = null;
    let fullscreenLocked = false;
    const layers = [layer1, layer2, layer3];

    function resetTexts() {
        if (textTl) { textTl.kill(); textTl = null; }
        layers.forEach(l => {
            gsap.set(l, { opacity: 0 });
            if (!reducedMotion) gsap.set(l.firstElementChild, { y: 14 });
        });
        textsStarted = false;
    }

    function startTextAnimations() {
        const FADE  = 0.5;
        const DWELL = 2.0;
        const GAP   = 0.5;

        function addEntry(tl, layer, t) {
            tl.to(layer, { opacity: 1, duration: FADE, ease: 'power2.out' }, t);
            if (!reducedMotion) {
                tl.to(layer.firstElementChild, { y: 0, duration: FADE + 0.1, ease: 'power2.out' }, t);
            }
            return t + DWELL;
        }

        textTl = gsap.timeline();
        let tOut = addEntry(textTl, layer1, 0.9);
        textTl.to(layer1, { opacity: 0, duration: FADE, ease: 'power2.in' }, tOut);
        tOut = addEntry(textTl, layer2, tOut + FADE + GAP);
        textTl.to(layer2, { opacity: 0, duration: FADE, ease: 'power2.in' }, tOut);
        addEntry(textTl, layer3, tOut + FADE + GAP);
    }

    document.body.appendChild(overlay);
    gsap.set(videoCard, { opacity: 0 });

    /* Elementy do wygaszenia przy powiększeniu wideo */
    const elementsToFade = [...photoWraps, heroText];

    /* ── ScrollTrigger ──────────────────────────────────────
       0.00 – 0.50   overlay rośnie do pełnego ekranu
       po 0.50       hasła pojawiają się automatycznie (time-based)
    ── */
    const mainTl = gsap.timeline({
        scrollTrigger: {
            trigger: '.hero-scroll-wrap',
            start:   'top top',
            end:     'bottom bottom',
            scrub:   0.4,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
                if (fullscreenLocked) {
                    nav.classList.add('nav--film');
                    return;
                }
                if (self.progress >= 0.3) {
                    nav.classList.add('nav--film');
                    if (!textsStarted) {
                        textsStarted     = true;
                        fullscreenLocked = true;
                        gsap.killTweensOf(overlay);
                        gsap.to(overlay, {
                            top: 0, left: 0, width: vw, height: vh,
                            duration: 0.35, ease: 'power2.out',
                        });
                        startTextAnimations();
                    }
                } else {
                    nav.classList.remove('nav--film');
                    if (textsStarted || textTl) resetTexts();
                }
            },
            onLeave: () => {
                const sy = window.scrollY || window.pageYOffset;
                Object.assign(overlay.style, {
                    position: 'absolute',
                    top:      sy + 'px',
                    left:     '0',
                    width:    vw + 'px',
                    height:   vh + 'px',
                });
                nav.classList.remove('nav--film');
            },
            onEnterBack: () => {
                Object.assign(overlay.style, {
                    position: 'fixed',
                    top:      '0',
                    left:     '0',
                    width:    vw + 'px',
                    height:   vh + 'px',
                });
                if (textsStarted || textTl) resetTexts();
            },
        },
    });

    mainTl.to(overlay,
        { top: 0, left: 0, width: vw, height: vh, ease: 'none', duration: 0.3 }, 0);
    mainTl.to(elementsToFade,
        { opacity: 0, ease: 'none', duration: 0.3 }, 0);
    mainTl.to({}, { duration: 0.7 }, 0.3);

    /* ── 20 s inactivity auto-zoom ─────────────────────────────
       Brak aktywności użytkownika przez 20 s (mysz, scroll, klik,
       dotyk) → wideo automatycznie powiększa się na cały ekran.
       Każde zdarzenie aktywności resetuje timer od nowa.
    ── */
    let inactivityTimer = null;

    function triggerAutoZoom() {
        if (fullscreenLocked) return;
        fullscreenLocked = true;
        textsStarted     = true;
        nav.classList.add('nav--film');
        gsap.killTweensOf(overlay);
        gsap.to(overlay, { top: 0, left: 0, width: vw, height: vh, duration: 1.2, ease: 'power2.inOut' });
        gsap.to(elementsToFade, { opacity: 0, duration: 0.8 });
        gsap.delayedCall(1.2, startTextAnimations);
    }

    function resetInactivityTimer() {
        if (fullscreenLocked) return;
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(triggerAutoZoom, 20000);
    }

    ['mousemove', 'scroll', 'click', 'touchstart', 'keydown'].forEach(evt =>
        window.addEventListener(evt, resetInactivityTimer, { passive: true })
    );
    resetInactivityTimer();

    /* odblokuj scroll — scroll.js czeka na to zdarzenie żeby uruchomić Lenis */
    window.dispatchEvent(new CustomEvent('hero:headlineVisible'));
}

/* ────────────────────────────────────────────────────────
   PELION W LICZBACH — scroll carousel
──────────────────────────────────────────────────────── */
(function initLiczby() {
    if (!document.getElementById('lb-center')) return;

    const C = { left: 357, top: 42, size: 437 };

    const sats = [
        { id: '#lb-ul', left: 97,  top: 32,  size: 240 },
        { id: '#lb-ll', left: 20,  top: 292, size: 196 },
        { id: '#lb-lr', left: 814, top: 32,  size: 240 },
        { id: '#lb-ur', left: 934, top: 292, size: 196 },
    ];

    gsap.set('#lb-center', { opacity: 1, clearProps: 'transform' });
    sats.forEach(s => gsap.set(s.id, {
        clearProps: 'transform',
        opacity: 0.25,
        zIndex: 1,
    }));

    const D = 0.08;

    let locked     = false;
    let stProgress = 0;
    let tlProgress = 0;

    function lockFinalState() {
        if (locked) return;
        locked = true;
        lbST.kill();
        gsap.ticker.remove(tickLiczby);
        lbTl.kill();
        sats.forEach(s => {
            gsap.set(s.id, { left: s.left, top: s.top, width: s.size, height: s.size, opacity: 1, zIndex: 2 });
            gsap.set(`${s.id} .lb__num`,     { fontSize: '32px' });
            gsap.set(`${s.id} .lb__unit-sm`, { fontSize: '14px' });
            gsap.set(`${s.id} .lb__desc`,    { fontSize: '11px' });
        });
        gsap.set('#lb-center', { opacity: 1 });
    }

    function tickLiczby() {
        if (locked) return;
        const delta  = stProgress - tlProgress;
        const factor = delta >= 0 ? 0.05 : 0.18;
        tlProgress  += delta * factor;
        if (tlProgress >= 0.87) { lockFinalState(); return; }
        lbTl.progress(tlProgress);
    }

    const lbTl = gsap.timeline({ paused: true });

    const lbST = ScrollTrigger.create({
        trigger: '.liczby-wrap',
        start:   'top top',
        end:     'bottom bottom',
        invalidateOnRefresh: true,
        onUpdate: (self) => { stProgress = self.progress; },
    });

    gsap.ticker.add(tickLiczby);

    lbTl.to('#lb-center', { opacity: 0, duration: D }, 0.12);

    function jump(s, tIn, tOut) {
        const numSize = '64px';
        lbTl.to(s.id, {
            left: C.left, top: C.top, width: C.size, height: C.size,
            opacity: 1, zIndex: 5,
            duration: D, ease: 'power2.inOut',
        }, tIn);
        lbTl.to(`${s.id} .lb__num`,     { fontSize: numSize, duration: D }, tIn);
        lbTl.to(`${s.id} .lb__unit-sm`, { fontSize: '26px', duration: D }, tIn);
        lbTl.to(`${s.id} .lb__desc`,    { fontSize: '17px', duration: D }, tIn);

        if (tOut === null) return;

        lbTl.to(s.id, {
            left: s.left, top: s.top, width: s.size, height: s.size,
            opacity: 0.25, zIndex: 1,
            duration: D, ease: 'power2.inOut',
        }, tOut);
        lbTl.to(`${s.id} .lb__num`,     { fontSize: '32px', duration: D }, tOut);
        lbTl.to(`${s.id} .lb__unit-sm`, { fontSize: '14px', duration: D }, tOut);
        lbTl.to(`${s.id} .lb__desc`,    { fontSize: '11px', duration: D }, tOut);
    }

    jump(sats[0], 0.12, 0.32);
    jump(sats[1], 0.32, 0.52);
    jump(sats[2], 0.52, 0.72);
    jump(sats[3], 0.72, 0.80);

    sats.forEach(s => {
        lbTl.to(s.id, { opacity: 1, duration: D, ease: 'power2.out' }, 0.88);
    });
    lbTl.to('#lb-center', { opacity: 1, duration: D, ease: 'power2.out' }, 0.88);
})();

/* ────────────────────────────────────────────────────────
   MARKI — bezszwowa pętla marquee
──────────────────────────────────────────────────────── */
(function initMarquee() {
    const trackWrap = document.querySelector('.marki__track-wrap');
    const rows      = Array.from(document.querySelectorAll('.marki__row'));
    const tweens  = [];
    let   sectionHovered = false;

    rows.forEach((row, idx) => {
        const toLeft = row.classList.contains('marki__row--left');

        Array.from(row.children).forEach(item => {
            const clone = item.cloneNode(true);
            clone.setAttribute('aria-hidden', 'true');
            row.appendChild(clone);
        });

        row.style.animation = 'none';
        tweens[idx] = null;

        requestAnimationFrame(() => {
            const halfW = row.scrollWidth / 2;
            const fromX = toLeft ? 0      : -halfW;
            const toX   = toLeft ? -halfW : 0;

            gsap.set(row, { x: fromX });

            function wrapX(x) {
                return -(((-x % halfW) + halfW) % halfW);
            }

            function startTween(currentX) {
                if (tweens[idx]) tweens[idx].kill();
                const dist = Math.abs(currentX - toX);
                const dur  = (dist / halfW) * 28;
                tweens[idx] = gsap.to(row, {
                    x: toX, duration: dur, ease: 'none',
                    timeScale: sectionHovered ? 0 : 1,
                    onComplete: () => {
                        gsap.set(row, { x: fromX });
                        tweens[idx] = gsap.fromTo(row,
                            { x: fromX },
                            { x: toX, duration: 28, ease: 'none', repeat: -1,
                              timeScale: sectionHovered ? 0 : 1 }
                        );
                    },
                });
            }

            startTween(fromX);

            const track = row.closest('.marki__track');
            track.style.cursor = 'grab';

            let isDragging    = false;
            let dragStartX    = 0;
            let dragStartPosX = 0;

            track.addEventListener('mousedown', (e) => {
                isDragging    = true;
                dragStartX    = e.clientX;
                dragStartPosX = gsap.getProperty(row, 'x');
                tweens[idx] && tweens[idx].pause();
                track.style.cursor             = 'grabbing';
                document.body.style.userSelect = 'none';
                e.preventDefault();
            });

            window.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                const dx   = e.clientX - dragStartX;
                const newX = wrapX(dragStartPosX + dx);
                gsap.set(row, { x: newX });
            });

            window.addEventListener('mouseup', () => {
                if (!isDragging) return;
                isDragging                     = false;
                document.body.style.userSelect = '';
                track.style.cursor             = 'grab';
                startTween(gsap.getProperty(row, 'x'));
            });
        });
    });

    trackWrap.addEventListener('mouseenter', () => {
        sectionHovered = true;
        tweens.forEach(t => {
            if (!t) return;
            gsap.to(t, { timeScale: 0, duration: 0.6, ease: 'power2.out', overwrite: true });
        });
    });

    trackWrap.addEventListener('mouseleave', () => {
        sectionHovered = false;
        tweens.forEach(t => {
            if (!t) return;
            gsap.to(t, { timeScale: 1, duration: 0.9, ease: 'power2.inOut', overwrite: true });
        });
    });
})();

/* ────────────────────────────────────────────────────────
   PELION W LICZBACH 2 — spinning stroke po wejściu w viewport
──────────────────────────────────────────────────────── */
(function initLiczby2() {
    const section = document.querySelector('.liczby2');
    if (!section) return;

    const bubbles = section.querySelectorAll('.lb2');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            bubbles.forEach(b => {
                b.classList.remove('lb2--spinning');
                void b.offsetWidth;
                b.classList.add('lb2--spinning');
            });
            observer.disconnect();
        });
    }, { threshold: 0.25 });

    observer.observe(section);
})();

/* ────────────────────────────────────────────────────────
   CYTAT — scroll-reveal wyraz po wyrazie
──────────────────────────────────────────────────────── */
(function initPqWordReveal() {
    const container = document.getElementById('pqText');
    if (!container) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    function wrapWords(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const parts = node.textContent.split(/(\s+)/);
            const frag  = document.createDocumentFragment();
            parts.forEach(part => {
                if (!part) return;
                if (/^\s+$/.test(part)) {
                    frag.appendChild(document.createTextNode(part));
                } else {
                    const span = document.createElement('span');
                    span.className = 'pq-word';
                    span.textContent = part;
                    frag.appendChild(span);
                }
            });
            node.parentNode.replaceChild(frag, node);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            Array.from(node.childNodes).forEach(wrapWords);
        }
    }

    wrapWords(container);

    const words = Array.from(container.querySelectorAll('.pq-word'));
    const N     = words.length;

    function calcProgress() {
        const rect = container.getBoundingClientRect();
        const vh   = window.innerHeight;
        return Math.max(0, Math.min(1, (vh - rect.top) / (vh * 0.55)));
    }

    function updateColors(progress) {
        words.forEach((word, i) => {
            const wp = Math.max(0, Math.min(1, (progress * (N + 0.5) - i) / 1.5));
            const r  = Math.round(200 + (54  - 200) * wp);
            const g  = Math.round(200 + (54  - 200) * wp);
            const b  = Math.round(200 + (57  - 200) * wp);
            word.style.color = `rgb(${r},${g},${b})`;
        });
    }

    let current = 0;
    let running = false;

    function loop() {
        const target = calcProgress();
        current += (target - current) * 0.08;
        updateColors(current);

        if (Math.abs(target - current) > 0.001) {
            requestAnimationFrame(loop);
        } else {
            updateColors(target);
            current = target;
            running = false;
        }
    }

    window.addEventListener('scroll', () => {
        if (!running) { running = true; requestAnimationFrame(loop); }
    }, { passive: true });

    current = calcProgress();
    updateColors(current);
})();
