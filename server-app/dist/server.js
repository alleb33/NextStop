"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const port = process.env.PORT || 5001;
const app = (0, express_1.default)();
app.get("/", (req, res) => {
    res.send("YO YO YO WELCOME TO NEXTSTOP, WE UP AND RUNNING BABY!!!!");
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}, yippee!!!`);
});
//# sourceMappingURL=server.js.map