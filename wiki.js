// Imágenes de los lugares vía la API REST de Wikipedia (gratuita, sin key).
// Todo aquí es "best effort": si algo falla o no hay imagen, no pasa nada — la tarjeta
// se ve perfecta sin ella. Las imágenes se cargan en segundo plano, nunca bloquean el render.

// Las páginas de regiones/países suelen tener como imagen principal un mapa de localización
// en vez de una foto — los archivos de Wikimedia para eso casi siempre incluyen estas palabras
// en el nombre, así que los descartamos: peor tener menos imágenes que mostrar mapas sin sentido.
function looksLikeMapImage(url) {
    return /map|mapa|locat/i.test(url);
}

async function fetchWikipediaThumbnail(placeName) {
    try {
        const response = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(placeName)}`);
        if (!response.ok) {
            return null;
        }
        const data = await response.json();
        const thumbnailUrl = data.thumbnail ? data.thumbnail.source : null;
        if (thumbnailUrl && looksLikeMapImage(thumbnailUrl)) {
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
