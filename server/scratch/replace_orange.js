const fs = require('fs');
const path = require('path');

const loginFormPath = path.join(__dirname, '../../client/src/components/auth/login-form.tsx');
let loginContent = fs.readFileSync(loginFormPath, 'utf8');

// Replace orange colors with purple equivalents in login-form.tsx
loginContent = loginContent.replace(/from-orange-500/g, 'from-purple-600');
loginContent = loginContent.replace(/via-orange-500/g, 'via-purple-600');
loginContent = loginContent.replace(/hover:from-orange-600/g, 'hover:from-purple-700');
loginContent = loginContent.replace(/from-orange-600/g, 'from-purple-700');
loginContent = loginContent.replace(/bg-orange-500/g, 'bg-purple-600');

fs.writeFileSync(loginFormPath, loginContent, 'utf8');
console.log('Successfully replaced orange with purple in login-form.tsx');
