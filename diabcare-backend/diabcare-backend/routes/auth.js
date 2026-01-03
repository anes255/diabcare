const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, sex, weight, height, mobileNumber, diabetesType, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ mobileNumber });
    if (existingUser) {
      return res.status(400).json({ error: 'Ce numéro de téléphone est déjà utilisé' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      sex,
      weight,
      height,
      mobileNumber,
      diabetesType,
      password: hashedPassword
    });

    await user.save();

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

    res.status(201).json({
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
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;

    // Find user
    const user = await User.findOne({ mobileNumber });
    if (!user) {
      return res.status(400).json({ error: 'Numéro de téléphone ou mot de passe incorrect' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Numéro de téléphone ou mot de passe incorrect' });
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);

    res.json({
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
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération du profil' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, sex, weight, height, diabetesType } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, sex, weight, height, diabetesType },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil' });
  }
});

module.exports = router;
