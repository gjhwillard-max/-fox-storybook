from pathlib import Path
import base64, re
root=Path(__file__).parent
dist=root/'dist'
s=(dist/'index.html').read_text()
s=s.replace('<link rel="stylesheet" href="style.css">','<style>'+(dist/'style.css').read_text()+'</style>')
s=s.replace('<script src="app.js"></script>','<script>'+(dist/'app.js').read_text()+'</script>')
def embed(m):
 p=dist/m[2];mime='image/jpeg' if p.suffix=='.jpeg' else 'image/png'
 return m[1]+'="data:'+mime+';base64,'+base64.b64encode(p.read_bytes()).decode()+'"'
s=re.sub(r'(src|data-field)="(assets/[^\"]+)"',embed,s)
s=s.replace('href="proof.html"','href="dist/proof.html"')
(root/'standalone.html').write_text(s)
