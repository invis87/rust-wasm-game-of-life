import { Universe, Cell } from "wasm-game-of-life";
// Import the WebAssembly memory at the top of the file.
import { memory } from "wasm-game-of-life/wasm_game_of_life_bg";

const CELL_SIZE = 5; // px
const GRID_COLOR = "#CCCCCC";
const DEAD_COLOR = "#FFFFFF";
const ALIVE_COLOR = "#000000";

// Construct the universe, and get its width and height.
const TOTAL_SIZE = 1024;
const universe = Universe.new(TOTAL_SIZE, TOTAL_SIZE);
const width = universe.width();
const height = universe.height();

// Give the canvas room for all of our cells and a 1px border
// around each of them.
const canvas = document.getElementById("game-of-life-canvas");
canvas.height = (CELL_SIZE + 1) * height + 1;
canvas.width = (CELL_SIZE + 1) * width + 1;

// Change Cell state logic
canvas.addEventListener("click", event => {
  const boundingRect = canvas.getBoundingClientRect();

  const scaleX = canvas.width / boundingRect.width;
  const scaleY = canvas.height / boundingRect.height;

  const canvasLeft = (event.clientX - boundingRect.left) * scaleX;
  const canvasTop = (event.clientY - boundingRect.top) * scaleY;

  const row = Math.min(Math.floor(canvasTop / (CELL_SIZE + 1)), height - 1);
  const col = Math.min(Math.floor(canvasLeft / (CELL_SIZE + 1)), width - 1);

  universe.toggle_cell(row, col);

  drawGrid();
  drawCells();
});
// === end of change cell logic

// Input range logic
const ticksPerRenderInput = document.getElementById("ticks_per_render");
const ticksPerRenderLabel = document.getElementById("ticks_per_render_label");
let ticksPerRender = ticksPerRenderInput.valueAsNumber;
let currentTick = 0;

ticksPerRenderInput.addEventListener("change", event => {
  ticksPerRender = ticksPerRenderInput.valueAsNumber;
  currentTick = 0;
});

// end of input range logic

// Tick button logic
const tickButton = document.getElementById("game-tick");
tickButton.textContent = "next step";

tickButton.addEventListener("click", event => {
    universe.tick();

    drawGrid();
    drawCells();
});
// end of tick button logic

// Play/Pause button logic
let animationId = null;
const isPaused = () => {
  return animationId === null;
};

const playPauseButton = document.getElementById("play-pause");

const play = () => {
  playPauseButton.textContent = "⏸";
  renderLoop();

  tickButton.disabled = true;
};

const pause = () => {
  playPauseButton.textContent = "▶";
  cancelAnimationFrame(animationId);
  animationId = null;

  tickButton.disabled = false;
};

playPauseButton.addEventListener("click", event => {
  if (isPaused()) {
    play();
  } else {
    currentTick = 0;
    pause();
  }
});
// === end of button logic ===

const ctx = canvas.getContext('2d');
const renderLoop = () => {
  currentTick += ticksPerRender;
  if (currentTick >= 1) {
    let ticksIterator = Math.floor(currentTick);
    for( ; ticksIterator--; ) {
      universe.tick();
    }
    currentTick = 0;

    // draw only if game state changed
    drawGrid();
    drawCells();
  }

  animationId = requestAnimationFrame(renderLoop);
};

const drawGrid = () => {
  ctx.beginPath();
  ctx.strokeStyle = GRID_COLOR;

  // Vertical lines.
  for (let i = 0; i <= width; i++) {
    ctx.moveTo(i * (CELL_SIZE + 1) + 1, 0);
    ctx.lineTo(i * (CELL_SIZE + 1) + 1, (CELL_SIZE + 1) * height + 1);
  }

  // Horizontal lines.
  for (let j = 0; j <= height; j++) {
    ctx.moveTo(0,                           j * (CELL_SIZE + 1) + 1);
    ctx.lineTo((CELL_SIZE + 1) * width + 1, j * (CELL_SIZE + 1) + 1);
  }

  ctx.stroke();
};

const bitIsSet = (n, arr) => {
  const byte = Math.floor(n / 8);
  const mask = 1 << (n % 8);
  return (arr[byte] & mask) === mask;
};

const drawCells = () => {
  const cellsPtr = universe.cells();
  const cells = new Uint8Array(memory.buffer, cellsPtr, width * height / 8);

  ctx.beginPath();

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const idx = universe.get_index(row, col);

      ctx.fillStyle = bitIsSet(idx, cells)
        ? DEAD_COLOR
        : ALIVE_COLOR;

      ctx.fillRect(
        col * (CELL_SIZE + 1) + 1,
        row * (CELL_SIZE + 1) + 1,
        CELL_SIZE,
        CELL_SIZE
      );
    }
  }

  ctx.stroke();
};

drawGrid();
drawCells();
play();