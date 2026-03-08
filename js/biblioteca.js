// ==========================================
// VARIABLES GLOBALES
// ==========================================
let playlistActualId = null;

// ==========================================
// FUNCIONES DE PESTAÑAS
// ==========================================
function setTabBib(tab) {
    document.getElementById('seccion-playlists').classList.toggle('hidden', tab !== 'playlists');
    document.getElementById('seccion-liked').classList.toggle('hidden', tab !== 'liked');
    const plTab = document.getElementById('tab-pl');
    const lkTab = document.getElementById('tab-lk');
    if (plTab) {
        plTab.className = tab === 'playlists'
            ? 'px-4 py-1.5 rounded-full bg-primary text-white text-xs font-bold cursor-pointer'
            : 'px-4 py-1.5 rounded-full bg-surface text-text-muted text-xs font-semibold cursor-pointer';
    }
    if (lkTab) {
        lkTab.className = tab === 'liked'
            ? 'px-4 py-1.5 rounded-full bg-primary text-white text-xs font-bold cursor-pointer'
            : 'px-4 py-1.5 rounded-full bg-surface text-text-muted text-xs font-semibold cursor-pointer';
    }
    if (tab === 'liked') renderLiked();
}

// ==========================================
// RENDERIZADO DE PLAYLISTS
// ==========================================
function renderPlaylists() {
    const u = db.getUsuarioActual();
    const playlists = db.getPlaylistsDeUsuario(u.id);
    const el = document.getElementById('playlists-grid');

    if (!playlists.length) {
        el.innerHTML = `<div class="col-span-full text-center py-20 text-text-muted">
            <span class="material-symbols-outlined text-6xl block mb-4 opacity-30">queue_music</span>
            <p class="text-xl font-bold">No tienes playlists aún</p>
            <p class="text-sm mt-2">Crea tu primera playlist</p>
        </div>`;
        return;
    }

    el.innerHTML = playlists.map(p => `
        <div class="group cursor-pointer relative" onclick="verDetallePlaylist('${p.id}')">
            <div class="relative aspect-square rounded-xl overflow-hidden bg-surface mb-3 shadow-sm border border-border">
                <div class="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110 flex items-center justify-center"
                    ${p.portada ? `style="background-image:url('${p.portada}')"` : ''}>
                    ${!p.portada ? '<span class="material-symbols-outlined text-text-muted text-4xl">queue_music</span>' : ''}
                </div>
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span class="material-symbols-outlined text-white text-5xl opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-300">play_circle</span>
                </div>
                <!-- Acciones hover -->
                <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onclick="event.stopPropagation()">
                    <button onclick="editarPlaylist('${p.id}')"
                        class="size-7 bg-black/40 backdrop-blur-sm rounded-lg flex items-center justify-center text-white hover:bg-primary transition-colors">
                        <span class="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button onclick="eliminarPlaylist('${p.id}')"
                        class="size-7 bg-black/40 backdrop-blur-sm rounded-lg flex items-center justify-center text-white hover:bg-red-500 transition-colors">
                        <span class="material-symbols-outlined text-sm">delete</span>
                    </button>
                </div>
                <!-- Contador de canciones -->
                <div class="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs text-white font-bold">
                    ${p.canciones.length} canciones
                </div>
            </div>
            <h3 class="text-text font-bold text-base leading-tight truncate">${p.nombre}</h3>
            <p class="text-text-muted text-sm">${p.descripcion || 'Sin descripción'}</p>
        </div>
    `).join('');
}

// ==========================================
// FUNCIONES PARA PLAYLISTS - VER Y AGREGAR CANCIONES
// ==========================================

function verDetallePlaylist(playlistId) {
    playlistActualId = playlistId;
    const u = db.getUsuarioActual();
    const playlist = db.getPlaylistsDeUsuario(u.id).find(p => p.id === playlistId);
    if (!playlist) return;

    document.getElementById('playlist-detalle-titulo').textContent = playlist.nombre;
    document.getElementById('playlist-detalle-nombre').textContent = playlist.nombre;
    document.getElementById('playlist-detalle-creador').textContent = `Creada por ${u.nombre}`;
    document.getElementById('playlist-detalle-desc').textContent = playlist.descripcion || 'Sin descripción';

    // Portada
    const portadaEl = document.getElementById('playlist-detalle-portada');
    if (playlist.portada) {
        portadaEl.innerHTML = `<img src="${playlist.portada}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<span class=\\'material-symbols-outlined text-text-muted text-4xl\\'>queue_music</span>'">`;
    } else {
        portadaEl.innerHTML = '<span class="material-symbols-outlined text-text-muted text-4xl">queue_music</span>';
    }

    // Cargar canciones de la playlist
    cargarCancionesPlaylist(playlistId);

    document.getElementById('modal-playlist-detalle').style.display = 'flex';
}

function cargarCancionesPlaylist(playlistId) {
    const u = db.getUsuarioActual();
    const playlist = db.getPlaylistsDeUsuario(u.id).find(p => p.id === playlistId);
    if (!playlist) return;

    const cancionesIds = playlist.canciones || [];
    const todasCanciones = db.getCanciones();
    const canciones = todasCanciones.filter(c => cancionesIds.includes(c.id));

    const totalEl = document.getElementById('playlist-detalle-total');
    totalEl.textContent = `${canciones.length} canción${canciones.length !== 1 ? 'es' : ''}`;

    const listaEl = document.getElementById('playlist-canciones-lista');

    if (!canciones.length) {
        listaEl.innerHTML = `
            <div class="text-center py-8 text-text-muted">
                <span class="material-symbols-outlined text-4xl block mb-2 opacity-30">music_off</span>
                <p class="text-sm">Esta playlist no tiene canciones</p>
                <p class="text-xs mt-1">Agrega canciones usando el botón "Agregar canción"</p>
            </div>
        `;
        return;
    }

    listaEl.innerHTML = canciones.map((c, index) => `
        <div class="flex items-center justify-between p-2 rounded-lg hover:bg-surface border border-transparent hover:border-border transition-all">
            <div class="flex items-center gap-3 flex-1 min-w-0">
                <div class="w-6 text-center text-text-muted text-xs font-medium">${index + 1}</div>
                <div class="size-10 rounded-lg bg-surface overflow-hidden shrink-0 flex items-center justify-center">
                    ${c.portada ? `<img src="${c.portada}" class="w-full h-full object-cover">` : '<span class="material-symbols-outlined text-text-muted text-sm">music_note</span>'}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="font-bold text-sm truncate">${c.titulo}</p>
                    <p class="text-xs text-text-muted truncate">${c.artista} · ${c.duracion || '—'}</p>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="reproducirCancion('${c.id}')" class="size-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition-colors" title="Reproducir">
                    <span class="material-symbols-outlined text-base">play_arrow</span>
                </button>
                <button onclick="quitarCancionDePlaylist('${c.id}')" class="size-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-text-muted hover:text-red-500 transition-colors" title="Quitar de la playlist">
                    <span class="material-symbols-outlined text-base">remove_circle</span>
                </button>
            </div>
        </div>
    `).join('');
}

function quitarCancionDePlaylist(cancionId) {
    if (!playlistActualId || !confirm('¿Quitar esta canción de la playlist?')) return;

    db.quitarCancionDePlaylist(playlistActualId, cancionId);
    cargarCancionesPlaylist(playlistActualId);
    renderPlaylists(); // Actualizar la vista de playlists
    toast('Canción removida de la playlist');
}

function abrirAgregarCancionAPlaylist() {
    if (!playlistActualId) return;

    document.getElementById('agregar-cancion-playlist-id').value = playlistActualId;

    // Obtener canciones que NO están ya en la playlist
    const u = db.getUsuarioActual();
    const playlist = db.getPlaylistsDeUsuario(u.id).find(p => p.id === playlistActualId);
    const cancionesEnPlaylist = playlist?.canciones || [];

    const todasCanciones = db.getCanciones();
    const cancionesDisponibles = todasCanciones.filter(c => !cancionesEnPlaylist.includes(c.id));

    const select = document.getElementById('select-cancion-playlist');

    if (!cancionesDisponibles.length) {
        select.innerHTML = '<option value="">No hay canciones disponibles</option>';
    } else {
        select.innerHTML = '<option value="">-- Selecciona una canción --</option>' +
            cancionesDisponibles.map(c => `<option value="${c.id}">${c.titulo} — ${c.artista}</option>`).join('');
    }

    document.getElementById('modal-agregar-cancion-playlist').style.display = 'flex';
}

function agregarCancionAPlaylist() {
    const playlistId = document.getElementById('agregar-cancion-playlist-id').value;
    const cancionId = document.getElementById('select-cancion-playlist').value;

    if (!cancionId) {
        toast('Selecciona una canción', 'error');
        return;
    }

    db.agregarCancionAPlaylist(playlistId, cancionId);
    cerrarAgregarCancionAPlaylist();
    cargarCancionesPlaylist(playlistId);
    renderPlaylists(); // Actualizar la vista de playlists
    toast('Canción agregada a la playlist');
}

function cerrarAgregarCancionAPlaylist() {
    document.getElementById('modal-agregar-cancion-playlist').style.display = 'none';
}

function cerrarModalPlaylistDetalle() {
    document.getElementById('modal-playlist-detalle').style.display = 'none';
    playlistActualId = null;
}

// ==========================================
// REPRODUCIR CANCIÓN
// ==========================================
function reproducirCancion(id) {
    const c = db.getCanciones().find(x => x.id === id);
    if (!c) return;

    sessionStorage.setItem('sp_now', JSON.stringify(c));
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

    // Actualizar like en player bar
    const u = db.getUsuarioActual();
    if (u) {
        const liked = db.tienelike(u.id, id);
        const likeIcon = document.getElementById('player-like-icon');
        if (likeIcon) {
            likeIcon.textContent = liked ? 'favorite' : 'favorite_border';
            likeIcon.style.color = liked ? 'var(--color-primary)' : '';
            likeIcon.style.fontVariationSettings = liked ? "'FILL' 1" : "'FILL' 0";
        }
    }

    toast('Reproduciendo: ' + c.titulo);
}

function reproducirLiked(id, colaIds) {
    reproducirCancion(id);
}

// ==========================================
// RENDERIZADO DE CANCIONES CON LIKE
// ==========================================
function renderLiked() {
    const u = db.getUsuarioActual();
    const likeIds = db.getLikesDeUsuario(u.id);
    const canciones = db.getCanciones().filter(c => likeIds.includes(c.id));
    const el = document.getElementById('liked-lista');

    if (!canciones.length) {
        el.innerHTML = `<div class="text-center py-20 text-text-muted">
            <span class="material-symbols-outlined text-6xl block mb-4 opacity-30">favorite</span>
            <p class="text-xl font-bold">Sin canciones con like</p>
            <p class="text-sm mt-2">Dale like a tus canciones favoritas</p>
        </div>`;
        return;
    }

    const colaIds = canciones.map(c => c.id);

    el.innerHTML = canciones.map((c, i) => `
        <div class="flex items-center p-3 rounded-xl hover:bg-surface transition-colors group cursor-pointer"
                onclick="reproducirLiked('${c.id}',${JSON.stringify(colaIds)})">
            <div class="w-8 text-center text-text-muted font-medium text-sm select-none">${String(i + 1).padStart(2, '0')}</div>
            <div class="size-12 rounded-lg overflow-hidden ml-2 shrink-0 bg-surface border border-border flex items-center justify-center">
                ${c.portada ? `<img src="${c.portada}" class="w-full h-full object-cover">` : '<span class="material-symbols-outlined text-text-muted text-sm">music_note</span>'}
            </div>
            <div class="ml-4 flex-1 min-w-0">
                <p class="font-bold text-sm truncate">${c.titulo}</p>
                <p class="text-xs text-text-muted truncate">${c.artista}</p>
            </div>
            <div class="flex items-center gap-4 shrink-0">
                <span class="material-symbols-outlined text-primary text-xl" style="font-variation-settings:'FILL' 1">favorite</span>
                <span class="text-xs text-text-muted">${c.duracion || '—'}</span>
            </div>
        </div>
    `).join('');
}

// ==========================================
// MODAL PLAYLIST (CREAR/EDITAR)
// ==========================================
function abrirModalPlaylist(plId) {
    const m = document.getElementById('modal-playlist');
    m.classList.add('open');
    document.getElementById('pl-id-edit').value = plId || '';
    document.getElementById('modal-pl-titulo').textContent = plId ? 'Editar Playlist' : 'Nueva Playlist';

    if (plId) {
        const p = db.getPlaylistsDeUsuario(db.getUsuarioActual().id).find(x => x.id === plId);
        if (p) {
            document.getElementById('pl-nombre').value = p.nombre || '';
            document.getElementById('pl-desc').value = p.descripcion || '';
            document.getElementById('pl-portada').value = p.portada || '';
            prevPlPortada(p.portada || '');
        }
    } else {
        ['pl-nombre', 'pl-desc', 'pl-portada'].forEach(id => { const e = document.getElementById(id); if (e) e.value = ''; });
        prevPlPortada('');
    }
}

function cerrarModalPlaylist() {
    document.getElementById('modal-playlist').classList.remove('open');
}

function prevPlPortada(url) {
    const p = document.getElementById('pl-portada-prev');
    if (!p) return;
    p.innerHTML = url
        ? `<img src="${url}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<span class=\\'material-symbols-outlined text-text-muted text-2xl\\'>broken_image</span>'">`
        : '<span class="material-symbols-outlined text-text-muted text-2xl">image</span>';
}

function guardarPlaylist() {
    const u = db.getUsuarioActual();
    if (!u) return;

    const id = document.getElementById('pl-id-edit').value;
    const nombre = document.getElementById('pl-nombre').value.trim();
    const desc = document.getElementById('pl-desc').value.trim();
    const portada = document.getElementById('pl-portada').value.trim();

    if (!nombre) return toast('El nombre es obligatorio', 'error');

    if (id) {
        db.editarPlaylist(id, { nombre, descripcion: desc, portada });
        toast('Playlist actualizada ✓');
    } else {
        db.crearPlaylist({ nombre, descripcion: desc, portada, userId: u.id });
        toast('Playlist creada ✓');
    }

    cerrarModalPlaylist();
    renderPlaylists();
}

function editarPlaylist(id) {
    abrirModalPlaylist(id);
}

function eliminarPlaylist(id) {
    if (!confirm('¿Eliminar esta playlist?')) return;
    db.eliminarPlaylist(id);
    renderPlaylists();
    toast('Playlist eliminada');
}

// ==========================================
// TOAST
// ==========================================
function toast(msg, tipo = 'ok') {
    const t = document.getElementById('sp-toast');
    if (!t) return;
    t.textContent = msg;
    t.style.background = tipo === 'error' ? '#ef4444' : 'var(--color-primary)';
    t.style.opacity = '1';
    t.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(t._t);
    t._t = setTimeout(() => {
        t.style.opacity = '0';
        t.style.transform = 'translateX(-50%) translateY(2rem)';
    }, 2400);
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const u = db.getUsuarioActual();
    if (!u) {
        location.href = 'login-registro.html';
        return;
    }

    renderPlaylists();

    // Restaurar player bar
    try {
        const saved = sessionStorage.getItem('sp_now');
        if (!saved) return;

        const c = JSON.parse(saved);
        const s = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
        s('player-title', c.titulo || '—');
        s('player-artist', c.artista || '—');
        s('player-duration', c.duracion || '—');

        const cw = document.getElementById('player-cover-wrap');
        if (cw && c.portada) {
            cw.innerHTML = `<img src="${c.portada}" class="w-full h-full object-cover rounded-lg">`;
        }

        // Actualizar like en player bar
        const liked = db.tienelike(u.id, c.id);
        const likeIcon = document.getElementById('player-like-icon');
        if (likeIcon) {
            likeIcon.textContent = liked ? 'favorite' : 'favorite_border';
            likeIcon.style.color = liked ? 'var(--color-primary)' : '';
            likeIcon.style.fontVariationSettings = liked ? "'FILL' 1" : "'FILL' 0";
        }
    } catch { }
});