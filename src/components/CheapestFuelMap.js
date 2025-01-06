import React, { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import greenPin from '../assets/green-pin.png';
import orangePin from '../assets/orange-pin.png';
import redPin from '../assets/red-pin.png';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1IjoiYmlsbHloYXIiLCJhIjoiY2xtYXYxNmNkMHF2ZjN0dGZ6YnkzNzhtbyJ9.SPdcRGv5kt8708yiHXtHNw';

const Map = ({ fuelStations, formatDate }) => {
  const getPinColor = (station) => {
    const e5Price = parseFloat(station.prices.E5);
    if (e5Price < 140) return 'green-pin';
    if (e5Price < 160) return 'orange-pin';
    return 'red-pin';
  };

  useEffect(() => {
    if (fuelStations.length === 0) return;

    const mapInstance = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-0.1276, 51.5072],
      zoom: 10,
    });

    mapInstance.addControl(new mapboxgl.NavigationControl());

    mapInstance.on('load', () => {
      const loadImage = (url, id) => {
        return new Promise((resolve, reject) => {
          mapInstance.loadImage(url, (error, image) => {
            if (error) {
              console.error(`Error loading image ${id}:`, error);
              reject(error);
            }
            mapInstance.addImage(id, image);
            resolve();
          });
        });
      };

      Promise.all([
        loadImage(greenPin, 'green-pin'),
        loadImage(orangePin, 'orange-pin'),
        loadImage(redPin, 'red-pin'),
      ])
        .then(() => {
          const geojson = {
            type: 'FeatureCollection',
            features: fuelStations.map((station) => ({
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [parseFloat(station.location.longitude), parseFloat(station.location.latitude)],
              },
              properties: {
                ...station,
                e5Price: station.prices.E5,
                e10Price: station.prices.E10,
                b7Price: station.prices.B7,
                sdvPrice: station.prices.SDV,
                pinColor: getPinColor(station),
              },
            })),
          };

          mapInstance.addSource('fuel-stations', {
            type: 'geojson',
            data: geojson,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50,
          });

          // Add layers (clusters, cluster count, and points)
          mapInstance.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'fuel-stations',
            filter: ['has', 'point_count'],
            paint: {
              'circle-color': [
                'step',
                ['get', 'point_count'],
                '#4d8eff',
                100,
                '#7dacff',
                750,
                '#adcbff',
              ],
              'circle-radius': [
                'step',
                ['get', 'point_count'],
                20,
                100,
                30,
                750,
                40,
              ],
            },
          });

          mapInstance.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'fuel-stations',
            filter: ['has', 'point_count'],
            layout: {
              'text-field': '{point_count_abbreviated}',
              'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
              'text-size': 12,
            },
          });

          mapInstance.addLayer({
            id: 'unclustered-point',
            type: 'symbol',
            source: 'fuel-stations',
            filter: ['!', ['has', 'point_count']],
            layout: {
              'icon-image': ['get', 'pinColor'],
              'icon-size': 1,
              'icon-allow-overlap': true,
            },
          });

          // Add click handlers and popups
          mapInstance.on('click', 'unclustered-point', (e) => {
            const coordinates = e.features[0].geometry.coordinates.slice();
            const properties = e.features[0].properties;

            while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
              coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
            }

            const formatPrice = (price) => {
              if (price === null || price === undefined) return 'N/A';
              if (typeof price === 'number') return `£${price.toFixed(2)}`;
              if (typeof price === 'string') {
                const numPrice = parseFloat(price);
                return isNaN(numPrice) ? 'N/A' : `£${numPrice.toFixed(2)}`;
              }
              return 'N/A';
            };

            const e5Price = formatPrice(properties.e5Price);
            const e10Price = formatPrice(properties.e10Price);
            const b7Price = formatPrice(properties.b7Price);
            const sdvPrice = formatPrice(properties.sdvPrice);

            const lastUpdated = formatDate(properties.last_updated);

            new mapboxgl.Popup()
              .setLngLat(coordinates)
              .setHTML(`
                <h3>${properties.brand || 'Unknown Brand'} - ${properties.address || 'No Address'}</h3>
                <p><strong>E5:</strong> ${e5Price}</p>
                <p><strong>E10:</strong> ${e10Price}</p>
                <p><strong>B7:</strong> ${b7Price}</p>
                ${sdvPrice !== 'N/A' ? `<p><strong>SDV:</strong> ${sdvPrice}</p>` : ''}
                <p><strong>Last Updated:</strong> ${lastUpdated}</p>
              `)
              .addTo(mapInstance);
          });

          // Add hover effects
          mapInstance.on('mouseenter', 'clusters', () => {
            mapInstance.getCanvas().style.cursor = 'pointer';
          });
          mapInstance.on('mouseleave', 'clusters', () => {
            mapInstance.getCanvas().style.cursor = '';
          });
          mapInstance.on('mouseenter', 'unclustered-point', () => {
            mapInstance.getCanvas().style.cursor = 'pointer';
          });
          mapInstance.on('mouseleave', 'unclustered-point', () => {
            mapInstance.getCanvas().style.cursor = '';
          });
        })
        .catch((error) => console.error('Error loading images:', error));
    });

    return () => mapInstance.remove();
  }, [fuelStations, formatDate]);

  return <div id="map" style={{ width: '100%', height: '100vh' }} />;
};

export default Map;