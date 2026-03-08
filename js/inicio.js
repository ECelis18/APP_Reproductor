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
            const u = db.getUsuarioActual();
            if (!u || !actual) return;
            const liked = db.tienelike(u.id, actual.id);

            // Actualizar todos los íconos de like
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
        const canciones = db.getCanciones();
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
            const canciones = db.getCanciones();
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
                const u = db.getUsuarioActual();
                if (!u || !actual) return;

                const liked = db.toggleLike(u.id, actual.id);
                updateLikes();

                // Actualizar ícono en todas las listas
                document.querySelectorAll(`[data-like-id="${actual.id}"]`).forEach(btn => {
                    const icon = btn.querySelector('.material-symbols-outlined');
                    if (icon) {
                        icon.textContent = liked ? 'favorite' : 'favorite_border';
                        icon.style.color = liked ? 'var(--color-primary)' : '';
                        icon.style.fontVariationSettings = liked ? "'FILL' 1" : "'FILL' 0";
                    }
                });

                toast(liked ? '❤️ Agregado a favoritos' : '💔 Eliminado de favoritos');
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
// RENDER db
// ==========================================
function renderCanciones() {
    const u = db.getUsuarioActual();
    const canciones = db.getCanciones();
    const el = document.getElementById('canciones-lista');

    if (!canciones.length) {
        el.innerHTML = `<div class="text-center py-12 text-text-muted">
            <span class="material-symbols-outlined text-5xl block mb-3 opacity-30">music_off</span>
            <p class="text-sm font-medium">No hay canciones aún</p>
            <p class="text-xs mt-1 opacity-70">El administrador puede agregar canciones desde su perfil</p>
        </div>`;
        return;
    }

    const colaIds = canciones.map(c => c.id);

    el.innerHTML = canciones.map((c, i) => {
        const liked = u ? db.tienelike(u.id, c.id) : false;
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
                <button onclick="event.stopPropagation(); toggleLikeDesdeLista('${c.id}', this)" 
                        class="opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110">
                    <span class="material-symbols-outlined text-xl ${liked ? 'text-primary' : 'text-text-muted'}"
                          style="${liked ? 'font-variation-settings:\'FILL\' 1' : ''}">
                        ${liked ? 'favorite' : 'favorite_border'}
                    </span>
                </button>
                <span class="text-xs text-text-muted font-medium">${c.duracion || '—'}</span>
                <span class="material-symbols-outlined text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">more_horiz</span>
            </div>
        </div>`;
    }).join('');
}

// NUEVA FUNCIÓN PARA MANEJAR LIKES DESDE LA LISTA
function toggleLikeDesdeLista(id, btn) {
    event.stopPropagation();
    const u = db.getUsuarioActual();
    if (!u) return;

    const liked = db.toggleLike(u.id, id);
    const icon = btn.querySelector('.material-symbols-outlined');

    if (icon) {
        icon.textContent = liked ? 'favorite' : 'favorite_border';
        icon.className = `material-symbols-outlined text-xl ${liked ? 'text-primary' : 'text-text-muted'}`;
        icon.style.fontVariationSettings = liked ? "'FILL' 1" : "'FILL' 0";
    }

    // Si la canción actual es la que se está reproduciendo, actualizar los íconos del player
    if (Player.getActual() && Player.getActual().id === id) {
        const panelLike = document.getElementById('player-like-icon');
        const barLike = document.getElementById('player-bar-like');

        if (panelLike) {
            panelLike.textContent = liked ? 'favorite' : 'favorite_border';
            panelLike.style.color = liked ? 'var(--color-primary)' : '';
            panelLike.style.fontVariationSettings = liked ? "'FILL' 1" : "'FILL' 0";
        }

        if (barLike) {
            barLike.textContent = liked ? 'favorite' : 'favorite_border';
            barLike.style.color = liked ? 'var(--color-primary)' : '';
            barLike.style.fontVariationSettings = liked ? "'FILL' 1" : "'FILL' 0";
        }
    }

    toast(liked ? '❤️ Agregado a favoritos' : '💔 Eliminado de favoritos');
}

function renderAlbumes() {
    const albums = db.getAlbums();
    const el = document.getElementById('albums-grid');

    if (!albums.length) {
        el.innerHTML = `<div class="col-span-full text-center py-10 text-text-muted">
            <span class="material-symbols-outlined text-4xl block mb-2 opacity-30">album</span>
            <p class="text-sm">No hay álbumes aún</p>
        </div>`;
        return;
    }

    el.innerHTML = albums.map(a => {
        const n = db.getCanciones().filter(c => c.albumId === a.id).length;
        return `
        <div class="group cursor-pointer hover-card-enhanced" onclick="verDetalleAlbumUser('${a.id}')">
            <div class="relative aspect-square rounded-xl overflow-hidden bg-surface mb-3 shadow-sm border border-border">
                <div class="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110 flex items-center justify-center"
                    ${a.portada ? `style="background-image:url('${a.portada}')"` : ''}>
                    ${!a.portada ? '<span class="material-symbols-outlined text-text-muted text-4xl">album</span>' : ''}
                </div>
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span class="material-symbols-outlined text-white text-5xl opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-300">play_circle</span>
                </div>
                <!-- Contador de canciones -->
                <div class="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs text-white font-bold">
                    ${n} canciones
                </div>
            </div>
            <h3 class="text-text font-bold text-base leading-tight truncate">${a.titulo}</h3>
            <p class="text-text-muted text-sm">${a.artista}${a.año ? ' · ' + a.año : ''}</p>
        </div>`;
    }).join('');
}

// ==========================================
// FUNCIONES PARA VER DETALLES DEL ÁLBUM (VISTA USER)
// ==========================================
let albumActualIdUser = null;

function verDetalleAlbumUser(albumId) {
    albumActualIdUser = albumId;
    const album = db.getAlbums().find(a => a.id === albumId);
    if (!album) return;

    // Configurar el modal
    document.getElementById('album-user-titulo').textContent = album.titulo;
    document.getElementById('album-user-nombre').textContent = album.titulo;
    document.getElementById('album-user-artista').textContent = album.artista;
    document.getElementById('album-user-info').textContent = `${album.artista} · ${album.genero || 'Sin género'} · ${album.año || 'Sin año'}`;

    // Portada
    const portadaEl = document.getElementById('album-user-portada');
    if (album.portada) {
        portadaEl.innerHTML = `<img src="${album.portada}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<span class=\\'material-symbols-outlined text-text-muted text-4xl\\'>album</span>'">`;
    } else {
        portadaEl.innerHTML = '<span class="material-symbols-outlined text-text-muted text-4xl">album</span>';
    }

    // Cargar canciones del álbum
    cargarCancionesAlbumUser(albumId);

    // Mostrar modal
    document.getElementById('modal-album-user').style.display = 'flex';
}

function cargarCancionesAlbumUser(albumId) {
    const canciones = db.getCanciones().filter(c => c.albumId === albumId);
    document.getElementById('album-user-total').textContent = `${canciones.length} canción${canciones.length !== 1 ? 'es' : ''}`;

    const listaEl = document.getElementById('album-user-canciones-lista');

    if (!canciones.length) {
        listaEl.innerHTML = `
            <div class="text-center py-8 text-text-muted">
                <span class="material-symbols-outlined text-4xl block mb-2 opacity-30">music_off</span>
                <p class="text-sm">Este álbum no tiene canciones</p>
            </div>
        `;
        return;
    }

    const u = db.getUsuarioActual();
    const colaIds = canciones.map(c => c.id);

    listaEl.innerHTML = canciones.map((c, index) => {
        const liked = u ? db.tienelike(u.id, c.id) : false;
        return `
        <div class="flex items-center justify-between p-2 rounded-lg hover:bg-surface song-row-hover border border-transparent hover:border-border transition-all cursor-pointer"
             onclick="reproducirCancionDesdeAlbum('${c.id}', ${JSON.stringify(colaIds)})">
            <div class="flex items-center gap-3 flex-1 min-w-0">
                <div class="w-8 text-center text-text-muted text-sm font-medium">${index + 1}</div>
                <div class="size-10 rounded-lg bg-surface overflow-hidden shrink-0 flex items-center justify-center">
                    ${c.portada ? `<img src="${c.portada}" class="w-full h-full object-cover">` : '<span class="material-symbols-outlined text-text-muted text-sm">music_note</span>'}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="font-bold text-sm truncate">${c.titulo}</p>
                    <p class="text-xs text-text-muted truncate">${c.artista} · ${c.duracion || '—'}</p>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <button onclick="event.stopPropagation(); toggleLikeDesdeAlbum('${c.id}', this)" 
                        class="text-text-muted hover:text-primary transition-colors">
                    <span class="material-symbols-outlined ${liked ? 'text-primary' : 'text-text-muted'}" 
                          style="${liked ? 'font-variation-settings:\'FILL\' 1' : ''}">
                        ${liked ? 'favorite' : 'favorite_border'}
                    </span>
                </button>
                <span class="text-xs text-text-muted">${c.duracion || '—'}</span>
            </div>
        </div>`;
    }).join('');
}

function reproducirCancionDesdeAlbum(id, colaIds) {
    const c = db.getCanciones().find(x => x.id === id);
    if (!c) return;

    sessionStorage.setItem('sp_now', JSON.stringify(c));

    // Actualizar player bar
    const s = (elId, v) => { const e = document.getElementById(elId); if (e) e.textContent = v; };
    s('player-title', c.titulo || '—');
    s('player-artist', c.artista || '—');
    s('player-duration', c.duracion || '—');

    const cw = document.getElementById('player-cover-wrap');
    if (cw) {
        cw.innerHTML = c.portada
            ? `<img src="${c.portada}" class="w-full h-full object-cover rounded-lg">`
            : '<span class="material-symbols-outlined text-text-muted">music_note</span>';
    }

    // Actualizar like en player
    const u = db.getUsuarioActual();
    if (u) {
        const liked = db.tienelike(u.id, id);
        const panelLike = document.getElementById('player-like-icon');
        const barLike = document.getElementById('player-bar-like');

        if (panelLike) {
            panelLike.textContent = liked ? 'favorite' : 'favorite_border';
            panelLike.style.color = liked ? 'var(--color-primary)' : '';
            panelLike.style.fontVariationSettings = liked ? "'FILL' 1" : "'FILL' 0";
        }

        if (barLike) {
            barLike.textContent = liked ? 'favorite' : 'favorite_border';
            barLike.style.color = liked ? 'var(--color-primary)' : '';
            barLike.style.fontVariationSettings = liked ? "'FILL' 1" : "'FILL' 0";
        }
    }

    toast('Reproduciendo: ' + c.titulo);
}

function toggleLikeDesdeAlbum(id, btn) {
    event.stopPropagation();
    const u = db.getUsuarioActual();
    if (!u) return;

    const liked = db.toggleLike(u.id, id);
    const icon = btn.querySelector('.material-symbols-outlined');

    if (icon) {
        icon.textContent = liked ? 'favorite' : 'favorite_border';
        icon.className = `material-symbols-outlined ${liked ? 'text-primary' : 'text-text-muted'}`;
        icon.style.fontVariationSettings = liked ? "'FILL' 1" : "'FILL' 0";
    }

    // Actualizar player si es la canción actual
    if (Player.getActual() && Player.getActual().id === id) {
        const panelLike = document.getElementById('player-like-icon');
        const barLike = document.getElementById('player-bar-like');

        if (panelLike) {
            panelLike.textContent = liked ? 'favorite' : 'favorite_border';
            panelLike.style.color = liked ? 'var(--color-primary)' : '';
            panelLike.style.fontVariationSettings = liked ? "'FILL' 1" : "'FILL' 0";
        }

        if (barLike) {
            barLike.textContent = liked ? 'favorite' : 'favorite_border';
            barLike.style.color = liked ? 'var(--color-primary)' : '';
            barLike.style.fontVariationSettings = liked ? "'FILL' 1" : "'FILL' 0";
        }
    }

    toast(liked ? '❤️ Agregado a favoritos' : '💔 Eliminado de favoritos');
}

function cerrarModalAlbumUser() {
    document.getElementById('modal-album-user').style.display = 'none';
    albumActualIdUser = null;
}

document.addEventListener('DOMContentLoaded', () => {
    const u = db.getUsuarioActual();
    if (!u) { location.href = 'login-registro.html'; return; }

    if (u.rol === 'admin') {
        document.getElementById('admin-card')?.classList.remove('hidden');
        const stats = document.getElementById('admin-card-stats');
        if (stats) stats.textContent = `${db.getCanciones().length} canciones · ${db.getAlbums().length} álbumes · ${db.getUsuarios().length} usuarios`;
    }

    renderCanciones();
    renderAlbumes();
});