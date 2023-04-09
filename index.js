const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const data = require('./data.json');
const app = express();
const port = 3000;

app.use(bodyParser.json());

// Import data to MongoDB

// Endpoint for getting all products in inventory
app.get('/api/inventory', (req, res) => {
  const inventory = data[1];
  res.json(inventory);
});

// Update the API to accept a query for getting only products that have low quantity (less than 100)
app.get('/api/inventory/lowquantity', (req, res) => {
  const lowInventory = data[1].filter(item => item.instock < 100);
  res.json(lowInventory);
});

// Create a login API. Generate a token when user get login.
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const users = data[2];
  const user = users.find(user => user.username === username && user.password === password);

  if (!user) {
    res.status(401).json({ message: 'Invalid username or password' });
    return;
  }

  const token = jwt.sign({ username: user.username }, 'secret_key');
  res.json({ token });
});

// Restrict the resource. Only logged-in user can visit it.
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  jwt.verify(token, 'secret_key', (err, user) => {
    if (err) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    req.user = user;
    next();
  });
}

// Create an API for getting orders with the description of product inside each orders.
app.get('/api/orders', authenticateToken, (req, res) => {
  const orders = data[0];
  const inventory = data[1];

  const ordersWithDescription = orders.map(order => {
    const products = order.map(item => {
      const product = inventory.find(product => product.sku === item.item);
      return { ...item, description: product.description };
    });

    return products;
  });

  res.json(ordersWithDescription);
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
