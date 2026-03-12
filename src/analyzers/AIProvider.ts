import { requestUrl, RequestUrlParam } from 'obsidian';
import { AnalysisResult, Suggestion, AnalysisIssue, AIProviderType } from '../types';

interface AIProviderConfig {
  apiKey: string;
  model?: string;
}

const DEFAULT_MODELS: Record<AIProviderType, string> = {
  anthropic: 'claude-sonnet-4-6',
  openai: 'gpt-5.4',
  gemini: 'gemini-2.5-flash',
  cerebras: 'gpt-oss-120b'
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
    return `You are an AI text detection expert. Analyze the following Korean text and respond in Korean.
반드시 한국어로 분석 결과를 작성하세요.

텍스트:
"""
${text.substring(0, 4000)}
"""

응답은 반드시 아래 JSON 형식만 출력하세요. 다른 텍스트나 설명 없이 JSON만 출력:
{"humanScore":0,"reasoning":"","issues":[],"suggestions":[],"overallAdvice":""}

필드 설명:
- humanScore: 0-100 (높을수록 인간적)
- reasoning: 분석 근거 (한국어)
- issues: [{"text":"문제 구간","reason":"이유","severity":"high|medium|low"}]
- suggestions: [{"original":"원본","suggested":"수정안","reason":"이유"}]
- overallAdvice: 전체 조언 (한국어)`;
  }

  private async callAPI(prompt: string): Promise<unknown> {
    const requestParams = this.buildRequest(prompt);
    
    console.log(`[Kimera] ${this.provider} API 호출 시작 - 모델: ${this.model}`);
    
    try {
      const response = await requestUrl(requestParams);
      
      console.log(`[Kimera] ${this.provider} 응답 상태: ${response.status}`);
      
      if (response.status !== 200) {
        let errorMsg = `HTTP ${response.status}`;
        try {
          const errorBody = response.json as Record<string, unknown>;
          errorMsg = this.extractErrorMessage(errorBody);
        } catch {
          errorMsg = response.text || `HTTP ${response.status}`;
        }
        console.error(`[Kimera] API 에러:`, errorMsg);
        throw new Error(`${this.provider} 오류: ${errorMsg}`);
      }
      
      console.log(`[Kimera] ${this.provider} API 성공`);
      return response.json;
    } catch (error) {
      console.error(`[Kimera] API 호출 실패:`, error);
      if (error instanceof Error) {
        if (error.message.includes('오류')) {
          throw error;
        }
        if (error.message.includes('net::') || error.message.includes('CORS')) {
          throw new Error(`${this.provider} 네트워크 오류 - 인터넷 연결 또는 API 엔드포인트 확인`);
        }
        throw new Error(`${this.provider} 연결 실패: ${error.message}`);
      }
      throw new Error(`${this.provider} 알 수 없는 오류`);
    }
  }

  private extractErrorMessage(errorBody: Record<string, unknown>): string {
    if (this.provider === 'anthropic') {
      const err = errorBody.error as Record<string, string> | undefined;
      return err?.message || JSON.stringify(errorBody);
    }
    if (this.provider === 'openai' || this.provider === 'cerebras') {
      const err = errorBody.error as Record<string, string> | undefined;
      return err?.message || JSON.stringify(errorBody);
    }
    if (this.provider === 'gemini') {
      const err = errorBody.error as Record<string, string> | undefined;
      return err?.message || JSON.stringify(errorBody);
    }
    return JSON.stringify(errorBody);
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
            max_completion_tokens: 2048,
            messages: [
              { role: 'system', content: 'You are an AI text analyzer. Always respond with valid JSON only. No markdown, no explanations.' },
              { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' }
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
    
    let jsonStr = '';
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1];
    } else {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
    }
    
    if (!jsonStr) {
      console.error('[Kimera] JSON not found in response:', text.substring(0, 500));
      throw new Error('Failed to parse JSON response');
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error('[Kimera] JSON parse error:', e, 'Raw:', jsonStr.substring(0, 500));
      throw new Error('Failed to parse JSON response');
    }

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
