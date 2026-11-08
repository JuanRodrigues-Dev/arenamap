import L from 'leaflet';

export const SPORTS_CATEGORIES = [
  { id: 'Futebol / Society', label: 'Futebol / Society', color: '#16a34a', initial: 'FUT' },
  { id: 'Basquete / Street', label: 'Basquete / Street', color: '#ea580c', initial: 'BAS' },
  { id: 'Pista de Skate', label: 'Pista de Skate / Pump Track', color: '#7c3aed', initial: 'SKT' },
  { id: 'Beach Tennis', label: 'Beach Tennis / Vôlei de Areia', color: '#0284c7', initial: 'ARE' },
  { id: 'Academia ao Ar Livre', label: 'Academia ao Ar Livre / Calistenia', color: '#059669', initial: 'ACA' },
  { id: 'Quadra Poliesportiva', label: 'Quadra Poliesportiva', color: '#2563eb', initial: 'POL' },
  { id: 'Pista de Corrida', label: 'Pista de Corrida / Atletismo', color: '#dc2626', initial: 'COR' },
  { id: 'Outro', label: 'Outro', color: '#4b5563', initial: 'ESP' }
];

export const getCategoryMeta = (categoryId) => {
  return SPORTS_CATEGORIES.find(c => c.id === categoryId) || {
    id: categoryId,
    label: categoryId,
    color: '#2563eb',
    initial: 'ESP'
  };
};

// Marcador limpo, moderno e profissional (sem emojis)
export const createCustomMarkerIcon = (category, isSelected = false) => {
  const meta = getCategoryMeta(category);
  const size = isSelected ? 42 : 34;
  const borderWidth = isSelected ? 3 : 2;

  return L.divIcon({
    className: 'custom-sports-marker',
    html: `
      <div style="
        background-color: ${meta.color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.35);
        border: ${borderWidth}px solid ${isSelected ? '#fbbf24' : '#ffffff'};
        transition: transform 0.2s ease;
      ">
        <span style="
          transform: rotate(45deg);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: #ffffff;
        ">${meta.initial}</span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size]
  });
};

// Marcador da posição atual do usuário
export const createUserMarkerIcon = () => {
  return L.divIcon({
    className: 'user-marker',
    html: `
      <div style="position: relative; width: 30px; height: 30px;">
        <div class="user-pulse-ring" style="
          position: absolute;
          width: 38px;
          height: 38px;
          top: -4px;
          left: -4px;
          border-radius: 50%;
          background: rgba(37, 99, 235, 0.4);
        "></div>
        <div style="
          position: absolute;
          width: 22px;
          height: 22px;
          top: 4px;
          left: 4px;
          background: #2563eb;
          border: 3px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        "></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};
