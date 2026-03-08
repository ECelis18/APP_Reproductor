let filtroActual = 'todo';
const coloresGenero = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500', 'bg-teal-500', 'bg-cyan-500'];

function setFiltro(f) {
    filtroActual = f;
    ['todo', 'canciones', 'albums'].forEach(t => {
        const btn = document.getElementById('tab-' + t);
        if (!btn) return;
        btn.className = t === f
            ? 'py-4 text-sm font-bold active-tab'
            : 'py-4 text-sm font-bold text-text-muted border-b-2 border-transparent hover:text-text';
    });
    const q = document.getElementById('search-input')?.value || '';
    buscar(q);
}

function buscar(q) {
    q = (q || '').trim().toLowerCase();
    const estadoInicial = document.getElementById('estado-inicial');
    const sinRes = document.getElementById('sin-resultados');
    const resultados = document.getElementById('resultados');

    if (!q) {
        estadoInicial.classList.remove('hidden');
        sinRes.classList.add('hidden');
        resultados.classList.add('hidden');
        return;
    }

    estadoInicial.classList.add('hidden');

    const todasCanciones = db.getCanciones().filter(c =>
        c.titulo?.toLowerCase().includes(q) ||
        c.artista?.toLowerCase().includes(q) ||
        c.genero?.toLowerCase().includes(q)
    );
    const todosAlbums = db.getAlbums().filter(a =>
        a.titulo?.toLowerCase().includes(q) ||
        a.artista?.toLowerCase().includes(q) ||
        a.genero?.toLowerCase().includes(q)
    );

    const canciones = filtroActual === 'albums' ? [] : todasCanciones;
    const albums = filtroActual === 'canciones' ? [] : todosAlbums;

    if (!canciones.length && !albums.length) {
        sinRes.classList.remove('hidden');
        resultados.classList.add('hidden');
        return;
    }

    sinRes.classList.add('hidden');
    resultados.classList.remove('hidden');

    const u = db.getUsuarioActual();
    const colaIds = canciones.map(c => c.id);

    const resCan = document.getElementById('res-canciones');
    const resCanWrap = document.getElementById('res-canciones-wrap');
    if (canciones.length) {
        resCanWrap.classList.remove('hidden');
        resCan.innerHTML = canciones.map(c => {
            const liked = u ? db.tienelike(u.id, c.id) : false;
            return `
    <div class="flex items-center gap-4 p-2 rounded-xl hover:bg-surface group cursor-pointer"
        onclick="reproducirDesdeResultado('${c.id}',${JSON.stringify(colaIds)})">
        <div class="w-12 h-12 rounded-lg overflow-hidden relative shrink-0 bg-surface border border-border flex items-center justify-center">
            ${c.portada ? `<img src="${c.portada}" class="w-full h-full object-cover" onerror="this.style.display='none'">` : '<span class="material-symbols-outlined text-text-muted text-sm">music_note</span>'}
            <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span class="material-symbols-outlined text-white text-xl" style="font-variation-settings:'FILL' 1">play_arrow</span>
            </div>
        </div>
        <div class="flex-1 min-w-0">
            <h4 class="font-semibold text-sm truncate">${c.titulo}</h4>
            <p class="text-xs text-text-muted truncate">${c.artista}${c.genero ? ' · ' + c.genero : ''}</p>
        </div>
        <div class="hidden md:block text-xs text-text-muted">${c.duracion || '—'}</div>
        <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onclick="event.stopPropagation(); toggleLikeBuscar('${c.id}',this)" class="p-2 hover:bg-border rounded-full">
                <span class="material-symbols-outlined text-xl ${liked ? 'text-primary' : 'text-text-muted'}" style="${liked ? `font-variation-settings:'FILL' 1` : ''}">favorite${liked ? '' : '_border'}</span>
            </button>
            <button class="p-2 hover:bg-border rounded-full text-text-muted">
                <span class="material-symbols-outlined text-xl">more_horiz</span>
            </button>
        </div>
    </div>`;
        }).join('');
    } else {
        resCanWrap.classList.add('hidden');
    }

    const resAlb = document.getElementById('res-albums');
    const resAlbWrap = document.getElementById('res-albums-wrap');
    if (albums.length) {
        resAlbWrap.classList.remove('hidden');
        resAlb.innerHTML = albums.map(a => `
    <div class="bg-surface border border-border p-4 rounded-2xl group cursor-pointer hover:shadow-md transition-all">
        <div class="w-full aspect-square rounded-xl overflow-hidden mb-4 shadow-sm relative bg-border flex items-center justify-center">
            ${a.portada
                ? `<img src="${a.portada}" class="w-full h-full object-cover">`
                : '<span class="material-symbols-outlined text-text-muted text-3xl">album</span>'}
            <div class="absolute bottom-2 right-2 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                <span class="material-symbols-outlined text-xl" style="font-variation-settings:'FILL' 1">play_arrow</span>
            </div>
        </div>
        <h4 class="font-bold text-sm truncate">${a.titulo}</h4>
        <p class="text-xs text-text-muted">${a.artista}${a.año ? ' · ' + a.año : ''}</p>
    </div>`).join('');
    } else {
        resAlbWrap.classList.add('hidden');
    }
}

function reproducirDesdeResultado(id, colaIds) {
    const c = db.getCanciones().find(x => x.id === id);
    if (!c) return;

    sessionStorage.setItem('sp_now', JSON.stringify(c));
    const setText = (elId, v) => { const e = document.getElementById(elId); if (e) e.textContent = v; };
    setText('player-title', c.titulo || '—');
    setText('player-artist', c.artista || '—');
    setText('player-duration', c.duracion || '—');

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

function toggleLikeBuscar(id, btn) {
    const u = db.getUsuarioActual();
    if (!u) return;
    const liked = db.toggleLike(u.id, id);
    const icon = btn.querySelector('.material-symbols-outlined');
    if (!icon) return;
    icon.textContent = liked ? 'favorite' : 'favorite_border';
    icon.className = `material-symbols-outlined text-xl ${liked ? 'text-primary' : 'text-text-muted'}`;
    icon.style.fontVariationSettings = liked ? "'FILL' 1" : "'FILL' 0";
}

function renderGeneros() {
    const canciones = db.getCanciones();
    const generos = [...new Set(canciones.map(c => c.genero).filter(Boolean))];
    const el = document.getElementById('generos-grid');
    if (!el) return;
    if (!generos.length) {
        el.innerHTML = `<div class="col-span-full text-center py-10 text-text-muted">
      <span class="material-symbols-outlined text-4xl block mb-2 opacity-30">category</span>
      <p class="text-sm">No hay categorías aún</p>
    </div>`;
        return;
    }
    el.innerHTML = generos.map((g, i) => `
        <div onclick="document.getElementById('search-input').value='${g}'; buscar('${g}')"
            class="cursor-pointer ${coloresGenero[i % coloresGenero.length]} rounded-2xl p-5 text-white font-bold text-lg shadow-md hover:opacity-90 transition-opacity">
            ${g}
        </div>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    const u = db.getUsuarioActual();
    if (!u) { location.href = 'login-registro.html'; return; }
    renderGeneros();
    // Leer query de URL
    const q = new URLSearchParams(location.search).get('q') || '';
    if (q) {
        document.getElementById('search-input').value = q;
        buscar(q);
    }
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