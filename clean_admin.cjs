const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'client/src/pages/Admin.jsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Fix missing rounded corners on inputs
content = content.replace(/className="w-full bg-white\/\[0\.03\] py-5 pl-16 pr-6([^"]*)"/g, (match, classes) => {
    if (!classes.includes('rounded-')) {
        return `className="w-full bg-white/[0.03] py-5 pl-16 pr-6 rounded-2xl${classes}"`;
    }
    return match;
});

// Also fix other plain inputs in Admin
content = content.replace(/className="w-full bg-white\/5 py-4 px-6([^"]*)"/g, (match, classes) => {
    if (!classes.includes('rounded-')) {
        return `className="w-full bg-white/5 py-4 px-6 rounded-2xl${classes}"`;
    }
    return match;
});

// 2. Fix duplicate backdrop-blur and rounded-xl
content = content.replace(/hover:bg-white\/10 backdrop-blur-md rounded-xl/g, 'hover:bg-white/10 shadow-xl');

// 3. Change stark white buttons to primary (except maybe Cancel buttons)
// We'll target w-full bg-white text-black
content = content.replace(/w-full bg-white text-black font-bold py-4 hover:bg-white\/90/g, 'w-full bg-primary text-background font-bold py-4 hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-full');

// Also fix standard white buttons in modals
content = content.replace(/bg-white text-black text-micro/g, 'bg-primary text-background text-micro font-bold shadow-lg shadow-primary/20 rounded-full');

// Some flex-1 buttons
content = content.replace(/flex-1 py-4 bg-white text-black/g, 'flex-1 py-4 bg-primary text-background rounded-full shadow-lg shadow-primary/20');

// Write back
fs.writeFileSync(targetFile, content);
console.log('Cleaned up Admin.jsx brutalism');
