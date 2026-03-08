// js/tema.js
(function () {
    const guardarTema = localStorage.getItem('tema') || 'light';
    if (guardarTema === 'dark') {
        document.documentElement.classList.add('dark');
    }
})();

function cambioTema() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('tema', isDark ? 'dark' : 'light');
    actualizarTemaIcono();
}

function actualizarTemaIcono() {
    const isDark = document.documentElement.classList.contains('dark');
    document.querySelectorAll('.theme-toggle-icon').forEach(icon => {
        icon.textContent = isDark ? 'dark_mode' : 'light_mode';
    });
}

function cargarUsuarioPerfil() {
    const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual'));
    const esLoginPage = window.location.pathname.includes('login-registro.html');

    if (!usuarioActual && !esLoginPage) {
        window.location.href = 'login-registro.html';
        return;
    }

    const nombre = usuarioActual?.nombre || 'Invitado';
    const usuario = usuarioActual?.usuario || '@invitado';
    const avatar = usuarioActual?.avatar || 'https://i.pinimg.com/736x/29/73/63/297363599c7b24c6c5c40760f576ce32.jpg';

    document.querySelectorAll('.user-name').forEach(el => {
        el.textContent = nombre;
    });

    document.querySelectorAll('.user-handle').forEach(el => {
        el.textContent = usuario;
    });

    document.querySelectorAll('.user-avatar').forEach(el => {
        el.style.backgroundImage = `url("${avatar}")`;
    });
}

// ✅ FUNCIÓN PARA RESALTAR ENLACE ACTIVO (CORREGIDA)
function resaltarEnlaceActivo() {
    const paginaActual = window.location.pathname.split('/').pop() || 'inicio.html';

    // Mapeo actualizado con los nombres correctos de tus archivos
    const navMap = {
        'inicio.html': 'nav-inicio',
        'buscar.html': 'nav-buscar',
        'biblioteca.html': 'nav-library',
        'perfil.html': 'nav-perfil',
        'login-registro.html': 'nav-logout'
    };

    document.querySelectorAll('[id^="nav-"]').forEach(el => {
        el.classList.remove('bg-primary/10', 'text-primary', 'font-medium');
        el.classList.add('text-text-muted');
    });

    const activeId = navMap[paginaActual];
    if (activeId) {
        const activeLink = document.getElementById(activeId);
        if (activeLink) {
            activeLink.classList.remove('text-text-muted');
            activeLink.classList.add('bg-primary/10', 'text-primary', 'font-medium');
        }
    }
}

function cerrarSesion() {
    localStorage.removeItem('usuarioActual');
    window.location.href = 'login-registro.html';
    return false;
}

document.addEventListener('DOMContentLoaded', () => {
    actualizarTemaIcono();
    cargarUsuarioPerfil();
    resaltarEnlaceActivo();
});