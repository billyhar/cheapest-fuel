const functions = require('firebase-functions');
const axios = require('axios');
const cors = require('cors')({ origin: true });

const FUEL_PROVIDERS = [
  {
    url: 'https://applegreenstores.com/fuel-prices/data.json',
    name: 'Applegreen'
  },
  {
    url: 'https://fuelprices.asconagroup.co.uk/newfuel.json',
    name: 'Ascona'
  },
  {
    url: 'https://storelocator.asda.com/fuel_prices_data.json',
    name: 'Asda'
  },
  {
    url: 'https://www.bp.com/en_gb/united-kingdom/home/fuelprices/fuel_prices_data.json',
    name: 'BP'
  },
  {
    url: 'https://fuelprices.esso.co.uk/latestdata.json',
    name: 'Esso'
  },
  {
    url: 'https://jetlocal.co.uk/fuel_prices_data.json',
    name: 'JET'
  },
  {
    url: 'https://api2.krlmedia.com/integration/live_price/krl',
    name: 'Karan Retail'
  },
  {
    url: 'https://www.morrisons.com/fuel-prices/fuel.json',
    name: 'Morrisons'
  },
  {
    url: 'https://moto-way.com/fuel-price/fuel_prices.json',
    name: 'Moto'
  },
  {
    url: 'https://fuel.motorfuelgroup.com/fuel_prices_data.json',
    name: 'MFG'
  },
  {
    url: 'https://www.rontec-servicestations.co.uk/fuel-prices/data/fuel_prices_data.json',
    name: 'Rontec'
  },
  {
    url: 'https://api.sainsburys.co.uk/v1/exports/latest/fuel_prices_data.json',
    name: 'Sainsburys'
  },
  {
    url: 'https://www.sgnretail.uk/files/data/SGN_daily_fuel_prices.json',
    name: 'SGN'
  },
  {
    url: 'https://www.tesco.com/fuel_prices/fuel_prices_data.json',
    name: 'Tesco'
  }
];

exports.getFuelPrices = functions.https.onRequest((request, response) => {
  cors(request, response, async () => {
    try {
      const results = await Promise.allSettled(
        FUEL_PROVIDERS.map(async ({ url, name }) => {
          try {
            const response = await axios.get(url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json'
              },
              timeout: 5000
            });
            return { data: response.data, brand: name };
          } catch (error) {
            console.warn(`Failed to fetch ${name} data:`, error.message);
            return null;
          }
        })
      );

      const validResults = results
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => result.value);

      response.json(validResults);
    } catch (error) {
      console.error('Error fetching fuel prices:', error);
      response.status(500).json({ error: 'Failed to fetch fuel prices' });
    }
  });
});
