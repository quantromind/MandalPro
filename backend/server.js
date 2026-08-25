require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');

connectDB();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'mandalpro-backend' }));

app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/onboarding', require('./src/routes/onboarding'));
app.use('/api/mandal', require('./src/routes/mandal'));
app.use('/api/donations', require('./src/routes/donation'));
app.use('/api/expenses', require('./src/routes/expense'));
app.use('/api/budgets', require('./src/routes/budget'));
app.use('/api/events', require('./src/routes/event'));
app.use('/api/dashboard', require('./src/routes/dashboard'));
app.use('/api/members', require('./src/routes/member'));
app.use('/api/sponsors', require('./src/routes/sponsor'));
app.use('/api/inventory', require('./src/routes/inventory'));
app.use('/api/payments', require('./src/routes/payment'));
app.use('/api/chat', require('./src/routes/chat'));
app.use('/api/superadmin', require('./src/routes/superadmin'));

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`MandalPro API running on port ${PORT}`));
