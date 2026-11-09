import React, { useState, useEffect } from 'react';
import { Search, MapPin, Loader2, Navigation, Radar, Plus, X } from 'lucide-react';
import { api } from '../services/api';

export default function Navbar({
  onStartLocationPick,
  isPickingLocation,
  onCancelLocationPick,
  onToggleRadar,
  isRadarActive,
  onToggleNearby,
  isNearbyOpen,
  visibleCount,
  onSelectAddressLocation,
  onRecenter
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  // Busca de endereços no Nominatim com debounce
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await api.searchAddressNominatim(searchQuery);
        setSuggestions(results || []);
      } catch (err) {
        console.error('Erro ao pesquisar localidade:', err);
      } finally {
        setIsSearching(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSuggestion = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    if (onSelectAddressLocation) {
      onSelectAddressLocation(lat, lon, item.display_name);
    }
    setSearchQuery('');
    setSuggestions([]);
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        
        {/* Logo Oficial ArenaMap */}
        <div className="flex items-center cursor-pointer shrink-0" onClick={onRecenter} title="Clique para recentralizar em você">
          <div className="bg-white px-2.5 py-1 rounded-xl shadow-sm hover:shadow-md transition flex items-center">
            <img
              src="/logo-horizontal.png"
              alt="ArenaMap"
              className="h-8 sm:h-9 w-auto object-contain"
            />
          </div>
        </div>

        {/* Barra Central de Busca de Endereços / Cidades (Nominatim) */}
        <div className="relative flex-1 max-w-md hidden md:block">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar endereço, bairro ou cidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-8 py-2 rounded-lg bg-slate-800/90 border border-slate-700 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-slate-800 transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            {isSearching && (
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin absolute right-2.5 top-2.5" />
            )}
            {searchQuery && !isSearching && (
              <button
                onClick={() => { setSearchQuery(''); setSuggestions([]); }}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dropdown de Sugestões do Nominatim */}
          {suggestions.length > 0 && (
            <ul className="absolute z-50 left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-700/60">
              {suggestions.map((item, idx) => (
                <li
                  key={idx}
                  onClick={() => handleSelectSuggestion(item)}
                  className="p-2.5 hover:bg-slate-700/70 cursor-pointer text-xs text-slate-200 flex items-start gap-2 transition"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{item.display_name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Ações da Direita */}
        <div className="flex items-center space-x-2 shrink-0">
          
          {/* Contador discreto */}
          <span className="text-[11px] text-slate-400 hidden lg:inline mr-1">
            {visibleCount} locais visíveis
          </span>

          {/* Botão de Radar */}
          <button
            onClick={onToggleRadar}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              isRadarActive
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
            }`}
            title="Radar de aproximação"
          >
            <Radar className={`w-3.5 h-3.5 ${isRadarActive ? 'text-amber-400' : ''}`} />
            <span className="hidden sm:inline">Radar</span>
          </button>

          {/* Botão Perto de Mim */}
          <button
            onClick={onToggleNearby}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              isNearbyOpen
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Perto de Mim</span>
          </button>

          {/* Botão Cadastrar Local com modo de seleção */}
          {isPickingLocation ? (
            <button
              onClick={onCancelLocationPick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancelar</span>
            </button>
          ) : (
            <button
              onClick={onStartLocationPick}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cadastrar Local</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
}
