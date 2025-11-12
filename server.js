// server.js — simple proxy for CJ API (for local testing only)
const express = require('express');
const fetch = (...args) => import('node-fetch').then(m=>m.default(...args));
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors()); // allow local browser to call this server
app.use(bodyParser.json());

/*
  POST /proxy/products
  body: { endpoint, params, headerName, token }
  returns forwarded response from CJ
*/
app.post('/proxy/products', async (req, res) => {
  try {
    const { endpoint = 'https://developers.cjdropshipping.com/api2.0/v1/product/getProductList', params = 'page=1&size=20', headerName = 'accessToken', token } = req.body;
    if (!token) return res.status(400).json({ error: 'Missing token in request body' });

    const url = endpoint + (params ? ('?' + params) : '');
    const headers = {};
    headers[headerName] = token;
    // If headerName is Authorization and token is bare, prefix with Bearer
    if (headerName.toLowerCase() === 'authorization' && !token.toLowerCase().startsWith('bearer')) {
      headers[headerName] = 'Bearer ' + token;
    }

    const r = await fetch(url, { method: 'GET', headers });
    const text = await r.text();
    // try to parse JSON; if fails, return as text
    try {
      const json = JSON.parse(text);
      res.status(r.status).json({ status: r.status, body: json });
    } catch (e) {
      res.status(r.status).send(text);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`CJ proxy running on http://localhost:${PORT}`));