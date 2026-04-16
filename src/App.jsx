import React, { useMemo, useRef, useState } from "react";


const BOARD_SIZE = 15;
const CENTER = 7;

const LETTER_VALUES = {
  A: 1, Ä: 6, B: 3, C: 4, D: 1, E: 1, F: 4, G: 2, H: 2, I: 1, J: 6, K: 4,
  L: 2, M: 3, N: 1, O: 2, Ö: 8, P: 4, Q: 10, R: 1, S: 1, T: 1, U: 1, Ü: 6,
  V: 6, W: 3, X: 8, Y: 10, Z: 3, "?": 0,
};

const DEMO_WORDS = `
HAUS
MAUS
BAUM
TRAUM
AUTO
ZUG
WAGEN
TISCH
STUHL
LAMPE
`;

function normalizeWord(raw) {
  return raw.toUpperCase().replace(/[^A-ZÄÖÜ?]/g, "");
}

function parseDictionary(text) {
  return Array.from(
    new Set(
      text
        .replace(/\r/g, "")
        .split("\n")
        .map((w) => normalizeWord(w.trim()))
        .filter((w) => w.length >= 2)
    )
  );
}

function createEmptyBoard() {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => "")
  );
}

export default function App() {
  const [board, setBoard] = useState(createEmptyBoard());
  const [rack, setRack] = useState("");
  const [dictionaryText, setDictionaryText] = useState(DEMO_WORDS);
  const [results, setResults] = useState([]);
  const fileRef = useRef(null);
  const [image, setImage] = useState(null);

  const dictionary = useMemo(() => parseDictionary(dictionaryText), [dictionaryText]);

  function analyze() {
  const moves = findMoves(board, dictionary, rack);
  setResults(moves);
}

  function updateCell(r, c, value) {
    const newBoard = board.map((row) => [...row]);
    newBoard[r][c] = value.toUpperCase();
    setBoard(newBoard);
  }

  function loadImage(e) {
    const file = e.target.files[0];
    if (file) setImage(URL.createObjectURL(file));
  }

  function canBuildWord(word, rack) {
  const rackArr = rack.split("");
  for (let letter of word) {
    const idx = rackArr.indexOf(letter);
    if (idx === -1) return false;
    rackArr.splice(idx, 1);
  }
  return true;
}

function findMoves(board, dictionary, rack) {
  const moves = [];

  for (let word of dictionary) {
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {

        // horizontal
        if (c + word.length <= 15) {
          let fits = true;
          let usedRack = rack.split("");
          let usesExisting = false;
          let placed = 0;

          for (let i = 0; i < word.length; i++) {
            const existing = board[r][c + i];

            if (existing) {
              if (existing !== word[i]) {
                fits = false;
                break;
              }
              usesExisting = true;
            } else {
              const idx = usedRack.indexOf(word[i]);
              if (idx === -1) {
                fits = false;
                break;
              }
              usedRack.splice(idx, 1);
              placed++;
            }
          }

          // 👉 wichtige Scrabble-Regel
          if (fits && placed > 0 && usesExisting) {
            moves.push({
              word,
              row: r,
              col: c,
              dir: "H",
              score: calculateScore(word)
            });
          }
        }

        // vertikal
        if (r + word.length <= 15) {
          let fits = true;
          let usedRack = rack.split("");
          let usesExisting = false;
          let placed = 0;

          for (let i = 0; i < word.length; i++) {
            const existing = board[r + i][c];

            if (existing) {
              if (existing !== word[i]) {
                fits = false;
                break;
              }
              usesExisting = true;
            } else {
              const idx = usedRack.indexOf(word[i]);
              if (idx === -1) {
                fits = false;
                break;
              }
              usedRack.splice(idx, 1);
              placed++;
            }
          }

          if (fits && placed > 0 && usesExisting) {
            moves.push({
              word,
              row: r,
              col: c,
              dir: "V",
              score: calculateScore(word)
            });
          }
        }

      }
    }
  }

  return moves.sort((a, b) => b.score - a.score).slice(0, 3);
}

  function calculateScore(word) {
  let score = 0;
  for (let letter of word) {
    score += LETTER_VALUES[letter] || 0;
  }
  return score;
}
  
  return moves.sort((a, b) => b.score - a.score).slice(0, 3);
}
  return (
    <div style={{ padding: 20, fontFamily: "Arial", background: "#111", color: "white" }}>
      <h1>Scrabblebot V2</h1>

      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Rack"
          value={rack}
          onChange={(e) => setRack(e.target.value.toUpperCase())}
          style={{ padding: 10 }}
        />
        <button onClick={analyze} style={{ marginLeft: 10 }}>Berechnen</button>
        <button onClick={() => fileRef.current.click()} style={{ marginLeft: 10 }}>
          Screenshot
        </button>
        <input type="file" ref={fileRef} style={{ display: "none" }} onChange={loadImage} />
      </div>

      <div style={{ position: "relative", width: 450 }}>
        {image && (
          <img
            src={image}
            alt=""
            style={{ position: "absolute", width: "100%", opacity: 0.2 }}
          />
        )}

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(15, 30px)"
        }}>
          {board.map((row, r) =>
            row.map((cell, c) => (
              <input
                key={r + "-" + c}
                value={cell}
                maxLength={1}
                onChange={(e) => updateCell(r, c, e.target.value)}
                style={{
                  width: 30,
                  height: 30,
                  textAlign: "center",
                  background: "#222",
                  color: "white",
                  border: "1px solid #444"
                }}
              />
            ))
          )}
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <h2>Top Züge</h2>
{results.map((r, i) => (
  <div key={i}>
    #{i+1} {r.word} – {r.score} Punkte ({r.row},{r.col}) {r.dir}
  </div>
))}
      </div>

      <textarea
        value={dictionaryText}
        onChange={(e) => setDictionaryText(e.target.value)}
        style={{ width: "100%", marginTop: 20 }}
      />
    </div>
  );
}
