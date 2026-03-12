import { Modal, App, ButtonComponent, Notice, MarkdownView } from 'obsidian';
import { AnalysisResult } from '../types';
import WriteGuardPlugin from '../main';

export class AnalysisModal extends Modal {
  private plugin: WriteGuardPlugin;
  private beforeResult: AnalysisResult | null = null;
  private afterResult: AnalysisResult | null = null;
  private originalText: string = '';
  private humanizedText: string = '';
  private currentView: 'analysis' | 'comparison' = 'analysis';

  constructor(app: App, plugin: WriteGuardPlugin) {
    super(app);
    this.plugin = plugin;
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('writeguard-modal');

    const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!mdView) {
      this.renderError('열린 노트가 없습니다.');
      return;
    }

    this.originalText = mdView.editor.getValue();
    if (this.originalText.length < 50) {
      this.renderError('텍스트가 너무 짧습니다. (최소 50자)');
      return;
    }

    this.beforeResult = this.plugin.localAnalyzer.analyze(this.originalText);
    this.renderAnalysisView();
  }

  private renderError(message: string) {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: '⚠️ 오류' });
    contentEl.createEl('p', { text: message });
  }

  private renderAnalysisView() {
    const { contentEl } = this;
    contentEl.empty();
    this.currentView = 'analysis';

    contentEl.createEl('h2', { text: '📊 WriteGuard 분석' });

    const scoreContainer = contentEl.createDiv('wg-score-container');
    this.renderScoreCard(scoreContainer, '현재 점수', this.beforeResult!);

    const metricsContainer = contentEl.createDiv('wg-metrics-container');
    this.renderMetrics(metricsContainer, this.beforeResult!);

    const issuesContainer = contentEl.createDiv('wg-issues-container');
    this.renderIssues(issuesContainer, this.beforeResult!);

    const actionsContainer = contentEl.createDiv('wg-actions-container');
    this.renderActions(actionsContainer);
  }

  private renderScoreCard(container: Element, title: string, result: AnalysisResult) {
    const card = container.createDiv('wg-score-card');
    card.createEl('h3', { text: title });

    const score = result.humanScore;
    const status = score >= 85 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'warning' : 'danger';
    
    const scoreEl = card.createDiv('wg-score');
    scoreEl.addClass(status);
    scoreEl.createEl('span', { text: `${score}`, cls: 'wg-score-value' });
    scoreEl.createEl('span', { text: '/100', cls: 'wg-score-max' });

    const statusText = {
      excellent: '✅ 매우 자연스러움',
      good: '👍 양호',
      warning: '⚠️ 수정 필요',
      danger: '🔴 AI 감지 위험'
    };
    card.createEl('p', { text: statusText[status], cls: `wg-status ${status}` });
  }

  private renderMetrics(container: Element, result: AnalysisResult) {
    container.createEl('h3', { text: '📈 세부 지표' });
    
    const grid = container.createDiv('wg-metrics-grid');
    const m = result.metrics;

    const metrics = [
      { label: 'Perplexity (혼란도)', value: m.perplexity, good: true, desc: '높을수록 인간적' },
      { label: 'Burstiness (폭발성)', value: m.burstiness, good: true, desc: '높을수록 자연스러움' },
      { label: '어휘 다양성', value: m.vocabularyDiversity, good: true, desc: '다양한 단어 사용' },
      { label: '문장 변화도', value: m.sentenceVariance, good: true, desc: '문장 길이 다양성' },
      { label: '개인화 수준', value: m.personalExpressionScore, good: true, desc: '개인 경험/감정' },
      { label: 'AI 패턴', value: m.aiPatternCount, good: false, desc: '적을수록 좋음' },
      { label: '반복률', value: m.repetitionRate, good: false, desc: '낮을수록 좋음' },
    ];

    metrics.forEach(({ label, value, good, desc }) => {
      const item = grid.createDiv('wg-metric-item');
      item.createEl('span', { text: label, cls: 'wg-metric-label' });
      
      const valueStatus = good 
        ? (value >= 60 ? 'good' : value >= 40 ? 'warning' : 'danger')
        : (value <= 20 ? 'good' : value <= 50 ? 'warning' : 'danger');
      
      item.createEl('span', { 
        text: `${Math.round(value)}${good ? '%' : (label === 'AI 패턴' ? '개' : '%')}`,
        cls: `wg-metric-value ${valueStatus}`
      });
      item.createEl('span', { text: desc, cls: 'wg-metric-desc' });
    });
  }

  private renderIssues(container: Element, result: AnalysisResult) {
    if (result.issues.length === 0) return;

    container.createEl('h3', { text: `🔍 발견된 문제 (${result.issues.length}개)` });
    
    const list = container.createDiv('wg-issues-list');
    result.issues.slice(0, 5).forEach(issue => {
      const item = list.createDiv('wg-issue-item');
      item.addClass(issue.severity);
      
      const badge = item.createEl('span', { 
        text: issue.severity === 'high' ? '높음' : issue.severity === 'medium' ? '중간' : '낮음',
        cls: `wg-severity-badge ${issue.severity}`
      });
      
      item.createEl('span', { text: `"${issue.text.substring(0, 40)}..."`, cls: 'wg-issue-text' });
      item.createEl('p', { text: issue.description, cls: 'wg-issue-desc' });
    });
  }

  private renderActions(container: Element) {
    container.createEl('h3', { text: '🚀 작업' });

    const btnRow = container.createDiv('wg-btn-row');

    new ButtonComponent(btnRow)
      .setButtonText('✨ 원클릭 Humanize')
      .setCta()
      .onClick(() => this.runHumanize());

    new ButtonComponent(btnRow)
      .setButtonText('📋 Claude Code 프롬프트')
      .onClick(() => this.copyPrompt());

    if (this.plugin.aiProvider) {
      new ButtonComponent(btnRow)
        .setButtonText('🤖 AI 정밀 분석')
        .onClick(() => this.runAIAnalysis());
    }
  }

  private async runHumanize() {
    if (!this.plugin.aiProvider) {
      new Notice('API 키가 설정되지 않았습니다.');
      const prompt = this.plugin.claudeCode.generateHumanizePrompt(this.originalText);
      await navigator.clipboard.writeText(prompt);
      new Notice('📋 Humanize 프롬프트가 복사되었습니다. Claude Code에 붙여넣기하세요.');
      return;
    }

    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: '✨ Humanize 진행 중...' });
    
    const progress = contentEl.createDiv('wg-progress');
    const steps = ['분석 중', 'AI 처리 중', '검증 중', '완료'];
    const progressBar = progress.createDiv('wg-progress-bar');
    const statusEl = progress.createEl('p', { cls: 'wg-progress-status' });

    try {
      statusEl.setText('🔍 원본 분석 완료');
      progressBar.style.width = '25%';

      await this.delay(500);
      statusEl.setText('🤖 AI Humanize 처리 중...');
      progressBar.style.width = '50%';

      this.humanizedText = await this.plugin.aiProvider.humanize(this.originalText);

      statusEl.setText('📊 결과 검증 중...');
      progressBar.style.width = '75%';

      this.afterResult = this.plugin.localAnalyzer.analyze(this.humanizedText);

      progressBar.style.width = '100%';
      statusEl.setText('✅ 완료!');

      await this.delay(500);
      this.renderComparisonView();
    } catch (error) {
      contentEl.empty();
      contentEl.createEl('h2', { text: '❌ 오류 발생' });
      contentEl.createEl('p', { text: (error as Error).message });
      
      new ButtonComponent(contentEl)
        .setButtonText('← 돌아가기')
        .onClick(() => this.renderAnalysisView());
    }
  }

  private renderComparisonView() {
    const { contentEl } = this;
    contentEl.empty();
    this.currentView = 'comparison';

    contentEl.createEl('h2', { text: '📊 Before / After 비교' });

    const comparison = contentEl.createDiv('wg-comparison');
    
    const beforeCol = comparison.createDiv('wg-compare-col');
    beforeCol.createEl('h3', { text: '🔴 Before' });
    this.renderCompareScore(beforeCol, this.beforeResult!);
    
    const arrow = comparison.createDiv('wg-compare-arrow');
    const diff = this.afterResult!.humanScore - this.beforeResult!.humanScore;
    arrow.createEl('span', { text: `+${diff}점`, cls: diff > 0 ? 'positive' : 'neutral' });
    arrow.createEl('span', { text: '→', cls: 'arrow-icon' });

    const afterCol = comparison.createDiv('wg-compare-col');
    afterCol.createEl('h3', { text: '🟢 After' });
    this.renderCompareScore(afterCol, this.afterResult!);

    const textComparison = contentEl.createDiv('wg-text-comparison');
    
    const beforeText = textComparison.createDiv('wg-text-col');
    beforeText.createEl('h4', { text: '원본' });
    beforeText.createEl('pre', { text: this.truncate(this.originalText, 500) });

    const afterText = textComparison.createDiv('wg-text-col');
    afterText.createEl('h4', { text: 'Humanized' });
    afterText.createEl('pre', { text: this.truncate(this.humanizedText, 500) });

    const actionsRow = contentEl.createDiv('wg-actions-final');

    new ButtonComponent(actionsRow)
      .setButtonText('✅ 적용하기')
      .setCta()
      .onClick(() => this.applyHumanized());

    new ButtonComponent(actionsRow)
      .setButtonText('📋 복사하기')
      .onClick(async () => {
        await navigator.clipboard.writeText(this.humanizedText);
        new Notice('📋 Humanized 텍스트가 복사되었습니다!');
      });

    new ButtonComponent(actionsRow)
      .setButtonText('← 다시 분석')
      .onClick(() => this.renderAnalysisView());
  }

  private renderCompareScore(container: Element, result: AnalysisResult) {
    const score = result.humanScore;
    const status = score >= 85 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'warning' : 'danger';
    
    const scoreEl = container.createDiv('wg-compare-score');
    scoreEl.addClass(status);
    scoreEl.createEl('span', { text: `${score}`, cls: 'score-num' });
    scoreEl.createEl('span', { text: '/100' });

    const metrics = container.createDiv('wg-compare-metrics');
    metrics.createEl('div', { text: `Perplexity: ${result.metrics.perplexity}%` });
    metrics.createEl('div', { text: `Burstiness: ${result.metrics.burstiness}%` });
    metrics.createEl('div', { text: `AI패턴: ${result.metrics.aiPatternCount}개` });
  }

  private applyHumanized() {
    const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (mdView) {
      mdView.editor.setValue(this.humanizedText);
      new Notice('✅ Humanized 텍스트가 적용되었습니다!');
      this.close();
    }
  }

  private async copyPrompt() {
    const prompt = this.plugin.claudeCode.generateAnalysisPrompt(this.originalText);
    await navigator.clipboard.writeText(prompt);
    new Notice('📋 프롬프트가 복사되었습니다!');
  }

  private async runAIAnalysis() {
    if (!this.plugin.aiProvider) return;

    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: '🤖 AI 정밀 분석 중...' });
    
    try {
      this.beforeResult = await this.plugin.aiProvider.analyze(this.originalText);
      this.renderAnalysisView();
      new Notice('✅ AI 분석 완료!');
    } catch (error) {
      contentEl.empty();
      this.renderError((error as Error).message);
    }
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
