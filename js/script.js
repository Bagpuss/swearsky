const howl = new Howl({src:["./sounds.webm","./sounds.mp3"],html5:false,volume:1,
    sprite: {
        "arse": [
            0,
            799.2743764172335
          ],
          "boobs": [
            2000,
            775.2154195011336
          ],
          "cunt": [
            4000,
            594.9206349206353
          ],
          "fucker": [
            6000,
            612.9705215419499
          ],
          "jizz": [
            8000,
            781.2471655328803
          ],
          "pussy": [
            10000,
            667.0521541950105
          ],
          "shitty": [
            12000,
            925.4648526077106
          ],
          "arsehole": [
            14000,
            943.4920634920641
          ],
          "bugger": [
            16000,
            588.9342403628107
          ],
          "damn": [
            18000,
            600.952380952382
          ],
          "fucking": [
            20000,
            673.0612244897962
          ],
          "minge": [
            22000,
            913.4240362811781
          ],
          "quim": [
            24000,
            679.0702947845801
          ],
          "spunk": [
            26000,
            943.4920634920622
          ],
          "bastard": [
            28000,
            781.2244897959175
          ],
          "bullshit": [
            30000,
            985.5555555555568
          ],
          "dick": [
            32000,
            528.8208616780068
          ],
          "gash": [
            34000,
            685.1020408163251
          ],
          "motherfucker": [
            36000,
            1213.922902494332
          ],
          "rectum": [
            39000,
            1688.6621315192726
          ],
          "tits": [
            42000,
            883.4013605442194
          ],
          "batshit": [
            44000,
            859.3650793650767
          ],
          "cock": [
            46000,
            703.1292517006805
          ],
          "dickhead": [
            48000,
            853.3560090702963
          ],
          "shit": [
            50000,
            931.4739229024908
          ],
          "piss": [
            52000,
            817.2789115646282
          ],
          "twat": [
            54000,
            805.2607709750532
          ],
          "bitch": [
            56000,
            649.0249433106569
          ],
          "cocksucker": [
            58000,
            727.1428571428587
          ],
          "dumbass": [
            60000,
            829.2970521541961
          ],
          "horseshit": [
            62000,
            1027.619047619048
          ],
          "pissing": [
            65000,
            823.310657596366
          ],
          "shite": [
            67000,
            1021.6099773242604
          ],
          "wanker": [
            70000,
            1046.1451247165598
          ],
          "bollocks": [
            73000,
            811.2698412698478
          ],
          "fuck": [
            75000,
            685.0793650793605
          ],
          "jackass": [
            77000,
            1021.6326530612179
          ],
          "prick": [
            80000,
            612.9705215419534
          ],
          "shitting": [
            82000,
            991.5873015873018
          ]      
    }
});

const swears = Object.keys(howl._sprite).sort((a, b) => b.length - a.length);

let playing = false;

const JETSTREAMS = [
    'wss://jetstream1.us-east.bsky.network',
    'wss://jetstream2.us-east.bsky.network',
    'wss://jetstream1.us-west.bsky.network',
    'wss://jetstream2.us-west.bsky.network'
];

const MAX_SWEARS = 30; // Limit of swears to display
const swearContainer = document.getElementById('swearContainer');

const INITIAL_BACKOFF = 1000; // Start with 1 second
const MAX_BACKOFF = 5000; // Max 5 seconds
const BACKOFF_MULTIPLIER = 1.5;
let currentBackoff = INITIAL_BACKOFF;
let reconnectTimer = null;
let heartbeatInterval = null;
let excludedJetstreams = new Set(); // Track failed jetstreams
let activeConnection = null; // Track the active WebSocket connection
let isConnecting = false; // Prevent multiple connection attempts
const connectionOverlay = document.getElementById('connectionOverlay');
const statusMessage = connectionOverlay.querySelector('.status-message span:last-child');
const statusEmoji = connectionOverlay.querySelector('.rotating-emoji');

function createSpeechBubbleSVG() {
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("data-src", `img/speech${Math.ceil(Math.random() * 4)}.svg`);
    svg.style.width = "100%";
    svg.style.height = "auto";
    svg.style.fill = "white";
    return svg;
}

function createSwear(words, record) {
    const container = document.createElement('a');
    container.className = 'swear-speech';
    container.href = `https://bsky.app/profile/${record.did}/post/${record.commit.rkey}`;
    container.target = '_blank';
    container.rel = 'noopener';

    const startX = Math.random() * window.innerWidth;
    container.style.left = `${startX}px`;
    container.style.rotate = `${-10 + (Math.random() * 10)}deg`;

    // Add SVG background
    const svg = createSpeechBubbleSVG(words);
    container.appendChild(svg);

    setTimeout(() => {
        if(!playing) {
            howl.play(words[0]);
            playing = true;
            setTimeout(() => {
                playing = false;
            },250);
        }
    },250);

    const swearSpan = document.createElement('span');
    swearSpan.className = 'swearword';
    swearSpan.textContent = words[0];
    swearSpan.style.paddingBottom = '0.1em';
    swearSpan.style.fontSize = `2em`;
    container.appendChild(swearSpan);

    const duration = Math.max(2, Math.min(8, 3 + (words.length / 50))) * 1;
    container.style.animationDuration = `${duration}s`;

    swearContainer.appendChild(container);

    // Clean up after animation
    container.addEventListener('animationend', () => {
        if (container.parentNode) {
            swearContainer.removeChild(container);
        }
    });
}

function connectWebSocket() {
    console.log("st")
    // Clear any existing timers
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (heartbeatInterval) clearInterval(heartbeatInterval);

    // Only show connecting status if we don't have an active connection
    if (!activeConnection || activeConnection.readyState !== WebSocket.OPEN) {
        updateConnectionStatus('connecting');
    }

    // Don't attempt to connect if we're already connecting or have an active connection
    if (isConnecting || (activeConnection && activeConnection.readyState === WebSocket.OPEN)) {
        updateConnectionStatus('connected');
        return;
    }

    isConnecting = true;

    const availableJetstreams = JETSTREAMS.filter(js => !excludedJetstreams.has(js));

    if (availableJetstreams.length === 0) {
        console.log('All jetstreams failed, resetting exclusion list');
        excludedJetstreams.clear();
        isConnecting = false;
        updateConnectionStatus('disconnected');
        scheduleReconnect();
        return;
    }

    const randomJetstream = availableJetstreams[Math.floor(Math.random() * availableJetstreams.length)];
    const wsUrl = `${randomJetstream}/subscribe?wantedCollections=app.bsky.feed.post`;

    if (activeConnection) {
        activeConnection.close();
    }

    const ws = new WebSocket(wsUrl);
    activeConnection = ws;

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        excludedJetstreams.add(randomJetstream);
        console.log(`Added ${randomJetstream} to excluded list. Currently excluded:`, [...excludedJetstreams]);
        isConnecting = false;
        updateConnectionStatus('disconnected');
        scheduleReconnect();
    };

    ws.onclose = () => {
        if (activeConnection === ws) {
            excludedJetstreams.add(randomJetstream);
            console.log(`Connection closed. Added ${randomJetstream} to excluded list. Currently excluded:`, [...excludedJetstreams]);
            isConnecting = false;
            updateConnectionStatus('disconnected');
            scheduleReconnect();
        }
    };

    ws.onopen = () => {
        isConnecting = false;
        console.log(`Connected to ${randomJetstream}`);
        updateConnectionStatus('connected');
        currentBackoff = INITIAL_BACKOFF; // Reset backoff on successful connection
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.commit?.record?.text && swears.filter(e => data.commit.record.text.includes(e)).length > 0) {
            const words = swears.filter(e => data.commit.record.text.includes(e));

            if (swearContainer.childElementCount < MAX_SWEARS) {
                createSwear(words, data);
            }
        }
    };
}

function scheduleReconnect() {
    if (document.visibilityState === 'visible') {
        if (reconnectTimer) clearTimeout(reconnectTimer);

        reconnectTimer = setTimeout(() => {
            connectWebSocket();
            // Increase backoff time for next attempt
            currentBackoff = Math.min(currentBackoff * BACKOFF_MULTIPLIER, MAX_BACKOFF);
        }, currentBackoff);
    }
}

function start() {
    document.getElementById('introContainer').remove();
    // Initial connection
    connectWebSocket();

    // Update the visibility change handler
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            console.log("vis")
            // Check if we already have an active connection
            if (activeConnection && activeConnection.readyState === WebSocket.OPEN) {
                updateConnectionStatus('connected');
            } else {
                updateConnectionStatus('connecting');
                connectWebSocket();
            }
        } else {
            if (activeConnection) {
                activeConnection.close();
            }
            if (reconnectTimer) clearTimeout(reconnectTimer);
            if (heartbeatInterval) clearInterval(heartbeatInterval);
            updateConnectionStatus('disconnected');
        }
    });
}

function updateConnectionStatus(status) {
    if (status === 'connected') {
        connectionOverlay.classList.remove('visible');
        setTimeout(() => {
            statusMessage.textContent = 'Connected to Bluesky';
            statusEmoji.textContent = '✅';
        }, 300);
    } else if (status === 'connecting') {
        connectionOverlay.classList.add('visible');
        statusMessage.textContent = 'Connecting to Bluesky...';
        statusEmoji.textContent = '🤬';
    } else if (status === 'disconnected') {
        connectionOverlay.classList.add('visible');
        statusMessage.textContent = 'Disconnected - Retrying...';
        statusEmoji.textContent = '🤬';
    }
}