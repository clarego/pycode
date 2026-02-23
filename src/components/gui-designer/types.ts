export interface WidgetDef {
  type: string;
  label: string;
  icon: string;
  category: 'common' | 'input' | 'display' | 'container';
  defaultProps: Record<string, string | number | boolean>;
  defaultSize: { width: number; height: number };
  events: string[];
}

export interface PlacedWidget {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  props: Record<string, string | number | boolean>;
  eventCode: Record<string, string>;
}

export interface FormState {
  title: string;
  width: number;
  height: number;
  bg: string;
  backgroundImage: string;
  widgets: PlacedWidget[];
}

export const WIDGET_CATALOG: WidgetDef[] = [
  {
    type: 'Button',
    label: 'Button',
    icon: 'rect-btn',
    category: 'common',
    defaultProps: { text: 'Button', bg: '#0ea5e9', fg: '#ffffff', font_size: 10 },
    defaultSize: { width: 100, height: 32 },
    events: ['command'],
  },
  {
    type: 'Label',
    label: 'Label',
    icon: 'text',
    category: 'display',
    defaultProps: { text: 'Label', fg: '#000000', font_size: 10 },
    defaultSize: { width: 100, height: 24 },
    events: [],
  },
  {
    type: 'Entry',
    label: 'Text Field',
    icon: 'input',
    category: 'input',
    defaultProps: { placeholder: '', width_chars: 20, font_size: 10 },
    defaultSize: { width: 160, height: 28 },
    events: ['on_change'],
  },
  {
    type: 'Text',
    label: 'Text Area',
    icon: 'textarea',
    category: 'input',
    defaultProps: { width_chars: 30, height_lines: 5, font_size: 10 },
    defaultSize: { width: 220, height: 100 },
    events: [],
  },
  {
    type: 'Checkbutton',
    label: 'Checkbox',
    icon: 'check',
    category: 'input',
    defaultProps: { text: 'Checkbox', variable: '', font_size: 10 },
    defaultSize: { width: 120, height: 24 },
    events: ['command'],
  },
  {
    type: 'Radiobutton',
    label: 'Radio',
    icon: 'radio',
    category: 'input',
    defaultProps: { text: 'Option', value: '1', variable: '', font_size: 10 },
    defaultSize: { width: 120, height: 24 },
    events: ['command'],
  },
  {
    type: 'Listbox',
    label: 'List Box',
    icon: 'list',
    category: 'display',
    defaultProps: { items: 'Item 1,Item 2,Item 3', height_lines: 5, font_size: 10 },
    defaultSize: { width: 140, height: 100 },
    events: ['on_select'],
  },
  {
    type: 'Scale',
    label: 'Slider',
    icon: 'slider',
    category: 'input',
    defaultProps: { from_val: 0, to_val: 100, orient: 'horizontal' },
    defaultSize: { width: 160, height: 40 },
    events: ['command'],
  },
  {
    type: 'Combobox',
    label: 'Dropdown',
    icon: 'dropdown',
    category: 'input',
    defaultProps: { values: 'Option 1,Option 2,Option 3', font_size: 10 },
    defaultSize: { width: 140, height: 28 },
    events: ['on_select'],
  },
  {
    type: 'LabelFrame',
    label: 'Group Box',
    icon: 'frame',
    category: 'container',
    defaultProps: { text: 'Group', font_size: 10 },
    defaultSize: { width: 200, height: 120 },
    events: [],
  },
  {
    type: 'Canvas',
    label: 'Canvas',
    icon: 'canvas',
    category: 'display',
    defaultProps: { bg: '#ffffff' },
    defaultSize: { width: 200, height: 150 },
    events: ['on_click'],
  },
  {
    type: 'Progressbar',
    label: 'Progress Bar',
    icon: 'progress',
    category: 'display',
    defaultProps: { value: 50, maximum: 100, orient: 'horizontal' },
    defaultSize: { width: 200, height: 24 },
    events: [],
  },
];

let _nextId = 1;
export function generateWidgetId(type: string): string {
  const id = `${type.toLowerCase()}_${_nextId}`;
  _nextId++;
  return id;
}

export function resetIdCounter(): void {
  _nextId = 1;
}
