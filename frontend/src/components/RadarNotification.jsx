import React, { useEffect, useState } from 'react';
import { Radar, ChevronRight, X } from 'lucide-react';
import { getCategoryMeta } from '../utils/sportsCategories';

export default function RadarNotification({
  userLocation,
  spaces,
  isRadarActive,
  onFlyToSpace
}) {
  const [activeAlert, setActiveAlert] = useState(null);
  const [notifiedIds, setNotifiedIds] = useState(new Set());

  useEffect(() => {
    if (isRadarActive && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().catch(console.error);
      }
    }
  }, [isRadarActive]);

  const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  useEffect(() => {
    if (!isRadarActive || !userLocation || !spaces || spaces.length === 0) return;

    const ALERT_RADIUS_METERS = 750;

    for (const space of spaces) {
      if (!space.latitude || !space.longitude) continue;

      const dist = calculateDistanceMeters(
        userLocation.lat,
        userLocation.lng,
        space.latitude,
        space.longitude
      );

      if (dist <= ALERT_RADIUS_METERS && !notifiedIds.has(space.id)) {
        setNotifiedIds(prev => new Set(prev).add(space.id));
        const meta = getCategoryMeta(space.sport_category);

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`${space.name} nas proximidades!`, {
            body: `Você está a ${dist}m de um espaço de ${space.sport_category}.`,
            icon: '/favicon.svg'
          });
        }

        setActiveAlert({
          space,
          distance: dist,
          meta
        });
        break;
      }
    }
  }, [userLocation, spaces, isRadarActive]);

  if (!isRadarActive || !activeAlert) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in slide-in-from-bottom duration-300">
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-emerald-500/50 flex items-center justify-between gap-3 backdrop-blur-lg">
        
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-500/30">
            {activeAlert.meta.initial}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Radar: {activeAlert.distance}m de distância
              </p>
            </div>
            <h4 className="font-bold text-sm text-slate-100 line-clamp-1">{activeAlert.space.name}</h4>
            <p className="text-xs text-slate-400">
              {activeAlert.space.sport_category} • {activeAlert.space.is_public ? 'Acesso Livre' : 'Aluguel'}
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
