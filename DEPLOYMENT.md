# Deploying the Quiz Builder Application

This guide provides detailed instructions on how to deploy the Quiz Builder application to various hosting platforms.

## General Deployment Considerations

Before deploying, ensure:

1. Your database connection string is properly configured
2. Environment variables are correctly set up
3. Production build is generated (`npm run build`)
4. Database migrations are run for production

## Deploying to Replit

The application is already configured for deployment on Replit:

1. Click the "Deploy" button in the Replit interface
2. Follow the deployment steps in the Replit UI
3. Your application will be available at your-repl-name.replit.app

## Deploying to Render

### Database Setup

1. Create a PostgreSQL database in Render
2. Note the connection details (host, port, username, password, database name)

### Web Service Setup

1. Connect your GitHub repository to Render
2. Create a new Web Service with the following settings:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment Variables:
     - `DATABASE_URL`: Your PostgreSQL connection string
     - `SESSION_SECRET`: A secure random string for session management
     - `NODE_ENV`: Set to `production`

3. Deploy the service

### Post-Deployment Steps

1. Run database migrations using Render's shell access
2. Seed the database with initial data if needed

## Deploying to Heroku

1. Create a Heroku account and install the Heroku CLI
2. Login to Heroku: `heroku login`
3. Create a new app: `heroku create your-app-name`
4. Add PostgreSQL add-on: `heroku addons:create heroku-postgresql:hobby-dev`
5. Configure environment variables:
   ```
   heroku config:set SESSION_SECRET=your-secret
   heroku config:set NODE_ENV=production
   ```
6. Deploy your application:
   ```
   git push heroku main
   ```
7. Run database migrations:
   ```
   heroku run npm run db:push
   ```
8. Seed the database:
   ```
   heroku run npm run db:seed
   ```

## Deploying to AWS

### Database Setup (Amazon RDS)

1. Create a PostgreSQL database in Amazon RDS
2. Configure security groups to allow access from your EC2 instance

### Application Deployment (EC2)

1. Launch an EC2 instance with Ubuntu
2. Connect to your instance via SSH
3. Install Node.js and npm
4. Clone your repository
5. Install dependencies: `npm install`
6. Build the application: `npm run build`
7. Set up environment variables
8. Use PM2 for process management:
   ```
   npm install -g pm2
   pm2 start npm --name "quiz-app" -- start
   pm2 startup
   pm2 save
   ```

## Deploying to DigitalOcean

### Using App Platform

1. Connect your GitHub repository to DigitalOcean
2. Create a new App Platform application
3. Configure the build settings
4. Add a database component
5. Set environment variables
6. Deploy the application

### Using Droplets

1. Create a new Droplet with Node.js pre-installed
2. Connect to your Droplet via SSH
3. Clone your repository
4. Install dependencies and build the application
5. Set up Nginx as a reverse proxy
6. Configure environment variables
7. Use PM2 for process management

## SSL Configuration

For all deployment options, it's recommended to enable SSL:

- Replit: SSL is provided automatically
- Render: SSL is provided automatically
- Heroku: SSL is provided automatically
- AWS: Use AWS Certificate Manager and configure with LoadBalancer
- DigitalOcean: Enable Let's Encrypt in the platform settings

## Monitoring and Maintenance

After deployment:

1. Monitor application performance
2. Set up logging services
3. Implement regular database backups
4. Create a maintenance schedule for updates
5. Consider setting up CI/CD for automated deployments

## Troubleshooting

Common deployment issues:

1. **Database Connection Errors**: Verify connection string and security settings
2. **Missing Environment Variables**: Ensure all required variables are set
3. **Build Failures**: Check for dependencies or build script issues
4. **Port Conflicts**: Make sure the application is using the port provided by the hosting platform
5. **Memory Issues**: Monitor resource usage and adjust instance sizes as needed

For any specific deployment questions, consult the documentation for your chosen hosting platform.