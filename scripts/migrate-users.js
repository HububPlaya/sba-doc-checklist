const Database = require("better-sqlite3");
const db = new Database("data.db");

const TEAM_LEAD_NAME = "Keelan Moore";

db.exec(
  "CREATE TABLE IF NOT EXISTS users (name TEXT PRIMARY KEY, role TEXT NOT NULL DEFAULT 'processor')"
);

db.exec(
  "INSERT OR IGNORE INTO users (name, role) " +
    "SELECT DISTINCT assigned_processor, 'processor' FROM applications " +
    "WHERE assigned_processor IS NOT NULL"
);

db.prepare("INSERT OR IGNORE INTO users (name, role) VALUES (?, 'processor')").run(TEAM_LEAD_NAME);

const result = db
  .prepare("UPDATE users SET role = 'team_lead' WHERE name = ?")
  .run(TEAM_LEAD_NAME);

if (result.changes === 0) {
  console.log("WARNING: no user found matching '" + TEAM_LEAD_NAME + "'");
} else {
  console.log("Promoted '" + TEAM_LEAD_NAME + "' to team_lead");
}

const allUsers = db.prepare("SELECT * FROM users ORDER BY name").all();
console.log("Users table now has " + allUsers.length + " entries:");
console.log(allUsers);
