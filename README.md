# Music Bridge Karaoke

Spike PWA para validar una experiencia de karaoke en **Android Automotive** y **Chrome**, sin backend ni integraciones externas.

## Requisitos

- Node.js 20+
- npm

## Instalación

```bash
npm install
```

## Desarrollo local

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

- `/` — landing con explicación del spike
- `/car` — interfaz karaoke (modo camioneta) con letras mock y búsqueda LRCLIB
- `/debug` — viewport, user agent y display mode
- `/smoke` — prueba mínima de hidratación React
- `/js-smoke.html` — prueba JS vanilla (sin React)

## Letras reales con LRCLIB (Paso 2)

Flujo:

```
/car → GET /api/lyrics/search → LRCLIB → parseLrc → karaoke
```

En `/car`, pulsa **Buscar letra real** para consultar [LRCLIB](https://lrclib.net) vía el endpoint interno. No requiere API key ni base de datos.

### Probar localmente

1. Arranca la app: `npm run dev`
2. Abre `/car` y pulsa **Buscar letra real** en una canción conocida.
3. O prueba el endpoint directamente:

```
http://localhost:3000/api/lyrics/search?artist=The%20Weeknd&track=Blinding%20Lights
http://localhost:3000/api/lyrics/search?artist=Coldplay&track=Yellow
http://localhost:3000/api/lyrics/search?artist=The%20Weeknd&track=Blinding%20Lights&duration=200
```

### Probar en Railway

Sustituye el host por tu URL de Railway:

```
https://TU-APP.up.railway.app/api/lyrics/search?artist=Coldplay&track=Yellow
```

Luego abre `/car` en el navegador del coche o móvil y usa **Buscar letra real**.

### Estados de respuesta

| status | Significado |
|--------|-------------|
| `synced` | Letra LRC con timestamps; `/car` entra en modo karaoke sincronizado |
| `plain` | Solo texto sin timestamps; `/car` muestra modo lectura estático |
| `instrumental` | LRCLIB marca la pista como instrumental |
| `not_found` | Sin coincidencias; se conserva la letra mock |
| `error` | Fallo de red/timeout/LRCLIB; se conserva la letra mock |

### Canciones mock incluidas

- The Weeknd — Blinding Lights
- Coldplay — Yellow
- Daft Punk — Get Lucky
- Oasis — Wonderwall

## Si React no hidrata (botones muertos, todo "unknown")

1. **Reinicia el dev server** tras cambios de config:
   ```bash
   # Ctrl+C, luego:
   npm run dev
   ```
2. **Hard refresh** en el navegador: `Ctrl+Shift+R` (o vacía caché del sitio).
3. **Desregistra service workers viejos** en Chrome: DevTools → Application → Service Workers → Unregister. También puedes borrar datos del sitio para `localhost:3000`.
4. Si instalaste la PWA antes, desinstálala y vuelve a abrir en pestaña normal.
5. Compara `/js-smoke.html` (JS puro) vs `/smoke` (React). Si solo React falla, revisa la consola del navegador.
6. Corre siempre desde `music-bridge-karaoke/`, no desde el directorio padre `Equinox Karaoke/`.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Dev en `0.0.0.0` (PC + LAN + ngrok) |
| `npm run dev:turbo` | Dev con Turbopack |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run start:lan` | Producción en `0.0.0.0` |
| `npm run preview:mobile` | Build + producción en LAN (ideal con ngrok) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |

## Probar en iPhone / Android / Automotive (móvil)

**En PC (localhost) funciona, en móvil no** → casi siempre es acceso por **ngrok** o **IP de red** en modo dev.

Next.js 16 **bloquea** peticiones a `/_next/*` desde orígenes distintos a `localhost` en desarrollo. El HTML carga pero **React no hidrata** (botones muertos, `/smoke` en 0).

### Opción A — Dev + ngrok (rápido)

1. Reinicia el dev server **después** de cualquier cambio en `next.config.ts`:
   ```bash
   npm run dev
   ```
2. En otra terminal:
   ```bash
   ngrok http 3000
   ```
3. Abre la URL HTTPS de ngrok en el iPhone / camioneta.
4. En ngrok free, pulsa **Visit Site** en la pantalla de aviso la primera vez.
5. Valida en `/smoke`: debe decir **JS hidratado: sí** y el contador debe subir.

Los dominios `*.ngrok-free.dev`, `*.ngrok-free.app`, etc. ya están en `allowedDevOrigins`. Si usas otro túnel:

```bash
set ALLOWED_DEV_ORIGINS=mi-tunel.ejemplo.com
npm run dev
```

### Opción B — Producción local + ngrok (más fiable para demos)

Sin restricciones de dev; recomendado para pruebas en automotive:

```bash
npm run preview:mobile
ngrok http 3000
```

### Opción C — Misma Wi‑Fi (sin ngrok)

El dev server escucha en todas las interfaces (`-H 0.0.0.0`). Usa la URL **Network** que muestra Next.js, ej. `http://192.168.x.x:3000/smoke`.

### Checklist móvil

| Prueba | Esperado |
|--------|----------|
| `/js-smoke.html` | Botón incrementa (JS puro) |
| `/smoke` | JS hidratado: **sí**, botón incrementa |
| `/debug` | width/height/userAgent reales |

Si `/js-smoke.html` funciona pero `/smoke` no → abre consola remota (Safari Web Inspector / Chrome `chrome://inspect`) y busca **403** en `/_next/static/...`.

## Probar con ngrok

Útil para acceder desde el emulador Automotive o un dispositivo físico en la misma red.

1. Arranca la app: `npm run dev`
2. Instala ngrok si no lo tienes: [https://ngrok.com/download](https://ngrok.com/download)
3. Expón el puerto 3000:

```bash
ngrok http 3000
```

4. Copia la URL HTTPS que muestra ngrok (ej. `https://abc123.ngrok-free.app`)
5. Abre esa URL en el navegador del emulador o del coche

> **Nota:** ngrok genera una URL pública temporal. Cada sesión puede cambiar de dominio en el plan gratuito.

## Probar en Android Studio Automotive emulator

1. Instala [Android Studio](https://developer.android.com/studio) con el **Android Automotive OS** system image.
2. Crea un AVD **Automotive** (landscape, resoluciones típicas: 1408×792 o 1080×600).
3. Inicia el emulador.
4. Expón la app con ngrok (recomendado) o usa `10.0.2.2:3000` si corres `npm run dev` en el host y el emulador puede alcanzar tu máquina.
5. Abre **Chrome** en el emulador y navega a la URL.
6. Entra en `/car` y prueba Play/Pausa, cambio de canción y lectura de letras.
7. Opcional: menú de Chrome → **Add to Home screen** / **Instalar app** para probar el manifest PWA (`display: standalone`).

Usa `/debug` para confirmar resolución, orientación y `display-mode`.

## Desplegar en Railway

1. Crea una cuenta en [Railway](https://railway.app).
2. **New Project** → **Deploy from GitHub repo** (conecta este repositorio) o **Empty Project** y sube el código.
3. Railway detecta Next.js automáticamente. Variables de entorno: ninguna obligatoria para este spike.
4. Build command: `npm run build` (por defecto)
5. Start command: `npm run start` (por defecto)
6. Tras el deploy, Railway asigna una URL pública (`*.up.railway.app`).
7. Abre la URL en el emulador Automotive o en Chrome del vehículo.

### Checklist post-deploy

- [ ] `/` carga correctamente
- [ ] `/car` muestra letras y controles
- [ ] `/debug` reporta dimensiones esperadas
- [ ] `/manifest.json` accesible (PWA básica)

## Alcance del spike

- Datos mock locales (4 canciones conocidas + letras de respaldo)
- Búsqueda de letras reales vía LRCLIB (`/api/lyrics/search`)
- Reproducción simulada con `setInterval` (sin audio real)
- Sin Supabase, Apple Music ni YouTube
- Manifest PWA básico (sin service worker)

## Estructura principal

```
app/
  page.tsx          # Landing
  api/lyrics/search/route.ts  # Proxy LRCLIB
  car/
    page.tsx        # Ruta karaoke
    CarKaraoke.tsx  # UI + mock + LRCLIB
  debug/
    page.tsx        # Info de viewport
lib/
  mockSong.ts       # Canciones mock y helpers
  lyrics/
    types.ts        # Tipos normalizados
    parseLrc.ts     # Parser LRC
    lrclib.ts       # Cliente LRCLIB
public/
  manifest.json     # PWA manifest
  icon.svg          # Icono de la app
```
