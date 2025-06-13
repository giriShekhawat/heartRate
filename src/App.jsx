import { useState } from "react";

function App() {
  const [status, setStatus] = useState('Click the button to start monitoring.');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // This function will be called when the button is clicked
  const handleStartMonitoring = async () => {
    // 1. Reset state and start loading
    setIsLoading(true);
    setStatus('Initializing...');
    setResults(null);
    setError(null);

    try {
      // 2. Request camera permission to ensure the device is ready.
      // The track is stopped immediately as we only need the permission grant.
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
      console.log('[CAMERA] Access granted and tracks stopped');
      
      setStatus('Capturing data from the server...');

      // 3. Fetch the monitoring data from the local server
      const response = await fetch('http://localhost:5000/monitor');
      console.log('[FETCH] status', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      
      const json = await response.json();
      console.log('[DATA]', json);

      // 4. Validate the response and update the state with the results
      if (json?.status_code === 200) {
        const r = json.detail.results;
        setStatus(json.detail.message || 'Monitoring complete!');
        setResults(r);
        console.log('[UI] Rendered results.');
      } else {
        // Handle cases where the server responds but the data is invalid
        throw new Error('Monitoring failed. The data structure from the server was invalid.');
      }
    } catch (err) {
      // 5. Catch any errors during the process
      console.error('[ERROR]', err);
      // Create a user-friendly error message
      const friendlyError = err.message.includes('denied')
        ? 'Camera access is required to perform monitoring.'
        : `An error occurred: ${err.message}`;
      setError(friendlyError);
      setStatus('Monitoring failed. Please try again.');
    } finally {
      // 6. Stop the loading state regardless of success or failure
      setIsLoading(false);
    }
  };
  return (
<div className="heart-rate-monitor">
      <h1>Heart Rate Monitor</h1>
      <button 
        onClick={handleStartMonitoring} 
        disabled={isLoading}
      >
        {isLoading ? 'Monitoring...' : 'Start Monitoring'}
      </button>

      {/* Display Status and Errors */}
      <div className="status-container">
        <div id="status"><strong>Status:</strong> {status}</div>
        {error && <div className="error-message"><strong>Error:</strong> {error}</div>}
      </div>

      {/* Conditionally render the results only when they are available */}
      {results && (
        <div id="results" className="results-grid">
          <h3>Monitoring Results</h3>
          <div className="result-item"><strong>BPM:</strong> {results.bpm.toFixed(2)}</div>
          <div className="result-item"><strong>FFT BPM:</strong> {results.fft_bpm.toFixed(2)}</div>
          <div className="result-item"><strong>Peaks Found:</strong> {results.peaks_found}</div>
          <div className="result-item"><strong>Mean IBI:</strong> {results.mean_ibi.toFixed(2)} ms</div>
          <div className="result-item"><strong>SDNN:</strong> {results.sdnn.toFixed(2)} ms</div>
          <div className="result-item"><strong>Signal Quality:</strong> {results.signal_quality}%</div>
          <div className="result-item result-item-full"><strong>Peaks:</strong> {results.peaks.join(', ')}</div>
        </div>
      )}
    </div> )
 
}

export default App