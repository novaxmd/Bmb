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
            // List of TikTok downloader APIs
            const APIS = [
                {
                    name: "Delirius",
                    url: `https://delirius-apiofc.vercel.app/download/tiktok?url=${encodeURIComponent(url)}`,
                    parse: (data) => {
                        if (data.result && data.result.video && data.result.video[0]) {
                            return {
                                platform: 'TikTok',
                                mediaType: 'video',
                                previewUrl: data.result.cover || "",
                                quality: 'Default',
                                downloadUrl: data.result.video[0],
                                enhancedDownloadUrl: useAI ? data.result.video[0] : null
                            };
                        }
                        return null;
                    }
                },
                {
                    name: "GiftedTechV2",
                    url: `https://api.giftedtech.web.id/api/download/tiktokdlv2?apikey=gifted&url=${encodeURIComponent(url)}`,
                    parse: (data) => {
                        if (data.result && data.result.video_nowm) {
                            return {
                                platform: 'TikTok',
                                mediaType: 'video',
                                previewUrl: data.result.thumbnail || "",
                                quality: 'Default',
                                downloadUrl: data.result.video_nowm,
                                enhancedDownloadUrl: useAI ? data.result.video_nowm : null
                            };
                        }
                        return null;
                    }
                },
                {
                    name: "GiftedTech",
                    url: `https://api.giftedtech.web.id/api/download/tiktok?apikey=gifted&url=${encodeURIComponent(url)}`,
                    parse: (data) => {
                        if (data.result && (data.result.video_nowm || data.result.video)) {
                            return {
                                platform: 'TikTok',
                                mediaType: 'video',
                                previewUrl: data.result.thumbnail || data.result.cover || "",
                                quality: 'Default',
                                downloadUrl: data.result.video_nowm || data.result.video,
                                enhancedDownloadUrl: useAI ? (data.result.video_nowm || data.result.video) : null
                            };
                        }
                        return null;
                    }
                }
            ];

            let result = null;
            let lastError = "";

            // Try each API until one works
            for (const api of APIS) {
                try {
                    const response = await fetch(api.url);
                    if (!response.ok) throw new Error(`${api.name} API returned error`);
                    const data = await response.json();
                    result = api.parse(data);
                    if (result) {
                        break; // Found a valid result, stop trying others
                    }
                } catch (err) {
                    lastError = err.message;
                }
            }

            if (!result) {
                throw new Error("Failed to fetch media from all APIs. " + lastError);
            }

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
