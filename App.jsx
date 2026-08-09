import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { AdminInvitePanel, AdminAuthorizationPanel } from "./adminTools.jsx";
import { AdminTabVisibilityPanel } from "./adminTabVisibility.jsx";
import { AuthorizationRouteScreen } from "./authWizard.jsx";

const SUPABASE_URL = "https://bhofebvgpsozpubefzvx.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJob2ZlYnZncHNvenB1YmVmenZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MjE2MzgsImV4cCI6MjA5NzM5NzYzOH0.1pLDZUpEFoOBQDbwEcX1sFTVXZ80e2NLM6cSKGjYmk4";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PHONE = "(509) 903-5744";
const PHONE_TEL = "+15099035744";

const BRAND = {
  navy: "#0D3B80",
  navyDark: "#072B61",
  blue: "#1456B8",
  pale: "#EAF2FC",
  offWhite: "#F6F9FD",
  white: "#FFFFFF",
  border: "#D7E2F0",
  text: "#17345F",
  muted: "#66768D",
  green: "#2D8A4A",
  greenLight: "#EAF6EE",
  amber: "#B56A00",
  amberLight: "#FFF5E6",
  red: "#B83232",
  redLight: "#FDECEC",
};

const WORKFLOW_STAGES = [
  "Lead", "Inspection Scheduled", "Inspection Complete", "Estimate Sent",
  "Awaiting Authorization", "Authorization Signed", "Mitigation In Progress",
  "Drying In Progress", "Drying Complete", "Demo In Progress", "Demo Complete",
  "Reconstruction Scheduled", "Reconstruction In Progress", "Final Walkthrough Scheduled",
  "Final Walkthrough Complete", "Invoice Sent", "Payment Pending", "Complete", "Closed",
];
const TERMINAL_STAGES = new Set(["Declined", "Expired", "Voided"]);

const JOB_TYPE_LABELS = {
  water: "Water Damage", fire: "Fire Damage", smoke: "Smoke / Soot Damage",
  mold: "Mold Remediation", storm: "Storm Damage", wind: "Wind Damage",
  roof: "Roof Damage", sewage: "Sewage / Contaminated Water", other: "Restoration Services",
};

const PORTAL_TABS = [
  { key: "dashboard", label: "Dashboard", icon: "⌂" },
  { key: "projects", label: "Projects", icon: "▣" },
  { key: "contents", label: "My Contents", icon: "▤" },
  { key: "approvals", label: "Approval Requests", icon: "✓" },
  { key: "invoices", label: "Invoices", icon: "$" },
  { key: "billing", label: "My Bill", icon: "▥" },
  { key: "information", label: "Information", icon: "i" },
];

const MOBILE_TABS = [
  { key: "dashboard", label: "Dashboard", icon: "⌂" },
  { key: "projects", label: "Projects", icon: "▣" },
  { key: "messages", label: "Messages", icon: "◌" },
  { key: "billing", label: "My Bill", icon: "$" },
  { key: "menu", label: "Menu", icon: "•••" },
];

const ADMIN_PASSPHRASE = "SHTeam2026";

function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const fn = () => setHash(window.location.hash);
    window.addEventListener("hashchange", fn);
    return () => window.removeEventListener("hashchange", fn);
  }, []);
  return hash;
}

function fmtDate(v) {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString([], { month:"short", day:"numeric", year:"numeric" });
}

function fmtTime(v) {
  if (!v) return "";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString([], { hour:"numeric", minute:"2-digit" });
}

function money(v) {
  const n = Number(v || 0);
  return n.toLocaleString(undefined, { style:"currency", currency:"USD" });
}

function Logo({ className = "" }) {
  return <img className={className} src="/logo.svg" alt="S&H Services Spokane LLC" />;
}

function StageProgress({ stage }) {
  if (TERMINAL_STAGES.has(stage)) {
    return <span className="badge danger">{stage}</span>;
  }
  const idx = Math.max(0, WORKFLOW_STAGES.indexOf(stage));
  const pct = Math.round(((idx + 1) / WORKFLOW_STAGES.length) * 100);
  return (
    <div className="stage-progress">
      <div className="stage-row"><strong>{stage || "Lead"}</strong><span>{pct}%</span></div>
      <div className="stage-track"><div style={{ width:`${pct}%` }} /></div>
    </div>
  );
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("password");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  async function signIn() {
    setBusy(true); setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err) setError(err.message);
    else {
      const { data: meta } = await supabase.from("client_portal_meta").select("must_reset").eq("email", email.trim()).maybeSingle();
      if (meta?.must_reset) setMode("reset");
    }
    setBusy(false);
  }

  async function sendOtp() {
    setBusy(true); setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({ email: email.trim() });
    setError(err ? err.message : { ok:true, text:"Check your email for your secure sign-in link." });
    setBusy(false);
  }

  async function completeReset() {
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ password:newPassword });
    if (err) setError(err.message);
    else {
      await supabase.from("client_portal_meta").update({ must_reset:false, password_set_at:new Date().toISOString() }).eq("email", email.trim());
      window.location.reload();
    }
    setBusy(false);
  }

  return (
    <div className="login-shell">
      <div className="login-overlay" />
      <div className="login-inner">
        <Logo className="login-logo" />
        <div className="login-title">CLIENT PORTAL</div>
        <div className="login-tag">Restoration Done Right!</div>
        <div className="login-card">
          {mode === "reset" ? <>
            <label>Set a new password</label>
            <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="New password" />
            <button className="primary full" onClick={completeReset} disabled={busy}>{busy ? "Saving…" : "Set Password & Continue"}</button>
          </> : <>
            <label>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@email.com" />
            {mode === "password" ? <>
              <label>Password</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" />
              <button className="primary full" onClick={signIn} disabled={busy}>{busy ? "Signing in…" : "Sign In"}</button>
              <button className="link-btn" onClick={()=>setMode("otp")}>Send me a one-time sign-in link</button>
            </> : <>
              <button className="primary full" onClick={sendOtp} disabled={busy}>{busy ? "Sending…" : "Email Me a Sign-In Link"}</button>
              <button className="link-btn" onClick={()=>setMode("password")}>Back to password sign-in</button>
            </>}
          </>}
          {error && <div className={error.ok ? "alert success" : "alert error"}>{error.ok ? error.text : error}</div>}
        </div>
        <div className="login-help">Need help signing in? Call {PHONE}.</div>
      </div>
    </div>
  );
}

function DashboardView({ jobs, messages, invoices, onOpenProject, onNavigate }) {
  const current = jobs[0];
  const pendingApprovals = useMemo(() => jobs.reduce((n,j) => {
    try { return n + (JSON.parse(j.change_orders || "[]").filter(x => (x.clientStatus || "pending") === "pending").length); }
    catch { return n; }
  },0), [jobs]);

  const balance = jobs.reduce((sum,j) => sum + (j.deposit_paid ? 0 : Number(j.deposit_amount || 0)) + (j.final_paid ? 0 : Number(j.final_amount || 0)), 0);
  const recentMessages = messages.slice(-3).reverse();
  const currentStage = current?.workflow_stage || "Lead";
  const idx = Math.max(0, WORKFLOW_STAGES.indexOf(currentStage));
  const nextStage = WORKFLOW_STAGES[Math.min(idx + 1, WORKFLOW_STAGES.length - 1)] || "Complete";

  return (
    <div className="dashboard-view">
      <div className="page-kicker">Current Project Overview</div>
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-icon">⌂</div><span className="metric-label">Current Project Status</span>
          <strong>{currentStage}</strong>
          {current && <StageProgress stage={currentStage} />}
          <small>Last updated: {fmtDate(current?.updated_at || current?.created_at)}</small>
        </div>
        <div className="metric-card">
          <div className="metric-icon">▦</div><span className="metric-label">Next Step</span>
          <strong className="blue">{nextStage}</strong>
          <p>We’ll keep you updated as your project moves forward.</p>
          <button className="outline" onClick={()=>current && onOpenProject(current.id)}>View Details</button>
        </div>
        <div className="metric-card">
          <div className="metric-icon">✓</div><span className="metric-label">Pending Approvals</span>
          <strong className="big blue">{pendingApprovals}</strong>
          <p>Items waiting for your review</p>
          <button className="primary" onClick={()=>onNavigate("approvals")}>Review Now</button>
        </div>
        <div className="metric-card">
          <div className="metric-icon">$</div><span className="metric-label">Balance / Invoices</span>
          <strong className="big blue">{money(balance)}</strong>
          <p>Current Balance</p>
          <button className="outline" onClick={()=>onNavigate("billing")}>View My Bill</button>
        </div>
        <div className="metric-card">
          <div className="metric-icon">◌</div><span className="metric-label">Recent Updates</span>
          <strong className="big blue">{recentMessages.length}</strong>
          <p>New updates from your team</p>
          <button className="outline" onClick={()=>onNavigate("messages")}>View Updates</button>
        </div>
      </div>

      <div className="dash-row">
        <div className="panel timeline-panel">
          <div className="panel-head"><h3>Project Timeline</h3>{current && <button className="text-link" onClick={()=>onOpenProject(current.id)}>View Full Timeline</button>}</div>
          <div className="timeline-wrap">
            <div className="timeline-list">
              {WORKFLOW_STAGES.slice(0, 7).map((stage, i) => {
                const currentIdx = Math.max(0, WORKFLOW_STAGES.indexOf(currentStage));
                const done = i < currentIdx;
                const active = i === currentIdx;
                return <div key={stage} className={`timeline-item ${done?"done":""} ${active?"active":""}`}>
                  <span className="timeline-dot">{done ? "✓" : active ? "●" : ""}</span>
                  <div><strong>{stage}</strong><small>{active ? "Current step" : done ? "Completed" : "Upcoming"}</small></div>
                </div>;
              })}
            </div>
            <div className="project-photo">
              <div className="photo-placeholder">Project</div>
              <p>We’re moving forward with your project.<br/>Let us know if you have any questions.</p>
            </div>
          </div>
        </div>

        <div className="panel manager-card">
          <div className="panel-head"><h3>Your Project Manager</h3></div>
          <div className="manager-avatar">S&H</div>
          <strong>S&H Project Team</strong>
          <span>Project Manager</span>
          <div className="manager-contact">☎ {PHONE}</div>
          <button className="primary full" onClick={()=>onNavigate("messages")}>Send a Message</button>
        </div>
      </div>

      <div className="panel updates">
        <div className="panel-head"><h3>Recent Updates</h3><button className="text-link" onClick={()=>onNavigate("messages")}>View All Updates</button></div>
        {recentMessages.length ? recentMessages.map(m => (
          <div className="update-row" key={m.id}>
            <span className="update-dot">•</span>
            <strong>{m.sender_role === "client" ? "Message Sent" : "Message from Team"}</strong>
            <span>{m.message}</span>
            <small>{fmtDate(m.created_at)} · {fmtTime(m.created_at)}</small>
          </div>
        )) : <div className="empty">No recent updates yet.</div>}
      </div>
    </div>
  );
}

function ProjectsView({ jobs, onOpen }) {
  if (!jobs.length) return <div className="panel empty">No projects on file yet.</div>;
  return <div className="project-grid">{jobs.map(j => (
    <button key={j.id} className="project-card" onClick={()=>onOpen(j.id)}>
      <div className="project-card-icon">⌂</div>
      <div><strong>{j.address || j.customer_name}</strong><span>{JOB_TYPE_LABELS[j.job_type] || j.job_type || "Restoration Services"}</span></div>
      <StageProgress stage={j.workflow_stage} />
    </button>
  ))}</div>;
}

function JobDetail({ job, onBack, onGoMessages }) {
  const [pendingAuth,setPendingAuth] = useState(null);
  useEffect(()=>{ (async()=>{
    const { data } = await supabase.from("work_authorizations").select("auth_code,status").eq("job_id",job.id).neq("status","signed").maybeSingle();
    setPendingAuth(data || null);
  })(); },[job.id]);

  return <div className="stack">
    <button className="outline back" onClick={onBack}>← Back to Projects</button>
    <div className="panel">
      <h2>{job.address || job.customer_name}</h2>
      <p className="muted">{JOB_TYPE_LABELS[job.job_type] || job.job_type}</p>
      <StageProgress stage={job.workflow_stage} />
    </div>
    {pendingAuth && <div className="panel warning">
      <h3>Signature Needed</h3><p>A work authorization is waiting for your signature.</p>
      <a className="primary inline" href={`#auth/${pendingAuth.auth_code}`}>Review & Sign</a>
    </div>}
    {job.claim_number && <div className="panel">
      <h3>Insurance Information</h3>
      <p>Claim #: {job.claim_number}</p>
      {job.adjuster_name && <p>Adjuster: {job.adjuster_name}</p>}
      <div className="button-row">
        {job.adjuster_phone && <a className="outline inline" href={`tel:${job.adjuster_phone}`}>Call Adjuster</a>}
        {job.adjuster_email && <a className="outline inline" href={`mailto:${job.adjuster_email}`}>Email Adjuster</a>}
      </div>
    </div>}
    <button className="primary full" onClick={onGoMessages}>View Messages & Change Orders</button>
  </div>;
}

function MessagesView({ jobs, clientName }) {
  const [activeJobId,setActiveJobId] = useState(jobs[0]?.id || null);
  const [messages,setMessages] = useState([]);
  const [draft,setDraft] = useState("");
  const [busy,setBusy] = useState(false);
  const activeJob = jobs.find(j=>j.id===activeJobId);
  const changeOrders = useMemo(()=>{ try { const x=JSON.parse(activeJob?.change_orders || "[]"); return Array.isArray(x)?x:[]; } catch { return []; } },[activeJob]);

  async function loadMessages() {
    if (!activeJobId) return;
    const { data } = await supabase.from("job_messages").select("*").eq("job_id",activeJobId).order("created_at",{ascending:true});
    setMessages(data || []);
  }
  useEffect(()=>{ loadMessages(); },[activeJobId]);

  async function send() {
    if (!draft.trim() || !activeJobId) return;
    setBusy(true);
    const { error } = await supabase.from("job_messages").insert({
      job_id:activeJobId, sender_name:clientName || "Client", sender_role:"client", message:draft.trim()
    });
    if (!error) { setDraft(""); await loadMessages(); }
    setBusy(false);
  }

  async function respondToChangeOrder(co,decision) {
    setBusy(true);
    let reason="";
    if (decision==="rejected") reason=window.prompt("Optional: let us know why") || "";
    await supabase.rpc("client_respond_to_change_order",{
      p_job_id:activeJobId,p_co_id:co.id,p_decision:decision,p_client_name:clientName || "Client",p_reject_reason:reason
    });
    setBusy(false); window.location.reload();
  }

  if (!jobs.length) return <div className="panel empty">No projects yet.</div>;
  return <div className="stack">
    {jobs.length>1 && <select value={activeJobId || ""} onChange={e=>setActiveJobId(e.target.value)}>{jobs.map(j=><option key={j.id} value={j.id}>{j.address || j.customer_name}</option>)}</select>}
    {changeOrders.filter(o=>(o.clientStatus || "pending")==="pending").map(o=><div className="panel warning" key={o.id}>
      <h3>Change Order — {o.title || `#${o.id}`}</h3><p>{o.description}</p>{o.amount && <strong>{money(o.amount)}</strong>}
      <div className="button-row"><button className="primary green" disabled={busy} onClick={()=>respondToChangeOrder(o,"approved")}>Approve</button><button className="outline" disabled={busy} onClick={()=>respondToChangeOrder(o,"rejected")}>Decline</button></div>
    </div>)}
    <div className="panel chat-box">
      {messages.length===0 && <div className="empty">No messages yet.</div>}
      {messages.map(m=><div key={m.id} className={`message ${m.sender_role==="client"?"mine":""}`}>
        <div>{m.message}</div><small>{m.sender_name} · {fmtDate(m.created_at)} {fmtTime(m.created_at)}</small>
      </div>)}
    </div>
    <div className="composer"><input value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Type a message…" onKeyDown={e=>e.key==="Enter"&&send()} /><button className="primary" onClick={send} disabled={busy}>Send</button></div>
  </div>;
}

function DocumentsView({ jobs, type }) {
  const [docs,setDocs] = useState([]);
  useEffect(()=>{ (async()=>{
    const ids=jobs.map(j=>j.id); if (!ids.length) return;
    let q=supabase.from("documents").select("*").in("linked_job_id",ids).order("uploaded_at",{ascending:false});
    if (type) q=q.eq("doc_type",type);
    const { data }=await q; setDocs(data || []);
  })(); },[jobs,type]);
  if (!docs.length) return <div className="panel empty">No documents available yet.</div>;
  return <div className="panel doc-list">{docs.map(d=><a key={d.id} href={d.url} target="_blank" rel="noreferrer"><span className="doc-icon">▤</span><div><strong>{d.name || d.description || "Document"}</strong><small>{fmtDate(d.uploaded_at)}</small></div><span>Open</span></a>)}</div>;
}

function ApprovalsView({ jobs, clientName }) {
  return <MessagesView jobs={jobs} clientName={clientName} />;
}

function BillingView({ jobs }) {
  const [invoices,setInvoices]=useState([]);
  useEffect(()=>{ (async()=>{
    const ids=jobs.map(j=>j.id); if (!ids.length) return;
    const { data }=await supabase.from("documents").select("*").eq("doc_type","invoice").in("linked_job_id",ids);
    setInvoices(data || []);
  })(); },[jobs]);
  return <div className="stack">
    {jobs.map(j=><div className="panel" key={j.id}>
      <h3>{j.address || j.customer_name}</h3>
      <div className="bill-row"><span>Deposit {j.deposit_amount ? `— ${money(j.deposit_amount)}`:""}</span><span className={`badge ${j.deposit_paid?"success":"warning-badge"}`}>{j.deposit_paid?"Paid":"Pending"}</span></div>
      <div className="bill-row"><span>Final {j.final_amount ? `— ${money(j.final_amount)}`:""}</span><span className={`badge ${j.final_paid?"success":"warning-badge"}`}>{j.final_paid?"Paid":"Pending"}</span></div>
    </div>)}
    {invoices.length>0 && <div className="panel doc-list"><h3>Invoices</h3>{invoices.map(inv=><a key={inv.id} href={inv.url} target="_blank" rel="noreferrer"><span className="doc-icon">$</span><div><strong>{inv.name || "Invoice"}</strong><small>{fmtDate(inv.uploaded_at)}</small></div><span>{inv.amount ? money(inv.amount) : "Open"}</span></a>)}</div>}
  </div>;
}

function InformationView() {
  return <div className="info-grid">
    {[
      ["Project Contacts","Contact information for your S&H project team."],
      ["Insurance Information","Claim and adjuster information for your projects."],
      ["FAQs","Answers to common restoration and project questions."],
      ["Important Documents","Quick access to important project documents."],
      ["Emergency Help",`For urgent help, call ${PHONE}.`],
      ["Submit a Request","Send a request or question directly to our team."],
    ].map(([t,d])=><div className="panel info-card" key={t}><h3>{t}</h3><p>{d}</p></div>)}
  </div>;
}

function SettingsView({ email }) {
  const [phone,setPhone]=useState(""); const [cellPhone,setCellPhone]=useState(""); const [homePhone,setHomePhone]=useState(""); const [company,setCompany]=useState("");
  const [busy,setBusy]=useState(false); const [toast,setToast]=useState(null);
  async function save() {
    setBusy(true);
    const { error }=await supabase.rpc("client_update_contact_info",{p_phone:phone,p_cell_phone:cellPhone,p_home_phone:homePhone,p_company:company});
    setToast(error?{type:"error",text:error.message}:{type:"ok",text:"Contact info updated."}); setBusy(false);
  }
  return <div className="stack">
    <div className="panel form-panel"><h3>Edit Contact Info</h3>
      <label>Phone</label><input value={phone} onChange={e=>setPhone(e.target.value)} />
      <label>Cell Phone</label><input value={cellPhone} onChange={e=>setCellPhone(e.target.value)} />
      <label>Home Phone</label><input value={homePhone} onChange={e=>setHomePhone(e.target.value)} />
      <label>Company</label><input value={company} onChange={e=>setCompany(e.target.value)} />
      <button className="primary full" onClick={save} disabled={busy}>{busy?"Saving…":"Save Changes"}</button>
      {toast && <div className={`alert ${toast.type==="error"?"error":"success"}`}>{toast.text}</div>}
    </div>
    <div className="panel"><h3>Contact S&H Services</h3><a className="primary inline full" href={`tel:${PHONE_TEL}`}>Call {PHONE}</a></div>
    <button className="outline full" onClick={async()=>{await supabase.auth.signOut(); window.location.reload();}}>Sign Out</button>
  </div>;
}

function AdminShell() {
  const [unlocked,setUnlocked]=useState(false); const [pass,setPass]=useState(""); const [tab,setTab]=useState("invite");
  if (!unlocked) return <div className="admin-shell"><div className="login-card"><h3>STAFF ACCESS</h3><input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Passphrase" /><button className="primary full" onClick={()=>setUnlocked(pass===ADMIN_PASSPHRASE)}>Enter</button></div></div>;
  return <div className="admin-shell"><div className="admin-inner"><h2>STAFF ADMIN TOOLS</h2><div className="admin-tabs">{[["invite","Invite Client"],["auth","Work Authorization"],["visibility","Portal Visibility"]].map(([k,l])=><button className={tab===k?"active":""} key={k} onClick={()=>setTab(k)}>{l}</button>)}</div>{tab==="invite"&&<AdminInvitePanel/>}{tab==="auth"&&<AdminAuthorizationPanel/>}{tab==="visibility"&&<AdminTabVisibilityPanel/>}</div></div>;
}

function ClientApp({ session }) {
  const [jobs,setJobs]=useState([]);
  const [visibleTabs,setVisibleTabs]=useState(null);
  const [view,setView]=useState("dashboard");
  const [openJobId,setOpenJobId]=useState(null);
  const [loading,setLoading]=useState(true);
  const [messages,setMessages]=useState([]);
  const [mobileMenu,setMobileMenu]=useState(false);
  const [profileMenu,setProfileMenu]=useState(false);
  const email=session.user.email;

  useEffect(()=>{ (async()=>{
    const [{data:jobRows},{data:metaRow}] = await Promise.all([
      supabase.from("jobs").select("*").eq("customer_email",email).order("created_at",{ascending:false}),
      supabase.from("client_portal_meta").select("visible_tabs").eq("email",email).maybeSingle(),
    ]);
    const jr=jobRows || []; setJobs(jr);
    setVisibleTabs(metaRow?.visible_tabs?.length ? metaRow.visible_tabs : null);
    if (jr[0]?.id) {
      const { data:m }=await supabase.from("job_messages").select("*").in("job_id",jr.map(x=>x.id)).order("created_at",{ascending:true});
      setMessages(m || []);
    }
    setLoading(false);
  })(); },[email]);

  const allowedTabs = PORTAL_TABS.filter(t=>!visibleTabs || visibleTabs.includes(t.key) || ["dashboard","projects","information"].includes(t.key));
  const clientName=jobs[0]?.customer_name || email?.split("@")[0] || "Client";
  const firstName=clientName.split(" ")[0] || "there";
  const openJob=jobs.find(j=>j.id===openJobId);

  const unread = messages.filter(m=>m.sender_role!=="client").length;
  const pendingApprovals = jobs.reduce((n,j)=>{try{return n+JSON.parse(j.change_orders||"[]").filter(x=>(x.clientStatus||"pending")==="pending").length}catch{return n}},0);

  function navigate(k) {
    if (k==="menu") { setMobileMenu(v=>!v); return; }
    setView(k); setOpenJobId(null); setMobileMenu(false);
  }

  if (loading) return <div className="loading">Loading your projects…</div>;

  return <div className="portal-shell">
    <aside className="desktop-sidebar">
      <div className="sidebar-logo-wrap"><Logo className="sidebar-logo" /></div>
      <nav>
        {allowedTabs.map(t=><button key={t.key} className={view===t.key?"active":""} onClick={()=>navigate(t.key)}>
          <span className="nav-icon">{t.icon}</span><span>{t.label}</span>
          {t.key==="approvals"&&pendingApprovals>0&&<b className="count">{pendingApprovals}</b>}
        </button>)}
      </nav>
      <div className="sidebar-bottom"><div className="restoration-script">Restoration Done Right!</div></div>
    </aside>

    <main className="portal-main">
      <header className="topbar">
        <div className="topbar-left">
          <button className="hamburger" onClick={()=>setMobileMenu(v=>!v)}>☰</button>
          <div><strong>Good morning, {firstName}!</strong><small>Here’s what’s happening with your project.</small></div>
        </div>
        <div className="topbar-actions">
          <button className="icon-button" onClick={()=>navigate("messages")}>◌{unread>0&&<span>{Math.min(unread,9)}</span>}</button>
          <button className="icon-button">♢</button>
          <button className="profile-button" onClick={()=>setProfileMenu(v=>!v)}><div className="profile-avatar">{firstName.slice(0,1).toUpperCase()}</div><div className="profile-copy"><strong>{clientName}</strong><small>Homeowner</small></div><span>⌄</span></button>
          {profileMenu && <div className="profile-menu">
            <button onClick={()=>{setProfileMenu(false); setView("settings")}}>My Profile</button>
            <button onClick={()=>navigate("messages")}>Notifications</button>
            <button onClick={async()=>{await supabase.auth.signOut(); window.location.reload();}} className="signout">Sign Out</button>
          </div>}
        </div>
      </header>

      {mobileMenu && <div className="mobile-menu-sheet">
        {allowedTabs.filter(t=>!["dashboard","projects","billing"].includes(t.key)).map(t=><button key={t.key} onClick={()=>navigate(t.key)}>{t.label}</button>)}
        <button onClick={()=>{setMobileMenu(false);setView("settings")}}>My Profile / Settings</button>
      </div>}

      <section className="workspace">
        <div className="workspace-inner">
          {view==="dashboard"&&<DashboardView jobs={jobs} messages={messages} invoices={[]} onOpenProject={(id)=>{setOpenJobId(id);setView("projects")}} onNavigate={navigate}/>}
          {view==="projects"&&!openJob&&<ProjectsView jobs={jobs} onOpen={setOpenJobId}/>}
          {view==="projects"&&openJob&&<JobDetail job={openJob} onBack={()=>setOpenJobId(null)} onGoMessages={()=>{setOpenJobId(null);setView("messages")}}/>}
          {view==="messages"&&<MessagesView jobs={jobs} clientName={clientName}/>}
          {view==="contents"&&<DocumentsView jobs={jobs}/>}
          {view==="approvals"&&<ApprovalsView jobs={jobs} clientName={clientName}/>}
          {view==="invoices"&&<DocumentsView jobs={jobs} type="invoice"/>}
          {view==="billing"&&<BillingView jobs={jobs}/>}
          {view==="information"&&<InformationView/>}
          {view==="settings"&&<SettingsView email={email}/>}
        </div>
      </section>

      <footer className="desktop-footer"><span>© 2026 S & H Services Spokane LLC. All rights reserved.</span><span>Privacy Policy &nbsp; | &nbsp; Terms of Service</span></footer>

      <nav className="mobile-bottom-nav">
        {MOBILE_TABS.map(t=><button key={t.key} className={view===t.key?"active":""} onClick={()=>navigate(t.key)}>
          <span>{t.icon}{t.key==="messages"&&unread>0&&<b>{Math.min(unread,9)}</b>}</span><small>{t.label}</small>
        </button>)}
      </nav>
    </main>

    <style>{`
      *{box-sizing:border-box} body{margin:0;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:${BRAND.text};background:${BRAND.offWhite}}
      button,input,select{font:inherit} button{cursor:pointer}
      .portal-shell{min-height:100vh;display:flex;background:#fff}
      .desktop-sidebar{width:230px;background:#fff;border-right:1px solid ${BRAND.border};display:flex;flex-direction:column;position:fixed;left:0;top:0;bottom:0;z-index:30;box-shadow:3px 0 18px rgba(8,43,96,.08)}
      .sidebar-logo-wrap{height:178px;display:flex;align-items:center;justify-content:center;border-bottom:1px solid #eef2f7}.sidebar-logo{width:132px;height:132px;object-fit:contain}
      .desktop-sidebar nav{padding:18px 12px;display:flex;flex-direction:column;gap:5px;overflow:auto}.desktop-sidebar nav button{border:0;background:transparent;color:${BRAND.text};min-height:43px;border-radius:8px;padding:0 12px;display:flex;align-items:center;gap:11px;text-align:left;font-size:13px;font-weight:650}.desktop-sidebar nav button:hover{background:#f4f8fd}.desktop-sidebar nav button.active{background:${BRAND.pale};color:${BRAND.navy};font-weight:800;box-shadow:inset 4px 0 ${BRAND.blue}}.nav-icon{width:22px;height:22px;border:1px solid ${BRAND.border};border-radius:5px;display:grid;place-items:center;font-weight:800;color:${BRAND.navy}}.count{margin-left:auto;background:${BRAND.blue};color:#fff;border-radius:99px;min-width:20px;height:20px;display:grid;place-items:center;font-size:10px}.sidebar-bottom{margin-top:auto;padding:18px}.restoration-script{font-family:"Brush Script MT","Segoe Script",cursive;color:${BRAND.blue};font-size:24px;font-weight:700;transform:rotate(-4deg);white-space:nowrap}
      .portal-main{min-height:100vh;display:flex;flex-direction:column;margin-left:230px;width:calc(100% - 230px)}.topbar{height:76px;background:#fff;border-bottom:1px solid ${BRAND.border};display:flex;align-items:center;justify-content:space-between;padding:0 28px;position:sticky;top:0;z-index:25}.topbar-left{display:flex;align-items:center;gap:16px}.topbar-left>div{display:flex;flex-direction:column}.topbar-left strong{font-size:16px}.topbar-left small{font-size:11px;color:${BRAND.muted};margin-top:3px}.hamburger{background:transparent;border:0;font-size:22px;color:${BRAND.text}}.topbar-actions{display:flex;align-items:center;gap:8px;position:relative}.icon-button{width:38px;height:38px;border:0;background:transparent;border-radius:50%;position:relative;font-size:19px;color:${BRAND.navy}}.icon-button:hover{background:#f3f7fc}.icon-button span{position:absolute;right:1px;top:0;background:${BRAND.blue};color:#fff;width:17px;height:17px;border-radius:50%;display:grid;place-items:center;font-size:9px;font-weight:800}.profile-button{border:0;background:transparent;display:flex;align-items:center;gap:9px;padding:4px 7px;border-radius:9px}.profile-button:hover{background:#f6f9fd}.profile-avatar{width:38px;height:38px;border-radius:50%;background:${BRAND.navy};color:#fff;display:grid;place-items:center;font-weight:800}.profile-copy{display:flex;flex-direction:column;text-align:left}.profile-copy strong{font-size:12px}.profile-copy small{font-size:10px;color:${BRAND.muted}}.profile-menu{position:absolute;right:0;top:50px;background:#fff;border:1px solid ${BRAND.border};border-radius:10px;box-shadow:0 12px 30px rgba(8,43,96,.15);min-width:180px;overflow:hidden;z-index:50}.profile-menu button{display:block;width:100%;text-align:left;border:0;background:#fff;padding:11px 14px;font-size:12px}.profile-menu button:hover{background:#f4f8fd}.profile-menu .signout{color:${BRAND.red};border-top:1px solid ${BRAND.border}}
      .workspace{flex:1;background:linear-gradient(rgba(6,43,96,.73),rgba(6,43,96,.83)),url("/blueprint-house-login-inverted.svg") center/cover fixed no-repeat;padding:26px}.workspace-inner{max-width:1450px;margin:0 auto}.page-kicker{color:#fff;font-size:21px;font-weight:850;margin:0 0 14px;text-shadow:0 2px 4px rgba(0,0,0,.15)}
      .metric-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-bottom:14px}.metric-card,.panel,.project-card{background:rgba(255,255,255,.98);border:1px solid rgba(255,255,255,.72);border-radius:11px;box-shadow:0 8px 22px rgba(2,24,61,.14)}.metric-card{padding:18px;min-height:190px;display:flex;flex-direction:column;align-items:flex-start}.metric-icon{width:42px;height:42px;border-radius:50%;background:${BRAND.pale};color:${BRAND.blue};display:grid;place-items:center;font-size:21px;font-weight:900;margin-bottom:10px}.metric-label{font-size:11px;font-weight:800;margin-bottom:12px}.metric-card strong{font-size:18px;color:#102849}.metric-card .big{font-size:23px}.metric-card .blue{color:${BRAND.blue}}.metric-card p{font-size:11px;line-height:1.45;color:${BRAND.text};flex:1}.metric-card small{font-size:9px;color:${BRAND.muted};margin-top:10px}
      .stage-progress{width:100%;margin-top:10px}.stage-row{display:flex;justify-content:space-between;font-size:10px;margin-bottom:5px}.stage-row strong{font-size:10px}.stage-track{height:6px;background:#d7e4f3;border-radius:9px;overflow:hidden}.stage-track>div{height:100%;background:${BRAND.blue};border-radius:9px}
      .primary,.outline{border-radius:7px;padding:9px 13px;font-size:11px;font-weight:800}.primary{border:0;background:${BRAND.blue};color:#fff}.primary:hover{background:${BRAND.navy}}.primary.green{background:${BRAND.green}}.outline{border:1px solid ${BRAND.blue};background:#fff;color:${BRAND.blue}}.outline:hover{background:${BRAND.pale}}.full{width:100%}.inline{display:inline-flex;text-decoration:none;align-items:center;justify-content:center}.back{width:auto}.text-link{background:transparent;border:0;color:${BRAND.blue};font-size:10px;font-weight:800}
      .dash-row{display:grid;grid-template-columns:minmax(0,1.8fr) minmax(280px,.72fr);gap:14px;margin-bottom:14px}.panel{padding:16px}.panel h2,.panel h3{margin:0 0 10px;color:#102849}.panel h2{font-size:20px}.panel h3{font-size:14px}.panel-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.timeline-wrap{display:grid;grid-template-columns:1fr 1.05fr;gap:18px}.timeline-list{padding-left:8px}.timeline-item{position:relative;display:flex;gap:10px;padding:0 0 14px 0}.timeline-item:before{content:"";position:absolute;left:10px;top:18px;bottom:-3px;width:2px;background:#d8e3ef}.timeline-item:last-child:before{display:none}.timeline-dot{width:22px;height:22px;border-radius:50%;background:#edf1f6;border:2px solid #d2dce8;display:grid;place-items:center;font-size:10px;z-index:1}.timeline-item.done .timeline-dot{background:${BRAND.green};border-color:${BRAND.green};color:#fff}.timeline-item.active .timeline-dot{background:#fff;border:3px solid ${BRAND.blue};color:${BRAND.blue}}.timeline-item div{display:flex;flex-direction:column}.timeline-item strong{font-size:11px}.timeline-item small{font-size:9px;color:${BRAND.muted};margin-top:2px}.project-photo{display:flex;flex-direction:column}.photo-placeholder{height:135px;border-radius:9px;background:linear-gradient(145deg,#c9d6e6,#edf3fa);display:grid;place-items:center;color:${BRAND.muted};font-weight:800}.project-photo p{font-size:10px;line-height:1.5}.manager-card{display:flex;flex-direction:column}.manager-avatar{width:52px;height:52px;border-radius:50%;background:${BRAND.pale};display:grid;place-items:center;color:${BRAND.navy};font-weight:900;margin:6px 0}.manager-card>span{font-size:10px;color:${BRAND.muted};margin:2px 0 12px}.manager-contact{font-size:11px;margin:6px 0 16px}.updates{padding:12px 16px}.update-row{display:grid;grid-template-columns:16px 120px 1fr auto;gap:8px;align-items:center;padding:9px 0;border-top:1px solid #e8eef5;font-size:10px}.update-row:first-of-type{border-top:0}.update-row small{color:${BRAND.muted}}.update-dot{color:${BRAND.blue};font-size:18px}
      .project-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.project-card{border:1px solid rgba(255,255,255,.72);padding:18px;text-align:left;color:${BRAND.text};display:grid;grid-template-columns:44px 1fr;gap:12px}.project-card .stage-progress{grid-column:1/-1}.project-card-icon{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:${BRAND.pale};color:${BRAND.blue};font-size:20px}.project-card>div:nth-child(2){display:flex;flex-direction:column;gap:3px}.project-card strong{font-size:14px}.project-card span{font-size:11px;color:${BRAND.muted}}
      .stack{display:flex;flex-direction:column;gap:12px}.warning{background:${BRAND.amberLight};border-color:#f2d49a}.button-row{display:flex;gap:8px;margin-top:12px}.muted{color:${BRAND.muted}}select,input{width:100%;min-height:44px;border:1px solid ${BRAND.border};border-radius:8px;padding:10px 12px;background:#fff;color:${BRAND.text};outline:none}input:focus,select:focus{border-color:${BRAND.blue};box-shadow:0 0 0 3px rgba(20,86,184,.1)}.chat-box{min-height:320px;max-height:460px;overflow:auto}.message{display:flex;flex-direction:column;align-items:flex-start;margin:8px 0}.message>div{max-width:75%;background:#f0f4f8;padding:10px 12px;border-radius:12px;font-size:13px}.message.mine{align-items:flex-end}.message.mine>div{background:${BRAND.navy};color:#fff}.message small{font-size:9px;color:${BRAND.muted};margin-top:3px}.composer{display:grid;grid-template-columns:1fr auto;gap:8px}.doc-list a{display:grid;grid-template-columns:32px 1fr auto;gap:10px;align-items:center;padding:11px 0;border-bottom:1px solid #e7edf5;text-decoration:none;color:${BRAND.text}}.doc-list a:last-child{border-bottom:0}.doc-list a div{display:flex;flex-direction:column}.doc-list small{color:${BRAND.muted};font-size:9px}.doc-icon{width:30px;height:30px;border-radius:7px;background:${BRAND.pale};display:grid;place-items:center;color:${BRAND.blue};font-weight:900}.bill-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-top:1px solid #e8eef5}.badge{display:inline-flex;border-radius:99px;padding:4px 9px;font-size:10px;font-weight:800}.badge.success{background:${BRAND.greenLight};color:${BRAND.green}}.badge.danger{background:${BRAND.redLight};color:${BRAND.red}}.warning-badge{background:${BRAND.amberLight};color:${BRAND.amber}}.info-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.info-card p{font-size:12px;line-height:1.5;color:${BRAND.muted}}.form-panel{display:flex;flex-direction:column;gap:8px}.form-panel label,.login-card label{font-size:11px;font-weight:800;color:${BRAND.navy}}.empty{text-align:center;color:${BRAND.muted};padding:30px}
      .desktop-footer{background:linear-gradient(90deg,${BRAND.navy},${BRAND.blue});color:#fff;padding:14px 24px;display:flex;justify-content:space-between;font-size:9px}.mobile-bottom-nav,.mobile-menu-sheet{display:none}
      .login-shell{min-height:100vh;background:${BRAND.navy} url("/blueprint-house-login-inverted.svg") center/cover no-repeat;position:relative;display:grid;place-items:center;padding:24px}.login-overlay{position:absolute;inset:0;background:linear-gradient(rgba(13,59,128,.2),rgba(4,30,72,.6))}.login-inner{position:relative;width:100%;max-width:410px;text-align:center}.login-logo{width:150px;height:150px;object-fit:contain;filter:drop-shadow(0 6px 14px rgba(0,0,0,.2))}.login-title{color:#fff;font-size:24px;font-weight:900;letter-spacing:.05em;margin-top:8px}.login-tag{color:#fff;font-family:"Brush Script MT","Segoe Script",cursive;font-size:24px;margin:3px 0 18px}.login-card{background:rgba(255,255,255,.97);border-radius:14px;padding:20px;text-align:left;box-shadow:0 12px 30px rgba(0,0,0,.18);display:flex;flex-direction:column;gap:8px}.link-btn{border:0;background:transparent;color:${BRAND.blue};font-size:11px;text-decoration:underline;padding:5px}.alert{padding:9px 11px;border-radius:7px;font-size:11px;margin-top:4px}.alert.error{background:${BRAND.redLight};color:${BRAND.red}}.alert.success{background:${BRAND.greenLight};color:${BRAND.green}}.login-help{color:#fff;font-size:11px;margin-top:14px}.loading,.admin-shell{min-height:100vh;display:grid;place-items:center;background:${BRAND.offWhite};color:${BRAND.muted}.admin-inner{max-width:720px;width:100%;padding:20px}.admin-tabs{display:flex;gap:8px;margin-bottom:14px}.admin-tabs button{border:1px solid ${BRAND.border};background:#fff;border-radius:99px;padding:8px 12px}.admin-tabs button.active{background:${BRAND.navy};color:#fff}
      @media(max-width:1100px){.metric-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.dash-row{grid-template-columns:1fr}.desktop-sidebar{width:210px}.portal-main{margin-left:210px;width:calc(100% - 210px)}}
      @media(max-width:767px){
        .desktop-sidebar,.desktop-footer{display:none}.portal-main{margin-left:0;width:100%;padding-bottom:70px}.topbar{height:auto;min-height:92px;padding:12px 14px;align-items:flex-start}.topbar-left{align-items:flex-start}.topbar-left>div{margin-top:45px;margin-left:-46px}.topbar-left strong{font-size:16px}.topbar-left small{font-size:12px;max-width:210px;line-height:1.45}.hamburger{font-size:21px;margin-top:4px}.profile-copy,.profile-button>span{display:none}.profile-avatar{width:34px;height:34px}.icon-button{width:34px;height:34px}.workspace{padding:14px 12px 86px;background:linear-gradient(rgba(255,255,255,.88),rgba(255,255,255,.92)),url("/blueprint-house.svg") center top/cover fixed no-repeat}.page-kicker{display:none}.metric-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.metric-card{min-height:135px;padding:13px}.metric-card:nth-child(5){grid-column:1/-1}.metric-icon{width:34px;height:34px;font-size:16px;margin-bottom:6px}.metric-label{font-size:9px;margin-bottom:8px}.metric-card strong{font-size:15px}.metric-card .big{font-size:20px}.metric-card p{font-size:10px;margin:7px 0}.metric-card button{font-size:9px;padding:7px 9px}.stage-row strong,.stage-row span{font-size:8px}.stage-track{height:5px}.dash-row{display:block}.manager-card{display:none}.timeline-wrap{display:block}.project-photo{display:none}.updates{display:none}.timeline-panel{margin-top:10px}.timeline-panel .panel-head h3{font-size:15px}.timeline-item strong{font-size:11px}.timeline-item small{font-size:9px}.project-grid{grid-template-columns:1fr}.info-grid{grid-template-columns:1fr}.mobile-bottom-nav{position:fixed;left:0;right:0;bottom:0;height:66px;background:linear-gradient(90deg,${BRAND.navy},${BRAND.blue});display:flex;z-index:40;padding-bottom:max(4px,env(safe-area-inset-bottom))}.mobile-bottom-nav button{flex:1;border:0;background:transparent;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;opacity:.8}.mobile-bottom-nav button.active{opacity:1}.mobile-bottom-nav button>span{font-size:18px;position:relative}.mobile-bottom-nav small{font-size:9px;font-weight:700}.mobile-bottom-nav b{position:absolute;right:-9px;top:-6px;background:#fff;color:${BRAND.blue};width:16px;height:16px;border-radius:50%;display:grid;place-items:center;font-size:8px}.mobile-menu-sheet{display:flex;position:fixed;left:12px;right:12px;bottom:76px;background:#fff;border:1px solid ${BRAND.border};border-radius:12px;box-shadow:0 15px 35px rgba(7,43,97,.2);padding:8px;flex-direction:column;z-index:55}.mobile-menu-sheet button{border:0;background:#fff;padding:11px 12px;text-align:left;border-bottom:1px solid #eef2f7}.mobile-menu-sheet button:last-child{border-bottom:0}.profile-menu{right:5px;top:42px}.chat-box{min-height:300px}.message>div{max-width:88%}
      }
    `}</style>
  </div>;
}

export default function App() {
  const hash = useHashRoute();
  const [session,setSession]=useState(undefined);
  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>setSession(data.session));
    const {data:sub}=supabase.auth.onAuthStateChange((_evt,sess)=>setSession(sess));
    return ()=>sub.subscription.unsubscribe();
  },[]);
  if (hash==="#admin") return <AdminShell />;
  if (hash.startsWith("#auth/")) return <AuthorizationRouteScreen authCode={hash.replace("#auth/","")} />;
  if (session===undefined) return <div style={{minHeight:"100vh"}}/>;
  if (!session) return <LoginScreen />;
  return <ClientApp session={session}/>;
}
