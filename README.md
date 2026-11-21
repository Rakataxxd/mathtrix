# Mathtrix

Videos de matemática personalizados para cada alumno (misión: subir el nivel de Guatemala en PISA).
El profesor crea curso y clases, sube su material y Mathtrix arma el brief (alineado al CNB si se marca).
Cada alumno genera su video: gancho absurdo con sus gustos e ídolos → contenido paso a paso → reto (mini test).

## Correr

```
npm install
python -m pip install sympy edge-tts
npm run build
npm run seed      # cuentas demo + 6 videos reales (clave: mathtrix)
npm run server    # http://127.0.0.1:8110
```

Cuentas demo: `profe@demo.gt`, `diego@demo.gt`, `sofi@demo.gt` · clave `mathtrix` · código de clase `MTX-3B0A`.
Desarrollo con recarga: `npm run server` + `npm run dev` (Vite en 5173 con proxy).

## Cómo funciona un video

1. **Guion**: Claude Haiku 5.5 vía `claude -p` (suscripción, sin API key), en streaming. Solo elige escenas y explica.
   Respaldo: qwen3 en la RTX 5050 (Ollama por Tailscale) y, si todo falla, plantillas sin IA.
2. **Cuentas**: `motor/worker.py` (proceso ya cargado) calcula cada paso con sympy en fracciones exactas
   y verifica el resultado con una expresión independiente. Si no cierra, el guion se rechaza.
3. **Voz**: ElevenLabs Flash v2.5 (voces latinas «Dan» y «Sandra») con marcas por palabra (subtítulos karaoke).
   Key en `.env` como `ELEVENLABS_API_KEY` (no se sube a git). Sin key o sin saldo pasa solo a edge-tts es-GT.
   Cada escena se graba apenas Haiku la termina de escribir; caché por frase y sin pedir dos veces la misma.
4. **Video**: no se renderiza. Se guarda un timeline JSON y `@remotion/player` lo dibuja en el navegador
   (`web/src/video`): 10 tipos de escena, fórmulas que se transforman símbolo a símbolo, cámara viva,
   fondo en 3 capas, mascota que habla, grano y viñeta.
5. **Pre-generación**: al abrir una clase, el Short del alumno ya empieza a generarse.

## Data que se registra

Play, pausa, rebobinar, salto, fin, latidos cada 5 s, pestaña oculta, velocidad, likes, comentarios y cada
respuesta del test con su tiempo. Con eso: retención, dónde se traban, abandono, estilo de gancho que mejor
funciona por alumno, temas débiles. El perfil se retroalimenta al siguiente video.

## Variables

`PORT` (8110), `HOST` (127.0.0.1; para link público poner 0.0.0.0 o túnel), `MATHTRIX_MODELO`,
`MATHTRIX_EFFORT`, `ELEVENLABS_API_KEY`, `ELEVEN_MODELO`, `ELEVEN_VOZ_H`, `ELEVEN_VOZ_M`, `MATHTRIX_OLLAMA` (URLs separadas por coma), `MATHTRIX_SIN_IA=1` (solo plantillas).

## Pruebas

`node scripts/e2e.mjs` (flujo completo por API) · `node scripts/prueba.mjs` (capturas headless en `data/capturas`).

Los alumnos `alumno1..10@demo.gt` llevan eventos y tests **sintéticos** (marcados `demo=1`) para que el panel
del profe tenga datos. Para empezar limpio: borrar `data/` y correr `npm run seed`.
