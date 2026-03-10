const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { setupDb } = require('./database/db');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const path = require('path');
const cors = require('cors');

async function startServer() {
    const app = express();
    app.use(cors());
    app.use(express.static(path.join(__dirname, 'frontend')));

    const db = await setupDb();

    const server = new ApolloServer({
        typeDefs,
        resolvers,
        context: () => ({ db })
    });

    await server.start();
    server.applyMiddleware({ app });

    const PORT = 4000;
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}${server.graphqlPath}`);
        console.log(`Frontend available at http://localhost:${PORT}`);
    });
}

startServer().catch(err => {
    console.error('Failed to start server:', err);
});
