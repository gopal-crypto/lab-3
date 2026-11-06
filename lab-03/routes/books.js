const express = require('express');
const { all, get, run } = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const {
      search_q = '',
      order_by = 'id',
      order = 'ASC',
      limit = 10,
      offset = 0,
      min_price,
      max_price,
    } = req.query;

    const allowedOrderBy = ['id', 'title', 'author', 'price'];
    const allowedOrder = ['ASC', 'DESC'];

    const safeOrderBy = allowedOrderBy.includes(order_by) ? order_by : 'id';
    const safeOrder = allowedOrder.includes(order.toUpperCase())
      ? order.toUpperCase()
      : 'ASC';
    const safeLimit = parseInt(limit, 10) || 10;
    const safeOffset = parseInt(offset, 10) || 0;

    const params = [];
    const conditions = [];

    if (search_q) {
      conditions.push('title LIKE ?');
      params.push(`%${search_q}%`);
    }

    if (min_price !== undefined && max_price !== undefined) {
      conditions.push('price BETWEEN ? AND ?');
      params.push(parseFloat(min_price), parseFloat(max_price));
    } else if (min_price !== undefined) {
      conditions.push('price >= ?');
      params.push(parseFloat(min_price));
    } else if (max_price !== undefined) {
      conditions.push('price <= ?');
      params.push(parseFloat(max_price));
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `SELECT * FROM books ${whereClause} ORDER BY ${safeOrderBy} ${safeOrder} LIMIT ? OFFSET ?`;
    params.push(safeLimit, safeOffset);

    const books = await all(sql, params);
    res.status(200).json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const book = await get('SELECT * FROM books WHERE id = ?', [req.params.id]);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.status(200).json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, author, price } = req.body;

    if (!title || !author || price === undefined) {
      return res
        .status(400)
        .json({ message: 'title, author and price are required' });
    }

    if (typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ message: 'title must be a non-empty string' });
    }

    if (typeof author !== 'string' || author.trim() === '') {
      return res
        .status(400)
        .json({ message: 'author must be a non-empty string' });
    }

    if (isNaN(Number(price)) || Number(price) < 0) {
      return res
        .status(400)
        .json({ message: 'price must be a non-negative number' });
    }

    const { lastID } = await run(
      'INSERT INTO books (title, author, price) VALUES (?, ?, ?)',
      [title.trim(), author.trim(), Number(price)]
    );

    const book = await get('SELECT * FROM books WHERE id = ?', [lastID]);
    res.status(201).json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const existing = await get('SELECT * FROM books WHERE id = ?', [
      req.params.id,
    ]);
    if (!existing) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const { title, author, price } = req.body;

    if (!title || !author || price === undefined) {
      return res
        .status(400)
        .json({ message: 'title, author and price are required' });
    }

    if (typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ message: 'title must be a non-empty string' });
    }

    if (typeof author !== 'string' || author.trim() === '') {
      return res
        .status(400)
        .json({ message: 'author must be a non-empty string' });
    }

    if (isNaN(Number(price)) || Number(price) < 0) {
      return res
        .status(400)
        .json({ message: 'price must be a non-negative number' });
    }

    await run(
      'UPDATE books SET title = ?, author = ?, price = ? WHERE id = ?',
      [title.trim(), author.trim(), Number(price), req.params.id]
    );

    const updated = await get('SELECT * FROM books WHERE id = ?', [
      req.params.id,
    ]);
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const existing = await get('SELECT * FROM books WHERE id = ?', [
      req.params.id,
    ]);
    if (!existing) {
      return res.status(404).json({ message: 'Book not found' });
    }

    await run('DELETE FROM books WHERE id = ?', [req.params.id]);
    res.status(200).json({ message: 'Book deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
