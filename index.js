import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import { getUser, getRepos, getContributions, getTopLanguages } from './github.js';
import tinycolor from 'tinycolor2';

const app = express();
app.use(cors());

const DEFAULT_THEME = 'dark';
const THEMES = {
  dark: { bg: '#0d1117', fg: '#c9d1d9', accent: '#58a6ff', muted: '#8b949e' },
  light: { bg: '#ffffff', fg: '#24292f', accent: '#0366d6', muted: '#6a737d' },
  simple: { bg: '#f6f8fa', fg: '#24292f', accent: '#2ea44f', muted: '#6a737d' }
};

function themeOf(name) {
  return THEMES[name] || THEMES[DEFAULT_THEME];
}

function svgHeader(width, height) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
}

// /api/stats?username=...&theme=dark
app.get('/api/stats', async (req, res) => {
  try {
    const username = req.query.username;
    const theme = themeOf(req.query.theme);
    if (!username) return res.status(400).send('username is required');

    const user = await getUser(username);
    const repos = await getRepos(username);

    // calculate star & fork totals
    let totalStars = 0, totalForks = 0;
    for (const r of repos) {
      totalStars += r.stargazers_count || 0;
      totalForks += r.forks_count || 0;
    }

    const width = 540, height = 120;
    const svg = `${svgHeader(width, height)}\n  <rect width="100%" height="100%" fill="${theme.bg}" rx="12"/>\n  <text x="24" y="36" font-size="20" fill="${theme.accent}" font-family="Inter, Arial">GitHub • ${user.login}</text>\n  <text x="24" y="62" font-size="14" fill="${theme.fg}">Followers: ${user.followers}</text>\n  <text x="150" y="62" font-size="14" fill="${theme.fg}">Public Repos: ${user.public_repos}</text>\n  <text x="330" y="62" font-size="14" fill="${theme.fg}">Total Stars: ${totalStars}</text>\n  <text x="24" y="90" font-size="14" fill="${theme.fg}">Company: ${user.company || '—'}</text>\n</svg>`;

    res.set('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// /api/langs?username=...&theme=dark
app.get('/api/langs', async (req, res) => {
  try {
    const username = req.query.username;
    const theme = themeOf(req.query.theme);
    if (!username) return res.status(400).send('username is required');

    const langs = await getTopLanguages(username); // returns [{name, bytes}]
    const width = 520, height = 160;

    // build bars
    const total = langs.reduce((s, l) => s + l.bytes, 0) || 1;
    let x = 24, y = 30;
    let bars = '';
    langs.slice(0,6).forEach((l, i) => {
      const pct = Math.round((l.bytes/total)*100);
      bars += `<text x="${x}" y="${y}" font-size="12" fill="${theme.fg}">${i+1}. ${l.name} — ${pct}%</text>`;
      y += 22;
    });

    const svg = `${svgHeader(width, height)}\n  <rect width="100%" height="100%" fill="${theme.bg}" rx="12"/>\n  <text x="24" y="18" font-size="16" fill="${theme.accent}">Top languages • ${username}</text>\n  ${bars}\n</svg>`;

    res.set('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// /api/contrib?username=...&theme=dark
// Renders a 7x52 contribution grid using GraphQL contributions.
app.get('/api/contrib', async (req, res) => {
  try {
    const username = req.query.username;
    const theme = themeOf(req.query.theme);
    const showYear = req.query.year || null; // optional
    if (!username) return res.status(400).send('username is required');

    const contrib = await getContributions(username, showYear); // returns array of weeks -> array of 7 days with counts
    // find max to scale colors
    let max = 0;
    for (const week of contrib) for (const day of week) if (day.count > max) max = day.count;
    max = Math.max(max, 1);

    const cell = 10, gap = 3;
    const width = contrib.length * (cell + gap) + 48;
    const height = 7 * (cell + gap) + 48;

    const colorFor = (n) => {
      if (n === 0) return theme.bg === '#ffffff' ? '#ebedf0' : '#0b1220';
      const t = Math.min(1, n / max);
      // mix accent color with fg
      return tinycolor(theme.accent).lighten(t*30).toString();
    };

    let rects = '';
    for (let w = 0; w < contrib.length; w++) {
      const week = contrib[w];
      for (let d = 0; d < 7; d++) {
        const day = week[d] || {count:0};
        const cx = 24 + w * (cell + gap);
        const cy = 24 + d * (cell + gap);
        rects += `<rect x="${cx}" y="${cy}" width="${cell}" height="${cell}" rx="2" fill="${colorFor(day.count)}"><title>${day.date}: ${day.count} contributions</title></rect>`;
      }
    }

    const svg = `${svgHeader(width, height)}\n  <rect width="100%" height="100%" fill="${theme.bg}" rx="12"/>\n  <text x="16" y="16" font-size="12" fill="${theme.accent}">${username} — Contributions</text>\n  ${rects}\n</svg>`;

    res.set('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// /api/snake?username=...&theme=dark
// A simple animated snake that flows through days with contributions (SVG animation)
app.get('/api/snake', async (req, res) => {
  try {
    const username = req.query.username;
    const theme = themeOf(req.query.theme);
    if (!username) return res.status(400).send('username is required');

    const contrib = await getContributions(username);
    // flatten timeline and pick positions where count > 0
    const coords = [];
    const cell = 10, gap = 3;
    for (let w = 0; w < contrib.length; w++) {
      for (let d = 0; d < 7; d++) {
        const c = contrib[w][d];
        const cx = 24 + w * (cell + gap) + cell/2;
        const cy = 24 + d * (cell + gap) + cell/2;
        coords.push({x:cx, y:cy, c: c.count});
      }
    }

    // snake path across all coords
    const path = coords.map(p => `${p.x},${p.y}`).join(' ');

    const svg = `${svgHeader(800,160)}\n  <rect width="100%" height="100%" fill="${theme.bg}" rx="12"/>\n  <polyline points="${path}" fill="none" stroke="${theme.accent}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">\n    <animate attributeName="stroke-dashoffset" from="0" to="-1000" dur="6s" repeatCount="indefinite" />\n  </polyline>\n</svg>`;

    res.set('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// fallback for local run
if (process.env.PORT) {
  const port = parseInt(process.env.PORT, 10) || 3000;
  app.listen(port, () => console.log(`Server running on port ${port}`));
}

export default app;