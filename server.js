// server.js - DiabeCare Backend API
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://gaheranes1_db_user:anesaya75@cluster0.mnwc2rk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB Atlas Cloud Database'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// ==================== SCHEMAS ====================

// User Schema
const UserSchema = new mongoose.Schema({
  phone: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true 
  },
  password: { 
    type: String, 
    required: true,
    minlength: 6 
  },
  name: { 
    type: String, 
    required: true 
  },
  age: { 
    type: Number, 
    required: true 
  },
  sex: { 
    type: String, 
    enum: ['Homme', 'Femme', 'male', 'female'],
    required: true 
  },
  weight: { 
    type: Number, 
    required: true 
  },
  height: { 
    type: Number, 
    required: true 
  },
  diabetesType: { 
    type: String, 
    enum: ['1', '2', 'gestational'],
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Glucose Reading Schema
const GlucoseReadingSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    index: true 
  },
  level: { 
    type: Number, 
    required: true,
    min: 0,
    max: 600 
  },
  date: { 
    type: Date, 
    required: true,
    index: true 
  },
  time: { 
    type: String, 
    enum: ['fasting', 'before-meal', 'after-meal', 'bedtime', 'before_meal', 'after_meal'],
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Models
const User = mongoose.model('User', UserSchema);
const GlucoseReading = mongoose.model('GlucoseReading', GlucoseReadingSchema);

// ==================== MIDDLEWARE ====================

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.userId = user.userId;
    next();
  });
};

// ==================== HELPER FUNCTIONS ====================

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
};

// ==================== ROUTES ====================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'DiabeCare API is running',
    timestamp: new Date().toISOString() 
  });
});

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { phone, password, name, age, sex, weight, height, diabetesType } = req.body;

    // Validate required fields
    if (!phone || !password || !name || !age || !sex || !weight || !height || !diabetesType) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      phone,
      password: hashedPassword,
      name,
      age: parseInt(age),
      sex,
      weight: parseFloat(weight),
      height: parseFloat(height),
      diabetesType
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user data (without password)
    const userData = {
      id: user._id,
      phone: user.phone,
      name: user.name,
      age: user.age,
      sex: user.sex,
      weight: user.weight,
      height: user.height,
      diabetesType: user.diabetesType
    };

    res.status(201).json({ 
      message: 'User registered successfully',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Validate input
    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password are required' });
    }

    // Find user
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id);

    // Return user data (without password)
    const userData = {
      id: user._id,
      phone: user.phone,
      name: user.name,
      age: user.age,
      sex: user.sex,
      weight: user.weight,
      height: user.height,
      diabetesType: user.diabetesType
    };

    res.json({ 
      message: 'Login successful',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get Current User
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== GLUCOSE ROUTES ====================

// Get All Glucose Readings for User
app.get('/api/glucose', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, limit = 100 } = req.query;

    // Build query
    const query = { userId: req.userId };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Get readings
    const readings = await GlucoseReading.find(query)
      .sort({ date: -1, createdAt: -1 })
      .limit(parseInt(limit));

    res.json(readings);

  } catch (error) {
    console.error('Get glucose readings error:', error);
    res.status(500).json({ error: 'Server error fetching glucose readings' });
  }
});

// Add New Glucose Reading
app.post('/api/glucose', authenticateToken, async (req, res) => {
  try {
    const { level, date, time } = req.body;

    // Validate input
    if (!level || !date || !time) {
      return res.status(400).json({ error: 'Level, date, and time are required' });
    }

    // Validate level range
    if (level < 0 || level > 600) {
      return res.status(400).json({ error: 'Glucose level must be between 0 and 600 mg/dL' });
    }

    // Create new reading
    const reading = new GlucoseReading({
      userId: req.userId,
      level: parseFloat(level),
      date: new Date(date),
      time
    });

    await reading.save();

    res.status(201).json({ 
      message: 'Glucose reading added successfully',
      reading
    });

  } catch (error) {
    console.error('Add glucose reading error:', error);
    res.status(500).json({ error: 'Server error adding glucose reading' });
  }
});

// Get Single Glucose Reading
app.get('/api/glucose/:id', authenticateToken, async (req, res) => {
  try {
    const reading = await GlucoseReading.findOne({ 
      _id: req.params.id,
      userId: req.userId 
    });

    if (!reading) {
      return res.status(404).json({ error: 'Reading not found' });
    }

    res.json(reading);

  } catch (error) {
    console.error('Get glucose reading error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update Glucose Reading
app.put('/api/glucose/:id', authenticateToken, async (req, res) => {
  try {
    const { level, date, time } = req.body;

    const reading = await GlucoseReading.findOne({ 
      _id: req.params.id,
      userId: req.userId 
    });

    if (!reading) {
      return res.status(404).json({ error: 'Reading not found' });
    }

    // Update fields
    if (level !== undefined) reading.level = parseFloat(level);
    if (date !== undefined) reading.date = new Date(date);
    if (time !== undefined) reading.time = time;

    await reading.save();

    res.json({ 
      message: 'Reading updated successfully',
      reading
    });

  } catch (error) {
    console.error('Update glucose reading error:', error);
    res.status(500).json({ error: 'Server error updating reading' });
  }
});

// Delete Glucose Reading
app.delete('/api/glucose/:id', authenticateToken, async (req, res) => {
  try {
    const reading = await GlucoseReading.findOneAndDelete({ 
      _id: req.params.id,
      userId: req.userId 
    });

    if (!reading) {
      return res.status(404).json({ error: 'Reading not found' });
    }

    res.json({ 
      message: 'Reading deleted successfully',
      reading
    });

  } catch (error) {
    console.error('Delete glucose reading error:', error);
    res.status(500).json({ error: 'Server error deleting reading' });
  }
});

// Get Statistics
app.get('/api/glucose/stats/summary', authenticateToken, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const readings = await GlucoseReading.find({
      userId: req.userId,
      date: { $gte: startDate }
    });

    if (readings.length === 0) {
      return res.json({
        average: 0,
        count: 0,
        min: 0,
        max: 0,
        period: `Last ${days} days`
      });
    }

    const levels = readings.map(r => r.level);
    const average = levels.reduce((a, b) => a + b, 0) / levels.length;
    const min = Math.min(...levels);
    const max = Math.max(...levels);

    res.json({
      average: Math.round(average * 10) / 10,
      count: readings.length,
      min,
      max,
      period: `Last ${days} days`
    });

  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: 'Server error fetching statistics' });
  }
});

// ==================== ERROR HANDLING ====================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ==================== START SERVER ====================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 DiabeCare API server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});