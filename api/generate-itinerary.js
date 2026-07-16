// Función serverless de Vercel: llama a Gemini DESDE EL SERVIDOR.
// La API key vive en la variable de entorno GEMINI_API_KEY (Vercel → Settings → Environment Variables),
// nunca en el código ni en el navegador.
// Acepta dos modos: "generate" (plan nuevo) y "refine" (ajustar un plan ya generado).

const { GEMINI_API_URL, itinerarySchema, buildPrompt, buildRefinePrompt } = require("./_shared");

async function callGemini(prompt, apiKey) {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
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
        const error = new Error(`Gemini respondió con estado ${response.status}`);
        error.status = response.status;
        throw error;
    }

    const data = await response.json();
    const rawText = data.candidates[0].content.parts[0].text;
    return JSON.parse(rawText);
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

    const body = req.body || {};

    try {
        let prompt;

        if (body.mode === "refine") {
            const { currentPlan, refineRequest } = body;
            if (!currentPlan || !refineRequest) {
                res.status(400).json({ error: "Faltan datos para refinar el plan" });
                return;
            }
            prompt = buildRefinePrompt(currentPlan, refineRequest);
        } else {
            const { destination, days, tripTypes, budget, group, season, accommodation, preferences } = body;
            if (!destination || !Array.isArray(tripTypes) || tripTypes.length === 0 || tripTypes.length > 3 || !group || !season || !days || !budget) {
                res.status(400).json({ error: "Faltan datos del formulario" });
                return;
            }
            prompt = buildPrompt(destination, days, tripTypes, budget, group, season, accommodation || "", preferences || "");
        }

        const itinerary = await callGemini(prompt, apiKey);
        res.status(200).json(itinerary);
    } catch (error) {
        console.error("Error llamando a Gemini desde el servidor:", error);
        res.status(error.status || 500).json({ error: error.message || "No se pudo generar el itinerario" });
    }
};
