import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

export type IconName =
  | 'home'
  | 'wallet'
  | 'sliders'
  | 'plus'
  | 'minus'
  | 'barcode'
  | 'search'
  | 'chevronLeft'
  | 'chevronRight'
  | 'trash'
  | 'close'
  | 'check'
  | 'calendar'
  | 'pencil'
  | 'flame'
  | 'chart';

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  /** Remplit la forme au lieu de la tracer (utilisé pour la flamme de série). */
  filled?: boolean;
};

export function Icon({ name, size = 22, color, strokeWidth = 2, filled }: Props) {
  const t = useTheme();
  const stroke = color ?? t.text;
  const common = {
    stroke,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'home' && (
        <>
          <Path d="M3 10.5 12 3l9 7.5" {...common} />
          <Path d="M5.5 9.8V20h13V9.8" {...common} />
        </>
      )}

      {name === 'wallet' && (
        <>
          <Rect x={3} y={6} width={18} height={14} rx={3.5} {...common} />
          <Path d="M3 10h18" {...common} />
          <Circle cx={16.5} cy={15} r={1.4} fill={stroke} stroke="none" />
        </>
      )}

      {name === 'sliders' && (
        <>
          <Path d="M4 8h9M19 8h1M4 16h3M13 16h7" {...common} />
          <Circle cx={16} cy={8} r={2.4} {...common} />
          <Circle cx={10} cy={16} r={2.4} {...common} />
        </>
      )}

      {name === 'plus' && <Path d="M12 5v14M5 12h14" {...common} />}
      {name === 'minus' && <Path d="M5 12h14" {...common} />}

      {name === 'barcode' && (
        <Path d="M4 5v14M8 5v14M11.5 5v14M15 5v14M20 5v14" {...common} />
      )}

      {name === 'search' && (
        <>
          <Circle cx={11} cy={11} r={7} {...common} />
          <Path d="m16.5 16.5 4 4" {...common} />
        </>
      )}

      {name === 'chevronLeft' && <Path d="m15 5-7 7 7 7" {...common} />}
      {name === 'chevronRight' && <Path d="m9 5 7 7-7 7" {...common} />}

      {name === 'trash' && (
        <>
          <Path d="M4 7h16M9.5 7V4.8h5V7" {...common} />
          <Path d="M6.5 7 7.6 20h8.8L17.5 7" {...common} />
        </>
      )}

      {name === 'close' && <Path d="M6 6l12 12M18 6 6 18" {...common} />}
      {name === 'check' && <Path d="m5 12.5 5 5 9-11" {...common} />}

      {name === 'calendar' && (
        <>
          <Rect x={3} y={5} width={18} height={16} rx={3.5} {...common} />
          <Path d="M8 3v4M16 3v4M3 10h18" {...common} />
        </>
      )}

      {name === 'pencil' && (
        <>
          <Path d="M4 20.5 4.9 16 16 4.9l3.1 3.1L8 19.1z" {...common} />
          <Path d="m14.2 6.7 3.1 3.1" {...common} />
        </>
      )}

      {name === 'chart' && (
        <Path d="M5 20V12M12 20V4.5M19 20v-5.5" {...common} strokeWidth={strokeWidth + 0.4} />
      )}

      {name === 'flame' && (
        <Path
          d="M12 3s5.5 4.2 5.5 9a5.5 5.5 0 1 1-11 0c0-1.9 1-3.4 2-4.4.2 1.4 1 2.2 1.8 2.2 1.4 0 2-1.9 1.7-6.8z"
          {...common}
          fill={filled ? stroke : 'none'}
        />
      )}
    </Svg>
  );
}
