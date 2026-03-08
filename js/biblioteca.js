function setTabBib(tab) {
    document.getElementById('seccion-playlists').classList.toggle('hidden', tab !== 'playlists');
    document.getElementById('seccion-liked').classList.toggle('hidden', tab !== 'liked');
    const plTab = document.getElementById('tab-pl');
    const lkTab = document.getElementById('tab-lk');
    if (plTab) { plTab.className = tab === 'playlists' ? 'px-4 py-1.5 rounded-full bg-primary text-white text-xs font-bold cursor-pointer' : 'px-4 py-1.5 rounded-full bg-surface text-text-muted text-xs font-semibold cursor-pointer'; }
    if (lkTab) { lkTab.className = tab === 'liked' ? 'px-4 py-1.5 rounded-full bg-primary text-white text-xs font-bold cursor-pointer' : 'px-4 py-1.5 rounded-full bg-surface text-text-muted text-xs font-semibold cursor-pointer'; }
    if (tab === 'liked') renderLiked();
}

function renderPlaylists() {
    const u = DB.getUsuarioActual();
    const playlists = DB.getPlaylistsDeUsuario(u.id);
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
    <div class="group cursor-pointer relative">
        <div class="relative aspect-square rounded-xl overflow-hidden bg-surface mb-3 shadow-sm border border-border">
        <div class="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110 flex items-center justify-center"
            ${p.portada ? `style="background-image:url('${p.portada}')"` : ''}>
            ${!p.portada ? '<span class="material-symbols-outlined text-text-muted text-4xl">queue_music</span>' : ''}
        </div>
        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <span class="material-symbols-outlined text-white text-5xl opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-300">play_circle</span>
        </div>
        <!-- Acciones hover -->
        <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onclick="event.stopPropagation(); editarPlaylist('${p.id}')"
            class="size-7 bg-black/40 backdrop-blur-sm rounded-lg flex items-center justify-center text-white hover:bg-primary transition-colors">
            <span class="material-symbols-outlined text-sm">edit</span>
            </button>
            <button onclick="event.stopPropagation(); eliminarPlaylist('${p.id}')"
            class="size-7 bg-black/40 backdrop-blur-sm rounded-lg flex items-center justify-center text-white hover:bg-red-500 transition-colors">
            <span class="material-symbols-outlined text-sm">delete</span>
            </button>
        </div>
        </div>
        <h3 class="text-text font-bold text-base leading-tight truncate">${p.nombre}</h3>
        <p class="text-text-muted text-sm">${p.canciones.length} canción${p.canciones.length !== 1 ? 'es' : ''}</p>
    </div>`).join('');
}

function renderLiked() {
    const u = DB.getUsuarioActual();
    const likeIds = DB.getLikesDeUsuario(u.id);
    const canciones = DB.getCanciones().filter(c => likeIds.includes(c.id));
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
        <p class="text-xs text-text-muted">${c.artista}</p>
        </div>
        <div class="flex items-center gap-4 shrink-0">
        <span class="material-symbols-outlined text-primary text-xl" style="font-variation-settings:'FILL' 1">favorite</span>
        <span class="text-xs text-text-muted">${c.duracion || '—'}</span>
        </div>
    </div>`).join('');
}

function reproducirLiked(id, colaIds) {
    const c = DB.getCanciones().find(x => x.id === id);
    if (!c) return;
    sessionStorage.setItem('sp_now', JSON.stringify(c));
    const s = (elId, v) => { const e = document.getElementById(elId); if (e) e.textContent = v; };
    s('player-title', c.titulo || '—');
    s('player-artist', c.artista || '—');
    s('player-duration', c.duracion || '—');
    const cw = document.getElementById('player-cover-wrap');
    if (cw) cw.innerHTML = c.portada ? `<img src="${c.portada}" class="w-full h-full object-cover rounded-lg">` : '<span class="material-symbols-outlined text-text-muted">music_note</span>';
    toast('Reproduciendo: ' + c.titulo);
}

// ---- Modal playlist ----
function abrirModalPlaylist(plId) {
    const m = document.getElementById('modal-playlist');
    m.classList.add('open');
    document.getElementById('pl-id-edit').value = plId || '';
    document.getElementById('modal-pl-titulo').textContent = plId ? 'Editar Playlist' : 'Nueva Playlist';
    if (plId) {
        const p = DB.getPlaylistsDeUsuario(DB.getUsuarioActual().id).find(x => x.id === plId);
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
function cerrarModalPlaylist() { document.getElementById('modal-playlist').classList.remove('open'); }

function prevPlPortada(url) {
    const p = document.getElementById('pl-portada-prev');
    if (!p) return;
    p.innerHTML = url ? `<img src="${url}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<span class=\\'material-symbols-outlined text-text-muted text-2xl\\'>broken_image</span>'">` : '<span class="material-symbols-outlined text-text-muted text-2xl">image</span>';
}

function guardarPlaylist() {
    const u = DB.getUsuarioActual();
    if (!u) return;
    const id = document.getElementById('pl-id-edit').value;
    const nombre = document.getElementById('pl-nombre').value.trim();
    const desc = document.getElementById('pl-desc').value.trim();
    const portada = document.getElementById('pl-portada').value.trim();
    if (!nombre) return toast('El nombre es obligatorio', 'error');
    if (id) {
        DB.editarPlaylist(id, { nombre, descripcion: desc, portada });
        toast('Playlist actualizada ✓');
    } else {
        DB.crearPlaylist({ nombre, descripcion: desc, portada, userId: u.id });
        toast('Playlist creada ✓');
    }
    cerrarModalPlaylist();
    renderPlaylists();
}

function editarPlaylist(id) { abrirModalPlaylist(id); }
function eliminarPlaylist(id) {
    if (!confirm('¿Eliminar esta playlist?')) return;
    DB.eliminarPlaylist(id);
    renderPlaylists();
    toast('Playlist eliminada');
}

function toast(msg, tipo = 'ok') {
    const t = document.getElementById('sp-toast');
    if (!t) return;
    t.textContent = msg;
    t.style.background = tipo === 'error' ? '#ef4444' : 'var(--color-primary)';
    t.style.opacity = '1';
    t.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(t._t);
    t._t = setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(2rem)'; }, 2400);
}

document.addEventListener('DOMContentLoaded', () => {
    const u = DB.getUsuarioActual();
    if (!u) { location.href = 'login-registro.html'; return; }
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
        if (cw && c.portada) cw.innerHTML = `<img src="${c.portada}" class="w-full h-full object-cover rounded-lg">`;
    } catch { }
});
