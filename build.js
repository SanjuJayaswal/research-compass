/* build.js — re-inline the split source into ONE self-contained file.
   Run from the project root:  node build.js
   Output: dist/research-compass.html  (publishable / shareable as a single file). */
const fs=require('fs'), path=require('path');
const ROOT=__dirname;
let html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const css=fs.readFileSync(path.join(ROOT,'styles.css'),'utf8');

// inline CSS
html=html.replace('<link rel="stylesheet" href="styles.css">', ()=>'<style>\n'+css+'\n</style>');

// gather js files in their declared load order, then inline as one <script>
const order=[...html.matchAll(/<script src="js\/([^"]+)"><\/script>/g)].map(m=>m[1]);
const js=order.map(f=>'/* ---- '+f+' ---- */\n'+fs.readFileSync(path.join(ROOT,'js',f),'utf8')).join('\n\n');
html=html.replace(/(?:\s*<script src="js\/[^"]+"><\/script>)+/, ()=>'\n<script>\n'+js+'\n</script>');

fs.mkdirSync(path.join(ROOT,'dist'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'dist','research-compass.html'), html);
console.log('Built dist/research-compass.html ('+html.length+' bytes) from '+order.length+' modules.');
