# Display Doctor - TV Service Management System

A comprehensive TV service management system built with Express.js, TypeScript, and EJS templates.

## Features

- **Admin Management**: Complete admin dashboard with user management
- **Caller System**: Callers can manage customers and TV issues
- **Customer Management**: Create and track customers with unique codes
- **Issue Tracking**: TV issue management with visit scheduling
- **Email Notifications**: Automated email system for issue updates
- **Role-based Access**: Secure authentication and authorization

## Tech Stack

- **Backend**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose
- **Template Engine**: EJS
- **Styling**: Bootstrap 5
- **Authentication**: JWT with cookies
- **File Upload**: Multer
- **Email**: Nodemailer

## Development

### Prerequisites

- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your configuration:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/display-doctor
   JWT_SECRET=your-secret-key
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

## Production Build

### Build Commands

- **Development**: `npm run dev`
- **Build**: `npm run build`
- **Clean Build**: `npm run build:clean`
- **Production Build**: `npm run build:prod`
- **Start**: `npm start`
- **Production Start**: `npm run start:prod`

### Build Process

1. **Clean Build** (recommended for production):
   ```bash
   npm run build:prod
   ```
   This will:
   - Clean the dist folder
   - Compile TypeScript to JavaScript
   - Copy static assets (views, public, uploads)

2. **Start Production Server**:
   ```bash
   npm run start:prod
   ```

### Build Optimizations

The TypeScript configuration is optimized for production:

- **Target**: ES2020 for modern Node.js features
- **Module**: CommonJS for Node.js compatibility
- **Output**: Clean JavaScript without comments or source maps
- **Incremental Compilation**: Faster rebuilds
- **Strict Type Checking**: Better code quality

### Deployment

1. Build the application:
   ```bash
   npm run build:prod
   ```

2. The `dist/` folder contains:
   - Compiled JavaScript files
   - Static assets (views, public, uploads)
   - Ready for deployment

3. Deploy the `dist/` folder to your server

4. Install production dependencies:
   ```bash
   npm install --production
   ```

5. Start the server:
   ```bash
   npm run start:prod
   ```

## Project Structure

```
display-doctor/
├── app/
│   ├── config/          # Database and environment config
│   ├── controller/      # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── model/          # Mongoose models
│   ├── routes/         # Express routes
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── dist/               # Build output (generated)
├── public/             # Static assets
├── uploads/            # File uploads
├── views/              # EJS templates
├── server.ts           # Application entry point
└── tsconfig.json       # TypeScript configuration
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `MONGODB_URI` | MongoDB connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `EMAIL_HOST` | SMTP host | - |
| `EMAIL_PORT` | SMTP port | 587 |
| `EMAIL_USER` | Email username | - |
| `EMAIL_PASS` | Email password | - |

## License

ISC 