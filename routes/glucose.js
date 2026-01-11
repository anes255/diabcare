const express = require('express');
const router = express.Router();
const Glucose = require('../models/Glucose');
const authMiddleware = require('../middleware/auth');

// Helper function to get remark based on glucose level
const getGlucoseRemark = (level) => {
  if (level < 70) {
    return 'Hypoglycémie - Niveau trop bas';
  } else if (level >= 70 && level <= 100) {
    return 'Excellent - Niveau optimal';
  } else if (level > 100 && level <= 125) {
    return 'Bon - Légèrement élevé';
  } else if (level > 125 && level <= 180) {
    return 'Attention - Niveau élevé';
  } else {
    return 'Hyperglycémie - Niveau trop élevé';
  }
};

// Add glucose reading
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { level, date, timeOfDay } = req.body;
    
    const remark = getGlucoseRemark(level);

    const glucose = new Glucose({
      userId: req.userId,
      level,
      date: date || new Date(),
      timeOfDay,
      remark
    });

    await glucose.save();

    res.status(201).json({
      message: 'Niveau de glucose enregistré',
      glucose
    });
  } catch (error) {
    console.error('Add glucose error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'enregistrement.' });
  }
});

// Get all glucose readings for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const glucoseReadings = await Glucose.find({ userId: req.userId })
      .sort({ date: -1 });

    res.json(glucoseReadings);
  } catch (error) {
    console.error('Get glucose error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des données.' });
  }
});

// Get glucose readings for last 30 days
router.get('/recent', authMiddleware, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const glucoseReadings = await Glucose.find({
      userId: req.userId,
      date: { $gte: thirtyDaysAgo }
    }).sort({ date: 1 });

    res.json(glucoseReadings);
  } catch (error) {
    console.error('Get recent glucose error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des données.' });
  }
});

// Delete glucose reading
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const glucose = await Glucose.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!glucose) {
      return res.status(404).json({ message: 'Enregistrement non trouvé.' });
    }

    res.json({ message: 'Enregistrement supprimé' });
  } catch (error) {
    console.error('Delete glucose error:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression.' });
  }
});

module.exports = router;
