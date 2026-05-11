import type { Settings } from 'sigma/settings';
import type { NodeDisplayData, PartialButFor } from 'sigma/types';
import type { ThemeTokens } from './styling';

const LABEL_FONT_SIZE = 12;
const LABEL_PADDING_X = 6;
const LABEL_PADDING_Y = 3;
const LABEL_RADIUS = 4;
const LABEL_OFFSET = 4;

type LabelData = PartialButFor<NodeDisplayData, 'x' | 'y' | 'size' | 'label' | 'color'>;

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function drawPillLabel(
  ctx: CanvasRenderingContext2D,
  data: LabelData,
  settings: Settings,
  tokens: ThemeTokens,
  isHover: boolean,
): void {
  if (!data.label) return;

  const fontSize = settings.labelSize ?? LABEL_FONT_SIZE;
  const fontWeight = isHover ? '600' : (settings.labelWeight ?? '500');
  const font = `${fontWeight} ${fontSize}px ${settings.labelFont ?? 'system-ui, sans-serif'}`;

  ctx.font = font;
  const textWidth = ctx.measureText(data.label).width;

  const w = textWidth + LABEL_PADDING_X * 2;
  const h = fontSize + LABEL_PADDING_Y * 2;
  const x = data.x + data.size + LABEL_OFFSET;
  const y = data.y - h / 2;

  if (isHover) {
    ctx.shadowColor = tokens.labelShadow;
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 1;
  }

  roundedRect(ctx, x, y, w, h, LABEL_RADIUS);
  ctx.fillStyle = tokens.labelBackground;
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.lineWidth = 1;
  ctx.strokeStyle = tokens.labelBorder;
  ctx.stroke();

  ctx.fillStyle = tokens.labelColor;
  ctx.textBaseline = 'middle';
  ctx.fillText(data.label, x + LABEL_PADDING_X, y + h / 2);
}

export function makeNodeLabelRenderer(tokens: ThemeTokens) {
  return (
    ctx: CanvasRenderingContext2D,
    data: PartialButFor<NodeDisplayData, 'x' | 'y' | 'size' | 'label' | 'color'>,
    settings: Settings,
  ): void => {
    drawPillLabel(ctx, data, settings, tokens, false);
  };
}

export function makeNodeHoverRenderer(tokens: ThemeTokens) {
  return (
    ctx: CanvasRenderingContext2D,
    data: PartialButFor<NodeDisplayData, 'x' | 'y' | 'size' | 'label' | 'color'>,
    settings: Settings,
  ): void => {
    drawPillLabel(ctx, data, settings, tokens, true);
  };
}
