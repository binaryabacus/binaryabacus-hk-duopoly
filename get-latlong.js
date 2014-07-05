#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2));
var Promise = require('bluebird');
var limit = require('simple-rate-limiter');
var fs = Promise.promisifyAll(require('fs'));
var request = limit(require('request')).to(5).per(2000);
request = Promise.promisify(request);
var noop = function () {};
var log = argv.v ? console.log.bind(console) : noop;

var inputFile = argv._[0];
var name = argv.name || argv.n;
var outputFile = argv.output || argv.o;
var prefix = 'https://maps.googleapis.com/maps/api/geocode/json';

fs.readFileAsync(inputFile, { encoding: 'utf8' }).then(function (content) {
  var json = JSON.parse(content);
  var shops = json.results[argv.name];

  // Filter out non-HK address
  shops = shops.filter(function (shop) {
    return [
      /macau/i,
      /baoding/i,
      /beijing/i,
      /changsha/i,
      /chengdu/i,
      /chongqing/i,
      /chonqqing/i,
      /dalian/i,
      /foshan/i,
      /fuzhou/i,
      /guangzhou/i,
      /hefei/i,
      /mianyang/i,
      /nanchang/i,
      /nanjing/i,
      /nanning/i,
      /shanghai/i,
      /shenyang/i,
      /shenzhen/i,
      /suzhou/i,
      /kunshan/i,
      /tianjin/i,
      /qingdao/i,
      /wuhan/i,
      /wuxi/i,
      /xiamen/i,
      /xi'an/i,
      /xi’an/i,
      /xian/i,
      /yantai/i,
      /zhengzhou/i,
      /zhongshan/i,
      /zhuhai/i,
      /zhuzhou/i,
      /malaysia/i,
      /melaka/i,
      /selangor/i,
      /singapore/i,
      /cyprus/i,
      /shangha/i,
      /travessa dos anjos/i,
    ].every(function (regex) {
      return !shop.address.match(regex);
    });
  });

  // shops = [ { address: 'Units 1029 - 1043, 1/F, United Centre 95 Queensway, Hong Kong' } ];

  shops = shops.map(function (shop) {
    var address = shop.address;
    var parts = address.split(',');
    parts = parts.map(function (part) {
      part = part.replace(/^\s*/g, '');
      part = part.replace(/\s*$/g, '');
      part = part.replace(/\./g, '');
      return part;
    });
    address = parts.join(',');

    // Strip out trailing district
    address = address.replace(/,NT$/ig, '');
    address = address.replace(/,N.T.$/ig, '');
    address = address.replace(/,New Territories$/ig, '');
    address = address.replace(/,HK$/ig, '');
    address = address.replace(/,Hong Kong$/ig, '');
    address = address.replace(/,Kowloon$/ig, '');
    address = address.replace(/,KLN$/ig, '');
    address = address.replace(/,Lantau Island$/ig, '');
    // address = address.replace(/Basement And Ground Floor,*/ig, '');
    // address = address.replace(/Basement,*/ig, '');

    // Remove Shop ..., Shop No. 210, 211, 224-227, 41 & 43, 2B-1C
    // address = address.replace(/Shop[^ping][\s\w\.]*,*[ABCDEF\d,-\s&and]*/ig, '');

    // Remove G/F & 1/F, 5 - 6/F, LG/F, Lower G/F, B1/F
    // address = address.replace(/[BLowerUpper\d-\sG\d]*\/Fl*\s*&*/ig, '');

    // Remove Level 7, 2nd Level, MTR Level
    // address = address.replace(/[\w\d\s]*Level[\s\w\d]*/ig, '');

    // Remove Unit
    // address = address.replace(/Unit\s*\d+,\s*/ig, '');

    // Remove L*
    // address = address.replace(/L\d,/ig, '');
    // address = address.replace(/LG,/ig, '');

    parts = address.split(',');

    parts = address.split(',').filter(function (part) {
      var blacklisted = [
        /unit[^ted]/ig,
        /shop[^ping]/ig,
        /kiosk/ig,
        /basement/ig,
        /level/ig,
        /\/f/ig, // Remove 1/F
        /g\d+/ig, // Remove G31 - G32
        /r\d+/ig, // R32 &amp; R33
        /a\d+/ig, // A55-A59&amp;100
        /floor/ig,
        /^block/ig,
        /portion/ig,
        /hall/ig,
        /zone/ig,
        /site \d/ig,
        /test [a-z]/ig
      ].some(function (regex) {
        return part.match(regex);
      });

      var whitelisted = [
        /street/ig,
        /road/ig,
        /plaza/ig,
        /building/ig,
        /mansion/ig
      ].some(function (regex) {
        return part.match(regex);
      });

      var alphabetLength = (part.match(/[a-z]/ig) || []).length;
      return (whitelisted || !blacklisted) && alphabetLength >= 3 && part.length;
    });

    address = parts.join(', ');

    shop.address = address;
    return shop;
  });

  shops = shops.filter(function (shop) {
    return shop.address.length;
  });

  shops = shops.map(function (shop) {
    shop.address += ', Hong Kong';
    return shop;
  });

  return Promise.resolve(shops).map(function (shop) {
    var address = shop.address;
    return getLatLng(address).then(function (latlng) {
      shop.lat = latlng.lat;
      shop.lng = latlng.lng;
      return shop;
    }, function (err) {
      shop.lat = null;
      shop.lng = null;
      return shop;
    });
  });
}).then(function (shops) {
  log('all done', shops.length);

  shops = shops.filter(function (shop) {
    // 22.396428, 114.109497 is what GMaps returns when it can't find
    // anything except Hong Kong
    return shop.lat && shop.lng && shop.lat !== 22.396428 && shop.lng !== 114.109497;
  });
  log('shops without latlng', shops.length);

  return fs.writeFileAsync(outputFile, JSON.stringify(shops, null, 2));
});

function getLatLng (address) {
  log(address);

  if (!address || address.split(',').length < 2) {
    return Promise.reject('empty address');
  }

  return request({
    url: prefix,
    qs: { address: address },
    json: true,
    pool: { maxSockets: 1 }
  }).then(function (content) {
    var status = content[1].status;
    var json = content[1].results[0];

    if (status == 'ZERO_RESULTS') {
      log('no result found');
      // Try again with less specific address. The API sometimes can't
      // find the latlng if the address has shop number or floor number
      // return getLatLng(address.split(',').slice(1).join(','));
      throw new Error('cannot find result');
    }

    if (status !== 'OK') {
      log('api error');
      throw new Error('API error');
    }

    var latlng = json.geometry.location;
    log(address, latlng);
    return latlng;
  });
}
