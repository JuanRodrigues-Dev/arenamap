import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import MapView from './components/MapView';
import SportsFormModal from './components/SportsFormModal';
import ProximitySidebar from './components/ProximitySidebar';
import RadarNotification from './components/RadarNotification';
import { api } from './services/api';
import { Route, Clock, X, Navigation } from 'lucide-react';

export default function App() {
  const [userLocation, setUserLocation] = useState(null);
  const [spaces, setSpaces] = useState([]);
  const [currentBounds, setCurrentBounds] = useState(null);

  // Estados dos Modais e Menus
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState(null);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [isNearbyOpen, setIsNearbyOpen] = useState(false);
  const [isRadarActive, setIsRadarActive] = useState(true);
  const [isPickingLocation, setIsPickingLocation] = useState(false);

  // Estado da Rota Real (OSRM)
  const [activeRoute, setActiveRoute] = useState(null);
  const [isRoutingLoading, setIsRoutingLoading] = useState(false);

  const mapInstanceRef = useRef(null);

  // 1. Geolocalização imediata de alta precisão
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(loc);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([loc.lat, loc.lng], 15);
          }
        },
        (error) => {
          console.warn('Geolocalização não autorizada ou demorou. Usando posição padrão.');
          const fallback = { lat: -7.1173, lng: -38.4975 };
          setUserLocation(fallback);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        null,
        { enableHighAccuracy: true, maximumAge: 10000 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setUserLocation({ lat: -7.1173, lng: -38.4975 });
    }
  }, []);

  // 2. Carregar pontos da área visível (Bounding Box)
  const handleBoundsChange = async (bounds) => {
    setCurrentBounds(bounds);
    try {
      const data = await api.getInBounds(bounds.minLng, bounds.minLat, bounds.maxLng, bounds.maxLat);
      setSpaces(data || []);
    } catch (err) {
      console.error('Erro ao buscar pontos na área visível:', err);
    }
  };

  const refreshCurrentView = () => {
    if (currentBounds) {
      handleBoundsChange(currentBounds);
    }
  };

  // Traçar ou Desmarcar Rota Real (OSRM)
  const handleToggleRoute = async (space) => {
    // Se a rota clicada já for a ativa, desmarca!
    if (activeRoute && activeRoute.space?.id === space.id) {
      setActiveRoute(null);
      return;
    }

    if (!userLocation) {
      alert('Aguardando a sua localização para traçar a melhor rota.');
      return;
    }

    try {
      setIsRoutingLoading(true);
      const result = await api.fetchRoute(
        userLocation.lat,
        userLocation.lng,
        space.latitude,
        space.longitude
      );

      setActiveRoute({
        space,
        coordinates: result.coordinates,
        distanceMeters: result.distanceMeters,
        durationSeconds: result.durationSeconds
      });
    } catch (err) {
      console.error('Erro ao calcular rota:', err);
      alert(err.message || 'Não foi possível traçar a rota até este local.');
    } finally {
      setIsRoutingLoading(false);
    }
  };

  const handleClearRoute = () => {
    setActiveRoute(null);
  };

  // Iniciar modo de seleção no mapa
  const handleStartLocationPick = () => {
    setIsPickingLocation(true);
  };

  const handleCancelLocationPick = () => {
    setIsPickingLocation(false);
  };

  // Ao clicar no mapa durante o modo de seleção
  const handleLocationPicked = (lat, lng) => {
    setIsPickingLocation(false);
    setSelectedCoords({ lat, lng });
    setEditingSpace(null);
    setIsModalOpen(true);
  };

  // Abrir modal para editar espaço existente
  const handleEditSpace = (space) => {
    setEditingSpace(space);
    setSelectedCoords({ lat: space.latitude, lng: space.longitude });
    setIsModalOpen(true);
  };

  // Remover local
  const handleDeleteSpace = async (id, name) => {
    if (window.confirm(`Tem certeza que deseja remover o espaço esportivo "${name}"?`)) {
      try {
        await api.deleteSpace(id);
        if (activeRoute?.space?.id === id) {
          setActiveRoute(null);
        }
        refreshCurrentView();
      } catch (err) {
        alert(err.message || 'Erro ao remover local.');
      }
    }
  };

  // Focar em coordenadas
  const handleFlyToSpace = (lat, lng) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1.2 });
    }
  };

  // Navegar para endereço selecionado na barra de busca (Nominatim)
  const handleSelectAddressLocation = (lat, lon) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lon], 16, { duration: 1.2 });
    }
  };

  // Recentralizar na posição do usuário
  const handleRecenter = () => {
    if (mapInstanceRef.current && userLocation) {
      mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1 });
    }
  };

  // Formatação de distância e tempo estimado
  const formattedRouteDist = activeRoute
    ? activeRoute.distanceMeters >= 1000
      ? `${(activeRoute.distanceMeters / 1000).toFixed(1)} km`
      : `${activeRoute.distanceMeters} m`
    : '';

  const formattedRouteDuration = activeRoute
    ? activeRoute.durationSeconds >= 60
      ? `~ ${Math.round(activeRoute.durationSeconds / 60)} min`
      : `< 1 min`
    : '';

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-900">
      
      {/* Barra de Navegação */}
      <Navbar
        onStartLocationPick={handleStartLocationPick}
        isPickingLocation={isPickingLocation}
        onCancelLocationPick={handleCancelLocationPick}
        onToggleRadar={() => setIsRadarActive(prev => !prev)}
        isRadarActive={isRadarActive}
        onToggleNearby={() => setIsNearbyOpen(prev => !prev)}
        isNearbyOpen={isNearbyOpen}
        visibleCount={spaces.length}
        onSelectAddressLocation={handleSelectAddressLocation}
        onRecenter={handleRecenter}
      />

      {/* Área do Mapa */}
      <main className="flex-1 relative">
        <MapView
          spaces={spaces}
          userLocation={userLocation}
          onBoundsChange={handleBoundsChange}
          isPickingLocation={isPickingLocation}
          onLocationPicked={handleLocationPicked}
          onEditSpace={handleEditSpace}
          onDeleteSpace={handleDeleteSpace}
          activeRoute={activeRoute}
          onToggleRoute={handleToggleRoute}
          mapInstanceRef={mapInstanceRef}
        />

        {/* Card Flutuante de Navegação e Rota Ativa */}
        {activeRoute && (
          <div className="absolute top-4 left-4 z-30 max-w-sm w-full bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-blue-500/40 animate-in slide-in-from-top duration-300">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/30">
                  <Navigation className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Rota em Tempo Real</p>
                  </div>
                  <h4 className="font-bold text-sm text-slate-100 line-clamp-1">{activeRoute.space.name}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-300 mt-0.5">
                    <span className="font-bold text-emerald-400">{formattedRouteDist}</span>
                    <span className="text-slate-500">•</span>
                    <span className="flex items-center gap-1 text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      {formattedRouteDuration}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleClearRoute}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Desmarcar Rota"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Melhor trajeto via vias públicas</span>
              <button
                onClick={handleClearRoute}
                className="text-rose-400 hover:text-rose-300 font-semibold transition"
              >
                Desmarcar Rota
              </button>
            </div>
          </div>
        )}

        {/* Notificações do Radar */}
        <RadarNotification
          userLocation={userLocation}
          spaces={spaces}
          isRadarActive={isRadarActive}
          onFlyToSpace={handleFlyToSpace}
        />

        {/* Barra Lateral de Proximidade */}
        <ProximitySidebar
          isOpen={isNearbyOpen}
          onClose={() => setIsNearbyOpen(false)}
          userLocation={userLocation}
          onFlyToSpace={handleFlyToSpace}
          activeRoute={activeRoute}
          onToggleRoute={handleToggleRoute}
          isRoutingLoading={isRoutingLoading}
        />
      </main>

      {/* Modal de Cadastro e Edição */}
      <SportsFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refreshCurrentView}
        editingSpace={editingSpace}
        initialCoordinates={selectedCoords}
      />

    </div>
  );
}
