import { Router } from "express";
import mongoose from "mongoose";
import Trip from "../models/trip.model";

type InterestKey =
  | "food"
  | "museums"
  | "outdoors"
  | "shopping"
  | "nightlife"
  | "landmarks";

type GenerateItineraryBody = {
  destinationCity?: unknown;
  days?: unknown;
  interests?: unknown;
  constraints?: {
    maxActivitiesPerDay?: unknown;
    blockedWindows?: unknown;
  };
};

type SaveItineraryBody = {
  title?: unknown;
  tripInput?: unknown;
  itineraryDays?: unknown;
  metadata?: unknown;
  notes?: unknown;
  unassignedActivities?: unknown;
};

type GeoapifyFeature = {
  properties?: Record<string, unknown>;
  geometry?: {
    coordinates?: [number, number];
  };
};

type Activity = {
  id: string;
  name: string;
  category: string;
  address: string;
  coordinates: { lon: number | null; lat: number | null };
  source: "geoapify";
  estimatedDurationMinutes: number;
};

const router = Router();

const interestCategoryMap: Record<InterestKey, string[]> = {
  food: ["catering.restaurant", "catering.cafe"],
  museums: ["entertainment.museum"],
  outdoors: ["leisure.park", "natural"],
  shopping: ["commercial.shopping_mall", "commercial.marketplace"],
  nightlife: ["entertainment", "catering.bar"],
  landmarks: ["tourism.sights", "heritage"],
};

const defaultInterests: InterestKey[] = ["landmarks", "food"];

const toPositiveInt = (value: unknown, fallback: number, min = 1, max = 14) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const rounded = Math.floor(value);
  if (rounded < min) return min;
  if (rounded > max) return max;
  return rounded;
};

const normalizeInterests = (value: unknown): InterestKey[] => {
  if (!Array.isArray(value)) return defaultInterests;

  const valid = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().toLowerCase())
    .filter((item): item is InterestKey => item in interestCategoryMap);

  return valid.length > 0 ? Array.from(new Set(valid)) : defaultInterests;
};

const getGeoapifyCategories = (interests: InterestKey[]): string => {
  const categories = new Set<string>();
  interests.forEach((interest) => {
    interestCategoryMap[interest].forEach((category) => categories.add(category));
  });

  return Array.from(categories).join(",");
};

const estimateDurationMinutes = (category: string) => {
  if (category.includes("museum")) return 120;
  if (category.includes("park") || category.includes("natural")) return 90;
  if (category.includes("restaurant") || category.includes("cafe") || category.includes("bar")) {
    return 75;
  }
  return 60;
};

const normalizeActivity = (feature: GeoapifyFeature, index: number): Activity | null => {
  const props = feature.properties ?? {};
  const coordinates = feature.geometry?.coordinates;

  const rawName =
    (typeof props.name === "string" && props.name) ||
    (typeof props.address_line1 === "string" && props.address_line1) ||
    "Unnamed place";

  const address =
    (typeof props.formatted === "string" && props.formatted) ||
    [props.address_line1, props.address_line2]
      .filter((part): part is string => typeof part === "string" && part.length > 0)
      .join(", ");

  const rawCategories = Array.isArray(props.categories)
    ? props.categories.filter((c): c is string => typeof c === "string")
    : [];

  const category = rawCategories[0] || "general";
  const lon =
    typeof props.lon === "number"
      ? props.lon
      : Array.isArray(coordinates) && typeof coordinates[0] === "number"
        ? coordinates[0]
        : null;
  const lat =
    typeof props.lat === "number"
      ? props.lat
      : Array.isArray(coordinates) && typeof coordinates[1] === "number"
        ? coordinates[1]
        : null;

  const placeId =
    (typeof props.place_id === "string" && props.place_id) ||
    `${rawName}-${address}-${index}`;

  return {
    id: placeId,
    name: rawName,
    category,
    address,
    coordinates: { lon, lat },
    source: "geoapify",
    estimatedDurationMinutes: estimateDurationMinutes(category),
  };
};

const dedupeActivities = (activities: Activity[]) => {
  const seen = new Set<string>();
  return activities.filter((activity) => {
    const key = `${activity.name.toLowerCase()}|${activity.address.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const scoreActivity = (activity: Activity, interests: InterestKey[]) => {
  let score = 0;
  interests.forEach((interest) => {
    const categories = interestCategoryMap[interest];
    if (categories.some((category) => activity.category.includes(category.split(".")[0]))) {
      score += 2;
    }
    if (categories.some((category) => activity.category.includes(category))) {
      score += 3;
    }
  });

  score += Math.random();
  return score;
};

const buildItinerary = (
  activities: Activity[],
  days: number,
  maxActivitiesPerDay: number,
  interests: InterestKey[]
) => {
  const ranked = activities
    .map((activity) => ({ activity, score: scoreActivity(activity, interests) }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.activity);

  const itineraryDays = Array.from({ length: days }, (_, index) => ({
    dayNumber: index + 1,
    activities: [] as Array<Activity & { suggestedTimeSlot: string }>,
  }));

  let pointer = 0;
  const timeSlots = ["Morning", "Late Morning", "Afternoon", "Evening", "Night"];

  for (let dayIndex = 0; dayIndex < days; dayIndex += 1) {
    while (
      itineraryDays[dayIndex].activities.length < maxActivitiesPerDay &&
      pointer < ranked.length
    ) {
      const slotIndex = itineraryDays[dayIndex].activities.length;
      itineraryDays[dayIndex].activities.push({
        ...ranked[pointer],
        suggestedTimeSlot: timeSlots[Math.min(slotIndex, timeSlots.length - 1)],
      });
      pointer += 1;
    }
  }

  return {
    itineraryDays,
    unassignedActivities: ranked.slice(pointer),
  };
};

router.post("/generate", async (req, res) => {
  const body = req.body as GenerateItineraryBody;
  const apiKey = process.env.GEOAPIFY_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Missing GEOAPIFY_API_KEY in backend environment variables.",
    });
  }

  const destinationCity =
    typeof body.destinationCity === "string" ? body.destinationCity.trim() : "";

  if (!destinationCity) {
    return res.status(400).json({ error: "destinationCity is required." });
  }

  const days = toPositiveInt(body.days, 2, 1, 14);
  const interests = normalizeInterests(body.interests);
  const maxActivitiesPerDay = toPositiveInt(
    body.constraints?.maxActivitiesPerDay,
    3,
    1,
    6
  );
  const blockedWindows = Array.isArray(body.constraints?.blockedWindows)
    ? body.constraints?.blockedWindows
    : [];

  try {
    const geocodeUrl = new URL("https://api.geoapify.com/v1/geocode/search");
    geocodeUrl.searchParams.set("text", destinationCity);
    geocodeUrl.searchParams.set("limit", "1");
    geocodeUrl.searchParams.set("format", "json");
    geocodeUrl.searchParams.set("apiKey", apiKey);

    const geocodeResponse = await fetch(geocodeUrl.toString());
    const geocodeData = (await geocodeResponse.json()) as {
      results?: Array<Record<string, unknown>>;
    };

    if (!geocodeResponse.ok) {
      return res.status(geocodeResponse.status).json({
        error: "Geoapify geocoding failed.",
        details: geocodeData,
      });
    }

    const geocodeResult = geocodeData.results?.[0];
    if (!geocodeResult) {
      return res.status(404).json({ error: "Destination city not found." });
    }

    let filter = "";
    const bbox =
      typeof geocodeResult.bbox === "object" && geocodeResult.bbox !== null
        ? (geocodeResult.bbox as Record<string, unknown>)
        : null;

    if (
      bbox &&
      typeof bbox.lon1 === "number" &&
      typeof bbox.lat1 === "number" &&
      typeof bbox.lon2 === "number" &&
      typeof bbox.lat2 === "number"
    ) {
      filter = `rect:${bbox.lon1},${bbox.lat1},${bbox.lon2},${bbox.lat2}`;
    } else if (
      typeof geocodeResult.lon === "number" &&
      typeof geocodeResult.lat === "number"
    ) {
      // Fallback if bbox is missing: search within ~8km of city center.
      filter = `circle:${geocodeResult.lon},${geocodeResult.lat},8000`;
    } else {
      return res.status(500).json({
        error: "Could not build Geoapify location filter from geocode response.",
      });
    }

    const categories = getGeoapifyCategories(interests);
    const placeLimit = Math.min(days * maxActivitiesPerDay * 5, 80);

    const placesUrl = new URL("https://api.geoapify.com/v2/places");
    placesUrl.searchParams.set("categories", categories);
    placesUrl.searchParams.set("filter", filter);
    placesUrl.searchParams.set("limit", String(placeLimit));
    placesUrl.searchParams.set("apiKey", apiKey);

    const placesResponse = await fetch(placesUrl.toString());
    const placesData = (await placesResponse.json()) as {
      features?: GeoapifyFeature[];
    };

    if (!placesResponse.ok) {
      return res.status(placesResponse.status).json({
        error: "Geoapify places lookup failed.",
        details: placesData,
      });
    }

    const normalized = (placesData.features ?? [])
      .map(normalizeActivity)
      .filter((activity): activity is Activity => activity !== null);

    const uniqueActivities = dedupeActivities(normalized);

    if (uniqueActivities.length === 0) {
      return res.status(200).json({
        tripInput: {
          destinationCity,
          days,
          interests,
          constraints: { maxActivitiesPerDay, blockedWindows },
        },
        itineraryDays: Array.from({ length: days }, (_, index) => ({
          dayNumber: index + 1,
          activities: [],
        })),
        notes: [
          "No matching places were returned for the selected city/interests.",
          "Try fewer interests or a larger city.",
        ],
      });
    }

    const { itineraryDays, unassignedActivities } = buildItinerary(
      uniqueActivities,
      days,
      maxActivitiesPerDay,
      interests
    );

    return res.json({
      tripInput: {
        destinationCity,
        days,
        interests,
        constraints: { maxActivitiesPerDay, blockedWindows },
      },
      itineraryDays,
      metadata: {
        provider: "Geoapify",
        fetchedPlaces: normalized.length,
        uniquePlaces: uniqueActivities.length,
        categoryQuery: categories,
        geoFilter: filter,
      },
      notes: [
        "Time slots are heuristic placeholders (not route-optimized yet).",
        blockedWindows.length > 0
          ? "Blocked windows are stored, but strict time conflict enforcement is a later step."
          : "Add blocked windows later to improve scheduling realism.",
      ],
      unassignedActivities: unassignedActivities.slice(0, 15),
    });
  } catch (error) {
    console.error("Itinerary generation error:", error);
    return res.status(500).json({
      error: "Failed to generate itinerary.",
    });
  }
});

router.post("/save", async (req, res) => {
  const body = req.body as SaveItineraryBody;
  const tripInput =
    typeof body.tripInput === "object" && body.tripInput !== null ? body.tripInput : null;
  const itineraryDays = Array.isArray(body.itineraryDays) ? body.itineraryDays : null;
  const title = typeof body.title === "string" ? body.title.trim() : "";

  if (!tripInput || !itineraryDays) {
    return res.status(400).json({
      error: "tripInput and itineraryDays are required to save an itinerary.",
    });
  }

  try {
    const savedTrip = await Trip.create({
      title,
      tripInput,
      itineraryDays,
      metadata:
        typeof body.metadata === "object" && body.metadata !== null ? body.metadata : {},
      notes: Array.isArray(body.notes)
        ? body.notes.filter((note): note is string => typeof note === "string")
        : [],
      unassignedActivities: Array.isArray(body.unassignedActivities)
        ? body.unassignedActivities
        : [],
    });

    return res.status(201).json({
      message: "Itinerary saved.",
      tripId: savedTrip._id,
      savedTrip,
    });
  } catch (error) {
    console.error("Save itinerary error:", error);
    return res.status(500).json({ error: "Failed to save itinerary." });
  }
});

router.get("/saved", async (_req, res) => {
  try {
    const trips = await Trip.find({})
      .sort({ updatedAt: -1 })
      .limit(20)
      .select("title tripInput.destinationCity tripInput.days tripInput.interests createdAt updatedAt")
      .lean();

    return res.json({ trips });
  } catch (error) {
    console.error("List saved itineraries error:", error);
    return res.status(500).json({ error: "Failed to load saved itineraries." });
  }
});

router.get("/saved/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid itinerary id." });
  }

  try {
    const trip = await Trip.findById(id).lean();

    if (!trip) {
      return res.status(404).json({ error: "Itinerary not found." });
    }

    return res.json({ trip });
  } catch (error) {
    console.error("Load saved itinerary error:", error);
    return res.status(500).json({ error: "Failed to load itinerary." });
  }
});

export default router;
