const API_URL = "https://g6vegcb7d8.execute-api.eu-north-1.amazonaws.com/prod/generate"; // Will be replaced by deployment script

document.addEventListener('DOMContentLoaded', () => {
    const vibeButtons = document.querySelectorAll('.vibe-btn');
    const generateBtn = document.getElementById('generate-btn');
    const ideaInput = document.getElementById('idea-input');
    const errorMessage = document.getElementById('error-message');
    
    const generatorSection = document.getElementById('generator-section');
    const loadingSection = document.getElementById('loading-section');
    const resultSection = document.getElementById('result-section');
    
    const copyBtn = document.getElementById('copy-btn');
    const resetBtn = document.getElementById('reset-btn');

    let selectedVibe = "Chill";
    let generatedPlaylist = null;

    // Vibe selection
    vibeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            vibeButtons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedVibe = btn.getAttribute('data-vibe');
        });
    });

    // Generate Playlist
    generateBtn.addEventListener('click', async () => {
        const idea = ideaInput.value.trim();
        
        if (!idea) {
            showError("Tell us what you're feeling first.");
            return;
        }
        
        if (idea.length > 500) {
            showError("Keep it a bit shorter, please.");
            return;
        }

        hideError();
        showLoading();

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ idea, vibe: selectedVibe })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            generatedPlaylist = data;
            renderPlaylist(data);
            showResult();

        } catch (error) {
            console.error('Error:', error);
            showError("The music stopped for a moment. Please try again.");
            showGenerator();
        }
    });

    // Copy Playlist
    copyBtn.addEventListener('click', () => {
        if (!generatedPlaylist) return;

        let copyText = `${generatedPlaylist.title.toUpperCase()}\n\n`;
        copyText += `${generatedPlaylist.description}\n\n`;
        
        generatedPlaylist.tracks.forEach((track, index) => {
            copyText += `${index + 1}. ${track.title} — ${track.artist}\n`;
        });
        
        copyText += `\nVibe: ${generatedPlaylist.vibe || selectedVibe}`;

        navigator.clipboard.writeText(copyText).then(() => {
            const originalText = copyBtn.innerText;
            copyBtn.innerText = "Copied!";
            copyBtn.style.backgroundColor = "var(--accent-color)";
            copyBtn.style.color = "#000";
            copyBtn.style.borderColor = "var(--accent-color)";
            
            setTimeout(() => {
                copyBtn.innerText = originalText;
                copyBtn.style.backgroundColor = "transparent";
                copyBtn.style.color = "var(--text-primary)";
                copyBtn.style.borderColor = "var(--border-color)";
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    });

    // Reset
    resetBtn.addEventListener('click', () => {
        showGenerator();
        ideaInput.value = '';
        window.scrollTo(0, 0);
    });

    // UI Helpers
    function showError(msg) {
        errorMessage.textContent = msg;
        errorMessage.classList.remove('hidden');
    }

    function hideError() {
        errorMessage.classList.add('hidden');
    }

    function showLoading() {
        generatorSection.classList.add('hidden');
        resultSection.classList.add('hidden');
        loadingSection.classList.remove('hidden');
    }

    function showGenerator() {
        loadingSection.classList.add('hidden');
        resultSection.classList.add('hidden');
        generatorSection.classList.remove('hidden');
    }

    function showResult() {
        loadingSection.classList.add('hidden');
        generatorSection.classList.add('hidden');
        resultSection.classList.remove('hidden');
    }

    function renderPlaylist(data) {
        document.getElementById('playlist-title').textContent = data.title;
        document.getElementById('playlist-desc').textContent = data.description;
        document.getElementById('playlist-vibe').textContent = data.vibe || selectedVibe;

        const trackList = document.getElementById('track-list');
        trackList.innerHTML = '';

        data.tracks.forEach((track, index) => {
            const num = (index + 1).toString().padStart(2, '0');
            const html = `
                <div class="track-item">
                    <div class="track-number">${num}</div>
                    <div class="track-details">
                        <div class="track-name">${track.title}</div>
                        <div class="track-artist">${track.artist}</div>
                    </div>
                </div>
            `;
            trackList.insertAdjacentHTML('beforeend', html);
        });
    }
});



