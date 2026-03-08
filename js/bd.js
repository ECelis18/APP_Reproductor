const DB = {
    // --- CLAVES ---
    KEYS: {
        USUARIOS: 'sp_usuarios',
        CANCIONES: 'sp_canciones',
        ALBUMS: 'sp_albums',
        PLAYLISTS: 'sp_playlists',
        LIKES: 'sp_likes',
        USUARIO_ACTUAL: 'sp_usuario_actual',
        TEMA: 'sp_tema',
        PLAYER: 'sp_player',
    },

    // --- UTILS ---
    get(key) {
        try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; }
    },
    set(key, val) {
        localStorage.setItem(key, JSON.stringify(val));
    },
    genId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // --- USUARIO ACTUAL ---
    getUsuarioActual() { return this.get(this.KEYS.USUARIO_ACTUAL); },
    setUsuarioActual(u) { this.set(this.KEYS.USUARIO_ACTUAL, u); },
    cerrarSesion() {
        localStorage.removeItem(this.KEYS.USUARIO_ACTUAL);
        window.location.href = 'login-registro.html';
    },
    esAdmin() {
        const u = this.getUsuarioActual();
        return u && u.rol === 'admin';
    },

    // --- USUARIOS ---
    getUsuarios() { return this.get(this.KEYS.USUARIOS) || []; },
    guardarUsuarios(lista) { this.set(this.KEYS.USUARIOS, lista); },
    registrarUsuario({ nombre, usuario, email, password, avatar, rol }) {
        const usuarios = this.getUsuarios();
        if (usuarios.find(u => u.email === email)) return { ok: false, msg: 'Email ya registrado' };
        if (usuarios.find(u => u.usuario === usuario)) return { ok: false, msg: 'Nombre de usuario ya existe' };
        const nuevo = {
            id: this.genId(), nombre, email, password,
            usuario: usuario.startsWith('@') ? usuario : `@${usuario}`,
            avatar: avatar || 'https://i.pinimg.com/736x/29/73/63/297363599c7b24c6c5c40760f576ce32.jpg',
            rol: rol || 'usuario',
            creadoEn: new Date().toISOString()
        };
        usuarios.push(nuevo);
        this.guardarUsuarios(usuarios);
        return { ok: true, usuario: nuevo };
    },
    loginUsuario(email, password) {
        const u = this.getUsuarios().find(u => u.email === email && u.password === password);
        if (!u) return { ok: false, msg: 'Email o contraseña incorrectos' };
        const sesion = { id: u.id, nombre: u.nombre, usuario: u.usuario, avatar: u.avatar, email: u.email, rol: u.rol };
        this.setUsuarioActual(sesion);
        return { ok: true, usuario: sesion };
    },
    eliminarUsuario(id) {
        const lista = this.getUsuarios().filter(u => u.id !== id);
        this.guardarUsuarios(lista);
    },

    // --- ALBUMS ---
    getAlbums() { return this.get(this.KEYS.ALBUMS) || []; },
    guardarAlbums(lista) { this.set(this.KEYS.ALBUMS, lista); },
    crearAlbum({ titulo, artista, portada, genero, año }) {
        const albums = this.getAlbums();
        const nuevo = { id: this.genId(), titulo, artista, portada, genero, año, creadoEn: new Date().toISOString() };
        albums.push(nuevo);
        this.guardarAlbums(albums);
        return nuevo;
    },
    editarAlbum(id, datos) {
        const albums = this.getAlbums().map(a => a.id === id ? { ...a, ...datos } : a);
        this.guardarAlbums(albums);
    },
    eliminarAlbum(id) {
        this.guardarAlbums(this.getAlbums().filter(a => a.id !== id));
        // también eliminar canciones del album
        this.guardarCanciones(this.getCanciones().filter(c => c.albumId !== id));
    },

    // --- CANCIONES ---
    getCanciones() { return this.get(this.KEYS.CANCIONES) || []; },
    guardarCanciones(lista) { this.set(this.KEYS.CANCIONES, lista); },
    crearCancion({ titulo, artista, albumId, portada, genero, duracion, urlAudio }) {
        const canciones = this.getCanciones();
        const nueva = { id: this.genId(), titulo, artista, albumId, portada, genero, duracion, urlAudio, creadoEn: new Date().toISOString() };
        canciones.push(nueva);
        this.guardarCanciones(canciones);
        return nueva;
    },
    editarCancion(id, datos) {
        const canciones = this.getCanciones().map(c => c.id === id ? { ...c, ...datos } : c);
        this.guardarCanciones(canciones);
    },
    eliminarCancion(id) {
        this.guardarCanciones(this.getCanciones().filter(c => c.id !== id));
    },
    buscarCanciones(query) {
        const q = query.toLowerCase();
        return this.getCanciones().filter(c =>
            c.titulo.toLowerCase().includes(q) ||
            c.artista.toLowerCase().includes(q) ||
            (c.genero && c.genero.toLowerCase().includes(q))
        );
    },

    // --- LIKES ---
    getLikes() { return this.get(this.KEYS.LIKES) || {}; },
    getLikesDeUsuario(userId) { return (this.getLikes()[userId] || []); },
    toggleLike(userId, cancionId) {
        const likes = this.getLikes();
        if (!likes[userId]) likes[userId] = [];
        const idx = likes[userId].indexOf(cancionId);
        if (idx >= 0) likes[userId].splice(idx, 1);
        else likes[userId].push(cancionId);
        this.set(this.KEYS.LIKES, likes);
        return idx < 0; // true = liked
    },
    tienelike(userId, cancionId) {
        return (this.getLikes()[userId] || []).includes(cancionId);
    },

    // --- PLAYLISTS ---
    getPlaylists() { return this.get(this.KEYS.PLAYLISTS) || []; },
    guardarPlaylists(lista) { this.set(this.KEYS.PLAYLISTS, lista); },
    getPlaylistsDeUsuario(userId) { return this.getPlaylists().filter(p => p.userId === userId); },
    crearPlaylist({ nombre, descripcion, portada, userId }) {
        const playlists = this.getPlaylists();
        const nueva = { id: this.genId(), nombre, descripcion, portada, userId, canciones: [], creadoEn: new Date().toISOString() };
        playlists.push(nueva);
        this.guardarPlaylists(playlists);
        return nueva;
    },
    editarPlaylist(id, datos) {
        const playlists = this.getPlaylists().map(p => p.id === id ? { ...p, ...datos } : p);
        this.guardarPlaylists(playlists);
    },
    eliminarPlaylist(id) {
        this.guardarPlaylists(this.getPlaylists().filter(p => p.id !== id));
    },
    agregarCancionAPlaylist(playlistId, cancionId) {
        const playlists = this.getPlaylists().map(p => {
            if (p.id === playlistId && !p.canciones.includes(cancionId)) {
                return { ...p, canciones: [...p.canciones, cancionId] };
            }
            return p;
        });
        this.guardarPlaylists(playlists);
    },
    quitarCancionDePlaylist(playlistId, cancionId) {
        const playlists = this.getPlaylists().map(p => {
            if (p.id === playlistId) return { ...p, canciones: p.canciones.filter(c => c !== cancionId) };
            return p;
        });
        this.guardarPlaylists(playlists);
    },

    // --- PLAYER STATE ---
    getPlayer() { return this.get(this.KEYS.PLAYER) || { cancionId: null, cola: [], playing: false }; },
    setPlayer(state) { this.set(this.KEYS.PLAYER, state); },
    reproducirCancion(cancionId, cola = []) {
        this.setPlayer({ cancionId, cola, playing: true });
    },

    // --- SEED DATA ---
    inicializar() {
        // Si no hay admin, crear uno por defecto
        const usuarios = this.getUsuarios();
        if (!usuarios.find(u => u.rol === 'admin')) {
            this.registrarUsuario({
                nombre: 'Administrador',
                usuario: 'admin',
                email: 'admin@spotipobre.com',
                password: 'admin123',
                avatar: 'https://ui-avatars.com/api/?name=Admin&background=7f0df2&color=fff',
                rol: 'admin'
            });
        }
    }
};

// Inicializar al cargar
DB.inicializar();
console.log('DB cargado correctamente', DB ? '✓' : '✗');