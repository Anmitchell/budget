import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import { generalRateLimit } from "./middleware/rateLimiting.js";
import { sanitizeUserInput } from "./middleware/sanitization.js";

const app = express(); // Create an Express application.

app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cors()); // Allows requests from client-side to server-side
app.use(generalRateLimit); // Apply general rate limiting to all routes

// Apply sanitization middleware to all routes
// This should come after parsing but before route-specific middleware
app.use('/api/users', sanitizeUserInput);

// Environment variables
const PORT = process.env.PORT || 3000; // Get port from environment variables or use 3000 as default.

// Routes
app.use('/api/users', userRoutes);

// Health check route
app.get("/", generalRateLimit, (req, res) => {
    res.json({
        message: "Server is running",
        port: PORT
    });
});


// output a message to the console when the server is running
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});