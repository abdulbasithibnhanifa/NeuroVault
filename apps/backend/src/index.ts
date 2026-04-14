import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env, connectDB } from '@neurovault/shared';
import { authenticate } from './middleware/auth';
import { logger } from '@neurovault/shared';

// Import Routes
import documentRoutes from './routes/documents';
import uploadRoutes from './routes/upload';
import chatRoutes from './routes/chat';
import searchRoutes from './routes/search';
import statsRoutes from './routes/stats';
import graphRoutes from './routes/graph';
import youtubeRoutes from './routes/youtube';
import userRoutes from './routes/user';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health check for Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Root
app.get('/', (req, res) => {
  res.send('NeuroVault Backend API');
});

// Protected Routes
app.use('/api/documents', authenticate, documentRoutes);
app.use('/api/upload', authenticate, uploadRoutes);
app.use('/api/chat', authenticate, chatRoutes);
app.use('/api/search', authenticate, searchRoutes);
app.use('/api/stats', authenticate, statsRoutes);
app.use('/api/graph', authenticate, graphRoutes);
app.use('/api/youtube', authenticate, youtubeRoutes);
app.use('/api/user', authenticate, userRoutes);



async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`Backend server running on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
