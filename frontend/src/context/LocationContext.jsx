import { createContext, useContext, useEffect, useState } from "react";

const LocationContext = createContext();

const LOCATION_STORAGE_KEY = "screenly_selected_state";

const getInitialLocation = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(LOCATION_STORAGE_KEY) || null;
};

export const LocationProvide = ({ children }) => {
  const [location, setLocation] = useState(getInitialLocation());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!location) {
      localStorage.removeItem(LOCATION_STORAGE_KEY);
      return;
    }

    localStorage.setItem(LOCATION_STORAGE_KEY, location);
  }, [location]);

  useEffect(() => {
    const fallbackToStoredLocation = (message) => {
      setError(message);
      setLoading(false);
    };

    const fetchLocationData = async (latitude, longitude) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        );
        const data = await res.json();
        const detectedState = data?.address?.state;

        if (detectedState) {
          setLocation(detectedState);
          setError(null);
        } else {
          fallbackToStoredLocation("Unable to detect your state. Using saved location.");
          return;
        }
      } catch (_error) {
        fallbackToStoredLocation("Failed to fetch location data. Using saved location.");
        return;
      }

      setLoading(false);
    };

    if (!navigator.geolocation) {
      fallbackToStoredLocation("Geolocation is not supported. Using saved location.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchLocationData(latitude, longitude);
      },
      () => {
        fallbackToStoredLocation("Location access denied. Using saved location.");
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 1000 * 60 * 60,
      },
    );
  }, []);

  return (
    <LocationContext.Provider value={{ location, setLocation, loading, error }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => useContext(LocationContext);
