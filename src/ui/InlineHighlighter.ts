import { 
  EditorView, 
  Decoration, 
  DecorationSet,
  ViewPlugin,
  ViewUpdate
} from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { AnalysisIssue } from '../types';

const issueHighlightMark = Decoration.mark({ class: 'writeguard-highlight-issue' });
const issueHighlightHigh = Decoration.mark({ class: 'writeguard-highlight-high' });
const issueHighlightMedium = Decoration.mark({ class: 'writeguard-highlight-medium' });
const issueHighlightLow = Decoration.mark({ class: 'writeguard-highlight-low' });

export class InlineHighlighter {
  private issues: AnalysisIssue[] = [];
  private enabled = true;

  setIssues(issues: AnalysisIssue[]) {
    this.issues = issues;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  getDecorations(view: EditorView): DecorationSet {
    if (!this.enabled || this.issues.length === 0) {
      return Decoration.none;
    }

    const builder = new RangeSetBuilder<Decoration>();
    const docText = view.state.doc.toString();

    const sortedIssues = [...this.issues]
      .filter(issue => issue.position.start > 0 || issue.text)
      .sort((a, b) => {
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

  private getDecorationForSeverity(severity: 'high' | 'medium' | 'low'): Decoration {
    switch (severity) {
      case 'high': return issueHighlightHigh;
      case 'medium': return issueHighlightMedium;
      case 'low': return issueHighlightLow;
      default: return issueHighlightMark;
    }
  }
}

export function createHighlighterExtension(highlighter: InlineHighlighter) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = highlighter.getDecorations(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = highlighter.getDecorations(update.view);
        }
      }
    },
    {
      decorations: v => v.decorations
    }
  );
}
