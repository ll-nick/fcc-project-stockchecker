const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {
    test('should view one stock and return stockData', async () => {
        const res = await chai.request(server).keepOpen().get('/api/stock-prices?stock=AAPL');
        assert.strictEqual(res.status, 200);
        assert.isObject(res.body.stockData);
        assert.hasAllKeys(res.body.stockData, ['stock', 'price', 'likes']);
    });

    test('should view one stock, like it, and return updated stockData', async () => {
        const res = await chai.request(server).keepOpen().get('/api/stock-prices?stock=MSFT&like=true');
        assert.strictEqual(res.status, 200);
        assert.isObject(res.body.stockData);
        assert.hasAllKeys(res.body.stockData, ['stock', 'price', 'likes']);
        assert.isAtLeast(res.body.stockData.likes, 1);
    });

    test('should view the same stock, like it again, and return updated stockData', async () => {
        const res = await chai.request(server).keepOpen().get('/api/stock-prices?stock=MSFT&like=true');
        assert.strictEqual(res.status, 200);
        assert.isObject(res.body.stockData);
        assert.hasAllKeys(res.body.stockData, ['stock', 'price', 'likes']);
        assert.isAtLeast(res.body.stockData.likes, 1);
    });

    test('should view two stocks and return array with rel_likes', async () => {
        const res = await chai.request(server).keepOpen().get('/api/stock-prices?stock=GOOG&stock=MSFT');
        assert.strictEqual(res.status, 200);
        assert.isObject(res.body);
        assert.isArray(res.body.stockData);
        assert.hasAllKeys(res.body.stockData[0], ['stock', 'price', 'rel_likes']);
        assert.hasAllKeys(res.body.stockData[1], ['stock', 'price', 'rel_likes']);
    });

    test('should view two stocks, like them, and return array with updated rel_likes', async () => {
        const res = await chai.request(server).keepOpen().get('/api/stock-prices?stock=GOOG&stock=MSFT&like=true');
        assert.strictEqual(res.status, 200);
        assert.isObject(res.body);
        assert.isArray(res.body.stockData);
        assert.hasAllKeys(res.body.stockData[0], ['stock', 'price', 'rel_likes']);
        assert.hasAllKeys(res.body.stockData[1], ['stock', 'price', 'rel_likes']);
    });

});
