//Backend ve uygun API call'ları yazmak için deneme dosyası ancak yaşanan bağlantı
// sorunlarından dolayı bu dosya en azından benim bilgisayarımda çalışıyor.


require('dotenv').config(); //Load environment variables from .env file
const express = require('express'); // Import express for creating the server
const cors = require('cors'); // Import cors for handling cross-origin requests
const { Pool } = require('pg'); // Import Pool from pg for PostgreSQL connection

const app = express();
const port =  4000;

app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies

console.log('Connecting to:', process.env.DATABASE_URL);


const pool = new Pool({ // Creating a PostgreSQL connection
  connectionString: process.env.DATABASE_URL, // Use the DATABASE_URL from environment variables
  ssl: { rejectUnauthorized: false },
});



app.get('/api/items', async (req, res) => { // When a GET request is made to /api/items
  try {
    const result = await pool.query('SELECT * FROM budgets'); // Query to fetch all items from the 'budgets' table
    res.json(result.rows); 
  } catch (err) {
    console.error(err); 
    res.status(500).json({ error: 'Database error' }); 
  }
});

app.post('/api/items', async (req, res) => { // When a POST request is made to /api/items
  const { column1, column2 } = req.body; 
  try {
    const result = await pool.query(
      'INSERT INTO budgets (column1, column2) VALUES ($1, $2) RETURNING *', // Insert new item into the 'budgets' table
      [column1, column2]
    );
    res.status(201).json(result.rows[0]); 
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database insert error' });
  }
});

app.listen(port, () => { // Start the server and listen on the specified port
  console.log(`Backend listening on port ${port}`);
});
