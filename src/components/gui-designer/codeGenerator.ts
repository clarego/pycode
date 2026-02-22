import type { FormState, PlacedWidget } from './types';
import { WIDGET_CATALOG } from './types';

export function generateTkinterCode(form: FormState): string {
  const lines: string[] = [];
  const indent = '    ';

  lines.push('import tkinter as tk');
  lines.push('from tkinter import ttk');
  lines.push('');

  const widgetsWithEvents = form.widgets.filter((w) => {
    const def = WIDGET_CATALOG.find((d) => d.type === w.type);
    return def && def.events.length > 0;
  });

  for (const w of widgetsWithEvents) {
    const def = WIDGET_CATALOG.find((d) => d.type === w.type)!;
    for (const evt of def.events) {
      const fnName = `${w.id}_${evt}`;
      lines.push(`def ${fnName}(${getEventParams(w.type, evt)}):`);
      const customCode = w.eventCode[evt];
      if (customCode && customCode.trim()) {
        for (const codeLine of customCode.split('\n')) {
          lines.push(`${indent}${codeLine}`);
        }
      } else {
        lines.push(`${indent}pass`);
      }
      lines.push('');
    }
  }

  lines.push('root = tk.Tk()');
  lines.push(`root.title("${escapeStr(form.title)}")`);
  lines.push(`root.geometry("${form.width}x${form.height}")`);
  lines.push(`root.resizable(False, False)`);
  if (form.bg && form.bg !== '#f0f0f0') {
    lines.push(`root.configure(bg="${form.bg}")`);
  }
  if (form.backgroundImage && !form.backgroundImage.startsWith('data:')) {
    lines.push('');
    lines.push('from PIL import Image, ImageTk');
    lines.push(`_bg_img_raw = Image.open("background.png").resize((${form.width}, ${form.height}), Image.LANCZOS)`);
    lines.push('_bg_img = ImageTk.PhotoImage(_bg_img_raw)');
    lines.push(`_bg_label = tk.Label(root, image=_bg_img)`);
    lines.push('_bg_label.place(x=0, y=0, width=' + form.width + ', height=' + form.height + ')');
    lines.push('_bg_label.lower()');
  }
  lines.push('');

  const varDeclarations: string[] = [];

  for (const w of form.widgets) {
    const varLines = generateVariableDeclarations(w);
    varDeclarations.push(...varLines);
  }

  if (varDeclarations.length > 0) {
    lines.push(...varDeclarations);
    lines.push('');
  }

  for (const w of form.widgets) {
    lines.push(...generateWidgetCode(w));
    lines.push(`${w.id}.place(x=${w.x}, y=${w.y}, width=${w.width}, height=${w.height})`);
    lines.push('');
  }

  lines.push('root.mainloop()');
  lines.push('');

  return lines.join('\n');
}

function generateVariableDeclarations(w: PlacedWidget): string[] {
  const lines: string[] = [];
  if (w.type === 'Checkbutton') {
    const varName = (w.props.variable as string) || `${w.id}_var`;
    lines.push(`${varName} = tk.BooleanVar()`);
  } else if (w.type === 'Radiobutton') {
    const varName = (w.props.variable as string) || `${w.id}_var`;
    lines.push(`${varName} = tk.StringVar(value="${escapeStr(String(w.props.value || '1'))}")`);
  } else if (w.type === 'Scale') {
    lines.push(`${w.id}_var = tk.DoubleVar(value=${w.props.from_val || 0})`);
  } else if (w.type === 'Entry') {
    lines.push(`${w.id}_var = tk.StringVar()`);
  }
  return lines;
}

function generateWidgetCode(w: PlacedWidget): string[] {
  const lines: string[] = [];
  const def = WIDGET_CATALOG.find((d) => d.type === w.type);

  switch (w.type) {
    case 'Button': {
      const cmdArg = def?.events.includes('command') ? `, command=${w.id}_command` : '';
      lines.push(
        `${w.id} = tk.Button(root, text="${escapeStr(String(w.props.text))}", bg="${w.props.bg}", fg="${w.props.fg}", font=("Arial", ${w.props.font_size})${cmdArg})`
      );
      break;
    }
    case 'Label':
      lines.push(
        `${w.id} = tk.Label(root, text="${escapeStr(String(w.props.text))}", fg="${w.props.fg}", font=("Arial", ${w.props.font_size}))`
      );
      break;
    case 'Entry':
      lines.push(
        `${w.id} = tk.Entry(root, textvariable=${w.id}_var, font=("Arial", ${w.props.font_size}))`
      );
      break;
    case 'Text':
      lines.push(
        `${w.id} = tk.Text(root, font=("Arial", ${w.props.font_size}), wrap="word")`
      );
      break;
    case 'Checkbutton': {
      const varName = (w.props.variable as string) || `${w.id}_var`;
      const cmdArg = def?.events.includes('command') ? `, command=${w.id}_command` : '';
      lines.push(
        `${w.id} = tk.Checkbutton(root, text="${escapeStr(String(w.props.text))}", variable=${varName}, font=("Arial", ${w.props.font_size})${cmdArg})`
      );
      break;
    }
    case 'Radiobutton': {
      const varName = (w.props.variable as string) || `${w.id}_var`;
      const cmdArg = def?.events.includes('command') ? `, command=${w.id}_command` : '';
      lines.push(
        `${w.id} = tk.Radiobutton(root, text="${escapeStr(String(w.props.text))}", variable=${varName}, value="${escapeStr(String(w.props.value))}", font=("Arial", ${w.props.font_size})${cmdArg})`
      );
      break;
    }
    case 'Listbox':
      lines.push(
        `${w.id} = tk.Listbox(root, font=("Arial", ${w.props.font_size}))`
      );
      {
        const items = ((w.props.items as string) || '').split(',').filter(Boolean);
        for (const item of items) {
          lines.push(`${w.id}.insert(tk.END, "${escapeStr(item.trim())}")`);
        }
      }
      if (def?.events.includes('on_select')) {
        lines.push(`${w.id}.bind("<<ListboxSelect>>", ${w.id}_on_select)`);
      }
      break;
    case 'Scale':
      lines.push(
        `${w.id} = tk.Scale(root, from_=${w.props.from_val}, to=${w.props.to_val}, orient="${w.props.orient}", variable=${w.id}_var${def?.events.includes('command') ? `, command=${w.id}_command` : ''})`
      );
      break;
    case 'Combobox': {
      const vals = ((w.props.values as string) || '')
        .split(',')
        .map((v) => `"${escapeStr(v.trim())}"`)
        .join(', ');
      lines.push(
        `${w.id} = ttk.Combobox(root, values=[${vals}], font=("Arial", ${w.props.font_size}))`
      );
      if (def?.events.includes('on_select')) {
        lines.push(`${w.id}.bind("<<ComboboxSelected>>", ${w.id}_on_select)`);
      }
      break;
    }
    case 'LabelFrame':
      lines.push(
        `${w.id} = tk.LabelFrame(root, text="${escapeStr(String(w.props.text))}", font=("Arial", ${w.props.font_size}))`
      );
      break;
    case 'Canvas':
      lines.push(
        `${w.id} = tk.Canvas(root, bg="${w.props.bg}")`
      );
      if (def?.events.includes('on_click')) {
        lines.push(`${w.id}.bind("<Button-1>", ${w.id}_on_click)`);
      }
      break;
    case 'Progressbar':
      lines.push(
        `${w.id} = ttk.Progressbar(root, value=${w.props.value}, maximum=${w.props.maximum}, orient="${w.props.orient}")`
      );
      break;
    default:
      lines.push(`${w.id} = tk.Frame(root)`);
  }

  return lines;
}

function getEventParams(widgetType: string, event: string): string {
  if (event === 'on_select' || event === 'on_click' || event === 'on_change') return 'event';
  if (event === 'command' && widgetType === 'Scale') return 'value';
  return '';
}

function escapeStr(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}
