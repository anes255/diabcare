const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://gaheranes1_db_user:anesaya75@cluster0.mnwc2rk.mongodb.net/diabcare?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connexion MongoDB réussie'))
.catch(err => console.error('❌ Erreur de connexion MongoDB:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/glucose', require('./routes/glucose'));
app.use('/api/medications', require('./routes/medications'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/profile', require('./routes/profile'));

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'DiabCare API Server',
    status: 'running',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Une erreur est survenue',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
});
