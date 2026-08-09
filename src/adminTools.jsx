import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bhofebvgpsozpubefzvx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJob2ZlYnZncHNvenB1YmVmenZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MjE2MzgsImV4cCI6MjA5NzM5NzYzOH0.1pLDZUpEFoOBQDbwEcX1sFTVXZ80e2NLM6cSKGjYmk4";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const navy = "#0D3B80";
const border = "#D7E2F0";
const muted = "#66768D";

const card = { background:"#fff", border:`1px solid ${border}`, borderRadius:14, padding:20, boxShadow:"0 6px 18px rgba(8,43,96,.07)" };
const input = { width:"100%", minHeight:44, border:`1px solid ${border}`, borderRadius:9, padding:"10px 12px", marginBottom:10 };
const primary = { border:0, borderRadius:9, background:navy, color:"#fff", padding:"10px 14px", fontWeight:800, cursor:"pointer" };

function tempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({length:8},()=>chars[Math.floor(Math.random()*chars.length)]).join("");
}

export function AdminInvitePanel() {
  const [email,setEmail]=useState("");
  const [pw,setPw]=useState("");
  const [busy,setBusy]=useState(false);
  const [status,setStatus]=useState("");

  async function submit() {
    if (!email.trim()) return setStatus("Enter a client email.");
    setBusy(true); setStatus("");
    const nextPw = pw.trim() || tempPassword();
    const { error:authError } = await supabase.auth.signUp({ email:email.trim(), password:nextPw });
    if (authError && !/already registered/i.test(authError.message || "")) {
      setStatus(authError.message); setBusy(false); return;
    }
    const { error } = await supabase.from("client_portal_meta").upsert({
      email:email.trim(), must_reset:true, invited_by:"staff", invited_at:new Date().toISOString()
    }, { onConflict:"email" });
    if (error) setStatus(error.message);
    else { setPw(nextPw); setStatus(`Login ready. Temporary password: ${nextPw}`); }
    setBusy(false);
  }

  return <div style={card}>
    <h3 style={{marginTop:0,color:navy}}>Invite / Reset Client</h3>
    <p style={{fontSize:13,color:muted}}>Creates a portal account or refreshes the client metadata record.</p>
    <input style={input} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="client@email.com" />
    <input style={input} value={pw} onChange={e=>setPw(e.target.value)} placeholder="Temporary password (optional)" />
    <button style={primary} disabled={busy} onClick={submit}>{busy?"Working…":"Create / Reset Login"}</button>
    {status && <div style={{marginTop:12,fontSize:13}}>{status}</div>}
  </div>;
}

export function AdminAuthorizationPanel() {
  const [jobs,setJobs]=useState([]);
  const [jobId,setJobId]=useState("");
  const [mode,setMode]=useState("detailed");
  const [link,setLink]=useState("");
  const [status,setStatus]=useState("");

  useEffect(()=>{ (async()=>{
    const {data} = await supabase.from("jobs").select("id,customer_name,customer_email").order("created_at",{ascending:false}).limit(100);
    setJobs(data || []);
  })(); },[]);

  async function generate() {
    if (!jobId) return setStatus("Select a job.");
    const authCode=Math.random().toString(36).slice(2,10).toUpperCase();
    const {error}=await supabase.from("work_authorizations").upsert({
      job_id:jobId, auth_code:authCode, wizard_mode:mode, status:"pending", created_at:new Date().toISOString()
    },{onConflict:"job_id"});
    if (error) return setStatus(error.message);
    const url=`${window.location.origin}/#auth/${authCode}`;
    setLink(url); setStatus("Authorization link created.");
  }

  return <div style={card}>
    <h3 style={{marginTop:0,color:navy}}>Work Authorization Link</h3>
    <select style={input} value={jobId} onChange={e=>setJobId(e.target.value)}>
      <option value="">Select a job…</option>
      {jobs.map(j=><option key={j.id} value={j.id}>{j.customer_name} — {j.customer_email}</option>)}
    </select>
    <select style={input} value={mode} onChange={e=>setMode(e.target.value)}>
      <option value="detailed">Detailed flow</option>
      <option value="simple">Simple flow</option>
    </select>
    <button style={primary} onClick={generate}>Generate Link</button>
    {status && <div style={{marginTop:12,fontSize:13}}>{status}</div>}
    {link && <input style={{...input,marginTop:10}} readOnly value={link} onFocus={e=>e.target.select()} />}
  </div>;
}
