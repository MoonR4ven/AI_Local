export interface OllamaModel {
  name: string;
  size: string; // human-readable
  modified_at: string;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface DownloadableModel {
  name: string;
  size: string;
  description: string;
  requiredRAM: string;
  popularity: number;
  tags: string[];
}

export interface OllamaListResponse {
  models: OllamaModel[];
}

type ProgressCallback = (progress: number) => void;

interface DownloadEntry {
  progress: number;
  callbacks: ProgressCallback[];
  done: boolean;
}

class OllamaApi {
  private baseUrl: string;
  private downloads: Record<string, DownloadEntry> = {};

  constructor() {
    const settings = JSON.parse(localStorage.getItem('ollama-settings') || '{}');
    this.baseUrl = settings.apiUrl || 'http://localhost:11434';
  }

  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data: OllamaListResponse = await response.json();
      return data.models;
    } catch (error) {
      console.error('Failed to fetch installed models:', error);
      return [];
    }
  }

  async pullModel(modelName: string, onProgress?: ProgressCallback): Promise<void> {
    if (!this.downloads[modelName]) {
      this.downloads[modelName] = { progress: 0, callbacks: [], done: false };
    }
    const entry = this.downloads[modelName];

    if (onProgress) entry.callbacks.push(onProgress);

    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName, stream: true })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const reader = response.body?.getReader();
      if (!reader) return;

      let receivedLength = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        receivedLength += value?.length || 0;

        // Estimate progress
        entry.progress = Math.min(100, Math.round(receivedLength / 10000000));
        entry.callbacks.forEach(cb => cb(entry.progress));
      }

      entry.progress = 100;
      entry.done = true;
      entry.callbacks.forEach(cb => cb(100));
      entry.callbacks = [];
    } catch (err) {
      console.error('Failed to pull model:', err);
      throw err;
    }
  }

  getProgress(modelName: string) {
    return this.downloads[modelName]?.progress || 0;
  }

  isDownloading(modelName: string) {
    return !!this.downloads[modelName] && !this.downloads[modelName].done;
  }

  subscribeProgress(modelName: string, callback: ProgressCallback) {
    if (!this.downloads[modelName]) {
      this.downloads[modelName] = { progress: 0, callbacks: [], done: false };
    }
    this.downloads[modelName].callbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const entry = this.downloads[modelName];
      if (!entry) return;
      entry.callbacks = entry.callbacks.filter(cb => cb !== callback);
    };
  }

  async getAvailableModels(): Promise<DownloadableModel[]> {
    try {
      const models = await this.listModels();
      return models.map(model => ({
        name: model.name,
        size: model.details.parameter_size || 'Unknown',
        description: `Model from Ollama: ${model.name}`,
        requiredRAM: 'Unknown',
        popularity: 50,
        tags: [model.details.family || 'general']
      }));
    } catch (err) {
      console.error('Failed to fetch available models:', err);
      return [];
    }
  }
}

export const ollamaApi = new OllamaApi();
