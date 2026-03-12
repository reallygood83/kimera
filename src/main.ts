import { Plugin, Notice, MarkdownView, Editor } from 'obsidian';
import { WriteGuardSettings, DEFAULT_SETTINGS, AnalysisResult } from './types';
import { LocalAnalyzer } from './analyzers/LocalAnalyzer';
import { AIProvider, ClaudeCodeIntegration } from './analyzers/AIProvider';
import { WriteGuardSettingTab } from './ui/SettingsTab';
import { AnalysisView, VIEW_TYPE_ANALYSIS } from './ui/AnalysisView';
import { InlineHighlighter, createHighlighterExtension } from './ui/InlineHighlighter';
import { AnalysisModal } from './ui/AnalysisModal';

export default class WriteGuardPlugin extends Plugin {
  settings: WriteGuardSettings;
  localAnalyzer: LocalAnalyzer;
  aiProvider: AIProvider | null = null;
  claudeCode: ClaudeCodeIntegration;
  lastResult: AnalysisResult | null = null;
  highlighter: InlineHighlighter;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  async onload() {
    await this.loadSettings();
    
    this.localAnalyzer = new LocalAnalyzer(this.settings.language);
    this.claudeCode = new ClaudeCodeIntegration();
    this.highlighter = new InlineHighlighter();
    this.highlighter.setEnabled(this.settings.showInlineHighlights);
    this.initAIProvider();

    this.registerEditorExtension(createHighlighterExtension(this.highlighter));

    this.registerView(VIEW_TYPE_ANALYSIS, (leaf) => new AnalysisView(leaf, this));

    this.addRibbonIcon('shield-check', 'WriteGuard 분석', () => {
      this.analyzeCurrentNote();
    });

    this.addCommand({
      id: 'analyze-note',
      name: '현재 노트 분석',
      callback: () => this.analyzeCurrentNote()
    });

    this.addCommand({
      id: 'analyze-with-ai',
      name: 'AI로 정밀 분석',
      callback: () => this.analyzeWithAI()
    });

    this.addCommand({
      id: 'humanize-selection',
      name: '선택 영역 Humanize',
      editorCallback: (editor: Editor) => this.humanizeSelection(editor)
    });

    this.addCommand({
      id: 'copy-claude-prompt',
      name: 'Claude Code용 프롬프트 복사',
      callback: () => this.copyClaudeCodePrompt()
    });

    this.addCommand({
      id: 'toggle-panel',
      name: '분석 패널 토글',
      callback: () => this.toggleAnalysisPanel()
    });

    this.addCommand({
      id: 'toggle-highlights',
      name: '인라인 하이라이트 토글',
      callback: () => this.toggleHighlights()
    });

    this.addCommand({
      id: 'open-analysis-modal',
      name: '분석 모달 열기 (Before/After)',
      callback: () => this.openAnalysisModal()
    });

    this.addSettingTab(new WriteGuardSettingTab(this.app, this));

    if (this.settings.autoAnalyze) {
      this.registerEvent(
        this.app.workspace.on('editor-change', () => this.onEditorChange())
      );
    }
  }

  private initAIProvider() {
    const provider = this.settings.apiProvider;
    const apiKey = this.settings.apiKeys[provider];
    
    if (apiKey) {
      this.aiProvider = new AIProvider(provider, {
        apiKey,
        model: this.settings.selectedModel[provider]
      });
    }
  }

  private onEditorChange() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    
    this.debounceTimer = setTimeout(() => {
      this.analyzeCurrentNote(true);
    }, this.settings.autoAnalyzeDelay);
  }

  async analyzeCurrentNote(silent = false) {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) {
      if (!silent) new Notice('열린 노트가 없습니다.');
      return;
    }

    const content = view.editor.getValue();
    if (content.length < 50) {
      if (!silent) new Notice('텍스트가 너무 짧습니다.');
      return;
    }

    this.lastResult = this.localAnalyzer.analyze(content);
    this.updateHighlights();
    this.updateAnalysisView();

    if (!silent) {
      const score = this.lastResult.humanScore;
      const emoji = score >= 85 ? '🟢' : score >= 60 ? '🟡' : '🔴';
      new Notice(`${emoji} Human Score: ${score}/100`);
    }
  }

  async analyzeWithAI() {
    if (!this.aiProvider) {
      new Notice('API 키를 설정해주세요. (설정 > WriteGuard)');
      return;
    }

    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) {
      new Notice('열린 노트가 없습니다.');
      return;
    }

    const content = view.editor.getValue();
    new Notice('AI 분석 중...');

    try {
      this.lastResult = await this.aiProvider.analyze(content);
      this.updateHighlights();
      this.updateAnalysisView();
      
      const score = this.lastResult.humanScore;
      const emoji = score >= 85 ? '🟢' : score >= 60 ? '🟡' : '🔴';
      new Notice(`${emoji} AI 분석 완료: ${score}/100`);
    } catch (error) {
      new Notice(`분석 실패: ${(error as Error).message}`);
    }
  }

  async humanizeSelection(editor: Editor) {
    const selection = editor.getSelection();
    if (!selection) {
      new Notice('텍스트를 선택해주세요.');
      return;
    }

    if (!this.aiProvider) {
      const prompt = this.claudeCode.generateHumanizePrompt(selection);
      await navigator.clipboard.writeText(prompt);
      new Notice('Humanize 프롬프트가 클립보드에 복사되었습니다. Claude Code에 붙여넣기하세요.');
      return;
    }

    new Notice('Humanize 중...');
    try {
      const humanized = await this.aiProvider.humanize(selection);
      editor.replaceSelection(humanized);
      new Notice('✅ Humanize 완료!');
    } catch (error) {
      new Notice(`실패: ${(error as Error).message}`);
    }
  }

  async copyClaudeCodePrompt() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) {
      new Notice('열린 노트가 없습니다.');
      return;
    }

    const content = view.editor.getValue();
    const prompt = this.claudeCode.generateAnalysisPrompt(content);
    await navigator.clipboard.writeText(prompt);
    new Notice('📋 프롬프트가 클립보드에 복사되었습니다!\nClaude Code에 붙여넣기하세요.');
  }

  async toggleAnalysisPanel() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_ANALYSIS);
    
    if (leaves.length > 0) {
      leaves.forEach(leaf => leaf.detach());
    } else {
      const leaf = this.app.workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.setViewState({ type: VIEW_TYPE_ANALYSIS, active: true });
        this.app.workspace.revealLeaf(leaf);
      }
    }
  }

  openAnalysisModal() {
    new AnalysisModal(this.app, this).open();
  }

  toggleHighlights() {
    this.settings.showInlineHighlights = !this.settings.showInlineHighlights;
    this.highlighter.setEnabled(this.settings.showInlineHighlights);
    this.saveSettings();
    this.refreshEditors();
    new Notice(this.settings.showInlineHighlights ? '🔴 하이라이트 활성화' : '⚪ 하이라이트 비활성화');
  }

  private updateHighlights() {
    if (this.lastResult) {
      this.highlighter.setIssues(this.lastResult.issues);
      this.refreshEditors();
    }
  }

  private refreshEditors() {
    this.app.workspace.iterateAllLeaves(leaf => {
      if (leaf.view instanceof MarkdownView) {
        // @ts-expect-error - accessing internal CM6 editor
        const cmEditor = leaf.view.editor?.cm;
        if (cmEditor) {
          cmEditor.dispatch({ effects: [] });
        }
      }
    });
  }

  private updateAnalysisView() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_ANALYSIS);
    leaves.forEach(leaf => {
      const view = leaf.view as AnalysisView;
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
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }
}
