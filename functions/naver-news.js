// 파일 경로: netlify/functions/naver-news.js

// Netlify 함수에서 node-fetch를 사용하려면 프로젝트에 해당 패키지가 설치되어 있어야 합니다.
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    // CORS 헤더 설정 (프론트엔드 애플리케이션에서 API 호출 시 필요)
    const headers = {
        'Access-Control-Allow-Origin': '*',  // 프로덕션에서는 특정 도메인으로 제한하세요
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    // OPTIONS 요청 처리 (CORS preflight)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // 환경 변수에서 Naver API 키 가져오기
    const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID_ENV;
    const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET_ENV;

    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: "Naver API credentials not configured in environment variables on Netlify."
            })
        };
    }

    // 쿼리 파라미터가 없는 경우 처리
    const params = event.queryStringParameters || {};
    
    // 클라이언트에서 전달된 쿼리 파라미터 가져오기
    const query = params.query;
    const display = params.display || '10';
    const sort = params.sort || 'sim';
    
    // 여기가 수정된 부분: snake_case로 일관되게 변경
    // 클라이언트에서도 start_date, end_date로 전달해야 함
    const start_date = params.start_date;
    const end_date = params.end_date;

    if (!query) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: "Query parameter is required." })
        };
    }

    let apiUrl = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=${display}&sort=${sort}`;

    if (start_date) {
        apiUrl += `&start_date=${start_date}`;
    }
    if (end_date) {
        apiUrl += `&end_date=${end_date}`;
    }

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'X-Naver-Client-Id': NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
                'Accept': 'application/json'
            }
        });

        const responseBody = await response.text();
        
        if (!response.ok) {
            // API 에러 메시지 파싱 시도
            let errorDetails = responseBody;
            try {
                const parsedError = JSON.parse(responseBody);
                errorDetails = parsedError.errorMessage || responseBody;
            } catch (parseError) {
                // JSON 파싱 실패 시 원본 응답 사용
            }
            console.error(`Naver API Error (${response.status}): ${errorDetails}`);
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({
                    error: `Naver API Error: ${errorDetails}`,
                    naver_response_status: response.status
                })
            };
        }
        
        // 성공적인 응답이면 JSON으로 파싱하여 반환
        const data = JSON.parse(responseBody);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
        };

    } catch (error) {
        console.error('Error fetching from Naver API:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: `Internal Server Error: ${error.message}` })
        };
    }
};