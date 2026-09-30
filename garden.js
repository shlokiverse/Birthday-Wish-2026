/* =====================================================================
   GARDEN — shared background effects (see garden.css for the layer map)
   ---------------------------------------------------------------------
   Include on any page with:
       <link rel="stylesheet" href="garden.css">
       <script src="garden.js" defer></script>
   and (optionally) choose a starting mood on <body>:
       <body data-garden="intro">   intro | birthday | wishes | timeline |
                                    memories | letter | final
   Sections can switch the mood while scrolling:
       <section data-garden-section="letter"> ... </section>
   Public API:  Garden.setProfile('final')   Garden.burst()

   Performance notes
     - ONE <canvas> draws every petal/flower/heart/sparkle from pre-rendered
       sprites (no per-particle DOM nodes). Desktop ≤ ~50 particles, phones half.
     - Birds are at most 1–2 tiny SVG elements, animated with CSS only.
     - Paused while the tab is hidden; counts shrink automatically on slow devices.
     - Nothing here reads the mouse/touch position: effects are cursor-independent.
   ===================================================================== */
(function () {
    'use strict';

    if (window.Garden || !document.body) return;

    /* ------------------------------------------------------------------
       0. Small helpers
       ------------------------------------------------------------------ */
    var reduceMQ = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var reduce = !!(reduceMQ && reduceMQ.matches);

    function rnd(a, b) { return a + Math.random() * (b - a); }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
    function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
    function isMobile() { return window.innerWidth < 640; }

    // Seeded random so the SVG flower art is identical on every load
    function seeded(seed) {
        return function () {
            seed |= 0; seed = seed + 0x6D2B79F5 | 0;
            var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    /* ------------------------------------------------------------------
       1. Mood profiles — how dense each page/section feels (desktop counts;
          phones use about half). Same world everywhere, different density.
       ------------------------------------------------------------------ */
    var PROFILES = {
        //            petals flowers hearts sparkles flecks   bird gap (s)   max birds
        intro:    { petal: 7,  flower: 3, heart: 3, sparkle: 12, fleck: 0,  birdGap: [0, 0],   birdMax: 0 },
        birthday: { petal: 14, flower: 5, heart: 4, sparkle: 20, fleck: 0,  birdGap: [16, 28], birdMax: 1 },
        wishes:   { petal: 12, flower: 4, heart: 5, sparkle: 14, fleck: 0,  birdGap: [18, 32], birdMax: 1 },
        timeline: { petal: 9,  flower: 3, heart: 4, sparkle: 10, fleck: 0,  birdGap: [14, 26], birdMax: 2 },
        memories: { petal: 9,  flower: 3, heart: 4, sparkle: 10, fleck: 0,  birdGap: [12, 22], birdMax: 2 },
        letter:   { petal: 5,  flower: 2, heart: 3, sparkle: 10, fleck: 0,  birdGap: [26, 40], birdMax: 1 },
        final:    { petal: 15, flower: 6, heart: 6, sparkle: 22, fleck: 12, birdGap: [10, 18], birdMax: 2 }
    };
    var KINDS = ['petal', 'flower', 'heart', 'sparkle', 'fleck'];

    /* ------------------------------------------------------------------
       2. SVG art — flowers, leaves, corners, hills, meadow, bird
       ------------------------------------------------------------------ */
    var SPRITE =
        '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
        '<radialGradient id="fxPetalG" cx="50%" cy="62%" r="62%"><stop offset="0" stop-color="#fff6fa"/><stop offset=".55" stop-color="#ffd3e3"/><stop offset="1" stop-color="#f6a0c0"/></radialGradient>' +
        '<linearGradient id="fxLeafG" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#8db184"/><stop offset="1" stop-color="#bcd8ae"/></linearGradient>' +
        // five-petal blossom
        '<path id="fxP" d="M50 52C27 44 29 11 45 8Q50 13 55 8C71 11 73 44 50 52Z"/>' +
        '<symbol id="fx-blossom" viewBox="0 0 100 100"><g fill="url(#fxPetalG)" stroke="rgba(214,110,150,.38)" stroke-width=".8">' +
        '<use href="#fxP"/><use href="#fxP" transform="rotate(72 50 50)"/><use href="#fxP" transform="rotate(144 50 50)"/>' +
        '<use href="#fxP" transform="rotate(216 50 50)"/><use href="#fxP" transform="rotate(288 50 50)"/></g>' +
        '<circle cx="50" cy="50" r="6.5" fill="#f5d27a"/><g fill="#e2a944"><circle cx="47" cy="48" r="1.2"/><circle cx="53" cy="49" r="1.2"/><circle cx="50" cy="54" r="1.2"/></g></symbol>' +
        // daisy
        '<path id="fxD" d="M50 50C43 34 45 13 50 10C55 13 57 34 50 50Z"/>' +
        '<symbol id="fx-daisy" viewBox="0 0 100 100"><g fill="#fffaf3" stroke="#f0d6c2" stroke-width=".7">' +
        '<use href="#fxD"/><use href="#fxD" transform="rotate(45 50 50)"/><use href="#fxD" transform="rotate(90 50 50)"/><use href="#fxD" transform="rotate(135 50 50)"/>' +
        '<use href="#fxD" transform="rotate(180 50 50)"/><use href="#fxD" transform="rotate(225 50 50)"/><use href="#fxD" transform="rotate(270 50 50)"/><use href="#fxD" transform="rotate(315 50 50)"/></g>' +
        '<circle cx="50" cy="50" r="8" fill="#f2c765" stroke="#e5ae45" stroke-width="1"/></symbol>' +
        // bud
        '<symbol id="fx-bud" viewBox="0 0 40 60"><path d="M20 42V58" stroke="#86ad7f" stroke-width="2" fill="none"/>' +
        '<path d="M20 40C12 38 8 33 6 27M20 40C28 38 32 33 34 27" stroke="#86ad7f" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<path d="M20 4C8 16 8 34 20 42C32 34 32 16 20 4Z" fill="url(#fxPetalG)" stroke="rgba(214,110,150,.4)" stroke-width=".8"/></symbol>' +
        // leaf (points up, base at 20,80)
        '<symbol id="fx-leaf" viewBox="0 0 40 80"><path d="M20 80C3 60 3 24 20 2C37 24 37 60 20 80Z" fill="url(#fxLeafG)"/>' +
        '<path d="M20 78V12" stroke="rgba(255,255,255,.55)" stroke-width="1.2" fill="none"/></symbol>' +
        '</defs></svg>';

    // Sample a cubic Bézier: returns {x, y, a} (a = tangent angle in degrees)
    function bez(p, t) {
        var u = 1 - t;
        var x = u * u * u * p[0] + 3 * u * u * t * p[2] + 3 * u * t * t * p[4] + t * t * t * p[6];
        var y = u * u * u * p[1] + 3 * u * u * t * p[3] + 3 * u * t * t * p[5] + t * t * t * p[7];
        var dx = 3 * u * u * (p[2] - p[0]) + 6 * u * t * (p[4] - p[2]) + 3 * t * t * (p[6] - p[4]);
        var dy = 3 * u * u * (p[3] - p[1]) + 6 * u * t * (p[5] - p[3]) + 3 * t * t * (p[7] - p[5]);
        return { x: x, y: y, a: Math.atan2(dy, dx) * 180 / Math.PI };
    }

    // One flowering branch: stem + alternating leaves + flowers at chosen t values
    function branch(p, leafCount, leafSize, flowers, rand) {
        var s = '<path d="M' + p[0] + ' ' + p[1] + 'C' + p.slice(2).join(' ') +
            '" stroke="#93b58b" stroke-width="3" fill="none" stroke-linecap="round" opacity=".92"/>';
        var i, pt, side, rot, sc;
        for (i = 1; i <= leafCount; i++) {
            pt = bez(p, 0.08 + (i / (leafCount + 1)) * 0.86);
            side = i % 2 ? -1 : 1;
            rot = pt.a + 90 + side * (48 + rand() * 18);
            sc = leafSize * (0.8 + rand() * 0.4);
            s += '<use href="#fx-leaf" width="40" height="80" transform="translate(' + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1) +
                ') rotate(' + rot.toFixed(0) + ') scale(' + sc.toFixed(2) + ') translate(-20 -80)"/>';
        }
        flowers.forEach(function (f) {
            pt = bez(p, f[0]);
            var r = f[2] / 2;
            s += '<use href="#fx-' + f[1] + '" x="' + (pt.x - r).toFixed(1) + '" y="' + (pt.y - r).toFixed(1) + '" width="' + f[2] + '" height="' + f[2] + '"/>';
        });
        return s;
    }

    function cluster(variant) {
        var r = seeded(variant === 'A' ? 11 : 29), s = '';
        if (variant === 'A') {
            s += branch([-10, 34, 110, 22, 118, 190, 292, 282], 7, 0.62, [[0.3, 'blossom', 64], [0.58, 'daisy', 48], [0.94, 'blossom', 56]], r);
            s += branch([34, -12, 44, 80, 116, 92, 178, 124], 4, 0.5, [[0.55, 'daisy', 36], [0.98, 'bud', 34]], r);
            s += '<use href="#fx-blossom" x="8" y="84" width="30" height="30"/><use href="#fx-blossom" x="92" y="6" width="26" height="26"/>';
        } else {
            s += branch([-12, 70, 96, 40, 150, 126, 300, 118], 6, 0.6, [[0.34, 'daisy', 54], [0.66, 'blossom', 60], [0.97, 'daisy', 44]], r);
            s += branch([60, -10, 74, 84, 96, 150, 142, 250], 5, 0.5, [[0.5, 'blossom', 38], [0.96, 'bud', 36]], r);
            s += '<use href="#fx-daisy" x="4" y="10" width="28" height="28"/><use href="#fx-blossom" x="150" y="8" width="24" height="24"/>';
        }
        return '<svg viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + s + '</svg>';
    }

    function hillsSVG() {
        return '<svg class="bgfx-hills" viewBox="0 0 1200 200" preserveAspectRatio="none" aria-hidden="true">' +
            '<path d="M0 120C150 80 260 130 420 100S700 60 860 100 1080 130 1200 90V200H0Z" fill="#c4dcbb" opacity=".42"/>' +
            '<path d="M0 152C200 122 320 172 520 142S860 112 1000 146 1130 162 1200 142V200H0Z" fill="#aacfa5" opacity=".46"/></svg>';
    }

    // A row of tiny flowers on stems along the bottom edge (cropped, not squashed, on narrow screens)
    function meadowSVG() {
        var r = seeded(7), s = '', i, x, h, kind, size, sway;
        for (i = 0; i < 26; i++) {
            x = i * 48 + rnd0(r, -10, 14);
            h = 26 + r() * 46;
            s += '<path d="M' + x.toFixed(0) + ' 120Q' + (x + (r() * 14 - 7)).toFixed(0) + ' ' + (120 - h / 2).toFixed(0) + ' ' + (x + (r() * 10 - 5)).toFixed(0) + ' ' + (120 - h).toFixed(0) +
                '" stroke="#8fb387" stroke-width="2" fill="none" opacity=".75"/>';
            if (r() > 0.35) {
                s += '<use href="#fx-leaf" width="40" height="80" transform="translate(' + x.toFixed(0) + ' ' + (120 - h * 0.35).toFixed(0) + ') rotate(' + (r() > 0.5 ? 50 : -50) + ') scale(.32) translate(-20 -80)" opacity=".85"/>';
            }
            kind = i % 3 === 0 ? 'daisy' : (i % 3 === 1 ? 'blossom' : 'bud');
            size = kind === 'bud' ? 16 : 18 + r() * 10;
            s += '<use href="#fx-' + kind + '" x="' + (x - size / 2).toFixed(0) + '" y="' + (120 - h - size / (kind === 'bud' ? 1.1 : 2)).toFixed(0) + '" width="' + size.toFixed(0) + '" height="' + size.toFixed(0) + '" opacity=".88"/>';
        }
        return '<svg class="bgfx-meadow" viewBox="0 0 1240 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' + s + '</svg>';
    }
    function rnd0(r, a, b) { return a + r() * (b - a); }

    var BIRD_SVG =
        '<svg viewBox="0 0 40 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g fill="rgba(150,92,118,.62)">' +
        '<g class="bgfx-wing"><path d="M20 11C15 5 9 4 3 7C9 7 14 9 20 12Z"/><path d="M20 11C25 5 31 4 37 7C31 7 26 9 20 12Z"/></g>' +
        '<ellipse cx="20" cy="11.4" rx="3.2" ry="1.7"/></g></svg>';

    /* ------------------------------------------------------------------
       3. Build the layer (once, as the first child of <body>)
       ------------------------------------------------------------------ */
    var layer = document.createElement('div');
    layer.className = 'background-effects';
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML =
        SPRITE +
        '<div class="bgfx-sky"></div>' +
        '<div class="bgfx-clouds"><i></i><i></i><i></i></div>' +
        hillsSVG() + meadowSVG() +
        '<div class="bgfx-corner bgfx-tl">' + cluster('A') + '</div>' +
        '<div class="bgfx-corner bgfx-tr">' + cluster('B') + '</div>' +
        '<div class="bgfx-corner bgfx-bl">' + cluster('B') + '</div>' +
        '<div class="bgfx-corner bgfx-br">' + cluster('A') + '</div>' +
        '<canvas class="bgfx-canvas"></canvas>' +
        '<div class="bgfx-birds"></div>';
    document.body.insertBefore(layer, document.body.firstChild);

    var cvs = layer.querySelector('.bgfx-canvas');
    var ctx = cvs.getContext('2d');
    var birdsEl = layer.querySelector('.bgfx-birds');

    /* ------------------------------------------------------------------
       4. Canvas sizing
       ------------------------------------------------------------------ */
    var W = 0, H = 0, dpr = 1;

    function resize() {
        var w = window.innerWidth, h = window.innerHeight;
        // Ignore small height changes (mobile address-bar show/hide) to avoid churn
        if (cvs.width && w === W && Math.abs(h - H) < 140) return;
        W = w; H = h;
        dpr = Math.min(window.devicePixelRatio || 1, isMobile() ? 1.5 : 2);
        cvs.width = Math.round(W * dpr);
        cvs.height = Math.round(H * dpr);
        applyProfile();
    }

    /* ------------------------------------------------------------------
       5. Sprites — drawn once, then stamped by drawImage (very cheap)
       ------------------------------------------------------------------ */
    var SS = 2; // sprite supersampling
    function mk(w, h, draw) {
        var c = document.createElement('canvas');
        c.width = Math.ceil(w * SS); c.height = Math.ceil(h * SS);
        var g = c.getContext('2d');
        g.scale(SS, SS);
        draw(g, w, h);
        return c;
    }

    function petalSprite(t) {
        return mk(64, 96, function (g, w, h) {
            var gr = g.createRadialGradient(w * 0.5, h * 0.62, 2, w * 0.5, h * 0.55, h * 0.62);
            gr.addColorStop(0, t[0]); gr.addColorStop(0.6, t[1]); gr.addColorStop(1, t[2]);
            g.fillStyle = gr;
            g.beginPath();
            g.moveTo(w * 0.5, h * 0.98);
            g.bezierCurveTo(-w * 0.06, h * 0.76, w * 0.02, h * 0.14, w * 0.5, h * 0.02);
            g.bezierCurveTo(w * 0.98, h * 0.14, w * 1.06, h * 0.76, w * 0.5, h * 0.98);
            g.closePath(); g.fill();
            g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1.2;
            g.beginPath(); g.moveTo(w * 0.5, h * 0.9); g.lineTo(w * 0.5, h * 0.2); g.stroke();
        });
    }

    function flowerSprite(t) {
        return mk(100, 100, function (g) {
            var k;
            for (k = 0; k < 5; k++) {
                g.save(); g.translate(50, 50); g.rotate(k * 72 * Math.PI / 180);
                var gr = g.createRadialGradient(0, -20, 2, 0, -22, 26);
                gr.addColorStop(0, t[0]); gr.addColorStop(0.6, t[1]); gr.addColorStop(1, t[2]);
                g.fillStyle = gr; g.strokeStyle = 'rgba(214,110,150,.3)'; g.lineWidth = 0.8;
                g.beginPath(); g.moveTo(0, -2);
                g.bezierCurveTo(-24, -8, -22, -40, -5, -43);
                g.quadraticCurveTo(0, -37, 5, -43);
                g.bezierCurveTo(22, -40, 24, -8, 0, -2);
                g.fill(); g.stroke(); g.restore();
            }
            g.fillStyle = '#f5d27a'; g.beginPath(); g.arc(50, 50, 7, 0, 6.2832); g.fill();
        });
    }

    function heartSprite(col) {
        return mk(48, 44, function (g, w, h) {
            g.fillStyle = col;
            g.beginPath(); g.moveTo(w / 2, h * 0.94);
            g.bezierCurveTo(-w * 0.12, h * 0.56, w * 0.04, h * 0.0, w * 0.5, h * 0.3);
            g.bezierCurveTo(w * 0.96, h * 0.0, w * 1.12, h * 0.56, w / 2, h * 0.94);
            g.closePath(); g.fill();
            g.fillStyle = 'rgba(255,255,255,.35)';
            g.beginPath(); g.ellipse(w * 0.3, h * 0.28, w * 0.09, h * 0.06, -0.6, 0, 6.2832); g.fill();
        });
    }

    function sparkleSprite(col) {
        return mk(40, 40, function (g) {
            var gr = g.createRadialGradient(20, 20, 0, 20, 20, 20);
            gr.addColorStop(0, col); gr.addColorStop(0.2, col); gr.addColorStop(1, 'rgba(255,255,255,0)');
            g.globalAlpha = 0.35; g.fillStyle = gr; g.beginPath(); g.arc(20, 20, 20, 0, 6.2832); g.fill();
            g.globalAlpha = 1; g.fillStyle = col;
            g.beginPath(); g.moveTo(20, 2);
            g.quadraticCurveTo(21.5, 18.5, 38, 20);
            g.quadraticCurveTo(21.5, 21.5, 20, 38);
            g.quadraticCurveTo(18.5, 21.5, 2, 20);
            g.quadraticCurveTo(18.5, 18.5, 20, 2);
            g.fill();
        });
    }

    var SPR = {
        petal: [
            petalSprite(['#fff7fa', '#ffd6e5', '#f7a8c4']),
            petalSprite(['#fffafc', '#ffe6ef', '#f9bdd2']),
            petalSprite(['#fff1f4', '#ffc9d8', '#f08fb0']),
            petalSprite(['#fff9f0', '#ffe0d0', '#f5b8a0'])
        ],
        flower: [
            flowerSprite(['#fff6fa', '#ffd3e3', '#f6a0c0']),
            flowerSprite(['#ffffff', '#fff0f5', '#f8cfe0']),
            flowerSprite(['#fff8ee', '#ffe1d2', '#f6b9a2'])
        ],
        // hearts: pink / blush / rose / light red only
        heart: [heartSprite('#ff9fb8'), heartSprite('#ffc0d0'), heartSprite('#ff7f9f'), heartSprite('#ff6b8a')],
        sparkle: [sparkleSprite('#ffe08a'), sparkleSprite('#ffffff'), sparkleSprite('#ffd9e6')]
    };
    var FLECK_COLORS = ['#f3d489', '#ffb7cd', '#ffffff', '#f58aa9'];

    /* ------------------------------------------------------------------
       6. Particles
       ------------------------------------------------------------------ */
    var parts = { petal: [], flower: [], heart: [], sparkle: [], fleck: [] };
    var target = { petal: 0, flower: 0, heart: 0, sparkle: 0, fleck: 0 };
    var current = 'intro';
    var perfScale = 1;      // shrinks automatically on slow devices
    var wind = 0;

    function speedF() { return reduce ? 0.3 : 1; }

    function make(kind, initial) {
        var p = { k: kind, t: rnd(0, 20), ph: rnd(0, 6.28), f: rnd(0.4, 0.9), sp: pick(SPR[kind] || [0]) };
        reseed(p, initial);
        return p;
    }

    function reseed(p, initial) {
        var k = p.k;
        p.x0 = rnd(-20, W + 20);
        p.dx = rnd(-6, 10);
        if (k === 'petal') {
            p.w = rnd(11, 22); p.h = p.w * 1.5;
            p.vy = rnd(24, 50); p.amp = rnd(18, 42); p.vr = rnd(-1.5, 1.5); p.a = rnd(0.5, 0.85);
            p.r = rnd(0, 6.28); p.tumble = rnd(1, 2.2);
            p.y = initial ? rnd(-p.h, H) : -p.h * 1.5;
        } else if (k === 'flower') {
            p.w = rnd(22, 40); p.h = p.w;
            p.vy = rnd(14, 28); p.amp = rnd(20, 38); p.vr = rnd(-0.5, 0.5); p.a = rnd(0.55, 0.85);
            p.r = rnd(0, 6.28); p.tumble = 0;
            p.y = initial ? rnd(-p.h, H) : -p.h * 1.5;
        } else if (k === 'heart') {
            p.w = rnd(10, 20); p.h = p.w * 0.92;
            p.vy = -rnd(22, 44); p.amp = rnd(14, 30); p.vr = 0; p.a = rnd(0.35, 0.62);
            p.r = 0; p.tumble = 0;
            p.y = initial ? rnd(0, H) : H + p.h * 1.5;
        } else if (k === 'fleck') {
            p.w = rnd(4, 7); p.h = rnd(2, 3.2); p.col = pick(FLECK_COLORS);
            p.vy = rnd(46, 90); p.amp = rnd(8, 22); p.vr = rnd(-5, 5); p.a = rnd(0.6, 0.9);
            p.r = rnd(0, 6.28); p.tumble = rnd(2, 4);
            p.y = initial ? rnd(-10, H) : -10;
        } else { // sparkle: fixed spot, twinkles then moves
            p.w = rnd(7, 15); p.h = p.w; p.a = rnd(0.55, 0.95);
            p.life = rnd(2.6, 5.4); p.t = initial ? rnd(0, p.life) : 0;
            p.x = rnd(0, W); p.y = rnd(0, H); p.r = rnd(0, 0.8); p.vr = rnd(-0.25, 0.25);
        }
    }

    function applyProfile() {
        var pr = PROFILES[current] || PROFILES.intro;
        var scale = (isMobile() ? 0.5 : 1) * perfScale * (reduce ? 0.4 : 1);
        KINDS.forEach(function (k) {
            target[k] = pr[k] ? Math.max(1, Math.round(pr[k] * scale)) : 0;
        });
    }

    function fill(initial) {
        KINDS.forEach(function (k) {
            var list = parts[k];
            // add gradually after the first fill so a mood change feels like a breeze, not a pop
            if (list.length < target[k]) {
                list.push(make(k, initial));
            }
        });
    }

    function draw(p, alpha) {
        var c = Math.cos(p.r), s = Math.sin(p.r);
        var sx = p.tumble ? (0.35 + 0.65 * Math.abs(Math.cos(p.t * p.tumble))) : 1;
        ctx.globalAlpha = alpha;
        ctx.setTransform(c * sx * dpr, s * sx * dpr, -s * dpr, c * dpr, p.x * dpr, p.y * dpr);
        if (p.k === 'fleck') {
            ctx.fillStyle = p.col;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        } else {
            ctx.drawImage(p.sp, -p.w / 2, -p.h / 2, p.w, p.h);
        }
    }

    function stepAll(dt, time) {
        var sf = speedF(), k, list, i, p, a, fadeIn, fadeOut;
        wind = Math.sin(time * 0.00012) * 6;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, cvs.width, cvs.height);

        for (var ki = 0; ki < KINDS.length; ki++) {
            k = KINDS[ki]; list = parts[k];
            for (i = list.length - 1; i >= 0; i--) {
                p = list[i];
                p.t += dt;

                if (k === 'sparkle') {
                    if (p.t >= p.life) {
                        if (list.length > target.sparkle) { list.splice(i, 1); continue; }
                        reseed(p, false);
                    }
                    p.r += p.vr * dt * sf;
                    a = Math.pow(Math.sin(Math.PI * (p.t / p.life)), 1.6) * p.a;
                    var pulse = 0.7 + 0.3 * Math.sin(p.t * 3 + p.ph);
                    var w0 = p.w;
                    p.w = w0 * pulse; p.h = p.w;
                    draw(p, a);
                    p.w = w0; p.h = w0;
                    continue;
                }

                p.y += p.vy * dt * sf;
                p.x0 += (p.dx + wind) * dt * sf;
                p.x = p.x0 + Math.sin(p.t * p.f + p.ph) * p.amp * (reduce ? 0.4 : 1);
                if (k === 'heart') {
                    p.r = Math.sin(p.t * p.f * 1.3 + p.ph) * 0.3;   // gentle tilt as it drifts
                } else {
                    p.r += p.vr * dt * sf;
                }

                if (p.vy > 0) {                       // falling: fade in at top, out near bottom
                    fadeIn = clamp((p.y + p.h) / (H * 0.12), 0, 1);
                    fadeOut = clamp((H - p.y) / (H * 0.16), 0, 1);
                    if (p.y > H + p.h) {
                        if (list.length > target[k]) { list.splice(i, 1); } else { reseed(p, false); }
                        continue;
                    }
                } else {                              // rising hearts: fade in from bottom, vanish near top
                    fadeIn = clamp((H - p.y) / (H * 0.14), 0, 1);
                    fadeOut = clamp(p.y / (H * 0.3), 0, 1);
                    if (p.y < -p.h) {
                        if (list.length > target[k]) { list.splice(i, 1); } else { reseed(p, false); }
                        continue;
                    }
                }
                draw(p, p.a * fadeIn * fadeOut);
            }
        }
        ctx.globalAlpha = 1;
    }

    /* ------------------------------------------------------------------
       7. Main loop (paused when the tab is hidden; self-throttles if slow)
       ------------------------------------------------------------------ */
    var raf = 0, last = 0, slow = 0, spawnClock = 0;

    function frame(now) {
        raf = requestAnimationFrame(frame);
        var dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        if (dt <= 0) return;

        // adaptive quality: if frames stay slow, thin the crowd (twice at most)
        if (dt > 0.034) { slow++; } else if (slow > 0) { slow--; }
        if (slow > 50 && perfScale > 0.45) { perfScale *= 0.7; slow = 0; applyProfile(); }

        // add new particles gradually (one of each kind about every 0.25s)
        spawnClock += dt;
        if (spawnClock > 0.25) { spawnClock = 0; fill(false); }

        stepAll(dt, now);
    }

    function start() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) { stop(); } else { start(); }
    });

    var resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 150);
    });

    if (reduceMQ && reduceMQ.addEventListener) {
        reduceMQ.addEventListener('change', function (e) { reduce = e.matches; applyProfile(); });
    }

    /* ------------------------------------------------------------------
       8. Birds — a few slow silhouettes crossing behind the content
       ------------------------------------------------------------------ */
    var birdTimer = 0, activeBirds = 0;

    function spawnBird() {
        var pr = PROFILES[current] || PROFILES.intro;
        var maxB = isMobile() ? Math.min(1, pr.birdMax) : pr.birdMax;
        if (reduce || document.hidden || !maxB || activeBirds >= maxB) return;

        var el = document.createElement('div');
        var size = isMobile() ? rnd(20, 28) : rnd(26, 40);
        el.className = 'bgfx-bird' + (Math.random() < 0.4 ? ' rtl' : '');
        el.style.top = Math.round(H * rnd(0.1, 0.5)) + 'px';
        el.style.width = size + 'px';
        el.style.height = (size / 2) + 'px';
        el.style.animationDuration = rnd(30, 46) + 's';
        el.innerHTML = BIRD_SVG;
        birdsEl.appendChild(el);
        activeBirds++;
        el.addEventListener('animationend', function (e) {
            if (e.target !== el) return;          // ignore the inner wing/bob animations
            el.remove(); activeBirds--;
        });
    }

    function scheduleBird(first) {
        clearTimeout(birdTimer);
        var pr = PROFILES[current] || PROFILES.intro;
        var gap = pr.birdGap;
        var wait = (!gap[1]) ? 6000 : (first ? rnd(4000, 8000) : rnd(gap[0], gap[1]) * 1000 * (isMobile() ? 1.4 : 1));
        birdTimer = setTimeout(function () { spawnBird(); scheduleBird(false); }, wait);
    }

    /* ------------------------------------------------------------------
       9. Public API + section-aware mood
       ------------------------------------------------------------------ */
    function setProfile(name) {
        if (!PROFILES[name] || name === current) return;
        var hadBirds = PROFILES[current].birdMax;
        current = name;
        applyProfile();
        if (!hadBirds && PROFILES[name].birdMax) scheduleBird(true);
    }

    // A small celebratory shower (used by the "Celebrate!" button)
    function burst() {
        var i;
        for (i = 0; i < (isMobile() ? 10 : 20); i++) { var p = make(i % 3 ? 'petal' : 'fleck', false); p.y = -rnd(0, H * 0.4); parts[p.k].push(p); }
        for (i = 0; i < (isMobile() ? 3 : 6); i++) { var h = make('heart', false); h.y = H + rnd(0, H * 0.3); parts.heart.push(h); }
    }

    window.Garden = { setProfile: setProfile, burst: burst, profile: function () { return current; } };

    // Sections may declare a mood: <section data-garden-section="letter">
    function watchSections() {
        var secs = document.querySelectorAll('[data-garden-section]');
        if (!secs.length || !('IntersectionObserver' in window)) return;
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) setProfile(e.target.getAttribute('data-garden-section'));
            });
        }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
        Array.prototype.forEach.call(secs, function (s) { io.observe(s); });
    }

    /* ------------------------------------------------------------------
       10. Go
       ------------------------------------------------------------------ */
    var initial = document.body.getAttribute('data-garden');
    if (initial && PROFILES[initial]) current = initial;

    resize();                       // sizes canvas + sets target counts
    var n;
    for (n = 0; n < 60; n++) fill(true);   // pre-populate so the first frame already looks alive
    start();
    scheduleBird(true);
    watchSections();
})();
