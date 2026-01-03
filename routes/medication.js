const express = require('express');
const router = express.Router();
const Medication = require('../models/Medication');
const auth = require('../middleware/auth');

// Add medication
router.post('/', auth, async (req, res) => {
  try {
    const { name, dosage, time, frequency } = req.body;
    
    const medication = new Medication({
      userId: req.userId,
      name,
      dosage,
      time,
      frequency: frequency || 'Quotidien'
    });

    await medication.save();
    res.status(201).json(medication);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'ajout du médicament' });
  }
});

// Get all medications for user
router.get('/', auth, async (req, res) => {
  try {
    const medications = await Medication.find({ userId: req.userId }).sort({ time: 1 });
    res.json(medications);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des médicaments' });
  }
});

// Get medication by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const medication = await Medication.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!medication) {
      return res.status(404).json({ error: 'Médicament non trouvé' });
    }
    
    res.json(medication);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération du médicament' });
  }
});

// Update medication
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, dosage, time, frequency, active } = req.body;
    
    const medication = await Medication.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { name, dosage, time, frequency, active },
      { new: true }
    );
    
    if (!medication) {
      return res.status(404).json({ error: 'Médicament non trouvé' });
    }
    
    res.json(medication);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour du médicament' });
  }
});

// Delete medication
router.delete('/:id', auth, async (req, res) => {
  try {
    const medication = await Medication.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    
    if (!medication) {
      return res.status(404).json({ error: 'Médicament non trouvé' });
    }
    
    res.json({ message: 'Médicament supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression du médicament' });
  }
});

module.exports = router;
