import { useDeferredValue, useEffect, useState } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import { divIcon, latLngBounds } from "leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

type Interest =
  | "landmarks"
  | "food"
  | "museums"
  | "outdoors"
  | "shopping"
  | "nightlife";

type AppRoute = "/" | "/itinerary" | "/trip-view" | "/login";
type ThemeMode = "light" | "dark";
type AuthCredentials = {
  username: string;
  password: string;
};

type ActivityCoordinates = {
  lon: number | null;
  lat: number | null;
};

type ItineraryActivity = {
  id: string;
  name: string;
  category: string;
  address: string;
  suggestedTimeSlot?: string;
  estimatedDurationMinutes: number;
  coordinates?: ActivityCoordinates;
};

type ItineraryDay = {
  dayNumber: number;
  activities: ItineraryActivity[];
};

type GenerateResponse = {
  _id?: string;
  title?: string;
  shareToken?: string;
  createdAt?: string;
  updatedAt?: string;
  tripInput: {
    destinationCity: string;
    days: number;
    interests: Interest[];
    selectedAttractions?: string[];
    constraints: {
      maxActivitiesPerDay: number;
      blockedWindows: BlockedWindow[];
    };
  };
  itineraryDays: ItineraryDay[];
  metadata?: {
    provider: string;
    fetchedPlaces: number;
    uniquePlaces: number;
    categoryQuery: string;
    geoFilter: string;
  };
  notes?: string[];
  unassignedActivities?: ItineraryActivity[];
  error?: string;
};

type SavedTripSummary = {
  _id: string;
  title?: string;
  tripInput: {
    destinationCity: string;
    days: number;
    interests: string[];
  };
  createdAt: string;
  updatedAt: string;
};

type BlockedWindow = {
  day: number;
  timeSlot: string;
  label: string;
};

type NavItem = {
  route: AppRoute;
  label: string;
  eyebrow: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

const interestOptions: { value: Interest; label: string; description: string }[] = [
  { value: "landmarks", label: "Landmarks", description: "Iconic city highlights" },
  { value: "food", label: "Food", description: "Restaurants and local favorites" },
  { value: "museums", label: "Museums", description: "Culture, art, and exhibits" },
  { value: "outdoors", label: "Outdoors", description: "Parks and open-air spots" },
  { value: "shopping", label: "Shopping", description: "Boutiques and retail areas" },
  { value: "nightlife", label: "Nightlife", description: "Bars, music, and evening plans" },
];

const navItems: NavItem[] = [
  { route: "/", label: "Trip Details", eyebrow: "Step 1" },
  { route: "/itinerary", label: "Itinerary", eyebrow: "Step 2" },
  { route: "/trip-view", label: "View Trip", eyebrow: "Step 3" },
];

const timeSlots = ["Morning", "Late Morning", "Afternoon", "Evening", "Night"];

const getRouteFromPath = (pathname: string): AppRoute => {
  if (pathname === "/itinerary") return "/itinerary";
  if (pathname === "/trip-view") return "/trip-view";
  return "/";
};


const slotForIndex = (index: number) => timeSlots[Math.min(index, timeSlots.length - 1)];
const themeStorageKey = "nextstop-theme";
const hasCoordinates = (
  activity: ItineraryActivity
): activity is ItineraryActivity & { coordinates: { lon: number; lat: number } } =>
  Boolean(
    activity.coordinates &&
      typeof activity.coordinates.lon === "number" &&
      typeof activity.coordinates.lat === "number"
  );

const toRadians = (value: number) => (value * Math.PI) / 180;

const getDistanceMiles = (
  start: { lat: number; lon: number },
  end: { lat: number; lon: number }
) => {
  const earthRadiusMiles = 3958.8;
  const deltaLat = toRadians(end.lat - start.lat);
  const deltaLon = toRadians(end.lon - start.lon);
  const lat1 = toRadians(start.lat);
  const lat2 = toRadians(end.lat);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;

  return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const getDayRouteDistance = (activities: ItineraryActivity[]) => {
  let total = 0;
  for (let index = 1; index < activities.length; index += 1) {
    const previous = activities[index - 1];
    const current = activities[index];
    if (!hasCoordinates(previous) || !hasCoordinates(current)) continue;
    total += getDistanceMiles(previous.coordinates, current.coordinates);
  }
  return total;
};

const formatDistance = (distance: number) =>
  distance < 0.1 ? "< 0.1 mi" : `${distance.toFixed(1)} mi`;

function FitMapToPoints({ points }: { points: LatLngExpression[] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;

    if (points.length === 1) {
      map.setView(points[0], 13);
      return;
    }

    map.fitBounds(latLngBounds(points), {
      padding: [32, 32],
    });
  }, [map, points]);

  return null;
}

const createStopIcon = (label: string) =>
  divIcon({
    className: "trip-map-pin-icon",
    html: `<div class="trip-map-pin">${label}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

const getInitialTheme = (): ThemeMode => {
  if (typeof window === "undefined") return "light";
  const savedTheme = window.localStorage.getItem(themeStorageKey);
  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }
  return "light";
};

function App() {
  const [auth, setAuth] = useState<AuthCredentials | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [route, setRoute] = useState<AppRoute>(getRouteFromPath(window.location.pathname));
  const [destinationCity, setDestinationCity] = useState("Atlanta, GA");
  const [days, setDays] = useState(2);
  const [maxActivitiesPerDay, setMaxActivitiesPerDay] = useState(3);
  const [selectedInterests, setSelectedInterests] = useState<Interest[]>([
    "landmarks",
    "food",
  ]);
  const [cityAttractions, setCityAttractions] = useState<string[]>([]);
  const [selectedAttractions, setSelectedAttractions] = useState<string[]>([]);
  const [loadingCityAttractions, setLoadingCityAttractions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);
  const [loadingSavedTrips, setLoadingSavedTrips] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [savedTrips, setSavedTrips] = useState<SavedTripSummary[]>([]);
  const [blockedWindows, setBlockedWindows] = useState<BlockedWindow[]>([]);
  const [selectedUnassignedByDay, setSelectedUnassignedByDay] = useState<Record<number, string>>(
    {}
  );
  const deferredDestinationCity = useDeferredValue(destinationCity);
  const isLoggedIn = auth !== null;

  const getAuthHeaders = (credentials: AuthCredentials | null = auth): Record<string, string> => {
    if (!credentials) return {};

    return {
      "x-nextstop-username": credentials.username,
      "x-nextstop-password": credentials.password,
    };
  };

  const navigate = (nextRoute: AppRoute) => {
    if (window.location.pathname !== nextRoute) {
      window.history.pushState({}, "", nextRoute);
    }
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const syncTripInputs = (trip: GenerateResponse) => {
    setDestinationCity(trip.tripInput.destinationCity);
    setDays(trip.tripInput.days);
    setMaxActivitiesPerDay(trip.tripInput.constraints.maxActivitiesPerDay);
    setSelectedAttractions(trip.tripInput.selectedAttractions || []);
    const validInterests = trip.tripInput.interests.filter((interest): interest is Interest =>
      ["landmarks", "food", "museums", "outdoors", "shopping", "nightlife"].includes(interest)
    );
    setSelectedInterests(validInterests.length > 0 ? validInterests : ["landmarks", "food"]);
    const savedWindows = trip.tripInput.constraints.blockedWindows;
    if (Array.isArray(savedWindows)) {
      setBlockedWindows(
        savedWindows.filter(
          (bw): bw is BlockedWindow =>
            typeof bw === "object" &&
            bw !== null &&
            typeof (bw as BlockedWindow).day === "number" &&
            typeof (bw as BlockedWindow).timeSlot === "string"
        )
      );
    } else {
      setBlockedWindows([]);
    }
  };

  const addBlockedWindow = (window: BlockedWindow) => {
    setBlockedWindows((current) => {
      const alreadyBlocked = current.some(
        (bw) => bw.day === window.day && bw.timeSlot === window.timeSlot
      );
      return alreadyBlocked ? current : [...current, window];
    });
  };

  const removeBlockedWindow = (index: number) => {
    setBlockedWindows((current) => current.filter((_, i) => i !== index));
  };

  const toggleInterest = (interest: Interest) => {
    setSelectedInterests((current) => {
      if (current.includes(interest)) {
        if (current.length === 1) return current;
        return current.filter((item) => item !== interest);
      }
      return [...current, interest];
    });
  };

  const toggleAttraction = (attraction: string) => {
    setSelectedAttractions((current) =>
      current.includes(attraction)
        ? current.filter((item) => item !== attraction)
        : [...current, attraction]
    );
  };

  const loadSavedTrips = async () => {
    if (!auth) {
      setSavedTrips([]);
      return;
    }

    setLoadingSavedTrips(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/itinerary/saved`, {
        headers: getAuthHeaders(),
      });
      const data = (await response.json()) as { trips?: SavedTripSummary[]; error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Failed to load saved itineraries.");
      }
      setSavedTrips(data.trips || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load saved trips";
      setError(message);
    } finally {
      setLoadingSavedTrips(false);
    }
  };

  const loadSavedTrip = async (tripId: string, targetRoute: AppRoute = "/itinerary") => {
    if (!auth) return;

    setLoading(true);
    setError("");
    setSaveMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/itinerary/saved/${tripId}`, {
        headers: getAuthHeaders(),
      });
      const data = (await response.json()) as { trip?: GenerateResponse; error?: string };
      if (!response.ok || !data.trip) {
        throw new Error(data.error || "Failed to load itinerary.");
      }

      setResult(data.trip);
      syncTripInputs(data.trip);
      navigate(targetRoute);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load itinerary";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const generateItinerary = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSaveMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/itinerary/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destinationCity,
          days,
          interests: selectedInterests,
          selectedAttractions,
          constraints: {
            maxActivitiesPerDay,
            blockedWindows,
          },
        }),
      });

      const data = (await response.json()) as GenerateResponse;

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate itinerary.");
      }

      setResult(data);
      navigate("/itinerary");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const saveCurrentItinerary = async () => {
    if (!result || !auth) return;

    setSaving(true);
    setError("");
    setSaveMessage("");

    try {
      const isUpdate = Boolean(result._id);
      const endpoint = isUpdate
        ? `${API_BASE_URL}/api/itinerary/saved/${result._id}`
        : `${API_BASE_URL}/api/itinerary/save`;

      const response = await fetch(endpoint, {
        method: isUpdate ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          username: auth.username,
          password: auth.password,
          title: `${result.tripInput.destinationCity} (${result.tripInput.days} day trip)`,
          tripInput: result.tripInput,
          itineraryDays: result.itineraryDays,
          metadata: result.metadata || {},
          notes: result.notes || [],
          unassignedActivities: result.unassignedActivities || [],
        }),
      });

      const data = (await response.json()) as {
        error?: string;
        message?: string;
        savedTrip?: GenerateResponse;
        updatedTrip?: GenerateResponse;
      };

      if (!response.ok) {
        throw new Error(data.error || "Failed to save itinerary.");
      }

      if (data.savedTrip) {
        setResult(data.savedTrip);
      }
      if (data.updatedTrip) {
        setResult(data.updatedTrip);
      }

      setSaveMessage(data.message || "Itinerary saved.");
      await loadSavedTrips();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save itinerary";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const deleteSavedTrip = async (tripId: string) => {
    if (!auth) return;

    setDeletingTripId(tripId);
    setError("");
    setSaveMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/itinerary/saved/${tripId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete itinerary.");
      }

      if (result?._id === tripId) {
        setResult(null);
      }

      setSaveMessage(data.message || "Itinerary deleted.");
      await loadSavedTrips();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete itinerary";
      setError(message);
    } finally {
      setDeletingTripId(null);
    }
  };

  const removeActivityFromDay = (dayNumber: number, activityId: string) => {
    setResult((current) => {
      if (!current) return current;

      let removed: ItineraryActivity | null = null;
      const nextDays = current.itineraryDays.map((day) => {
        if (day.dayNumber !== dayNumber) return day;

        const remaining = day.activities
          .filter((activity) => {
            if (activity.id === activityId) {
              removed = activity;
              return false;
            }
            return true;
          })
          .map((activity, idx) => ({ ...activity, suggestedTimeSlot: slotForIndex(idx) }));

        return { ...day, activities: remaining };
      });

      if (!removed) return current;
      const removedActivity: ItineraryActivity = removed;

      const unassigned = [
        ...(current.unassignedActivities || []),
        { ...removedActivity, suggestedTimeSlot: "" },
      ];

      return { ...current, itineraryDays: nextDays, unassignedActivities: unassigned };
    });
  };

  const addUnassignedToDay = (dayNumber: number) => {
    const chosenId = selectedUnassignedByDay[dayNumber];
    if (!chosenId) return;

    setResult((current) => {
      if (!current) return current;

      const unassigned = current.unassignedActivities || [];
      const chosen = unassigned.find((activity) => activity.id === chosenId);
      if (!chosen) return current;

      const nextUnassigned = unassigned.filter((activity) => activity.id !== chosenId);
      const nextDays = current.itineraryDays.map((day) => {
        if (day.dayNumber !== dayNumber) return day;
        const nextActivities = [
          ...day.activities,
          { ...chosen, suggestedTimeSlot: slotForIndex(day.activities.length) },
        ];
        return { ...day, activities: nextActivities };
      });

      return { ...current, itineraryDays: nextDays, unassignedActivities: nextUnassigned };
    });

    setSelectedUnassignedByDay((current) => ({ ...current, [dayNumber]: "" }));
  };

  const copyShareLink = async () => {
    if (!result?._id || !auth) return;
    try {
      let token = result.shareToken;
      if (!token) {
        const response = await fetch(
          `${API_BASE_URL}/api/itinerary/saved/${result._id}/share`,
          {
            method: "POST",
            headers: getAuthHeaders(),
          }
        );
        const data = (await response.json()) as { shareToken?: string; error?: string };
        if (!response.ok || !data.shareToken) {
          throw new Error(data.error || "Failed to generate share link.");
        }
        token = data.shareToken;
        setResult((current) => (current ? { ...current, shareToken: token } : current));
      }
      await navigator.clipboard.writeText(
        `${window.location.origin}/shared/${token}`
      );
      setSaveMessage("Share link copied to clipboard!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to copy link.");
    }
  };

  useEffect(() => {
    if (!auth) {
      setSavedTrips([]);
      return;
    }

    const loadTripsForUser = async () => {
      const authHeaders = {
        "x-nextstop-username": auth.username,
        "x-nextstop-password": auth.password,
      };

      setLoadingSavedTrips(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/itinerary/saved`, {
          headers: authHeaders,
        });
        const data = (await response.json()) as { trips?: SavedTripSummary[]; error?: string };
        if (!response.ok) {
          throw new Error(data.error || "Failed to load saved itineraries.");
        }
        setSavedTrips(data.trips || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load saved trips";
        setError(message);
      } finally {
        setLoadingSavedTrips(false);
      }
    };

    void loadTripsForUser();
  }, [auth]);

  useEffect(() => {
    const city = deferredDestinationCity.trim();
    if (!city) {
      setCityAttractions([]);
      setSelectedAttractions([]);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const loadAttractions = async () => {
      setLoadingCityAttractions(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/itinerary/city-attractions?city=${encodeURIComponent(city)}`,
          { signal: controller.signal }
        );
        const data = (await response.json()) as { attractions?: string[] };
        if (!response.ok) {
          throw new Error("Failed to load city attractions.");
        }
        if (cancelled) return;
        const attractions = data.attractions || [];
        setCityAttractions(attractions);
        setSelectedAttractions((current) =>
          current.filter((attraction) => attractions.includes(attraction))
        );
      } catch {
        if (controller.signal.aborted || cancelled) return;
        setCityAttractions([]);
        setSelectedAttractions([]);
      } finally {
        if (!cancelled) {
          setLoadingCityAttractions(false);
        }
      }
    };

    void loadAttractions();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [deferredDestinationCity]);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(getRouteFromPath(window.location.pathname));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

  // Shared itinerary view — public, no login required
  if (window.location.pathname.startsWith("/shared/")) {
    const token = window.location.pathname.replace("/shared/", "");
    return (
      <SharedItineraryPage
        token={token}
        apiBase={API_BASE_URL}
        theme={theme}
        onToggleTheme={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
      />
    );
  }

  if (!isLoggedIn) {
    return (
      <LoginPage
        onLogin={(nextAuth) => {
          setAuth(nextAuth);
          setError("");
          setSaveMessage("");
        }}
        theme={theme}
        onToggleTheme={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
      />
    );
  }

  return (
    <div className="app-shell">
      <div className="app-background" />

      <header className="app-topnav">
        <div className="app-topnav__brand">
          <span className="topnav-kicker">NextStop</span>
          <span className="topnav-title">Planner</span>
        </div>

        <nav className="app-topnav__steps" aria-label="Trip planning steps">
          {navItems.map((item) => (
            <button
              key={item.route}
              type="button"
              className={`topnav-step ${route === item.route ? "is-active" : ""}`}
              onClick={() => navigate(item.route)}
            >
              <span className="topnav-step__eyebrow">{item.eyebrow}</span>
              <span className="topnav-step__label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="topnav-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            <span className="theme-toggle__icon" aria-hidden="true">
              {theme === "light" ? "◐" : "◑"}
            </span>
            <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
          </button>

          <button
            type="button"
            className="logout-button"
            onClick={() => {
              setAuth(null);
              setResult(null);
              setSavedTrips([]);
              setError("");
              setSaveMessage("");
              navigate("/");
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="app-page-content">
        {(error || saveMessage) && (
          <div className="status-stack">
            {error && <div className="status-banner status-banner--error">{error}</div>}
            {saveMessage && (
              <div className="status-banner status-banner--success">{saveMessage}</div>
            )}
          </div>
        )}

        {route === "/" && (
          <DetailsPage
            destinationCity={destinationCity}
            days={days}
            maxActivitiesPerDay={maxActivitiesPerDay}
            selectedInterests={selectedInterests}
            blockedWindows={blockedWindows}
            cityAttractions={cityAttractions}
            selectedAttractions={selectedAttractions}
            loadingCityAttractions={loadingCityAttractions}
            loading={loading}
            result={result}
            onDestinationChange={setDestinationCity}
            onDaysChange={setDays}
            onMaxActivitiesChange={setMaxActivitiesPerDay}
            onToggleInterest={toggleInterest}
            onToggleAttraction={toggleAttraction}
            onAddBlockedWindow={addBlockedWindow}
            onRemoveBlockedWindow={removeBlockedWindow}
            onSubmit={generateItinerary}
            onNavigate={navigate}
          />
        )}

        {route === "/itinerary" && (
          <ItineraryPage
            loading={loading}
            result={result}
            saving={saving}
            savedTrips={savedTrips}
            loadingSavedTrips={loadingSavedTrips}
            deletingTripId={deletingTripId}
            selectedUnassignedByDay={selectedUnassignedByDay}
            onSelectedUnassignedChange={setSelectedUnassignedByDay}
            onSave={saveCurrentItinerary}
            onCopyLink={copyShareLink}
            onPrint={() => window.print()}
            onRemoveActivity={removeActivityFromDay}
            onAddUnassigned={addUnassignedToDay}
            onLoadTrip={loadSavedTrip}
            onDeleteTrip={deleteSavedTrip}
            onRefreshTrips={loadSavedTrips}
            onNavigate={navigate}
          />
        )}

        {route === "/trip-view" && (
          <TripViewPage
            result={result}
            loading={loading}
            onNavigate={navigate}
          />
        )}
      </div>
    </div>
  );
}

type DetailsPageProps = {
  destinationCity: string;
  days: number;
  maxActivitiesPerDay: number;
  selectedInterests: Interest[];
  blockedWindows: BlockedWindow[];
  cityAttractions: string[];
  selectedAttractions: string[];
  loadingCityAttractions: boolean;
  loading: boolean;
  result: GenerateResponse | null;
  onDestinationChange: (value: string) => void;
  onDaysChange: (value: number) => void;
  onMaxActivitiesChange: (value: number) => void;
  onToggleInterest: (value: Interest) => void;
  onToggleAttraction: (value: string) => void;
  onAddBlockedWindow: (window: BlockedWindow) => void;
  onRemoveBlockedWindow: (index: number) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onNavigate: (route: AppRoute) => void;
};

function DetailsPage({
  destinationCity,
  days,
  maxActivitiesPerDay,
  selectedInterests,
  blockedWindows,
  cityAttractions,
  selectedAttractions,
  loadingCityAttractions,
  loading,
  result,
  onDestinationChange,
  onDaysChange,
  onMaxActivitiesChange,
  onToggleInterest,
  onToggleAttraction,
  onAddBlockedWindow,
  onRemoveBlockedWindow,
  onSubmit,
  onNavigate,
}: DetailsPageProps) {
  const [isInterestOpen, setIsInterestOpen] = useState(false);
  const [newBlockDay, setNewBlockDay] = useState(1);
  const [newBlockSlot, setNewBlockSlot] = useState<string>("Morning");
  const [newBlockLabel, setNewBlockLabel] = useState("");

  const handleAddBlock = () => {
    onAddBlockedWindow({ day: newBlockDay, timeSlot: newBlockSlot, label: newBlockLabel.trim() });
    setNewBlockLabel("");
  };

  return (
    <main className="page-stack">
      <section className="surface-card surface-card--form">
        <div className="planner-hero">
          <div>
            <span className="hero-kicker">City trip planner</span>
            <h1>Build your travel itinerary!</h1>
            <p>
              Choose a destination, pick your interests, and put in any blocked times in your schedule.
            </p>
          </div>
          <div className="planner-hero__badge">
            <span>Quick setup</span>
            <strong>Food, landmarks, museums, outdoors, shopping, and nightlife</strong>
          </div>
        </div>

        <div className="section-heading">
          <span className="section-heading__kicker">Trip Setup</span>
          <h2>Set up your trip.</h2>
          <p>
            Fill this out first, then generate the itinerary.
          </p>
        </div>

        <form onSubmit={onSubmit} className="planner-form">
          <label className="field">
            <span className="field__label">Destination City</span>
            <input
              className="field__input"
              value={destinationCity}
              onChange={(event) => onDestinationChange(event.target.value)}
              placeholder="e.g. Atlanta, GA"
              required
            />
          </label>

          <div className="field-grid">
            <label className="field">
              <span className="field__label">Days</span>
              <input
                className="field__input"
                type="number"
                min={1}
                max={14}
                value={days}
                onChange={(event) => onDaysChange(Number(event.target.value))}
              />
            </label>

            <label className="field">
              <span className="field__label">Activities Per Day</span>
              <input
                className="field__input"
                type="number"
                min={1}
                max={6}
                value={maxActivitiesPerDay}
                onChange={(event) => onMaxActivitiesChange(Number(event.target.value))}
              />
            </label>
          </div>

          <div className="field">
            <span className="field__label">Must-See Attractions</span>
            {loadingCityAttractions ? (
              <div className="helper-text">Looking up top attractions for this city...</div>
            ) : cityAttractions.length > 0 ? (
              <>
                <div className="helper-text">
                  Pick any attractions you want guaranteed in the itinerary before the
                  regular category picks are added.
                </div>
                <div className="interest-grid">
                  {cityAttractions.map((attraction) => {
                    const isSelected = selectedAttractions.includes(attraction);
                    return (
                      <button
                        key={attraction}
                        type="button"
                        className={`interest-pill attraction-pill ${
                          isSelected ? "is-selected" : ""
                        }`}
                        onClick={() => onToggleAttraction(attraction)}
                      >
                        <span className="interest-pill__title">{attraction}</span>
                        <span className="interest-pill__text">Must-see in this city</span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="helper-text">
                No curated top-attraction list for this city yet. You can still build the
                trip with interests below.
              </div>
            )}
          </div>

          <div className="field">
            <span className="field__label">Interests</span>
            <div className="interest-dropdown">
              <button
                type="button"
                className="interest-dropdown__trigger field__input"
                onClick={() => setIsInterestOpen((o) => !o)}
              >
                <span>
                  {selectedInterests.length === interestOptions.length
                    ? "All categories selected"
                    : `${selectedInterests.length} categor${selectedInterests.length === 1 ? "y" : "ies"} selected`}
                </span>
                <span className="interest-dropdown__arrow">{isInterestOpen ? "▲" : "▼"}</span>
              </button>
              {isInterestOpen && (
                <div className="interest-dropdown__panel">
                  {interestOptions.map((option) => {
                    const isSelected = selectedInterests.includes(option.value);
                    return (
                      <label key={option.value} className="interest-checkbox-item">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleInterest(option.value)}
                        />
                        <span className="interest-checkbox-item__content">
                          <span className="interest-checkbox-item__label">{option.label}</span>
                          <span className="interest-checkbox-item__desc">{option.description}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="field">
            <span className="field__label">Blocked Time Windows</span>
            <div className="helper-text">
              Block time slots reserved for conferences, meetings, or rest — nothing will be
              scheduled in those windows.
            </div>
            <div className="blocked-window-form">
              <select
                className="field__input"
                value={newBlockDay}
                onChange={(e) => setNewBlockDay(Number(e.target.value))}
              >
                {Array.from({ length: days }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>Day {d}</option>
                ))}
              </select>
              <select
                className="field__input"
                value={newBlockSlot}
                onChange={(e) => setNewBlockSlot(e.target.value)}
              >
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
              <input
                className="field__input"
                placeholder="Label (e.g. Conference)"
                value={newBlockLabel}
                onChange={(e) => setNewBlockLabel(e.target.value)}
              />
              <button type="button" className="secondary-button" onClick={handleAddBlock}>
                Block
              </button>
            </div>
            {blockedWindows.length > 0 && (
              <div className="blocked-window-list">
                {blockedWindows.map((bw, index) => (
                  <div key={index} className="blocked-window-item">
                    <span>Day {bw.day} · {bw.timeSlot}{bw.label ? ` — ${bw.label}` : ""}</span>
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => onRemoveBlockedWindow(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="planner-actions">
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? "Generating itinerary..." : "Generate itinerary"}
            </button>

            {result && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => onNavigate("/itinerary")}
              >
                View current itinerary
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="surface-card surface-card--compact">
        <div className="trip-summary">
          <div className="trip-summary__label">Current draft</div>
          <div className="trip-summary__value">{destinationCity}</div>
          <div className="trip-summary__meta">
            {days} day trip with up to {maxActivitiesPerDay} activities per day
          </div>
          <div className="chip-row">
            {selectedAttractions.map((attraction) => (
              <span key={attraction} className="summary-chip">
                {attraction}
              </span>
            ))}
            {selectedInterests.map((interest) => {
              const match = interestOptions.find((option) => option.value === interest);
              return (
                <span key={interest} className="summary-chip">
                  {match?.label || interest}
                </span>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

type ItineraryPageProps = {
  loading: boolean;
  result: GenerateResponse | null;
  saving: boolean;
  savedTrips: SavedTripSummary[];
  loadingSavedTrips: boolean;
  deletingTripId: string | null;
  selectedUnassignedByDay: Record<number, string>;
  onSelectedUnassignedChange: Dispatch<SetStateAction<Record<number, string>>>;
  onSave: () => Promise<void>;
  onCopyLink: () => Promise<void>;
  onPrint: () => void;
  onRemoveActivity: (dayNumber: number, activityId: string) => void;
  onAddUnassigned: (dayNumber: number) => void;
  onLoadTrip: (tripId: string, targetRoute?: AppRoute) => Promise<void>;
  onDeleteTrip: (tripId: string) => Promise<void>;
  onRefreshTrips: () => Promise<void>;
  onNavigate: (route: AppRoute) => void;
};

function ItineraryPage({
  loading,
  result,
  saving,
  savedTrips,
  loadingSavedTrips,
  deletingTripId,
  selectedUnassignedByDay,
  onSelectedUnassignedChange,
  onSave,
  onCopyLink,
  onPrint,
  onRemoveActivity,
  onAddUnassigned,
  onLoadTrip,
  onDeleteTrip,
  onRefreshTrips,
  onNavigate,
}: ItineraryPageProps) {
  return (
    <main className="page-stack">
      <section className="surface-card surface-card--hero">
        <div className="results-hero">
          <div>
            <span className="section-heading__kicker">
              {result ? "Generated Itinerary" : "Saved Trips"}
            </span>
            <h2>{result?.tripInput.destinationCity || "Open a saved trip or generate a new one."}</h2>
            <p>
              {result
                ? "Review it, make edits, and save when you are ready."
                : "Your saved itineraries will show up here as soon as you sign in."}
            </p>
          </div>

          <div className="hero-actions">
            <button type="button" className="secondary-button" onClick={() => onNavigate("/")}>
              Edit trip details
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => onNavigate("/trip-view")}
              disabled={!result}
            >
              View trip map
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => void onSave()}
              disabled={!result || saving}
            >
              {saving ? "Saving..." : result?._id ? "Update saved itinerary" : "Save itinerary"}
            </button>
            <button
              type="button"
              className="secondary-button no-print"
              onClick={() => void onCopyLink()}
              disabled={!result?._id}
              title={!result?._id ? "Save the itinerary first to share it" : "Copy a read-only link"}
            >
              Copy link
            </button>
            <button
              type="button"
              className="secondary-button no-print"
              onClick={onPrint}
              disabled={!result}
            >
              Export PDF
            </button>
          </div>
        </div>

        {loading && <div className="loading-panel">Generating itinerary from live place data...</div>}

        {result ? (
          <div className="stat-row">
            <StatCard label="Destination" value={result.tripInput.destinationCity} />
            <StatCard label="Trip Length" value={`${result.tripInput.days} days`} />
            <StatCard
              label="Activities"
              value={String(result.itineraryDays.reduce((sum, day) => sum + day.activities.length, 0))}
            />
            <StatCard
              label="Unassigned"
              value={String(result.unassignedActivities?.length || 0)}
            />
          </div>
        ) : (
          <div className="empty-inline">
            No active itinerary is open right now. Use the saved trips below or generate a new one.
          </div>
        )}
      </section>

      {result?.metadata && (
        <section className="surface-card surface-card--compact">
          <div className="metadata-row">
            <span>{result.metadata.provider}</span>
            <span>{result.metadata.uniquePlaces} unique places used</span>
            <span>{result.metadata.fetchedPlaces} places fetched</span>
          </div>
        </section>
      )}

      {result?.notes && result.notes.length > 0 && (
        <section className="surface-card surface-card--compact">
          <div className="note-list">
            {result.notes.map((note, index) => (
              <div key={`${note}-${index}`} className="note-pill">
                {note}
              </div>
            ))}
          </div>
        </section>
      )}

      {result && (
        <section className="itinerary-days">
          {result.itineraryDays.map((day) => (
            <article key={day.dayNumber} className="surface-card day-card">
              <div className="day-card__header">
                <div>
                  <span className="section-heading__kicker">Day {day.dayNumber}</span>
                  <h3>{day.activities.length} planned stop{day.activities.length === 1 ? "" : "s"}</h3>
                </div>
              </div>

              {(result.unassignedActivities || []).length > 0 && (
                <div className="reassign-panel">
                  <select
                    className="field__input"
                    value={selectedUnassignedByDay[day.dayNumber] || ""}
                    onChange={(event) =>
                      onSelectedUnassignedChange((current) => ({
                        ...current,
                        [day.dayNumber]: event.target.value,
                      }))
                    }
                  >
                    <option value="">Add an unassigned activity...</option>
                    {(result.unassignedActivities || []).map((activity) => (
                      <option key={activity.id} value={activity.id}>
                        {activity.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => onAddUnassigned(day.dayNumber)}
                    disabled={!selectedUnassignedByDay[day.dayNumber]}
                  >
                    Add to day
                  </button>
                </div>
              )}

              {day.activities.length === 0 ? (
                <div className="empty-inline">No activities assigned to this day yet.</div>
              ) : (
                <div className="activity-list">
                  {day.activities.map((activity) => (
                    <div key={activity.id} className="activity-card">
                      <div className="activity-card__content">
                        <div className="activity-card__slot">
                          {activity.suggestedTimeSlot || "Flexible"}
                        </div>
                        <div className="activity-card__title">{activity.name}</div>
                        <div className="activity-card__address">
                          {activity.address || "Address unavailable"}
                        </div>
                        <div className="chip-row">
                          <span className="summary-chip">{activity.category}</span>
                          <span className="summary-chip">
                            {activity.estimatedDurationMinutes} min
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => onRemoveActivity(day.dayNumber, activity.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </section>
      )}

      <section className="surface-card past-trips-section">
        <div className="past-trips-header">
          <div>
            <span className="section-heading__kicker">Past Trips</span>
            <h2>Your saved itineraries</h2>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void onRefreshTrips()}
            disabled={loadingSavedTrips}
          >
            {loadingSavedTrips ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {savedTrips.length === 0 && !loadingSavedTrips ? (
          <p className="past-trips-empty">No saved trips yet. Save an itinerary above to see it here.</p>
        ) : (
          <div className="past-trips-grid">
            {savedTrips.map((trip) => (
              <article key={trip._id} className="surface-card saved-card">
                <h3>{trip.title || trip.tripInput.destinationCity}</h3>
                <p>
                  {trip.tripInput.destinationCity} · {trip.tripInput.days} day
                  {trip.tripInput.days === 1 ? "" : "s"}
                </p>
                <div className="chip-row">
                  {trip.tripInput.interests.map((interest) => (
                    <span key={interest} className="summary-chip">{interest}</span>
                  ))}
                </div>
                <div className="saved-card__actions">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => void onLoadTrip(trip._id, "/itinerary")}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => void onLoadTrip(trip._id, "/trip-view")}
                  >
                    Map
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => void onDeleteTrip(trip._id)}
                    disabled={deletingTripId === trip._id}
                  >
                    {deletingTripId === trip._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function TripViewPage({
  result,
  loading,
  onNavigate,
}: {
  result: GenerateResponse | null;
  loading: boolean;
  onNavigate: (route: AppRoute) => void;
}) {
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);

  if (!result && !loading) {
    return (
      <EmptyState
        title="No trip to view yet"
        text="Generate or open an itinerary first."
        primaryAction={{
          label: "Go to itinerary",
          onClick: () => onNavigate("/itinerary"),
        }}
      />
    );
  }

  const selectedDay =
    result?.itineraryDays.find((day) => day.dayNumber === selectedDayNumber) ||
    result?.itineraryDays[0] ||
    null;

  const mappedStops = selectedDay ? selectedDay.activities.filter(hasCoordinates) : [];
  const totalDistance = selectedDay ? getDayRouteDistance(selectedDay.activities) : 0;

  return (
    <main className="page-stack">
      <section className="surface-card surface-card--hero">
        <div className="results-hero">
          <div>
            <span className="section-heading__kicker">Trip View</span>
            <h2>{result?.tripInput.destinationCity || "Loading trip..."}</h2>
            <p>Pick a day to see where each stop is and how far the route goes.</p>
          </div>

          <div className="hero-actions">
            <button type="button" className="secondary-button" onClick={() => onNavigate("/itinerary")}>
              Back to itinerary
            </button>
          </div>
        </div>

        {result && (
          <div className="stat-row">
            <StatCard label="Days" value={`${result.tripInput.days}`} />
            <StatCard label="Stops Today" value={`${selectedDay?.activities.length || 0}`} />
            <StatCard label="Mapped Stops" value={`${mappedStops.length}`} />
            <StatCard label="Route Distance" value={formatDistance(totalDistance)} />
          </div>
        )}
      </section>

      {result && (
        <>
          <section className="surface-card surface-card--compact">
            <div className="trip-day-switcher">
              {result.itineraryDays.map((day) => (
                <button
                  key={day.dayNumber}
                  type="button"
                  className={`trip-day-pill ${selectedDay?.dayNumber === day.dayNumber ? "is-active" : ""}`}
                  onClick={() => setSelectedDayNumber(day.dayNumber)}
                >
                  <span className="trip-day-pill__label">Day {day.dayNumber}</span>
                  <span className="trip-day-pill__meta">
                    {day.activities.length} stop{day.activities.length === 1 ? "" : "s"}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {selectedDay && (
            <section className="trip-view-grid">
              <section className="surface-card trip-map-card">
                <div className="trip-map-card__header">
                  <div>
                    <span className="section-heading__kicker">Day {selectedDay.dayNumber}</span>
                    <h3>Trip map</h3>
                  </div>
                  <p className="helper-text">
                    {mappedStops.length > 1
                      ? "Stops are connected in itinerary order."
                      : "Add more mapped stops to see the route line."}
                  </p>
                </div>

                <TripMap activities={selectedDay.activities} />
              </section>

              <section className="surface-card trip-route-card">
                <div className="trip-map-card__header">
                  <div>
                    <span className="section-heading__kicker">Route Details</span>
                    <h3>Stops and spacing</h3>
                  </div>
                  <p className="helper-text">
                    Distances are based on each stop in the order it appears in the itinerary.
                  </p>
                </div>

                {selectedDay.activities.length === 0 ? (
                  <div className="empty-inline">No activities planned for this day yet.</div>
                ) : (
                  <div className="trip-stop-list">
                    {selectedDay.activities.map((activity, index) => {
                      const previous = index > 0 ? selectedDay.activities[index - 1] : null;
                      const hopDistance =
                        previous && hasCoordinates(previous) && hasCoordinates(activity)
                          ? getDistanceMiles(previous.coordinates, activity.coordinates)
                          : null;

                      return (
                        <article key={activity.id} className="trip-stop-card">
                          <div className="trip-stop-card__index">{index + 1}</div>
                          <div className="trip-stop-card__content">
                            <div className="activity-card__slot">
                              {activity.suggestedTimeSlot || "Flexible"}
                            </div>
                            <div className="activity-card__title">{activity.name}</div>
                            <div className="activity-card__address">
                              {activity.address || "Address unavailable"}
                            </div>
                            <div className="chip-row">
                              <span className="summary-chip">{activity.category}</span>
                              <span className="summary-chip">
                                {activity.estimatedDurationMinutes} min
                              </span>
                              <span className="summary-chip">
                                {hasCoordinates(activity) ? "Mapped" : "No map data"}
                              </span>
                            </div>
                            {index > 0 && (
                              <div className="trip-stop-card__distance">
                                From previous stop:{" "}
                                {hopDistance === null ? "distance unavailable" : formatDistance(hopDistance)}
                              </div>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </section>
          )}
        </>
      )}
    </main>
  );
}

function TripMap({ activities }: { activities: ItineraryActivity[] }) {
  const points = activities.filter(hasCoordinates);

  if (points.length === 0) {
    return (
      <div className="trip-map trip-map--empty">
        <p>No map coordinates are available for this day yet.</p>
      </div>
    );
  }

  const routePoints: LatLngExpression[] = points.map((activity) => [
    activity.coordinates.lat,
    activity.coordinates.lon,
  ]);
  const centerPoint = routePoints[0];

  return (
    <div className="trip-map">
      <div className="trip-map__canvas">
        <MapContainer
          center={centerPoint}
          zoom={13}
          scrollWheelZoom
          className="trip-map__leaflet"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitMapToPoints points={routePoints} />
          {routePoints.length > 1 && <Polyline positions={routePoints} className="trip-map__polyline" />}
          {points.map((activity, index) => (
            <Marker
              key={activity.id}
              position={[activity.coordinates.lat, activity.coordinates.lon]}
              icon={createStopIcon(String(index + 1))}
            >
              <Tooltip direction="top" offset={[0, -18]}>
                <strong>{activity.name}</strong>
                <br />
                {activity.address || "Address unavailable"}
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="trip-map__legend">
        {points.map((activity, index) => (
          <div key={activity.id} className="trip-map__legend-item">
            <span className="trip-map__legend-index">{index + 1}</span>
            <span>{activity.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


type EmptyStateProps = {
  title: string;
  text: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
};

function EmptyState({ title, text, primaryAction }: EmptyStateProps) {
  return (
    <main className="page-stack">
      <section className="surface-card empty-state">
        <span className="section-heading__kicker">Next Step</span>
        <h2>{title}</h2>
        <p>{text}</p>
        {primaryAction && (
          <button type="button" className="primary-button" onClick={primaryAction.onClick}>
            {primaryAction.label}
          </button>
        )}
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card">
      <div className="stat-card__label">{label}</div>
      <div className="stat-card__value">{value}</div>
    </div>
  );
}

function LoginPage({
  onLogin,
  theme,
  onToggleTheme,
}: {
  onLogin: (credentials: AuthCredentials) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter both a username and password.");
      return;
    }
    setError("");
    onLogin({ username: username.trim(), password });
  };

  return (
    <div className="app-shell">
      <div className="app-background" />
      <div className="login-shell">
        <div className="surface-card login-card">
          <div className="login-card__topbar">
            <button
              type="button"
              className="theme-toggle"
              onClick={onToggleTheme}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              <span className="theme-toggle__icon" aria-hidden="true">
                {theme === "light" ? "◐" : "◑"}
              </span>
              <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
            </button>
          </div>

          <div className="login-card__brand">
            <span className="hero-kicker">NextStop Planner</span>
            <h1>Welcome back</h1>
            <p>Sign in to start planning.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="status-banner status-banner--error">{error}</div>
            )}

            <div className="login-field">
              <label htmlFor="login-username" className="login-label">
                Username
              </label>
              <input
                id="login-username"
                type="text"
                className="form-control login-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="login-field">
              <label htmlFor="login-password" className="login-label">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                className="form-control login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="primary-button login-submit">
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function SharedItineraryPage({
  token,
  apiBase,
  theme,
  onToggleTheme,
}: {
  token: string;
  apiBase: string;
  theme: ThemeMode;
  onToggleTheme: () => void;
}) {
  const [trip, setTrip] = useState<GenerateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(`${apiBase}/api/itinerary/share/${token}`);
        const data = (await response.json()) as { trip?: GenerateResponse; error?: string };
        if (!response.ok || !data.trip) throw new Error(data.error || "Not found.");
        setTrip(data.trip);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load itinerary.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [token, apiBase]);

  return (
    <div className="app-shell">
      <div className="app-background" />

      <header className="app-topnav shared-topnav">
        <div className="app-topnav__brand">
          <span className="topnav-kicker">NextStop</span>
          <span className="topnav-title">Planner</span>
        </div>
        <span className="shared-badge">Shared itinerary</span>
        <div className="topnav-actions">
          <button
            type="button"
            className="theme-toggle no-print"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            <span className="theme-toggle__icon" aria-hidden="true">
              {theme === "light" ? "◐" : "◑"}
            </span>
            <span>{theme === "light" ? "Dark mode" : "Light mode"}</span>
          </button>
          <button
            type="button"
            className="secondary-button no-print"
            onClick={() => window.print()}
            disabled={!trip}
          >
            Export PDF
          </button>
        </div>
      </header>

      <div className="app-page-content">
        {loading && <div className="loading-panel">Loading shared itinerary...</div>}

        {error && (
          <div className="surface-card empty-state">
            <span className="section-heading__kicker">Not found</span>
            <h2>This link is no longer valid</h2>
            <p>{error}</p>
          </div>
        )}

        {trip && (
          <main className="page-stack">
            <section className="surface-card surface-card--hero">
              <div className="results-hero">
                <div>
                  <span className="section-heading__kicker">Shared Itinerary</span>
                  <h2>{trip.tripInput.destinationCity}</h2>
                  <p>
                    {trip.tripInput.days} day trip · view only
                  </p>
                </div>
              </div>
              <div className="stat-row">
                <StatCard label="Destination" value={trip.tripInput.destinationCity} />
                <StatCard label="Trip Length" value={`${trip.tripInput.days} days`} />
                <StatCard
                  label="Activities"
                  value={String(trip.itineraryDays.reduce((sum, day) => sum + day.activities.length, 0))}
                />
              </div>
            </section>

            <section className="itinerary-days">
              {trip.itineraryDays.map((day) => (
                <article key={day.dayNumber} className="surface-card day-card">
                  <div className="day-card__header">
                    <div>
                      <span className="section-heading__kicker">Day {day.dayNumber}</span>
                      <h3>{day.activities.length} planned stop{day.activities.length === 1 ? "" : "s"}</h3>
                    </div>
                  </div>
                  <div className="activity-list">
                    {day.activities.map((activity) => (
                      <div key={activity.id} className="activity-card">
                        <div className="activity-card__content">
                          <div className="activity-card__slot">
                            {activity.suggestedTimeSlot || "Flexible"}
                          </div>
                          <div className="activity-card__title">{activity.name}</div>
                          <div className="activity-card__address">
                            {activity.address || "Address unavailable"}
                          </div>
                          <div className="chip-row">
                            <span className="summary-chip">{activity.category}</span>
                            <span className="summary-chip">{activity.estimatedDurationMinutes} min</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </section>
          </main>
        )}
      </div>
    </div>
  );
}

export default App;
