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

mapboxgl.accessToken = 'pk.eyJ1IjoicHJhdHRzYXZpIiwiYSI6ImNsOGVzYjZ3djAycGYzdm9vam40MG40cXcifQ.YHBszyZW7pMQShx0GZISbw'; 
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
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSHol0hJ1cL5uOKAW18Gj_duEwE9oL2cyxfio3UNmBGp0GYQGtGhoW1T74rlg-xLHYXqjAaHnZSO9Of/pub?gid=0&single=true&output=csv',
    dataType: "text",
    success: function(csvData) {
      makeGeoJSON(csvData);
    },
    error: function(xhr, status, error) {
      console.error("Error fetching CSV:", error);
    }
  });

  function makeGeoJSON(csvData) {
    csv2geojson.csv2geojson(csvData, {
      latfield: 'Latitude',
      lonfield: 'Longitude',
      delimiter: ','
    }, function(err, data) {
      if (err) {
        console.error("Error converting CSV to GeoJSON:", err);
        return;
      }
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
        $('#nameSelect, #artistSelect').on('change', function() {
          var selectedName = $('#nameSelect').val();
          var selectedArtist = $('#artistSelect').val();
          filterMap(selectedName, selectedArtist);
        });

        function filterMap(selectedName, selectedArtist) {
          var filter = ['all'];
          if (selectedName) filter.push(['==', 'Name', selectedName]);
          if (selectedArtist) filter.push(['==', 'Artist', selectedArtist]);
          map.setFilter('csvData', filter);
        }

        // configure map interactions 
        map.on('click', 'csvData', function(e) {
          var properties = e.features[0].properties;
          var sidebarContent = '<div class="sidebar-content">';
          sidebarContent += '<h3>' + properties.Name + '</h3>';
          sidebarContent += '<img src="' + properties.Media + '" style="max-width:100%;height:auto">';
          sidebarContent += '<p><strong>Artist:</strong> ' + properties.Artist + '</p>';
          sidebarContent += '<p><strong>Year:</strong> ' + properties.Year + '</p>';
          sidebarContent += '</div>';
          $('#sidebar').html(sidebarContent);
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
