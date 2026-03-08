document.addEventListener('DOMContentLoaded', () => {
    const u = db.getUsuarioActual();
    if (!u) { location.href = 'login-registro.html'; return; }

    // ==========================================
    // DATOS DEL PERFIL
    // ==========================================
    const av = document.getElementById('profile-avatar');
    if (av && u.avatar) av.style.backgroundImage = `url("${u.avatar}")`;

    const s = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    s('profile-name', u.nombre);
    s('profile-handle', u.usuario + (u.rol === 'admin' ? ' · ⚡ Admin' : ' · Usuario'));

    document.querySelectorAll('.user-name').forEach(el => el.textContent = u.nombre);
    document.querySelectorAll('.user-handle').forEach(el => el.textContent = u.usuario);
    document.querySelectorAll('.user-avatar').forEach(el => {
        if (u.avatar) el.style.backgroundImage = `url("${u.avatar}")`;
    });

    // ==========================================
    // ESTADÍSTICAS
    // ==========================================
    const playlists = db.getPlaylistsDeUsuario(u.id);
    const likes = db.getLikesDeUsuario(u.id);
    s('stat-playlists', playlists.length);
    s('stat-likes', likes.length);
    s('stat-canciones', db.getCanciones().length);

    // ==========================================
    // TARJETA DE ADMIN
    // ==========================================
    if (u.rol === 'admin') {
        document.getElementById('admin-entry')?.classList.remove('hidden');
        refreshAdminStats();
    }

    // ==========================================
    // PLAYLISTS RECIENTES
    // ==========================================
    renderPlaylistsRecientes(playlists);

    // ==========================================
    // CANCIONES FAVORITAS
    // ==========================================
    renderLikesEnPerfil();

    // ==========================================
    // RESTAURAR PLAYER BAR
    // ==========================================
    restaurarPlayerBar();
});

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================
function refreshAdminStats() {
    const el = document.getElementById('admin-entry-stats');
    if (el) el.textContent = `${db.getCanciones().length} canciones · ${db.getAlbums().length} álbumes · ${db.getUsuarios().length} usuarios`;
}

function restaurarPlayerBar() {
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

        // Actualizar estado del like en player bar
        const u = db.getUsuarioActual();
        if (u && c.id) {
            const liked = db.tienelike(u.id, c.id);
            const likeIcon = document.getElementById('player-like-icon');
            if (likeIcon) {
                likeIcon.textContent = liked ? 'favorite' : 'favorite_border';
                likeIcon.style.color = liked ? 'var(--color-primary)' : '';
                likeIcon.style.fontVariationSettings = liked ? "'FILL' 1" : "'FILL' 0";
            }
        }
    } catch { }
}

// ==========================================
// MODAL ADMIN
// ==========================================
function abrirModalAdmin() {
    document.getElementById('modal-admin').style.display = 'flex';
    tabAdmin('canciones');
}

function cerrarModalAdmin() {
    document.getElementById('modal-admin').style.display = 'none';
}

function tabAdmin(t) {
    ['canciones', 'albums', 'usuarios'].forEach(tab => {
        document.getElementById('tab-' + tab).classList.toggle('hidden', tab !== t);
        const btn = document.querySelector(`.tab-admin[data-tab="${tab}"]`);
        if (btn) btn.classList.toggle('activo', tab === t);
    });
    if (t === 'canciones') renderC();
    if (t === 'albums') renderA();
    if (t === 'usuarios') renderU();
}

function prevImg(inputId, prevId) {
    const url = document.getElementById(inputId)?.value.trim();
    const prev = document.getElementById(prevId);
    if (!prev) return;
    prev.innerHTML = url
        ? `<img src="${url}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<span class=\\'material-symbols-outlined text-text-muted text-3xl\\'>broken_image</span>'">`
        : `<span class="material-symbols-outlined text-text-muted text-3xl">image</span>`;
}

// ==========================================
// PLAYLISTS RECIENTES
// ==========================================
function renderPlaylistsRecientes(playlists) {
    const elPl = document.getElementById('perfil-playlists');
    if (!elPl) return;

    if (!playlists.length) {
        elPl.innerHTML = `<div class="text-center py-10 text-text-muted">
            <span class="material-symbols-outlined text-4xl block mb-2 opacity-30">queue_music</span>
            <p class="text-sm">Sin playlists aún</p>
            <a href="biblioteca.html" class="text-primary text-xs font-bold mt-1 inline-block hover:underline">Crear una →</a>
        </div>`;
    } else {
        elPl.innerHTML = playlists.slice(0, 5).map(p => `
            <div class="group flex items-center justify-between p-3 rounded-lg hover:bg-surface cursor-pointer transition-colors border-b border-border/50 last:border-0" 
                 onclick="verDetallePlaylist('${p.id}')">
                <div class="flex items-center gap-4">
                    <div class="relative size-12 rounded-lg bg-surface overflow-hidden border border-border flex items-center justify-center">
                        ${p.portada ? `<img src="${p.portada}" class="w-full h-full object-cover">` : '<span class="material-symbols-outlined text-text-muted text-base">queue_music</span>'}
                        <div class="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span class="material-symbols-outlined text-white text-2xl">play_arrow</span>
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <p class="text-text text-sm font-semibold">${p.nombre}</p>
                        <p class="text-text-muted text-xs">${p.canciones.length} canción${p.canciones.length !== 1 ? 'es' : ''}</p>
                    </div>
                </div>
                <span class="text-text-muted group-hover:text-primary transition-colors material-symbols-outlined">chevron_right</span>
            </div>
        `).join('');
    }
}

// ==========================================
// CANCIONES FAVORITAS EN PERFIL
// ==========================================
function renderLikesEnPerfil() {
    const u = db.getUsuarioActual();
    if (!u) return;

    const likeIds = db.getLikesDeUsuario(u.id);
    const todasCanciones = db.getCanciones();
    const canciones = todasCanciones.filter(c => likeIds.includes(c.id));

    const container = document.getElementById('perfil-likes');
    if (!container) return;

    if (!canciones.length) {
        container.innerHTML = `
            <div class="text-center py-8 text-text-muted">
                <span class="material-symbols-outlined text-4xl block mb-2 opacity-30">favorite</span>
                <p class="text-sm">No tienes canciones favoritas</p>
                <p class="text-xs mt-1">Dale like a las canciones que te gusten</p>
            </div>
        `;
        return;
    }

    container.innerHTML = canciones.slice(0, 5).map(c => `
        <div class="flex items-center justify-between p-3 rounded-lg hover:bg-surface cursor-pointer transition-colors border-b border-border/50 last:border-0"
             onclick="reproducirCancionDesdePerfil('${c.id}')">
            <div class="flex items-center gap-3 flex-1 min-w-0">
                <div class="size-10 rounded-lg bg-surface overflow-hidden shrink-0 flex items-center justify-center">
                    ${c.portada ? `<img src="${c.portada}" class="w-full h-full object-cover">` : '<span class="material-symbols-outlined text-text-muted text-sm">music_note</span>'}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="font-bold text-sm truncate">${c.titulo}</p>
                    <p class="text-xs text-text-muted truncate">${c.artista}</p>
                </div>
            </div>
            <span class="material-symbols-outlined text-primary" style="font-variation-settings:'FILL' 1">favorite</span>
        </div>
    `).join('');
}

function reproducirCancionDesdePerfil(id) {
    const c = db.getCanciones().find(x => x.id === id);
    if (!c) return;

    sessionStorage.setItem('sp_now', JSON.stringify(c));
    location.href = 'inicio.html';
}

// ============================================
// FUNCIONES PARA ÁLBUMES - VER Y AGREGAR CANCIONES
// ============================================
let albumActualId = null;

function verDetalleAlbum(albumId) {
    albumActualId = albumId;
    const album = db.getAlbums().find(a => a.id === albumId);
    if (!album) return;

    document.getElementById('album-detalle-titulo').textContent = album.titulo;
    document.getElementById('album-detalle-nombre').textContent = album.titulo;
    document.getElementById('album-detalle-artista').textContent = album.artista;
    document.getElementById('album-detalle-info').textContent = `${album.artista} · ${album.genero || 'Sin género'} · ${album.año || 'Sin año'}`;

    const portadaEl = document.getElementById('album-detalle-portada');
    if (album.portada) {
        portadaEl.innerHTML = `<img src="${album.portada}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<span class=\\'material-symbols-outlined text-text-muted text-4xl\\'>album</span>'">`;
    } else {
        portadaEl.innerHTML = '<span class="material-symbols-outlined text-text-muted text-4xl">album</span>';
    }

    cargarCancionesAlbum(albumId);
    document.getElementById('modal-album-detalle').style.display = 'flex';
}

function cargarCancionesAlbum(albumId) {
    const canciones = db.getCanciones().filter(c => c.albumId === albumId);
    document.getElementById('album-detalle-total').textContent = `${canciones.length} canción${canciones.length !== 1 ? 'es' : ''}`;

    const listaEl = document.getElementById('album-canciones-lista');
    if (!canciones.length) {
        listaEl.innerHTML = `
            <div class="text-center py-8 text-text-muted">
                <span class="material-symbols-outlined text-4xl block mb-2 opacity-30">music_off</span>
                <p class="text-sm">Este álbum no tiene canciones</p>
                <p class="text-xs mt-1">Agrega canciones usando el botón "Agregar canción"</p>
            </div>
        `;
        return;
    }

    listaEl.innerHTML = canciones.map(c => `
        <div class="flex items-center justify-between p-2 rounded-lg hover:bg-surface border border-transparent hover:border-border transition-all">
            <div class="flex items-center gap-3 flex-1 min-w-0">
                <div class="size-10 rounded-lg bg-surface overflow-hidden shrink-0 flex items-center justify-center">
                    ${c.portada ? `<img src="${c.portada}" class="w-full h-full object-cover">` : '<span class="material-symbols-outlined text-text-muted text-sm">music_note</span>'}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="font-bold text-sm truncate">${c.titulo}</p>
                    <p class="text-xs text-text-muted truncate">${c.artista} · ${c.duracion || '—'}</p>
                </div>
            </div>
            <div class="flex gap-1 shrink-0">
                <button onclick="quitarCancionDeAlbum('${c.id}')" class="size-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-text-muted hover:text-red-500 transition-colors" title="Quitar del álbum">
                    <span class="material-symbols-outlined text-base">remove_circle</span>
                </button>
            </div>
        </div>
    `).join('');
}

function quitarCancionDeAlbum(cancionId) {
    if (!confirm('¿Quitar esta canción del álbum?')) return;
    db.editarCancion(cancionId, { albumId: null });
    if (albumActualId) cargarCancionesAlbum(albumActualId);
    toast('Canción removida del álbum');
}

function abrirAgregarCancionAAlbum() {
    if (!albumActualId) return;

    document.getElementById('agregar-cancion-album-id').value = albumActualId;

    const canciones = db.getCanciones().filter(c => !c.albumId || c.albumId === '');
    const select = document.getElementById('select-cancion-album');

    if (!canciones.length) {
        select.innerHTML = '<option value="">No hay canciones disponibles</option>';
    } else {
        select.innerHTML = '<option value="">-- Selecciona una canción --</option>' +
            canciones.map(c => `<option value="${c.id}">${c.titulo} — ${c.artista}</option>`).join('');
    }

    document.getElementById('modal-agregar-cancion-album').style.display = 'flex';
}

function agregarCancionAAlbum() {
    const albumId = document.getElementById('agregar-cancion-album-id').value;
    const cancionId = document.getElementById('select-cancion-album').value;

    if (!cancionId) {
        toast('Selecciona una canción', 'error');
        return;
    }

    db.editarCancion(cancionId, { albumId: albumId });
    cerrarAgregarCancionAAlbum();
    cargarCancionesAlbum(albumId);
    toast('Canción agregada al álbum');
}

function cerrarAgregarCancionAAlbum() {
    document.getElementById('modal-agregar-cancion-album').style.display = 'none';
}

function cerrarModalAlbumDetalle() {
    document.getElementById('modal-album-detalle').style.display = 'none';
    albumActualId = null;
}

// ============================================
// FUNCIONES PARA PLAYLISTS - VER Y AGREGAR CANCIONES
// ============================================
let playlistActualId = null;

function verDetallePlaylist(playlistId) {
    playlistActualId = playlistId;
    const u = db.getUsuarioActual();
    const playlist = db.getPlaylistsDeUsuario(u.id).find(p => p.id === playlistId);
    if (!playlist) return;

    document.getElementById('playlist-detalle-titulo').textContent = playlist.nombre;
    document.getElementById('playlist-detalle-nombre').textContent = playlist.nombre;
    document.getElementById('playlist-detalle-creador').textContent = `Creada por ${u.nombre}`;
    document.getElementById('playlist-detalle-desc').textContent = playlist.descripcion || 'Sin descripción';

    const portadaEl = document.getElementById('playlist-detalle-portada');
    if (playlist.portada) {
        portadaEl.innerHTML = `<img src="${playlist.portada}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<span class=\\'material-symbols-outlined text-text-muted text-4xl\\'>queue_music</span>'">`;
    } else {
        portadaEl.innerHTML = '<span class="material-symbols-outlined text-text-muted text-4xl">queue_music</span>';
    }

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

    document.getElementById('playlist-detalle-total').textContent = `${canciones.length} canción${canciones.length !== 1 ? 'es' : ''}`;

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

    listaEl.innerHTML = canciones.map(c => `
        <div class="flex items-center justify-between p-2 rounded-lg hover:bg-surface border border-transparent hover:border-border transition-all">
            <div class="flex items-center gap-3 flex-1 min-w-0">
                <div class="size-10 rounded-lg bg-surface overflow-hidden shrink-0 flex items-center justify-center">
                    ${c.portada ? `<img src="${c.portada}" class="w-full h-full object-cover">` : '<span class="material-symbols-outlined text-text-muted text-sm">music_note</span>'}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="font-bold text-sm truncate">${c.titulo}</p>
                    <p class="text-xs text-text-muted truncate">${c.artista} · ${c.duracion || '—'}</p>
                </div>
            </div>
            <div class="flex gap-1 shrink-0">
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
    toast('Canción removida de la playlist');
}

function abrirAgregarCancionAPlaylist() {
    if (!playlistActualId) return;

    document.getElementById('agregar-cancion-playlist-id').value = playlistActualId;

    const canciones = db.getCanciones();
    const select = document.getElementById('select-cancion-playlist');

    if (!canciones.length) {
        select.innerHTML = '<option value="">No hay canciones disponibles</option>';
    } else {
        select.innerHTML = '<option value="">-- Selecciona una canción --</option>' +
            canciones.map(c => `<option value="${c.id}">${c.titulo} — ${c.artista}</option>`).join('');
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
// CANCIONES (ADMIN)
// ==========================================
function renderC() {
    const canciones = db.getCanciones();
    const albums = db.getAlbums();
    const lbl = document.getElementById('total-c');
    if (lbl) lbl.textContent = canciones.length;

    const el = document.getElementById('lista-c');
    if (!canciones.length) {
        el.innerHTML = `<div class="text-center py-12 text-text-muted">
            <span class="material-symbols-outlined text-5xl block mb-3 opacity-30">library_music</span>
            <p class="font-bold">No hay canciones</p>
            <p class="text-xs mt-1">Haz clic en "Nueva canción"</p>
        </div>`;
        return;
    }

    el.innerHTML = canciones.map(c => {
        const alb = albums.find(a => a.id === c.albumId);
        return `<div class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface border border-transparent hover:border-border transition-all">
            <div class="size-12 rounded-xl bg-surface border border-border overflow-hidden shrink-0 flex items-center justify-center">
                ${c.portada ? `<img src="${c.portada}" class="w-full h-full object-cover" onerror="this.style.display='none'">` : '<span class="material-symbols-outlined text-text-muted">music_note</span>'}
            </div>
            <div class="flex-1 min-w-0">
                <p class="font-bold text-sm truncate">${c.titulo}</p>
                <div class="flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span class="text-xs text-text-muted">${c.artista}</span>
                    ${c.genero ? `<span class="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full">${c.genero}</span>` : ''}
                    ${alb ? `<span class="text-[10px] text-text-muted">· ${alb.titulo}</span>` : ''}
                    ${c.duracion ? `<span class="text-[10px] text-text-muted">· ${c.duracion}</span>` : ''}
                </div>
            </div>
            <div class="flex gap-1 shrink-0">
                <button onclick="editarC('${c.id}')" class="size-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition-colors">
                    <span class="material-symbols-outlined text-base">edit</span>
                </button>
                <button onclick="eliminarC('${c.id}')" class="size-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-text-muted hover:text-red-500 transition-colors">
                    <span class="material-symbols-outlined text-base">delete</span>
                </button>
            </div>
        </div>`;
    }).join('');
}

function abrirFormC(id, paraAlbum = false) {
    const form = document.getElementById('form-c');
    form.classList.remove('hidden');
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    const albums = db.getAlbums();
    document.getElementById('c-album').innerHTML = '<option value="">Sin álbum</option>' +
        albums.map(a => `<option value="${a.id}">${a.titulo} — ${a.artista}</option>`).join('');

    if (id) {
        const c = db.getCanciones().find(x => x.id === id);
        if (!c) return;
        document.getElementById('c-id').value = c.id;
        document.getElementById('c-titulo').value = c.titulo || '';
        document.getElementById('c-artista').value = c.artista || '';
        document.getElementById('c-genero').value = c.genero || '';
        document.getElementById('c-duracion').value = c.duracion || '';
        document.getElementById('c-portada').value = c.portada || '';
        document.getElementById('c-audio').value = c.urlAudio || '';
        document.getElementById('c-album').value = c.albumId || '';
        document.getElementById('form-c-titulo').textContent = 'Editar Canción';
        prevImg('c-portada', 'prev-c-portada');
    } else {
        document.getElementById('c-id').value = '';
        ['c-titulo', 'c-artista', 'c-duracion', 'c-portada', 'c-audio'].forEach(i => {
            const e = document.getElementById(i); if (e) e.value = '';
        });
        document.getElementById('c-genero').value = '';
        document.getElementById('c-album').value = paraAlbum && albumActualId ? albumActualId : '';
        document.getElementById('prev-c-portada').innerHTML = '<span class="material-symbols-outlined text-text-muted text-3xl">image</span>';
        document.getElementById('form-c-titulo').textContent = 'Nueva Canción';
    }
}

function cerrarFormC() {
    document.getElementById('form-c').classList.add('hidden');
}

function editarC(id) {
    abrirFormC(id);
}

function guardarC() {
    const id = document.getElementById('c-id').value;
    const d = {
        titulo: document.getElementById('c-titulo').value.trim(),
        artista: document.getElementById('c-artista').value.trim(),
        albumId: document.getElementById('c-album').value,
        genero: document.getElementById('c-genero').value,
        duracion: document.getElementById('c-duracion').value.trim(),
        portada: document.getElementById('c-portada').value.trim(),
        urlAudio: document.getElementById('c-audio').value.trim(),
    };

    if (!d.titulo) return toast('El título es obligatorio', 'error');
    if (!d.artista) return toast('El artista es obligatorio', 'error');
    if (!d.urlAudio) return toast('La URL de audio es obligatoria', 'error');

    id ? db.editarCancion(id, d) : db.crearCancion(d);
    cerrarFormC();
    renderC();
    refreshAdminStats();

    if (albumActualId) {
        cargarCancionesAlbum(albumActualId);
        cerrarAgregarCancionAAlbum();
    }

    toast(id ? 'Canción actualizada ✓' : 'Canción agregada ✓');
}

function eliminarC(id) {
    if (!confirm('¿Eliminar esta canción?')) return;
    db.eliminarCancion(id);
    renderC();
    refreshAdminStats();
    toast('Canción eliminada');
}

// ==========================================
// ÁLBUMES (ADMIN)
// ==========================================
function renderA() {
    const albums = db.getAlbums();
    const canciones = db.getCanciones();
    const lbl = document.getElementById('total-a');
    if (lbl) lbl.textContent = albums.length;

    const el = document.getElementById('lista-a');
    if (!albums.length) {
        el.innerHTML = `<div class="col-span-2 text-center py-12 text-text-muted">
            <span class="material-symbols-outlined text-5xl block mb-3 opacity-30">album</span>
            <p class="font-bold">No hay álbumes</p>
        </div>`;
        return;
    }

    el.innerHTML = albums.map(a => {
        const n = canciones.filter(c => c.albumId === a.id).length;
        return `<div class="bg-surface rounded-2xl border border-border p-3 flex items-center gap-3 cursor-pointer hover:bg-primary/5 transition-colors" onclick="verDetalleAlbum('${a.id}')">
            <div class="size-14 rounded-xl bg-border overflow-hidden shrink-0 flex items-center justify-center">
                ${a.portada ? `<img src="${a.portada}" class="w-full h-full object-cover" onerror="this.style.display='none'">` : '<span class="material-symbols-outlined text-text-muted text-2xl">album</span>'}
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                    <p class="font-bold text-sm truncate">${a.titulo}</p>
                    <span class="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">${n} canciones</span>
                </div>
                <p class="text-xs text-text-muted">${a.artista}${a.año ? ' · ' + a.año : ''}</p>
                ${a.genero ? `<span class="inline-block px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full mt-0.5">${a.genero}</span>` : ''}
            </div>
            <div class="flex flex-col gap-1 shrink-0" onclick="event.stopPropagation()">
                <button onclick="editarA('${a.id}')" class="size-7 flex items-center justify-center rounded-lg hover:bg-primary/10 text-text-muted hover:text-primary transition-colors">
                    <span class="material-symbols-outlined text-sm">edit</span>
                </button>
                <button onclick="eliminarA('${a.id}')" class="size-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-text-muted hover:text-red-500 transition-colors">
                    <span class="material-symbols-outlined text-sm">delete</span>
                </button>
            </div>
        </div>`;
    }).join('');
}

function abrirFormA(id) {
    const form = document.getElementById('form-a');
    form.classList.remove('hidden');
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    if (id) {
        const a = db.getAlbums().find(x => x.id === id);
        if (!a) return;
        document.getElementById('a-id').value = a.id;
        document.getElementById('a-titulo').value = a.titulo || '';
        document.getElementById('a-artista').value = a.artista || '';
        document.getElementById('a-genero').value = a.genero || '';
        document.getElementById('a-año').value = a.año || '';
        document.getElementById('a-portada').value = a.portada || '';
        document.getElementById('form-a-titulo').textContent = 'Editar Álbum';
        prevImg('a-portada', 'prev-a-portada');
    } else {
        document.getElementById('a-id').value = '';
        ['a-titulo', 'a-artista', 'a-portada'].forEach(i => {
            const e = document.getElementById(i); if (e) e.value = '';
        });
        document.getElementById('a-genero').value = '';
        document.getElementById('a-año').value = '';
        document.getElementById('prev-a-portada').innerHTML = '<span class="material-symbols-outlined text-text-muted text-3xl">album</span>';
        document.getElementById('form-a-titulo').textContent = 'Nuevo Álbum';
    }
}

function cerrarFormA() {
    document.getElementById('form-a').classList.add('hidden');
}

function editarA(id) {
    abrirFormA(id);
}

function guardarA() {
    const id = document.getElementById('a-id').value;
    const d = {
        titulo: document.getElementById('a-titulo').value.trim(),
        artista: document.getElementById('a-artista').value.trim(),
        genero: document.getElementById('a-genero').value,
        año: document.getElementById('a-año').value.trim(),
        portada: document.getElementById('a-portada').value.trim(),
    };

    if (!d.titulo) return toast('El título es obligatorio', 'error');
    if (!d.artista) return toast('El artista es obligatorio', 'error');

    id ? db.editarAlbum(id, d) : db.crearAlbum(d);
    cerrarFormA();
    renderA();
    refreshAdminStats();
    toast(id ? 'Álbum actualizado ✓' : 'Álbum creado ✓');
}

function eliminarA(id) {
    const n = db.getCanciones().filter(c => c.albumId === id).length;
    if (!confirm(n > 0 ? `¿Eliminar? Sus ${n} canciones quedarán sin álbum.` : '¿Eliminar este álbum?')) return;
    db.eliminarAlbum(id);
    renderA();
    refreshAdminStats();
    toast('Álbum eliminado');
}

// ==========================================
// USUARIOS (ADMIN)
// ==========================================
function renderU() {
    const usuarios = db.getUsuarios();
    const actual = db.getUsuarioActual();
    const lbl = document.getElementById('total-u');
    if (lbl) lbl.textContent = usuarios.length;

    const el = document.getElementById('lista-u');
    el.innerHTML = usuarios.map(u => `
        <div class="flex items-center gap-3 p-3 bg-surface rounded-xl border border-border">
            <div class="size-10 rounded-xl bg-border overflow-hidden shrink-0 flex items-center justify-center">
                ${u.avatar ? `<img src="${u.avatar}" class="w-full h-full object-cover" onerror="this.style.display='none'">` : '<span class="material-symbols-outlined text-text-muted">person</span>'}
            </div>
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap">
                    <p class="font-bold text-sm truncate">${u.nombre}</p>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${u.rol === 'admin' ? 'bg-primary/10 text-primary' : 'bg-surface border border-border text-text-muted'}">${u.rol}</span>
                    ${u.id === actual?.id ? '<span class="text-[10px] text-text-muted">(tú)</span>' : ''}
                </div>
                <p class="text-xs text-text-muted truncate">${u.usuario} · ${u.email}</p>
            </div>
            ${u.id !== actual?.id ? `
                <button onclick="eliminarU('${u.id}')" class="size-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-text-muted hover:text-red-500 transition-colors shrink-0">
                    <span class="material-symbols-outlined text-base">person_remove</span>
                </button>` : ''}
        </div>
    `).join('');
}

function eliminarU(id) {
    const u = db.getUsuarios().find(x => x.id === id);
    if (!confirm(`¿Eliminar al usuario "${u?.nombre}"?`)) return;
    db.eliminarUsuario(id);
    renderU();
    refreshAdminStats();
    toast('Usuario eliminado');
}

// ==========================================
// EDITAR PERFIL
// ==========================================
function abrirEditarPerfil() {
    const u = db.getUsuarioActual();
    if (!u) return;
    document.getElementById('edit-nombre').value = u.nombre;
    document.getElementById('edit-avatar').value = u.avatar || '';
    document.getElementById('edit-password').value = '';
    prevAvatarEdit(u.avatar);
    document.getElementById('modal-editar-perfil').style.display = 'flex';
}

function cerrarEditarPerfil() {
    document.getElementById('modal-editar-perfil').style.display = 'none';
}

function prevAvatarEdit(url) {
    const p = document.getElementById('prev-avatar-edit');
    if (!p) return;
    p.innerHTML = url
        ? `<img src="${url}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<span class=\\'material-symbols-outlined text-text-muted\\'>person</span>'">`
        : '<span class="material-symbols-outlined text-text-muted">person</span>';
}

function guardarPerfil() {
    const u = db.getUsuarioActual();
    if (!u) return;

    const nombre = document.getElementById('edit-nombre').value.trim();
    const avatar = document.getElementById('edit-avatar').value.trim();
    const password = document.getElementById('edit-password').value;

    if (!nombre) return toast('El nombre no puede estar vacío', 'error');

    const usuarios = db.getUsuarios().map(usr => {
        if (usr.id !== u.id) return usr;
        const upd = { ...usr, nombre, avatar: avatar || usr.avatar };
        if (password && password.length >= 6) upd.password = password;
        return upd;
    });

    db.guardarUsuarios(usuarios);
    db.setUsuarioActual({ ...u, nombre, avatar: avatar || u.avatar });
    cerrarEditarPerfil();
    toast('Perfil actualizado ✓');
    setTimeout(() => location.reload(), 900);
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
    }, 2500);
}