(async()=>{
  const loginPath='/login.html?next=/dashboard.html';
  if(!token()){
    location.href=loginPath;
    return;
  }
  try{
    const r=await fetch(API+'/deliveries/mine',{headers:headers()});
    if(r.status===401){logout();return;}
    if(!r.ok) throw new Error('Dashboard data could not be loaded. Please try again.');
    const list=await r.json();
    document.getElementById('total').textContent=list.length;
    document.getElementById('active').textContent=list.filter(d=>['preparing','picked_up','in_transit','nearby'].includes(d.status)).length;
    document.getElementById('delivered').textContent=list.filter(d=>d.status==='delivered').length;
    document.getElementById('spend').textContent='$'+list.reduce((a,d)=>a+(Number(d.amount)||0),0).toFixed(0);
    document.getElementById('deliveryRows').innerHTML=list.map(d=>`<tr><td><strong>${d.trackingId}</strong></td><td>${d.pet?.name||'—'}</td><td>${d.destinationAddress||'—'}</td><td><span class="badge ${d.status==='delivered'?'green':'orange'}">${String(d.status||'').replaceAll('_',' ')}</span></td><td>$${Number(d.amount||0).toFixed(2)}</td><td><a class="btn btn-outline" href="/tracking.html?id=${encodeURIComponent(d.trackingId)}">Track</a></td></tr>`).join('')||'<tr><td colspan="6">No deliveries yet. <a href="/booking.html">Create your first booking.</a></td></tr>';
  }catch(err){
    const rows=document.getElementById('deliveryRows');
    if(rows) rows.innerHTML=`<tr><td colspan="6">${err.message}</td></tr>`;
    toast(err.message);
  }
})();
