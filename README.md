# Planificador de Viajes

Web que genera un itinerario de viaje día a día a partir de destino, duración, tipo de viaje, presupuesto, grupo, época del año y alojamiento. Usa la IA de Gemini para itinerarios reales y detallados, con un generador de reglas propio como plan de respaldo si la IA falla.

## Arquitectura

- `index.html`, `style.css`, `script.js`, `map.js` — el frontend (estructura, aspecto, lógica del itinerario, lógica del mapa).
- `api/generate-itinerary.js` — función serverless de Vercel: recibe los datos del formulario, construye el prompt y llama a Gemini **desde el servidor**, leyendo la key de la variable de entorno `GEMINI_API_KEY`. La key nunca viaja al navegador.
- El frontend detecta solo dónde se está ejecutando (`window.location.protocol`):
  - **Local (`file://`, doble clic en `index.html`)**: llama a Gemini directamente desde el navegador, usando la key de `config.js`.
  - **Publicado (Vercel, `https://`)**: llama a `/api/generate-itinerary`; no necesita ni carga `config.js` para la IA (el archivo se sigue referenciando en el HTML por comodidad de desarrollo, pero en producción simplemente no existe y da un 404 inofensivo en la pestaña Network).
- En ambos casos, si la IA falla (cuota, error, destino inválido no cuenta) cae al generador de reglas — eso no cambia.

## Cómo ejecutarlo en local (desarrollo)
1. Copia `config.example.js` como `config.js` y pega ahí tu API key gratuita de Gemini (sacada de [Google AI Studio](https://aistudio.google.com)). Sin este paso, la app sigue funcionando con el generador de reglas.
2. Abrir `index.html` con el navegador (doble clic).

## Cómo desplegarlo en Vercel (producción)
1. Sube el proyecto a un repositorio de GitHub (`config.js` no se sube nunca, está en `.gitignore`).
2. Importa el repositorio en [vercel.com](https://vercel.com) con tu cuenta de GitHub.
3. En el proyecto de Vercel, ve a **Settings → Environment Variables** y añade `GEMINI_API_KEY` con tu key real.
4. Despliega. Vercel detecta `api/generate-itinerary.js` automáticamente como función serverless — no hace falta configuración adicional.

## Estado
- [x] V1: formulario + itinerario generado con reglas
- [x] V1.5: rediseño visual (degradado, animaciones, responsive) + presupuesto/grupo/época influyendo de verdad en el plan
- [x] V2: integración con Gemini para itinerarios reales (lugares concretos, precios, coordenadas, recomendaciones), con spinner de carga y fallback automático al generador de reglas
- [x] V3: mapa interactivo (Leaflet + OpenStreetMap) con marcadores numerados por franja, color por día, popups, rutas y filtros — solo visible cuando el plan viene de la IA
- [x] V3.5: pulido pre-publicación — persistencia del último plan (localStorage), botón de imprimir/PDF, detección de destinos inválidos, favicon y meta tags
- [ ] V4: publicación online en Vercel con la API key protegida en el servidor (código listo, pendiente de desplegar)

## Qué estoy aprendiendo
- Estructura de una web: HTML (contenido), CSS (aspecto), JS (lógica)
- El operador módulo (`%`) para ciclar por listas de actividades
- Filtrado en cascada con fallback (relajar filtros si dejan una lista vacía)
- Proteger una API key con `.gitignore` y por qué nunca debe subirse a Git
- Pedirle a una IA JSON estructurado y fiable (`responseSchema`) en vez de texto libre
- Por qué toda integración con una API externa necesita un "modo degradado" (graceful degradation): la IA puede fallar por cuota, por modelo descontinuado o por key inválida, y la app debe seguir siendo usable
- Distinguir códigos de error HTTP (401 no autorizado, 404 no encontrado, 429 límite de cuota, 503 servicio no disponible)
- Dividir el código en varios archivos (`map.js` aparte de `script.js`) cuando uno se hace demasiado grande
- Integrar un mapa (Leaflet): capas (`layerGroup`) para agrupar marcadores y rutas, y por qué hay que llamar a `invalidateSize()` si el contenedor cambia de tamaño
- `localStorage` para persistir datos en el navegador entre visitas, y `@media print` para dar a una misma página dos aspectos distintos (pantalla vs papel)
- Por qué una API key nunca debe vivir en código que corre en el navegador: cualquiera puede abrir las herramientas de desarrollador y verla. La solución es una función serverless que hace de intermediaria, guardando la key como variable de entorno en el servidor
- Detectar el entorno de ejecución (`window.location.protocol`) para que el mismo código sirva tanto para desarrollo local como para producción
