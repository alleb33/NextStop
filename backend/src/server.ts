import express from "express"; 
import dotenv from "dotenv";
import cors from "cors";
import connectDb from "./config/dbconfig";

import testRoutes from "./routes/test.routes";
import itineraryRoutes from "./routes/itinerary.routes";

dotenv.config(); 
connectDb(); 

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", testRoutes);
app.use("/api/itinerary", itineraryRoutes);

app.get("/", (req, res) => {
    res.send("YO YO YO WELCOME TO NEXTSTOP, WE UP AND RUNNING BABY!!!!");
}); 

export default app;
