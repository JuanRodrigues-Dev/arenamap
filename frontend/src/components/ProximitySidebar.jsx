import React, { useState, useEffect } from 'react';
import { X, Navigation, Loader2, ArrowRight, Route, Check } from 'lucide-react';
import { api } from '../services/api';
import { getCategoryMeta } from '../utils/sportsCategories';

export default function ProximitySidebar({
  isOpen,
  onClose,
  userLocation,
  onFlyToSpace,
  activeRoute,
  onToggleRoute,
  isRoutingLoading
}) {
  const [radiusMeters, setRadiusMeters] = useState(2000);
  const [nearbySpaces, setNearbySpaces] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
      
      {/* Topo */}
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight text-white">Buscar por Proximidade</h3>
            <p className="text-[11px] text-slate-400">Locais mais próximos de você</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Seletor de Raio */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700">Raio a partir de você:</span>
          <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            {radiusMeters >= 1000 ? `${radiusMeters / 1000} km` : `${radiusMeters} m`}
          </span>
        </div>

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

      {/* Lista */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <p className="text-xs">Consultando locais próximos...</p>
          </div>
        ) : error ? (
          <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs">{error}</div>
        ) : nearbySpaces.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <p className="text-xs font-medium text-slate-600">Nenhum local encontrado neste raio.</p>
            <p className="text-[11px] text-slate-400">Tente aumentar a distância para 5 km ou 10 km.</p>
          </div>
        ) : (
          nearbySpaces.map((space) => {
            const meta = getCategoryMeta(space.sport_category);
            const distFormatted =
              space.distance_meters >= 1000
                ? `${(space.distance_meters / 1000).toFixed(1)} km`
                : `${space.distance_meters} m`;

            const isRouteActiveForThis = activeRoute?.space?.id === space.id;

            return (
              <div
                key={space.id}
                className={`p-3.5 rounded-xl border transition group ${
                  isRouteActiveForThis
                    ? 'border-blue-500 bg-blue-50/40 shadow-md ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                {/* Cabeçalho do Card */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-700">
                      {meta.initial}
                    </span>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition leading-tight">
                        {space.name}
                      </h4>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {space.sport_category}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 shrink-0">
                    {distFormatted}
                  </span>
                </div>

                {/* Status e Ações */}
                <div className="flex items-center justify-between text-[11px] pt-3 mt-3 border-t border-slate-100">
                  <span className={space.is_public ? 'text-emerald-600 font-semibold' : 'text-slate-600'}>
                    {space.is_public ? 'Acesso Livre' : 'Aluguel / Pago'}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Botão de Focar */}
                    <button
                      onClick={() => onFlyToSpace(space.latitude, space.longitude)}
                      className="text-slate-500 hover:text-blue-600 font-medium transition text-[11px] flex items-center gap-0.5"
                      title="Centralizar no mapa"
                    >
                      <span>Focar</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    {/* Botão de Traçar / Desmarcar Rota */}
                    <button
                      onClick={() => onToggleRoute(space)}
                      disabled={isRoutingLoading}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition flex items-center gap-1 shadow-sm ${
                        isRouteActiveForThis
                          ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                          : 'bg-blue-600 text-white hover:bg-blue-500'
                      }`}
                    >
                      <Route className="w-3 h-3" />
                      <span>{isRouteActiveForThis ? 'Desmarcar' : 'Traçar Rota'}</span>
                    </button>
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
