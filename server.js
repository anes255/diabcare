const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuration
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://gaheranes1_db_user:anesaya75@cluster0.mnwc2rk.mongodb.net/diabcare?retryWrites=true&w=majority&appName=Cluster0';

// Connexion à MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connecté à MongoDB Atlas');
  })
  .catch((err) => {
    console.error('❌ Erreur de connexion à MongoDB:', err.message);
    process.exit(1);
  });

// Event listeners pour MongoDB
mongoose.connection.on('error', (err) => {
  console.error('❌ Erreur MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB déconnecté');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/glucose', require('./routes/glucose'));
app.use('/api/medications', require('./routes/medications'));
app.use('/api/rendezvous', require('./routes/rendezvous'));

// Route de santé / test
app.get('/', (req, res) => {
  res.json({
    message: 'DiabCare API - Serveur fonctionnel',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'DiabCare API fonctionne correctement',
    database: mongoose.connection.readyState === 1 ? 'connectée' : 'déconnectée',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.path
  });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur DiabCare démarré sur le port ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🏥 API prête à recevoir des requêtes`);
});

// Gestion de l'arrêt propre
process.on('SIGINT', async () => {
  console.log('\n⚠️ Arrêt du serveur en cours...');
  await mongoose.connection.close();
  console.log('✅ Connexion MongoDB fermée');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️ SIGTERM reçu, arrêt du serveur...');
  await mongoose.connection.close();
  console.log('✅ Connexion MongoDB fermée');
  process.exit(0);
});

module.exports = app;
