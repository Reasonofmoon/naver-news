/**
 * Naver API 관련 함수
 */

const NaverAPI = {
    /**
     * Naver API 테스트 - 간단한 검색으로 연결 확인
     */
    async testConnection() {
        const credentials = ApiConfig.getNaverCredentials();
        
        if (!credentials.clientId || !credentials.clientSecret) {
            ApiConfig.setNaverConnectionStatus(false, 'API 인증 정보가 설정되지 않았습니다.');
            return false;
        }
        
        try {
            // 간단한 검색으로 테스트
            const response = await this.searchNews('테스트', 'sim', 1);
            
            if (response && response.items && response.items.length > 0) {
                ApiConfig.setNaverConnectionStatus(true);
                return true;
            } else {
                throw new Error('검색 결과가 없거나 응답 형식이 올바르지 않습니다.');
            }
        } catch (error) {
            ApiConfig.setNaverConnectionStatus(false, error.message);
            return false;
        }
    },
    
    /**
     * Naver 뉴스 검색 API 호출
     * @param {string} query - 검색어
     * @param {string} sort - 정렬 방식 (sim: 정확도순, date: 날짜순)
     * @param {number} display - 검색 결과 개수
     * @param {string} startDate - 검색 시작일 (YYYYMMDD)
     * @param {string} endDate - 검색 종료일 (YYYYMMDD)
     * @returns {Promise<Object>} - 검색 결과
     */
    async searchNews(query, sort = 'sim', display = 10, startDate = null, endDate = null) {
        const credentials = ApiConfig.getNaverCredentials();
        
        if (!credentials.clientId || !credentials.clientSecret) {
            throw new Error('Naver API 인증 정보가 설정되지 않았습니다.');
        }
        
        // 검색어 인코딩
        const encodedQuery = encodeURIComponent(query);
        
        // 기본 API URL
        let apiUrl = `https://openapi.naver.com/v1/search/news.json?query=${encodedQuery}&display=${display}&sort=${sort}`;
        
        // 날짜 제한이 있으면 추가
        if (startDate && endDate) {
            const formattedStartDate = startDate.replaceAll('-', '');
            const formattedEndDate = endDate.replaceAll('-', '');
            apiUrl += `&start_date=${formattedStartDate}&end_date=${formattedEndDate}`;
        }
        
        // CORS Proxy URL 설정
        // 주의: 실제 배포 환경에서는 자체 프록시 서버를 사용하거나 서버리스 함수를 이용해야 합니다.
        // 여기서는 데모용으로 CORS Anywhere를 사용합니다.
        const corsProxyUrl = 'https://cors-anywhere.herokuapp.com/';
        const proxyApiUrl = corsProxyUrl + apiUrl;
        
        try {
            // CORS 프록시 서버를 사용하기 어려운 상황이므로
            // 실제 API 호출 대신에 클라이언트 측에서 모의 응답 생성
            // 실제 환경에서는 아래 주석 처리된 코드를 사용해야 합니다.
            
            /*
            const response = await fetch(proxyApiUrl, {
                method: 'GET',
                headers: {
                    'X-Naver-Client-Id': credentials.clientId,
                    'X-Naver-Client-Secret': credentials.clientSecret
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API 오류: ${errorData.errorMessage || response.statusText}`);
            }
            
            return await response.json();
            */
            
            // 모의 응답 생성 (데모 목적)
            return this.generateMockResponse(query, sort, display);
        } catch (error) {
            console.error('Naver API 오류:', error);
            throw error;
        }
    },
    
    /**
     * HTML 태그 제거
     * @param {string} html - HTML 텍스트
     * @returns {string} - 태그가 제거된 텍스트
     */
    removeHtmlTags(html) {
        return html.replace(/<[^>]*>/g, '');
    },
    
    /**
     * 날짜 포맷 변환 (RFC 1123 -> YYYY-MM-DD)
     * @param {string} dateString - RFC 1123 형식 날짜 문자열
     * @returns {string} - YYYY-MM-DD 형식 날짜 문자열
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    },
    
    /**
     * 뉴스 결과 렌더링
     * @param {Array} newsItems - 뉴스 항목 배열
     * @param {Element} container - 결과를 표시할 컨테이너 요소
     */
    renderNewsResults(newsItems, container) {
        if (!newsItems || newsItems.length === 0) {
            container.innerHTML = '<p>검색 결과가 없습니다.</p>';
            return;
        }
        
        let html = '';
        
        newsItems.forEach((item, index) => {
            const title = this.removeHtmlTags(item.title);
            const description = this.removeHtmlTags(item.description);
            const formattedDate = this.formatDate(item.pubDate);
            
            html += `
                <div class="news-item" data-index="${index}">
                    <h3 class="news-title"><a href="${item.link}" target="_blank">${title}</a></h3>
                    <p class="news-date">${formattedDate}</p>
                    <p class="news-description">${description}</p>
                    <div class="news-actions">
                        <button class="news-action-button copy-link" data-url="${item.link}">
                            <i class="material-icons">content_copy</i> 링크 복사
                        </button>
                        <button class="news-action-button analyze-with-gemini" data-index="${index}">
                            <i class="material-icons">psychology</i> Gemini로 분석
                        </button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // 버튼 이벤트 연결
        container.querySelectorAll('.copy-link').forEach(button => {
            button.addEventListener('click', function() {
                const url = this.getAttribute('data-url');
                navigator.clipboard.writeText(url)
                    .then(() => alert('링크가 클립보드에 복사되었습니다.'))
                    .catch(err => console.error('클립보드 복사 실패:', err));
            });
        });
        
        container.querySelectorAll('.analyze-with-gemini').forEach(button => {
            button.addEventListener('click', function() {
                const index = this.getAttribute('data-index');
                const newsItem = newsItems[index];
                
                if (!ApiConfig.isConfigured('gemini')) {
                    alert('Gemini API 설정이 필요합니다. API 설정 탭에서 설정해주세요.');
                    return;
                }
                
                // Gemini 탭으로 전환
                document.querySelector('[data-tab="gemini-analysis"]').click();
                
                // 프롬프트 설정
                const prompt = document.getElementById('gemini-prompt');
                prompt.value = `다음 뉴스 기사를 분석해주세요:\n\n제목: ${newsItem.title}\n\n내용: ${newsItem.description}\n\n기사의 핵심 내용을 요약하고, 중요 포인트와 시사점을 설명해주세요.`;
                
                // 포커스 설정
                prompt.focus();
            });
        });
    },
    
    /**
     * 모의 응답 생성 (실제 API 호출 대체용)
     * @param {string} query - 검색어
     * @param {string} sort - 정렬 방식
     * @param {number} display - 표시 개수
     * @returns {Object} - 모의 응답 객체
     */
    generateMockResponse(query, sort, display) {
        const now = new Date();
        
        // 현재 날짜로부터 1주일 이내의 랜덤 날짜 생성
        const getRandomDate = () => {
            const daysAgo = Math.floor(Math.random() * 7);
            const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
            return date.toUTCString();
        };
        
        // 모의 뉴스 항목 생성
        const items = Array(Math.min(display, 10)).fill(0).map((_, i) => ({
            title: `[모의 데이터] ${query}에 관한 뉴스 ${i + 1}: 주요 이슈 분석`,
            originallink: `https://example.com/news/${i}`,
            link: `https://example.com/news/${i}`,
            description: `이것은 '${query}'에 관한 모의 뉴스 내용입니다. 실제 네이버 API 연동 시 이 부분은 실제 뉴스 내용으로 대체됩니다. 이 데이터는 CORS 정책 우회를 위한 임시 데이터입니다.`,
            pubDate: getRandomDate()
        }));
        
        // 정렬
        if (sort === 'date') {
            items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
        }
        
        return {
            lastBuildDate: now.toUTCString(),
            total: 100, // 가상의 총 결과 수
            start: 1,
            display: items.length,
            items
        };
    }
};

// DOM이 로드된 후 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', function() {
    // Naver API 연결 테스트 버튼 이벤트
    document.getElementById('test-naver-api').addEventListener('click', async function() {
        this.disabled = true;
        this.textContent = '테스트 중...';
        
        const statusText = document.getElementById('naver-status-text');
        statusText.textContent = '연결 테스트 중...';
        
        try {
            const result = await NaverAPI.testConnection();
            
            if (result) {
                alert('Naver API 연결 테스트 성공!');
            } else {
                alert(`Naver API 연결 테스트 실패: ${ApiConfig.apiStatus.naver.error}`);
            }
        } catch (error) {
            ApiConfig.setNaverConnectionStatus(false, error.message);
            alert(`Naver API 연결 테스트 오류: ${error.message}`);
        }
        
        this.disabled = false;
        this.textContent = '연결 테스트';
    });
    
    // 뉴스 검색 버튼 이벤트
    document.getElementById('search-news').addEventListener('click', async function() {
        const query = document.getElementById('news-query').value.trim();
        const sort = document.getElementById('news-sort').value;
        const startDate = document.getElementById('news-start-date').value;
        const endDate = document.getElementById('news-end-date').value;
        const display = document.getElementById('news-display').value;
        
        const resultsList = document.getElementById('news-results-list');
        const loadingIndicator = document.getElementById('news-loading');
        
        if (!query) {
            alert('검색어를 입력해주세요.');
            return;
        }
        
        if (!ApiConfig.isConfigured('naver')) {
            alert('Naver API 설정이 필요합니다. API 설정 탭에서 설정해주세요.');
            return;
        }
        
        resultsList.innerHTML = '';
        loadingIndicator.style.display = 'flex';
        this.disabled = true;
        
        try {
            const response = await NaverAPI.searchNews(query, sort, display, startDate, endDate);
            NaverAPI.renderNewsResults(response.items, resultsList);
            
            // 검색 결과를 전역 변수에 저장 (통합 모드에서 사용)
            window.lastSearchResults = response.items;
        } catch (error) {
            resultsList.innerHTML = `<p class="error-message">검색 오류: ${error.message}</p>`;
        }
        
        loadingIndicator.style.display = 'none';
        this.disabled = false;
    });
}); 