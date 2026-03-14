// 1. The Ingredients: We import the tools we need to start the engine.
const express = require('express'); // The web server
const { ApolloServer } = require('apollo-server-express'); // The GraphQL engine
const { setupDb } = require('./database/db'); // The Database connector
const typeDefs = require('./schema'); // The "Table of Contents"
const resolvers = require('./resolvers'); // The "Butler" who gets data
const path = require('path'); // Tool for finding folders on your computer
const cors = require('cors'); // Tool that lets the Frontend talk to the Backend

// 2. The Start Function: This puts everything together and turns on the power.
async function startServer() {
    const app = express();

    // Enable 'CORS' so your web browser doesn't block the connection.
    app.use(cors());

    // Tell the server where to find your frontend files (HTML/CSS/JS).
    app.use(express.static(path.join(__dirname, 'frontend')));

    // 3. Connect to the Database: 
    // This waits for MongoDB to be ready before starting the API.
    await setupDb();

    // 4. Setup Apollo Server: 
    // We give it the 'Table of Contents' (schema) and the 'Butler' (resolvers).
    const server = new ApolloServer({
        typeDefs,
        resolvers
    });

    // Start the GraphQL engine.
    await server.start();

    // Connect the GraphQL engine to our web server.
    server.applyMiddleware({ app });

    // 5. The Port: Set the server to run on address 4000.
    const PORT = 4000;
    app.listen(PORT, () => {
        console.log(`\n🚀 Server is ready!`);
        console.log(`📊 API (GraphQL) is at: http://localhost:${PORT}${server.graphqlPath}`);
        console.log(`🌐 Website (Frontend) is at: http://localhost:${PORT}\n`);
    });
}

// 6. Run the Engine: Actually call the function to start everything.
startServer().catch(err => {
    console.error('Oops! The server failed to start:', err);
});
