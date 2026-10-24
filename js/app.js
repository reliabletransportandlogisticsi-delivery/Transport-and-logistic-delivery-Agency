const $=s=>document.querySelector(s);const $$=s=>document.querySelectorAll(s);
const API='/api';
function token(){return localStorage.getItem('pawgoToken')}
function headers(){const h={'Content-Type':'application/json'};if(token())h.Authorization='Bearer '+token();return h}
function toast(msg){const t=$('#toast');if(!t)return;t.textContent=msg;t.style.display='block';setTimeout(()=>t.style.display='none',3200)}
function setAuthUI(){const user=JSON.parse(localStorage.getItem('pawgoUser')||'null');$$('[data-auth-name]').forEach(x=>x.textContent=user?.name||'');$$('[data-auth-only]').forEach(x=>x.style.display=user?'':'none');$$('[data-guest-only]').forEach(x=>x.style.display=user?'none':'');$$('[data-nav-auth]').forEach(link=>{link.textContent=user?'Logout':'Login';link.href=user?'#':'./login.html';link.onclick=user?e=>{e.preventDefault();logout()}:null;});}
function logout(){localStorage.removeItem('pawgoToken');localStorage.removeItem('pawgoUser');location.href='/' }
window.pawgo={API,token,headers,toast,logout};
setAuthUI();
const menu=$('.menu');
const nav=$('.nav');
if(menu&&nav){
  menu.addEventListener('click',()=>{
    const open=nav.classList.toggle('open');
    menu.setAttribute('aria-expanded',String(open));
    menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');
  });
  $$('.nav-links a').forEach(link=>link.addEventListener('click',()=>{
    nav.classList.remove('open');
    menu.setAttribute('aria-expanded','false');
    menu.setAttribute('aria-label','Open navigation');
  }));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation')}});
}
