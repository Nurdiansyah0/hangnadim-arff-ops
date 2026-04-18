/**
 * GeoKalmanFilter — 1D Kalman Filter applied independently to lat & lng.
 * R (measurement noise) is derived from the GPS-reported accuracy².
 * Q (process noise) models expected position drift between readings.
 * The filter converges rapidly: after ~5 fixes the estimate is significantly
 * smoother than raw GPS, and after ~15 fixes approaches theoretical maximum
 * precision for the device hardware.
 */
export class GeoKalmanFilter {
  private _lat = 0;
  private _lng = 0;
  private _P_lat = 1;   // error covariance (lat)
  private _P_lng = 1;   // error covariance (lng)
  private _Q = 3e-10;   // process noise — tuned for a stationary/slow-walking inspector
  private _ready = false;
  public samples = 0;

  // Returns filtered {lat, lng} and the estimated position variance in metres
  update(lat: number, lng: number, accMetres: number): { lat: number; lng: number; estAccuracy: number } {
    // Convert GPS accuracy (metres) → degrees² variance
    // 1 degree ≈ 111,139 m  →  1m ≈ 9e-6 deg
    const deg_per_metre = 1 / 111_139;
    const R = Math.pow(accMetres * deg_per_metre, 2);

    if (!this._ready) {
      this._lat = lat; this._lng = lng;
      this._P_lat = R;  this._P_lng = R;
      this._ready = true;
      this.samples = 1;
      return { lat, lng, estAccuracy: accMetres };
    }

    // === Predict ===
    this._P_lat += this._Q;
    this._P_lng += this._Q;

    // === Kalman Gain ===
    const K_lat = this._P_lat / (this._P_lat + R);
    const K_lng = this._P_lng / (this._P_lng + R);

    // === Update / Correct ===
    this._lat += K_lat * (lat - this._lat);
    this._lng += K_lng * (lng - this._lng);
    this._P_lat *= (1 - K_lat);
    this._P_lng *= (1 - K_lng);
    this.samples++;

    // Estimated accuracy in metres from the largest covariance dimension
    const estVarDeg = Math.max(this._P_lat, this._P_lng);
    const estAccuracy = Math.sqrt(estVarDeg) * 111_139;

    return { lat: this._lat, lng: this._lng, estAccuracy };
  }

  reset() { this._ready = false; this.samples = 0; }
}
