// Mapa interactivo del itinerario (Leaflet + OpenStreetMap, sin API key).
// Solo se usa cuando el plan viene de la IA: es la única fuente con coordenadas reales.

const mapSection = document.getElementById("map-section");

// Oculta el mapa (se usa cuando el plan es del generador de reglas, sin coordenadas).
function hideMap() {
    mapSection.style.display = "none";
}

// Se implementa en el Paso 2: dibuja marcadores, rutas y filtros a partir de aiData.days.
function renderMap(aiData) {
    mapSection.style.display = "block";
}
