const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = 'diabcare_secret_key_2024_secure';

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, sex, weight, height, mobileNumber, diabetesType, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ mobileNumber });
    if (existingUser) {
      return res.status(400).json({ message: 'Ce numéro de téléphone est déjà utilisé.' });
    }

    // Create new user
    const user = new User({
      name,
      sex,
      weight,
      height,
      mobileNumber,
      diabetesType,
      password
    });

    await user.save();

    // Generate token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      message: 'Compte créé avec succès',
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
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Erreur lors de la création du compte.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;

    // Find user
    const user = await User.findOne({ mobileNumber });
    if (!user) {
      return res.status(400).json({ message: 'Numéro de téléphone ou mot de passe incorrect.' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Numéro de téléphone ou mot de passe incorrect.' });
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
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
    console.error('Login error:', error);
    res.status(500).json({ message: 'Erreur lors de la connexion.' });
  }
});

module.exports = router;
