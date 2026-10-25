# Catalogo de Hardware: RWD vs. AWD

Práctica de laboratorio que implementa el mismo catálogo de 12 productos con dos estrategias de entrega de interfaces web y compara su rendimiento en móvil:

- **RWD (Responsive Web Design)** en `/responsive`: el servidor envía el mismo HTML a todos los clientes y el navegador adapta la interfaz con CSS Grid, Flexbox, media queries, `<picture>` y `srcset`.
- **AWD (Adaptive Web Design)** en `/adaptive`: el servidor inspecciona las cabeceras HTTP de la petición y renderiza una plantilla distinta según el dispositivo (`desktop.ejs` o `mobile.ejs`).

## Tecnologías

- Node.js
- Express
- EJS
- HTML, CSS y JavaScript sin frameworks
- Imágenes reducidas y convertidas a WebP con [images.weserv.nl](https://images.weserv.nl)

## Estructura del proyecto

```
Catalogo de Hardware/
├── server.js          # Servidor Express, rutas y middleware de detección
├── package.json
├── public/
│   ├── styles.css     # Estilos de la versión completa (RWD y AWD de escritorio)
│   └── script.js      # Filtros, comparación y gráfica de la versión completa
└── views/
    ├── desktop.ejs    # Versión completa (se usa en /responsive y en /adaptive para escritorio)
    └── mobile.ejs     # Versión ligera para celulares (solo en /adaptive)
```

## Requisitos

- [Node.js](https://nodejs.org) 18 o superior
- npm (se instala junto con Node.js)

## Instalación

```bash
git clone https://github.com/gaelnio8890-ctrl/Catalogo-Hardware-RWD-AWD.git
cd Catalogo-Hardware-RWD-AWD
npm install
```

`npm install` descarga las dependencias declaradas en `package.json` (Express y EJS).

## Arranque

```bash
node server.js
```

Por defecto el servidor escucha en el puerto 3000. Si está ocupado, usa otro:

```bash
# Linux / macOS
PORT=3001 node server.js

# Windows (PowerShell)
$env:PORT=3001; node server.js
```

Para detenerlo, presiona `Ctrl + C` en la terminal.

## Rutas

| Ruta | Descripción |
|---|---|
| `http://localhost:3000/responsive` | Versión RWD: siempre devuelve `desktop.ejs` |
| `http://localhost:3000/adaptive` | Versión AWD: devuelve `mobile.ejs` o `desktop.ejs` según el dispositivo |

`/` redirige a `/responsive`.

## Cómo funciona la detección en AWD

El middleware `detectarDispositivo` de `server.js` clasifica la petición como móvil si:

- la cabecera `Sec-CH-UA-Mobile` vale `?1`, o
- el `User-Agent` coincide con `Mobi`, `Android`, `iPhone`, `iPod`, `IEMobile` u `Opera Mini`.

La respuesta incluye `Vary: User-Agent, Sec-CH-UA-Mobile` para que cualquier caché o CDN distinga las dos variantes. Cada petición a `/adaptive` imprime en la terminal el dispositivo detectado, por ejemplo `[AWD] mobile -> ...`.

### Qué omite la vista móvil

`mobile.ejs` es una plantilla independiente, no la misma página con elementos ocultos:

- sin gráfica de comparación ni `<canvas>`
- sin filtros de RAM y almacenamiento ni comparación de productos
- solo 3 especificaciones por producto
- sin `styles.css` ni `script.js` (CSS y JS mínimos en línea)
- imágenes reducidas (180 px de ancho, WebP) con carga diferida

## Cómo probarlo

### En el navegador

1. Abre `http://localhost:3000/adaptive` en una ventana normal: recibes la versión completa y en la terminal aparece `[AWD] desktop`.
2. Abre DevTools (`F12`) y activa el modo dispositivo (`Ctrl + Shift + M`). Elige un viewport de **390 × 844**.
3. Recarga la página (`Ctrl + R`): recibes la versión ligera y en la terminal aparece `[AWD] mobile`.
4. En `/responsive` siempre recibes la versión completa, aunque estés en modo móvil.

### Con curl

Compara el tamaño del HTML que recibe un cliente móvil y uno de escritorio:

```bash
# Linux / macOS
curl -s -A "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile" http://localhost:3000/adaptive | wc -c
curl -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" http://localhost:3000/adaptive | wc -c
```

```powershell
# Windows (PowerShell)
curl.exe -s -A "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile" http://localhost:3000/adaptive | Measure-Object -Character
curl.exe -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" http://localhost:3000/adaptive | Measure-Object -Character
```

## Resultados de la auditoría

Condiciones: Chrome/Edge DevTools, viewport 390 × 844, red Fast 3G, CPU 4× slowdown, Disable cache. Valores: mediana de 3 corridas por ruta.

| Métrica | RWD (móvil) | AWD (móvil) | Delta |
|---|---|---|---|
| HTML transferido | 19.4 kB | 12.6 kB | -35.1% |
| Peso total transferido | 607 kB | 79.3 kB | -86.9% |
| Peticiones HTTP | 27 | 13 | -51.9% |
| Largest Contentful Paint (LCP) | 5.04 s | 1.33 s | -73.6% |
| Cumulative Layout Shift (CLS) | 0 | 0 | N/A |
| Tiempo de carga total (Finish) | 5.32 s | 2.15 s | -59.6% |
| DOMContentLoaded | 2.71 s | 1.21 s | -55.4% |

Delta = (AWD − RWD) / RWD × 100. El análisis completo, las capturas de DevTools y la discusión están en el reporte técnico en PDF.

### Notas sobre los resultados

- En RWD, `script.js` vuelve a envolver cada imagen en un `<picture>` nuevo, por lo que el navegador pide las imágenes dos veces (una desde el HTML y otra desde el script). Esto explica buena parte de las 27 peticiones.
- Las imágenes reducidas vienen de un servicio externo (`images.weserv.nl`), por lo que su tamaño puede variar entre cargas.
- La vista móvil de AWD tiene menos funciones que la de escritorio, por diseño.
- Se declaró un favicon vacío (`<link rel="icon" href="data:,">`) en ambas vistas para evitar el 404 de `/favicon.ico`.
- El laboratorio corre en local, sin CDN ni latencia real; los números indican el orden de magnitud, no valores de producción.

## Licencia

Proyecto académico. Uso educativo.
