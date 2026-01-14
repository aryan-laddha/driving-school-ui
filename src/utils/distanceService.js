// src/utils/distanceService.js

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

// Convert full address → Latitude/Longitude
export async function geocodeAddress(address) {
  if (!address) throw new Error("Empty address");

  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(address)}&format=json&limit=1`;

  const res = await fetch(url, {
    headers: { "User-Agent": "YourApp/1.0" }
  });

  const data = await res.json();

  if (!data.length) {
    throw new Error("Could not find location for this address");
  }

  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon)
  };
}

// Get driving distance using OSRM
export async function getDrivingDistance(lat1, lon1, lat2, lon2) {
  const url = `${OSRM_URL}/${lon1},${lat1};${lon2},${lat2}?overview=false`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.routes || !data.routes.length) {
    throw new Error("No route found");
  }

  return data.routes[0].distance; // meters
}

// Full pipeline: FullAddress → Distance(KM) from Pune Station
export async function calculateDistanceFromPuneStation(fullAddress) {
  // Pune Station fixed coordinates
  const puneStation = {
    lat: 18.5289,
    lon: 73.8746
  };

  // Step 1: Convert user address → lat/lon
  const userLocation = await geocodeAddress(fullAddress);

  // Step 2: Get distance via OSRM
  const meters = await getDrivingDistance(
    puneStation.lat,
    puneStation.lon,
    userLocation.lat,
    userLocation.lon
  );

  return {
    km: meters / 1000,
    meters,
    from: puneStation,
    to: userLocation
  };
}
