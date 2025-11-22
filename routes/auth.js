const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @route   POST /api/auth/register
// @desc    Inscription d'un nouvel utilisateur
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { nom, sexe, poids, taille, telephone, typeDiabete, motDePasse } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ telephone });
    if (existingUser) {
      return res.status(400).json({ 
        error: 'Ce numéro de téléphone est déjà utilisé' 
      });
    }

    // Valider les données
    if (!nom || !sexe || !poids || !taille || !telephone || !typeDiabete || !motDePasse) {
      return res.status(400).json({ 
        error: 'Tous les champs sont requis' 
      });
    }

    if (motDePasse.length < 6) {
      return res.status(400).json({ 
        error: 'Le mot de passe doit contenir au moins 6 caractères' 
      });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    // Créer l'utilisateur
    const user = new User({
      nom,
      sexe,
      poids: parseFloat(poids),
      taille: parseFloat(taille),
      telephone,
      typeDiabete,
      motDePasse: hashedPassword
    });

    await user.save();

    // Générer le token JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'diabcare_secret_key_2024',
      { expiresIn: '30d' }
    );

    // Retourner l'utilisateur et le token
    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: {
        id: user._id,
        nom: user.nom,
        sexe: user.sexe,
        poids: user.poids,
        taille: user.taille,
        telephone: user.telephone,
        typeDiabete: user.typeDiabete
      },
      token
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'inscription',
      details: error.message 
    });
  }
});

// @route   POST /api/auth/login
// @desc    Connexion d'un utilisateur
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { telephone, motDePasse } = req.body;

    // Valider les données
    if (!telephone || !motDePasse) {
      return res.status(400).json({ 
        error: 'Téléphone et mot de passe requis' 
      });
    }

    // Trouver l'utilisateur
    const user = await User.findOne({ telephone });
    if (!user) {
      return res.status(401).json({ 
        error: 'Identifiants incorrects' 
      });
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(motDePasse, user.motDePasse);
    if (!isMatch) {
      return res.status(401).json({ 
        error: 'Identifiants incorrects' 
      });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'diabcare_secret_key_2024',
      { expiresIn: '30d' }
    );

    // Retourner l'utilisateur et le token
    res.json({
      message: 'Connexion réussie',
      user: {
        id: user._id,
        nom: user.nom,
        sexe: user.sexe,
        poids: user.poids,
        taille: user.taille,
        telephone: user.telephone,
        typeDiabete: user.typeDiabete
      },
      token
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la connexion',
      details: error.message 
    });
  }
});

module.exports = router;
