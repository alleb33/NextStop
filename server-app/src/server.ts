import express from "express"; 
import dotenv from "dotenv";
import cors from "cors";
dotenv.config(); 

const port = process.env.PORT || 5001; 

const app = express();

app.get("/", (req, res) => {
    res.send("YO YO YO WELCOME TO NEXTSTOP, WE UP AND RUNNING BABY!!!!");
}); 

app.listen(port, () => {
    console.log(`Server is running on port ${port}, yippee!!!`);
});