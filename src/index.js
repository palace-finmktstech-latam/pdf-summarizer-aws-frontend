// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

// --- Temporarily hardcoding values for debugging ---
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'us-east-2_qtjXAzUbE',
      userPoolWebClientId: '5o3u2fir8n1a3rr55q83atjrq3',
    }
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Authenticator>
      <App />
    </Authenticator>
  </React.StrictMode>
);