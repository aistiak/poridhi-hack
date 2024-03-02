const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 4001;

app.use(bodyParser.json());

// Middleware for checking authentication
const authenticate = (req, res, next) => {
  const authHeader = req.headers.Auth;

  if (!authHeader || typeof authHeader !== 'string') {
    return res.status(401).json({ error: 'Unauthorized - Missing or invalid auth header' });
  }

  // You can add more sophisticated authentication logic here if needed

  next(); // Continue to the next middleware/route
};

// Route for handling JSON data at /feed
app.get('/feed', (req, res) => {    
  const jsonData = { message: 'This is a simple JSON response from /feed' };
  res.json(jsonData);
});

// Protected route with authentication at /post
app.post('/auth', authenticate, (req, res) => {
  res.json({ message: 'Authenticated - You can access this route with a valid auth header' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
