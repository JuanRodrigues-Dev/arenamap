import React, { useEffect, useState } from 'react';
import { Radar, Bell, ChevronRight, X } from 'lucide-react';
import { getCategoryMeta } from '../utils/sportsCategories';

export default function RadarNotification({
  userLocation,
  spaces,
  isRadarActive,
  onFlyToSpace
}) {
  const [activeAlert, setActiveAlert] = useState(null);
  const [notifiedIds, setNotifiedIds] = useState(new Set());

  // Solicitar permissão para notificações nativas do sistema se o radar for ligado
  useEffect(() => {
    if (isRadarActive && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(console.error);
      }
    }
  }, [isRadarActive]);

  // Cálculo da distância Haversine em metros entre dois pontos (lat1, lon1) e (lat2, lon2)
  const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Raio da Terra em metros
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  // Monitorar espaços próximos e disparar alertas
  useEffect(() => {
    if (!isRadarActive || !userLocation || !spaces || spaces.length === 0) return;

    // Raio de alerta do radar (ex: 750 metros)
    const ALERT_RADIUS_METERS = 750;

    for (const space of spaces) {
      if (!space.latitude || !space.longitude) continue;

      const dist = calculateDistanceMeters(
        userLocation.lat,
        userLocation.lng,
        space.latitude,
        space.longitude
      );

      // Se estiver dentro do raio de alerta e ainda não foi notificado nesta sessão
      if (dist <= ALERT_RADIUS_METERS && !notifiedIds.has(space.id)) {
        setNotifiedIds(prev => new Set(prev).add(space.id));

        const meta = getCategoryMeta(space.sport_category);

        // 1. Notificação nativa do navegador
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`🏟️ ${meta.icon} ${space.name} por perto!`, {
            body: `Você está a ${dist}m de um espaço de ${space.sport_category}. ${space.is_public ? 'Entrada Gratuita' : 'Privado'}.`,
            icon: '/favicon.svg'
          });
        }

        // 2. Alerta visual (Toast animado na tela)
        setActiveAlert({
          space,
          distance: dist,
          meta
        });

        // Som discreto de aviso opcional usando Web Audio API
        try {
          const ctx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
          osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.35);
        } catch (e) {
          // AudioContext pode ser bloqueado sem interação prévia
        }

        break;
      }
    }
  }, [userLocation, spaces, isRadarActive]);

  if (!isRadarActive || !activeAlert) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in slide-in-from-bottom duration-300">
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-emerald-500/50 flex items-center justify-between gap-3 backdrop-blur-lg">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl shrink-0 border border-emerald-500/30">
            {activeAlert.meta.icon}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Radar Esportivo: {activeAlert.distance}m de você!
              </p>
            </div>
            <h4 className="font-bold text-sm text-slate-100 line-clamp-1">{activeAlert.space.name}</h4>
            <p className="text-xs text-slate-400">
              {activeAlert.space.sport_category} • {activeAlert.space.is_public ? '🟢 Gratuito' : '🟡 Pago'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              onFlyToSpace(activeAlert.space.latitude, activeAlert.space.longitude);
              setActiveAlert(null);
            }}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition shadow-sm"
          >
            Ver
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActiveAlert(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
