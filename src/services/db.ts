/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Project, Label, Sample, SavedModel, SystemLog } from '../types';
import { auth, syncService } from './firebase';

const DB_NAME = 'TeachableMachineDB';
const DB_VERSION = 1;

class IndexedDBService {
  private db: IDBDatabase | null = null;

  public init(): Promise<IDBDatabase> {
    if (this.db) return Promise.resolve(this.db);

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Projects
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }

        // Labels
        if (!db.objectStoreNames.contains('labels')) {
          const store = db.createObjectStore('labels', { keyPath: 'id' });
          store.createIndex('projectId', 'projectId', { unique: false });
        }

        // Samples (Large data stored here)
        if (!db.objectStoreNames.contains('samples')) {
          const store = db.createObjectStore('samples', { keyPath: 'id' });
          store.createIndex('projectId', 'projectId', { unique: false });
          store.createIndex('labelId', 'labelId', { unique: false });
        }

        // Models
        if (!db.objectStoreNames.contains('models')) {
          const store = db.createObjectStore('models', { keyPath: 'id' });
          store.createIndex('projectId', 'projectId', { unique: false });
        }

        // Logs
        if (!db.objectStoreNames.contains('logs')) {
          db.createObjectStore('logs', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        reject(new Error('IndexedDB initialization failed: ' + (event.target as IDBOpenDBRequest).error?.message));
      };
    });
  }

  private async getStore(storeName: string, mode: IDBTransactionMode): Promise<IDBObjectStore> {
    const db = await this.init();
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // --- PROJECTS ---
  public async getProjects(): Promise<Project[]> {
    const store = await this.getStore('projects', 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  public async saveProject(project: Project): Promise<void> {
    const store = await this.getStore('projects', 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.put(project);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    const currentUser = auth.currentUser;
    if (currentUser) {
      await syncService.saveProject(currentUser.uid, project);
    }
  }

  public async deleteProject(projectId: string): Promise<void> {
    // Delete project itself
    const projectStore = await this.getStore('projects', 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = projectStore.delete(projectId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    const currentUser = auth.currentUser;
    if (currentUser) {
      await syncService.deleteProject(currentUser.uid, projectId);
    }

    // Clean up associated labels, samples, and models
    const labels = await this.getLabels(projectId);
    for (const label of labels) {
      await this.deleteLabel(label.id);
    }

    const modelsStore = await this.getStore('models', 'readwrite');
    const index = modelsStore.index('projectId');
    const modelRequest = index.openCursor(IDBKeyRange.only(projectId));
    modelRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  }

  // --- LABELS ---
  public async getLabels(projectId: string): Promise<Label[]> {
    const store = await this.getStore('labels', 'readonly');
    const index = store.index('projectId');
    return new Promise((resolve, reject) => {
      const request = index.getAll(IDBKeyRange.only(projectId));
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  public async saveLabel(label: Label): Promise<void> {
    const store = await this.getStore('labels', 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.put(label);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    const currentUser = auth.currentUser;
    if (currentUser) {
      await syncService.saveLabel(currentUser.uid, label);
    }
  }

  public async deleteLabel(labelId: string): Promise<void> {
    const labelStore = await this.getStore('labels', 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = labelStore.delete(labelId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    const currentUser = auth.currentUser;
    if (currentUser) {
      await syncService.deleteLabel(currentUser.uid, labelId);
    }

    // Delete all samples under this label
    const sampleStore = await this.getStore('samples', 'readwrite');
    const index = sampleStore.index('labelId');
    return new Promise<void>((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.only(labelId));
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // --- SAMPLES ---
  public async getSamples(projectId: string): Promise<Sample[]> {
    const store = await this.getStore('samples', 'readonly');
    const index = store.index('projectId');
    return new Promise((resolve, reject) => {
      const request = index.getAll(IDBKeyRange.only(projectId));
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  public async getSamplesByLabel(labelId: string): Promise<Sample[]> {
    const store = await this.getStore('samples', 'readonly');
    const index = store.index('labelId');
    return new Promise((resolve, reject) => {
      const request = index.getAll(IDBKeyRange.only(labelId));
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  public async saveSample(sample: Sample): Promise<void> {
    const store = await this.getStore('samples', 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.put(sample);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    const currentUser = auth.currentUser;
    if (currentUser) {
      await syncService.saveSample(currentUser.uid, sample);
    }
  }

  public async deleteSample(sampleId: string): Promise<void> {
    const store = await this.getStore('samples', 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(sampleId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    const currentUser = auth.currentUser;
    if (currentUser) {
      await syncService.deleteSample(currentUser.uid, sampleId);
    }
  }

  // --- MODELS ---
  public async getSavedModels(projectId?: string): Promise<SavedModel[]> {
    const store = await this.getStore('models', 'readonly');
    return new Promise((resolve, reject) => {
      if (projectId) {
        const index = store.index('projectId');
        const request = index.getAll(IDBKeyRange.only(projectId));
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      } else {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      }
    });
  }

  public async saveModel(model: SavedModel): Promise<void> {
    const store = await this.getStore('models', 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.put(model);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    const currentUser = auth.currentUser;
    if (currentUser) {
      await syncService.saveModel(currentUser.uid, model);
    }
  }

  public async deleteModel(modelId: string): Promise<void> {
    const store = await this.getStore('models', 'readwrite');
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(modelId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    const currentUser = auth.currentUser;
    if (currentUser) {
      await syncService.deleteModel(currentUser.uid, modelId);
    }
  }

  // --- LOGS ---
  public async getLogs(): Promise<SystemLog[]> {
    const store = await this.getStore('logs', 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const logs = request.result || [];
        resolve(logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
      };
      request.onerror = () => reject(request.error);
    });
  }

  public async addLog(type: 'info' | 'success' | 'warning' | 'error', message: string): Promise<void> {
    const store = await this.getStore('logs', 'readwrite');
    const log: SystemLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type,
      message,
    };
    return new Promise((resolve, reject) => {
      const request = store.put(log);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async clearLogs(): Promise<void> {
    const store = await this.getStore('logs', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // --- SYSTEM METRICS ---
  public async getStorageUsageMB(): Promise<number> {
    const db = await this.init();
    let totalBytes = 0;
    const storeNames = ['projects', 'labels', 'samples', 'models', 'logs'];

    for (const name of storeNames) {
      const store = db.transaction(name, 'readonly').objectStore(name);
      await new Promise<void>((resolve) => {
        const request = store.openCursor();
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
          if (cursor) {
            const size = JSON.stringify(cursor.value).length * 2; // Roughly 2 bytes per char in JS string
            totalBytes += size;
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = () => resolve(); // Ignore errors, return current sum
      });
    }

    return parseFloat((totalBytes / (1024 * 1024)).toFixed(2));
  }
}

export const dbService = new IndexedDBService();
