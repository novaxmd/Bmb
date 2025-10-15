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

        // --- UI Updates ---
        showLoader(true);
        hideError();
        resultContainer.classList.add('hidden');
        resultContainer.innerHTML = '';

        try {
            // --- This is where the real API call would go ---
            // const response = await fetch('/api/process-url', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ url, useAI })
            // });
            // if (!response.ok) throw new Error('Failed to fetch media.');
            // const data = await response.json();

            // --- MOCK API CALL (FOR DEMO PURPOSES) ---
            const data = await mockApiCall(url, useAI);

            displayResult(data);

        } catch (error) {
            showError(error.message || "An unknown error occurred. Please try again.");
        } finally {
            showLoader(false);
        }
    });

    function displayResult(data) {
        resultContainer.classList.remove('hidden');
        let mediaHtml = '';
        
        if (data.mediaType === 'video') {
            mediaHtml = `<video class="media-preview" src="${data.previewUrl}" controls></video>`;
        } else if (data.mediaType === 'image') {
            mediaHtml = `<img class="media-preview" src="${data.previewUrl}" alt="Media preview">`;
        }

        let downloadButtonsHtml = `
            <div class="download-section">
                <a href="${data.downloadUrl}" class="download-btn primary" download>
                    Download (${data.quality})
                </a>
        `;
        
        if (data.enhancedDownloadUrl) {
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

    // --- MOCK API FUNCTION (DELETE THIS IN PRODUCTION) ---
    async function mockApiCall(url, useAI) {
        console.log(`Mocking API call for URL: ${url} with AI: ${useAI}`);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (url.includes('tiktok.com')) {
            // Simulate a successful TikTok response
            const response = {
                platform: 'TikTok',
                mediaType: 'video',
                previewUrl: 'https://v16-webapp.tiktok.com/3932267923838520d244976c6c59218d/6154A4F7/video/tos/maliva/tos-maliva-v-0068-tx/d6f3586f1e6f423386921319c7205f03/?a=1988&br=3328&bt=1664&cd=0%7C0%7C1&ch=0&cr=0&cs=0&cv=1&dr=0&ds=3&er=&ft=b4~_LSrKDy~T-G&l=2021092917574201022306703517032742&lr=tiktok_m&mime_type=video_mp4&net=0&pl=0&qs=0&rc=M2g1PDw6ZjV0ODMzNzczM0ApPDc3Zzo8OzxnaWQ2PDw0PGdfNV8zMl4tY2AwYl5fLS1kMWNzcy5gY2NeMi0yNS4wYDFgMGE6Yw%3D%3D&vl=&vr=', // A real (but maybe temporary) sample URL
                quality: '720p',
                downloadUrl: 'https://example.com/tiktok_video_no_watermark.mp4',
            };
            if (useAI) {
                response.enhancedDownloadUrl = 'https://example.com/tiktok_video_ai_enhanced.mp4';
            }
            return response;

        } else if (url.includes('instagram.com')) {
             // Simulate a successful Instagram response
            return {
                platform: 'Instagram',
                mediaType: 'image',
                previewUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1374&q=80', // Sample image
                quality: '1080px',
                downloadUrl: 'https://example.com/instagram_image.jpg',
                enhancedDownloadUrl: useAI ? 'https://example.com/instagram_image_ai_enhanced.jpg' : null,
            };
        } else {
            // Simulate an error
            throw new Error("Invalid URL. Please use a valid TikTok or Instagram link.");
        }
    }
});