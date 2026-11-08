import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import MapView from './components/MapView';
import SportsFormModal from './components/SportsFormModal';
import ProximitySidebar from './components/ProximitySidebar';
import RadarNotification from './components/RadarNotification';
import { api } from './services/api';

export default function App() {
  // Estado de localização do usuário (Geolocalização do navegador)
  const [userLocation, setUserLocation] = useState(null);

  // Espaços esportivos carregados dinamicamente na área visível da tela (Bounding Box)
  const [spaces, setSpaces] = useState([]);
  const [currentBounds, setCurrentBounds] = useState(null);

  // Estados dos Modais e Menus Laterais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpace, setEditingSpace] = useState(null);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [isNearbyOpen, setIsNearbyOpen] = useState(false);
  const [isRadarActive, setIsRadarActive] = useState(true);

  // Referência para a instância do mapa Leaflet
  const mapInstanceRef = useRef(null);

  // 1. Obter a localização inicial do usuário pelo navegador
  // Atende ao requisito: "O mapa deve ser aberto na localização do navegador utilizando geolocalização"
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(loc);
        },
        (error) => {
          console.warn('Acesso à geolocalização não autorizado ou falhou. Usando centro de São Paulo.');
          setUserLocation({ lat: -23.550520, lng: -46.633308 });
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );

      // Acompanhamento da posição do usuário (útil para o Radar em movimento)
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
      setUserLocation({ lat: -23.550520, lng: -46.633308 });
    }
  }, []);

  // 2. Carregar pontos quando a área visível do mapa (Bounding Box) for alterada
  // Atende ao requisito: "A medida que o usuário movimenta o mapa devem ser carregados somente os pontos dentro da área visível do mapa."
  const handleBoundsChange = async (bounds) => {
    setCurrentBounds(bounds);
    try {
      const data = await api.getInBounds(bounds.minLng, bounds.minLat, bounds.maxLng, bounds.maxLat);
      setSpaces(data || []);
    } catch (err) {
      console.error('Erro ao buscar pontos na área visível:', err);
    }
  };

  // Recarregar os pontos da área atual após inserção, edição ou exclusão
  const refreshCurrentView = () => {
    if (currentBounds) {
      handleBoundsChange(currentBounds);
    }
  };

  // Abrir modal de cadastro a partir de clique no mapa
  const handleSelectLocationForCreate = (lat, lng) => {
    setSelectedCoords({ lat, lng });
    setEditingSpace(null);
    setIsModalOpen(true);
  };

  // Abrir modal para edição de local
  const handleEditSpace = (space) => {
    setEditingSpace(space);
    setSelectedCoords({ lat: space.latitude, lng: space.longitude });
    setIsModalOpen(true);
  };

  // Remover local com confirmação
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

  // Focar o mapa com animação suave em uma coordenada específica
  const handleFlyToSpace = (lat, lng) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 17, { duration: 1.2 });
    }
  };

  // Recentralizar na posição do usuário
  const handleRecenter = () => {
    if (mapInstanceRef.current && userLocation) {
      mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1 });
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-900 font-sans">
      
      {/* Barra de Navegação Superior */}
      <Navbar
        onOpenCreateModal={() => {
          setEditingSpace(null);
          setSelectedCoords(userLocation);
          setIsModalOpen(true);
        }}
        onToggleRadar={() => setIsRadarActive(prev => !prev)}
        isRadarActive={isRadarActive}
        onToggleNearby={() => setIsNearbyOpen(prev => !prev)}
        isNearbyOpen={isNearbyOpen}
        visibleCount={spaces.length}
        onRecenter={handleRecenter}
      />

      {/* Área Central com o Mapa */}
      <main className="flex-1 relative">
        <MapView
          spaces={spaces}
          userLocation={userLocation}
          onBoundsChange={handleBoundsChange}
          onSelectLocationForCreate={handleSelectLocationForCreate}
          onEditSpace={handleEditSpace}
          onDeleteSpace={handleDeleteSpace}
          mapInstanceRef={mapInstanceRef}
        />

        {/* Notificações Flutuantes do Radar Esportivo */}
        <RadarNotification
          userLocation={userLocation}
          spaces={spaces}
          isRadarActive={isRadarActive}
          onFlyToSpace={handleFlyToSpace}
        />

        {/* Barra Lateral de Busca por Raio (1km, 2km, 5km) */}
        <ProximitySidebar
          isOpen={isNearbyOpen}
          onClose={() => setIsNearbyOpen(false)}
          userLocation={userLocation}
          onFlyToSpace={handleFlyToSpace}
        />
      </main>

      {/* Modal de Cadastro e Edição (com busca por Nominatim) */}
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
