// Distancia en línea recta entre dos puntos (fórmula de Haversine) y tiempo estimado a pie.
// Sin APIs externas: es geometría pura, no la ruta real por calles.

const WALKING_SPEED_KMH = 4.5;
const TRANSIT_SUGGESTION_THRESHOLD_KM = 3;

function haversineDistanceKm(lat1, lng1, lat2, lng2) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
}

// Texto tipo "→ 1,2 km · ~15 min a pie aprox. (línea recta, no ruta real)", con aviso si el
// tramo es largo. Lo usan tanto las tarjetas de día (render.js) como las líneas del mapa (map.js).
function formatDistanceText(lat1, lng1, lat2, lng2) {
    const distanceKm = haversineDistanceKm(lat1, lng1, lat2, lng2);
    const minutes = Math.round((distanceKm / WALKING_SPEED_KMH) * 60);
    const distanceText = distanceKm.toFixed(1).replace(".", ",");
    const transitNote = distanceKm > TRANSIT_SUGGESTION_THRESHOLD_KM
        ? " — bastante para ir a pie, mejor transporte público"
        : "";
    return `→ ${distanceText} km · ~${minutes} min a pie aprox. (línea recta, no ruta real)${transitNote}`;
}
