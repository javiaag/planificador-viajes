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

### 11. Cultura de testing
- No basta el "camino feliz": hay que **romper la app a propósito** (key inválida, campos vacíos, valores límite) y comprobar que degrada bien.
- Probar combinaciones extremas (fiesta + presupuesto bajo) destapa los límites del diseño.

---

## 🎯 Objetivo final declarado
Que sea una web pública y gratuita que cualquiera pueda usar — para pasársela a amigos y familia. Pendiente para próximas sesiones: mapa interactivo + despliegue en Vercel con la API key protegida en el servidor.
