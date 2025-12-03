        // API JSONBin.io 
        const JSONBIN_BIN_ID = '692d67e343b1c97be9d025bc'; //bin id
        const JSONBIN_API_KEY = '$2a$10$v10OKpmaB/dFU4hNZMLD4uDsIv2Bxxs3rDoYjaFu7L/XBJC/DUvJG'; 
        const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;
        const LOCAL_STORAGE_KEY = 'snakeLeaderboard';
        const PLAYER_NAME_KEY = 'snakePlayerName';

        // Meteo API 
        const WEATHER_API_KEY = 'b69fe8d0bd967002340fe18c974312bf';
        const WEATHER_API_URL = 'https://api.weatherstack.com/current';

        let playerName = '';
        let playerBestScore = 0; 
        let playerBestScoreThisMode = 0; 
        let tempNameToCheck = ''; 
        let skipConfirmation = false; 

        // Dati Meteo
        let weatherData = {
            temp: 20,
            condition: 'Clear',
            city: 'Unknown',
            speedModifier: 1.0, 
            icon: '01d'
        };

        // Filtri leaderboard
        let currentFilter = 'all';
        let cachedScores = []; // Cache

        // Fetch meteo basato su pos utente
        async function fetchWeather() {
            try {
                // Posizione utente
                const position = await new Promise((resolve, reject) => {
                    if ('geolocation' in navigator) {
                        navigator.geolocation.getCurrentPosition(resolve, reject, {
                            timeout: 10000
                        });
                    } else {
                        reject(new Error('Geolocation not supported'));
                    }
                });

                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                // Meteo weatherstack
                const response = await fetch(
                    `${WEATHER_API_URL}?access_key=${WEATHER_API_KEY}&query=${lat},${lon}&units=m`
                );

                if (!response.ok) throw new Error('Weather API failed');

                const data = await response.json();
                
                if (data.error) {
                    throw new Error(data.error.info || 'API Error');
                }
                
                weatherData = {
                    temp: data.current.temperature,
                    condition: data.current.weather_descriptions[0],
                    city: data.location.name,
                    speedModifier: calculateSpeedModifier(data.current.temperature),
                    icon: data.current.weather_icons[0]
                };

                updateWeatherDisplay();

            } catch (error) {
                console.error('Weather fetch error:', error);
                // dialog per scegliere città manualmente
                document.getElementById('weatherCity').textContent = 'Unable to detect';
                document.getElementById('weatherTemp').textContent = '--';
                document.getElementById('weatherCondition').textContent = 'Click "CHANGE CITY"';
                document.getElementById('weatherEffect').textContent = '📍 Set your city manually';
            }
        }

        // Fetch meteo con nome città
        async function fetchWeatherByCity() {
            const cityName = document.getElementById('cityInput').value.trim();
            
            if (!cityName) {
                alert('Please enter a city name!');
                return;
            }

            try {
                document.getElementById('cityInput').disabled = true;
                
                const response = await fetch(
                    `${WEATHER_API_URL}?access_key=${WEATHER_API_KEY}&query=${encodeURIComponent(cityName)}&units=m`
                );

                if (!response.ok) throw new Error('Weather API failed');

                const data = await response.json();
                
                if (data.error) {
                    throw new Error(data.error.info || 'City not found');
                }
                
                weatherData = {
                    temp: data.current.temperature,
                    condition: data.current.weather_descriptions[0],
                    city: data.location.name,
                    speedModifier: calculateSpeedModifier(data.current.temperature),
                    icon: data.current.weather_icons[0]
                };

                updateWeatherDisplay();
                
                // Chiudi la dialog e torna al menu
                document.getElementById('citySelection').style.display = 'none';
                document.getElementById('mainMenu').style.display = 'block';
                document.getElementById('cityInput').value = '';

            } catch (error) {
                console.error('Weather fetch error:', error);
                alert('Could not find weather for "' + cityName + '". Please try another city.');
            } finally {
                document.getElementById('cityInput').disabled = false;
            }
        }

        // dialog per cambiare città
        function changeCityManually() {
            document.getElementById('mainMenu').style.display = 'none';
            document.getElementById('citySelection').style.display = 'block';
            document.getElementById('cityInput').focus();
        }

        // Usa la posizione corrente
        function useCurrentLocation() {
            document.getElementById('citySelection').style.display = 'none';
            document.getElementById('mainMenu').style.display = 'block';
            fetchWeather();
        }

        // modificatore velocità basato su temperatura
        function calculateSpeedModifier(temp) {
            if (temp > 30) {
                // Caldo estremo +30% 
                return 0.7; // Meno millisecondi
            } else if (temp > 25) {
                // Caldo +15%
                return 0.85;
            } else if (temp < 5) {
                // Freddo estremo -30% 
                return 1.3; // Più millisecondi
            } else if (temp < 10) {
                // Freddo: -15% velocità
                return 1.15;
            } else {
                // Temperatura normale velocità standard
                return 1.0;
            }
        }

        // Aggiornamwnto display del meteo
        function updateWeatherDisplay() {
            // Icona meteo
            const iconElement = document.getElementById('weatherIcon');
            if (weatherData.icon) {
                iconElement.src = weatherData.icon;
                iconElement.style.display = 'block';
            } else {
                iconElement.style.display = 'none';
            }

            document.getElementById('weatherCity').textContent = weatherData.city;
            document.getElementById('weatherTemp').textContent = weatherData.temp;
            document.getElementById('weatherCondition').textContent = weatherData.condition;

            let effectText = '';
            let effectColor = '#00ff00';
            
            if (weatherData.temp > 30) {
                effectText = '🔥 HOT! Snake is faster (+30%)';
                effectColor = '#ff0000';
            } else if (weatherData.temp > 25) {
                effectText = '☀️ Warm! Snake is faster (+15%)';
                effectColor = '#ff6b00';
            } else if (weatherData.temp < 5) {
                effectText = '❄️ FREEZING! Snake is slower (-30%)';
                effectColor = '#00ffff';
            } else if (weatherData.temp < 10) {
                effectText = '🧊 Cold! Snake is slower (-15%)';
                effectColor = '#00ccff';
            } else {
                effectText = '🌤️ Perfect weather! Normal speed';
                effectColor = '#00ff00';
            }

            const effectElement = document.getElementById('weatherEffect');
            effectElement.textContent = effectText;
            effectElement.style.color = effectColor;

            // Aggiorna anche il display in-game
            const gameIcon = weatherData.temp > 25 ? '🔥' : weatherData.temp < 10 ? '❄️' : '🌤️';
            document.getElementById('gameWeatherInfo').textContent = `${gameIcon} ${weatherData.temp}°C`;
        }

        // Start game flow - controlla se serve il nome
        function startGameFlow() {
            if (playerName) {
                showSection('avatarSelection');
            } else {
                showSection('enterName');
            }
        }

        // Aggiorna il menu con le info del giocatore
        function updateMenuPlayerInfo() {
            if (playerName) {
                // Mostra info giocatore
                document.getElementById('playerInfo').style.display = 'block';
                document.getElementById('guestInfo').style.display = 'none';
                document.getElementById('changePlayerBtn').style.display = 'block';
                document.getElementById('menuPlayerName').textContent = playerName;
                document.getElementById('menuBestScore').textContent = playerBestScore;
            } else {
                // Mostra messaggio guest
                document.getElementById('playerInfo').style.display = 'none';
                document.getElementById('guestInfo').style.display = 'block';
                document.getElementById('changePlayerBtn').style.display = 'none';
            }
        }

        // Cambia giocatore
        function changePlayer() {
            // Reset tutto
            playerName = '';
            playerBestScore = 0;
            tempNameToCheck = '';
            skipConfirmation = false; // Reset del flag
            localStorage.removeItem(PLAYER_NAME_KEY);
            
            // Pulisci il form
            document.getElementById('initialPlayerName').value = '';
            document.getElementById('bestScoreDisplay').textContent = '0';
            
            // Vai alla schermata nome
            showSection('enterName');
        }

        // Check if name exists and handle accordingly
        async function checkAndSaveName() {
            const nameInput = document.getElementById('initialPlayerName').value.trim();
            
            if (!nameInput) {
                alert('Please enter your name!');
                return;
            }
            
            tempNameToCheck = nameInput;
            
            // Mostra loading
            const btn = document.querySelector('#enterName .menu-btn');
            const originalText = btn.textContent;
            btn.textContent = 'Checking...';
            btn.disabled = true;
            
            // Controlla se il nome esiste già nell'API
            const existingScore = await checkIfNameExists(nameInput);
            
            btn.textContent = originalText;
            btn.disabled = false;
            
            // Se skipConfirmation è true, accetta direttamente anche se esiste
            if (skipConfirmation) {
                acceptName(nameInput, existingScore || 0);
                skipConfirmation = false; // Reset del flag
                return;
            }
            
            if (existingScore !== null) {
                // Nome esiste - chiedi conferma
                document.getElementById('confirmNameDisplay').textContent = nameInput;
                document.getElementById('confirmScoreDisplay').textContent = existingScore;
                document.getElementById('enterName').style.display = 'none';
                document.getElementById('nameConfirmation').style.display = 'block';
            } else {
                // Nome nuovo - procedi direttamente
                acceptName(nameInput, 0);
            }
        }

        // Controlla se un nome esiste già nell'API
        async function checkIfNameExists(name) {
            try {
                const response = await fetch(JSONBIN_URL + '/latest', {
                    headers: {
                        'X-Master-Key': JSONBIN_API_KEY
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const scores = data.record.scores || [];
                    
                    // Cerca il best score per questo nome
                    const playerScores = scores.filter(s => s.name === name);
                    if (playerScores.length > 0) {
                        return Math.max(...playerScores.map(s => s.score));
                    }
                }
                return null; // Nome non trovato
            } catch (error) {
                console.error('Error checking name:', error);
                return null;
            }
        }

        // Conferma: SÌ, è il mio account
        async function confirmYes() {
            const bestScore = await checkIfNameExists(tempNameToCheck);
            acceptName(tempNameToCheck, bestScore || 0);
        }

        // Conferma: NO, scelgo un altro nome
        function confirmNo() {
            skipConfirmation = true; // Attiva il flag per saltare la prossima conferma
            document.getElementById('nameConfirmation').style.display = 'none';
            document.getElementById('enterName').style.display = 'block';
            document.getElementById('initialPlayerName').value = '';
            document.getElementById('initialPlayerName').focus();
            tempNameToCheck = '';
        }

        // Accetta il nome e procedi alla selezione avatar
        function acceptName(name, bestScore) {
            playerName = name;
            playerBestScore = bestScore;
            
            localStorage.setItem(PLAYER_NAME_KEY, playerName);
            
            document.getElementById('bestScoreDisplay').textContent = playerBestScore;
            document.getElementById('nameConfirmation').style.display = 'none';
            document.getElementById('enterName').style.display = 'none';
            
            showSection('avatarSelection');
        }

        // Navigation System
        function showSection(sectionId) {
            // Nascondi tutte le sezioni
            document.getElementById('enterName').style.display = 'none';
            document.getElementById('nameConfirmation').style.display = 'none';
            document.getElementById('citySelection').style.display = 'none';
            document.getElementById('mainMenu').style.display = 'none';
            document.getElementById('avatarSelection').style.display = 'none';
            document.getElementById('gameScreen').style.display = 'none';
            document.getElementById('leaderboard').style.display = 'none';
            document.getElementById('howToPlay').style.display = 'none';
            
            // Mostra la sezione richiesta
            document.getElementById(sectionId).style.display = 'block';
            
            // Azioni speciali per certe sezioni
            if (sectionId === 'leaderboard') {
                currentFilter = 'all'; // Reset filtro
                document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                document.querySelector('[data-filter="all"]').classList.add('active');
                loadLeaderboard();
            } else if (sectionId === 'gameScreen') {
                updatePlayerDisplay();
            } else if (sectionId === 'mainMenu') {
                updateMenuPlayerInfo();
            }
        }

        function changePlayer() {
            // Reset e torna alla schermata nome
            document.getElementById('initialPlayerName').value = '';
            playerName = '';
            playerBestScore = 0;
            tempNameToCheck = '';
            document.getElementById('bestScoreDisplay').textContent = '0';
            showSection('enterName');
        }

        function updatePlayerDisplay() {
            document.getElementById('currentPlayerName').textContent = playerName;
            document.getElementById('bestScoreGame').textContent = playerBestScoreThisMode;
        }

        // Leaderboard Functions con API REALE
        async function saveScoreAutomatically(finalScore) {
            // Ricarica TUTTI gli score dall'API
            try {
                const response = await fetch(JSONBIN_URL + '/latest', {
                    headers: {
                        'X-Master-Key': JSONBIN_API_KEY
                    }
                });
                
                let currentScores = [];
                if (response.ok) {
                    const data = await response.json();
                    currentScores = data.record.scores || [];
                }
                
                // Trova il best score per questo giocatore CON QUESTA MODALITÀ
                const playerScoresThisMode = currentScores.filter(s => 
                    s.name === playerName && s.avatar === selectedAvatar
                );
                
                const bestScoreThisMode = playerScoresThisMode.length > 0 
                    ? Math.max(...playerScoresThisMode.map(s => s.score))
                    : 0;
                
                console.log(`[SAVE CHECK] Player: ${playerName}, Mode: ${selectedAvatar}`);
                console.log(`[SAVE CHECK] Current score: ${finalScore}, Best for this mode: ${bestScoreThisMode}`);
                
                // Salva solo se è un nuovo record per QUESTA modalità
                if (finalScore <= bestScoreThisMode) {
                    console.log(`[SAVE CHECK] NOT saving - not a new record for ${selectedAvatar} mode`);
                    return false; // Non è un record per questa modalità
                }
                
                console.log(`[SAVE CHECK] SAVING - new record for ${selectedAvatar} mode!`);
                
                playerBestScore = Math.max(playerBestScore, finalScore);
                // Aggiorna anche il best score per questa modalità
                playerBestScoreThisMode = finalScore;
                
                const scoreData = {
                    name: playerName,
                    score: finalScore,
                    avatar: selectedAvatar,
                    date: new Date().toISOString()
                };
                
                // Aggiungi il nuovo punteggio
                currentScores.push(scoreData);
                currentScores.sort((a, b) => b.score - a.score);
                currentScores = currentScores.slice(0, 100);
                
                // Salva su JSONBin
                await fetch(JSONBIN_URL, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': JSONBIN_API_KEY
                    },
                    body: JSON.stringify({ scores: currentScores })
                });
                
                // Salva anche localmente come backup
                saveToLocalStorage(scoreData);
                return true; // È un nuovo record per questa modalità
                
            } catch (error) {
                console.error('API Error:', error);
                // Fallback: salva comunque localmente
                const scoreData = {
                    name: playerName,
                    score: finalScore,
                    avatar: selectedAvatar,
                    date: new Date().toISOString()
                };
                saveToLocalStorage(scoreData);
                return true;
            }
        }

        function saveToLocalStorage(scoreData) {
            let scores = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
            scores.push(scoreData);
            scores.sort((a, b) => b.score - a.score);
            scores = scores.slice(0, 50);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(scores));
        }

        async function loadLeaderboard() {
            const leaderboardContent = document.getElementById('leaderboardContent');
            leaderboardContent.innerHTML = '<div class="loading">🌐 Loading global scores...</div>';
            
            try {
                // Carica da API online
                const response = await fetch(JSONBIN_URL + '/latest', {
                    headers: {
                        'X-Master-Key': JSONBIN_API_KEY
                    }
                });
                
                if (!response.ok) throw new Error('API fetch failed');
                
                const data = await response.json();
                cachedScores = data.record.scores || [];
                
                displayLeaderboard(cachedScores, true);
                
            } catch (error) {
                console.error('API Error:', error);
                // Fallback su localStorage
                const localScores = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
                cachedScores = localScores;
                displayLeaderboard(localScores, false);
            }
        }

        // Filtra la leaderboard per modalità
        function filterLeaderboard(filter) {
            currentFilter = filter;
            
            // Aggiorna stile pulsanti
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
            
            // Filtra e mostra score
            let filteredScores = cachedScores;
            if (filter !== 'all') {
                filteredScores = cachedScores.filter(s => s.avatar === filter);
            }
            
            displayLeaderboard(filteredScores, cachedScores.length > 0);
        }

        function displayLeaderboard(scores, isOnline) {
            const leaderboardContent = document.getElementById('leaderboardContent');
            
            if (scores.length === 0) {
                const filterText = currentFilter === 'all' ? '' : ` for ${currentFilter.toUpperCase()}`;
                leaderboardContent.innerHTML = `
                    <p style="color: #ffff00; font-size: 1.2rem; padding: 50px;">
                        No scores yet${filterText}!<br>Be the first to play! 🎮
                    </p>
                `;
                return;
            }
            
            const top10 = scores.slice(0, 10);
            const statusBadge = isOnline 
                ? '<div style="color: #00ff00; margin-bottom: 15px;">🌐 ONLINE - Global Leaderboard</div>'
                : '<div style="color: #ff6b00; margin-bottom: 15px;">💾 LOCAL - Offline Mode</div>';
            
            let html = statusBadge;
            html += '<table class="leaderboard-table">';
            html += '<tr><th>RANK</th><th>NAME</th><th>SCORE</th><th>SNAKE</th></tr>';
            
            top10.forEach((entry, index) => {
                const medals = ['🥇', '🥈', '🥉'];
                const rank = index < 3 ? medals[index] : `#${index + 1}`;
                const avatarEmoji = {
                    'classic': '🐍',
                    'speedy': '⚡',
                    'combo': '💎',
                    'rainbow': '🌈'
                };
                
                html += `
                    <tr>
                        <td class="rank-medal">${rank}</td>
                        <td>${entry.name}</td>
                        <td>${entry.score}</td>
                        <td>${avatarEmoji[entry.avatar] || '🐍'}</td>
                    </tr>
                `;
            });
            
            html += '</table>';
            leaderboardContent.innerHTML = html;
        }

        function backToMenu() {
            if (countdownInterval) {
                clearInterval(countdownInterval);
                countdownInterval = null;
            }
            
            clearInterval(gameLoop);
            document.getElementById('gameOverOverlay').style.display = 'none';
            document.getElementById('gameScreen').style.display = 'none';
            showSection('mainMenu');
            stopBackgroundMusic();
        }

        //importante
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        let gridSize = 20;
        let tileCountX = canvas.width / gridSize;
        let tileCountY = canvas.height / gridSize;

        // variabili gioco//
        let snake = [{x: 10, y: 10}];
        let velocityX = 0;
        let velocityY = 0;
        let foodX = 15;
        let foodY = 15;
        let score = 0;
        let gameLoop;
        let selectedAvatar = null;
        let gameStartTime;
        let animationFrame = 0;
        let obstacles = [];
        let countdownInterval = null;

        //avatar speciali//
        const avatars = {
            classic: { colors: ['#00ff00'], speed: 100, scoreMultiplier: 1 },
            speedy: { colors: ['#ff6b00'], speed: 70, scoreMultiplier: 1 },
            combo: { colors: ['#ffff00'], speed: 100, scoreMultiplier: 2 },
            rainbow: { colors: ['#ff0000', '#ff6b00', '#ffff00', '#00ff00', '#00ffff', '#ff00ff'], speed: 100, scoreMultiplier: 1 }
        };

        const GAME_SPEED = 110;
        const OBSTACLE_COUNT = 5;

        //suoni
        let backgroundMusic = new Audio('assets/sound/soundtrack.mp3');
        backgroundMusic.loop = true;
        backgroundMusic.volume = 0.3;

        let eatSound = new Audio('assets/sound/eat.mp3');
        eatSound.volume = 0.5;

        let gameOverSound = new Audio('assets/sound/gameover.mp3');
        gameOverSound.volume = 0.5;

        let isMusicMuted = false;

        //funzioni per musica e suoni
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
                if (selectedAvatar) {
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
            
            score = 0;
            
            // Carica il best score per QUESTA modalità
            loadBestScoreForMode(avatarType);
            
            showSection('gameScreen');
            
            if (!isMusicMuted) {
                playBackgroundMusic();
            }
            
            startGame();
        }

        // Carica il best score per una specifica modalità
        async function loadBestScoreForMode(mode) {
            try {
                const response = await fetch(JSONBIN_URL + '/latest', {
                    headers: {
                        'X-Master-Key': JSONBIN_API_KEY
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const scores = data.record.scores || [];
                    
                    // Trova il best score per questo giocatore con questa modalità
                    const playerScoresThisMode = scores.filter(s => 
                        s.name === playerName && s.avatar === mode
                    );
                    
                    if (playerScoresThisMode.length > 0) {
                        playerBestScoreThisMode = Math.max(...playerScoresThisMode.map(s => s.score));
                    } else {
                        playerBestScoreThisMode = 0;
                    }
                    
                    console.log(`[MODE SELECT] Best score for ${mode}: ${playerBestScoreThisMode}`);
                    
                    // Aggiorna il display
                    updatePlayerDisplay();
                }
            } catch (error) {
                console.error('Error loading best score for mode:', error);
                playerBestScoreThisMode = 0;
            }
        }

        function generateObstacles() {
            obstacles = [];
            
            for (let i = 0; i < OBSTACLE_COUNT; i++) {
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
            
            // Applica il modificatore di velocità basato sul meteo
            const baseSpeed = Math.min(GAME_SPEED, avatars[selectedAvatar].speed);
            const weatherAdjustedSpeed = Math.round(baseSpeed * weatherData.speedModifier);
            
            gameLoop = setInterval(update, weatherAdjustedSpeed);
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
            score += 10 * avatars[selectedAvatar].scoreMultiplier;
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
            
            // griglia
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
            
            //ostacoli
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
                
                //occhi serpente
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
                    } else if (velocityY === 1) {
                        ctx.fillRect(segment.x * gridSize + eyeOffset, segment.y * gridSize + gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
                        ctx.fillRect(segment.x * gridSize + gridSize - eyeOffset - eyeSize, segment.y * gridSize + gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
                    }
                }
            });
            
            //disegno mela
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
        }

        function gameOver() {
            clearInterval(gameLoop);
            stopBackgroundMusic();
            playGameOverSound();
            
            document.getElementById('finalScore').textContent = score;
            document.getElementById('gameOverPlayerName').textContent = playerName;
            
            // Salva automaticamente se è un nuovo record
            saveScoreAutomatically(score).then(isNewRecord => {
                if (isNewRecord) {
                    document.getElementById('newRecordMessage').style.display = 'block';
                    updatePlayerDisplay(); // Aggiorna il best score visualizzato
                } else {
                    document.getElementById('newRecordMessage').style.display = 'none';
                }
            });
            
            document.getElementById('gameOverOverlay').style.display = 'block';
            startCountdown();
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
                    
                    score = 0;
                    document.getElementById('score').textContent = score;
                    
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
            
            score = 0;
            document.getElementById('score').textContent = score;
            
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
            showSection('avatarSelection');
            
            selectedAvatar = null;
            
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
            const isMobile = window.innerWidth <= 768;
            
            if (isMobile) {
                // Su mobile: canvas più grande e verticale
                const maxWidth = window.innerWidth - 20;
                const maxHeight = window.innerHeight - 280; // Più spazio per il canvas
                
                // Aumentiamo anche la dimensione delle caselle su mobile
                gridSize = 25; // caselle più grandi
                
                // Ricalcoliamo le dimensioni del canvas
                const numTilesX = Math.floor(maxWidth / gridSize);
                const numTilesY = Math.floor(maxHeight / gridSize);
                
                canvas.width = numTilesX * gridSize;
                canvas.height = numTilesY * gridSize;
                
                tileCountX = numTilesX;
                tileCountY = numTilesY;
                
                canvas.style.width = canvas.width + 'px';
                canvas.style.height = canvas.height + 'px';
            } else {
                // Desktop: dimensioni standard
                gridSize = 20;
                canvas.width = 1000;
                canvas.height = 600;
                tileCountX = 50;
                tileCountY = 30;
                
                const maxWidth = Math.min(window.innerWidth - 40, 1000);
                const maxHeight = Math.min(window.innerHeight - 200, 600);
                const scale = Math.min(maxWidth / 1000, maxHeight / 600);
                
                canvas.style.width = (1000 * scale) + 'px';
                canvas.style.height = (600 * scale) + 'px';
            }
        }

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // Start app with main menu
        window.addEventListener('load', async () => {
            // Carica il meteo
            fetchWeather();
            
            // Controlla se c'è già un nome salvato
            const savedName = localStorage.getItem(PLAYER_NAME_KEY);
            
            if (savedName) {
                // Carica automaticamente il giocatore esistente
                playerName = savedName;
                
                // Carica best score dall'API in background
                const bestScore = await checkIfNameExists(savedName);
                if (bestScore !== null) {
                    playerBestScore = bestScore;
                }
            }
            
            // Mostra il menu principale e aggiorna le info
            updateMenuPlayerInfo();
            showSection('mainMenu');
        });