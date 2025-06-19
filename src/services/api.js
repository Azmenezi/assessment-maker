const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001/api";

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Reports API
  async getAllReports() {
    return this.request("/reports");
  }

  async getAllReportsFull() {
    return this.request("/reports/full");
  }

  async getReport(id) {
    return this.request(`/reports/${id}`);
  }

  async createReport(reportData) {
    return this.request("/reports", {
      method: "POST",
      body: JSON.stringify(reportData),
    });
  }

  async bulkCreateReports(reports) {
    return this.request("/reports/bulk", {
      method: "POST",
      body: JSON.stringify({ reports }),
    });
  }

  async updateReport(id, reportData) {
    return this.request(`/reports/${id}`, {
      method: "PUT",
      body: JSON.stringify(reportData),
    });
  }

  async deleteReport(id) {
    return this.request(`/reports/${id}`, {
      method: "DELETE",
    });
  }

  async createReassessment(originalId, reassessmentData) {
    return this.request(`/reports/${originalId}/reassessment`, {
      method: "POST",
      body: JSON.stringify(reassessmentData),
    });
  }

  // Images API
  async uploadImage(findingId, imageFile) {
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("findingId", findingId);

    return this.request("/images/upload", {
      method: "POST",
      headers: {}, // Remove Content-Type to let browser set it for FormData
      body: formData,
    });
  }

  async deleteImage(imageId) {
    return this.request(`/images/${imageId}`, {
      method: "DELETE",
    });
  }

  getImageUrl(imageId) {
    return `${API_BASE_URL}/images/${imageId}`;
  }

  // Migration API
  async migrateLocalStorageData(localStorageData) {
    return this.request("/migrate/import", {
      method: "POST",
      body: JSON.stringify({ data: localStorageData }),
    });
  }

  async exportDatabaseData() {
    // This returns a file download, so we handle it differently
    const url = `${API_BASE_URL}/migrate/export`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    return response.blob();
  }

  // Statistics API
  async getStatistics() {
    return this.request("/stats");
  }

  // Findings Library API
  async getFindingsLibrary() {
    return this.request("/findings-library");
  }

  // Health check
  async healthCheck() {
    return this.request("/health", {
      baseUrl: API_BASE_URL.replace("/api", ""),
    });
  }
}

export default new ApiService();
