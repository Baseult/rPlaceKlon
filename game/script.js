const socket = io();

// Hole sich das Canvas-Element und den Kontext
const canvas = document.getElementById('canvasx');
const context = canvas.getContext('2d');

// Setzen Sie die Größe des Canvas
const canvasWidth = window.innerWidth;
const canvasHeight = window.innerHeight;
canvas.width = canvasWidth;
canvas.height = canvasHeight;

// Setzen Sie neue Canvas-Eigenschaften
const newCanvasWidth = 1000;
const newCanvasHeight = 1000;
const pixelSize = 1; // Jedes "Pixel" im Schachbrett ist 10x10 Pixel groß
let remainingCooldown = 0;

let CenterPixelX = 0;
let CenterPixelY = 0;
let initialScale = 1;
let newScale = 1;
let pixelX = 0;
let pixelY = 0;
let pixelCX = 0;
let pixelCY = 0;

let selectedColor = 'nothing'; // Die Standardfarbe ist schwarz

let pixelData;
let centerPixelData = [500, 500];

let t1 = 0;
let t2 = 0;

let cachedImageData;

// Erstellen Sie ein neues Canvas-Element
const newCanvas = document.createElement('canvas');
newCanvas.width = newCanvasWidth;
newCanvas.height = newCanvasHeight;
newCanvas.id = 'newCanvas';

// Initialisieren Sie den Kontext des neuen Canvas
const newContext = newCanvas.getContext('2d', {willReadFrequently: true});
newContext.fillStyle = 'white';
newContext.fillRect(0, 0, newCanvasWidth, newCanvasHeight);


// Berechnen Sie die neue Canvas-Position, um sie auf dem Hauptcanvas zu zentrieren
const newCanvasX = (canvasWidth - newCanvasWidth) / 2;
const newCanvasY = (canvasHeight - newCanvasHeight) / 2;

// Initialisieren Sie Variablen für das Ziehen
let isDragging = false;
let dragStartPosition = {x: 0, y: 0};
let currentTransformedCursor;
let currentTransformedCenter;

const newCanvasPosition = {
  x: (canvasWidth - newCanvasWidth) / 2,
  y: (canvasHeight - newCanvasHeight) / 2
};


// Ereignislistener für Fenstergrößenänderungen
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  // Aktualisieren Sie die neue Canvas-Position
  newCanvasPosition.x = (canvas.width - newCanvasWidth) / 2;
  newCanvasPosition.y = (canvas.height - newCanvasHeight) / 2;
  drawNewCanvas();
});


// Erstellen Sie das grüne div-Element
const greenDiv = document.createElement('div');
greenDiv.style.position = 'absolute';
greenDiv.style.width = '1px'; // Setzen Sie die anfängliche Breite (nach Bedarf anpassbar)
greenDiv.style.height = '1px'; // Setzen Sie die anfängliche Höhe (nach Bedarf anpassbar)
greenDiv.style.backgroundColor = 'green';
greenDiv.style.left =  `${newCanvasX}px` ; // Setzen Sie die anfängliche X-Position, um das div auf dem newCanvas zu zentrieren
greenDiv.style.top =  `${newCanvasY}px` ; // Setzen Sie die anfängliche Y-Position, um das div auf dem newCanvas zu zentrieren

// Fügen Sie das grüne div dem Dokumentkörper hinzu
document.body.appendChild(greenDiv);

const svgString =  `<svg fill="none" viewBox="0 0 26 28" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"> <!-- Fügen Sie die Glühfilterdefinition mit Animation hinzu -->
  <defs>
    <filter id="glow" x="-5%" y="-5%" width="110%" height="110%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="glow">
        <!-- Fügen Sie die Animation für den Pulsareffekt hinzu -->
        <animate attributeName="stdDeviation" attributeType="XML" values="2; 5; 2" dur="2s" repeatCount="indefinite" />
      </feGaussianBlur>
      <feFlood flood-color="red" result="glowColor" />
      <feComposite in="glowColor" in2="glow" operator="in" result="glowComposite" />
      <feMerge>
        <feMergeNode in="glowComposite" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <!-- SVG-Inhalt mit Rechtecken --> 
  <rect x="3" y="3" width="3" height="7" fill="black"></rect> <rect width="3" height="7" transform="matrix(-1 0 0 1 23 3)" fill="black"></rect> <rect width="3" height="7" transform="matrix(-1 0 0 1 26 3)" fill="#E2E7E9"></rect> <rect y="3" width="3" height="7" fill="#E2E7E9"></rect> <rect width="3" height="7" transform="matrix(4.37114e-08 -1 -1 -4.37114e-08 23 26)" fill="#E2E7E9"></rect> <rect x="3" y="26" width="3" height="7" transform="rotate(-90 3 26)" fill="#E2E7E9"></rect> <rect width="3" height="10" transform="matrix(1.19249e-08 -1 -1 -1.19249e-08 26 3)" fill="#E2E7E9"></rect> <rect y="3" width="3" height="10" transform="rotate(-90 0 3)" fill="#E2E7E9"></rect> <rect width="3" height="10" transform="matrix(1 5.56363e-08 5.56363e-08 -1 23 26)" fill="#E2E7E9"></rect> <rect x="3" y="26" width="3" height="10" transform="rotate(180 3 26)" fill="#E2E7E9"></rect> <rect x="3" y="23" width="3" height="7" transform="rotate(-90 3 23)" fill="black"></rect> <rect width="3" height="7" transform="matrix(4.37114e-08 -1 -1 -4.37114e-08 23 23)" fill="black"></rect> <rect x="10" y="3" width="3" height="7" transform="rotate(90 10 3)" fill="black"></rect> <rect opacity="0.5" x="10" y="26" width="2" height="10" transform="rotate(90 10 26)" fill="black"></rect> <rect opacity="0.5" x="26" y="26" width="2" height="10" transform="rotate(90 26 26)" fill="black"></rect> <rect opacity="0.5" x="10" y="6" width="2" height="4" transform="rotate(90 10 6)" fill="black"></rect> <rect opacity="0.5" x="6" y="10" width="2" height="6" transform="rotate(90 6 10)" fill="black"></rect> <rect opacity="0.5" x="26" y="10" width="2" height="6" transform="rotate(90 26 10)" fill="black"></rect> <rect opacity="0.5" x="20" y="6" width="2" height="4" transform="rotate(90 20 6)" fill="black"></rect> <rect width="3" height="7" transform="matrix(4.37114e-08 1 1 -4.37114e-08 16 3)" fill="black"></rect> <rect x="3" y="16" width="3" height="7" fill="black"></rect> <rect width="3" height="7" transform="matrix(-1 0 0 1 23 16)" fill="black"></rect> </svg>` ;

const svgOverlay = document.createElement('div');
svgOverlay.id = 'svg-overlay';
svgOverlay.innerHTML = svgString;
svgOverlay.style.position = 'absolute';
svgOverlay.style.left =  `${newCanvasX}px` ; // Setzen Sie die anfängliche X-Position, um das div auf dem newCanvas zu zentrieren
svgOverlay.style.top =  `${newCanvasY}px` ; // Setzen Sie die anfängliche Y-Position, um das div auf dem newCanvas zu zentrieren
svgOverlay.style.filter = 'url(#glow)';
svgOverlay.style.opacity = '0';
// Setzen Sie die anfängliche Skalierung auf 1 (100%)

// Fügen Sie das SVG-Overlay dem Body hinzu
document.body.appendChild(svgOverlay);


newCanvas.onload = drawNewCanvas();

// Ereignislistener für Mausklick auf dem Canvas
canvas.addEventListener('mousedown', onMouseDown);

// Ereignislistener für Mausbewegung auf dem Canvas
canvas.addEventListener('mousemove', onMouseMove);

// Ereignislistener für Mausfreigabe auf dem Canvas
canvas.addEventListener('mouseup', onMouseUp);

// Ereignislistener für das Mausrad auf dem Canvas
canvas.addEventListener('wheel', onWheel);

// Funktion zum Anzeigen des Lade-Overlays
function showLoadingOverlay() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  loadingOverlay.style.display = 'flex';
}

// Funktion zum Ausblenden des Lade-Overlays
function hideLoadingOverlay() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  loadingOverlay.classList.add("hidden");

  canvas.classList.add("show");
}


socket.on('initialLeaderboard', (leaderboardData) => {
  updateLeaderboard(leaderboardData);
});

socket.on('relogin', () => {
  // Zeigen Sie das Warnungsmodal an
  svgOverlay.style.opacity =  `0` ;
  const warningModal = document.getElementById('warningModal');
  const warningTextElement = document.querySelector('.warning-text');
  warningTextElement.innerHTML =  `Dein Login ist abgelaufen.<br> Bitte logge dich erneut ein!` ;
  warningModal.classList.add('show');

  // Verstecken Sie das Warnungsmodal automatisch nach einigen Sekunden (optional)
  setTimeout(() => {
    warningModal.classList.remove('show');
    svgOverlay.style.width =  `1` ;
    window.location.href = "http://127.0.0.1/login/index.html";
  }, 7000); // Verstecken Sie das Modal nach 5 Sekunden (passen Sie die Zeit nach Bedarf an)

});

socket.on('updateLeaderboard', (leaderboardData) => {
  updateLeaderboard(leaderboardData);
});


function updateLeaderboard(leaderboardData) {
  const leaderboardEntries = document.querySelector('.leaderboard-entries');
  leaderboardEntries.innerHTML = ''; // Vorherigen Inhalt löschen

  leaderboardData.forEach((entry, index) => {
    const { username, pixelCount } = entry;

    // Erstellen Sie eine neue Zeile für jeden Benutzer im Leaderboard
    const rowElement = document.createElement('div');
    rowElement.classList.add('leaderboard-entry');
    rowElement.innerHTML =  `
      <span class="leaderboard-rank">${index + 1}</span>
      <span class="leaderboard-user">${username}</span>
      <span class="leaderboard-pixel">${pixelCount}</span>
    ` ;

    leaderboardEntries.appendChild(rowElement);
  });
}


socket.on('rateLimitReached', () => {
  // Zeigen Sie das Warnungsmodal an
  svgOverlay.style.opacity =  `0` ;
  const warningModal = document.getElementById('warningModal');
  warningModal.classList.add('show');

  // Verstecken Sie das Warnungsmodal automatisch nach einigen Sekunden (optional)
  setTimeout(() => {
    warningModal.classList.remove('show');
    svgOverlay.style.width =  `1` ;
  }, 8000); // Verstecken Sie das Modal nach 5 Sekunden (passen Sie die Zeit nach Bedarf an)
});


socket.on('time', (time) => {
  remainingCooldown = time.lastPaintTime;

  if (remainingCooldown > 1) {
    startCooldownTimer(remainingCooldown);
  }
  document.getElementById('paintButton').classList.add("show");
});

socket.on('initialCanvasData', (canvasData) => {
  if (canvasData) {
    // Zeigen Sie das Lade-Overlay an, während das anfängliche Canvas gezeichnet wird
    showLoadingOverlay();
    drawInitialCanvas(canvasData);
    // Verstecken Sie das Lade-Overlay, sobald das anfängliche Canvas gezeichnet ist
  } else {
    console.log('Error: Initial canvas data not received');
  }
});

socket.on('updateCanvasData', ({x, y, color}) => {
  if (x >= 0 && x < newCanvasWidth && y >= 0 && y < newCanvasHeight) {
    updateCanvasPixel(x, y, color);
  } else {
    console.log( `Invalid pixel coordinates: (${x}, ${y})` );
  }
});

function drawInitialCanvas(canvasData) {
  const imageData = new ImageData(newCanvasWidth, newCanvasHeight);
  const data = new Uint8ClampedArray(imageData.data.buffer);
  for (let y = 0; y < newCanvasHeight; y++) {
    for (let x = 0; x < newCanvasWidth; x++) {
      const colorObj = canvasData[y][x]; // Zugriff auf das Objekt bei [y][x]
      const color = colorObj.color; // Zugriff auf die Farbeigenschaft des Objekts
      const rgbValues = color.match(/\d+/g);
      const index = (y * newCanvasWidth + x) * 4;
      data[index] = parseInt(rgbValues[0]);
      data[index + 1] = parseInt(rgbValues[1]);
      data[index + 2] = parseInt(rgbValues[2]);
      data[index + 3] = 255; // Alpha (255 bedeutet vollständig undurchsichtig)
    }
  }
  newContext.putImageData(imageData, 0, 0);
  context.drawImage(newCanvas, newCanvasX, newCanvasY);
  hideLoadingOverlay();
}


// Funktion zum Aktualisieren des Canvas des Clients mit dem neu gemalten Pixel
function updateCanvasPixel(x, y, color) {
  // Überprüfen Sie, ob die Koordinaten innerhalb der Grenzen des neuen Canvas liegen
  if (x >= 0 && x < newCanvasWidth && y >= 0 && y < newCanvasHeight) {
    newContext.fillStyle = color;
    newContext.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);

    // Zeichnen Sie das neue Canvas auf dem Hauptcanvas
    context.drawImage(newCanvas, newCanvasX, newCanvasY);
  } else {
    console.log( `Invalid pixel coordinates: (${x}, ${y})` );
  }
}

// Funktion zum Berechnen von Pixelkoordinaten und Farbe
function calculatePixelCoordinatesAndColor(x, y) {
  // Berechnen Sie die relative Position auf dem neuen Canvas
  const relativeX = x - newCanvasX;
  const relativeY = y - newCanvasY;
  // Berechnen Sie die entsprechenden Pixelkoordinaten auf dem neuen Canvas
  const pixelX = Math.floor(relativeX / pixelSize);
  const pixelY = Math.floor(relativeY / pixelSize);
  // Stellen Sie sicher, dass die Pixelkoordinaten innerhalb der Grenzen des neuen Canvas liegen

  if (pixelX >= 0 && pixelX < newCanvasWidth && pixelY >= 0 && pixelY < newCanvasHeight) {
    // Holen Sie sich die Pixelfarbe aus dem neuen Canvas
    if (!cachedImageData) {
      cachedImageData = newContext.getImageData(0, 0, newCanvasWidth, newCanvasHeight);
    }
    const index = (pixelY * newCanvasWidth + pixelX) * 4;
    const color = [
      cachedImageData.data[index],
      cachedImageData.data[index + 1],
      cachedImageData.data[index + 2],
      cachedImageData.data[index + 3]
    ];
    return {pixelX, pixelY, color};
  } else {
    return {pixelX: 0, pixelY: 0, color: [0, 0, 0, 0]};
  }
}

// Funktion zum Zeichnen des neuen Canvas
function drawNewCanvas() {
  // Setzen Sie die Bildrendering- und Glättungsoptionen
  newCanvas.style.imageRendering = 'pixelated';
  newContext.imageSmoothingEnabled = false;
  context.imageSmoothingEnabled = false;
  context.fillStyle = 'gray';
  context.fillRect(-10000, -10000, 100000, 100000);

  context.drawImage(newCanvas, newCanvasX, newCanvasY);
}

// Funktion zum Behandeln des Mausklick-Ereignisses auf dem Canvas
function onMouseDown(event) {
  isDragging = true;
  event.preventDefault(); // Textauswahl verhindern
  dragStartPosition = getTransformedPoint(event.offsetX, event.offsetY);
}

// Funktion zum Abrufen des transformierten Punkts
function getTransformedPoint(x, y) {
  // Überprüfen Sie, ob das Canvas eine aktuelle Transformationsmatrix hat
  if (context.getTransform && context.getTransform().isIdentity) {
    // Wenn nicht transformiert, geben Sie den ursprünglichen Punkt für Mausereignisse zurück
    return new DOMPoint(x, y);
  } else {
    // Wenn transformiert, berechnen Sie den transformierten Punkt für Maus- und Touch-Ereignisse
    const originalPoint = new DOMPoint(x, y);
    return context.getTransform().invertSelf().transformPoint(originalPoint);
  }
}

let rafId = null;
let slidingVelocity = { x: 0, y: 0 };

function onMouseMove(event) {

  // Berechnen Sie die Mitte des Bildschirms
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  currentTransformedCursor = getTransformedPoint(event.offsetX, event.offsetY);

  if (isDragging) {
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    rafId = requestAnimationFrame(() => {
      context.translate(currentTransformedCursor.x - dragStartPosition.x, currentTransformedCursor.y - dragStartPosition.y);
      currentTransformedCenter = getTransformedPoint(centerX, centerY);
      centerPixelData = calculatePixelCoordinatesAndColor(currentTransformedCenter.x, currentTransformedCenter.y);
      slidingVelocity.x = currentTransformedCursor.x - dragStartPosition.x;
      slidingVelocity.y = currentTransformedCursor.y - dragStartPosition.y;
      drawNewCanvas();
      updateCenterCoordinates();
      updateGreenDivPositionAndSize();
    });
  }

  pixelData = calculatePixelCoordinatesAndColor(currentTransformedCursor.x, currentTransformedCursor.y);
}

function updateCanvas() {
  // Verringern Sie die Schiebegeschwindigkeit allmählich
  slidingVelocity.x *= 0.95;
  slidingVelocity.y *= 0.95;

  // Überprüfen Sie, ob das Schieben zu stark ist oder die Bewegung zu klein ist

  // Wenden Sie die Schiebetransformation auf das Canvas an
  context.translate(slidingVelocity.x, slidingVelocity.y);
  currentTransformedCenter = getTransformedPoint(window.innerWidth / 2, window.innerHeight / 2);
  centerPixelData = calculatePixelCoordinatesAndColor(currentTransformedCenter.x, currentTransformedCenter.y);
  drawNewCanvas();
  updateCenterCoordinates();
  updateGreenDivPositionAndSize();

  // Fahren Sie fort zu schieben, bis die Geschwindigkeit sehr klein ist
  if (Math.abs(slidingVelocity.x) > 0.1 || Math.abs(slidingVelocity.y) > 0.1) {
    rafId = requestAnimationFrame(updateCanvas);
  }
}


// Funktion zum Behandeln des Mausfreigabe-Ereignisses auf dem Canvas
function onMouseUp() {
  isDragging = false;
  rafId = requestAnimationFrame(updateCanvas);
}


// Funktion zum Behandeln des Mausrad-Ereignisses auf dem Canvas
function onWheel(event) {

  if (rafId) {
    cancelAnimationFrame(rafId);
  }
  rafId = requestAnimationFrame(() => {
    // Löschen Sie die zwischengespeicherten Bilddaten nach dem Zoomen
    cachedImageData = null;

    const zoom = event.deltaY < 0 ? 1.75 : 0.75;
    const currentScale = context.getTransform().a;
    const targetScale = currentScale * zoom;
    const newscale = Math.pow(targetScale / currentScale, 1 / 20); // Berechnen Sie den Skalierungsfaktor für jedes Frame, um den targetScale zu erreichen
    newScale = currentScale;
    let animations = 0;

    const zoomAnimation = () => {
      animations++;

      newScale *= newscale;

      // Überprüfen Sie, ob die neue Skala im gewünschten Bereich liegt (0,5 bis 50)
      if (newScale >= 0.5 && newScale <= 50) {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        currentTransformedCursor = getTransformedPoint(event.offsetX, event.offsetY);
        currentTransformedCenter = getTransformedPoint(centerX, centerY);

        // Wenden Sie die Zoom-Transformation an
        context.translate(currentTransformedCursor.x, currentTransformedCursor.y);
        context.scale(newscale, newscale);
        context.translate(-currentTransformedCursor.x, -currentTransformedCursor.y);

        initialScale = newScale;

        pixelData = calculatePixelCoordinatesAndColor(currentTransformedCursor.x, currentTransformedCursor.y);
        centerPixelData = calculatePixelCoordinatesAndColor(currentTransformedCenter.x, currentTransformedCenter.y);

        if (pixelData) {
          CenterPixelX = pixelData.pixelX;
          CenterPixelY = pixelData.pixelY;
        }

        drawNewCanvas();
        updateCenterCoordinates();
        updateGreenDivPositionAndSize();

        if (Math.abs(newScale - targetScale) < 0.001 || animations >= 20) {
          animations = 0;
          cancelAnimationFrame(rafId); // Stoppen Sie die Animation
          // Alle anderen Aktionen nach Erreichen der Ziel-Skala durchführen
          return;
        }

        rafId = requestAnimationFrame(zoomAnimation);
      }
    };

    event.preventDefault();
    rafId = requestAnimationFrame(zoomAnimation);
  });
}

function paintPixel(x, y) {
  const scaledX = Math.floor(x * pixelSize);
  const scaledY = Math.floor(y * pixelSize);
  newContext.fillStyle = selectedColor;
  newContext.fillRect(scaledX, scaledY, pixelSize, pixelSize);
  socket.emit('paintPixel', {x: x, y: y, color: selectedColor});
  context.drawImage(newCanvas, newCanvasX, newCanvasY);
}

function updateGreenDivPositionAndSize() {

  // Berechnet die transformierte Position und Größe des grünen Divs
  const transformedX = (canvasWidth - newCanvasWidth) / 2;
  const transformedY = (canvasHeight - newCanvasHeight) / 2;
  const transformedSize = initialScale; // Passt die Größe basierend auf der neuen Skalierung an

  // Holt die aktuelle Transformationsmatrix des Canvas
  const canvasTransform = context.getTransform();

  // Berechnet die transformierte Position des grünen Divs
  const transformedGreenX = canvasTransform.a * transformedX + canvasTransform.e;
  const transformedGreenY = canvasTransform.d * transformedY + canvasTransform.f;

  // Aktualisiert die Position und Größe des grünen Divs
  svgOverlay.style.width =  `${transformedSize}px` ;
  svgOverlay.style.height =  `${transformedSize}px` ;
  svgOverlay.style.left =  `${transformedGreenX}px` ;
  svgOverlay.style.top =  `${transformedGreenY}px` ;

  let opacity = 0;
  if (newScale >= 10 && newScale <= 25) {
    opacity = (newScale - 10) / (25 - 10); // Die Deckkraft nimmt linear von 0 bis 1 zwischen den Skalen 10 und 25 zu
  } else if (newScale > 25) {
    opacity = 1; // Die Deckkraft ist vollständig 1 (vollständig deckend) für Skalen größer als 25
  }

  // Wendet die berechnete Deckkraft auf die SVG-Overlay an
  svgOverlay.style.opacity = opacity;

  if (
      centerPixelData.pixelX !== 0 &&
      centerPixelData.pixelY !== 0 &&
      !Array.isArray(centerPixelData.color) ||
      centerPixelData.color.length !== 4 ||
      centerPixelData.color.some((c) => c !== 0)
  ) {
    moveGreenDiv(centerPixelData.pixelX * initialScale, centerPixelData.pixelY * initialScale);
  } else {
    svgOverlay.style.opacity = 0;
  }
}


// Funktion, um das grüne Div um eine gegebene Menge (dx, dy) zu verschieben
function moveGreenDiv(dx, dy) {
  // Holt die aktuelle Position des grünen Divs
  const currentX = parseFloat(svgOverlay.style.left);
  const currentY = parseFloat(svgOverlay.style.top);

  // Berechnet die neue Position durch Hinzufügen der Schrittgröße (dx, dy)
  const newX = currentX + dx;
  const newY = currentY + dy;


  svgOverlay.style.left =  `${newX}px` ;

  svgOverlay.style.top =  `${newY}px` ;
}


// Event-Listener zur Behandlung der Farbauswahl
document.getElementById('colorPalette').addEventListener('click', (e) => {
  // Überprüft, ob das angeklickte Element die Klasse "color" hat
  if (e.target.classList.contains('color')) {
    const clickedColor = e.target.style.backgroundColor;
    selectColor(clickedColor);

    // Entfernt die Klasse "selected-color" von der zuvor ausgewählten Farbe (falls vorhanden)
    const selectedColor = document.querySelector('.selected-color');
    if (selectedColor) {
      selectedColor.classList.remove('selected-color');
    }

    // Fügt der angeklickten Farbe die Klasse "selected-color" hinzu
    e.target.classList.add('selected-color');

    document.getElementById('applyButton').style.backgroundColor = "#ff5b00";
  }
});


document.getElementById('applyButton').addEventListener('click', (e) => {

  document.getElementById('paintButton').style.display = 'block';
  const colorPaletteContainer = document.getElementById('colorPaletteContainer');
  colorPaletteContainer.classList.remove('open');

  if (selectedColor === "nothing") {
    return;
  }

  if (remainingCooldown > 0) {
    return;
  }

  // Sendet die aktualisierte Farbe an andere Benutzer über socket.io
  paintPixel(centerPixelData.pixelX, centerPixelData.pixelY);

  // Aktualisiert den Text des "Paint" Buttons unmittelbar nach dem Malen
  updatePaintButtonText(remainingCooldown);

  // Startet den Cooldown-Timer
  startCooldownTimer(60);

});


function zoomToTargetScale() {
  // Überprüft, ob die aktuelle Skalierung bereits der Ziel-Skala (30) entspricht
  if (initialScale >= 25) {
    return; // Kein Zoom erforderlich, bereits bei der Ziel-Skala
  }

  // Berechnet den Skalierungsfaktor, um die Ziel-Skala zu erreichen
  const scaleFactor = Math.pow(25, 1 / 60); // Berechnet den Skalierungsfaktor für jeden Frame, um in 60 Frames 30 zu erreichen

  // Startet die Animation
  const zoomAnimation = () => {
    // Löscht die zwischengespeicherten Bilddaten nach dem Zoomen
    cachedImageData = null;

    // Berechnet die neue Skala nach Anwendung des Skalierungsfaktors
    newScale *= scaleFactor;

    // Überprüft, ob die neue Skala die Ziel-Skala (25) überschreitet
    if (newScale >= 25) {
      newScale = 25; // Setzt die Skala auf die Ziel-Skala (25)
      // Aktualisiert gegebenenfalls andere zugehörige Variablen
    }

    // Berechnet die neue Transformationsmatrix mit der aktualisierten Skala
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    currentTransformedCursor = getTransformedPoint(centerX, centerY);
    context.translate(currentTransformedCursor.x, currentTransformedCursor.y);
    context.scale(newScale / initialScale, newScale / initialScale);
    context.translate(-currentTransformedCursor.x, -currentTransformedCursor.y);

    currentTransformedCenter = getTransformedPoint(centerX, centerY);
    centerPixelData = calculatePixelCoordinatesAndColor(currentTransformedCenter.x, currentTransformedCenter.y);

    initialScale = newScale;

    // Zeichnet das neue Canvas neu und aktualisiert die Position des grünen Divs
    drawNewCanvas();
    updateCenterCoordinates();
    updateGreenDivPositionAndSize();

    // Überprüft, ob die Ziel-Skala erreicht ist
    if (newScale >= 25) {
      cancelAnimationFrame(rafId); // Stoppt die Animation
      // Führt nach Erreichen der Ziel-Skala weitere Aktionen aus
      return;
    }

    // Setzt die Animation fort
    rafId = requestAnimationFrame(zoomAnimation);
  };

  // Startet die Zoom-Animation
  rafId = requestAnimationFrame(zoomAnimation);
}

// Funktion zur Behandlung der Malaktion, wenn der "Paint" Button geklickt wird
// Event-Listener für den Klick auf den "Paint" Button
document.getElementById('paintButton').addEventListener('click', (e) => {

  if (remainingCooldown > 0) {
    return;
  }

  document.getElementById('paintButton').style.display = 'none';

  if (initialScale < 25) {
    zoomToTargetScale();
  }

  const colorPanel = document.querySelector('.color-palette-container');
  const colorPanelIsVisible = window.getComputedStyle(colorPanel).display !== 'none';

  if (!colorPanelIsVisible) {
    const colorPaletteContainer = document.querySelector('.color-palette-container');
    colorPaletteContainer.classList.toggle('open');
    return;
  }

  if (remainingCooldown > 0) {
    return;
  }

  // Sendet die aktualisierte Farbe an andere Benutzer über socket.io
  paintPixel(centerPixelData.pixelX, centerPixelData.pixelY);

  // Aktualisiert den Text des "Paint" Buttons unmittelbar nach dem Malen
  updatePaintButtonText(remainingCooldown);

  // Startet den Cooldown-Timer
  startCooldownTimer(60);

});

// Funktion zur Aktualisierung des Texts des "Paint" Buttons mit der verbleibenden Abkühlzeit in Sekunden
function updatePaintButtonText(remainingCooldown) {
  if (remainingCooldown > 0) {
    document.getElementById('paintButton').disabled = true;
    document.getElementById('paintButton').style.backgroundColor = 'dimgray';
    document.getElementById('place-text').textContent =  `Malen in ${remainingCooldown}` ;
  } else {
    document.getElementById('paintButton').disabled = false;
    document.getElementById('paintButton').style.backgroundColor = '#cb5105';
    document.getElementById('place-text').textContent = 'Malen';
  }
}

// Funktion zum Starten des Cooldown-Timers
function startCooldownTimer(seconds) {
  remainingCooldown = seconds;
  updatePaintButtonText(remainingCooldown);
  const intervalId = setInterval(() => {
    remainingCooldown -= 1;
    updatePaintButtonText(remainingCooldown);

    // Wenn der Cooldown abgelaufen ist, löscht das Intervall und setzt den Text des "Paint" Buttons zurück
    if (remainingCooldown === 0) {
      clearInterval(intervalId);
      updatePaintButtonText(0);
    }
  }, 1000);
}

// Funktion zum Setzen der ausgewählten Farbe beim Klicken auf eine Farbe in der Palette
function selectColor(color) {
  selectedColor = color;
}


// Event-Listener für den Klick auf den "X" Button zum Schließen der Farbpalette
document.getElementById('closeButton').addEventListener('click', () => {
  document.getElementById('paintButton').style.display = 'block';
  const colorPaletteContainer = document.getElementById('colorPaletteContainer');
  colorPaletteContainer.classList.remove('open');
});

// Funktion zur Aktualisierung der Zentrumskoordinaten beim Verschieben des Canvas
function updateCenterCoordinates() {
  const centerCoordinatesElement = document.getElementById('centerCoordinates');
  centerCoordinatesElement.textContent =  `(${centerPixelData.pixelX.toFixed(0)}, ${centerPixelData.pixelY.toFixed(0)})` ;
}


let touchStartPosition = {x: 0, y: 0};
let pinchDistance = 0;

// Funktion zur Behandlung des Touch-Start-Ereignisses auf dem Canvas
function onTouchStart(event) {
  // Wenn zwei Finger den Bildschirm berühren, startet das Pinch-Zoomen
  if (event.touches.length === 2) {
    isDragging = false; // Ziehen während des Pinch-Zoomens deaktivieren
    pinchDistance = calculatePinchDistance(event.touches[0], event.touches[1]);
    touchStartPosition = {
      x: (event.touches[0].clientX + event.touches[1].clientX) / 2,
      y: (event.touches[0].clientY + event.touches[1].clientY) / 2,
    };
  } else if (event.touches.length === 1) {
    // Wenn ein einzelner Finger den Bildschirm berührt, wie gewohnt behandeln (Ziehen)
    isDragging = true;
    const touch = event.touches[0];
    dragStartPosition = getTransformedPoint(touch.clientX, touch.clientY);
  }
}

function getCenterOfScreen() {
  return {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  };
}

// Funktion zur Behandlung des Touch-Move-Ereignisses auf dem Canvas
function onTouchMove(event) {
  event.preventDefault(); // Standard-Touchmove-Verhalten verhindern (z. B. Scrollen der Seite)

  if (event.touches.length === 2) {
    // Pinch-Zoomen
    const newPinchDistance = calculatePinchDistance(event.touches[0], event.touches[1]);
    const zoom = newPinchDistance / pinchDistance;

    const currentScale = context.getTransform().a;
    newScale = currentScale * zoom;

    // Überprüfen, ob die neue Skala im gewünschten Bereich (1 bis 40) liegt
    if (newScale >= 0.5 && newScale <= 100) {

      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(() => {

        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        currentTransformedCursor = getTransformedPoint(centerX, centerY);
        context.translate(currentTransformedCursor.x, currentTransformedCursor.y);
        context.scale(zoom, zoom);
        context.translate(-currentTransformedCursor.x, -currentTransformedCursor.y);

        initialScale = newScale;

        currentTransformedCenter = getTransformedPoint(window.innerWidth / 2, window.innerHeight / 2);

        // Aktualisiert die Pixel-Daten und zeichnet das neue Canvas
        pixelData = calculatePixelCoordinatesAndColor(currentTransformedCursor.x, currentTransformedCursor.y);
        centerPixelData = calculatePixelCoordinatesAndColor(currentTransformedCenter.x, currentTransformedCenter.y);

        drawNewCanvas();
        updateCenterCoordinates();
        updateGreenDivPositionAndSize();

        pinchDistance = newPinchDistance;
      });
    }
  } else if (event.touches.length === 1 && isDragging) {
    // Einzelnes Finger-Ziehen
    const touch = event.touches[0];
    currentTransformedCursor = getTransformedPoint(touch.clientX, touch.clientY);

    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    rafId = requestAnimationFrame(() => {
      context.translate(currentTransformedCursor.x - dragStartPosition.x, currentTransformedCursor.y - dragStartPosition.y);
      currentTransformedCenter = getTransformedPoint(window.innerWidth / 2, window.innerHeight / 2);
      centerPixelData = calculatePixelCoordinatesAndColor(currentTransformedCenter.x, currentTransformedCenter.y);
      drawNewCanvas();
      updateCenterCoordinates();
      updateGreenDivPositionAndSize();
    });
  }
}

// Funktion zur Behandlung des Touch-End-Ereignisses auf dem Canvas
function onTouchEnd(event) {
  if (event.touches.length === 0) {
    // Keine Finger berühren den Bildschirm, daher das Ziehen stoppen
    isDragging = false;
  }
}

// Funktion zur Berechnung des Abstands zwischen zwei Berührungspunkten
function calculatePinchDistance(touch1, touch2) {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// Event-Listener für das Touch-Start-Ereignis auf dem Canvas
document.addEventListener('touchstart', onTouchStart);

// Event-Listener für das Touch-Move-Ereignis auf dem Canvas
document.addEventListener('touchmove', onTouchMove);

// Event-Listener für das Touch-End-Ereignis auf dem Canvas
document.addEventListener('touchend', onTouchEnd);


function hide_video() {
  setTimeout(() => {
    let embed1 = document.querySelector(".bgvideo");
    let embed2 = document.querySelector(".background");
    let embed3 = document.querySelector(".box-object");
    let embed4 = document.querySelector("#main");
    embed1.remove();
    embed2.remove();
    embed3.remove();
    embed4.remove();
  }, 3000);
}

function openBox() {
  const boxObject = document.querySelector('.box-object');
  const boxObjectInnerBorder = boxObject.querySelector('.box-object-inner-border');
  boxObject.classList.remove('box-to-romb');
  boxObjectInnerBorder.classList.remove('border-animation-4');
  boxObjectInnerBorder.classList.add('border-animation-2');
}

function hideMain() {
  const boxObject = document.querySelector('.box-object');
  const mainSectionElements = document.querySelector('.logo, .registration-form');
  mainSectionElements.classList.remove('show-effect');
  mainSectionElements.classList.add('hide-effect');
}


function showGame() {
  const gameSectionElements = document.getElementById('game-area');
  gameSectionElements.classList.remove('hide-effect');
  gameSectionElements.classList.add('show-effect');
  setTimeout(function () {
  }, 100);
  show_countdown();
}

function show_countdown() {
  setTimeout(function () {
    $('.days-wrap').addClass('countdown-wrap-active');
  }, 1000);
  setTimeout(function () {
    $('.hours-wrap').addClass('countdown-wrap-active');
  }, 1200);
  setTimeout(function () {
    $('.minutes-wrap').addClass('countdown-wrap-active');
  }, 1400);
  setTimeout(function () {
    $('.seconds-wrap').addClass('countdown-wrap-active');
  }, 1600);
  setTimeout(function () {
    $('.countdown-rotate').addClass('countdown-rotate-active');
  }, 1000);
}


function hide_particle() {
  setTimeout(() => {
    // Holt das Elternelement des zu ersetzenden Elements
    const parentElement = document.getElementById('particles-js');

    if (parentElement) {
      parentElement.remove();
    }

  }, 3000);
}

const leaderboardContainer = document.querySelector('.leaderboard-container');
const leaderboardButton = document.getElementById('leaderboardButton');

// Fügt dem Leaderboard-Button einen Klick-Event-Listener hinzu
leaderboardButton.addEventListener('click', () => {
  leaderboardContainer.classList.toggle('open');
});

let mouseX = 0;
let mouseY = 0;

// Event-Listener zur Verfolgung der Mausposition
document.addEventListener('mousemove', (event) => {
  mouseX = event.clientX;
  mouseY = event.clientY;
});

function handleRightClick(event) {
  event.preventDefault(); // Standard-Kontextmenü-Verhalten verhindern
  const pixelx = pixelData.pixelX;
  const pixely = pixelData.pixelY;
  socket.emit('getPixelOwner', pixelx, pixely); // pixelx und pixely als separate Argumente übergeben
}

canvas.addEventListener('contextmenu', handleRightClick);

function handlePixelOwnerResponse({ x, y, ownerUsername }) {
  const message = ownerUsername
      ?  `Das Pixel bei (${x}, ${y}) wurde von: ${ownerUsername} gemalt`
      :  `Das Pixel bei (${x}, ${y}) wurde von niemandem gemalt` ;
  console.log(message); // Diese Nachricht kann in der Konsole angezeigt oder in der Benutzeroberfläche angezeigt werden

  const pixelOwnerContainer = document.getElementById('pixelOwnerContainer');
  pixelOwnerContainer.innerHTML =  `Pixel von: ${ownerUsername}` ;
  pixelOwnerContainer.style.left =  `${mouseX + 35}px` ; // Container-Position entsprechend dem Cursor setzen
  pixelOwnerContainer.style.top =  `${mouseY}px` ; // Container-Position unterhalb des Cursors setzen (Wert je nach Bedarf anpassen)
  pixelOwnerContainer.style.display = 'block'; // Container anzeigen
}

// Event-Listener für das pixelOwnerResponse-Ereignis vom Server
socket.on('pixelOwnerResponse', handlePixelOwnerResponse);

document.addEventListener('mousemove', (event) => {
  const pixelOwnerContainer = document.getElementById('pixelOwnerContainer');
  pixelOwnerContainer.style.display = 'none'; // Container ausblenden
});

const chatInput = document.getElementById('chatInput');
chatInput.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    const message = chatInput.value;
    if (message.trim() !== '' && message.length <= 300) { // Überprüfen, ob die Nachrichtenlänge innerhalb des Limits liegt
      socket.emit('chatMessage', message);
      chatInput.value = '';

      chatInput.disabled = true;
      chatInput.placeholder = 'Bitte warten Sie 10 Sekunden, bevor Sie erneut schreiben...';
    }
  } else if (chatInput.value.length >= 300) {
    event.preventDefault(); // Weiteren Input verhindern, wenn die Nachrichtenlänge das Limit überschreitet
  }
});



// Funktion zum Anhängen einer Chat-Nachricht an den Chat-Container
function appendChatMessage(sender, message) {
  const chatMessages = document.getElementById('chatMessages');
  const newMessage = document.createElement('div');
  newMessage.classList.add('chat-message');
  if (sender === "Admin")
  {
    newMessage.innerHTML =  `<strong style="color: #ff0000">${sender}:</strong> <message style="color: #ffcc00">${message}</message>` ;
  }
  else
  {
    newMessage.innerHTML =  `<strong style="color: #1aff00">${sender}:</strong> <message style="color: #ffffff">${message}</message>` ;
  }
  chatMessages.appendChild(newMessage);
  chatMessages.scrollTop = chatMessages.scrollHeight; // Automatisches Scrollen zum Ende des Chats
}

// Chat-Verlauf vom Server laden
socket.emit('loadChatHistory');

// Auf Chat-Verlauf-Daten vom Server hören
socket.on('chatHistory', (chatHistory) => {
  const chatContainer = document.getElementById('chatMessages');
  chatContainer.innerHTML = ''; // Vorhandene Chat-Nachrichten löschen

  // Jede Chat-Nachricht dem Chat-Container hinzufügen
  chatHistory.forEach((chat) => {
    appendChatMessage(chat.sender, chat.message);
  });

  chatContainer.scrollTop = chatContainer.scrollHeight;
});

// Behandeln des Empfangens einer Chat-Nachricht vom Server
socket.on('chatMessage', ({ sender, message }) => {
  appendChatMessage(sender, message);
});

socket.on('chatCooldown', (remainingTime) => {
  const sendButton = document.getElementById('chatInput');
  sendButton.disabled = true;

  setTimeout(() => {
    sendButton.disabled = false;
    sendButton.placeholder = 'Schreibe deine Nachricht und drücke Enter...'; // Eingabeplatzhalter ändern
  }, remainingTime);
});

const toggleChatButton = document.getElementById('toggleChatButton');
const chatContainer = document.getElementById('chatContainer');

toggleChatButton.addEventListener('click', () => {
  if (chatContainer.style.display === 'none') {
    chatContainer.style.display = 'block'; // Chat-Container anzeigen
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
  } else {
    chatContainer.style.display = 'none'; // Chat-Container ausblenden
  }
});

socket.on('onlineUserCount', (count) => {
  // UI aktualisieren, um die Anzahl der online Benutzer anzuzeigen
  document.getElementById('online-user-count').innerText = count;
});

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
// Aktualisiert die neue Canvas-Position
newCanvasPosition.x = (canvas.width - newCanvasWidth) / 2;
newCanvasPosition.y = (canvas.height - newCanvasHeight) / 2;
drawNewCanvas();