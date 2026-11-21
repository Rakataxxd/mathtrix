// Cliente de la API + sesion.
import { createContext, useContext } from 'react';

let token = null;
try { token = localStorage.getItem('mtx_token'); } catch {}
export const getToken = () => token;
export function setToken(t) { token = t; try { t ? localStorage.setItem('mtx_token', t) : localStorage.removeItem('mtx_token'); } catch {} }

export async function api(ruta, { metodo, cuerpo, form } = {}) {
  const r = await fetch('/api' + ruta, {
    method: metodo || (cuerpo || form ? 'POST' : 'GET'),
    headers: { ...(token ? { authorization: 'Bearer ' + token } : {}), ...(cuerpo ? { 'content-type': 'application/json' } : {}) },
    body: form || (cuerpo ? JSON.stringify(cuerpo) : undefined),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Error ' + r.status);
  return d;
}

// tema visual: claro por defecto; el oscuro se recuerda en este navegador
export function getTema() { try { return localStorage.getItem('mtx_tema') === 'oscuro' ? 'oscuro' : 'claro'; } catch { return 'claro'; } }
export function setTema(t) {
  try { localStorage.setItem('mtx_tema', t); } catch {}
  if (t === 'oscuro') document.documentElement.dataset.tema = 'oscuro'; else delete document.documentElement.dataset.tema;
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', t === 'oscuro' ? '#050508' : '#f4f4f7');
}

export const Sesion = createContext(null);
export const useSesion = () => useContext(Sesion);

export function hace(fecha) {
  const s = (Date.now() - new Date(fecha + (String(fecha).endsWith('Z') ? '' : 'Z')).getTime()) / 1000;
  if (s < 60) return 'hace un momento';
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  return `hace ${Math.floor(s / 86400)} d`;
}
export const dur = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
export const vistas = (n) => (n >= 1000 ? (n / 1000).toFixed(1) + ' k' : n || 0) + ' vistas';
export const inicial = (n) => (n || '?').trim()[0].toUpperCase();
