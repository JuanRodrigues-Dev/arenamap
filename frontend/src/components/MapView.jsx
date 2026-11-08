import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { createCustomMarkerIcon, createUserMarkerIcon, getCategoryMeta } from '../utils/sportsCategories';
import { Sun, Droplets, Clock, Trash2, Edit3, Compass } from 'lucide-react';

export default function MapView({
  spaces,
  userLocation,
  onBoundsChange,
  onSelectLocationForCreate,
  onEditSpace,
  onDeleteSpace,
  mapInstanceRef
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // 1. Inicializar o mapa do Leaflet
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Coordenada inicial padrão (ex: Brasil / São Paulo) caso a geolocalização demore
    const initialLat = userLocation ? userLocation.lat : -23.550520;
    const initialLng = userLocation ? userLocation.lng : -46.633308;

    const map = L.map(containerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: false // Movemos o controle para o canto inferior direito
    });

    // Controle de zoom reposicionado
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Camada de Tiles do OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Camada dedicada para os marcadores de centros esportivos
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Evento de clique no mapa para capturar coordenadas para novo cadastro
    map.on('click', (e) => {
      if (onSelectLocationForCreate) {
        onSelectLocationForCreate(e.latlng.lat, e.latlng.lng);
      }
    });

    // Evento moveend (movimentação ou zoom do mapa)
    // Atende ao requisito: "A medida que o usuário movimenta o mapa devem ser carregados somente os pontos dentro da área visível do mapa."
    const handleMoveEnd = () => {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        const bounds = map.getBounds();
        const southWest = bounds.getSouthWest();
        const northEast = bounds.getNorthEast();

        if (onBoundsChange) {
          onBoundsChange({
            minLng: southWest.lng,
            minLat: southWest.lat,
            maxLng: northEast.lng,
            maxLat: northEast.lat
          });
        }
      }, 300); // 300ms de debounce para fluidez
    };

    map.on('moveend', handleMoveEnd);

    mapRef.current = map;
    if (mapInstanceRef) {
      mapInstanceRef.current = map;
    }

    // Dispara a primeira busca de limites logo na abertura
    handleMoveEnd();

    return () => {
      clearTimeout(debounceTimerRef.current);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // 2. Atualizar ou centralizar na posição do usuário quando obtida
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
        icon: createUserMarkerIcon(),
        zIndexOffset: 1000
      })
      .addTo(mapRef.current)
      .bindPopup(`
        <div style="padding: 10px; font-family: sans-serif; text-align: center;">
          <p style="font-weight: bold; margin: 0 0 4px 0; color: #1e293b;">📍 Você está aqui!</p>
          <p style="font-size: 11px; color: #64748b; margin: 0;">Geolocalização do navegador ativa</p>
        </div>
      `);

      // Centraliza na localização do usuário na primeira vez
      mapRef.current.setView([userLocation.lat, userLocation.lng], 15);
    } else {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation]);

  // 3. Renderizar marcadores dos centros esportivos retornados da área visível
  useEffect(() => {
    if (!markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    spaces.forEach((space) => {
      if (!space.latitude || !space.longitude) return;

      const marker = L.marker([space.latitude, space.longitude], {
        icon: createCustomMarkerIcon(space.sport_category)
      });

      const meta = getCategoryMeta(space.sport_category);

      // Popup detalhado com Tailwind e HTML puro
      const popupContent = document.createElement('div');
      popupContent.className = 'w-72 p-4 text-slate-800 font-sans';
      popupContent.innerHTML = `
        <div class="flex items-start justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
          <div>
            <span class="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style="background-color: ${meta.color}20; color: ${meta.color};">
              <span>${meta.icon}</span> ${space.sport_category}
            </span>
            <h3 class="font-bold text-base text-slate-900 mt-1 leading-tight">${space.name}</h3>
          </div>
          <span class="text-[10px] font-bold px-1.5 py-0.5 rounded ${space.is_public ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
            ${space.is_public ? 'Gratuito' : 'Privado / Pago'}
          </span>
        </div>

        <div class="space-y-1.5 text-xs text-slate-600 mb-3">
          <div class="flex items-center gap-1.5">
            <span class="font-semibold text-slate-700">Piso:</span>
            <span>${space.surface_type || 'Não informado'}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="font-semibold text-slate-700">Horário:</span>
            <span>${space.opening_hours || 'Livre'}</span>
          </div>
          <div class="flex flex-wrap gap-1.5 pt-1">
            ${space.has_lighting ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-700 border border-yellow-200">💡 Iluminação noturna</span>' : ''}
            ${space.has_restrooms ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">🚿 Vestiários</span>' : ''}
          </div>
          ${space.description ? `<p class="text-xs text-slate-500 pt-1 italic border-t border-slate-100">${space.description}</p>` : ''}
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button id="btn-edit-${space.id}" class="text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition flex items-center gap-1">
            ✏️ Editar
          </button>
          <button id="btn-del-${space.id}" class="text-xs px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 font-medium transition flex items-center gap-1">
            🗑️ Excluir
          </button>
        </div>
      `;

      // Conectar cliques nos botões de Editar e Excluir
      popupContent.querySelector(`#btn-edit-${space.id}`)?.addEventListener('click', () => {
        if (onEditSpace) onEditSpace(space);
      });

      popupContent.querySelector(`#btn-del-${space.id}`)?.addEventListener('click', () => {
        if (onDeleteSpace) onDeleteSpace(space.id, space.name);
      });

      marker.bindPopup(popupContent, { maxWidth: 320 });
      markersLayerRef.current.addLayer(marker);
    });
  }, [spaces]);

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-slate-100">
      {/* Contêiner do Mapa Leaflet */}
      <div ref={containerRef} className="w-full h-full z-0" />

      {/* Dica flutuante no rodapé do mapa */}
      <div className="absolute top-4 left-4 z-10 bg-slate-900/85 backdrop-blur-md text-white text-xs px-3.5 py-2 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 pointer-events-none">
        <Compass className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '8s' }} />
        <span>Arraste ou dê zoom no mapa para atualizar os pontos espaciais em tempo real</span>
      </div>
    </div>
  );
}
