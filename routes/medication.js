const express = require('express');
const router = express.Router();
const Medication = require('../models/Medication');
const authMiddleware = require('../middleware/auth');

// Add medication
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, dosage, frequency, times, notes } = req.body;

    const medication = new Medication({
      userId: req.userId,
      name,
      dosage,
      frequency,
      times,
      notes
    });

    await medication.save();

    res.status(201).json({
      message: 'Médicament ajouté',
      medication
    });
  } catch (error) {
    console.error('Add medication error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'ajout du médicament.' });
  }
});

// Get all medications for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const medications = await Medication.find({ 
      userId: req.userId,
      active: true 
    }).sort({ createdAt: -1 });

    res.json(medications);
  } catch (error) {
    console.error('Get medications error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des médicaments.' });
  }
});

// Update medication
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, dosage, frequency, times, notes, active } = req.body;

    const medication = await Medication.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { name, dosage, frequency, times, notes, active },
      { new: true }
    );

    if (!medication) {
      return res.status(404).json({ message: 'Médicament non trouvé.' });
    }

    res.json({
      message: 'Médicament modifié',
      medication
    });
  } catch (error) {
    console.error('Update medication error:', error);
    res.status(500).json({ message: 'Erreur lors de la modification.' });
  }
});

// Delete medication
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const medication = await Medication.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!medication) {
      return res.status(404).json({ message: 'Médicament non trouvé.' });
    }

    res.json({ message: 'Médicament supprimé' });
  } catch (error) {
    console.error('Delete medication error:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression.' });
  }
});

module.exports = router;
