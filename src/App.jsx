import React, { useState } from "react";

const BOARD_SIZE = 15;

// 👉 einfache Demo-Wortliste (später ersetzen wir die durch echte)
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
  return raw.toUpperCase().replace(/[^A-ZÄÖÜ]/g, "");
}

function parseDictionary(text) {
  return Array.from(
    new Set(
      text
        .split(/\r?\n/)
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

function App() {
  const [board, setBoard] = useState(createEmptyBoard());
  const [rack, setRack] = useState("");
  const [dictionaryText, setDictionaryText] = useState(DEMO_WORDS);
  const [results, setResults] = useState([]);

  const dictionary = parseDictionary(dictionaryText);

  function analyze() {
    // 👉 extrem einfache Demo-Logik (nur zum Testen)
    const possible = dictionary.filter((word) =>
      word.split("").every((letter) =>
        rack.toUpperCase().includes(letter)
      )
    );

    setResults(possible.slice(0, 3));
  }

  function updateCell(r, c, value) {
    const newBoard = board.map((row) => [...row]);
    newBoard[r][c] = value.toUpperCase();
    setBoard(newBoard);
  }

  return (
    <div style={{ padding: 20, fontFamily: "Arial", color: "white", background: "#111" }}>
      <h1>Scrabblebot (Testversion)</h1>

      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Rack-Buchstaben (z. B. HAUS)"
          value={rack}
          onChange={(e) => setRack(e.target.value)}
          style={{ padding: 10, fontSize: 16 }}
        />
        <button onClick={analyze} style={{ marginLeft: 10, padding: 10 }}>
          Züge berechnen
        </button>
      </div>

      {/* Brett */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(15, 30px)" }}>
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
                border: "1px solid #444",
                background: "#222",
                color: "white"
              }}
            />
          ))
        )}
      </div>

      {/* Ergebnisse */}
      <div style={{ marginTop: 20 }}>
        <h2>Beste Züge (Demo)</h2>
        {results.length === 0 && <div>Keine gefunden</div>}
        {results.map((r, i) => (
          <div key={i}>{r}</div>
        ))}
      </div>

      {/* Wörterbuch */}
      <div style={{ marginTop: 20 }}>
        <h3>Wörterbuch</h3>
        <textarea
          value={dictionaryText}
          onChange={(e) => setDictionaryText(e.target.value)}
          rows={10}
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
}

export default App;
