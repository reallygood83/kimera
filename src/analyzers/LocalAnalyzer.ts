/**
 * LocalAnalyzer - 100% 로컬 텍스트 분석
 * API 호출 없이 즉시 실행, 실시간 피드백용
 */

import { 
  AnalysisResult, 
  AnalysisIssue, 
  Suggestion,
  AI_PATTERNS_KO,
  AI_PATTERNS_EN 
} from '../types';

export class LocalAnalyzer {
  private language: 'ko' | 'en';
  
  constructor(language: 'ko' | 'en' = 'ko') {
    this.language = language;
  }
  
  analyze(text: string): AnalysisResult {
    const cleanText = this.normalizeText(text);
    
    if (cleanText.length < 50) {
      return this.createEmptyResult('텍스트가 너무 짧습니다.');
    }
    
    const vocabularyDiversity = this.calculateTTR(cleanText);
    const sentenceVariance = this.calculateSentenceVariance(cleanText);
    const { count: aiPatternCount, issues: patternIssues } = this.detectAIPatterns(cleanText);
    const personalExpressionScore = this.calculatePersonalScore(cleanText);
    const repetitionRate = this.calculateRepetitionRate(cleanText);
    const perplexity = this.calculatePerplexity(cleanText);
    const burstiness = this.calculateBurstiness(cleanText);
    
    const humanScore = this.calculateHumanScore({
      vocabularyDiversity,
      sentenceVariance,
      aiPatternCount,
      personalExpressionScore,
      repetitionRate,
      perplexity,
      burstiness
    });
    
    const suggestions = this.generateLocalSuggestions(
      cleanText,
      { vocabularyDiversity, sentenceVariance, aiPatternCount, personalExpressionScore, repetitionRate, perplexity, burstiness }
    );
    
    return {
      humanScore,
      metrics: {
        vocabularyDiversity,
        sentenceVariance,
        aiPatternCount,
        personalExpressionScore,
        repetitionRate,
        perplexity,
        burstiness
      },
      issues: patternIssues,
      suggestions,
      source: 'local',
      analyzedAt: Date.now()
    };
  }
  
  /**
   * 텍스트 정규화
   */
  private normalizeText(text: string): string {
    return text
      .normalize('NFKD')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')  // Zero-width chars
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  /**
   * Type-Token Ratio (어휘 다양성) 계산
   * 높을수록 다양한 어휘 사용
   */
  private calculateTTR(text: string): number {
    const words = this.tokenize(text);
    if (words.length < 10) return 0;
    
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    
    // 긴 텍스트에서 TTR이 자연스럽게 낮아지는 것을 보정
    const adjustedTTR = uniqueWords.size / Math.sqrt(words.length);
    
    // 0-100 스케일로 정규화
    return Math.min(100, Math.round(adjustedTTR * 20));
  }
  
  /**
   * 문장 길이 분산 계산
   * 분산이 클수록 자연스러운 글 (AI는 일정한 경향)
   */
  private calculateSentenceVariance(text: string): number {
    const sentences = this.splitSentences(text);
    if (sentences.length < 3) return 50;
    
    const lengths = sentences.map(s => this.tokenize(s).length);
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / lengths.length;
    
    // 분산을 점수로 변환 (분산이 클수록 높은 점수)
    // 일반적으로 인간 글의 분산은 20-50 정도
    const score = Math.min(100, variance * 2);
    
    return Math.round(score);
  }
  
  /**
   * AI 패턴 감지
   */
  private detectAIPatterns(text: string): { count: number; issues: AnalysisIssue[] } {
    const patterns = this.language === 'ko' ? AI_PATTERNS_KO : AI_PATTERNS_EN;
    const issues: AnalysisIssue[] = [];
    
    // 상투적 표현 검사
    for (const phrase of patterns.clicheStarters) {
      const index = text.indexOf(phrase);
      if (index !== -1) {
        issues.push({
          type: 'cliche',
          severity: 'medium',
          text: phrase,
          position: { start: index, end: index + phrase.length },
          description: `"${phrase}"는 AI가 자주 사용하는 표현입니다.`
        });
      }
    }
    
    // 구조적 패턴 검사
    for (const pattern of patterns.structuralPatterns) {
      const match = text.match(pattern);
      if (match) {
        issues.push({
          type: 'ai-pattern',
          severity: 'high',
          text: match[0].substring(0, 50) + '...',
          position: { start: text.indexOf(match[0]), end: text.indexOf(match[0]) + match[0].length },
          description: '순차적 나열 패턴이 감지되었습니다. 자연스러운 흐름으로 수정하세요.'
        });
      }
    }
    
    // 과잉 수식어 검사
    for (const modifier of patterns.overusedModifiers) {
      const index = text.indexOf(modifier);
      if (index !== -1) {
        issues.push({
          type: 'cliche',
          severity: 'low',
          text: modifier,
          position: { start: index, end: index + modifier.length },
          description: `"${modifier}"은 AI가 자주 사용하는 수식어입니다.`
        });
      }
    }
    
    return { count: issues.length, issues };
  }
  
  /**
   * 개인화 점수 계산
   */
  private calculatePersonalScore(text: string): number {
    const patterns = this.language === 'ko' ? AI_PATTERNS_KO : AI_PATTERNS_EN;
    let score = 30; // 기본 점수
    
    // 개인 표현 있으면 가점
    for (const indicator of patterns.personalIndicators) {
      if (text.includes(indicator)) {
        score += 10;
      }
    }
    
    // 감정 표현 있으면 가점
    for (const emotion of patterns.emotionalWords) {
      if (text.includes(emotion)) {
        score += 8;
      }
    }
    
    // 구체적 날짜/숫자 있으면 가점
    const hasSpecificDate = /\d{4}년|\d+월|\d+일/.test(text);
    const hasSpecificNumber = /약 \d+|대략 \d+|\d+명|\d+개/.test(text);
    if (hasSpecificDate) score += 15;
    if (hasSpecificNumber) score += 10;
    
    return Math.min(100, score);
  }
  
  private calculateRepetitionRate(text: string): number {
    const words = this.tokenize(text);
    if (words.length < 10) return 0;
    
    const trigrams: string[] = [];
    for (let i = 0; i < words.length - 2; i++) {
      trigrams.push(words.slice(i, i + 3).join(' '));
    }
    
    const uniqueTrigrams = new Set(trigrams);
    const repetitionRate = 1 - (uniqueTrigrams.size / trigrams.length);
    
    return Math.round(repetitionRate * 100);
  }
  
  /**
   * Perplexity (혼란도) 계산 - AI 탐지 핵심 지표
   * 
   * AI 텍스트는 예측 가능한 단어를 선택해 perplexity가 낮음
   * 인간 텍스트는 예상치 못한 단어 선택으로 perplexity가 높음
   * 
   * 로컬 근사 방식: 
   * - 단어 빈도 기반 surprisal 계산
   * - 희귀 단어, 비일상적 조합이 많을수록 높은 점수
   */
  private calculatePerplexity(text: string): number {
    const words = this.tokenize(text);
    if (words.length < 20) return 50;
    
    const wordFreq = new Map<string, number>();
    words.forEach(w => wordFreq.set(w, (wordFreq.get(w) || 0) + 1));
    
    let totalSurprisal = 0;
    const vocab = wordFreq.size;
    
    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const freq = wordFreq.get(word) || 1;
      const prob = freq / words.length;
      const surprisal = -Math.log2(prob + 0.001);
      totalSurprisal += surprisal;
    }
    
    const avgSurprisal = totalSurprisal / (words.length - 1);
    
    const bigramUniqueness = this.calculateBigramUniqueness(words);
    const rareWordRatio = this.calculateRareWordRatio(words, wordFreq);
    
    const rawPerplexity = avgSurprisal * (1 + bigramUniqueness * 0.3 + rareWordRatio * 0.2);
    
    const normalized = Math.min(100, Math.max(0, (rawPerplexity - 3) * 15));
    
    return Math.round(normalized);
  }
  
  private calculateBigramUniqueness(words: string[]): number {
    if (words.length < 2) return 0;
    
    const bigrams: string[] = [];
    for (let i = 0; i < words.length - 1; i++) {
      bigrams.push(`${words[i]} ${words[i + 1]}`);
    }
    
    const unique = new Set(bigrams).size;
    return unique / bigrams.length;
  }
  
  private calculateRareWordRatio(words: string[], freqMap: Map<string, number>): number {
    const rareWords = words.filter(w => (freqMap.get(w) || 0) === 1);
    return rareWords.length / words.length;
  }
  
  /**
   * Burstiness (폭발성) 계산 - AI 탐지 핵심 지표
   * 
   * AI 텍스트: 문장 길이가 균일함 → 낮은 burstiness
   * 인간 텍스트: 문장 길이가 들쭉날쭉 → 높은 burstiness
   * 
   * 계산: 문장 길이의 변동계수(CV) + 연속 문장 간 길이 차이
   */
  private calculateBurstiness(text: string): number {
    const sentences = this.splitSentences(text);
    if (sentences.length < 4) return 50;
    
    const lengths = sentences.map(s => this.tokenize(s).length);
    
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 0;
    
    let consecutiveDiff = 0;
    for (let i = 1; i < lengths.length; i++) {
      consecutiveDiff += Math.abs(lengths[i] - lengths[i - 1]);
    }
    const avgConsecutiveDiff = consecutiveDiff / (lengths.length - 1);
    
    const shortSentenceRatio = lengths.filter(l => l <= 8).length / lengths.length;
    const longSentenceRatio = lengths.filter(l => l >= 20).length / lengths.length;
    const extremeRatio = shortSentenceRatio + longSentenceRatio;
    
    const rawBurstiness = (cv * 40) + (avgConsecutiveDiff * 2) + (extremeRatio * 30);
    
    return Math.round(Math.min(100, Math.max(0, rawBurstiness)));
  }
  
  private calculateHumanScore(metrics: {
    vocabularyDiversity: number;
    sentenceVariance: number;
    aiPatternCount: number;
    personalExpressionScore: number;
    repetitionRate: number;
    perplexity: number;
    burstiness: number;
  }): number {
    const weights = {
      vocabularyDiversity: 0.10,
      sentenceVariance: 0.10,
      aiPatternPenalty: 0.15,
      personalExpression: 0.15,
      repetition: 0.10,
      perplexity: 0.20,
      burstiness: 0.20
    };
    
    let score = 50;
    
    score += (metrics.vocabularyDiversity - 50) * weights.vocabularyDiversity;
    score += (metrics.sentenceVariance - 30) * weights.sentenceVariance;
    score -= metrics.aiPatternCount * 5 * weights.aiPatternPenalty;
    score += (metrics.personalExpressionScore - 50) * weights.personalExpression;
    score -= metrics.repetitionRate * weights.repetition;
    
    score += (metrics.perplexity - 40) * weights.perplexity;
    score += (metrics.burstiness - 40) * weights.burstiness;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  
  private generateLocalSuggestions(text: string, metrics: {
    vocabularyDiversity: number;
    sentenceVariance: number;
    aiPatternCount: number;
    personalExpressionScore: number;
    repetitionRate: number;
    perplexity: number;
    burstiness: number;
  }): Suggestion[] {
    const suggestions: Suggestion[] = [];
    
    // 개인화 부족
    if (metrics.personalExpressionScore < 50) {
      suggestions.push({
        type: 'add-personal',
        priority: 'high',
        original: '',
        suggested: '',
        reason: '개인적인 경험이나 의견을 추가해보세요. 예: "제 경험으로는...", "개인적으로 느끼기에..."'
      });
    }
    
    // 문장 길이 변화 부족
    if (metrics.sentenceVariance < 30) {
      suggestions.push({
        type: 'vary-sentence',
        priority: 'high',
        original: '',
        suggested: '',
        reason: '문장 길이가 너무 일정합니다. 짧은 문장과 긴 문장을 섞어 사용하세요.'
      });
    }
    
    // AI 패턴 감지됨
    if (metrics.aiPatternCount > 0) {
      suggestions.push({
        type: 'remove-cliche',
        priority: 'high',
        original: '',
        suggested: '',
        reason: `${metrics.aiPatternCount}개의 AI 특유 패턴이 감지되었습니다. 하이라이트된 부분을 자연스럽게 수정하세요.`
      });
    }
    
    // 어휘 다양성 부족
    if (metrics.vocabularyDiversity < 40) {
      suggestions.push({
        type: 'rewrite',
        priority: 'medium',
        original: '',
        suggested: '',
        reason: '동일한 단어가 반복됩니다. 유의어를 활용해 다양하게 표현해보세요.'
      });
    }
    
    return suggestions;
  }
  
  /**
   * 문장 분리
   */
  private splitSentences(text: string): string[] {
    return text
      .split(/[.!?。？！]+/)
      .map(s => s.trim())
      .filter(s => s.length > 5);
  }
  
  /**
   * 단어 토큰화
   */
  private tokenize(text: string): string[] {
    if (this.language === 'ko') {
      // 한국어: 공백 + 조사 기준 분리
      return text
        .split(/[\s,.!?;:]+/)
        .filter(w => w.length > 0);
    } else {
      // 영어: 공백 기준 분리
      return text
        .toLowerCase()
        .split(/[\s,.!?;:]+/)
        .filter(w => w.length > 2);
    }
  }
  
  private createEmptyResult(message: string): AnalysisResult {
    return {
      humanScore: 0,
      metrics: {
        vocabularyDiversity: 0,
        sentenceVariance: 0,
        aiPatternCount: 0,
        personalExpressionScore: 0,
        repetitionRate: 0,
        perplexity: 0,
        burstiness: 0
      },
      issues: [],
      suggestions: [{
        type: 'rewrite',
        priority: 'low',
        original: '',
        suggested: '',
        reason: message
      }],
      source: 'local',
      analyzedAt: Date.now()
    };
  }
}
