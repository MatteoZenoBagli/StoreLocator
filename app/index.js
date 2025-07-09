const express = require("express");
const path = require("path");
const fs = require('fs');
const app = express();
const port = 3000;

let inventory, products, stores;

try {
  inventory = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'inventory.json'), 'utf8'));
  products = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'products.json'), 'utf8'));
  stores = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'stores.json'), 'utf8'));
  console.log('Data loaded successfully!');
} catch (error) {
  console.error('Error loading data:', error);
}

app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get('/api/data', (req, res) => {
  res.json({
    inventory,
    products,
    stores
  });
});

app.get('/api/inventory', (req, res) => {
  res.json(inventory);
});

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.get('/api/stores', (req, res) => {
  res.json(stores);
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running at http://localhost:${port}`);
});
