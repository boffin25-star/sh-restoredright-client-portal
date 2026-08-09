import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bhofebvgpsozpubefzvx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJob2ZlYnZncHNvenB1YmVmenZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MjE2MzgsImV4cCI6MjA5NzM5NzYzOH0.1pLDZUpEFoOBQDbwEcX1sFTVXZ80e2NLM6cSKGjYmk4";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const navy="#0D3B80", muted="#66768D", border="#D7E2F0";
const detailed = [
  ["Project Information","Confirm the client, project and property information shown below."],
  ["Authority to Approve Work","Confirm that you have authority to request and authorize these services."],
  ["Scope of Emergency Services","Emergency mitigation, stabilization, cleaning, drying, demolition, documentation and related services may be performed as authorized."],
  ["Authorization to Begin Work","Authorize S&H Services Spokane to enter the property and perform the selected emergency services."],
  ["Equipment & Material Removal","Necessary drying, filtration, monitoring equipment and removal of unsalvageable materials may be required."],
  ["Insurance & Payment","S&H is a contractor, not your insurer. You remain responsible for authorized charges not paid by insurance."],
  ["Electronic Signature","Review and electronically sign the authorization."]
];
const simple = [detailed[0],detailed[2],detailed[5],detailed[6]];

export function AuthorizationRouteScreen({ authCode }) {
  const [loading,setLoading]=useState(true);
  const [auth,setAuth]=useState(null);
  const [job,setJob]=useState(null);
  const [step,setStep]=useState(0);
  const [ack,setAck]=useState(false);
  const [name,setName]=useState("");
  const [initials,setInitials]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [done,setDone]=useState(false);

  useEffect(()=>{ (async()=>{
    const {data:a,error:e}=await supabase.from("work_authorizations").select("*").eq("auth_code",authCode).maybeSingle();
    if (e || !a) {setError("This authorization link is invalid or expired.");setLoading(false);return;}
    setAuth(a);
    const {data:j}=await supabase.from("jobs").select("*").eq("id",a.job_id).maybeSingle();
    setJob(j || null); setLoading(false);
  })(); },[authCode]);

  if (loading) return <div style={{padding:40,textAlign:"center"}}>Loading authorization…</div>;
  if (error) return <div style={{padding:40,textAlign:"center",color:"#B83232"}}>{error}</div>;
  if (done || auth?.status==="signed") return <div style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#F6F9FD"}}><div style={{textAlign:"center"}}><div style={{fontSize:44,color:"#16A34A"}}>✓</div><h2 style={{color:navy}}>Authorization Signed</h2><p style={{color:muted}}>Thank you. Our team has been notified.</p></div></div>;

  const steps=auth?.wizard_mode==="simple"?simple:detailed;
  const [title,body]=steps[step];
  const last=step===steps.length-1;

  async function submit() {
    if (!name.trim() || initials.trim().length<2) return;
    setBusy(true);
    const {error:e}=await supabase.rpc("client_sign_work_authorization",{
      p_auth_code:authCode,
      p_responses:{acknowledged:true,flow:auth?.wizard_mode || "detailed"},
      p_initials:{signature:initials.trim()},
      p_signature_name:name.trim(),
      p_marketing_consent:false,
      p_user_agent:navigator.userAgent
    });
    if (e) setError(e.message); else setDone(true);
    setBusy(false);
  }

  return <div style={{minHeight:"100vh",background:"#F6F9FD"}}>
    <header style={{background:navy,color:"#fff",padding:18,textAlign:"center",fontWeight:900}}>S&H SERVICES SPOKANE</header>
    <div style={{maxWidth:600,margin:"0 auto",padding:18}}>
      <div style={{display:"flex",gap:4,marginBottom:12}}>{steps.map((_,i)=><div key={i} style={{height:4,flex:1,borderRadius:8,background:i<=step?"#1456B8":"#D7E2F0"}}/>)}</div>
      <div style={{background:"#fff",border:`1px solid ${border}`,borderRadius:14,padding:20,boxShadow:"0 6px 18px rgba(8,43,96,.07)"}}>
        <h2 style={{color:navy,marginTop:0}}>{title}</h2>
        {step===0 && <div style={{fontSize:13,color:muted,lineHeight:1.65,marginBottom:12}}>
          <div>Client: {job?.customer_name || "On file"}</div><div>Property: {job?.address || "On file"}</div><div>Project #: {job?.id || auth?.job_id}</div>
        </div>}
        <p style={{lineHeight:1.6}}>{body}</p>
        {!last && <label style={{display:"flex",gap:9,alignItems:"flex-start",fontSize:13,marginTop:16}}><input type="checkbox" checked={ack} onChange={e=>setAck(e.target.checked)}/> I acknowledge and understand this section.</label>}
        {last && <div style={{display:"grid",gap:10,marginTop:16}}>
          <input style={{minHeight:44,border:`1px solid ${border}`,borderRadius:9,padding:"10px 12px"}} value={name} onChange={e=>setName(e.target.value)} placeholder="Printed full legal name"/>
          <input style={{minHeight:44,border:`1px solid ${border}`,borderRadius:9,padding:"10px 12px",maxWidth:160}} value={initials} onChange={e=>setInitials(e.target.value)} placeholder="Initials"/>
        </div>}
      </div>
      <div style={{display:"flex",gap:8,marginTop:12}}>
        {step>0 && <button onClick={()=>{setStep(s=>s-1);setAck(false)}} style={{border:`1px solid ${border}`,background:"#fff",color:navy,borderRadius:9,padding:"11px 14px",fontWeight:800}}>Back</button>}
        {!last ? <button disabled={!ack} onClick={()=>{setStep(s=>s+1);setAck(false)}} style={{flex:1,border:0,background:navy,color:"#fff",borderRadius:9,padding:"11px 14px",fontWeight:800,opacity:ack?1:.5}}>Continue</button>
        : <button disabled={busy || !name.trim() || initials.trim().length<2} onClick={submit} style={{flex:1,border:0,background:navy,color:"#fff",borderRadius:9,padding:"11px 14px",fontWeight:800}}>{busy?"Submitting…":"Sign & Submit"}</button>}
      </div>
    </div>
  </div>;
}
