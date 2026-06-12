import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Analyzing Scene...');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const worker = useRef(null);

  const processFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult('');
    } else {
      alert("Please upload a valid image file.");
    }
  };

  const handleImageChange = (e) => processFile(e.target.files[0]);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processFile(e.dataTransfer.files[0]);
  };
  
  const resetApp = () => {
    setImage(null);
    setPreviewUrl(null);
    setResult('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image || !previewUrl) return;

    setLoading(true);
    setResult('');
    setLoadingMessage('Initializing AI Model...');

    worker.current.postMessage({
      imageUrl: previewUrl
    });
  };

  useEffect(() => {
    if (!worker.current) {
      worker.current = new Worker(new URL('./worker.js', import.meta.url), {
        type: 'module'
      });
      
      worker.current.addEventListener('message', (e) => {
        const data = e.data;
        if (data.status === 'loading') {
          setLoadingMessage(data.message);
        } else if (data.status === 'progress') {
          if (data.data && data.data.status === 'progress') {
            setDownloadProgress(Math.round(data.data.progress));
            setLoadingMessage(`Downloading AI Model (${Math.round(data.data.progress)}%)...`);
          }
        } else if (data.status === 'analyzing') {
          setLoadingMessage(data.message);
        } else if (data.status === 'complete') {
          setResult(data.result);
          setLoading(false);
          setDownloadProgress(0);
        } else if (data.status === 'error') {
          console.error("Worker Error:", data.error);
          setResult(`Error: ${data.error}`);
          setLoading(false);
          setDownloadProgress(0);
        }
      });
    }

    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <>
      {/* Background Aurora Orbs */}
      <div className="aurora-bg">
        <div className="aurora-blob blob-1"></div>
        <div className="aurora-blob blob-2"></div>
      </div>

      <div className="main-wrapper">
        <div className="app-container">
          <div className="header">
            <h1>Vision AI</h1>
            <p>High-fidelity neural network image analysis.</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            {!previewUrl ? (
              <div 
                className={`drop-zone ${isDragging ? 'active' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif" 
                  onChange={handleImageChange} 
                  className="file-input"
                />
                <span className="drop-zone-icon">✨</span>
                <div style={{ color: '#cbd5e1', fontWeight: 500 }}>
                  Click or drag an image here
                </div>
              </div>
            ) : (
              <div className="image-preview-container">
                <img src={previewUrl} alt="Preview" className="image-preview" />
              </div>
            )}

            <button 
              type="submit" 
              className="analyze-btn"
              disabled={!image || loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  {loadingMessage}
                </>
              ) : (
                'Analyze Image'
              )}
            </button>
          </form>

          {result && (
            <>
              <div className="result-card">
                <h3>Analysis Result</h3>
                <p>{result}</p>
              </div>
              <button onClick={resetApp} className="reset-btn">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                  <path d="M3 3v5h5"></path>
                </svg>
                Analyze Another Image
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default App;