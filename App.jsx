import React, { useState, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";

const PASS = "123456789zZ";
const DOW_S = ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"];
const DOW_F = ["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"];
const PVZ_COLORS = ["#3b82f6","#10b981","#f59e0b","#ec4899","#8b5cf6"];

const DEMO = [
  { id:1, name:"ПВЗ Центр",     color:"#3b82f6", history:[45,52,38,61,73,82,70,55,63,48,72,85,91,78] },
  { id:2, name:"ПВЗ Северный",  color:"#10b981", history:[28,35,22,40,48,55,44,32,39,28,45,52,58,48] },
  { id:3, name:"ПВЗ Южный",     color:"#f59e0b", history:[15,19,12,22,28,32,24,18,22,15,26,31,35,28] },
];

function forecast(history) {
  const n = history.length;
  const mx = (n-1)/2, my = history.reduce((a,b)=>a+b,0)/n;
  let num=0,den=0;
  history.forEach((v,i)=>{ num+=(i-mx)*(v-my); den+=(i-mx)**2; });
  const slope = den?num/den:0, intercept = my - slope*mx;
  const todayDow = new Date().getDay();
  const dowData = {};
  for(let i=0;i<n;i++){
    const dow = ((todayDow-(n-i))%7+7)%7;
    (dowData[dow]||(dowData[dow]=[])).push(history[i]);
  }
  const dowAvg={};
  Object.entries(dowData).forEach(([d,v])=>{ dowAvg[d]=v.reduce((a,b)=>a+b,0)/v.length; });
  return Array.from({length:7},(_,i)=>{
    const dow=(todayDow+i)%7;
    const base = intercept + slope*(n+i);
    const factor = dowAvg[dow]!=null ? dowAvg[dow]/my : 1;
    return { day:i, dow, packages:Math.max(5,Math.round(base*factor)) };
  });
}

function staffLabel(p) {
  if(p>=80) return { text:"Пиковый день - усилить смену", col:"#f87171", bg:"rgba(127,29,29,0.35)", dot:"#ef4444" };
  if(p>=50) return { text:"Нужны 2 сотрудника", col:"#fbbf24", bg:"rgba(120,53,15,0.35)", dot:"#f59e0b" };
  return { text:"Нужен 1 сотрудник", col:"#34d399", bg:"rgba(6,78,59,0.35)", dot:"#10b981" };
}
function loadTag(p) {
  if(p>=80) return { label:"Высокая", bg:"rgba(127,29,29,0.4)", col:"#f87171", dot:"#ef4444" };
  if(p>=50) return { label:"Средняя", bg:"rgba(120,53,15,0.4)", col:"#fbbf24", dot:"#f59e0b" };
  return { label:"Низкая", bg:"rgba(6,78,59,0.4)", col:"#34d399", dot:"#10b981" };
}
function isWE(dow){ return dow===0||dow===6; }
const card = { background:"#111827", border:"1px solid #1f2937", borderRadius:16, padding:"20px" };
const inp = { background:"#060d1a", border:"1px solid #1f2937", borderRadius:12, padding:"8px 14px", color:"#f1f5f9", fontSize:13, outline:"none", width:"100%" };

function AuthModal({ onOk, onClose }) {
  const [val,setVal]=useState(""), [err,setErr]=useState(false);
  const go=()=>{ if(val===PASS){ onOk(); } else { setErr(true); setVal(""); setTimeout(()=>setErr(false),1800); }};
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999}}>
      <div style={{background:"#111827",border:"1px solid #1f2937",borderRadius:20,padding:36,width:380,boxSizing:"border-box"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{width:60,height:60,borderRadius:16,background:"rgba(59,130,246,0.12)",border:"1px solid rgba(59,130,246,0.3)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:26}}>🔐</div>
          <div style={{color:"#f1f5f9",fontSize:18,fontWeight:600,marginBottom:4}}>Требуется доступ</div>
          <div style={{color:"#6b7280",fontSize:13}}>Введите код для редактирования данных</div>
        </div>
        <input type="password" value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()}
          placeholder="Код доступа" autoFocus
          style={{...inp,textAlign:"center",fontSize:18,letterSpacing:4,marginBottom:err?8:16,borderColor:err?"#ef4444":"#1f2937"}} />
        {err && <div style={{color:"#f87171",fontSize:12,textAlign:"center",marginBottom:12}}>Неверный код - попробуйте еще раз</div>}
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:"10px 0",border:"1px solid #374151",borderRadius:12,background:"transparent",color:"#9ca3af",cursor:"pointer",fontSize:14}}>Отмена</button>
          <button onClick={go} style={{flex:1,padding:"10px 0",border:"none",borderRadius:12,background:"#2563eb",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:600}}>Войти</button>
        </div>
        <div style={{color:"#374151",fontSize:11,textAlign:"center",marginTop:12}}>Demo: просмотр без кода · редактирование - с кодом</div>
      </div>
    </div>
  );
}

function Overview({ pvzList }) {
  const today = new Date();
  const pf = pvzList.map(p=>({...p,fc:forecast(p.history)}));
  const weekDays = Array.from({length:7},(_,i)=>{
    const d=new Date(today); d.setDate(today.getDate()+i);
    return { label:DOW_S[d.getDay()], date:d.getDate(), dow:d.getDay() };
  });
  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
        {pf.map(pvz=>{
          const tot=pvz.fc.reduce((s,f)=>s+f.packages,0);
          const avg=Math.round(tot/7);
          const peak=pvz.fc.reduce((a,b)=>b.packages>a.packages?b:a);
          const lt=loadTag(avg);
          return (
            <div key={pvz.id} style={card}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:10,height:10,borderRadius:"50%",background:pvz.color}}></div>
                  <span style={{color:"#f1f5f9",fontWeight:600,fontSize:14}}>{pvz.name}</span>
                </div>
                <span style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:lt.bg,color:lt.col,fontWeight:500}}>{lt.label}</span>
              </div>
              <div style={{color:"#f1f5f9",fontSize:32,fontWeight:700,lineHeight:1}}>{tot}</div>
              <div style={{color:"#4b5563",fontSize:12,marginTop:2,marginBottom:16}}>посылок за 7 дней</div>
              <div style={{borderTop:"1px solid #1f2937",paddingTop:12,display:"flex",flexDirection:"column",gap:6}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12}}>
                  <span style={{color:"#4b5563"}}>Среднее / день</span>
                  <span style={{color:"#d1d5db"}}>{avg} шт.</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:12}}>
                  <span style={{color:"#4b5563"}}>Пик</span>
                  <span style={{color:"#d1d5db"}}>{DOW_F[peak.dow].slice(0,3)}. · {peak.packages} шт.</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={card}>
        <div style={{color:"#f1f5f9",fontWeight:600,fontSize:14,marginBottom:16}}>Загрузка сети по дням</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:10}}>
          {weekDays.map((day,i)=>{
            const tot=pf.reduce((s,pvz)=>s+(pvz.fc[i]?.packages||0),0);
            const avg=Math.round(tot/pvzList.length);
            const lt=loadTag(avg);
            const we=isWE(day.dow);
            return (
              <div key={i} style={{borderRadius:12,padding:"12px 8px",textAlign:"center",background:we?"rgba(30,64,175,0.12)":"#060d1a",border:`1px solid ${we?"rgba(59,130,246,0.2)":"#1f2937"}`}}>
                <div style={{fontSize:11,color:we?"#60a5fa":"#6b7280",marginBottom:2}}>{day.label}</div>
                <div style={{fontSize:11,color:"#4b5563",marginBottom:8}}>{day.date}</div>
                <div style={{width:8,height:8,borderRadius:"50%",background:lt.dot,margin:"0 auto 8px"}}></div>
                <div style={{color:"#f1f5f9",fontWeight:700,fontSize:16}}>{tot}</div>
                <div style={{color:"#374151",fontSize:10,marginTop:2}}>всего</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{...card,overflowX:"auto"}}>
        <div style={{color:"#f1f5f9",fontWeight:600,fontSize:14,marginBottom:16}}>Разбивка по точкам</div>
        <table style={{width:"100%",fontSize:13,borderCollapse:"collapse"}}>
          <thead>
            <tr style={{borderBottom:"1px solid #1f2937"}}>
              <th style={{color:"#6b7280",fontWeight:400,textAlign:"left",padding:"6px 16px 6px 0"}}>Точка</th>
              {weekDays.map((d,i)=>(
                <th key={i} style={{color:isWE(d.dow)?"#60a5fa":"#6b7280",fontWeight:400,padding:"6px 8px",textAlign:"center"}}>{d.label}</th>
              ))}
              <th style={{color:"#6b7280",fontWeight:400,padding:"6px 8px",textAlign:"center"}}>∑</th>
            </tr>
          </thead>
          <tbody>
            {pf.map(pvz=>(
              <tr key={pvz.id} style={{borderBottom:"1px solid rgba(31,41,55,0.5)"}}>
                <td style={{padding:"10px 16px 10px 0"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:pvz.color}}></div>
                    <span style={{color:"#f1f5f9"}}>{pvz.name}</span>
                  </div>
                </td>
                {pvz.fc.map((f,i)=>{
                  const lt=loadTag(f.packages);
                  return (
                    <td key={i} style={{padding:"10px 8px",textAlign:"center"}}>
                      <span style={{display:"inline-block",padding:"3px 8px",borderRadius:8,fontSize:12,fontWeight:500,background:lt.bg,color:lt.col}}>{f.packages}</span>
                    </td>
                  );
                })}
                <td style={{padding:"10px 8px",textAlign:"center",color:"#f1f5f9",fontWeight:700}}>
                  {pvz.fc.reduce((s,f)=>s+f.packages,0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PVZDetail({ pvz }) {
  const fc = forecast(pvz.history);
  const today = new Date();

  const chartData = [];
  for(let i=0;i<14;i++){
    const d=new Date(today); d.setDate(today.getDate()-(13-i));
    chartData.push({ name:`${DOW_S[d.getDay()]}${d.getDate()}`, hist:pvz.history[i], pred:null });
  }
  chartData.push({ name:"⬤", hist:pvz.history[13], pred:pvz.history[13], sep:true });
  for(let i=0;i<7;i++){
    const d=new Date(today); d.setDate(today.getDate()+i+1);
    chartData.push({ name:`${DOW_S[d.getDay()]}${d.getDate()}`, hist:null, pred:fc[i].packages });
  }

  const Tip = ({ active, payload, label }) => {
    if(!active||!payload?.length) return null;
    return (
      <div style={{background:"#1f2937",border:"1px solid #374151",borderRadius:12,padding:"10px 14px",fontSize:12}}>
        <div style={{color:"#9ca3af",marginBottom:6}}>{label}</div>
        {payload.filter(p=>p.value!=null).map(p=>(
          <div key={p.dataKey} style={{color:p.color}}>
            {p.dataKey==="hist"?"История":"Прогноз"}: <b>{p.value}</b>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:20}}>
      <div style={card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{color:"#f1f5f9",fontWeight:600,fontSize:14}}>История (14 дней) + Прогноз (7 дней)</div>
          <div style={{display:"flex",gap:20,fontSize:12,color:"#6b7280"}}>
            <span style={{display:"flex",alignItems:"center",gap:6}}>
              <svg width="22" height="2"><line x1="0" y1="1" x2="22" y2="1" stroke="#475569" strokeWidth="2" strokeDasharray="5,3"/></svg>
              История
            </span>
            <span style={{display:"flex",alignItems:"center",gap:6}}>
              <svg width="22" height="2"><line x1="0" y1="1" x2="22" y2="1" stroke={pvz.color} strokeWidth="2.5"/></svg>
              Прогноз
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData} margin={{top:5,right:10,left:-12,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="name" tick={{fill:"#4b5563",fontSize:10}} tickLine={false} axisLine={false} interval={2} />
            <YAxis tick={{fill:"#4b5563",fontSize:10}} tickLine={false} axisLine={false} />
            <Tooltip content={<Tip/>} />
            <ReferenceLine x="⬤" stroke="#374151" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="hist" stroke="#374151" strokeWidth={2} strokeDasharray="6 3" dot={false} connectNulls={false} />
            <Line type="monotone" dataKey="pred" stroke={pvz.color} strokeWidth={2.5} dot={{fill:pvz.color,r:3,strokeWidth:0}} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={card}>
        <div style={{color:"#f1f5f9",fontWeight:600,fontSize:14,marginBottom:16}}>Прогноз и рекомендации по сменам</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:10}}>
          {fc.map((f,i)=>{
            const d=new Date(today); d.setDate(today.getDate()+i+1);
            const sr=staffLabel(f.packages);
            const we=isWE(d.getDay());
            return (
              <div key={i} style={{borderRadius:14,padding:"14px 10px",textAlign:"center",background:we?"rgba(30,64,175,0.12)":"#060d1a",border:`1px solid ${we?"rgba(59,130,246,0.2)":"#1f2937"}`}}>
                <div style={{fontSize:11,color:we?"#60a5fa":"#6b7280",marginBottom:2}}>{DOW_S[d.getDay()]}</div>
                <div style={{fontSize:11,color:"#4b5563",marginBottom:10}}>{d.getDate()}.{String(d.getMonth()+1).padStart(2,"0")}</div>
                <div style={{color:"#f1f5f9",fontWeight:700,fontSize:22,lineHeight:1}}>{f.packages}</div>
                <div style={{color:"#4b5563",fontSize:10,margin:"4px 0 10px"}}>посылок</div>
                <div style={{height:3,borderRadius:4,background:sr.dot,marginBottom:10}}></div>
                <div style={{fontSize:10,color:sr.col,lineHeight:1.4,background:sr.bg,borderRadius:8,padding:"5px 6px"}}>{sr.text}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Manage({ pvzList, setPvzList, rAuth, unlocked }) {
  const [eid,setEid]=useState(null), [ename,setEname]=useState(""), [ehist,setEhist]=useState("");
  const [adding,setAdding]=useState(false), [nname,setNname]=useState("");
  const [msg,setMsg]=useState("");

  const showMsg=(t)=>{ setMsg(t); setTimeout(()=>setMsg(""),2500); };

  const startEdit=(p)=>rAuth(()=>{ setEid(p.id); setEname(p.name); setEhist(p.history.join(", ")); });
  const saveEdit=(id)=>{
    const v=ehist.split(/[\s,]+/).map(Number).filter(x=>!isNaN(x)&&x>0).slice(0,14);
    if(v.length<7){ showMsg("⚠ Введите минимум 7 значений"); return; }
    while(v.length<14) v.unshift(v[0]);
    setPvzList(l=>l.map(p=>p.id===id?{...p,name:ename,history:v}:p));
    setEid(null); showMsg("✓ Данные сохранены");
  };
  const startAdd=()=>rAuth(()=>setAdding(true));
  const doAdd=()=>{
    if(!nname.trim()) return;
    const used=pvzList.map(p=>p.color);
    const color=PVZ_COLORS.find(c=>!used.includes(c))||PVZ_COLORS[pvzList.length%5];
    setPvzList(l=>[...l,{id:Date.now(),name:nname.trim(),color,history:Array(14).fill(0).map(()=>Math.floor(20+Math.random()*60))}]);
    setNname(""); setAdding(false); showMsg("✓ Точка добавлена");
  };
  const doDelete=(id)=>rAuth(()=>{
    if(pvzList.length<=1){ showMsg("⚠ Нельзя удалить единственную точку"); return; }
    setPvzList(l=>l.filter(p=>p.id!==id)); showMsg("✓ Точка удалена");
  });

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14,maxWidth:680}}>
      {!unlocked && (
        <div style={{border:"1px solid rgba(217,119,6,0.3)",background:"rgba(120,53,15,0.2)",borderRadius:14,padding:"14px 18px",display:"flex",gap:12,alignItems:"flex-start"}}>
          <span style={{fontSize:20}}>🔒</span>
          <div>
            <div style={{color:"#fbbf24",fontWeight:600,fontSize:13}}>Demo-режим активен</div>
            <div style={{color:"rgba(251,191,36,0.5)",fontSize:12,marginTop:3}}>Для редактирования нажмите "Изменить" - система запросит код доступа</div>
          </div>
        </div>
      )}
      {msg && (
        <div style={{background:msg.startsWith("⚠")?"rgba(127,29,29,0.4)":"rgba(6,78,59,0.4)",border:`1px solid ${msg.startsWith("⚠")?"#7f1d1d":"#064e3b"}`,borderRadius:12,padding:"10px 16px",color:msg.startsWith("⚠")?"#f87171":"#34d399",fontSize:13}}>{msg}</div>
      )}
      {pvzList.map(pvz=>(
        <div key={pvz.id} style={card}>
          {eid===pvz.id ? (
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <input value={ename} onChange={e=>setEname(e.target.value)} placeholder="Название точки" style={{...inp,fontSize:14}} />
              <div>
                <div style={{color:"#6b7280",fontSize:11,marginBottom:6}}>История за 14 дней - числа через запятую или пробел:</div>
                <textarea value={ehist} onChange={e=>setEhist(e.target.value)} rows={3}
                  placeholder="45, 52, 38, 61, 73, 82, 70, 55, 63, 48, 72, 85, 91, 78"
                  style={{...inp,fontFamily:"monospace",fontSize:12,resize:"vertical"}} />
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>saveEdit(pvz.id)} style={{padding:"8px 18px",background:"#2563eb",border:"none",borderRadius:10,color:"#fff",cursor:"pointer",fontWeight:600,fontSize:13}}>Сохранить</button>
                <button onClick={()=>setEid(null)} style={{padding:"8px 18px",background:"transparent",border:"1px solid #374151",borderRadius:10,color:"#9ca3af",cursor:"pointer",fontSize:13}}>Отмена</button>
              </div>
            </div>
          ) : (
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:42,height:42,borderRadius:12,background:`${pvz.color}18`,border:`1px solid ${pvz.color}40`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <div style={{width:12,height:12,borderRadius:"50%",background:pvz.color}}></div>
                </div>
                <div>
                  <div style={{color:"#f1f5f9",fontWeight:600,fontSize:14}}>{pvz.name}</div>
                  <div style={{color:"#4b5563",fontSize:11,marginTop:2}}>avg {Math.round(pvz.history.reduce((a,b)=>a+b)/pvz.history.length)} шт/день · 14 дней истории</div>
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>startEdit(pvz)} style={{padding:"7px 14px",background:"transparent",border:"1px solid #374151",borderRadius:10,color:"#9ca3af",cursor:"pointer",fontSize:12}}>Изменить {!unlocked&&"🔒"}</button>
                <button onClick={()=>doDelete(pvz.id)} style={{padding:"7px 14px",background:"transparent",border:"1px solid rgba(127,29,29,0.5)",borderRadius:10,color:"rgba(248,113,113,0.6)",cursor:"pointer",fontSize:12}}>Удалить</button>
              </div>
            </div>
          )}
        </div>
      ))}
      {adding ? (
        <div style={{...card,border:"1px solid rgba(59,130,246,0.3)"}}>
          <input value={nname} onChange={e=>setNname(e.target.value)} autoFocus
            onKeyDown={e=>e.key==="Enter"&&doAdd()}
            placeholder="Название новой точки" style={{...inp,fontSize:14,marginBottom:12}} />
          <div style={{display:"flex",gap:8}}>
            <button onClick={doAdd} style={{padding:"8px 18px",background:"#2563eb",border:"none",borderRadius:10,color:"#fff",cursor:"pointer",fontWeight:600,fontSize:13}}>Добавить</button>
            <button onClick={()=>setAdding(false)} style={{padding:"8px 18px",background:"transparent",border:"1px solid #374151",borderRadius:10,color:"#9ca3af",cursor:"pointer",fontSize:13}}>Отмена</button>
          </div>
        </div>
      ) : pvzList.length<5 && (
        <button onClick={startAdd} style={{padding:"14px",background:"transparent",border:"1px dashed #374151",borderRadius:14,color:"#4b5563",cursor:"pointer",fontSize:13,width:"100%"}}>
          + Добавить точку ПВЗ {!unlocked&&"🔒"}
        </button>
      )}
    </div>
  );
}

export default function App() {
  const [pvzList,setPvzList]=useState(DEMO);
  const [tab,setTab]=useState("overview");
  const [unlocked,setUnlocked]=useState(false);
  const [showAuth,setShowAuth]=useState(false);
  const [pending,setPending]=useState(null);

  const rAuth=useCallback((fn)=>{
    if(unlocked){ fn(); }
    else{ setPending(()=>fn); setShowAuth(true); }
  },[unlocked]);

  const onAuth=()=>{
    setUnlocked(true); setShowAuth(false);
    if(pending){ pending(); setPending(null); }
  };

  const activePvz=pvzList.find(p=>p.id===tab);

  const navTabs=[
    {id:"overview",label:"Обзор сети",icon:"◈"},
    ...pvzList.map(p=>({id:p.id,label:p.name,color:p.color})),
    {id:"manage",label:"Управление",icon:"⚙"},
  ];

  return (
    <div style={{minHeight:"100vh",background:"#060d1a",fontFamily:"system-ui,-apple-system,sans-serif",color:"#f1f5f9"}}>
      {showAuth && <AuthModal onOk={onAuth} onClose={()=>{setShowAuth(false);setPending(null);}} />}
      <div style={{background:"#0a1020",borderBottom:"1px solid #1f2937",padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",height:56}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:30,height:30,background:"#2563eb",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700}}>П</div>
          <span style={{fontWeight:700,fontSize:16,letterSpacing:-0.3}}>ПВЗ Аналитика</span>
          <span style={{fontSize:11,padding:"3px 10px",borderRadius:20,border:`1px solid ${unlocked?"#064e3b":"#374151"}`,color:unlocked?"#34d399":"#6b7280",background:unlocked?"rgba(6,78,59,0.3)":"transparent"}}>
            {unlocked?"✓ Полный доступ":"👁 Demo-режим"}
          </span>
        </div>
        <button onClick={()=>unlocked?setUnlocked(false):setShowAuth(true)}
          style={{fontSize:12,padding:"6px 14px",borderRadius:10,cursor:"pointer",fontWeight:500,
            background:unlocked?"transparent":"rgba(37,99,235,0.15)",
            border:`1px solid ${unlocked?"#374151":"rgba(59,130,246,0.4)"}`,
            color:unlocked?"#6b7280":"#60a5fa"}}>
          {unlocked?"Выйти":"🔑 Войти"}
        </button>
      </div>
      <div style={{background:"#0a1020",borderBottom:"1px solid #1f2937",padding:"0 24px",display:"flex",gap:4,overflowX:"auto"}}>
        {navTabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{padding:"12px 16px",fontSize:13,whiteSpace:"nowrap",background:"transparent",cursor:"pointer",border:"none",
              borderBottom:`2px solid ${tab===t.id?"#3b82f6":"transparent"}`,
              color:tab===t.id?"#f1f5f9":"#6b7280",fontWeight:tab===t.id?500:400,display:"flex",alignItems:"center",gap:6}}>
            {t.color && <span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:t.color}}></span>}
            {t.icon && <span style={{fontSize:12}}>{t.icon}</span>}
            {t.label}
          </button>
        ))}
      </div>
      <div style={{maxWidth:1100,margin:"0 auto",padding:"24px"}}>
        {tab==="overview" && <Overview pvzList={pvzList} />}
        {activePvz && <PVZDetail pvz={activePvz} />}
        {tab==="manage" && <Manage pvzList={pvzList} setPvzList={setPvzList} rAuth={rAuth} unlocked={unlocked} />}
      </div>
    </div>
  );
}
