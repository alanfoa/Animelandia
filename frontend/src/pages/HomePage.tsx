import React, { useState, useEffect } from 'react';
import { getLatest } from '../api/animeApi';

interface SimpleAnime {
  slug: string;
  titulo: string;
  imagen: string;
}

export default function HomePage() {
  const [animes, setAnimes] = useState<SimpleAnime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        console.log('Cargando latest...');
        const data = await getLatest();
        console.log('Datos recibidos:', data);
        setAnimes(data as SimpleAnime[]);
      } catch (e: any) {
        console.error('Error:', e);
        setError(e.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <p style={{ padding: '20px', color: 'black' }}>Cargando...</p>;
  if (error) return <p style={{ padding: '20px', color: 'red' }}>Error: {error}</p>;

  return (
    <div style={{ padding: '20px', color: 'black' }}>
      <h2>Últimos Estrenos</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
        {animes.map((anime, i) => (
          <div key={i} style={{ border: '1px solid #ccc', borderRadius: '10px', overflow: 'hidden' }}>
            <img src={anime.imagen} alt={anime.titulo} style={{ width: '100%', height: '250px', objectFit: 'cover' }} 
                 onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x250?text=Sin+Imagen'; }}
            />
            <div style={{ padding: '10px' }}>
              <b>{anime.titulo}</b>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
