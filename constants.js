// Emojis, etiquetas y datos de referencia compartidos entre el generador de reglas y el de IA.

const periodIcons = { morning: "🌅", afternoon: "☀️", night: "🌙" };
const tripIcons = { cultural: "🏛️", naturaleza: "🌿", fiesta: "🎉", gastronomico: "🍽️", playa: "🏖️" };
const tripLabels = { cultural: "Cultural", naturaleza: "Naturaleza", fiesta: "Fiesta", gastronomico: "Gastronómico", playa: "Playa" };
const costSymbols = ["€", "€€", "€€€"];

// El viaje puede combinar hasta 3 tipos: los mostramos juntos con su icono, ej. "🏛️ Cultural + 🏖️ Playa".
function formatTripTypes(tripTypes) {
    return tripTypes.map((type) => `${tripIcons[type]} ${tripLabels[type]}`).join(" + ");
}

const groupInfo = {
    jovenes: { emoji: "🎒", label: "Jóvenes", pace: "Ritmo intenso: aprovechad cada hora del día" },
    familia: { emoji: "👨‍👩‍👧", label: "Familia", pace: "Ritmo pausado y flexible, con descansos para los más pequeños" },
    seniors: { emoji: "🧓", label: "Seniors", pace: "Ritmo tranquilo, sin prisas y con tiempo libre entre actividades" }
};

const seasonInfo = {
    primavera: { emoji: "🌸", label: "Primavera", note: "clima templado, ideal para el exterior" },
    verano: { emoji: "☀️", label: "Verano", note: "calor fuerte, lleva protección solar y agua" },
    otono: { emoji: "🍂", label: "Otoño", note: "temperaturas suaves, con posibilidad de lluvia" },
    invierno: { emoji: "❄️", label: "Invierno", note: "frío, abrígate bien y consulta el pronóstico" }
};
