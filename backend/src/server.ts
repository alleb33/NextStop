import express from "express"; 
import dotenv from "dotenv";
import cors from "cors";
import connectDb from "./config/dbconfig";

import testRoutes from "./routes/test.routes";

dotenv.config(); 
connectDb(); 

const port = process.env.PORT || 5001; 

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", testRoutes);

app.get("/", (req, res) => {
    res.send("YO YO YO WELCOME TO NEXTSTOP, WE UP AND RUNNING BABY!!!!");
}); 

app.listen(port, () => {
    console.log(`Server is running on port ${port}, yippee!!!`);
});

export default app;