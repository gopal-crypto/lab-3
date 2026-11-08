const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "books.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.get("/", (req, res) => {
  res.status(200).json({ message: "Lab 3 REST API is running" });
});

app.get("/books/", async (req, res) => {
  try {
    const {
      search_q = "",
      order_by = "id",
      order = "ASC",
      limit = 10,
      offset = 0,
      min_price,
      max_price,
    } = req.query;

    const allowedColumns = ["id", "title", "author", "price", "pages"];
    const validOrderBy = allowedColumns.includes(order_by) ? order_by : "id";
    const validOrder = (order && order.toUpperCase() === "DESC") ? "DESC" : "ASC";

    const parsedLimit = parseInt(limit) > 0 ? parseInt(limit) : 10;
    const parsedOffset = parseInt(offset) >= 0 ? parseInt(offset) : 0;

    let query = "SELECT * FROM book WHERE title LIKE ?";
    const params = [`%${search_q}%`];

    if (min_price !== undefined && max_price !== undefined) {
      query += " AND price BETWEEN ? AND ?";
      params.push(parseInt(min_price), parseInt(max_price));
    } else if (min_price !== undefined) {
      query += " AND price >= ?";
      params.push(parseInt(min_price));
    } else if (max_price !== undefined) {
      query += " AND price <= ?";
      params.push(parseInt(max_price));
    }

    query += ` ORDER BY ${validOrderBy} ${validOrder} LIMIT ? OFFSET ?;`;
    params.push(parsedLimit, parsedOffset);

    const books = await db.all(query, params);
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;
    const getBookQuery = "SELECT * FROM book WHERE id = ?;";
    const book = await db.get(getBookQuery, [bookId]);
    if (!book) {
      return res.status(404).json({ message: "Book Not Found" });
    }
    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/books/", async (req, res) => {
  try {
    const { title, author, price, pages } = req.body;

    if (!title || typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({ message: "Invalid or missing title" });
    }

    if (!author || typeof author !== "string" || author.trim() === "") {
      return res.status(400).json({ message: "Invalid or missing author" });
    }

    if (price === undefined || typeof price !== "number" || isNaN(price) || price < 0) {
      return res.status(400).json({ message: "Price must be a non-negative number" });
    }

    const bookPages = (pages !== undefined && typeof pages === "number" && !isNaN(pages) && pages > 0) ? pages : 100;

    const addBookQuery = "INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?);";
    const result = await db.run(addBookQuery, [title.trim(), author.trim(), price, bookPages]);

    res.status(201).json({
      bookId: result.lastID,
      message: "Book Added Successfully"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;
    const { title, author, price, pages } = req.body;

    const checkBookQuery = "SELECT * FROM book WHERE id = ?;";
    const existingBook = await db.get(checkBookQuery, [bookId]);

    if (!existingBook) {
      return res.status(404).json({ message: "Book Not Found" });
    }

    if (!title || typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({ message: "Invalid or missing title" });
    }

    if (!author || typeof author !== "string" || author.trim() === "") {
      return res.status(400).json({ message: "Invalid or missing author" });
    }

    if (price === undefined || typeof price !== "number" || isNaN(price) || price < 0) {
      return res.status(400).json({ message: "Price must be a non-negative number" });
    }

    const bookPages = (pages !== undefined && typeof pages === "number" && !isNaN(pages) && pages > 0) ? pages : existingBook.pages;

    const updateBookQuery = "UPDATE book SET title = ?, author = ?, price = ?, pages = ? WHERE id = ?;";
    await db.run(updateBookQuery, [title.trim(), author.trim(), price, bookPages, bookId]);

    res.status(200).json({ message: "Book Updated Successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete("/books/:bookId/", async (req, res) => {
  try {
    const { bookId } = req.params;

    const checkBookQuery = "SELECT * FROM book WHERE id = ?;";
    const existingBook = await db.get(checkBookQuery, [bookId]);

    if (!existingBook) {
      return res.status(404).json({ message: "Book Not Found" });
    }

    const deleteBookQuery = "DELETE FROM book WHERE id = ?;";
    await db.run(deleteBookQuery, [bookId]);

    res.status(200).json({ message: "Book Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: "Route Not Found" });
});

module.exports = app;
