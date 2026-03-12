# Kimera - AI Humanizer & Plagiarism Guard

Obsidian 플러그인으로 AI가 작성한 글을 자연스럽게 수정하고 표절을 예방합니다.

**CopyKiller, GPT킬러** 같은 AI 탐지기를 우회할 수 있도록 텍스트를 분석하고 개선합니다.

## 주요 기능

### 로컬 분석 (무료, 즉시 실행)
| 지표 | 설명 |
|------|------|
| **Perplexity (혼란도)** | 단어 예측 불가능성 측정. 낮으면 AI (너무 매끄러움), 높으면 인간 |
| **Burstiness (폭발성)** | 문장 길이 변화도. 낮으면 AI (균일함), 높으면 인간 (다양함) |
| **TTR (어휘 다양성)** | 다양한 단어 사용 비율 |
| **AI 패턴 감지** | 상투적 표현, "첫째/둘째" 나열, 과잉 수식어 탐지 |
| **개인화 점수** | 개인 경험, 감정 표현, 구체적 날짜/숫자 포함 여부 |

### AI 정밀 분석 (API 필요)
- **Anthropic**: Claude Sonnet 4, Claude Opus 4
- **OpenAI**: GPT-4.5 Turbo, GPT-4.1, O3-mini
- **Google**: Gemini 2.5 Pro, Gemini 2.5 Flash
- **Cerebras**: Llama 4 Scout (초고속)

### Claude Code 연동
- API 비용 없이 프롬프트 복사로 분석 가능
- Claude Code 구독자를 위한 무제한 분석

---

## 명령어 가이드

`Cmd/Ctrl + P`로 명령어 팔레트를 열고 "Kimera"를 검색하세요.

### 1. 분석 모달 열기 (Before/After)

**가장 핵심적인 기능입니다.**

모달 창에서 현재 노트의 Human Score와 세부 지표를 확인합니다.

**포함 기능:**
- 현재 점수 및 상태 (안전/주의/위험)
- 7가지 세부 지표 한눈에 확인
- 발견된 AI 패턴 목록
- 원클릭 Humanize → Before/After 비교
- AI 정밀 분석
- Claude Code 프롬프트 복사

### 2. 현재 노트 분석

현재 열린 노트를 **로컬에서 즉시 분석**합니다.
- API 호출 없음 (무료)
- 실시간 피드백
- 사이드 패널에 결과 표시

**자동 분석 설정 시 타이핑하면서 실시간으로 점수가 업데이트됩니다.**

### 3. AI로 정밀 분석

설정한 AI 제공자(Anthropic/OpenAI/Gemini/Cerebras)를 사용해 **심층 분석**합니다.
- 문맥을 이해한 정밀 분석
- 구체적인 수정 제안 제공
- API 키 필요

**사용 시기:** 로컬 분석 점수가 낮을 때, 더 정확한 피드백이 필요할 때

### 4. 선택 영역 Humanize

에디터에서 **선택한 텍스트만** AI가 자연스럽게 수정합니다.

**Humanize 규칙:**
1. 문장 길이 다양화 (짧은 문장 30% 이상)
2. 상투적 표현 제거
3. 개인 경험/감정 추가
4. 구조 패턴 제거 ("첫째, 둘째" 등)
5. 원문 의미 100% 유지

**API 없는 경우:** 프롬프트가 클립보드에 복사되어 Claude Code에서 사용 가능

### 5. Claude Code용 프롬프트 복사

현재 노트 전체에 대한 **분석 프롬프트**를 클립보드에 복사합니다.

**Claude Code 사용자를 위한 무료 대안:**
1. 이 명령어로 프롬프트 복사
2. Claude Code에 붙여넣기
3. 무료로 정밀 분석 결과 받기

### 6. 분석 패널 토글

오른쪽 **사이드 패널**을 표시하거나 숨깁니다.

**사이드 패널 내용:**
- Human Score 게이지
- 목표 점수까지 필요한 점수
- 수정 필요 항목 목록
- 개선 제안
- 세부 지표

### 7. 인라인 하이라이트 토글

에디터 내에서 **문제 구간을 직접 표시**합니다.

| 색상 | 의미 |
|------|------|
| 빨간색 물결선 | 심각한 AI 패턴 |
| 주황색 물결선 | 중간 수준 문제 |
| 노란색 점선 | 경미한 문제 |

**끄면:** 깔끔한 에디터 화면 유지

---

## 설치

### 수동 설치
1. [최신 릴리즈](https://github.com/reallygood83/kimera/releases)에서 다운로드:
   - `main.js`
   - `manifest.json`
   - `styles.css`
2. Obsidian Vault의 `.obsidian/plugins/kimera/` 폴더 생성
3. 다운로드한 파일 복사
4. Obsidian 재시작
5. 설정 → Community Plugins → Kimera 활성화

### 개발자용
```bash
git clone https://github.com/reallygood83/kimera.git
cd kimera
npm install
npm run build
```

---

## 설정

**설정 → Community Plugins → Kimera (톱니바퀴 아이콘)**

| 설정 | 설명 | 기본값 |
|------|------|--------|
| AI 제공자 | 분석에 사용할 AI 서비스 | Anthropic |
| API Key | 선택한 제공자의 API 키 | - |
| 모델 | 사용할 AI 모델 | 제공자별 기본값 |
| 자동 분석 | 타이핑 중 실시간 분석 | ON |
| 분석 지연 | 타이핑 후 분석까지 대기 시간 | 1500ms |
| 목표 Human Score | 이 점수 이상이면 안전 | 85 |
| 인라인 하이라이트 | 에디터 내 문제 구간 표시 | ON |
| 언어 | 분석 대상 언어 | 한국어 |

---

## 점수 해석

| 점수 | 상태 | 의미 |
|------|------|------|
| 85-100 | 안전 | 자연스러운 인간 글 |
| 70-84 | 양호 | 약간의 수정으로 개선 가능 |
| 50-69 | 주의 | AI 의심 구간 존재, 수정 필요 |
| 0-49 | 위험 | AI 생성 의심, 대폭 수정 필요 |

---

## 비용 최적화 팁

1. **로컬 분석 먼저** → Human Score 확인
2. **점수가 낮을 때만** AI 분석 사용
3. **Claude Code 사용자** → 프롬프트 복사로 무제한 분석
4. **Cerebras** → 가장 저렴하고 빠름

---

## 기술 스택

- TypeScript
- Obsidian Plugin API
- CodeMirror 6 (인라인 하이라이트)
- esbuild

## 라이선스

MIT License

## 기여

이슈와 PR 환영합니다!

---

**GitHub:** https://github.com/reallygood83/kimera
