import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Paths
const PATTERNS_DIR = path.join(__dirname, '..', 'src', 'assets', 'PatternsJson');
const PROJECT_FILE = path.join(__dirname, '..', 'src', 'assets', 'project_state.json');

console.log('Patterns Directory:', PATTERNS_DIR);
console.log('Project File Path:', PROJECT_FILE);

// Ensure directories and files exist
if (!fs.existsSync(PATTERNS_DIR)) {
    fs.mkdirSync(PATTERNS_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Request Logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// --- Pattern Endpoints ---

app.post('/api/save-pattern', (req, res) => {
    const pattern = req.body;
    if (!pattern.label) return res.status(400).json({ error: 'Label required' });

    const filename = pattern.label.toLowerCase().replace(/[^a-z0-9]/g, '_') + '.json';
    const filePath = path.join(PATTERNS_DIR, filename);

    fs.writeFile(filePath, JSON.stringify(pattern, null, 4), (err) => {
        if (err) return res.status(500).json({ error: 'Failed' });
        res.json({ success: true });
    });
});

app.post('/api/delete-pattern', (req, res) => {
    const { label } = req.body;
    if (!label) return res.status(400).json({ error: 'Label required' });

    const filename = label.toLowerCase().replace(/[^a-z0-9]/g, '_') + '.json';
    const filePath = path.join(PATTERNS_DIR, filename);

    if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
            if (err) return res.status(500).json({ error: 'Failed to delete' });
            res.json({ success: true });
        });
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

app.get('/api/load-templates', (req, res) => {
    console.log('Loading pattern templates...');
    fs.readdir(PATTERNS_DIR, (err, files) => {
        if (err) {
            console.error('Read dir error:', err);
            return res.status(500).json({ error: 'Failed to read directory' });
        }

        const jsonFiles = files.filter(f => f.endsWith('.json'));
        const templates = [];

        jsonFiles.forEach(file => {
            try {
                const content = fs.readFileSync(path.join(PATTERNS_DIR, file), 'utf8');
                templates.push(JSON.parse(content));
            } catch (e) {
                console.error(`Error reading template ${file}:`, e);
            }
        });

        console.log(`Loaded ${templates.length} templates.`);
        res.json(templates);
    });
});

// --- Project State Endpoints ---

app.get('/api/load-project', (req, res) => {
    console.log('Loading project state...');
    if (!fs.existsSync(PROJECT_FILE)) {
        console.log('Project file not found, returning empty.');
        return res.json({ nodes: [], edges: [] });
    }
    fs.readFile(PROJECT_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error('Read error:', err);
            return res.status(500).json({ error: 'Read error' });
        }
        res.json(JSON.parse(data));
    });
});

app.post('/api/save-project', (req, res) => {
    console.log('Saving project state...');
    const projectData = req.body;
    fs.writeFile(PROJECT_FILE, JSON.stringify(projectData, null, 4), (err) => {
        if (err) {
            console.error('Save error:', err);
            return res.status(500).json({ error: 'Save error' });
        }
        console.log('Project state saved successfully.');
        res.json({ success: true });
    });
});

app.listen(PORT, () => {
    console.log(`Pattern Server running at http://localhost:${PORT}`);
});
