const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get user profile
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        sex: user.sex,
        weight: user.weight,
        height: user.height,
        mobileNumber: user.mobileNumber,
        diabetesType: user.diabetesType,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération du profil',
      error: error.message 
    });
  }
});

// Update user profile
router.put('/', auth, async (req, res) => {
  try {
    const { name, sex, weight, height, diabetesType } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    // Update fields
    if (name) user.name = name;
    if (sex) user.sex = sex;
    if (weight !== undefined) user.weight = weight;
    if (height !== undefined) user.height = height;
    if (diabetesType) user.diabetesType = diabetesType;

    await user.save();

    res.json({
      success: true,
      message: 'Profil mis à jour',
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
    console.error('Erreur:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la mise à jour',
      error: error.message 
    });
  }
});

// Change password
router.put('/password', [
  auth,
  body('currentPassword').notEmpty().withMessage('Le mot de passe actuel est requis'),
  body('newPassword').isLength({ min: 6 }).withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Données invalides',
        errors: errors.array() 
      });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: 'Mot de passe actuel incorrect' 
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors du changement de mot de passe',
      error: error.message 
    });
  }
});

module.exports = router;
