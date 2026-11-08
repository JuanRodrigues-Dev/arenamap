import React from 'react';
import { MapPin, Plus, Radar, Navigation, Award } from 'lucide-react';

export default function Navbar({
  onOpenCreateModal,
  onToggleRadar,
  isRadarActive,
  onToggleNearby,
  isNearbyOpen,
  visibleCount,
  onRecenter
}) {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo e Título */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={onRecenter}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-green-600 to-emerald-400 flex items-center justify-center shadow-md shadow-green-500/20">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-green-400 bg-clip-text text-transparent">
                ArenaMap
              </span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                PostGIS
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Mapeamento & Radar de Espaços Esportivos
            </p>
          </div>
        </div>

        {/* Badge de Pontos Visíveis na Tela */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{visibleCount} locais na área visível</span>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Botão de Radar Esportivo */}
          <button
            onClick={onToggleRadar}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              isRadarActive
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
            }`}
            title="Receber alertas quando se aproximar de espaços esportivos"
          >
            <Radar className={`w-4 h-4 ${isRadarActive ? 'animate-spin text-amber-400' : ''}`} />
            <span className="hidden sm:inline">Radar</span>
            <span className="sm:hidden">Radar</span>
          </button>

          {/* Botão de Busca por Proximidade */}
          <button
            onClick={onToggleNearby}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              isNearbyOpen
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span className="hidden sm:inline">Perto de Mim</span>
          </button>

          {/* Botão de Cadastro */}
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-md shadow-green-600/30 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Local</span>
          </button>

        </div>
      </div>
    </header>
  );
}
