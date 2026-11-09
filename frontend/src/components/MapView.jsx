import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { createCustomMarkerIcon, createUserMarkerIcon, getCategoryMeta } from '../utils/sportsCategories';
import { MapPin, Navigation, Route, X, Clock } from 'lucide-react';

export default function MapView({
  spaces,
  userLocation,
  onBoundsChange,
  isPickingLocation,
  onLocationPicked,
  onEditSpace,
  onDeleteSpace,
  activeRoute,
  onToggleRoute,
  mapInstanceRef
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // 1. Inicializar mapa
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialLat = userLocation ? userLocation.lat : -7.1173;
    const initialLng = userLocation ? userLocation.lng : -38.4975;

    const map = L.map(containerRef.current, {
      center: [initialLat, initialLng],
      zoom: 15,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);

    // Clique no mapa
    map.on('click', (e) => {
      if (isPickingLocationRef.current) {
        if (onLocationPicked) {
          onLocationPicked(e.latlng.lat, e.latlng.lng);
        }
      }
    });

    // Monitorar movimentação da tela (Bounding Box)
    const handleMoveEnd = () => {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        const bounds = map.getBounds();
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();

        if (onBoundsChange) {
          onBoundsChange({
            minLng: sw.lng,
            minLat: sw.lat,
            maxLng: ne.lng,
            maxLat: ne.lat
          });
        }
      }, 300);
    };

    map.on('moveend', handleMoveEnd);

    mapRef.current = map;
    if (mapInstanceRef) {
      mapInstanceRef.current = map;
    }

    handleMoveEnd();

    return () => {
      clearTimeout(debounceTimerRef.current);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Modo de seleção de local
  const isPickingLocationRef = useRef(isPickingLocation);
  useEffect(() => {
    isPickingLocationRef.current = isPickingLocation;
    if (containerRef.current) {
      containerRef.current.style.cursor = isPickingLocation ? 'crosshair' : '';
    }
  }, [isPickingLocation]);

  // 2. Atualizar posição do usuário
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
        icon: createUserMarkerIcon(),
        zIndexOffset: 1000
      })
      .addTo(mapRef.current)
      .bindPopup(`
        <div style="padding: 6px; font-family: sans-serif; text-align: center;">
          <p style="font-weight: 700; margin: 0; color: #0f172a; font-size: 12px;">Sua Localização Atual</p>
        </div>
      `);

      mapRef.current.setView([userLocation.lat, userLocation.lng], 15);
    } else {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation]);

  // 3. Renderizar rota de navegação OSRM nas ruas reais
  useEffect(() => {
    if (!routeLayerRef.current) return;
    routeLayerRef.current.clearLayers();

    if (!activeRoute || !activeRoute.coordinates || activeRoute.coordinates.length === 0) {
      return;
    }

    // Linha de contorno externa suave (glow azul)
    const outline = L.polyline(activeRoute.coordinates, {
      color: '#1d4ed8',
      weight: 8,
      opacity: 0.45,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(routeLayerRef.current);

    // Linha principal da rota pelas ruas
    const mainLine = L.polyline(activeRoute.coordinates, {
      color: '#2563eb',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(routeLayerRef.current);

    // Ajusta o zoom e a visão do mapa para enquadrar todo o percurso
    if (mapRef.current) {
      mapRef.current.fitBounds(mainLine.getBounds(), {
        padding: [60, 60],
        maxZoom: 16
      });
    }
  }, [activeRoute]);

  // 4. Renderizar marcadores dos centros esportivos
  useEffect(() => {
    if (!markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    spaces.forEach((space) => {
      if (!space.latitude || !space.longitude) return;

      const isRouteActiveForThis = activeRoute?.space?.id === space.id;
      const marker = L.marker([space.latitude, space.longitude], {
        icon: createCustomMarkerIcon(space.sport_category, isRouteActiveForThis)
      });

      const meta = getCategoryMeta(space.sport_category);

      // Popup
      const popupDiv = document.createElement('div');
      popupDiv.className = 'w-64 p-3.5 text-slate-800 font-sans';
      popupDiv.innerHTML = `
        <div class="flex items-start justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
          <div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full" style="background-color: ${meta.color}20; color: ${meta.color};">
              ${space.sport_category}
            </span>
            <h3 class="font-bold text-sm text-slate-900 mt-1">${space.name}</h3>
          </div>
          <span class="text-[9px] font-bold px-1.5 py-0.5 rounded ${space.is_public ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}">
            ${space.is_public ? 'Livre' : 'Aluguel'}
          </span>
        </div>

        <div class="space-y-1 text-xs text-slate-600 mb-2.5">
          <p><span class="font-semibold text-slate-700">Piso:</span> ${space.surface_type || 'Padrão'}</p>
          <p><span class="font-semibold text-slate-700">Horário:</span> ${space.opening_hours || 'Livre'}</p>
          ${space.description ? `<p class="text-[11px] text-slate-500 pt-1 border-t border-slate-100">${space.description}</p>` : ''}
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-slate-100">
          <button id="btn-route-${space.id}" class="text-[11px] px-2.5 py-1 rounded ${isRouteActiveForThis ? 'bg-rose-100 text-rose-700 font-bold' : 'bg-blue-600 hover:bg-blue-500 text-white font-semibold'} transition flex items-center gap-1">
            ${isRouteActiveForThis ? 'Desmarcar Rota' : 'Traçar Rota'}
          </button>
          <div class="flex items-center gap-1.5">
            <button id="btn-edit-${space.id}" class="text-[11px] px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition">
              Editar
            </button>
            <button id="btn-del-${space.id}" class="text-[11px] px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 font-medium transition">
              Excluir
            </button>
          </div>
        </div>
      `;

      popupDiv.querySelector(`#btn-route-${space.id}`)?.addEventListener('click', () => {
        if (onToggleRoute) onToggleRoute(space);
      });

      popupDiv.querySelector(`#btn-edit-${space.id}`)?.addEventListener('click', () => {
        if (onEditSpace) onEditSpace(space);
      });

      popupDiv.querySelector(`#btn-del-${space.id}`)?.addEventListener('click', () => {
        if (onDeleteSpace) onDeleteSpace(space.id, space.name);
      });

      marker.bindPopup(popupDiv, { maxWidth: 300 });
      markersLayerRef.current.addLayer(marker);
    });
  }, [spaces, activeRoute]);

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-slate-100">
      
      {/* Faixa de Seleção de Local */}
      {isPickingLocation && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 animate-bounce">
          <MapPin className="w-4 h-4" />
          <span>Clique no mapa no ponto exato onde fica o novo espaço</span>
        </div>
      )}

      {/* Contêiner Leaflet */}
      <div ref={containerRef} className="w-full h-full z-0" />
    </div>
  );
}
