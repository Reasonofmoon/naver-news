/**
 * API 설정 및 키 관리를 위한 유틸리티 함수
 */

const ApiConfig = {
    // 스토리지 키
    storageKeys: {
        geminiApiKey: 'gemini_api_key',
        geminiModel: 'gemini_model',
        naverClientId: 'naver_client_id',
        naverClientSecret: 'naver_client_secret'
    },

    // API 상태
    apiStatus: {
        gemini: {
            configured: false,
            connected: false,
            error: null
        },
        naver: {
            configured: false,
            connected: false,
            error: null
        }
    },

    /**
     * 초기화 함수 - 저장된 API 키가 있으면 로드하고 상태 업데이트
     */
    init() {
        // Gemini API 설정 불러오기
        const geminiApiKey = localStorage.getItem(this.storageKeys.geminiApiKey);
        const geminiModel = localStorage.getItem(this.storageKeys.geminiModel);
        
        if (geminiApiKey) {
            document.getElementById('gemini-api-key').value = geminiApiKey;
            this.apiStatus.gemini.configured = true;
            
            if (geminiModel) {
                document.getElementById('gemini-model').value = geminiModel;
            }
            
            this.updateApiStatus('gemini');
            document.getElementById('test-gemini-api').disabled = false;
        }

        // Naver API 설정 불러오기
        const naverClientId = localStorage.getItem(this.storageKeys.naverClientId);
        const naverClientSecret = localStorage.getItem(this.storageKeys.naverClientSecret);
        
        if (naverClientId && naverClientSecret) {
            document.getElementById('naver-client-id').value = naverClientId;
            document.getElementById('naver-client-secret').value = naverClientSecret;
            this.apiStatus.naver.configured = true;
            
            this.updateApiStatus('naver');
            document.getElementById('test-naver-api').disabled = false;
        }
    },

    /**
     * Gemini API 설정 저장
     */
    saveGeminiSettings() {
        const apiKey = document.getElementById('gemini-api-key').value.trim();
        const model = document.getElementById('gemini-model').value;
        
        if (!apiKey) {
            alert('Gemini API 키를 입력해주세요.');
            return;
        }
        
        // 로컬 스토리지에 저장
        localStorage.setItem(this.storageKeys.geminiApiKey, apiKey);
        localStorage.setItem(this.storageKeys.geminiModel, model);
        
        // 상태 업데이트
        this.apiStatus.gemini.configured = true;
        this.apiStatus.gemini.error = null;
        this.updateApiStatus('gemini');
        
        // 테스트 버튼 활성화
        document.getElementById('test-gemini-api').disabled = false;
        
        alert('Gemini API 설정이 저장되었습니다.');
    },

    /**
     * Naver API 설정 저장
     */
    saveNaverSettings() {
        const clientId = document.getElementById('naver-client-id').value.trim();
        const clientSecret = document.getElementById('naver-client-secret').value.trim();
        
        if (!clientId || !clientSecret) {
            alert('Naver Client ID와 Client Secret을 모두 입력해주세요.');
            return;
        }
        
        // 로컬 스토리지에 저장
        localStorage.setItem(this.storageKeys.naverClientId, clientId);
        localStorage.setItem(this.storageKeys.naverClientSecret, clientSecret);
        
        // 상태 업데이트
        this.apiStatus.naver.configured = true;
        this.apiStatus.naver.error = null;
        this.updateApiStatus('naver');
        
        // 테스트 버튼 활성화
        document.getElementById('test-naver-api').disabled = false;
        
        alert('Naver API 설정이 저장되었습니다.');
    },

    /**
     * API 상태 표시 업데이트
     */
    updateApiStatus(api) {
        const statusIndicator = document.getElementById(`${api}-status-indicator`);
        const statusText = document.getElementById(`${api}-status-text`);
        
        if (this.apiStatus[api].error) {
            statusIndicator.classList.remove('connected');
            statusIndicator.classList.add('error');
            statusText.textContent = `오류: ${this.apiStatus[api].error}`;
            return;
        }
        
        if (this.apiStatus[api].connected) {
            statusIndicator.classList.add('connected');
            statusIndicator.classList.remove('error');
            statusText.textContent = '연결됨';
            return;
        }
        
        if (this.apiStatus[api].configured) {
            statusIndicator.classList.remove('connected', 'error');
            statusText.textContent = '설정됨 (연결 테스트 필요)';
            return;
        }
        
        statusIndicator.classList.remove('connected', 'error');
        statusText.textContent = '설정되지 않음';
    },

    /**
     * Gemini API 키 가져오기
     */
    getGeminiApiKey() {
        return localStorage.getItem(this.storageKeys.geminiApiKey);
    },

    /**
     * Gemini 모델 가져오기
     */
    getGeminiModel() {
        return localStorage.getItem(this.storageKeys.geminiModel) || 'gemini-2.0-flash';
    },

    /**
     * Naver API 인증 정보 가져오기
     */
    getNaverCredentials() {
        return {
            clientId: localStorage.getItem(this.storageKeys.naverClientId),
            clientSecret: localStorage.getItem(this.storageKeys.naverClientSecret)
        };
    },

    /**
     * Gemini API 연결 상태 설정
     */
    setGeminiConnectionStatus(connected, error = null) {
        this.apiStatus.gemini.connected = connected;
        this.apiStatus.gemini.error = error;
        this.updateApiStatus('gemini');
    },

    /**
     * Naver API 연결 상태 설정
     */
    setNaverConnectionStatus(connected, error = null) {
        this.apiStatus.naver.connected = connected;
        this.apiStatus.naver.error = error;
        this.updateApiStatus('naver');
    },

    /**
     * API가 구성되어 있는지 확인
     */
    isConfigured(api) {
        return this.apiStatus[api].configured;
    },

    /**
     * API가 연결되어 있는지 확인
     */
    isConnected(api) {
        return this.apiStatus[api].connected;
    }
};

// 비밀번호 토글 기능
function setupPasswordToggles() {
    const toggleGeminiKey = document.getElementById('toggle-gemini-key');
    const geminiApiKey = document.getElementById('gemini-api-key');
    
    toggleGeminiKey.addEventListener('click', function() {
        const type = geminiApiKey.getAttribute('type') === 'password' ? 'text' : 'password';
        geminiApiKey.setAttribute('type', type);
        
        const icon = this.querySelector('i');
        if (type === 'text') {
            icon.textContent = 'visibility';
        } else {
            icon.textContent = 'visibility_off';
        }
    });
    
    const toggleNaverSecret = document.getElementById('toggle-naver-secret');
    const naverClientSecret = document.getElementById('naver-client-secret');
    
    toggleNaverSecret.addEventListener('click', function() {
        const type = naverClientSecret.getAttribute('type') === 'password' ? 'text' : 'password';
        naverClientSecret.setAttribute('type', type);
        
        const icon = this.querySelector('i');
        if (type === 'text') {
            icon.textContent = 'visibility';
        } else {
            icon.textContent = 'visibility_off';
        }
    });
}

// DOM이 로드된 후 초기화
document.addEventListener('DOMContentLoaded', function() {
    ApiConfig.init();
    setupPasswordToggles();
    
    // Gemini 설정 저장 버튼 이벤트
    document.getElementById('save-gemini-settings').addEventListener('click', function() {
        ApiConfig.saveGeminiSettings();
    });
    
    // Naver 설정 저장 버튼 이벤트
    document.getElementById('save-naver-settings').addEventListener('click', function() {
        ApiConfig.saveNaverSettings();
    });
}); 