// Base de datos SQLite nativa de Node (node:sqlite), sin dependencias nativas.
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
try { process.loadEnvFile(join(RAIZ, '.env')); } catch {}
export const DATA = process.env.MATHTRIX_DATA || join(RAIZ, 'data');
mkdirSync(join(DATA, 'uploads'), { recursive: true });
mkdirSync(join(DATA, 'media', 'tts'), { recursive: true });
mkdirSync(join(DATA, 'media', 'emoji'), { recursive: true });

export const db = new DatabaseSync(join(DATA, 'mathtrix.db'));
db.exec(`
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS usuarios(
  id INTEGER PRIMARY KEY, rol TEXT NOT NULL CHECK(rol IN ('alumno','profesor')),
  nombre TEXT NOT NULL, email TEXT UNIQUE NOT NULL, clave TEXT NOT NULL,
  color TEXT, curriculo TEXT DEFAULT 'cnb', demo INTEGER DEFAULT 0,
  creado TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS sesiones(token TEXT PRIMARY KEY, usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE, creado TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS perfiles(
  usuario_id INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
  respuestas TEXT NOT NULL, stats TEXT DEFAULT '{}', actualizado TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS cursos(
  id INTEGER PRIMARY KEY, profesor_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL, descripcion TEXT, grado TEXT, codigo TEXT UNIQUE NOT NULL,
  cnb INTEGER DEFAULT 1, color TEXT, creado TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS inscripciones(curso_id INTEGER REFERENCES cursos(id) ON DELETE CASCADE, alumno_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE, creado TEXT DEFAULT (datetime('now')), PRIMARY KEY(curso_id, alumno_id));
CREATE TABLE IF NOT EXISTS lecciones(
  id INTEGER PRIMARY KEY, curso_id INTEGER REFERENCES cursos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL, tema TEXT NOT NULL, objetivo TEXT, ejercicio TEXT,
  materiales_texto TEXT DEFAULT '', analisis TEXT, prompt TEXT,
  orden INTEGER DEFAULT 0, creado TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS materiales(
  id INTEGER PRIMARY KEY, leccion_id INTEGER REFERENCES lecciones(id) ON DELETE CASCADE,
  nombre TEXT, tipo TEXT, ruta TEXT, texto TEXT, creado TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS videos(
  id INTEGER PRIMARY KEY, leccion_id INTEGER REFERENCES lecciones(id) ON DELETE SET NULL,
  autor_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL, tema TEXT, etiquetas TEXT DEFAULT '[]', estilo TEXT,
  formato TEXT NOT NULL CHECK(formato IN ('vertical','horizontal')),
  timeline TEXT NOT NULL, quiz TEXT NOT NULL, duracion REAL, motor TEXT,
  publico INTEGER DEFAULT 1, vistas INTEGER DEFAULT 0, verificado INTEGER DEFAULT 1,
  ms_generacion INTEGER, creado TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS likes(video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE, usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE, valor INTEGER DEFAULT 1, PRIMARY KEY(video_id, usuario_id));
CREATE TABLE IF NOT EXISTS comentarios(id INTEGER PRIMARY KEY, video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE, usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE, texto TEXT NOT NULL, creado TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS intentos(
  id INTEGER PRIMARY KEY, video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  respuestas TEXT NOT NULL, aciertos INTEGER, total INTEGER, puntaje REAL, ms INTEGER,
  creado TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS eventos(
  id INTEGER PRIMARY KEY, usuario_id INTEGER, video_id INTEGER, sesion TEXT,
  tipo TEXT NOT NULL, t REAL, escena INTEGER, escena_tipo TEXT, extra TEXT,
  creado TEXT DEFAULT (datetime('now')));
CREATE INDEX IF NOT EXISTS ix_eventos_video ON eventos(video_id, tipo);
CREATE INDEX IF NOT EXISTS ix_eventos_usuario ON eventos(usuario_id);
CREATE INDEX IF NOT EXISTS ix_videos_leccion ON videos(leccion_id, autor_id);
CREATE TABLE IF NOT EXISTS dudas(
  id INTEGER PRIMARY KEY, usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE, video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
  t REAL, escena INTEGER, escena_tipo TEXT, pregunta TEXT NOT NULL, respuesta TEXT, creado TEXT DEFAULT (datetime('now')));
CREATE TABLE IF NOT EXISTS revisiones(
  id INTEGER PRIMARY KEY, usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE, leccion_id INTEGER,
  archivo TEXT, analisis TEXT, video_id INTEGER, creado TEXT DEFAULT (datetime('now')));
`);
// columnas nuevas (bases creadas antes): tipo de video y plantilla visual
for (const sql of ["ALTER TABLE videos ADD COLUMN tipo TEXT DEFAULT 'normal'", 'ALTER TABLE videos ADD COLUMN plantilla TEXT']) { try { db.exec(sql); } catch {} }
try { db.exec("UPDATE videos SET plantilla=json_extract(timeline,'$.estilo') WHERE plantilla IS NULL"); } catch {}

export const uno = (sql, ...p) => db.prepare(sql).get(...p);
export const todos = (sql, ...p) => db.prepare(sql).all(...p);
export const correr = (sql, ...p) => db.prepare(sql).run(...p);
export const json = (s, d = null) => { try { return s ? JSON.parse(s) : d; } catch { return d; } };
