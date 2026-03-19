import { Router } from "express";
import mongoose from "mongoose";
import Trip from "../models/trip.model";
import { getCityAttractions } from "../data/cityAttractions";

type InterestKey =
  | "food"
  | "museums"
  | "outdoors"
  | "shopping"
  | "nightlife"
  | "landmarks";

type GenerateItineraryBody = {
  destinationCity?: unknown;
  cityScope?: unknown;
  days?: unknown;
  interests?: unknown;
  selectedAttractions?: unknown;
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

type UpdateItineraryBody = {
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
  categories: string[];
  address: string;
  coordinates: { lon: number | null; lat: number | null };
  source: "geoapify" | "curated";
  estimatedDurationMinutes: number;
};

type BlockedWindow = {
  day: number;
  timeSlot: string;
  label?: string;
};

const router = Router();

const majorCapitalCities = [
  "Washington, DC, USA",
  "London, UK",
  "Paris, France",
  "Berlin, Germany",
  "Rome, Italy",
  "Madrid, Spain",
  "Lisbon, Portugal",
  "Dublin, Ireland",
  "Amsterdam, Netherlands",
  "Brussels, Belgium",
  "Vienna, Austria",
  "Prague, Czechia",
  "Warsaw, Poland",
  "Athens, Greece",
  "Budapest, Hungary",
  "Copenhagen, Denmark",
  "Stockholm, Sweden",
  "Oslo, Norway",
  "Helsinki, Finland",
  "Reykjavik, Iceland",
  "Bern, Switzerland",
  "Ottawa, Canada",
  "Mexico City, Mexico",
  "Brasilia, Brazil",
  "Buenos Aires, Argentina",
  "Santiago, Chile",
  "Lima, Peru",
  "Bogota, Colombia",
  "Quito, Ecuador",
  "Tokyo, Japan",
  "Seoul, South Korea",
  "Beijing, China",
  "Bangkok, Thailand",
  "Hanoi, Vietnam",
  "Kuala Lumpur, Malaysia",
  "Singapore, Singapore",
  "Jakarta, Indonesia",
  "Manila, Philippines",
  "Canberra, Australia",
  "Wellington, New Zealand",
  "New Delhi, India",
  "Islamabad, Pakistan",
  "Ankara, Turkey",
  "Jerusalem, Israel",
  "Abu Dhabi, UAE",
  "Riyadh, Saudi Arabia",
  "Cairo, Egypt",
  "Nairobi, Kenya",
  "Pretoria, South Africa",
  "Moscow, Russia",
];

const normalizeCityForComparison = (value: string) =>
  value.toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();

const majorCapitalSet = new Set(
  majorCapitalCities.flatMap((city) => {
    const parts = city.split(",").map((part) => part.trim());
    const cityCountry = normalizeCityForComparison(parts.slice(0, 2).join(","));
    const cityOnly = normalizeCityForComparison(parts[0]);
    return [cityCountry, cityOnly];
  })
);

const interestCategoryMap: Record<InterestKey, string[]> = {
  food: ["catering.restaurant", "catering.cafe"],
  museums: ["entertainment.museum"],
  outdoors: ["leisure.park", "natural"],
  shopping: ["commercial.shopping_mall", "commercial.marketplace", "commercial.supermarket"],
  nightlife: [
    "catering.bar",
    "catering.pub",
    "catering.biergarten",
  ],
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

const normalizeSelectedAttractions = (value: unknown) => {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
};

const getGeoapifyCategories = (interests: InterestKey[]): string => {
  const categories = new Set<string>();
  interests.forEach((interest) => {
    interestCategoryMap[interest].forEach((category) => categories.add(category));
  });

  return Array.from(categories).join(",");
};

const normalizeCategory = (value: string) =>
  value.trim().toLowerCase().replace(/\//g, ".").replace(/\s+/g, "");

const normalizeName = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

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
  const categories = rawCategories.map(normalizeCategory);
  const category = categories[0] || "general";
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
    categories,
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
  const activityCategories =
    activity.categories.length > 0 ? activity.categories : [normalizeCategory(activity.category)];
  let score = 0;
  interests.forEach((interest) => {
    const categories = interestCategoryMap[interest].map(normalizeCategory);
    if (
      categories.some((requestedCategory) =>
        activityCategories.some(
          (activityCategory) =>
            activityCategory === requestedCategory ||
            activityCategory.startsWith(`${requestedCategory}.`) ||
            requestedCategory.startsWith(`${activityCategory}.`)
        )
      )
    ) {
      score += 5;
    } else if (
      categories.some((requestedCategory) =>
        activityCategories.some((activityCategory) => {
          const requestedRoot = requestedCategory.split(".")[0];
          const activityRoot = activityCategory.split(".")[0];
          return requestedRoot === activityRoot;
        })
      )
    ) {
      score += 2;
    }
  });

  score += Math.random();
  return score;
};

const findBestAttractionMatch = (
  requestedName: string,
  activities: Activity[],
  usedIds: Set<string>
) => {
  const requested = normalizeName(requestedName);
  const requestedTokens = requested.split(" ").filter(Boolean);

  let bestActivity: Activity | null = null;
  let bestScore = -1;

  activities.forEach((activity) => {
    if (usedIds.has(activity.id)) return;

    const candidate = normalizeName(activity.name);
    let score = 0;

    if (candidate === requested) {
      score = 100;
    } else if (candidate.includes(requested) || requested.includes(candidate)) {
      score = 80;
    } else {
      const tokenMatches = requestedTokens.filter((token) => candidate.includes(token)).length;
      score = tokenMatches * 10;
    }

    if (score > bestScore) {
      bestScore = score;
      bestActivity = activity;
    }
  });

  if (!bestActivity || bestScore < 20) {
    return null;
  }

  return bestActivity;
};

const createCuratedActivity = (name: string, destinationCity: string): Activity => ({
  id: `curated-${normalizeName(destinationCity)}-${normalizeName(name)}`,
  name,
  category: "must-see attraction",
  categories: ["tourism.sights"],
  address: destinationCity,
  coordinates: { lon: null, lat: null },
  source: "curated",
  estimatedDurationMinutes: 90,
});

const TIME_SLOTS = ["Morning", "Late Morning", "Afternoon", "Evening", "Night"] as const;

/** Returns preferred time slots for a category, from most to least preferred. */
const getCategoryTimePreference = (category: string): string[] => {
  const cat = category.toLowerCase();
  if (
    cat.includes("bar") ||
    cat.includes("pub") ||
    cat.includes("biergarten") ||
    cat.includes("nightclub") ||
    cat.includes("nightlife")
  ) {
    return ["Night", "Evening"];
  }
  if (cat.includes("cafe")) {
    return ["Morning", "Late Morning", "Afternoon"];
  }
  if (cat.includes("restaurant")) {
    // Spread restaurants across meal times
    return ["Afternoon", "Evening", "Morning"];
  }
  if (cat.includes("park") || cat.includes("natural")) {
    return ["Morning", "Late Morning"];
  }
  if (cat.includes("museum")) {
    return ["Afternoon", "Late Morning"];
  }
  if (
    cat.includes("shopping") ||
    cat.includes("mall") ||
    cat.includes("marketplace") ||
    cat.includes("supermarket")
  ) {
    return ["Late Morning", "Afternoon"];
  }
  if (cat.includes("sights") || cat.includes("heritage") || cat.includes("tourism")) {
    return ["Morning", "Late Morning", "Afternoon"];
  }
  return [...TIME_SLOTS];
};

/**
 * Interleaves activities from different interest categories so each day gets
 * a variety of category types rather than all food or all landmarks clumped.
 */
const interleaveByCategory = (activities: Activity[], interests: InterestKey[]): Activity[] => {
  const groups: Record<string, Activity[]> = {};
  [...interests, "other"].forEach((key) => {
    groups[key] = [];
  });

  activities.forEach((activity) => {
    let placed = false;
    for (const interest of interests) {
      const cats = interestCategoryMap[interest].map(normalizeCategory);
      const actCats =
        activity.categories.length > 0
          ? activity.categories
          : [normalizeCategory(activity.category)];
      if (
        cats.some((c) =>
          actCats.some(
            (ac) => ac === c || ac.startsWith(`${c}.`) || c.startsWith(`${ac}.`)
          )
        )
      ) {
        groups[interest].push(activity);
        placed = true;
        break;
      }
    }
    if (!placed) groups["other"].push(activity);
  });

  // Round-robin across category groups: food[0], landmark[0], museum[0], food[1], ...
  const result: Activity[] = [];
  const allKeys = [...interests, "other"];
  const maxLen = Math.max(...allKeys.map((k) => groups[k].length), 0);
  for (let i = 0; i < maxLen; i++) {
    for (const key of allKeys) {
      if (i < groups[key].length) result.push(groups[key][i]);
    }
  }
  return result;
};

/**
 * Assigns time slots to a day's activities based on category preferences.
 * Nightlife → Night/Evening, parks → Morning, restaurants → spread across meals, etc.
 */
const assignTimeSlotsForDay = (
  activities: Activity[],
  availableSlots: string[]
): Array<Activity & { suggestedTimeSlot: string }> => {
  if (activities.length === 0) return [];

  // Sort activities by their earliest preferred slot so night activities end up last
  const withPrefs = activities.map((activity) => ({
    activity,
    prefs: getCategoryTimePreference(activity.category),
  }));
  withPrefs.sort((a, b) => {
    const earliest = (prefs: string[]) =>
      prefs.reduce((min, slot) => {
        const idx = TIME_SLOTS.indexOf(slot as (typeof TIME_SLOTS)[number]);
        return idx >= 0 ? Math.min(min, idx) : min;
      }, 99);
    return earliest(a.prefs) - earliest(b.prefs);
  });

  // Greedily assign slots based on preference, then fall back to any free slot
  const usedSlots = new Set<string>();
  const assigned: Array<Activity & { suggestedTimeSlot: string }> = [];
  withPrefs.forEach(({ activity, prefs }) => {
    let chosenSlot: string | undefined;
    for (const pref of prefs) {
      if (availableSlots.includes(pref) && !usedSlots.has(pref)) {
        chosenSlot = pref;
        break;
      }
    }
    if (!chosenSlot) {
      chosenSlot = TIME_SLOTS.find((s) => availableSlots.includes(s) && !usedSlots.has(s));
    }
    if (chosenSlot) {
      usedSlots.add(chosenSlot);
      assigned.push({ ...activity, suggestedTimeSlot: chosenSlot });
    }
  });

  // Return sorted in chronological time-slot order
  return assigned.sort(
    (a, b) =>
      TIME_SLOTS.indexOf(a.suggestedTimeSlot as (typeof TIME_SLOTS)[number]) -
      TIME_SLOTS.indexOf(b.suggestedTimeSlot as (typeof TIME_SLOTS)[number])
  );
};

const buildItinerary = (
  activities: Activity[],
  days: number,
  maxActivitiesPerDay: number,
  interests: InterestKey[],
  pinnedActivities: Activity[] = [],
  blockedWindows: BlockedWindow[] = []
) => {
  const pinnedIds = new Set(pinnedActivities.map((activity) => activity.id));
  const ranked = activities
    .filter((activity) => !pinnedIds.has(activity.id))
    .map((activity) => ({ activity, score: scoreActivity(activity, interests) }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.activity);

  // Interleave ranked activities so categories are spread evenly across days
  const interleaved = interleaveByCategory(ranked, interests);
  const orderedActivities = [...pinnedActivities, ...interleaved];

  const itineraryDays = Array.from({ length: days }, (_, index) => ({
    dayNumber: index + 1,
    activities: [] as Array<Activity & { suggestedTimeSlot: string }>,
  }));

  let pointer = 0;

  for (let dayIndex = 0; dayIndex < days; dayIndex += 1) {
    const dayNumber = dayIndex + 1;

    // Determine which time slots are available (not blocked by user constraints)
    const blockedSlots = new Set(
      blockedWindows.filter((bw) => bw.day === dayNumber).map((bw) => bw.timeSlot)
    );
    const availableSlots = [...TIME_SLOTS].filter((slot) => !blockedSlots.has(slot));
    const slotsToFill = Math.min(maxActivitiesPerDay, availableSlots.length);

    const dayActivities = orderedActivities.slice(pointer, pointer + slotsToFill);
    pointer += slotsToFill;

    // Assign time slots with category-awareness (nightlife → night, parks → morning, etc.)
    itineraryDays[dayIndex].activities = assignTimeSlotsForDay(dayActivities, availableSlots);
  }

  return {
    itineraryDays,
    unassignedActivities: orderedActivities.slice(pointer),
  };
};

router.get("/capital-cities", (_req, res) => {
  return res.json({ cities: majorCapitalCities });
});

router.get("/city-attractions", (req, res) => {
  const city = typeof req.query.city === "string" ? req.query.city.trim() : "";
  if (!city) {
    return res.json({ attractions: [] });
  }

  return res.json({ attractions: getCityAttractions(city) });
});

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
  const cityScope = body.cityScope === "major-capitals" ? "major-capitals" : "all";

  if (!destinationCity) {
    return res.status(400).json({ error: "destinationCity is required." });
  }

  if (cityScope === "major-capitals") {
    const cityQuery = normalizeCityForComparison(destinationCity);
    const cityToken = cityQuery.split(",").slice(0, 2).join(",").trim();
    if (!majorCapitalSet.has(cityToken) && !majorCapitalSet.has(cityQuery)) {
      return res.status(400).json({
        error:
          "This city is outside the current major-capitals list. Switch scope to 'Any city' or choose a listed capital.",
      });
    }
  }

  const days = toPositiveInt(body.days, 2, 1, 14);
  const interests = normalizeInterests(body.interests);
  const selectedAttractions = normalizeSelectedAttractions(body.selectedAttractions);
  const maxActivitiesPerDay = toPositiveInt(
    body.constraints?.maxActivitiesPerDay,
    3,
    1,
    6
  );
  const blockedWindows: BlockedWindow[] = Array.isArray(body.constraints?.blockedWindows)
    ? (body.constraints.blockedWindows as unknown[])
        .filter(
          (bw): bw is Record<string, unknown> =>
            typeof bw === "object" && bw !== null
        )
        .map((bw) => ({
          day: typeof bw.day === "number" ? Math.floor(bw.day) : 0,
          timeSlot: typeof bw.timeSlot === "string" ? bw.timeSlot.trim() : "",
          label: typeof bw.label === "string" ? bw.label.trim() : undefined,
        }))
        .filter(
          (bw) => bw.day >= 1 && bw.day <= days && TIME_SLOTS.includes(bw.timeSlot as never)
        )
    : [];

  try {
    const geocodeUrl = new URL("https://api.geoapify.com/v1/geocode/search");
    geocodeUrl.searchParams.set("text", destinationCity);
    geocodeUrl.searchParams.set("limit", "1");
    geocodeUrl.searchParams.set("format", "json");
    geocodeUrl.searchParams.set("type", "city");
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
      const detailsMessage =
        typeof (placesData as { message?: unknown }).message === "string"
          ? (placesData as { message: string }).message
          : null;
      return res.status(placesResponse.status).json({
        error: detailsMessage
          ? `Geoapify places lookup failed: ${detailsMessage}`
          : "Geoapify places lookup failed.",
        details: placesData,
      });
    }

    const normalized = (placesData.features ?? [])
      .map(normalizeActivity)
      .filter((activity): activity is Activity => activity !== null);
    const mustSeeLookup: Activity[] = [];
    if (selectedAttractions.length > 0) {
      const attractionUrl = new URL("https://api.geoapify.com/v2/places");
      attractionUrl.searchParams.set(
        "categories",
        "tourism.sights,heritage,entertainment.museum"
      );
      attractionUrl.searchParams.set("filter", filter);
      attractionUrl.searchParams.set("limit", "80");
      attractionUrl.searchParams.set("apiKey", apiKey);

      const attractionResponse = await fetch(attractionUrl.toString());
      const attractionData = (await attractionResponse.json()) as {
        features?: GeoapifyFeature[];
      };

      if (attractionResponse.ok) {
        mustSeeLookup.push(
          ...(attractionData.features ?? [])
            .map(normalizeActivity)
            .filter((activity): activity is Activity => activity !== null)
        );
      }
    }

    const uniqueActivities = dedupeActivities([...normalized, ...mustSeeLookup]);
    const usedPinnedIds = new Set<string>();
    const pinnedActivities = selectedAttractions.map((attractionName) => {
      const matched =
        findBestAttractionMatch(attractionName, uniqueActivities, usedPinnedIds) ||
        createCuratedActivity(attractionName, destinationCity);
      usedPinnedIds.add(matched.id);
      return matched;
    });

    if (uniqueActivities.length === 0 && pinnedActivities.length === 0) {
      return res.status(200).json({
        tripInput: {
          destinationCity,
          days,
          interests,
          selectedAttractions,
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
      uniqueActivities.length > 0 ? uniqueActivities : pinnedActivities,
      days,
      maxActivitiesPerDay,
      interests,
      pinnedActivities,
      blockedWindows
    );

    return res.json({
      tripInput: {
        destinationCity,
        days,
        interests,
        selectedAttractions,
        constraints: { maxActivitiesPerDay, blockedWindows },
      },
      itineraryDays,
      metadata: {
        provider: "Geoapify",
        fetchedPlaces: normalized.length,
        uniquePlaces: uniqueActivities.length,
        pinnedAttractions: pinnedActivities.length,
        categoryQuery: categories,
        geoFilter: filter,
      },
      notes: [
        "Activities are spread across categories each day — food, landmarks, museums, etc. are distributed evenly.",
        "Time slots are category-aware: nightlife → evening/night, parks → morning, restaurants → meal times.",
        selectedAttractions.length > 0
          ? "Selected attractions are placed into the itinerary before other category picks."
          : "Pick must-see attractions on supported cities to lock them into the plan first.",
        blockedWindows.length > 0
          ? `Blocked windows enforced: ${blockedWindows.map((bw) => `Day ${bw.day} ${bw.timeSlot}${bw.label ? ` (${bw.label})` : ""}`).join(", ")}.`
          : "Add blocked windows to skip time slots reserved for conferences, meetings, or rest.",
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

router.put("/saved/:id", async (req, res) => {
  const { id } = req.params;
  const body = req.body as UpdateItineraryBody;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid itinerary id." });
  }

  const updates: Record<string, unknown> = {};

  if (typeof body.title === "string") updates.title = body.title.trim();
  if (typeof body.tripInput === "object" && body.tripInput !== null) updates.tripInput = body.tripInput;
  if (Array.isArray(body.itineraryDays)) updates.itineraryDays = body.itineraryDays;
  if (typeof body.metadata === "object" && body.metadata !== null) updates.metadata = body.metadata;
  if (Array.isArray(body.notes)) {
    updates.notes = body.notes.filter((note): note is string => typeof note === "string");
  }
  if (Array.isArray(body.unassignedActivities)) updates.unassignedActivities = body.unassignedActivities;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No valid fields provided for update." });
  }

  try {
    const updatedTrip = await Trip.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updatedTrip) {
      return res.status(404).json({ error: "Itinerary not found." });
    }

    return res.json({
      message: "Itinerary updated.",
      updatedTrip,
    });
  } catch (error) {
    console.error("Update saved itinerary error:", error);
    return res.status(500).json({ error: "Failed to update itinerary." });
  }
});

router.delete("/saved/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid itinerary id." });
  }

  try {
    const deletedTrip = await Trip.findByIdAndDelete(id).lean();

    if (!deletedTrip) {
      return res.status(404).json({ error: "Itinerary not found." });
    }

    return res.json({ message: "Itinerary deleted.", deletedTripId: id });
  } catch (error) {
    console.error("Delete saved itinerary error:", error);
    return res.status(500).json({ error: "Failed to delete itinerary." });
  }
});

export default router;
