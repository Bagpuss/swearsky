const howl = new Howl({src:["./sounds.webm?20241123","./sounds.mp3?20241123"],html5:false,volume:1,
    sprite: {
      "arse": [
        0,
        788.140589569161
      ],
      "boobs": [
        2000,
        604.6938775510205
      ],
      "dick": [
        4000,
        523.582766439909
      ],
      "fucking": [
        6000,
        824.5351473922904
      ],
      "motherfucker": [
        8000,
        1312.6303854875284
      ],
      "rectum": [
        11000,
        2052.494331065759
      ],
      "twat": [
        15000,
        781.6780045351468
      ],
      "arsehole": [
        17000,
        752.1768707483005
      ],
      "bugger": [
        19000,
        427.70975056689406
      ],
      "dickhead": [
        21000,
        575.1927437641733
      ],
      "gash": [
        23000,
        752.1768707483005
      ],
      "nobhead": [
        25000,
        771.678004535147
      ],
      "shit": [
        27000,
        930.2494331065745
      ],
      "wanker": [
        29000,
        818.5487528344665
      ],
      "asshole": [
        31000,
        810.0453514739243
      ],
      "bullshit": [
        33000,
        737.4376417233534
      ],
      "dipshit": [
        35000,
        722.6757369614489
      ],
      "holy shit": [
        37000,
        1445.3741496598625
      ],
      "piss": [
        40000,
        737.0521541950126
      ],
      "shite": [
        42000,
        907.0294784580497
      ],
      "bastard": [
        44000,
        516.2131519274383
      ],
      "cock": [
        46000,
        648.934240362813
      ],
      "dumbass": [
        48000,
        792.8344671201799
      ],
      "horseshit": [
        50000,
        948.6848072562352
      ],
      "pissing": [
        52000,
        634.1950113378658
      ],
      "shitting": [
        54000,
        811.156462585032
      ],
      "batshit": [
        56000,
        794.6712018140615
      ],
      "cocksucker": [
        58000,
        1017.664399092972
      ],
      "fuck it": [
        61000,
        781.678004535145
      ],
      "jackass": [
        63000,
        884.9206349206327
      ],
      "prick": [
        65000,
        567.8231292517069
      ],
      "shitty": [
        67000,
        818.5487528344737
      ],
      "bitch": [
        69000,
        567.8231292517069
      ],
      "cunt": [
        71000,
        597.3242630385442
      ],
      "fuck": [
        73000,
        824.5578231292541
      ],
      "jizz": [
        75000,
        648.9342403628058
      ],
      "pussy": [
        77000,
        644.8299319727937
      ],
      "spunk": [
        79000,
        892.2902494331026
      ],
      "bollocks": [
        81000,
        642.1768707483011
      ],
      "damn": [
        83000,
        613.1292517006841
      ],
      "fucker": [
        85000,
        845.6689342403649
      ],
      "minge": [
        87000,
        921.7913832199542
      ],
      "quim": [
        89000,
        877.392290249432
      ],
      "tits": [
        91000,
        693.197278911569
      ],
      "bellend": [
        93000,
        905.7823129251688
      ],
      "tosser": [
        95000,
        704.4897959183629
      ],
      "minger": [
        97000,
        855.4421768707527
      ],
      "bloody hell": [
        99000,
        1107.052154195017
      ],
      "douchebag": [
        102000,
        956.0997732426273
      ],
      "titties": [
        104000,
        805.1247165532942
      ],
      "apeshit": [
        106000,
        805.1247165532942
      ],
      "willy": [
        108000,
        1408.97959183674
      ],
      "fuck off": [
        111000,
        1056.7346938775445
      ],
      "gobshite": [
        114000,
        797.0975056689298
      ]
    }
});

let swears = Object.keys(howl._sprite)
swears.push("knobhead","bell end","bell-end","douche bag","motherfuckers");
const regex = new RegExp(`\\b(${swears.join("|")})\\b`,"ig");

// let playing = false;

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
const statusEmoji = connectionOverlay.querySelector('#status-emoji');

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
    const word = words[0].toLowerCase();
    const container = document.createElement('a');
    container.className = 'swear-speech';
    container.href = `https://bsky.app/profile/${record.did}/post/${record.commit.rkey}`;
    container.target = '_blank';
    container.rel = 'noopener';

    const startX = Math.random() * window.innerWidth;
    container.style.left = `calc(${startX}px - 5em)`;
    container.style.rotate = `${-10 + (Math.random() * 20)}deg`;

    // Add SVG background
    const svg = createSpeechBubbleSVG();
    container.appendChild(svg);

    setTimeout(() => {
      audio = word;
      switch(audio) {
        case "bell end":
        case "bell-end":
          audio = "bellend";
          break;
        case "knobhead":
          audio = "nobhead";
          break;
        case "douche bag":
          audio = "douchebag";
          break;
        case "motherfuckers":
          audio = "motherfucker";
          break;
        }
      howl.play(audio);
    },200);

    const swearSpan = document.createElement('span');
    swearSpan.className = 'swearword';
    swearSpan.textContent = word;
    swearSpan.style.paddingBottom = '0.1em';
    swearSpan.style.fontSize = `2em`;
    container.appendChild(swearSpan);

    const duration = 4 + (Math.random() * 4);
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

        if (data.commit?.record?.text && regex.test(data.commit.record.text)) {
            const words = extractSwears(data.commit.record.text);

            if (swearContainer.childElementCount < MAX_SWEARS) {
                createSwear(words, data);
            }
        }
    };
}

function extractSwears(text) {
  // Add the global flag 'g' to the regex for matchAll to work
  const globalEmojiRegex = new RegExp(regex.source, 'gi');
  return Array.from(text.matchAll(globalEmojiRegex), m => m[0]);
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
            // Check if we already have an active connection0
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
      statusMessage.textContent = 'Click on a swear to see the post!';
      statusEmoji.textContent = '✅';
      statusEmoji.className = "";
      setTimeout(() => {
        connectionOverlay.classList.remove('visible');
      }, 1000);
    } else if (status === 'connecting') {
        connectionOverlay.classList.add('visible');
        statusMessage.textContent = 'Connecting to Bluesky...';
        statusEmoji.textContent = '🤬';
        statusEmoji.className = "rotating-emoji";
    } else if (status === 'disconnected') {
        connectionOverlay.classList.add('visible');
        statusMessage.textContent = 'Disconnected - Retrying...';
        statusEmoji.textContent = '🤬';
        statusEmoji.className = "rotating-emoji";
    }
}