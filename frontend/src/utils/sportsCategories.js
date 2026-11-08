import L from 'leaflet';

export const SPORTS_CATEGORIES = [
  { id: 'Futebol / Society', label: 'Futebol / Society', icon: '⚽', color: '#16a34a' },
  { id: 'Basquete / Street', label: 'Basquete / Street', icon: '🏀', color: '#ea580c' },
  { id: 'Pista de Skate', label: 'Pista de Skate / Pump Track', icon: '🛹', color: '#7c3aed' },
  { id: 'Beach Tennis', label: 'Beach Tennis / Vôlei de Areia', icon: '🎾', color: '#0284c7' },
  { id: 'Academia ao Ar Livre', label: 'Academia ao Ar Livre / Calistenia', icon: '🏋️', color: '#059669' },
  { id: 'Quadra Poliesportiva', label: 'Quadra Poliesportiva', icon: '🏟️', color: '#2563eb' },
  { id: 'Pista de Corrida', label: 'Pista de Corrida / Atletismo', icon: '🏃', color: '#dc2626' },
  { id: 'Outro', label: 'Outro Espaço Esportivo', icon: '📍', color: '#4b5563' }
];

export const getCategoryMeta = (categoryId) => {
  return SPORTS_CATEGORIES.find(c => c.id === categoryId) || {
    id: categoryId,
    label: categoryId,
    icon: '🏅',
    color: '#2563eb'
  };
};

// Cria um marcador estilizado e temático para o Leaflet
export const createCustomMarkerIcon = (category) => {
  const meta = getCategoryMeta(category);
  return L.divIcon({
    className: 'custom-sports-marker',
    html: `
      <div style="
        background-color: ${meta.color};
        width: 38px;
        height: 38px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        border: 2px solid white;
      ">
        <span style="
          transform: rotate(45deg);
          font-size: 18px;
        ">${meta.icon}</span>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38]
  });
};

// Marcador especial para a posição atual do usuário
export const createUserMarkerIcon = () => {
  return L.divIcon({
    className: 'user-marker',
    html: `
      <div style="position: relative; width: 28px; height: 28px;">
        <div class="user-pulse-ring" style="
          position: absolute;
          width: 36px;
          height: 36px;
          top: -4px;
          left: -4px;
          border-radius: 50%;
          background: rgba(37, 99, 235, 0.4);
        "></div>
        <div style="
          position: absolute;
          width: 24px;
          height: 24px;
          top: 2px;
          left: 2px;
          background: #2563eb;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
};
