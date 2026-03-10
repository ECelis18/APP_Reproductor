# 🎵 SpotiPobre

> Aplicación web de música inspirada en Spotify, construida con HTML, CSS (Tailwind) y JavaScript puro usando `localStorage` como base de datos.

---

## 👥 Integrantes

_(Sara Galeano)_
_(Daniela Bravo)_
_(Omar Buelvas)_ 
_(Emanuel Celis)_

---

## 📋 Descripción

SpotiPobre es una aplicación de streaming de música de página única (SPA) que simula las funcionalidades principales de Spotify. Toda la información se almacena en el `localStorage` del navegador, sin necesidad de servidor ni base de datos externa.

---

## ✨ Funcionalidades

### 🔐 Autenticación
- Registro de nuevos usuarios con nombre, usuario, correo y contraseña
- Inicio de sesión con validación
- Cierre de sesión
- Usuario administrador predeterminado: `admin@spotipobre.com` / `admin123`

### 🏠 Inicio
- Vista de canciones y álbumes disponibles en la biblioteca
- Reproducción de canciones desde la lista
- Tarjeta de acceso rápido al panel de administración (solo admins)

### 🔍 Buscar
- Búsqueda en tiempo real por título, artista o género
- Filtros por canciones o álbumes
- Explorador de categorías/géneros

### 📚 Biblioteca
- CRUD completo de playlists personales
- Vista de canciones con "Me gusta"
- Modal para crear/editar playlists con vista previa de portada

### 👤 Perfil
- Edición de nombre y avatar
- Estadísticas del usuario (playlists, likes, canciones)
- **Panel de Administración** (solo admins):
  - CRUD de canciones (con URL de YouTube/SoundCloud)
  - CRUD de álbumes
  - Gestión de usuarios

### 🎵 Reproductor
- Barra de reproducción fija en la parte inferior
- Soporte para YouTube y SoundCloud embebidos
- Controles: anterior, play/pause, siguiente
- Sistema de likes desde el reproductor
- Estado persistente entre navegaciones via `sessionStorage`

### 🌙 Tema
- Modo claro / oscuro con persistencia en `localStorage`

---

## 🗂️ Estructura de Archivos

```
spotipobre/
├── inicio.html          # Página principal
├── buscar.html          # Búsqueda de contenido
├── biblioteca.html      # Playlists del usuario
├── perfil.html          # Perfil y panel admin
├── login-registro.html  # Autenticación
├── tema.css             # Estilos globales y variables CSS
└── js/
    ├── db.js            # Capa de datos (localStorage)
    ├── tema.js          # Modo oscuro/claro y header
    ├── auth.js          # Login y registro
    ├── inicio.js        # Lógica de inicio y reproductor
    ├── buscar.js        # Búsqueda y filtros
    ├── biblioteca.js    # Gestión de playlists
    ├── perfil.js        # Perfil y panel admin
    ├── notificacion.js  # Sistema de toasts
    ├── navegacion.js    # Helpers de navegación
    └── tailwind-config.js # Configuración de Tailwind
```

---

## 🗄️ Modelo de Datos (`localStorage`)

| Clave | Descripción |
|-------|-------------|
| `sp_usuarios` | Lista de usuarios registrados |
| `sp_canciones` | Catálogo de canciones |
| `sp_albums` | Catálogo de álbumes |
| `sp_playlists` | Playlists de todos los usuarios |
| `sp_likes` | Likes por usuario |
| `sp_usuario_actual` | Sesión activa |
| `sp_tema` | Preferencia de tema (dark/light) |
| `sp_player` | Estado del reproductor |

---

## 🚀 Cómo usar

1. Clona o descarga el repositorio
2. Abre `login-registro.html` en tu navegador (no requiere servidor)
3. Inicia sesión como admin:
   - **Email:** `admin@spotipobre.com`
   - **Contraseña:** `admin123`
4. Desde **Perfil → Gestionar**, agrega canciones con URLs de YouTube
5. ¡Listo para reproducir!

> ⚠️ Se recomienda usar un servidor local (Live Server, etc.) para evitar restricciones de CORS en algunos navegadores.

---

## 🛠️ Tecnologías

| Tecnología | Uso |
|------------|-----|
| HTML5 | Estructura de páginas |
| CSS3 + Tailwind CSS (CDN) | Estilos y diseño responsive |
| JavaScript ES6+ | Lógica de la aplicación |
| localStorage / sessionStorage | Persistencia de datos |
| YouTube / SoundCloud iFrame API | Reproducción de audio |
| Google Fonts — Inter | Tipografía |
| Material Symbols | Iconografía |

---

## 📌 Notas

- No requiere instalación ni dependencias externas
- Compatible con navegadores modernos (Chrome, Firefox, Edge)
- Los datos se almacenan localmente en el navegador del usuario
- Las URLs de audio deben ser de YouTube (`youtube.com/watch?v=...`) o SoundCloud

---
