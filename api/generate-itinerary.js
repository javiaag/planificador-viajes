// Función serverless de Vercel: llama a Gemini DESDE EL SERVIDOR.
// La API key vive en la variable de entorno GEMINI_API_KEY (Vercel → Settings → Environment Variables),
// nunca en el código ni en el navegador.

const GEMINI_MODEL = "gemini-3.1-flash-lite";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const tripLabels = { cultural: "Cultural", naturaleza: "Naturaleza", fiesta: "Fiesta", gastronomico: "Gastronómico" };
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

PRIMERO comprueba si "${destination}" es un lugar real y visitable (ciudad, región, país o zona identificable). Si NO lo es (inventado, sin sentido, ofensivo, o no se puede identificar como lugar), responde ÚNICAMENTE con {"validDestination": false} y nada más — no generes días ni recomendaciones. Si SÍ es un lugar real, responde con "validDestination": true y continúa con estas instrucciones:

1. Para cada día, organiza mañana/tarde/noche con lugares concretos (monumentos, museos, barrios, restaurantes) cercanos entre sí dentro de la misma zona de la ciudad, para minimizar desplazamientos.
2. Cada actividad debe incluir: nombre del lugar, breve descripción (1 frase), precio estimado de entrada en €, cómo llegar (a pie/metro/bus, indicando desde el alojamiento cuando aplique) y coordenadas lat/lng aproximadas del lugar.
3. La suma total estimada del viaje debe aproximarse al presupuesto indicado (${budget} €); incluye un desglose aproximado en "budgetBreakdown" y una nota si no ha sido posible ajustarse.
4. Ten en cuenta el grupo (${groupInfo[group].label}) y la época del año (${seasonInfo[season].label}) al elegir actividades (ritmo, clima).
5. Incluye una sección final de recomendaciones con 3-4 restaurantes concretos (nombre, rango de precio, breve descripción) y varios tips de viajero (cómo evitar colas, qué reservar online, errores típicos de turista).
6. Todos los precios son estimaciones tuyas, no tienes datos en tiempo real: no inventes una precisión falsa.

Responde ÚNICAMENTE con el JSON solicitado, sin texto adicional.`;
}

module.exports = async function handler(req, res) {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Método no permitido, usa POST" });
        return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        res.status(500).json({ error: "El servidor no tiene configurada la variable de entorno GEMINI_API_KEY" });
        return;
    }

    const { destination, days, tripType, budget, group, season, accommodation } = req.body || {};
    if (!destination || !tripType || !group || !season || !days || !budget) {
        res.status(400).json({ error: "Faltan datos del formulario" });
        return;
    }

    const prompt = buildPrompt(destination, days, tripType, budget, group, season, accommodation || "");

    try {
        const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
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

        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.text();
            console.error("Respuesta de error completa de Gemini:", errorBody);
            res.status(geminiResponse.status).json({ error: `Gemini respondió con estado ${geminiResponse.status}` });
            return;
        }

        const data = await geminiResponse.json();
        const rawText = data.candidates[0].content.parts[0].text;
        const itinerary = JSON.parse(rawText);

        res.status(200).json(itinerary);
    } catch (error) {
        console.error("Error llamando a Gemini desde el servidor:", error);
        res.status(500).json({ error: "No se pudo generar el itinerario" });
    }
};
