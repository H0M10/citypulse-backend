const express = require('express');
const axios = require('axios');
const router = express.Router();

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;
const BASE_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

// GET /api/geocode/reverse/:lat/:lon - Geocodificación inversa
router.get('/reverse/:lat/:lon', async (req, res) => {
  try {
    const { lat, lon } = req.params;

    const response = await axios.get(
      `${BASE_URL}/${lon},${lat}.json`, {
        params: {
          access_token: MAPBOX_TOKEN,
          types: 'place,country',
          language: 'es'
        }
      }
    );

    const features = response.data.features;
    const place = features.find(f => f.place_type.includes('place'));
    const country = features.find(f => f.place_type.includes('country'));

    res.json({
      city: place?.text || 'Desconocido',
      country: country?.text || '',
      country_code: country?.properties?.short_code?.toUpperCase() || '',
      full_name: place?.place_name || `${lat}, ${lon}`,
      coordinates: {
        lat: parseFloat(lat),
        lon: parseFloat(lon)
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error en geocodificación inversa',
      details: error.message
    });
  }
});

// GET /api/geocode/search/:query - Buscar lugares por nombre
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;

    const response = await axios.get(
      `${BASE_URL}/${encodeURIComponent(query)}.json`, {
        params: {
          access_token: MAPBOX_TOKEN,
          types: 'place',
          language: 'es',
          limit: 5
        }
      }
    );

    const results = response.data.features.map(f => ({
      name: f.text,
      full_name: f.place_name,
      coordinates: {
        lon: f.center[0],
        lat: f.center[1]
      },
      country: f.context?.find(c => c.id.startsWith('country'))?.text || '',
      country_code: f.context?.find(c => c.id.startsWith('country'))?.short_code?.toUpperCase() || ''
    }));

    res.json({ query, results });
  } catch (error) {
    res.status(500).json({
      error: 'Error al buscar ubicación',
      details: error.message
    });
  }
});

module.exports = router;
