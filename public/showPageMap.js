mapboxgl.accessToken =
  "pk.eyJ1IjoiYmlndmVlenVzIiwiYSI6ImNsZjk3dWhuYjAzODc0M251aDZra2x3YWIifQ.DNAwOhvuwW2bQoJPHLhZmA";
const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v11",
  center: hotel.geometry.coordinates,
  zoom: 11,
});

new mapboxgl.Marker().setLngLat(hotel.geometry.coordinates).addTo(map);
