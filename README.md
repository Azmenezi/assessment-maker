# Assessment Maker

A comprehensive penetration testing report generation tool built with React, Express, and SQLite.

## Features

- **Report Management**: Create, edit, and manage penetration testing reports
- **Findings Library**: Reusable findings database
- **Image Storage**: Efficient image handling with automatic compression
- **Export Options**: PDF, Word, and ZIP exports
- **Reassessment Tracking**: Version-controlled reassessment chains
- **Modern UI**: Material-UI components with toast notifications
- **Offline Support**: Fallback to localStorage when server is unavailable
- **🔐 Database Encryption**: AES-256-CBC encryption for all sensitive data at rest

## Architecture

### Frontend (React)

- **Framework**: React 18 with hooks
- **UI Library**: Material-UI (MUI) v6
- **State Management**: Zustand
- **Routing**: React Router v7
- **Export Libraries**: pdfmake, docx, jszip

### Backend (Express + SQLite)

- **Server**: Express.js
- **Database**: SQLite with BLOB support for images
- **File Upload**: Multer for image handling
- **API**: RESTful endpoints for all operations

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd assessment-maker
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development environment**

   ```bash
   # Start both server and client simultaneously
   npm run dev

   # Or run separately:
   npm run server  # Start API server on port 3001
   npm start       # Start React client on port 3000
   ```

### Database Setup

The SQLite database is automatically created when you first run the server. The database file will be located at `server/assessment_maker.db`.

#### Database Schema

**Reports Table**

- Basic report information (project name, dates, assessor, etc.)
- Assessment type (Initial/Reassessment)
- Parent assessment tracking for reassessments

**Findings Table**

- Finding details (title, severity, description, etc.)
- Status tracking (OPEN/CLOSED)
- Affected endpoints

**Images Table**

- BLOB storage for finding images
- Metadata (filename, size, mime type)
- Automatic compression and optimization

**Findings Library Table**

- Reusable finding templates

### Migration from localStorage

If you have existing data in localStorage, you can migrate it to the database:

1. **Export localStorage data** (from browser console):

   ```javascript
   // Copy this data to a file (e.g., backup.json)
   JSON.stringify(JSON.parse(localStorage.getItem("pentest_reports")), null, 2);
   ```

2. **Import to database**:

   ```bash
   cd server
   node migrate.js import ../backup.json
   ```

3. **Export database back to JSON** (for backup):
   ```bash
   cd server
   node migrate.js export
   ```

## API Endpoints

### Reports

- `GET /api/reports` - Get all reports
- `GET /api/reports/:id` - Get single report
- `POST /api/reports` - Create new report
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report
- `POST /api/reports/:id/reassessment` - Create reassessment

### Images

- `POST /api/images/upload` - Upload image
- `GET /api/images/:id` - Get image
- `DELETE /api/images/:id` - Delete image

### Findings Library

- `GET /api/findings-library` - Get findings library

### Health Check

- `GET /health` - Server health status

## Development

### Project Structure

```
assessment-maker/
├── src/                    # React frontend
│   ├── components/         # Reusable components
│   ├── hooks/             # Custom hooks
│   ├── pages/             # Page components
│   ├── services/          # API service
│   ├── store/             # Zustand stores
│   └── utils/             # Utility functions
├── server/                # Express backend
│   ├── database.js        # SQLite setup and helpers
│   ├── server.js          # Express server
│   └── migrate.js         # Migration utilities
└── public/                # Static assets
```

### Key Features

#### Storage Management

- **Automatic Image Compression**: Images are compressed to reduce storage usage
- **BLOB Storage**: Efficient binary storage in SQLite
- **Fallback Support**: Automatic fallback to localStorage if server is unavailable
- **🔐 Database Encryption**: All sensitive data encrypted at rest using AES-256-CBC

#### Version Management

- **Smart Versioning**: Automatic version incrementing for reassessments (1.0 → 2.0 → 3.0)
- **Parent Tracking**: Maintains links between original assessments and reassessments
- **Historical Data**: Preserves original assessment data in reassessments

#### Export System

- **Multiple Formats**: PDF, Word document, and ZIP archives
- **Image Inclusion**: All finding images included in exports
- **Organized Structure**: ZIP exports include organized folder structure

### Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:3001/api

# Server Configuration
PORT=3001

# Database Configuration (optional)
DB_PATH=./server/assessment_maker.db
```

## Production Deployment

### Database Backup

```bash
# Export current database
cd server
node migrate.js export

# The export will be saved as export_localStorage.json
```

### Encryption

All sensitive data is automatically encrypted in the database. See [ENCRYPTION_GUIDE.md](./ENCRYPTION_GUIDE.md) for detailed information about:

- Encryption algorithms and security features
- Key management and backup procedures
- Monitoring and verification
- Troubleshooting and support

### Server Deployment

1. Build the React app: `npm run build`
2. Deploy the `build/` folder and `server/` folder to your server
3. Install production dependencies: `npm install --production`
4. **Important**: Ensure the encryption key file `server/.encryption_key` is included in deployment
5. Start the server: `npm run server`

### Electron App

```bash
# Build desktop application
npm run electron-build
```

## Troubleshooting

### Common Issues

1. **Server Connection Failed**

   - Check if server is running on port 3001
   - Verify API_URL in environment variables
   - App will automatically fall back to localStorage

2. **Database Errors**

   - Ensure write permissions in server directory
   - Check SQLite installation
   - Delete database file to reset (will lose data)

3. **Encryption Issues**

   - Check if `server/.encryption_key` file exists
   - Verify file permissions (should be 600)
   - See [ENCRYPTION_GUIDE.md](./ENCRYPTION_GUIDE.md) for detailed troubleshooting

4. **Image Upload Issues**

   - Check file size (max 10MB)
   - Verify file type (images only)
   - Check server disk space

5. **Export Problems**
   - Ensure all dependencies are installed
   - Check browser permissions for downloads
   - Verify export path settings

### Performance Tips

- **Large Images**: Images are automatically compressed to optimize storage
- **Database Size**: Use export/import to manage database size
- **Network**: API calls include error handling and retry logic
- **Encryption**: Minimal performance impact (~5-10ms per operation)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review the [ENCRYPTION_GUIDE.md](./ENCRYPTION_GUIDE.md) for encryption-related issues
3. Check browser console for errors
4. Verify server logs for backend issues
5. Use the encryption status endpoint: `GET /api/encryption/status`
