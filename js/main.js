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
   STAŁE
──────────────────────────────────────────────────────── */
const CARD_W  = 332;
const GAP     = 32;
const STEP    = CARD_W + GAP;   // 364 px

const DROP_SM = Math.round(424 * 0.10);  // 42 px  (karty 3 i 5)
const DROP_LG = Math.round(424 * 0.20);  // 85 px  (karta 4 – video)

/* ────────────────────────────────────────────────────────
   ELEMENTY
──────────────────────────────────────────────────────── */
const strip     = document.getElementById('heroStrip');
const headline  = document.getElementById('heroHeadline');
const videoCard = document.getElementById('videoCard');
const cards     = Array.from(strip.querySelectorAll('.card'));
const videoIdx  = cards.indexOf(videoCard); // 4

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

/* ────────────────────────────────────────────────────────
   K1 → K2
──────────────────────────────────────────────────────── */
gsap.delayedCall(0.4, runPhase2);

function runPhase2() {
    const tl = gsap.timeline();

    /* 1. pasek jedzie w lewo — 2 s */
    tl.to(strip, { x: getFinalX(), duration: 2, ease: 'power2.inOut' });

    /* 2. po zatrzymaniu: pokaż nagłówek, opuść karty */
    tl.call(() => {
        const hero   = document.querySelector('.hero');
        const hr     = hero.getBoundingClientRect();
        const c3     = cards[3].getBoundingClientRect();
        const c5     = cards[5].getBoundingClientRect();

        /* szerokość nagłówka = od lewej karty 3 do prawej karty 5 */
        gsap.set(headline, {
            left:  c3.left - hr.left,
            width: c5.right - c3.left,
            right: 'auto',
            opacity: 1,              // wrapper widoczny, wyrazy jeszcze ukryte
        });

        /* nagłówek wyśrodkowany między dolną krawędzią nav a górną krawędzią kart,
           z lekkim obniżeniem (+12 px) */
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

    /* wydłuż wrapper — daje przestrzeń na 3 hasła */
    document.querySelector('.hero-scroll-wrap').style.height = '310vh';

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

    document.body.appendChild(overlay);
    gsap.set(videoCard, { opacity: 0 });

    /* ── ScrollTrigger ──────────────────────────────────────
       Każde przejście ma jawny duration (0.04 s) żeby tweeny
       nie nakładały się na siebie (domyślne 0.5 s powodowało
       nakładanie liter).

       Oś czasu — hasła dłużej widoczne, krótki ogon po hasle 3:
         0.00 – 0.26   overlay rośnie do pełnego ekranu
         0.28 – 0.32   hasło 1 fade-in
         0.32 – 0.54   hasło 1 widoczne   (dłużej)
         0.54 – 0.58   hasło 1 fade-out
         0.60 – 0.64   hasło 2 fade-in
         0.64 – 0.84   hasło 2 widoczne   (dłużej)
         0.84 – 0.88   hasło 2 fade-out
         0.90 – 0.94   hasło 3 fade-in    ← pojawia się blisko końca
         0.94 – …      hasło 3 widoczne (krótki ogon ~20 vh)
    ── */
    const mainTl = gsap.timeline({
        scrollTrigger: {
            trigger: '.hero-scroll-wrap',
            start:   'top top',
            end:     'bottom bottom',
            scrub:   0.8,
            invalidateOnRefresh: true,
            /* Gdy hero odpina się od góry, konwertuj overlay z fixed → absolute
               w bieżącej pozycji scrollu. Overlay przestaje "wisieć" na ekranie
               i scrolluje naturalnie razem ze stroną — bez białego ekranu,
               bez nachodzenia na sekcję niżej. */
            onUpdate: (self) => {
                /* dokładnie gdy overlay wypełnia ekran (progress 0.26) */
                if (self.progress >= 0.26) {
                    nav.classList.add('nav--film');
                } else {
                    nav.classList.remove('nav--film');
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

    /* powiększenie overlay */
    mainTl.to(overlay,
        { top: 0, left: 0, width: vw, height: vh, ease: 'none', duration: 0.26 }, 0);
    mainTl.to(cards.filter(c => c !== videoCard),
        { opacity: 0, ease: 'none', duration: 0.26 }, 0);
    mainTl.to(headline,
        { opacity: 0, ease: 'none', duration: 0.26 }, 0);

    /* ── hasła — crossfade 0.06 s, zakładka 0.01 s między out a in ──
         hasło 1:  in 0.28–0.34 │ visible 0.34–0.53 │ out 0.53–0.59
         hasło 2:  in 0.58–0.64 │ visible 0.64–0.81 │ out 0.81–0.87
         hasło 3:  in 0.86–0.92 │ visible do końca
    ── */

    /* hasło 1 */
    mainTl.to(layer1, { opacity: 1, ease: 'power1.out', duration: 0.06 }, 0.28);
    mainTl.to(layer1, { opacity: 0, ease: 'power1.in',  duration: 0.06 }, 0.53);

    /* hasło 2 — start 0.01 przed końcem fade-out hasła 1 → miękki dissolve */
    mainTl.to(layer2, { opacity: 1, ease: 'power1.out', duration: 0.06 }, 0.58);
    mainTl.to(layer2, { opacity: 0, ease: 'power1.in',  duration: 0.06 }, 0.81);

    /* hasło 3 */
    mainTl.to(layer3, { opacity: 1, ease: 'power1.out', duration: 0.06 }, 0.86);
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
