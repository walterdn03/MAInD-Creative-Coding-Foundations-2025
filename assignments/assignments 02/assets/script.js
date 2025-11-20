function drawPixelAvatar(canvasId, colors) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const pixelSize = 6;
  
  const pattern = [
      [0,0,1,1,1,1,0,0],
      [0,1,1,1,1,1,1,0],
      [1,1,2,1,1,2,1,1],
      [1,1,1,1,1,1,1,1],
      [1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,0],
      [0,1,1,0,0,1,1,0],
      [0,1,1,0,0,1,1,0]
  ];
  
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 60, 60);
  
  pattern.forEach((row, y) => {
      row.forEach((pixel, x) => {
          if (pixel === 1) ctx.fillStyle = colors.body;
          if (pixel === 2) ctx.fillStyle = colors.eye;
          if (pixel > 0) {
              ctx.fillRect(x * pixelSize + 2, y * pixelSize - 2, pixelSize, pixelSize);
          }
      });
  });
}

drawPixelAvatar('avatarClassic', {body: '#00ff00', eye: '#000'});
drawPixelAvatar('avatarSpeedy', {body: '#ff6b00', eye: '#ffff00'});
drawPixelAvatar('avatarCombo', {body: '#ffff00', eye: '#ff0000'});
drawPixelAvatar('avatarRainbow', {body: '#ff00ff', eye: '#00ffff'});

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gridSize = 20;
const tileCountX = canvas.width / gridSize;
const tileCountY = canvas.height / gridSize;

let snake = [{x: 10, y: 10}];
let velocityX = 0;
let velocityY = 0;
let foodX = 15;
let foodY = 15;
let score = 0;
let highScore = localStorage.getItem('retroSnakeHighScore') || 0;
let gameLoop;
let selectedAvatar = null;
let selectedLevel = null;
let gameStartTime;
let animationFrame = 0;
let obstacles = [];
let countdownInterval = null;
let lives = 3;

const avatars = {
  classic: { colors: ['#00ff00'], speed: 100, scoreMultiplier: 1 },
  speedy: { colors: ['#ff6b00'], speed: 70, scoreMultiplier: 1 },
  combo: { colors: ['#ffff00'], speed: 100, scoreMultiplier: 2 },
  rainbow: { colors: ['#ff0000', '#ff6b00', '#ffff00', '#00ff00', '#00ffff', '#ff00ff'], speed: 100, scoreMultiplier: 1 }
};

const levels = {
  1: { name: 'EASY', speed: 150, obstacles: 0 },
  2: { name: 'NORMAL', speed: 110, obstacles: 5 },
  3: { name: 'HARD', speed: 80, obstacles: 10 },
  4: { name: 'EXTREME', speed: 60, obstacles: 20 }
};

document.getElementById('highScore').textContent = highScore;
document.getElementById('lives').textContent = lives;

let backgroundMusic = new Audio('assets/sound/soundtrack.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.3;

let eatSound = new Audio('sound/eat.mp3');
eatSound.volume = 0.5;

let gameOverSound = new Audio('sound/gameover.mp3');
gameOverSound.volume = 0.5;

let isMusicMuted = false;

function playBackgroundMusic() {
  if (!isMusicMuted) {
      backgroundMusic.play().catch(e => console.log('Music error:', e));
  }
}

function stopBackgroundMusic() {
  backgroundMusic.pause();
  backgroundMusic.currentTime = 0;
}

function toggleMusic() {
  isMusicMuted = !isMusicMuted;
  const toggle = document.querySelector('.music-toggle');
  
  if (isMusicMuted) {
      stopBackgroundMusic();
      toggle.textContent = '♪ MUSIC OFF';
      toggle.classList.add('muted');
  } else {
      toggle.textContent = '♪ MUSIC ON';
      toggle.classList.remove('muted');
      if (selectedAvatar && selectedLevel) {
          playBackgroundMusic();
      }
  }
}

function playEatSound() {
  eatSound.currentTime = 0;
  eatSound.play().catch(e => console.log('Sound error:', e));
}

function playGameOverSound() {
  gameOverSound.currentTime = 0;
  gameOverSound.play().catch(e => console.log('Sound error:', e));
}

function selectAvatar(avatarType) {
  selectedAvatar = avatarType;
  
  document.querySelectorAll('.avatar-card').forEach(card => {
      card.classList.remove('selected');
  });
  
  document.getElementById('avatar-' + avatarType).classList.add('selected');
  
  document.getElementById('levelSelection').style.display = 'block';
}

function selectLevel(level) {
  selectedLevel = level;
  lives = 3;
  score = 0;
  
  document.querySelectorAll('.level-card').forEach(card => {
      card.classList.remove('selected');
  });
  
  document.getElementById('level-' + level).classList.add('selected');
  
  document.getElementById('avatarSelection').style.display = 'none';
  document.getElementById('gameScreen').style.display = 'block';
  document.getElementById('lives').textContent = lives;
  document.getElementById('currentLevel').textContent = level;
  
  if (!isMusicMuted) {
      playBackgroundMusic();
  }
  
  startGame();
}

function generateObstacles() {
  obstacles = [];
  const obstacleCount = levels[selectedLevel].obstacles;
  
  if (selectedLevel === 4) {
      for (let i = 5; i < tileCountX - 5; i += 5) {
          for (let j = 5; j < tileCountY - 5; j += 10) {
              obstacles.push({x: i, y: j});
              obstacles.push({x: i, y: j + 1});
          }
      }
  } else {
      for (let i = 0; i < obstacleCount; i++) {
          let obstacleX, obstacleY;
          let valid = false;
          
          while (!valid) {
              obstacleX = Math.floor(Math.random() * tileCountX);
              obstacleY = Math.floor(Math.random() * tileCountY);
              
              valid = Math.abs(obstacleX - 10) > 3 && Math.abs(obstacleY - 10) > 3;
              
              for (let obs of obstacles) {
                  if (obs.x === obstacleX && obs.y === obstacleY) {
                      valid = false;
                      break;
                  }
              }
          }
          
          obstacles.push({x: obstacleX, y: obstacleY});
      }
  }
}

function startGame() {
  snake = [{x: 10, y: 10}];
  velocityX = 1;
  velocityY = 0;
  animationFrame = 0;
  gameStartTime = Date.now();
  generateObstacles();
  placeFood();
  updateScore();
  
  if (gameLoop) clearInterval(gameLoop);
  const speed = Math.max(
      levels[selectedLevel].speed,
      avatars[selectedAvatar].speed
  ) - (selectedLevel - 1) * 10;
  gameLoop = setInterval(update, speed);
}

function update() {
  moveSnake();
  if (checkCollision()) {
      gameOver();
      return;
  }
  if (checkFoodCollision()) {
      eatFood();
  }
  animationFrame++;
  draw();
}

function moveSnake() {
  const head = {x: snake[0].x + velocityX, y: snake[0].y + velocityY};
  snake.unshift(head);
  snake.pop();
}

function checkCollision() {
  const head = snake[0];
  
  if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY) {
      return true;
  }
  
  for (let i = 1; i < snake.length; i++) {
      if (head.x === snake[i].x && head.y === snake[i].y) {
          return true;
      }
  }
  
  for (let obs of obstacles) {
      if (head.x === obs.x && head.y === obs.y) {
          return true;
      }
  }
  
  return false;
}

function checkFoodCollision() {
  return snake[0].x === foodX && snake[0].y === foodY;
}

function eatFood() {
  score += 10 * avatars[selectedAvatar].scoreMultiplier * selectedLevel;
  snake.push({...snake[snake.length - 1]});
  placeFood();
  updateScore();
  playEatSound();
}

function placeFood() {
  let valid = false;
  
  while (!valid) {
      foodX = Math.floor(Math.random() * tileCountX);
      foodY = Math.floor(Math.random() * tileCountY);
      valid = true;
      
      for (let segment of snake) {
          if (segment.x === foodX && segment.y === foodY) {
              valid = false;
              break;
          }
      }
      
      for (let obs of obstacles) {
          if (obs.x === foodX && obs.y === foodY) {
              valid = false;
              break;
          }
      }
  }
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.strokeStyle = '#003300';
  ctx.lineWidth = 1;
  for (let i = 0; i <= tileCountX; i++) {
      ctx.beginPath();
      ctx.moveTo(i * gridSize, 0);
      ctx.lineTo(i * gridSize, canvas.height);
      ctx.stroke();
  }
  for (let i = 0; i <= tileCountY; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * gridSize);
      ctx.lineTo(canvas.width, i * gridSize);
      ctx.stroke();
  }
  
  ctx.fillStyle = '#ff0000';
  obstacles.forEach(obs => {
      ctx.fillRect(obs.x * gridSize + 1, obs.y * gridSize + 1, gridSize - 2, gridSize - 2);
      ctx.strokeStyle = '#880000';
      ctx.lineWidth = 2;
      ctx.strokeRect(obs.x * gridSize + 1, obs.y * gridSize + 1, gridSize - 2, gridSize - 2);
  });
  
  snake.forEach((segment, index) => {
      let color;
      if (selectedAvatar === 'rainbow') {
          const colorIndex = Math.floor((index + animationFrame) / 5) % avatars.rainbow.colors.length;
          color = avatars.rainbow.colors[colorIndex];
      } else {
          color = avatars[selectedAvatar].colors[0];
      }
      
      ctx.fillStyle = color;
      ctx.fillRect(
          segment.x * gridSize + 1, 
          segment.y * gridSize + 1, 
          gridSize - 2, 
          gridSize - 2
      );
      
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(
          segment.x * gridSize + 1, 
          segment.y * gridSize + 1, 
          gridSize - 2, 
          gridSize - 2
      );
      
      if (index === 0) {
          ctx.fillStyle = '#000';
          const eyeSize = 3;
          const eyeOffset = 4;
          
          if (velocityX === 1) {
              ctx.fillRect(segment.x * gridSize + gridSize - eyeOffset - eyeSize, segment.y * gridSize + eyeOffset, eyeSize, eyeSize);
              ctx.fillRect(segment.x * gridSize + gridSize - eyeOffset - eyeSize, segment.y * gridSize + gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
          } else if (velocityX === -1) {
              ctx.fillRect(segment.x * gridSize + eyeOffset, segment.y * gridSize + eyeOffset, eyeSize, eyeSize);
              ctx.fillRect(segment.x * gridSize + eyeOffset, segment.y * gridSize + gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
          } else if (velocityY === -1) {
              ctx.fillRect(segment.x * gridSize + eyeOffset, segment.y * gridSize + eyeOffset, eyeSize, eyeSize);
              ctx.fillRect(segment.x * gridSize + gridSize - eyeOffset - eyeSize, segment.y * gridSize + eyeOffset, eyeSize, eyeSize);
          } else {
              ctx.fillRect(segment.x * gridSize + eyeOffset, segment.y * gridSize + gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
              ctx.fillRect(segment.x * gridSize + gridSize - eyeOffset - eyeSize, segment.y * gridSize + gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
          }
      }
  });
  
  const foodPulse = Math.sin(animationFrame * 0.2) * 0.5;
  const fx = foodX * gridSize;
  const fy = foodY * gridSize;
  const pixelSize = 4;
  
  const applePattern = [
      [0, 0, 3, 0, 0],
      [0, 1, 1, 1, 0],
      [1, 1, 2, 1, 1],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0]
  ];
  
  const colors = {
      0: null,
      1: '#ff0000',
      2: '#ffff00',
      3: '#00ff00'
  };
  
  applePattern.forEach((row, y) => {
      row.forEach((pixel, x) => {
          if (pixel !== 0) {
              ctx.fillStyle = colors[pixel];
              ctx.fillRect(
                  fx + x * pixelSize + foodPulse,
                  fy + y * pixelSize + foodPulse,
                  pixelSize,
                  pixelSize
              );
              
              ctx.strokeStyle = '#000';
              ctx.lineWidth = 1;
              ctx.strokeRect(
                  fx + x * pixelSize + foodPulse,
                  fy + y * pixelSize + foodPulse,
                  pixelSize,
                  pixelSize
              );
          }
      });
  });
}

function updateScore() {
  document.getElementById('score').textContent = score;
  
  if (lives > 0 && score > highScore) {
      highScore = score;
      localStorage.setItem('retroSnakeHighScore', highScore);
      document.getElementById('highScore').textContent = highScore;
  }
}

function gameOver() {
  clearInterval(gameLoop);
  stopBackgroundMusic();
  playGameOverSound();
  
  lives--;
  document.getElementById('lives').textContent = lives;
  
  const gameTime = Math.floor((Date.now() - gameStartTime) / 1000);
  document.getElementById('finalScore').textContent = score;
  document.getElementById('finalLevel').textContent = selectedLevel;
  document.getElementById('finalLength').textContent = snake.length;
  document.getElementById('gameTime').textContent = gameTime;
  
  if (lives <= 0) {
      document.getElementById('gameOverOverlay').style.display = 'block';
      startCountdown();
  } else {
      setTimeout(() => {
          startGame();
          if (!isMusicMuted) {
              playBackgroundMusic();
          }
      }, 1500);
  }
}

function startCountdown() {
  let countdown = 3;
  document.getElementById('countdown').textContent = countdown;
  
  if (countdownInterval) clearInterval(countdownInterval);
  
  countdownInterval = setInterval(() => {
      countdown--;
      document.getElementById('countdown').textContent = countdown;
      
      if (countdown === 0) {
          clearInterval(countdownInterval);
          countdownInterval = null;
          document.getElementById('gameOverOverlay').style.display = 'none';
          
          lives = 3;
          score = 0;
          highScore = 0;
          localStorage.setItem('retroSnakeHighScore', 0);
          
          document.getElementById('lives').textContent = lives;
          document.getElementById('score').textContent = score;
          document.getElementById('highScore').textContent = highScore;
          
          startGame();
          if (!isMusicMuted) {
              playBackgroundMusic();
          }
      }
  }, 1000);
}

function skipCountdown() {
  if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
  }
  document.getElementById('gameOverOverlay').style.display = 'none';
  
  lives = 3;
  score = 0;
  highScore = 0;
  localStorage.setItem('retroSnakeHighScore', 0);
  
  document.getElementById('lives').textContent = lives;
  document.getElementById('score').textContent = score;
  document.getElementById('highScore').textContent = highScore;
  
  startGame();
  if (!isMusicMuted) {
      playBackgroundMusic();
  }
}

function changeAvatar() {
  if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
  }
  
  document.getElementById('gameOverOverlay').style.display = 'none';
  document.getElementById('gameScreen').style.display = 'none';
  document.getElementById('avatarSelection').style.display = 'block';
  document.getElementById('levelSelection').style.display = 'none';
  
  selectedAvatar = null;
  selectedLevel = null;
  lives = 3;
  
  stopBackgroundMusic();
}

document.addEventListener('keydown', (e) => {
  switch(e.key) {
      case 'ArrowUp':
          e.preventDefault();
          if (velocityY !== 1) {
              velocityX = 0;
              velocityY = -1;
          }
          break;
      case 'ArrowDown':
          e.preventDefault();
          if (velocityY !== -1) {
              velocityX = 0;
              velocityY = 1;
          }
          break;
      case 'ArrowLeft':
          e.preventDefault();
          if (velocityX !== 1) {
              velocityX = -1;
              velocityY = 0;
          }
          break;
      case 'ArrowRight':
          e.preventDefault();
          if (velocityX !== -1) {
              velocityX = 1;
              velocityY = 0;
          }
          break;
  }
});

function changeDirection(direction) {
  switch(direction) {
      case 'UP':
          if (velocityY !== 1) {
              velocityX = 0;
              velocityY = -1;
          }
          break;
      case 'DOWN':
          if (velocityY !== -1) {
              velocityX = 0;
              velocityY = 1;
          }
          break;
      case 'LEFT':
          if (velocityX !== 1) {
              velocityX = -1;
              velocityY = 0;
          }
          break;
      case 'RIGHT':
          if (velocityX !== -1) {
              velocityX = 1;
              velocityY = 0;
          }
          break;
  }
}

let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});

canvas.addEventListener('touchend', (e) => {
  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  
  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;
  
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 30 && velocityX !== -1) {
          velocityX = 1;
          velocityY = 0;
      } else if (deltaX < -30 && velocityX !== 1) {
          velocityX = -1;
          velocityY = 0;
      }
  } else {
      if (deltaY > 30 && velocityY !== -1) {
          velocityX = 0;
          velocityY = 1;
      } else if (deltaY < -30 && velocityY !== 1) {
          velocityX = 0;
          velocityY = -1;
      }
  }
});

function resizeCanvas() {
  const maxWidth = Math.min(window.innerWidth - 40, 1000);
  const maxHeight = Math.min(window.innerHeight - 200, 600);
  const scale = Math.min(maxWidth / 1000, maxHeight / 600);
  
  canvas.style.width = (1000 * scale) + 'px';
  canvas.style.height = (600 * scale) + 'px';
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();