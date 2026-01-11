const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Glucose = require('../models/Glucose');
const auth = require('../middleware/auth');

// Add glucose reading
router.post('/', [
  auth,
  body('level').isFloat({ min: 0 }).withMessage('Niveau de glucose invalide'),
  body('mealTiming').isIn(['À jeun', 'Avant repas', 'Après repas', 'Avant coucher', 'Autre']).withMessage('Moment invalide')
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

    const { level, date, time, mealTiming, notes } = req.body;

    // Calculate remark based on level
    const { remark, remarkType } = Glucose.calculateRemark(level, mealTiming);

    const glucose = new Glucose({
      userId: req.userId,
      level,
      date: date || new Date(),
      time: time || new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      mealTiming,
      remark,
      remarkType,
      notes
    });

    await glucose.save();

    res.status(201).json({
      success: true,
      message: 'Niveau de glucose enregistré',
      glucose
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de l\'enregistrement',
      error: error.message 
    });
  }
});

// Get all glucose readings for user
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;
    
    let query = { userId: req.userId };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const glucoseReadings = await Glucose.find(query)
      .sort({ date: -1, time: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: glucoseReadings.length,
      glucoseReadings
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

// Get glucose statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const readings = await Glucose.find({
      userId: req.userId,
      date: { $gte: startDate }
    }).sort({ date: 1 });

    if (readings.length === 0) {
      return res.json({
        success: true,
        stats: {
          average: 0,
          min: 0,
          max: 0,
          count: 0,
          readings: []
        }
      });
    }

    const levels = readings.map(r => r.level);
    const average = levels.reduce((a, b) => a + b, 0) / levels.length;
    const min = Math.min(...levels);
    const max = Math.max(...levels);

    res.json({
      success: true,
      stats: {
        average: average.toFixed(2),
        min: min.toFixed(2),
        max: max.toFixed(2),
        count: readings.length,
        readings: readings.map(r => ({
          date: r.date,
          level: r.level,
          remark: r.remark,
          remarkType: r.remarkType
        }))
      }
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors du calcul des statistiques',
      error: error.message 
    });
  }
});

// Get single glucose reading
router.get('/:id', auth, async (req, res) => {
  try {
    const glucose = await Glucose.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!glucose) {
      return res.status(404).json({ 
        success: false,
        message: 'Lecture non trouvée' 
      });
    }

    res.json({
      success: true,
      glucose
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

// Update glucose reading
router.put('/:id', auth, async (req, res) => {
  try {
    const { level, date, time, mealTiming, notes } = req.body;

    let glucose = await Glucose.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!glucose) {
      return res.status(404).json({ 
        success: false,
        message: 'Lecture non trouvée' 
      });
    }

    // Update fields
    if (level !== undefined) {
      glucose.level = level;
      const { remark, remarkType } = Glucose.calculateRemark(level, mealTiming || glucose.mealTiming);
      glucose.remark = remark;
      glucose.remarkType = remarkType;
    }
    if (date) glucose.date = date;
    if (time) glucose.time = time;
    if (mealTiming) glucose.mealTiming = mealTiming;
    if (notes !== undefined) glucose.notes = notes;

    await glucose.save();

    res.json({
      success: true,
      message: 'Lecture mise à jour',
      glucose
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

// Delete glucose reading
router.delete('/:id', auth, async (req, res) => {
  try {
    const glucose = await Glucose.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!glucose) {
      return res.status(404).json({ 
        success: false,
        message: 'Lecture non trouvée' 
      });
    }

    res.json({
      success: true,
      message: 'Lecture supprimée'
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
