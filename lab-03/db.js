const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'books.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to connect to database:', err.message);
    process.exit(1);
  }
});

const initDb = () => {
  return new Promise((resolve, reject) => {
    db.run(
      `CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        price REAL NOT NULL
      )`,
      (err) => {
        if (err) return reject(err);
        db.get('SELECT COUNT(*) as count FROM books', (err, row) => {
          if (err) return reject(err);
          if (row.count === 0) {
            const seed = db.prepare(
              'INSERT INTO books (title, author, price) VALUES (?, ?, ?)'
            );
            const data = [
              ['The Great Gatsby', 'F. Scott Fitzgerald', 12.99],
              ['To Kill a Mockingbird', 'Harper Lee', 9.99],
              ['1984', 'George Orwell', 8.49],
              ['Pride and Prejudice', 'Jane Austen', 7.99],
              ['The Catcher in the Rye', 'J.D. Salinger', 10.99],
              ['Brave New World', 'Aldous Huxley', 11.49],
              ['The Hobbit', 'J.R.R. Tolkien', 14.99],
              ['Harry Potter and the Philosopher Stone', 'J.K. Rowling', 15.99],
              ['The Alchemist', 'Paulo Coelho', 9.49],
              ['Crime and Punishment', 'Fyodor Dostoevsky', 13.99],
            ];
            data.forEach(([title, author, price]) => {
              seed.run(title, author, price);
            });
            seed.finalize(resolve);
          } else {
            resolve();
          }
        });
      }
    );
  });
};

const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
};

const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

module.exports = { initDb, run, get, all };
