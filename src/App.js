import React, { useEffect, useState } from 'react';
import Map from './components/CheapestFuelMap';

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  
  let date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    const [datePart, timePart] = dateString.split(' ');
    const [day, month, year] = datePart.split('/');
    const [hour, minute, second] = timePart.split(':');
    date = new Date(year, month - 1, day, hour, minute, second);
  }
  
  if (isNaN(date.getTime())) return dateString;
  
  return date.toLocaleString();
};

function App() {
  const [fuelStations, setFuelStations] = useState([]);

  useEffect(() => {
    const fetchFuelPrices = async () => {
      try {
        // Replace with your GitHub Pages URL
        const response = await fetch('https://billyharris.github.io/cheapest-fuel/fuel-prices.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const { data: results, lastUpdated } = await response.json();
        console.log('Last updated:', new Date(lastUpdated).toLocaleString());
        
        const validData = results
          .map(result => processData(result.data, result.brand))
          .flat()
          .filter(station => station && station.latitude && station.longitude);

        if (validData.length === 0) {
          console.warn('No valid fuel station data received');
        } else {
          console.log(`Successfully fetched ${validData.length} stations`);
          setFuelStations(validData);
        }
      } catch (error) {
        console.error('Error fetching fuel prices:', error);
      }
    };

    const processData = (data, brand) => {
      if (!data) return [];

      try {
        // Handle different data structures
        let stations = [];
        
        if (data.stations && Array.isArray(data.stations)) {
          stations = data.stations;
        } else if (Array.isArray(data)) {
          stations = data;
        } else if (data.data && Array.isArray(data.data)) {
          stations = data.data;
        }

        return stations.map(station => ({
          ...station,
          brand: station.brand || brand,
          last_updated: station.last_updated || data.last_updated || new Date().toISOString(),
          latitude: parseFloat(station.latitude) || station.lat || station.Latitude,
          longitude: parseFloat(station.longitude) || station.lng || station.Longitude,
          // Normalize fuel prices
          prices: {
            unleaded: parseFloat(station.unleaded || station.prices?.unleaded || station.UnleadedPrice || 0),
            diesel: parseFloat(station.diesel || station.prices?.diesel || station.DieselPrice || 0),
            premium: parseFloat(station.premium || station.prices?.premium || station.PremiumPrice || 0)
          }
        })).filter(station => 
          !isNaN(station.latitude) && 
          !isNaN(station.longitude) && 
          (station.prices.unleaded > 0 || station.prices.diesel > 0)
        );
      } catch (error) {
        console.error(`Error processing ${brand} data:`, error);
        return [];
      }
    };

    fetchFuelPrices();
    // Refresh data every 30 minutes
    const interval = setInterval(fetchFuelPrices, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return <Map className="container mx-auto p-4" fuelStations={fuelStations} formatDate={formatDate} />;
}

export default App;