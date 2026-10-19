#!/usr/bin/env node
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const PROJECT_ID = '12359657743223843691';
const API_KEY = process.env.STITCH_API_KEY;

console.log('====================================================');
console.log(' Motofix -> Google Stitch Project Sync Engine');
console.log(` Target Project: projects/${PROJECT_ID}`);
console.log('====================================================\n');

if (!API_KEY) {
  console.error('❌ Error: STITCH_API_KEY is not defined in your environment.');
  console.log('\nTo get your API key:');
  console.log('1. Visit https://stitch.withgoogle.com');
  console.log('2. Click your Profile / Settings -> Generate API Key');
  console.log('3. Run the following command in PowerShell before syncing:');
  console.log('   $env:STITCH_API_KEY = "your_actual_api_key_here"');
  console.log('   node stitch_export/upload_to_stitch.mjs\n');
  process.exit(1);
}

const screens = [
  { file: 'splash_screen.html', title: '01 - Splash & Mechanical Odometer' },
  { file: 'garage_screen.html', title: '02 - Garage Vehicle Inventory' },
  { file: 'home_screen.html', title: '03 - Vehicle Telemetry Dashboard' },
  { file: 'workshop_screen.html', title: '04 - Workshop & Maintenance Directive' },
  { file: 'help_screen.html', title: '05 - Operating Manual & System Help' },
];

for (const screen of screens) {
  const filePath = path.join(process.cwd(), 'stitch_export', screen.file);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠ File not found: ${filePath}`);
    continue;
  }

  console.log(`🚀 Uploading [${screen.title}]...`);
  try {
    const cmd = `npx @_davideast/stitch-mcp upload -p ${PROJECT_ID} -f "${filePath}" --title "${screen.title}"`;
    execSync(cmd, { stdio: 'inherit', env: process.env });
    console.log(`✅ Success: ${screen.title}\n`);
  } catch (err) {
    console.error(`❌ Failed to upload ${screen.title}:`, err.message);
  }
}

console.log('\n🎉 Finished sync process!');
console.log(`Inspect your screens live at: https://stitch.withgoogle.com/projects/${PROJECT_ID}`);
