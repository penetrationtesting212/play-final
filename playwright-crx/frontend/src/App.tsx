import React from 'react';
import ObjectRepository from './components/ObjectRepository';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>🎭 Playwright CRX</h1>
        <p>Object Repository & Page Object Model</p>
      </header>
      <main className="app-main">
        <ObjectRepository />
      </main>
    </div>
  );
}

export default App;
