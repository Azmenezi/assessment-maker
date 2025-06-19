const CryptoJS = require("crypto-js");
const fs = require("fs");
const path = require("path");

class EncryptionService {
  constructor() {
    this.algorithm = "AES";
    this.keySize = 256;
    this.ivSize = 128;
    this.saltSize = 256;
    this.tagLength = 128;
    this.iterations = 10000;

    // Initialize encryption key
    this.initializeKey();
  }

  /**
   * Initialize or load the encryption key
   */
  initializeKey() {
    const keyPath = path.join(__dirname, ".encryption_key");

    try {
      if (fs.existsSync(keyPath)) {
        // Load existing key
        const keyData = fs.readFileSync(keyPath, "utf8");
        this.masterKey = keyData;
        console.log("🔐 Encryption key loaded successfully");
      } else {
        // Generate new key
        this.masterKey = CryptoJS.lib.WordArray.random(256 / 8).toString();
        fs.writeFileSync(keyPath, this.masterKey, { mode: 0o600 }); // Restrict file permissions
        console.log("🔐 New encryption key generated and saved");
      }
    } catch (error) {
      console.error("❌ Error initializing encryption key:", error);
      throw new Error("Failed to initialize encryption system");
    }
  }

  /**
   * Encrypt sensitive data
   * @param {string} plaintext - Data to encrypt
   * @returns {string} - Encrypted data with metadata
   */
  encrypt(plaintext) {
    try {
      if (!plaintext || typeof plaintext !== "string") {
        return plaintext; // Return as-is if not a string or empty
      }

      // Generate random salt and IV
      const salt = CryptoJS.lib.WordArray.random(this.saltSize / 8);
      const iv = CryptoJS.lib.WordArray.random(this.ivSize / 8);

      // Derive key from master key and salt
      const key = CryptoJS.PBKDF2(this.masterKey, salt, {
        keySize: this.keySize / 32,
        iterations: this.iterations,
      });

      // Encrypt the data using default settings (CBC mode is default)
      const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
        iv: iv,
      });

      // Combine salt, iv, and encrypted data
      const combined =
        salt.toString() + ":" + iv.toString() + ":" + encrypted.toString();

      return (
        "ENC:" +
        CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(combined))
      );
    } catch (error) {
      console.error("❌ Encryption error:", error);
      throw new Error("Failed to encrypt data");
    }
  }

  /**
   * Decrypt sensitive data
   * @param {string} encryptedData - Encrypted data to decrypt
   * @returns {string} - Decrypted plaintext
   */
  decrypt(encryptedData) {
    try {
      if (!encryptedData || typeof encryptedData !== "string") {
        return encryptedData; // Return as-is if not a string or empty
      }

      // Check if data is encrypted
      if (!encryptedData.startsWith("ENC:")) {
        return encryptedData; // Return as-is if not encrypted
      }

      // Remove prefix and decode
      const combined = CryptoJS.enc.Utf8.stringify(
        CryptoJS.enc.Base64.parse(encryptedData.substring(4))
      );

      const parts = combined.split(":");
      if (parts.length !== 3) {
        throw new Error("Invalid encrypted data format");
      }

      const salt = CryptoJS.enc.Hex.parse(parts[0]);
      const iv = CryptoJS.enc.Hex.parse(parts[1]);
      const encrypted = parts[2];

      // Derive the same key
      const key = CryptoJS.PBKDF2(this.masterKey, salt, {
        keySize: this.keySize / 32,
        iterations: this.iterations,
      });

      // Decrypt the data using default settings
      const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
        iv: iv,
      });

      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error("❌ Decryption error:", error);
      throw new Error("Failed to decrypt data");
    }
  }

  /**
   * Encrypt an object by encrypting sensitive fields
   * @param {object} obj - Object to encrypt
   * @param {array} sensitiveFields - Fields to encrypt
   * @returns {object} - Object with encrypted sensitive fields
   */
  encryptObject(obj, sensitiveFields = []) {
    if (!obj || typeof obj !== "object") {
      return obj;
    }

    const encrypted = { ...obj };

    sensitiveFields.forEach((field) => {
      if (encrypted[field]) {
        encrypted[field] = this.encrypt(encrypted[field]);
      }
    });

    return encrypted;
  }

  /**
   * Decrypt an object by decrypting sensitive fields
   * @param {object} obj - Object to decrypt
   * @param {array} sensitiveFields - Fields to decrypt
   * @returns {object} - Object with decrypted sensitive fields
   */
  decryptObject(obj, sensitiveFields = []) {
    if (!obj || typeof obj !== "object") {
      return obj;
    }

    const decrypted = { ...obj };

    sensitiveFields.forEach((field) => {
      if (decrypted[field]) {
        decrypted[field] = this.decrypt(decrypted[field]);
      }
    });

    return decrypted;
  }

  /**
   * Get list of sensitive fields for different data types
   */
  getSensitiveFields() {
    return {
      reports: [
        "project_name",
        "assessor_name",
        "platform",
        "urls",
        "credentials",
        "ticket_number",
        "build_versions",
        "requested_by",
        "executive_summary",
        "scope",
        "methodology",
        "conclusion",
        "parent_assessment_data",
      ],
      findings: [
        "title",
        "description",
        "impact",
        "mitigation",
        "affected_endpoints",
      ],
      images: ["filename", "original_name"],
    };
  }

  /**
   * Encrypt image data (BLOB)
   * @param {Buffer} imageBuffer - Image buffer to encrypt
   * @returns {Buffer} - Encrypted image buffer
   */
  encryptImage(imageBuffer) {
    try {
      if (!Buffer.isBuffer(imageBuffer)) {
        return imageBuffer;
      }

      // Convert buffer to base64 for encryption
      const base64Data = imageBuffer.toString("base64");
      const encrypted = this.encrypt(base64Data);

      // Convert back to buffer
      return Buffer.from(encrypted, "utf8");
    } catch (error) {
      console.error("❌ Image encryption error:", error);
      throw new Error("Failed to encrypt image");
    }
  }

  /**
   * Decrypt image data (BLOB)
   * @param {Buffer} encryptedBuffer - Encrypted image buffer
   * @returns {Buffer} - Decrypted image buffer
   */
  decryptImage(encryptedBuffer) {
    try {
      if (!Buffer.isBuffer(encryptedBuffer)) {
        return encryptedBuffer;
      }

      // Convert buffer to string
      const encryptedString = encryptedBuffer.toString("utf8");

      // Check if it's encrypted
      if (!encryptedString.startsWith("ENC:")) {
        return encryptedBuffer; // Return as-is if not encrypted
      }

      // Decrypt and convert back to buffer
      const decryptedBase64 = this.decrypt(encryptedString);
      return Buffer.from(decryptedBase64, "base64");
    } catch (error) {
      console.error("❌ Image decryption error:", error);
      throw new Error("Failed to decrypt image");
    }
  }

  /**
   * Test encryption/decryption functionality
   */
  test() {
    console.log("🧪 Testing encryption system...");

    const testData = "This is sensitive test data 🔒";
    const encrypted = this.encrypt(testData);
    const decrypted = this.decrypt(encrypted);

    console.log("Original:", testData);
    console.log("Encrypted:", encrypted.substring(0, 50) + "...");
    console.log("Decrypted:", decrypted);
    console.log("Test passed:", testData === decrypted ? "✅" : "❌");

    return testData === decrypted;
  }
}

// Create singleton instance
const encryptionService = new EncryptionService();

module.exports = encryptionService;
