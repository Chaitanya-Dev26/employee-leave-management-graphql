// 0. Load environment variables from .env file (must be the very first line).
require('dotenv').config();

// 1. The Ingredients: We import the tools we need to start the engine.
const express = require('express');                          // The web server
const { ApolloServer } = require('@apollo/server');          // The GraphQL engine (v4)
const { expressMiddleware } = require('@as-integrations/express5'); // Connects Apollo to Express
const bodyParser = require('body-parser');                   // Reads incoming JSON requests
const { setupDb } = require('./database/db');                // The Database connector
const typeDefs = require('./schema');                        // The "Table of Contents"
const resolvers = require('./resolvers');                    // The "Butler" who gets data
const path = require('path');                               // Tool for finding folders on your computer
const cors = require('cors');                               // Tool that lets the Frontend talk to the Backend

// 2. The Express App: Created here so it can be exported for Vercel.
const app = express();

// 3. The Start Function: This puts everything together and turns on the power.
async function startServer() {

    // Enable 'CORS' so your web browser doesn't block the connection.
    app.use(cors());

    // Reads incoming JSON — required by Apollo Server 4
    app.use(bodyParser.json());

    // Tell the server where to find your frontend files (HTML/CSS/JS).
    app.use(express.static(path.join(__dirname, 'frontend')));

    // 4. Connect to the Database:
    // This waits for the DB to be ready before starting the API.
    await setupDb();

    // 5. Setup Apollo Server:
    // We give it the 'Table of Contents' (schema) and the 'Butler' (resolvers).
    const server = new ApolloServer({
        typeDefs,
        resolvers
    });

    // Start the GraphQL engine.
    await server.start();

    // 6. Connect GraphQL to Express at the /graphql route.
    //    Apollo Server 4 uses expressMiddleware instead of applyMiddleware.
    app.use('/graphql', expressMiddleware(server));

    // 7. The Port: Only start listening locally (Vercel handles this in production).
    if (process.env.NODE_ENV !== 'production') {
        const PORT = process.env.PORT || 4000;
        app.listen(PORT, () => {
            console.log(`\n🚀 Server is ready!`);
            console.log(`📊 API (GraphQL) is at: http://localhost:${PORT}/graphql`);
            console.log(`🌐 Website (Frontend) is at: http://localhost:${PORT}\n`);
        });
    }
}

// 8. Run the Engine: Actually call the function to start everything.
startServer().catch(err => {
    console.error('Oops! The server failed to start:', err);
});

// 9. Export the app for Vercel's serverless function builder.
module.exports = app;