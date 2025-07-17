// src/App.jsx
import React from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';

function App() {
  const { user, signOut } = useAuthenticator();

  // --- Add this line for debugging ---
  console.log("User Object:", user);
  // ------------------------------------

  return (
    <div>
      <h1>PDF Summarizer - AWS Version</h1>

      {user ? (
        <div>
          <h2>Welcome, {user.attributes?.email}</h2>
          <button onClick={signOut}>Sign Out</button>
        </div>
      ) : (
        <p>Please sign in to continue.</p>
      )}

      <hr />
      <p>Your application content will go here.</p>
    </div>
  );
}

export default App;