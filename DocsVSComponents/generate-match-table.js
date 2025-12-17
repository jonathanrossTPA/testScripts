const apps = require('../componentsList/applications.json');
const docs = require('./component.json').documents;

function norm(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/docs$/, '');
}

console.log('| Application Name | Document Title | Doc |');
console.log('|---|---|---|');
apps.forEach(a => {
  const match = docs.find(d => norm(d.title) === norm(a.name));
  if (match) {
    console.log(`| ${a.name} | ${match.title} | https://sonic.staging.jet-internal.com/components/${a.name}/docs |`);
  }
});
