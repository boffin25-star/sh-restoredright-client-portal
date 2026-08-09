import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://bhofebvgpsozpubefzvx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJob2ZlYnZncHNvenB1YmVmenZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MjE2MzgsImV4cCI6MjA5NzM5NzYzOH0.1pLDZUpEFoOBQDbwEcX1sFTVXZ80e2NLM6cSKGjYmk4";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ALL_TABS = [
  ["dashboard","Dashboard"],["projects","Projects"],["contents","My Contents"],
  ["approvals","Approval Requests"],["invoices","Invoices"],["billing","My Bill"],
  ["information","Information"]
];

export function AdminTabVisibilityPanel() {
  const [clients,setClients]=useState([]);
  const [loading,setLoading]=useState(true);
  const [status,setStatus]=useState("");

  async function load() {
    setLoading(true);
    const {data,error}=await supabase.from("client_portal_meta").select("email,visible_tabs,invited_at").order("invited_at",{ascending:false});
    if (error) setStatus(error.message);
    setClients(data || []); setLoading(false);
  }
  useEffect(()=>{load()},[]);

  async function save(email,tabs) {
    const {error}=await supabase.from("client_portal_meta").update({visible_tabs:tabs}).eq("email",email);
    if (error) return setStatus(error.message);
    setClients(x=>x.map(c=>c.email===email?{...c,visible_tabs:tabs}:c));
    setStatus("Saved.");
  }

  if (loading) return <div>Loading clients…</div>;
  return <div style={{display:"grid",gap:12}}>
    {status && <div style={{fontSize:13}}>{status}</div>}
    {clients.map(c=>{
      const active=c.visible_tabs?.length?c.visible_tabs:ALL_TABS.map(x=>x[0]);
      return <div key={c.email} style={{background:"#fff",border:"1px solid #D7E2F0",borderRadius:12,padding:14}}>
        <strong style={{display:"block",marginBottom:10,color:"#0D3B80"}}>{c.email}</strong>
        <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
          {ALL_TABS.map(([key,label])=>{
            const on=active.includes(key);
            return <button key={key} onClick={()=>save(c.email,on?active.filter(k=>k!==key):[...active,key])}
              style={{border:`1px solid ${on?"#16A34A":"#D7E2F0"}`,background:on?"#F0FDF4":"#F7F9FC",color:on?"#15803D":"#66768D",borderRadius:99,padding:"7px 10px",fontSize:11,fontWeight:700}}>
              {label}
            </button>
          })}
        </div>
      </div>
    })}
  </div>;
}
