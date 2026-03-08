document.addEventListener('DOMContentLoaded', () => {
    const u = DB.getUsuarioActual();
    if (!u) { location.href = 'login-registro.html'; return; }

    // Avatar y datos (original)
    const av = document.getElementById('profile-avatar');
    if (av && u.avatar) av.style.backgroundImage = `url("${u.avatar}")`;
    const s = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    s('profile-name', u.nombre);
    s('profile-handle', u.usuario + (u.rol === 'admin' ? ' · ⚡ Admin' : ' · Usuario'));
    document.querySelectorAll('.user-name').forEach(el => el.textContent = u.nombre);
    document.querySelectorAll('.user-handle').forEach(el => el.textContent = u.usuario);
    document.querySelectorAll('.user-avatar').forEach(el => { if (u.avatar) el.style.backgroundImage = `url("${u.avatar}")`; });

    // Stats
    const playlists = DB.getPlaylistsDeUsuario(u.id);
    const likes = DB.getLikesDeUsuario(u.id);
    s('stat-playlists', playlists.length);
    s('stat-likes', likes.length);
    s('stat-canciones', DB.getCanciones().length);

    // Admin entry card
    if (u.rol === 'admin') {
        document.getElementById('admin-entry')?.classList.remove('hidden');
        refreshAdminStats();
    }

    // Playlists recientes
    const elPl = document.getElementById('perfil-playlists');
    if (elPl) {
        if (!playlists.length) {
            elPl.innerHTML = `<div class="text-center py-10 text-text-muted">
        <span class="material-symbols-outlined text-4xl block mb-2 opacity-30">queue_music</span>
        <p class="text-sm">Sin playlists aún</p>
        <a href="biblioteca.html" class="text-primary text-xs font-bold mt-1 inline-block hover:underline">Crear una →</a>
      </div>`;
        } else {
            elPl.innerHTML = playlists.slice(0, 5).map(p => `
        <div class="group flex items-center justify-between p-3 rounded-lg hover:bg-surface cursor-pointer transition-colors border-b border-border/50 last:border-0">
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
          <a href="biblioteca.html" class="text-text-muted hover:text-primary">
            <span class="material-symbols-outlined">more_horiz</span>
          </a>
        </div>`).join('');
        }
    }

    // Restaurar player bar
    try {
        const saved = sessionStorage.getItem('sp_now');
        if (!saved) return;
        const c = JSON.parse(saved);
        s('player-title', c.titulo || '—');
        s('player-artist', c.artista || '—');
        s('player-duration', c.duracion || '—');
        const cw = document.getElementById('player-cover-wrap');
        if (cw && c.portada) cw.innerHTML = `<img src="${c.portada}" class="w-full h-full object-cover rounded-lg">`;
    } catch { }
});

function refreshAdminStats() {
    const el = document.getElementById('admin-entry-stats');
    if (el) el.textContent = `${DB.getCanciones().length} canciones · ${DB.getAlbums().length} álbumes · ${DB.getUsuarios().length} usuarios`;
}

// ==========================================
// MODAL ADMIN
// ==========================================
function abrirModalAdmin() {
    document.getElementById('modal-admin').style.display = 'flex';
    tabAdmin('canciones');
}
function cerrarModalAdmin() { document.getElementById('modal-admin').style.display = 'none'; }

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

// ---- CANCIONES ----
function renderC() {
    const canciones = DB.getCanciones();
    const albums = DB.getAlbums();
    const lbl = document.getElementById('total-c');
    if (lbl) lbl.textContent = canciones.length;
    const el = document.getElementById('lista-c');
    if (!canciones.length) {
        el.innerHTML = `<div class="text-center py-12 text-text-muted">
            <span class="material-symbols-outlined text-5xl block mb-3 opacity-30">library_music</span>
            <p class="font-bold">No hay canciones</p><p class="text-xs mt-1">Haz clic en "Nueva canción"</p>
        </div>`; return;
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

function abrirFormC(id) {
    const form = document.getElementById('form-c');
    form.classList.remove('hidden');
    form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    const albums = DB.getAlbums();
    document.getElementById('c-album').innerHTML = '<option value="">Sin álbum</option>' +
        albums.map(a => `<option value="${a.id}">${a.titulo} — ${a.artista}</option>`).join('');
    if (id) {
        const c = DB.getCanciones().find(x => x.id === id);
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
        ['c-titulo', 'c-artista', 'c-duracion', 'c-portada', 'c-audio'].forEach(i => { const e = document.getElementById(i); if (e) e.value = ''; });
        document.getElementById('c-genero').value = '';
        document.getElementById('c-album').value = '';
        document.getElementById('prev-c-portada').innerHTML = '<span class="material-symbols-outlined text-text-muted text-3xl">image</span>';
        document.getElementById('form-c-titulo').textContent = 'Nueva Canción';
    }
}
function cerrarFormC() { document.getElementById('form-c').classList.add('hidden'); }
function editarC(id) { abrirFormC(id); }

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
    id ? DB.editarCancion(id, d) : DB.crearCancion(d);
    cerrarFormC(); renderC(); refreshAdminStats();
    toast(id ? 'Canción actualizada ✓' : 'Canción agregada ✓');
}

function eliminarC(id) {
    if (!confirm('¿Eliminar esta canción?')) return;
    DB.eliminarCancion(id); renderC(); refreshAdminStats();
    toast('Canción eliminada');
}

// ---- ÁLBUMES ----
function renderA() {
    const albums = DB.getAlbums();
    const canciones = DB.getCanciones();
    const lbl = document.getElementById('total-a');
    if (lbl) lbl.textContent = albums.length;
    const el = document.getElementById('lista-a');
    if (!albums.length) {
        el.innerHTML = `<div class="col-span-2 text-center py-12 text-text-muted">
        <span class="material-symbols-outlined text-5xl block mb-3 opacity-30">album</span>
        <p class="font-bold">No hay álbumes</p>
    </div>`; return;
    }
    el.innerHTML = albums.map(a => {
        const n = canciones.filter(c => c.albumId === a.id).length;
        return `<div class="bg-surface rounded-2xl border border-border p-3 flex items-center gap-3">
        <div class="size-14 rounded-xl bg-border overflow-hidden shrink-0 flex items-center justify-center">
        ${a.portada ? `<img src="${a.portada}" class="w-full h-full object-cover" onerror="this.style.display='none'">` : '<span class="material-symbols-outlined text-text-muted text-2xl">album</span>'}
        </div>
        <div class="flex-1 min-w-0">
        <p class="font-bold text-sm truncate">${a.titulo}</p>
        <p class="text-xs text-text-muted">${a.artista}${a.año ? ' · ' + a.año : ''}</p>
        ${a.genero ? `<span class="inline-block px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full mt-0.5">${a.genero}</span>` : ''}
        <p class="text-[10px] text-text-muted mt-0.5">${n} canción${n !== 1 ? 'es' : ''}</p>
        </div>
        <div class="flex flex-col gap-1 shrink-0">
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
        const a = DB.getAlbums().find(x => x.id === id);
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
        ['a-titulo', 'a-artista', 'a-portada'].forEach(i => { const e = document.getElementById(i); if (e) e.value = ''; });
        document.getElementById('a-genero').value = '';
        document.getElementById('a-año').value = '';
        document.getElementById('prev-a-portada').innerHTML = '<span class="material-symbols-outlined text-text-muted text-3xl">album</span>';
        document.getElementById('form-a-titulo').textContent = 'Nuevo Álbum';
    }
}
function cerrarFormA() { document.getElementById('form-a').classList.add('hidden'); }
function editarA(id) { abrirFormA(id); }

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
    id ? DB.editarAlbum(id, d) : DB.crearAlbum(d);
    cerrarFormA(); renderA(); refreshAdminStats();
    toast(id ? 'Álbum actualizado ✓' : 'Álbum creado ✓');
}

function eliminarA(id) {
    const n = DB.getCanciones().filter(c => c.albumId === id).length;
    if (!confirm(n > 0 ? `¿Eliminar? Sus ${n} canciones quedarán sin álbum.` : '¿Eliminar este álbum?')) return;
    DB.eliminarAlbum(id); renderA(); refreshAdminStats();
    toast('Álbum eliminado');
}

// ---- USUARIOS ----
function renderU() {
    const usuarios = DB.getUsuarios();
    const actual = DB.getUsuarioActual();
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
        </button>`: ''}
    </div>`).join('');
}

function eliminarU(id) {
    const u = DB.getUsuarios().find(x => x.id === id);
    if (!confirm(`¿Eliminar al usuario "${u?.nombre}"?`)) return;
    DB.eliminarUsuario(id); renderU(); refreshAdminStats();
    toast('Usuario eliminado');
}

// ==========================================
// EDITAR PERFIL
// ==========================================
function abrirEditarPerfil() {
    const u = DB.getUsuarioActual();
    if (!u) return;
    document.getElementById('edit-nombre').value = u.nombre;
    document.getElementById('edit-avatar').value = u.avatar || '';
    document.getElementById('edit-password').value = '';
    prevAvatarEdit(u.avatar);
    document.getElementById('modal-editar-perfil').style.display = 'flex';
}
function cerrarEditarPerfil() { document.getElementById('modal-editar-perfil').style.display = 'none'; }

function prevAvatarEdit(url) {
    const p = document.getElementById('prev-avatar-edit');
    if (!p) return;
    p.innerHTML = url
        ? `<img src="${url}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='<span class=\\'material-symbols-outlined text-text-muted\\'>person</span>'">`
        : '<span class="material-symbols-outlined text-text-muted">person</span>';
}

function guardarPerfil() {
    const u = DB.getUsuarioActual();
    if (!u) return;
    const nombre = document.getElementById('edit-nombre').value.trim();
    const avatar = document.getElementById('edit-avatar').value.trim();
    const password = document.getElementById('edit-password').value;
    if (!nombre) return toast('El nombre no puede estar vacío', 'error');
    const usuarios = DB.getUsuarios().map(usr => {
        if (usr.id !== u.id) return usr;
        const upd = { ...usr, nombre, avatar: avatar || usr.avatar };
        if (password && password.length >= 6) upd.password = password;
        return upd;
    });
    DB.guardarUsuarios(usuarios);
    DB.setUsuarioActual({ ...u, nombre, avatar: avatar || u.avatar });
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
    t._t = setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(2rem)'; }, 2500);
}
