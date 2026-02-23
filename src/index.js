const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

const weatherRoutes = require('./routes/weather');
const githubRoutes = require('./routes/github');
const movieRoutes = require('./routes/movies');
const geocodeRoutes = require('./routes/geocode');

const app = express();
const PORT = process.env.PORT || 3001;

// Railway usa proxy, necesario para rate-limit
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(compression());
app.use(express.json());

// CORS
app.use(cors({
  origin: [
    'https://h0m10.github.io',
    'http://localhost:5173',
    'http://localhost:4173'
  ],
  methods: ['GET', 'POST'],
  credentials: true
}));

// Rate limiting global
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200,                  // máximo 200 requests por ventana
  message: {
    error: 'Demasiadas solicitudes, intenta de nuevo en 15 minutos',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Rutas
app.use('/api/weather', weatherRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/geocode', geocodeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: '✅ CityPulse API funcionando',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    apis: {
      openweather: !!process.env.OPENWEATHER_API_KEY,
      tmdb: !!process.env.TMDB_API_KEY,
      github: !!process.env.GITHUB_TOKEN,
      mapbox: !!process.env.MAPBOX_TOKEN
    }
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    name: 'CityPulse API',
    description: 'Backend proxy para la aplicación CityPulse',
    endpoints: [
      'GET /api/health',
      'GET /api/weather/:city',
      'GET /api/weather/coords/:lat/:lon',
      'GET /api/github/users/:location',
      'GET /api/github/repos/:location',
      'GET /api/movies/search/:query',
      'GET /api/movies/popular',
      'GET /api/geocode/reverse/:lat/:lon',
      'GET /api/geocode/search/:query'
    ]
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    status: err.status || 500
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

app.listen(PORT, () => {
  console.log(`CityPulse API corriendo en puerto ${PORT}`);
});

module.exports = app;
