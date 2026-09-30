/* Keeps the song continuing (instead of restarting) when moving between pages.
   Purely additive: the pages' own music buttons/logic are untouched. */
(function () {
    'use strict';
    var a = document.getElementById('bgMusic');
    if (!a) return;
    var KEY = 'musicTime';
    function restore() {
        try {
            var t = parseFloat(sessionStorage.getItem(KEY));
            if (t > 0 && isFinite(t) && localStorage.getItem('musicPlaying') === 'true') a.currentTime = t;
        } catch (e) {}
    }
    if (a.readyState > 0) restore(); else a.addEventListener('loadedmetadata', restore, { once: true });
    function save() { try { sessionStorage.setItem(KEY, String(a.currentTime || 0)); } catch (e) {} }
    a.addEventListener('timeupdate', save);
    window.addEventListener('pagehide', save);
})();
