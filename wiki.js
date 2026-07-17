// Imágenes de los lugares vía la API REST de Wikipedia (gratuita, sin key).
// Todo aquí es "best effort": si algo falla o no hay imagen, no pasa nada — la tarjeta
// se ve perfecta sin ella. Las imágenes se cargan en segundo plano, nunca bloquean el render.

// Las páginas de regiones/países/monumentos suelen tener como imagen principal un mapa de
// localización, bandera, escudo o diagrama en vez de una foto real. En Wikimedia, ese tipo de
// contenido es casi siempre un SVG (dibujo vectorial) — una foto real de un lugar es casi
// siempre JPG. Así que si el thumbnail viene de un .svg, lo descartamos: mejor sin imagen
// que mostrar un mapa o un escudo donde se espera una foto.
function looksLikeNonPhoto(url) {
    return /\.svg/i.test(url);
}

async function fetchWikipediaThumbnail(placeName) {
    try {
        const response = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(placeName)}`);
        if (!response.ok) {
            return null;
        }
        const data = await response.json();
        // Página de desambiguación (nombre ambiguo, ej. "Santander" ciudad vs banco): la imagen
        // no tiene por qué ser del lugar que buscamos, mejor no arriesgarse.
        if (data.type === "disambiguation") {
            return null;
        }
        const thumbnailUrl = data.thumbnail ? data.thumbnail.source : null;
        if (thumbnailUrl && looksLikeNonPhoto(thumbnailUrl)) {
            return null;
        }
        return thumbnailUrl;
    } catch (error) {
        return null; // sin conexión, CORS, la página no existe... el resultado es el mismo: sin imagen
    }
}

// Rellena el placeholder si encontró imagen; si no, lo deja vacío (el CSS lo oculta con :empty).
function setImageIfFound(elementId, thumbnailUrl) {
    if (!thumbnailUrl) {
        return;
    }
    const el = document.getElementById(elementId);
    if (el) {
        el.innerHTML = `<img src="${thumbnailUrl}" alt="" loading="lazy">`;
    }
}

// Lanza todas las búsquedas en paralelo sin esperarlas (fire-and-forget):
// el itinerario ya está pintado y usable antes de que llegue ninguna imagen.
function loadItineraryImages(destination, aiData) {
    fetchWikipediaThumbnail(destination).then((url) => setImageIfFound("destination-image", url));

    const periods = ["morning", "afternoon", "night"];
    aiData.days.forEach((day) => {
        periods.forEach((period) => {
            const elementId = `activity-image-${day.day}-${period}`;
            fetchWikipediaThumbnail(day[period].place).then((url) => setImageIfFound(elementId, url));
        });
    });
}
