export type AIProviderType = 'anthropic' | 'openai' | 'gemini' | 'cerebras';

export interface AnalysisResult {
  humanScore: number;
  metrics: {
    vocabularyDiversity: number;
    sentenceVariance: number;
    aiPatternCount: number;
    personalExpressionScore: number;
    repetitionRate: number;
    // AI 탐지 핵심 메트릭 (CopyKiller/GPT킬러 기준)
    perplexity: number;      // 혼란도: 낮으면 AI (너무 매끄러움), 높으면 인간
    burstiness: number;      // 폭발성: 문장 길이 변화도, 낮으면 AI (일정함)
  };
  issues: AnalysisIssue[];
  suggestions: Suggestion[];
  source: 'local' | 'claude-api' | 'claude-code';
  analyzedAt: number;
}

export interface AnalysisIssue {
  type: 'ai-pattern' | 'repetition' | 'low-variance' | 'no-personal' | 'cliche';
  severity: 'high' | 'medium' | 'low';
  text: string;
  position: { start: number; end: number };
  description: string;
}

export interface Suggestion {
  type: 'rewrite' | 'add-personal' | 'vary-sentence' | 'remove-cliche';
  priority: 'high' | 'medium' | 'low';
  original: string;
  suggested: string;
  reason: string;
  position?: { start: number; end: number };
}

export interface WriteGuardSettings {
  apiProvider: AIProviderType;
  apiKeys: Record<AIProviderType, string>;
  selectedModel: Record<AIProviderType, string>;
  autoAnalyze: boolean;
  autoAnalyzeDelay: number;
  targetHumanScore: number;
  showInlineHighlights: boolean;
  showSidePanel: boolean;
  language: 'ko' | 'en';
}

export const DEFAULT_SETTINGS: WriteGuardSettings = {
  apiProvider: 'anthropic',
  apiKeys: {
    anthropic: '',
    openai: '',
    gemini: '',
    cerebras: ''
  },
  selectedModel: {
    anthropic: 'claude-sonnet-4-6',
    openai: 'gpt-5-mini',
    gemini: 'gemini-2.5-flash',
    cerebras: 'llama3.1-8b'
  },
  autoAnalyze: true,
  autoAnalyzeDelay: 1500,
  targetHumanScore: 85,
  showInlineHighlights: true,
  showSidePanel: true,
  language: 'ko',
};

export const AVAILABLE_MODELS: Record<AIProviderType, string[]> = {
  anthropic: [
    'claude-opus-4-6',
    'claude-sonnet-4-6',
    'claude-haiku-4-5',
    'claude-opus-4-5',
    'claude-sonnet-4-5',
    'claude-opus-4',
    'claude-sonnet-4'
  ],
  openai: [
    'gpt-5.4',
    'gpt-5.3',
    'gpt-5',
    'gpt-5-mini'
  ],
  gemini: [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-3.1-pro-preview',
    'gemini-3.1-flash-lite-preview',
    'gemini-3-flash-preview'
  ],
  cerebras: [
    'gpt-oss-120b',
    'llama3.1-8b',
    'qwen-3-235b-a22b-instruct-2507',
    'zai-glm-4.7'
  ]
};

export const AI_PATTERNS_KO = {
  clicheStarters: [
    '결론적으로', '따라서', '그러므로', '요약하면', '종합하면',
    '한편으로는', '다른 한편으로는', '이를 통해', '이러한 관점에서'
  ],
  structuralPatterns: [
    /첫째.*둘째.*셋째/s,
    /먼저.*다음으로.*마지막으로/s,
    /\d+\.\s.*\d+\.\s.*\d+\./s,
  ],
  personalIndicators: [
    '나는', '내가', '저는', '제가', '우리', '내 경험', '개인적으로',
    '솔직히', '사실', '느꼈', '생각했', '기억에', '인상적'
  ],
  emotionalWords: [
    '기쁘', '슬프', '화가', '놀랍', '흥미롭', '실망', '만족', '불안',
    '설레', '두렵', '신기', '재미있', '지루', '감동'
  ],
  overusedModifiers: [
    '매우 중요한', '다양한 측면', '핵심적인 역할', '중대한 영향',
    '필수적인 요소', '근본적인', '본질적인'
  ]
};

export const AI_PATTERNS_EN = {
  clicheStarters: [
    'In conclusion', 'Therefore', 'Thus', 'To summarize', 'In summary',
    'On one hand', 'On the other hand', 'Furthermore', 'Moreover'
  ],
  structuralPatterns: [
    /First.*Second.*Third/s,
    /Firstly.*Secondly.*Finally/s,
  ],
  personalIndicators: [
    'I think', 'I believe', 'In my experience', 'Personally',
    'I felt', 'I remember', 'It struck me'
  ],
  emotionalWords: [
    'happy', 'sad', 'angry', 'surprised', 'excited', 'disappointed',
    'anxious', 'thrilled', 'frustrated'
  ],
  overusedModifiers: [
    'very important', 'crucial role', 'significant impact',
    'essential element', 'fundamental', 'comprehensive'
  ]
};
