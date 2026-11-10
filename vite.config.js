import { defineConfig } from 'vite';

// API real da 99Coach: usada para os detalhes de cada perfil. Troque com API_99COACH=https://... npm run dev
const API = process.env.API_99COACH || 'https://99coach-prototipo.vercel.app';
const proxy = { '/api': { target: API, changeOrigin: true } };

export default defineConfig({ base: './', server: { host: true, port: 5173, proxy }, preview: { proxy }, build: { outDir: 'dist' } });
