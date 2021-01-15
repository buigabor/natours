/* eslint-disable */

const locations = JSON.parse(document.getElementById('map').dataset.locations);

mapboxgl.accessToken =
  'pk.eyJ1IjoiYnVpZ2Fib3IiLCJhIjoiY2tqbjVoemU0MGFsYzJ2bzh6NjZjdTlhNiJ9.paqLKmgDTa5Jy17ibtADvg';
var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/buigabor/ckjn5optx1k2919oanapz06v4',
  scrollZoom: false,
});

const bounds = new mapboxgl.LngLatBounds();

locations.forEach((location) => {
  // Create marker
  const el = document.createElement('div');
  el.className = 'marker';
  // Add marker
  new mapboxgl.Marker({ element: el, anchor: 'bottom' })
    .setLngLat(location.coordinates)
    .addTo(map);

  // Add popup with information
  new mapboxgl.Popup({ offset: 30 })
    .setLngLat(location.coordinates)
    .setHTML(`<p>Day ${location.day}: ${location.description}</p>`)
    .addTo(map);

  // Extend map bounds to include current locations
  bounds.extend(location.coordinates);
});

map.fitBounds(bounds, {
  padding: { top: 200, bottom: 150, left: 100, right: 100 },
});

const nav = new mapboxgl.NavigationControl();
map.addControl(nav, 'top-right');
