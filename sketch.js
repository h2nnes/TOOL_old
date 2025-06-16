// website vairables
var sliderWidth = document.getElementById("sliderWidth");
var sliderHeight = document.getElementById("sliderHeight");
var numButtTilesX = document.getElementById("numButt-tilesX");
var numButtTilesY = document.getElementById("numButt-tilesY");
var clearCanvasButton = document.getElementById("cleanCanvasBttn");
var saveCanvasButton = document.getElementById("saveCanvasBttn");
var checkboxShowGrid = document.getElementById("checkboxShowGrid");


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
  var canvas = createCanvas(parseInt(sliderWidth.value), parseInt(sliderHeight.value)); // Zeichenfläche erstellen
  canvas.parent("canvasWrapper");

  tilesX = parseInt(numButtTilesX.value);
  tilesY = parseInt(numButtTilesY.value);

  
  tileW = width / tilesX;
  tileH = height / tilesY;

  // 2D-Array initialisieren
  for (let x = 0; x < tilesX; x++) {
    gridState[x] = [];
    for (let y = 0; y < tilesY; y++) {
      gridState[x][y] = false; // Anfangszustand: alle Zellen sind aus
    }
  }

  sliderWidth.addEventListener("input", resizeCanvasFromSliders);
  sliderHeight.addEventListener("input", resizeCanvasFromSliders);
  numButtTilesX.addEventListener("input", adjustGridFromSliders);
  numButtTilesY.addEventListener("input", adjustGridFromSliders);
  clearCanvasButton.addEventListener("click", clearGrid);
  saveCanvasButton.addEventListener("click", saveCurrentCanvas);
}

function draw() {
  background(255); // hellgrauer Hintergrund

  if (checkboxShowGrid.checked) { // zeichnet Grid inkl. schwarz-weißer Zellen
    drawGrid(); // Nur zeichnen, wenn Checkbox aktiviert ist
  } 
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

function clearGrid() {
  // Alle Zellen auf "aus" setzen
  for (let x = 0; x < tilesX; x++) {
    for (let y = 0; y < tilesY; y++) {
      gridState[x][y] = false;
    }
  }

  // Blöcke ebenfalls leeren
  blocks = [];

  redraw(); // falls du noLoop verwendest
}


function adjustGridFromSliders() {
  tilesX = parseInt(numButtTilesX.value);
  tilesY = parseInt(numButtTilesY.value);

  tileW = width / tilesX;
  tileH = height / tilesY;

  // Grid-State neu initialisieren
  gridState = [];
  for (let x = 0; x < tilesX; x++) {
    gridState[x] = [];
    for (let y = 0; y < tilesY; y++) {
      gridState[x][y] = false;
    }
  }

  // Blöcke leeren (falls nicht mehr gültig)
  blocks = [];

  redraw(); // draw() sofort ausführen (nur nötig bei noLoop)
}


function resizeCanvasFromSliders() {
  let newWidth = parseInt(sliderWidth.value);
  let newHeight = parseInt(sliderHeight.value);
  resizeCanvas(newWidth, newHeight);

  tileW = width / tilesX;
  tileH = height / tilesY;

  redraw(); // nur nötig bei noLoop()
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

function saveCurrentCanvas() {
  // Speichert das Canvas als PNG mit aktuellem Datum im Dateinamen
  let now = new Date();

  // Teile des Datums extrahieren und zweistellig formatieren
  let yy = String(now.getFullYear()).slice(2); // nur die letzten 2 Ziffern des Jahres
  let mm = String(now.getMonth() + 1).padStart(2, '0'); // Monate sind 0-basiert
  let dd = String(now.getDate()).padStart(2, '0');

  let filename = `${yy}${mm}${dd}_myCanvas`;

  saveCanvas(filename, 'png');
}
