import React, { useEffect, useMemo, useRef, useState } from "react";

const BOARD_SIZE = 15;
const CENTER = 7;
const EMPTY = "";
const HANDLE_SIZE = 22;

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
        [r, c],
        [r, 14 - c],
        [14 - r, c],
        [14 - r, 14 - c],
        [c, r],
        [c, 14 - r],
        [14 - c, r],
        [14 - c, 14 - r],
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

const PREMIUM_COLORS = {
  TW: "bg-red-500/80",
  DW: "bg-rose-300/80",
  TL: "bg-blue-500/80",
  DL: "bg-sky-300/80",
  "": "bg-amber-50",
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
ANTENNE
APFEL
ARME
ARMUT
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
DRUCK
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
  return raw
    .toUpperCase()
    .replace(/[^A-ZÄÖÜ?]/g, "");
}

function parseDictionary(text) {
  return Array.from(
    new Set(
text
  .split(/\r?\n/)
  .map((w) => normalizeWord(w.trim()))
        .filter((w) => w.length >= 2)
    )
  ).sort((a, b) => a.localeCompare(b, "de"));
}

function createEmptyBoard() {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({ letter: EMPTY, blank: false }))
  );
}

function deepCloneBoard(board) {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

function inBounds(r, c) {
  return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
}

function rackToCount(rack) {
  const map = new Map();
  for (const ch of normalizeWord(rack)) {
    map.set(ch, (map.get(ch) || 0) + 1);
  }
  return map;
}

function hasAnyTile(board) {
  return board.some((row) => row.some((cell) => cell.letter));
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

function premiumAt(r, c) {
  return PREMIUM[r][c];
}

function letterScore(letter, blank = false) {
  if (blank) return 0;
  return LETTER_VALUES[letter] || 0;
}

function scoreWord(cells, placedSet, board) {
  let sum = 0;
  let wordMultiplier = 1;
  for (const [r, c] of cells) {
    const cell = board[r][c];
    const isNew = placedSet.has(`${r},${c}`);
    const base = letterScore(cell.letter, cell.blank);
    if (isNew) {
      const p = premiumAt(r, c);
      if (p === "DL") sum += base * 2;
      else if (p === "TL") sum += base * 3;
      else {
        sum += base;
        if (p === "DW") wordMultiplier *= 2;
        if (p === "TW") wordMultiplier *= 3;
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

  const rackCount = rackToCount(rack);
  const placements = [];
  let touchesExisting = false;
  let usesExisting = false;

  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;
    const boardLetter = board[r][c].letter;
    const needed = word[i];

    if (boardLetter) {
      if (boardLetter !== needed) return null;
      usesExisting = true;
      continue;
    }

    const directNeighbors = [
      [r - 1, c],
      [r + 1, c],
      [r, c - 1],
      [r, c + 1],
    ].filter(([rr, cc]) => inBounds(rr, cc) && board[rr][cc].letter);
    if (directNeighbors.length) touchesExisting = true;

    let blank = false;
    if ((rackCount.get(needed) || 0) > 0) {
      rackCount.set(needed, rackCount.get(needed) - 1);
    } else if ((rackCount.get("?") || 0) > 0) {
      rackCount.set("?", rackCount.get("?") - 1);
      blank = true;
    } else {
      return null;
    }

    placements.push({ row: r, col: c, letter: needed, blank });
  }

  if (!placements.length) return null;

  const boardHasTiles = hasAnyTile(board);
  if (!boardHasTiles) {
    const coversCenter = Array.from({ length: word.length }, (_, i) => [row + dr * i, col + dc * i])
      .some(([r, c]) => r === CENTER && c === CENTER);
    if (!coversCenter) return null;
  } else if (!(touchesExisting || usesExisting)) {
    return null;
  }

  const tempBoard = deepCloneBoard(board);
  for (const p of placements) {
    tempBoard[p.row][p.col] = { letter: p.letter, blank: p.blank };
  }

  const main = getWordFrom(tempBoard, row, col, dr, dc);
  if (main.word !== word) return null;
  if (!dictionarySet.has(main.word)) return null;

  const placedSet = new Set(placements.map((p) => `${p.row},${p.col}`));
  let total = scoreWord(main.cells, placedSet, tempBoard);

  for (const p of placements) {
    const cross = getWordFrom(tempBoard, p.row, p.col, dc, dr);
    if (cross.word.length > 1) {
      if (!dictionarySet.has(cross.word)) return null;
      total += scoreWord(cross.cells, placedSet, tempBoard);
    }
  }

  if (placements.length === 7) total += 50;

  return {
    word,
    row,
    col,
    dir,
    score: total,
    placements,
    usedTiles: placements.length,
  };
}

function findBestMoves(board, dictionary, rack) {
  const dict = dictionary.filter((w) => w.length <= BOARD_SIZE);
  const dictionarySet = new Set(dict);
  const candidates = [];

  for (const word of dict) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const h = canPlaceWord(board, dictionarySet, rack, word, r, c, "H");
        if (h) candidates.push(h);
        const v = canPlaceWord(board, dictionarySet, rack, word, r, c, "V");
        if (v) candidates.push(v);
      }
    }
  }

  const unique = new Map();
  for (const move of candidates) {
    const key = `${move.word}-${move.row}-${move.col}-${move.dir}`;
    const prev = unique.get(key);
    if (!prev || move.score > prev.score) unique.set(key, move);
  }

  return Array.from(unique.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.usedTiles !== a.usedTiles) return b.usedTiles - a.usedTiles;
    return a.word.localeCompare(b.word, "de");
  });
}

function cellLabel(r, c) {
  return `${String.fromCharCode(65 + c)}${r + 1}`;
}

function moveSummary(move) {
  return `${move.word} · ${move.score} Punkte · ${move.dir === "H" ? "horizontal" : "vertikal"} · Start ${cellLabel(move.row, move.col)}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function interpolate(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function bilinear(corners, u, v) {
  const top = interpolate(corners.tl, corners.tr, u);
  const bottom = interpolate(corners.bl, corners.br, u);
  return interpolate(top, bottom, v);
}

function getCellPolygon(corners, row, col) {
  const u0 = col / BOARD_SIZE;
  const u1 = (col + 1) / BOARD_SIZE;
  const v0 = row / BOARD_SIZE;
  const v1 = (row + 1) / BOARD_SIZE;
  return [
    bilinear(corners, u0, v0),
    bilinear(corners, u1, v0),
    bilinear(corners, u1, v1),
    bilinear(corners, u0, v1),
  ];
}

function polygonCenter(poly) {
  const x = poly.reduce((sum, p) => sum + p.x, 0) / poly.length;
  const y = poly.reduce((sum, p) => sum + p.y, 0) / poly.length;
  return { x, y };
}

function polygonToPoints(poly) {
  return poly.map((p) => `${p.x},${p.y}`).join(" ");
}

function autoFitCorners(imageMeta) {
  const paddingX = imageMeta.loaded ? 7 : 10;
  const paddingY = imageMeta.loaded ? 7 : 10;
  return {
    tl: { x: paddingX, y: paddingY },
    tr: { x: 100 - paddingX, y: paddingY },
    br: { x: 100 - paddingX, y: 100 - paddingY },
    bl: { x: paddingX, y: 100 - paddingY },
  };
}

function App() {
  const [board, setBoard] = useState(createEmptyBoard());
  const [rack, setRack] = useState("AERSTUN");
  const [dictionaryText, setDictionaryText] = useState(DEMO_WORDS.trim());
  const [topMoves, setTopMoves] = useState([]);
  const [selectedCell, setSelectedCell] = useState({ row: 7, col: 7 });
  const [imageUrl, setImageUrl] = useState("");
  const [imageMeta, setImageMeta] = useState({ loaded: false, width: 0, height: 0 });
  const [imageOpacity, setImageOpacity] = useState(0.88);
  const [gridOpacity, setGridOpacity] = useState(0.62);
  const [showCellLabels, setShowCellLabels] = useState(false);
  const [corners, setCorners] = useState(autoFitCorners({ loaded: false }));
  const [draggingCorner, setDraggingCorner] = useState(null);
  const fileInputRef = useRef(null);
  const boardAreaRef = useRef(null);

  const dictionary = useMemo(() => parseDictionary(dictionaryText), [dictionaryText]);
  const bestMove = topMoves[0] || null;

  useEffect(() => {
    const handleKeyDown = (e) => {
      const active = document.activeElement;
      const isTyping = active && ["INPUT", "TEXTAREA"].includes(active.tagName);
      if (isTyping) return;

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedCell((s) => ({ ...s, row: Math.max(0, s.row - 1) }));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedCell((s) => ({ ...s, row: Math.min(BOARD_SIZE - 1, s.row + 1) }));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSelectedCell((s) => ({ ...s, col: Math.max(0, s.col - 1) }));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setSelectedCell((s) => ({ ...s, col: Math.min(BOARD_SIZE - 1, s.col + 1) }));
      } else if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        updateCell(selectedCell.row, selectedCell.col, "", false);
      } else if (/^[a-zA-ZäöüÄÖÜ?]$/.test(e.key)) {
        e.preventDefault();
        updateCell(selectedCell.row, selectedCell.col, normalizeWord(e.key), false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCell]);

  useEffect(() => {
    if (!draggingCorner) return;

    const onMove = (e) => {
      const rect = boardAreaRef.current?.getBoundingClientRect();
      if (!rect) return;
      const clientX = e.touches?.[0]?.clientX ?? e.clientX;
      const clientY = e.touches?.[0]?.clientY ?? e.clientY;
      const x = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100);
      const y = clamp(((clientY - rect.top) / rect.height) * 100, 0, 100);
      setCorners((prev) => ({
        ...prev,
        [draggingCorner]: { x, y },
      }));
    };

    const stop = () => setDraggingCorner(null);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", stop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", stop);
    };
  }, [draggingCorner]);

  function updateCell(row, col, letter, blank) {
    setBoard((prev) => {
      const next = deepCloneBoard(prev);
      next[row][col] = { letter, blank };
      return next;
    });
  }

  function clearBoard() {
    setBoard(createEmptyBoard());
    setTopMoves([]);
  }

  function applyDemoPosition() {
    const next = createEmptyBoard();
    const place = (r, c, word, dir = "H") => {
      for (let i = 0; i < word.length; i++) {
        const rr = r + (dir === "V" ? i : 0);
        const cc = c + (dir === "H" ? i : 0);
        next[rr][cc] = { letter: word[i], blank: false };
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
    const moves = findBestMoves(board, dictionary, rack).slice(0, 3);
    setTopMoves(moves);
  }

  function useMoveOnBoard(move) {
    if (!move) return;
    setBoard((prev) => {
      const next = deepCloneBoard(prev);
      for (const p of move.placements) {
        next[p.row][p.col] = { letter: p.letter, blank: p.blank };
      }
      return next;
    });
  }

  function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setTopMoves([]);
  }

  function handleImageLoad(e) {
    const img = e.currentTarget;
    const meta = {
      loaded: true,
      width: img.naturalWidth || 0,
      height: img.naturalHeight || 0,
    };
    setImageMeta(meta);
    setCorners(autoFitCorners(meta));
  }

  function setPresetBoardFrame() {
    setCorners({
      tl: { x: 9, y: 8 },
      tr: { x: 91, y: 9 },
      br: { x: 92, y: 91 },
      bl: { x: 8, y: 92 },
    });
  }

  const bestMoveMap = useMemo(() => {
    const map = new Map();
    if (bestMove) {
      for (const p of bestMove.placements) {
        map.set(`${p.row},${p.col}`, p);
      }
    }
    return map;
  }, [bestMove]);

  const cellPolygons = useMemo(() => {
    const cells = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        cells.push({ row: r, col: c, poly: getCellPolygon(corners, r, c) });
      }
    }
    return cells;
  }, [corners]);

  const framePath = `${corners.tl.x},${corners.tl.y} ${corners.tr.x},${corners.tr.y} ${corners.br.x},${corners.br.y} ${corners.bl.x},${corners.bl.y}`;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Scrabblebot – Deutscher Zugfinder</h1>
          <p className="text-stone-300 max-w-5xl">
            Version 2 bringt den entscheidenden Schritt: Statt eines starren Rasters kannst du jetzt die vier Ecken des echten
            Spielbretts direkt auf dem Screenshot ausrichten. So passt sich das 15×15-Feld auch bei schräg fotografierten Brettern
            deutlich besser an. Danach trägst du die sichtbaren Buchstaben ein und lässt die drei punktstärksten Züge berechnen.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.25fr_0.95fr] gap-6 items-start">
          <div className="space-y-4">
            <div className="bg-stone-900 rounded-3xl p-4 shadow-2xl border border-stone-800">
              <div className="flex flex-wrap gap-3 items-center mb-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-2xl bg-stone-100 text-stone-900 font-semibold hover:bg-white"
                >
                  Screenshot hochladen
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <button onClick={setPresetBoardFrame} className="px-4 py-2 rounded-2xl bg-stone-800 hover:bg-stone-700">
                  Rahmen grob zentrieren
                </button>
                <button onClick={applyDemoPosition} className="px-4 py-2 rounded-2xl bg-stone-800 hover:bg-stone-700">
                  Demo-Position laden
                </button>
                <button onClick={clearBoard} className="px-4 py-2 rounded-2xl bg-stone-800 hover:bg-stone-700">
                  Brett leeren
                </button>
                <button onClick={analyze} className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-semibold">
                  Beste Züge berechnen
                </button>
              </div>

              <div className="grid md:grid-cols-[minmax(0,1fr)_285px] gap-4">
                <div>
                  <div ref={boardAreaRef} className="relative rounded-3xl overflow-hidden border border-stone-700 bg-stone-950 aspect-square touch-none select-none">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Scrabble Screenshot"
                        onLoad={handleImageLoad}
                        className="absolute inset-0 w-full h-full object-contain"
                        style={{ opacity: imageOpacity }}
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-stone-500 text-center p-8">
                        <div>
                          <div className="text-lg font-semibold mb-2">Kein Screenshot geladen</div>
                          <div className="text-sm">Lade einen Screenshot hoch oder nutze die Demo-Position.</div>
                        </div>
                      </div>
                    )}

                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                      <polygon points={framePath} fill="rgba(16,185,129,0.08)" stroke="rgba(16,185,129,0.9)" strokeWidth="0.45" />
                      {cellPolygons.map(({ row, col, poly }) => {
                        const suggested = bestMoveMap.get(`${row},${col}`);
                        const cell = board[row][col];
                        const selected = selectedCell.row === row && selectedCell.col === col;
                        const premium = premiumAt(row, col);
                        const center = polygonCenter(poly);
                        const fill = cell.letter
                          ? "rgba(255,255,255,0.82)"
                          : suggested
                            ? "rgba(16,185,129,0.88)"
                            : premium === "TW"
                              ? "rgba(239,68,68,0.55)"
                              : premium === "DW"
                                ? "rgba(251,113,133,0.45)"
                                : premium === "TL"
                                  ? "rgba(59,130,246,0.52)"
                                  : premium === "DL"
                                    ? "rgba(125,211,252,0.45)"
                                    : "rgba(245,158,11,0.12)";
                        const stroke = selected ? "rgba(253,224,71,1)" : "rgba(255,255,255,0.14)";
                        const textFill = cell.letter ? "#111827" : suggested ? "white" : "rgba(255,255,255,0.8)";
                        const fontSize = selected ? 1.9 : 1.45;

                        return (
                          <g key={`${row}-${col}`} onClick={() => setSelectedCell({ row, col })} style={{ cursor: "pointer" }}>
                            <polygon points={polygonToPoints(poly)} fill={fill} fillOpacity={gridOpacity} stroke={stroke} strokeWidth={selected ? 0.4 : 0.18} />
                            <text
                              x={center.x}
                              y={center.y + 0.42}
                              textAnchor="middle"
                              fontSize={cell.letter || suggested ? fontSize : 0.72}
                              fontWeight={cell.letter || suggested ? 700 : 600}
                              fill={textFill}
                              pointerEvents="none"
                            >
                              {cell.letter || suggested?.letter || (showCellLabels ? `${String.fromCharCode(65 + col)}${row + 1}` : premium || "")}
                            </text>
                          </g>
                        );
                      })}

                      {Object.entries(corners).map(([key, point]) => (
                        <g key={key}>
                          <circle
                            cx={point.x}
                            cy={point.y}
                            r="1.55"
                            fill="rgba(250,204,21,0.95)"
                            stroke="rgba(15,23,42,0.95)"
                            strokeWidth="0.35"
                            onMouseDown={() => setDraggingCorner(key)}
                            onTouchStart={() => setDraggingCorner(key)}
                            style={{ cursor: "grab" }}
                          />
                          <text x={point.x} y={point.y - 2.2} textAnchor="middle" fontSize="1.2" fill="rgba(250,204,21,1)">
                            {key.toUpperCase()}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-stone-950/60 rounded-2xl p-4 border border-stone-800">
                    <div className="font-semibold mb-3">Ausrichtung des Bretts</div>
                    <p className="text-sm text-stone-400 mb-3">
                      Ziehe die vier gelben Eckpunkte auf die vier Ecken des Scrabble-Bretts im Screenshot. Das Raster wird perspektivisch dazwischen verteilt.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {Object.entries(corners).map(([key, point]) => (
                        <div key={key} className="rounded-xl bg-stone-900 px-3 py-2 border border-stone-800">
                          <div className="text-stone-400 uppercase text-xs mb-1">{key}</div>
                          <div>{point.x.toFixed(1)} / {point.y.toFixed(1)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-stone-950/60 rounded-2xl p-4 border border-stone-800">
                    <div className="font-semibold mb-3">Ansicht</div>
                    <label className="block mb-3">
                      <div className="text-sm text-stone-300 mb-1">Screenshot-Deckkraft: {imageOpacity.toFixed(2)}</div>
                      <input type="range" min="0.2" max="1" step="0.05" value={imageOpacity} onChange={(e) => setImageOpacity(Number(e.target.value))} className="w-full" />
                    </label>
                    <label className="block mb-3">
                      <div className="text-sm text-stone-300 mb-1">Raster-Deckkraft: {gridOpacity.toFixed(2)}</div>
                      <input type="range" min="0.15" max="1" step="0.05" value={gridOpacity} onChange={(e) => setGridOpacity(Number(e.target.value))} className="w-full" />
                    </label>
                    <label className="flex items-center gap-2 text-sm text-stone-300">
                      <input type="checkbox" checked={showCellLabels} onChange={(e) => setShowCellLabels(e.target.checked)} />
                      Zellkoordinaten statt Premiumfelder anzeigen
                    </label>
                  </div>

                  <div className="bg-stone-950/60 rounded-2xl p-4 border border-stone-800">
                    <div className="font-semibold mb-2">Aktuelles Feld</div>
                    <div className="text-sm text-stone-400 mb-3">{cellLabel(selectedCell.row, selectedCell.col)}</div>
                    <input
                      value={board[selectedCell.row][selectedCell.col].letter}
                      onChange={(e) => updateCell(selectedCell.row, selectedCell.col, normalizeWord(e.target.value).slice(0, 1), false)}
                      maxLength={1}
                      placeholder="Buchstabe"
                      className="w-full rounded-xl bg-stone-900 border border-stone-700 px-3 py-2 mb-3"
                    />
                    <div className="flex gap-2 flex-wrap">
                      {"ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ?".split("").map((ch) => (
                        <button
                          key={ch}
                          onClick={() => updateCell(selectedCell.row, selectedCell.col, ch, ch === "?")}
                          className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs"
                        >
                          {ch}
                        </button>
                      ))}
                      <button
                        onClick={() => updateCell(selectedCell.row, selectedCell.col, "", false)}
                        className="px-3 h-8 rounded-lg bg-red-900/70 hover:bg-red-800 text-xs"
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-stone-900 rounded-3xl p-4 border border-stone-800">
                <label className="block font-semibold mb-2">Buchstaben auf der Ablagebank</label>
                <input
                  value={rack}
                  onChange={(e) => setRack(normalizeWord(e.target.value).slice(0, 7))}
                  placeholder="z. B. AERSTU?"
                  className="w-full rounded-2xl bg-stone-950 border border-stone-700 px-4 py-3 text-lg tracking-[0.2em] uppercase"
                />
                <div className="text-sm text-stone-400 mt-2">Joker als <span className="font-mono">?</span> eingeben.</div>
              </div>

              <div className="bg-stone-900 rounded-3xl p-4 border border-stone-800">
                <div className="font-semibold mb-2">Die 3 besten Züge</div>
                <div className="space-y-3">
                  {topMoves.length ? topMoves.map((move, idx) => (
                    <button
                      key={`${move.word}-${idx}`}
                      onClick={() => useMoveOnBoard(move)}
                      className={`w-full text-left rounded-2xl p-3 border ${idx === 0 ? "bg-emerald-950/70 border-emerald-700" : "bg-stone-950 border-stone-800 hover:bg-stone-800"}`}
                    >
                      <div className="text-sm text-stone-400 mb-1">#{idx + 1}</div>
                      <div className="font-semibold">{moveSummary(move)}</div>
                      <div className="text-sm text-stone-400 mt-1">Neue Steine: {move.placements.map((p) => `${p.letter}@${cellLabel(p.row, p.col)}`).join(", ")}</div>
                    </button>
                  )) : (
                    <div className="text-stone-500 text-sm">Noch keine Analyse. Klicke auf „Beste Züge berechnen“.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-stone-900 rounded-3xl p-4 border border-stone-800">
              <div className="font-semibold mb-2">Wörterbuch</div>
              <p className="text-sm text-stone-400 mb-3">
                Für die Vorschau ist ein kleines Demo-Wörterbuch eingebaut. Für echte Partien solltest du hier eine große deutsche Wortliste
                einfügen. Erst damit werden Kreuzwörter und Top-Züge wirklich belastbar.
              </p>
              <textarea
                value={dictionaryText}
                onChange={(e) => setDictionaryText(e.target.value)}
                className="w-full h-[370px] rounded-2xl bg-stone-950 border border-stone-700 px-4 py-3 text-sm font-mono"
              />
              <div className="text-sm text-stone-400 mt-2">Geladene Wörter: {dictionary.length}</div>
            </div>

            <div className="bg-stone-900 rounded-3xl p-4 border border-stone-800">
              <div className="font-semibold mb-3">Was jetzt verbessert wurde</div>
              <ul className="space-y-2 text-sm text-stone-300 list-disc pl-5">
                <li>Perspektivische Vier-Ecken-Ausrichtung statt starrem Rechteck-Overlay.</li>
                <li>Der beste Zug wird direkt in die passend verzerrten Brettfelder eingezeichnet.</li>
                <li>Jedes Feld bleibt anklickbar, auch auf schrägen Screenshots.</li>
                <li>Die deutsche Zuglogik aus Version 1 bleibt erhalten.</li>
              </ul>
            </div>

            <div className="bg-stone-900 rounded-3xl p-4 border border-stone-800">
              <div className="font-semibold mb-3">Nächster sinnvoller Ausbauschritt</div>
              <p className="text-sm text-stone-300">
                Als Nächstes sollte eine halbautomatische Buchstabenerkennung dazukommen: Die App schlägt pro Feld erkannte Buchstaben vor,
                und du korrigierst nur noch die Fehler. Das wäre der größte Sprung Richtung echter Alltagstauglichkeit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
