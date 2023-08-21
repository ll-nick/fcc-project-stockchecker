'use strict';
const axios = require('axios');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


module.exports = function (app) {

  const LikedIP = mongoose.model('LikedIP', new mongoose.Schema({
    stock: String,
    hashedIP: String
  }));


  async function getStock(stock, ip, like = false) {
    const apiURL = 'https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/' + stock.toLowerCase() + '/quote';

    const response = await axios.get(apiURL);
    const responseData = response.data;

    if (like) {
      const hashedIP = await bcrypt.hash(ip, 10);
      const storedIPs = await LikedIP.find({ stock: stock.toLowerCase() });

      let ipExists = false;
      for (const ip of storedIPs) {
        ipExists = await bcrypt.compare(String(ip), ip.hashedIP);
        if (ipExists) {
          break;
        }
      }

      if (!ipExists) {
        const newLikedIP = new LikedIP({
          stock: stock.toLowerCase(),
          hashedIP: hashedIP
        });
        await newLikedIP.save();
      }
    }

    return {
      price: responseData.latestPrice,
      likes: await LikedIP.countDocuments({ stock: stock.toLowerCase() })
    }
  }

  app.route('/api/stock-prices')
    .get(async (req, res) => {
      const stock = req.query.stock
      const like = req.query.like === 'true';

      try {
        if (typeof stock === 'string') {
          const result = await getStock(stock, req.ip, like)

          res.json({
            stockData: {
              stock: stock.toUpperCase(),
              price: result.price,
              likes: result.likes
            }
          });
        } else if (Array.isArray(stock) && stock.length === 2) {
          const result0 = await getStock(stock[0], req.ip, like)
          const result1 = await getStock(stock[1], req.ip, like)

          res.json({
            stockData: [{
              stock: stock[0].toUpperCase(),
              price: result0.price,
              rel_likes: result0.likes - result1.likes
            },
            {
              stock: stock[1].toUpperCase(),
              price: result1.price,
              rel_likes: result1.likes - result0.likes
            }]
          });
        } else {
          res.status(400).json({ message: 'Invalid input' });
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
      }

    });

};
