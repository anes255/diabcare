const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const auth = require('../middleware/auth');

// Add appointment
router.post('/', [
  auth,
  body('doctorName').trim().notEmpty().withMessage('Le nom du médecin est requis'),
  body('date').notEmpty().withMessage('La date est requise'),
  body('time').notEmpty().withMessage('L\'heure est requise')
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

    const { doctorName, specialty, date, time, location, notes, notificationIds } = req.body;

    // Calculate recurring end date (3 years from first appointment)
    const appointmentDate = new Date(date);
    const recurringEndDate = new Date(appointmentDate);
    recurringEndDate.setFullYear(recurringEndDate.getFullYear() + 3);

    // Generate next appointments (every 3 months for 3 years)
    const nextAppointments = [];
    let currentDate = new Date(appointmentDate);
    
    for (let i = 1; i <= 12; i++) { // 12 appointments (3 months * 12 = 3 years)
      currentDate = new Date(currentDate);
      currentDate.setMonth(currentDate.getMonth() + 3);
      
      if (currentDate <= recurringEndDate) {
        nextAppointments.push({
          date: new Date(currentDate),
          notificationId: null
        });
      }
    }

    const appointment = new Appointment({
      userId: req.userId,
      doctorName,
      specialty: specialty || 'Endocrinologue',
      date: appointmentDate,
      time,
      location,
      notes,
      recurringEndDate,
      notificationIds: notificationIds || [],
      nextAppointments
    });

    await appointment.save();

    res.status(201).json({
      success: true,
      message: 'Rendez-vous ajouté',
      appointment
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de l\'ajout du rendez-vous',
      error: error.message 
    });
  }
});

// Get all appointments for user
router.get('/', auth, async (req, res) => {
  try {
    const { isActive, upcoming } = req.query;
    
    let query = { userId: req.userId };
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (upcoming === 'true') {
      query.date = { $gte: new Date() };
    }

    const appointments = await Appointment.find(query).sort({ date: 1 });

    res.json({
      success: true,
      count: appointments.length,
      appointments
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des rendez-vous',
      error: error.message 
    });
  }
});

// Get all upcoming appointments (including next recurring ones)
router.get('/upcoming/all', auth, async (req, res) => {
  try {
    const appointments = await Appointment.find({
      userId: req.userId,
      isActive: true
    }).sort({ date: 1 });

    const allUpcoming = [];
    const now = new Date();

    appointments.forEach(appointment => {
      // Add main appointment if it's in the future
      if (new Date(appointment.date) >= now) {
        allUpcoming.push({
          _id: appointment._id,
          doctorName: appointment.doctorName,
          specialty: appointment.specialty,
          date: appointment.date,
          time: appointment.time,
          location: appointment.location,
          notes: appointment.notes,
          isRecurring: false
        });
      }

      // Add upcoming recurring appointments
      if (appointment.nextAppointments && appointment.nextAppointments.length > 0) {
        appointment.nextAppointments.forEach((nextApp, index) => {
          if (new Date(nextApp.date) >= now) {
            allUpcoming.push({
              _id: `${appointment._id}-recurring-${index}`,
              parentId: appointment._id,
              doctorName: appointment.doctorName,
              specialty: appointment.specialty,
              date: nextApp.date,
              time: appointment.time,
              location: appointment.location,
              notes: appointment.notes,
              isRecurring: true,
              notificationId: nextApp.notificationId
            });
          }
        });
      }
    });

    // Sort by date
    allUpcoming.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      success: true,
      count: allUpcoming.length,
      appointments: allUpcoming
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des rendez-vous',
      error: error.message 
    });
  }
});

// Get single appointment
router.get('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!appointment) {
      return res.status(404).json({ 
        success: false,
        message: 'Rendez-vous non trouvé' 
      });
    }

    res.json({
      success: true,
      appointment
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

// Update appointment
router.put('/:id', auth, async (req, res) => {
  try {
    const { doctorName, specialty, date, time, location, notes, isActive, notificationIds, nextAppointments } = req.body;

    let appointment = await Appointment.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!appointment) {
      return res.status(404).json({ 
        success: false,
        message: 'Rendez-vous non trouvé' 
      });
    }

    // Update fields
    if (doctorName) appointment.doctorName = doctorName;
    if (specialty) appointment.specialty = specialty;
    if (date) {
      appointment.date = date;
      
      // Recalculate recurring appointments if date changed
      const appointmentDate = new Date(date);
      const recurringEndDate = new Date(appointmentDate);
      recurringEndDate.setFullYear(recurringEndDate.getFullYear() + 3);
      appointment.recurringEndDate = recurringEndDate;

      // Regenerate next appointments
      const newNextAppointments = [];
      let currentDate = new Date(appointmentDate);
      
      for (let i = 1; i <= 12; i++) {
        currentDate = new Date(currentDate);
        currentDate.setMonth(currentDate.getMonth() + 3);
        
        if (currentDate <= recurringEndDate) {
          newNextAppointments.push({
            date: new Date(currentDate),
            notificationId: null
          });
        }
      }
      appointment.nextAppointments = newNextAppointments;
    }
    if (time) appointment.time = time;
    if (location !== undefined) appointment.location = location;
    if (notes !== undefined) appointment.notes = notes;
    if (isActive !== undefined) appointment.isActive = isActive;
    if (notificationIds) appointment.notificationIds = notificationIds;
    if (nextAppointments) appointment.nextAppointments = nextAppointments;

    await appointment.save();

    res.json({
      success: true,
      message: 'Rendez-vous mis à jour',
      appointment
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

// Delete appointment
router.delete('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!appointment) {
      return res.status(404).json({ 
        success: false,
        message: 'Rendez-vous non trouvé' 
      });
    }

    res.json({
      success: true,
      message: 'Rendez-vous supprimé'
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
