jade = ./node_modules/jade/bin/jade.js
topojson = ./node_modules/topojson/bin/topojson

all: app/index.html

cleanmap:
	# rm data/hongkong-land.topojson data/hongkong-admin.topojson data/hongkong-admin.geojson data/hongkong-land.geojson
	rm data/hongkong-land.topojson data/hongkong-admin.topojson

# data: data/hongkong-land.topojson data/hongkong-admin.topojson parknshop.geojson
map: data/hongkong-land.topojson data/hongkong-admin.topojson

data: data/parknshop.topojson data/wellcome.topojson

# App

app/index.html: app/index.jade
	$(jade) < $< > $@ --pretty

# Maps

data/hongkong-admin.geojson:
	mkdir -p data
	curl --include --request GET "https://raw.githubusercontent.com/2blam/HK-geojson/master/polygon.json" > $@

data/hongkong-admin.topojson: data/hongkong-admin.geojson
	$(topojson) $< -p name=ENAME -p code=CACODE -s 1e-12 -q 1e7 -o $@

# data/hongkong-land.geojson:
# 	mkdir -p data
# 	curl http://echarts.baidu.com/doc/example/geoJson/HK_geo.json > $@

# data/hongkong-land.topojson: data/hongkong-land.geojson
# 	$(topojson) $< -p name -s 1e-12 -q 1e7 -o $@

data/hongkong-coastline.geojson:
	curl http://osm-extracted-metros.s3.amazonaws.com/hong-kong.coastline.zip > data/coastline.zip
	unzip data/coastline.zip -d data/coastline
	ogr2ogr -f GeoJSON $@ data/coastline/hong-kong.shp -s_srs EPSG:3857 -t_srs EPSG:4326
	rm data/coastline.zip
	rm -rf data/coastline

data/hongkong-coastline.topojson: data/hongkong-coastline.geojson
	$(topojson) $< -s 1e-12 -q 1e7 -o $@


# LatLong Data

data/parknshop-raw.json:
	curl https://www.kimonolabs.com/api/2v41nzhc?apikey=32zL6ZvMbT0GcgwScxK2DRimiQng0lPH > $@

data/parknshop.json: data/parknshop-raw.json
	./get-latlong.js --name parknshop $< -o $@ -v

data/parknshop.geojson: data/parknshop.json
	./latlng-to-geojson.js $< -o $@ -v

data/parknshop.topojson: data/parknshop.geojson
	$(topojson) $< -p name -p address -o $@

data/wellcome-raw.json:
	# TODO api is not working
	curl "https://www.kimonolabs.com/api/1xldkfso?apikey=32zL6ZvMbT0GcgwScxK2DRimiQng0lPH" > $@

data/wellcome.json: data/wellcome-raw.json
	./get-latlong.js --name wellcome $< -o $@ -v

data/wellcome.geojson: data/wellcome.json
	./latlng-to-geojson.js $< -o $@ -v

data/pacificcoffee-raw.json:
	curl "https://www.kimonolabs.com/api/4bydg8ay?apikey=32zL6ZvMbT0GcgwScxK2DRimiQng0lPH" > $@

data/pacificcoffee.json: data/pacificcoffee-raw.json
	./get-latlong.js --name pacificcoffee $< -o $@ -v

data/pacificcoffee.geojson: data/pacificcoffee.json
	./latlng-to-geojson.js $< -o $@ -v

data/pacificcoffee.topojson: data/pacificcoffee.geojson
	$(topojson) $< -p name -p address -o $@

.PHONY: all data cleanmap
