import { ItemView, WorkspaceLeaf } from 'obsidian';
import { AnalysisResult } from '../types';
import WriteGuardPlugin from '../main';

export const VIEW_TYPE_ANALYSIS = 'writeguard-analysis';

export class AnalysisView extends ItemView {
  plugin: WriteGuardPlugin;
  result: AnalysisResult | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: WriteGuardPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() { return VIEW_TYPE_ANALYSIS; }
  getDisplayText() { return 'WriteGuard'; }
  getIcon() { return 'shield-check'; }

  async onOpen() {
    this.renderEmpty();
  }

  updateResult(result: AnalysisResult) {
    this.result = result;
    this.render();
  }

  private renderEmpty() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass('writeguard-panel');
    
    const empty = container.createDiv('writeguard-empty');
    empty.createEl('h3', { text: '📝 WriteGuard' });
    empty.createEl('p', { text: '노트를 열고 분석을 시작하세요.' });
    empty.createEl('p', { text: '단축키: Cmd/Ctrl + P → "WriteGuard"' });
  }

  private render() {
    if (!this.result) return this.renderEmpty();

    const container = this.containerEl.children[1];
    container.empty();
    container.addClass('writeguard-panel');

    this.renderScoreSection(container);
    this.renderIssuesSection(container);
    this.renderSuggestionsSection(container);
    this.renderMetricsSection(container);
    this.renderActionsSection(container);
  }

  private renderScoreSection(container: Element) {
    const section = container.createDiv('writeguard-section score-section');
    
    const score = this.result!.humanScore;
    const target = this.plugin.settings.targetHumanScore;
    const status = score >= target ? 'good' : score >= 60 ? 'warning' : 'danger';
    
    section.createEl('h3', { text: '🎯 Human Score' });
    
    const scoreDisplay = section.createDiv('score-display');
    scoreDisplay.createEl('span', { 
      text: `${score}`, 
      cls: `score-value ${status}` 
    });
    scoreDisplay.createEl('span', { text: ' / 100' });

    const progressBar = section.createDiv('progress-bar');
    const fill = progressBar.createDiv('progress-fill');
    fill.addClass(status);
    fill.style.width = `${score}%`;

    const targetLine = progressBar.createDiv('target-line');
    targetLine.style.left = `${target}%`;

    if (score < target) {
      section.createEl('p', { 
        text: `목표 ${target}점까지 +${target - score}점 필요`,
        cls: 'score-hint'
      });
    } else {
      section.createEl('p', { 
        text: '✅ 목표 달성! 자연스러운 글입니다.',
        cls: 'score-hint success'
      });
    }
  }

  private renderIssuesSection(container: Element) {
    const issues = this.result!.issues;
    if (issues.length === 0) return;

    const section = container.createDiv('writeguard-section');
    section.createEl('h3', { text: `🔴 수정 필요 (${issues.length}개)` });

    const list = section.createDiv('issues-list');
    issues.slice(0, 5).forEach(issue => {
      const item = list.createDiv('issue-item');
      item.addClass(issue.severity);
      
      const header = item.createDiv('issue-header');
      const severityBadge = header.createEl('span', { 
        text: issue.severity === 'high' ? '높음' : issue.severity === 'medium' ? '중간' : '낮음',
        cls: `severity-badge ${issue.severity}`
      });
      
      item.createEl('p', { text: `"${issue.text.substring(0, 50)}..."`, cls: 'issue-text' });
      item.createEl('p', { text: issue.description, cls: 'issue-desc' });
    });
  }

  private renderSuggestionsSection(container: Element) {
    const suggestions = this.result!.suggestions;
    if (suggestions.length === 0) return;

    const section = container.createDiv('writeguard-section');
    section.createEl('h3', { text: '💡 개선 제안' });

    const list = section.createDiv('suggestions-list');
    suggestions.forEach(sug => {
      const item = list.createDiv('suggestion-item');
      
      item.createEl('p', { text: sug.reason, cls: 'suggestion-reason' });
      
      if (sug.original && sug.suggested) {
        const comparison = item.createDiv('suggestion-comparison');
        comparison.createEl('div', { text: `❌ ${sug.original}`, cls: 'original' });
        comparison.createEl('div', { text: `✅ ${sug.suggested}`, cls: 'suggested' });
      }
    });
  }

  private renderMetricsSection(container: Element) {
    const metrics = this.result!.metrics;
    const section = container.createDiv('writeguard-section metrics-section');
    section.createEl('h3', { text: '📊 세부 지표' });

    const grid = section.createDiv('metrics-grid');

    this.renderMetric(grid, '어휘 다양성', metrics.vocabularyDiversity, '%');
    this.renderMetric(grid, '문장 변화도', metrics.sentenceVariance, '');
    this.renderMetric(grid, 'AI 패턴', metrics.aiPatternCount, '개', true);
    this.renderMetric(grid, '개인화 수준', metrics.personalExpressionScore, '%');
    this.renderMetric(grid, '반복률', metrics.repetitionRate, '%', true);
  }

  private renderMetric(container: Element, label: string, value: number, unit: string, inverse = false) {
    const item = container.createDiv('metric-item');
    const status = inverse 
      ? (value <= 20 ? 'good' : value <= 50 ? 'warning' : 'danger')
      : (value >= 60 ? 'good' : value >= 40 ? 'warning' : 'danger');
    
    item.createEl('span', { text: label, cls: 'metric-label' });
    item.createEl('span', { 
      text: `${Math.round(value)}${unit}`, 
      cls: `metric-value ${status}` 
    });
  }

  private renderActionsSection(container: Element) {
    const section = container.createDiv('writeguard-section actions-section');
    
    const aiBtn = section.createEl('button', { text: '🤖 AI 정밀 분석', cls: 'action-btn primary' });
    aiBtn.onclick = () => this.plugin.analyzeWithAI();

    const copyBtn = section.createEl('button', { text: '📋 Claude Code 프롬프트 복사', cls: 'action-btn' });
    copyBtn.onclick = () => this.plugin.copyClaudeCodePrompt();

    const refreshBtn = section.createEl('button', { text: '🔄 다시 분석', cls: 'action-btn' });
    refreshBtn.onclick = () => this.plugin.analyzeCurrentNote();

    const sourceInfo = section.createDiv('source-info');
    sourceInfo.createEl('span', { 
      text: `분석: ${this.result!.source === 'local' ? '로컬' : 'AI'} | ${new Date(this.result!.analyzedAt).toLocaleTimeString()}`
    });
  }

  async onClose() {}
}
