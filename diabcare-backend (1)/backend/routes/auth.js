const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Le nom est requis'),
  body('sex').isIn(['Homme', 'Femme', 'Autre']).withMessage('Sexe invalide'),
  body('weight').isFloat({ min: 0 }).withMessage('Poids invalide'),
  body('height').isFloat({ min: 0 }).withMessage('Taille invalide'),
  body('mobileNumber').trim().notEmpty().withMessage('Le numéro de téléphone est requis'),
  body('diabetesType').isIn(['Type 1', 'Type 2', 'Gestationnel', 'Autre']).withMessage('Type de diabète invalide'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Données invalides',
        errors: errors.array() 
      });
    }

    const { name, sex, weight, height, mobileNumber, diabetesType, password, expoPushToken } = req.body;

    // Check if user already exists
    let user = await User.findOne({ mobileNumber });
    if (user) {
      return res.status(400).json({ 
        success: false,
        message: 'Ce numéro de téléphone est déjà enregistré' 
      });
    }

    // Create new user
    user = new User({
      name,
      sex,
      weight,
      height,
      mobileNumber,
      diabetesType,
      password,
      expoPushToken
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'diabcare_secret_key_2024_super_secure',
      { expiresIn: '90d' }
    );

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      token,
      user: {
        id: user._id,
        name: user.name,
        sex: user.sex,
        weight: user.weight,
        height: user.height,
        mobileNumber: user.mobileNumber,
        diabetesType: user.diabetesType
      }
    });
  } catch (error) {
    console.error('Erreur d\'inscription:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de l\'inscription',
      error: error.message 
    });
  }
});

// Login
router.post('/login', [
  body('mobileNumber').trim().notEmpty().withMessage('Le numéro de téléphone est requis'),
  body('password').notEmpty().withMessage('Le mot de passe est requis')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Données invalides',
        errors: errors.array() 
      });
    }

    const { mobileNumber, password, expoPushToken } = req.body;

    // Find user
    const user = await User.findOne({ mobileNumber });
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Identifiants incorrects' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: 'Identifiants incorrects' 
      });
    }

    // Update push token if provided
    if (expoPushToken && expoPushToken !== user.expoPushToken) {
      user.expoPushToken = expoPushToken;
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'diabcare_secret_key_2024_super_secure',
      { expiresIn: '90d' }
    );

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        id: user._id,
        name: user.name,
        sex: user.sex,
        weight: user.weight,
        height: user.height,
        mobileNumber: user.mobileNumber,
        diabetesType: user.diabetesType
      }
    });
  } catch (error) {
    console.error('Erreur de connexion:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message 
    });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        sex: req.user.sex,
        weight: req.user.weight,
        height: req.user.height,
        mobileNumber: req.user.mobileNumber,
        diabetesType: req.user.diabetesType
      }
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des données',
      error: error.message 
    });
  }
});

// Update push token
router.put('/push-token', auth, async (req, res) => {
  try {
    const { expoPushToken } = req.body;
    
    const user = await User.findById(req.userId);
    user.expoPushToken = expoPushToken;
    await user.save();

    res.json({
      success: true,
      message: 'Token de notification mis à jour'
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la mise à jour du token',
      error: error.message 
    });
  }
});

module.exports = router;
