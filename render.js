// Pinta en pantalla el itinerario generado por la IA.

function renderActivity(icon, label, activity) {
    return `
        <p>
            <strong>${icon} ${label}:</strong> ${activity.place} — ${activity.description}<br>
            <span class="price-note">${activity.estimatedPrice} (estimado, verificar web oficial)</span><br>
            <span class="how-to">🧭 ${activity.howToGetThere}</span>
        </p>
    `;
}

function renderAIItinerary(destination, days, tripTypes, budget, group, season, accommodation, aiData) {
    let html = `
        <button type="button" class="print-btn" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
        <p class="ai-disclaimer">⚠️ Precios y horarios estimados por IA (sin datos en tiempo real) — verifica siempre en la web oficial antes de viajar.</p>
        <div class="summary-card">
            <h2>📋 Resumen del viaje</h2>
            <p>📍 <strong>Destino:</strong> ${destination}</p>
            <p>📅 <strong>Días:</strong> ${days}</p>
            <p><strong>Tipo:</strong> ${formatTripTypes(tripTypes)}</p>
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

    html += `
        <div class="refine-card">
            <h2>✏️ Ajustar mi plan</h2>
            <p class="refine-hint">¿Quieres cambiar algo? Descríbelo y la IA ajustará solo esa parte del plan.</p>
            <textarea id="refine-input" rows="2" placeholder="Ej: cambia la tarde del día 2 por algo más tranquilo"></textarea>
            <button type="button" id="refine-btn">Ajustar plan</button>
        </div>
    `;

    itineraryDiv.innerHTML = html;
    renderMap(aiData);
    saveLastPlan({ destination, days, tripTypes, budget, group, season, accommodation }, "ai", aiData);
    attachRefineHandler({ destination, days, tripTypes, budget, group, season, accommodation }, aiData);
}
