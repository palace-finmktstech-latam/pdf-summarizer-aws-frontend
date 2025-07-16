// src/App.js
import React from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';

function App() {
  const { user, signOut } = useAuthenticator((context) => [context.user]);

  return (
    <div>
      <h1>PDF Summarizer - AWS Version</h1>
      <h2>Welcome, {user.attributes.email}</h2>
      <button onClick={signOut}>Sign Out</button>
      <hr />
      <p>Your application content will go here.</p>
    </div>
  );
}

export default App;