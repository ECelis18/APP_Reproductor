(function () {
    const t = localStorage.getItem('sp_tema') || 'light';
    if (t === 'dark') document.documentElement.classList.add('dark');
})();

function cambioTema() {
    const dark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('sp_tema', dark ? 'dark' : 'light');
    document.querySelectorAll('.theme-toggle-icon').forEach(el => {
        el.textContent = dark ? 'dark_mode' : 'light_mode';
    });
}

function cerrarSesion() {
    if (typeof db !== 'undefined') db.cerrarSesion();
    else localStorage.removeItem('sp_usuario_actual');
    location.href = 'login-registro.html';
    return false;
}

// Carga avatar/nombre en header — llámalo después de DOMContentLoaded
function cargarInfoHeader() {
    try {
        const u = JSON.parse(localStorage.getItem('sp_usuario_actual'));
        if (!u) return;
        document.querySelectorAll('.user-name').forEach(el => el.textContent = u.nombre);
        document.querySelectorAll('.user-handle').forEach(el => el.textContent = u.usuario);
        document.querySelectorAll('.user-avatar').forEach(el => {
            if (u.avatar) el.style.backgroundImage = `url("${u.avatar}")`;
        });
    } catch { }
}

document.addEventListener('DOMContentLoaded', () => {
    // Aplicar icono correcto al cargar
    const dark = document.documentElement.classList.contains('dark');
    document.querySelectorAll('.theme-toggle-icon').forEach(el => {
        el.textContent = dark ? 'dark_mode' : 'light_mode';
    });
    cargarInfoHeader();
});