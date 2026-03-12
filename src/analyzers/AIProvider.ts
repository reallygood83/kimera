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
    const prompt = `다음 텍스트를 AI가 작성한 느낌이 들지 않도록 자연스럽게 다시 작성해주세요.
개인적 경험, 감정 표현을 추가하고 문장 길이에 변화를 주세요.

원본:
${text}

수정된 텍스트만 출력하세요.`;

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
        repetitionRate: 0
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
    return `# Humanize 요청

다음 텍스트를 AI가 작성한 느낌이 들지 않게 수정해주세요.

## 원본
\`\`\`
${text}
\`\`\`

## 요구사항
- 상투적 표현 제거
- 개인적 경험/감정 추가
- 문장 길이 다양화
- 원문 의미 유지

수정된 텍스트만 출력하세요.`;
  }
}
