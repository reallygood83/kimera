import { requestUrl, RequestUrlParam } from 'obsidian';
import { AnalysisResult, Suggestion, AnalysisIssue, AIProviderType } from '../types';

interface AIProviderConfig {
  apiKey: string;
  model?: string;
}

const DEFAULT_MODELS: Record<AIProviderType, string> = {
  anthropic: 'claude-sonnet-4-20250514',
  openai: 'gpt-4.5-turbo',
  gemini: 'gemini-2.5-pro',
  cerebras: 'llama-4-scout-17b'
};

const API_ENDPOINTS: Record<AIProviderType, string> = {
  anthropic: 'https://api.anthropic.com/v1/messages',
  openai: 'https://api.openai.com/v1/chat/completions',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models',
  cerebras: 'https://api.cerebras.ai/v1/chat/completions'
};

export class AIProvider {
  private provider: AIProviderType;
  private apiKey: string;
  private model: string;

  constructor(provider: AIProviderType, config: AIProviderConfig) {
    this.provider = provider;
    this.apiKey = config.apiKey;
    this.model = config.model || DEFAULT_MODELS[provider];
  }

  async analyze(text: string): Promise<AnalysisResult> {
    const prompt = this.buildPrompt(text);
    const response = await this.callAPI(prompt);
    return this.parseResponse(response, text);
  }

  async humanize(text: string): Promise<string> {
    const prompt = `당신은 AI 탐지 우회 전문가입니다. CopyKiller, GPT킬러 같은 AI 탐지기를 통과하도록 텍스트를 수정하세요.

## 원본 텍스트
${text}

## 필수 적용 규칙

### 1. 문장 길이 다양화 (Burstiness 높이기)
- 짧은 문장(5단어 이하) 30% 이상 포함
- 긴 문장과 짧은 문장을 불규칙하게 섞기
- 예: "그랬다." "정말 놀라웠다." 같은 초단문 사용

### 2. 예측 불가능한 표현 (Perplexity 높이기)
- 상투적 표현 완전 제거: "결론적으로", "따라서", "매우 중요한"
- 관용구 대신 구체적 묘사 사용
- 예상치 못한 비유나 표현 추가

### 3. 개인화 요소 추가
- 1인칭 경험 1~2개 자연스럽게 삽입
- 구체적 감정/느낌 표현
- "내 경험상", "솔직히 말하면" 등 구어체

### 4. 구조 패턴 제거
- "첫째, 둘째, 셋째" 나열 금지
- 각 문단 시작을 다르게
- 논리적이되 기계적이지 않게

### 5. 원문 의미 100% 유지
- 핵심 정보 누락 금지
- 톤만 바꾸고 내용은 보존

## 출력
수정된 텍스트만 출력하세요. 설명이나 주석 없이 텍스트만.`;

    const response = await this.callAPI(prompt);
    return this.extractText(response);
  }

  private buildPrompt(text: string): string {
    return `당신은 AI 텍스트 감지 전문가입니다. 다음 텍스트를 분석하세요.

텍스트:
"""
${text.substring(0, 4000)}
"""

JSON 형식으로 응답:
{
  "humanScore": 0-100 (높을수록 인간적),
  "reasoning": "분석 근거",
  "issues": [{"text": "문제 구간", "reason": "이유", "severity": "high|medium|low"}],
  "suggestions": [{"original": "원본", "suggested": "수정안", "reason": "이유"}],
  "overallAdvice": "전체 조언"
}`;
  }

  private async callAPI(prompt: string): Promise<unknown> {
    const requestParams = this.buildRequest(prompt);
    const response = await requestUrl(requestParams);
    
    if (response.status !== 200) {
      throw new Error(`${this.provider} API error: ${response.status}`);
    }
    
    return response.json;
  }

  private buildRequest(prompt: string): RequestUrlParam {
    switch (this.provider) {
      case 'anthropic':
        return {
          url: API_ENDPOINTS.anthropic,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: this.model,
            max_tokens: 2048,
            messages: [{ role: 'user', content: prompt }]
          })
        };

      case 'openai':
        return {
          url: API_ENDPOINTS.openai,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: this.model,
            max_tokens: 2048,
            messages: [{ role: 'user', content: prompt }]
          })
        };

      case 'gemini':
        return {
          url: `${API_ENDPOINTS.gemini}/${this.model}:generateContent?key=${this.apiKey}`,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 2048 }
          })
        };

      case 'cerebras':
        return {
          url: API_ENDPOINTS.cerebras,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: this.model,
            max_tokens: 2048,
            messages: [{ role: 'user', content: prompt }]
          })
        };
    }
  }

  private extractText(response: unknown): string {
    const data = response as Record<string, unknown>;
    switch (this.provider) {
      case 'anthropic': {
        const content = data.content as Array<{text: string}>;
        return content[0].text;
      }
      case 'openai':
      case 'cerebras': {
        const choices = data.choices as Array<{message: {content: string}}>;
        return choices[0].message.content;
      }
      case 'gemini': {
        const candidates = data.candidates as Array<{content: {parts: Array<{text: string}>}}>;
        return candidates[0].content.parts[0].text;
      }
    }
  }

  private parseResponse(response: unknown, originalText: string): AnalysisResult {
    const text = this.extractText(response);
    
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON response');
    }

    const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

    const issues: AnalysisIssue[] = (parsed.issues || []).map((issue: {text: string; reason: string; severity?: string}) => ({
      type: 'ai-pattern' as const,
      severity: (issue.severity || 'medium') as 'high' | 'medium' | 'low',
      text: issue.text,
      position: this.findPosition(originalText, issue.text),
      description: issue.reason
    }));

    const suggestions: Suggestion[] = (parsed.suggestions || []).map((sug: {original: string; suggested: string; reason: string}) => ({
      type: 'rewrite' as const,
      priority: 'high' as const,
      original: sug.original,
      suggested: sug.suggested,
      reason: sug.reason,
      position: this.findPosition(originalText, sug.original)
    }));

    if (parsed.overallAdvice) {
      suggestions.unshift({
        type: 'rewrite',
        priority: 'medium',
        original: '',
        suggested: '',
        reason: `💡 ${parsed.overallAdvice}`
      });
    }

    return {
      humanScore: Math.round(parsed.humanScore) || 50,
      metrics: {
        vocabularyDiversity: 0,
        sentenceVariance: 0,
        aiPatternCount: issues.length,
        personalExpressionScore: 0,
        repetitionRate: 0,
        perplexity: 0,
        burstiness: 0
      },
      issues,
      suggestions,
      source: 'claude-api',
      analyzedAt: Date.now()
    };
  }

  private findPosition(text: string, target: string): { start: number; end: number } {
    const index = text.indexOf(target);
    return index === -1 ? { start: 0, end: 0 } : { start: index, end: index + target.length };
  }
}

export class ClaudeCodeIntegration {
  generateAnalysisPrompt(text: string): string {
    return `# WriteGuard 분석 요청

## 텍스트
\`\`\`
${text}
\`\`\`

## 요청
1. Human Score (0-100) 산출
2. AI 느낌 나는 문장 식별
3. 각 문장의 구체적 수정안 제시
4. 전체 개선 방향

## 응답 형식
### Human Score: [점수]/100
### 문제 구간 및 수정안
1. **원본:** ...
   **수정:** ...
   **이유:** ...
### 전체 조언
...`;
  }

  generateHumanizePrompt(text: string): string {
    return `# AI 탐지 우회 Humanize 요청

CopyKiller, GPT킬러 같은 AI 탐지기를 통과하도록 텍스트를 수정해주세요.

## 원본
\`\`\`
${text}
\`\`\`

## 필수 규칙

### 1. Burstiness 높이기 (문장 길이 다양화)
- 짧은 문장(5단어 이하) **30% 이상** 포함
- "그랬다." "정말이다." 같은 초단문 사용
- 긴 문장과 불규칙하게 섞기

### 2. Perplexity 높이기 (예측 불가능성)
- 상투어 제거: "결론적으로", "따라서", "매우 중요한"
- 관용구 → 구체적 묘사로 교체
- 예상 못한 비유/표현 추가

### 3. 개인화
- 1인칭 경험 1~2개 삽입
- 구체적 감정 표현
- 구어체 사용: "솔직히", "내 생각엔"

### 4. 구조 패턴 제거
- "첫째, 둘째, 셋째" 금지
- 문단 시작을 다양하게

### 5. 의미 보존
- 원문 핵심 정보 100% 유지

## 출력
수정된 텍스트만 출력 (설명 없이)`;
  }
}
