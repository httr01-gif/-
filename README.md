# 면접 프로필 AI 스튜디오

핸드폰 셀카의 원근 왜곡·조명·배경을 정리해 면접/이력서용 프로필 사진을 만드는 도구.
OpenAI `gpt-image-1` 이미지 편집을 `input_fidelity: high`로 호출해 **얼굴은 보존**하고 주변만 정리합니다.

> ⚠️ 비공식 전용입니다. AI가 픽셀을 다시 생성하므로 **여권·비자·증명사진 등 공식 제출용으로 사용하지 마세요.**
> 공식 규격 사진은 별도의 "증명사진 스튜디오"(클라이언트 전용)를 사용하세요.

## 폴더 구조
```
/
├─ index.html        # 프런트엔드(정적)
├─ api/generate.js   # 서버리스 함수 (OpenAI 호출, 키 보관)
└─ package.json      # type: module
```

## 배포 (Vercel)
1. 이 폴더를 GitHub 저장소에 올리거나 `vercel` CLI로 배포합니다.
2. Vercel 프로젝트 → **Settings → Environment Variables**에 추가:
   - 이름: `OPENAI_API_KEY`
   - 값: 본인의 OpenAI API 키 (`sk-...`)
   - 저장 후 **재배포**.
3. 별도 빌드 설정 없이 동작합니다. `index.html`은 정적으로, `/api/generate`는 서버리스로 자동 서빙됩니다.

키는 서버(`process.env.OPENAI_API_KEY`)에서만 사용되며 브라우저로 노출되지 않습니다.

## 비용·시간 메모
- 화질은 `quality: "medium"`으로 설정(요청당 수십 초). `api/generate.js`에서 `"high"`로 올리면 더 선명하지만 느려집니다.
- Vercel Hobby 플랜은 함수 실행 한도가 60초입니다. `high` + 큰 사이즈에서 타임아웃이 나면 medium으로 낮추거나 Pro 플랜을 쓰세요.
- `input_fidelity: "high"`는 얼굴 보존에 유리하지만 입력 토큰이 추가됩니다.
- 더 빠르고 좋은 결과가 필요하면 `model`을 `gpt-image-1.5`로 바꿀 수 있습니다.

## 로컬 테스트
`vercel dev` 로 실행하면 `/api/generate`까지 함께 구동됩니다. (정적 서버만으로는 API가 동작하지 않습니다.)
