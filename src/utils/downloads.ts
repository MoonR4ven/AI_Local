// utils/downloads.ts
type ProgressCallback = (progress: number) => void;

interface DownloadEntry {
  progress: number;
  callbacks: ProgressCallback[];
  done: boolean;
}

const downloads: Record<string, DownloadEntry> = {};

export const startDownload = async (
  modelName: string,
  pullFn: (progressCb: (p: number) => void) => Promise<void>
) => {
  if (!downloads[modelName]) {
    downloads[modelName] = { progress: 0, callbacks: [], done: false };
  }

  const entry = downloads[modelName];

  const progressCb = (p: number) => {
    entry.progress = p;
    if (entry.callbacks) entry.callbacks.forEach(cb => cb(p));
  };

  try {
    await pullFn(progressCb);
    entry.progress = 100;
    entry.done = true;
    if (entry.callbacks) entry.callbacks.forEach(cb => cb(100));
  } catch (err) {
    entry.done = true;
    throw err;
  }
};

export const subscribeProgress = (modelName: string, cb: ProgressCallback) => {
  if (!downloads[modelName]) downloads[modelName] = { progress: 0, callbacks: [], done: false };
  downloads[modelName].callbacks.push(cb);

  // return unsubscribe function
  return () => {
    const entry = downloads[modelName];
    if (!entry) return;
    entry.callbacks = entry.callbacks.filter(f => f !== cb);
  };
};

export const getProgress = (modelName: string) => downloads[modelName]?.progress || 0;
export const isDownloading = (modelName: string) => !!downloads[modelName] && !downloads[modelName].done;
