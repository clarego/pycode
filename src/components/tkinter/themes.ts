export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  info: string;
  warning: string;
  danger: string;
  light: string;
  dark: string;
  bg: string;
  fg: string;
  selectbg: string;
  selectfg: string;
  border: string;
  inputfg: string;
  inputbg: string;
}

const THEMES: Record<string, ThemeColors> = {
  cosmo: {
    primary: '#2780e3',
    secondary: '#7E8081',
    success: '#3fb618',
    info: '#9954bb',
    warning: '#ff7518',
    danger: '#ff0039',
    light: '#F8F9FA',
    dark: '#373A3C',
    bg: '#ffffff',
    fg: '#373a3c',
    selectbg: '#7e8081',
    selectfg: '#ffffff',
    border: '#ced4da',
    inputfg: '#373a3c',
    inputbg: '#fdfdfe',
  },
  flatly: {
    primary: '#2c3e50',
    secondary: '#95a5a6',
    success: '#18bc9c',
    info: '#3498db',
    warning: '#f39c12',
    danger: '#e74c3c',
    light: '#ECF0F1',
    dark: '#7B8A8B',
    bg: '#ffffff',
    fg: '#212529',
    selectbg: '#95a5a6',
    selectfg: '#ffffff',
    border: '#ced4da',
    inputfg: '#212529',
    inputbg: '#ffffff',
  },
  darkly: {
    primary: '#375a7f',
    secondary: '#444444',
    success: '#00bc8c',
    info: '#3498db',
    warning: '#f39c12',
    danger: '#e74c3c',
    light: '#ADB5BD',
    dark: '#303030',
    bg: '#222222',
    fg: '#ffffff',
    selectbg: '#555555',
    selectfg: '#ffffff',
    border: '#222222',
    inputfg: '#ffffff',
    inputbg: '#2f2f2f',
  },
  superhero: {
    primary: '#4c9be8',
    secondary: '#4e5d6c',
    success: '#5cb85c',
    info: '#5bc0de',
    warning: '#f0ad4e',
    danger: '#d9534f',
    light: '#ABB6C2',
    dark: '#20374C',
    bg: '#2b3e50',
    fg: '#ffffff',
    selectbg: '#526170',
    selectfg: '#ffffff',
    border: '#222222',
    inputfg: '#ebebeb',
    inputbg: '#32465a',
  },
  litera: {
    primary: '#4582ec',
    secondary: '#adb5bd',
    success: '#02b875',
    info: '#17a2b8',
    warning: '#f0ad4e',
    danger: '#d9534f',
    light: '#F8F9FA',
    dark: '#343A40',
    bg: '#ffffff',
    fg: '#343a40',
    selectbg: '#adb5bd',
    selectfg: '#ffffff',
    border: '#bfbfbf',
    inputfg: '#343a40',
    inputbg: '#fff',
  },
  solar: {
    primary: '#268bd2',
    secondary: '#93a1a1',
    success: '#859900',
    info: '#2aa198',
    warning: '#cb4b16',
    danger: '#dc322f',
    light: '#eee8d5',
    dark: '#073642',
    bg: '#fdf6e3',
    fg: '#657b83',
    selectbg: '#93a1a1',
    selectfg: '#fdf6e3',
    border: '#d3cbb7',
    inputfg: '#657b83',
    inputbg: '#fdf6e3',
  },
  cyborg: {
    primary: '#2a9fd6',
    secondary: '#555555',
    success: '#77b300',
    info: '#9933cc',
    warning: '#ff8800',
    danger: '#cc0000',
    light: '#adafae',
    dark: '#222222',
    bg: '#060606',
    fg: '#ffffff',
    selectbg: '#555555',
    selectfg: '#ffffff',
    border: '#222222',
    inputfg: '#ffffff',
    inputbg: '#1a1a1a',
  },
  vapor: {
    primary: '#ea00d9',
    secondary: '#0abdc6',
    success: '#00efb7',
    info: '#711c91',
    warning: '#f57dff',
    danger: '#d8345f',
    light: '#ea00d9',
    dark: '#1a0933',
    bg: '#190933',
    fg: '#f5f5f5',
    selectbg: '#0abdc6',
    selectfg: '#190933',
    border: '#0abdc6',
    inputfg: '#f5f5f5',
    inputbg: '#0f0625',
  },
};

// Calculate hover state by darkening/lightening colors
function adjustColorBrightness(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) * (1 + percent)));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) * (1 + percent)));
  const b = Math.max(0, Math.min(255, (num & 0xff) * (1 + percent)));
  return '#' + ((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1);
}

export function getTheme(themeName: string = 'cosmo'): ThemeColors {
  return THEMES[themeName] || THEMES.cosmo;
}

export function getThemeWithHover(themeName: string = 'cosmo') {
  const theme = getTheme(themeName);
  const darkThemes = ['darkly', 'superhero', 'cyborg', 'vapor'];
  const isDark = darkThemes.includes(themeName);
  const hoverPercent = isDark ? 0.15 : -0.1;

  return {
    ...theme,
    primaryHover: adjustColorBrightness(theme.primary, hoverPercent),
    primaryPressed: adjustColorBrightness(theme.primary, hoverPercent * 1.5),
  };
}
