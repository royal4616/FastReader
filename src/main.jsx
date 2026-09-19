import React, { useEffect, useMemo, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import * as mammoth from 'mammoth'
import { MAX_WORDS, countWords, limitMessage, normalizeText, splitWords } from './textUtils'
import './index.css'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const sampleText = 'Upload a PDF, Word document, image, or text file. FastReader extracts the content in your browser, turns it into words, and presents it one word at a time. The maximum input is ten thousand words.'
const ACCEPT = '.pdf,.docx,.txt,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*'

function pivotOf(word) {
  const cleaned = word.replace(/[“”"'()[\]{}]/g, '')
  return cleaned ? Math.floor((cleaned.length - 1) / 4) : 0
}

async function createOcrWorker(onProgress) {
  const { createWorker } = await import('tesseract.js')
  return createWorker('eng', 1, {
    logger: message => {
      if (typeof message.progress === 'number') onProgress(Math.round(message.progress * 100))
    }
  })
}

async function extractImage(file, onProgress) {
  const worker = await createOcrWorker(onProgress)
  try {
    const result = await worker.recognize(file)
    return result.data.text || ''
  } finally {
    await worker.terminate()
  }
}

async function extractPdf(file, onProgress) {
  const data = new Uint8Array(await file.arrayBuffer())
  const pdf = await pdfjsLib.getDocument({ data }).promise
  let text = ''
  let ocrWorker = null

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber)
      const content = await page.getTextContent()
      const pageText = content.items.map(item => 'str' in item ? item.str : '').join(' ')
      const pageWords = splitWords(pageText)

      if (pageWords.length >= 5) {
        text += pageText + '\n'
      } else {
        if (!ocrWorker) ocrWorker = await createOcrWorker(progress => onProgress(Math.min(99, Math.round(((pageNumber - 1) / pdf.numPages) * 100 + progress / pdf.numPages))))
        const viewport = page.getViewport({ scale: 1.65 })
        const canvas = document.createElement('canvas')
        canvas.width = Math.ceil(viewport.width)
        canvas.height = Math.ceil(viewport.height)
        const context = canvas.getContext('2d', { alpha: false })
        if (!context) throw new Error('Could not create a canvas for PDF OCR.')
        await page.render({ canvasContext: context, viewport }).promise
        const result = await ocrWorker.recognize(canvas)
        text += result.data.text + '\n'
        canvas.width = 1
        canvas.height = 1
      }

      if (countWords(text) > MAX_WORDS) break
      onProgress(Math.round((pageNumber / pdf.numPages) * 100))
    }
  } finally {
    if (ocrWorker) await ocrWorker.terminate()
    await pdf.destroy()
  }

  return text
}

async function extractDocx(file) {
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
  return result.value || ''
}

async function extractFile(file, onProgress) {
  const type = file.type
  const name = file.name.toLowerCase()

  if (type === 'text/plain' || name.endsWith('.txt')) {
    onProgress(100)
    return file.text()
  }

  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    return extractPdf(file, onProgress)
  }

  if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || name.endsWith('.docx')) {
    onProgress(25)
    const text = await extractDocx(file)
    onProgress(100)
    return text
  }

  if (type.startsWith('image/')) {
    return extractImage(file, onProgress)
  }

  throw new Error('Unsupported file type. Upload PDF, DOCX, TXT, PNG, JPG, JPEG, WEBP, or another browser-supported image.')
}

function App() {
  const [text, setText] = useState(sampleText)
  const [speed, setSpeed] = useState(350)
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [dark, setDark] = useState(true)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('Ready')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef(null)

  const words = useMemo(() => splitWords(text), [text])
  const word = words[index] || ''
  const pivot = pivotOf(word)
  const readingProgress = words.length ? ((index + 1) / words.length) * 100 : 0

  useEffect(() => {
    if (!playing || words.length === 0) return undefined
    const timer = setInterval(() => {
      setIndex(current => {
        if (current >= words.length - 1) {
          setPlaying(false)
          return current
        }
        return current + 1
      })
    }, 60000 / speed)
    return () => clearInterval(timer)
  }, [playing, speed, words.length])

  useEffect(() => {
    const onKeyDown = event => {
      if (event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement) return
      if (event.code === 'Space') {
        event.preventDefault()
        setPlaying(value => !value)
      }
      if (event.code === 'ArrowRight') setIndex(value => Math.min(value + 1, Math.max(0, words.length - 1)))
      if (event.code === 'ArrowLeft') setIndex(value => Math.max(value - 1, 0))
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [words.length])

  const loadText = (value, sourceName = '') => {
    const normalized = normalizeText(value)
    const count = countWords(normalized)
    if (count > MAX_WORDS) {
      setError(limitMessage(count))
      setStatus('Over the limit')
      return false
    }
    setText(normalized)
    setIndex(0)
    setPlaying(false)
    setError('')
    setFileName(sourceName)
    setStatus(count ? 'Ready' : 'No text found')
    return true
  }

  const processFile = async file => {
    if (!file) return
    setError('')
    setBusy(true)
    setPlaying(false)
    setProgress(0)
    setStatus(`Reading ${file.name}…`)

    try {
      const extracted = normalizeText(await extractFile(file, setProgress))
      const count = countWords(extracted)

      if (!count) {
        throw new Error('No readable text was found in this file.')
      }
      if (count > MAX_WORDS) {
        throw new Error(limitMessage(count))
      }

      loadText(extracted, file.name)
      setProgress(100)
      setStatus(`Loaded ${count.toLocaleString()} words`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not read this file.')
      setStatus('Import failed')
    } finally {
      setBusy(false)
    }
  }

  const onFileChange = event => {
    const file = event.target.files?.[0]
    if (file) processFile(file)
    event.target.value = ''
  }

  const onDrop = event => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  return (
    <div className={dark ? 'app dark' : 'app'}>
      <header className="topbar">
        <div>
          <small>RSVP SPEED READING</small>
          <h1>FastReader</h1>
        </div>
        <button className="theme-button" onClick={() => setDark(value => !value)}>
          {dark ? '☀ Light' : '◐ Dark'}
        </button>
      </header>

      <main>
        <section className="reader">
          <div className="reader-heading">
            <div>
              <strong>Reader</strong>
              <span>{words.length.toLocaleString()} / {MAX_WORDS.toLocaleString()} words</span>
            </div>
            {fileName && <span className="source-pill">{fileName}</span>}
          </div>

          <div className="stage" aria-live="polite">
            <span>{word.slice(0, pivot)}</span>
            <b>{word.slice(pivot, pivot + 1)}</b>
            <span>{word.slice(pivot + 1)}</span>
          </div>

          <div className="reading-progress">
            <span>{words.length ? index + 1 : 0} / {words.length}</span>
            <div><i style={{ width: `${readingProgress}%` }} /></div>
            <span>{Math.round(readingProgress)}%</span>
          </div>

          <div className="controls">
            <button onClick={() => setIndex(value => Math.max(0, value - 1))} disabled={!words.length}>←</button>
            <button className="play" onClick={() => words.length && setPlaying(value => !value)} disabled={!words.length}>
              {playing ? '❚❚ Pause' : '▶ Play'}
            </button>
            <button onClick={() => setIndex(value => Math.min(value + 1, Math.max(0, words.length - 1)))} disabled={!words.length}>→</button>
          </div>

          <div className="speed">
            <span>Reading speed <strong>{speed} WPM</strong></span>
            <input aria-label="Reading speed" type="range" min="100" max="1000" step="25" value={speed} onChange={event => setSpeed(Number(event.target.value))} />
            <div><span>100</span><span>350</span><span>600</span><span>1000</span></div>
          </div>
        </section>

        <aside className="import-panel">
          <div className="panel-title">
            <strong>Import content</strong>
            <span>Maximum 10,000 words</span>
          </div>

          <textarea
            aria-label="Your text"
            value={text}
            onChange={event => loadText(event.target.value)}
            placeholder="Paste up to 10,000 words here…"
          />

          <div
            className={`dropzone ${dragging ? 'dragging' : ''}`}
            onDragOver={event => { event.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => !busy && fileRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') fileRef.current?.click() }}
          >
            <span className="upload-icon">↑</span>
            <strong>{busy ? status : 'Upload a file'}</strong>
            <small>PDF · DOCX · TXT · PNG · JPG · WEBP</small>
            <small>Text PDFs are extracted directly; scanned PDFs/images use OCR.</small>
          </div>

          <input
            ref={fileRef}
            data-testid="file-input"
            hidden
            type="file"
            accept={ACCEPT}
            onChange={onFileChange}
          />

          {busy && <div className="import-progress"><i style={{ width: `${progress}%` }} /></div>}
          {status && <div data-testid="status" className="status">{status}</div>}
          {error && <div data-testid="error" className="error">{error}</div>}

          <div className="actions">
            <button onClick={() => loadText('')}>Clear</button>
            <button onClick={() => setIndex(0)} disabled={!words.length}>Restart</button>
          </div>

          <div className="stats">
            <div><span>Words</span><strong data-testid="word-count">{words.length.toLocaleString()}</strong></div>
            <div><span>Est. time</span><strong>{words.length ? Math.ceil(words.length / speed) : 0} min</strong></div>
            <div><span>Remaining</span><strong>{Math.max(0, words.length - index - 1).toLocaleString()}</strong></div>
          </div>

          <div className="privacy">
            <strong>Private by design</strong>
            <p>Files are processed locally in your browser. Nothing is uploaded to a FastReader server.</p>
          </div>
        </aside>
      </main>

      <footer>Space = play/pause · ← / → = previous/next word · Files stay in your browser.</footer>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
