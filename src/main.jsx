import React,{useEffect,useMemo,useRef,useState} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'

const sample='RSVP reading presents one word at a time so your eyes do not need to travel across a page. Paste an article or notes into FastReader, choose a comfortable speed, and start reading. Your text stays in your browser.'

function wordsOf(t){return t.trim().split(/\\s+/).filter(Boolean)}
function pivotOf(w){const s=w.replace(/[“”"'()[\\]{}]/g,'');return s?Math.floor((s.length-1)/4):0}

function App(){
 const [text,setText]=useState(sample),[speed,setSpeed]=useState(350),[i,setI]=useState(0),[playing,setPlaying]=useState(false),[dark,setDark]=useState(true)
 const fileRef=useRef(null)
 const words=useMemo(()=>wordsOf(text),[text]), word=words[i]||'', p=pivotOf(word)
 const progress=words.length?((i+1)/words.length)*100:0
 useEffect(()=>{if(!playing||!words.length)return;const id=setInterval(()=>setI(x=>{if(x>=words.length-1){setPlaying(false);return x}return x+1}),60000/speed);return()=>clearInterval(id)},[playing,speed,words.length])
 useEffect(()=>{const k=e=>{if(e.target instanceof HTMLTextAreaElement||e.target instanceof HTMLInputElement)return;if(e.code==='Space'){e.preventDefault();setPlaying(x=>!x)}if(e.code==='ArrowRight')setI(x=>Math.min(x+1,Math.max(0,words.length-1)));if(e.code==='ArrowLeft')setI(x=>Math.max(x-1,0))};addEventListener('keydown',k);return()=>removeEventListener('keydown',k)},[words.length])
 const load=t=>{setText(t);setI(0);setPlaying(false)}
 return <div className={dark?'app dark':'app'}>
  <header><div><small>RSVP SPEED READING</small><h1>FastReader</h1></div><button onClick={()=>setDark(x=>!x)}>{dark?'☀ Light':'◐ Dark'}</button></header>
  <main>
   <section className="reader">
    <div className="stage"><span>{word.slice(0,p)}</span><b>{word.slice(p,p+1)}</b><span>{word.slice(p+1)}</span></div>
    <div className="progress"><span>{i+1} / {words.length}</span><div><i style={{width:progress+'%'}}/></div><span>{Math.round(progress)}%</span></div>
    <div className="controls"><button onClick={()=>setI(x=>Math.max(0,x-1))}>←</button><button className="play" onClick={()=>words.length&&setPlaying(x=>!x)}>{playing?'❚❚ Pause':'▶ Play'}</button><button onClick={()=>setI(x=>Math.min(x+1,Math.max(0,words.length-1)))}>→</button></div>
    <div className="speed"><span>Reading speed <strong>{speed} WPM</strong></span><input type="range" min="100" max="1000" step="25" value={speed} onChange={e=>setSpeed(+e.target.value)}/></div>
   </section>
   <aside>
    <strong>Your text</strong><textarea value={text} onChange={e=>load(e.target.value)} placeholder="Paste text here..."/>
    <div className="actions"><button onClick={()=>fileRef.current?.click()}>Upload .txt</button><button onClick={()=>load('')}>Clear</button><input ref={fileRef} hidden type="file" accept=".txt,text/plain" onChange={async e=>{const f=e.target.files?.[0];if(f)load(await f.text())}}/></div>
    <div className="stats"><div>Words<strong>{words.length}</strong></div><div>Est. time<strong>{words.length?Math.ceil(words.length/speed):0} min</strong></div><div>Remaining<strong>{Math.max(0,words.length-i-1)}</strong></div></div>
    <p>Space = play/pause · ← / → = previous/next word</p>
   </aside>
  </main>
  <footer>FastReader processes your reading text locally in the browser.</footer>
 </div>
}
createRoot(document.getElementById('root')).render(<App/>)