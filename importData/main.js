const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = 3011;
app.use(bodyParser.json());

const types = [
  "food",
  "cloths",
  "gadgets",
  "books",
  "travel",
  "sports",
  "music",
  "movies",
  "fitness",
  "technology"
];

// Function to generate mock data
const generateMockData = () => {
  const mockData = [];
  for (let i = 1; i <= 100; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const text = `This is a mock entry about ${type}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`;
    mockData.push({ type, text });
  }
  return mockData;
};

let mockDatabase = generateMockData();

// MongoDB Atlas connection URI
// const mongoURI = process.env.MONGO_URL;
const mongoURI = "mongodb://localhost:27017/hackathon";

// Connect to MongoDB Atlas
const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect()
  .then(() => {
    console.log('Connected to MongoDB Atlas');

    // Define the MongoDB collection
    const collection = client.db('hackathon').collection('feeds');

    // Endpoint to get all mock data
    app.get('/data', (req, res) => {
      res.json(mockDatabase);
    });

    app.get('/mongo-data', async (req, res) => {
        try {
          const dataFromMongo = await collection.find({}).toArray();
          res.json(dataFromMongo);
        } catch (error) {
          console.error('Error fetching data from MongoDB:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
      });

      
    // Endpoint to import data to MongoDB Atlas
    app.post('/import', async (req, res) => {
      const newData = req.body;

      if (!Array.isArray(newData)) {
        return res.status(400).json({ error: 'Invalid data format. Array expected.' });
      }

      // Insert the new data into MongoDB Atlas
      try {
        const result = await collection.insertMany(newData);
        console.log(`${result.insertedCount} documents inserted`);
        res.json({ message: 'Data imported successfully.' });
      } catch (err) {
        console.error('Error inserting documents:', err);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Start the Express server
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch(err => console.error('Error connecting to MongoDB Atlas:', err));
