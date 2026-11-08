const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/sports';

export const api = {
  // 1. Buscar pontos pela área visível (Bounding Box)
  async getInBounds(minLng, minLat, maxLng, maxLat) {
    const res = await fetch(`${API_BASE}/bounds?minLng=${minLng}&minLat=${minLat}&maxLng=${maxLng}&maxLat=${maxLat}`);
    if (!res.ok) throw new Error('Falha ao carregar pontos da área visível.');
    return res.json();
  },

  // 2. Buscar pontos por raio de distância da localização do usuário
  async getNearby(lat, lng, radius = 2000) {
    const res = await fetch(`${API_BASE}/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
    if (!res.ok) throw new Error('Falha ao buscar pontos próximos.');
    return res.json();
  },

  // 3. Cadastrar novo espaço esportivo
  async createSpace(spaceData) {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(spaceData),
    });
    if (!res.ok) throw new Error('Falha ao cadastrar espaço esportivo.');
    return res.json();
  },

  // 4. Atualizar espaço esportivo
  async updateSpace(id, spaceData) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(spaceData),
    });
    if (!res.ok) throw new Error('Falha ao atualizar espaço esportivo.');
    return res.json();
  },

  // 5. Deletar espaço esportivo
  async deleteSpace(id) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Falha ao remover espaço esportivo.');
    return res.json();
  },

  // 6. Geocodificação gratuita via OpenStreetMap / Nominatim
  async searchAddressNominatim(query) {
    if (!query || query.trim().length < 3) return [];
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=br`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' }
    });
    if (!res.ok) return [];
    return res.json();
  }
};
