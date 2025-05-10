# Gemini + Naver API 통합 웹 애플리케이션

이 웹 애플리케이션은 Google의 Gemini API와 네이버 검색 API(모의 데이터)를 통합하여, 사용자가 뉴스를 검색하고 해당 내용을 AI로 분석할 수 있게 해주는 정적 웹 애플리케이션입니다. API 키는 브라우저의 로컬 스토리지에 안전하게 저장됩니다.

## 주요 기능

*   **API 설정**: Gemini API 키 및 Naver API (Client ID, Client Secret) 설정 및 로컬 저장.
*   **연결 테스트**: 각 API의 연결 상태(Naver는 모의 연결)를 테스트하는 기능.
*   **네이버 뉴스 검색**:
    *   키워드, 정렬 방식(정확도순, 날짜순), 검색 기간, 표시 개수 지정 가능.
    *   검색 결과에서 직접 링크 복사 또는 선택한 뉴스를 Gemini 분석 탭으로 전달 가능.
    *   **주의**: 현재 Naver API는 CORS 제약으로 인해 **모의(Mock) 데이터**를 반환합니다. 실제 데이터를 사용하려면 프록시 서버 설정이 필요합니다.
*   **Gemini AI 분석**:
    *   사용자가 입력한 텍스트나 질문에 대해 Gemini AI가 분석하고 답변 생성.
    *   스트리밍 응답 옵션 제공으로 실시간 결과 확인 가능.
    *   다양한 Gemini 텍스트 모델 선택 가능 (`gemini-1.5-flash-latest`, `gemini-1.5-pro-latest` 등).
*   **통합 모드**:
    *   네이버 뉴스 검색 결과(모의 데이터)를 바탕으로 사용자가 지정한 프롬프트에 따라 Gemini AI가 자동으로 내용을 분석하고 요약.

## 프로젝트 구조
dist/ # Netlify에 배포할 정적 파일들
├── index.html # 메인 HTML 파일
├── css/
│ └── styles.css # 스타일시트
├── js/
│ ├── api-config.js # API 설정 및 로컬 스토리지 관리
│ ├── gemini-api.js # Gemini API 호출 로직
│ ├── naver-api.js # Naver API 호출 로직 (현재 모의 데이터 사용)
│ └── main.js # 전체 UI 및 애플리케이션 이벤트 핸들링
└── README.md # 이 파일


## 사용 방법

### 1. API 키 발급

*   **Gemini API 키**:
    1.  [Google AI Studio](https://makersuite.google.com/app/apikey)에 방문하여 Google 계정으로 로그인합니다.
    2.  "Create API key in new project" 또는 기존 프로젝트에서 API 키를 생성/선택합니다.
    3.  생성된 API 키를 복사합니다.
*   **Naver API 키 (Client ID & Secret)**:
    1.  [Naver Developers](https://developers.naver.com/apps/#/register)에 방문하여 Naver 계정으로 로그인합니다.
    2.  "애플리케이션 등록"을 선택하고 애플리케이션 이름(예: MyNewsAnalyzer)을 입력합니다.
    3.  "사용 API"에서 "검색"을 선택합니다.
    4.  "비로그인 오픈 API 서비스 환경"에서 "WEB 설정"을 선택하고 웹 서비스 URL(예: `http://localhost` 또는 실제 배포될 Netlify URL)을 입력합니다.
    5.  등록 후 생성된 Client ID와 Client Secret을 복사합니다.

### 2. 웹 애플리케이션 실행 및 API 키 설정

*   **로컬 실행**:
    1.  이 프로젝트의 `dist` 폴더를 다운로드합니다.
    2.  `dist/index.html` 파일을 웹 브라우저에서 직접 열거나, 로컬 서버(예: VS Code Live Server 확장, Python `http.server`)를 사용하여 실행합니다.
*   **애플리케이션 접속 후**:
    1.  웹앱 상단의 "API 설정" 섹션으로 이동합니다.
    2.  발급받은 Gemini API 키, Naver Client ID, Naver Client Secret을 각각 해당하는 입력 필드에 붙여넣습니다.
    3.  각각 "저장" 버튼을 클릭합니다. API 키는 브라우저의 로컬 스토리지에 저장됩니다.
    4.  (선택 사항) "연결 테스트" 버튼을 눌러 API 설정이 올바르게 되었는지 확인합니다.

### 3. 기능 사용

*   **뉴스 검색 탭**: 검색어, 날짜 등을 설정하고 "검색" 버튼을 클릭합니다. (모의 데이터 표시)
*   **Gemini 분석 탭**: 분석할 내용이나 질문을 프롬프트 창에 입력하고 "분석 실행" 버튼을 클릭합니다.
*   **통합 모드 탭**: 뉴스 검색어와 분석 프롬프트를 입력하고 "검색 및 분석" 버튼을 클릭합니다.

## Netlify 배포

1.  [Netlify](https://app.netlify.com/)에 로그인합니다.
2.  "Sites" 페이지에서 "Add new site" > "Deploy manually"를 선택합니다.
3.  로컬 PC의 `dist` 폴더 전체를 Netlify의 배포 영역으로 드래그 앤 드롭합니다.
4.  배포가 완료되면 제공되는 Netlify URL로 접속할 수 있습니다.

**Naver API 실제 연동을 위한 Netlify Functions (프록시) 설정 (선택 사항):**

Naver API는 클라이언트 측 직접 호출 시 CORS 오류가 발생하므로, 실제 데이터를 가져오려면 서버 측 프록시가 필요합니다. Netlify Functions를 사용하면 간단히 구현할 수 있습니다.

1.  프로젝트 루트에 `netlify/functions` 폴더를 생성합니다.
2.  `netlify/functions/naver-news.js` (예시) 파일을 만들고, 해당 파일에서 Naver API를 호출하는 Node.js 코드를 작성합니다.
3.  `js/naver-api.js` 파일의 `searchNews` 함수 내 API 호출 URL을 `/api/naver-news` (또는 Netlify Function 경로)로 변경하고, `fetch` 옵션에서 헤더 설정을 제거합니다 (프록시 함수 내에서 처리).
4.  `netlify.toml` 파일을 프로젝트 루트에 추가하여 프록시 설정을 구성합니다.

   ```toml
   [functions]
     directory = "netlify/functions"

   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/:splat"
     status = 200


---

**실행 방법:**

1.  위의 파일들을 `dist` 폴더 및 해당 하위 폴더(`css`, `js`)에 정확히 저장합니다.
2.  `dist/index.html` 파일을 브라우저에서 엽니다.
3.  또는 Netlify에 `dist` 폴더를 배포합니다.

이제 웹앱은 지정된 모델을 렌더링하고, 각 기능이 정상적으로 동작하며, 사용자 안내도 포함된 상태가 됩니다. Naver API는 여전히 모의 데이터를 사용하지만, README에 실제 연동 방법에 대한 안내를 추가했습니다.