// Create the 'basemap' tile layer that will be the background of our map.
let basemap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
});

// OPTIONAL: Step 2 - Create a 'street' tile layer as a second background
let street = L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors, Humanitarian OpenStreetMap Team'
});

// Create the map object with center and zoom options.
let map = L.map("map", {
  center: [37.09, -95.71],
  zoom: 4,
  layers: [basemap]
});

// Then add the 'basemap' tile layer to the map.
basemap.addTo(map);

// OPTIONAL: Step 2 - Add layer groups for earthquakes and tectonic plates
let earthquakes = new L.LayerGroup();
let tectonicPlates = new L.LayerGroup();

let baseMaps = {
  "Street Map": street,
  "Base Map": basemap
};

let overlays = {
  "Earthquakes": earthquakes,
  "Tectonic Plates": tectonicPlates
};

// Add layer control
L.control.layers(baseMaps, overlays).addTo(map);

// Fetch earthquake data using D3
let earthquakeUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
d3.json(earthquakeUrl).then(function(data) {

  // Function to define marker style
  function styleInfo(feature) {
    return {
      opacity: 1,
      fillOpacity: 1,
      fillColor: getColor(feature.geometry.coordinates[2]),
      color: "#000000",
      radius: getRadius(feature.properties.mag),
      stroke: true,
      weight: 0.5
    };
  }

  // Function to determine marker color based on depth
  function getColor(depth) {
    return depth > 90 ? "#d73027" :
           depth > 70 ? "#fc8d59" :
           depth > 50 ? "#fee08b" :
           depth > 30 ? "#d9ef8b" :
           depth > 10 ? "#91cf60" : "#1a9850";
  }

  // Function to determine marker radius based on magnitude
  function getRadius(magnitude) {
    return magnitude === 0 ? 1 : magnitude * 4;
  }

  // Add GeoJSON layer with circle markers
  L.geoJson(data, {
    pointToLayer: function(feature, latlng) {
      return L.circleMarker(latlng);
    },
    style: styleInfo,
    onEachFeature: function(feature, layer) {
      layer.bindPopup(`Magnitude: ${feature.properties.mag}<br>Location: ${feature.properties.place}<br>Depth: ${feature.geometry.coordinates[2]} km`);
    }
  }).addTo(earthquakes);

  earthquakes.addTo(map);

  // Create a legend
  let legend = L.control({ position: "bottomright" });

  legend.onAdd = function() {
    let div = L.DomUtil.create("div", "info legend");
    const depths = [-10, 10, 30, 50, 70, 90];
    const colors = ["#1a9850", "#91cf60", "#d9ef8b", "#fee08b", "#fc8d59", "#d73027"];

    div.innerHTML = "<h4>Depth (km)</h4>";
    for (let i = 0; i < depths.length; i++) {
      div.innerHTML += `<i style="background:${colors[i]}"></i> ${depths[i]}${depths[i + 1] ? '&ndash;' + depths[i + 1] : '+'}<br>`;
    }
    return div;
  };

  legend.addTo(map);

  // OPTIONAL: Step 2 - Add tectonic plates data
  d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json").then(function(plateData) {
    L.geoJson(plateData, {
      color: "orange",
      weight: 2
    }).addTo(tectonicPlates);

    tectonicPlates.addTo(map);
  });
});

