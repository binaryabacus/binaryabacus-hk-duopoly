#!/usr/bin/env node

var _ = require('lodash');
var argv = require('minimist')(process.argv.slice(2));
var Promise = require('bluebird');
var limit = require('simple-rate-limiter');
var fs = Promise.promisifyAll(require('fs'));
var request = limit(require('request')).to(5).per(2000);
request = Promise.promisify(request);
var noop = function () {};
var log = argv.v ? console.log.bind(console) : noop;
var lngDetector = new (require('languagedetect'));

var outputFile = argv.output || argv.o;
// https://openapi.starbucks.com/v1/stores/nearby?
//   callback=jQuery172004991061659529805_1404536051908
//   &radius=50&limit=50
//   &latLng=22.396428%2C114.10949700000003
//   &ignore=storeNumber%2CownershipTypeCode%2CtimeZoneInfo%2CextendedHours%2ChoursNext7Days
//   &brandCodes=SBUX
//   &access_token=hay5xcumsbvynygkeqdq3dem
// https://openapi.starbucks.com/v1/stores/nearby?callback=jQuery172004991061659529805_1404536051908&radius=50&limit=50&latLng=22.396428%2C114.10949700000003&ignore=storeNumber%2CownershipTypeCode%2CtimeZoneInfo%2CextendedHours%2ChoursNext7Days&brandCodes=SBUX&access_token=hay5xcumsbvynygkeqdq3dem&_=1404536074835
var prefix = 'https://openapi.starbucks.com/v1/stores/nearby';

var hk_bound = [
  [22.581591, 114.430553],
  [22.140900, 113.766516]
];

var latlngs = [];
var ticks = 10;
var lat_tick = (hk_bound[0][0] - hk_bound[1][0]) / ticks;
var lng_tick = (hk_bound[0][1] - hk_bound[1][1]) / ticks;

for (var i = 0; i < ticks; i++) {
  for (var j = 0; j < ticks; j++) {
    latlngs.push([
      (hk_bound[1][0] + lat_tick * i).toFixed(10),
      (hk_bound[1][1] + lng_tick * j).toFixed(10)
    ]);
  }
}

Promise.resolve(latlngs).map(function (latlng) {
  return request({
    url: prefix,
    qs: {
      callback: 'callback',
      radius: 25,
      limit: 50,
      latLng: latlng.join(','),
      ignore: 'storeNumber,ownershipTypeCode,timeZoneInfo,extendedHours,hoursNext7Days',
      brandCodes: 'SBUX',
      access_token: 'su5xagh2w97ftfa6vfvby7pt' // Token taken from starbucks hk
    },
    pool: { maxSockets: 1 }
  }).then(function (content) {
    log(latlng);
    content = content[1].replace(/callback\((.*)\)/, '$1');
    var json = JSON.parse(content);
    return json;
  });
}).then(function (results) {
  log('done');
  var stores = results.reduce(function (stores, result) {
    return stores.concat(result.stores);
  }, []);

  stores = stores.map(function (store) {
    store = store.store;
    return {
      store_id: store.id,
      name: store.name,
      address: [store.address.streetAddressLine1, store.address.streetAddressLine2, store.address.streetAddressLine3].join(', '),
      lat: store.coordinates.latitude,
      lng: store.coordinates.longitude
    }
  });

  log('extracted stores', stores.length);

  stores = stores.filter(function (store) {
    return store.name.match(/[a-z]/i);
  });
  log('remove mainland', stores.length);

  stores = _.uniq(stores, function (store) {
    return store.store_id;
  });
  log('removed duplicates', stores.length);

  return fs.writeFileAsync(outputFile, JSON.stringify(stores, null, 2))
});
