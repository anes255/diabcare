const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Accès refusé. Aucun token fourni.' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'diabcare_secret_key_2024_super_secure');
    
    // Find user
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Token invalide.' 
      });
    }

    // Add user to request
    req.user = user;
    req.userId = decoded.userId;
    
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    res.status(401).json({ 
      success: false,
      message: 'Token invalide ou expiré.' 
    });
  }
};

module.exports = auth;
