import { useState, useEffect, useRef, useCallback } from 'react';
import { GeoKalmanFilter } from '../utils/geoKalmanFilter';

export type LocationStatus = 'IDLE' | 'CAPTURING' | 'SUCCESS' | 'ERROR';

export const useGeolocation = () => {
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lng: number} | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('IDLE');
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [filteredAccuracy, setFilteredAccuracy] = useState<number | null>(null);
  const [kalmanSamples, setKalmanSamples] = useState(0);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const kalman = useRef(new GeoKalmanFilter());

  const captureLocation = useCallback((): Promise<{lat: number, lng: number, accuracy: number}> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        setLocationStatus('ERROR');
        reject('Geolocation not supported');
        return;
      }

      setLocationStatus('CAPTURING');
      let bestFix: {lat: number, lng: number, accuracy: number} | null = null;
      let resolvedEarly = false;
      const GOOD_ACCURACY = 20; 
      const MAX_WAIT = 15_000;

      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          if (accuracy > 150) return;

          const filtered = kalman.current.update(latitude, longitude, accuracy);
          setLocationAccuracy(accuracy);
          setFilteredAccuracy(filtered.estAccuracy);
          setKalmanSamples(kalman.current.samples);
          setCurrentCoords({ lat: filtered.lat, lng: filtered.lng });
          setLocationStatus('SUCCESS');

          const fix = { lat: filtered.lat, lng: filtered.lng, accuracy: filtered.estAccuracy };
          if (!bestFix || filtered.estAccuracy < bestFix.accuracy) bestFix = fix;

          if (filtered.estAccuracy <= GOOD_ACCURACY && !resolvedEarly) {
            resolvedEarly = true;
            navigator.geolocation.clearWatch(watchId);
            resolve(fix);
          }
        },
        (err) => {
          if (err.code !== 3) console.debug('GPS capture error:', err.message);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: MAX_WAIT
        }
      );

      setTimeout(() => {
        navigator.geolocation.clearWatch(watchId);
        if (!resolvedEarly) {
          if (bestFix) {
            resolve(bestFix);
          } else {
            setLocationStatus('ERROR');
            setLocationError('SIGNAL TIMEOUT (SATELLITE SEARCH FAILED)');
            reject(new Error('GPS timeout after 15s'));
          }
        }
      }, MAX_WAIT);
    });
  }, []);

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (accuracy > 150) return;

        const filtered = kalman.current.update(latitude, longitude, accuracy);
        setCurrentCoords({ lat: filtered.lat, lng: filtered.lng });
        setLocationAccuracy(accuracy);
        setFilteredAccuracy(filtered.estAccuracy);
        setKalmanSamples(kalman.current.samples);
        setLocationStatus('SUCCESS');
      },
      (err) => {
        if (err.code !== 3) {
           console.debug('[Radar] GPS recalibrating…', err.message);
        }
      },
      { 
          enableHighAccuracy: true, 
          maximumAge: 0,
          timeout: 10_000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return {
    currentCoords,
    locationStatus,
    locationAccuracy,
    filteredAccuracy,
    kalmanSamples,
    locationError,
    setLocationError,
    captureLocation
  };
};
