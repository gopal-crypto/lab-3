const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "books.db");

const setupDatabase = async () => {
  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    await db.exec(`DROP TABLE IF EXISTS book;`);
    await db.exec(`
      CREATE TABLE book (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        price INTEGER NOT NULL,
        pages INTEGER NOT NULL
      );
    `);

    const books = [
      ["The Great Gatsby", "F. Scott Fitzgerald", 350, 180],
      ["To Kill a Mockingbird", "Harper Lee", 420, 281],
      ["1984", "George Orwell", 299, 328],
      ["Pride and Prejudice", "Jane Austen", 250, 432],
      ["The Catcher in the Rye", "J.D. Salinger", 380, 224],
      ["Brave New World", "Aldous Huxley", 450, 288],
      ["The Hobbit", "J.R.R. Tolkien", 550, 310],
      ["Harry Potter and the Sorcerer's Stone", "J.K. Rowling", 650, 320],
      ["The Alchemist", "Paulo Coelho", 320, 208],
      ["Crime and Punishment", "Fyodor Dostoevsky", 490, 671]
    ];

    for (const book of books) {
      await db.run(
        `INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?)`,
        book
      );
    }

    console.log("Database initialized successfully with 10 books.");
    await db.close();
  } catch (error) {
    console.error("Error setting up database:", error.message);
    process.exit(1);
  }
};

setupDatabase();
