const express = require('express');
const axios = require('axios');
const router = express.Router();

const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// GET /api/weather/:city - Clima por nombre de ciudad
router.get('/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const { units = 'metric', lang = 'es' } = req.query;

    const response = await axios.get(`${BASE_URL}/weather`, {
      params: {
        q: city,
        appid: API_KEY,
        units,
        lang
      }
    });

    const data = response.data;
    res.json({
      city: data.name,
      country: data.sys.country,
      temperature: Math.round(data.main.temp),
      feels_like: Math.round(data.main.feels_like),
      temp_min: Math.round(data.main.temp_min),
      temp_max: Math.round(data.main.temp_max),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      icon_url: `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`,
      wind_speed: data.wind.speed,
      wind_deg: data.wind.deg,
      clouds: data.clouds.all,
      visibility: data.visibility,
      sunrise: new Date(data.sys.sunrise * 1000).toISOString(),
      sunset: new Date(data.sys.sunset * 1000).toISOString(),
      coordinates: {
        lat: data.coord.lat,
        lon: data.coord.lon
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json({
      error: status === 404
        ? `Ciudad "${req.params.city}" no encontrada`
        : 'Error al obtener datos del clima',
      details: error.response?.data?.message || error.message
    });
  }
});

// GET /api/weather/coords/:lat/:lon - Clima por coordenadas
router.get('/coords/:lat/:lon', async (req, res) => {
  try {
    const { lat, lon } = req.params;
    const { units = 'metric', lang = 'es' } = req.query;

    const response = await axios.get(`${BASE_URL}/weather`, {
      params: {
        lat,
        lon,
        appid: API_KEY,
        units,
        lang
      }
    });

    const data = response.data;
    res.json({
      city: data.name,
      country: data.sys.country,
      temperature: Math.round(data.main.temp),
      feels_like: Math.round(data.main.feels_like),
      temp_min: Math.round(data.main.temp_min),
      temp_max: Math.round(data.main.temp_max),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      icon_url: `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`,
      wind_speed: data.wind.speed,
      wind_deg: data.wind.deg,
      clouds: data.clouds.all,
      visibility: data.visibility,
      sunrise: new Date(data.sys.sunrise * 1000).toISOString(),
      sunset: new Date(data.sys.sunset * 1000).toISOString(),
      coordinates: { lat: parseFloat(lat), lon: parseFloat(lon) },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json({
      error: 'Error al obtener datos del clima por coordenadas',
      details: error.response?.data?.message || error.message
    });
  }
});

// GET /api/weather/forecast/:city - Pronóstico 5 días
router.get('/forecast/:city', async (req, res) => {
  try {
    const { city } = req.params;
    const { units = 'metric', lang = 'es' } = req.query;

    const response = await axios.get(`${BASE_URL}/forecast`, {
      params: {
        q: city,
        appid: API_KEY,
        units,
        lang,
        cnt: 40
      }
    });

    const data = response.data;
    const dailyForecasts = data.list.filter((_, index) => index % 8 === 0).map(item => ({
      date: item.dt_txt,
      temperature: Math.round(item.main.temp),
      temp_min: Math.round(item.main.temp_min),
      temp_max: Math.round(item.main.temp_max),
      description: item.weather[0].description,
      icon: item.weather[0].icon,
      icon_url: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`,
      humidity: item.main.humidity,
      wind_speed: item.wind.speed
    }));

    res.json({
      city: data.city.name,
      country: data.city.country,
      forecasts: dailyForecasts
    });
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json({
      error: 'Error al obtener pronóstico',
      details: error.response?.data?.message || error.message
    });
  }
});

module.exports = router;
