let tilesX, tilesY, tileW, tileH;
let gridState = []; // speichert, ob Zelle aktiv (true) oder inaktiv (false)
let blocks = []; // Globale Liste aller gefundenen Rechtecke

let isDragging = false; // Flag, ob gerade ein Ziehvorgang läuft

//Startkoordinaten des Drag-Vorgangs
let dragStartCol = null;
let dragRow = null;

// Der Zustand (true oder false), den alle gezogenen Zellen annehmen sollen
let initialState = false;

// ---- NEU: Für Blockverschiebung ----
let isMovingBlock = false; // Ob ein Block verschoben wird
let selectedBlock = null; // Der aktuell bewegte Block
let offsetX = 0; // Mausposition relativ zum Blockanfang

function setup() {
  createCanvas(600, 600); // Zeichenfläche erstellen

  tilesX = 20;
  tilesY = 20;
  tileW = width / tilesX;
  tileH = height / tilesY;

  // 2D-Array initialisieren
  for (let x = 0; x < tilesX; x++) {
    gridState[x] = [];
    for (let y = 0; y < tilesY; y++) {
      gridState[x][y] = false; // Anfangszustand: alle Zellen sind aus
    }
  }
}

function draw() {
  background(255); // hellgrauer Hintergrund
  drawGrid(); // zeichnet Grid inkl. schwarz-weißer Zellen
  drawBlocks();
}

function drawGrid() {
  stroke(200); // Farbe der Gitterlinien

  for (let x = 0; x < tilesX; x++) {
    for (let y = 0; y < tilesY; y++) {
      if (gridState[x][y]) {
        fill(0); // schwarze Zelle
      } else {
        noFill(); // leere Zelle
      }
      rect(x * tileW, y * tileH, tileW, tileH);
    }
  }
}

function drawBlocks() {
  noStroke();
  fill(0);

  for (let block of blocks) {
    rect(
      block.blockStartCol * tileW,
      block.blockRow * tileH,
      block.blockWidth * tileW,
      tileH
    );
  }
}

function mousePressed() {
  // Geklickte Zelle berechnen
  let clickedColumn = floor(mouseX / tileW);
  let clickedRow = floor(mouseY / tileH);

  // Sicherheitsfrage: Cursor innerhalb des Grids?
  if (
    clickedColumn >= 0 &&
    clickedColumn < tilesX &&
    clickedRow >= 0 &&
    clickedRow < tilesY
  ) {
    // --- BLOCKVERSCHIEBUNG bei gedrücktem SHIFT ---
    if (keyIsDown(SHIFT)) {
      for (let block of blocks) {
        let px = block.blockStartCol * tileW;
        let py = block.blockRow * tileH;
        let pw = block.blockWidth * tileW;

        // Prüfe, ob Klick innerhalb des Blockrechtecks war
        if (
          mouseX >= px &&
          mouseX <= px + pw &&
          mouseY >= py &&
          mouseY <= py + tileH
        ) {
          selectedBlock = block;
          offsetX = mouseX - px;
          isMovingBlock = true;
          return; // keine Zellen zeichnen!
        }
      }
    }

    // Drag-Modus aktivieren
    isDragging = true;
    dragStartCol = clickedColumn;
    dragRow = clickedRow;
    initialState = !gridState[clickedColumn][clickedRow]; // Toggle-Ziel merken

    // Zustand umschalten
    gridState[clickedColumn][clickedRow] = initialState;

    detectBlocks(); // Blöcke neu erkennen
  }
}

function mouseReleased() {
  isDragging = false;
  isMovingBlock = false;
  selectedBlock = null;
}

function mouseDragged() {
  // --- BLOCK VERSCHIEBEN ---
  if (isMovingBlock && selectedBlock) {
    let newStartCol = floor((mouseX - offsetX) / tileW);
    newStartCol = constrain(newStartCol, 0, tilesX - selectedBlock.blockWidth);
    selectedBlock.blockStartCol = newStartCol;

    updateGridFromBlocks(); // Grid aktualisieren
    redraw();
    return;
  }

  // --- ZELLEN ZEICHNEN ---
  // Wenn im Drag-Modus: aktuelle Spalte berechnen.
  if (isDragging && dragRow !== null) {
    const currentCol = floor(mouseX / tileW);

    // Wenn aktuelle Spalte innerhalb des Grids
    if (currentCol >= 0 && currentCol < tilesX) {
      // Blockgrenzen festlegen (immer von links nach rechts)
      const colStart = min(dragStartCol, currentCol);
      const colEnd = max(dragStartCol, currentCol);

      for (let col = colStart; col <= colEnd; col++) {
        gridState[col][dragRow] = initialState;
      }

      detectBlocks();
      redraw();
    }
  }
}

// --- Hilfsfunktion: Blockdaten -> Grid ---
function updateGridFromBlocks() {
  // Grid komplett zurücksetzen
  for (let x = 0; x < tilesX; x++) {
    for (let y = 0; y < tilesY; y++) {
      gridState[x][y] = false;
    }
  }

  // Alle Blöcke in das Grid schreiben
  for (let block of blocks) {
    for (let i = 0; i < block.blockWidth; i++) {
      gridState[block.blockStartCol + i][block.blockRow] = true;
    }
  }
}

function detectBlocks() {
  blocks = []; // Vorherige Blöcke löschen

  for (let row = 0; row < tilesY; row++) {
    // durchlaufen jeder Zeile im Grid

    let start = null; // speichert wo aktive Gruppe beginnt (Spaltenindex)
    let length = 0; // zählt, wie lang die Gruppe ist

    for (let col = 0; col <= tilesX; col++) {
      let isCellActive = col < tilesX ? gridState[col][row] : false;

      if (isCellActive) {
        // Fall 1: Zelle aktiv (schwarz)
        // Fall 1A: Beginn eines neuen Blocks
        if (start === null) {
          start = col;
          length = 1;
        } else {
          length++;
        } // Fall 1B: Fortsetzung eines laufenden Blocks
      } else if (start !== null) {
        // Fall 2: Zelle inaktiv (weiß) – und es gab vorher eine aktive Gruppe
        blocks.push({
          blockStartCol: start,
          blockRow: row,
          blockWidth: length,
        });
        start = null;
        length = 0;
      }
    }
  }
}
