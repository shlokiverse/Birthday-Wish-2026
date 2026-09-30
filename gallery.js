/* =====================================================================
   GALLERY — behaviour for memories.html
     1. Scroll reveal (staggered) for polaroids and letter lines
     2. Subtle column parallax on desktop
     3. "Centred" tilt-correction on phones
     4. Lightbox (tap/click a photo; ← → Esc; swipe; focus is restored)
   Nothing here follows the cursor.
   ===================================================================== */
(function () {
    'use strict';

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var wraps = Array.prototype.slice.call(document.querySelectorAll('.polaroid-wrap'));
    var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

    /* ---------- 1. Reveal ---------- */
    function showAll() { wraps.concat(reveals).forEach(function (el) { el.classList.add('in'); }); }

    if (!('IntersectionObserver' in window)) {
        showAll();
    } else {
        var io = new IntersectionObserver(function (entries) {
            var batch = 0;
            entries.forEach(function (e) {
                if (!e.isIntersecting) return;
                e.target.style.setProperty('--d', (reduce ? 0 : batch * 0.12) + 's');   // stagger within a batch
                e.target.classList.add('in');
                io.unobserve(e.target);
                batch++;
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
        wraps.concat(reveals).forEach(function (el) { io.observe(el); });
    }

    /* ---------- 2. Parallax (desktop only) ---------- */
    var cols = Array.prototype.slice.call(document.querySelectorAll('.memory-col'));
    var factors = [-0.05, 0.035, -0.025];
    var desktopMQ = window.matchMedia('(min-width: 900px)');
    var ticking = false;

    function parallax() {
        ticking = false;
        var mid = window.innerHeight / 2;
        cols.forEach(function (col, i) {
            if (!desktopMQ.matches || reduce) { col.style.removeProperty('--par'); return; }
            var r = col.getBoundingClientRect();
            if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
            var off = ((r.top + r.height / 2) - mid) * (factors[i] || 0);
            col.style.setProperty('--par', Math.max(-28, Math.min(28, off)).toFixed(1) + 'px');
        });
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(parallax); } }
    if (!reduce) {
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        parallax();
    }

    /* ---------- 3. Centred tilt-correction (phones/tablets) ---------- */
    if ('IntersectionObserver' in window && !reduce) {
        var mid = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                var card = e.target.querySelector('.polaroid');
                if (card) card.classList.toggle('is-centered', e.isIntersecting && !desktopMQ.matches);
            });
        }, { rootMargin: '-38% 0px -38% 0px', threshold: 0 });
        wraps.forEach(function (w) { mid.observe(w); });
    }

    /* ---------- 4. Lightbox ---------- */
    var items = wraps.slice().sort(function (a, b) {
        return (+a.style.getPropertyValue('--o') || 0) - (+b.style.getPropertyValue('--o') || 0);
    }).map(function (w) {
        var img = w.querySelector('img');
        return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt') || '',
            title: (w.querySelector('.memory-date') || {}).textContent || '',
            text: (w.querySelector('.memory-caption') || {}).textContent || '',
            card: w.querySelector('.polaroid')
        };
    });

    var lb = document.createElement('div');
    lb.className = 'lb';
    lb.hidden = true;
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Photo viewer');
    lb.innerHTML =
        '<button type="button" class="lb-btn lb-close" aria-label="Close">&times;</button>' +
        '<button type="button" class="lb-btn lb-prev" aria-label="Previous photo">&#8249;</button>' +
        '<figure class="lb-fig"><img class="lb-img" alt=""><figcaption><strong class="lb-title"></strong><span class="lb-text"></span></figcaption></figure>' +
        '<button type="button" class="lb-btn lb-next" aria-label="Next photo">&#8250;</button>';
    document.body.appendChild(lb);

    var st = document.createElement('style');
    st.textContent =
        '.lb{position:fixed;top:0;left:0;right:0;bottom:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(58,24,40,.82);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);opacity:0;transition:opacity .3s ease;padding:12px}' +
        '.lb[hidden]{display:none}.lb.open{opacity:1}' +
        '.lb-fig{margin:0;max-width:min(92vw,760px);max-height:94vh;display:flex;flex-direction:column;align-items:center;background:#fffdf9;padding:10px 10px 0;border-radius:8px;box-shadow:0 24px 60px rgba(0,0,0,.45)}' +
        '.lb-img{display:block;max-width:100%;max-height:calc(94vh - 130px);width:auto;height:auto;border-radius:4px;object-fit:contain}' +
        '.lb-fig figcaption{padding:10px 8px 14px;text-align:center;max-width:520px}' +
        '.lb-title{display:block;font-family:"Dancing Script",cursive;font-size:1.5rem;color:#c2417a;margin-bottom:.2rem;font-weight:700}' +
        '.lb-text{display:block;font-size:.9rem;line-height:1.5;color:#6a5560}' +
        '.lb-btn{position:absolute;width:46px;height:46px;border:0;border-radius:50%;background:rgba(255,255,255,.92);color:#c2417a;font-size:1.9rem;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,.25);z-index:2}' +
        '.lb-btn:focus-visible{outline:3px solid #ff69b4;outline-offset:2px}' +
        '.lb-close{top:14px;right:14px}.lb-prev{left:10px;top:50%;margin-top:-23px}.lb-next{right:10px;top:50%;margin-top:-23px}' +
        '@media (max-width:600px){.lb-prev{top:auto;bottom:12px;left:14px;margin:0}.lb-next{top:auto;bottom:12px;right:14px;margin:0}.lb-img{max-height:calc(94vh - 190px)}}';
    document.head.appendChild(st);

    var idx = 0, lastFocus = null;
    var imgEl = lb.querySelector('.lb-img');

    function show(i) {
        idx = (i + items.length) % items.length;
        var it = items[idx];
        imgEl.src = it.src;
        imgEl.alt = it.alt;
        lb.querySelector('.lb-title').textContent = it.title;
        lb.querySelector('.lb-text').textContent = it.text;
    }
    function open(i) {
        lastFocus = document.activeElement;
        show(i);
        lb.hidden = false;
        requestAnimationFrame(function () { lb.classList.add('open'); });
        document.body.style.overflow = 'hidden';
        lb.querySelector('.lb-close').focus();
    }
    function close() {
        lb.classList.remove('open');
        setTimeout(function () { lb.hidden = true; }, 250);
        document.body.style.overflow = '';
        if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    items.forEach(function (it, i) {
        it.card.addEventListener('click', function () { open(i); });
        it.card.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); }
        });
    });

    lb.querySelector('.lb-close').addEventListener('click', close);
    lb.querySelector('.lb-prev').addEventListener('click', function () { show(idx - 1); });
    lb.querySelector('.lb-next').addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
        if (lb.hidden) return;
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowLeft') show(idx - 1);
        else if (e.key === 'ArrowRight') show(idx + 1);
        else if (e.key === 'Tab') {                       // keep focus inside the viewer
            var f = lb.querySelectorAll('button');
            var first = f[0], lastB = f[f.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastB.focus(); }
            else if (!e.shiftKey && document.activeElement === lastB) { e.preventDefault(); first.focus(); }
        }
    });

    var sx = 0;
    lb.addEventListener('touchstart', function (e) { sx = e.changedTouches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
        var dx = e.changedTouches[0].clientX - sx;
        if (Math.abs(dx) > 55) show(idx + (dx < 0 ? 1 : -1));
    }, { passive: true });
})();
