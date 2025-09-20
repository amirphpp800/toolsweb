// Setup Verification Script
// This script checks if all components are properly configured

console.log('🔍 Verifying GlassBlack project setup...\n');

// Check if required files exist
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'index.html',
  'admin.html',
  'wrangler.toml',
  '.env',
  'functions/_utils.js',
  'functions/api/auth/register.js',
  'functions/api/auth/login.js',
  'functions/api/auth/logout.js',
  'functions/api/auth/me.js',
  'functions/api/auth/captcha.js',
  'functions/api/admin/login.js',
  'functions/api/admin/logout.js',
  'functions/api/admin/status.js',
  'functions/api/admin/users.js'
];

console.log('📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Check wrangler.toml configuration
console.log('\n⚙️  Checking wrangler.toml configuration...');
try {
  const wranglerConfig = fs.readFileSync('wrangler.toml', 'utf8');
  
  if (wranglerConfig.includes('binding = "USERS_KV"')) {
    console.log('✅ KV namespace binding configured');
  } else {
    console.log('❌ KV namespace binding missing');
    allFilesExist = false;
  }
  
  if (wranglerConfig.includes('name = "tools"')) {
    console.log('✅ Project name set to "tools"');
  } else {
    console.log('⚠️  Project name not set to "tools"');
  }
} catch (error) {
  console.log('❌ Error reading wrangler.toml:', error.message);
  allFilesExist = false;
}

// Check .env file
console.log('\n🔐 Checking environment configuration...');
try {
  const envConfig = fs.readFileSync('.env', 'utf8');
  
  if (envConfig.includes('USERS_KV_ID=')) {
    console.log('✅ KV namespace ID configured');
  } else {
    console.log('❌ KV namespace ID missing');
  }
  
  if (envConfig.includes('ADMIN_USERNAME=')) {
    console.log('✅ Admin username configured');
  } else {
    console.log('❌ Admin username missing');
  }
} catch (error) {
  console.log('❌ Error reading .env:', error.message);
}

// Summary
console.log('\n📋 Setup Summary:');
if (allFilesExist) {
  console.log('✅ All required files are present');
  console.log('🚀 Your project is ready for deployment!');
  console.log('\nNext steps:');
  console.log('1. Run: npm run setup (to deploy)');
  console.log('2. Or run: npm run dev (for local development)');
} else {
  console.log('❌ Some files are missing. Please check the errors above.');
}

console.log('\n🔗 Cloudflare Pages Configuration Checklist:');
console.log('□ KV namespace "USERS_KV" bound to "main"');
console.log('□ Environment variables set:');
console.log('  □ JWT_SECRET (secret)');
console.log('  □ ADMIN_USERNAME (plaintext: amir0012A_amir0012A#)');
console.log('  □ ADMIN_PASSWORD (secret)');
console.log('□ Functions directory set to "functions/"');
console.log('□ Build command left empty');
console.log('□ Output directory set to "." (root)');
