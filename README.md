# 🛡️ Kimera - AI Humanizer & Plagiarism Guard

Obsidian 플러그인으로 AI가 작성한 글을 자연스럽게 수정하고 표절을 예방합니다.

## ✨ 주요 기능

### 🔍 로컬 분석 (무료)
- **N-gram 분석**: 텍스트 반복률 측정
- **TTR (Type-Token Ratio)**: 어휘 다양성 평가
- **AI 패턴 감지**: 상투적 표현, 구조적 패턴 탐지
- **진정성 점수**: 개인 표현, 감정 어휘 분석

### 🤖 AI 정밀 분석 (API 필요)
- **Anthropic**: Claude Sonnet 4, Claude Opus 4
- **OpenAI**: GPT-4.5 Turbo, GPT-4.1, O3-mini
- **Google**: Gemini 2.5 Pro, Gemini 2.5 Flash
- **Cerebras**: Llama 4 Scout (초고속)

### 📋 Claude Code 연동
- API 비용 없이 프롬프트 복사로 분석 가능
- Claude Code 구독자를 위한 무제한 분석

## 📸 스크린샷

```
┌─────────────────────────────────────────┐
│  🎯 Human Score: 72/100                 │
│  [████████████░░░░░░░░] +13% 필요       │
│                                         │
│  🔴 수정 필요 (3개)                      │
│  • "따라서 결론적으로..." → AI 패턴      │
│  • 문장 길이 일정함 → 다양화 필요        │
│                                         │
│  💡 개선 제안                            │
│  • 개인 경험 추가하기                    │
│  • 감정 표현 넣기                        │
└─────────────────────────────────────────┘
```

## 🚀 설치

### 수동 설치
1. 최신 릴리즈에서 `main.js`, `manifest.json`, `styles.css` 다운로드
2. Obsidian Vault의 `.obsidian/plugins/kimera/` 폴더에 복사
3. Obsidian 재시작 → 설정 → Community Plugins → Kimera 활성화

### 개발자용
```bash
git clone https://github.com/reallygood83/kimera.git
cd kimera
npm install
npm run build
```

## 🎮 사용법

| 명령어 | 설명 |
|--------|------|
| `현재 노트 분석` | 로컬 분석 실행 |
| `AI로 정밀 분석` | API를 사용한 심층 분석 |
| `선택 영역 Humanize` | 선택한 텍스트를 자연스럽게 수정 |
| `Claude Code용 프롬프트 복사` | 무료 분석을 위한 프롬프트 생성 |
| `인라인 하이라이트 토글` | 문제 구간 표시 ON/OFF |

## ⚙️ 설정

1. **설정 > WriteGuard** 로 이동
2. AI 제공자 선택 (Anthropic, OpenAI, Gemini, Cerebras)
3. API 키 입력
4. 목표 Human Score 설정 (기본: 85)

## 💡 비용 최적화 팁

1. **로컬 분석 먼저** → Human Score 확인
2. **점수가 낮을 때만** AI 분석 사용
3. **Claude Code 사용자** → 프롬프트 복사로 무제한 분석
4. **Cerebras** → 가장 저렴하고 빠름

## 📊 점수 해석

| 점수 | 상태 | 의미 |
|------|------|------|
| 85-100 | 🟢 안전 | 자연스러운 인간 글 |
| 60-84 | 🟡 주의 | 일부 수정 필요 |
| 0-59 | 🔴 위험 | AI 생성 의심, 대폭 수정 필요 |

## 🛠️ 기술 스택

- TypeScript
- Obsidian Plugin API
- CodeMirror 6 (인라인 하이라이트)
- esbuild

## 📄 라이선스

MIT License

## 🙏 기여

이슈와 PR 환영합니다!
