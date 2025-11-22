import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { cacheService } from '../utils/cache';
import logger from '../utils/logger';

const router = express.Router();

// Basic health check
router.get('/', (req: Request, res: Response) => {
  res.json({ 
    status: 'Active', 
    message: 'Telegram Market Backend is Running',
    timestamp: new Date().toISOString()
  });
});

// Enhanced health check with system status
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    const cacheStats = cacheService.getStats();
    
    const health = {
      status: dbState === 1 ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: Math.floor(uptime),
        formatted: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`
      },
      database: {
        status: dbStates[dbState],
        connected: dbState === 1,
        host: mongoose.connection.host || 'unknown'
      },
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
      },
      cache: {
        keys: cacheStats.keys,
        hits: cacheStats.hits,
        misses: cacheStats.misses,
        hitRate: cacheStats.keys > 0 
          ? `${((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(2)}%`
          : '0%'
      }
    };

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'error',
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Metrics endpoint (Prometheus-style)
router.get('/metrics', (req: Request, res: Response) => {
  try {
    const memoryUsage = process.memoryUsage();
    const cacheStats = cacheService.getStats();
    
    const metrics = {
      uptime_seconds: process.uptime(),
      memory_rss_bytes: memoryUsage.rss,
      memory_heap_total_bytes: memoryUsage.heapTotal,
      memory_heap_used_bytes: memoryUsage.heapUsed,
      cache_keys: cacheStats.keys,
      cache_hits: cacheStats.hits,
      cache_misses: cacheStats.misses,
      database_connected: mongoose.connection.readyState === 1 ? 1 : 0
    };

    // Format as Prometheus-style metrics
    const prometheusFormat = Object.entries(metrics)
      .map(([key, value]) => `telegram_market_${key} ${value}`)
      .join('\n');

    res.set('Content-Type', 'text/plain');
    res.send(prometheusFormat);
  } catch (error) {
    logger.error('Metrics collection failed', { error });
    res.status(500).send('# Error collecting metrics\n');
  }
});

export default router;

