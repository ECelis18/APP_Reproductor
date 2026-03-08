/**
 * SpotiPobre - Sistema de notificaciones
 */

let notificacionTimeout = null;

/**
 * Muestra una notificación temporal
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - 'ok' o 'error'
 */
function notificar(mensaje, tipo = 'ok') {
    const elemento = document.getElementById('sp-toast');
    if (!elemento) return;

    elemento.textContent = mensaje;
    elemento.style.background = tipo === 'error' ? '#ef4444' : 'var(--color-primary)';
    elemento.style.opacity = '1';
    elemento.style.transform = 'translateX(-50%) translateY(0)';

    clearTimeout(notificacionTimeout);
    notificacionTimeout = setTimeout(() => {
        elemento.style.opacity = '0';
        elemento.style.transform = 'translateX(-50%) translateY(2rem)';
    }, 2500);
}