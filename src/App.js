// src/App.js
import React, { useState } from 'react';
import './App.css';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth';

const APP_RUNNER_URL = 'https://p9pgmc7n2h.us-east-2.awsapprunner.com';

function App() {
  const { user, signOut } = useAuthenticator();
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // States for the full data pipeline display
  const [uploadStatus, setUploadStatus] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [pseudonymizedText, setPseudonymizedText] = useState('');
  const [llmOutputPseudonymized, setLlmOutputPseudonymized] = useState('');
  const [finalSummary, setFinalSummary] = useState('');

  const clearResults = () => {
    setError('');
    setUploadStatus('');
    setExtractedText('');
    setPseudonymizedText('');
    setLlmOutputPseudonymized('');
    setFinalSummary('');
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    clearResults();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      setError('Please select a PDF file first.');
      return;
    }
    clearResults();
    setLoading(true);
    setUploadStatus('Starting full process...');

    try {
      const { tokens } = await fetchAuthSession();
      const idToken = tokens.idToken.toString();

      // Step 1: Get Signed URL
      setUploadStatus('Requesting secure upload URL...');
      const signedUrlResponse = await fetch(`${APP_RUNNER_URL}/get-signed-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ fileName: selectedFile.name, contentType: selectedFile.type })
      });
      if (!signedUrlResponse.ok) throw new Error('Failed to get signed URL');
      const { signedUrl, objectName } = await signedUrlResponse.json();
      
      // Step 2: Upload to S3
      setUploadStatus(`Uploading file to S3...`);
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': selectedFile.type },
        body: selectedFile,
      });
      if (!uploadResponse.ok) throw new Error('Failed to upload file to S3');

      // Step 3: Call Final Summarize Endpoint
      setUploadStatus('Upload complete. Processing document...');
      const summarizeResponse = await fetch(`${APP_RUNNER_URL}/summarize-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ objectName: objectName })
      });
      if (!summarizeResponse.ok) {
        const errorData = await summarizeResponse.json();
        throw new Error(errorData.error || `Error processing document`);
      }

      // Populate all state variables from the final backend response
      const data = await summarizeResponse.json();
      setExtractedText(data.extracted_text);
      setPseudonymizedText(data.pseudonymized_text);
      setLlmOutputPseudonymized(data.llm_output_pseudonymized);
      setFinalSummary(data.final_summary);
      setUploadStatus('Process complete.');

    } catch (err) {
      console.error('Full process error:', err);
      setError(`Failed to process file: ${err.message}`);
      setUploadStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>PDF Summarizer - AWS Version</h1>
      <div className="user-info">
        <p>Logged in as: {user.signInDetails?.loginId}</p>
        <button onClick={signOut}>Sign Out</button>
      </div>

      <form onSubmit={handleSubmit}>
        <input type="file" accept=".pdf" onChange={handleFileChange} disabled={loading} />
        <button type="submit" disabled={!selectedFile || loading}>
          {loading ? 'Processing...' : 'Summarize PDF'}
        </button>
      </form>

      {uploadStatus && <p className="status-message">{uploadStatus}</p>}
      {error && <p className="error-message">Error: {error}</p>}

      {finalSummary && (
        <div className="pipeline-container">
          <div className="result-container">
            <h2>Extracted Text:</h2>
            <textarea readOnly value={extractedText} />
          </div>
          <div className="result-container">
            <h2>Pseudonymized Text (Sent to LLM):</h2>
            <textarea readOnly value={pseudonymizedText} />
          </div>
          <div className="result-container">
            <h2>Raw LLM Output (Contains Pseudonyms):</h2>
            <textarea readOnly value={llmOutputPseudonymized} />
          </div>
          <div className="result-container">
            <h2>Final Summary (Re-identified):</h2>
            <textarea readOnly value={finalSummary} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;