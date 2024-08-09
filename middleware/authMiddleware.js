const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) return res.status(403).send({ message: 'No token provided.' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).send({ message: 'Failed to authenticate token.' });

        // Save the decoded user information to request object
        req.userId = decoded.id;
        req.userEmail = decoded.email;
        next();
    });
};

module.exports = authMiddleware;
