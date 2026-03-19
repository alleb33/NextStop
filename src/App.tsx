import { useDeferredValue, useEffect, useState } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import "./App.css";

type Interest =
  | "landmarks"
  | "food"
  | "museums"
  | "outdoors"
  | "shopping"
  | "nightlife";

type AppRoute = "/" | "/itinerary" | "/saved";

type ItineraryActivity = {
  id: string;
  name: string;
  category: string;
  address: string;
  suggestedTimeSlot?: string;
  estimatedDurationMinutes: number;
};

type ItineraryDay = {
  dayNumber: number;
  activities: ItineraryActivity[];
};

type GenerateResponse = {
  _id?: string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
  tripInput: {
    destinationCity: string;
    days: number;
    interests: Interest[];
    selectedAttractions?: string[];
    constraints: {
      maxActivitiesPerDay: number;
      blockedWindows: string[];
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
  { route: "/", label: "Plan Trip", eyebrow: "Step 1" },
  { route: "/itinerary", label: "Itinerary", eyebrow: "Step 2" },
  { route: "/saved", label: "Saved Trips", eyebrow: "Step 3" },
];

const timeSlots = ["Morning", "Late Morning", "Afternoon", "Evening", "Night"];

const getRouteFromPath = (pathname: string): AppRoute => {
  if (pathname === "/itinerary") return "/itinerary";
  if (pathname === "/saved") return "/saved";
  return "/";
};

const formatDateTime = (value?: string) => {
  if (!value) return "";
  return new Date(value).toLocaleString();
};

const slotForIndex = (index: number) => timeSlots[Math.min(index, timeSlots.length - 1)];

function App() {
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
  const [selectedUnassignedByDay, setSelectedUnassignedByDay] = useState<Record<number, string>>(
    {}
  );
  const deferredDestinationCity = useDeferredValue(destinationCity);

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
    setLoadingSavedTrips(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/itinerary/saved`);
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

  const loadSavedTrip = async (tripId: string) => {
    setLoading(true);
    setError("");
    setSaveMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/itinerary/saved/${tripId}`);
      const data = (await response.json()) as { trip?: GenerateResponse; error?: string };
      if (!response.ok || !data.trip) {
        throw new Error(data.error || "Failed to load itinerary.");
      }

      setResult(data.trip);
      syncTripInputs(data.trip);
      navigate("/itinerary");
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
            blockedWindows: [],
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
    if (!result) return;

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
    setDeletingTripId(tripId);
    setError("");
    setSaveMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/itinerary/saved/${tripId}`, {
        method: "DELETE",
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

  useEffect(() => {
    void loadSavedTrips();
  }, []);

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
      } catch (err) {
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

  return (
    <div className="app-shell">
      <div className="app-background" />
      <div className="container app-container py-4 py-lg-5">
        <div className="app-layout">
          <aside className="sidebar surface-card">
            <div className="sidebar__brand">
              <span className="hero-kicker">NextStop Planner</span>
              <h1>Plan your trip</h1>
              <p>Start with trip details, then move into the generated itinerary.</p>
            </div>

            <nav className="step-nav" aria-label="Trip planning steps">
              {navItems.map((item) => {
                const isActive = route === item.route;
                const isLocked = item.route === "/itinerary" && !result;
                return (
                  <button
                    key={item.route}
                    type="button"
                    className={`step-nav__item ${isActive ? "is-active" : ""}`}
                    onClick={() => navigate(item.route)}
                    disabled={isLocked}
                  >
                    <span className="step-nav__eyebrow">{item.eyebrow}</span>
                    <span className="step-nav__label">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="sidebar__section">
              <div className="sidebar__section-header">
                <span className="section-heading__kicker">Saved</span>
                <button
                  type="button"
                  className="sidebar__refresh"
                  onClick={() => void loadSavedTrips()}
                  disabled={loadingSavedTrips}
                >
                  {loadingSavedTrips ? "Loading..." : "Refresh"}
                </button>
              </div>

              <div className="sidebar-saved-list">
                {savedTrips.length === 0 && !loadingSavedTrips && (
                  <div className="sidebar-empty">No saved itineraries yet.</div>
                )}

                {savedTrips.slice(0, 6).map((trip) => (
                  <button
                    key={trip._id}
                    type="button"
                    className="sidebar-trip"
                    onClick={() => void loadSavedTrip(trip._id)}
                  >
                    <span className="sidebar-trip__title">
                      {trip.title || trip.tripInput.destinationCity}
                    </span>
                    <span className="sidebar-trip__meta">
                      {trip.tripInput.days} day{trip.tripInput.days === 1 ? "" : "s"} in{" "}
                      {trip.tripInput.destinationCity}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section className="main-panel">
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
                onSubmit={generateItinerary}
                onNavigate={navigate}
              />
            )}

            {route === "/itinerary" && (
              <ItineraryPage
                loading={loading}
                result={result}
                saving={saving}
                selectedUnassignedByDay={selectedUnassignedByDay}
                onSelectedUnassignedChange={setSelectedUnassignedByDay}
                onSave={saveCurrentItinerary}
                onRemoveActivity={removeActivityFromDay}
                onAddUnassigned={addUnassignedToDay}
                onNavigate={navigate}
              />
            )}

            {route === "/saved" && (
              <SavedTripsPage
                loading={loadingSavedTrips}
                deletingTripId={deletingTripId}
                savedTrips={savedTrips}
                onRefresh={loadSavedTrips}
                onLoadTrip={loadSavedTrip}
                onDeleteTrip={deleteSavedTrip}
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

type DetailsPageProps = {
  destinationCity: string;
  days: number;
  maxActivitiesPerDay: number;
  selectedInterests: Interest[];
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
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onNavigate: (route: AppRoute) => void;
};

function DetailsPage({
  destinationCity,
  days,
  maxActivitiesPerDay,
  selectedInterests,
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
  onSubmit,
  onNavigate,
}: DetailsPageProps) {
  return (
    <main className="page-stack">
      <section className="surface-card surface-card--form">
        <div className="section-heading">
          <span className="section-heading__kicker">Trip Setup</span>
          <h2>Enter the details for your trip.</h2>
          <p>
            This is the first page people see. Fill it out and we will take them straight to
            the generated itinerary page.
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
            <div className="interest-grid">
              {interestOptions.map((option) => {
                const isSelected = selectedInterests.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`interest-pill ${isSelected ? "is-selected" : ""}`}
                    onClick={() => onToggleInterest(option.value)}
                  >
                    <span className="interest-pill__title">{option.label}</span>
                    <span className="interest-pill__text">{option.description}</span>
                  </button>
                );
              })}
            </div>
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
  selectedUnassignedByDay: Record<number, string>;
  onSelectedUnassignedChange: Dispatch<SetStateAction<Record<number, string>>>;
  onSave: () => Promise<void>;
  onRemoveActivity: (dayNumber: number, activityId: string) => void;
  onAddUnassigned: (dayNumber: number) => void;
  onNavigate: (route: AppRoute) => void;
};

function ItineraryPage({
  loading,
  result,
  saving,
  selectedUnassignedByDay,
  onSelectedUnassignedChange,
  onSave,
  onRemoveActivity,
  onAddUnassigned,
  onNavigate,
}: ItineraryPageProps) {
  if (!result && !loading) {
    return (
      <EmptyState
        title="No itinerary yet"
        text="Start on the planning page to generate a trip before reviewing it here."
        primaryAction={{
          label: "Go to trip details",
          onClick: () => onNavigate("/"),
        }}
      />
    );
  }

  return (
    <main className="page-stack">
      <section className="surface-card surface-card--hero">
        <div className="results-hero">
          <div>
            <span className="section-heading__kicker">Generated Itinerary</span>
            <h2>{result?.tripInput.destinationCity || "Building your trip..."}</h2>
            <p>
              Review the schedule, move activities around, and save the version you want
              to keep.
            </p>
          </div>

          <div className="hero-actions">
            <button type="button" className="secondary-button" onClick={() => onNavigate("/")}>
              Edit trip details
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => void onSave()}
              disabled={!result || saving}
            >
              {saving ? "Saving..." : result?._id ? "Update saved itinerary" : "Save itinerary"}
            </button>
          </div>
        </div>

        {loading && <div className="loading-panel">Generating itinerary from live place data...</div>}

        {result && (
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
    </main>
  );
}

type SavedTripsPageProps = {
  loading: boolean;
  deletingTripId: string | null;
  savedTrips: SavedTripSummary[];
  onRefresh: () => Promise<void>;
  onLoadTrip: (tripId: string) => Promise<void>;
  onDeleteTrip: (tripId: string) => Promise<void>;
};

function SavedTripsPage({
  loading,
  deletingTripId,
  savedTrips,
  onRefresh,
  onLoadTrip,
  onDeleteTrip,
}: SavedTripsPageProps) {
  return (
    <main className="page-stack">
      <section className="surface-card surface-card--hero">
        <div className="results-hero">
          <div>
            <span className="section-heading__kicker">Saved Itineraries</span>
            <h2>Your trip library</h2>
            <p>Reopen saved plans, review the latest edits, or remove ones you no longer need.</p>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void onRefresh()}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh saved trips"}
          </button>
        </div>
      </section>

      {savedTrips.length === 0 && !loading ? (
        <EmptyState
          title="Nothing saved yet"
          text="Once you save an itinerary, it will show up here for quick access."
        />
      ) : (
        <section className="saved-grid">
          {savedTrips.map((trip) => (
            <article key={trip._id} className="surface-card saved-card">
              <div className="saved-card__eyebrow">{formatDateTime(trip.updatedAt)}</div>
              <h3>{trip.title || trip.tripInput.destinationCity}</h3>
              <p>
                {trip.tripInput.destinationCity} • {trip.tripInput.days} day
                {trip.tripInput.days === 1 ? "" : "s"}
              </p>
              <div className="chip-row">
                {trip.tripInput.interests.map((interest) => (
                  <span key={interest} className="summary-chip">
                    {interest}
                  </span>
                ))}
              </div>
              <div className="saved-card__actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => void onLoadTrip(trip._id)}
                >
                  Open itinerary
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
        </section>
      )}
    </main>
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

export default App;
