import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {normalize,matchesTeacher,whatsappUrl} from './dist/assets/site.js';
const root=import.meta.dirname;
const data=JSON.parse(fs.readFileSync(path.join(root,'content.json'),'utf8'));
const pages=JSON.parse(fs.readFileSync(path.join(root,'pages.json'),'utf8'));
const home=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
const canonical=home.match(/rel="canonical" href="([^"]+)"/)[1];
const basePath=new URL(canonical).pathname.replace(/\/$/,'');
assert.equal(data.people.length,38);
assert.equal(new Set(data.people.map(p=>p.slug)).size,38);
assert.equal(new Set(data.people.map(p=>p.image.source)).size,38);
assert.equal(pages.length,50);
assert.equal(normalize('  Киселёва '),'киселева');
assert(matchesTeacher({search:'Киселёва Александра Администратор',categories:'administration'},'киселева','all'));
assert(!matchesTeacher({search:'Киселёва Александра Администратор',categories:'administration'},'киселева','science'));
assert(matchesTeacher({search:'Ященко информатика',categories:'administration science'},'ИНФОРМАТИКА','science'));
const message=new URL(whatsappUrl('  Анна & Иван  ','KG1',' Переезд & документы? '));
assert.equal(message.hostname,'wa.me');
assert.equal(message.pathname,'/971506136091');
assert.equal(message.searchParams.get('text'),'Здравствуйте! Меня зовут Анна & Иван. Интересует поступление: KG1.\nПереезд & документы?');
assert.equal(new URL(whatsappUrl('Анна','1 класс')).searchParams.get('text').endsWith('.'),true);
for(const p of pages){
  const file=path.join(root,'dist',p.route.slice(1),'index.html');
  const html=fs.readFileSync(file,'utf8');
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1,p.route+' requires one h1');
  assert(!/href="#"/.test(html),p.route+' contains empty link');
  assert(html.includes('lang="ru"'));
  for(const [,href] of html.matchAll(/(?:href|src)="(\/[^"#]*)/g)){
    const clean=href.split('#')[0];
    assert(clean.startsWith(basePath+'/') || clean===basePath,p.route+' link escapes site path: '+clean);
    assert(fs.existsSync(path.join(root,'dist',clean.slice(basePath.length))),p.route+' missing '+clean);
  }
}
const teacherHTML=fs.readFileSync(path.join(root,'dist/teachers/index.html'),'utf8');
assert.equal((teacherHTML.match(/data-teacher /g)||[]).length,38);
const searchable=Array.from(teacherHTML.matchAll(/data-search="([^"]+)" data-categories="([^"]+)"/g),([,search,categories])=>({search,categories}));
assert(searchable.some(p=>matchesTeacher(p,'информатика','science')));
assert(searchable.some(p=>matchesTeacher(p,'математика','science')));
assert(searchable.some(p=>matchesTeacher(p,'русский язык','languages')));
for(const person of data.people)assert(fs.existsSync(path.join(root,'dist',person.image.src)));
assert(home.includes(`data-photo="${basePath}/`) || !home.includes('data-photo='));
const galleryHTML=fs.readFileSync(path.join(root,'dist/school-life/index.html'),'utf8');
assert(galleryHTML.includes(`data-photo="${basePath}/assets/gallery-0.webp"`));
assert(!fs.readFileSync(path.join(root,'dist/assets/style.css'),'utf8').includes('url(\'/assets/'));
assert(!fs.readFileSync(path.join(root,'dist/assets/fonts.css'),'utf8').includes('url(/assets/'));
console.log('Passed: 50 pages, 38 unique portraits and profiles, internal links/assets, teacher search/filter, WhatsApp encoding, Russian metadata and headings.');
