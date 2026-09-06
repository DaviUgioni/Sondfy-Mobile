'use strict';

/**
 * Servidor pessoal de download de áudio para o app Sondfy.
 *
 * Envolve o `yt-dlp` (que precisa estar no PATH, junto com `ffmpeg`).
 * Uso PESSOAL: proteja com API_KEY e não exponha publicamente sem necessidade.
 *
 * Endpoints:
 *   GET /health                         -> "ok"
 *   GET /info?url=...&key=...            -> { title, durationSec, uploader, ext }
 *   GET /download?url=...&key=...&format=m4a|mp3
 *       -> devolve o arquivo de áudio; cabeçalhos X-Video-Title (URL-encoded),
 *          X-Audio-Ext, X-Video-Duration.
 *
 * Variáveis de ambiente:
 *   PORT               porta HTTP (default 3000)
 *   API_KEY            se definida, exigida em ?key= (recomendado)
 *   MAX_CONCURRENT     downloads simultâneos (default 2)
 *   MAX_DURATION_SEC   duração máxima aceita (default 5400 = 90 min)
 *   YTDLP_BIN          caminho do yt-dlp (default "yt-dlp")
 *   YTDLP_COOKIES      conteúdo de um cookies.txt (contorna bloqueio por IP)
 *   YTDLP_EXTRA_ARGS   args extras separados por espaço (ex.: --extractor-args "youtube:player_client=android")
 */

const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PORT = Number(process.env.PORT) || 3000;
const API_KEY = process.env.API_KEY || '';
const MAX_CONCURRENT = Number(process.env.MAX_CONCURRENT) || 2;
const MAX_DURATION_SEC = Number(process.env.MAX_DURATION_SEC) || 5400;
const YTDLP_BIN = process.env.YTDLP_BIN || 'yt-dlp';
const CMD_TIMEOUT_MS = 4 * 60 * 1000;

// cookies.txt opcional, gravado uma vez a partir da env.
let COOKIES_FILE = null;
if (process.env.YTDLP_COOKIES) {
  COOKIES_FILE = path.join(os.tmpdir(), 'sondfy-cookies.txt');
  try {
    fs.writeFileSync(COOKIES_FILE, process.env.YTDLP_COOKIES);
  } catch (err) {
    console.warn('[server] não consegui gravar YTDLP_COOKIES:', err.message);
    COOKIES_FILE = null;
  }
}
const EXTRA_ARGS = (process.env.YTDLP_EXTRA_ARGS || '').trim()
  ? process.env.YTDLP_EXTRA_ARGS.trim().split(/\s+/)
  : [];

const app = express();
app.disable('x-powered-by');

let inFlight = 0;

function checkKey(req, res) {
  if (!API_KEY) return true;
  if (req.query.key === API_KEY) return true;
  res.status(401).json({ error: 'chave inválida' });
  return false;
}

function validUrl(u) {
  return typeof u === 'string' && /^https?:\/\/[^\s]+$/i.test(u);
}

/** Roda o yt-dlp, resolve com { stdout, stderr } ou rejeita com Error. */
function runYtDlp(args, { timeout = CMD_TIMEOUT_MS } = {}) {
  return new Promise((resolve, reject) => {
    const base = ['--no-playlist', '--no-warnings', '--no-progress', '--no-call-home'];
    if (COOKIES_FILE) base.push('--cookies', COOKIES_FILE);
    const full = [...base, ...EXTRA_ARGS, ...args];

    const child = spawn(YTDLP_BIN, full, { windowsHide: true });
    let stdout = '';
    let stderr = '';
    const killer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(Object.assign(new Error('tempo esgotado'), { code: 'ETIMEDOUT' }));
    }, timeout);

    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('error', (err) => {
      clearTimeout(killer);
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(killer);
      if (code === 0) resolve({ stdout, stderr });
      else reject(Object.assign(new Error(`yt-dlp saiu com código ${code}`), { stderr, code }));
    });
  });
}

function parseInfoJson(stdout) {
  const line = stdout.trim().split('\n').filter(Boolean).pop();
  if (!line) throw new Error('yt-dlp não retornou metadados');
  return JSON.parse(line);
}

app.get('/health', (_req, res) => res.type('text').send('ok'));

app.get('/info', async (req, res) => {
  if (!checkKey(req, res)) return;
  const url = req.query.url;
  if (!validUrl(url)) return res.status(400).json({ error: 'url ausente ou inválida' });

  try {
    const { stdout } = await runYtDlp(['-J', '--skip-download', url], { timeout: 60000 });
    const info = parseInfoJson(stdout);
    res.json({
      title: info.title || info.id || 'Faixa',
      durationSec: Math.round(info.duration || 0),
      uploader: info.uploader || info.channel || '',
      ext: info.ext || 'm4a',
    });
  } catch (err) {
    console.warn('[info] falhou:', err.message);
    res.status(502).json({ error: 'não foi possível ler o vídeo', detail: tailErr(err) });
  }
});

app.get('/download', async (req, res) => {
  if (!checkKey(req, res)) return;
  const url = req.query.url;
  if (!validUrl(url)) return res.status(400).json({ error: 'url ausente ou inválida' });

  const format = req.query.format === 'mp3' ? 'mp3' : 'm4a';

  if (inFlight >= MAX_CONCURRENT) {
    return res.status(429).json({ error: 'servidor ocupado, tente em instantes' });
  }
  inFlight += 1;

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sondfy-'));
  const cleanup = () => {
    fs.rm(dir, { recursive: true, force: true }, () => {});
    inFlight = Math.max(0, inFlight - 1);
  };

  try {
    const out = path.join(dir, 'a.%(ext)s');
    const selector = format === 'mp3' ? 'ba/b' : 'ba[ext=m4a]/ba/b';
    const args = [
      '-f', selector,
      '--extract-audio', '--audio-format', format, '--audio-quality', '0',
      '--match-filter', `duration<?${MAX_DURATION_SEC}`,
      '-o', out,
      '--print-json', '--no-simulate',
      url,
    ];

    const { stdout } = await runYtDlp(args);
    let info = {};
    try {
      info = parseInfoJson(stdout);
    } catch {
      /* seguimos mesmo sem metadados */
    }

    const file = path.join(dir, `a.${format}`);
    if (!fs.existsSync(file)) {
      throw new Error('arquivo de áudio não foi gerado (vídeo muito longo ou indisponível?)');
    }
    const { size } = fs.statSync(file);
    const title = String(info.title || info.id || 'Faixa').slice(0, 200);

    res.setHeader('X-Video-Title', encodeURIComponent(title));
    res.setHeader('X-Audio-Ext', format);
    res.setHeader('X-Video-Duration', String(Math.round(info.duration || 0)));
    res.setHeader('Access-Control-Expose-Headers', 'X-Video-Title, X-Audio-Ext, X-Video-Duration');
    res.setHeader('Content-Type', format === 'mp3' ? 'audio/mpeg' : 'audio/mp4');
    res.setHeader('Content-Length', String(size));
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(title)}.${format}`
    );

    const stream = fs.createReadStream(file);
    stream.on('error', () => {
      if (!res.headersSent) res.status(500).end();
      cleanup();
    });
    res.on('close', cleanup);
    stream.pipe(res);
  } catch (err) {
    cleanup();
    const timedOut = err.code === 'ETIMEDOUT';
    console.warn('[download] falhou:', err.message);
    res
      .status(timedOut ? 504 : 502)
      .json({ error: timedOut ? 'tempo esgotado' : 'falha ao baixar', detail: tailErr(err) });
  }
});

function tailErr(err) {
  const s = (err && err.stderr) || err.message || '';
  return String(s).split('\n').filter(Boolean).slice(-3).join(' | ').slice(0, 500);
}

app.use((_req, res) => res.status(404).json({ error: 'rota não encontrada' }));

app.listen(PORT, () => {
  console.log(`[server] Sondfy yt-dlp na porta ${PORT}` + (API_KEY ? ' (protegido por API_KEY)' : ' (SEM API_KEY!)'));
});
