import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Activity, ArrowDownRight, ArrowUpRight, Bell, Building2, Check, ChevronDown, CircleHelp, CreditCard, Download, FilePlus2, FileText, IndianRupee, LayoutDashboard, LogOut, Mail, Menu, MoreHorizontal, Plus, Search, Settings, ShieldCheck, Sparkles, Users, Wallet, X } from "lucide-react";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const supabase: SupabaseClient | null = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
type Customer = { id: string; name: string; email?: string | null; gstin?: string | null; phone?: string | null };
type Invoice = { id: string; invoice_number: string; status: string; total: number; issue_date: string; customer_snapshot?: { name?: string } };
type Business = { id: string; legal_name: string; display_name?: string | null; owner_id: string };
const money = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
const sampleCustomers: Customer[] = [{id:"demo-1",name:"Aarav Retail",email:"accounts@aaravretail.in",gstin:"33ABCDE1234F1Z5"},{id:"demo-2",name:"BlueOak Studio",email:"finance@blueoak.in",gstin:"29FGHIJ5678K1Z2"},{id:"demo-3",name:"Kaveri Foods",email:"billing@kaverifoods.in",gstin:"33LMNOP9012Q1Z7"}];
const sampleInvoices: Invoice[] = [{id:"i1",invoice_number:"GB-2026-041",status:"paid",total:24800,issue_date:"2026-11-12",customer_snapshot:{name:"Aarav Retail"}},{id:"i2",invoice_number:"GB-2026-040",status:"sent",total:15600,issue_date:"2026-11-11",customer_snapshot:{name:"BlueOak Studio"}},{id:"i3",invoice_number:"GB-2026-039",status:"overdue",total:8200,issue_date:"2026-11-06",customer_snapshot:{name:"Kaveri Foods"}},{id:"i4",invoice_number:"GB-2026-038",status:"paid",total:32400,issue_date:"2026-11-02",customer_snapshot:{name:"Aarav Retail"}}];
type Tab = "Overview" | "Invoices" | "Customers" | "Payments" | "Settings";
export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [authReady, setAuthReady] = useState(!supabase);
  const [email, setEmail] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [tab, setTab] = useState<Tab>("Overview");
  const [business, setBusiness] = useState<Business | null>(null);
  const [customers, setCustomers] = useState<Customer[]>(supabase ? [] : sampleCustomers);
  const [invoices, setInvoices] = useState<Invoice[]>(supabase ? [] : sampleInvoices);
  const [showCustomer, setShowCustomer] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showBusiness, setShowBusiness] = useState(false);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const demo = !supabase;

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({data}) => { setSession(data.session); setAuthReady(true); });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_event, s) => { setSession(s); setAuthReady(true); });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !session?.user) return;
    let active = true;
    (async () => {
      const {data: biz, error: bizError} = await supabase.from("businesses").select("id,legal_name,display_name,owner_id").order("created_at", {ascending:true}).limit(1).maybeSingle();
      if (!active) return;
      if (bizError) { setError(bizError.message); return; }
      if (!biz) { setShowBusiness(true); return; }
      setBusiness(biz);
      const [c, i] = await Promise.all([
        supabase.from("customers").select("id,name,email,gstin,phone").eq("business_id", biz.id).order("created_at",{ascending:false}).limit(100),
        supabase.from("invoices").select("id,invoice_number,status,total,issue_date,customer_snapshot").eq("business_id", biz.id).order("created_at",{ascending:false}).limit(100)
      ]);
      if (!active) return;
      if (c.error) setError(c.error.message); else setCustomers(c.data || []);
      if (i.error) setError(i.error.message); else setInvoices(i.data || []);
    })();
    return () => { active = false; };
  }, [session]);

  const filteredInvoices = useMemo(() => invoices.filter(i => (i.invoice_number + " " + (i.customer_snapshot?.name || "")).toLowerCase().includes(search.toLowerCase())), [invoices, search]);
  const totalCollected = invoices.filter(i => i.status === "paid").reduce((s,i)=>s+Number(i.total),0);
  const outstanding = invoices.filter(i => ["sent","overdue"].includes(i.status)).reduce((s,i)=>s+Number(i.total),0);
  const setErr = (e: any) => setError(e?.message || "Something went wrong. Please try again.");

  async function signIn(e: FormEvent) {
    e.preventDefault(); if (!supabase) return;
    setBusy(true); setAuthMessage("");
    const {error} = await supabase.auth.signInWithOtp({email, options:{emailRedirectTo:window.location.origin}});
    setBusy(false); if (error) setErr(error); else setAuthMessage("Check your inbox for the secure sign-in link.");
  }
  async function signOut() { if (supabase) await supabase.auth.signOut(); setSession(null); }
  async function createBusiness(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const fd=new FormData(e.currentTarget); const name=String(fd.get("name")||"").trim();
    if (!name) return; if (demo) { setBusiness({id:"demo-business",legal_name:name,owner_id:"demo"}); setShowBusiness(false); return; }
    if (!supabase || !session?.user) return;
    setBusy(true);
    const {data,error}=await supabase.from("businesses").insert({owner_id:session.user.id,legal_name:name,display_name:name,address:{},invoice_prefix:"GB",financial_year_start_month:4}).select("id,legal_name,display_name,owner_id").single();
    setBusy(false); if(error){setErr(error);return;} setBusiness(data);setShowBusiness(false);
  }
  async function addCustomer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const fd=new FormData(e.currentTarget); const name=String(fd.get("name")||"").trim(); if(!name)return;
    const row={id:"local-"+Date.now(),name,email:String(fd.get("email")||""),gstin:String(fd.get("gstin")||"")};
    if (!demo && supabase && business) {
      setBusy(true); const {data,error}=await supabase.from("customers").insert({business_id:business.id,name,email:row.email||null,gstin:row.gstin||null,billing_address:{}}).select("id,name,email,gstin,phone").single(); setBusy(false);
      if(error){setErr(error);return;} setCustomers(v=>[data,...v]);
    } else setCustomers(v=>[row,...v]);
    setShowCustomer(false);
  }
  async function addInvoice(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const fd=new FormData(e.currentTarget); const customer=customers.find(c=>c.id===String(fd.get("customer"))); const amount=Number(fd.get("amount")||0); const rate=Number(fd.get("rate")||0);
    if(!customer || amount<=0)return;
    const tax=amount*rate/100; const intra=String(fd.get("supply"))!=="inter_state";
    const row: Invoice={id:"local-"+Date.now(),invoice_number:"GB-"+new Date().getFullYear()+"-"+String(invoices.length+1).padStart(3,"0"),status:"draft",total:amount+tax,issue_date:new Date().toISOString().slice(0,10),customer_snapshot:{name:customer.name}};
    if(!demo && supabase && business && session?.user) {
      const {data:biz}=await supabase.from("businesses").select("state_code").eq("id",business.id).maybeSingle();
      setBusy(true);
      const payload={business_id:business.id,customer_id:customer.id,invoice_number:row.invoice_number,status:"draft",issue_date:row.issue_date,currency:"INR",supply_type:intra?"intra_state":"inter_state",reverse_charge:false,subtotal:amount,cgst:intra?tax/2:0,sgst:intra?tax/2:0,igst:intra?0:tax,cess:0,total:row.total,supplier_snapshot:{legal_name:business.legal_name,state_code:biz?.state_code||null},customer_snapshot:{name:customer.name,gstin:customer.gstin||null},created_by:session.user.id};
      const {data,error}=await supabase.from("invoices").insert(payload).select("id,invoice_number,status,total,issue_date,customer_snapshot").single();
      setBusy(false); if(error){setErr(error);return;} setInvoices(v=>[data,...v]);
    } else setInvoices(v=>[row,...v]);
    setShowInvoice(false);
  }

  if (showLanding) return <Landing onStart={() => setShowLanding(false)} />;
  if (!authReady) return <div className="loading">Preparing your workspace…</div>;
  if (supabase && !session) return <main className="auth-shell"><div className="auth-card"><Brand/><span className="eyebrow">YOUR BILLING WORKSPACE</span><h1>Welcome back.</h1><p>Sign in with a secure email link to manage your business invoices.</p><form onSubmit={signIn} className="stack"><label>Email address<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.in"/></label><button className="primary full" disabled={busy}>{busy?"Sending link…":"Email me a sign-in link"} <ArrowUpRight size={16}/></button></form>{authMessage&&<div className="success-note"><Check size={16}/>{authMessage}</div>}{error&&<div className="error-note">{error}</div>}<small>Secure authentication powered by Supabase Auth.</small></div></main>;

  return <div className="app-shell">
    <aside className="sidebar"><Brand/><div className="workspace-switch"><div className="workspace-icon"><Building2 size={17}/></div><div><b>{business?.display_name||business?.legal_name||"My workspace"}</b><small>Business workspace</small></div><ChevronDown size={15}/></div>
      <span className="nav-label">WORKSPACE</span><nav>{(["Overview","Invoices","Customers","Payments"] as Tab[]).map((t,i)=><button key={t} className={tab===t?"nav-item active":"nav-item"} onClick={()=>setTab(t)}>{[<LayoutDashboard/>,<FileText/>,<Users/>,<Wallet/>][i]}{t}{t==="Invoices"&&<span className="nav-count">{invoices.length}</span>}</button>)}</nav>
      <span className="nav-label nav-bottom-label">PREFERENCES</span><button className={"nav-item "+(tab==="Settings"?"active":"")} onClick={()=>setTab("Settings")}><Settings/>Settings</button>
      <div className="sidebar-bottom"><div className="plan-card"><div className="plan-top"><Sparkles size={15}/> <b>Starter plan</b><span>25 / mo</span></div><div className="progress"><i style={{width:Math.min(100,invoices.length/25*100)+"%"}}/></div><small>{invoices.length} of 25 invoices used</small><a href="#pricing" onClick={()=>setTab("Settings")}>Explore plans <ArrowUpRight size={13}/></a></div><button className="profile-row" onClick={signOut}><div className="avatar">{(session?.user?.email||"A").slice(0,1).toUpperCase()}</div><div><b>{session?.user?.email||"Demo account"}</b><small>{demo?"Preview mode":"Signed in"}</small></div><LogOut size={16}/></button></div>
    </aside>
    <main className="main-area"><header className="topbar"><div className="crumb">Workspace <span>/</span> <b>{tab}</b></div><div className="top-actions"><span className="date-label">{new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</span><button className="icon-button" aria-label="Notifications"><Bell size={18}/><i/></button><div className="avatar small-avatar">{(session?.user?.email||"A").slice(0,1).toUpperCase()}</div></div></header>
      {demo&&<div className="demo-banner"><Sparkles size={15}/><span><b>Interactive preview</b> — sample data is local to this browser. Connect Supabase to use real accounts and records.</span><a href="https://github.com/ARUNAGIRI011/saas-starter/tree/main/frontend">Setup guide <ArrowUpRight size={13}/></a></div>}
      {error&&<div className="error-banner"><span>{error}</span><button onClick={()=>setError("")}><X size={16}/></button></div>}
      {tab==="Overview"&&<><section className="page-heading"><div><span className="eyebrow">BUSINESS OVERVIEW</span><h1>Good morning{session?.user?.email?", welcome back":""} <span>✦</span></h1><p>Here’s what’s happening with your business today.</p></div><button className="primary" onClick={()=>customers.length?setShowInvoice(true):setShowCustomer(true)}><Plus size={17}/> Create invoice</button></section>
        <section className="metric-grid"><Metric label="Total collected" value={money(totalCollected)} change="Paid invoices" icon={<IndianRupee/>} tone="green"/><Metric label="Outstanding" value={money(outstanding)} change="Awaiting payment" icon={<Wallet/>} tone="orange"/><Metric label="Total invoices" value={String(invoices.length)} change="Across all statuses" icon={<FileText/>} tone="blue"/><Metric label="Customers" value={String(customers.length)} change="In your directory" icon={<Users/>} tone="purple"/></section>
        <section className="content-grid"><div className="panel invoice-panel"><div className="panel-heading"><div><h2>Recent invoices</h2><p>Track your latest billing activity</p></div><button className="text-button" onClick={()=>setTab("Invoices")}>View all <ArrowUpRight size={14}/></button></div><InvoiceTable invoices={invoices.slice(0,5)}/></div>
          <div className="right-stack"><div className="panel quick-panel"><div className="panel-heading"><div><h2>Quick actions</h2><p>Get work done faster</p></div><MoreHorizontal size={18}/></div><button onClick={()=>setShowInvoice(true)}><span className="quick-icon purple"><FilePlus2/></span><span><b>New invoice</b><small>Create a GST invoice</small></span><ArrowUpRight/></button><button onClick={()=>setShowCustomer(true)}><span className="quick-icon blue"><Users/></span><span><b>Add customer</b><small>Grow your directory</small></span><ArrowUpRight/></button><button onClick={()=>setTab("Payments")}><span className="quick-icon green"><CreditCard/></span><span><b>View payments</b><small>Check collections</small></span><ArrowUpRight/></button></div>
          <div className="tip-card"><div className="tip-spark"><Sparkles size={17}/></div><b>Keep your books tidy</b><p>Send invoices promptly and follow up on outstanding payments to keep cash flow healthy.</p><button onClick={()=>setTab("Invoices")}>Review invoices <ArrowUpRight size={14}/></button></div></div></section>
      </>}
      {tab==="Invoices"&&<section className="page-section"><div className="page-heading"><div><span className="eyebrow">BILLING</span><h1>Invoices</h1><p>Create, manage and track your customer invoices.</p></div><button className="primary" onClick={()=>customers.length?setShowInvoice(true):setShowCustomer(true)}><Plus size={17}/> New invoice</button></div><div className="panel table-panel"><div className="table-toolbar"><div className="search-box"><Search size={16}/><input placeholder="Search invoice or customer…" value={search} onChange={e=>setSearch(e.target.value)}/></div><span>{filteredInvoices.length} invoices</span></div><InvoiceTable invoices={filteredInvoices}/></div></section>}
      {tab==="Customers"&&<section className="page-section"><div className="page-heading"><div><span className="eyebrow">RELATIONSHIPS</span><h1>Customers</h1><p>Your customer directory, all in one place.</p></div><button className="primary" onClick={()=>setShowCustomer(true)}><Plus size={17}/> Add customer</button></div><div className="panel table-panel"><div className="table-toolbar"><b>{customers.length} customers</b></div><div className="customer-list">{customers.map(c=><div className="customer-row" key={c.id}><div className="customer-avatar">{c.name.slice(0,1).toUpperCase()}</div><div className="customer-main"><b>{c.name}</b><small>{c.email||"No email added"}</small></div><span className="gstin">{c.gstin||"GSTIN not added"}</span><button className="icon-button"><MoreHorizontal size={18}/></button></div>)}</div>{!customers.length&&<Empty title="No customers yet" text="Add your first customer to start creating invoices." action={()=>setShowCustomer(true)}/>}</div></section>}
      {tab==="Payments"&&<section className="page-section"><div className="page-heading"><div><span className="eyebrow">CASH FLOW</span><h1>Payments</h1><p>Monitor payment status across your invoices.</p></div></div><div className="metric-grid two"><Metric label="Collected" value={money(totalCollected)} change="Invoices marked paid" icon={<Wallet/>} tone="green"/><Metric label="Pending collection" value={money(outstanding)} change="Sent or overdue invoices" icon={<Activity/>} tone="orange"/></div><div className="panel table-panel"><InvoiceTable invoices={invoices.filter(i=>i.status!=="draft")}/><div className="notice">Payment gateway integration is not enabled yet. This view reflects invoice status only; it does not confirm bank or UPI settlement.</div></div></section>}
      {tab==="Settings"&&<section className="page-section"><div className="page-heading"><div><span className="eyebrow">PREFERENCES</span><h1>Settings</h1><p>Manage your business and subscription preferences.</p></div></div><div className="settings-grid"><div className="panel setting-panel"><Building2/><h3>Business profile</h3><p>{business?.legal_name||"Set up your business profile to personalize invoices."}</p><button className="secondary" onClick={()=>setShowBusiness(true)}> {business?"Edit business profile":"Set up business"} </button></div><div className="panel setting-panel"><ShieldCheck/><h3>Account & security</h3><p>{demo?"Preview-only session.":"Signed in securely using Supabase Auth."}</p>{!demo&&<button className="secondary" onClick={signOut}>Sign out</button>}</div><div className="panel setting-panel" id="pricing"><Sparkles/><h3>Choose your plan</h3><p>Starter ₹199 · Pro ₹499 · Business ₹999 per month. Proposed pricing; checkout is not enabled yet.</p><button className="secondary" onClick={()=>setAuthMessage("Subscription checkout will be enabled after Razorpay integration.")}>View plans</button></div><div className="panel setting-panel"><CircleHelp/><h3>Help & support</h3><p>Need help with your billing workflow?</p><a className="secondary link-button" href="mailto:support@gstinvoicebuddy.in">Contact support <ArrowUpRight size={14}/></a></div></div></section>}
      <footer className="footer"><span>© 2026 GST Invoice Buddy</span><span>Made for Indian small businesses <span className="footer-dot">•</span> <a href="https://github.com/ARUNAGIRI011/saas-starter">Open source project</a></span></footer>
    </main>
    {showCustomer&&<Modal title="Add a customer" subtitle="Save customer details for faster invoicing" close={()=>setShowCustomer(false)}><form className="stack" onSubmit={addCustomer}><label>Customer / business name<input name="name" required placeholder="e.g. Acme Traders"/></label><label>Email address<input name="email" type="email" placeholder="accounts@business.in"/></label><label>GSTIN <span className="optional">Optional</span><input name="gstin" maxLength={15} placeholder="15-character GSTIN"/></label><div className="modal-actions"><button type="button" className="secondary" onClick={()=>setShowCustomer(false)}>Cancel</button><button className="primary" disabled={busy}>{busy?"Saving…":"Save customer"}</button></div></form></Modal>}
    {showInvoice&&<Modal title="Create an invoice" subtitle="Start a draft invoice for your customer" close={()=>setShowInvoice(false)}><form className="stack" onSubmit={addInvoice}><label>Customer<select name="customer" required defaultValue=""><option value="" disabled>Select customer</option>{customers.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label><div className="form-row"><label>Taxable amount (₹)<input name="amount" type="number" min="1" step="0.01" required placeholder="10000"/></label><label>GST rate<select name="rate" defaultValue="18"><option value="0">0%</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option><option value="28">28%</option></select></label></div><label>Supply type<select name="supply" defaultValue="intra_state"><option value="intra_state">Within same state (CGST + SGST)</option><option value="inter_state">Inter-state (IGST)</option></select></label><div className="notice">Draft calculation preview only. Confirm HSN/SAC, classification, place of supply and applicable GST rules before issuing a statutory invoice.</div><div className="modal-actions"><button type="button" className="secondary" onClick={()=>setShowInvoice(false)}>Cancel</button><button className="primary" disabled={busy}>{busy?"Saving…":"Save draft invoice"}</button></div></form></Modal>}
    {showBusiness&&<Modal title="Set up your business" subtitle="Add the legal name to personalize your workspace" close={()=>setShowBusiness(false)}><form className="stack" onSubmit={createBusiness}><label>Legal business name<input name="name" required defaultValue={business?.legal_name||""} placeholder="Your registered business name"/></label><div className="notice">More business details such as GSTIN, address and state can be configured in the next setup step.</div><div className="modal-actions"><button type="button" className="secondary" onClick={()=>setShowBusiness(false)}>Cancel</button><button className="primary" disabled={busy}>{busy?"Saving…":"Save business"}</button></div></form></Modal>}
  </div>;
}
function Brand(){return <div className="brand"><div className="brand-mark"><FileText size={19}/></div><div><b>invoice<span>buddy</span></b><small>GST billing, simplified</small></div></div>}
function Metric({label,value,change,icon,tone}:{label:string;value:string;change:string;icon:any;tone:string}){return <div className="metric-card"><div className="metric-top"><span>{label}</span><span className={"metric-icon "+tone}>{icon}</span></div><strong>{value}</strong><small>{change}</small></div>}
function InvoiceTable({invoices}:{invoices:Invoice[]}){return <div className="table-wrap"><table><thead><tr><th>INVOICE</th><th>CUSTOMER</th><th>DATE</th><th>AMOUNT</th><th>STATUS</th><th></th></tr></thead><tbody>{invoices.map(i=><tr key={i.id}><td><b className="invoice-number">{i.invoice_number}</b></td><td>{i.customer_snapshot?.name||"Customer"}</td><td>{new Date(i.issue_date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</td><td><b>{money(Number(i.total))}</b></td><td><span className={"status "+i.status}>{i.status}</span></td><td><button className="icon-button"><MoreHorizontal size={17}/></button></td></tr>)}</tbody></table>{!invoices.length&&<div className="empty-inline">No invoices yet. Create your first draft to get started.</div>}</div>}
function Empty({title,text,action}:{title:string;text:string;action:()=>void}){return <div className="empty"><FileText size={25}/><b>{title}</b><p>{text}</p><button className="secondary" onClick={action}><Plus size={15}/> Get started</button></div>}
function Modal({title,subtitle,close,children}:{title:string;subtitle:string;close:()=>void;children:ReactNode}){return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><div className="modal"><div className="modal-head"><div><h2>{title}</h2><p>{subtitle}</p></div><button className="icon-button" onClick={close}><X/></button></div>{children}</div></div>}

function Landing({onStart}:{onStart:()=>void}) {
  return <div className="landing">
    <header className="landing-nav"><Brand/><nav><a href="#features">Features</a><a href="#how">How it works</a><a href="#pricing">Pricing</a></nav><div><button className="nav-login" onClick={onStart}>Sign in</button><button className="primary" onClick={onStart}>Get started <ArrowUpRight size={15}/></button></div></header>
    <section className="hero"><div className="hero-copy"><span className="hero-pill"><Sparkles size={13}/> Simple GST billing for growing businesses</span><h1>Less time on billing.<br/><em>More time to grow.</em></h1><p>Create professional GST invoices, keep customer details organized and track payments — all from one calm, simple workspace.</p><div className="hero-actions"><button className="primary large" onClick={onStart}>Explore the workspace <ArrowUpRight size={16}/></button><a href="#features">See what you can do <ArrowDownRight size={15}/></a></div><div className="hero-proof"><div className="proof-avatars"><i>A</i><i>K</i><i>R</i></div><span>Built for India's freelancers, shops and small businesses</span></div></div>
      <div className="hero-visual"><div className="visual-glow"></div><div className="preview-window"><div className="preview-top"><span></span><span></span><span></span><b>Invoice overview</b><small>GST Invoice Buddy</small></div><div className="preview-body"><div className="preview-greeting"><div><small>MONDAY, 13 NOVEMBER</small><b>Your business at a glance</b></div><span>•••</span></div><div className="preview-stats"><div><small>Total collected</small><b>₹1,24,800</b><i>↗ This month</i></div><div><small>Outstanding</small><b>₹32,400</b><i className="warm">Awaiting payment</i></div></div><div className="preview-invoices"><div className="preview-invoice-head"><b>Recent invoices</b><small>View all →</small></div>{[["INV-041","Aarav Retail","₹24,800","Paid"],["INV-040","BlueOak Studio","₹15,600","Sent"],["INV-039","Kaveri Foods","₹8,200","Overdue"]].map((r,i)=><div className="preview-invoice" key={i}><span className="mini-doc"><FileText size={14}/></span><span><b>{r[0]}</b><small>{r[1]}</small></span><strong>{r[2]}</strong><i className={"mini-status s"+i}>{r[3]}</i></div>)}</div><div className="preview-footer"><span><ShieldCheck size={13}/> Your workspace, organized</span><span>INR ₹</span></div></div></div><div className="float-chip chip-one"><span>✓</span> Invoice created</div><div className="float-chip chip-two"><IndianRupee size={15}/> Payments at a glance</div></div>
    </section>
    <section className="trust-strip"><span>MADE FOR EVERYDAY BUSINESS</span><b>Freelancers</b><i>•</i><b>Retail & shops</b><i>•</i><b>Consultants</b><i>•</i><b>Service teams</b></section>
    <section className="landing-features" id="features"><div className="section-intro"><span className="eyebrow">A CLEARER WAY TO BILL</span><h2>Everything you need.<br/><em>Nothing you don't.</em></h2><p>Spend less time managing paperwork and more time serving your customers.</p></div><div className="feature-grid"><Feature icon={<FileText/>} title="GST-ready invoices" text="Prepare clear invoices with line items, tax splits and customer details. Review before issuing."/><Feature icon={<Users/>} title="Customer directory" text="Keep customer contacts and GSTIN details together. Reuse them on your next invoice."/><Feature icon={<Wallet/>} title="Payment visibility" text="See what has been marked paid, what is pending and which invoices need a follow-up."/><Feature icon={<Mail/>} title="Share with ease" text="Designed for a simple invoice-sharing workflow, with email delivery planned next."/><Feature icon={<Activity/>} title="Business overview" text="Understand collections, outstanding amounts and invoice activity in one glance."/><Feature icon={<LanguagesIcon/>} title="Made for India" text="INR-first experience with a roadmap for Indian languages and localized documents."/></div></section>
    <section className="how-section" id="how"><div className="section-intro"><span className="eyebrow">GET STARTED IN MINUTES</span><h2>From details to draft.<br/><em>Three simple steps.</em></h2></div><div className="steps-grid"><div><span>01</span><b>Set up your business</b><p>Add your business name and profile details to personalize your workspace.</p></div><div><span>02</span><b>Add your customers</b><p>Save customer contact and GSTIN details once, then reuse them for billing.</p></div><div><span>03</span><b>Create an invoice</b><p>Add items, review tax details and save a draft ready for your checks.</p></div></div></section>
    <section className="pricing-section" id="pricing"><div className="section-intro"><span className="eyebrow">SIMPLE, TRANSPARENT PLANS</span><h2>Choose room to <em>grow.</em></h2><p>Proposed launch pricing. Payment checkout will be enabled after provider integration.</p></div><div className="pricing-grid">{[["Starter","₹199","25 invoices / month","Customer directory","Basic invoice workflow"],["Pro","₹499","Unlimited invoices","Automatic GST calculations","Invoice payment options"],["Business","₹999","Multi-user access","API access","Business analytics"]].map((p,i)=><div className={"price-card "+(i===1?"featured":"")} key={p[0]}>{i===1&&<span className="popular">MOST POPULAR</span>}<b>{p[0]}</b><div className="price">{p[1]}<small>/ month</small></div><p>For {["getting started","growing businesses","teams that scale"][i]}</p><ul>{p.slice(2).map(v=><li key={v}><Check size={14}/>{v}</li>)}</ul><button className={i===1?"primary":"secondary"} onClick={onStart}>Get started <ArrowUpRight size={14}/></button></div>)}</div><small className="price-note">Prices are proposed. Gateway fees, applicable taxes and plan terms will be shown before checkout.</small></section>
    <section className="cta-band"><div><span className="eyebrow">YOUR NEXT INVOICE STARTS HERE</span><h2>Make billing feel<br/>like the easy part.</h2><p>Open your workspace and explore the simple way to manage invoices.</p></div><button className="primary large" onClick={onStart}>Open GST Invoice Buddy <ArrowUpRight size={16}/></button></section>
    <footer className="landing-footer"><Brand/><span>© 2026 GST Invoice Buddy. Built for Indian small businesses.</span><a href="https://github.com/ARUNAGIRI011/saas-starter">GitHub <ArrowUpRight size={13}/></a></footer>
  </div>;
}
function Feature({icon,title,text}:{icon:ReactNode;title:string;text:string}){return <div className="feature-card"><span>{icon}</span><b>{title}</b><p>{text}</p></div>}
function LanguagesIcon(){return <span className="lang-glyph">அ</span>}
