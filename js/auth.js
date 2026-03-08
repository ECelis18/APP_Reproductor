// js/auth.js — SpotiPobre
document.addEventListener('DOMContentLoaded', () => {
    // Si ya hay sesión, ir a inicio
    try {
        const u = JSON.parse(localStorage.getItem('sp_usuario_actual'));
        if (u) { location.href = 'inicio.html'; return; }
    } catch { }

    // Botón mostrar registro
    const showRegisterLink = document.getElementById('showRegisterLink');
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', e => {
            e.preventDefault();
            const loginSection = document.getElementById('loginSection');
            const registerForm = document.getElementById('registerForm');
            if (loginSection) loginSection.style.display = 'none';
            if (registerForm) registerForm.style.display = 'block';
        });
    }

    // Botón volver a login
    const showLoginLink = document.getElementById('showLoginLink');
    if (showLoginLink) {
        showLoginLink.addEventListener('click', e => {
            e.preventDefault();
            const registerForm = document.getElementById('registerForm');
            const loginSection = document.getElementById('loginSection');
            if (registerForm) registerForm.style.display = 'none';
            if (loginSection) loginSection.style.display = 'block';
        });
    }

    // Login submit
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', e => {
            e.preventDefault();
            const email = document.getElementById('loginEmail')?.value.trim();
            const pass = document.getElementById('loginPassword')?.value;
            if (!email || !pass) return showErr('loginErr', 'Completa todos los campos');
            const r = DB.loginUsuario(email, pass);
            if (r.ok) location.href = 'inicio.html';
            else showErr('loginErr', r.msg || 'Credenciales incorrectas');
        });
    }

    // Registro submit
    const registerForm = document.getElementById('registerUserForm');
    if (registerForm) {
        registerForm.addEventListener('submit', e => {
            e.preventDefault();
            const nombre = document.getElementById('registerName')?.value.trim();
            const username = document.getElementById('registerUsername')?.value.trim();
            const email = document.getElementById('registerEmail')?.value.trim();
            const pass = document.getElementById('registerPassword')?.value;
            const avatar = document.getElementById('registerAvatar')?.value.trim() || '';
            const rol = 'usuario';

            if (!nombre || !username || !email || !pass) return showErr('regErr', 'Completa todos los campos');
            if (pass.length < 6) return showErr('regErr', 'Contraseña mínimo 6 caracteres');

            const r = DB.registrarUsuario({ nombre, usuario: username, email, password: pass, avatar, rol });
            if (r.ok) {
                DB.setUsuarioActual({ id: r.usuario.id, nombre: r.usuario.nombre, usuario: r.usuario.usuario, avatar: r.usuario.avatar, email: r.usuario.email, rol: r.usuario.rol });
                location.href = 'inicio.html';
            } else showErr('regErr', r.msg || 'Error al registrar');
        });
    }
});

function showErr(id, msg) {
    let el = document.getElementById(id);
    if (!el) {
        el = document.createElement('p');
        el.id = id;
        el.className = 'text-red-500 text-sm font-medium mt-2 text-center';
        const form = document.getElementById(id === 'loginErr' ? 'loginForm' : 'registerUserForm');
        if (form) form.prepend(el);
    }
    if (el) {
        el.textContent = msg;
        el.style.display = 'block';
        clearTimeout(el._t);
        el._t = setTimeout(() => {
            if (el) el.style.display = 'none';
        }, 3500);
    }
}