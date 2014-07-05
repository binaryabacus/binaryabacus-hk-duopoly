#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2));
var cheerio = require('cheerio');
var _ = require('lodash');
var Promise = require('bluebird');
var limit = require('simple-rate-limiter');
var fs = Promise.promisifyAll(require('fs'));
var request = limit(require('request')).to(5).per(2000);
request = Promise.promisify(request);
var noop = function () {};
var log = argv.v ? console.log.bind(console) : noop;

var inputFile = argv._[0];
var outputFile = argv.output || argv.o;

var start_urls = [
  'http://www.mannings.com.hk/eng/store_nt.html',
  'http://www.mannings.com.hk/eng/store_hk.html',
  'http://www.mannings.com.hk/eng/store_kln.html'
];

Promise.resolve(start_urls).map(function (url) {
  return request(url).then(function (content) {
    return content[1];
  });
}).then(function (area_pages) {
  var district_urls = area_pages.reduce(function (district_urls, page) {
    var $ = cheerio.load(page);

    var hrefs = [].map.call($('#pane1 tr td a'), function (el) {
      var abshref = 'http://www.mannings.com.hk/eng/' + $(el).attr('href');
      // log(abshref);
      return abshref;
    });

    hrefs = hrefs.filter(function (href) {
      return href !== 'http://www.mannings.com.hk/eng/store_location_list.html';
    });

    return district_urls.concat(hrefs);

  }, []);

  district_urls.push('http://www.mannings.com.hk/eng/store_list/store_ild.html');

  log(district_urls);
  return district_urls;
}).map(function (url) {
  return request(url).then(function (content) {
    return content[1];
  });
}).then(function (directory_pages) {
  var shops = directory_pages.map(function (page) {
    var $ = cheerio.load(page);
    var names = [].map.call($('#pane1 > span > table > tr > td:nth-child(3)'), function (el) {
      var text = $(el).text();
      log(text);
      return toTitleCase(text);
    });
    var addresses = [].map.call($('#pane1 > span > table > tr > td:nth-child(5)'), function (el) {
      var text = $(el).html();
      return cleanLineBreak(text);
    });

    // log(names);
    // log(addresses);

    var shops = _.zip(names, addresses);

    return shops.map(function (shop) {
      return {
        name: shop[0],
        address: shop[1]
      };
    });
  });

  shops = _.flatten(shops);

  shops = shops.filter(function (shop) {
    return shop.name && shop.address;
  });

  var json = {
    name: 'mannings',
    results: {
      mannings: shops
    }
  };

  return fs.writeFileAsync(outputFile, JSON.stringify(json, null, 2));
});

function cleanLineBreak (str) {
  return str && str.replace(/<br>/g, ', ').replace('\r\n', '');
}

function toTitleCase (str) {
  return str && str.split(' ').map(function (s) {
    return s && (s[0].toUpperCase() + s.slice(1).toLowerCase());
  }).join(' ');
}
