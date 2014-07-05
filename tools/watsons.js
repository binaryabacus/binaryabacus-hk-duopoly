#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2));
var cheerio = require('cheerio');
var _ = require('lodash');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var sys = require('sys');
var exec = Promise.promisify(require('child_process').exec);
var noop = function () {};
var log = argv.v ? console.log.bind(console) : noop;

var inputFile = argv._[0];
var outputFile = argv.output || argv.o;

var curl_cmd = 'curl -s -L -d "code=en" --cookie nada --referer http://www.watsons.com.hk/home/storeLocator http://www.watsons.com.hk/home/_s/language';

var child = exec(curl_cmd, {
  maxBuffer: 1000 * 1024
}).then(function (stdout, stderr) {
  var content = stdout[0];
  $ = cheerio.load(content, { normalizeWhitespace: true });

  var names = [].map.call($('[id*=storeInfo] .address p:first-child'), function (el) {
    return $(el).text();
  });
  var addresses = [].map.call($('[id*=storeInfo] .address p:nth-child(2)'), function (el) {
    return $(el).text();
  });
  var latlngs = [].map.call($('[id*=storeListItem] + script'), function (el) {
    var latlng = $(el).html().match(/{lat: ([\d\.]*), lng: ([\d\.]*)}/);
    return [latlng[1], latlng[2]];
  });

  var shops = _.zip(names, addresses, latlngs);
  shops = shops.map(function (shop) {
    return {
      name: cleanLeadingTrailingSpaces(shop[0]),
      address: cleanLeadingTrailingSpaces(shop[1]),
      lat: +shop[2][0],
      lng: +shop[2][1]
    }
  });

  // Remove shops from Macau
  shops = shops.filter(function (shop) {
    return ![
      /macau/i,
      /macao/i,
      /taipa/i
    ].some(function (regex) {
      return shop.address.match(regex);
    });
  });

  return fs.writeFileAsync(outputFile, JSON.stringify(shops, null, 2));
});

function cleanLeadingTrailingSpaces (str) {
  return str.replace(/^\s*/, '').replace(/\s*$/, '');
}
