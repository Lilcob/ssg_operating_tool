# Vercel 배포 준비 폴더

기존 `운영대시보드` 앱을 Vercel에 Import 할 수 있도록 필요한 코드와 공개 가능한 가상 교육 자료만 이 폴더에 모았습니다. 별도 앱을 새로 만들지 않았습니다.

## 구조와 설정

- 앱 폴더: `src/` 브라우저 UI, `api/weather.js` Vercel Node 서버 함수, `server/weather.mjs` 날씨 처리, `public-data/` 공개 가능한 가상 입력 7개
- 빌드: `npm run build`가 `src/`를 `dist/`로 묶습니다. 자료는 `public-data/`의 명시적 허용 목록만 `dist/data/`로 복사합니다.
- Vercel: Root Directory는 이 폴더(`운영대시보드/vercel-ready`)로 설정하고 Framework Preset은 Other, Build Command는 `npm run build`, Output Directory는 `dist`로 사용합니다. `vercel.json`에서 날씨 함수의 예제 JSON 포함 파일과 실행 제한을 지정합니다.
- 환경변수: 프로젝트 설정의 Environment Variables에서 `OPENWEATHER_API_KEY`를 추가하고 사용할 환경(Production/Preview/Development)을 선택합니다. 값은 `.env.example`에 적지 않습니다.

## 직접 배포 순서

1. 이 폴더만 업로드하거나, 연결된 Git 저장소를 Import 합니다. Git Import이면 Root Directory를 `운영대시보드/vercel-ready`로 지정합니다.
2. Import 설정에서 Framework Preset `Other`, Build Command `npm run build`, Output Directory `dist`를 확인합니다. Install Command는 기본 `npm install`을 사용합니다.
3. 프로젝트 Settings → Environment Variables에서 이름 `OPENWEATHER_API_KEY`와 발급받은 실제 값을 Secret으로 추가합니다. 필요한 배포 환경을 선택하고 저장합니다.
4. Deploy를 누릅니다. 배포 후 대시보드에서 예제 모드와 실시간 모드를 확인합니다. 계정 권한, 요금제, 배포 대상을 정하는 선택은 사용자가 Vercel 화면에서 직접 확인합니다.

## 포함·제외 및 키 확인

포함한 공개 파일은 기존 대시보드 코드와 7개 교육용 가상 입력입니다. 업무 원본 폴더, 검사 결과, 로컬 `.env.local`, 의존성, 기존 빌드 산출물 및 `sites/` 관리 checkout은 이 준비 폴더에 없습니다. `.gitignore`는 모든 `.env*` 파일에서 빈 예시 파일만 제외 예외로 둡니다.

날씨 브라우저 코드는 `/api/weather?mode=sample|live`만 호출합니다. 제공자 요청과 키 조회는 `server/weather.mjs`에서만 수행합니다. 키가 없는 응답과 제공자 실패는 예제 응답으로 대체됩니다.

사전 검사: 배포 폴더 안에서 값 형태의 키(`OPENWEATHER_API_KEY=...`)나 `.env.local`이 없고, 브라우저 번들에서 `OPENWEATHER_API_KEY` 및 OpenWeather 제공자 URL이 검색되지 않는지 검사했습니다. 실제 Vercel 브라우저/네트워크 검증은 배포 후 사용자가 진행해야 합니다.
