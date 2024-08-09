const mysql = require('mysql2');
require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authMiddleware = require('./middleware/authMiddleware'); // Import JWT middleware

const app = express();
app.use(bodyParser.json());
app.use(cors());

// MySQL database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL database');
});

// Registration endpoint
app.post('/register', (req, res) => {
    const { name, phone, car_plate_no, car_type, email, password } = req.body;
    // Hash the password before storing it
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) throw err;
        const query = 'INSERT INTO users (name, phone, car_plate_no, car_type, email, password) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(query, [name, phone, car_plate_no, car_type, email, hashedPassword], (err, result) => {
            if (err) throw err;
            res.send({ message: 'User registered successfully!' });
        });
    });
});

// Login endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], (err, results) => {
        if (err) throw err;
        if (results.length === 0) {
            return res.status(401).send({ message: 'No user found with this email.' });
        }
        const user = results[0];
        // Compare the hashed password with the entered password
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) throw err;
            if (isMatch) {
                // Generate JWT token
                const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
                res.send({ message: 'Login successful!', token });
            } else {
                res.status(401).send({ message: 'Incorrect password.' });
            }
        });
    });
});

// Add a subscription
app.post('/subscribe', authMiddleware, (req, res) => {
    const { user_id, plan_id } = req.body;
    const query = 'INSERT INTO user_subscriptions (user_id, plan_id, subscription_date) VALUES (?, ?, NOW())';
    db.query(query, [req.userId, plan_id], (err, result) => {
        if (err) throw err;
        res.send({ message: 'Subscription successful!' });
    });
});

// Record a payment
app.post('/payment', authMiddleware, (req, res) => {
    const { user_id, amount } = req.body;
    const query = 'INSERT INTO payment_details (user_id, amount, payment_date) VALUES (?, ?, NOW())';
    db.query(query, [req.userId, amount], (err, result) => {
        if (err) throw err;
        res.send({ message: 'Payment recorded successfully!' });
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
