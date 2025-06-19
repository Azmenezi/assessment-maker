# Data Management & Migration Guide

## Overview

The Assessment Maker now includes a comprehensive data management system that allows you to:

- **Export** data from both localStorage and the SQLite database
- **Import** data to either storage system
- **Migrate** seamlessly between localStorage and database
- **Monitor** storage usage and statistics
- **Manage** data with built-in safety features

## Features

### 🏠 **Data Management Dashboard**

Access via: **Navigation Menu → Backup & Restore**

The dashboard provides:

- **Real-time storage statistics** for both localStorage and database
- **Visual indicators** showing storage type and usage
- **One-click operations** for all data management tasks
- **Progress indicators** for long-running operations
- **Safety confirmations** for destructive operations

### 📊 **Storage Statistics**

#### localStorage Storage

- **Type**: Browser-based storage (legacy)
- **Limit**: ~5MB typical browser limit
- **Contains**: Reports, findings, and base64-encoded images
- **Status**: Legacy storage with automatic fallback support

#### Database Storage

- **Type**: SQLite database with BLOB support
- **Limit**: Unlimited (disk space dependent)
- **Contains**: Structured data with efficient binary image storage
- **Status**: Current recommended storage system

### 📤 **Export Capabilities**

#### Export localStorage Data

```javascript
// What it exports:
{
  "reports": [...], // All localStorage reports
  "format": "localStorage", // Compatible with legacy system
  "images": "base64", // Images as base64 strings
  "size": "limited" // Subject to 5MB browser limit
}
```

**Use Cases:**

- Backup legacy data before migration
- Transfer data between browsers
- Create emergency backups

#### Export Database Data

```javascript
// What it exports:
{
  "reports": [...], // All database reports
  "format": "database", // Optimized format
  "images": "embedded", // Images as base64 for portability
  "size": "unlimited" // No size restrictions
}
```

**Use Cases:**

- Regular backups of current data
- Data transfer between systems
- Archive complete assessment data

### 📥 **Import Capabilities**

#### Import to localStorage

- **Target**: Browser localStorage
- **Format**: Accepts both localStorage and database exports
- **Behavior**: Merges with existing data, removes duplicates
- **Use Case**: Restore legacy data or work offline

#### Import to Database

- **Target**: SQLite database via API
- **Format**: Accepts both localStorage and database exports
- **Behavior**: Creates new records, handles duplicates gracefully
- **Use Case**: Import data into the current system

### 🔄 **Migration System**

#### Automatic Migration: localStorage → Database

```bash
# What happens during migration:
1. Reads all localStorage data
2. Validates data format and structure
3. Creates reports in database with proper IDs
4. Converts base64 images to BLOB storage
5. Maintains all relationships (reports → findings → images)
6. Preserves original localStorage data as backup
7. Provides detailed success/error reporting
```

**Benefits:**

- **Performance**: Database queries vs localStorage parsing
- **Storage**: Unlimited vs 5MB browser limit
- **Reliability**: ACID transactions vs browser storage
- **Scalability**: Handles thousands of reports efficiently

### 🔧 **Management Commands**

#### Frontend (Web Interface)

- **Export localStorage**: Download browser data as JSON
- **Export Database**: Download database data as JSON
- **Import to localStorage**: Upload JSON to browser storage
- **Import to Database**: Upload JSON to database
- **Migrate Data**: One-click localStorage → database migration
- **Clear Data**: Remove all data from either storage (with confirmation)

#### Backend (Server Commands)

```bash
# Server-side migration tools
cd server

# Export database to JSON file
node migrate.js export

# Import JSON file to database
node migrate.js import backup.json

# Check server status and statistics
node start.js
```

#### API Endpoints

```bash
# Statistics
GET /api/stats

# Migration
POST /api/migrate/import
GET /api/migrate/export

# Bulk operations
POST /api/reports/bulk
```

## Usage Scenarios

### 🚀 **New User Setup**

1. Start the application
2. Data automatically loads from database
3. If no data exists, localStorage is checked as fallback
4. Begin creating reports (stored in database)

### 📦 **Migrating from Legacy Version**

1. Go to **Backup & Restore** page
2. Check localStorage statistics
3. Click **"Migrate localStorage → Database"**
4. Wait for migration completion
5. Verify data in database statistics
6. Optionally clear localStorage after verification

### 💾 **Regular Backups**

1. Go to **Backup & Restore** page
2. Click **"Export Database Data"**
3. Save the downloaded JSON file
4. Store in secure location (cloud storage, external drive)

### 🔄 **Data Transfer Between Systems**

1. **Source System**: Export database data
2. **Target System**: Import to database
3. Verify data integrity
4. Continue working on target system

### 🆘 **Emergency Recovery**

1. If database is corrupted, app automatically falls back to localStorage
2. If both are lost, import from backup JSON file
3. Choose target storage system during import
4. Verify data integrity after recovery

## Technical Details

### Data Format Compatibility

- **localStorage exports** can be imported to both localStorage and database
- **Database exports** can be imported to both localStorage and database
- **Automatic format detection** handles differences transparently
- **Image handling** converts between base64 and BLOB as needed

### Storage Efficiency

```bash
# Storage comparison for typical assessment:
localStorage: ~2-5MB per report (base64 images)
Database: ~500KB-1MB per report (BLOB images)
Compression: ~60-80% space savings
```

### Error Handling

- **Network failures**: Automatic fallback to localStorage
- **Import errors**: Detailed error reporting with partial success
- **Duplicate data**: Intelligent deduplication by ID
- **Corrupted files**: Validation with helpful error messages

### Performance Metrics

```bash
# Typical operation times:
Export localStorage: <1 second
Export database: 1-5 seconds (depends on data size)
Import to localStorage: <1 second
Import to database: 2-10 seconds (depends on data size)
Migration: 5-30 seconds (depends on data size)
```

## Best Practices

### 🎯 **Recommended Workflow**

1. **Use database storage** for all new work
2. **Export regularly** for backups (weekly/monthly)
3. **Migrate legacy data** from localStorage when convenient
4. **Keep localStorage** as emergency fallback
5. **Test imports** with small datasets first

### 🔒 **Data Safety**

- **Always export** before major operations
- **Verify imports** by checking statistics
- **Keep multiple backups** in different locations
- **Test recovery procedures** periodically

### ⚡ **Performance Optimization**

- **Use database storage** for better performance
- **Clean up localStorage** after successful migration
- **Monitor storage usage** to prevent quota issues
- **Compress images** before importing large datasets

## Troubleshooting

### Common Issues

#### Migration Fails

```bash
# Symptoms: Error during localStorage → database migration
# Causes: Network issues, data corruption, server problems
# Solutions:
1. Check server status: curl http://localhost:3001/health
2. Verify localStorage data: Check browser dev tools
3. Try smaller batches: Export/import individual reports
4. Check server logs for detailed errors
```

#### Import Errors

```bash
# Symptoms: "Invalid format" or "Failed to import"
# Causes: Corrupted JSON, wrong format, network issues
# Solutions:
1. Validate JSON format in online validator
2. Check file size (large files may timeout)
3. Try importing to localStorage first
4. Check browser console for detailed errors
```

#### Storage Quota Exceeded

```bash
# Symptoms: "Storage quota exceeded" errors
# Causes: localStorage near 5MB limit
# Solutions:
1. Export localStorage data immediately
2. Migrate to database storage
3. Clear localStorage after migration
4. Use database storage for new work
```

#### Server Connection Issues

```bash
# Symptoms: "API Connection Issue" notifications
# Causes: Server not running, network problems
# Solutions:
1. Start server: npm run server
2. Check port availability: lsof -i :3001
3. Verify API URL in settings
4. App automatically falls back to localStorage
```

### Getting Help

1. **Check server status**: `node server/start.js`
2. **View server logs**: Check terminal output
3. **Browser console**: F12 → Console tab
4. **Network tab**: Check API requests/responses
5. **Storage stats**: Use the dashboard statistics

## API Reference

### Statistics Endpoint

```bash
GET /api/stats
Response: {
  "reports": {
    "total": 5,
    "initial": 3,
    "reassessments": 2
  },
  "images": {
    "total": 15,
    "totalSize": 2048576
  },
  "database": {
    "path": "/path/to/assessment_maker.db",
    "size": 1048576
  }
}
```

### Migration Endpoints

```bash
# Import localStorage data
POST /api/migrate/import
Body: { "data": [...] }

# Export database data
GET /api/migrate/export
Response: File download (JSON)
```

### Bulk Operations

```bash
# Bulk create reports
POST /api/reports/bulk
Body: { "reports": [...] }
Response: {
  "successCount": 3,
  "errorCount": 1,
  "errors": [...]
}
```

## Conclusion

The new data management system provides a robust, scalable solution for handling assessment data. With automatic fallbacks, comprehensive import/export capabilities, and seamless migration tools, you can confidently manage your penetration testing data across different storage systems while maintaining data integrity and performance.
