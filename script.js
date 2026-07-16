// Lógica del planificador de viajes

// Banco de actividades por tipo de viaje y momento del día.
// cost: 1=€ 2=€€ 3=€€€ (nivel de gasto aproximado)
// excludeGroups / excludeSeasons: casos concretos en los que esa actividad NO encaja
const activities = {
    cultural: {
        morning: [
            { text: "Visita a un museo", cost: 2 },
            { text: "Tour guiado por el casco histórico", cost: 2 },
            { text: "Entrada a un monumento emblemático", cost: 2 },
            { text: "Paseo por la catedral", cost: 1 }
        ],
        afternoon: [
            { text: "Recorrido por una galería de arte", cost: 2 },
            { text: "Visita a un mercado tradicional", cost: 1 },
            { text: "Ruta arquitectónica por el centro", cost: 1 },
            { text: "Exposición temporal", cost: 2 }
        ],
        night: [
            { text: "Cena en restaurante típico", cost: 2 },
            { text: "Espectáculo de música local", cost: 3 },
            { text: "Paseo nocturno por el centro histórico", cost: 1 },
            { text: "Visita a un mirador iluminado", cost: 1 }
        ]
    },
    naturaleza: {
        morning: [
            { text: "Senderismo por la zona", cost: 1 },
            { text: "Excursión a un parque natural", cost: 2 },
            { text: "Paseo en bicicleta por el bosque", cost: 2 },
            { text: "Observación de aves", cost: 1 }
        ],
        afternoon: [
            { text: "Baño en río o cascada", cost: 1, excludeSeasons: ["invierno"] },
            { text: "Ruta en kayak", cost: 3, excludeSeasons: ["invierno"] },
            { text: "Visita a un mirador natural", cost: 1 },
            { text: "Paseo por la costa", cost: 1 }
        ],
        night: [
            { text: "Observación de estrellas", cost: 1 },
            { text: "Cena al aire libre", cost: 2 },
            { text: "Fogata con historias locales", cost: 1 },
            { text: "Paseo tranquilo junto al agua", cost: 1 }
        ]
    },
    fiesta: {
        morning: [
            { text: "Recuperación con desayuno tranquilo", cost: 2 },
            { text: "Paseo relajado por la zona", cost: 1 },
            { text: "Visita a una terraza con vistas", cost: 2 },
            { text: "Mercadillo local", cost: 1 }
        ],
        afternoon: [
            { text: "Piscina o playa con música", cost: 2, excludeSeasons: ["invierno"] },
            { text: "Ruta de bares y tapas", cost: 2 },
            { text: "Actividad grupal (juegos, deportes)", cost: 1 },
            { text: "Clase de baile", cost: 2 }
        ],
        night: [
            { text: "Fiesta en discoteca local", cost: 3, excludeGroups: ["familia", "seniors"] },
            { text: "Bar con música en vivo", cost: 2, excludeGroups: ["familia"] },
            { text: "Ruta de copas por el centro", cost: 2, excludeGroups: ["familia", "seniors"] },
            { text: "Evento nocturno o festival", cost: 3, excludeGroups: ["seniors"] }
        ]
    },
    gastronomico: {
        morning: [
            { text: "Visita a un mercado de productos locales", cost: 1 },
            { text: "Clase de cocina tradicional", cost: 3 },
            { text: "Desayuno en panadería artesanal", cost: 1 },
            { text: "Ruta de cafés especiales", cost: 2 }
        ],
        afternoon: [
            { text: "Cata de vinos o quesos", cost: 2, excludeGroups: ["familia"] },
            { text: "Almuerzo en restaurante con estrella local", cost: 3 },
            { text: "Tour gastronómico por el barrio", cost: 2 },
            { text: "Visita a una bodega", cost: 2, excludeGroups: ["familia"] }
        ],
        night: [
            { text: "Cena degustación", cost: 3 },
            { text: "Recorrido de tapas nocturno", cost: 2 },
            { text: "Cena con maridaje", cost: 3, excludeGroups: ["familia"] },
            { text: "Restaurante con especialidad regional", cost: 2 }
        ]
    }
};

// Emojis y etiquetas para dar vida al itinerario
const periodIcons = { morning: "🌅", afternoon: "☀️", night: "🌙" };
const tripIcons = { cultural: "🏛️", naturaleza: "🌿", fiesta: "🎉", gastronomico: "🍽️" };
const tripLabels = { cultural: "Cultural", naturaleza: "Naturaleza", fiesta: "Fiesta", gastronomico: "Gastronómico" };
const costSymbols = ["€", "€€", "€€€"];

// Traduce el presupuesto total en € a un nivel 1/2/3 (usado por el generador de reglas).
// Es una aproximación simple: reparte el presupuesto entre días y franjas del día.
function estimateBudgetLevel(totalBudget, days) {
    const perActivity = totalBudget / days / 3;
    if (perActivity < 15) return 1;
    if (perActivity < 40) return 2;
    return 3;
}

const groupInfo = {
    jovenes: { emoji: "🎒", label: "Jóvenes", pace: "Ritmo intenso: aprovechad cada hora del día" },
    familia: { emoji: "👨‍👩‍👧", label: "Familia", pace: "Ritmo pausado y flexible, con descansos para los más pequeños" },
    seniors: { emoji: "🧓", label: "Seniors", pace: "Ritmo tranquilo, sin prisas y con tiempo libre entre actividades" }
};

const seasonInfo = {
    primavera: { emoji: "🌸", label: "Primavera", note: "clima templado, ideal para el exterior" },
    verano: { emoji: "☀️", label: "Verano", note: "calor fuerte, lleva protección solar y agua" },
    otono: { emoji: "🍂", label: "Otoño", note: "temperaturas suaves, con posibilidad de lluvia" },
    invierno: { emoji: "❄️", label: "Invierno", note: "frío, abrígate bien y consulta el pronóstico" }
};

// --- Integración con Gemini (IA) ---
// Si Google cambia el nombre del modelo, este es el único sitio donde hay que tocarlo.
const GEMINI_MODEL = "gemini-3.1-flash-lite";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Esquema de una actividad (mañana/tarde/noche comparten la misma forma)
const activitySchema = {
    type: "OBJECT",
    properties: {
        place: { type: "STRING" },
        description: { type: "STRING" },
        estimatedPrice: { type: "STRING" },
        howToGetThere: { type: "STRING" },
        lat: { type: "NUMBER" },
        lng: { type: "NUMBER" }
    },
    required: ["place", "description", "estimatedPrice", "howToGetThere", "lat", "lng"]
};

// Esquema completo del JSON que le pedimos a Gemini (controlled generation)
const itinerarySchema = {
    type: "OBJECT",
    properties: {
        days: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    day: { type: "NUMBER" },
                    zone: { type: "STRING" },
                    morning: activitySchema,
                    afternoon: activitySchema,
                    night: activitySchema
                },
                required: ["day", "morning", "afternoon", "night"]
            }
        },
        budgetBreakdown: {
            type: "OBJECT",
            properties: {
                totalEstimated: { type: "NUMBER" },
                notes: { type: "STRING" }
            },
            required: ["totalEstimated"]
        },
        recommendations: {
            type: "OBJECT",
            properties: {
                restaurants: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            name: { type: "STRING" },
                            priceRange: { type: "STRING" },
                            description: { type: "STRING" }
                        },
                        required: ["name", "priceRange"]
                    }
                },
                tips: {
                    type: "ARRAY",
                    items: { type: "STRING" }
                }
            },
            required: ["restaurants", "tips"]
        }
    },
    required: ["days", "budgetBreakdown", "recommendations"]
};

function buildPrompt(destination, days, tripType, budget, group, season, accommodation) {
    const accommodationText = accommodation
        ? `El viajero se aloja en: "${accommodation}". Organiza cada día empezando y terminando cerca de esa zona.`
        : "El viajero no ha indicado alojamiento: asume una ubicación céntrica en el destino.";

    return `Eres un asistente de viajes experto. Genera un itinerario detallado y REAL (lugares con nombre concreto, nunca genéricos) para este viaje:

- Destino: ${destination}
- Duración: ${days} días
- Tipo de viaje: ${tripLabels[tripType]}
- Presupuesto total por persona: ${budget} €
- Grupo: ${groupInfo[group].label}
- Época del año: ${seasonInfo[season].label}
- ${accommodationText}

Instrucciones:
1. Para cada día, organiza mañana/tarde/noche con lugares concretos (monumentos, museos, barrios, restaurantes) cercanos entre sí dentro de la misma zona de la ciudad, para minimizar desplazamientos.
2. Cada actividad debe incluir: nombre del lugar, breve descripción (1 frase), precio estimado de entrada en €, cómo llegar (a pie/metro/bus, indicando desde el alojamiento cuando aplique) y coordenadas lat/lng aproximadas del lugar.
3. La suma total estimada del viaje debe aproximarse al presupuesto indicado (${budget} €); incluye un desglose aproximado en "budgetBreakdown" y una nota si no ha sido posible ajustarse.
4. Ten en cuenta el grupo (${groupInfo[group].label}) y la época del año (${seasonInfo[season].label}) al elegir actividades (ritmo, clima).
5. Incluye una sección final de recomendaciones con 3-4 restaurantes concretos (nombre, rango de precio, breve descripción) y varios tips de viajero (cómo evitar colas, qué reservar online, errores típicos de turista).
6. Todos los precios son estimaciones tuyas, no tienes datos en tiempo real: no inventes una precisión falsa.

Responde ÚNICAMENTE con el JSON solicitado, sin texto adicional.`;
}

async function callGeminiItinerary(destination, days, tripType, budget, group, season, accommodation) {
    const prompt = buildPrompt(destination, days, tripType, budget, group, season, accommodation);

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: itinerarySchema
            }
        })
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Respuesta de error completa de Gemini:", errorBody);
        throw new Error(`Gemini respondió con estado ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.candidates[0].content.parts[0].text;
    return JSON.parse(rawText);
}

// Comprueba que config.js se cargó y que la key no es el placeholder de la plantilla.
function isGeminiConfigured() {
    return typeof GEMINI_API_KEY !== "undefined" && GEMINI_API_KEY && GEMINI_API_KEY !== "TU_API_KEY_AQUI";
}

// Comprueba que el JSON de la IA tiene la forma mínima que necesitamos para pintarlo sin romper la página.
function validateItineraryData(data) {
    if (!data || !Array.isArray(data.days) || data.days.length === 0) {
        throw new Error("el JSON no trae un array de días válido");
    }
    const requiredFields = ["place", "description", "estimatedPrice", "howToGetThere", "lat", "lng"];
    for (const day of data.days) {
        for (const period of ["morning", "afternoon", "night"]) {
            const activity = day[period];
            if (!activity || requiredFields.some((field) => activity[field] === undefined)) {
                throw new Error(`el día ${day.day} tiene datos incompletos en "${period}"`);
            }
        }
    }
    if (!data.budgetBreakdown || typeof data.budgetBreakdown.totalEstimated !== "number") {
        throw new Error("falta el desglose de presupuesto");
    }
    if (!data.recommendations || !Array.isArray(data.recommendations.restaurants) || !Array.isArray(data.recommendations.tips)) {
        throw new Error("faltan las recomendaciones");
    }
}

// Llama a Gemini y valida el resultado; si falla o el JSON viene mal formado, reintenta una vez más.
async function callGeminiItineraryWithRetry(destination, days, tripType, budget, group, season, accommodation) {
    let lastError;
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const data = await callGeminiItinerary(destination, days, tripType, budget, group, season, accommodation);
            validateItineraryData(data);
            return data;
        } catch (error) {
            lastError = error;
            console.warn(`Intento ${attempt} fallido (${error.message}).`);
        }
    }
    throw lastError;
}

function showLoading() {
    hideMap(); // por si quedaba el mapa de una búsqueda anterior visible
    itineraryDiv.innerHTML = `
        <div class="loading-card">
            <div class="spinner"></div>
            <p>✨ Diseñando tu viaje... puede tardar unos segundos</p>
        </div>
    `;
}

// --- Persistencia del último plan (localStorage) ---
const LAST_PLAN_KEY = "planificadorViajes.lastPlan";

function saveLastPlan(formData, source, aiData) {
    try {
        localStorage.setItem(LAST_PLAN_KEY, JSON.stringify({ formData, source, aiData }));
    } catch (error) {
        console.warn("No se pudo guardar el plan en localStorage:", error.message);
    }
}

function loadLastPlan() {
    try {
        const raw = localStorage.getItem(LAST_PLAN_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.warn("No se pudo leer el plan guardado:", error.message);
        return null;
    }
}

function renderActivity(icon, label, activity) {
    return `
        <p>
            <strong>${icon} ${label}:</strong> ${activity.place} — ${activity.description}<br>
            <span class="price-note">${activity.estimatedPrice} (estimado, verificar web oficial)</span><br>
            <span class="how-to">🧭 ${activity.howToGetThere}</span>
        </p>
    `;
}

function renderAIItinerary(destination, days, tripType, budget, group, season, accommodation, aiData) {
    let html = `
        <button type="button" class="print-btn" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
        <p class="ai-disclaimer">⚠️ Precios y horarios estimados por IA (sin datos en tiempo real) — verifica siempre en la web oficial antes de viajar.</p>
        <div class="summary-card">
            <h2>📋 Resumen del viaje</h2>
            <p>📍 <strong>Destino:</strong> ${destination}</p>
            <p>📅 <strong>Días:</strong> ${days}</p>
            <p>${tripIcons[tripType]} <strong>Tipo:</strong> ${tripLabels[tripType]}</p>
            <p>💶 <strong>Presupuesto:</strong> ${budget} € indicados — estimado por la IA: ~${aiData.budgetBreakdown.totalEstimated} €</p>
            ${aiData.budgetBreakdown.notes ? `<p class="budget-note">${aiData.budgetBreakdown.notes}</p>` : ""}
            <p>${groupInfo[group].emoji} <strong>Grupo:</strong> ${groupInfo[group].label} — ${groupInfo[group].pace}</p>
            <p>${seasonInfo[season].emoji} <strong>Época:</strong> ${seasonInfo[season].label} (${seasonInfo[season].note})</p>
            <p>🏨 <strong>Alojamiento:</strong> ${accommodation || "Sin especificar (se asume zona céntrica)"}</p>
        </div>
    `;

    aiData.days.forEach((day, index) => {
        const delay = (index * 0.08).toFixed(2);
        html += `
            <div class="day-card" style="animation-delay: ${delay}s">
                <h3>Día ${day.day}${day.zone ? ` — ${day.zone}` : ""}</h3>
                ${renderActivity(periodIcons.morning, "Mañana", day.morning)}
                ${renderActivity(periodIcons.afternoon, "Tarde", day.afternoon)}
                ${renderActivity(periodIcons.night, "Noche", day.night)}
            </div>
        `;
    });

    html += `
        <div class="recommendations-card">
            <h2>🍴 Recomendaciones</h2>
            <h3>Restaurantes</h3>
            <ul>
                ${aiData.recommendations.restaurants.map((r) => `<li><strong>${r.name}</strong> (${r.priceRange})${r.description ? ` — ${r.description}` : ""}</li>`).join("")}
            </ul>
            <h3>Tips de viajero</h3>
            <ul>
                ${aiData.recommendations.tips.map((t) => `<li>${t}</li>`).join("")}
            </ul>
        </div>
    `;

    itineraryDiv.innerHTML = html;
    renderMap(aiData);
    saveLastPlan({ destination, days, tripType, budget, group, season, accommodation }, "ai", aiData);
}

const form = document.getElementById("trip-form");
const itineraryDiv = document.getElementById("itinerary");

const submitButton = form.querySelector("button[type=submit]");

function fallbackToRuleBasedPlan(destination, days, tripType, budget, group, season, accommodation, reason) {
    hideMap(); // el generador de reglas no tiene coordenadas reales, así que no hay mapa que mostrar
    renderItinerary(destination, days, tripType, budget, group, season, accommodation);
    itineraryDiv.insertAdjacentHTML(
        "afterbegin",
        `<p class="fallback-notice">⚠️ ${reason} — te mostramos el plan básico generado por reglas (sin IA).</p>`
    );
}

form.addEventListener("submit", async function (event) {
    event.preventDefault(); // evita que la página se recargue al enviar el formulario

    const destination = document.getElementById("destination").value.trim();
    const days = parseInt(document.getElementById("days").value, 10);
    const tripType = document.getElementById("trip-type").value;
    const budget = parseFloat(document.getElementById("budget").value);
    const group = document.getElementById("group").value;
    const season = document.getElementById("season").value;
    const accommodation = document.getElementById("accommodation").value.trim();

    if (!destination || !tripType || !group || !season || !days || days < 1 || days > 30 || !budget || budget <= 0) {
        itineraryDiv.innerHTML = `<p class="error">Por favor, completa todos los campos obligatorios (días entre 1 y 30, presupuesto mayor que 0).</p>`;
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Generando...";
    showLoading();

    if (!isGeminiConfigured()) {
        fallbackToRuleBasedPlan(destination, days, tripType, budget, group, season, accommodation, "No hay una API key de Gemini configurada");
        submitButton.disabled = false;
        submitButton.textContent = "Generar plan ✨";
        return;
    }

    try {
        const aiData = await callGeminiItineraryWithRetry(destination, days, tripType, budget, group, season, accommodation);
        renderAIItinerary(destination, days, tripType, budget, group, season, accommodation, aiData);
    } catch (error) {
        console.error("Fallo definitivo generando itinerario con IA:", error);
        fallbackToRuleBasedPlan(destination, days, tripType, budget, group, season, accommodation, `No se pudo generar el plan con IA (${error.message})`);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Generar plan ✨";
    }
});

// Filtra una lista de actividades por presupuesto, grupo y época.
// Si los filtros dejan la lista vacía, se relajan en cascada para no quedarnos sin opciones.
function filterActivities(list, budgetLevel, group, season) {
    const matchesGroupAndSeason = (a) =>
        !(a.excludeGroups && a.excludeGroups.includes(group)) &&
        !(a.excludeSeasons && a.excludeSeasons.includes(season));

    let filtered = list.filter((a) => a.cost <= budgetLevel && matchesGroupAndSeason(a));
    if (filtered.length === 0) {
        filtered = list.filter(matchesGroupAndSeason); // relajamos el presupuesto
    }
    if (filtered.length === 0) {
        filtered = list; // último recurso: todas las actividades del tipo de viaje
    }
    return filtered;
}

function renderItinerary(destination, days, tripType, budget, group, season, accommodation) {
    const plan = activities[tripType];
    const budgetLevel = estimateBudgetLevel(budget, days);
    const perDay = (budget / days).toFixed(0);

    // los pools se calculan una vez: no dependen del día, solo del presupuesto/grupo/época
    const pools = {
        morning: filterActivities(plan.morning, budgetLevel, group, season),
        afternoon: filterActivities(plan.afternoon, budgetLevel, group, season),
        night: filterActivities(plan.night, budgetLevel, group, season)
    };

    let html = `
        <button type="button" class="print-btn" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
        <div class="summary-card">
            <h2>📋 Resumen del viaje</h2>
            <p>📍 <strong>Destino:</strong> ${destination}</p>
            <p>📅 <strong>Días:</strong> ${days}</p>
            <p>${tripIcons[tripType]} <strong>Tipo:</strong> ${tripLabels[tripType]}</p>
            <p>💶 <strong>Presupuesto:</strong> ${budget} € por persona (~${perDay} €/día)</p>
            <p>${groupInfo[group].emoji} <strong>Grupo:</strong> ${groupInfo[group].label} — ${groupInfo[group].pace}</p>
            <p>${seasonInfo[season].emoji} <strong>Época:</strong> ${seasonInfo[season].label} (${seasonInfo[season].note})</p>
            <p>🏨 <strong>Alojamiento:</strong> ${accommodation || "Sin especificar (se asume zona céntrica)"}</p>
        </div>
    `;

    for (let day = 1; day <= days; day++) {
        // el módulo (%) hace que las actividades se repitan en ciclo si el viaje es largo
        const morning = pools.morning[(day - 1) % pools.morning.length];
        const afternoon = pools.afternoon[(day - 1) % pools.afternoon.length];
        const night = pools.night[(day - 1) % pools.night.length];

        // animation-delay escalonado para que las tarjetas aparezcan una detrás de otra
        const delay = ((day - 1) * 0.08).toFixed(2);

        html += `
            <div class="day-card" style="animation-delay: ${delay}s">
                <h3>Día ${day}</h3>
                <p><strong>${periodIcons.morning} Mañana:</strong> ${morning.text} (${costSymbols[morning.cost - 1]})</p>
                <p><strong>${periodIcons.afternoon} Tarde:</strong> ${afternoon.text} (${costSymbols[afternoon.cost - 1]})</p>
                <p><strong>${periodIcons.night} Noche:</strong> ${night.text} (${costSymbols[night.cost - 1]})</p>
            </div>
        `;
    }

    itineraryDiv.innerHTML = html;
    saveLastPlan({ destination, days, tripType, budget, group, season, accommodation }, "rules", null);
}

// Si hay un plan guardado de una visita anterior, lo mostramos directamente al abrir la página.
function restoreLastPlanIfAny() {
    const saved = loadLastPlan();
    if (!saved || !saved.formData) {
        return;
    }

    const { destination, days, tripType, budget, group, season, accommodation } = saved.formData;

    if (saved.source === "ai" && saved.aiData) {
        renderAIItinerary(destination, days, tripType, budget, group, season, accommodation, saved.aiData);
    } else {
        renderItinerary(destination, days, tripType, budget, group, season, accommodation);
    }

    itineraryDiv.insertAdjacentHTML(
        "afterbegin",
        `<div class="saved-plan-notice">
            📌 Tu último plan: ${destination}, ${days} días
            <button type="button" id="start-new-plan-btn">Empezar uno nuevo</button>
        </div>`
    );

    document.getElementById("start-new-plan-btn").addEventListener("click", () => {
        itineraryDiv.innerHTML = "";
        hideMap();
    });
}

restoreLastPlanIfAny();
