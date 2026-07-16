// Mapa interactivo del itinerario (Leaflet + OpenStreetMap, sin API key).
// Solo se usa cuando el plan viene de la IA: es la única fuente con coordenadas reales.

const mapSection = document.getElementById("map-section");

// Un color distinto por día, cíclico si el viaje tiene más días que colores.
const DAY_COLORS = ["#6c5ce7", "#00b894", "#e17055", "#0984e3", "#e84393", "#fdcb6e", "#00cec9", "#d63031"];
const PERIOD_LABELS = { morning: "🌅 Mañana", afternoon: "☀️ Tarde", night: "🌙 Noche" };

let leafletMap = null;
let dayLayers = {}; // day (número) -> L.layerGroup, para los filtros del Paso 3

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
    const allPoints = [];
    const periods = ["morning", "afternoon", "night"];

    aiData.days.forEach((day, dayIndex) => {
        const color = DAY_COLORS[dayIndex % DAY_COLORS.length];
        const dayGroup = L.layerGroup();
        const dayPoints = [];

        periods.forEach((period, periodIndex) => {
            const activity = day[period];
            if (typeof activity.lat !== "number" || typeof activity.lng !== "number") {
                return;
            }
            const point = [activity.lat, activity.lng];
            L.marker(point, { icon: createNumberedIcon(color, periodIndex + 1) })
                .bindPopup(`<strong>${activity.place}</strong><br>${PERIOD_LABELS[period]}<br>💶 ${activity.estimatedPrice}`)
                .addTo(dayGroup);
            dayPoints.push(point);
            allPoints.push(point);
        });

        if (dayPoints.length > 1) {
            L.polyline(dayPoints, { color, weight: 3, opacity: 0.7 }).addTo(dayGroup);
        }

        dayGroup.addTo(leafletMap);
        dayLayers[day.day] = dayGroup;
    });

    if (allPoints.length > 0) {
        leafletMap.fitBounds(L.latLngBounds(allPoints), { padding: [30, 30] });
    }
}
