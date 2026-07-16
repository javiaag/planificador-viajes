// Integración con Gemini (IA): esquema, prompt, llamadas y validación.

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

// Recomendaciones propias de un día: restaurantes cercanos a SUS actividades + un tip específico de ese día.
const dayRecommendationsSchema = {
    type: "OBJECT",
    properties: {
        restaurants: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    name: { type: "STRING" },
                    location: { type: "STRING" },
                    priceRange: { type: "STRING" }
                },
                required: ["name", "priceRange"]
            }
        },
        tip: { type: "STRING" }
    },
    required: ["restaurants", "tip"]
};

// Esquema completo del JSON que le pedimos a Gemini (controlled generation)
const itinerarySchema = {
    type: "OBJECT",
    properties: {
        validDestination: { type: "BOOLEAN" },
        days: {
            type: "ARRAY",
            items: {
                type: "OBJECT",
                properties: {
                    day: { type: "NUMBER" },
                    zone: { type: "STRING" },
                    morning: activitySchema,
                    afternoon: activitySchema,
                    night: activitySchema,
                    recommendations: dayRecommendationsSchema
                },
                required: ["day", "morning", "afternoon", "night", "recommendations"]
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
        // Recomendaciones GLOBALES del destino (no ligadas a un día concreto). Los restaurantes
        // concretos viven ahora dentro de cada día, cerca de sus actividades.
        recommendations: {
            type: "OBJECT",
            properties: {
                tips: {
                    type: "ARRAY",
                    items: { type: "STRING" }
                }
            },
            required: ["tips"]
        }
    },
    // Solo "validDestination" es obligatorio: si el destino no es válido, el resto puede faltar.
    required: ["validDestination"]
};

function buildPrompt(destination, days, tripTypes, budget, group, season, accommodation, preferences) {
    const accommodationText = accommodation
        ? `El viajero se aloja en: "${accommodation}". Organiza cada día empezando y terminando cerca de esa zona.`
        : "El viajero no ha indicado alojamiento: asume una ubicación céntrica en el destino.";
    const preferencesText = preferences
        ? `\n- Preferencias del viajero: "${preferences}" (tenlas en cuenta, son importantes).`
        : "";

    const tripTypesText = tripTypes.map((type) => tripLabels[type]).join(", ");
    const mixInstruction = tripTypes.length > 1
        ? `Mezcla de forma EQUILIBRADA los tipos de viaje elegidos (${tripTypesText}) a lo largo de los días — no dediques todos los días a un solo tipo, reparte variedad entre ellos.`
        : `Todas las actividades deben encajar con el tipo de viaje: ${tripTypesText}.`;

    return `Eres un asistente de viajes experto. Genera un itinerario detallado y REAL (lugares con nombre concreto, nunca genéricos) para este viaje:

- Destino: ${destination}
- Duración: ${days} días
- Tipos de viaje: ${tripTypesText}
- Presupuesto total por persona: ${budget} €
- Grupo: ${groupInfo[group].label}
- Época del año: ${seasonInfo[season].label}
- ${accommodationText}${preferencesText}

PRIMERO comprueba si "${destination}" es un lugar real y visitable (ciudad, región, país o zona identificable). Si NO lo es (inventado, sin sentido, ofensivo, o no se puede identificar como lugar), responde ÚNICAMENTE con {"validDestination": false} y nada más — no generes días ni recomendaciones. Si SÍ es un lugar real, responde con "validDestination": true y continúa con estas instrucciones:

1. ${mixInstruction}
2. Para cada día, organiza mañana/tarde/noche con lugares concretos (monumentos, museos, barrios, restaurantes) cercanos entre sí dentro de la misma zona de la ciudad, para minimizar desplazamientos.
3. Cada actividad debe incluir: nombre del lugar, breve descripción (1 frase), precio estimado de entrada en €, cómo llegar (a pie/metro/bus, indicando desde el alojamiento cuando aplique) y coordenadas lat/lng aproximadas del lugar.
4. Para CADA día, en su campo "recommendations": 1-2 restaurantes CERCA de las actividades de ESE día concreto (nombre, zona o calle aproximada, rango de precio) y un "tip" específico de ese día (ej: "reserva online el Coliseo para evitar cola").
5. La suma total estimada del viaje debe aproximarse al presupuesto indicado (${budget} €); incluye un desglose aproximado en "budgetBreakdown" y una nota si no ha sido posible ajustarse.
6. Ten en cuenta el grupo (${groupInfo[group].label}), la época del año (${seasonInfo[season].label}) y las preferencias del viajero (si las hay) al elegir actividades.
7. En "recommendations" del nivel superior (fuera de los días), incluye varios tips GENERALES del destino, no ligados a un día concreto (cómo moverte por la ciudad, errores típicos de turista, qué reservar con antelación).
8. Todos los precios, horarios y ubicaciones son estimaciones tuyas, no tienes datos en tiempo real: no inventes una precisión falsa. Las direcciones/zonas son especialmente aproximadas.
9. IMPORTANTE: todo el texto que escribas (descripciones, cómo llegar, notas, recomendaciones, tips) debe estar en ESPAÑOL, sin importar el idioma del destino.

Responde ÚNICAMENTE con el JSON solicitado, sin texto adicional, y siempre en español.`;
}

// Detecta si la página se abrió con doble clic (file://) o servida desde un servidor web (http/https).
// En local llamamos a Gemini directamente con la key de config.js; en producción, vía nuestra función serverless.
const isLocalFile = window.location.protocol === "file:";

// Desarrollo local: llama a Gemini directamente desde el navegador (necesita config.js con tu key).
async function callGeminiDirectly(destination, days, tripTypes, budget, group, season, accommodation, preferences) {
    const prompt = buildPrompt(destination, days, tripTypes, budget, group, season, accommodation, preferences);
    return fetchGemini(prompt);
}

// Producción: la key vive en el servidor (Vercel), el navegador solo llama a nuestra propia API.
async function callGeminiViaApi(destination, days, tripTypes, budget, group, season, accommodation, preferences) {
    return fetchServerlessApi({ mode: "generate", destination, days, tripTypes, budget, group, season, accommodation, preferences });
}

function callGeminiItinerary(destination, days, tripTypes, budget, group, season, accommodation, preferences) {
    if (isLocalFile) {
        return callGeminiDirectly(destination, days, tripTypes, budget, group, season, accommodation, preferences);
    }
    return callGeminiViaApi(destination, days, tripTypes, budget, group, season, accommodation, preferences);
}

// Llamada directa a la API de Gemini (usada en local por el modo generar y el modo refinar).
async function fetchGemini(prompt) {
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

// Llamada a nuestra función serverless (usada en producción por el modo generar y el modo refinar).
async function fetchServerlessApi(body) {
    const response = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Respuesta de error completa del servidor:", errorBody);
        throw new Error(`El servidor respondió con estado ${response.status}`);
    }

    return response.json();
}

// En local, comprueba que config.js se cargó y que la key no es el placeholder de la plantilla.
// En producción no hace falta: la key la gestiona el servidor, y si algo falla ya lo cubre el fallback.
function isGeminiConfigured() {
    if (!isLocalFile) {
        return true;
    }
    return typeof GEMINI_API_KEY !== "undefined" && GEMINI_API_KEY && GEMINI_API_KEY !== "TU_API_KEY_AQUI";
}

// Comprueba que el JSON de la IA tiene la forma mínima que necesitamos para pintarlo sin romper la página.
function validateItineraryData(data) {
    if (!data || typeof data.validDestination !== "boolean") {
        throw new Error("el JSON no trae el campo validDestination");
    }
    if (data.validDestination === false) {
        return; // destino inválido: es una respuesta legítima, no hay más que comprobar
    }
    if (!Array.isArray(data.days) || data.days.length === 0) {
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
        if (!day.recommendations || !Array.isArray(day.recommendations.restaurants) || typeof day.recommendations.tip !== "string") {
            throw new Error(`el día ${day.day} no trae recomendaciones válidas`);
        }
    }
    if (!data.budgetBreakdown || typeof data.budgetBreakdown.totalEstimated !== "number") {
        throw new Error("falta el desglose de presupuesto");
    }
    if (!data.recommendations || !Array.isArray(data.recommendations.tips)) {
        throw new Error("faltan las recomendaciones globales");
    }
}

// Llama a una función que produce un itinerario y valida el resultado; si falla o el JSON
// viene mal formado, reintenta una vez más. La reutilizan tanto el modo generar como el refinar.
async function withRetryAndValidation(producerFn) {
    let lastError;
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const data = await producerFn();
            validateItineraryData(data);
            return data;
        } catch (error) {
            lastError = error;
            console.warn(`Intento ${attempt} fallido (${error.message}).`);
        }
    }
    throw lastError;
}

function callGeminiItineraryWithRetry(destination, days, tripTypes, budget, group, season, accommodation, preferences) {
    return withRetryAndValidation(() => callGeminiItinerary(destination, days, tripTypes, budget, group, season, accommodation, preferences));
}
