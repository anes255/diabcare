const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const auth = require('../middleware/auth');

// Add appointment
router.post('/', auth, async (req, res) => {
  try {
    const { doctorName, date, notes } = req.body;
    
    const appointment = new Appointment({
      userId: req.userId,
      doctorName,
      date,
      notes: notes || ''
    });

    await appointment.save();
    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'ajout du rendez-vous' });
  }
});

// Get all appointments for user
router.get('/', auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.userId }).sort({ date: 1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des rendez-vous' });
  }
});

// Get upcoming appointments
router.get('/upcoming', auth, async (req, res) => {
  try {
    const now = new Date();
    const appointments = await Appointment.find({
      userId: req.userId,
      date: { $gte: now },
      active: true
    }).sort({ date: 1 });
    
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des rendez-vous à venir' });
  }
});

// Get appointment by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!appointment) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }
    
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération du rendez-vous' });
  }
});

// Update appointment
router.put('/:id', auth, async (req, res) => {
  try {
    const { doctorName, date, notes, active } = req.body;
    
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { doctorName, date, notes, active },
      { new: true }
    );
    
    if (!appointment) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }
    
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour du rendez-vous' });
  }
});

// Delete appointment
router.delete('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    
    if (!appointment) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }
    
    res.json({ message: 'Rendez-vous supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression du rendez-vous' });
  }
});

module.exports = router;
