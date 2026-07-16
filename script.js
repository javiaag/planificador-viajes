// Lógica del planificador de viajes

// Banco de actividades por tipo de viaje y momento del día
const activities = {
    cultural: {
        morning: ["Visita a un museo", "Tour guiado por el casco histórico", "Entrada a un monumento emblemático", "Paseo por la catedral"],
        afternoon: ["Recorrido por una galería de arte", "Visita a un mercado tradicional", "Ruta arquitectónica por el centro", "Exposición temporal"],
        night: ["Cena en restaurante típico", "Espectáculo de música local", "Paseo nocturno por el centro histórico", "Visita a un mirador iluminado"]
    },
    naturaleza: {
        morning: ["Senderismo por la zona", "Excursión a un parque natural", "Paseo en bicicleta por el bosque", "Observación de aves"],
        afternoon: ["Baño en río o cascada", "Ruta en kayak", "Visita a un mirador natural", "Paseo por la costa"],
        night: ["Observación de estrellas", "Cena al aire libre", "Fogata con historias locales", "Paseo tranquilo junto al agua"]
    },
    fiesta: {
        morning: ["Recuperación con desayuno tranquilo", "Paseo relajado por la zona", "Visita a una terraza con vistas", "Mercadillo local"],
        afternoon: ["Piscina o playa con música", "Ruta de bares y tapas", "Actividad grupal (juegos, deportes)", "Clase de baile"],
        night: ["Fiesta en discoteca local", "Bar con música en vivo", "Ruta de copas por el centro", "Evento nocturno o festival"]
    },
    gastronomico: {
        morning: ["Visita a un mercado de productos locales", "Clase de cocina tradicional", "Desayuno en panadería artesanal", "Ruta de cafés especiales"],
        afternoon: ["Cata de vinos o quesos", "Almuerzo en restaurante con estrella local", "Tour gastronómico por el barrio", "Visita a una bodega"],
        night: ["Cena degustación", "Recorrido de tapas nocturno", "Cena con maridaje", "Restaurante con especialidad regional"]
    }
};

const form = document.getElementById("trip-form");
const itineraryDiv = document.getElementById("itinerary");

form.addEventListener("submit", function (event) {
    event.preventDefault(); // evita que la página se recargue al enviar el formulario

    const destination = document.getElementById("destination").value.trim();
    const days = parseInt(document.getElementById("days").value, 10);
    const tripType = document.getElementById("trip-type").value;

    if (!destination || !tripType || !days || days < 1 || days > 30) {
        itineraryDiv.innerHTML = `<p class="error">Por favor, completa destino, días (1-30) y tipo de viaje.</p>`;
        return;
    }

    renderItinerary(destination, days, tripType);
});

function renderItinerary(destination, days, tripType) {
    const plan = activities[tripType];
    let html = `<h2>Itinerario para ${destination} (${days} días)</h2>`;

    for (let day = 1; day <= days; day++) {
        // el módulo (%) hace que las actividades se repitan en ciclo si el viaje es largo
        const morning = plan.morning[(day - 1) % plan.morning.length];
        const afternoon = plan.afternoon[(day - 1) % plan.afternoon.length];
        const night = plan.night[(day - 1) % plan.night.length];

        html += `
            <div class="day-card">
                <h3>Día ${day}</h3>
                <p><strong>Mañana:</strong> ${morning}</p>
                <p><strong>Tarde:</strong> ${afternoon}</p>
                <p><strong>Noche:</strong> ${night}</p>
            </div>
        `;
    }

    itineraryDiv.innerHTML = html;
}
