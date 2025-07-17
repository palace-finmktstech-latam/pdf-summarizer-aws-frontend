// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

// Replace with your actual values
const config = {
  Auth: {
    Cognito: {
      userPoolId: 'us-east-2_qtjXAzUbE', // Your actual User Pool ID
      userPoolClientId: '5o3u2fir8n1a3rr55q83atjrq3', // Your actual Client ID
    }
  }
};

console.log('Config being used:', config);

Amplify.configure(config);

function App() {
  return (
    <div>
      <h1>Test App</h1>
      <p>If you see this, auth is working!</p>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Authenticator>
      <App />
    </Authenticator>
  </React.StrictMode>
);