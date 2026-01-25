// Exhibition Mode: Loading data from local files instead of a server
import projectState from './assets/project_state.json';

// Use Vite's glob import to get all patterns from the folder
const patternModules = import.meta.glob('./assets/PatternsJson/*.json', { eager: true });

/**
 * Save the entire flow to the server (Disabled for Exhibition)
 */
export const saveProjectToServer = async (flow) => {
  console.log('Exhibition Mode: Saving is disabled. State would be:', flow);
  return true;
};

/**
 * Load the entire flow from local assets
 */
export const loadProjectFromServer = async () => {
  console.log('Exhibition Mode: Loading project state from local assets');
  return projectState;
};

/**
 * Load all pattern templates from local assets
 */
export const loadTemplatesFromServer = async () => {
  console.log('Exhibition Mode: Loading templates from local assets');
  // Convert the glob modules object to an array of pattern objects
  return Object.values(patternModules).map(module => module.default || module);
};

/**
 * Save a new pattern template (Disabled for Exhibition)
 */
export const savePatternToServer = async (pattern) => {
  console.log('Exhibition Mode: Saving pattern is disabled. Pattern would be:', pattern);
  return true;
};

/**
 * Delete a pattern template (Disabled for Exhibition)
 */
export const deletePatternFromServer = async (label) => {
  console.log('Exhibition Mode: Deleting pattern is disabled. Label was:', label);
  return true;
};
