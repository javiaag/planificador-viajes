// Datos y prompts compartidos por la función serverless. Nombre con "_" para que Vercel
// no lo trate como una ruta propia (solo generate-itinerary.js es un endpoint).

const GEMINI_MODEL = "gemini-3.1-flash-lite";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const tripLabels = { cultural: "Cultural", naturaleza: "Naturaleza", fiesta: "Fiesta", gastronomico: "Gastronómico", playa: "Playa" };
const groupInfo = {
    jovenes: { label: "Jóvenes" },
    familia: { label: "Familia" },
    seniors: { label: "Seniors" }
};
const seasonInfo = {
    primavera: { label: "Primavera" },
    verano: { label: "Verano" },
    otono: { label: "Otoño" },
    invierno: { label: "Invierno" }
};

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
4. La suma total estimada del viaje debe aproximarse al presupuesto indicado (${budget} €); incluye un desglose aproximado en "budgetBreakdown" y una nota si no ha sido posible ajustarse.
5. Ten en cuenta el grupo (${groupInfo[group].label}), la época del año (${seasonInfo[season].label}) y las preferencias del viajero (si las hay) al elegir actividades.
6. Incluye una sección final de recomendaciones con 3-4 restaurantes concretos (nombre, rango de precio, breve descripción) y varios tips de viajero (cómo evitar colas, qué reservar online, errores típicos de turista).
7. Todos los precios son estimaciones tuyas, no tienes datos en tiempo real: no inventes una precisión falsa.

Responde ÚNICAMENTE con el JSON solicitado, sin texto adicional.`;
}

function buildRefinePrompt(currentPlan, refineRequest) {
    return `Aquí tienes un itinerario de viaje ya generado, en formato JSON:

${JSON.stringify(currentPlan)}

El viajero pide este ajuste: "${refineRequest}"

Modifica el itinerario para aplicar ese cambio, tocando SOLO lo necesario y manteniendo todo lo demás igual. Responde con el mismo formato JSON de siempre (mismo número de días salvo que el ajuste pida cambiarlo explícitamente), incluyendo "validDestination": true.

Responde ÚNICAMENTE con el JSON solicitado, sin texto adicional.`;
}

module.exports = { GEMINI_API_URL, itinerarySchema, buildPrompt, buildRefinePrompt };
