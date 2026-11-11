const jwt = require('jsonwebtoken');
require('dotenv').config();

function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization']; // gets the header info
    const token = authHeader && authHeader.split(' ')[1]; // splits so we only need token

    if (!token) {
        return res.status(401).json({ error: 'No token, not logged in' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded; // attach user info to request for later routes
        next(); // let the request continue to the actual route

    } catch (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
  }
}


module.exports = authMiddleware;