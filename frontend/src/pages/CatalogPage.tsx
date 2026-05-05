import React, { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { searchAnime } from '../api/animeApi';
import { Anime } from '../types';

const GENRES = [
  'action', 'adventure', 'comedy', 'drama', 'fantasy', 'horror', 'mystery', 'romance', 
  'sci-fi', 'slice-of-life', 'sports', 'supernatural', 'thriller', 'ecchi', 'harem', 
  'mecha', 'music', 'parody', 'police', 'psychological', 'seinen', 'shoujo', 'shounen', 
  'space', 'vampire', 'yaoi', 'yuri', 'cars', 'demons', 'game', 'historical', 'josei', 
  'kids', 'magic', 'martial-arts', 'military', 'movie', 'onna', 'samurai', 'school', 
  'super-power', 'tv', 'visual-arts', 'dementia', 'hentai'
];

export default function CatalogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Anime[]>([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalRecords: 0 });
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    genre: '',
    year: '',
    type: '',
    status: '',
    order: '',
    letter: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadResults();
  }, [page, filters]);

  async function loadResults() {
    try {
      const data = await searchAnime('', page, filters);
      if (data.results) {
        setResults(data.results);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        setResults(data as any);
      }
    } catch (e) {
      console.error('Error loading catalog:', e);
    }
  }

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    setPage(1);
    loadResults();
  }

  function handleFilterChange(key: string, value: string) {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  }

  function clearFilters() {
    setFilters({
      genre: '',
      year: '',
      type: '',
      status: '',
      order: '',
      letter: ''
    });
    setSearchQuery('');
    setPage(1);
  }

  const getPageWindow = () => {
    const windowSize = 5;
    const { currentPage, totalPages } = pagination;
    let startPage = Math.max(1, currentPage - Math.floor(windowSize / 2));
    let endPage = startPage + windowSize - 1;
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - windowSize + 1);
    }
    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div style={{ paddingTop: '20px' }}>
      <button 
        onClick={() => navigate('/')}
        style={{
          margin: '0 50px 20px',
          padding: '10px 20px',
          background: 'var(--racing-celeste)',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        ← VOLVER AL INICIO
      </button>

      <div style={{
        background: 'var(--card-bg)',
        padding: '20px',
        borderRadius: '25px',
        border: '1px solid var(--border-color)',
        margin: '0 50px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyUp={(e) => e.key === 'Enter' && handleSearch(e)}
          placeholder="Búsqueda de anime..."
          style={{ 
            flex: 1, 
            minWidth: '200px', 
            padding: '12px 15px', 
            border: 'none', 
            outline: 'none', 
            background: 'transparent', 
            color: 'var(--text-color)', 
            fontSize: '14px', 
            fontWeight: 'bold' 
          }}
        />
        <button 
          onClick={handleSearch} 
          style={{
            padding: '12px 20px',
            border: 'none',
            borderRadius: '20px',
            background: 'var(--racing-celeste)',
            color: 'white',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >BUSCAR</button>
      </div>

      <div style={{
        padding: '0 50px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <h3 style={{ width: '100%', color: 'var(--racing-celeste)', marginBottom: '10px' }}>Filtros de Catálogo</h3>
        
        <select 
          value={filters.genre} 
          onChange={(e) => handleFilterChange('genre', e.target.value)} 
          style={{ padding: '8px 12px', borderRadius: '5px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-color)' }}
        >
          <option value="">Género</option>
          {GENRES.map(genre => (
            <option key={genre} value={genre}>{genre.charAt(0).toUpperCase() + genre.slice(1)}</option>
          ))}
        </select>

        <select 
          value={filters.year} 
          onChange={(e) => handleFilterChange('year', e.target.value)} 
          style={{ padding: '8px 12px', borderRadius: '5px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-color)' }}
        >
          <option value="">Año</option>
          {Array.from({ length: 37 }, (_, i) => 1990 + i).map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>

        <select 
          value={filters.type} 
          onChange={(e) => handleFilterChange('type', e.target.value)} 
          style={{ padding: '8px 12px', borderRadius: '5px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-color)' }}
        >
          <option value="">Tipo</option>
          <option value="TV">TV Anime</option>
          <option value="MOVIE">Película</option>
          <option value="OVA">OVA</option>
          <option value="SPECIAL">Especial</option>
        </select>

        <select 
          value={filters.status} 
          onChange={(e) => handleFilterChange('status', e.target.value)} 
          style={{ padding: '8px 12px', borderRadius: '5px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-color)' }}
        >
          <option value="">Estado</option>
          <option value="finished">Finalizado</option>
          <option value="airing">En emisión</option>
          <option value="upcoming">Próximamente</option>
        </select>

        <select 
          value={filters.order} 
          onChange={(e) => handleFilterChange('order', e.target.value)} 
          style={{ padding: '8px 12px', borderRadius: '5px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-color)' }}
        >
          <option value="">Ordenar por</option>
          <option value="updated">Más recientes</option>
          <option value="score">Mejor rating</option>
          <option value="members">Más populares</option>
        </select>

        <select 
          value={filters.letter} 
          onChange={(e) => handleFilterChange('letter', e.target.value)} 
          style={{ padding: '8px 12px', borderRadius: '5px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-color)' }}
        >
          <option value="">Letra A-Z</option>
          {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => (
            <option key={letter} value={letter}>{letter}</option>
          ))}
        </select>

        <button 
          onClick={clearFilters}
          style={{
            padding: '8px 15px',
            borderRadius: '5px',
            border: '1px solid var(--border-color)',
            background: 'transparent',
            color: 'var(--text-color)',
            cursor: 'pointer'
          }}
        >
          Limpiar filtros
        </button>
      </div>

      {pagination.totalRecords > 0 && (
        <div style={{ padding: '0 50px', color: 'var(--text-color)', marginBottom: '15px' }}>
          {pagination.totalRecords} resultados encontrados
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '20px',
        padding: '20px 50px'
      }}>
        {results.map((anime, i) => (
          <div 
            key={i} 
            onClick={() => navigate(`/anime/${anime.slug}`)}
            style={{
              background: 'var(--card-bg)',
              borderRadius: '10px',
              overflow: 'hidden',
              position: 'relative',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <img 
              src={anime.imagen} 
              alt={anime.titulo}
              loading="lazy"
              onError={(e) => { 
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x280?text=Sin+Imagen'; 
              }}
              style={{ width: '100%', height: '280px', objectFit: 'cover' }}
            />
            <div style={{ padding: '15px', textAlign: 'center', color: 'var(--text-color)' }}>
              <b>{anime.titulo}</b>
              {anime.anio && <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>{anime.anio}</div>}
              {anime.tipo && <div style={{ fontSize: '12px', opacity: 0.8 }}>{anime.tipo}</div>}
            </div>
          </div>
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '30px 20px' }}>
          {pagination.currentPage > 1 && (
            <button 
              onClick={() => setPage(pagination.currentPage - 1)} 
              style={{ 
                padding: '8px 12px', 
                borderRadius: '8px', 
                cursor: 'pointer',
                background: 'var(--card-bg)',
                color: 'var(--text-color)',
                border: '1px solid var(--border-color)'
              }}
            >{'<'}</button>
          )}

          {getPageWindow().map(p => (
            <button 
              key={p}
              onClick={() => setPage(p)}
              style={{
                minWidth: '40px',
                height: '40px',
                padding: '0 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: p === pagination.currentPage ? 'var(--racing-celeste)' : 'var(--card-bg)',
                color: p === pagination.currentPage ? 'white' : 'var(--text-color)',
                border: '1px solid var(--border-color)',
                fontWeight: p === pagination.currentPage ? 'bold' : 'normal'
              }}
            >
              {p}
            </button>
          ))}

          {pagination.currentPage < pagination.totalPages && (
            <button 
              onClick={() => setPage(pagination.currentPage + 1)} 
              style={{ 
                padding: '8px 12px', 
                borderRadius: '8px', 
                cursor: 'pointer',
                background: 'var(--card-bg)',
                color: 'var(--text-color)',
                border: '1px solid var(--border-color)',
                fontWeight: 'bold',
                minWidth: '50px'
              }}
            >{'>'}</button>
          )}

          {pagination.currentPage < pagination.totalPages && (
            <button 
              onClick={() => setPage(pagination.totalPages)} 
              style={{ 
                padding: '8px 12px', 
                borderRadius: '8px', 
                cursor: 'pointer',
                background: 'var(--card-bg)',
                color: 'var(--text-color)',
                border: '1px solid var(--border-color)',
                fontWeight: 'bold',
                minWidth: '50px'
              }}
            >{'>>'}</button>
          )}
        </div>
      )}
    </div>
  );
}
