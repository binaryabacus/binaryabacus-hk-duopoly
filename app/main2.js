var color = d3.scale.category10();

var transform = d3.geo.transform({
  point: function projectPoint(x, y) {
    var point = map.latLngToLayerPoint(new L.LatLng(y, x));
    this.stream.point(point.x, point.y);
  }
});

var projection = function (coor) {
  var point = map.latLngToLayerPoint(new L.LatLng(coor[1], coor[0]));
  return [point.x, point.y];
}

var path = d3.geo.path().projection(transform);

var map = L.map('leaflet')
  .setView([22.35, 114.13], 11)
  .addLayer(new L.TileLayer('http://{s}.tiles.mapbox.com/v3/felixlaumon.im90hil1/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18
  }))
  .setMaxBounds([[22.736, 113.715], [22.094, 114.505]]);
map._initPathRoot();

var svg = d3.select('#leaflet svg')
var g = svg.append('g');

var tip = d3.tip().html(function(d) {
  return '<div>' +
    '<p><span class="shop-type">' + d.id + '</span> - <span class="shop-name">' + d.data.name + '</span></p>' +
    '<p><span class="shop-address">' + d.data.address + '</span></p>' +
    '</div>'
});
svg.call(tip);

var coastlineClip = svg.append('clipPath')
  .attr('id', 'coastline')
  .append('path');

$.when(
  $.getJSON('/data/hongkong-admin.topojson'),
  $.getJSON('/data/hongkong-coastline.topojson'),
  $.getJSON('/data/parknshop.geojson'),
  $.getJSON('/data/wellcome.geojson')
).then(function (hkdistrict, hkcoastline, parknshop, wellcome) {
  parknshop = parknshop[0];
  wellcome = wellcome[0];
  hkdistrict = hkdistrict[0];
  hkcoastline = hkcoastline[0];

  topojson.presimplify(hkdistrict);

  var district = topojson.feature(hkdistrict, hkdistrict.objects['hongkong-admin']).features;
  var coastline = topojson.feature(hkcoastline, hkcoastline.objects['hongkong-coastline']);

  function update () {
    var parknshop_points = parknshop.features.map(function (d) {
      return {
        coor: projection(d.geometry.coordinates),
        data: d.properties,
        id: 'Parknshop',
        color: '#333c91'
      };
    });

    var wellcome_points = wellcome.features.map(function (d) {
      return {
        coor: projection(d.geometry.coordinates),
        data: d.properties,
        id: 'Wellcome',
        color: '#c9213a'
      };
    });

    var points = [].concat(parknshop_points).concat(wellcome_points);

    var voronoi = d3.geom.voronoi()
      // .clipExtent([[0, 0], [width, height]])
      .x(function (d) { return d.coor[0]; })
      .y(function (d) { return d.coor[1]; })
    (points);

    points.forEach(function (d, i) {
      d.voronoi = voronoi[i];
    });

    d3.select('#coastline path')
      .datum(coastline)
        .attr('d', path);

    g.attr('clip-path', 'url(#coastline)');

    g.selectAll('path.hk').data(district)
        .attr('d', path)
      .enter().append('path')
        .attr('d', path)
        .attr('class', 'district')
        // .attr('clip-path', 'url(#coastline)')
        // .style('fill', function (d) { return color(d.properties.name); })
        .style('fill', 'none')

    g.selectAll('path.voronoi').data(points)
        .attr('d', function(d, i) { return d && d.voronoi && 'M' + d.voronoi.join('L') + 'Z'} )
      .enter().append('path')
        .attr('d', function(d, i) { return d && d.voronoi && 'M' + d.voronoi.join('L') + 'Z'} )
        .style('fill', function (d) { return d.color; })
        .style('opacity', 0.75)
        .attr('title', function (d) { return d.data.name })
        .attr('class', 'voronoi')
        // .on('click', clicked)
        .on('mouseover', tip.show)
        .on('mousemove', tip.show)
        .on('mouseout', tip.hide)

    g.selectAll('circle').data(points)
        .attr('cx', function (d) { return d.coor[0]; })
        .attr('cy', function (d) { return d.coor[1]; })
      .enter().append('circle')
        .attr('r', '1')
        .attr('cx', function (d) { return d.coor[0]; })
        .attr('cy', function (d) { return d.coor[1]; });
  }

  function reset () {
    map.setView([22.35, 114.13], 11);
  }

  var map_opacity_scale = d3.scale.linear().domain([11, 18]).range([0.1, 0.9]);
  var voronoi_opacity_scale = d3.scale.linear().domain([11, 18]).range([0.75, 0.4]);

  function viewreset () {
    d3.select('#leaflet .leaflet-layer')
      .style('opacity', map_opacity_scale(map.getZoom()));
    g.selectAll('path.voronoi')
      .style('opacity', voronoi_opacity_scale(map.getZoom()));
    update();
  }

  viewreset();
  map.on('viewreset', viewreset);
});

function findBoundary (vertices) {
  var maxX = -Infinity;
  var maxY = -Infinity;
  var minX = Infinity;
  var minY = Infinity;

  vertices.forEach(function (vertex) {
    if (vertex[0] > maxX) maxX = vertex[0];
    if (vertex[1] > maxY) maxY = vertex[1];
    if (vertex[0] < minX) minX = vertex[0];
    if (vertex[1] < minY) minY = vertex[1];
  });

  return [ [minX, minY], [maxX, maxY] ];
}
