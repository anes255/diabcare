const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Glucose = require('../models/Glucose');

// Fonction pour calculer la remarque sur le niveau de glucose
const calculerRemarque = (niveau, typeDiabete) => {
  if (niveau < 70) {
    return { 
      remarque: 'Hypoglycémie - Attention!', 
      couleur: '#FF4444',
      conseil: 'Prenez un aliment sucré rapidement' 
    };
  } else if (niveau >= 70 && niveau <= 100) {
    return { 
      remarque: 'Excellent! Niveau optimal', 
      couleur: '#4CAF50',
      conseil: 'Continuez ainsi!' 
    };
  } else if (niveau > 100 && niveau <= 125) {
    return { 
      remarque: 'Bon niveau', 
      couleur: '#8BC34A',
      conseil: 'Restez vigilant' 
    };
  } else if (niveau > 125 && niveau <= 180) {
    return { 
      remarque: 'Niveau élevé', 
      couleur: '#FF9800',
      conseil: 'Surveillez votre alimentation' 
    };
  } else {
    return { 
      remarque: 'Hyperglycémie - Consultez votre médecin', 
      couleur: '#FF4444',
      conseil: 'Contactez votre médecin si ça persiste' 
    };
  }
};

// @route   POST /api/glucose
// @desc    Ajouter une mesure de glucose
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { niveau, moment } = req.body;

    // Validation
    if (!niveau) {
      return res.status(400).json({ 
        error: 'Le niveau de glucose est requis' 
      });
    }

    // Calculer l'analyse
    const analyse = calculerRemarque(niveau, req.user.typeDiabete);

    // Créer la mesure
    const glucose = new Glucose({
      userId: req.userId,
      niveau: parseFloat(niveau),
      moment: moment || 'Matin',
      remarque: JSON.stringify(analyse)
    });

    await glucose.save();

    res.status(201).json({
      message: 'Mesure enregistrée avec succès',
      glucose,
      analyse
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du glucose:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'ajout de la mesure',
      details: error.message 
    });
  }
});

// @route   GET /api/glucose
// @desc    Récupérer toutes les mesures de glucose de l'utilisateur
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = { userId: req.userId };

    // Filtrer par date si fourni
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const glucoseRecords = await Glucose.find(query)
      .sort({ date: -1 })
      .limit(100); // Limiter à 100 résultats

    // Parser les remarques JSON
    const recordsWithAnalyse = glucoseRecords.map(record => ({
      ...record.toObject(),
      analyse: JSON.parse(record.remarque)
    }));

    res.json(recordsWithAnalyse);
  } catch (error) {
    console.error('Erreur lors de la récupération du glucose:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des mesures',
      details: error.message 
    });
  }
});

// @route   GET /api/glucose/stats
// @desc    Récupérer les statistiques de glucose (30 derniers jours)
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const records = await Glucose.find({
      userId: req.userId,
      date: { $gte: last30Days }
    }).sort({ date: 1 });

    const stats = {
      moyenne: 0,
      min: 0,
      max: 0,
      total: records.length
    };

    if (records.length > 0) {
      const niveaux = records.map(r => r.niveau);
      stats.moyenne = (niveaux.reduce((a, b) => a + b, 0) / niveaux.length).toFixed(1);
      stats.min = Math.min(...niveaux);
      stats.max = Math.max(...niveaux);
    }

    res.json({ 
      stats, 
      records: records.map(record => ({
        ...record.toObject(),
        analyse: JSON.parse(record.remarque)
      }))
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des statistiques',
      details: error.message 
    });
  }
});

// @route   DELETE /api/glucose/:id
// @desc    Supprimer une mesure de glucose
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const glucose = await Glucose.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!glucose) {
      return res.status(404).json({ 
        error: 'Mesure non trouvée' 
      });
    }

    res.json({ 
      message: 'Mesure supprimée avec succès' 
    });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la suppression',
      details: error.message 
    });
  }
});

module.exports = router;
