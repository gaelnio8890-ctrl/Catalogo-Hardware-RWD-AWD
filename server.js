const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware AWD: detecta el dispositivo con las cabeceras HTTP de la petición
function detectarDispositivo(req, res, next) {
  const ua = req.headers['user-agent'] || '';
  const hintMovil = req.headers['sec-ch-ua-mobile']; // Client Hint: "?1" = móvil
  const esMovil =
    hintMovil === '?1' ||
    /Mobi|Android|iPhone|iPod|IEMobile|Opera Mini/i.test(ua);

  req.dispositivo = esMovil ? 'mobile' : 'desktop';

  // Importante para cachés/CDN: la respuesta cambia según estas cabeceras
  res.setHeader('Vary', 'User-Agent, Sec-CH-UA-Mobile');
  next();
}

app.get('/', (req, res) => res.redirect('/responsive'));

// Versión A (RWD): el mismo HTML para todos los clientes
app.get('/responsive', (req, res) => {
  res.render('desktop');
});

// Versión B (AWD): el servidor elige la plantilla según el dispositivo
app.get('/adaptive', detectarDispositivo, (req, res) => {
  console.log(`[AWD] ${req.dispositivo} -> ${req.headers['user-agent']}`);
  res.render(req.dispositivo);
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
  console.log(`  RWD: http://localhost:${PORT}/responsive`);
  console.log(`  AWD: http://localhost:${PORT}/adaptive`);
});