const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Medication = require('../models/Medication');

// @route   POST /api/medications
// @desc    Ajouter un médicament
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { nom, dosage, heures } = req.body;

    // Validation
    if (!nom) {
      return res.status(400).json({ 
        error: 'Le nom du médicament est requis' 
      });
    }

    if (!heures || heures.length === 0) {
      return res.status(400).json({ 
        error: 'Au moins une heure de prise est requise' 
      });
    }

    // Créer le médicament
    const medication = new Medication({
      userId: req.userId,
      nom,
      dosage,
      heures
    });

    await medication.save();

    res.status(201).json({
      message: 'Médicament ajouté avec succès',
      medication
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du médicament:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'ajout du médicament',
      details: error.message 
    });
  }
});

// @route   GET /api/medications
// @desc    Récupérer tous les médicaments actifs de l'utilisateur
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const medications = await Medication.find({ 
      userId: req.userId,
      actif: true 
    }).sort({ dateCreation: -1 });

    res.json(medications);
  } catch (error) {
    console.error('Erreur lors de la récupération des médicaments:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des médicaments',
      details: error.message 
    });
  }
});

// @route   GET /api/medications/:id
// @desc    Récupérer un médicament spécifique
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const medication = await Medication.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!medication) {
      return res.status(404).json({ 
        error: 'Médicament non trouvé' 
      });
    }

    res.json(medication);
  } catch (error) {
    console.error('Erreur lors de la récupération du médicament:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération du médicament',
      details: error.message 
    });
  }
});

// @route   PUT /api/medications/:id
// @desc    Modifier un médicament
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { nom, dosage, heures } = req.body;

    const updateData = {};
    if (nom) updateData.nom = nom;
    if (dosage !== undefined) updateData.dosage = dosage;
    if (heures) updateData.heures = heures;

    const medication = await Medication.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!medication) {
      return res.status(404).json({ 
        error: 'Médicament non trouvé' 
      });
    }

    res.json({
      message: 'Médicament modifié avec succès',
      medication
    });
  } catch (error) {
    console.error('Erreur lors de la modification du médicament:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la modification du médicament',
      details: error.message 
    });
  }
});

// @route   DELETE /api/medications/:id
// @desc    Supprimer (désactiver) un médicament
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const medication = await Medication.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { actif: false },
      { new: true }
    );

    if (!medication) {
      return res.status(404).json({ 
        error: 'Médicament non trouvé' 
      });
    }

    res.json({ 
      message: 'Médicament supprimé avec succès' 
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du médicament:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la suppression du médicament',
      details: error.message 
    });
  }
});

module.exports = router;
