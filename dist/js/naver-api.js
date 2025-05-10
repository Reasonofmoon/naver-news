// 파일 경로: dist/js/naver-api.js

const NaverAPI = {
    /**
     * Naver API 연결 상태 확인용 함수 (실제 연결은 searchNews에서 프록시 통해 이루어짐)
     * 이 함수는 이제 사용자가 Naver API 키를 로컬 스토리지에 저장했는지 여부만 확인합니다.
     * 실제 API 호출 성공 여부는 searchNews 결과로 판단합니다.
     */
    async testConnection() {
        const credentials = ApiConfig.getNaverCredentials();

        if (!credentials.clientId || !credentials.clientSecret) {
            ApiConfig.setNaverConnectionStatus(false, 'Naver API 인증 정보(Client ID/Secret)가 앱에 저장되지 않았습니다. API 설정 탭에서 저장해주세요.');
            return false;
        }
        // 클라이언트에서는 실제 Naver API 키를 사용하지 않으므로,
        // 키가 저장되어 있다면 '설정됨 (연결 테스트는 실제 검색 시도)' 상태로 표시합니다.
        // 실제 연결 성공 여부는 searchNews 함수가 프록시를 통해 데이터를 성공적으로 가져왔을 때 업데이트됩니다.
        ApiConfig.setNaverConnectionStatus(false, '설정됨 (실제 연결은 검색 시 확인)'); // connected를 false로, error는 null
        alert('Naver API 설정이 로컬에 저장되어 있습니다. 실제 API 연결은 뉴스 검색 시 서버 프록시를 통해 이루어집니다.');
        return true; // 설정 자체는 유효하다고 간주
    },

    /**
     * Naver 뉴스 검색 API 호출 (Netlify Function 프록시 사용)
     * @param {string} query - 검색어
     * @param {string} sort - 정렬 방식 (sim: 정확도순, date: 날짜순)
     * @param {number} display - 검색 결과 개수
     * @param {string} startDate - 검색 시작일 (YYYY-MM-DD 형식)
     * @param {string} endDate - 검색 종료일 (YYYY-MM-DD 형식)
     * @returns {Promise<Object>} - 실제 검색 결과 또는 에러
     */
    async searchNews(query, sort = 'sim', display = 10, startDate = null, endDate = null) {
        // Netlify Function 엔드포인트 구성
        let apiUrl = `/api/naver-news?query=${encodeURIComponent(query)}&display=${display}&sort=${sort}`;

        if (startDate) {
            // HTML date input은 YYYY-MM-DD 형식이므로, YYYYMMDD로 변환하여 전달
            apiUrl += `&start_date=${startDate.replace(/-/g, '')}`;
        }
        if (endDate) {
            apiUrl += `&end_date=${endDate.replace(/-/g, '')}`;
        }

        console.log(`[NaverAPI] Calling Netlify Function: ${apiUrl}`);

        try {
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json' // 서버리스 함수가 JSON을 반환할 것을 기대
                }
            });

            const responseBodyText = await response.text(); // 응답을 먼저 텍스트로 받음

            if (!response.ok) {
                let errorDetails = `Naver API 프록시 오류 (${response.status})`;
                try {
                    const parsedError = JSON.parse(responseBodyText);
                    errorDetails = parsedError.error || parsedError.errorMessage || responseBodyText;
                } catch (e) {
                    // JSON 파싱 실패 시 원본 텍스트 사용
                    errorDetails = responseBodyText || errorDetails;
                }
                console.error('[NaverAPI] 프록시 호출 오류:', errorDetails);
                ApiConfig.setNaverConnectionStatus(false, errorDetails.substring(0,100)); // 연결 실패 상태 업데이트
                throw new Error(errorDetails);
            }

            // 성공 시 JSON 파싱
            const data = JSON.parse(responseBodyText);
            console.log('[NaverAPI] Received data from Netlify Function:', data);

            // Naver API가 에러 코드를 JSON 본문에 포함하여 200 OK로 응답하는 경우도 처리
            if (data.errorCode && data.errorMessage) {
                const naverApiError = `Naver API Error: ${data.errorMessage} (Code: ${data.errorCode})`;
                console.error('[NaverAPI] Error from Naver (via proxy):', naverApiError);
                ApiConfig.setNaverConnectionStatus(false, naverApiError.substring(0,100));
                throw new Error(naverApiError);
            }
            
            if (data && typeof data.items !== 'undefined') {
                ApiConfig.setNaverConnectionStatus(true); // 성공 시 연결 상태 업데이트
                return data; // 성공적인 데이터 반환
            } else {
                const unexpectedMsg = 'Naver API 프록시로부터 예상치 못한 응답 구조를 받았습니다.';
                console.error('[NaverAPI] Unexpected response structure:', data);
                ApiConfig.setNaverConnectionStatus(false, unexpectedMsg);
                throw new Error(unexpectedMsg);
            }

        } catch (error) {
            // 네트워크 오류 또는 위에서 throw된 에러 처리
            console.error('[NaverAPI] searchNews 중 예외 발생:', error.message);
            // ApiConfig.setNaverConnectionStatus는 이미 위에서 호출되었을 수 있음
            if (!ApiConfig.apiStatus.naver.error) { // 아직 에러 상태가 아니라면 업데이트
                 ApiConfig.setNaverConnectionStatus(false, error.message.substring(0,100));
            }
            throw error; // 에러를 다시 던져서 호출한 곳(main.js)에서 최종 처리하도록 함
        }
    },

    removeHtmlTags(html) {
        if (typeof html !== 'string') return '';
        try {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            return doc.body.textContent || "";
        } catch (e) {
            console.warn("HTML 태그 제거 중 오류:", e);
            return html; // 오류 시 원본 반환
        }
    },

    formatDate(dateString) {
        if (!dateString) return '날짜 정보 없음';
        try {
            // Naver API의 pubDate는 "Thu, 25 Jul 2024 10:27:00 +0900"와 같은 형식이므로, Date 객체로 파싱 가능
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                // 간단한 YYYYMMDD 또는 YYYY-MM-DD 형식 시도
                const match = dateString.match(/(\d{4})[-\/\.]?(\d{2})[-\/\.]?(\d{2})/);
                if (match) return `${match[1]}-${match[2]}-${match[3]}`;
                return dateString;
            }
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (e) {
            console.warn("날짜 포맷 변환 오류:", dateString, e);
            return dateString;
        }
    },

    renderNewsResults(newsItems, container, isIntegratedMode = false) {
        if (!container) {
            console.error("뉴스 결과를 표시할 컨테이너를 찾을 수 없습니다.");
            return;
        }
        container.innerHTML = ''; // 이전 결과 지우기
        if (!newsItems || newsItems.length === 0) {
            container.innerHTML = '<p>검색 결과가 없습니다.</p>';
            return;
        }

        const fragment = document.createDocumentFragment();
        newsItems.forEach((item, index) => {
            const title = this.removeHtmlTags(item.title);
            const description = this.removeHtmlTags(item.description);
            const formattedDate = this.formatDate(item.pubDate);

            const newsItemDiv = document.createElement('div');
            newsItemDiv.className = 'news-item';
            newsItemDiv.dataset.index = index; // for 'Analyze with Gemini' button

            let newsHTML = `
                <h3 class="news-title"><a href="${item.originallink || item.link}" target="_blank" rel="noopener noreferrer">${title}</a></h3>
                <p class="news-date">${formattedDate}</p>
                <p class="news-description">${description}</p>
            `;

            if (!isIntegratedMode) {
                 newsHTML += `
                    <div class="news-actions">
                        <button class="news-action-button copy-link" data-url="${item.link || item.originallink}" title="뉴스 원문 링크 복사">
                            <i class="material-icons">content_copy</i> 링크 복사
                        </button>
                        <button class="news-action-button analyze-with-gemini" data-index="${index}" title="이 뉴스를 Gemini 분석 탭에서 분석하기">
                            <i class="material-icons">psychology</i> Gemini로 분석
                        </button>
                    </div>
                 `;
            }
            newsItemDiv.innerHTML = newsHTML;
            fragment.appendChild(newsItemDiv);
        });

        container.appendChild(fragment);

        // 이벤트 리스너 바인딩 (통합 모드가 아닐 때만)
        if (!isIntegratedMode) {
            container.querySelectorAll('.copy-link').forEach(button => {
                button.addEventListener('click', function() {
                    const url = this.getAttribute('data-url');
                    if (navigator.clipboard && url) {
                        navigator.clipboard.writeText(url)
                            .then(() => alert('링크가 클립보드에 복사되었습니다.'))
                            .catch(err => {
                                console.error('클립보드 복사 실패:', err);
                                alert('클립보드 복사에 실패했습니다. 브라우저 설정을 확인해주세요.');
                            });
                    } else {
                        alert('클립보드 기능을 사용할 수 없거나 URL이 없습니다.');
                    }
                });
            });

            container.querySelectorAll('.analyze-with-gemini').forEach(button => {
                button.addEventListener('click', function() {
                    const index = parseInt(this.getAttribute('data-index'));
                    if (!window.lastSearchResults || index < 0 || index >= window.lastSearchResults.length) {
                        alert('분석할 뉴스 정보를 찾을 수 없습니다.');
                        return;
                    }
                    const newsItem = window.lastSearchResults[index];

                    if (!ApiConfig.isConfigured('gemini')) {
                        alert('Gemini API 설정이 필요합니다. API 설정 탭에서 설정해주세요.');
                        return;
                    }

                    const geminiTabButton = document.querySelector('.tab-button[data-tab="gemini-analysis"]');
                    if (geminiTabButton) geminiTabButton.click();

                    const promptTextarea = document.getElementById('gemini-prompt');
                    if (promptTextarea) {
                        const cleanTitle = NaverAPI.removeHtmlTags(newsItem.title);
                        const cleanDescription = NaverAPI.removeHtmlTags(newsItem.description);
                        promptTextarea.value = `다음 뉴스 기사를 분석해주세요:\n\n제목: ${cleanTitle}\n내용 요약: ${cleanDescription}\n\n기사의 핵심 내용을 상세히 요약하고, 이 뉴스가 가지는 주요 시사점이나 중요한 포인트 3가지를 설명해주세요.`;
                        promptTextarea.focus();
                        // 스크롤을 프롬프트 영역으로 부드럽게 이동
                        promptTextarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                });
            });
        }
    }

    // generateMockResponse 함수는 이제 사용하지 않으므로 주석 처리 또는 삭제합니다.
    /*
    generateMockResponse(query, sort, display, startDate, endDate) {
        // ... (이전 모의 응답 코드) ...
    }
    */
};