const STORAGE_KEY = 'react-flow-project';
const TEMPLATES_KEY = 'custom-node-templates';

export const saveProject = (flow) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flow));
};

export const loadProject = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
};

export const clearProject = () => {
    localStorage.removeItem(STORAGE_KEY);
};

export const saveTemplates = (templates) => {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
};

export const loadTemplates = () => {
    const saved = localStorage.getItem(TEMPLATES_KEY);
    return saved ? JSON.parse(saved) : [];
};

/* 
  FUTURE SUPABASE INTEGRATION EXAMPLE:
  
  export const saveProjectToDB = async (userId, flow) => {
    const { data, error } = await supabase
      .from('projects')
      .upsert({ user_id: userId, data: flow });
    return { data, error };
  };
*/
