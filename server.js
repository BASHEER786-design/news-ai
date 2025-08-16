const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname)));

// SQLite database
const db = new sqlite3.Database(path.join(__dirname, 'user.db'), (err) => {
    if (err) console.error('DB connection error:', err.message);
    else console.log('Connected to SQLite database.');
});

// Create users table
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
)`, (err) => {
    if (err) console.error('Table creation error:', err.message);
    else console.log('Users table ready.');
});

// Registration endpoint
app.post('/register', (req, res) => {
    const username = req.body.username.trim();
    const password = req.body.password.trim();
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });

    const stmt = db.prepare("INSERT INTO users(username, password) VALUES(?, ?)");
    stmt.run(username, password, function(err){
        if(err) return res.status(500).json({ error: "Username already exists" });
        res.json({ success: true, message: "User registered" });
    });
    stmt.finalize();
});

// Login endpoint
app.post('/login', (req, res) => {
    const username = req.body.username.trim();
    const password = req.body.password.trim();
    db.get("SELECT * FROM users WHERE username=? AND password=?", [username, password], (err, row) => {
        if(err) return res.status(500).json({ error: err.message });
        if(row) res.json({ success: true, message: "Login successful" });
        else res.status(401).json({ success: false, message: "Invalid credentials" });
    });
});

// NewsAPI endpoint
const NEWS_API_KEY = "a300f7d6094646569fa40a3c999f0131"; // <-- put your key here
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

app.get('/news', async (req, res) => {
    try {
        const response = await fetch(
            `https://newsapi.org/v2/top-headlines?country=in&q=India OR Andhra Pradesh&pageSize=15&apiKey=${NEWS_API_KEY}`
        );
        const data = await response.json();
        res.json(data.articles);
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch news" });
    }
});

// Serve HTML pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/register.html', (req, res) => res.sendFile(path.join(__dirname, 'register.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/article.html', (req, res) => res.sendFile(path.join(__dirname, 'article.html')));

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

