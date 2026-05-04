/**
 * main.js — Pelion Hero
 *
 * K1  load:   karty 0-4, karta 2 wyśrodkowana, nagłówek ukryty
 * K2  2 s:    pasek → karta 4 (video) na środku
 *             nagłówek pojawia się słowo-po-słowie NAD kafelkami
 *             karty 3/4/5 opadają delikatnie (10 / 20 / 10 % wysokości)
 * K3  scroll: fixed overlay z wideo rośnie do pełnego ekranu
 */

gsap.registerPlugin(ScrollTrigger);

/* ────────────────────────────────────────────────────────
   ELEMENTY
──────────────────────────────────────────────────────── */
const strip     = document.getElementById('heroStrip');
const headline  = document.getElementById('heroHeadline');
const videoCard = document.getElementById('videoCard');
const cards     = Array.from(strip.querySelectorAll('.card'));
const videoIdx  = cards.indexOf(videoCard); // 4

/* ────────────────────────────────────────────────────────
   STAŁE
──────────────────────────────────────────────────────── */
const CARD_W  = 332;
const GAP     = 32;
const STEP    = CARD_W + GAP;   // 364 px

const DROP_SM = Math.round(424 * 0.10);  // 42 px  (karty 3 i 5)
const DROP_LG = Math.round(424 * 0.20);  // 85 px  (karta 4 – video)

/* ────────────────────────────────────────────────────────
   OPACITY
   syncCardOpacities  — chowa karty wychodzące poza krawędź (stan K1)
   revealEnteringCards — pokazuje kartę, gdy tylko jej krawędź wejdzie
                         w viewport; nie chowa wychodzących
──────────────────────────────────────────────────────── */
function syncCardOpacities() {
    const vw = window.innerWidth;
    cards.forEach(card => {
        const r = card.getBoundingClientRect();
        gsap.set(card, { opacity: (r.left >= 0 && r.right <= vw) ? 1 : 0 });
    });
}

function revealEnteringCards() {
    const vw = window.innerWidth;
    cards.forEach(card => {
        const r = card.getBoundingClientRect();
        if (r.left < vw && r.right > 0) gsap.set(card, { opacity: 1 });
    });
}

/* podziel nagłówek na wyrazy — animacja słowo-po-słowie */
(function splitWords() {
    const h1    = headline.querySelector('.hero__h1');
    const lines = [['Dbamy', 'o', 'jakość'], ['i', 'długość', 'życia']];
    h1.innerHTML = lines
        .map(line => line.map(w => `<span class="hw">${w}</span>`).join(' '))
        .join('<br>');
    /* wyrazy startują niewidoczne */
    gsap.set('.hw', { opacity: 0, y: 14 });
    /* podkreślenie startuje zwinięte */
    gsap.set(headline.querySelector('.hero__underline'), { scaleX: 0 });
})();

/* ────────────────────────────────────────────────────────
   K1  pozycja startowa — karta 2 na środku
──────────────────────────────────────────────────────── */
function getInitialX() {
    return window.innerWidth / 2 - (2 * STEP + CARD_W / 2);
}
/* K2  pozycja docelowa — karta 4 (video) na środku */
function getFinalX() {
    return window.innerWidth / 2 - (videoIdx * STEP + CARD_W / 2);
}

gsap.set(strip, { x: getInitialX() });
syncCardOpacities();

/* ────────────────────────────────────────────────────────
   K1 → K2
──────────────────────────────────────────────────────── */
gsap.delayedCall(0.4, runPhase2);

function runPhase2() {
    const tl = gsap.timeline();

    /* 1. pasek jedzie w lewo — 2 s; karty wchodzące w viewport odkrywane od razu */
    tl.to(strip, { x: getFinalX(), duration: 2, ease: 'power2.inOut', onUpdate: revealEnteringCards });

    /* 2. po zatrzymaniu: pokaż nagłówek, opuść karty + jednoczesny fade-out kart bocznych */
    tl.call(() => {
        /* tylko karty ucięte przez krawędź viewport znikają równo z startem opadania */
        const vw = window.innerWidth;
        const cutCards = cards.filter(c => {
            const r = c.getBoundingClientRect();
            return r.left < 0 || r.right > vw;
        });
        gsap.to(cutCards, { opacity: 0, duration: 0.35, delay: 0.15, ease: 'power2.in' });

        const hero   = document.querySelector('.hero');
        const hr     = hero.getBoundingClientRect();
        const c3     = cards[3].getBoundingClientRect();
        const c5     = cards[5].getBoundingClientRect();

        /* szerokość nagłówka = od lewej karty 3 do prawej karty 5 */
        gsap.set(headline, {
            left:  c3.left - hr.left,
            width: c5.right - c3.left,
            right: 'auto',
            opacity: 1,
        });

        const hh       = headline.offsetHeight;
        const navBot   = document.querySelector('.nav').getBoundingClientRect().bottom - hr.top;
        const cardTop  = c3.top - hr.top;
        const midY     = (navBot + cardTop) / 2;
        gsap.set(headline, { top: midY - hh / 2 + 12 });

        /* ── animacja wyrazów ── */
        gsap.to('.hw', {
            opacity: 1,
            y: 0,
            duration: 0.45,
            stagger: 0.09,
            ease: 'power2.out',
        });

        /* ── podkreślenie rozszerza się po ostatnim wyrazie ── */
        gsap.to(headline.querySelector('.hero__underline'), {
            scaleX: 1,
            duration: 0.45,
            ease: 'power2.out',
            delay: 0.09 * 6 + 0.15,   // po ostatnim wyrazie + krótka pauza
            transformOrigin: 'center',
        });

        /* ── kafelki opadają delikatnie ── */
        gsap.to(cards[3], { y: DROP_SM, duration: 0.9, ease: 'power3.inOut', delay: 0.15 });
        gsap.to(cards[4], { y: DROP_LG, duration: 0.9, ease: 'power3.inOut', delay: 0.15 });
        gsap.to(cards[5], { y: DROP_SM, duration: 0.9, ease: 'power3.inOut', delay: 0.15 });

        /* ── po opadnięciu inicjuj K3 ── */
        gsap.delayedCall(1.1, runPhase3setup);
    });
}

/* ────────────────────────────────────────────────────────
   K3  fixed overlay rośnie do 100vw × 100vh,
       następnie 3 hasła pojawiają się kolejno przy scrollu
──────────────────────────────────────────────────────── */
function runPhase3setup() {
    const vw   = window.innerWidth;
    const vh   = window.innerHeight;
    const rect = videoCard.getBoundingClientRect();

    /* Przenieś nav do body — wyrywa go ze stacking context .hero,
       dzięki czemu z-index:600 bije overlay z-index:500 globalnie */
    const nav = document.querySelector('.nav');
    document.body.appendChild(nav);

    /* wydłuż wrapper — daje przestrzeń na rozwinięcie video + dwell na pełnym ekranie */
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
        /* zewnętrzna warstwa — full inset, centruje zawartość */
        const layer = document.createElement('div');
        Object.assign(layer.style, {
            position: 'absolute', inset: '0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: '0', pointerEvents: 'none',
        });

        /* węższy kontener na tekst */
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

    /* lekki offset startowy — float-in z dołu (pomijamy przy reduce-motion) */
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reducedMotion) {
        [layer1, layer2, layer3].forEach(l => gsap.set(l.firstElementChild, { y: 14 }));
    }

    /* ── time-based animacja haseł ────────────────────────── */
    let textsStarted = false;
    let textTl       = null;   /* referencja do aktywnego timeline — do ubicia przy scroll-back */

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

    /* ── ScrollTrigger ──────────────────────────────────────
       0.00 – 0.26   overlay rośnie do pełnego ekranu
       po 0.26       hasła pojawiają się automatycznie (time-based)
    ── */
    const mainTl = gsap.timeline({
        scrollTrigger: {
            trigger: '.hero-scroll-wrap',
            start:   'top top',
            end:     'bottom bottom',
            scrub:   0.8,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
                if (self.progress >= 0.5) {
                    nav.classList.add('nav--film');
                    if (!textsStarted) {
                        textsStarted = true;
                        startTextAnimations();
                    }
                } else {
                    nav.classList.remove('nav--film');
                    /* box skurczył się z powrotem — ukryj nagłówki i zresetuj */
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
            },
        },
    });

    /* powiększenie overlay — zajmuje pierwsze 50% scrollu */
    mainTl.to(overlay,
        { top: 0, left: 0, width: vw, height: vh, ease: 'none', duration: 0.5 }, 0);
    mainTl.to(cards.filter(c => c !== videoCard),
        { opacity: 0, ease: 'none', duration: 0.5 }, 0);
    mainTl.to(headline,
        { opacity: 0, ease: 'none', duration: 0.5 }, 0);

    /* pad timeline do 1.0 s */
    mainTl.to({}, { duration: 0.5 }, 0.5);
}

/* ────────────────────────────────────────────────────────
   PELION W LICZBACH — scroll carousel
   Satelita FIZYCZNIE porusza się do centrum:
   left/top/width/height (nie scale!) + fontSize.
   Brak pikselozy — tekst zawsze renderowany w docelowym
   rozmiarze bez skalowania bitmapowego.
──────────────────────────────────────────────────────── */
(function initLiczby() {
    if (!document.getElementById('lb-center')) return;

    /* Pozycja i rozmiar centrum */
    const C = { left: 357, top: 42, size: 437 };

    /* Dane satelitów: pozycja home i rozmiar */
    const sats = [
        { id: '#lb-ul', left: 97,  top: 32,  size: 240 },
        { id: '#lb-ll', left: 20,  top: 292, size: 196 },
        { id: '#lb-lr', left: 814, top: 32,  size: 240 },
        { id: '#lb-ur', left: 934, top: 292, size: 196 },
    ];

    /* Stan startowy */
    gsap.set('#lb-center', { opacity: 1, clearProps: 'transform' });
    sats.forEach(s => gsap.set(s.id, {
        clearProps: 'transform',
        opacity: 0.25,
        zIndex: 1,
    }));

    const D = 0.08; /* czas trwania przejścia (8 pp) */

    const lbTl = gsap.timeline({
        scrollTrigger: {
            trigger: '.liczby-wrap',
            start:   'top top',
            end:     'bottom bottom',
            scrub:   1,
            invalidateOnRefresh: true,
        },
    });

    /* lb-center znika gdy pierwszy satelita wchodzi */
    lbTl.to('#lb-center', { opacity: 0, duration: D }, 0.12);

    /* ── helper: satelita wskakuje do centrum i z powrotem ──
       Animuje layout (left/top/width/height) + fontSize tekstu.
       Nie używa transform:scale — zero pikselozy.
    */
    function jump(s, tIn, tOut) {
        const isMd = s.size === 240;

        /* ── wejście do centrum ── */
        lbTl.to(s.id, {
            left: C.left, top: C.top, width: C.size, height: C.size,
            opacity: 1, zIndex: 5,
            duration: D, ease: 'power2.inOut',
        }, tIn);
        /* powiększ font – bez skalowania */
        lbTl.to(`${s.id} .lb__num`,     { fontSize: isMd ? '56px' : '52px', duration: D }, tIn);
        lbTl.to(`${s.id} .lb__unit-sm`, { fontSize: '26px', duration: D }, tIn);
        lbTl.to(`${s.id} .lb__desc`,    { fontSize: '17px', duration: D }, tIn);

        if (tOut === null) return; /* ostatni satelita zostaje */

        /* ── powrót na orbitę ── */
        lbTl.to(s.id, {
            left: s.left, top: s.top, width: s.size, height: s.size,
            opacity: 0.25, zIndex: 1,
            duration: D, ease: 'power2.inOut',
        }, tOut);
        lbTl.to(`${s.id} .lb__num`,     { fontSize: '32px', duration: D }, tOut);
        lbTl.to(`${s.id} .lb__unit-sm`, { fontSize: '14px', duration: D }, tOut);
        lbTl.to(`${s.id} .lb__desc`,    { fontSize: '11px', duration: D }, tOut);
    }

    jump(sats[0], 0.12, 0.32);  /* lb-ul */
    jump(sats[1], 0.32, 0.52);  /* lb-ll */
    jump(sats[2], 0.52, 0.72);  /* lb-lr */
    jump(sats[3], 0.72, null);  /* lb-ur – pozostaje w centrum */
})();

/* ────────────────────────────────────────────────────────
   MARKI — bezszwowa pętla marquee
   Klonujemy zawartość każdego wiersza, animacja CSS przesuwa
   o dokładnie scrollWidth oryginału → zero skoku przy pętli.
──────────────────────────────────────────────────────── */
(function initMarquee() {
    document.querySelectorAll('.marki__row').forEach(row => {
        const toLeft = row.classList.contains('marki__row--left');

        /* 1. Sklonuj oryginalne elementy */
        Array.from(row.children).forEach(item => {
            const clone = item.cloneNode(true);
            clone.setAttribute('aria-hidden', 'true');
            row.appendChild(clone);
        });

        row.style.animation = 'none';

        requestAnimationFrame(() => {
            const halfW = row.scrollWidth / 2;
            const fromX = toLeft ? 0      : -halfW;
            const toX   = toLeft ? -halfW : 0;

            gsap.set(row, { x: fromX });

            let tween     = null;
            let isHovered = false;

            /* Normalizuje x do zakresu zapętlenia */
            function wrapX(x) {
                return -(((-x % halfW) + halfW) % halfW);
            }

            /* Uruchamia animację od currentX do końca cyklu, potem pełna pętla */
            function startTween(currentX) {
                if (tween) tween.kill();
                const dist = Math.abs(currentX - toX);
                const dur  = (dist / halfW) * 28;
                tween = gsap.to(row, {
                    x: toX, duration: dur, ease: 'none',
                    onComplete: () => {
                        gsap.set(row, { x: fromX });
                        tween = gsap.fromTo(row,
                            { x: fromX },
                            { x: toX, duration: 28, ease: 'none', repeat: -1 }
                        );
                        if (isHovered) tween.pause();
                    },
                });
            }

            startTween(fromX);

            const track = row.closest('.marki__track');
            track.style.cursor = 'grab';

            /* Hover */
            track.addEventListener('mouseenter', () => { isHovered = true;  tween && tween.pause(); });
            track.addEventListener('mouseleave', () => { isHovered = false; tween && tween.resume(); });

            /* Drag */
            let isDragging    = false;
            let dragStartX    = 0;
            let dragStartPosX = 0;

            track.addEventListener('mousedown', (e) => {
                isDragging    = true;
                dragStartX    = e.clientX;
                dragStartPosX = gsap.getProperty(row, 'x');
                tween && tween.pause();
                track.style.cursor        = 'grabbing';
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
                if (!isHovered) startTween(gsap.getProperty(row, 'x'));
            });
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
            /* Dodaj klasę spinning do każdego bąbla;
               po zakończeniu animacji (4.5 s) klasa nie jest usuwana —
               gradient zatrzymuje się w pozycji initial-value (0 deg). */
            bubbles.forEach(b => {
                b.classList.remove('lb2--spinning'); /* reset jeśli odpalono wcześniej */
                /* wymuszenie reflow żeby animacja mogła wystartować ponownie */
                void b.offsetWidth;
                b.classList.add('lb2--spinning');
            });
            observer.disconnect(); /* odpal tylko raz */
        });
    }, { threshold: 0.25 });

    observer.observe(section);
})();

/* ────────────────────────────────────────────────────────
   ACCORDION — sekcja "O nas"
──────────────────────────────────────────────────────── */
document.querySelectorAll('.onas__trigger').forEach(btn => {
    btn.addEventListener('click', () => {
        const item   = btn.closest('.onas__item');
        const isOpen = item.classList.contains('onas__item--open');

        document.querySelectorAll('.onas__item').forEach(i => i.classList.remove('onas__item--open'));

        if (!isOpen) {
            item.classList.add('onas__item--open');

            /* zamień zdjęcie */
            const photoIdx = item.dataset.photo;
            document.querySelectorAll('.onas__photo').forEach(img => {
                img.classList.toggle('onas__photo--active', img.dataset.photo === photoIdx);
            });
        }
    });
});

/* ────────────────────────────────────────────────────────
   CYTAT — scroll-reveal wyraz po wyrazie
   Dzieli tekst (w tym <strong>) na .pq-word spany w JS,
   następnie animuje color każdego słowa w kolejności
   czytania w oparciu o pozycję sekcji w viewport.
   Brak GSAP, pinowania, snappingu — efekt pasywny.
──────────────────────────────────────────────────────── */
(function initPqWordReveal() {
    const container = document.getElementById('pqText');
    if (!container) return;

    /* prefers-reduced-motion → CSS ustawia już ciemny kolor, JS nie rusza */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    /* ── 1. Owijanie węzłów tekstowych w .pq-word ─────── */
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

    /* ── 2. Obliczanie progresu sekcji w viewport ──────── */
    function calcProgress() {
        const rect = container.getBoundingClientRect();
        const vh   = window.innerHeight;
        /* 0: sekcja wchodzi od dołu → 1: góra sekcji przy 25% od góry ekranu */
        return Math.max(0, Math.min(1, (vh - rect.top) / (vh * 0.55)));
    }

    /* ── 3. Aktualizacja kolorów ───────────────────────── */
    function updateColors(progress) {
        words.forEach((word, i) => {
            /* każde słowo przechodzi przez 1.5 „szczeliny" — delikatne nakładanie */
            const wp = Math.max(0, Math.min(1, (progress * (N + 0.5) - i) / 1.5));
            /* interpolacja: #c8c8c8 (200,200,200) → #363639 (54,54,57) */
            const r  = Math.round(200 + (54  - 200) * wp);
            const g  = Math.round(200 + (54  - 200) * wp);
            const b  = Math.round(200 + (57  - 200) * wp);
            word.style.color = `rgb(${r},${g},${b})`;
        });
    }

    /* ── 4. Pętla rAF z lekkim wygładzeniem ───────────── */
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

    /* stan początkowy (np. odświeżenie w połowie strony) */
    current = calcProgress();
    updateColors(current);
})();
