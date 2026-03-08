// js/navegacion.js
document.addEventListener('DOMContentLoaded', () => {
    // Agregar event listeners a todos los enlaces de navegación
    configurarNavegacion();
});

function configurarNavegacion() {
    // Sidebar navigation
    const navLinks = {
        'inicio.html': document.querySelectorAll('a[href="inicio.html"]'),
        'buscar.html': document.querySelectorAll('a[href="buscar.html"]'),
        'biblioteca.html': document.querySelectorAll('a[href="biblioteca.html"]'),
        'perfil.html': document.querySelectorAll('a[href="perfil.html"]'),
        'login-registro.html': document.querySelectorAll('a[href="login-registro.html"]')
    };

    // Agregar listeners a cada enlace
    Object.entries(navLinks).forEach(([pagina, elementos]) => {
        elementos.forEach(enlace => {
            enlace.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = pagina;
            });
        });
    });

    // Botones específicos
    const botonesNavegacion = {
        'inicio.html': [
            ...document.querySelectorAll('button:contains("Escuchar ahora")'),
            ...document.querySelectorAll('button:contains("Reproducir mix")'),
            ...document.querySelectorAll('button:contains("Explorar")')
        ],
        'buscar.html': [
            ...document.querySelectorAll('input[type="text"][placeholder*="Buscar"]')
        ]
    };

    // Botón de crear playlist
    const btnCrearPlaylist = document.querySelector('button:contains("Crear playlist")');
    if (btnCrearPlaylist) {
        btnCrearPlaylist.addEventListener('click', () => {
            window.location.href = 'biblioteca.html';
        });
    }

    // Botones de "Show all" / "Ver todo"
    document.querySelectorAll('button').forEach(btn => {
        if (btn.textContent.includes('Show all') || btn.textContent.includes('Ver todo')) {
            btn.addEventListener('click', () => {
                window.location.href = 'biblioteca.html';
            });
        }
    });
}