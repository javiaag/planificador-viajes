// Modo "refinar": el usuario pide un ajuste sobre un plan ya generado.
// Reutiliza fetchGemini/fetchServerlessApi/withRetryAndValidation de gemini.js.

function buildRefinePrompt(currentPlan, refineRequest) {
    return `Aquí tienes un itinerario de viaje ya generado, en formato JSON:

${JSON.stringify(currentPlan)}

El viajero pide este ajuste: "${refineRequest}"

Modifica el itinerario para aplicar ese cambio, tocando SOLO lo necesario y manteniendo todo lo demás igual. Responde con el mismo formato JSON de siempre (mismo número de días salvo que el ajuste pida cambiarlo explícitamente), incluyendo "validDestination": true. Todo el texto debe estar en ESPAÑOL.

Responde ÚNICAMENTE con el JSON solicitado, sin texto adicional, y siempre en español.`;
}

// Desarrollo local: llama a Gemini directamente desde el navegador.
async function callGeminiRefineDirectly(currentPlan, refineRequest) {
    const prompt = buildRefinePrompt(currentPlan, refineRequest);
    return fetchGemini(prompt);
}

// Producción: vía nuestra función serverless, en modo "refine".
async function callGeminiRefineViaApi(currentPlan, refineRequest) {
    return fetchServerlessApi({ mode: "refine", currentPlan, refineRequest });
}

function callGeminiRefine(currentPlan, refineRequest) {
    if (isLocalFile) {
        return callGeminiRefineDirectly(currentPlan, refineRequest);
    }
    return callGeminiRefineViaApi(currentPlan, refineRequest);
}

function callGeminiRefineWithRetry(currentPlan, refineRequest) {
    return withRetryAndValidation(() => callGeminiRefine(currentPlan, refineRequest));
}
