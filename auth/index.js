const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { getParameter } = require('./utils/parameterStore');
const loginRoutes = require('./routes/login');
const signupRouter = require('./routes/signup');

const app = express();
const PORT = 3001;

async function startServer() {
    try {
        console.log('Starting server configuration...');

        const frontendUrl = await getParameter("/frontendurl");
        console.log(`Frontend URL configured: ${frontendUrl}`);

        app.use(cors({
            origin: frontendUrl,
            credentials: true
        }));

        app.use(express.json());
        app.use(cookieParser());
        app.use(express.urlencoded({ extended: true }));

        // Route setup
        app.use('/login', loginRoutes);
        app.use('/signup', signupRouter);

        // Start the server
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server is running on port ${PORT}`);
        });

        console.log('Server started successfully');
    } catch (error) {
        console.error('Error starting server:', error);
    }
}

console.log('Initiating server startup...');
startServer();