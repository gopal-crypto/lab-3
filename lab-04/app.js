const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");
const SECRET_KEY = "MY_SECRET_KEY";
const PORT = process.env.PORT || 3000;

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS user (
        username TEXT UNIQUE,
        name TEXT,
        password TEXT
      );
    `);

    app.listen(PORT, () => {
      console.log(`Server Running at http://localhost:${PORT}/`);
    });
  } catch (e) {
    console.error(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.get("/", (req, res) => {
  res.status(200).send("User Authentication and JWT Service is running");
});

app.post("/register/", async (req, res) => {
  try {
    const { username, name, password } = req.body;

    if (!username || !password || !name) {
      return res.status(400).send("Username, name, and password are required");
    }

    const selectUserQuery = "SELECT * FROM user WHERE username = ?;";
    const dbUser = await db.get(selectUserQuery, [username]);

    if (dbUser !== undefined) {
      return res.status(400).send("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const createUserQuery = `
      INSERT INTO user (username, name, password)
      VALUES (?, ?, ?);
    `;

    await db.run(createUserQuery, [username, name, hashedPassword]);
    return res.status(200).send("User created successfully");
  } catch (error) {
    return res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});

app.post("/login/", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).send("Invalid user");
    }

    const selectUserQuery = "SELECT * FROM user WHERE username = ?;";
    const dbUser = await db.get(selectUserQuery, [username]);

    if (dbUser === undefined) {
      return res.status(400).send("Invalid user");
    }

    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);

    if (isPasswordMatched === false) {
      return res.status(400).send("Invalid password");
    }

    const payload = { username: username };
    const jwtToken = jwt.sign(payload, SECRET_KEY);

    return res.status(200).send({ jwt_token: jwtToken });
  } catch (error) {
    return res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});

app.get("/users/", async (req, res) => {
  try {
    const getUsersQuery = "SELECT username, name, password FROM user;";
    const usersList = await db.all(getUsersQuery);
    return res.status(200).send(usersList);
  } catch (error) {
    return res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});

module.exports = app;
