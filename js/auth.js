// js/auth.js
document.addEventListener('DOMContentLoaded', () => {
    inicializarAutenticacion();

    // Verificar si ya hay sesión activa
    const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual'));
    if (usuarioActual && window.location.pathname.includes('login-registro.html')) {
        window.location.href = 'inicio.html';
    }
});

function inicializarAutenticacion() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegisterLink = document.getElementById('showRegisterLink');
    const showLoginLink = document.getElementById('showLoginLink');
    const registerUserForm = document.getElementById('registerUserForm');

    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            mostrarFormularioRegistro();
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            mostrarFormularioLogin();
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            manejarLogin();
        });
    }

    if (registerUserForm) {
        registerUserForm.addEventListener('submit', (e) => {
            e.preventDefault();
            manejarRegistro();
        });
    }
}

function mostrarFormularioRegistro() {
    // Ocultar elementos del login
    document.querySelector('.space-y-5').style.display = 'none'; // Ocultar formulario login
    document.querySelector('.relative.my-8').style.display = 'none'; // Ocultar divider
    document.querySelector('.text-center.mt-8').style.display = 'none'; // Ocultar footer link

    // Mostrar formulario de registro
    document.getElementById('registerForm').style.display = 'block';
}

function mostrarFormularioLogin() {
    // Ocultar formulario de registro
    document.getElementById('registerForm').style.display = 'none';

    // Mostrar elementos del login
    document.querySelector('.space-y-5').style.display = 'block';
    document.querySelector('.relative.my-8').style.display = 'block';
    document.querySelector('.text-center.mt-8').style.display = 'block';
}

function manejarLogin() {
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;

    if (!email || !password) {
        alert('Por favor completa todos los campos');
        return;
    }

    const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    const usuario = usuarios.find(u => u.email === email && u.password === password);

    if (usuario) {
        localStorage.setItem('usuarioActual', JSON.stringify({
            nombre: usuario.nombre,
            usuario: usuario.usuario,
            avatar: usuario.avatar || 'https://i.pinimg.com/736x/29/73/63/297363599c7b24c6c5c40760f576ce32.jpg',
            email: usuario.email
        }));

        window.location.href = 'inicio.html';
    } else {
        alert('Email o contraseña incorrectos');
    }
}

function manejarRegistro() {
    const nombre = document.getElementById('registerName')?.value.trim();
    const username = document.getElementById('registerUsername')?.value.trim();
    const email = document.getElementById('registerEmail')?.value.trim();
    const password = document.getElementById('registerPassword')?.value;
    const avatar = document.getElementById('registerAvatar')?.value.trim() || 'https://i.pinimg.com/736x/29/73/63/297363599c7b24c6c5c40760f576ce32.jpg';

    if (!nombre || !username || !email || !password) {
        alert('Por favor completa todos los campos obligatorios');
        return;
    }

    if (!email.includes('@') || !email.includes('.')) {
        alert('Por favor ingresa un email válido');
        return;
    }

    if (password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
    }

    const usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];

    if (usuarios.some(u => u.email === email)) {
        alert('Este email ya está registrado');
        return;
    }

    const nuevoUsuario = {
        nombre,
        usuario: username.startsWith('@') ? username : `@${username}`,
        email,
        password,
        avatar
    };

    usuarios.push(nuevoUsuario);
    localStorage.setItem('usuarios', JSON.stringify(usuarios));

    localStorage.setItem('usuarioActual', JSON.stringify({
        nombre: nuevoUsuario.nombre,
        usuario: nuevoUsuario.usuario,
        avatar: nuevoUsuario.avatar,
        email: nuevoUsuario.email
    }));

    alert('¡Registro exitoso! Bienvenido a SpotiPobre');
    window.location.href = 'inicio.html';
}