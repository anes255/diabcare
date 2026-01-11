const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const authMiddleware = require('../middleware/auth');

// Add appointment
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { doctorName, date, notes } = req.body;

    // Calculate end date (3 years from start date)
    const appointmentDate = new Date(date);
    const endDate = new Date(appointmentDate);
    endDate.setFullYear(endDate.getFullYear() + 3);

    const appointment = new Appointment({
      userId: req.userId,
      doctorName,
      date: appointmentDate,
      notes,
      recurring: true,
      endDate
    });

    await appointment.save();

    res.status(201).json({
      message: 'Rendez-vous ajouté',
      appointment
    });
  } catch (error) {
    console.error('Add appointment error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'ajout du rendez-vous.' });
  }
});

// Get all appointments for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.userId })
      .sort({ date: 1 });

    res.json(appointments);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des rendez-vous.' });
  }
});

// Get upcoming appointments (next 6 months)
router.get('/upcoming', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

    const appointments = await Appointment.find({
      userId: req.userId,
      date: { $gte: now, $lte: sixMonthsLater }
    }).sort({ date: 1 });

    res.json(appointments);
  } catch (error) {
    console.error('Get upcoming appointments error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des rendez-vous.' });
  }
});

// Update appointment
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { doctorName, date, notes, recurring } = req.body;

    const updateData = { doctorName, notes, recurring };
    
    if (date) {
      const appointmentDate = new Date(date);
      updateData.date = appointmentDate;
      
      if (recurring) {
        const endDate = new Date(appointmentDate);
        endDate.setFullYear(endDate.getFullYear() + 3);
        updateData.endDate = endDate;
      }
    }

    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateData,
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: 'Rendez-vous non trouvé.' });
    }

    res.json({
      message: 'Rendez-vous modifié',
      appointment
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ message: 'Erreur lors de la modification.' });
  }
});

// Delete appointment
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Rendez-vous non trouvé.' });
    }

    res.json({ message: 'Rendez-vous supprimé' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression.' });
  }
});

module.exports = router;
