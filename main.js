/*
WriteGuard - AI Humanizer & Plagiarism Guard
100% Local Processing, Zero API Cost
*/
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => WriteGuardPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian4 = require("obsidian");

// src/types.ts
var DEFAULT_SETTINGS = {
  apiProvider: "anthropic",
  apiKeys: {
    anthropic: "",
    openai: "",
    gemini: "",
    cerebras: ""
  },
  selectedModel: {
    anthropic: "claude-sonnet-4-20250514",
    openai: "gpt-4.5-turbo",
    gemini: "gemini-2.5-pro",
    cerebras: "llama-4-scout-17b"
  },
  autoAnalyze: true,
  autoAnalyzeDelay: 1500,
  targetHumanScore: 85,
  showInlineHighlights: true,
  showSidePanel: true,
  language: "ko"
};
var AI_PATTERNS_KO = {
  clicheStarters: [
    "\uACB0\uB860\uC801\uC73C\uB85C",
    "\uB530\uB77C\uC11C",
    "\uADF8\uB7EC\uBBC0\uB85C",
    "\uC694\uC57D\uD558\uBA74",
    "\uC885\uD569\uD558\uBA74",
    "\uD55C\uD3B8\uC73C\uB85C\uB294",
    "\uB2E4\uB978 \uD55C\uD3B8\uC73C\uB85C\uB294",
    "\uC774\uB97C \uD1B5\uD574",
    "\uC774\uB7EC\uD55C \uAD00\uC810\uC5D0\uC11C"
  ],
  structuralPatterns: [
    /첫째.*둘째.*셋째/s,
    /먼저.*다음으로.*마지막으로/s,
    /\d+\.\s.*\d+\.\s.*\d+\./s
  ],
  personalIndicators: [
    "\uB098\uB294",
    "\uB0B4\uAC00",
    "\uC800\uB294",
    "\uC81C\uAC00",
    "\uC6B0\uB9AC",
    "\uB0B4 \uACBD\uD5D8",
    "\uAC1C\uC778\uC801\uC73C\uB85C",
    "\uC194\uC9C1\uD788",
    "\uC0AC\uC2E4",
    "\uB290\uAF08",
    "\uC0DD\uAC01\uD588",
    "\uAE30\uC5B5\uC5D0",
    "\uC778\uC0C1\uC801"
  ],
  emotionalWords: [
    "\uAE30\uC058",
    "\uC2AC\uD504",
    "\uD654\uAC00",
    "\uB180\uB78D",
    "\uD765\uBBF8\uB86D",
    "\uC2E4\uB9DD",
    "\uB9CC\uC871",
    "\uBD88\uC548",
    "\uC124\uB808",
    "\uB450\uB835",
    "\uC2E0\uAE30",
    "\uC7AC\uBBF8\uC788",
    "\uC9C0\uB8E8",
    "\uAC10\uB3D9"
  ],
  overusedModifiers: [
    "\uB9E4\uC6B0 \uC911\uC694\uD55C",
    "\uB2E4\uC591\uD55C \uCE21\uBA74",
    "\uD575\uC2EC\uC801\uC778 \uC5ED\uD560",
    "\uC911\uB300\uD55C \uC601\uD5A5",
    "\uD544\uC218\uC801\uC778 \uC694\uC18C",
    "\uADFC\uBCF8\uC801\uC778",
    "\uBCF8\uC9C8\uC801\uC778"
  ]
};
var AI_PATTERNS_EN = {
  clicheStarters: [
    "In conclusion",
    "Therefore",
    "Thus",
    "To summarize",
    "In summary",
    "On one hand",
    "On the other hand",
    "Furthermore",
    "Moreover"
  ],
  structuralPatterns: [
    /First.*Second.*Third/s,
    /Firstly.*Secondly.*Finally/s
  ],
  personalIndicators: [
    "I think",
    "I believe",
    "In my experience",
    "Personally",
    "I felt",
    "I remember",
    "It struck me"
  ],
  emotionalWords: [
    "happy",
    "sad",
    "angry",
    "surprised",
    "excited",
    "disappointed",
    "anxious",
    "thrilled",
    "frustrated"
  ],
  overusedModifiers: [
    "very important",
    "crucial role",
    "significant impact",
    "essential element",
    "fundamental",
    "comprehensive"
  ]
};

// src/analyzers/LocalAnalyzer.ts
var LocalAnalyzer = class {
  constructor(language = "ko") {
    this.language = language;
  }
  /**
   * 텍스트 전체 분석
   */
  analyze(text) {
    const cleanText = this.normalizeText(text);
    if (cleanText.length < 50) {
      return this.createEmptyResult("\uD14D\uC2A4\uD2B8\uAC00 \uB108\uBB34 \uC9E7\uC2B5\uB2C8\uB2E4.");
    }
    const vocabularyDiversity = this.calculateTTR(cleanText);
    const sentenceVariance = this.calculateSentenceVariance(cleanText);
    const { count: aiPatternCount, issues: patternIssues } = this.detectAIPatterns(cleanText);
    const personalExpressionScore = this.calculatePersonalScore(cleanText);
    const repetitionRate = this.calculateRepetitionRate(cleanText);
    const humanScore = this.calculateHumanScore({
      vocabularyDiversity,
      sentenceVariance,
      aiPatternCount,
      personalExpressionScore,
      repetitionRate
    });
    const suggestions = this.generateLocalSuggestions(
      cleanText,
      { vocabularyDiversity, sentenceVariance, aiPatternCount, personalExpressionScore, repetitionRate }
    );
    return {
      humanScore,
      metrics: {
        vocabularyDiversity,
        sentenceVariance,
        aiPatternCount,
        personalExpressionScore,
        repetitionRate
      },
      issues: patternIssues,
      suggestions,
      source: "local",
      analyzedAt: Date.now()
    };
  }
  /**
   * 텍스트 정규화
   */
  normalizeText(text) {
    return text.normalize("NFKD").replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/\s+/g, " ").trim();
  }
  /**
   * Type-Token Ratio (어휘 다양성) 계산
   * 높을수록 다양한 어휘 사용
   */
  calculateTTR(text) {
    const words = this.tokenize(text);
    if (words.length < 10)
      return 0;
    const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
    const adjustedTTR = uniqueWords.size / Math.sqrt(words.length);
    return Math.min(100, Math.round(adjustedTTR * 20));
  }
  /**
   * 문장 길이 분산 계산
   * 분산이 클수록 자연스러운 글 (AI는 일정한 경향)
   */
  calculateSentenceVariance(text) {
    const sentences = this.splitSentences(text);
    if (sentences.length < 3)
      return 50;
    const lengths = sentences.map((s) => this.tokenize(s).length);
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / lengths.length;
    const score = Math.min(100, variance * 2);
    return Math.round(score);
  }
  /**
   * AI 패턴 감지
   */
  detectAIPatterns(text) {
    const patterns = this.language === "ko" ? AI_PATTERNS_KO : AI_PATTERNS_EN;
    const issues = [];
    for (const phrase of patterns.clicheStarters) {
      const index = text.indexOf(phrase);
      if (index !== -1) {
        issues.push({
          type: "cliche",
          severity: "medium",
          text: phrase,
          position: { start: index, end: index + phrase.length },
          description: `"${phrase}"\uB294 AI\uAC00 \uC790\uC8FC \uC0AC\uC6A9\uD558\uB294 \uD45C\uD604\uC785\uB2C8\uB2E4.`
        });
      }
    }
    for (const pattern of patterns.structuralPatterns) {
      const match = text.match(pattern);
      if (match) {
        issues.push({
          type: "ai-pattern",
          severity: "high",
          text: match[0].substring(0, 50) + "...",
          position: { start: text.indexOf(match[0]), end: text.indexOf(match[0]) + match[0].length },
          description: "\uC21C\uCC28\uC801 \uB098\uC5F4 \uD328\uD134\uC774 \uAC10\uC9C0\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uC790\uC5F0\uC2A4\uB7EC\uC6B4 \uD750\uB984\uC73C\uB85C \uC218\uC815\uD558\uC138\uC694."
        });
      }
    }
    for (const modifier of patterns.overusedModifiers) {
      const index = text.indexOf(modifier);
      if (index !== -1) {
        issues.push({
          type: "cliche",
          severity: "low",
          text: modifier,
          position: { start: index, end: index + modifier.length },
          description: `"${modifier}"\uC740 AI\uAC00 \uC790\uC8FC \uC0AC\uC6A9\uD558\uB294 \uC218\uC2DD\uC5B4\uC785\uB2C8\uB2E4.`
        });
      }
    }
    return { count: issues.length, issues };
  }
  /**
   * 개인화 점수 계산
   */
  calculatePersonalScore(text) {
    const patterns = this.language === "ko" ? AI_PATTERNS_KO : AI_PATTERNS_EN;
    let score = 30;
    for (const indicator of patterns.personalIndicators) {
      if (text.includes(indicator)) {
        score += 10;
      }
    }
    for (const emotion of patterns.emotionalWords) {
      if (text.includes(emotion)) {
        score += 8;
      }
    }
    const hasSpecificDate = /\d{4}년|\d+월|\d+일/.test(text);
    const hasSpecificNumber = /약 \d+|대략 \d+|\d+명|\d+개/.test(text);
    if (hasSpecificDate)
      score += 15;
    if (hasSpecificNumber)
      score += 10;
    return Math.min(100, score);
  }
  /**
   * N-gram 반복률 계산
   */
  calculateRepetitionRate(text) {
    const words = this.tokenize(text);
    if (words.length < 10)
      return 0;
    const trigrams = [];
    for (let i = 0; i < words.length - 2; i++) {
      trigrams.push(words.slice(i, i + 3).join(" "));
    }
    const uniqueTrigrams = new Set(trigrams);
    const repetitionRate = 1 - uniqueTrigrams.size / trigrams.length;
    return Math.round(repetitionRate * 100);
  }
  /**
   * 종합 Human Score 계산
   */
  calculateHumanScore(metrics) {
    const weights = {
      vocabularyDiversity: 0.15,
      sentenceVariance: 0.2,
      aiPatternPenalty: 0.25,
      // 패턴당 감점
      personalExpression: 0.25,
      repetition: 0.15
    };
    let score = 50;
    score += (metrics.vocabularyDiversity - 50) * weights.vocabularyDiversity;
    score += (metrics.sentenceVariance - 30) * weights.sentenceVariance;
    score -= metrics.aiPatternCount * 5 * weights.aiPatternPenalty;
    score += (metrics.personalExpressionScore - 50) * weights.personalExpression;
    score -= metrics.repetitionRate * weights.repetition;
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  /**
   * 로컬 기반 개선 제안 생성
   */
  generateLocalSuggestions(text, metrics) {
    const suggestions = [];
    if (metrics.personalExpressionScore < 50) {
      suggestions.push({
        type: "add-personal",
        priority: "high",
        original: "",
        suggested: "",
        reason: '\uAC1C\uC778\uC801\uC778 \uACBD\uD5D8\uC774\uB098 \uC758\uACAC\uC744 \uCD94\uAC00\uD574\uBCF4\uC138\uC694. \uC608: "\uC81C \uACBD\uD5D8\uC73C\uB85C\uB294...", "\uAC1C\uC778\uC801\uC73C\uB85C \uB290\uB07C\uAE30\uC5D0..."'
      });
    }
    if (metrics.sentenceVariance < 30) {
      suggestions.push({
        type: "vary-sentence",
        priority: "high",
        original: "",
        suggested: "",
        reason: "\uBB38\uC7A5 \uAE38\uC774\uAC00 \uB108\uBB34 \uC77C\uC815\uD569\uB2C8\uB2E4. \uC9E7\uC740 \uBB38\uC7A5\uACFC \uAE34 \uBB38\uC7A5\uC744 \uC11E\uC5B4 \uC0AC\uC6A9\uD558\uC138\uC694."
      });
    }
    if (metrics.aiPatternCount > 0) {
      suggestions.push({
        type: "remove-cliche",
        priority: "high",
        original: "",
        suggested: "",
        reason: `${metrics.aiPatternCount}\uAC1C\uC758 AI \uD2B9\uC720 \uD328\uD134\uC774 \uAC10\uC9C0\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uD558\uC774\uB77C\uC774\uD2B8\uB41C \uBD80\uBD84\uC744 \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uC218\uC815\uD558\uC138\uC694.`
      });
    }
    if (metrics.vocabularyDiversity < 40) {
      suggestions.push({
        type: "rewrite",
        priority: "medium",
        original: "",
        suggested: "",
        reason: "\uB3D9\uC77C\uD55C \uB2E8\uC5B4\uAC00 \uBC18\uBCF5\uB429\uB2C8\uB2E4. \uC720\uC758\uC5B4\uB97C \uD65C\uC6A9\uD574 \uB2E4\uC591\uD558\uAC8C \uD45C\uD604\uD574\uBCF4\uC138\uC694."
      });
    }
    return suggestions;
  }
  /**
   * 문장 분리
   */
  splitSentences(text) {
    return text.split(/[.!?。？！]+/).map((s) => s.trim()).filter((s) => s.length > 5);
  }
  /**
   * 단어 토큰화
   */
  tokenize(text) {
    if (this.language === "ko") {
      return text.split(/[\s,.!?;:]+/).filter((w) => w.length > 0);
    } else {
      return text.toLowerCase().split(/[\s,.!?;:]+/).filter((w) => w.length > 2);
    }
  }
  /**
   * 빈 결과 생성
   */
  createEmptyResult(message) {
    return {
      humanScore: 0,
      metrics: {
        vocabularyDiversity: 0,
        sentenceVariance: 0,
        aiPatternCount: 0,
        personalExpressionScore: 0,
        repetitionRate: 0
      },
      issues: [],
      suggestions: [{
        type: "rewrite",
        priority: "low",
        original: "",
        suggested: "",
        reason: message
      }],
      source: "local",
      analyzedAt: Date.now()
    };
  }
};

// src/analyzers/AIProvider.ts
var import_obsidian = require("obsidian");
var DEFAULT_MODELS = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4.5-turbo",
  gemini: "gemini-2.5-pro",
  cerebras: "llama-4-scout-17b"
};
var API_ENDPOINTS = {
  anthropic: "https://api.anthropic.com/v1/messages",
  openai: "https://api.openai.com/v1/chat/completions",
  gemini: "https://generativelanguage.googleapis.com/v1beta/models",
  cerebras: "https://api.cerebras.ai/v1/chat/completions"
};
var AIProvider = class {
  constructor(provider, config) {
    this.provider = provider;
    this.apiKey = config.apiKey;
    this.model = config.model || DEFAULT_MODELS[provider];
  }
  async analyze(text) {
    const prompt = this.buildPrompt(text);
    const response = await this.callAPI(prompt);
    return this.parseResponse(response, text);
  }
  async humanize(text) {
    const prompt = `\uB2E4\uC74C \uD14D\uC2A4\uD2B8\uB97C AI\uAC00 \uC791\uC131\uD55C \uB290\uB08C\uC774 \uB4E4\uC9C0 \uC54A\uB3C4\uB85D \uC790\uC5F0\uC2A4\uB7FD\uAC8C \uB2E4\uC2DC \uC791\uC131\uD574\uC8FC\uC138\uC694.
\uAC1C\uC778\uC801 \uACBD\uD5D8, \uAC10\uC815 \uD45C\uD604\uC744 \uCD94\uAC00\uD558\uACE0 \uBB38\uC7A5 \uAE38\uC774\uC5D0 \uBCC0\uD654\uB97C \uC8FC\uC138\uC694.

\uC6D0\uBCF8:
${text}

\uC218\uC815\uB41C \uD14D\uC2A4\uD2B8\uB9CC \uCD9C\uB825\uD558\uC138\uC694.`;
    const response = await this.callAPI(prompt);
    return this.extractText(response);
  }
  buildPrompt(text) {
    return `\uB2F9\uC2E0\uC740 AI \uD14D\uC2A4\uD2B8 \uAC10\uC9C0 \uC804\uBB38\uAC00\uC785\uB2C8\uB2E4. \uB2E4\uC74C \uD14D\uC2A4\uD2B8\uB97C \uBD84\uC11D\uD558\uC138\uC694.

\uD14D\uC2A4\uD2B8:
"""
${text.substring(0, 4e3)}
"""

JSON \uD615\uC2DD\uC73C\uB85C \uC751\uB2F5:
{
  "humanScore": 0-100 (\uB192\uC744\uC218\uB85D \uC778\uAC04\uC801),
  "reasoning": "\uBD84\uC11D \uADFC\uAC70",
  "issues": [{"text": "\uBB38\uC81C \uAD6C\uAC04", "reason": "\uC774\uC720", "severity": "high|medium|low"}],
  "suggestions": [{"original": "\uC6D0\uBCF8", "suggested": "\uC218\uC815\uC548", "reason": "\uC774\uC720"}],
  "overallAdvice": "\uC804\uCCB4 \uC870\uC5B8"
}`;
  }
  async callAPI(prompt) {
    const requestParams = this.buildRequest(prompt);
    const response = await (0, import_obsidian.requestUrl)(requestParams);
    if (response.status !== 200) {
      throw new Error(`${this.provider} API error: ${response.status}`);
    }
    return response.json;
  }
  buildRequest(prompt) {
    switch (this.provider) {
      case "anthropic":
        return {
          url: API_ENDPOINTS.anthropic,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.apiKey,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: this.model,
            max_tokens: 2048,
            messages: [{ role: "user", content: prompt }]
          })
        };
      case "openai":
        return {
          url: API_ENDPOINTS.openai,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: this.model,
            max_tokens: 2048,
            messages: [{ role: "user", content: prompt }]
          })
        };
      case "gemini":
        return {
          url: `${API_ENDPOINTS.gemini}/${this.model}:generateContent?key=${this.apiKey}`,
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 2048 }
          })
        };
      case "cerebras":
        return {
          url: API_ENDPOINTS.cerebras,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: this.model,
            max_tokens: 2048,
            messages: [{ role: "user", content: prompt }]
          })
        };
    }
  }
  extractText(response) {
    const data = response;
    switch (this.provider) {
      case "anthropic": {
        const content = data.content;
        return content[0].text;
      }
      case "openai":
      case "cerebras": {
        const choices = data.choices;
        return choices[0].message.content;
      }
      case "gemini": {
        const candidates = data.candidates;
        return candidates[0].content.parts[0].text;
      }
    }
  }
  parseResponse(response, originalText) {
    const text = this.extractText(response);
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse JSON response");
    }
    const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    const issues = (parsed.issues || []).map((issue) => ({
      type: "ai-pattern",
      severity: issue.severity || "medium",
      text: issue.text,
      position: this.findPosition(originalText, issue.text),
      description: issue.reason
    }));
    const suggestions = (parsed.suggestions || []).map((sug) => ({
      type: "rewrite",
      priority: "high",
      original: sug.original,
      suggested: sug.suggested,
      reason: sug.reason,
      position: this.findPosition(originalText, sug.original)
    }));
    if (parsed.overallAdvice) {
      suggestions.unshift({
        type: "rewrite",
        priority: "medium",
        original: "",
        suggested: "",
        reason: `\u{1F4A1} ${parsed.overallAdvice}`
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
      source: "claude-api",
      analyzedAt: Date.now()
    };
  }
  findPosition(text, target) {
    const index = text.indexOf(target);
    return index === -1 ? { start: 0, end: 0 } : { start: index, end: index + target.length };
  }
};
var ClaudeCodeIntegration = class {
  generateAnalysisPrompt(text) {
    return `# WriteGuard \uBD84\uC11D \uC694\uCCAD

## \uD14D\uC2A4\uD2B8
\`\`\`
${text}
\`\`\`

## \uC694\uCCAD
1. Human Score (0-100) \uC0B0\uCD9C
2. AI \uB290\uB08C \uB098\uB294 \uBB38\uC7A5 \uC2DD\uBCC4
3. \uAC01 \uBB38\uC7A5\uC758 \uAD6C\uCCB4\uC801 \uC218\uC815\uC548 \uC81C\uC2DC
4. \uC804\uCCB4 \uAC1C\uC120 \uBC29\uD5A5

## \uC751\uB2F5 \uD615\uC2DD
### Human Score: [\uC810\uC218]/100
### \uBB38\uC81C \uAD6C\uAC04 \uBC0F \uC218\uC815\uC548
1. **\uC6D0\uBCF8:** ...
   **\uC218\uC815:** ...
   **\uC774\uC720:** ...
### \uC804\uCCB4 \uC870\uC5B8
...`;
  }
  generateHumanizePrompt(text) {
    return `# Humanize \uC694\uCCAD

\uB2E4\uC74C \uD14D\uC2A4\uD2B8\uB97C AI\uAC00 \uC791\uC131\uD55C \uB290\uB08C\uC774 \uB4E4\uC9C0 \uC54A\uAC8C \uC218\uC815\uD574\uC8FC\uC138\uC694.

## \uC6D0\uBCF8
\`\`\`
${text}
\`\`\`

## \uC694\uAD6C\uC0AC\uD56D
- \uC0C1\uD22C\uC801 \uD45C\uD604 \uC81C\uAC70
- \uAC1C\uC778\uC801 \uACBD\uD5D8/\uAC10\uC815 \uCD94\uAC00
- \uBB38\uC7A5 \uAE38\uC774 \uB2E4\uC591\uD654
- \uC6D0\uBB38 \uC758\uBBF8 \uC720\uC9C0

\uC218\uC815\uB41C \uD14D\uC2A4\uD2B8\uB9CC \uCD9C\uB825\uD558\uC138\uC694.`;
  }
};

// src/ui/SettingsTab.ts
var import_obsidian2 = require("obsidian");
var WriteGuardSettingTab = class extends import_obsidian2.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h1", { text: "WriteGuard \uC124\uC815" });
    containerEl.createEl("h2", { text: "AI \uC81C\uACF5\uC790" });
    new import_obsidian2.Setting(containerEl).setName("AI \uC81C\uACF5\uC790").setDesc("\uBD84\uC11D\uC5D0 \uC0AC\uC6A9\uD560 AI \uC11C\uBE44\uC2A4 \uC120\uD0DD").addDropdown(
      (dropdown) => dropdown.addOption("anthropic", "Anthropic (Claude)").addOption("openai", "OpenAI (GPT)").addOption("gemini", "Google (Gemini)").addOption("cerebras", "Cerebras (Llama)").setValue(this.plugin.settings.apiProvider).onChange(async (value) => {
        this.plugin.settings.apiProvider = value;
        await this.plugin.saveSettings();
        this.display();
      })
    );
    const provider = this.plugin.settings.apiProvider;
    new import_obsidian2.Setting(containerEl).setName(`${this.getProviderName(provider)} API Key`).setDesc("API \uD0A4\uB97C \uC785\uB825\uD558\uC138\uC694").addText(
      (text) => text.setPlaceholder("API Key...").setValue(this.plugin.settings.apiKeys[provider]).onChange(async (value) => {
        this.plugin.settings.apiKeys[provider] = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName("\uBAA8\uB378").setDesc("\uC0AC\uC6A9\uD560 \uBAA8\uB378 \uC120\uD0DD").addDropdown((dropdown) => {
      this.getModelsForProvider(provider).forEach((model) => {
        dropdown.addOption(model, model);
      });
      return dropdown.setValue(this.plugin.settings.selectedModel[provider]).onChange(async (value) => {
        this.plugin.settings.selectedModel[provider] = value;
        await this.plugin.saveSettings();
      });
    });
    containerEl.createEl("h2", { text: "\uBD84\uC11D \uC124\uC815" });
    new import_obsidian2.Setting(containerEl).setName("\uC790\uB3D9 \uBD84\uC11D").setDesc("\uD0C0\uC774\uD551 \uC911 \uC2E4\uC2DC\uAC04 \uBD84\uC11D (\uB85C\uCEEC)").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.autoAnalyze).onChange(async (value) => {
        this.plugin.settings.autoAnalyze = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName("\uBD84\uC11D \uC9C0\uC5F0").setDesc("\uD0C0\uC774\uD551 \uD6C4 \uBD84\uC11D\uAE4C\uC9C0 \uB300\uAE30 \uC2DC\uAC04 (ms)").addSlider(
      (slider) => slider.setLimits(500, 3e3, 100).setValue(this.plugin.settings.autoAnalyzeDelay).setDynamicTooltip().onChange(async (value) => {
        this.plugin.settings.autoAnalyzeDelay = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName("\uBAA9\uD45C Human Score").setDesc("\uC774 \uC810\uC218 \uC774\uC0C1\uC774\uBA74 \uC548\uC804").addSlider(
      (slider) => slider.setLimits(60, 95, 5).setValue(this.plugin.settings.targetHumanScore).setDynamicTooltip().onChange(async (value) => {
        this.plugin.settings.targetHumanScore = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName("\uC5B8\uC5B4").setDesc("\uBD84\uC11D \uB300\uC0C1 \uC5B8\uC5B4").addDropdown(
      (dropdown) => dropdown.addOption("ko", "\uD55C\uAD6D\uC5B4").addOption("en", "English").setValue(this.plugin.settings.language).onChange(async (value) => {
        this.plugin.settings.language = value;
        await this.plugin.saveSettings();
      })
    );
    containerEl.createEl("h2", { text: "UI \uC124\uC815" });
    new import_obsidian2.Setting(containerEl).setName("\uC778\uB77C\uC778 \uD558\uC774\uB77C\uC774\uD2B8").setDesc("\uC5D0\uB514\uD130\uC5D0\uC11C \uBB38\uC81C \uAD6C\uAC04 \uD45C\uC2DC").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.showInlineHighlights).onChange(async (value) => {
        this.plugin.settings.showInlineHighlights = value;
        await this.plugin.saveSettings();
      })
    );
    containerEl.createEl("h2", { text: "\u{1F4A1} \uC0AC\uC6A9 \uD301" });
    const tips = containerEl.createDiv("writeguard-tips");
    tips.innerHTML = `
      <ul>
        <li><strong>\uBB34\uB8CC \uC0AC\uC6A9:</strong> API \uC5C6\uC774\uB3C4 \uB85C\uCEEC \uBD84\uC11D \uAC00\uB2A5</li>
        <li><strong>Claude Code \uC0AC\uC6A9\uC790:</strong> \uD504\uB86C\uD504\uD2B8 \uBCF5\uC0AC \uAE30\uB2A5\uC73C\uB85C API \uBE44\uC6A9 \uC5C6\uC774 \uC815\uBC00 \uBD84\uC11D</li>
        <li><strong>\uBE44\uC6A9 \uC808\uC57D:</strong> \uB85C\uCEEC\uC5D0\uC11C \uBA3C\uC800 \uD655\uC778 \uD6C4, \uD544\uC694\uD560 \uB54C\uB9CC AI \uBD84\uC11D</li>
        <li><strong>Cerebras:</strong> \uBE60\uB978 \uC751\uB2F5 \uC18D\uB3C4, Llama 4 \uBAA8\uB378 \uC9C0\uC6D0</li>
      </ul>
    `;
  }
  getProviderName(provider) {
    const names = {
      anthropic: "Anthropic",
      openai: "OpenAI",
      gemini: "Google",
      cerebras: "Cerebras"
    };
    return names[provider];
  }
  getModelsForProvider(provider) {
    const models = {
      anthropic: [
        "claude-sonnet-4-20250514",
        "claude-opus-4-20250514",
        "claude-3-5-sonnet-20241022",
        "claude-3-5-haiku-20241022"
      ],
      openai: [
        "gpt-4.5-turbo",
        "gpt-4.1",
        "gpt-4o",
        "gpt-4o-mini",
        "o3-mini"
      ],
      gemini: [
        "gemini-2.5-pro",
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-pro"
      ],
      cerebras: [
        "llama-4-scout-17b",
        "llama-3.3-70b",
        "llama-3.1-8b"
      ]
    };
    return models[provider];
  }
};

// src/ui/AnalysisView.ts
var import_obsidian3 = require("obsidian");
var VIEW_TYPE_ANALYSIS = "writeguard-analysis";
var AnalysisView = class extends import_obsidian3.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.result = null;
    this.plugin = plugin;
  }
  getViewType() {
    return VIEW_TYPE_ANALYSIS;
  }
  getDisplayText() {
    return "WriteGuard";
  }
  getIcon() {
    return "shield-check";
  }
  async onOpen() {
    this.renderEmpty();
  }
  updateResult(result) {
    this.result = result;
    this.render();
  }
  renderEmpty() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("writeguard-panel");
    const empty = container.createDiv("writeguard-empty");
    empty.createEl("h3", { text: "\u{1F4DD} WriteGuard" });
    empty.createEl("p", { text: "\uB178\uD2B8\uB97C \uC5F4\uACE0 \uBD84\uC11D\uC744 \uC2DC\uC791\uD558\uC138\uC694." });
    empty.createEl("p", { text: '\uB2E8\uCD95\uD0A4: Cmd/Ctrl + P \u2192 "WriteGuard"' });
  }
  render() {
    if (!this.result)
      return this.renderEmpty();
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("writeguard-panel");
    this.renderScoreSection(container);
    this.renderIssuesSection(container);
    this.renderSuggestionsSection(container);
    this.renderMetricsSection(container);
    this.renderActionsSection(container);
  }
  renderScoreSection(container) {
    const section = container.createDiv("writeguard-section score-section");
    const score = this.result.humanScore;
    const target = this.plugin.settings.targetHumanScore;
    const status = score >= target ? "good" : score >= 60 ? "warning" : "danger";
    section.createEl("h3", { text: "\u{1F3AF} Human Score" });
    const scoreDisplay = section.createDiv("score-display");
    scoreDisplay.createEl("span", {
      text: `${score}`,
      cls: `score-value ${status}`
    });
    scoreDisplay.createEl("span", { text: " / 100" });
    const progressBar = section.createDiv("progress-bar");
    const fill = progressBar.createDiv("progress-fill");
    fill.addClass(status);
    fill.style.width = `${score}%`;
    const targetLine = progressBar.createDiv("target-line");
    targetLine.style.left = `${target}%`;
    if (score < target) {
      section.createEl("p", {
        text: `\uBAA9\uD45C ${target}\uC810\uAE4C\uC9C0 +${target - score}\uC810 \uD544\uC694`,
        cls: "score-hint"
      });
    } else {
      section.createEl("p", {
        text: "\u2705 \uBAA9\uD45C \uB2EC\uC131! \uC790\uC5F0\uC2A4\uB7EC\uC6B4 \uAE00\uC785\uB2C8\uB2E4.",
        cls: "score-hint success"
      });
    }
  }
  renderIssuesSection(container) {
    const issues = this.result.issues;
    if (issues.length === 0)
      return;
    const section = container.createDiv("writeguard-section");
    section.createEl("h3", { text: `\u{1F534} \uC218\uC815 \uD544\uC694 (${issues.length}\uAC1C)` });
    const list = section.createDiv("issues-list");
    issues.slice(0, 5).forEach((issue) => {
      const item = list.createDiv("issue-item");
      item.addClass(issue.severity);
      const header = item.createDiv("issue-header");
      const severityBadge = header.createEl("span", {
        text: issue.severity === "high" ? "\uB192\uC74C" : issue.severity === "medium" ? "\uC911\uAC04" : "\uB0AE\uC74C",
        cls: `severity-badge ${issue.severity}`
      });
      item.createEl("p", { text: `"${issue.text.substring(0, 50)}..."`, cls: "issue-text" });
      item.createEl("p", { text: issue.description, cls: "issue-desc" });
    });
  }
  renderSuggestionsSection(container) {
    const suggestions = this.result.suggestions;
    if (suggestions.length === 0)
      return;
    const section = container.createDiv("writeguard-section");
    section.createEl("h3", { text: "\u{1F4A1} \uAC1C\uC120 \uC81C\uC548" });
    const list = section.createDiv("suggestions-list");
    suggestions.forEach((sug) => {
      const item = list.createDiv("suggestion-item");
      item.createEl("p", { text: sug.reason, cls: "suggestion-reason" });
      if (sug.original && sug.suggested) {
        const comparison = item.createDiv("suggestion-comparison");
        comparison.createEl("div", { text: `\u274C ${sug.original}`, cls: "original" });
        comparison.createEl("div", { text: `\u2705 ${sug.suggested}`, cls: "suggested" });
      }
    });
  }
  renderMetricsSection(container) {
    const metrics = this.result.metrics;
    const section = container.createDiv("writeguard-section metrics-section");
    section.createEl("h3", { text: "\u{1F4CA} \uC138\uBD80 \uC9C0\uD45C" });
    const grid = section.createDiv("metrics-grid");
    this.renderMetric(grid, "\uC5B4\uD718 \uB2E4\uC591\uC131", metrics.vocabularyDiversity, "%");
    this.renderMetric(grid, "\uBB38\uC7A5 \uBCC0\uD654\uB3C4", metrics.sentenceVariance, "");
    this.renderMetric(grid, "AI \uD328\uD134", metrics.aiPatternCount, "\uAC1C", true);
    this.renderMetric(grid, "\uAC1C\uC778\uD654 \uC218\uC900", metrics.personalExpressionScore, "%");
    this.renderMetric(grid, "\uBC18\uBCF5\uB960", metrics.repetitionRate, "%", true);
  }
  renderMetric(container, label, value, unit, inverse = false) {
    const item = container.createDiv("metric-item");
    const status = inverse ? value <= 20 ? "good" : value <= 50 ? "warning" : "danger" : value >= 60 ? "good" : value >= 40 ? "warning" : "danger";
    item.createEl("span", { text: label, cls: "metric-label" });
    item.createEl("span", {
      text: `${Math.round(value)}${unit}`,
      cls: `metric-value ${status}`
    });
  }
  renderActionsSection(container) {
    const section = container.createDiv("writeguard-section actions-section");
    const aiBtn = section.createEl("button", { text: "\u{1F916} AI \uC815\uBC00 \uBD84\uC11D", cls: "action-btn primary" });
    aiBtn.onclick = () => this.plugin.analyzeWithAI();
    const copyBtn = section.createEl("button", { text: "\u{1F4CB} Claude Code \uD504\uB86C\uD504\uD2B8 \uBCF5\uC0AC", cls: "action-btn" });
    copyBtn.onclick = () => this.plugin.copyClaudeCodePrompt();
    const refreshBtn = section.createEl("button", { text: "\u{1F504} \uB2E4\uC2DC \uBD84\uC11D", cls: "action-btn" });
    refreshBtn.onclick = () => this.plugin.analyzeCurrentNote();
    const sourceInfo = section.createDiv("source-info");
    sourceInfo.createEl("span", {
      text: `\uBD84\uC11D: ${this.result.source === "local" ? "\uB85C\uCEEC" : "AI"} | ${new Date(this.result.analyzedAt).toLocaleTimeString()}`
    });
  }
  async onClose() {
  }
};

// src/ui/InlineHighlighter.ts
var import_view = require("@codemirror/view");
var import_state = require("@codemirror/state");
var issueHighlightMark = import_view.Decoration.mark({ class: "writeguard-highlight-issue" });
var issueHighlightHigh = import_view.Decoration.mark({ class: "writeguard-highlight-high" });
var issueHighlightMedium = import_view.Decoration.mark({ class: "writeguard-highlight-medium" });
var issueHighlightLow = import_view.Decoration.mark({ class: "writeguard-highlight-low" });
var InlineHighlighter = class {
  constructor() {
    this.issues = [];
    this.enabled = true;
  }
  setIssues(issues) {
    this.issues = issues;
  }
  setEnabled(enabled) {
    this.enabled = enabled;
  }
  getDecorations(view) {
    if (!this.enabled || this.issues.length === 0) {
      return import_view.Decoration.none;
    }
    const builder = new import_state.RangeSetBuilder();
    const docText = view.state.doc.toString();
    const sortedIssues = [...this.issues].filter((issue) => issue.position.start > 0 || issue.text).sort((a, b) => {
      const posA = a.position.start > 0 ? a.position.start : docText.indexOf(a.text);
      const posB = b.position.start > 0 ? b.position.start : docText.indexOf(b.text);
      return posA - posB;
    });
    for (const issue of sortedIssues) {
      let start = issue.position.start;
      let end = issue.position.end;
      if (start === 0 && end === 0 && issue.text) {
        const idx = docText.indexOf(issue.text);
        if (idx !== -1) {
          start = idx;
          end = idx + issue.text.length;
        }
      }
      if (start >= 0 && end > start && end <= docText.length) {
        const decoration = this.getDecorationForSeverity(issue.severity);
        builder.add(start, end, decoration);
      }
    }
    return builder.finish();
  }
  getDecorationForSeverity(severity) {
    switch (severity) {
      case "high":
        return issueHighlightHigh;
      case "medium":
        return issueHighlightMedium;
      case "low":
        return issueHighlightLow;
      default:
        return issueHighlightMark;
    }
  }
};
function createHighlighterExtension(highlighter) {
  return import_view.ViewPlugin.fromClass(
    class {
      constructor(view) {
        this.decorations = highlighter.getDecorations(view);
      }
      update(update) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = highlighter.getDecorations(update.view);
        }
      }
    },
    {
      decorations: (v) => v.decorations
    }
  );
}

// src/main.ts
var WriteGuardPlugin = class extends import_obsidian4.Plugin {
  constructor() {
    super(...arguments);
    this.aiProvider = null;
    this.lastResult = null;
    this.debounceTimer = null;
  }
  async onload() {
    await this.loadSettings();
    this.localAnalyzer = new LocalAnalyzer(this.settings.language);
    this.claudeCode = new ClaudeCodeIntegration();
    this.highlighter = new InlineHighlighter();
    this.highlighter.setEnabled(this.settings.showInlineHighlights);
    this.initAIProvider();
    this.registerEditorExtension(createHighlighterExtension(this.highlighter));
    this.registerView(VIEW_TYPE_ANALYSIS, (leaf) => new AnalysisView(leaf, this));
    this.addRibbonIcon("shield-check", "WriteGuard \uBD84\uC11D", () => {
      this.analyzeCurrentNote();
    });
    this.addCommand({
      id: "analyze-note",
      name: "\uD604\uC7AC \uB178\uD2B8 \uBD84\uC11D",
      callback: () => this.analyzeCurrentNote()
    });
    this.addCommand({
      id: "analyze-with-ai",
      name: "AI\uB85C \uC815\uBC00 \uBD84\uC11D",
      callback: () => this.analyzeWithAI()
    });
    this.addCommand({
      id: "humanize-selection",
      name: "\uC120\uD0DD \uC601\uC5ED Humanize",
      editorCallback: (editor) => this.humanizeSelection(editor)
    });
    this.addCommand({
      id: "copy-claude-prompt",
      name: "Claude Code\uC6A9 \uD504\uB86C\uD504\uD2B8 \uBCF5\uC0AC",
      callback: () => this.copyClaudeCodePrompt()
    });
    this.addCommand({
      id: "toggle-panel",
      name: "\uBD84\uC11D \uD328\uB110 \uD1A0\uAE00",
      callback: () => this.toggleAnalysisPanel()
    });
    this.addCommand({
      id: "toggle-highlights",
      name: "\uC778\uB77C\uC778 \uD558\uC774\uB77C\uC774\uD2B8 \uD1A0\uAE00",
      callback: () => this.toggleHighlights()
    });
    this.addSettingTab(new WriteGuardSettingTab(this.app, this));
    if (this.settings.autoAnalyze) {
      this.registerEvent(
        this.app.workspace.on("editor-change", () => this.onEditorChange())
      );
    }
  }
  initAIProvider() {
    const provider = this.settings.apiProvider;
    const apiKey = this.settings.apiKeys[provider];
    if (apiKey) {
      this.aiProvider = new AIProvider(provider, {
        apiKey,
        model: this.settings.selectedModel[provider]
      });
    }
  }
  onEditorChange() {
    if (this.debounceTimer)
      clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.analyzeCurrentNote(true);
    }, this.settings.autoAnalyzeDelay);
  }
  async analyzeCurrentNote(silent = false) {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian4.MarkdownView);
    if (!view) {
      if (!silent)
        new import_obsidian4.Notice("\uC5F4\uB9B0 \uB178\uD2B8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.");
      return;
    }
    const content = view.editor.getValue();
    if (content.length < 50) {
      if (!silent)
        new import_obsidian4.Notice("\uD14D\uC2A4\uD2B8\uAC00 \uB108\uBB34 \uC9E7\uC2B5\uB2C8\uB2E4.");
      return;
    }
    this.lastResult = this.localAnalyzer.analyze(content);
    this.updateHighlights();
    this.updateAnalysisView();
    if (!silent) {
      const score = this.lastResult.humanScore;
      const emoji = score >= 85 ? "\u{1F7E2}" : score >= 60 ? "\u{1F7E1}" : "\u{1F534}";
      new import_obsidian4.Notice(`${emoji} Human Score: ${score}/100`);
    }
  }
  async analyzeWithAI() {
    if (!this.aiProvider) {
      new import_obsidian4.Notice("API \uD0A4\uB97C \uC124\uC815\uD574\uC8FC\uC138\uC694. (\uC124\uC815 > WriteGuard)");
      return;
    }
    const view = this.app.workspace.getActiveViewOfType(import_obsidian4.MarkdownView);
    if (!view) {
      new import_obsidian4.Notice("\uC5F4\uB9B0 \uB178\uD2B8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.");
      return;
    }
    const content = view.editor.getValue();
    new import_obsidian4.Notice("AI \uBD84\uC11D \uC911...");
    try {
      this.lastResult = await this.aiProvider.analyze(content);
      this.updateHighlights();
      this.updateAnalysisView();
      const score = this.lastResult.humanScore;
      const emoji = score >= 85 ? "\u{1F7E2}" : score >= 60 ? "\u{1F7E1}" : "\u{1F534}";
      new import_obsidian4.Notice(`${emoji} AI \uBD84\uC11D \uC644\uB8CC: ${score}/100`);
    } catch (error) {
      new import_obsidian4.Notice(`\uBD84\uC11D \uC2E4\uD328: ${error.message}`);
    }
  }
  async humanizeSelection(editor) {
    const selection = editor.getSelection();
    if (!selection) {
      new import_obsidian4.Notice("\uD14D\uC2A4\uD2B8\uB97C \uC120\uD0DD\uD574\uC8FC\uC138\uC694.");
      return;
    }
    if (!this.aiProvider) {
      const prompt = this.claudeCode.generateHumanizePrompt(selection);
      await navigator.clipboard.writeText(prompt);
      new import_obsidian4.Notice("Humanize \uD504\uB86C\uD504\uD2B8\uAC00 \uD074\uB9BD\uBCF4\uB4DC\uC5D0 \uBCF5\uC0AC\uB418\uC5C8\uC2B5\uB2C8\uB2E4. Claude Code\uC5D0 \uBD99\uC5EC\uB123\uAE30\uD558\uC138\uC694.");
      return;
    }
    new import_obsidian4.Notice("Humanize \uC911...");
    try {
      const humanized = await this.aiProvider.humanize(selection);
      editor.replaceSelection(humanized);
      new import_obsidian4.Notice("\u2705 Humanize \uC644\uB8CC!");
    } catch (error) {
      new import_obsidian4.Notice(`\uC2E4\uD328: ${error.message}`);
    }
  }
  async copyClaudeCodePrompt() {
    const view = this.app.workspace.getActiveViewOfType(import_obsidian4.MarkdownView);
    if (!view) {
      new import_obsidian4.Notice("\uC5F4\uB9B0 \uB178\uD2B8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.");
      return;
    }
    const content = view.editor.getValue();
    const prompt = this.claudeCode.generateAnalysisPrompt(content);
    await navigator.clipboard.writeText(prompt);
    new import_obsidian4.Notice("\u{1F4CB} \uD504\uB86C\uD504\uD2B8\uAC00 \uD074\uB9BD\uBCF4\uB4DC\uC5D0 \uBCF5\uC0AC\uB418\uC5C8\uC2B5\uB2C8\uB2E4!\nClaude Code\uC5D0 \uBD99\uC5EC\uB123\uAE30\uD558\uC138\uC694.");
  }
  async toggleAnalysisPanel() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_ANALYSIS);
    if (leaves.length > 0) {
      leaves.forEach((leaf) => leaf.detach());
    } else {
      const leaf = this.app.workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.setViewState({ type: VIEW_TYPE_ANALYSIS, active: true });
        this.app.workspace.revealLeaf(leaf);
      }
    }
  }
  toggleHighlights() {
    this.settings.showInlineHighlights = !this.settings.showInlineHighlights;
    this.highlighter.setEnabled(this.settings.showInlineHighlights);
    this.saveSettings();
    this.refreshEditors();
    new import_obsidian4.Notice(this.settings.showInlineHighlights ? "\u{1F534} \uD558\uC774\uB77C\uC774\uD2B8 \uD65C\uC131\uD654" : "\u26AA \uD558\uC774\uB77C\uC774\uD2B8 \uBE44\uD65C\uC131\uD654");
  }
  updateHighlights() {
    if (this.lastResult) {
      this.highlighter.setIssues(this.lastResult.issues);
      this.refreshEditors();
    }
  }
  refreshEditors() {
    this.app.workspace.iterateAllLeaves((leaf) => {
      var _a;
      if (leaf.view instanceof import_obsidian4.MarkdownView) {
        const cmEditor = (_a = leaf.view.editor) == null ? void 0 : _a.cm;
        if (cmEditor) {
          cmEditor.dispatch({ effects: [] });
        }
      }
    });
  }
  updateAnalysisView() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_ANALYSIS);
    leaves.forEach((leaf) => {
      const view = leaf.view;
      if (view && this.lastResult) {
        view.updateResult(this.lastResult);
      }
    });
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
    this.localAnalyzer = new LocalAnalyzer(this.settings.language);
    this.highlighter.setEnabled(this.settings.showInlineHighlights);
    this.initAIProvider();
  }
  onunload() {
    if (this.debounceTimer)
      clearTimeout(this.debounceTimer);
  }
};
