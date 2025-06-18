# Assessment Maker

A professional penetration testing report generator built with React and Electron, featuring modern UI components and comprehensive report management.

## Features

### Core Functionality

- **Modern Report Creation**: Create detailed penetration testing reports with structured findings
- **Reassessment Support**: Generate follow-up assessments with version tracking
- **Finding Management**: Comprehensive finding library with categorization and severity levels
- **Professional Export**: Export reports to PDF, Word, and ZIP formats with embedded images
- **File System Storage**: Robust file-based storage system for unlimited report and image capacity

### Enhanced User Experience

- **Toast Notifications**: Non-intrusive notifications for all user actions
- **Modern Confirmation Dialogs**: Professional confirmation dialogs with contextual icons
- **Real-time Validation**: Comprehensive form validation with helpful error messages
- **Advanced Filtering**: Multi-criteria filtering and sorting for report management
- **Responsive Design**: Modern Material-UI components with professional styling

### Technical Architecture

- **Electron Desktop App**: Native desktop application with file system access
- **File-Based Storage**: Reports stored as JSON files, images stored as separate files
- **Image Management**: Automatic image compression and file system storage
- **Storage Locations**:
  - Reports: `~/Documents/AssessmentMaker/reports/`
  - Images: `~/Documents/AssessmentMaker/images/`
  - Exports: `~/Desktop/assessmentReports/`

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd assessment-maker

# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Package as Electron app
npm run electron-pack
```

## Storage System

### File System Architecture

The application uses a robust file system storage approach:

1. **Reports Storage**: JSON files in `~/Documents/AssessmentMaker/reports/`
2. **Image Storage**: Binary files in `~/Documents/AssessmentMaker/images/`
3. **Export Location**: `~/Desktop/assessmentReports/`

### Benefits Over localStorage

- **Unlimited Storage**: No 5MB localStorage limitations
- **Better Performance**: Large images don't slow down the application
- **Data Persistence**: Files survive browser cache clearing
- **Professional Architecture**: Proper separation of data and application code
- **Easy Backup**: Simple file-based backup and restore

### Image Management

- **Automatic Compression**: Images are optimized for storage efficiency
- **Multiple Formats**: Support for PNG, JPG, GIF, WebP
- **File Size Limits**: Up to 50MB per image (vs 10MB in localStorage version)
- **Unique Identifiers**: UUID-based image identification system

## Usage

### Creating Reports

1. Click "New Report" and fill in required fields
2. Add findings with descriptions, impacts, and mitigation steps
3. Upload proof-of-concept images for each finding
4. Save and export in multiple formats

### Managing Images

- Images are automatically compressed and stored in the file system
- Each image gets a unique identifier for reliable referencing
- Images are included in ZIP exports for complete documentation

### Reassessments

- Create follow-up assessments from existing reports
- Automatic version incrementing (v1.0 → v2.0 → v3.0)
- Track changes between assessment versions

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Development Scripts

#### Cross-Platform (Recommended)

```bash
# Start React development server
npm start

# Start Electron in development mode (works on Windows, macOS, Linux)
npm run electron-dev

# Start both React and Electron together
npm run start-electron
```

#### Windows-Specific (Alternative)

If you encounter issues with `npm run electron-dev` on Windows, use:

```bash
npm run electron-dev-win
```

#### Development Workflow

1. **Option 1 - Separate terminals:**

   ```bash
   # Terminal 1: Start React dev server
   npm start

   # Terminal 2: Start Electron (after React is running)
   npm run electron-dev
   ```

2. **Option 2 - Single command:**
   ```bash
   # Starts both React and Electron automatically
   npm run start-electron
   ```

### Production Build

```bash
# Build React app
npm run build

# Start Electron with built files
npm run electron-start

# Build Electron installer
npm run electron-build
```

### Troubleshooting

#### Windows Issues

- **NODE_ENV not recognized**: Use `npm run electron-dev` (with cross-env) instead of setting NODE_ENV manually
- **Path issues**: Make sure Node.js and npm are in your PATH
- **Permission errors**: Run terminal as administrator if needed

#### macOS/Linux Issues

- **Permission denied**: Run `chmod +x electron.js` if needed
- **Node version**: Ensure you're using Node.js v14 or higher

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Add your license information here]

## Support

For issues and questions, please create an issue in the repository.

---

**Note**: This application is designed for professional penetration testing workflows and includes features for comprehensive security assessment documentation.
