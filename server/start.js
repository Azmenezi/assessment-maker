const { dbHelpers } = require("./database");
const path = require("path");
const fs = require("fs");

async function checkServerStatus() {
  console.log("🚀 Assessment Maker Server Status");
  console.log("================================");

  // Check database
  const dbPath = path.join(__dirname, "assessment_maker.db");
  const dbExists = fs.existsSync(dbPath);
  const dbSize = dbExists ? fs.statSync(dbPath).size : 0;

  console.log(`📊 Database: ${dbExists ? "✅ Connected" : "❌ Not found"}`);
  console.log(`📁 Database file: ${dbPath}`);
  console.log(`💾 Database size: ${(dbSize / 1024).toFixed(2)} KB`);

  if (dbExists) {
    try {
      const reports = await dbHelpers.getAllReports();
      console.log(`📋 Total reports: ${reports.length}`);

      if (reports.length > 0) {
        const initialReports = reports.filter(
          (r) => r.assessment_type === "Initial"
        ).length;
        const reassessments = reports.filter(
          (r) => r.assessment_type === "Reassessment"
        ).length;
        console.log(`   - Initial assessments: ${initialReports}`);
        console.log(`   - Reassessments: ${reassessments}`);

        // Show recent reports
        const recent = reports.slice(0, 3);
        console.log("📝 Recent reports:");
        recent.forEach((report, index) => {
          console.log(
            `   ${index + 1}. ${report.project_name} (v${report.version}) - ${
              report.assessment_type
            }`
          );
        });
      }
    } catch (error) {
      console.log(`❌ Database query error: ${error.message}`);
    }
  }

  console.log("");
  console.log("🌐 Server endpoints:");
  console.log("   - Health check: http://localhost:3001/health");
  console.log("   - API base: http://localhost:3001/api");
  console.log("   - Reports: http://localhost:3001/api/reports");
  console.log("");
  console.log("🔧 Management commands:");
  console.log("   - Export data: node migrate.js export");
  console.log("   - Import data: node migrate.js import <file.json>");
  console.log("");
  console.log("✅ Server is ready for connections!");
}

// Run if called directly
if (require.main === module) {
  checkServerStatus().catch(console.error);
}

module.exports = { checkServerStatus };
