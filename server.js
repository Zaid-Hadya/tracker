const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Client } = require("pg");
const port = 3000;
const app = express();
require("dotenv").config();

app.use(express.json());

const client = new Client({
  port: process.env.DB_port,
  host: process.env.DB_host,
  database: process.env.DB_name,
  user: process.env.DB_user,
  password: process.env.DB_password,
});

client
  .connect()
  .then(() => {
    console.log("Connected to PostgreSQL database!");
  })
  .catch((err) => {
    console.log("Error connecting to the database:", err);
  });

app.post("/expense", async (req, res) => {
  const { category, price } = req.body;

  if (!category || !price) {
    return res.status(400).send("One of the entries is missing!");
  }

  const values = [category, price];
  try {
    const result = await client.query(
      `INSERT INTO expense (category, price) VALUES ($1, $2) RETURNING id;`,
      values
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Some error has occurred");
  }
});

app.get("/expense", async (req, res) => {
  try {
    const result = await client.query(`SELECT * FROM expense ORDER BY id ASC;`);

    res.status(201).json(result.rows);
  } catch (err) {
    res.status(400).send("message:", err);
  }
});

app.get("/expense/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await client.query(`SELECT * FROM expense WHERE id = $1`,
      [ id ]
    );

    res.status(201).json(result.rows);
  } catch (err) {
    res.status(400).send("message:", err);
  }
});

app.put("/expense/:id", async (req, res) => {
  const { id } = req.params;
  const { category, price } = req.body;

  try {
    const result = await client.query(`UPDATE expense SET category = $2, price = $3 WHERE id = $1 RETURNING *`,
      [ id, category, price ]
    );

    res.status(201).send("Updated!");
  } catch (err) {
    res.status(400).send("message:", err);
  }
});

app.delete("/expense/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await client.query(`DELETE FROM expense WHERE id = $1 RETURNING *`,
      [ id ]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("this post is not in the database");
    }
    
    res.status(201).send("Deleted!");
  } catch (err) {
    res.status(400).send("message:", err);
  }
});





app.post('/pass',  (req, res) => {
  const { password } = req.body;

  bcrypt.hash(password, 10, (error, hasedPassword) => {
    if(error){
      console.log("Password hasing failed", error);
    }
    else {
      console.log("Hashed password:", hasedPassword);
      const values = [hasedPassword];
      try {
        const result =  client.query(
          `INSERT INTO auth (password) VALUES ($1) RETURNING id;`,
          values
        );
    
        res.status(201).json(result.rows[0]);
      } catch (err) {
        console.error("Error:", err);
        res.status(500).send("Some error has occurred");
      }
   
  
    }
   
  })
})


// const storedHashedPassword = 'hashed_password_from_database';

// // Compare a user-provided password with the stored hashed password
// bcrypt.compare(plainPassword, storedHashedPassword, (error, isMatch) => {
//   if (error) {
//     console.error('Password comparison failed:', error);
//   } else {
//     if (isMatch) {
//       console.log('Password is correct');
//     } else {
//       console.log('Password is incorrect');
//     }
//   }
// });


app.listen(port, (res) => {
  console.log(`The app listens on port ${port}`);
});
