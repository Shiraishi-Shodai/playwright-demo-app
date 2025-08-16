import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

const db = new Database('db/database.db');

// Ensure tables exist
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )
`);

// --- User and Password Setup ---
const username = 'admin';
const newPassword = 'SecurePass123!';

// Hash the new password
const saltRounds = 10;
const hash = bcrypt.hashSync(newPassword, saltRounds);

// Ensure the user exists (INSERT) and then set the new password (UPDATE)
const insertStmt = db.prepare('INSERT OR IGNORE INTO users (username) VALUES (?)');
insertStmt.run(username);

const updateStmt = db.prepare('UPDATE users SET password = ? WHERE username = ?');
updateStmt.run(hash, username);

console.log(`Database initialized. User "${username}" password has been set.`);

db.close();