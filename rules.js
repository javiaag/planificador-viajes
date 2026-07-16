// Generador de reglas: plan de respaldo cuando la IA no está disponible.

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
    },
    playa: {
        morning: [
            { text: "Paseo por la playa al amanecer", cost: 1 },
            { text: "Desayuno frente al mar", cost: 2 },
            { text: "Sesión de yoga en la arena", cost: 1 },
            { text: "Alquiler de tumbonas y sombrilla", cost: 2 }
        ],
        afternoon: [
            { text: "Baño y descanso en la playa", cost: 1, excludeSeasons: ["invierno"] },
            { text: "Deportes acuáticos (paddle surf, vela)", cost: 3, excludeSeasons: ["invierno"] },
            { text: "Paseo por el paseo marítimo", cost: 1 },
            { text: "Snorkel en una cala cercana", cost: 2, excludeSeasons: ["invierno"] }
        ],
        night: [
            { text: "Cena con vistas al mar", cost: 2 },
            { text: "Chiringuito de playa con música", cost: 2 },
            { text: "Paseo nocturno junto al mar", cost: 1 },
            { text: "Barbacoa en la playa", cost: 2 }
        ]
    }
};

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

function renderItinerary(destination, days, tripTypes, budget, group, season, accommodation) {
    const budgetLevel = estimateBudgetLevel(budget, days);
    const perDay = (budget / days).toFixed(0);

    // Fusiona los bancos de actividades de todos los tipos elegidos antes de filtrar
    // (mismo filtrado de siempre, solo que sobre la unión de varias listas).
    const pools = {
        morning: filterActivities(tripTypes.flatMap((type) => activities[type].morning), budgetLevel, group, season),
        afternoon: filterActivities(tripTypes.flatMap((type) => activities[type].afternoon), budgetLevel, group, season),
        night: filterActivities(tripTypes.flatMap((type) => activities[type].night), budgetLevel, group, season)
    };

    let html = `
        <button type="button" class="print-btn" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
        <div class="summary-card">
            <h2>📋 Resumen del viaje</h2>
            <p>📍 <strong>Destino:</strong> ${destination}</p>
            <p>📅 <strong>Días:</strong> ${days}</p>
            <p><strong>Tipo:</strong> ${formatTripTypes(tripTypes)}</p>
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
    saveLastPlan({ destination, days, tripTypes, budget, group, season, accommodation }, "rules", null);
}
