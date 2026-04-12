import { Router } from "express";
import { randomUUID } from "crypto";
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

// Primary category is always a confirmed-valid Geoapify category string.
// Extras extend variety; if the combined request fails the fetch falls back
// to the primary alone (see fetchPlacesForInterest below).
const interestCategoryMap: Record<InterestKey, string[]> = {
  food: [
    "catering.restaurant",   // primary — always valid
    "catering.cafe",
    "catering.fast_food",
  ],
  museums: [
    "entertainment.museum",  // primary
    "entertainment.art_gallery",
    "entertainment.aquarium",
    "entertainment.zoo",
  ],
  outdoors: [
    "leisure.park",          // primary
    "natural",
    "leisure.garden",
    "leisure.sports_centre",
  ],
  shopping: [
    "commercial.shopping_mall",  // primary
    "commercial.marketplace",
    "commercial.supermarket",
  ],
  nightlife: [
    "catering.bar",          // primary
    "catering.pub",
    "catering.biergarten",
  ],
  landmarks: [
    "tourism.sights",        // primary
    "heritage",
    "tourism.attraction",
  ],
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

/**
 * Fetch places for one interest group. Tries with the full category list first;
 * if Geoapify rejects it (e.g. an unrecognised subcategory), falls back to the
 * primary (first) category which is always confirmed valid.
 */
const fetchPlacesForInterest = async (
  interest: InterestKey,
  filter: string,
  limit: number,
  apiKey: string
): Promise<Activity[]> => {
  const buildUrl = (cats: string) => {
    const url = new URL("https://api.geoapify.com/v2/places");
    url.searchParams.set("categories", cats);
    url.searchParams.set("filter", filter);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("apiKey", apiKey);
    return url.toString();
  };

  const parseFeatures = async (response: Response): Promise<Activity[]> => {
    if (!response.ok) return [];
    const data = (await response.json()) as { features?: GeoapifyFeature[] };
    return (data.features ?? [])
      .map(normalizeActivity)
      .filter((a): a is Activity => a !== null);
  };

  // Attempt 1: full category list for this interest
  const fullCats = interestCategoryMap[interest].join(",");
  const results = await parseFeatures(await fetch(buildUrl(fullCats)));
  if (results.length > 0) return results;

  // Attempt 2: primary category only (always confirmed valid)
  const primaryCat = interestCategoryMap[interest][0];
  if (primaryCat === fullCats) return results; // already tried this
  console.warn(`[itinerary] Full category fetch for "${interest}" returned 0 results; retrying with primary "${primaryCat}"`);
  return parseFeatures(await fetch(buildUrl(primaryCat)));
};

const normalizeCategory = (value: string) =>
  value.trim().toLowerCase().replace(/\//g, ".").replace(/\s+/g, "");

const normalizeName = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const estimateDurationMinutes = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes("museum") || cat.includes("zoo") || cat.includes("aquarium") || cat.includes("theme_park")) return 120;
  if (cat.includes("art_gallery") || cat.includes("exhibition") || cat.includes("planetarium")) return 90;
  if (cat.includes("park") || cat.includes("natural") || cat.includes("garden") || cat.includes("national_park")) return 90;
  if (cat.includes("beach") || cat.includes("marina") || cat.includes("sport")) return 90;
  if (cat.includes("restaurant") || cat.includes("food_court")) return 75;
  if (cat.includes("cafe") || cat.includes("bakery") || cat.includes("ice_cream")) return 45;
  if (cat.includes("bar") || cat.includes("pub") || cat.includes("biergarten") || cat.includes("nightclub") || cat.includes("casino")) return 90;
  if (cat.includes("cinema")) return 120;
  if (cat.includes("shopping_mall") || cat.includes("department_store")) return 90;
  if (cat.includes("marketplace") || cat.includes("clothing") || cat.includes("gift") || cat.includes("books") || cat.includes("antiques")) return 60;
  if (cat.includes("sights") || cat.includes("heritage") || cat.includes("attraction") || cat.includes("historic")) return 60;
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

  // Nightlife — strictly evening/night
  if (cat.includes("bar") || cat.includes("pub") || cat.includes("biergarten") ||
      cat.includes("nightclub") || cat.includes("casino") || cat.includes("nightlife")) {
    return ["Night", "Evening"];
  }
  // Cinema — evening preferred but afternoon works
  if (cat.includes("cinema")) {
    return ["Evening", "Afternoon", "Night"];
  }
  // Cafes and bakeries — morning treats
  if (cat.includes("cafe") || cat.includes("bakery") || cat.includes("ice_cream")) {
    return ["Morning", "Late Morning", "Afternoon"];
  }
  // Restaurants — spread across meal times
  if (cat.includes("restaurant") || cat.includes("food_court")) {
    return ["Afternoon", "Evening", "Morning"];
  }
  // Fast food — any time but not night
  if (cat.includes("fast_food")) {
    return ["Late Morning", "Afternoon", "Morning"];
  }
  // Outdoor / nature — best in the morning
  if (cat.includes("park") || cat.includes("natural") || cat.includes("garden") ||
      cat.includes("beach") || cat.includes("national_park") || cat.includes("marina") ||
      cat.includes("sport")) {
    return ["Morning", "Late Morning", "Afternoon"];
  }
  // Museums, galleries, aquariums — mid-day
  if (cat.includes("museum") || cat.includes("art_gallery") || cat.includes("aquarium") ||
      cat.includes("planetarium") || cat.includes("exhibition") || cat.includes("zoo")) {
    return ["Late Morning", "Afternoon"];
  }
  // Theme parks — full day starting morning
  if (cat.includes("theme_park")) {
    return ["Morning", "Late Morning"];
  }
  // Shopping — mid-morning to afternoon when stores are open
  if (cat.includes("shopping_mall") || cat.includes("department_store") ||
      cat.includes("marketplace") || cat.includes("clothing") || cat.includes("gift") ||
      cat.includes("books") || cat.includes("antiques")) {
    return ["Late Morning", "Afternoon"];
  }
  // Landmarks and historic sites — any daytime slot
  if (cat.includes("sights") || cat.includes("heritage") || cat.includes("attraction") ||
      cat.includes("historic") || cat.includes("tourism")) {
    return ["Morning", "Late Morning", "Afternoon"];
  }
  return [...TIME_SLOTS];
};

/** Groups scored activities by interest category (preserving score order within each group). */
const groupByInterest = (
  scored: Array<{ activity: Activity; score: number }>,
  interests: InterestKey[]
): Map<string, Activity[]> => {
  const allKeys = [...interests as string[], "other"];
  const groups = new Map<string, Activity[]>();
  allKeys.forEach((k) => groups.set(k, []));

  scored.forEach(({ activity }) => {
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
        groups.get(interest)!.push(activity);
        placed = true;
        break;
      }
    }
    if (!placed) groups.get("other")!.push(activity);
  });

  return groups;
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
  const pinnedIds = new Set(pinnedActivities.map((a) => a.id));

  const scored = activities
    .filter((a) => !pinnedIds.has(a.id))
    .map((a) => ({ activity: a, score: scoreActivity(a, interests) }))
    .sort((a, b) => b.score - a.score);

  const scoreOf = new Map(scored.map(({ activity, score }) => [activity.id, score]));

  // Group activities by interest category, preserving score order within each group
  const groups = groupByInterest(scored, interests);
  const allGroupKeys = [...interests as string[], "other"];

  // Round-robin assign each group's activities across days:
  //   food[0]→day1, food[1]→day2, food[2]→day3, food[3]→day1, ...
  // This ensures every day gets roughly equal quality from every category,
  // even when one category has far more results than the others.
  const dayBuckets: Activity[][] = Array.from({ length: days }, () => []);
  allGroupKeys.forEach((key) => {
    groups.get(key)!.forEach((activity, i) => {
      dayBuckets[i % days].push(activity);
    });
  });

  // Spread pinned activities evenly across days
  const pinnedPerDay: Activity[][] = Array.from({ length: days }, () => []);
  pinnedActivities.forEach((act, i) => {
    pinnedPerDay[i % days].push(act);
  });

  const usedIds = new Set<string>();

  const itineraryDays = Array.from({ length: days }, (_, index) => ({
    dayNumber: index + 1,
    activities: [] as Array<Activity & { suggestedTimeSlot: string }>,
  }));

  for (let dayIndex = 0; dayIndex < days; dayIndex++) {
    const dayNumber = dayIndex + 1;
    const blockedSlots = new Set(
      blockedWindows.filter((bw) => bw.day === dayNumber).map((bw) => bw.timeSlot)
    );
    const availableSlots = [...TIME_SLOTS].filter((slot) => !blockedSlots.has(slot));
    const slotsToFill = Math.min(maxActivitiesPerDay, availableSlots.length);

    const dayActivities: Activity[] = [];

    // 1. Pinned attractions for this day take priority
    pinnedPerDay[dayIndex].forEach((a) => {
      if (!usedIds.has(a.id) && dayActivities.length < slotsToFill) {
        dayActivities.push(a);
        usedIds.add(a.id);
      }
    });

    const bucket = dayBuckets[dayIndex].filter((a) => !usedIds.has(a.id));

    // 2. Phase 1 — pick the best-scored activity from each interest group
    //    so every day is guaranteed to have category variety.
    const bucketByGroup = new Map<string, Activity[]>();
    allGroupKeys.forEach((k) => bucketByGroup.set(k, []));
    bucket.forEach((activity) => {
      for (const key of allGroupKeys) {
        if (key === "other") continue;
        const cats = interestCategoryMap[key as InterestKey].map(normalizeCategory);
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
          bucketByGroup.get(key)!.push(activity);
          return;
        }
      }
      bucketByGroup.get("other")!.push(activity);
    });

    for (const key of allGroupKeys) {
      if (dayActivities.length >= slotsToFill) break;
      const candidates = bucketByGroup
        .get(key)!
        .filter((a) => !usedIds.has(a.id))
        .sort((a, b) => (scoreOf.get(b.id) ?? 0) - (scoreOf.get(a.id) ?? 0));
      if (candidates.length > 0) {
        dayActivities.push(candidates[0]);
        usedIds.add(candidates[0].id);
      }
    }

    // 3. Phase 2 — fill any remaining slots with the highest-scored leftovers
    if (dayActivities.length < slotsToFill) {
      const leftovers = bucket
        .filter((a) => !usedIds.has(a.id))
        .sort((a, b) => (scoreOf.get(b.id) ?? 0) - (scoreOf.get(a.id) ?? 0));
      for (const a of leftovers) {
        if (dayActivities.length >= slotsToFill) break;
        dayActivities.push(a);
        usedIds.add(a.id);
      }
    }

    itineraryDays[dayIndex].activities = assignTimeSlotsForDay(dayActivities, availableSlots);
  }

  const unassigned = scored.map((s) => s.activity).filter((a) => !usedIds.has(a.id));
  return { itineraryDays, unassignedActivities: unassigned };
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

    // Fetch each interest in parallel with its own result budget so no single
    // category (e.g. restaurants in NYC) can crowd out the others.
    const perInterestLimit = Math.min(
      Math.ceil((days * maxActivitiesPerDay * 4) / interests.length),
      50
    );

    const interestFetches = interests.map((interest) =>
      fetchPlacesForInterest(interest, filter, perInterestLimit, apiKey)
    );

    const perInterestResults = await Promise.all(interestFetches);

    if (perInterestResults.every((r) => r.length === 0)) {
      return res.status(502).json({ error: "Geoapify places lookup failed for all interests." });
    }

    const normalized = perInterestResults.flat();
    const categories = getGeoapifyCategories(interests);
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

// Generate (or retrieve) a share token for a saved itinerary
router.post("/saved/:id/share", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid itinerary id." });
  }

  try {
    const existing = await Trip.findById(id).select("shareToken").lean();
    if (!existing) {
      return res.status(404).json({ error: "Itinerary not found." });
    }

    const token = (existing as { shareToken?: string }).shareToken || randomUUID();

    await Trip.findByIdAndUpdate(id, { shareToken: token });

    return res.json({ shareToken: token });
  } catch (error) {
    console.error("Share token error:", error);
    return res.status(500).json({ error: "Failed to generate share link." });
  }
});

// Public read-only view by share token — no auth required
router.get("/share/:token", async (req, res) => {
  const { token } = req.params;

  try {
    const trip = await Trip.findOne({ shareToken: token }).lean();

    if (!trip) {
      return res.status(404).json({ error: "Shared itinerary not found." });
    }

    return res.json({ trip });
  } catch (error) {
    console.error("Load shared itinerary error:", error);
    return res.status(500).json({ error: "Failed to load shared itinerary." });
  }
});

export default router;
