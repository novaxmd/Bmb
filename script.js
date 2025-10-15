document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('download-form');
    const urlInput = document.getElementById('url-input');
    const aiToggle = document.getElementById('ai-enhance-toggle');
    const loader = document.getElementById('loader');
    const resultContainer = document.getElementById('result-container');
    const errorMessage = document.getElementById('error-message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const url = urlInput.value.trim();
        const useAI = aiToggle.checked;

        if (!url) {
            showError("Please paste a URL first.");
            return;
        }

        showLoader(true);
        hideError();
        resultContainer.classList.add('hidden');
        resultContainer.innerHTML = '';

        try {
            // --- ONLY USE DELIRIUS API ---
            const apiUrl = `https://delirius-apiofc.vercel.app/download/tiktok?url=${encodeURIComponent(url)}`;
            const response = await fetch(apiUrl);

            if (!response.ok) throw new Error('Failed to fetch media from TikTok.');
            const data = await response.json();

            // --- Parse Delirius API Response ---
            if (!data.result || !data.result.video || !data.result.video[0]) {
                throw new Error("No video found or invalid TikTok link.");
            }
            
            const result = {
                platform: 'TikTok',
                mediaType: 'video',
                previewUrl: data.result.cover || "",
                quality: 'Default',
                downloadUrl: data.result.video[0],
                enhancedDownloadUrl: useAI ? data.result.video[0] : null // No AI enhancement, just repeat video link
            };

            displayResult(result);

        } catch (error) {
            showError(error.message || "An unknown error occurred. Please try again.");
        } finally {
            showLoader(false);
        }
    });

    function displayResult(data) {
        resultContainer.classList.remove('hidden');
        let mediaHtml = '';
        
        if (data.mediaType === 'video' && data.downloadUrl) {
            mediaHtml = `<video class="media-preview" src="${data.downloadUrl}" controls></video>`;
        } else if (data.mediaType === 'image' && data.previewUrl) {
            mediaHtml = `<img class="media-preview" src="${data.previewUrl}" alt="Media preview">`;
        } else if (data.previewUrl) {
            mediaHtml = `<img class="media-preview" src="${data.previewUrl}" alt="Media preview">`;
        }

        let downloadButtonsHtml = `
            <div class="download-section">
                <a href="${data.downloadUrl}" class="download-btn primary" download>
                    Download (${data.quality})
                </a>
        `;
        
        if (data.enhancedDownloadUrl && data.enhancedDownloadUrl !== data.downloadUrl) {
            downloadButtonsHtml += `
                <a href="${data.enhancedDownloadUrl}" class="download-btn secondary" download>
                    Download AI Enhanced (HD)
                </a>
            `;
        }

        downloadButtonsHtml += '</div>';

        resultContainer.innerHTML = mediaHtml + downloadButtonsHtml;
    }

    // --- Helper Functions for UI ---
    function showLoader(isLoading) {
        if (isLoading) {
            loader.classList.remove('loader-hidden');
        } else {
            loader.classList.add('loader-hidden');
        }
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }

    function hideError() {
        errorMessage.classList.add('hidden');
    }
});
