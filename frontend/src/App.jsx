import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import MapView from './components/MapView';
import SportsFormModal from './components/SportsFormModal';
import ProximitySidebar from './components/ProximitySidebar';
import RadarNotification from './components/RadarNotification';
import { api } from './services/api';

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

  // Novo fluxo de seleção de local no mapa para cadastro
  const [isPickingLocation, setIsPickingLocation] = useState(false);

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
          mapInstanceRef={mapInstanceRef}
        />

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
