import { useState, useEffect } from 'react';
import { DownloadableModel } from '../types';
import { ollamaApi } from '../utils/ollamaApi';
import { Download, X, Search, Filter, RefreshCw, Trash2 } from 'lucide-react';
import { startDownload, subscribeProgress, getProgress } from '../utils/downloads';

interface ModelDownloadProps {
  isOpen: boolean;
  onClose: () => void;
  onModelDownloaded: () => void;
}

export const ModelDownload: React.FC<ModelDownloadProps> = ({ isOpen, onClose, onModelDownloaded }) => {
  const [availableModels, setAvailableModels] = useState<DownloadableModel[]>([]);
  const [installedModels, setInstalledModels] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ [key: string]: number }>({});
  const [customModelName, setCustomModelName] = useState<string>('');

  // Global downloads handled by ollamaApi
  const [downloadingModels, setDownloadingModels] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) loadModels();
    // subscribe to global progress updates
    const interval = setInterval(() => {
      const newProgress: { [key: string]: number } = {};
      downloadingModels.forEach(name => {
        newProgress[name] = ollamaApi.getProgress(name) || 0;
      });
      setProgress(newProgress);
    }, 500);

    return () => clearInterval(interval);
  }, [isOpen, downloadingModels]);

  const loadModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const installed = await ollamaApi.listModels();
      setInstalledModels(installed.map(m => m.name));
      const available = await ollamaApi.getAvailableModels();
      setAvailableModels(available);
    } catch (err) {
      setError('Failed to load models. Make sure Ollama is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

const handleDownloadModel = async (modelName: string) => {
  if (!modelName || downloadingModels.includes(modelName)) return;

  setDownloadingModels(prev => [...prev, modelName]);
  setProgress(prev => ({ ...prev, [modelName]: 0 }));

  // subscribe to progress updates
  const unsubscribe = subscribeProgress(modelName, (p) => {
    setProgress(prev => ({ ...prev, [modelName]: Math.round(p) }));
  });

  try {
    await startDownload(modelName, (progressCb) =>
      ollamaApi.pullModel(modelName, progressCb)
    );

    const installed = await ollamaApi.listModels();
    setInstalledModels(installed.map(m => m.name));
    onModelDownloaded();
  } catch (err) {
    setError(`Failed to download model: ${err instanceof Error ? err.message : 'Unknown error'}`);
  } finally {
    setDownloadingModels(prev => prev.filter(name => name !== modelName));
    unsubscribe();
  }
};

  const handleDeleteModel = async (modelName: string) => {
    try {
      await ollamaApi.deleteModel(modelName);
      const installed = await ollamaApi.listModels();
      setInstalledModels(installed.map(m => m.name));
    } catch (err) {
      setError(`Failed to delete model: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const allTags = ['all', ...new Set(availableModels.flatMap(m => m.tags))];
  const filteredModels = availableModels.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag === 'all' || m.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Download Models</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={loadModels}
              disabled={loading}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
              title="Refresh models"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-100 border-b border-red-200 dark:bg-red-900/20 dark:border-red-800">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Custom model input */}
        <div className="p-4 border-b dark:border-gray-700 flex gap-2 items-center">
          <input
            type="text"
            placeholder="Paste model name here..."
            value={customModelName}
            onChange={e => setCustomModelName(e.target.value)}
            className="flex-1 pl-3 pr-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button
            onClick={() => handleDownloadModel(customModelName)}
            disabled={!customModelName || downloadingModels.includes(customModelName)}
            className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
          >
            {downloadingModels.includes(customModelName) ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{progress[customModelName] || 0}%</span>
              </div>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" /> Download
              </>
            )}
          </button>
          <button
            onClick={() => window.open('https://ollama.com/search', '_blank')}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            List Available Here
          </button>
        </div>

        {/* Search & Filter */}
        <div className="p-4 border-b dark:border-gray-700">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search models..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${selectedTag === tag
                  ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Models List */}
        <div className="overflow-y-auto max-h-[calc(90vh-220px)] p-4">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-500">Loading models...</span>
            </div>
          ) : filteredModels.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No models found</p>
          ) : (
            <div className="space-y-3">
              {filteredModels.map(model => {
                const isDownloaded = installedModels.includes(model.name);
                const isDownloading = downloadingModels.includes(model.name);
                return (
                  <div key={model.name} className="p-4 rounded-lg border dark:border-gray-700">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">{model.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{model.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                          <span>{model.size}</span>
                          <span>•</span>
                          <span>RAM: {model.requiredRAM}</span>
                          <span>•</span>
                          <span>Popularity: {model.popularity}%</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {model.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs dark:bg-gray-700 dark:text-gray-300">{tag}</span>
                          ))}
                        </div>

                        {isDownloading && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-600">
                              <div
                                className="bg-primary-600 h-2 rounded-full transition-all"
                                style={{ width: `${progress[model.name] || 0}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">{progress[model.name] || 0}%</span>
                          </div>
                        )}
                      </div>

                      <div className="ml-4 flex flex-col gap-2">
                        {isDownloaded ? (
                          <>
                            <button onClick={() => handleDeleteModel(model.name)}
                              className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-xs">
                              <Trash2 className="w-4 h-4 mr-1" /> Delete
                            </button>
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs dark:bg-green-900 dark:text-green-200">
                              Installed
                            </span>
                          </>
                        ) : (
                          <button
                            onClick={() => handleDownloadModel(model.name)}
                            disabled={isDownloading}
                            className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                          >
                            {isDownloading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Downloading...
                              </>
                            ) : (
                              <>
                                <Download className="w-4 h-4 mr-2" /> Download
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
