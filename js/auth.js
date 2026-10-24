async function postForm(form,url,noticeId){
  const data=Object.fromEntries(new FormData(form));
  try{
    const r=await fetch(API+url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    const j=await r.json();
    const n=document.getElementById(noticeId);
    if(!r.ok){n.textContent=j.message||'Something went wrong';n.style.display='block';return null}
    return j;
  }catch(e){
    const n=document.getElementById(noticeId);
    n.textContent='Unable to connect to the server. Make sure the app is running on http://localhost:5000.';
    n.style.display='block';
    return null;
  }
}
const lf=document.getElementById('loginForm');
if(lf)lf.addEventListener('submit',async e=>{
  e.preventDefault();
  const j=await postForm(lf,'/auth/login','loginNotice');
  if(j){
    localStorage.setItem('pawgoToken',j.token);
    localStorage.setItem('pawgoUser',JSON.stringify(j.user));
    const next=new URLSearchParams(location.search).get('next');
    location.href=next&&next.startsWith('/')?next:(j.user.role==='admin'?'/admin.html':j.user.role==='courier'?'/courier.html':'/dashboard.html');
  }
});
const rf=document.getElementById('registerForm');
if(rf)rf.addEventListener('submit',async e=>{
  e.preventDefault();
  const j=await postForm(rf,'/auth/register','registerNotice');
  if(j){localStorage.setItem('pawgoToken',j.token);localStorage.setItem('pawgoUser',JSON.stringify(j.user));location.href='/dashboard.html'}
});
