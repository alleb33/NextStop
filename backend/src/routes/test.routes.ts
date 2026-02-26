import { Router } from "express";

const router = Router();

router.get("/test", (req, res) => {
  res.json({ message: "API works!" });
});

router.get("/places", async (req, res) => {
  const apiKey = process.env.GEOAPIFY_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Missing GEOAPIFY_API_KEY in backend environment variables.",
    });
  }

  const categories =
    typeof req.query.categories === "string"
      ? req.query.categories
      : "commercial.supermarket";

  const filter =
    typeof req.query.filter === "string"
      ? req.query.filter
      : "rect:10.716463143326969,48.755151258420966,10.835314015356737,48.680903341613316";

  const limit =
    typeof req.query.limit === "string" && /^\d+$/.test(req.query.limit)
      ? req.query.limit
      : "20";

  const url = new URL("https://api.geoapify.com/v2/places");
  url.searchParams.set("categories", categories);
  url.searchParams.set("filter", filter);
  url.searchParams.set("limit", limit);
  url.searchParams.set("apiKey", apiKey);

  try {
    const response = await fetch(url.toString(), { method: "GET" });
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Geoapify request failed",
        details: data,
      });
    }

    return res.json(data);
  } catch (error) {
    console.error("Geoapify fetch error:", error);
    return res.status(500).json({ error: "Failed to fetch places from Geoapify." });
  }
});

export default router;
