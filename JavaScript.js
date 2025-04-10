const CELL_SIZE = 20;
const CANVAS_SIZE = 400;
const CELLS_COUNT = CANVAS_SIZE / CELL_SIZE;
const MOVEMENT_INTERVAL = 250;

const Direction = {
  Up: 0,
  Down: 1,
  Left: 2,
  Right: 3
};

let canvas;
let ctx;
let gameOver = false;
let isPlaying = true;
let score = { player: 0, computer: 0 };

class Position {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Snake {
  constructor(start, color) {
    this.body = [start];
    this.direction = Direction.Right;
    this.color = color;
  }

  move(grow = false) {
    const head = this.body[0];
    let newHead = { x: head.x, y: head.y };

    switch (this.direction) {
      case Direction.Up:
        newHead.y--;
        break;
      case Direction.Down:
        newHead.y++;
        break;
      case Direction.Left:
        newHead.x--;
        break;
      case Direction.Right:
        newHead.x++;
        break;
    }

    newHead.x = (newHead.x + CELLS_COUNT) % CELLS_COUNT;
    newHead.y = (newHead.y + CELLS_COUNT) % CELLS_COUNT;

    this.body.unshift(newHead);
    if (!grow) {
      this.body.pop();
    }
  }

  setDirection(dir) {
    if (
      (this.direction === Direction.Up && dir === Direction.Down) ||
      (this.direction === Direction.Down && dir === Direction.Up) ||
      (this.direction === Direction.Left && dir === Direction.Right) ||
      (this.direction === Direction.Right && dir === Direction.Left)
    ) {
      return;
    }
    this.direction = dir;
  }

  checkCollision(other) {
    const head = this.body[0];
    return other.body.some((cell, index) => index !== 0 && cell.x === head.x && cell.y === head.y);
  }

  checkSelfCollision() {
    const head = this.body[0];
    return this.body.slice(1).some(cell => cell.x === head.x && cell.y === head.y);
  }
}

class ComputerSnake extends Snake {
  constructor(start, color) {
    super(start, color);
    this.reactionDelay = 2;
    this.frameCounter = 0;
  }

  updateDirection(applePos, playerSnake) {
    this.frameCounter++;
    if (this.frameCounter < this.reactionDelay) return;
    this.frameCounter = 0;

    const head = this.body[0];

    if (playerSnake) {
      const playerHead = playerSnake.body[0];
      const distToPlayer = Math.abs(playerHead.x - head.x) + Math.abs(playerHead.y - head.y);
      
      if (distToPlayer < 3) {
        const dx = playerHead.x - head.x;
        const dy = playerHead.y - head.y;
        
        if (Math.abs(dx) <= 2) {
          if (dx > 0 && this.direction !== Direction.Right) {
            this.setDirection(Direction.Left);
            return;
          } else if (dx < 0 && this.direction !== Direction.Left) {
            this.setDirection(Direction.Right);
            return;
          }
        }
        
        if (Math.abs(dy) <= 2) {
          if (dy > 0 && this.direction !== Direction.Down) {
            this.setDirection(Direction.Up);
            return;
          } else if (dy < 0 && this.direction !== Direction.Up) {
            this.setDirection(Direction.Down);
            return;
          }
        }
      }
    }

    if (Math.random() < 0.10) {
      const possibleDirections = [Direction.Up, Direction.Down, Direction.Left, Direction.Right];
      const currentDirection = this.direction;
      const safeDirections = possibleDirections.filter(dir => {
        if (currentDirection === Direction.Up && dir === Direction.Down) return false;
        if (currentDirection === Direction.Down && dir === Direction.Up) return false;
        if (currentDirection === Direction.Left && dir === Direction.Right) return false;
        if (currentDirection === Direction.Right && dir === Direction.Left) return false;
        return true;
      });
      
      const randomDirection = safeDirections[Math.floor(Math.random() * safeDirections.length)];
      this.setDirection(randomDirection);
      return;
    }

    const xDist = applePos.x - head.x;
    const yDist = applePos.y - head.y;
    
    if (Math.abs(xDist) > Math.abs(yDist)) {
      if (xDist > 0 && this.direction !== Direction.Left) {
        this.setDirection(Direction.Right);
      } else if (xDist < 0 && this.direction !== Direction.Right) {
        this.setDirection(Direction.Left);
      } else if (yDist > 0 && this.direction !== Direction.Up) {
        this.setDirection(Direction.Down);
      } else if (yDist < 0 && this.direction !== Direction.Down) {
        this.setDirection(Direction.Up);
      }
    } else {
      if (yDist > 0 && this.direction !== Direction.Up) {
        this.setDirection(Direction.Down);
      } else if (yDist < 0 && this.direction !== Direction.Down) {
        this.setDirection(Direction.Up);
      } else if (xDist > 0 && this.direction !== Direction.Left) {
        this.setDirection(Direction.Right);
      } else if (xDist < 0 && this.direction !== Direction.Right) {
        this.setDirection(Direction.Left);
      }
    }
  }
}

let playerSnake;
let computerSnake;
let apple = { x: 0, y: 0 };
let gameInterval;

function initGame() {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');

  playerSnake = new Snake(new Position(3, CELLS_COUNT / 2), '#00FF00');
  computerSnake = new ComputerSnake(new Position(CELLS_COUNT - 4, CELLS_COUNT / 2), '#0088FF');

  randomizeApple();

  score = { player: 0, computer: 0 };
  document.getElementById('player-score').textContent = score.player;
  document.getElementById('computer-score').textContent = score.computer;

  document.getElementById('game-over').style.display = 'none';

  gameOver = false;
  isPlaying = true;

  if (gameInterval) {
    clearInterval(gameInterval);
  }

  gameInterval = setInterval(gameLoop, MOVEMENT_INTERVAL);
}

function randomizeApple() {
  apple = {
    x: Math.floor(Math.random() * CELLS_COUNT),
    y: Math.floor(Math.random() * CELLS_COUNT)
  };
}

function gameLoop() {
  if (gameOver || !isPlaying) return;

  computerSnake.updateDirection(apple, playerSnake);

  updateSnake(playerSnake, true);
  updateSnake(computerSnake, false);

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  drawGrid();

  ctx.fillStyle = '#ff0000';
  ctx.fillRect(apple.x * CELL_SIZE, apple.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

  drawSnake(playerSnake);
  drawSnake(computerSnake);

  checkCollisions();
}

function updateSnake(snake, isPlayer) {
  const head = snake.body[0];
  const grow = head.x === apple.x && head.y === apple.y;
  
  if (grow) {
    randomizeApple();
    if (isPlayer) {
      score.player++;
      document.getElementById('player-score').textContent = score.player;
    } else {
      score.computer++;
      document.getElementById('computer-score').textContent = score.computer;
    }
  }
  
  snake.move(grow);
}

function drawSnake(snake) {
  ctx.fillStyle = snake.color;
  snake.body.forEach(segment => {
    ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  });
}

function checkCollisions() {
  if (playerSnake.checkSelfCollision() || computerSnake.checkSelfCollision()) {
    endGame();
    return;
  }

  const playerHead = playerSnake.body[0];
  const computerHead = computerSnake.body[0];

  const playerHitsComputer = computerSnake.body.some(segment => 
    segment.x === playerHead.x && segment.y === playerHead.y
  );
  
  const computerHitsPlayer = playerSnake.body.some(segment => 
    segment.x === computerHead.x && segment.y === computerHead.y
  );
  
  const headOnCollision = playerHead.x === computerHead.x && playerHead.y === computerHead.y;

  if (playerHitsComputer || computerHitsPlayer || headOnCollision) {
    endGame();
  }
}

function endGame() {
  gameOver = true;
  clearInterval(gameInterval);
  document.getElementById('game-over').style.display = 'block';
}

function resetGame() {
  if (gameOver) {
    initGame();
  }
}

function togglePause() {
  if (!gameOver) {
    isPlaying = !isPlaying;
    const pausedModal = document.getElementById('paused-modal-container');
    pausedModal.style.display = isPlaying ? 'none' : 'flex';
  }
}

function handleKeyPress(e) {
  if (gameOver) {
    if (e.code === 'Space') {
      resetGame();
    }
    return;
  }

  if (e.code === 'Escape') {
    togglePause();
    return;
  }

  if (!isPlaying) return;

  switch (e.code) {
    case 'ArrowUp':
    case 'KeyW':
      playerSnake.setDirection(Direction.Up);
      break;
    case 'ArrowDown':
    case 'KeyS':
      playerSnake.setDirection(Direction.Down);
      break;
    case 'ArrowLeft':
    case 'KeyA':
      playerSnake.setDirection(Direction.Left);
      break;
    case 'ArrowRight':
    case 'KeyD':
      playerSnake.setDirection(Direction.Right);
      break;
  }
}

function drawGrid() {
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 0.5;

  for (let x = 0; x <= CANVAS_SIZE; x += CELL_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_SIZE);
    ctx.stroke();
  }

  for (let y = 0; y <= CANVAS_SIZE; y += CELL_SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_SIZE, y);
    ctx.stroke();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initGame();
  document.addEventListener('keydown', handleKeyPress);
  document.getElementById('paused-modal-container').addEventListener('click', togglePause);
});
