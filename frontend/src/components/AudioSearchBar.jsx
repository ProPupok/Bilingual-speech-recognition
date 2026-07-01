import { useState, useEffect } from 'react';
import { colors, radius, focusRing } from '../theme';

function AudioSearchBar({ onSearch, style }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => onSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  return (
    <input
      className="audio-search-input"
      type="text"
      role="searchbox"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      placeholder="Поиск"
      aria-label="Поиск по названию аудиозаписи"
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = focusRing;
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
      style={{
        height: '48px',
        padding: '0 16px',
        backgroundColor: '#d9d9d9',
        border: 'none',
        borderRadius: radius.sm,
        fontSize: '18px',
        fontWeight: 'bold',
        fontFamily: 'system-ui, sans-serif',
        color: colors.text,
        boxSizing: 'border-box',
        outline: 'none',
        width: '100%',
        ...style,
      }}
    />
  );
}

export default AudioSearchBar;
