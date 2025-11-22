const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const RendezVous = require('../models/RendezVous');

// @route   POST /api/rendezvous
// @desc    Ajouter un rendez-vous avec génération automatique des rappels
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { date, notes } = req.body;

    // Validation
    if (!date) {
      return res.status(400).json({ 
        error: 'La date du rendez-vous est requise' 
      });
    }

    const dateRdv = new Date(date);
    
    // Vérifier que la date est dans le futur
    if (dateRdv < new Date()) {
      return res.status(400).json({ 
        error: 'La date doit être dans le futur' 
      });
    }

    // Créer le rendez-vous
    const rendezVous = new RendezVous({
      userId: req.userId,
      date: dateRdv,
      notes
    });

    // Générer les rappels tous les 3 mois pendant 3 ans (12 rappels)
    rendezVous.genererRappels();

    await rendezVous.save();

    res.status(201).json({
      message: 'Rendez-vous créé avec succès. 12 rappels générés (tous les 3 mois pendant 3 ans)',
      rendezVous
    });
  } catch (error) {
    console.error('Erreur lors de la création du rendez-vous:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la création du rendez-vous',
      details: error.message 
    });
  }
});

// @route   GET /api/rendezvous
// @desc    Récupérer tous les rendez-vous actifs de l'utilisateur
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const rendezVous = await RendezVous.find({ 
      userId: req.userId,
      actif: true 
    }).sort({ date: 1 });

    res.json(rendezVous);
  } catch (error) {
    console.error('Erreur lors de la récupération des rendez-vous:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des rendez-vous',
      details: error.message 
    });
  }
});

// @route   GET /api/rendezvous/prochains
// @desc    Récupérer les 10 prochains rappels de rendez-vous
// @access  Private
router.get('/prochains', auth, async (req, res) => {
  try {
    const maintenant = new Date();
    const rendezVous = await RendezVous.find({ 
      userId: req.userId,
      actif: true 
    });

    // Extraire tous les rappels futurs de tous les rendez-vous
    const prochains = [];
    
    rendezVous.forEach(rdv => {
      rdv.rappelsGeneres.forEach(rappel => {
        const dateRappel = new Date(rappel);
        if (dateRappel > maintenant) {
          prochains.push({
            _id: rdv._id,
            date: rappel,
            notes: rdv.notes,
            original: rdv.date
          });
        }
      });
    });

    // Trier par date croissante et limiter à 10
    prochains.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    res.json(prochains.slice(0, 10));
  } catch (error) {
    console.error('Erreur lors de la récupération des prochains rendez-vous:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des prochains rendez-vous',
      details: error.message 
    });
  }
});

// @route   GET /api/rendezvous/:id
// @desc    Récupérer un rendez-vous spécifique
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const rendezVous = await RendezVous.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!rendezVous) {
      return res.status(404).json({ 
        error: 'Rendez-vous non trouvé' 
      });
    }

    res.json(rendezVous);
  } catch (error) {
    console.error('Erreur lors de la récupération du rendez-vous:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la récupération du rendez-vous',
      details: error.message 
    });
  }
});

// @route   PUT /api/rendezvous/:id
// @desc    Modifier un rendez-vous et régénérer les rappels si la date change
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { date, notes } = req.body;
    
    const rendezVous = await RendezVous.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!rendezVous) {
      return res.status(404).json({ 
        error: 'Rendez-vous non trouvé' 
      });
    }

    // Mettre à jour les notes si fournies
    if (notes !== undefined) {
      rendezVous.notes = notes;
    }

    // Si la date change, régénérer les rappels
    if (date) {
      const newDate = new Date(date);
      
      if (newDate < new Date()) {
        return res.status(400).json({ 
          error: 'La date doit être dans le futur' 
        });
      }
      
      rendezVous.date = newDate;
      rendezVous.genererRappels();
    }

    await rendezVous.save();

    res.json({
      message: 'Rendez-vous modifié avec succès',
      rendezVous
    });
  } catch (error) {
    console.error('Erreur lors de la modification du rendez-vous:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la modification du rendez-vous',
      details: error.message 
    });
  }
});

// @route   DELETE /api/rendezvous/:id
// @desc    Supprimer (désactiver) un rendez-vous et tous ses rappels
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const rendezVous = await RendezVous.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { actif: false },
      { new: true }
    );

    if (!rendezVous) {
      return res.status(404).json({ 
        error: 'Rendez-vous non trouvé' 
      });
    }

    res.json({ 
      message: 'Rendez-vous et tous ses rappels supprimés avec succès' 
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du rendez-vous:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la suppression du rendez-vous',
      details: error.message 
    });
  }
});

module.exports = router;
