import dotenv from "dotenv";
dotenv.config();

import app from "./server";
import connectDb from "./config/db";

const PORT = process.env.PORT || 5001;

// connectDB();

connectDb().then(() => {
  console.log("Database connected");

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error("DB connection failed:", err);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
