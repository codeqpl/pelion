/* ═══════════════════════════════════════════════════════════
   SPRZEDAŻ DETALICZNA
   Karta najbliżej środka ekranu podświetla swój kafelek z logo
   w sticky kolumnie; klik w kafelek przewija do jego karty.
═══════════════════════════════════════════════════════════ */
(function () {
    const cards = Array.from(document.querySelectorAll('.sd-card'));
    const logos = Array.from(document.querySelectorAll('.sd__logo'));
    if (!cards.length) return;

    let current = -1;

    function setActive(index) {
        if (index === current) return;
        current = index;
        logos.forEach(logo => {
            logo.classList.toggle('is-active', Number(logo.dataset.card) === index);
        });
    }

    function update() {
        const mid = window.innerHeight / 2;
        let best = 0;
        let bestDist = Infinity;
        cards.forEach((card, i) => {
            const r = card.getBoundingClientRect();
            const dist = r.top <= mid && r.bottom >= mid ? 0 : Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid));
            if (dist < bestDist) { bestDist = dist; best = i; }
        });
        setActive(best);
    }

    logos.forEach(logo => {
        logo.addEventListener('click', () => {
            const card = cards[Number(logo.dataset.card)];
            if (!card) return;
            const navH = document.querySelector('.nav').offsetHeight;
            const top = card.getBoundingClientRect().top + window.scrollY - navH - 16;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
})();
