const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Medication = require('../models/Medication');
const auth = require('../middleware/auth');

// Add medication
router.post('/', [
  auth,
  body('name').trim().notEmpty().withMessage('Le nom du médicament est requis'),
  body('dosage').trim().notEmpty().withMessage('Le dosage est requis'),
  body('times').isArray({ min: 1 }).withMessage('Au moins une heure doit être spécifiée')
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

    const { name, dosage, frequency, times, startDate, endDate, notes, notificationIds } = req.body;

    const medication = new Medication({
      userId: req.userId,
      name,
      dosage,
      frequency,
      times,
      startDate: startDate || new Date(),
      endDate,
      notes,
      notificationIds: notificationIds || []
    });

    await medication.save();

    res.status(201).json({
      success: true,
      message: 'Médicament ajouté',
      medication
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de l\'ajout du médicament',
      error: error.message 
    });
  }
});

// Get all medications for user
router.get('/', auth, async (req, res) => {
  try {
    const { isActive } = req.query;
    
    let query = { userId: req.userId };
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const medications = await Medication.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: medications.length,
      medications
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des médicaments',
      error: error.message 
    });
  }
});

// Get single medication
router.get('/:id', auth, async (req, res) => {
  try {
    const medication = await Medication.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!medication) {
      return res.status(404).json({ 
        success: false,
        message: 'Médicament non trouvé' 
      });
    }

    res.json({
      success: true,
      medication
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération',
      error: error.message 
    });
  }
});

// Update medication
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, dosage, frequency, times, startDate, endDate, notes, isActive, notificationIds } = req.body;

    let medication = await Medication.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!medication) {
      return res.status(404).json({ 
        success: false,
        message: 'Médicament non trouvé' 
      });
    }

    // Update fields
    if (name) medication.name = name;
    if (dosage) medication.dosage = dosage;
    if (frequency) medication.frequency = frequency;
    if (times) medication.times = times;
    if (startDate) medication.startDate = startDate;
    if (endDate !== undefined) medication.endDate = endDate;
    if (notes !== undefined) medication.notes = notes;
    if (isActive !== undefined) medication.isActive = isActive;
    if (notificationIds) medication.notificationIds = notificationIds;

    await medication.save();

    res.json({
      success: true,
      message: 'Médicament mis à jour',
      medication
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

// Delete medication
router.delete('/:id', auth, async (req, res) => {
  try {
    const medication = await Medication.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!medication) {
      return res.status(404).json({ 
        success: false,
        message: 'Médicament non trouvé' 
      });
    }

    res.json({
      success: true,
      message: 'Médicament supprimé'
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la suppression',
      error: error.message 
    });
  }
});

module.exports = router;
