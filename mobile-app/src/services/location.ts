import * as Location from "expo-location";

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

class LocationService {
  private watchSubscription: Location.LocationSubscription | null = null;

  async requestPermissions(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  }

  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error("Error getting location:", error);
      return null;
    }
  }

  async startWatching(
    callback: (location: LocationData) => void,
    options?: { interval?: number }
  ): Promise<void> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    this.watchSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: options?.interval || 5000,
        distanceInterval: 10,
      },
      (location) => {
        callback({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: location.timestamp,
        });
      }
    );
  }

  stopWatching(): void {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }
  }

  getGeohash(latitude: number, longitude: number, precision: number = 6): string {
    // Simple geohash implementation
    const base32 = "0123456789bcdefghjkmnpqrstuvwxyz";
    let minLat = -90, maxLat = 90;
    let minLng = -180, maxLng = 180;
    let hash = "";
    let isEven = true;
    let bit = 0;
    let ch = 0;

    while (hash.length < precision) {
      if (isEven) {
        const mid = (minLng + maxLng) / 2;
        if (longitude > mid) {
          ch |= 1 << (4 - bit);
          minLng = mid;
        } else {
          maxLng = mid;
        }
      } else {
        const mid = (minLat + maxLat) / 2;
        if (latitude > mid) {
          ch |= 1 << (4 - bit);
          minLat = mid;
        } else {
          maxLat = mid;
        }
      }
      isEven = !isEven;
      if (bit < 4) {
        bit++;
      } else {
        hash += base32[ch];
        bit = 0;
        ch = 0;
      }
    }
    return hash;
  }
}

export const locationService = new LocationService();
