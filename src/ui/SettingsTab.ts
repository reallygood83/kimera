import { App, PluginSettingTab, Setting } from 'obsidian';
import WriteGuardPlugin from '../main';
import { AIProviderType, AVAILABLE_MODELS } from '../types';

export class WriteGuardSettingTab extends PluginSettingTab {
  plugin: WriteGuardPlugin;

  constructor(app: App, plugin: WriteGuardPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h1', { text: 'WriteGuard 설정' });

    containerEl.createEl('h2', { text: 'AI 제공자' });

    new Setting(containerEl)
      .setName('AI 제공자')
      .setDesc('분석에 사용할 AI 서비스 선택')
      .addDropdown(dropdown => dropdown
        .addOption('anthropic', 'Anthropic (Claude)')
        .addOption('openai', 'OpenAI (GPT)')
        .addOption('gemini', 'Google (Gemini)')
        .addOption('cerebras', 'Cerebras (Llama)')
        .setValue(this.plugin.settings.apiProvider)
        .onChange(async (value) => {
          this.plugin.settings.apiProvider = value as AIProviderType;
          await this.plugin.saveSettings();
          this.display();
        })
      );

    const provider = this.plugin.settings.apiProvider;

    new Setting(containerEl)
      .setName(`${this.getProviderName(provider)} API Key`)
      .setDesc('API 키를 입력하세요')
      .addText(text => text
        .setPlaceholder('API Key...')
        .setValue(this.plugin.settings.apiKeys[provider])
        .onChange(async (value) => {
          this.plugin.settings.apiKeys[provider] = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('모델')
      .setDesc('사용할 모델 선택')
      .addDropdown(dropdown => {
        this.getModelsForProvider(provider).forEach(model => {
          dropdown.addOption(model, model);
        });
        return dropdown
          .setValue(this.plugin.settings.selectedModel[provider])
          .onChange(async (value) => {
            this.plugin.settings.selectedModel[provider] = value;
            await this.plugin.saveSettings();
          });
      });

    containerEl.createEl('h2', { text: '분석 설정' });

    new Setting(containerEl)
      .setName('자동 분석')
      .setDesc('타이핑 중 실시간 분석 (로컬)')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoAnalyze)
        .onChange(async (value) => {
          this.plugin.settings.autoAnalyze = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('분석 지연')
      .setDesc('타이핑 후 분석까지 대기 시간 (ms)')
      .addSlider(slider => slider
        .setLimits(500, 3000, 100)
        .setValue(this.plugin.settings.autoAnalyzeDelay)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.autoAnalyzeDelay = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('목표 Human Score')
      .setDesc('이 점수 이상이면 안전')
      .addSlider(slider => slider
        .setLimits(60, 95, 5)
        .setValue(this.plugin.settings.targetHumanScore)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.targetHumanScore = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('언어')
      .setDesc('분석 대상 언어')
      .addDropdown(dropdown => dropdown
        .addOption('ko', '한국어')
        .addOption('en', 'English')
        .setValue(this.plugin.settings.language)
        .onChange(async (value) => {
          this.plugin.settings.language = value as 'ko' | 'en';
          await this.plugin.saveSettings();
        })
      );

    containerEl.createEl('h2', { text: 'UI 설정' });

    new Setting(containerEl)
      .setName('인라인 하이라이트')
      .setDesc('에디터에서 문제 구간 표시')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showInlineHighlights)
        .onChange(async (value) => {
          this.plugin.settings.showInlineHighlights = value;
          await this.plugin.saveSettings();
        })
      );

    containerEl.createEl('h2', { text: '💡 사용 팁' });
    
    const tips = containerEl.createDiv('writeguard-tips');
    tips.innerHTML = `
      <ul>
        <li><strong>무료 사용:</strong> API 없이도 로컬 분석 가능</li>
        <li><strong>Claude Code 사용자:</strong> 프롬프트 복사 기능으로 API 비용 없이 정밀 분석</li>
        <li><strong>비용 절약:</strong> 로컬에서 먼저 확인 후, 필요할 때만 AI 분석</li>
        <li><strong>Cerebras:</strong> 빠른 응답 속도, Llama 4 모델 지원</li>
      </ul>
    `;
  }

  private getProviderName(provider: AIProviderType): string {
    const names: Record<AIProviderType, string> = {
      anthropic: 'Anthropic',
      openai: 'OpenAI',
      gemini: 'Google',
      cerebras: 'Cerebras'
    };
    return names[provider];
  }

  private getModelsForProvider(provider: AIProviderType): string[] {
    return AVAILABLE_MODELS[provider];
  }
}
