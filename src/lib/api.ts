import { AIAnalysisResult } from '../types';

const SYSTEM_PROMPT = `You are a professional stock metadata specialist. Analyze only the actual image content. Generate commercially useful but accurate metadata. Avoid keyword spam, invented facts, trademarks, copyrighted references, celebrity names, irrelevant search terms, and misleading descriptions. Prioritize the most important concepts first. If uncertain about people or property releases, return 'Review' or 'Uncertain'.

Return valid JSON with the following structure:
{
  "title": "A concise, SEO-friendly title (max 70 chars)",
  "description": "A detailed, factual description of the image content",
  "keywords": ["keyword1", "keyword2", "..."], // 30-50 highly relevant keywords
  "category": "The most fitting standard stock photography category",
  "contentType": "Photo, Illustration, or Vector",
  "aiGenerated": true or false,
  "people": "None", "Present", or "Uncertain",
  "property": "None", "Present", or "Uncertain",
  "releaseStatus": "Required", "Not Required", or "Review",
  "filenameSuggestion": "seo-friendly-filename.jpg",
  "warnings": ["Any potential compliance or trademark issues detected"]
}`;

export async function analyzeImageAPI(
  dataUrl: string,
  mimeType: string,
  apiKey: string,
  model: string = 'gemini-2.5-flash'
): Promise<AIAnalysisResult> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: dataUrl,
      mimeType,
      prompt: SYSTEM_PROMPT,
      apiKey,
      model,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to analyze image');
  }

  return response.json();
}
