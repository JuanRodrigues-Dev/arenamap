import React, { useState, useEffect } from 'react';
import { X, Navigation, MapPin, Loader2, Compass, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { getCategoryMeta } from '../utils/sportsCategories';

export default function ProximitySidebar({
  isOpen,
  onClose,
  userLocation,
  onFlyToSpace
}) {
  const [radiusMeters, setRadiusMeters] = useState(2000); // 2 km padrão do trabalho
  const [nearbySpaces, setNearbySpaces] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Buscar pontos sempre que o raio mudar ou quando abrir a sidebar
  useEffect(() => {
    if (!isOpen || !userLocation) return;

    const fetchNearby = async () => {
      try {
        setIsLoading(true);
        setError('');
        const data = await api.getNearby(userLocation.lat, userLocation.lng, radiusMeters);
        setNearbySpaces(data || []);
      } catch (err) {
        console.error('Erro na busca de proximidade:', err);
        setError('Não foi possível carregar os pontos próximos.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNearby();
  }, [isOpen, radiusMeters, userLocation]);

  if (!isOpen) return null;

  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
      
      {/* Topo da barra lateral */}
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">Buscar por Proximidade</h3>
            <p className="text-[11px] text-slate-400">PostGIS ST_DWithin & ST_Distance</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Controles de Raio de Distância */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">Raio de busca a partir da sua posição:</span>
          <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            {radiusMeters >= 1000 ? `${radiusMeters / 1000} km` : `${radiusMeters} m`}
          </span>
        </div>

        {/* Botões rápidos de raio */}
        <div className="grid grid-cols-4 gap-2">
          {[1000, 2000, 5000, 10000].map((r) => (
            <button
              key={r}
              onClick={() => setRadiusMeters(r)}
              className={`py-1.5 rounded-lg text-xs font-semibold transition border ${
                radiusMeters === r
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {r >= 1000 ? `${r / 1000} km` : `${r}m`}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Espaços Encontrados */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p className="text-xs">Consultando PostGIS (ST_DWithin)...</p>
          </div>
        ) : error ? (
          <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs">{error}</div>
        ) : nearbySpaces.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <Compass className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
            <p className="text-xs font-medium text-slate-600">Nenhum local esportivo encontrado neste raio.</p>
            <p className="text-[11px] text-slate-400">Tente aumentar a distância para 5 km ou 10 km.</p>
          </div>
        ) : (
          nearbySpaces.map((space) => {
            const meta = getCategoryMeta(space.sport_category);
            const distFormatted =
              space.distance_meters >= 1000
                ? `${(space.distance_meters / 1000).toFixed(1)} km`
                : `${space.distance_meters} m`;

            return (
              <div
                key={space.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition group cursor-pointer"
                onClick={() => onFlyToSpace(space.latitude, space.longitude)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg p-1.5 rounded-lg bg-slate-100">{meta.icon}</span>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition leading-tight">
                        {space.name}
                      </h4>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {space.sport_category}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 shrink-0">
                    📍 {distFormatted}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2.5 mt-2.5 border-t border-slate-100">
                  <span className={space.is_public ? 'text-emerald-600 font-semibold' : 'text-amber-600'}>
                    {space.is_public ? '🟢 Gratuito' : '🟡 Pago'}
                  </span>
                  <div className="flex items-center gap-1 text-blue-600 font-semibold group-hover:translate-x-0.5 transition">
                    <span>Focar no mapa</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </aside>
  );
}
