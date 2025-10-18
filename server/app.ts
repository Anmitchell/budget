import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config(); // Load environment variables from .env file.

const app = express(); // Create an Express application.

app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cors()); // Allows requests from client-side to server-side

const PORT = process.env.PORT || 3000; // Get port from environment variables or use 3000 as default.

app.get("/", (req, res) => {
    res.send("Hello World");
});

// output a message to the console when the server is running
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});