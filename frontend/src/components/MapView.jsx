import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { createCustomMarkerIcon, createUserMarkerIcon, getCategoryMeta } from '../utils/sportsCategories';
import { MapPin, Navigation, X } from 'lucide-react';

export default function MapView({
  spaces,
  userLocation,
  onBoundsChange,
  isPickingLocation,
  onLocationPicked,
  onEditSpace,
  onDeleteSpace,
  mapInstanceRef
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const trajectoryLayerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const [selectedTrajectorySpace, setSelectedTrajectorySpace] = useState(null);

  // 1. Inicializar mapa
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Coordenada inicial (usa a do usuário se já obtida)
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

    // Camadas de marcadores e trajetórias
    markersLayerRef.current = L.layerGroup().addTo(map);
    trajectoryLayerRef.current = L.layerGroup().addTo(map);

    // Evento de clique no mapa
    map.on('click', (e) => {
      // Se estiver no modo de cadastrar local, aciona a seleção
      if (isPickingLocationRef.current) {
        if (onLocationPicked) {
          onLocationPicked(e.latlng.lat, e.latlng.lng);
        }
      } else {
        // Se clicar em área vazia fora de seleção, limpa a trajetória ativa
        if (trajectoryLayerRef.current) {
          trajectoryLayerRef.current.clearLayers();
          setSelectedTrajectorySpace(null);
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

  // Manter ref do modo de seleção para o listener do Leaflet
  const isPickingLocationRef = useRef(isPickingLocation);
  useEffect(() => {
    isPickingLocationRef.current = isPickingLocation;
    if (containerRef.current) {
      if (isPickingLocation) {
        containerRef.current.style.cursor = 'crosshair';
      } else {
        containerRef.current.style.cursor = '';
      }
    }
  }, [isPickingLocation]);

  // 2. Atualizar posição do usuário e centralizar imediatamente
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

      // Foca imediatamente na posição real do usuário
      mapRef.current.setView([userLocation.lat, userLocation.lng], 15);
    } else {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    }
  }, [userLocation]);

  // 3. Traçar linha de trajetória entre usuário e local selecionado
  const drawTrajectory = (space) => {
    if (!trajectoryLayerRef.current || !userLocation || !space.latitude || !space.longitude) return;

    trajectoryLayerRef.current.clearLayers();

    const from = [userLocation.lat, userLocation.lng];
    const to = [parseFloat(space.latitude), parseFloat(space.longitude)];

    // Linha de trajetória pontilhada animada
    const polyline = L.polyline([from, to], {
      color: '#2563eb',
      weight: 4,
      dashArray: '8, 8',
      opacity: 0.85
    }).addTo(trajectoryLayerRef.current);

    // Cálculo da distância em linha reta
    const distanceMeters = Math.round(mapRef.current.distance(from, to));
    const distText = distanceMeters >= 1000
      ? `${(distanceMeters / 1000).toFixed(1)} km`
      : `${distanceMeters} m`;

    // Tooltip centralizado na linha com a distância
    const midLat = (from[0] + to[0]) / 2;
    const midLng = (from[1] + to[1]) / 2;
    const distanceMarker = L.marker([midLat, midLng], {
      icon: L.divIcon({
        className: 'dist-label',
        html: `
          <div style="
            background: #0f172a;
            color: #ffffff;
            font-size: 11px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 9999px;
            border: 1px solid #38bdf8;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            white-space: nowrap;
          ">
            Trajetória: ${distText}
          </div>
        `,
        iconAnchor: [45, 12]
      })
    }).addTo(trajectoryLayerRef.current);

    setSelectedTrajectorySpace({ space, distance: distText });
  };

  // 4. Renderizar marcadores no mapa
  useEffect(() => {
    if (!markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    spaces.forEach((space) => {
      if (!space.latitude || !space.longitude) return;

      const isSelected = selectedTrajectorySpace?.space?.id === space.id;
      const marker = L.marker([space.latitude, space.longitude], {
        icon: createCustomMarkerIcon(space.sport_category, isSelected)
      });

      const meta = getCategoryMeta(space.sport_category);

      // Ao clicar no marcador, traça a trajetória e abre o popup
      marker.on('click', () => {
        if (!isPickingLocationRef.current) {
          drawTrajectory(space);
        }
      });

      // Conteúdo limpo do Popup (sem emojis)
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
          <button id="btn-traj-${space.id}" class="text-[11px] px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold transition flex items-center gap-1">
            Trajetória
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

      popupDiv.querySelector(`#btn-traj-${space.id}`)?.addEventListener('click', () => {
        drawTrajectory(space);
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
  }, [spaces, selectedTrajectorySpace]);

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-slate-100">
      
      {/* Faixa de Instrução quando estiver escolhendo local no mapa */}
      {isPickingLocation && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 animate-bounce">
          <MapPin className="w-4 h-4" />
          <span>Clique no mapa no ponto exato onde fica o novo espaço</span>
        </div>
      )}

      {/* Painel Flutuante de Trajetória Ativa */}
      {selectedTrajectorySpace && (
        <div className="absolute top-4 right-4 z-20 bg-slate-900/90 backdrop-blur-md text-white text-xs p-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-slate-100">{selectedTrajectorySpace.space.name}</p>
            <p className="text-[11px] text-blue-300">Distância até o local: <strong>{selectedTrajectorySpace.distance}</strong></p>
          </div>
          <button
            onClick={() => {
              if (trajectoryLayerRef.current) trajectoryLayerRef.current.clearLayers();
              setSelectedTrajectorySpace(null);
            }}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Contêiner Leaflet */}
      <div ref={containerRef} className="w-full h-full z-0" />
    </div>
  );
}
