import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const isOnline = process.env.RENDER === 'true';
//database path
const defaultPath = path.join(__dirname, '../data/app.db');
const configPath = path.join(__dirname, '../data/config.json');

const config = loadConfig();
let dbPath = config.dbPath ?? defaultPath;
//let db: DatabaseType = openDb(dbPath);
const dbRef: { instance: DatabaseType } = { instance: openDb(dbPath) };
function loadConfig(): { dbPath?: string } {
    if (!fs.existsSync(configPath)) return {};
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}
function saveConfig(config: { dbPath: string }) {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

export function reconfigure(newPath: string): { message: string; dbPath: string } {
    if (!newPath.endsWith('.db')) throw new Error('Path must end with .db');
    dbRef.instance.close();
    dbRef.instance = openDb(newPath);
    dbPath = newPath;
    saveConfig({ dbPath: newPath });
    return { message: 'Path updated', dbPath: newPath };
}
export function resetToDefaultPath(): { message: string; dbPath: string } {
    dbRef.instance.close();
    dbPath = defaultPath;
    dbRef.instance = openDb(dbPath);
    if (fs.existsSync(configPath)) fs.unlinkSync(configPath);
    return { message: 'Restored to default path', dbPath: defaultPath };
}



function openDb(databasePath: string): DatabaseType {
    if (isOnline) return new Database(':memory:');
    if (!fs.existsSync(databasePath)) {
        fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    }
    return new Database(databasePath);
}

export function getHealth() {
    const dbExists = isOnline ? true : fs.existsSync(dbPath);
    const hasTables = dbExists && !isOnline
        ? (dbRef.instance.prepare("SELECT count(*) as c FROM sqlite_master WHERE type='table'").get() as { c: number }).c > 0
        : true;

    return {
        db: dbExists && hasTables,
        dbPath: isOnline || (dbPath === defaultPath ? 'default' : dbPath)
    };
}

export { isOnline };


export { dbRef as db };

//data base creaction
export function initDb(withTestData = false) {
    console.log(`Initializing database... isOnline: ${isOnline} 'dbPath:', ${dbPath}`);
    dbRef.instance.pragma('foreign_keys = ON');

    dbRef.instance.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );
  `);

    dbRef.instance.exec(`
    CREATE TABLE IF NOT EXISTS assembly_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT 1,
      product_id INTEGER, 
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);

    dbRef.instance.exec(`
    CREATE TABLE IF NOT EXISTS workstations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      pc_name TEXT NOT NULL
    );
  `);

    dbRef.instance.exec(`
  CREATE TABLE IF NOT EXISTS assembly_line_workstations (
    assembly_line_id INTEGER NOT NULL,
    workstation_id INTEGER NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (assembly_line_id, workstation_id),
    FOREIGN KEY (assembly_line_id) REFERENCES assembly_lines(id),
    FOREIGN KEY (workstation_id) REFERENCES workstations(id)
  );
  `);

    if (withTestData) seedTestData();
}
export function seedTestData() {
    const insertProduct = dbRef.instance.prepare('INSERT INTO products (name) VALUES (?)');
    const products = ['8DAB', '8DJH', 'Simosec', 'NXPlus C'].map(n => {
        const result = insertProduct.run(n);
        return result.lastInsertRowid;
    });

    const insertLine = dbRef.instance.prepare('INSERT INTO assembly_lines (name, active, product_id) VALUES (?, ?, ?)');
    const lines = [
        { name: 'Convey line', active: 1, product: products[0] },
        { name: 'Manual line', active: 1, product: products[1] },
        { name: 'Final assembly line', active: 1, product: products[2] },
        { name: 'Testing line', active: 0, product: products[3] },
        { name: 'Empty line', active: 0, product: null },
    ].map(l => {
        const result = insertLine.run(l.name, l.active, l.product);
        return result.lastInsertRowid;
    });

    const insertWs = dbRef.instance.prepare('INSERT INTO workstations (name, short_name, pc_name) VALUES (?, ?, ?)');
    const workstations = [
        { name: 'Laser welding', short_name: 'LW', pc_name: 'PC-LW-01' },
        { name: 'Manual welding', short_name: 'MW', pc_name: 'PC-MW-01' },
        { name: 'Drive assembly', short_name: 'DA', pc_name: 'PC-DA-01' },
        { name: 'Voltage drop test', short_name: 'VDT', pc_name: 'PC-VDT-01' },
        { name: 'Leakage test', short_name: 'LT', pc_name: 'PC-LT-01' },
        { name: 'HV/PD test', short_name: 'HV', pc_name: 'PC-HV-01' },
        { name: 'Final inspection', short_name: 'FI', pc_name: 'PC-FI-01' },
        { name: 'Frame assembly', short_name: 'FA', pc_name: 'PC-FA-01' },
        { name: 'Testing', short_name: 'TST', pc_name: 'PC-TST-01' },
        { name: 'Dispatch', short_name: 'DSP', pc_name: 'PC-DSP-01' },
    ].map(w => {
        const result = insertWs.run(w.name, w.short_name, w.pc_name);
        return result.lastInsertRowid;
    });

    // ws index: 0=LW,1=MW,2=DA,3=VDT,4=LT,5=HV,6=FI,7=FA,8=TST,9=DSP
    const assign = dbRef.instance.prepare('INSERT INTO assembly_line_workstations (assembly_line_id, workstation_id, order_index) VALUES (?, ?, ?)');
    const assignments = [
        [lines[0], workstations[7], 1], // Convey:         Frame assembly
        [lines[0], workstations[2], 2], // Convey:         Drive assembly
        [lines[1], workstations[1], 1], // Manual:         Manual welding
        [lines[1], workstations[0], 2], // Manual:         Laser welding
        [lines[1], workstations[7], 3], // Manual:         Frame assembly
        [lines[2], workstations[2], 1], // Final assembly: Drive assembly
        [lines[2], workstations[6], 2], // Final assembly: Final inspection
        [lines[2], workstations[9], 3], // Final assembly: Dispatch
        [lines[3], workstations[3], 1], // Testing:        Voltage drop test
        [lines[3], workstations[4], 2], // Testing:        Leakage test
        [lines[3], workstations[5], 3], // Testing:        HV/PD test
        [lines[3], workstations[8], 4], // Testing:        Testing
        [lines[3], workstations[6], 5], // Testing:        Final inspection
    ];
    assignments.forEach(([l, w, o]) => assign.run(l, w, o));
}
