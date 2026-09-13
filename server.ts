import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for large images (base64)
  app.use(express.json({ limit: '50mb' }));

  app.post('/api/analyze', async (req, res) => {
    try {
      const { image, mimeType, prompt, apiKey, model } = req.body;

      if (!image || !prompt) {
        return res.status(400).json({ error: 'Image and prompt are required' });
      }

      // If user provides a key, use it; otherwise fallback to environment variable (if any)
      const finalApiKey = apiKey || process.env.GEMINI_API_KEY;
      
      if (!finalApiKey) {
        return res.status(401).json({ error: 'API key is missing' });
      }

      const ai = new GoogleGenAI({ apiKey: finalApiKey });
      const targetModel = model || 'gemini-2.5-flash';

      // Remove data:image/...;base64, prefix if present
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

      const response = await ai.models.generateContent({
        model: targetModel,
        contents: [
          prompt,
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType || 'image/jpeg',
            },
          },
        ],
        config: {
          responseMimeType: 'application/json',
        }
      });

      if (!response.text) {
         throw new Error("No response text from Gemini");
      }
      
      res.json(JSON.parse(response.text));

    } catch (error: any) {
      console.error('AI Analysis Error:', error);
      res.status(500).json({ error: error.message || 'Failed to analyze image' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
