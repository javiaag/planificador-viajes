# 📖 Diario del Proyecto — Planificador de Viajes

> Crónica de cómo se construyó esta app, escrita sobre la marcha.
> Parte 1: el camino. Parte 2: los apuntes de lo aprendido.

---

# PARTE 1 — El camino

## Sesión 1 — 16 de julio de 2026
*La sesión en la que pasamos de cero a una app con IA.*

### Antes de empezar: montar el taller
El día no empezó con código, sino configurando el entorno: preferencias globales de Claude (directo, sincero, sin relleno), un `CLAUDE.md` con las reglas de trabajo (solo herramientas gratis, explicar antes de programar, commits pequeños) y un proyecto de Universidad aparte. Flujo de trabajo elegido: **Javi da la idea → Claude (Cowork) diseña el prompt → Claude Code programa → revisamos juntos**.

### V1 — El esqueleto (que funcione)
- 3 archivos: `index.html` (estructura), `style.css` (aspecto), `script.js` (lógica).
- Formulario: destino, días (1-30), tipo de viaje, botón.
- Itinerario generado con **reglas**: banco de 48 actividades escritas a mano, ciclando con el operador `%`.
- **Primer fallo real:** Git se corrompió al inicializarlo (OneDrive bloqueaba los archivos internos de `.git`). Solución: borrarlo y reinicializarlo desde Claude Code.

### V1.5 — Que sea bonita y personalice
- Rediseño completo: degradado morado-rosa, tarjetas con animación, hero con título grande, responsive.
- Campos nuevos: presupuesto, tipo de grupo (jóvenes/familia/seniors), época del año.
- Las actividades pasaron de texto suelto a **objetos con atributos** (`cost`, `excludeGroups`, `excludeSeasons`).
- **Filtrado en cascada**: si los filtros dejan una franja sin actividades, se relajan por orden en vez de romperse.
- **Bug visual detectado por Javi:** los días se repetían en ciclo (día 3 = día 1). No era un bug: con presupuesto bajo quedaban tan pocas actividades baratas que el `%` ciclaba enseguida. Diagnóstico correcto: era el techo natural del generador de reglas.

### V2 — La IA entra en juego
- API key gratuita de Gemini (Google AI Studio), guardada en `config.js` e ignorada por Git.
- Presupuesto real en € y campo de alojamiento para adaptar las rutas.
- **Odisea del modelo:** `gemini-2.0-flash` → error 429 (cuota 0), `gemini-2.5-flash` → 404 (descontinuado), consulta a `ListModels` → `gemini-3.1-flash-lite` ✅. Tres códigos de error HTTP distintos en 10 minutos.
- Salida **JSON estructurada** con `responseSchema`: lugares reales con precio estimado, cómo llegar, coordenadas lat/lng (guardadas para el futuro mapa), desglose de presupuesto y recomendaciones.
- Spinner de carga, validación del JSON con reintento, y **fallback automático** al generador de reglas si la IA falla.
- **Prueba de fuego (Madrid, 5 días, fiesta, 500€, jóvenes, verano):** zonas coherentes por barrios, Retiro por la mañana "para evitar el calor", Prado a mediodía "por el aire acondicionado", Kapital y Joy Eslava de noche, El Tigre en recomendaciones, presupuesto estimado 467€ con nota del margen. Verificado por un madrileño: aprobado.

### Estado al cierre de la sesión 1
✅ V1, V1.5 y V2 completas y commiteadas. Pendiente: mapa interactivo (Leaflet) y publicación online para que cualquiera pueda usarla.

---

## Sesión 2 — El mapa interactivo (V3)
*El itinerario deja de ser texto y se dibuja sobre la ciudad.*

### Preparativos
- El diario del proyecto (este documento) entró en el repositorio, ahora en formato Word.
- Decisión de diseño previa: usar **Leaflet + OpenStreetMap** — librería veterana, gratuita, sin API key ni registro.

### Paso 1 — La fontanería
- Leaflet añadido vía CDN en `index.html`.
- Nuevo archivo `map.js`: el mapa vive en su propio archivo para que `script.js` no siga engordando (regla del CLAUDE.md: dividir antes de que crezca demasiado).
- Contenedor `#map-section` oculto por defecto. Un paso entero sin nada visible: primero la infraestructura, luego el espectáculo.

### Paso 2 — El mapa cobra vida
- `renderMap(aiData)` crea el mapa y, por cada día, un `L.layerGroup` con: marcadores numerados (1/2/3 = mañana/tarde/noche) del color del día, popups con lugar + franja + precio, y una línea conectando la ruta del día.
- `fitBounds()` ajusta zoom y centro automáticamente para abarcar todos los puntos.
- Si había un mapa de una búsqueda anterior, se destruye (`map.remove()`) antes de crear el nuevo — si no, Leaflet protesta.
- El mapa solo aparece con itinerarios de IA (el fallback de reglas no tiene coordenadas reales).
- **Primera prueba (Madrid, 2 días, cultural):** dos rutas de colores sobre el mapa real de Madrid — Palacio Real, Templo de Debod, Retiro... El momento más visual del proyecto hasta la fecha.

### Paso 3 — Filtros por día
- Botones "Todos" + uno por día, cada uno del color de sus marcadores (variable CSS `--day-color` por botón).
- Al pulsar un día: se ocultan las capas del resto (`removeLayer`), queda solo su ruta, y el zoom se reajusta a esos puntos. "Todos" restaura la vista completa.
- La arquitectura de capas del Paso 2 hizo que esta feature fuera trivial: mostrar/ocultar, sin redibujar nada. La decisión de diseño pagó dividendos en 24 horas.
- Probado con Sevilla, 2 días: filtros y zoom funcionando a la primera.

### Paso 4 — Pulido final del mapa
- El mapa y los filtros entraron en una tarjeta "glass" como el resto de la interfaz, en vez de flotar sobre el degradado.
- Responsive: en móvil el mapa baja a 250px de altura y los botones se compactan.
- Detalle fino: `invalidateSize()` en el evento `resize` — Leaflet no reajusta sus tiles solo si el contenedor cambia de tamaño (ej. girar el móvil), y sin esto el mapa queda recortado.

### ✅ V3 completa
Mapa interactivo con marcadores numerados, popups, rutas por día, filtros de colores y ajuste automático de zoom. La app ya se ve, se entiende y se navega como un producto de verdad.

---

## Sesión 3 — V3.5: pulido pre-publicación
*Revisión honesta antes de publicar: ¿qué le falta para que la use gente de verdad?*

### La auditoría
Con la V3 cerrada, paramos a mirar la app con ojos de usuario. Diagnóstico: (1) la key en el navegador — bloqueante, se resuelve al publicar; (2) el plan se pierde al cerrar la pestaña; (3) destinos inventados producen itinerarios inventados; (4) faltaba favicon y meta tags para compartir el enlace.

### Parte A — Que el plan no se pierda ✅
- **localStorage**: el último plan se guarda automáticamente en el navegador y se restaura al volver a abrir la página, con aviso "Tu último plan: Roma, 5 días" y botón para empezar de cero.
- **Botón Imprimir / Guardar PDF**: `window.print()` + estilos `@media print` — la misma página tiene dos caras: la web con degradado y la versión imprimible en blanco y negro, sin formulario ni mapa, ajustada a A4 y con `break-inside: avoid` para que las tarjetas no se partan entre páginas.

### Parte B — Destinos inválidos ✅
- Nuevo campo `validDestination` (booleano) en el esquema JSON — y pasó a ser el único obligatorio, para que Gemini no esté forzado a inventarse un itinerario cuando el destino no existe.
- Si el destino es falso ("asdfghjk", "Narnia"), la IA responde solo `{"validDestination": false}` y la app muestra un mensaje amable — sin reintentos y, muy importante, SIN caer al generador de reglas (que inventaría un plan para un sitio inexistente). Lección: a veces la robustez consiste en NO dar respuesta.

### Parte C — Carta de presentación ✅
- Favicon ✈️ como SVG inline (`data:image/svg+xml`) — sin archivos de imagen.
- Meta description + etiquetas Open Graph: lo que leen WhatsApp/Twitter para mostrar una tarjeta bonita al compartir el enlace, en vez de la URL pelada.
- Título de pestaña descriptivo.

### ✅ V3.5 completa
Persistencia del plan, impresión limpia en PDF, destinos inválidos controlados y carta de presentación lista. La app está preparada para salir al mundo.

---

## Sesión 4 — V4: la publicación
*El último gran hito: que la app viva en internet con la key a salvo.*

### Acto 1 — Reestructurar para el servidor ✅
- Nueva función serverless `api/generate-itinerary.js`: recibe los datos del formulario por POST, construye el prompt y llama a Gemini **desde el servidor**, leyendo la key de la variable de entorno `GEMINI_API_KEY`. La key nunca viaja al navegador.
- **Detección de entorno** en el frontend: si la página se abre como archivo local (`file://`), funciona como siempre con `config.js`; si se sirve desde Vercel (`https://`), llama a `/api/generate-itinerary` sin necesitar key alguna. El mismo código sirve para desarrollo y producción.
- El resto del flujo (reintentos, validación, fallback a reglas) quedó idéntico — sin duplicar lógica.
- Concepto clave: **variables de entorno** — los secretos no viven en archivos del código, viven en la configuración de cada entorno. El mecanismo estándar de la industria.

### Acto 2 — El despliegue ✅ 🚀
*El día que la app salió de un ordenador y entró en internet.*

- **GitHub**: repo público `javiaag/planificador-viajes` creado, primer `git push` con autorización desde el navegador. Comprobación satisfactoria: `config.js` NO está en el repo — el `.gitignore` cumplió.
- **Sorpresa por el camino**: al entrar en Vercel, ya existía una cuenta... con el `predictor-mundial` dentro. La primera app de Javi y esta van a vivir juntas.
- **Lección de seguridad en vivo**: la key apareció visible en un pantallazo compartido durante el proceso → rotación inmediata (borrar key vieja, crear nueva). Regla grabada a fuego: antes de capturar pantalla, cerrar la pestaña de config.js.
- **Despliegue**: importar repo en Vercel → variable de entorno `GEMINI_API_KEY` (la nueva) → Deploy → confeti. URL pública: `planificador-viajes-chi.vercel.app`.

### Los exámenes de graduación ✅
1. Plan real generado en la URL pública con IA y mapa — funciona.
2. Destino inventado — mensaje amable, sin plan alucinado.
3. **El examen de seguridad**: F12 → Network → la petición a `/api/generate-itinerary` lleva destino, días y presupuesto... y ni rastro de la key. Bonus poético: el 404 de `config.js` en la consola es la *prueba* de que el archivo de la key no existe en internet.
4. La app funcionando en el móvil, compartible por WhatsApp con su tarjeta y su favicon ✈️.

### 🏁 V4 COMPLETA — EL PROYECTO ESTÁ VIVO EN INTERNET
De un `index.html` vacío a una app pública con IA, mapa interactivo y despliegue continuo: cada `git push` futuro actualizará la web automáticamente para todos sus usuarios. El backlog (enlaces a Google Maps, regenerar día, compartir por enlace, idiomas) queda esperando al feedback de los primeros usuarios reales: la familia.

---

*(próximas sesiones se irán añadiendo aquí)*

---

# PARTE 2 — Apuntes 📚
*La teoría que este proyecto enseñó, en orden de aparición.*

### 1. Las tres capas de una web
- **HTML** = estructura (qué hay), **CSS** = presentación (cómo se ve), **JS** = comportamiento (qué hace).
- Separarlas en archivos no es manía: cada una tiene una responsabilidad. Es el principio de **separación de responsabilidades**, que reaparece en todo el software.

### 2. HTML esencial
- Etiquetas en parejas `<h1>...</h1>`; algunas van solas (`<input>`).
- El `id` es el nombre interno de un elemento: es como JS lo encuentra (`getElementById`).
- Formularios: `<form>`, `<input type="text|number">`, `<select>` + `<option>`, `<label for=...>`.
- Validación gratis del navegador: `required`, `min`, `max` — frena envíos inválidos sin escribir una línea de JS.

### 3. JavaScript esencial
- **Objetos** `{clave: valor}`: el equivalente a los diccionarios de Python. Pasar de "lista de textos" a "lista de objetos con atributos" fue el salto de calidad de la V1.5 (como pasar de vectores a DataFrames).
- **Eventos**: `addEventListener("submit", ...)` — el código reacciona a lo que hace el usuario.
- `event.preventDefault()`: evita que el formulario recargue la página (comportamiento por defecto del navegador).
- **Template literals**: `` `Itinerario para ${destination}` `` — construir texto con variables dentro.

### 4. El operador módulo (%)
- Resto de una división: `6 % 4 = 2`.
- Uso estrella: **ciclar por una lista finita** — `lista[(dia - 1) % lista.length]` repite 1,2,3,4,1,2,3...
- Visto en la práctica: con pocas actividades filtradas, el ciclo se hace corto y los días se repiten. El tamaño de la lista determina el período del ciclo.

### 5. Filtrado en cascada con fallback
- Si los filtros del usuario dejan cero resultados, mejor **relajar filtros por orden de prioridad** que mostrar vacío o romperse.
- Lo usan buscadores y recomendadores reales (Booking: "no hay hoteles con tus filtros, mira estos parecidos").

### 6. Git y control de versiones
- `commit` = foto del proyecto en un momento dado. Commits pequeños y frecuentes.
- `.gitignore` = lista de archivos que Git no debe ver. **Debe configurarse ANTES del primer add**, porque Git guarda todo el historial: una key subida y luego borrada sigue recuperable en commits antiguos.
- Git + OneDrive se llevan mal: OneDrive bloquea los archivos internos de `.git` al sincronizar.

### 7. API keys y seguridad
- Una API key es una contraseña: identifica TU cuenta ante un servicio. Quien la tenga consume tu cuota en tu nombre.
- Patrón correcto: key en `config.js` (ignorado por Git) + `config.example.js` de plantilla (sí se sube).
- Hay bots escaneando GitHub 24/7 buscando keys filtradas. No es paranoia, es rutina.
- Nunca pegarla en chats, pantallazos ni repos.

### 8. Códigos de error HTTP (chuleta vivida en primera persona)
- **401** — no autorizado (key mala) · **404** — no existe (modelo retirado) · **429** — límite de cuota superado · **503** — servicio saturado, reintenta luego.
- Cuatro causas distintas, cuatro soluciones distintas. Distinguirlos ahorra horas de depuración.
- Truco aprendido: cuando dudes de qué modelos/recursos existen, **pregúntale a la propia API** (`ListModels`) en vez de suponer.

### 9. Integrar un LLM en una app
- Pedir texto libre a la IA y parsearlo = frágil. Pedir **JSON estructurado con esquema** (`responseSchema`, "controlled generation") = la API obliga a la IA a cumplir el formato.
- El prompt se construye con los datos del usuario (`buildPrompt()`): la calidad del prompt determina la calidad del itinerario.
- La IA sabe cosas "de memoria": precios y datos pueden estar desactualizados. Mostrarlos siempre como **estimaciones** y decírselo al usuario.

### 10. Graceful degradation (degradación elegante)
- Toda app que depende de un servicio externo necesita un plan para cuando ese servicio falla.
- La nuestra: sin key → reglas directamente; error o JSON malformado → reintento → reglas + aviso amarillo.
- El usuario siempre ve algo útil, nunca una pantalla rota. Lo vivimos de verdad: la IA falló por 3 motivos distintos y la app siguió funcionando las 3 veces.

### 11. Usar librerías externas
- No todo se escribe desde cero: una librería es código de otros que enchufas (Leaflet via CDN = una línea en el HTML) y te regala funcionalidad completa.
- Criterios para elegir bien: gratuita, veterana, mantenida, y a poder ser sin API key.
- La mitad del oficio moderno es saber qué librería usar y cuándo.

### 12. Capas y organización visual (Leaflet)
- Agrupar elementos relacionados en un `layerGroup` (una "capa" por día) hace que filtrar sea mostrar/ocultar capas, sin redibujar nada.
- Decisión estructural de hoy que hace trivial la feature de mañana: eso es diseñar bien.

### 13. Limpiar recursos vivos
- Mapas, conexiones, timers... son recursos "vivos": hay que destruirlos (`map.remove()`) antes de recrearlos, o se acumulan errores.
- Patrón general: quien crea un recurso es responsable de limpiarlo.

### 14. Dividir archivos por responsabilidad
- Cuando un archivo crece demasiado, se parte por responsabilidades: `script.js` (lógica del itinerario) y `map.js` (todo lo del mapa).
- Mismo principio que separar HTML/CSS/JS, aplicado dentro del propio JS.

### 15. Cultura de testing
- No basta el "camino feliz": hay que **romper la app a propósito** (key inválida, campos vacíos, valores límite) y comprobar que degrada bien.
- Probar combinaciones extremas (fiesta + presupuesto bajo) destapa los límites del diseño.

---

## 🎯 Objetivo final declarado
Que sea una web pública y gratuita que cualquiera pueda usar — para pasársela a amigos y familia. Pendiente para próximas sesiones: mapa interactivo + despliegue en Vercel con la API key protegida en el servidor.
