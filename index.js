const mysql = require('mysql2');
require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authMiddleware = require('./middleware/authMiddleware'); // Import JWT middleware
const QRCode = require('qrcode');
const twilio = require('twilio');

const app = express();
app.use(bodyParser.json());
app.use(cors({
    origin: 'https://d-parker.vercel.app', // Your Vercel frontend URL
}));

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

// Record a payment
app.post('/payment', authMiddleware, (req, res) => {
    const { amount, status, method } = req.body;

    // Insert payment details into the Payment table
    const query = 'INSERT INTO Payment (userId, amount, paymentDate, status, method) VALUES (?, ?, NOW(), ?, ?)';
    
    db.query(query, [req.userId, amount, status, method], (err, result) => {
        if (err) throw err;
        res.send({ message: 'Payment recorded successfully!' });
    });
});

// Add a subscription
app.post('/subscribe', authMiddleware, (req, res) => {
    const { plan_id } = req.body;
    const userId = req.userId;
    
    const subscribeQuery = 'INSERT INTO user_subscriptions (user_id, plan_id, subscription_date) VALUES (?, ?, NOW())';
    const updateStatusQuery = 'UPDATE users SET subscription_status = ? WHERE id = ?';
    
    db.query(subscribeQuery, [userId, plan_id], (err, result) => {
        if (err) return res.status(500).send({ message: 'Error in subscribing the user.' });

        // After successful subscription, update the user's subscription status
        db.query(updateStatusQuery, ['subscribed', userId], (err, result) => {
            if (err) return res.status(500).send({ message: 'Error in updating subscription status.' });
            
            res.send({ message: 'Subscription successful and status updated!' });
        });
    });
});

// Generate QR code
app.get('/generate-qr', (req, res) => {
    const data = 'https://example.com'; // Replace with your desired URL or data

    QRCode.toDataURL(data, (err, url) => {
        if (err) throw err;

        // The 'url' is the base64 encoded image data of the QR code
        res.send(`<img src="${url}" alt="QR Code" />`);
    });
});

// Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);

// Endpoint to send SMS/WhatsApp
app.post('/send-message', authMiddleware, (req, res) => {
    const { to, message, via } = req.body; // 'to' is the recipient number, 'message' is the text, 'via' is 'sms' or 'whatsapp'

    let sendMethod;

    if (via === 'sms') {
        sendMethod = client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER, // Your Twilio number
            to: to
        });
    } else if (via === 'whatsapp') {
        sendMethod = client.messages.create({
            body: message,
            from: 'whatsapp:' + process.env.TWILIO_WHATSAPP_NUMBER, // Your Twilio WhatsApp number
            to: 'whatsapp:' + to
        });
    }

    sendMethod.then((message) => {
        res.send({ message: 'Message sent successfully!', sid: message.sid });
    }).catch((error) => {
        res.status(500).send({ error: error.message });
    });
});

// Start the server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
