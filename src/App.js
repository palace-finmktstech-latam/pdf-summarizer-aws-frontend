// src/App.js
import React, { useState } from 'react';
import './App.css'; // Assuming you have some basic styles
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth';

// IMPORTANT: Replace with the actual URL of your deployed App Runner service
const APP_RUNNER_URL = 'https://p9pgmc7n2h.us-east-2.awsapprunner.com';

function App() {
  const { user, signOut } = useAuthenticator();
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State to show the results, similar to your GCP version
  const [uploadStatus, setUploadStatus] = useState('');
  const [summaryResult, setSummaryResult] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [redactedText, setRedactedText] = useState('');
  const [pseudonymizedText, setPseudonymizedText] = useState('');


  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setError('');
    setUploadStatus('');
    setSummaryResult('');
    setExtractedText('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      setError('Please select a PDF file first.');
      return;
    }
    if (!user) {
      setError('You must be logged in to upload a PDF.');
      return;
    }

    setLoading(true);
    setError('');
    setUploadStatus('Starting process...');
    setExtractedText(''); // Clear previous results

    try {
      const { tokens } = await fetchAuthSession();
      const idToken = tokens.idToken.toString();

      // --- STEP 1: Get Signed URL from our AWS Backend ---
      setUploadStatus('Requesting secure upload URL...');
      const signedUrlResponse = await fetch(`${APP_RUNNER_URL}/get-signed-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          fileName: selectedFile.name,
          contentType: selectedFile.type
        })
      });

      if (!signedUrlResponse.ok) {
        const errorData = await signedUrlResponse.json();
        throw new Error(errorData.error || `Error getting signed URL`);
      }
      const { signedUrl, objectName } = await signedUrlResponse.json();
      
      // --- STEP 2: Directly Upload PDF to S3 using the Signed URL ---
      setUploadStatus(`Uploading file to S3 as: ${objectName}`);
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': selectedFile.type,
        },
        body: selectedFile,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload file to S3.`);
      }

      // --- STEP 3: Call Summarize Endpoint to Extract Text ---
      setUploadStatus('Upload complete. Extracting text from backend...');
      const summarizeResponse = await fetch(`${APP_RUNNER_URL}/summarize-pdf`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ objectName: objectName })
      });

      if (!summarizeResponse.ok) {
        const errorData = await summarizeResponse.json();
        throw new Error(errorData.error || `Error extracting text`);
      }

      const data = await summarizeResponse.json();
      setExtractedText(data.extracted_text);
      setRedactedText(data.redacted_text);
      setPseudonymizedText(data.pseudonymized_text);
      setUploadStatus('Text extracted and redacted successfully.');

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
        {/* The user object from the hook contains signInDetails */}
        <p>Logged in as: {user.signInDetails?.loginId}</p>
        <button onClick={signOut}>Sign Out</button>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          disabled={loading}
        />
        <button type="submit" disabled={!selectedFile || loading}>
          {loading ? 'Processing...' : 'Upload PDF'}
        </button>
      </form>

      {extractedText && (
        <div className="result-container">
          <h2>Extracted Text:</h2>
          <textarea readOnly value={extractedText} />
        </div>
      )}
      
      {redactedText && (
        <div className="result-container">
          <h2>Redacted Text (from Comprehend):</h2>
          <textarea readOnly value={redactedText} />
        </div>
      )}

      {pseudonymizedText && (
        <div className="result-container">
          <h2>Pseudonymized Text:</h2>
          <textarea readOnly value={pseudonymizedText} />
        </div>
      )}

      {error && <p className="error-message">Error: {error}</p>}
      {uploadStatus && <p className="status-message">{uploadStatus}</p>}
      {summaryResult && <p className="summary-result">{summaryResult}</p>}

    </div>
  );
}

export default App;