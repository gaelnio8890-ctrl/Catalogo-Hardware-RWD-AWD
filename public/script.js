const productos = [...document.querySelectorAll('.grid-item')].map((tarjeta) => {
  const textoEspecificacion = (nombre) => {
    const elemento = [...tarjeta.querySelectorAll('.specs li')]
      .find((linea) => linea.querySelector('strong')?.textContent.trim().startsWith(nombre));
    return elemento?.textContent ?? '';
  };

  const obtenerNumero = (texto) => {
    const coincidencia = texto.match(/[\d,]+(?:\.\d+)?/);
    return coincidencia ? Number.parseFloat(coincidencia[0].replaceAll(',', '')) : 0;
  };

  const obtenerEspecificacionNumerica = (nombre) => {
    const coincidencia = textoEspecificacion(nombre).match(/[\d,]+(?:\.\d+)?/);
    return coincidencia ? Number.parseFloat(coincidencia[0].replaceAll(',', '')) : null;
  };

  const botonComparar = tarjeta.querySelector('.btn-comprar');
  botonComparar.textContent = 'Comparar';
  botonComparar.setAttribute('aria-pressed', 'false');

  return {
    tarjeta,
    nombre: tarjeta.querySelector('h3').textContent.trim(),
    precio: obtenerNumero(tarjeta.querySelector('.precio').textContent),
    ram: obtenerEspecificacionNumerica('RAM'),
    almacenamiento: obtenerEspecificacionNumerica('Almacenamiento'),
    botonComparar,
  };
});

const campoBusqueda = document.querySelector('#q');
const campoPrecio = document.querySelector('#precio');
const etiquetaPrecio = document.querySelector('#pv');
const campoRam = document.querySelector('#ram');
const campoAlmacenamiento = document.querySelector('#sto');
const botonLimpiar = document.querySelector('#reset');
const contenedorGrafica = document.querySelector('#grafica');
const seleccionados = new Set();

function prepararImagenesResponsivas() {
  const imageSizes = '(max-width: 639px) 92vw, (max-width: 1024px) 45vw, 24vw';
  const placeholder = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400"><rect width="640" height="400" fill="#eef2f7"/><rect x="245" y="115" width="150" height="115" rx="12" fill="#d6deea"/><circle cx="355" cy="150" r="15" fill="#fca311"/><path d="M265 210l42-48 28 30 20-22 30 40z" fill="#9aabc2"/><text x="320" y="280" text-anchor="middle" fill="#52627a" font-family="Arial,sans-serif" font-size="22">Imagen no disponible</text></svg>',
  )}`;

  document.querySelectorAll('.producto-img').forEach((imagen) => {
    const urlOriginal = imagen.getAttribute('src');
    if (!urlOriginal) {
      imagen.alt = 'Imagen no disponible';
      imagen.src = placeholder;
      return;
    }

    const picture = document.createElement('picture');
    const crearUrlOptimizada = (ancho, formato) =>
      `https://images.weserv.nl/?url=${encodeURIComponent(urlOriginal)}&w=${ancho}&output=${formato}`;

    const fuenteWebp = document.createElement('source');
    fuenteWebp.type = 'image/webp';
    fuenteWebp.sizes = imageSizes;
    fuenteWebp.srcset = [
      `${crearUrlOptimizada(360, 'webp')} 360w`,
      `${crearUrlOptimizada(720, 'webp')} 720w`,
      `${crearUrlOptimizada(1000, 'webp')} 1000w`,
    ].join(', ');
    picture.append(fuenteWebp);

    imagen.sizes = imageSizes;
    imagen.addEventListener('error', () => {
      if (imagen.dataset.placeholderShown) return;

      if (imagen.dataset.fallbackTried) {
        imagen.dataset.placeholderShown = 'true';
        imagen.src = placeholder;
        imagen.alt = 'Imagen no disponible';
        return;
      }

      imagen.dataset.fallbackTried = 'true';
      fuenteWebp.remove();
      imagen.src = urlOriginal;
    });
    imagen.parentNode.insertBefore(picture, imagen);
    picture.append(imagen);
  });
}

function configurarPanelResponsivo() {
  const panel = document.querySelector('#panel-controles');
  const breakpointMovil = window.matchMedia('(max-width: 639px)');
  const ajustarPanel = () => {
    panel.open = !breakpointMovil.matches;
  };

  ajustarPanel();
  breakpointMovil.addEventListener('change', ajustarPanel);
}

const formatearPrecio = (precio) => new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 2,
}).format(precio);

function aplicarFiltros() {
  const busqueda = campoBusqueda.value.trim().toLocaleLowerCase('es');
  const precioMaximo = Number(campoPrecio.value);
  const ramMinima = Number(campoRam.value);
  const almacenamientoMinimo = Number(campoAlmacenamiento.value);

  etiquetaPrecio.textContent = formatearPrecio(precioMaximo);

  productos.forEach((producto) => {
    const coincideBusqueda = producto.nombre.toLocaleLowerCase('es').includes(busqueda);
    const coincidePrecio = producto.precio <= precioMaximo;
    const coincideRam = producto.ram === null ? ramMinima === 0 : producto.ram >= ramMinima;
    const coincideAlmacenamiento = producto.almacenamiento === null
      ? almacenamientoMinimo === 0
      : producto.almacenamiento >= almacenamientoMinimo;

    producto.tarjeta.hidden = !(coincideBusqueda && coincidePrecio && coincideRam && coincideAlmacenamiento);
  });
}

function crearFila(metrica, producto, maximo) {
  const fila = document.createElement('div');
  fila.className = 'fila';

  const nombre = document.createElement('div');
  nombre.className = 'nombre';

  const etiquetaProducto = document.createElement('span');
  etiquetaProducto.textContent = producto.nombre;

  const valor = document.createElement('strong');
  const valores = {
    precio: formatearPrecio(producto.precio),
    ram: producto.ram === null ? 'No aplica' : `${producto.ram} GB`,
    almacenamiento: producto.almacenamiento === null ? 'No aplica' : `${producto.almacenamiento} GB`,
  };
  valor.textContent = valores[metrica];
  nombre.append(etiquetaProducto, valor);

  const pista = document.createElement('div');
  pista.className = 'pista';
  pista.setAttribute('aria-hidden', 'true');

  const barra = document.createElement('div');
  const claseBarra = {
    precio: 'precio-b',
    ram: 'ram-b',
    almacenamiento: 'sto-b',
  };
  barra.className = `barra ${claseBarra[metrica]}`;
  barra.style.width = `${maximo > 0 && producto[metrica] !== null
    ? (producto[metrica] / maximo) * 100
    : 0}%`;
  pista.append(barra);

  fila.append(nombre, pista);
  return fila;
}

function actualizarGrafica() {
  contenedorGrafica.replaceChildren();

  if (seleccionados.size < 2) {
    const mensaje = document.createElement('p');
    mensaje.className = 'vacio';
    mensaje.textContent = seleccionados.size === 0
      ? 'Marca "Comparar" en 2 o 3 productos.'
      : 'Selecciona un producto más para comparar.';
    contenedorGrafica.append(mensaje);
    return;
  }

  const productosSeleccionados = [...seleccionados];
  const metricas = [
    { clave: 'precio', titulo: 'Precio' },
    { clave: 'ram', titulo: 'RAM' },
    { clave: 'almacenamiento', titulo: 'Almacenamiento' },
  ];

  metricas.forEach(({ clave, titulo }) => {
    const grupo = document.createElement('section');
    grupo.className = 'grupo';

    const encabezado = document.createElement('h4');
    encabezado.textContent = titulo;
    grupo.append(encabezado);

    const maximo = Math.max(
      0,
      ...productosSeleccionados
        .map((producto) => producto[clave])
        .filter((valor) => valor !== null),
    );
    productosSeleccionados.forEach((producto) => {
      grupo.append(crearFila(clave, producto, maximo));
    });

    contenedorGrafica.append(grupo);
  });
}

productos.forEach((producto) => {
  producto.botonComparar.addEventListener('click', () => {
    if (seleccionados.has(producto)) {
      seleccionados.delete(producto);
      producto.botonComparar.classList.remove('seleccionado');
      producto.botonComparar.textContent = 'Comparar';
      producto.botonComparar.setAttribute('aria-pressed', 'false');
    } else if (seleccionados.size < 3) {
      seleccionados.add(producto);
      producto.botonComparar.classList.add('seleccionado');
      producto.botonComparar.textContent = 'Quitar';
      producto.botonComparar.setAttribute('aria-pressed', 'true');
    }

    productos.forEach((item) => {
      item.botonComparar.disabled = seleccionados.size === 3 && !seleccionados.has(item);
    });
    actualizarGrafica();
  });
});

campoBusqueda.addEventListener('input', aplicarFiltros);
campoPrecio.addEventListener('input', aplicarFiltros);
campoRam.addEventListener('change', aplicarFiltros);
campoAlmacenamiento.addEventListener('change', aplicarFiltros);

botonLimpiar.addEventListener('click', () => {
  campoBusqueda.value = '';
  campoPrecio.value = campoPrecio.max;
  campoRam.value = '0';
  campoAlmacenamiento.value = '0';
  aplicarFiltros();
});

prepararImagenesResponsivas();
configurarPanelResponsivo();
aplicarFiltros();
