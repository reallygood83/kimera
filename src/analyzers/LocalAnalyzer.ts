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
  
  /**
   * 텍스트 전체 분석
   */
  analyze(text: string): AnalysisResult {
    const cleanText = this.normalizeText(text);
    
    if (cleanText.length < 50) {
      return this.createEmptyResult('텍스트가 너무 짧습니다.');
    }
    
    // 각 지표 계산
    const vocabularyDiversity = this.calculateTTR(cleanText);
    const sentenceVariance = this.calculateSentenceVariance(cleanText);
    const { count: aiPatternCount, issues: patternIssues } = this.detectAIPatterns(cleanText);
    const personalExpressionScore = this.calculatePersonalScore(cleanText);
    const repetitionRate = this.calculateRepetitionRate(cleanText);
    
    // 종합 Human Score 계산
    const humanScore = this.calculateHumanScore({
      vocabularyDiversity,
      sentenceVariance,
      aiPatternCount,
      personalExpressionScore,
      repetitionRate
    });
    
    // 개선 제안 생성
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
  
  /**
   * N-gram 반복률 계산
   */
  private calculateRepetitionRate(text: string): number {
    const words = this.tokenize(text);
    if (words.length < 10) return 0;
    
    // 3-gram 생성
    const trigrams: string[] = [];
    for (let i = 0; i < words.length - 2; i++) {
      trigrams.push(words.slice(i, i + 3).join(' '));
    }
    
    const uniqueTrigrams = new Set(trigrams);
    const repetitionRate = 1 - (uniqueTrigrams.size / trigrams.length);
    
    // 0-100 스케일 (낮을수록 좋음)
    return Math.round(repetitionRate * 100);
  }
  
  /**
   * 종합 Human Score 계산
   */
  private calculateHumanScore(metrics: {
    vocabularyDiversity: number;
    sentenceVariance: number;
    aiPatternCount: number;
    personalExpressionScore: number;
    repetitionRate: number;
  }): number {
    // 가중치 적용
    const weights = {
      vocabularyDiversity: 0.15,
      sentenceVariance: 0.20,
      aiPatternPenalty: 0.25,  // 패턴당 감점
      personalExpression: 0.25,
      repetition: 0.15
    };
    
    let score = 50; // 기본 점수
    
    // 어휘 다양성 (높을수록 좋음)
    score += (metrics.vocabularyDiversity - 50) * weights.vocabularyDiversity;
    
    // 문장 변화도 (높을수록 좋음)
    score += (metrics.sentenceVariance - 30) * weights.sentenceVariance;
    
    // AI 패턴 감점 (패턴당 -5점)
    score -= metrics.aiPatternCount * 5 * weights.aiPatternPenalty;
    
    // 개인화 점수 (높을수록 좋음)
    score += (metrics.personalExpressionScore - 50) * weights.personalExpression;
    
    // 반복률 감점 (높을수록 나쁨)
    score -= metrics.repetitionRate * weights.repetition;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  
  /**
   * 로컬 기반 개선 제안 생성
   */
  private generateLocalSuggestions(text: string, metrics: {
    vocabularyDiversity: number;
    sentenceVariance: number;
    aiPatternCount: number;
    personalExpressionScore: number;
    repetitionRate: number;
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
  
  /**
   * 빈 결과 생성
   */
  private createEmptyResult(message: string): AnalysisResult {
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
