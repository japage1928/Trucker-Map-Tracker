// Initialize Mapbox (User needs to provide their own token in secrets)
// For now, using a placeholder if MAPBOX_TOKEN isn't set
// Note: In Replit, we can't easily inject env vars into frontend without server help or specific setup
// We'll fetch the token from an endpoint or the user can set it

let userLocation = null;
let userMarker = null;
const poiMarkers = [];

// Default map view
mapboxgl.accessToken = 'pk.eyJ1IjoicmVwbGl0IiwiYSI6ImNsajB6Zzh6YjAwYXozam1yeWdzY2dzZzIifQ.9-f5C2t4XzG2-5P9-f-GvQ'; // Public test token

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-98.5795, 39.8283], // Center of US
    zoom: 3
});

// Initialize User Tracking
if ("geolocation" in navigator) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            userLocation = { lat: latitude, lng: longitude };

            if (!userMarker) {
                const el = document.createElement('div');
                el.className = 'user-marker';
                userMarker = new mapboxgl.Marker(el)
                    .setLngLat([longitude, latitude])
                    .addTo(map);
                
                // First time locating, fly there
                map.flyTo({ center: [longitude, latitude], zoom: 14 });
            } else {
                userMarker.setLngLat([longitude, latitude]);
            }
        },
        (error) => {
            console.error("Error tracking location:", error);
            alert("Location tracking failed. Please enable GPS.");
        },
        { enableHighAccuracy: true }
    );
}

// Fetch and display POIs
async function loadPOIs() {
    try {
        const res = await fetch('/api/poi');
        const pois = await res.json();
        
        // Clear existing markers
        poiMarkers.forEach(m => m.remove());
        
        pois.forEach(poi => {
            const marker = new mapboxgl.Marker({ color: '#28a745' })
                .setLngLat([poi.longitude, poi.latitude])
                .setPopup(new mapboxgl.Popup().setHTML(`
                    <strong>${poi.name}</strong><br>
                    ${poi.category}<br>
                    ${poi.address}
                `))
                .addTo(map);
            poiMarkers.push(marker);
        });
    } catch (err) {
        console.error("Error loading POIs:", err);
    }
}

map.on('load', loadPOIs);

// Add POI Flow
const addPlaceBtn = document.getElementById('add-place-btn');
const modal = document.getElementById('poi-modal');
const poiForm = document.getElementById('poi-form');
const cancelBtn = document.getElementById('cancel-btn');
const addressDisplay = document.getElementById('resolved-address');

let currentCapture = null;

addPlaceBtn.addEventListener('click', async () => {
    if (!userLocation) {
        alert("Waiting for GPS signal...");
        return;
    }

    currentCapture = { ...userLocation };
    
    // Lock map camera
    map.flyTo({ center: [currentCapture.lng, currentCapture.lat], zoom: 16 });
    
    modal.style.display = 'block';
    addressDisplay.textContent = "Resolving address...";

    // Reverse Geocode
    try {
        const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${currentCapture.lng},${currentCapture.lat}.json?access_token=${mapboxgl.accessToken}`);
        const data = await response.json();
        if (data.features && data.features.length > 0) {
            currentCapture.address = data.features[0].place_name;
            addressDisplay.textContent = currentCapture.address;
        } else {
            currentCapture.address = "Unknown Address";
            addressDisplay.textContent = "Could not resolve address.";
        }
    } catch (err) {
        console.error("Geocoding error:", err);
        addressDisplay.textContent = "Error resolving address.";
    }
});

cancelBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    poiForm.reset();
});

poiForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const poiData = {
        name: document.getElementById('poi-name').value,
        category: document.getElementById('poi-category').value,
        latitude: currentCapture.lat,
        longitude: currentCapture.lng,
        address: currentCapture.address
    };

    try {
        const res = await fetch('/api/poi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(poiData)
        });

        if (res.ok) {
            modal.style.display = 'none';
            poiForm.reset();
            loadPOIs();
        } else {
            alert("Failed to save POI.");
        }
    } catch (err) {
        console.error("Submission error:", err);
    }
});