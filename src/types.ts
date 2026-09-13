export interface Project {
  id: string;
  name: string;
  description: string;
  category?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ImageRecord {
  id: string;
  projectId: string;
  dataUrl: string; // Base64 data
  filename: string;
  width: number;
  height: number;
  size: number;
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: number;
  updatedAt: number;
}

export interface ImageMetadata {
  id: string; // Matches ImageRecord.id
  projectId: string;
  title: string;
  description: string;
  keywords: string[];
  category: string;
  contentType: string;
  aiGenerated: boolean;
  people: 'None' | 'Present' | 'Uncertain';
  property: 'None' | 'Present' | 'Uncertain';
  releaseStatus: 'Required' | 'Not Required' | 'Review';
  filenameSuggestion: string;
  notes: string;
  updatedAt: number;
}

export interface AppSettings {
  apiKey: string;
  provider: string;
  model: string;
  theme: 'light' | 'dark' | 'system';
}

export interface AIAnalysisResult {
  title: string;
  description: string;
  keywords: string[];
  category: string;
  contentType: string;
  aiGenerated: boolean;
  people: 'None' | 'Present' | 'Uncertain';
  property: 'None' | 'Present' | 'Uncertain';
  releaseStatus: 'Required' | 'Not Required' | 'Review';
  filenameSuggestion: string;
  warnings?: string[];
}
