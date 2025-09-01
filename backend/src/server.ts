import app from './app';
import https from 'https';
import { ApplicationConfiguration } from './config/application';

// Start application
const cert = ApplicationConfiguration.cert;
const key = ApplicationConfiguration.key;

https.createServer({ key, cert }, app).listen(ApplicationConfiguration.application.port, () => {
    console.log(`Server running on ${ApplicationConfiguration.application.server_url}:${ApplicationConfiguration.application.port} in ${ApplicationConfiguration.application.node_environment} mode`);
    console.log(`Current frontend url is ${ApplicationConfiguration.corsOptions.origin}`);
    console.log(`Using Cert: ${ApplicationConfiguration.cert}`);
    console.log(`Using Key: ${ApplicationConfiguration.key}`);
});