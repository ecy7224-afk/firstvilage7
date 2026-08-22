# 관심종목 워치보드 (독립 배포용, 구글시트 연동)

claude.ai 아티팩트에서 만든 워치보드를 실제 웹사이트로 배포하고, 데이터는 구글시트에
저장해서 집/회사 어디서든 같은 관심종목을 보고 수정할 수 있게 구성한 프로젝트입니다.
전부 무료 티어로만 구성됩니다 (구글 계정, GitHub, Vercel/GitHub Pages).

## 1단계 — 구글시트 만들기

1. 새 구글시트를 하나 만듭니다 (이름은 자유롭게, 예: "워치보드 데이터").
2. 시트 하단 탭에서 시트 2개를 만듭니다: `Watchlist`, `Settings`
   - `Watchlist` 탭은 비워두면 됩니다 (Apps Script가 헤더까지 자동으로 채워요).
   - `Settings` 탭에 아래처럼 두 행을 직접 입력하세요.

     | A | B |
     |---|---|
     | exchangeRate | 1380 |
     | token | 아무 문자열이나 (비밀번호처럼 직접 정하기, 예: my-secret-123) |

## 2단계 — Apps Script 배포하기

1. 시트 메뉴에서 `확장 프로그램` → `Apps Script` 를 엽니다.
2. 기본 코드를 지우고, 이 zip에 포함된 `apps-script/Code.gs` 내용을 붙여넣습니다.
3. 오른쪽 상단 `배포` → `새 배포` 클릭
4. 유형은 `웹 앱` 선택, "다음 사용자로 실행"은 `나`, "액세스 권한"은 `모든 사용자`로 설정 후 배포
5. 나오는 웹 앱 URL(`https://script.google.com/macros/s/.../exec` 형태)을 복사해둡니다.
   (처음 배포 시 구글이 권한 승인을 요구하는데, 본인 계정이니 승인하면 됩니다.)

## 3단계 — 프론트엔드에 연결하기

`src/storage.js` 파일을 열어 위에서 복사한 URL과, Settings 시트에 적어둔 token 값을 넣습니다.

```js
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/여기에_배포_URL_붙여넣기/exec";
const TOKEN = "여기에_직접_정한_토큰_문자열";
```

이제 이 앱은 저장할 때마다 구글시트에 쓰고, 열 때마다 구글시트에서 읽어옵니다.
집에서 넣은 종목이 회사 브라우저에서도 그대로 보입니다.

주의할 점:
- token은 URL에 그대로 노출되는 방식이라 완벽한 보안은 아니지만, 개인용 도구 수준에서는
  충분합니다. 더 강한 보안이 필요하면 나중에 Google OAuth 로그인으로 바꿀 수 있어요.
- 회사 네트워크가 `script.google.com`을 막아두지 않았는지 한 번 확인해보세요 (막는 회사는 드뭅니다).

## 로컬에서 실행해보기

```bash
npm install
npm run dev
```

## 무료로 배포하기 (GitHub Pages)

1. GitHub에 새 저장소를 만들고 이 폴더 전체를 올립니다.
2. `npm install gh-pages --save-dev` (package.json에 이미 포함되어 있으면 생략)
3. `package.json`의 `"homepage"` 필드에 `https://<깃허브계정>.github.io/<저장소이름>` 을 추가합니다.
4. 아래 명령 실행:

```bash
npm run build
npm run deploy
```

5. 저장소 Settings → Pages 에서 배포된 `gh-pages` 브랜치를 소스로 지정하면 몇 분 뒤 접속 가능한 URL이 생깁니다.

## 무료로 배포하기 (Vercel, 더 간단함)

1. GitHub에 저장소를 올린 뒤 vercel.com에서 GitHub 계정으로 로그인
2. "Add New Project" → 방금 올린 저장소 선택 → Framework는 Vite로 자동 인식
3. Deploy 클릭하면 끝. 이후 GitHub에 push할 때마다 자동으로 재배포됩니다.

## 구글 시트 연동 (여러 기기/회사에서도 같은 데이터 보기)

`src/storage.js`가 이미 구글 시트를 백엔드처럼 쓰도록 구성되어 있습니다. 아래 순서로 5분이면 연결됩니다.

1. **새 구글 시트 생성**: sheets.new 로 빈 시트를 하나 만듭니다. (시트, 탭 이름은 신경 쓰지 않아도 됩니다 — 스크립트가 `Watchlist`, `Settings` 탭을 자동으로 만듭니다.)
2. **Apps Script 열기**: 시트 상단 메뉴에서 `확장 프로그램 → Apps Script` 클릭
3. **코드 붙여넣기**: 기본 생성된 `Code.gs` 내용을 전부 지우고, 이 프로젝트의 `google-apps-script/Code.gs` 내용을 붙여넣습니다.
4. **토큰 설정**: 코드 상단의 `TOKEN = "CHANGE_ME_TOKEN"` 값을 아무도 모를 만한 문자열로 바꿉니다. (이 URL은 사실상 공개되므로, 토큰이 없으면 링크를 아는 누구나 내 관심종목을 읽고 쓸 수 있습니다.)
5. **배포**: 우측 상단 `배포 → 새 배포` → 유형에서 톱니바퀴 클릭 후 `웹 앱` 선택
   - 실행 계정: **나**
   - 액세스 권한: **모든 사용자** (익명 fetch로 접근해야 하므로 필요합니다. 3번 토큰이 사실상의 비밀번호 역할을 합니다.)
   - 배포를 누르면 `https://script.google.com/macros/s/xxxxx/exec` 형태의 URL이 나옵니다. 이걸 복사하세요.
6. **앱에 연결**: `src/storage.js`의 `APPS_SCRIPT_URL`과 `TOKEN`을 3~5번에서 만든 값으로 바꿉니다.
7. `npm run build && npm run deploy` (또는 Vercel 재배포)로 다시 올리면 끝입니다.

이제 회사에서든 집에서든 배포된 사이트 주소로 접속하면 같은 구글 시트를 보게 됩니다.
시트를 직접 열어서 값을 손으로 고쳐도 앱에 그대로 반영돼요 (앱이 새로고침될 때 시트를 다시 읽어옵니다).

**주의할 점**
- Apps Script 웹 앱은 첫 요청 시 몇 초 정도 느릴 수 있어요 (구글 서버가 깨어나는 시간). 무료 한도 내에서는 완전히 정상입니다.
- 하루 실행 횟수에 무료 한도가 있지만(개인 계정 기준 일반적으로 하루 수만 건), 개인 워치보드 용도로는 절대 넘길 일이 없습니다.
- `TOKEN` 값은 코드에 그대로 노출되므로, 정말 민감한 데이터라면 이 방식 대신 Firebase나 Supabase처럼 별도 인증이 있는 서비스를 쓰는 게 더 안전합니다. 개인 관심종목 정도면 이 정도 보안으로 충분합니다.

## 그 외 동기화 대안

- **Firebase Realtime Database (Spark 무료 플랜)**: 무료 티어로 충분히 개인용으로 사용 가능
- **Supabase (무료 티어)**: Postgres 기반, 무료 한도 내에서 개인 프로젝트로 충분

## 시세 자동 갱신을 붙이려면

이 프론트엔드는 가격을 직접 입력하는 구조입니다. 매일 자동으로 최신가를 반영하려면
GitHub Actions로 크론 작업을 만들어 KIS Open API 등에서 가격을 가져와 위의 Google
Sheets나 Firebase에 저장하고, 이 앱이 그 값을 읽어오도록 바꾸면 됩니다. GitHub Actions는
public 저장소 기준 완전 무료입니다.
