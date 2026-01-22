// Use current hostname (e.g. localhost or 127.0.0.1) but fixed port 3001
const HOST = window.location.hostname || '127.0.0.1';
const SERVER_URL = `http://${HOST}:3001/api`;

/**
 * Save the entire flow to the server (project_state.json)
 */
export const saveProjectToServer = async (flow) => {
  try {
    const response = await fetch(`${SERVER_URL}/save-project`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flow)
    });
    if (!response.ok) {
      console.error('Server returned error:', response.status);
    }
    return response.ok;
  } catch (e) {
    console.error('Failed to save project to server:', e);
    // alert('Network Error: Could not reach the backend server.');
    return false;
  }
};

/**
 * Load the entire flow from the server
 */
export const loadProjectFromServer = async () => {
  try {
    const response = await fetch(`${SERVER_URL}/load-project`);
    if (!response.ok) return null;
    return await response.json();
  } catch (e) {
    console.error('Failed to load project from server:', e);
    return null;
  }
};

/**
 * Load all pattern templates from the server
 */
export const loadTemplatesFromServer = async () => {
  try {
    const response = await fetch(`${SERVER_URL}/load-templates`);
    if (!response.ok) return [];
    return await response.json();
  } catch (e) {
    console.error('Failed to load templates from server:', e);
    return [];
  }
};
