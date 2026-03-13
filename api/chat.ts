import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

const ALLOWED_ORIGINS = [
  'https://iahorra.vercel.app',
  'https://iahorra-certus.vercel.app',
];

function setCorsHeaders(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin) || process.env.NODE_ENV === 'development') {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (setCorsHeaders(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const { message, history, systemInstruction } = req.body ?? {};

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'El campo "message" es requerido y debe ser texto.' });
  }

  if (message.length > 4000) {
    return res.status(400).json({ error: 'El mensaje excede el límite permitido.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: typeof systemInstruction === 'string' ? systemInstruction : '',
        temperature: 0.7,
      },
      history: Array.isArray(history) && history.length > 0 ? history : undefined,
    });

    const response = await chat.sendMessage({ message: message.trim() });
    const text = response.text ?? '';

    return res.status(200).json({ text });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error interno del servidor';
    console.error('Gemini API error:', msg);
    return res.status(502).json({ error: msg });
  }
}
