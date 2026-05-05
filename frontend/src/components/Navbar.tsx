import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export function Navbar() {
  const { toggleTheme } = useTheme();
  
  return (
    <nav style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      zIndex: 1000, 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '10px 20px', 
      background: 'var(--navbar-bg)', 
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)' 
    }}>
      {/* Left: Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Link to="/" className="nav-logo">
          <img src="/assets/img/Logo.png" alt="Logo" style={{ height: '50px' }} />
        </Link>
      </div>

      {/* Right: Menu buttons */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Link 
          to="/catalog" 
          style={{ 
            padding: '8px 15px', 
            border: 'none', 
            borderRadius: '20px', 
            background: 'var(--racing-celeste)', 
            color: 'white', 
            cursor: 'pointer', 
            textDecoration: 'none' 
          }}
        >
          CATALOGO
        </Link>
        <a 
          href="/#seccion-favoritos" 
          style={{ 
            padding: '8px 15px', 
            border: 'none', 
            borderRadius: '20px', 
            background: 'var(--racing-celeste)', 
            color: 'white', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '5px', 
            textDecoration: 'none' 
          }}
        >
          <svg viewBox="0 0 24 36" style={{ width: '16px', height: '24px', verticalAlign: 'middle' }}>
            <path fill="#FFB800" stroke="#FFB800" strokeWidth="2" strokeLinejoin="round" d="M5,2 L19,2 Q22,2 22,5 L22,28 L12,34 L2,28 L2,5 Q2,2 5,2 Z" />
            <path fill="#FFF" stroke="none" strokeWidth="2" strokeLinejoin="round" d="M12,10 L14,13 L18,14 L15,16 L16,20 L12,18 L8,20 L9,16 L6,14 L10,13 Z" />
          </svg>
        </a>
        <div 
          onClick={toggleTheme} 
          style={{ 
            width: '50px', 
            height: '26px', 
            borderRadius: '13px', 
            background: '#ccc', 
            position: 'relative', 
            cursor: 'pointer' 
          }}
        >
          <div style={{ 
            position: 'absolute', 
            top: '3px', 
            left: 'calc(100% - 30px)', 
            width: '20px', 
            height: '20px', 
            borderRadius: '50%', 
            background: 'white', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>🌙</div>
        </div>
      </div>
    </nav>
  );
}
