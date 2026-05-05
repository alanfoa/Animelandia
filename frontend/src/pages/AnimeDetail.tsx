import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAnimeInfo, getVideoServers } from '../api/animeApi';
import { AnimeInfo, VideoServer } from '../types';
import { FavoriteIcon } from '../components/FavoriteIcon';

export default function AnimeDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [anime, setAnime] = useState<AnimeInfo | null>(null);
  const [favorites, setFavorites] = useState<{ slug: string; titulo: string; imagen: string }[]>(() => {
    const saved = localStorage.getItem('misAnimes');
    return saved ? JSON.parse(saved) : [];
  });
  const [allEpisodes, setAllEpisodes] = useState<{ numero: number; titulo: string; thumbnail: string }[]>([]);
  const [capsPage, setCapsPage] = useState(1);
  const [epSearch, setEpSearch] = useState('');
  const capsPerPage = 12;
  const [videoServers, setVideoServers] = useState<VideoServer[]>([]);
  const [selectedServer, setSelectedServer] = useState('');
  const [selectedEpisode, setSelectedEpisode] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (slug) loadAnimeInfo(slug);
  }, [slug]);

  useEffect(() => {
    localStorage.setItem('misAnimes', JSON.stringify(favorites));
  }, [favorites]);

  async function loadAnimeInfo(slug: string) {
    try {
      const data = await getAnimeInfo(slug);
      setAnime(data);
      setAllEpisodes(data.episodios || []);
    } catch (e) {
      console.error('Error loading anime info:', e);
    }
  }

  async function loadVideoServers(numero: number) {
    if (!slug) return;
    setSelectedEpisode(numero);
    try {
      const response = await getVideoServers(slug, numero.toString());
      setVideoServers(response.servers || []);
      if (response.servers && response.servers.length > 0) {
        setSelectedServer(response.servers[0].url);
      }
    } catch (e) {
      console.error('Error loading video servers:', e);
    }
  }

  function toggleFavorite() {
    if (!anime || !slug) return;
    const newFav = { slug, titulo: anime.titulo || 'Anime', imagen: anime.imagen || '' };
    setFavorites(prev => {
      const exists = prev.some(f => f.slug === slug);
      if (exists) {
        return prev.filter(f => f.slug !== slug);
      } else {
        return [...prev, newFav];
      }
    });
  }

  // Filter episodes by search
  const filteredEpisodes = epSearch.trim()
    ? allEpisodes.filter(ep => 
        ep.titulo?.toLowerCase().includes(epSearch.toLowerCase()) ||
        ep.numero.toString().includes(epSearch)
      )
    : allEpisodes;

  const totalPages = Math.ceil(filteredEpisodes.length / capsPerPage);
  const start = (capsPage - 1) * capsPerPage;
  const end = start + capsPerPage;
  const slice = filteredEpisodes.slice(start, end);

  // Sliding window pagination (5 buttons)
  const getPageWindow = () => {
    const windowSize = 5;
    let startPage = Math.max(1, capsPage - Math.floor(windowSize / 2));
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

  if (!anime) return <div style={{ padding: '20px', color: 'var(--text-color)', textAlign: 'center', marginTop: '100px' }}>Cargando...</div>;

  const isFav = favorites.some(f => f.slug === slug);

  return (
    <div style={{ maxWidth: '1100px', margin: '20px auto 0', padding: '0 20px' }}>
      {/* Back Button */}
      <button 
        onClick={() => navigate('/')}
        style={{
          padding: '10px 20px',
          background: 'var(--racing-celeste)',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        ← VOLVER AL INICIO
      </button>

      {/* Anime Info Card */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {/* Cover Image with Favorite Button */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img 
            src={anime.imagen || '/assets/img/Logo.png'} 
            alt={anime.titulo}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/img/Logo.png';
            }}
            style={{ width: '300px', borderRadius: '10px', objectFit: 'cover' }}
          />
          <button 
            onClick={toggleFavorite}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              zIndex: 30
            }}
          >
            <FavoriteIcon isActive={isFav} />
          </button>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h1 style={{ color: 'var(--text-color)', margin: '0 0 15px 0' }}>{anime.titulo || 'Anime'}</h1>
          
          {/* Tags: Rating, Year, Type, Genres */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Rating */}
            <div style={{ 
              background: '#FFF', 
              color: '#000', 
              padding: '5px 12px', 
              borderRadius: '15px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '5px',
              fontWeight: 'bold',
              transition: 'transform 0.2s',
              cursor: 'default'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              ⭐ {anime.rating || '0.0'}
            </div>

            {/* Year */}
            {anime.anio && (
              <div style={{ 
                background: '#e0e0e0', 
                color: '#333', 
                padding: '5px 12px', 
                borderRadius: '15px', 
                fontSize: '12px',
                fontWeight: 'bold',
                transition: 'all 0.2s',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.08)';
                e.currentTarget.style.background = '#007b9a';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = '#e0e0e0';
                e.currentTarget.style.color = '#333';
              }}
              >
                {anime.anio}
              </div>
            )}

            {/* Type (TV Anime, Película, OVA, Especial) */}
            {anime.tipo && (
              <div style={{ 
                background: '#e0e0e0', 
                color: '#333', 
                padding: '5px 12px', 
                borderRadius: '15px', 
                fontSize: '12px',
                fontWeight: 'bold',
                transition: 'all 0.2s',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.08)';
                e.currentTarget.style.background = '#3d1f7a';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = '#e0e0e0';
                e.currentTarget.style.color = '#333';
              }}
              >
                {anime.tipo}
              </div>
            )}

            {/* Genres */}
            {anime.generos?.map((genre, i) => (
              <span 
                key={i} 
                style={{ 
                  background: '#e0e0e0', 
                  color: '#333', 
                  padding: '5px 12px', 
                  borderRadius: '15px', 
                  fontSize: '12px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s',
                  cursor: 'default'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.08)';
                  e.currentTarget.style.background = '#a0a0a0';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = '#e0e0e0';
                  e.currentTarget.style.color = '#333';
                }}
              >
                {genre}
              </span>
            ))}
          </div>

          {/* Description */}
          <p style={{ color: 'var(--text-color)', lineHeight: '1.6' }}>{anime.descripcion || 'Sin descripción.'}</p>
        </div>
      </div>

      {/* Video Player Section */}
      {selectedServer && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ color: 'var(--racing-celeste)', marginBottom: '15px' }}>Reproduciendo Episodio {selectedEpisode}</h3>
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '10px' }}>
            <iframe 
              src={selectedServer} 
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              allowFullScreen
              title="Video Player"
            />
          </div>
          {/* Server Selection */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
            {videoServers.map((server, i) => (
              <button
                key={i}
                onClick={() => setSelectedServer(server.url)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '5px',
                  border: 'none',
                  cursor: 'pointer',
                  background: selectedServer === server.url ? 'var(--racing-celeste)' : 'var(--card-bg)',
                  color: selectedServer === server.url ? 'white' : 'var(--text-color)',
                  fontWeight: selectedServer === server.url ? 'bold' : 'normal'
                }}
              >
                Servidor {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Episode Search */}
      <div style={{ marginTop: '30px', marginBottom: '15px' }}>
        <input 
          type="text"
          placeholder="Buscar episodio..."
          value={epSearch}
          onChange={(e) => { setEpSearch(e.target.value); setCapsPage(1); }}
          style={{
            padding: '10px 15px',
            borderRadius: '5px',
            border: '1px solid var(--border-color)',
            background: 'var(--card-bg)',
            color: 'var(--text-color)',
            width: '300px',
            maxWidth: '100%'
          }}
        />
      </div>

      {/* Episode List */}
      <h3 style={{ color: 'var(--racing-celeste)', margin: '30px 0 15px 0' }}>Lista de Episodios</h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '15px'
      }}>
        {slice.map((ep, i) => (
          <div 
            key={i} 
            onClick={() => loadVideoServers(ep.numero)}
            style={{
              background: 'var(--card-bg)',
              borderRadius: '10px',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              border: selectedEpisode === ep.numero ? '2px solid var(--racing-celeste)' : '2px solid transparent'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <img 
              src={ep.thumbnail} 
              alt={`Episodio ${ep.numero}`}
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200x150?text=Sin+Imagen';
              }}
              style={{ width: '100%', height: '150px', objectFit: 'cover' }}
            />
            <div style={{ padding: '10px', textAlign: 'center', color: 'var(--text-color)' }}>
              Episodio {ep.numero}
              {ep.titulo && <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>{ep.titulo}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination - Sliding Window */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '30px 20px' }}>
          {/* Previous button */}
          {capsPage > 1 && (
            <button 
              onClick={() => setCapsPage(capsPage - 1)} 
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

          {/* Page window (5 buttons) */}
          {getPageWindow().map(page => (
            <button 
              key={page}
              onClick={() => setCapsPage(page)}
              style={{
                minWidth: '40px',
                height: '40px',
                padding: '0 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: page === capsPage ? 'var(--racing-celeste)' : 'var(--card-bg)',
                color: page === capsPage ? 'white' : 'var(--text-color)',
                border: '1px solid var(--border-color)',
                fontWeight: page === capsPage ? 'bold' : 'normal'
              }}
            >
              {page}
            </button>
          ))}

          {/* Next button */}
          {capsPage < totalPages && (
            <button 
              onClick={() => setCapsPage(capsPage + 1)} 
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

          {/* Last page button */}
          {capsPage < totalPages && (
            <button 
              onClick={() => setCapsPage(totalPages)} 
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

      {/* Favorites Section */}
      <h3 style={{ color: 'var(--racing-celeste)', borderBottom: '2px solid var(--border-color)', paddingBottom: '10px', marginTop: '50px' }}>
        Mis Favoritos
        <FavoriteIcon isActive={true} />
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '15px',
        marginBottom: '50px'
      }}>
        {favorites.map((anime, i) => (
          <div 
            key={i} 
            onClick={() => navigate(`/anime/${anime.slug}`)}
            style={{
              background: 'var(--card-bg)',
              borderRadius: '10px',
              overflow: 'hidden',
              position: 'relative',
              cursor: 'pointer'
            }}
          >
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setFavorites(prev => prev.filter((_, idx) => idx !== i));
              }}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'none',
                border: 'none',
                padding: '4px',
                cursor: 'pointer',
                zIndex: 30
              }}
            >
              <FavoriteIcon isActive={true} />
            </button>
            <img 
              src={anime.imagen} 
              alt={anime.titulo}
              style={{ width: '100%', height: '280px', objectFit: 'cover' }}
            />
            <div style={{ padding: '15px', textAlign: 'center', color: 'var(--text-color)' }}>
              <b>{anime.titulo}</b>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
