#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2));
var Promise = require('bluebird');
var parseGeoJson = Promise.promisify(require('geojson').parse);
var fs = Promise.promisifyAll(require('fs'));

var inputFile = process.argv[2];
var outputFile = argv.output || argv.o;

fs.readFileAsync(inputFile, { encoding: 'utf8' })
.then(function (content) {
  var data = JSON.parse(content);
  return parseGeoJson(data, {Point: ['lat', 'lng']});
})
.catch(function (geojson) {
  // Geojson returns geojson as first param ...
  return fs.writeFileAsync(outputFile, JSON.stringify(geojson, null, 2))
});
