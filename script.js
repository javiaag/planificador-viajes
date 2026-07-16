// Lógica principal: formulario, persistencia y qué generador usar.

const form = document.getElementById("trip-form");
const itineraryDiv = document.getElementById("itinerary");
const submitButton = form.querySelector("button[type=submit]");

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

function showInvalidDestinationMessage(destination) {
    hideMap();
    itineraryDiv.innerHTML = `
        <div class="invalid-destination-card">
            <p>🤔 No encontramos "<strong>${destination}</strong>" como destino — ¿está bien escrito?</p>
        </div>
    `;
}

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
        if (aiData.validDestination === false) {
            // el destino no es un lugar real: no tiene sentido caer al generador de reglas (inventaría un plan para él)
            showInvalidDestinationMessage(destination);
            return;
        }
        renderAIItinerary(destination, days, tripType, budget, group, season, accommodation, aiData);
    } catch (error) {
        console.error("Fallo definitivo generando itinerario con IA:", error);
        fallbackToRuleBasedPlan(destination, days, tripType, budget, group, season, accommodation, `No se pudo generar el plan con IA (${error.message})`);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Generar plan ✨";
    }
});

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
