# hk-oligopoly

- google place API to get location of chain store?
- voronoi diagram clip by hong kong topojson

## analysis
- https://www.jasondavies.com/maps/voronoi/us-capitals/
- focus on duopoly

## todos

### features
- mannings vs watsons
- 711 vs ok
- fortress vs broadway?
- kfc vs mcdonalds?
- chinese fast food restaurant?
- animate between parknshop + wellcome and normal district
  - transition between sets of points
  - for each point from new set, find closest points from old set
  - http://bl.ocks.org/mbostock/3081153

### bugs
- some latlng is not still accurate (e.g. no parknshop in sai kung)
- clicked fired even when moved
- voronoi path needs to be clipped by the outline of district.shp
- click to zoom doesn't work after color-filled in voronoi

### good-to-have
- graph coloring so that district color won't collide
  - http://bl.ocks.org/1wheel/5899035

### optimization
- improved zooming behavior
  - http://bl.ocks.org/mbostock/6242308
  - http://bl.ocks.org/mbostock/6301817
  - http://bl.ocks.org/mbostock/6245977 Dynamic Simplification 1
  - http://bl.ocks.org/mbostock/6252418 Dynamic Simplification 2
  - http://bl.ocks.org/mbostock/6287633 Dynamic Simplification 3
  - http://bl.ocks.org/mbostock/7755778 Dynamic Simplification 4
- tweak semantic zooming (radius and stroke width)
  - http://bl.ocks.org/mbostock/3680957

### done
- hong kong land map is low resolution
- process wellcome data
- latlng is not all accurate
- better tooltip (show on cursor instead)
- fade in maps when zoomed in
  - https://www.mapbox.com/blog/election-mapping-usatoday/
  - http://bl.ocks.org/ZJONSSON/2957559
- limit paning area
- make better coastline map
- process pacific coffee and starbucks
  - http://www.pacificcoffee.com/eng/store/fulllist.php
  - http://www.starbucks.com.hk/store-locator/search/location/Hong%20Kong
  - https://opendata.socrata.com/Business/All-Starbucks-Locations-in-the-World/xy4y-c4mk

## data

parknshop: https://www.kimonolabs.com/apis/2v41nzhc

## reference

performance:
- http://bl.ocks.org/syntagmatic/raw/3267951/

font:
- http://techslides.com/d3-maps-with-image-tiles/ (lora)

map basic
- http://bost.ocks.org/mike/map/
- http://bl.ocks.org/mbostock/4657115

zoom
http://bl.ocks.org/mbostock/4699541

voronoi
- http://bl.ocks.org/mbostock/4360892
- http://flowingdata.com/2014/06/24/burger-place-geography/

hk map:
- http://twistedcore.wordpress.com/
- http://electricricecooker.tumblr.com/post/72310574402/finding-shapefiles-for-china-and-hong-kong
- http://www.mapshaper.org/ shapefile viewer
- http://metro.teczno.com/#hong-kong works but has extra island etc
- ogr2ogr -f GeoJSON hong-kong.json hong-kong.shp -s_srs EPSG:3857 -t_srs EPSG:4326

gmaps js api
- https://developers.google.com/maps/documentation/javascript/tutorial

reference
- http://flowingdata.com/2014/06/24/burger-place-geography/
- http://flowingdata.com/2013/10/14/pizza-place-geography/
- http://flowingdata.com/2014/03/18/coffee-place-geography/
- http://flowingdata.com/2013/06/26/grocery-store-geography/
- http://flowingdata.com/2014/05/29/bars-versus-grocery-stores-around-the-world/

latlng scrapping
- http://scrapy.org/
- http://blog.scrapinghub.com/2014/04/01/announcing-portia/
- http://www.kimonolabs.com/load?url=http%3A%2F%2Fwww.kimonolabs.com%2Fwelcome.html
- https://developers.google.com/places/documentation/search
  - http://www.parknshop.com/WebShop/StoreLocatorPage.do
  - http://www.wellcome.com.hk/wd2shop/en/html/corporate/company-profile/store-information.html
  - http://www.mannings.com.hk/eng/store_location.html

data conversion
- https://www.npmjs.org/package/geojson
- http://datatwo.data-hk.com/about
- http://gazetteer.hk/#/
- https://github.com/gazetteerhk/census_explorer
- https://github.com/gazetteerhk/census_explorer/blob/master/scripts/convert_shapefiles.sh
- https://github.com/2blam/HK-geojson
- http://electricricecooker.tumblr.com/post/72310574402/finding-shapefiles-for-china-and-hong-kong (HK$741!?)

## related research

http://www.economist.com/news/international/21599041-countries-where-politically-connected-businessmen-are-most-likely-prosper-planet

