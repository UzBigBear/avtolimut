// api/index.js — Vercel Serverless Function
// Vercel bu faylni /api/* so'rovlari uchun serverless function sifatida ishlatadi.
// Express ilovamizni re-export qilamiz.
const app = require('../server/index');
module.exports = app;
