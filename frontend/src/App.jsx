import { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

export default function App() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPlaces = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/places`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to load places");
      }

      setPlaces(data.features || []);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Nearby Supermarkets</h1>
        <button className="btn btn-primary" onClick={fetchPlaces} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <p className="text-muted">
        Data source: Geoapify (through your Express backend)
      </p>

      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && places.length === 0 && (
        <div className="alert alert-secondary">No places found.</div>
      )}

      <div className="list-group">
        {places.map((place) => {
          const props = place.properties || {};
          const name = props.name || "Unnamed place";
          const address = props.formatted || [props.address_line1, props.address_line2].filter(Boolean).join(", ");

          return (
            <div key={props.place_id || `${name}-${address}`} className="list-group-item">
              <div className="fw-semibold">{name}</div>
              {address && <div className="text-muted small">{address}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
