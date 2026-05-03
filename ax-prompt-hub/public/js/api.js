const API_BASE = location.port === "5500" ? "http://localhost:4173" : "";

window.PromptApi = {
  list(params) {
    return $.getJSON(`${API_BASE}/api/prompts`, params || {});
  },
  get(id) {
    return $.getJSON(`${API_BASE}/api/prompts/${id}`);
  },
  create(payload) {
    return $.ajax({
      url: `${API_BASE}/api/prompts`,
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify(payload)
    });
  },
  update(id, payload) {
    return $.ajax({
      url: `${API_BASE}/api/prompts/${id}`,
      method: "PUT",
      contentType: "application/json",
      data: JSON.stringify(payload)
    });
  },
  remove(id) {
    return $.ajax({
      url: `${API_BASE}/api/prompts/${id}`,
      method: "DELETE"
    });
  },
  toggleStar(id) {
    return $.post(`${API_BASE}/api/prompts/${id}/star`);
  },
  addComment(id, content) {
    return $.ajax({
      url: `${API_BASE}/api/prompts/${id}/comments`,
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({ content })
    });
  }
};
