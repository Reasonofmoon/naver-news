/**
 * Gemini API 관련 함수
 */

const GeminiAPI = {
    /**
     * Gemini API 테스트 - 연결 테스트를 위한 간단한 프롬프트 실행
     */
    async testConnection() {
        const apiKey = ApiConfig.getGeminiApiKey();
        const model = ApiConfig.getGeminiModel();

        if (!apiKey) {
            ApiConfig.setGeminiConnectionStatus(false, 'API 키가 설정되지 않았습니다.');
            return false;
        }

        try {
            const response = await this.generateContent(
                '간단한 연결 테스트입니다. "Gemini API 연결 성공"이라고 응답해주세요.',
                false
            );

            if (response && response.candidates && response.candidates.length > 0) {
                ApiConfig.setGeminiConnectionStatus(true);
                return true;
            } else {
                throw new Error('응답 형식이 올바르지 않습니다.');
            }
        } catch (error) {
            ApiConfig.setGeminiConnectionStatus(false, error.message);
            return false;
        }
    },

    /**
     * Gemini API를 이용한 콘텐츠 생성
     * @param {string} prompt - 프롬프트 텍스트
     * @param {boolean} stream - 스트리밍 응답 여부
     * @returns {Promise<Object>} - API 응답
     */
    async generateContent(prompt, stream = false) {
        const apiKey = ApiConfig.getGeminiApiKey();
        const model = ApiConfig.getGeminiModel();

        if (!apiKey) {
            throw new Error('Gemini API 키가 설정되지 않았습니다.');
        }

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const requestBody = {
            contents: [
                {
                    parts: [
                        {
                            text: prompt
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        };

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API 오류: ${errorData.error.message || response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Gemini API 오류:', error);
            throw error;
        }
    },

    /**
     * 스트리밍 방식으로 Gemini API 응답 생성
     * @param {string} prompt - 프롬프트 텍스트
     * @param {function} onChunk - 청크 데이터 수신 시 호출될 콜백
     * @param {function} onComplete - 완료 시 호출될 콜백
     * @param {function} onError - 오류 발생 시 호출될 콜백
     */
    async generateContentStream(prompt, onChunk, onComplete, onError) {
        const apiKey = ApiConfig.getGeminiApiKey();
        const model = ApiConfig.getGeminiModel();

        if (!apiKey) {
            onError(new Error('Gemini API 키가 설정되지 않았습니다.'));
            return;
        }

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`;

        const requestBody = {
            contents: [
                {
                    parts: [
                        {
                            text: prompt
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        };

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API 오류: ${errorData.error.message || response.statusText}`);
            }

            const reader = response.body.getReader();
            let fullText = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    onComplete(fullText);
                    break;
                }

                // 바이너리 데이터를 텍스트로 변환
                const chunk = new TextDecoder().decode(value);

                // NDJSON 형식 파싱
                const chunkLines = chunk.split('\n').filter(line => line.trim());

                for (const line of chunkLines) {
                    try {
                        const data = JSON.parse(line);

                        if (data.candidates && data.candidates.length > 0 &&
                            data.candidates[0].content &&
                            data.candidates[0].content.parts &&
                            data.candidates[0].content.parts.length > 0) {

                            const text = data.candidates[0].content.parts[0].text || '';
                            fullText += text;
                            onChunk(text);
                        }
                    } catch (e) {
                        console.error('스트리밍 파싱 오류:', e, line);
                    }
                }
            }
        } catch (error) {
            console.error('Gemini 스트리밍 API 오류:', error);
            onError(error);
        }
    },

    /**
     * Gemini API 응답 텍스트 추출
     * @param {Object} response - API 응답 객체
     * @returns {string} - 추출된 텍스트
     */
    extractResponseText(response) {
        if (!response || !response.candidates || response.candidates.length === 0) {
            return '응답을 생성할 수 없습니다.';
        }

        const candidate = response.candidates[0];

        if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
            return '응답 내용이 비어 있습니다.';
        }

        return candidate.content.parts[0].text || '텍스트 내용이 없습니다.';
    },

    /**
     * 프롬프트에 뉴스 정보 결합
     * @param {Array} newsItems - 뉴스 항목 배열
     * @param {string} prompt - 기본 프롬프트
     * @returns {string} - 완성된 프롬프트
     */
    buildPromptWithNews(newsItems, prompt) {
        let newsText = '다음은 검색된 뉴스 목록입니다:\n\n';

        newsItems.forEach((news, index) => {
            newsText += `[뉴스 ${index + 1}]\n`;
            newsText += `제목: ${news.title}\n`;
            newsText += `내용: ${news.description}\n`;
            newsText += `날짜: ${news.pubDate}\n\n`;
        });

        return `${newsText}\n${prompt}`;
    }
};

// DOM이 로드된 후 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', function() {
    // Gemini API 연결 테스트 버튼 이벤트
    document.getElementById('test-gemini-api').addEventListener('click', async function() {
        this.disabled = true;
        this.textContent = '테스트 중...';

        const statusText = document.getElementById('gemini-status-text');
        statusText.textContent = '연결 테스트 중...';

        try {
            const result = await GeminiAPI.testConnection();

            if (result) {
                alert('Gemini API 연결 테스트 성공!');
            } else {
                alert(`Gemini API 연결 테스트 실패: ${ApiConfig.apiStatus.gemini.error}`);
            }
        } catch (error) {
            ApiConfig.setGeminiConnectionStatus(false, error.message);
            alert(`Gemini API 연결 테스트 오류: ${error.message}`);
        }

        this.disabled = false;
        this.textContent = '연결 테스트';
    });

    // Gemini 분석 실행 버튼 이벤트
    document.getElementById('run-gemini-analysis').addEventListener('click', async function() {
        const prompt = document.getElementById('gemini-prompt').value.trim();
        const resultContainer = document.getElementById('gemini-results');
        const loadingIndicator = document.getElementById('gemini-loading');
        const useStream = document.getElementById('gemini-stream').checked;

        if (!prompt) {
            alert('프롬프트를 입력해주세요.');
            return;
        }

        if (!ApiConfig.isConfigured('gemini')) {
            alert('Gemini API 설정이 필요합니다. API 설정 탭에서 설정해주세요.');
            return;
        }

        resultContainer.innerHTML = '';
        loadingIndicator.style.display = 'flex';
        this.disabled = true;

        try {
            if (useStream) {
                // 스트리밍 응답 처리
                GeminiAPI.generateContentStream(
                    prompt,
                    (chunk) => {
                        // 줄바꿈 처리
                        const formattedChunk = chunk.replace(/\n/g, '<br>');
                        resultContainer.innerHTML += formattedChunk;
                    },
                    (fullText) => {
                        loadingIndicator.style.display = 'none';
                        this.disabled = false;
                    },
                    (error) => {
                        loadingIndicator.style.display = 'none';
                        resultContainer.innerHTML = `<p class="error-message">오류 발생: ${error.message}</p>`;
                        this.disabled = false;
                    }
                );
            } else {
                // 일반 응답 처리
                const response = await GeminiAPI.generateContent(prompt);
                const text = GeminiAPI.extractResponseText(response);

                // 줄바꿈 처리
                const formattedText = text.replace(/\n/g, '<br>');
                resultContainer.innerHTML = formattedText;

                loadingIndicator.style.display = 'none';
                this.disabled = false;
            }
        } catch (error) {
            loadingIndicator.style.display = 'none';
            resultContainer.innerHTML = `<p class="error-message">오류 발생: ${error.message}</p>`;
            this.disabled = false;
        }
    });
});