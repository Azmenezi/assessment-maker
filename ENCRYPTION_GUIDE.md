# Database Encryption Guide

## 🔐 Overview

The Assessment Maker application now includes **comprehensive database encryption** to protect all sensitive data at rest. All sensitive information is encrypted using industry-standard AES-256-CBC encryption before being stored in the SQLite database.

## 🛡️ Security Features

### Encryption Algorithm

- **Algorithm**: AES-256-CBC (Advanced Encryption Standard)
- **Key Size**: 256 bits
- **Key Derivation**: PBKDF2 with 10,000 iterations
- **Salt Size**: 256 bits (unique per encryption)
- **IV Size**: 128 bits (unique per encryption)
- **Padding**: PKCS7

### Security Benefits

- **Data at Rest Protection**: All sensitive data is encrypted in the database
- **Key Management**: Secure key generation and storage
- **Salt & IV**: Unique salt and initialization vector for each encryption operation
- **Forward Secrecy**: Each piece of data has its own encryption parameters
- **Transparent Operation**: Encryption/decryption happens automatically

## 📊 Encrypted Data Types

### Reports Table

The following fields are encrypted in the reports table:

- `project_name` - Project/client names
- `assessor_name` - Assessor personal information
- `platform` - Target platform details
- `urls` - Target URLs and endpoints
- `credentials` - Authentication credentials
- `ticket_number` - Internal ticket/tracking numbers
- `build_versions` - Version information
- `requested_by` - Requesting party information
- `executive_summary` - Executive summary content
- `scope` - Assessment scope details
- `methodology` - Testing methodology
- `conclusion` - Assessment conclusions
- `parent_assessment_data` - Historical assessment data

### Findings Table

The following fields are encrypted in the findings table:

- `title` - Finding titles
- `description` - Detailed finding descriptions
- `impact` - Impact assessments
- `mitigation` - Mitigation recommendations
- `affected_endpoints` - Affected system endpoints

### Images Table

The following fields are encrypted in the images table:

- `filename` - Generated filenames
- `original_name` - Original uploaded filenames
- `image_data` - Complete image BLOB data (binary encryption)

### Non-Encrypted Fields

These fields remain unencrypted for performance and functionality:

- Primary keys and foreign keys
- Timestamps (created_at, updated_at)
- Enumerated values (severity, category, status)
- Version numbers
- Assessment types
- MIME types and file sizes

## 🔧 Technical Implementation

### Encryption Process

1. **Key Derivation**: Master key + unique salt → derived key (PBKDF2)
2. **IV Generation**: Random 128-bit initialization vector
3. **Encryption**: AES-256-CBC with PKCS7 padding
4. **Storage Format**: `ENC:base64(salt:iv:encrypted_data)`

### Decryption Process

1. **Format Validation**: Check for `ENC:` prefix
2. **Data Parsing**: Extract salt, IV, and encrypted data
3. **Key Derivation**: Recreate derived key using salt
4. **Decryption**: AES-256-CBC decryption with same parameters

### Image Encryption

Images receive special handling:

- Binary data converted to base64 for encryption
- Encrypted as text using same AES-256-CBC process
- Stored as encrypted BLOB in database
- Automatically decrypted when retrieved

## 🚀 Getting Started

### Automatic Setup

The encryption system initializes automatically when the server starts:

```bash
npm run server
```

### Key Generation

On first run, the system will:

1. Generate a secure 256-bit master key
2. Save it to `server/.encryption_key` (restricted permissions)
3. Display confirmation message: "🔐 New encryption key generated and saved"

### Existing Installations

For existing databases:

1. New data will be encrypted automatically
2. Existing unencrypted data remains readable
3. Data is encrypted when updated/modified
4. Use migration tools to encrypt existing data in bulk

## 📋 Monitoring & Status

### Encryption Status Endpoint

Check encryption status via API:

```bash
curl http://localhost:3001/api/encryption/status
```

Response includes:

- Encryption status (enabled/disabled)
- Algorithm details
- Test results
- List of encrypted fields
- Configuration parameters

### Server Logs

Monitor encryption activity in server logs:

- Key loading confirmation
- Encryption test results
- Error messages (if any)

## 🔑 Key Management

### Key Location

- **File**: `server/.encryption_key`
- **Permissions**: 600 (owner read/write only)
- **Format**: Hexadecimal string

### Key Security

- **Generation**: Cryptographically secure random generation
- **Storage**: File system with restricted permissions
- **Access**: Only server process can read
- **Backup**: Include in secure backup procedures

### Key Rotation (Advanced)

For key rotation:

1. Stop the server
2. Backup the database
3. Export all data (decrypted)
4. Delete the old key file
5. Start server (generates new key)
6. Re-import data (encrypted with new key)

## 🛠️ Migration & Compatibility

### Data Migration

Existing data can be migrated to encrypted format:

```bash
# Export existing data
node server/migrate.js export

# Data will be automatically encrypted on import
node server/migrate.js import backup.json
```

### Backward Compatibility

- Unencrypted data is automatically detected
- Mixed encrypted/unencrypted data is supported
- Gradual migration possible without downtime

## 🔍 Verification

### Database Inspection

Verify encryption in raw database:

```bash
sqlite3 server/assessment_maker.db "SELECT project_name FROM reports LIMIT 1;"
```

Should show encrypted format: `ENC:base64data...`

### API Testing

Verify decryption via API:

```bash
curl http://localhost:3001/api/reports | jq '.[0].projectName'
```

Should show decrypted, readable data.

## ⚠️ Important Security Notes

### Do Not Lose the Key

- **Critical**: The encryption key is required to decrypt data
- **Backup**: Include the key file in secure backups
- **Recovery**: Lost keys = permanently inaccessible data

### Production Deployment

- Ensure key file has proper permissions (600)
- Include key in secure backup procedures
- Consider key management systems for enterprise use
- Monitor encryption status endpoint

### Performance Considerations

- Encryption adds minimal overhead (~5-10ms per operation)
- Database size may increase slightly due to encryption metadata
- Query performance unaffected (encrypted fields not indexed)

## 🆘 Troubleshooting

### Common Issues

**Server won't start - encryption error**

- Check if crypto-js is installed: `npm install crypto-js`
- Verify key file permissions
- Check server logs for specific error

**Data appears corrupted**

- Verify encryption key hasn't changed
- Check for filesystem issues
- Use encryption status endpoint to test

**Performance issues**

- Monitor server resources
- Consider database optimization
- Check for excessive encryption/decryption operations

### Support Commands

```bash
# Check encryption status
curl http://localhost:3001/api/encryption/status

# Test server health
curl http://localhost:3001/health

# View server logs
npm run server

# Database backup
node server/migrate.js export
```

## 📈 Benefits

### Security

- **Compliance**: Meets data protection requirements
- **Risk Reduction**: Minimizes data breach impact
- **Industry Standard**: Uses proven encryption methods

### Operational

- **Transparent**: No changes to user interface
- **Automatic**: Encryption/decryption is seamless
- **Scalable**: Handles large datasets efficiently

### Future-Proof

- **Upgradeable**: Can migrate to stronger algorithms
- **Flexible**: Supports additional encrypted fields
- **Maintainable**: Clear separation of concerns

---

## 🔐 Encryption is Now Active

Your Assessment Maker database is now fully encrypted and secure. All sensitive data is protected at rest while maintaining full functionality and performance.

For questions or issues, refer to the troubleshooting section or check the server logs for detailed information.
