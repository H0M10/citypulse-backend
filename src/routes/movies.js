const express = require('express');
const axios = require('axios');
const router = express.Router();

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p';

// GET /api/movies/search/:query - Buscar películas por ciudad/lugar
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { page = 1, lang = 'es-ES' } = req.query;

    const response = await axios.get(`${BASE_URL}/search/movie`, {
      params: {
        api_key: API_KEY,
        query,
        page,
        language: lang,
        include_adult: false
      }
    });

    const movies = response.data.results.slice(0, 12).map(movie => ({
      id: movie.id,
      title: movie.title,
      original_title: movie.original_title,
      overview: movie.overview?.substring(0, 200) + (movie.overview?.length > 200 ? '...' : ''),
      poster_url: movie.poster_path ? `${IMG_BASE}/w342${movie.poster_path}` : null,
      backdrop_url: movie.backdrop_path ? `${IMG_BASE}/w780${movie.backdrop_path}` : null,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
      popularity: movie.popularity,
      genre_ids: movie.genre_ids
    }));

    res.json({
      total_results: response.data.total_results,
      query,
      movies,
      page: response.data.page,
      total_pages: response.data.total_pages
    });
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json({
      error: 'Error al buscar películas',
      details: error.response?.data?.status_message || error.message
    });
  }
});

// GET /api/movies/popular - Películas populares
router.get('/popular', async (req, res) => {
  try {
    const { page = 1, lang = 'es-ES' } = req.query;

    const response = await axios.get(`${BASE_URL}/movie/popular`, {
      params: {
        api_key: API_KEY,
        page,
        language: lang
      }
    });

    const movies = response.data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      overview: movie.overview?.substring(0, 200),
      poster_url: movie.poster_path ? `${IMG_BASE}/w342${movie.poster_path}` : null,
      backdrop_url: movie.backdrop_path ? `${IMG_BASE}/w780${movie.backdrop_path}` : null,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
      popularity: movie.popularity
    }));

    res.json({
      movies,
      page: response.data.page,
      total_pages: response.data.total_pages
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error al obtener películas populares',
      details: error.message
    });
  }
});

// GET /api/movies/:id - Detalle de una película
router.get('/detail/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { lang = 'es-ES' } = req.query;

    const response = await axios.get(`${BASE_URL}/movie/${id}`, {
      params: {
        api_key: API_KEY,
        language: lang,
        append_to_response: 'credits,videos'
      }
    });

    const movie = response.data;
    res.json({
      id: movie.id,
      title: movie.title,
      original_title: movie.original_title,
      tagline: movie.tagline,
      overview: movie.overview,
      poster_url: movie.poster_path ? `${IMG_BASE}/w500${movie.poster_path}` : null,
      backdrop_url: movie.backdrop_path ? `${IMG_BASE}/original${movie.backdrop_path}` : null,
      release_date: movie.release_date,
      runtime: movie.runtime,
      budget: movie.budget,
      revenue: movie.revenue,
      vote_average: movie.vote_average,
      vote_count: movie.vote_count,
      genres: movie.genres,
      production_countries: movie.production_countries,
      spoken_languages: movie.spoken_languages,
      cast: movie.credits?.cast?.slice(0, 10).map(c => ({
        name: c.name,
        character: c.character,
        profile_url: c.profile_path ? `${IMG_BASE}/w185${c.profile_path}` : null
      })),
      trailer: movie.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube')
        ? `https://www.youtube.com/watch?v=${movie.videos.results.find(v => v.type === 'Trailer').key}`
        : null
    });
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json({
      error: 'Error al obtener detalles de la película',
      details: error.response?.data?.status_message || error.message
    });
  }
});

module.exports = router;
