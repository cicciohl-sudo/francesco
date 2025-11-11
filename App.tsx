
import React, { useState, useCallback, useRef } from 'react';
import { processImage } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { UploadIcon, SparklesIcon, SpinnerIcon, DownloadIcon, ErrorIcon } from './components/Icons';

const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit for inline data
        setError("File is too large. Please upload an image under 4MB.");
        return;
      }
      setImageFile(file);
      setProcessedImageUrl(null);
      setError(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcessImage = useCallback(async () => {
    if (!imageFile || isLoading) return;

    setIsLoading(true);
    setError(null);
    setProcessedImageUrl(null);

    try {
      const base64Data = await fileToBase64(imageFile);
      const mimeType = imageFile.type;

      const resultBase64 = await processImage(base64Data, mimeType);
      
      if (resultBase64) {
        setProcessedImageUrl(`data:${mimeType};base64,${resultBase64}`);
      } else {
        throw new Error("The AI model did not return an image. Please try again with a different image.");
      }

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, isLoading]);

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const getFileBaseName = () => {
    if (!imageFile) return 'processed_image.png';
    const name = imageFile.name;
    const lastDot = name.lastIndexOf('.');
    return `${name.substring(0, lastDot)}_spotlight.png`;
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Sign Spotlight AI
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-400">
            Carica una foto e la nostra IA metterà in risalto l'insegna, convertendo il resto in bianco e nero.
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-gray-800/50 rounded-2xl p-6 shadow-lg border border-gray-700 flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold text-gray-200 mb-4 self-start">1. Carica la tua immagine</h2>
            <div 
              className="w-full h-80 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-gray-800 transition-all duration-300"
              onClick={triggerFileSelect}
            >
              <input 
                type="file" 
                accept="image/png, image/jpeg, image/webp"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden" 
              />
              {previewUrl ? (
                <img src={previewUrl} alt="Anteprima" className="max-w-full max-h-full object-contain rounded-md" />
              ) : (
                <div className="text-center text-gray-500">
                  <UploadIcon className="w-12 h-12 mx-auto mb-2" />
                  <p>Clicca per caricare o trascina un'immagine</p>
                  <p className="text-sm">PNG, JPG, WEBP (max 4MB)</p>
                </div>
              )}
            </div>
            <button 
              onClick={handleProcessImage}
              disabled={!imageFile || isLoading}
              className="mt-6 w-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
            >
              {isLoading ? (
                <>
                  <SpinnerIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                  Elaborazione in corso...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  Applica Effetto Spotlight
                </>
              )}
            </button>
          </div>

          {/* Output Section */}
          <div className="bg-gray-800/50 rounded-2xl p-6 shadow-lg border border-gray-700 flex flex-col items-center justify-center min-h-[460px]">
            <h2 className="text-2xl font-bold text-gray-200 mb-4 self-start">2. Risultato</h2>
            <div className="w-full h-80 flex items-center justify-center rounded-lg bg-gray-900/50">
              {isLoading && (
                <div className="text-center text-gray-400">
                  <SpinnerIcon className="w-12 h-12 mx-auto animate-spin mb-4" />
                  <p className="text-lg">L'IA sta analizzando l'immagine...</p>
                  <p className="text-sm">Potrebbe richiedere qualche secondo.</p>
                </div>
              )}
              {error && (
                 <div className="text-center text-red-400 p-4 bg-red-900/50 rounded-lg">
                  <ErrorIcon className="w-12 h-12 mx-auto mb-2" />
                  <p className="font-bold">Oops! Qualcosa è andato storto.</p>
                  <p className="text-sm">{error}</p>
                </div>
              )}
              {!isLoading && !error && processedImageUrl && (
                <img src={processedImageUrl} alt="Immagine processata" className="max-w-full max-h-full object-contain rounded-md" />
              )}
              {!isLoading && !error && !processedImageUrl && (
                 <div className="text-center text-gray-500">
                    <p>Il risultato apparirà qui.</p>
                 </div>
              )}
            </div>
            {processedImageUrl && !isLoading && (
              <a 
                href={processedImageUrl}
                download={getFileBaseName()}
                className="mt-6 w-full flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
              >
                <DownloadIcon className="w-5 h-5 mr-2" />
                Scarica Immagine
              </a>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
