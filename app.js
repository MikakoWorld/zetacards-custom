
const EXPORT_WIDTH=1200,EXPORT_HEIGHT=1700;
const state={activeTemplate:'profile',style:{fontColor:'#23233a',fontFamily:'maru'},question:{firstCharacter:'',featureRequest:'',reasonStarted:'',messageToOps:'',freeSpace:''},profile:{name:'',xId:'',zetaHistory:'',creatorId:'',nickname:'',favoriteThing:'',profileImage:'',oshi1Name:'',oshi2Name:'',oshi3Name:'',oshi1Desc:'',oshi2Desc:'',oshi3Desc:'',oshi1Image:'',oshi2Image:'',oshi3Image:''}};
const DISABLE_PERSIST=Boolean(window.ZETA_DISABLE_PERSIST);
const TEMPLATE_IMAGES={profile:'assets/template-profile.jpg',question:'assets/template-question.jpg'};
const FONT_FAMILIES={maru:'"Hiragino Maru Gothic ProN","Hiragino Maru Gothic Pro","Yu Gothic","Hiragino Sans",sans-serif',gothic:'"Yu Gothic","Hiragino Sans",sans-serif',mincho:'"Hiragino Mincho ProN","Yu Mincho",serif'};
const tabs=document.querySelectorAll('.tab'),questionForm=document.getElementById('question-form'),profileForm=document.getElementById('profile-form'),fontFamilySelect=document.getElementById('font-family-select'),fontColorInput=document.getElementById('font-color-input'),fontColorButton=document.getElementById('font-color-button'),fontColorPreview=document.getElementById('font-color-preview'),previewCanvas=document.getElementById('preview-canvas'),previewSizeLabel=document.getElementById('preview-size-label'),downloadBtn=document.getElementById('download-btn'),iosBtn=document.getElementById('ios-btn'),resetBtn=document.getElementById('reset-btn'),iosSaveModal=document.getElementById('ios-save-modal'),iosSaveClose=document.getElementById('ios-save-close'),iosSaveImage=document.getElementById('ios-save-image');
const imageCache=new Map();
const qs=(s,r=document)=>r.querySelector(s);
function persist(){if(DISABLE_PERSIST)return;localStorage.setItem('zeta-cards-custom',JSON.stringify(state))}
function loadState(){if(DISABLE_PERSIST)return;const raw=localStorage.getItem('zeta-cards-custom');if(!raw)return;try{const saved=JSON.parse(raw);Object.assign(state.style,saved.style||{});Object.assign(state.question,saved.question||{});Object.assign(state.profile,saved.profile||{});state.activeTemplate=saved.activeTemplate||'profile'}catch(e){console.warn(e)}}
function applyPresetFromWindow(){const preset=window.ZETA_PRESET;if(!preset)return;Object.assign(state.style,preset.style||{});Object.assign(state.question,preset.question||{});Object.assign(state.profile,preset.profile||{});if(preset.activeTemplate)state.activeTemplate=preset.activeTemplate}
function updateColorPreview(){const color=state.style.fontColor||'#23233a',selectedFamily=FONT_FAMILIES[state.style.fontFamily]||FONT_FAMILIES.maru;if(fontColorPreview){fontColorPreview.style.color=color;fontColorPreview.style.fontFamily=selectedFamily}if(fontColorButton){fontColorButton.style.color=color;fontColorButton.style.borderColor=color}}
function fillForms(){Object.entries(state.question).forEach(([k,v])=>{const el=questionForm.elements.namedItem(k);if(el)el.value=v});Object.entries(state.profile).forEach(([k,v])=>{const el=profileForm.elements.namedItem(k);if(el&&el.type!=='file')el.value=v});if(fontFamilySelect)fontFamilySelect.value=state.style.fontFamily||'maru';if(fontColorInput)fontColorInput.value=state.style.fontColor||'#23233a';updateColorPreview()}
function setTemplate(t){state.activeTemplate=t;tabs.forEach(tab=>{const a=tab.dataset.template===t;tab.classList.toggle('is-active',a);tab.setAttribute('aria-selected',String(a))});questionForm.classList.toggle('hidden',t!=='question');profileForm.classList.toggle('hidden',t!=='profile');persist();renderPreview()}
tabs.forEach(tab=>tab.addEventListener('click',()=>setTemplate(tab.dataset.template)));
questionForm.addEventListener('input',e=>{const {name,value}=e.target;state.question[name]=value;persist();renderPreview()});
profileForm.addEventListener('input',async e=>{const {name,value,type,files}=e.target;if(type==='file'){const file=files?.[0];if(!file)return;state.profile[name]=await readFileAsDataURL(file);imageCache.delete(state.profile[name]);persist();renderPreview();return}state.profile[name]=value;persist();renderPreview()});
if(fontColorInput)fontColorInput.addEventListener('input',e=>{state.style.fontColor=e.target.value||'#23233a';updateColorPreview();persist();renderPreview()});
if(fontFamilySelect)fontFamilySelect.addEventListener('change',e=>{state.style.fontFamily=e.target.value||'maru';updateColorPreview();persist();renderPreview()});
resetBtn.addEventListener('click',()=>{if(!confirm('入力内容を消しますか？'))return;localStorage.removeItem('zeta-cards-custom');window.location.reload()});
downloadBtn.addEventListener('click',async()=>{try{const canvas=await buildExportCanvas();await saveCanvas(canvas,`zeta-card-${state.activeTemplate}.png`)}catch(e){console.error(e);alert('保存に失敗しました。')}})
function openIOSModal(){if(!iosSaveModal)return;iosSaveModal.classList.remove('hidden');document.body.classList.add('modal-open')}
function closeIOSModal(){if(!iosSaveModal)return;iosSaveModal.classList.add('hidden');document.body.classList.remove('modal-open')}
iosBtn.addEventListener('click',async()=>{try{const canvas=await buildExportCanvas();iosSaveImage.src=canvas.toDataURL('image/png');openIOSModal()}catch(e){console.error(e);alert('PNG化に失敗しました。')}})
if(iosSaveClose)iosSaveClose.addEventListener('click',closeIOSModal);
if(iosSaveModal)iosSaveModal.addEventListener('click',e=>{if(e.target===iosSaveModal)closeIOSModal()});
window.addEventListener('keydown',e=>{if(e.key==='Escape')closeIOSModal()});
window.addEventListener('resize',renderPreview);
function readFileAsDataURL(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)})}
function isIOS(){return /iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)}
function canvasToBlob(canvas){return new Promise(res=>canvas.toBlob(b=>res(b),'image/png'))}
async function saveCanvas(canvas,filename){const blob=await canvasToBlob(canvas);if(!blob)throw new Error('PNG化に失敗');const file=new File([blob],filename,{type:'image/png'});if(isIOS()&&navigator.share&&navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:filename});return}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function createCanvas(w=EXPORT_WIDTH,h=EXPORT_HEIGHT){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
async function loadImage(src){
if(!src)return null;
if(imageCache.has(src))return imageCache.get(src);
const p=new Promise(res=>{
const i=new Image();
if(!String(src).startsWith('data:'))i.crossOrigin='anonymous';
i.onload=()=>res(i);
i.onerror=()=>{console.warn('image load failed',src);res(null)};
i.src=src
});
imageCache.set(src,p);
return p
}
function roundRect(ctx,x,y,w,h,r,fill=true,stroke=false){const rr=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();if(fill)ctx.fill();if(stroke)ctx.stroke()}
function drawImageCover(ctx,img,x,y,w,h,r=0){if(!img)return;const imgRatio=img.width/img.height,boxRatio=w/h;let sx,sy,sw,sh;if(imgRatio>boxRatio){sh=img.height;sw=sh*boxRatio;sx=(img.width-sw)/2;sy=0}else{sw=img.width;sh=sw/boxRatio;sx=0;sy=(img.height-sh)/2}ctx.save();if(r>0){roundRect(ctx,x,y,w,h,r,false,false);ctx.clip()}ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h);ctx.restore()}
function pct(total,p){return total*(p/100)}
function boxByPercent(w,h,l,t,bw,bh){return{x:pct(w,l),y:pct(h,t),w:pct(w,bw),h:pct(h,bh)}}
function wrapText(ctx,text,maxWidth){const raw=String(text).split('\n'),lines=[];raw.forEach(line=>{if(!line){lines.push('');return}let buf='';for(const ch of line){const test=buf+ch;if(ctx.measureText(test).width>maxWidth&&buf){lines.push(buf);buf=ch}else buf=test}if(buf)lines.push(buf)});return lines}
function drawContainedText(ctx,text,box,opt={}){const selectedFamily=FONT_FAMILIES[state.style.fontFamily]||FONT_FAMILIES.maru;const o={maxFontSize:38,minFontSize:18,fontWeight:700,color:state.style.fontColor||'#23233a',lineHeight:1.35,align:'left',valign:'top',paddingX:0,paddingY:0,noWrap:false,...opt},content=String(text||'').trim();if(!content)return;let fs=o.maxFontSize,lines=[];while(fs>=o.minFontSize){ctx.font=`${o.fontWeight} ${fs}px ${selectedFamily}`;lines=o.noWrap?[content.replace(/\n+/g,' ')]:wrapText(ctx,content,Math.max(1,box.w-o.paddingX*2));const h=lines.length*fs*o.lineHeight;const maxW=Math.max(...lines.map(line=>ctx.measureText(line).width),0);if(h<=Math.max(1,box.h-o.paddingY*2)&&maxW<=Math.max(1,box.w-o.paddingX*2))break;fs--}ctx.font=`${o.fontWeight} ${fs}px ${selectedFamily}`;ctx.fillStyle=o.color;ctx.textAlign=o.align;ctx.textBaseline='top';const total=lines.length*fs*o.lineHeight;let startY=box.y+o.paddingY;if(o.valign==='middle')startY=box.y+(box.h-total)/2;if(o.valign==='bottom')startY=box.y+box.h-total-o.paddingY;let x=box.x+o.paddingX;if(o.align==='center')x=box.x+box.w/2;if(o.align==='right')x=box.x+box.w-o.paddingX;lines.forEach((line,i)=>ctx.fillText(line,x,startY+i*fs*o.lineHeight))}
function drawSectionCard(ctx,x,y,w,h,title,body,opt={}){ctx.save();ctx.fillStyle=opt.fill||'#fff';ctx.strokeStyle=opt.stroke||'#d9d2ff';ctx.lineWidth=opt.lineWidth||3;roundRect(ctx,x,y,w,h,opt.radius||24,true,true);if(title){ctx.fillStyle=opt.titleBg||'#efeafd';roundRect(ctx,x+18,y-18,Math.min(w-36,360),48,18,true,false);ctx.fillStyle=opt.titleColor||'#5a4bb8';ctx.font='700 26px system-ui,-apple-system,sans-serif';ctx.textBaseline='middle';ctx.textAlign='left';ctx.fillText(title,x+34,y+6)}drawContainedText(ctx,body,{x:x+24,y:y+34,w:w-48,h:h-48},{maxFontSize:opt.maxFontSize||34,minFontSize:opt.minFontSize||18,lineHeight:opt.lineHeight||1.45});ctx.restore()}
function drawLabeledField(ctx,x,y,w,h,label,value){ctx.save();ctx.fillStyle='#fff';ctx.strokeStyle='#ddd4ff';ctx.lineWidth=3;roundRect(ctx,x,y,w,h,22,true,true);ctx.fillStyle='#efeafd';roundRect(ctx,x+16,y+14,220,34,17,true,false);ctx.fillStyle='#5a4bb8';ctx.font='700 22px system-ui,-apple-system,sans-serif';ctx.textBaseline='middle';ctx.fillText(label,x+30,y+31);drawContainedText(ctx,value,{x:x+248,y:y+14,w:w-272,h:h-20},{maxFontSize:46,minFontSize:24,valign:'middle'});ctx.restore()}
function drawBubbleField(ctx,x,y,w,h,label,value){ctx.save();ctx.fillStyle='#fff7ff';ctx.strokeStyle='#e3d8ff';ctx.lineWidth=3;roundRect(ctx,x,y,w,h,28,true,true);ctx.fillStyle='#a57ef4';ctx.font='700 20px system-ui,-apple-system,sans-serif';ctx.textBaseline='top';ctx.fillText(label,x+24,y+18);drawContainedText(ctx,value,{x:x+22,y:y+42,w:w-44,h:h-54},{maxFontSize:32,minFontSize:18,align:'center',valign:'middle'});ctx.restore()}
async function drawOshiCard(ctx,{index,x,y,w,h}){const img=await loadImage(state.profile[`oshi${index}Image`]),name=state.profile[`oshi${index}Name`],desc=state.profile[`oshi${index}Desc`];ctx.save();ctx.fillStyle='#fff';ctx.strokeStyle='#ddd4ff';ctx.lineWidth=3;roundRect(ctx,x,y,w,h,28,true,true);const imageHeight=238;ctx.fillStyle='#f3efff';roundRect(ctx,x+18,y+18,w-36,imageHeight,22,true,false);drawImageCover(ctx,img,x+18,y+18,w-36,imageHeight,22);ctx.fillStyle='#efeafd';roundRect(ctx,x+24,y+274,w-48,52,18,true,false);drawContainedText(ctx,name,{x:x+26,y:y+278,w:w-52,h:44},{maxFontSize:28,minFontSize:16,align:'center',valign:'middle',color:'#5a4bb8'});drawContainedText(ctx,desc,{x:x+22,y:y+344,w:w-44,h:h-366},{maxFontSize:24,minFontSize:15,lineHeight:1.5});ctx.restore()}
async function renderProfileCard(ctx,w,h){
ctx.clearRect(0,0,w,h);
const base=await loadImage(TEMPLATE_IMAGES.profile);
if(base)ctx.drawImage(base,0,0,w,h);
const profileImage=await loadImage(state.profile.profileImage);
drawImageCover(ctx,profileImage,...Object.values(boxByPercent(w,h,11.4,9,25,20)),28);
drawContainedText(ctx,state.profile.name,boxByPercent(w,h,65.6,11.1,25.3,3.7),{maxFontSize:35,minFontSize:15,valign:'middle',noWrap:true,paddingX:6});
drawContainedText(ctx,state.profile.xId,boxByPercent(w,h,65.6,15.35,25.3,3.7),{maxFontSize:35,minFontSize:15,valign:'middle',noWrap:true,paddingX:6});
drawContainedText(ctx,state.profile.zetaHistory,boxByPercent(w,h,65.6,19.55,25.3,3.4),{maxFontSize:35,minFontSize:15,valign:'middle',noWrap:true,paddingX:6});
drawContainedText(ctx,state.profile.creatorId,boxByPercent(w,h,65.6,23.85,25.3,3.8),{maxFontSize:31,minFontSize:14,valign:'middle',noWrap:true,paddingX:6});
drawContainedText(ctx,state.profile.nickname,boxByPercent(w,h,13,30.55,32,3.05),{maxFontSize:32,minFontSize:15,align:'center',valign:'middle',noWrap:true,paddingX:8});
drawContainedText(ctx,state.profile.favoriteThing,boxByPercent(w,h,37,34.5,32,3),{maxFontSize:32,minFontSize:15,align:'center',valign:'middle',noWrap:true,paddingX:8});
for(const slot of[{n:1,img:[14.45,45.95,23.8,16.8],name:[16.5,64,19.4,3.1],desc:[15.2,68.8,22.6,27.4]},{n:2,img:[42.05,45.95,23.8,16.8],name:[44.2,64,19.4,3.1],desc:[42.7,68.8,22.6,27.4]},{n:3,img:[68.95,45.95,23.8,16.8],name:[71.8,64,19.4,3.1],desc:[70.2,68.8,22.6,27.4]}]){
const img=await loadImage(state.profile[`oshi${slot.n}Image`]);
drawImageCover(ctx,img,...Object.values(boxByPercent(w,h,...slot.img)),6);
drawContainedText(ctx,state.profile[`oshi${slot.n}Name`],boxByPercent(w,h,...slot.name),{maxFontSize:30,minFontSize:14,align:'center',valign:'middle',noWrap:true});
drawContainedText(ctx,state.profile[`oshi${slot.n}Desc`],boxByPercent(w,h,...slot.desc),{maxFontSize:24,minFontSize:15,lineHeight:1.4,paddingX:6,paddingY:6});
}
}
async function renderQuestionCard(ctx,w,h){
ctx.clearRect(0,0,w,h);
const base=await loadImage(TEMPLATE_IMAGES.question);
if(base)ctx.drawImage(base,0,0,w,h);
drawContainedText(ctx,state.question.firstCharacter,boxByPercent(w,h,9,13.8,38,4.8),{maxFontSize:39,minFontSize:18,valign:'middle',paddingX:8});
drawContainedText(ctx,state.question.featureRequest,boxByPercent(w,h,9,23,38,13),{maxFontSize:31,minFontSize:14,lineHeight:1.35,paddingX:8,paddingY:8});
drawContainedText(ctx,state.question.reasonStarted,boxByPercent(w,h,53,13.6,32.2,10.2),{maxFontSize:31,minFontSize:14,lineHeight:1.35,paddingX:8,paddingY:8});
drawContainedText(ctx,state.question.messageToOps,boxByPercent(w,h,53.5,28.8,32,7.5),{maxFontSize:30,minFontSize:13,lineHeight:1.35,paddingX:8,paddingY:8});
drawContainedText(ctx,state.question.freeSpace,boxByPercent(w,h,11,47,73,47.4),{maxFontSize:25,minFontSize:13,lineHeight:1.42,paddingX:12,paddingY:10});
}
async function renderCard(ctx,w,h){ctx.clearRect(0,0,w,h);if(state.activeTemplate==='profile')await renderProfileCard(ctx,w,h);else await renderQuestionCard(ctx,w,h)}
async function buildExportCanvas(){const c=createCanvas(EXPORT_WIDTH,EXPORT_HEIGHT);await renderCard(c.getContext('2d'),EXPORT_WIDTH,EXPORT_HEIGHT);return c}
async function renderPreview(){previewSizeLabel.textContent=`出力 ${EXPORT_WIDTH} × ${EXPORT_HEIGHT}`;try{await renderCard(previewCanvas.getContext('2d'),previewCanvas.width,previewCanvas.height)}catch(e){console.error(e)}}
loadState();applyPresetFromWindow();fillForms();setTemplate(state.activeTemplate);renderPreview();
