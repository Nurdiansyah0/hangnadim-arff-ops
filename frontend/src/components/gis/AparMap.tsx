import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../../lib/axios';
import { Loader2 } from 'lucide-react';

// Custom icons based on status
const createCustomIcon = (status: string) => {
  const color = 
    status === 'ACTIVE' ? '#10b981' : // emerald-500
    status === 'MAINTENANCE' ? '#f59e0b' : // orange-500
    status === 'EXPIRED' ? '#ef4444' : // red-500
    '#64748b'; // slate-500

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 4px 8px rgba(0,0,0,0.5);
      ">
        <div style="transform: rotate(45deg); color: white;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
        </div>
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

export default function AparMap() {
  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGeoJSON = async () => {
      try {
        const res = await api.get('/fire-extinguishers/geojson');
        setGeoData(res.data);
      } catch (err) {
        console.error('Failed to fetch APAR GeoJSON', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGeoJSON();
  }, []);

  if (loading) {
    return (
      <div className="h-[600px] w-full bg-slate-900/40 rounded-3xl flex flex-col items-center justify-center text-slate-500 border border-slate-800 animate-pulse">
        <Loader2 className="animate-spin mb-4" size={40} />
        <span className="font-bold tracking-widest uppercase text-xs">Initializing GIS Engine...</span>
      </div>
    );
  }

  return (
    <div className="h-[650px] w-full rounded-4xl overflow-hidden border border-slate-800 shadow-2xl relative z-10 transition-all">
      <MapContainer
        center={[1.1211, 104.1192]} // Hang Nadim Airport Center
        zoom={16}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.osm.org/{z}/{x}/{y}.png"
        />
        
        {geoData && (
          <GeoJSON 
            data={geoData} 
            pointToLayer={(feature, latlng) => {
              const status = feature.properties.status;
              return L.marker(latlng, { icon: createCustomIcon(status) });
            }}
            onEachFeature={(feature, layer) => {
              const p = feature.properties;
              layer.bindPopup(`
                <div class="p-3 min-w-[220px] font-sans">
                  <div class="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                    <span class="text-orange-600 font-black tracking-tighter text-lg uppercase">#${p.serial_number}</span>
                    <span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                         p.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 
                         p.status === 'MAINTENANCE' ? 'bg-orange-100 text-orange-700' : 
                         'bg-red-100 text-red-700'
                       }">${p.status}</span>
                  </div>
                  <div class="space-y-2 text-xs text-slate-600">
                    <div class="flex justify-between">
                      <span class="text-slate-400 font-bold uppercase tracking-wider">Type</span>
                      <span class="text-slate-900 font-medium">${p.agent_type}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-400 font-bold uppercase tracking-wider">Capacity</span>
                      <span class="text-slate-900 font-medium">${p.capacity_kg} kg</span>
                    </div>
                    <div class="border-t border-slate-100 pt-2 mt-2">
                       <p class="text-[9px] text-slate-400 font-black uppercase mb-1">Location</p>
                       <p class="text-slate-900 font-bold">${p.building || 'Main Terminal'} - ${p.floor || 'Level 1'}</p>
                       <p class="text-slate-500 italic mt-1 font-medium">${p.location_description || 'No detailed description'}</p>
                    </div>
                  </div>
                </div>
              `);
            }}
          />
        )}
      </MapContainer>
      
      {/* Legend Overlay */}
      <div className="absolute bottom-6 left-6 z-20 bg-slate-950/90 backdrop-blur-md p-4 rounded-2xl border border-slate-800 pointer-events-none shadow-2xl">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Map Legend</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <span className="text-xs text-slate-300 font-medium">Ready / Active</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
            <span className="text-xs text-slate-300 font-medium">Maintenance</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
            <span className="text-xs text-slate-300 font-medium">Expired / Missing</span>
          </div>
        </div>
      </div>
    </div>
  );
}
