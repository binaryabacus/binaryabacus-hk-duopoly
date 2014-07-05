var width = 600,
    height = 600;

var styler = [
  {
    'stylers': [
      { 'saturation': -100 },
      { 'lightness': 3 }
    ]
  },{
    'featureType': 'road.highway',
    'stylers': [
      { 'visibility': 'off' }
    ]
  },{
    'elementType': 'labels',
    'stylers': [
      { 'visibility': 'off' }
    ]
  },{
    'featureType': 'road',
    'stylers': [
      { 'visibility': 'simplified' },
      { 'lightness': 57 }
    ]
  },{
  }
];

var styledMap = new google.maps.StyledMapType(styler, { name: 'Styled Map' });

var map = new google.maps.Map(d3.select('#map').node(), {
  zoom: 11,
  center: new google.maps.LatLng(22.35, 114.13),
  mapTypeId: google.maps.MapTypeId.TERRAIN
});

map.mapTypes.set('map_style', styledMap);
map.setMapTypeId('map_style');

$.when(
  $.getJSON('/data/hongkong.topojson'),
  $.getJSON('/data/parknshop.geojson')
).then(function (hk, parknshop) {
  parknshop = parknshop[0];
  hk = hk[0];
  var overlay = new google.maps.OverlayView();

  overlay.onAdd = function () {
    var layer = d3.select(this.getPanes().overlayLayer)
      .append('div')
        .attr('class', 'svgoverlay');
    var svg = layer.append('svg');
    var group = svg.append('g');

    var clipPath = svg.append('clipPath')
      .attr('id', 'hongkong-clip');
    clipPath.append('path')
      .attr('class', 'hongkong');

    overlay.draw = function () {
      var markerOverlay = this;
      var overlayProjection = markerOverlay.getProjection();

      var googleMapProjection = function (coordinates) {
        var googleCoordinates = new google.maps.LatLng(coordinates[1], coordinates[0]);
        var pixelCoordinates = overlayProjection.fromLatLngToDivPixel(googleCoordinates);
        return [pixelCoordinates.x + 4000, pixelCoordinates.y + 4000];
      };

      var hongkong = topojson.feature(hk, hk.objects.hongkong);
      var hkpath = d3.geo.path()
        .projection(googleMapProjection);

      svg.select('path.hongkong')
        .datum(hongkong)
          .attr('d', hkpath)
          .attr('opacity', 0.5);

      var points = parknshop.features.map(function (d) {
        return googleMapProjection(d.geometry.coordinates);
      });

      var polygons = d3.geom.voronoi(points);

      group.selectAll('path.voronoi')
        .data(polygons)
          .attr('d', function(d, i) { return d && 'M' + d.join('L') + 'Z'} )
          .attr('stroke', 'red')
          .attr('fill', 'none')
          .attr('class', 'voronoi')
          .attr('clip-path', 'url(#hongkong-clip)')
        .enter().append('path')
          .attr('d', function(d, i) { return d && 'M' + d.join('L') + 'Z'} )
          .attr('stroke', 'red')
          .attr('fill', 'none')
          .attr('class', 'voronoi')
          .attr('clip-path', 'url(#hongkong-clip)');

      group.selectAll('circle')
        .data(points)
          .attr('r', 2)
          .attr('cx', function (d) { return d[0]; })
          .attr('cy', function (d) { return d[1]; })
        .enter().append('circle')
          .attr('r', 2)
          .attr('cx', function (d) { return d[0]; })
          .attr('cy', function (d) { return d[1]; })
    };
  };

  overlay.setMap(map);
});

d3.json('/data/parknshop.geojson', function (err, data) {
  
});
