const express = require('express');
const axios = require('axios');
const router = express.Router();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const BASE_URL = 'https://api.github.com';

const githubHeaders = {
  'Accept': 'application/vnd.github.v3+json',
  ...(GITHUB_TOKEN && { 'Authorization': `token ${GITHUB_TOKEN}` })
};

// GET /api/github/users/:location - Buscar usuarios por ubicación
router.get('/users/:location', async (req, res) => {
  try {
    const { location } = req.params;
    const { page = 1, per_page = 12, sort = 'followers' } = req.query;

    const response = await axios.get(`${BASE_URL}/search/users`, {
      headers: githubHeaders,
      params: {
        q: `location:${location}`,
        sort,
        order: 'desc',
        page,
        per_page
      }
    });

    const users = await Promise.all(
      response.data.items.slice(0, 12).map(async (user) => {
        try {
          const userDetail = await axios.get(`${BASE_URL}/users/${user.login}`, {
            headers: githubHeaders
          });
          return {
            id: user.id,
            login: user.login,
            avatar_url: user.avatar_url,
            html_url: user.html_url,
            name: userDetail.data.name,
            bio: userDetail.data.bio,
            company: userDetail.data.company,
            location: userDetail.data.location,
            public_repos: userDetail.data.public_repos,
            followers: userDetail.data.followers,
            following: userDetail.data.following
          };
        } catch {
          return {
            id: user.id,
            login: user.login,
            avatar_url: user.avatar_url,
            html_url: user.html_url,
            name: null,
            bio: null,
            followers: 0,
            public_repos: 0
          };
        }
      })
    );

    res.json({
      total_count: response.data.total_count,
      location,
      users,
      page: parseInt(page),
      per_page: parseInt(per_page)
    });
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json({
      error: 'Error al buscar usuarios de GitHub',
      details: error.response?.data?.message || error.message
    });
  }
});

// GET /api/github/repos/:location - Buscar repos populares por ubicación
router.get('/repos/:location', async (req, res) => {
  try {
    const { location } = req.params;
    const { page = 1, per_page = 10, sort = 'stars' } = req.query;

    const response = await axios.get(`${BASE_URL}/search/repositories`, {
      headers: githubHeaders,
      params: {
        q: `${location} in:description,readme`,
        sort,
        order: 'desc',
        page,
        per_page
      }
    });

    const repos = response.data.items.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      html_url: repo.html_url,
      homepage: repo.homepage,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      watchers_count: repo.watchers_count,
      open_issues_count: repo.open_issues_count,
      topics: repo.topics,
      owner: {
        login: repo.owner.login,
        avatar_url: repo.owner.avatar_url
      },
      created_at: repo.created_at,
      updated_at: repo.updated_at
    }));

    res.json({
      total_count: response.data.total_count,
      location,
      repos,
      page: parseInt(page),
      per_page: parseInt(per_page)
    });
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json({
      error: 'Error al buscar repositorios',
      details: error.response?.data?.message || error.message
    });
  }
});

// GET /api/github/user/:username - Detalle de un usuario
router.get('/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const response = await axios.get(`${BASE_URL}/users/${username}`, {
      headers: githubHeaders
    });

    const user = response.data;
    res.json({
      id: user.id,
      login: user.login,
      name: user.name,
      avatar_url: user.avatar_url,
      html_url: user.html_url,
      bio: user.bio,
      company: user.company,
      location: user.location,
      email: user.email,
      blog: user.blog,
      public_repos: user.public_repos,
      public_gists: user.public_gists,
      followers: user.followers,
      following: user.following,
      created_at: user.created_at
    });
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json({
      error: `Error al obtener usuario "${req.params.username}"`,
      details: error.response?.data?.message || error.message
    });
  }
});

module.exports = router;
