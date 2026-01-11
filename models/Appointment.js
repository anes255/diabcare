const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  doctorName: {
    type: String,
    required: [true, 'Le nom du médecin est requis'],
    trim: true
  },
  specialty: {
    type: String,
    trim: true,
    default: 'Endocrinologue'
  },
  date: {
    type: Date,
    required: [true, 'La date du rendez-vous est requise']
  },
  time: {
    type: String,
    required: [true, 'L\'heure du rendez-vous est requise']
  },
  location: {
    type: String,
    trim: true,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  recurringEndDate: {
    type: Date,
    default: null
  },
  notificationIds: [{
    type: String
  }],
  nextAppointments: [{
    date: Date,
    notificationId: String
  }]
}, {
  timestamps: true
});

// Index for faster queries
appointmentSchema.index({ userId: 1, date: 1 });
appointmentSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
