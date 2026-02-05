import express from "express";
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "NextStop backend is working" });
});

export default router;