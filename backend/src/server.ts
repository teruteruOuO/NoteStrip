import app from './app';
import { ApplicationConfiguration } from './config/application';

// Start application
app.listen(ApplicationConfiguration.application.port, () => {
    console.log(`Server running on ${ApplicationConfiguration.application.server_url}:${ApplicationConfiguration.application.port} in ${ApplicationConfiguration.application.node_environment} mode`);
    console.log(`Current frontend url is ${ApplicationConfiguration.corsOptions.origin}`);
});