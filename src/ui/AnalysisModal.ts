import { Modal, App, ButtonComponent, Notice, MarkdownView, Setting } from 'obsidian';
import { AnalysisResult, AIProviderType, AVAILABLE_MODELS } from '../types';
import WriteGuardPlugin from '../main';

type ViewMode = 'menu' | 'analysis' | 'comparison' | 'settings';

export class AnalysisModal extends Modal {
  private plugin: WriteGuardPlugin;
  private beforeResult: AnalysisResult | null = null;
  private afterResult: AnalysisResult | null = null;
  private originalText: string = '';
  private humanizedText: string = '';
  private currentView: ViewMode = 'menu';

  constructor(app: App, plugin: WriteGuardPlugin) {
    super(app);
    this.plugin = plugin;
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('writeguard-modal');
    this.renderMainMenu();
  }

  private renderMainMenu() {
    const { contentEl } = this;
    contentEl.empty();
    this.currentView = 'menu';

    const header = contentEl.createDiv('wg-modal-header');
    header.createEl('h2', { text: 'Kimera' });
    
    const settingsBtn = header.createEl('button', { cls: 'wg-settings-btn' });
    settingsBtn.innerHTML = '⚙️';
    settingsBtn.onclick = () => this.renderSettingsView();

    const provider = this.plugin.settings.apiProvider;
    const hasKey = !!this.plugin.settings.apiKeys[provider];
    
    const statusBar = contentEl.createDiv('wg-status-bar');
    if (hasKey) {
      statusBar.createEl('span', { 
        text: `✅ ${this.getProviderName(provider)} (${this.plugin.settings.selectedModel[provider]})`,
        cls: 'status-ok'
      });
    } else {
      statusBar.createEl('span', { 
        text: '⚠️ API 키를 설정하세요',
        cls: 'status-warn'
      });
    }

    if (!hasKey) {
      this.renderNoApiKeyView(contentEl);
      return;
    }

    const menuGrid = contentEl.createDiv('wg-menu-grid');

    this.createMenuCard(menuGrid, {
      icon: '🔍',
      title: 'AI 분석',
      desc: 'AI가 텍스트 분석',
      action: () => this.runAIAnalysis(),
      highlight: true
    });

    this.createMenuCard(menuGrid, {
      icon: '✨',
      title: 'Humanize',
      desc: 'AI 텍스트 자연스럽게',
      action: () => this.runFullHumanize()
    });

    this.createMenuCard(menuGrid, {
      icon: '✂️',
      title: '선택 영역',
      desc: '선택한 부분만 수정',
      action: () => this.runSelectionHumanize()
    });

    this.createMenuCard(menuGrid, {
      icon: '📋',
      title: '프롬프트 복사',
      desc: 'Claude Code용',
      action: () => this.showPromptOptions()
    });
  }

  private renderNoApiKeyView(contentEl: HTMLElement) {
    const noKeyDiv = contentEl.createDiv('wg-no-api-key');
    noKeyDiv.createEl('p', { text: 'AI 분석을 사용하려면 API 키가 필요합니다.' });
    
    new ButtonComponent(noKeyDiv)
      .setButtonText('⚙️ API 키 설정')
      .setCta()
      .onClick(() => this.renderSettingsView());

    noKeyDiv.createEl('hr');
    noKeyDiv.createEl('h4', { text: '📋 무료 대안: 프롬프트 복사' });
    noKeyDiv.createEl('p', { 
      text: 'Claude Code나 ChatGPT에 프롬프트를 복사해서 무료로 분석할 수 있습니다.',
      cls: 'wg-hint'
    });

    const btnRow = noKeyDiv.createDiv('wg-btn-row');
    new ButtonComponent(btnRow)
      .setButtonText('분석 프롬프트 복사')
      .onClick(() => this.copyAnalysisPrompt());
    new ButtonComponent(btnRow)
      .setButtonText('Humanize 프롬프트 복사')
      .onClick(() => this.copyHumanizePrompt());
  }

  private showPromptOptions() {
    const { contentEl } = this;
    contentEl.empty();

    const header = contentEl.createDiv('wg-header-row');
    new ButtonComponent(header)
      .setButtonText('← 뒤로')
      .onClick(() => this.renderMainMenu());
    header.createEl('h2', { text: '📋 프롬프트 복사' });

    const desc = contentEl.createDiv('wg-prompt-desc');
    desc.createEl('p', { text: 'Claude Code, ChatGPT 등에 붙여넣기하세요.' });

    const btnCol = contentEl.createDiv('wg-btn-col');
    
    new ButtonComponent(btnCol)
      .setButtonText('🔍 분석 프롬프트 복사')
      .setCta()
      .onClick(() => this.copyAnalysisPrompt());
    
    new ButtonComponent(btnCol)
      .setButtonText('✨ Humanize 프롬프트 복사')
      .onClick(() => this.copyHumanizePrompt());
  }

  private createMenuCard(container: Element, opts: {
    icon: string;
    title: string;
    desc: string;
    action: () => void;
    highlight?: boolean;
    disabled?: boolean;
  }) {
    const card = container.createDiv('wg-menu-card');
    if (opts.highlight) card.addClass('highlight');
    if (opts.disabled) card.addClass('disabled');

    card.createEl('span', { text: opts.icon, cls: 'wg-card-icon' });
    card.createEl('span', { text: opts.title, cls: 'wg-card-title' });
    card.createEl('span', { text: opts.desc, cls: 'wg-card-desc' });

    if (!opts.disabled) {
      card.onclick = opts.action;
    }
  }

  private renderSettingsView() {
    const { contentEl } = this;
    contentEl.empty();
    this.currentView = 'settings';

    const header = contentEl.createDiv('wg-header-row');
    new ButtonComponent(header)
      .setButtonText('← 뒤로')
      .onClick(() => this.renderMainMenu());
    header.createEl('h2', { text: '⚙️ 설정' });

    const settingsContainer = contentEl.createDiv('wg-settings-container');

    new Setting(settingsContainer)
      .setName('AI 제공자')
      .addDropdown(dropdown => {
        dropdown
          .addOption('anthropic', 'Anthropic (Claude)')
          .addOption('openai', 'OpenAI (GPT)')
          .addOption('gemini', 'Google (Gemini)')
          .addOption('cerebras', 'Cerebras (Llama)')
          .setValue(this.plugin.settings.apiProvider)
          .onChange(async (value) => {
            this.plugin.settings.apiProvider = value as AIProviderType;
            await this.plugin.saveSettings();
            this.renderSettingsView();
          });
      });

    const provider = this.plugin.settings.apiProvider;

    new Setting(settingsContainer)
      .setName('API 키')
      .setDesc(this.plugin.settings.apiKeys[provider] ? '✅ 설정됨' : '❌ 미설정')
      .addText(text => {
        text
          .setPlaceholder('sk-... 또는 API 키')
          .setValue(this.plugin.settings.apiKeys[provider])
          .onChange(async (value) => {
            this.plugin.settings.apiKeys[provider] = value;
            await this.plugin.saveSettings();
          });
        text.inputEl.type = 'password';
        text.inputEl.style.width = '200px';
      });

    new Setting(settingsContainer)
      .setName('모델')
      .addDropdown(dropdown => {
        AVAILABLE_MODELS[provider].forEach(model => {
          dropdown.addOption(model, model);
        });
        dropdown
          .setValue(this.plugin.settings.selectedModel[provider])
          .onChange(async (value) => {
            this.plugin.settings.selectedModel[provider] = value;
            await this.plugin.saveSettings();
          });
      });

    settingsContainer.createEl('hr');

    new Setting(settingsContainer)
      .setName('언어')
      .addDropdown(dropdown => {
        dropdown
          .addOption('ko', '한국어')
          .addOption('en', 'English')
          .setValue(this.plugin.settings.language)
          .onChange(async (value) => {
            this.plugin.settings.language = value as 'ko' | 'en';
            await this.plugin.saveSettings();
          });
      });

    const apiLinks = settingsContainer.createDiv('wg-api-links');
    apiLinks.createEl('h4', { text: '🔗 API 키 발급 링크' });
    const linkList = apiLinks.createEl('ul');
    
    const links = [
      { name: 'Anthropic', url: 'https://console.anthropic.com/' },
      { name: 'OpenAI', url: 'https://platform.openai.com/api-keys' },
      { name: 'Google AI', url: 'https://aistudio.google.com/app/apikey' },
      { name: 'Cerebras', url: 'https://cloud.cerebras.ai/' }
    ];
    
    links.forEach(link => {
      const li = linkList.createEl('li');
      li.createEl('a', { text: link.name, href: link.url });
    });
  }

  private getProviderName(provider: AIProviderType): string {
    const names: Record<AIProviderType, string> = {
      anthropic: 'Claude',
      openai: 'GPT',
      gemini: 'Gemini',
      cerebras: 'Llama'
    };
    return names[provider];
  }

  private async runAIAnalysis() {
    const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!mdView) {
      new Notice('열린 노트가 없습니다.');
      return;
    }

    this.originalText = mdView.editor.getValue();
    if (this.originalText.length < 50) {
      new Notice('텍스트가 너무 짧습니다. (최소 50자)');
      return;
    }

    if (!this.plugin.aiProvider) {
      new Notice('API 키를 설정해주세요.');
      this.renderSettingsView();
      return;
    }

    this.showProgress('🔍 AI 분석 중...', `${this.getProviderName(this.plugin.settings.apiProvider)}가 분석 중입니다...`);

    try {
      this.beforeResult = await this.plugin.aiProvider.analyze(this.originalText);
      this.renderAnalysisView();
    } catch (error) {
      this.showError('AI 분석 실패', (error as Error).message);
    }
  }

  private async runFullHumanize() {
    const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!mdView) {
      new Notice('열린 노트가 없습니다.');
      return;
    }

    this.originalText = mdView.editor.getValue();
    if (this.originalText.length < 50) {
      new Notice('텍스트가 너무 짧습니다. (최소 50자)');
      return;
    }

    if (!this.plugin.aiProvider) {
      const prompt = this.plugin.claudeCode.generateHumanizePrompt(this.originalText);
      await navigator.clipboard.writeText(prompt);
      new Notice('📋 Humanize 프롬프트가 복사되었습니다.');
      return;
    }

    this.showProgress('✨ Humanize 중...', 'AI가 텍스트를 자연스럽게 수정하고 있습니다...');

    try {
      this.humanizedText = await this.plugin.aiProvider.humanize(this.originalText);
      
      if (this.plugin.aiProvider) {
        this.beforeResult = await this.plugin.aiProvider.analyze(this.originalText);
        this.afterResult = await this.plugin.aiProvider.analyze(this.humanizedText);
      }
      
      this.renderComparisonView();
    } catch (error) {
      this.showError('Humanize 실패', (error as Error).message);
    }
  }

  private async runSelectionHumanize() {
    const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!mdView) {
      new Notice('열린 노트가 없습니다.');
      return;
    }

    const selectedText = mdView.editor.getSelection();
    if (!selectedText || selectedText.length < 20) {
      new Notice('텍스트를 선택해주세요. (최소 20자)');
      return;
    }

    if (!this.plugin.aiProvider) {
      const prompt = this.plugin.claudeCode.generateHumanizePrompt(selectedText);
      await navigator.clipboard.writeText(prompt);
      new Notice('📋 Humanize 프롬프트가 복사되었습니다.');
      return;
    }

    this.showProgress('✨ 선택 영역 Humanize 중...', '');

    try {
      const humanizedText = await this.plugin.aiProvider.humanize(selectedText);
      
      this.renderSelectionResult(selectedText, humanizedText);
    } catch (error) {
      this.showError('Humanize 실패', (error as Error).message);
    }
  }

  private renderSelectionResult(original: string, humanized: string) {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: '✅ Humanize 완료' });

    const comparison = contentEl.createDiv('wg-text-comparison');
    
    const beforeCol = comparison.createDiv('wg-text-col');
    beforeCol.createEl('h4', { text: '원본' });
    beforeCol.createEl('pre', { text: this.truncate(original, 400) });

    const afterCol = comparison.createDiv('wg-text-col');
    afterCol.createEl('h4', { text: 'Humanized' });
    afterCol.createEl('pre', { text: this.truncate(humanized, 400) });

    const actionsRow = contentEl.createDiv('wg-actions-final');

    new ButtonComponent(actionsRow)
      .setButtonText('✅ 적용')
      .setCta()
      .onClick(() => {
        const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (mdView) {
          mdView.editor.replaceSelection(humanized);
          new Notice('✅ 적용됨!');
          this.close();
        }
      });

    new ButtonComponent(actionsRow)
      .setButtonText('📋 복사')
      .onClick(async () => {
        await navigator.clipboard.writeText(humanized);
        new Notice('📋 복사됨!');
      });

    new ButtonComponent(actionsRow)
      .setButtonText('← 메뉴')
      .onClick(() => this.renderMainMenu());
  }

  private showProgress(title: string, subtitle: string) {
    const { contentEl } = this;
    contentEl.empty();
    
    const progressDiv = contentEl.createDiv('wg-progress-view');
    progressDiv.createEl('h2', { text: title });
    progressDiv.createEl('div', { cls: 'wg-spinner' });
    if (subtitle) {
      progressDiv.createEl('p', { text: subtitle, cls: 'wg-progress-status' });
    }
  }

  private showError(title: string, message: string) {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: `❌ ${title}` });
    contentEl.createEl('p', { text: message, cls: 'wg-error-msg' });

    const btnRow = contentEl.createDiv('wg-btn-row');
    new ButtonComponent(btnRow)
      .setButtonText('⚙️ 설정 확인')
      .onClick(() => this.renderSettingsView());
    new ButtonComponent(btnRow)
      .setButtonText('← 메뉴')
      .onClick(() => this.renderMainMenu());
  }

  private async copyAnalysisPrompt() {
    const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!mdView) {
      new Notice('열린 노트가 없습니다.');
      return;
    }

    const content = mdView.editor.getValue();
    const prompt = this.plugin.claudeCode.generateAnalysisPrompt(content);
    await navigator.clipboard.writeText(prompt);
    new Notice('📋 분석 프롬프트 복사됨!');
  }

  private async copyHumanizePrompt() {
    const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!mdView) {
      new Notice('열린 노트가 없습니다.');
      return;
    }

    const content = mdView.editor.getValue();
    const prompt = this.plugin.claudeCode.generateHumanizePrompt(content);
    await navigator.clipboard.writeText(prompt);
    new Notice('📋 Humanize 프롬프트 복사됨!');
  }

  private renderAnalysisView() {
    const { contentEl } = this;
    contentEl.empty();
    this.currentView = 'analysis';

    const header = contentEl.createDiv('wg-header-row');
    new ButtonComponent(header)
      .setButtonText('← 메뉴')
      .onClick(() => this.renderMainMenu());
    header.createEl('h2', { text: '🔍 AI 분석 결과' });

    if (!this.beforeResult) return;

    const scoreContainer = contentEl.createDiv('wg-score-container');
    this.renderScoreCard(scoreContainer, this.beforeResult);

    if (this.beforeResult.issues.length > 0) {
      const issuesContainer = contentEl.createDiv('wg-issues-container');
      this.renderIssues(issuesContainer, this.beforeResult);
    }

    if (this.beforeResult.suggestions.length > 0) {
      const suggestionsContainer = contentEl.createDiv('wg-suggestions-container');
      this.renderSuggestions(suggestionsContainer, this.beforeResult);
    }

    const actionsContainer = contentEl.createDiv('wg-actions-container');
    actionsContainer.createEl('h3', { text: '🚀 다음 단계' });

    const btnRow = actionsContainer.createDiv('wg-btn-row');

    new ButtonComponent(btnRow)
      .setButtonText('✨ Humanize')
      .setCta()
      .onClick(() => this.runFullHumanize());

    new ButtonComponent(btnRow)
      .setButtonText('📋 프롬프트 복사')
      .onClick(() => this.copyHumanizePrompt());
  }

  private renderScoreCard(container: Element, result: AnalysisResult) {
    const card = container.createDiv('wg-score-card');

    const score = result.humanScore;
    const status = score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'warning' : 'danger';
    
    const scoreEl = card.createDiv('wg-score');
    scoreEl.addClass(status);
    scoreEl.createEl('span', { text: `${score}`, cls: 'wg-score-value' });
    scoreEl.createEl('span', { text: '/100', cls: 'wg-score-max' });

    const statusTexts: Record<string, string> = {
      excellent: '✅ 자연스러움 - AI 탐지 우회 가능',
      good: '👍 양호 - 약간의 수정 권장',
      warning: '⚠️ AI 의심 - 수정 필요',
      danger: '🔴 AI 감지 위험 - Humanize 필수'
    };
    card.createEl('p', { text: statusTexts[status], cls: `wg-status ${status}` });
  }

  private renderIssues(container: Element, result: AnalysisResult) {
    container.createEl('h3', { text: `🔍 문제점 (${result.issues.length}개)` });
    
    const list = container.createDiv('wg-issues-list');
    result.issues.slice(0, 5).forEach(issue => {
      const item = list.createDiv('wg-issue-item');
      item.addClass(issue.severity);
      
      item.createEl('span', { 
        text: `"${issue.text.substring(0, 50)}..."`,
        cls: 'wg-issue-text'
      });
      item.createEl('p', { text: issue.description, cls: 'wg-issue-desc' });
    });
  }

  private renderSuggestions(container: Element, result: AnalysisResult) {
    container.createEl('h3', { text: '💡 개선 제안' });
    
    const list = container.createDiv('wg-suggestions-list');
    result.suggestions.slice(0, 5).forEach(sug => {
      const item = list.createDiv('wg-suggestion-item');
      
      if (sug.original && sug.suggested) {
        item.createEl('div', { text: `❌ ${sug.original}`, cls: 'wg-sug-original' });
        item.createEl('div', { text: `✅ ${sug.suggested}`, cls: 'wg-sug-suggested' });
      }
      item.createEl('p', { text: sug.reason, cls: 'wg-sug-reason' });
    });
  }

  private renderComparisonView() {
    const { contentEl } = this;
    contentEl.empty();
    this.currentView = 'comparison';

    contentEl.createEl('h2', { text: '📊 Before / After' });

    const comparison = contentEl.createDiv('wg-comparison');
    
    const beforeCol = comparison.createDiv('wg-compare-col');
    beforeCol.createEl('h4', { text: 'Before' });
    if (this.beforeResult) {
      this.renderCompareScore(beforeCol, this.beforeResult);
    }
    
    const arrow = comparison.createDiv('wg-compare-arrow');
    if (this.beforeResult && this.afterResult) {
      const diff = this.afterResult.humanScore - this.beforeResult.humanScore;
      arrow.createEl('span', { 
        text: diff > 0 ? `+${diff}` : `${diff}`,
        cls: diff > 0 ? 'positive' : 'neutral'
      });
    }
    arrow.createEl('span', { text: '→', cls: 'arrow-icon' });

    const afterCol = comparison.createDiv('wg-compare-col');
    afterCol.createEl('h4', { text: 'After' });
    if (this.afterResult) {
      this.renderCompareScore(afterCol, this.afterResult);
    }

    const textComparison = contentEl.createDiv('wg-text-comparison');
    
    const beforeText = textComparison.createDiv('wg-text-col');
    beforeText.createEl('h4', { text: '원본' });
    beforeText.createEl('pre', { text: this.truncate(this.originalText, 400) });

    const afterText = textComparison.createDiv('wg-text-col');
    afterText.createEl('h4', { text: 'Humanized' });
    afterText.createEl('pre', { text: this.truncate(this.humanizedText, 400) });

    const actionsRow = contentEl.createDiv('wg-actions-final');

    new ButtonComponent(actionsRow)
      .setButtonText('✅ 적용')
      .setCta()
      .onClick(() => this.applyHumanized());

    new ButtonComponent(actionsRow)
      .setButtonText('📋 복사')
      .onClick(async () => {
        await navigator.clipboard.writeText(this.humanizedText);
        new Notice('📋 복사됨!');
      });

    new ButtonComponent(actionsRow)
      .setButtonText('← 메뉴')
      .onClick(() => this.renderMainMenu());
  }

  private renderCompareScore(container: Element, result: AnalysisResult) {
    const score = result.humanScore;
    const status = score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'warning' : 'danger';
    
    const scoreEl = container.createDiv('wg-compare-score');
    scoreEl.addClass(status);
    scoreEl.createEl('span', { text: `${score}`, cls: 'score-num' });
  }

  private applyHumanized() {
    const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (mdView) {
      mdView.editor.setValue(this.humanizedText);
      new Notice('✅ 적용됨!');
      this.close();
    }
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
