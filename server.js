require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const glucoseRoutes = require('./routes/glucose');
const medicationRoutes = require('./routes/medication');
const appointmentRoutes = require('./routes/appointment');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connecté avec succès'))
  .catch(err => console.error('Erreur de connexion MongoDB:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/glucose', glucoseRoutes);
app.use('/api/medication', medicationRoutes);
app.use('/api/appointment', appointmentRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'API DiabCare en cours d\'exécution' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
