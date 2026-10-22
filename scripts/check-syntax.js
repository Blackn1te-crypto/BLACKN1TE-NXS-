const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const skipped = new Set(['node_modules', '.git', 'session', 'sessions', 'temp', 'tmp']);
const files = [];
function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory() && skipped.has(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.isFile() && entry.name.endsWith('.js')) files.push(full);
    }
}
walk(root);
let failures = 0;
for (const file of files) {
    const result = spawnSync(process.execPath, ['--check', file], { cwd: root, encoding: 'utf8' });
    if (result.status !== 0) {
        failures++;
        console.error(`Syntax error: ${path.relative(root, file)}\n${result.stderr || result.stdout}`);
    }
}
if (failures) process.exitCode = 1;
else console.log(`JavaScript syntax: ${files.length} files passed.`);

const jsonFiles = ['bot.json', 'package.json'];
for (const file of jsonFiles) {
    try { JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')); }
    catch (error) { failures++; console.error(`Invalid JSON: ${file}: ${error.message}`); }
}

function resolveLocal(fromFile, specifier) {
    const base = path.resolve(path.dirname(fromFile), specifier);
    const candidates = [base, ...['.js', '.json', '.node', '.cjs', '.mjs'].map((ext) => base + ext), ...['index.js', 'index.json', 'index.node'].map((name) => path.join(base, name))];
    return candidates.some((candidate) => fs.existsSync(candidate));
}
const missing = [];
const localRequire = /require\(\s*(['"])(\.[^'"]+)\1\s*\)/g;
for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(localRequire)) {
        if (!resolveLocal(file, match[2])) missing.push(`${path.relative(root, file)} -> ${match[2]}`);
    }
}
if (missing.length) {
    failures++;
    console.error(`Missing local imports:\n${missing.join('\n')}`);
} else console.log('Local relative imports: resolved.');

const commandFiles = [];
function walkCommands(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walkCommands(full);
        else if (entry.isFile() && entry.name.endsWith('.js')) commandFiles.push(full);
    }
}
walkCommands(path.join(root, 'commands'));
const main = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
const imports = new Set([...main.matchAll(/require\(['"]\.\/commands\/([^'"]+)['"]\)/g)].map((match) => path.resolve(root, 'commands', match[1] + (match[1].endsWith('.js') ? '' : '.js'))));
const unrouted = commandFiles.filter((file) => !imports.has(file));
if (unrouted.length) {
    failures++;
    console.error(`Unrouted command modules:\n${unrouted.map((file) => path.relative(root, file)).join('\n')}`);
} else console.log(`Command routing: all ${commandFiles.length} command modules are imported by main.js.`);

if (failures) process.exitCode = 1;
