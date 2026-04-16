import React, { useMemo, useRef, useState } from "react";

const BOARD_SIZE = 15;
const CENTER = 7;

const LETTER_VALUES = {
  A: 1, Ä: 6, B: 3, C: 4, D: 1, E: 1, F: 4, G: 2, H: 2, I: 1, J: 6, K: 4,
  L: 2, M: 3, N: 1, O: 2, Ö: 8, P: 4, Q: 10, R: 1, S: 1, T: 1, U: 1, Ü: 6,
  V: 6, W: 3, X: 8, Y: 10, Z: 3, "?": 0,
};

const PREMIUM = (() => {
  const board = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => "")
  );

  const placeSym = (cells, value) => {
    for (const [r, c] of cells) {
      const variants = [
        [r, c], [r, 14 - c], [14 - r, c], [14 - r, 14 - c],
        [c, r], [c, 14 - r], [14 - c, r], [14 - c, 14 - r],
      ];
      for (const [rr, cc] of variants) board[rr][cc] = value;
    }
  };

  placeSym([[0, 0], [0, 7]], "TW");
  placeSym([[1, 1], [2, 2], [3, 3], [4, 4]], "DW");
  placeSym([[1, 5], [5, 1], [5, 5]], "TL");
  placeSym([[0, 3], [2, 6], [3, 0], [3, 7], [6, 2], [6, 6], [7, 3]], "DL");
  board[CENTER][CENTER] = "DW";
  return board;
})();

const PREMIUM_LABELS = {
  TW: "3W",
  DW: "2W",
  TL: "3L",
  DL: "2L",
  "": "",
};

const DEMO_WORDS = `
ABEND
ABER
ACHT
ADLER
AHNEN
AKT
ALLES
ALT
AMPEL
AMT
ANKER
APFEL
ARME
AST
ATEM
AUTO
BAD
BALL
BANK
BAUM
BILD
BISS
BITTE
BLATT
BLICK
BLUME
BOOT
BROT
BUCH
BUND
DACH
DAME
DANK
DORF
DUFT
ECHO
EIMER
EIS
ELTERN
ENGEL
ERNTE
ESSEN
ETAGE
EULE
FADEN
FAHRT
FALL
FELD
FERN
FEUER
FILM
FIRMA
FLUG
FLUSS
FRAU
FREI
FROH
FRUCHT
FUCHS
FÜNF
GABEL
GANG
GANS
GARTEN
GEBOT
GELD
GENAU
GERN
GLANZ
GLÜCK
GOLD
GRAS
GRUND
GRÜN
HALT
HAND
HAUS
HEFT
HELD
HERZ
HIMMEL
HOF
HUND
HÜGEL
IDEE
JAGD
JAHR
JETZT
JUNGE
KAFFEE
KARTE
KATZE
KIND
KLANG
KLEID
KNOTEN
KOPF
KRAFT
KRONE
KÜCHE
LACHEN
LAND
LANG
LAUF
LAUT
LEBEN
LEICHT
LICHT
LIEBE
LINIE
LISTE
LOGIK
LUFT
LUST
MACHEN
MANN
MARKT
MAUS
MEER
MENSCH
MOND
MORGEN
MOTOR
MUND
MUSIK
MUT
NACHT
NASE
NATUR
NEBEL
NETZ
NORD
NOTIZ
OFFEN
OHR
ORT
PAPIER
PARK
PFAD
PFOTE
PLAN
POST
PUNKT
QUALM
QUELLE
RAD
RAHMEN
RAUM
REGEN
REISE
RING
ROSE
ROT
RUF
RUHE
SACHE
SAFT
SALAT
SATZ
SCHRIFT
SCHRITT
SEE
SEIL
SEITE
SIEG
SINN
SOFA
SONNE
SPIEL
SPUR
STADT
STERN
STROM
STUFE
SUCHE
TAG
TAL
TANZ
TASTE
TISCH
TON
TOR
TRAUM
TREUE
TÜR
UFER
UHR
URLAUB
VATER
VEKTOR
VERLAG
WAGEN
WALD
WAND
WASSER
WEG
WELT
WERK
WIESE
WIND
WINKEL
WIRKUNG
WORT
WUNSCH
ZAHL
ZEIT
ZELT
ZUG
ZUKUNFT
ZUNGE
`;

function normalizeWord(raw) {
  return raw.toUpperCase().replace(/[^A-ZÄÖÜ?]/g, "");
}

function parseDictionary(text) {
  return Array.from(
    new Set(
      text
        .split(/
?
/)
        .map((w) => normalizeWord(w.trim()))
        .filter((w) => w.length >= 2)
    )
  ).sort((a, b) => a.localeCompare(b, "de"));
}

function createEmptyBoard() {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({ letter: "", blank: false }))
  );
}

function cloneBoard(board) {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

function inBounds(r, c) {
  return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
}

function hasTiles(board) {
  return board.some((row) => row.some((cell) => cell.letter));
}

function letterScore(letter, blank) {
  if (blank) return 0;
  return LETTER_VALUES[letter] || 0;
}

function rackToCounts(rack) {
  const counts = new Map();
  for (const ch of normalizeWord(rack)) counts.set(ch, (counts.get(ch) || 0) + 1);
  return counts;
}

function getWordFrom(board, row, col, dr, dc) {
  let r = row;
  let c = col;
  while (inBounds(r - dr, c - dc) && board[r - dr][c - dc].letter) {
    r -= dr;
    c -= dc;
  }

  let word = "";
  const cells = [];
  while (inBounds(r, c) && board[r][c].letter) {
    word += board[r][c].letter;
    cells.push([r, c]);
    r += dr;
    c += dc;
  }
  return { word, cells };
}

function scoreWord(cells, placedSet, board) {
  let sum = 0;
  let wordMultiplier = 1;

  for (const [r, c] of cells) {
    const cell = board[r][c];
    const isNew = placedSet.has(`${r},${c}`);
    const base = letterScore(cell.letter, cell.blank);

    if (isNew) {
      const premium = PREMIUM[r][c];
      if (premium === "DL") sum += base * 2;
      else if (premium === "TL") sum += base * 3;
      else {
        sum += base;
        if (premium === "DW") wordMultiplier *= 2;
        if (premium === "TW") wordMultiplier *= 3;
      }
    } else {
      sum += base;
    }
  }

  return sum * wordMultiplier;
}

function canPlaceWord(board, dictionarySet, rack, word, row, col, dir) {
  const dr = dir === "V" ? 1 : 0;
  const dc = dir === "H" ? 1 : 0;
  const endRow = row + dr * (word.length - 1);
  const endCol = col + dc * (word.length - 1);

  if (!inBounds(row, col) || !inBounds(endRow, endCol)) return null;

  const beforeR = row - dr;
  const beforeC = col - dc;
  const afterR = endRow + dr;
  const afterC = endCol + dc;
  if (inBounds(beforeR, beforeC) && board[beforeR][beforeC].letter) return null;
  if (inBounds(afterR, afterC) && board[afterR][afterC].letter) return null;

  const counts = rackToCounts(rack);
  const placements = [];
  let touchesExisting = false;
  let usesExisting = false;

  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    const needed = word[i];
    const existing = board[r][c].letter;

    if (existing) {
      if (existing !== needed) return null;
      usesExisting = true;
      continue;
    }

    const neighbors = [
      [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1],
    ].filter(([rr, cc]) => inBounds(rr, cc) && board[rr][cc].letter);
    if (neighbors.length) touchesExisting = true;

    let blank = false;
    if ((counts.get(needed) || 0) > 0) {
      counts.set(needed, counts.get(needed) - 1);
    } else if ((counts.get("?") || 0) > 0) {
      counts.set("?", counts.get("?") - 1);
      blank = true;
    } else {
      return null;
    }

    placements.push({ row: r, col: c, letter: needed, blank });
  }

  if (!placements.length) return null;

  const boardHasTiles = hasTiles(board);
  if (!boardHasTiles) {
    const coversCenter = Array.from({ length: word.length }, (_, i) => [row + dr * i, col + dc * i])
      .some(([r, c]) => r === CENTER && c === CENTER);
    if (!coversCenter) return null;
  } else if (!(touchesExisting || usesExisting)) {
    return null;
  }

  const temp = cloneBoard(board);
  for (const p of placements) temp[p.row][p.col] = { letter: p.letter, blank: p.blank };

  const mainWord = getWordFrom(temp, row, col, dr, dc);
  if (mainWord.word !== word) return null;
  if (!dictionarySet.has(mainWord.word)) return null;

  const placedSet = new Set(placements.map((p) => `${p.row},${p.col}`));
  let score = scoreWord(mainWord.cells, placedSet, temp);

  for (const p of placements) {
    const cross = getWordFrom(temp, p.row, p.col, dc, dr);
    if (cross.word.length > 1) {
      if (!dictionarySet.has(cross.word)) return null;
      score += scoreWord(cross.cells, placedSet, temp);
    }
  }

  if (placements.length === 7) score += 50;

  return {
    word,
    row,
    col,
    dir,
    score,
    placements,
    usedTiles: placements.length,
  };
}

function findBestMoves(board, dictionary, rack) {
  const dict = dictionary.filter((w) => w.length <= BOARD_SIZE);
  const dictionarySet = new Set(dict);
  const moves = [];

  for (const word of dict) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const horizontal = canPlaceWord(board, dictionarySet, rack, word, r, c, "H");
        if (horizontal) moves.push(horizontal);
        const vertical = canPlaceWord(board, dictionarySet, rack, word, r, c, "V");
        if (vertical) moves.push(vertical);
      }
    }
  }

  const unique = new Map();
  for (const move of moves) {
    const key = `${move.word}-${move.row}-${move.col}-${move.dir}`;
    const existing = unique.get(key);
    if (!existing || move.score > existing.score) unique.set(key, move);
  }

  return Array.from(unique.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.usedTiles !== a.usedTiles) return b.usedTiles - a.usedTiles;
    return a.word.localeCompare(b.word, "de");
  });
}

function coordLabel(row, col) {
  return `${String.fromCharCode(65 + col)}${row + 1}`;
}

function buildHeatmap(board, rack, dictionary) {
  const moves = findBestMoves(board, dictionary, rack).slice(0, 25);
  const map = new Map();
  for (const move of moves) {
    for (const p of move.placements) {
      const key = `${p.row},${p.col}`;
      map.set(key, (map.get(key) || 0) + 1);
    }
  }
  return map;
}

export default function App() {
  const [board, setBoard] = useState(createEmptyBoard());
  const [rack, setRack] = useState("WAGEN?");
  const [dictionaryText, setDictionaryText] = useState(DEMO_WORDS.trim());
  const [selected, setSelected] = useState({ row: 7, col: 7 });
  const [topMoves, setTopMoves] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const fileInputRef = useRef(null);

  const dictionary = useMemo(() => parseDictionary(dictionaryText), [dictionaryText]);
  const bestMove = topMoves[0] || null;
  const heatmap = useMemo(() => buildHeatmap(board, rack, dictionary), [board, rack, dictionary]);

  function setCell(row, col, letter, blank = false) {
    setBoard((prev) => {
      const next = cloneBoard(prev);
      next[row][col] = { letter, blank };
      return next;
    });
  }

  function clearBoard() {
    setBoard(createEmptyBoard());
    setTopMoves([]);
  }

  function loadDemo() {
    const next = createEmptyBoard();
    const place = (row, col, word, dir = "H") => {
      for (let i = 0; i < word.length; i++) {
        const r = row + (dir === "V" ? i : 0);
        const c = col + (dir === "H" ? i : 0);
        next[r][c] = { letter: word[i], blank: false };
      }
    };
    place(7, 4, "STERN", "H");
    place(5, 8, "TAL", "V");
    place(9, 6, "UFER", "H");
    setBoard(next);
    setRack("WAGEN?");
    setTopMoves([]);
  }

  function analyze() {
    setTopMoves(findBestMoves(board, dictionary, rack).slice(0, 3));
  }

  function applyBestMove() {
    if (!bestMove) return;
    setBoard((prev) => {
      const next = cloneBoard(prev);
      for (const p of bestMove.placements) next[p.row][p.col] = { letter: p.letter, blank: p.blank };
      return next;
    });
  }

  function importImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageUrl(URL.createObjectURL(file));
  }

  const bestMoveCells = new Map();
  if (bestMove) {
    for (const p of bestMove.placements) bestMoveCells.set(`${p.row},${p.col}`, p.letter);
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Scrabblebot – Version 2</h1>
          <p className="text-stone-300 mt-2 max-w-5xl">
            Jetzt mit echter deutscher Zuglogik, Punktberechnung, Top-3-Zügen, Vorschau des besten Zugs direkt auf dem Brett und einer Heatmap,
            die besonders interessante Felder hervorhebt. Der Screenshot-Upload ist als visueller Hintergrund vorbereitet.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-2xl bg-stone-100 text-stone-900 font-semibold">Screenshot laden</button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={importImage} />
          <button onClick={loadDemo} className="px-4 py-2 rounded-2xl bg-stone-800 hover:bg-stone-700">Demo laden</button>
          <button onClick={clearBoard} className="px-4 py-2 rounded-2xl bg-stone-800 hover:bg-stone-700">Brett leeren</button>
          <button onClick={analyze} className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-semibold">Top 3 berechnen</button>
          <button onClick={applyBestMove} className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 font-semibold">Besten Zug einsetzen</button>
          <label className="px-4 py-2 rounded-2xl bg-stone-900 border border-stone-700 inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showHeatmap} onChange={(e) => setShowHeatmap(e.target.checked)} /> Heatmap
          </label>
        </div>

        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6 items-start">
          <div className="bg-stone-900 rounded-3xl p-4 border border-stone-800 shadow-2xl">
            <div className="mb-4">
              <label className="block text-sm text-stone-400 mb-2">Rack-Buchstaben</label>
              <input
                value={rack}
                onChange={(e) => setRack(normalizeWord(e.target.value).slice(0, 7))}
                className="w-full rounded-2xl bg-stone-950 border border-stone-700 px-4 py-3 text-lg tracking-[0.2em]"
                placeholder="z. B. WAGEN?"
              />
            </div>

            <div className="relative rounded-3xl overflow-hidden border border-stone-700 bg-stone-950 aspect-square">
              {imageUrl && <img src={imageUrl} alt="Screenshot" className="absolute inset-0 w-full h-full object-cover opacity-20" />}
              <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))` }}>
                {board.map((row, r) =>
                  row.map((cell, c) => {
                    const isSelected = selected.row === r && selected.col === c;
                    const premium = PREMIUM[r][c];
                    const bestLetter = bestMoveCells.get(`${r},${c}`);
                    const heat = heatmap.get(`${r},${c}`) || 0;
                    const heatClass = showHeatmap && !cell.letter && !bestLetter && heat > 0
                      ? heat >= 4 ? "bg-yellow-300/35" : heat >= 2 ? "bg-yellow-200/20" : "bg-yellow-100/10"
                      : "";

                    return (
                      <button
                        key={`${r}-${c}`}
                        onClick={() => setSelected({ row: r, col: c })}
                        className={[
                          "aspect-square border border-black/15 relative flex items-center justify-center text-xs font-bold",
                          premium === "TW" ? "bg-red-500/70" : "",
                          premium === "DW" ? "bg-rose-300/70 text-stone-900" : "",
                          premium === "TL" ? "bg-blue-500/70" : "",
                          premium === "DL" ? "bg-sky-300/70 text-stone-900" : "",
                          premium === "" ? "bg-amber-50 text-stone-900" : "",
                          heatClass,
                          isSelected ? "ring-2 ring-yellow-300 z-10" : "",
                        ].join(" ")}
                        title={`${coordLabel(r, c)}`}
                      >
                        {cell.letter ? (
                          <span className="bg-white/90 text-stone-900 px-1.5 py-0.5 rounded-md shadow">{cell.letter}</span>
                        ) : bestLetter ? (
                          <span className="bg-emerald-600 text-white px-1.5 py-0.5 rounded-md shadow">{bestLetter}</span>
                        ) : (
                          <span className="text-[10px] opacity-70">{PREMIUM_LABELS[premium]}</span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-4 grid sm:grid-cols-[120px_1fr] gap-3 items-start">
              <div>
                <div className="text-sm text-stone-400 mb-2">Feld</div>
                <div className="text-lg font-semibold">{coordLabel(selected.row, selected.col)}</div>
              </div>
              <div>
                <div className="text-sm text-stone-400 mb-2">Buchstabe setzen</div>
                <div className="flex flex-wrap gap-2">
                  {"ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ?".split("").map((ch) => (
                    <button
                      key={ch}
                      onClick={() => setCell(selected.row, selected.col, ch === "?" ? "" : ch, ch === "?")}
                      className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs"
                    >
                      {ch}
                    </button>
                  ))}
                  <button onClick={() => setCell(selected.row, selected.col, "", false)} className="px-3 h-8 rounded-lg bg-red-900/70 hover:bg-red-800 text-xs">
                    Löschen
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-stone-900 rounded-3xl p-4 border border-stone-800">
              <div className="font-semibold mb-3">Top 3 Züge</div>
              <div className="space-y-3">
                {topMoves.length ? topMoves.map((move, index) => (
                  <div key={`${move.word}-${index}`} className={`rounded-2xl p-3 border ${index === 0 ? "bg-emerald-950/70 border-emerald-700" : "bg-stone-950 border-stone-800"}`}>
                    <div className="text-sm text-stone-400 mb-1">#{index + 1}</div>
                    <div className="font-semibold">{move.word} · {move.score} Punkte</div>
                    <div className="text-sm text-stone-400 mt-1">
                      {move.dir === "H" ? "horizontal" : "vertikal"} · Start {coordLabel(move.row, move.col)}
                    </div>
                    <div className="text-sm text-stone-400 mt-1">
                      Neue Steine: {move.placements.map((p) => `${p.letter}@${coordLabel(p.row, p.col)}`).join(", ")}
                    </div>
                  </div>
                )) : (
                  <div className="text-stone-500 text-sm">Noch keine Analyse gestartet.</div>
                )}
              </div>
            </div>

            <div className="bg-stone-900 rounded-3xl p-4 border border-stone-800">
              <div className="font-semibold mb-2">Regeln, die Version 2 bereits prüft</div>
              <ul className="list-disc pl-5 text-sm text-stone-300 space-y-1">
                <li>Deutsche Buchstabenwerte inklusive Ä, Ö, Ü und Joker.</li>
                <li>Standard-Prämienfelder auf dem 15×15-Brett.</li>
                <li>Erstes Wort muss über die Mitte laufen.</li>
                <li>Neue Wörter müssen angrenzen oder bestehende Steine nutzen.</li>
                <li>Alle entstehenden Kreuzwörter müssen im Wörterbuch stehen.</li>
                <li>50 Bonuspunkte für sieben gelegte Steine.</li>
              </ul>
            </div>

            <div className="bg-stone-900 rounded-3xl p-4 border border-stone-800">
              <div className="font-semibold mb-2">Wörterbuch</div>
              <p className="text-sm text-stone-400 mb-3">
                Für echte Spiele solltest du hier später eine große deutsche Wortliste einfügen. Im Moment ist eine Demo-Liste enthalten.
              </p>
              <textarea
                value={dictionaryText}
                onChange={(e) => setDictionaryText(e.target.value)}
                className="w-full h-72 rounded-2xl bg-stone-950 border border-stone-700 px-4 py-3 text-sm font-mono"
              />
              <div className="text-sm text-stone-400 mt-2">Geladene Wörter: {dictionary.length}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
