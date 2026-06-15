const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Webhook payload needs to be raw, so parse it specially before express.json()
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(cors());
app.use(express.json());

// Import Routes
const profileRoutes = require('./src/routes/profiles');
const stripeRoutes = require('./src/routes/stripe');
const authRoutes = require('./src/routes/auth');
const interactionRoutes = require('./src/routes/interactions');
const listRoutes = require('./src/routes/lists');

// Use Routes
app.use('/api/profiles', profileRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/lists', listRoutes);

app.get('/', (req, res) => {
  res.send('NeonToad API Gateway is running securely');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
