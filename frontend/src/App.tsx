import React from 'react';
import HomePage from './pages/HomePage';

export default function App() {
  console.log('App rendering with HomePage...');
  return (
    <div style={{ minHeight: '100vh', background: 'white', color: 'black' }}>
      <HomePage />
    </div>
  );
}
