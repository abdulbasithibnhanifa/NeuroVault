import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env, connectDB, getSupabaseClient } from '@neurovault/shared';
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

import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Set critical security headers
app.use(cors({
  origin: env.NODE_ENV === 'production' 
    ? [env.NEXTAUTH_URL, 'https://neurovault.vercel.app'] // Restrict to production origins
    : true, // Allow all in dev for easier testing
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Health check for Render & Supabase
app.get('/health', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    // A tiny metadata-only query to Supabase to keep it active
    await supabase.from('documents').select('id', { count: 'exact', head: true }).limit(1);
    
    res.status(200).json({ 
      status: 'healthy', 
      supabase: 'active',
      timestamp: new Date().toISOString() 
    });
  } catch (err) {
    res.status(200).json({ 
      status: 'healthy', 
      supabase: 'unreachable',
      timestamp: new Date().toISOString() 
    });
  }
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
