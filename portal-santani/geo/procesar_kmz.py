"""Convierte santani.kmz + datos OSM en public/geo/proyecto.json.

Todas las coordenadas salen en metros Web Mercator (EPSG:3857) relativos al
centroide del perímetro, para que el video posicione imágenes y trazos en un
único sistema. No se modifica ni simplifica ninguna geometría del KMZ.
"""
import json, math, zipfile, xml.etree.ElementTree as ET
from pathlib import Path
from shapely.geometry import LineString, Point
from shapely.ops import polygonize, unary_union

BASE = Path(__file__).resolve().parent.parent
NS = {'k': 'http://www.opengis.net/kml/2.2'}
R = 6378137


def merc(lon, lat):
    return (R * math.radians(lon), R * math.log(math.tan(math.pi / 4 + math.radians(lat) / 2)))


kml = zipfile.ZipFile(BASE / 'geo/santani.kmz').read('doc.kml')
root = ET.fromstring(kml)
capas = {}
for folder in root.iter('{http://www.opengis.net/kml/2.2}Folder'):
    nombre = folder.find('k:name', NS).text
    if nombre == 'Line':
        continue
    capas[nombre] = [
        [tuple(map(float, c.split(',')[:2])) for c in pm.find('.//k:coordinates', NS).text.split()]
        for pm in folder.iter('{http://www.opengis.net/kml/2.2}Placemark')
    ]

perim = list(polygonize(unary_union([LineString([merc(*p) for p in s]) for s in capas['POLIGONO']])))[0]
cx, cy = perim.centroid.x, perim.centroid.y
rel = lambda x, y: [round(x - cx, 2), round(cy - y, 2)]  # y hacia abajo (pantalla)
seg = lambda s: [rel(*merc(*p)) for p in s]

# Manzanas = celdas cerradas por las líneas de CALLE dentro del perímetro
# Celdas de lote (solo para resaltar UN lote en la demo del Tour; no se numeran ni cuentan)
todo = unary_union([LineString([merc(*p) for p in s]) for k in capas for s in capas[k]])
celdas = [c for c in polygonize(todo) if 300 < c.area < 450]

osm = json.load(open(BASE / 'geo/osm_ruta3_poi.json'))
ruta3 = [[rel(*merc(q['lon'], q['lat'])) for q in e['geometry']] for e in osm['elements'] if e['type'] == 'way']
poi = {}
for e in osm['elements']:
    if e['type'] != 'node':
        continue
    t = e['tags']
    if t.get('name') == 'San Estanislao':
        poi['centro'] = rel(*merc(e['lon'], e['lat']))
    if t.get('name') == "Ka'avo" and not t.get('shop'):
        poi['kaavo'] = rel(*merc(e['lon'], e['lat']))

# Celda de lote usada en la demo del Tour: la más cercana al centro del proyecto
demo = min(celdas, key=lambda c: c.centroid.distance(perim.centroid))

out = {
    'origen3857': [cx, cy],
    'nota': 'Metros Web Mercator relativos al centroide del perímetro; y positivo hacia el sur.',
    'perimetro': [rel(x, y) for x, y in perim.exterior.coords],
    'calles': [seg(s) for s in capas['CALLE']],
    'lotes': [seg(s) for s in capas['LOTES']],
    'celdasLote': [[rel(x, y) for x, y in c.exterior.coords] for c in celdas],
    'loteDemo': [rel(x, y) for x, y in demo.exterior.coords],
    'ruta3': ruta3,
    'poi': poi,
    'resumen': {
        'segmentosCalle': len(capas['CALLE']),
        'segmentosLote': len(capas['LOTES']),
    },
}
dest = BASE / 'public/geo/proyecto.json'
dest.parent.mkdir(parents=True, exist_ok=True)
json.dump(out, open(dest, 'w'))
print(json.dumps(out['resumen']), 'poi', out['poi'], 'celdas', len(celdas))
