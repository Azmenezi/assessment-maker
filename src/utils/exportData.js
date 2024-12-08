export function exportAllData() {
  // Gather all data from localStorage keys we used:
  const reports = localStorage.getItem("pentest_reports") || "[]";
  const templates = localStorage.getItem("pentest_templates") || "{}";
  const settings = localStorage.getItem("pentest_settings") || "";
  const library = localStorage.getItem("pentest_findings_library") || "[]";

  const data = {
    reports: JSON.parse(reports),
    templates: JSON.parse(templates),
    settings: settings,
    findingsLibrary: JSON.parse(library),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pentest_backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

export function importAllData(jsonData) {
  // jsonData is already parsed JSON
  localStorage.setItem(
    "pentest_reports",
    JSON.stringify(jsonData.reports || [])
  );
  localStorage.setItem(
    "pentest_templates",
    JSON.stringify(jsonData.templates || {})
  );
  localStorage.setItem("pentest_settings", jsonData.settings || "");
  localStorage.setItem(
    "pentest_findings_library",
    JSON.stringify(jsonData.findingsLibrary || [])
  );
  // Optionally, refresh the page or update stores
  window.location.reload();
}
