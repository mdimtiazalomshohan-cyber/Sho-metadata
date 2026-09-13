import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Project, ImageRecord, ImageMetadata, AppSettings } from '../types';

export type { Project, ImageRecord, ImageMetadata, AppSettings };

interface ShoMetaDB extends DBSchema {
  projects: {
    key: string;
    value: Project;
  };
  images: {
    key: string;
    value: ImageRecord;
    indexes: { 'by-project': string };
  };
  metadata: {
    key: string;
    value: ImageMetadata;
    indexes: { 'by-project': string };
  };
  settings: {
    key: string;
    value: Partial<AppSettings>;
  };
}

let dbPromise: Promise<IDBPDatabase<ShoMetaDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ShoMetaDB>('sho-meta-ai-db', 1, {
      upgrade(db) {
        db.createObjectStore('projects', { keyPath: 'id' });
        
        const imageStore = db.createObjectStore('images', { keyPath: 'id' });
        imageStore.createIndex('by-project', 'projectId');
        
        const metaStore = db.createObjectStore('metadata', { keyPath: 'id' });
        metaStore.createIndex('by-project', 'projectId');
        
        db.createObjectStore('settings');
      },
    });
  }
  return dbPromise;
}

// Projects
export async function getProjects() {
  const db = await getDB();
  return db.getAll('projects');
}

export async function saveProject(project: Project) {
  const db = await getDB();
  await db.put('projects', project);
}

export async function deleteProject(id: string) {
  const db = await getDB();
  const tx = db.transaction(['projects', 'images', 'metadata'], 'readwrite');
  await tx.objectStore('projects').delete(id);
  
  // Cascade delete images and metadata
  const imageIndex = tx.objectStore('images').index('by-project');
  const imageKeys = await imageIndex.getAllKeys(id);
  for (const key of imageKeys) {
    await tx.objectStore('images').delete(key);
    await tx.objectStore('metadata').delete(key);
  }
  await tx.done;
}

// Images
export async function getProjectImages(projectId: string) {
  const db = await getDB();
  return db.getAllFromIndex('images', 'by-project', projectId);
}

export async function getImage(id: string) {
  const db = await getDB();
  return db.get('images', id);
}

export async function saveImage(image: ImageRecord) {
  const db = await getDB();
  await db.put('images', image);
}

export async function deleteImage(id: string) {
  const db = await getDB();
  const tx = db.transaction(['images', 'metadata'], 'readwrite');
  await tx.objectStore('images').delete(id);
  await tx.objectStore('metadata').delete(id);
  await tx.done;
}

// Metadata
export async function getProjectMetadata(projectId: string) {
  const db = await getDB();
  return db.getAllFromIndex('metadata', 'by-project', projectId);
}

export async function getMetadata(id: string) {
  const db = await getDB();
  return db.get('metadata', id);
}

export async function saveMetadata(metadata: ImageMetadata) {
  const db = await getDB();
  await db.put('metadata', metadata);
}

// Settings
export async function getSettings(): Promise<Partial<AppSettings>> {
  const db = await getDB();
  const settings = await db.get('settings', 'user-settings');
  return settings || {};
}

export async function saveSettings(settings: Partial<AppSettings>) {
  const db = await getDB();
  await db.put('settings', settings, 'user-settings');
}
