#!/usr/bin/env python3
"""
server/gee_point_value.py
Usage: python3 gee_point_value.py <lat> <lon>
Returns JSON with TEMPO point values (or {}).
Requires Earth Engine Python API and authentication:
  pip install earthengine-api
  earthengine authenticate
"""
import sys, json, traceback
try:
    import ee
except Exception as e:
    print(json.dumps({"error": f"earthengine not installed: {str(e)}"}))
    sys.exit(0)

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error":"missing args"}))
        return
    lat = float(sys.argv[1])
    lon = float(sys.argv[2])
    try:
        ee.Initialize()  # assumes you authenticated in advance
    except Exception as e:
        print(json.dumps({"error": f"ee initialize failed: {str(e)}"}))
        return

    try:
        # Choose reasonable date window (adjust as needed)
        # Use the latest available image in the collection
        col = ee.ImageCollection('NASA/TEMPO/NO2_L3').sort('system:time_start', False)
        img = ee.Image(col.first())
        pt = ee.Geometry.Point([lon, lat])

        # Request mean reduction around the point, 1km scale
        result = img.reduceRegion(reducer=ee.Reducer.mean(), geometry=pt, scale=1000, maxPixels=1e9).getInfo()

        # Return result JSON (may include 'NO2' or other bands)
        print(json.dumps(result))
    except Exception as e:
        tb = traceback.format_exc()
        print(json.dumps({"error": str(e), "trace": tb}))

if __name__ == '__main__':
    main()
