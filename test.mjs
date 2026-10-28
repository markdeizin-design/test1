import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {normalize,matchesTeacher,whatsappUrl,scrollProgress,scrollMotion} from './dist/assets/site.js';
const root=import.meta.dirname;
const data=JSON.parse(fs.readFileSync(path.join(root,'content.json'),'utf8'));
const pages=JSON.parse(fs.readFileSync(path.join(root,'pages.json'),'utf8'));
const home=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
const styleVersion=createHash('sha256').update(fs.readFileSync(path.join(root,'dist/assets/style.css'))).digest('hex').slice(0,12);
const scriptVersion=createHash('sha256').update(fs.readFileSync(path.join(root,'dist/assets/site.js'))).digest('hex').slice(0,12);
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
assert.equal(scrollProgress(-100,300),0);
assert.equal(scrollProgress(150,300),.5);
assert.equal(scrollProgress(900,300),1);
assert.equal(scrollProgress(0,0),0);
assert.equal(scrollMotion(0,400,1200,500,800).opacity,1);
assert.equal(scrollMotion(200,400,1200,500,800).opacity,.5);
assert.equal(scrollMotion(600,400,1200,500,800).opacity,0);
assert.equal(scrollMotion(0,400,1200,500,800).flagOffset,-20);
assert.equal(scrollMotion(1050,400,1200,500,800).flagOffset,0);
assert.equal(scrollMotion(1800,400,1200,500,800).flagOffset,20);
assert.equal((home.match(/data-flag /g)||[]).length,11);
assert(home.includes('data-brand-fade'));
assert(home.includes('в нашей школе учатся дети самых разных национальностей'));
assert(!home.includes('opacity:0'));
assert(home.includes('class="community-flags" aria-hidden="true"'));
for(const code of ['ru','by','kz','uz','kg','tj','az','am','tm','ua','lt'])assert(fs.existsSync(path.join(root,'dist/assets/flags',code+'.svg')));

// Reduced motion must leave the brand visible and never start a scroll animation loop.
const style=()=>({setProperty(){},removeProperty(){}});
const brand={style:style(),offsetHeight:250,parentElement:{getBoundingClientRect:()=>({top:100})}};
const community={offsetHeight:500,getBoundingClientRect:()=>({top:1200})};
const motionListeners=[];
const preference={matches:true,addEventListener(event,listener){motionListeners.push(listener);},listener(){motionListeners.forEach(listener=>listener());}};
let requestedFrames=0,cancelledAnimations=0,navOpen=false;
let playCalls=0,rejectPlayback=false;
const videoEvents=new Map(),toggleEvents=new Map(),visibilityEvents=new Map(),videoClasses=new Set(),videoLabel={textContent:''};
const heroVideo={src:'',dataset:{src:'/assets/hero-classroom.mp4'},paused:true,error:null,
  getAttribute(){return this.src||null;},addEventListener:(event,listener)=>videoEvents.set(event,listener),
  classList:{add:name=>videoClasses.add(name),remove:name=>videoClasses.delete(name)},
  play(){playCalls++;if(rejectPlayback)return Promise.reject(new Error('Autoplay blocked'));this.paused=false;videoEvents.get('playing')();return Promise.resolve();},
  pause(){if(!this.paused){this.paused=true;videoEvents.get('pause')();}}
};
const videoToggle={hidden:true,setAttribute(){},classList:{toggle(){}},querySelector:()=>videoLabel,addEventListener:(event,listener)=>toggleEvents.set(event,listener)};
const menuEvents=new Map(),menuAttributes=new Map([['aria-expanded','false']]);
const menu={addEventListener:(event,listener)=>menuEvents.set(event,listener),getAttribute:key=>menuAttributes.get(key),setAttribute:(key,value)=>menuAttributes.set(key,value)};
const navigation={addEventListener(){},classList:{toggle(name,on){navOpen=on;},remove(){navOpen=false;}}};
const mobileMenuPreference={addEventListener(event,listener){this.listener=listener;}};
const fakeDocument={
  querySelector:selector=>selector==='[data-menu]'?menu:selector==='#navigation'?navigation:selector==='[data-brand-fade]'?brand:selector==='[data-community]'?community:selector==='.site-header'?{offsetHeight:80}:selector==='[data-hero-video]'?heroVideo:selector==='[data-video-toggle]'?videoToggle:null,
  querySelectorAll:selector=>selector==='[data-flag]'?[{style:style(),dataset:{speed:1}}]:[],
  hidden:false,addEventListener:(event,listener)=>visibilityEvents.set(event,listener),fonts:{ready:Promise.resolve()},getAnimations:()=>[{cancel(){cancelledAnimations++;}}]
};
vm.runInNewContext(fs.readFileSync(path.join(root,'dist/assets/site.js'),'utf8').replace(/^export /gm,''),{
  document:fakeDocument,window:{scrollY:0,innerHeight:800,matchMedia:query=>query.includes('prefers-reduced-motion')?preference:mobileMenuPreference,addEventListener(){}},
  requestAnimationFrame(){requestedFrames++;return 1;},cancelAnimationFrame(){}
});
await Promise.resolve();
assert.equal(requestedFrames,0);
assert.equal(brand.style.opacity,undefined);
assert.equal(heroVideo.src,'','Reduced motion must not download the video');
assert.equal(playCalls,0);
assert.equal(videoToggle.hidden,true);
preference.matches=false;preference.listener();
assert.equal(requestedFrames,1);
assert.equal(heroVideo.src,'/assets/hero-classroom.mp4');
assert.equal(heroVideo.paused,false);
toggleEvents.get('click')();
assert.equal(heroVideo.paused,true);
assert.equal(videoLabel.textContent,'Включить видеофон');
fakeDocument.hidden=true;visibilityEvents.get('visibilitychange')();
fakeDocument.hidden=false;visibilityEvents.get('visibilitychange')();
assert.equal(playCalls,1,'Visibility changes must preserve a deliberate pause');
toggleEvents.get('click')();
assert.equal(heroVideo.paused,false);
preference.matches=true;preference.listener();
assert.equal(requestedFrames,1);
assert.equal(cancelledAnimations,1);
assert.equal(heroVideo.paused,true);
assert.equal(videoClasses.has('is-ready'),false);
assert.equal(videoToggle.hidden,true);
rejectPlayback=true;preference.matches=false;preference.listener();
await Promise.resolve();
assert.equal(heroVideo.paused,true);
assert.equal(videoToggle.hidden,false,'Blocked autoplay must offer manual playback');
rejectPlayback=false;toggleEvents.get('click')();
assert.equal(heroVideo.paused,false);
heroVideo.error={code:4};videoEvents.get('error')();
assert.equal(videoClasses.has('is-ready'),false,'A media error must restore the poster');
assert.equal(videoToggle.hidden,true);
menuEvents.get('click')();
assert.equal(menuAttributes.get('aria-expanded'),'true');
assert.equal(navOpen,true);
mobileMenuPreference.listener();
assert.equal(menuAttributes.get('aria-expanded'),'false');
assert.equal(navOpen,false);
for(const p of pages){
  const file=path.join(root,'dist',p.route.slice(1),'index.html');
  const html=fs.readFileSync(file,'utf8');
  assert.equal((html.match(/<h1[ >]/g)||[]).length,1,p.route+' requires one h1');
  assert(!/href="#"/.test(html),p.route+' contains empty link');
  assert(html.includes('lang="ru"'));
  assert(html.includes(`/assets/style.css?v=${styleVersion}"`),p.route+' requires the current stylesheet version');
  assert(html.includes(`/assets/site.js?v=${scriptVersion}"`),p.route+' requires the current script version');
  assert.equal((html.match(/data-hero-video/g)||[]).length,p.route==='/'?1:0,'Video belongs only on the home page');
  assert.equal((html.match(/class="ambient-background" aria-hidden="true"/g)||[]).length,1,p.route+' requires one decorative backdrop');
  for(const [,href] of html.matchAll(/(?:href|src)="(\/[^"#]*)/g)){
    const clean=href.split(/[?#]/)[0];
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
