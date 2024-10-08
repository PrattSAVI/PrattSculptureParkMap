// configure the basemap
var transformRequest = (url, resourceType) => {
  var isMapboxRequest =
    url.slice(8, 22) === "api.mapbox.com" ||
    url.slice(10, 26) === "tiles.mapbox.com";
  return {
    url: isMapboxRequest ?
      url.replace("?", "?pluginName=sheetMapper&") :
      url
  };
};

mapboxgl.accessToken = 'your key here'; 
var map = new mapboxgl.Map({
  container: 'map', // container id
  style: 'mapbox://styles/mapbox/light-v11', 
  center: [-73.963502, 40.690914], 
  zoom: 17, // starting zoom
  transformRequest: transformRequest
});

//add google sheets data
$(document).ready(function() {
  $.ajax({
    type: "GET",
    url: 'your CSV sheet here',
    dataType: "text",
    success: function(csvData) {
      makeGeoJSON(csvData);
    }
  });

  function makeGeoJSON(csvData) {
    csv2geojson.csv2geojson(csvData, {
      latfield: 'Latitude',
      lonfield: 'Longitude',
      delimiter: ','
    }, function(err, data) {
      map.on('load', function() {
        map.addLayer({
          'id': 'csvData',
          'type': 'circle',
          'source': {
            'type': 'geojson',
            'data': data
          },
          'paint': {
            'circle-radius': 5,
            'circle-color': "#5154CC"
          }
        });

        // Populate dropdown menus
        var nameOptions = [];
        var artistOptions = [];
        data.features.forEach(function(feature) {
          nameOptions.push(feature.properties.Name);
          artistOptions.push(feature.properties.Artist);
        });

        var uniqueNameOptions = [...new Set(nameOptions)];
        var uniqueArtistOptions = [...new Set(artistOptions)];

        var nameSelect = document.getElementById('nameSelect');
        var artistSelect = document.getElementById('artistSelect');

        uniqueNameOptions.forEach(function(name) {
          var option = document.createElement('option');
          option.text = name;
          nameSelect.add(option);
        });

        uniqueArtistOptions.forEach(function(artist) {
          var option = document.createElement('option');
          option.text = artist;
          artistSelect.add(option);
        });

        // Event handlers for dropdown menus
        nameSelect.addEventListener('change', function() {
          var selectedName = this.value;
          filterMap('Name', selectedName);
        });

        artistSelect.addEventListener('change', function() {
          var selectedArtist = this.value;
          filterMap('Artist', selectedArtist);
        });

        function filterMap(attribute, value) {
          map.setFilter('csvData', ['==', attribute, value]);
        }

        // configure map interactions 
        map.on('click', 'csvData', function(e) {
          var properties = e.features[0].properties;
          var sidebarContent = '<div class="sidebar-content">';
          sidebarContent += '<h3>' + properties.Name + '</h3>';
          sidebarContent += '<img src="' + properties.Media + '" style="max-width:80%;height:auto">';
          sidebarContent += '<p><strong>Artist:</strong> ' + properties.Artist + '</p>';
          sidebarContent += '<p><strong>Year:</strong> ' + properties.Year + '</p>';
          sidebarContent += '</div>';
          document.getElementById('sidebar').innerHTML = sidebarContent;
        });

        map.on('mouseenter', 'csvData', function() {
          map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'csvData', function() {
          map.getCanvas().style.cursor = '';
        });
      });
    });
  };
});
