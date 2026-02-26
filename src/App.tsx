import { useEffect, useState } from "react";
import type { FormEvent } from "react";

type Interest =
  | "landmarks"
  | "food"
  | "museums"
  | "outdoors"
  | "shopping"
  | "nightlife";

type ItineraryActivity = {
  id: string;
  name: string;
  category: string;
  address: string;
  suggestedTimeSlot: string;
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
  unassignedActivities?: unknown[];
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

const interestOptions: { value: Interest; label: string }[] = [
  { value: "landmarks", label: "Landmarks" },
  { value: "food", label: "Food" },
  { value: "museums", label: "Museums" },
  { value: "outdoors", label: "Outdoors" },
  { value: "shopping", label: "Shopping" },
  { value: "nightlife", label: "Nightlife" },
];

function App() {
  const [destinationCity, setDestinationCity] = useState("Atlanta, GA");
  const [days, setDays] = useState(2);
  const [maxActivitiesPerDay, setMaxActivitiesPerDay] = useState(3);
  const [selectedInterests, setSelectedInterests] = useState<Interest[]>([
    "landmarks",
    "food",
  ]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingSavedTrips, setLoadingSavedTrips] = useState(false);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [savedTrips, setSavedTrips] = useState<SavedTripSummary[]>([]);

  const toggleInterest = (interest: Interest) => {
    setSelectedInterests((current) => {
      if (current.includes(interest)) {
        if (current.length === 1) return current;
        return current.filter((item) => item !== interest);
      }
      return [...current, interest];
    });
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
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
      setResult(null);
    } finally {
      setLoading(false);
    }
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
      setDestinationCity(data.trip.tripInput.destinationCity);
      setDays(data.trip.tripInput.days);
      setMaxActivitiesPerDay(data.trip.tripInput.constraints.maxActivitiesPerDay);
      const validInterests = data.trip.tripInput.interests.filter((interest): interest is Interest =>
        ["landmarks", "food", "museums", "outdoors", "shopping", "nightlife"].includes(interest)
      );
      setSelectedInterests(validInterests.length > 0 ? validInterests : ["landmarks", "food"]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load itinerary";
      setError(message);
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
      const response = await fetch(`${API_BASE_URL}/api/itinerary/save`, {
        method: "POST",
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
      };

      if (!response.ok) {
        throw new Error(data.error || "Failed to save itinerary.");
      }

      if (data.savedTrip) {
        setResult(data.savedTrip);
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

  useEffect(() => {
    void loadSavedTrips();
  }, []);

  return (
    <div className="container py-4">
      <div className="row g-4">
        <div className="col-lg-5">
          <div className="card shadow-sm">
            <div className="card-body">
              <h1 className="h3 mb-3">NextStop Planner</h1>
              <p className="text-muted">
                MVP itinerary generator using Geoapify + backend heuristics.
              </p>

              <form onSubmit={generateItinerary} className="d-grid gap-3">
                <div>
                  <label htmlFor="destinationCity" className="form-label">
                    Destination City
                  </label>
                  <input
                    id="destinationCity"
                    className="form-control"
                    value={destinationCity}
                    onChange={(e) => setDestinationCity(e.target.value)}
                    placeholder="e.g. Atlanta, GA"
                    required
                  />
                </div>

                <div className="row g-3">
                  <div className="col-6">
                    <label htmlFor="days" className="form-label">
                      Days
                    </label>
                    <input
                      id="days"
                      type="number"
                      min={1}
                      max={14}
                      className="form-control"
                      value={days}
                      onChange={(e) => setDays(Number(e.target.value))}
                    />
                  </div>
                  <div className="col-6">
                    <label htmlFor="maxActivities" className="form-label">
                      Max / Day
                    </label>
                    <input
                      id="maxActivities"
                      type="number"
                      min={1}
                      max={6}
                      className="form-control"
                      value={maxActivitiesPerDay}
                      onChange={(e) => setMaxActivitiesPerDay(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div>
                  <div className="form-label mb-2">Interests</div>
                  <div className="d-flex flex-wrap gap-2">
                    {interestOptions.map((option) => {
                      const checked = selectedInterests.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`btn btn-sm ${
                            checked ? "btn-primary" : "btn-outline-secondary"
                          }`}
                          onClick={() => toggleInterest(option.value)}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button type="submit" className="btn btn-success" disabled={loading}>
                  {loading ? "Generating..." : "Generate Itinerary"}
                </button>
              </form>

              {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
              {saveMessage && <div className="alert alert-success mt-3 mb-0">{saveMessage}</div>}
            </div>
          </div>

          <div className="card shadow-sm mt-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h2 className="h5 mb-0">Saved Trips</h2>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => void loadSavedTrips()}
                  disabled={loadingSavedTrips}
                >
                  {loadingSavedTrips ? "Loading..." : "Refresh"}
                </button>
              </div>

              {savedTrips.length === 0 && !loadingSavedTrips && (
                <div className="text-muted small">No saved itineraries yet.</div>
              )}

              <div className="list-group">
                {savedTrips.map((trip) => (
                  <button
                    key={trip._id}
                    type="button"
                    className="list-group-item list-group-item-action"
                    onClick={() => void loadSavedTrip(trip._id)}
                  >
                    <div className="fw-semibold">
                      {trip.title || trip.tripInput.destinationCity}
                    </div>
                    <div className="small text-muted">
                      {trip.tripInput.destinationCity} • {trip.tripInput.days} day(s)
                    </div>
                    <div className="small text-muted">
                      {new Date(trip.updatedAt).toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h2 className="h4 mb-1">Generated Itinerary</h2>
                  <p className="text-muted mb-0">
                    Day-by-day schedule (heuristic, editable later)
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-success btn-sm"
                  onClick={() => void saveCurrentItinerary()}
                  disabled={!result || saving}
                >
                  {saving ? "Saving..." : "Save Itinerary"}
                </button>
              </div>

              {!result && !loading && (
                <div className="alert alert-secondary mb-0">
                  Fill out the form and click <strong>Generate Itinerary</strong>.
                </div>
              )}

              {loading && (
                <div className="alert alert-info mb-0">
                  Generating itinerary from live place data...
                </div>
              )}

              {result && (
                <div className="d-grid gap-3">
                  {result.metadata && (
                    <div className="small text-muted">
                      {result.metadata.provider}: {result.metadata.uniquePlaces} unique places
                      (from {result.metadata.fetchedPlaces} fetched)
                    </div>
                  )}

                  {result.notes && result.notes.length > 0 && (
                    <div className="alert alert-warning py-2 mb-0">
                      {result.notes.map((note, idx) => (
                        <div key={`${note}-${idx}`}>{note}</div>
                      ))}
                    </div>
                  )}

                  {result.itineraryDays.map((day) => (
                    <div key={day.dayNumber} className="border rounded p-3">
                      <h3 className="h5 mb-3">Day {day.dayNumber}</h3>

                      {day.activities.length === 0 ? (
                        <div className="text-muted">No activities assigned.</div>
                      ) : (
                        <div className="list-group">
                          {day.activities.map((activity) => (
                            <div key={activity.id} className="list-group-item">
                              <div className="d-flex justify-content-between gap-3">
                                <div>
                                  <div className="fw-semibold">{activity.name}</div>
                                  <div className="small text-muted">
                                    {activity.address || "Address unavailable"}
                                  </div>
                                  <div className="small text-muted">
                                    Category: {activity.category}
                                  </div>
                                </div>
                                <div className="text-end small">
                                  <div className="badge text-bg-light border mb-1">
                                    {activity.suggestedTimeSlot}
                                  </div>
                                  <div>{activity.estimatedDurationMinutes} min</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
