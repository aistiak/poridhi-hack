const express = require('express');
const mysql = require('mysql');

const app = express();
const PORT = 3001;

// MySQL connection configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hackathon',
};

const connection = mysql.createConnection(dbConfig);

// Connect to MySQL
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});

// Express middleware to parse JSON data
app.use(express.json());

// Insert data into MySQL
app.post('/insert', (req, res) => {
  const { name } = req.body;

  const sql = 'INSERT INTO items (name) VALUES (?)';
  connection.query(sql, [name], (err, result) => {
    if (err) {
      console.error('Error inserting data:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    console.log('Data inserted:', result);
    res.json({ message: 'Data inserted successfully' });
  });
});

// Read data from MySQL
app.get('/read', (req, res) => {
  const sql = 'SELECT * FROM items';
  connection.query(sql, (err, results) => {
    if (err) {
      console.error('Error reading data:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    console.log('Data retrieved:', results);
    res.json(results);
  });
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
