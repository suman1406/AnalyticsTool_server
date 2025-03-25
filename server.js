// Combined server file for MongoDB only
const express = require('express');
const helmet = require('helmet');
const cluster = require('cluster');
const os = require('os');
const { pid } = require('process');
const fs = require('fs');
const cors = require('cors');
const ngrok = require('ngrok');
const http = require('http');
require('dotenv').config();

// MongoDB-related imports
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const summaryRoutes = require('./routes/summaryRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const topicModellingRoutes = require('./routes/topicClusteringRoutes');
const sentimentRoutes = require('./routes/sentimentRoutes');
const hashtagRoutes = require('./routes/hashtagRoutes');
const demographicsRoutes = require('./routes/demographicsRoutes');
const advancedRoutes = require('./routes/advancedRoutes');

const app = express();
const PORT = process.env.PORT || 4000;
const concurrencyLimit = os.cpus().length;

// Global middleware
app.use(helmet());
app.use(express.json());
app.use(cors());
app.disable('x-powered-by');

// Mount MongoDB routes
app.use('/api', userRoutes);
app.use('/api', summaryRoutes);
app.use('/api', analysisRoutes);
app.use('/api', topicModellingRoutes);
app.use('/api', sentimentRoutes);
app.use('/api', hashtagRoutes);
app.use('/api', demographicsRoutes);
app.use('/api', advancedRoutes);

// Catch-all 404 route
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ error: 'Server error' });
});

if (cluster.isPrimary) {
    console.log(`[MESSAGE]: Master ${process.pid} is running.`);
    console.log(`[MESSAGE]: Forking ${concurrencyLimit} processes.`);
    for (let i = 0; i < concurrencyLimit; i++) {
        cluster.fork();
    }
    
    // Start Ngrok tunnel
    // (async () => {
    //     const url = await ngrok.connect({
    //         addr: PORT,
    //         authtoken: process.env.NGROK_AUTH_TOKEN,
    //     });
    //     console.log(`[MESSAGE]: Ngrok tunnel is live at ${url}`);
    // })();
} else {
    // Each worker connects to MongoDB before starting the server.
    connectDB();
    app.listen(PORT, (err) => {
        if (err) {
            console.log('[ERROR]: Error starting server.');
        } else {
            console.log(`[MESSAGE]: Process ${pid} listening on PORT ${PORT}`);
        }
    });
}
