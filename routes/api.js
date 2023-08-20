'use strict';
const axios = require('axios');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

module.exports = function (app) {

  const LikedIP = mongoose.model('LikedIP', new mongoose.Schema({
    stock: String,
    hashedIP: String
  }));

  app.route('/api/stock-prices')
    .get(async (req, res) => {
      const stock = req.query.stock
      const like = req.query.like === 'true';
      const apiURL = 'https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/' + stock.toLowerCase() + '/quote';

      try {
        const response = await axios.get(apiURL);
        const responseData = response.data;

        if (like) {
          const ipAddress = req.ip;
          const hashedIP = await bcrypt.hash(ipAddress, 10);
          const storedIPs = await LikedIP.find({ stock: stock.toLowerCase() });
          console.log(storedIPs)
          let ipExists = false;
          for (const ip of storedIPs) {
            ipExists = await bcrypt.compare(ipAddress, ip.hashedIP);
            if (ipExists) {
              break;
            }
          }

          if (!ipExists) {
            try {
              const newLikedIP = new LikedIP({
                stock: stock.toLowerCase(),
                hashedIP: hashedIP
              });
              await newLikedIP.save();
            } catch (error) {
              console.error('Error saving IP address:', error);
            }
          }
        }

        res.json({
          stockdata: {
            stock: stock.toUpperCase(),
            price: responseData.latestPrice,
            likes: await LikedIP.countDocuments({ stock: stock.toLowerCase() })
          }
        });
      } catch (error) {
        console.error('Error making API request:', error);
        res.status(500).json({ error: 'Internal server error' });
      }

    });

};
