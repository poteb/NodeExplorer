import type { Theme } from '@/state/store';

export interface ThemeTokens {
  background: string;
  nodeFill: string;
  nodeFillSelected: string;
  edgeColor: string;
  edgeColorHighlight: string;
  labelColor: string;
  labelBackground: string;
  labelBorder: string;
  labelShadow: string;
}

export function tokensFor(theme: Theme): ThemeTokens {
  if (theme === 'dark') {
    return {
      background: '#0a0a0a',
      nodeFill: '#7dd3fc',
      nodeFillSelected: '#fde68a',
      edgeColor: '#3f3f46',
      edgeColorHighlight: '#fde68a',
      labelColor: '#f5f5f5',
      labelBackground: 'rgba(23, 23, 23, 0.92)',
      labelBorder: 'rgba(82, 82, 82, 0.9)',
      labelShadow: 'rgba(0, 0, 0, 0.6)',
    };
  }
  return {
    background: '#fafafa',
    nodeFill: '#0284c7',
    nodeFillSelected: '#d97706',
    edgeColor: '#d4d4d8',
    edgeColorHighlight: '#d97706',
    labelColor: '#0a0a0a',
    labelBackground: 'rgba(255, 255, 255, 0.95)',
    labelBorder: 'rgba(212, 212, 216, 0.9)',
    labelShadow: 'rgba(0, 0, 0, 0.08)',
  };
}
