
const Player = (() => {
    let actual = null, cola = [], idx = 0;

    function ytId(url) {
        if (!url) return null;
        const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/\s]+)/);
        return m ? m[1] : null;
    }

    function updateUI() {
        if (!actual) return;
        const s = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
        s('player-title', actual.titulo || '—');
        s('player-artist', actual.artista || '—');
        s('player-duration', actual.duracion || '—');
        s('now-title', actual.titulo || '—');
        s('now-artist', actual.artista || '—');

        const setCover = (id, portada) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.innerHTML = portada
                ? `<img src="${portada}" class="w-full h-full object-cover">`
                : '<span class="material-symbols-outlined text-text-muted text-5xl opacity-30">music_note</span>';
        };
        setCover('player-cover-wrap', actual.portada);
        setCover('now-cover-wrap', actual.portada);
        updateLikes();
    }

    function updateLikes() {
        try {
            const u = DB.getUsuarioActual();
            if (!u || !actual) return;
            const liked = DB.tienelike(u.id, actual.id);
            ['player-like-icon', 'player-bar-like'].forEach(id => {
                const el = document.getElementById(id);
                if (!el) return;
                el.textContent = liked ? 'favorite' : 'favorite_border';
                el.style.color = liked ? 'var(--color-primary)' : '';
                el.style.fontVariationSettings = liked ? "'FILL' 1" : "'FILL' 0";
            });
        } catch { }
    }

    function loadMedia() {
        if (!actual) return;
        const vid = ytId(actual.urlAudio);
        const isSC = actual.urlAudio?.includes('soundcloud.com');
        const container = document.getElementById('yt-container');
        if (!container) return;
        if (vid) {
            container.innerHTML = `<iframe width="100%" height="100%"
        src="https://www.youtube.com/embed/${vid}?autoplay=1&rel=0"
        frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
        } else if (isSC) {
            container.innerHTML = `<iframe width="100%" height="100%" scrolling="no" frameborder="no" allow="autoplay"
        src="https://w.soundcloud.com/player/?url=${encodeURIComponent(actual.urlAudio)}&auto_play=true&color=%237f0df2"></iframe>`;
        }
        document.getElementById('yt-panel')?.classList.remove('hidden');
        const lbl = document.getElementById('yt-toggle-label');
        if (lbl) lbl.textContent = 'Ocultar video';
        ['player-play-icon', 'now-play-icon'].forEach(id => { const e = document.getElementById(id); if (e) e.textContent = 'pause'; });
        // actualizar cola siguiente
        renderCola();
    }

    function renderCola() {
        const el = document.getElementById('cola-siguiente');
        if (!el) return;
        const siguientes = cola.slice(idx + 1, idx + 4);
        const canciones = DB.getCanciones();
        if (!siguientes.length) { el.innerHTML = '<p class="text-sm font-bold mb-3">Siguiente en cola</p><p class="text-xs text-text-muted">Fin de la cola</p>'; return; }
        el.innerHTML = '<p class="text-sm font-bold mb-3">Siguiente en cola</p>' + siguientes.map(sid => {
            const c = canciones.find(x => x.id === sid);
            if (!c) return '';
            return `<div class="flex items-center gap-3 cursor-pointer hover:bg-surface p-1.5 rounded-xl transition-colors" onclick="Player.reproducir('${c.id}',cola_global)">
        <div class="size-10 rounded-lg overflow-hidden bg-border flex items-center justify-center shrink-0">
          ${c.portada ? `<img src="${c.portada}" class="w-full h-full object-cover">` : '<span class="material-symbols-outlined text-text-muted text-sm">music_note</span>'}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-bold truncate">${c.titulo}</p>
          <p class="text-xs text-text-muted truncate">${c.artista}</p>
        </div>
      </div>`;
        }).join('');
    }

    return {
        reproducir(id, colaIds) {
            const canciones = DB.getCanciones();
            actual = canciones.find(c => c.id === id);
            cola = colaIds || canciones.map(c => c.id);
            idx = cola.indexOf(id);
            if (!actual) return;
            window.cola_global = cola;
            sessionStorage.setItem('sp_now', JSON.stringify(actual));
            updateUI();
            loadMedia();
        },
        siguiente() { if (!cola.length) return; idx = (idx + 1) % cola.length; this.reproducir(cola[idx], cola); },
        anterior() { if (!cola.length) return; idx = (idx - 1 + cola.length) % cola.length; this.reproducir(cola[idx], cola); },
        togglePlay() {
            const icons = ['player-play-icon', 'now-play-icon'];
            const playing = document.getElementById('player-play-icon')?.textContent === 'pause';
            icons.forEach(id => { const e = document.getElementById(id); if (e) e.textContent = playing ? 'play_arrow' : 'pause'; });
        },
        toggleLike() {
            try {
                const u = DB.getUsuarioActual();
                if (!u || !actual) return;
                DB.toggleLike(u.id, actual.id);
                updateLikes();
                // actualizar ícono en lista
                const btn = document.querySelector(`[data-like-id="${actual.id}"]`);
                if (btn) {
                    const liked2 = DB.tienelike(u.id, actual.id);
                    btn.querySelector('.material-symbols-outlined').textContent = liked2 ? 'favorite' : 'favorite_border';
                    btn.querySelector('.material-symbols-outlined').style.color = liked2 ? 'var(--color-primary)' : '';
                    btn.querySelector('.material-symbols-outlined').style.fontVariationSettings = liked2 ? "'FILL' 1" : "'FILL' 0";
                }
            } catch { }
        },
        getActual() { return actual; }
    };
})();

function toggleYT() {
    const panel = document.getElementById('yt-panel');
    const lbl = document.getElementById('yt-toggle-label');
    if (!panel) return;
    const hidden = panel.classList.toggle('hidden');
    if (lbl) lbl.textContent = hidden ? 'Mostrar video' : 'Ocultar video';
}

// ==========================================
// RENDER DB
// ==========================================
function renderCanciones() {
    const u = DB.getUsuarioActual();
    const canciones = DB.getCanciones();
    const el = document.getElementById('canciones-lista');
    if (!canciones.length) return;

    const colaIds = canciones.map(c => c.id);
    el.innerHTML = canciones.map((c, i) => {
        const liked = u ? DB.tienelike(u.id, c.id) : false;
        return `
    <div class="flex items-center p-3 rounded-xl hover:bg-surface transition-colors group cursor-pointer"
         onclick="Player.reproducir('${c.id}',${JSON.stringify(colaIds)})">
      <div class="w-8 text-center text-text-muted font-medium group-hover:hidden text-sm select-none">${String(i + 1).padStart(2, '0')}</div>
      <div class="w-8 text-center text-primary hidden group-hover:flex items-center justify-center">
        <span class="material-symbols-outlined text-base" style="font-variation-settings:'FILL' 1">play_arrow</span>
      </div>
      <div class="size-12 rounded-lg overflow-hidden ml-2 shrink-0 bg-surface border border-border flex items-center justify-center">
        ${c.portada ? `<img src="${c.portada}" class="w-full h-full object-cover" onerror="this.style.display='none'">` : '<span class="material-symbols-outlined text-text-muted text-sm">music_note</span>'}
      </div>
      <div class="ml-4 flex-1 min-w-0">
        <p class="font-bold text-sm truncate">${c.titulo}</p>
        <p class="text-xs text-text-muted truncate">${c.artista}</p>
      </div>
      <div class="flex-1 hidden md:block text-sm text-text-muted truncate px-2">${c.genero || '—'}</div>
      <div class="flex items-center gap-4 shrink-0">
        <button onclick="event.stopPropagation()" data-like-id="${c.id}"
          class="opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
          onclick="this.closest('[data-like-id]')">
          <span class="material-symbols-outlined text-xl ${liked ? 'text-primary' : 'text-text-muted'}"
            style="${liked ? `font-variation-settings:'FILL' 1` : ''}">favorite${liked ? '' : '_border'}</span>
        </button>
        <span class="text-xs text-text-muted font-medium">${c.duracion || '—'}</span>
        <span class="material-symbols-outlined text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">more_horiz</span>
      </div>
    </div>`;
    }).join('');

    // Delegación de eventos para likes
    el.addEventListener('click', e => {
        const btn = e.target.closest('[data-like-id]');
        if (!btn) return;
        e.stopPropagation();
        const id = btn.dataset.likeId;
        const u2 = DB.getUsuarioActual();
        if (!u2) return;
        const liked2 = DB.toggleLike(u2.id, id);
        const icon = btn.querySelector('.material-symbols-outlined');
        if (icon) {
            icon.textContent = liked2 ? 'favorite' : 'favorite_border';
            icon.style.color = liked2 ? 'var(--color-primary)' : '';
            icon.style.fontVariationSettings = liked2 ? "'FILL' 1" : "'FILL' 0";
        }
    }, { once: false });
}

function renderAlbumes() {
    const albums = DB.getAlbums();
    const el = document.getElementById('albums-grid');
    if (!albums.length) return;
    el.innerHTML = albums.map(a => `
    <div class="group cursor-pointer">
      <div class="relative aspect-square rounded-xl overflow-hidden bg-surface mb-3 shadow-sm border border-border">
        <div class="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110 flex items-center justify-center"
          ${a.portada ? `style="background-image:url('${a.portada}')"` : ''}>
          ${!a.portada ? '<span class="material-symbols-outlined text-text-muted text-4xl">album</span>' : ''}
        </div>
        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <span class="material-symbols-outlined text-white text-5xl opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-300">play_circle</span>
        </div>
      </div>
      <h3 class="text-text font-bold text-base leading-tight truncate">${a.titulo}</h3>
      <p class="text-text-muted text-sm">${a.artista}${a.año ? ' · ' + a.año : ''}</p>
    </div>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    const u = DB.getUsuarioActual();
    if (!u) { location.href = 'login-registro.html'; return; }

    if (u.rol === 'admin') {
        document.getElementById('admin-card')?.classList.remove('hidden');
        const stats = document.getElementById('admin-card-stats');
        if (stats) stats.textContent = `${DB.getCanciones().length} canciones · ${DB.getAlbums().length} álbumes · ${DB.getUsuarios().length} usuarios`;
    }

    renderCanciones();
    renderAlbumes();
});
