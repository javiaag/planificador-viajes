// Mapa interactivo del itinerario (Leaflet + OpenStreetMap, sin API key).
// Solo se usa cuando el plan viene de la IA: es la única fuente con coordenadas reales.

const mapSection = document.getElementById("map-section");
const dayFiltersDiv = document.getElementById("day-filters");

// Un color distinto por día, cíclico si el viaje tiene más días que colores.
const DAY_COLORS = ["#6c5ce7", "#00b894", "#e17055", "#0984e3", "#e84393", "#fdcb6e", "#00cec9", "#d63031"];
const PERIOD_LABELS = { morning: "🌅 Mañana", afternoon: "☀️ Tarde", night: "🌙 Noche" };

let leafletMap = null;
let dayLayers = {}; // day (número) -> L.layerGroup
let dayPoints = {}; // day (número) -> [[lat, lng], ...], para reajustar el zoom al filtrar
let allPoints = [];

// Oculta el mapa (se usa cuando el plan es del generador de reglas, sin coordenadas).
function hideMap() {
    mapSection.style.display = "none";
}

// Icono numerado (1/2/3 = mañana/tarde/noche) con el color del día.
function createNumberedIcon(color, number) {
    return L.divIcon({
        className: "day-marker-icon",
        html: `<div class="day-marker" style="background-color: ${color}">${number}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    });
}

function renderMap(aiData) {
    mapSection.style.display = "block";

    // si ya había un mapa de una búsqueda anterior, lo destruimos antes de crear uno nuevo
    if (leafletMap) {
        leafletMap.remove();
    }
    leafletMap = L.map("map");
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19
    }).addTo(leafletMap);

    dayLayers = {};
    dayPoints = {};
    allPoints = [];
    const periods = ["morning", "afternoon", "night"];

    aiData.days.forEach((day, dayIndex) => {
        const color = DAY_COLORS[dayIndex % DAY_COLORS.length];
        const dayGroup = L.layerGroup();
        const pointsOfThisDay = [];

        periods.forEach((period, periodIndex) => {
            const activity = day[period];
            if (typeof activity.lat !== "number" || typeof activity.lng !== "number") {
                return;
            }
            const point = [activity.lat, activity.lng];
            L.marker(point, { icon: createNumberedIcon(color, periodIndex + 1) })
                .bindPopup(`<strong>${activity.place}</strong><br>${PERIOD_LABELS[period]}<br>💶 ${activity.estimatedPrice}`)
                .addTo(dayGroup);
            pointsOfThisDay.push(point);
            allPoints.push(point);
        });

        // Un tramo (polyline) por cada par de actividades consecutivas, con su distancia/tiempo en el popup.
        for (let i = 0; i < pointsOfThisDay.length - 1; i++) {
            const [lat1, lng1] = pointsOfThisDay[i];
            const [lat2, lng2] = pointsOfThisDay[i + 1];
            L.polyline([pointsOfThisDay[i], pointsOfThisDay[i + 1]], { color, weight: 3, opacity: 0.7 })
                .bindPopup(formatDistanceText(lat1, lng1, lat2, lng2))
                .addTo(dayGroup);
        }

        dayGroup.addTo(leafletMap);
        dayLayers[day.day] = dayGroup;
        dayPoints[day.day] = pointsOfThisDay;
    });

    if (allPoints.length > 0) {
        leafletMap.fitBounds(L.latLngBounds(allPoints), { padding: [30, 30] });
    }

    renderDayFilters(aiData.days);
}

// Construye los botones "Todos" / "Día N" y engancha el filtrado al hacer clic.
function renderDayFilters(days) {
    let html = `<button type="button" class="day-filter-btn active" data-day="all">Todos</button>`;
    days.forEach((day, index) => {
        const color = DAY_COLORS[index % DAY_COLORS.length];
        html += `<button type="button" class="day-filter-btn" data-day="${day.day}" style="--day-color: ${color}">Día ${day.day}</button>`;
    });
    dayFiltersDiv.innerHTML = html;

    dayFiltersDiv.querySelectorAll(".day-filter-btn").forEach((button) => {
        button.addEventListener("click", () => {
            dayFiltersDiv.querySelectorAll(".day-filter-btn").forEach((b) => b.classList.remove("active"));
            button.classList.add("active");
            filterMapByDay(button.dataset.day);
        });
    });
}

// Muestra solo las capas del día elegido ("all" = todos los días) y reajusta el zoom.
function filterMapByDay(selectedDay) {
    const visiblePoints = [];

    Object.entries(dayLayers).forEach(([dayNumber, layerGroup]) => {
        const shouldShow = selectedDay === "all" || dayNumber === selectedDay;
        if (shouldShow) {
            if (!leafletMap.hasLayer(layerGroup)) layerGroup.addTo(leafletMap);
            visiblePoints.push(...dayPoints[dayNumber]);
        } else if (leafletMap.hasLayer(layerGroup)) {
            leafletMap.removeLayer(layerGroup);
        }
    });

    if (visiblePoints.length > 0) {
        leafletMap.fitBounds(L.latLngBounds(visiblePoints), { padding: [30, 30] });
    }
}

// Leaflet no reajusta el mapa solo cuando cambia el tamaño de la ventana (ej: girar el móvil).
window.addEventListener("resize", () => {
    if (leafletMap) {
        leafletMap.invalidateSize();
    }
});
