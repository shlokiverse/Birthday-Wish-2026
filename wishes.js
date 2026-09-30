// Music control
const bgMusic = document.getElementById('bgMusic');
const musicToggle = document.getElementById('musicToggle');
const musicIcon = musicToggle.querySelector('.music-icon');

function toggleMusic() {
    if (bgMusic.paused) {
        bgMusic.play().then(() => {
            musicToggle.classList.add('playing');
            musicIcon.textContent = '🎵';
            localStorage.setItem('musicPlaying', 'true');
        }).catch((err) => console.log('Music play failed:', err));
    } else {
        bgMusic.pause();
        musicToggle.classList.remove('playing');
        musicIcon.textContent = '🔇';
        localStorage.setItem('musicPlaying', 'false');
    }
}

musicToggle.addEventListener('click', toggleMusic);

// Check if music was playing on previous page
if (localStorage.getItem('musicPlaying') === 'true') {
    bgMusic.play().then(() => {
        musicToggle.classList.add('playing');
        musicIcon.textContent = '🎵';
    }).catch(() => {
        musicIcon.textContent = '🔇';
    });
}

// ===== CUSTOMIZE: Add your reasons here! =====
// Each reason has:
// - text: The message to display
// - emoji: An emoji shown before the text
// - gif: Animation file to show (optional, use animation-1.gif or animation-2.gif)
const reasons = [
    {
        text: "Because your smile can fix my whole day. 🥰",
        emoji: "✨",
        gif: "gif1.gif"
    },
    {
        text: "Because your eyes and your smile are my favourite things about you. 🌸",
        emoji: "💫",
        gif: "gif2.gif"
    },
    {
        text: "Because even your gussa is something I miss. 😅",
        emoji: "🌟",
        gif: "gif1.gif"
    },
    {
        text: "Because I still miss our calls, our chats and all our stupid little moments. 📞",
        emoji: "💖",
        gif: "gif2.gif"
    },
    {
        text: "Because 'Poobear' just sounds best when you say it. 🐻",
        emoji: "🧸",
        gif: "gif1.gif"
    },
    {
        text: "Because I admire everything about you. Yes, everything. 🌷",
        emoji: "💐",
        gif: "gif2.gif"
    },
    {
        text: "Because through every hurt, mistake and misunderstanding, my love and care were always genuine. 🤍",
        emoji: "🕊️",
        gif: "gif1.gif"
    },
    {
        text: "Because all I truly want is for you to be happy, peaceful and successful. 🌙",
        emoji: "🌼",
        gif: "gif2.gif"
    },
    {
        text: "Because you're my Piyu, and today is all about you! Happy Birthday! 🎉",
        emoji: "🎂",
        gif: "gif1.gif"
    }
    // Add more reasons as needed!
];

// State management
let currentReasonIndex = 0;
const reasonsContainer = document.getElementById('reasons-container');
const shuffleButton = document.querySelector('.shuffle-button');
const reasonCounter = document.querySelector('.reason-counter');
let isTransitioning = false;

// Create reason card with gif
function createReasonCard(reason) {
    const card = document.createElement('div');
    card.className = 'reason-card';

    const text = document.createElement('div');
    text.className = 'reason-text';
    text.innerHTML = `${reason.emoji} ${reason.text}`;

    const gifOverlay = document.createElement('div');
    gifOverlay.className = 'gif-overlay';
    gifOverlay.innerHTML = `<img src="${reason.gif}" alt="Celebration">`;

    card.appendChild(text);
    card.appendChild(gifOverlay);

    gsap.from(card, {
        opacity: 0,
        y: 50,
        duration: 0.5,
        ease: "back.out"
    });

    return card;
}

// Display new reason
function displayNewReason() {
    if (isTransitioning) return;
    isTransitioning = true;

    if (currentReasonIndex < reasons.length) {
        const card = createReasonCard(reasons[currentReasonIndex]);
        reasonsContainer.appendChild(card);

        // Update counter
        reasonCounter.textContent = `Reason ${currentReasonIndex + 1} of ${reasons.length}`;

        currentReasonIndex++;

        // Check if we should transform the button
        if (currentReasonIndex === reasons.length) {
            gsap.to(shuffleButton, {
                scale: 1.1,
                duration: 0.5,
                ease: "elastic.out",
                onComplete: () => {
                    // CUSTOMIZE: Change button text
                    shuffleButton.textContent = "Continue to Timeline 💫";
                    shuffleButton.classList.add('story-mode');
                    revealEnding();
                    shuffleButton.addEventListener('click', () => {
                        gsap.to('body', {
                            opacity: 0,
                            duration: 1,
                            onComplete: () => {
                                window.location.href = 'timeline.html';
                            }
                        });
                    });
                }
            });
        }

        // Create floating elements
        createFloatingElement();

        setTimeout(() => {
            isTransitioning = false;
        }, 500);
    } else {
        window.location.href = "timeline.html";
    }
}

// After the last reason: gently reveal the closing photo + message
function revealEnding() {
    gsap.to('.teddy-hug', { scale: 1, duration: 0.8, ease: "back.out" });
    gsap.to('.ending-text', { opacity: 1, y: 0, duration: 0.8, delay: 0.3 });
    if (window.Garden) window.Garden.burst();
}

// Initialize button click
shuffleButton.addEventListener('click', () => {
    gsap.to(shuffleButton, {
        scale: 0.9,
        duration: 0.1,
        yoyo: true,
        repeat: 1
    });
    displayNewReason();
});

// Floating elements function
function createFloatingElement() {
    const elements = ['🌸', '✨', '💖', '🦋', '⭐'];
    const element = document.createElement('div');
    element.className = 'floating';
    element.textContent = elements[Math.floor(Math.random() * elements.length)];
    element.style.left = Math.random() * window.innerWidth + 'px';
    element.style.top = Math.random() * window.innerHeight + 'px';
    element.style.fontSize = (Math.random() * 20 + 10) + 'px';
    document.body.appendChild(element);

    gsap.to(element, {
        y: -500,
        duration: Math.random() * 10 + 10,
        opacity: 0,
        onComplete: () => element.remove()
    });
}

// Create initial floating elements
setInterval(createFloatingElement, 2000);
