import { useEffect, useMemo, useState } from 'react';
import { words } from './words.js';

const STORAGE_KEY = 'ankicards-progress-v1';

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

// Zamíchá pole (Fisher–Yates)
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function App() {
  const [deck, setDeck] = useState(() => words.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [progress, setProgress] = useState(loadProgress);

  const currentIndex = deck[pos];
  const card = words[currentIndex];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const stats = useMemo(() => {
    let known = 0;
    let learning = 0;
    for (const w of words) {
      const s = progress[w.front];
      if (s === 'known') known++;
      else if (s === 'learning') learning++;
    }
    return { known, learning, total: words.length };
  }, [progress]);

  function next() {
    setFlipped(false);
    setPos((p) => (p + 1) % deck.length);
  }

  function prev() {
    setFlipped(false);
    setPos((p) => (p - 1 + deck.length) % deck.length);
  }

  function mark(status) {
    setProgress((p) => ({ ...p, [card.front]: status }));
    next();
  }

  function reshuffle() {
    setDeck(shuffle(deck));
    setPos(0);
    setFlipped(false);
  }

  function resetProgress() {
    if (confirm('Opravdu smazat veškerý postup?')) {
      setProgress({});
    }
  }

  // Klávesové zkratky: mezerník = otočit, šipky = další/předchozí, 1/2 = umím/neumím
  useEffect(() => {
    function onKey(e) {
      if (e.code === 'Space') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.code === 'ArrowRight') next();
      else if (e.code === 'ArrowLeft') prev();
      else if (e.key === '1') mark('known');
      else if (e.key === '2') mark('learning');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const status = progress[card.front];

  return (
    <div className="app">
      <header className="topbar">
        <h1>🇬🇧 Anki Cards</h1>
        <div className="counters">
          <span className="pill known">Umím {stats.known}</span>
          <span className="pill learning">Učím se {stats.learning}</span>
          <span className="pill total">/ {stats.total}</span>
        </div>
      </header>

      <main className="stage">
        <div className="progressbar">
          <div
            className="progressbar-fill"
            style={{ width: `${((pos + 1) / deck.length) * 100}%` }}
          />
        </div>
        <div className="position">
          {pos + 1} / {deck.length}
        </div>

        <button
          className={`card ${flipped ? 'is-flipped' : ''}`}
          onClick={() => setFlipped((f) => !f)}
          aria-label="Otočit kartičku"
        >
          <div className="card-inner">
            <div className="card-face card-front">
              {status && <span className={`badge ${status}`} />}
              <span className="word">{card.front}</span>
              <span className="hint">klepni pro překlad</span>
            </div>
            <div className="card-face card-back">
              <span className="word">{card.back}</span>
              <span className="example">„{card.example}"</span>
            </div>
          </div>
        </button>

        <div className="answer-row">
          <button className="btn btn-learning" onClick={() => mark('learning')}>
            ✗ Ještě se učím
          </button>
          <button className="btn btn-known" onClick={() => mark('known')}>
            ✓ Umím
          </button>
        </div>

        <div className="nav-row">
          <button className="btn ghost" onClick={prev}>← Zpět</button>
          <button className="btn ghost" onClick={reshuffle}>🔀 Zamíchat</button>
          <button className="btn ghost" onClick={next}>Další →</button>
        </div>
      </main>

      <footer className="footer">
        <button className="link" onClick={resetProgress}>Vynulovat postup</button>
        <span className="kbd-hint">
          mezerník = otočit · ← → = navigace · 1 = umím · 2 = učím se
        </span>
      </footer>
    </div>
  );
}
