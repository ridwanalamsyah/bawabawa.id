// Verify JS syntax is now correct
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../web/public/erp.html'), 'utf8');

// Find the inline script (the last one)
const scriptStart = html.indexOf("<script>\n'use strict'");
const scriptEnd = html.lastIndexOf('</script>');

const js = html.substring(scriptStart + 8, scriptEnd);
console.log('Script length:', js.length, 'chars');

try {
  new Function(js);
  console.log('✅ JS SYNTAX IS VALID - Login should work now!');
} catch (e) {
  console.log('❌ JS SYNTAX ERROR:', e.message);
}
