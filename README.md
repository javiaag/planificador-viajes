# Planificador de Viajes

Web que genera un itinerario de viaje día a día a partir de destino, duración, tipo de viaje, presupuesto, grupo, época del año y alojamiento. Usa la IA de Gemini para itinerarios reales y detallados, con un generador de reglas propio como plan de respaldo si la IA falla.

## Cómo ejecutarlo
1. Copia `config.example.js` como `config.js` y pega ahí tu API key gratuita de Gemini (sacada de [Google AI Studio](https://aistudio.google.com)). Sin este paso, la app sigue funcionando con el generador de reglas.
2. Abrir `index.html` con el navegador (doble clic).

## Estado
- [x] V1: formulario + itinerario generado con reglas
- [x] V1.5: rediseño visual (degradado, animaciones, responsive) + presupuesto/grupo/época influyendo de verdad en el plan
- [x] V2: integración con Gemini para itinerarios reales (lugares concretos, precios, coordenadas, recomendaciones), con spinner de carga y fallback automático al generador de reglas
- [x] V3: mapa interactivo (Leaflet + OpenStreetMap) con marcadores numerados por franja, color por día, popups, rutas y filtros — solo visible cuando el plan viene de la IA
- [ ] V4: publicación online (Vercel) con la API key protegida en el servidor

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
