import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  app,
  loadDataset,
  ensureDatasetLoaded,
  calculateCandidateTransitTelemetry,
  KeplerRecord,
  TransitTelemetry,
} from './api/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load local environment file if present in development
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = (match[2] || '').trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (val && (!process.env[key] || process.env[key] === 'MY_GEMINI_API_KEY')) {
          process.env[key] = val;
        }
      }
    }
  }
} catch {
  // Proceed with process.env if .env cannot be loaded
}

const PORT = parseInt(process.env.PORT || '3000', 10);

// Setup Vite middleware for local development or static file serving for local production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kepler Exoplanet Platform running at http://0.0.0.0:${PORT}`);
  });
}

// Only start standalone HTTP server if running directly and NOT in Vercel serverless environment
if (!process.env.VERCEL) {
  startServer();
}

export {
  app,
  loadDataset,
  ensureDatasetLoaded,
  calculateCandidateTransitTelemetry,
  type KeplerRecord,
  type TransitTelemetry,
};
export default app;
