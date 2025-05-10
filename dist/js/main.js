document.addEventListener('DOMContentLoaded', function() {
    // 전역 변수로 마지막 뉴스 검색 결과 저장
    window.lastSearchResults = [];

    // --- 초기화 ---
    ApiConfig.init(); // 저장된 API 설정 로드 및 UI 반영
    setupPasswordToggles(); // 비밀번호 표시/숨김 토글 설정
    setupTabs(); // 탭 기능 설정

    // --- API 설정 이벤트 리스너 ---
    const saveGeminiButton = document.getElementById('save-gemini-settings');
    if (saveGeminiButton) {
        saveGeminiButton.addEventListener('click', () => {
            ApiConfig.saveGeminiSettings();
        });
    }

    const testGeminiButton = document.getElementById('test-gemini-api');
    if (testGeminiButton) {
        testGeminiButton.addEventListener('click', async function() {
            this.disabled = true;
            const originalText = this.textContent;
            this.textContent = '테스트 중...';
            const statusTextElement = document.getElementById('gemini-status-text');
            // const originalStatus = statusTextElement ? statusTextElement.textContent : ''; // updateApiStatus가 처리
            if (statusTextElement) statusTextElement.textContent = '연결 테스트 중...';

            try {
                const result = await GeminiAPI.testConnection();
                alert(result ? 'Gemini API 연결 테스트 성공!' : `Gemini API 연결 테스트 실패: ${ApiConfig.apiStatus.gemini.error || '알 수 없는 오류'}`);
            } catch (e) { // testConnection 내부에서 error를 throw하지 않지만, 만약을 대비
                ApiConfig.setGeminiConnectionStatus(false, e.message);
                alert(`Gemini API 연결 테스트 중 예외 발생: ${e.message}`);
            } finally {
                this.disabled = false;
                this.textContent = originalText;
                // ApiConfig.updateApiStatus('gemini')는 setGeminiConnectionStatus 내부에서 호출됨
            }
        });
    }

    const saveNaverButton = document.getElementById('save-naver-settings');
    if (saveNaverButton) {
        saveNaverButton.addEventListener('click', () => {
            ApiConfig.saveNaverSettings();
        });
    }

    const testNaverButton = document.getElementById('test-naver-api');
    if (testNaverButton) {
        testNaverButton.addEventListener('click', async function() {
            this.disabled = true;
            const originalText = this.textContent;
            this.textContent = '테스트 중...';
            const statusTextElement = document.getElementById('naver-status-text');
            // const originalStatus = statusTextElement ? statusTextElement.textContent : '';
            if (statusTextElement) statusTextElement.textContent = '연결 테스트 중...';
            try {
                const result = await NaverAPI.testConnection();
                alert(result ? 'Naver API (모의) 연결 테스트 성공!' : `Naver API (모의) 연결 테스트 실패: ${ApiConfig.apiStatus.naver.error || '알 수 없는 오류'}`);
            } catch (e) {
                ApiConfig.setNaverConnectionStatus(false, e.message);
                alert(`Naver API (모의) 연결 테스트 중 예외 발생: ${e.message}`);
            } finally {
                this.disabled = false;
                this.textContent = originalText;
            }
        });
    }

    // --- 뉴스 검색 탭 이벤트 리스너 ---
    const searchNewsButton = document.getElementById('search-news');
    if (searchNewsButton) {
        searchNewsButton.addEventListener('click', handleNewsSearch);
    }

    // --- Gemini 분석 탭 이벤트 리스너 ---
    const runGeminiAnalysisButton = document.getElementById('run-gemini-analysis');
    if (runGeminiAnalysisButton) {
        runGeminiAnalysisButton.addEventListener('click', handleGeminiAnalysis);
    }

    // --- 통합 모드 탭 이벤트 리스너 ---
    const runIntegratedModeButton = document.getElementById('run-integrated-mode');
    if (runIntegratedModeButton) {
        runIntegratedModeButton.addEventListener('click', handleIntegratedMode);
    }

    // --- 유틸리티 함수 ---
    function setupPasswordToggles() {
        const toggleGeminiKey = document.getElementById('toggle-gemini-key');
        const geminiApiKeyInput = document.getElementById('gemini-api-key');
        if (toggleGeminiKey && geminiApiKeyInput) {
            toggleGeminiKey.addEventListener('click', function() {
                const iconElement = this.querySelector('i');
                if (iconElement) {
                    togglePasswordVisibility(geminiApiKeyInput, iconElement);
                }
            });
        }

        const toggleNaverSecret = document.getElementById('toggle-naver-secret');
        const naverClientSecretInput = document.getElementById('naver-client-secret');
        if (toggleNaverSecret && naverClientSecretInput) {
            toggleNaverSecret.addEventListener('click', function() {
                 const iconElement = this.querySelector('i');
                if (iconElement) {
                    togglePasswordVisibility(naverClientSecretInput, iconElement);
                }
            });
        }
    }

    function togglePasswordVisibility(inputElement, iconElement) {
        // inputElement와 iconElement는 이미 null 체크 후 호출된다고 가정
        const type = inputElement.getAttribute('type') === 'password' ? 'text' : 'password';
        inputElement.setAttribute('type', type);
        iconElement.textContent = type === 'text' ? 'visibility' : 'visibility_off';
    }

    function setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        if (tabButtons.length === 0 || tabContents.length === 0) {
            console.warn("탭 버튼 또는 탭 콘텐츠를 찾을 수 없습니다.");
            return;
        }

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                tabContents.forEach(content => content.classList.remove('active'));
                const activeTabId = button.dataset.tab;
                if (activeTabId) {
                    const activeTabContent = document.getElementById(activeTabId);
                    if (activeTabContent) {
                        activeTabContent.classList.add('active');
                    } else {
                        console.warn(`탭 콘텐츠 ID '${activeTabId}'를 찾을 수 없습니다.`);
                    }
                }
            });
        });
    }

    function showLoading(indicatorId, show = true) {
        const indicator = document.getElementById(indicatorId);
        if (indicator) {
            indicator.style.display = show ? 'flex' : 'none';
        } else {
            console.warn(`로딩 인디케이터 ID '${indicatorId}'를 찾을 수 없습니다.`);
        }
    }

    function displayResults(containerId, htmlContentOrError, isError = false) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`결과 컨테이너 ID '${containerId}'를 찾을 수 없습니다.`);
            return;
        }
        if (isError) {
            container.innerHTML = `<p class="error-message">${sanitizeAndFormatText(String(htmlContentOrError))}</p>`;
        } else {
            container.innerHTML = htmlContentOrError; // 이미 sanitize된 HTML이거나, NaverAPI.renderNewsResults에서 생성된 안전한 HTML
        }
    }

    function sanitizeAndFormatText(text) {
        if (typeof text !== 'string') text = String(text); // 숫자인 경우 문자열로 변환
        // XSS 방지를 위한 기본적인 HTML 이스케이프
        const escapeHTML = (str) => str.replace(/[&<>"']/g, (match) => {
            const escape = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            };
            return escape[match];
        });
        let escapedText = escapeHTML(text);
        // \n을 <br>로 변환 (pre-wrap 스타일과 함께 사용)
        escapedText = escapedText.replace(/\n/g, '<br>');
        return escapedText;
    }

    // --- 핸들러 함수 ---
    async function handleNewsSearch() {
        if (!ApiConfig.isConfigured('naver')) {
            alert('Naver API 설정이 필요합니다. API 설정 탭에서 설정해주세요.');
            return;
        }

        const queryInput = document.getElementById('news-query');
        const query = queryInput ? queryInput.value.trim() : '';
        if (!query) {
            alert('검색어를 입력해주세요.');
            queryInput?.focus();
            return;
        }
        const sort = document.getElementById('news-sort')?.value || 'sim';
        const startDate = document.getElementById('news-start-date')?.value;
        const endDate = document.getElementById('news-end-date')?.value;
        const display = document.getElementById('news-display')?.value || '10';

        const resultsList = document.getElementById('news-results-list');
        const searchButton = document.getElementById('search-news');

        showLoading('news-loading', true);
        if (resultsList) resultsList.innerHTML = '<p>검색 중...</p>';
        if (searchButton) searchButton.disabled = true;

        try {
            const response = await NaverAPI.searchNews(query, sort, display, startDate, endDate);
            window.lastSearchResults = response.items || [];
            if (resultsList) { // resultsList가 null이 아닐 때만 NaverAPI.renderNewsResults 호출
                NaverAPI.renderNewsResults(response.items, resultsList);
            } else {
                console.error("뉴스 결과 목록 요소를 찾을 수 없습니다: #news-results-list");
            }
        } catch (error) {
            console.error('Naver 뉴스 검색 오류:', error);
            displayResults('news-results-list', `검색 중 오류 발생: ${error.message}`, true);
        } finally {
            showLoading('news-loading', false);
            if (searchButton) searchButton.disabled = false;
            if (resultsList && resultsList.innerHTML === '<p>검색 중...</p>' && (!window.lastSearchResults || window.lastSearchResults.length === 0)) {
                 resultsList.innerHTML = '<p>검색 결과가 없거나, API 설정 후 검색어를 입력하고 검색 버튼을 누르세요.</p>';
            }
        }
    }

    async function handleGeminiAnalysis() {
        if (!ApiConfig.isConfigured('gemini')) {
            alert('Gemini API 설정이 필요합니다. API 설정 탭에서 설정해주세요.');
            return;
        }

        const promptInput = document.getElementById('gemini-prompt');
        const prompt = promptInput ? promptInput.value.trim() : '';
        if (!prompt) {
            alert('프롬프트를 입력해주세요.');
            promptInput?.focus();
            return;
        }
        const useStream = document.getElementById('gemini-stream')?.checked || false;
        const resultsContainer = document.getElementById('gemini-results');
        const analysisButton = document.getElementById('run-gemini-analysis');

        showLoading('gemini-loading', true);
        if (resultsContainer) resultsContainer.innerHTML = '';
        if (analysisButton) analysisButton.disabled = true;

        try {
            if (useStream) {
                await GeminiAPI.generateContentStream(
                    prompt,
                    (chunk) => { if (resultsContainer) resultsContainer.innerHTML += sanitizeAndFormatText(chunk); },
                    (fullText) => { /* console.log("Stream complete."); */ },
                    (error) => {
                        console.error('Gemini 스트리밍 오류:', error);
                        displayResults('gemini-results', `스트리밍 중 오류 발생: ${error.message}`, true);
                    }
                );
            } else {
                const response = await GeminiAPI.generateContent(prompt);
                const text = GeminiAPI.extractResponseText(response);
                if (resultsContainer) resultsContainer.innerHTML = sanitizeAndFormatText(text);
            }
        } catch (error) {
            console.error('Gemini 분석 오류:', error);
            displayResults('gemini-results', `분석 중 오류 발생: ${error.message}`, true);
        } finally {
            showLoading('gemini-loading', false);
            if (analysisButton) analysisButton.disabled = false;
        }
    }

    async function handleIntegratedMode() {
        if (!ApiConfig.isConfigured('naver') || !ApiConfig.isConfigured('gemini')) {
            alert('Naver API와 Gemini API 모두 설정되어야 합니다. API 설정 탭에서 확인해주세요.');
            return;
        }

        const queryInput = document.getElementById('integrated-query');
        const userPromptInput = document.getElementById('integrated-prompt');
        const query = queryInput ? queryInput.value.trim() : '';
        const userPrompt = userPromptInput ? userPromptInput.value.trim() : '';

        if (!query) {
            alert('통합 모드: 검색어를 입력해주세요.');
            queryInput?.focus();
            return;
        }
        if (!userPrompt) {
            alert('통합 모드: AI 분석 프롬프트를 입력해주세요.');
            userPromptInput?.focus();
            return;
        }

        const useStream = document.getElementById('integrated-gemini-stream')?.checked || false;
        const newsResultsContainer = document.getElementById('integrated-news-results');
        const analysisResultsContainer = document.getElementById('integrated-analysis-results');
        const integratedButton = document.getElementById('run-integrated-mode');
        const integratedResultsDisplay = document.querySelector('.integrated-results-display');
        const integratedPlaceholder = document.getElementById('integrated-placeholder');

        showLoading('integrated-loading', true);
        if (newsResultsContainer) newsResultsContainer.innerHTML = '';
        if (analysisResultsContainer) analysisResultsContainer.innerHTML = '';
        if (integratedButton) integratedButton.disabled = true;
        if (integratedResultsDisplay) integratedResultsDisplay.style.display = 'none';
        if (integratedPlaceholder) integratedPlaceholder.style.display = 'none';

        let newsSearchSuccess = false;
        try {
            // 1. 네이버 뉴스 검색
            const newsResponse = await NaverAPI.searchNews(query, 'sim', 10);
            if (!newsResponse.items || newsResponse.items.length === 0) {
                if (newsResultsContainer) NaverAPI.renderNewsResults([], newsResultsContainer, true);
                if (analysisResultsContainer) displayResults('integrated-analysis-results', '분석할 뉴스가 없습니다. 네이버 검색 결과가 비어있습니다.', false);
            } else {
                if (newsResultsContainer) NaverAPI.renderNewsResults(newsResponse.items, newsResultsContainer, true);
                newsSearchSuccess = true;
            }

            // 2. Gemini 분석 (뉴스가 검색된 경우에만)
            if (newsSearchSuccess) {
                const geminiPrompt = GeminiAPI.buildPromptWithNews(newsResponse.items, userPrompt);
                if (useStream) {
                    await GeminiAPI.generateContentStream(
                        geminiPrompt,
                        (chunk) => { if (analysisResultsContainer) analysisResultsContainer.innerHTML += sanitizeAndFormatText(chunk); },
                        (fullText) => { /* console.log("Integrated stream complete."); */ },
                        (error) => {
                            console.error('통합 모드 Gemini 스트리밍 오류:', error);
                            displayResults('integrated-analysis-results', `AI 분석 스트리밍 중 오류 발생: ${error.message}`, true);
                        }
                    );
                } else {
                    const analysisResponse = await GeminiAPI.generateContent(geminiPrompt);
                    const analysisText = GeminiAPI.extractResponseText(analysisResponse);
                    if (analysisResultsContainer) analysisResultsContainer.innerHTML = sanitizeAndFormatText(analysisText);
                }
            }
            if (integratedResultsDisplay) integratedResultsDisplay.style.display = 'flex';

        } catch (error) {
            console.error('통합 모드 오류:', error);
            // 에러 메시지 표시
            if (!newsSearchSuccess && newsResultsContainer) { // 뉴스 검색부터 실패한 경우
                 displayResults('integrated-news-results', `뉴스 검색 중 오류: ${error.message}`, true);
            } else if (analysisResultsContainer) { // 뉴스 검색은 성공했으나 AI 분석에서 실패한 경우
                 displayResults('integrated-analysis-results', `AI 분석 중 오류: ${error.message}`, true);
            }
            if (integratedResultsDisplay) integratedResultsDisplay.style.display = 'flex';
        } finally {
            showLoading('integrated-loading', false);
            if (integratedButton) integratedButton.disabled = false;

            const newsHasContent = newsResultsContainer && newsResultsContainer.innerHTML.trim() !== '' && !newsResultsContainer.querySelector('.error-message') && newsResultsContainer.innerText.trim() !== "검색 결과가 없습니다.";
            const analysisHasContent = analysisResultsContainer && analysisResultsContainer.innerHTML.trim() !== '' && !analysisResultsContainer.querySelector('.error-message') && analysisResultsContainer.innerText.trim() !== "분석할 뉴스가 없습니다. 네이버 검색 결과가 비어있습니다.";

            if (!newsHasContent && !analysisHasContent && integratedPlaceholder && integratedResultsDisplay) {
                integratedPlaceholder.style.display = 'block';
                integratedResultsDisplay.style.display = 'none';
            } else if (integratedResultsDisplay) {
                integratedResultsDisplay.style.display = 'flex'; // 하나라도 내용이 있으면 표시
                if (integratedPlaceholder) integratedPlaceholder.style.display = 'none';
            }
        }
    }
});