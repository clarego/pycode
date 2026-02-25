let pyodide = null;
let isRunning = false;
let stubsLoaded = false;
let inputSharedBuffer = null;
let inputSignalArray = null;
let inputDataArray = null;

const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/';

const TKINTER_STUB = `
import sys
import types
import json as _json

_tk_widgets = {}
_tk_root = None
_tk_callbacks = {}
_tk_vars = {}
_tk_var_traces = {}
_tk_canvas_items = {}
_tk_menu_items = {}
_tk_counter = 0
_tk_var_counter = 0

def _tk_next_id():
    global _tk_counter
    _tk_counter += 1
    return 'w' + str(_tk_counter)

def _tk_next_var_id():
    global _tk_var_counter
    _tk_var_counter += 1
    return 'v' + str(_tk_var_counter)

def _tk_send_tree():
    global _tk_root
    if _tk_root is None:
        return
    try:
        from js import postMessage
        tree = _tk_root._serialize()
        postMessage(type='tkinter-render', tree=_json.dumps(tree))
    except Exception:
        pass

class _TkVar:
    def __init__(self, master=None, value=None, name=None):
        self._id = _tk_next_var_id()
        self._value = value if value is not None else self._default_value()
        self._traces = []
        _tk_vars[self._id] = self

    def _default_value(self):
        return ''

    def get(self):
        return self._value

    def set(self, value):
        old = self._value
        self._value = value
        for cb in self._traces:
            try:
                cb()
            except Exception:
                pass
        if old != value:
            _tk_send_tree()

    def trace_add(self, mode, callback):
        self._traces.append(callback)
        return str(len(self._traces) - 1)

    def trace_remove(self, mode, cbname):
        pass

    def trace_info(self):
        return []

class _TkStringVar(_TkVar):
    def _default_value(self):
        return ''

class _TkIntVar(_TkVar):
    def _default_value(self):
        return 0
    def get(self):
        return int(self._value) if self._value else 0
    def set(self, value):
        super().set(int(value) if value else 0)

class _TkDoubleVar(_TkVar):
    def _default_value(self):
        return 0.0
    def get(self):
        return float(self._value) if self._value else 0.0
    def set(self, value):
        super().set(float(value) if value else 0.0)

class _TkBooleanVar(_TkVar):
    def _default_value(self):
        return False
    def get(self):
        return bool(self._value)
    def set(self, value):
        super().set(bool(value))

class _TkWidget:
    def __init__(self, master=None, widget_type='Widget', **kw):
        self._id = _tk_next_id()
        self._type = widget_type
        self._master = master
        self._children = []
        self._config = {}
        self._layout = None
        self._bindings = {}
        self._text_content = ''
        self._entry_content = ''
        self._items = []
        self._menu_config = []

        for k, v in kw.items():
            self._config[k] = v

        if 'command' in kw and callable(kw['command']):
            _tk_callbacks[self._id + ':command'] = kw['command']

        if 'variable' in kw and isinstance(kw['variable'], _TkVar):
            self._config['_var_id'] = kw['variable']._id

        if 'textvariable' in kw and isinstance(kw['textvariable'], _TkVar):
            self._config['_textvar_id'] = kw['textvariable']._id

        _tk_widgets[self._id] = self
        if master is not None and hasattr(master, '_children'):
            master._children.append(self)

    def pack(self, **kw):
        self._layout = {'manager': 'pack'}
        self._layout.update({k: str(v) for k, v in kw.items()})
        _tk_send_tree()
        return self

    def pack_forget(self):
        self._layout = None
        _tk_send_tree()

    def grid(self, **kw):
        self._layout = {'manager': 'grid'}
        self._layout.update({k: (str(v) if not isinstance(v, int) else v) for k, v in kw.items()})
        _tk_send_tree()
        return self

    def grid_forget(self):
        self._layout = None
        _tk_send_tree()

    def grid_remove(self):
        self._layout = None
        _tk_send_tree()

    def place(self, **kw):
        self._layout = {'manager': 'place'}
        self._layout.update({k: v for k, v in kw.items()})
        _tk_send_tree()
        return self

    def place_forget(self):
        self._layout = None
        _tk_send_tree()

    def config(self, **kw):
        for k, v in kw.items():
            self._config[k] = v
        if 'command' in kw and callable(kw['command']):
            _tk_callbacks[self._id + ':command'] = kw['command']
        if 'variable' in kw and isinstance(kw['variable'], _TkVar):
            self._config['_var_id'] = kw['variable']._id
        if 'textvariable' in kw and isinstance(kw['textvariable'], _TkVar):
            self._config['_textvar_id'] = kw['textvariable']._id
        _tk_send_tree()

    def configure(self, **kw):
        self.config(**kw)

    def cget(self, key):
        return self._config.get(key, '')

    def __setitem__(self, key, value):
        self._config[key] = value
        if key == 'command' and callable(value):
            _tk_callbacks[self._id + ':command'] = value
        _tk_send_tree()

    def __getitem__(self, key):
        return self._config.get(key, '')

    def keys(self):
        return list(self._config.keys())

    def destroy(self):
        if self._master and hasattr(self._master, '_children'):
            self._master._children = [c for c in self._master._children if c._id != self._id]
        if self._id in _tk_widgets:
            del _tk_widgets[self._id]
        _tk_send_tree()

    def bind(self, event, callback, add=None):
        if callable(callback):
            key = self._id + ':bind:' + event
            _tk_callbacks[key] = callback
            self._bindings[event] = key

    def unbind(self, event, funcid=None):
        key = self._id + ':bind:' + event
        if key in _tk_callbacks:
            del _tk_callbacks[key]
        if event in self._bindings:
            del self._bindings[event]

    def focus(self): pass
    def focus_set(self): pass
    def focus_get(self): return None
    def update(self): _tk_send_tree()
    def update_idletasks(self): _tk_send_tree()

    def after(self, ms, func=None, *args):
        if func and callable(func):
            aid = _tk_next_id()
            _tk_callbacks[aid + ':after'] = lambda: func(*args)
        return 0

    def after_cancel(self, id): pass
    def event_generate(self, event, **kw): pass
    def lift(self): pass
    def lower(self): pass

    def winfo_width(self): return 200
    def winfo_height(self): return 200
    def winfo_reqwidth(self): return 200
    def winfo_reqheight(self): return 30
    def winfo_x(self): return 0
    def winfo_y(self): return 0
    def winfo_exists(self): return True
    def winfo_children(self): return list(self._children)

    def pack_propagate(self, flag=True): pass
    def grid_propagate(self, flag=True): pass
    def rowconfigure(self, index, **kw): pass
    def columnconfigure(self, index, **kw): pass
    def grid_rowconfigure(self, index, **kw): pass
    def grid_columnconfigure(self, index, **kw): pass

    def _safe_config_val(self, k, v):
        if k in ('command',):
            return None
        if isinstance(v, _TkVar):
            return {'_var_ref': v._id, '_var_val': v.get()}
        if isinstance(v, _TkWidget):
            return None
        if isinstance(v, (str, int, float, bool)):
            return v
        if v is None:
            return None
        if isinstance(v, list):
            return v
        if isinstance(v, dict):
            return v
        return str(v)

    def _serialize(self):
        cfg = {}
        for k, v in self._config.items():
            sv = self._safe_config_val(k, v)
            if sv is not None:
                cfg[k] = sv

        if hasattr(self, '_entry_content') and self._entry_content is not None:
            cfg['_entry_value'] = self._entry_content

        if hasattr(self, '_text_content') and self._text_content is not None:
            cfg['_text_value'] = self._text_content

        if hasattr(self, '_items') and self._items:
            cfg['_listbox_items'] = self._items

        if hasattr(self, '_check_selected'):
            cfg['_check_selected'] = self._check_selected

        if hasattr(self, '_scale_value'):
            cfg['_scale_value'] = self._scale_value

        if '_var_id' in self._config:
            var = _tk_vars.get(self._config['_var_id'])
            if var:
                cfg['_var_value'] = var.get()
                cfg['_var_id'] = var._id

        if '_textvar_id' in self._config:
            var = _tk_vars.get(self._config['_textvar_id'])
            if var:
                cfg['_textvar_value'] = var.get()
                cfg['_textvar_id'] = var._id

        has_command = (self._id + ':command') in _tk_callbacks
        bindings = list(self._bindings.keys())

        visible_children = [c for c in self._children if c._layout is not None]

        canvas_items = []
        if self._type in ('Canvas',) and self._id in _tk_canvas_items:
            canvas_items = _tk_canvas_items[self._id]

        menu_items = []
        if self._type in ('Menu',) and self._menu_config:
            menu_items = self._menu_config

        return {
            'id': self._id,
            'type': self._type,
            'config': cfg,
            'layout': self._layout,
            'children': [c._serialize() for c in visible_children],
            'hasCommand': has_command,
            'bindings': bindings,
            'canvasItems': canvas_items,
            'menuItems': menu_items,
        }


class _TkRoot(_TkWidget):
    def __init__(self, **kw):
        global _tk_root
        super().__init__(master=None, widget_type='Tk', **kw)
        self._title = 'tk'
        self._geometry = '400x300'
        self._resizable_w = True
        self._resizable_h = True
        self._layout = {'manager': 'root'}
        self._menu = None
        _tk_root = self

    def mainloop(self):
        _tk_send_tree()

    def quit(self):
        pass

    def withdraw(self): pass
    def deiconify(self): pass
    def iconbitmap(self, *a): pass
    def overrideredirect(self, *a): pass
    def attributes(self, *a, **kw): pass
    def state(self, s=None): return 'normal'
    def wm_title(self, t=None):
        if t: self._title = t
        return self._title
    def option_add(self, *a): pass
    def tk_setPalette(self, *a): pass

    def title(self, t=None):
        if t is not None:
            self._title = str(t)
            self._config['title'] = str(t)
            _tk_send_tree()
        return self._title

    def geometry(self, g=None):
        if g is not None:
            self._geometry = str(g)
            self._config['geometry'] = str(g)
            _tk_send_tree()
        return self._geometry

    def resizable(self, w=None, h=None):
        if w is not None:
            self._resizable_w = bool(w)
        if h is not None:
            self._resizable_h = bool(h)

    def minsize(self, w=None, h=None): pass
    def maxsize(self, w=None, h=None): pass

    def protocol(self, name, func=None):
        if func and callable(func):
            _tk_callbacks[self._id + ':protocol:' + name] = func

    def _serialize(self):
        base = super()._serialize()
        base['config']['title'] = self._title
        base['config']['geometry'] = self._geometry
        if self._menu:
            base['menuBar'] = self._menu._serialize()
        return base


class _TkToplevel(_TkRoot):
    def __init__(self, master=None, **kw):
        _TkWidget.__init__(self, master=master, widget_type='Toplevel', **kw)
        self._title = 'tk'
        self._geometry = '300x200'
        self._resizable_w = True
        self._resizable_h = True
        self._layout = {'manager': 'root'}
        self._menu = None


class _TkFrame(_TkWidget):
    def __init__(self, master=None, **kw):
        super().__init__(master=master, widget_type='Frame', **kw)

class _TkLabelFrame(_TkWidget):
    def __init__(self, master=None, **kw):
        super().__init__(master=master, widget_type='LabelFrame', **kw)

class _TkLabel(_TkWidget):
    def __init__(self, master=None, **kw):
        super().__init__(master=master, widget_type='Label', **kw)

class _TkButton(_TkWidget):
    def __init__(self, master=None, **kw):
        super().__init__(master=master, widget_type='Button', **kw)
    def invoke(self):
        cb = _tk_callbacks.get(self._id + ':command')
        if cb: cb()

class _TkEntry(_TkWidget):
    def __init__(self, master=None, **kw):
        super().__init__(master=master, widget_type='Entry', **kw)
        self._entry_content = ''
        self._insert_pos = 0
    def insert(self, index, text):
        if str(index) == '0' or str(index) == 'insert':
            self._entry_content = str(text) + self._entry_content
        else:
            self._entry_content = self._entry_content + str(text)
        if '_textvar_id' in self._config:
            var = _tk_vars.get(self._config['_textvar_id'])
            if var:
                var._value = self._entry_content
        _tk_send_tree()
    def delete(self, first, last=None):
        if str(first) == '0' and str(last) == 'end':
            self._entry_content = ''
            if '_textvar_id' in self._config:
                var = _tk_vars.get(self._config['_textvar_id'])
                if var:
                    var._value = ''
        _tk_send_tree()
    def get(self):
        if '_textvar_id' in self._config:
            var = _tk_vars.get(self._config['_textvar_id'])
            if var:
                return str(var.get())
        return self._entry_content
    def icursor(self, index): pass
    def selection_range(self, start, end): pass
    def xview(self, *a): pass

class _TkText(_TkWidget):
    def __init__(self, master=None, **kw):
        super().__init__(master=master, widget_type='Text', **kw)
        self._text_content = ''
    def insert(self, index, text, *tags):
        if str(index) == '1.0' or str(index) == 'insert':
            self._text_content = str(text) + self._text_content
        else:
            self._text_content += str(text)
        _tk_send_tree()
    def delete(self, first, last=None):
        if str(first) == '1.0' and str(last) == 'end':
            self._text_content = ''
        _tk_send_tree()
    def get(self, first='1.0', last='end'):
        return self._text_content
    def see(self, index): pass
    def index(self, index): return '1.0'
    def tag_add(self, *a): pass
    def tag_config(self, *a, **kw): pass
    def tag_configure(self, *a, **kw): pass
    def tag_remove(self, *a): pass
    def mark_set(self, *a): pass

class _TkListbox(_TkWidget):
    def __init__(self, master=None, **kw):
        super().__init__(master=master, widget_type='Listbox', **kw)
        self._items = []
        self._selection = []
    def insert(self, index, *items):
        if str(index) == 'end':
            self._items.extend([str(i) for i in items])
        else:
            idx = int(index) if str(index).isdigit() else 0
            for i, item in enumerate(items):
                self._items.insert(idx + i, str(item))
        _tk_send_tree()
    def delete(self, first, last=None):
        if str(first) == '0' and str(last) == 'end':
            self._items = []
        _tk_send_tree()
    def get(self, first, last=None):
        idx = int(first) if str(first).isdigit() else 0
        if idx < len(self._items):
            return self._items[idx]
        return ''
    def curselection(self):
        return tuple(self._selection)
    def selection_set(self, first, last=None):
        idx = int(first) if str(first).isdigit() else 0
        if idx not in self._selection:
            self._selection.append(idx)
    def selection_clear(self, first, last=None):
        self._selection = []
    def see(self, index): pass
    def size(self):
        return len(self._items)
    def activate(self, index): pass

class _TkCanvas(_TkWidget):
    def __init__(self, master=None, **kw):
        super().__init__(master=master, widget_type='Canvas', **kw)
        self._item_counter = 0
        _tk_canvas_items[self._id] = []
    def _next_item(self):
        self._item_counter += 1
        return self._item_counter
    def create_line(self, *coords, **kw):
        iid = self._next_item()
        _tk_canvas_items[self._id].append({'id': iid, 'type': 'line', 'coords': list(coords), **{k:str(v) for k,v in kw.items()}})
        _tk_send_tree()
        return iid
    def create_rectangle(self, *coords, **kw):
        iid = self._next_item()
        _tk_canvas_items[self._id].append({'id': iid, 'type': 'rectangle', 'coords': list(coords), **{k:str(v) for k,v in kw.items()}})
        _tk_send_tree()
        return iid
    def create_oval(self, *coords, **kw):
        iid = self._next_item()
        _tk_canvas_items[self._id].append({'id': iid, 'type': 'oval', 'coords': list(coords), **{k:str(v) for k,v in kw.items()}})
        _tk_send_tree()
        return iid
    def create_arc(self, *coords, **kw):
        iid = self._next_item()
        _tk_canvas_items[self._id].append({'id': iid, 'type': 'arc', 'coords': list(coords), **{k:str(v) for k,v in kw.items()}})
        _tk_send_tree()
        return iid
    def create_polygon(self, *coords, **kw):
        iid = self._next_item()
        _tk_canvas_items[self._id].append({'id': iid, 'type': 'polygon', 'coords': list(coords), **{k:str(v) for k,v in kw.items()}})
        _tk_send_tree()
        return iid
    def create_text(self, x, y, **kw):
        iid = self._next_item()
        _tk_canvas_items[self._id].append({'id': iid, 'type': 'text', 'coords': [x, y], **{k:str(v) for k,v in kw.items()}})
        _tk_send_tree()
        return iid
    def create_image(self, x, y, **kw):
        iid = self._next_item()
        _tk_canvas_items[self._id].append({'id': iid, 'type': 'image', 'coords': [x, y]})
        _tk_send_tree()
        return iid
    def create_window(self, x, y, **kw):
        iid = self._next_item()
        _tk_canvas_items[self._id].append({'id': iid, 'type': 'window', 'coords': [x, y]})
        _tk_send_tree()
        return iid
    def delete(self, *items):
        if 'all' in [str(i) for i in items]:
            _tk_canvas_items[self._id] = []
        else:
            ids_to_del = set(int(i) if str(i).isdigit() else i for i in items)
            _tk_canvas_items[self._id] = [it for it in _tk_canvas_items[self._id] if it['id'] not in ids_to_del]
        _tk_send_tree()
    def move(self, item, dx, dy): pass
    def coords(self, item, *args): return []
    def itemconfig(self, item, **kw): pass
    def itemconfigure(self, item, **kw): pass
    def tag_bind(self, tag, event=None, callback=None): pass
    def find_all(self): return tuple(it['id'] for it in _tk_canvas_items.get(self._id, []))
    def find_withtag(self, tag): return ()
    def xview(self, *a): pass
    def yview(self, *a): pass
    def xview_moveto(self, f): pass
    def yview_moveto(self, f): pass
    def scan_mark(self, x, y): pass
    def scan_dragto(self, x, y): pass
    def bbox(self, *a): return (0, 0, 100, 100)

class _TkScrollbar(_TkWidget):
    def __init__(self, master=None, **kw):
        super().__init__(master=master, widget_type='Scrollbar', **kw)
    def set(self, *a): pass

class _TkCheckbutton(_TkWidget):
    def __init__(self, master=None, **kw):
        super().__init__(master=master, widget_type='Checkbutton', **kw)
        self._check_selected = False
    def select(self):
        self._check_selected = True
        if '_var_id' in self._config:
            var = _tk_vars.get(self._config['_var_id'])
            if var: var.set(True if isinstance(var, _TkBooleanVar) else 1)
        _tk_send_tree()
    def deselect(self):
        self._check_selected = False
        if '_var_id' in self._config:
            var = _tk_vars.get(self._config['_var_id'])
            if var: var.set(False if isinstance(var, _TkBooleanVar) else 0)
        _tk_send_tree()
    def toggle(self):
        if self._check_selected:
            self.deselect()
        else:
            self.select()
    def invoke(self):
        self.toggle()
        cb = _tk_callbacks.get(self._id + ':command')
        if cb: cb()

class _TkRadiobutton(_TkWidget):
    def __init__(self, master=None, **kw):
        super().__init__(master=master, widget_type='Radiobutton', **kw)
    def select(self):
        if '_var_id' in self._config:
            var = _tk_vars.get(self._config['_var_id'])
            if var: var.set(self._config.get('value', ''))
        _tk_send_tree()
    def deselect(self): pass
    def invoke(self):
        self.select()
        cb = _tk_callbacks.get(self._id + ':command')
        if cb: cb()

class _TkScale(_TkWidget):
    def __init__(self, master=None, **kw):
        super().__init__(master=master, widget_type='Scale', **kw)
        self._scale_value = float(kw.get('from_', kw.get('from', 0)))
    def get(self):
        return self._scale_value
    def set(self, value):
        self._scale_value = float(value)
        if '_var_id' in self._config:
            var = _tk_vars.get(self._config['_var_id'])
            if var: var.set(value)
        _tk_send_tree()

class _TkSpinbox(_TkEntry):
    def __init__(self, master=None, **kw):
        super().__init__(master=master, **kw)
        self._type = 'Spinbox'

class _TkMenu(_TkWidget):
    def __init__(self, master=None, **kw):
        super().__init__(master=master, widget_type='Menu', **kw)
        self._menu_config = []
        if master and isinstance(master, (_TkRoot, _TkToplevel)):
            master._menu = self

    def add_command(self, **kw):
        label = kw.get('label', '')
        if 'command' in kw and callable(kw['command']):
            cb_id = _tk_next_id()
            _tk_callbacks[cb_id + ':command'] = kw['command']
            self._menu_config.append({'type': 'command', 'label': label, 'callback_id': cb_id})
        else:
            self._menu_config.append({'type': 'command', 'label': label})
        _tk_send_tree()

    def add_cascade(self, **kw):
        label = kw.get('label', '')
        submenu = kw.get('menu')
        sub_items = submenu._menu_config if submenu else []
        self._menu_config.append({'type': 'cascade', 'label': label, 'items': sub_items})
        _tk_send_tree()

    def add_separator(self):
        self._menu_config.append({'type': 'separator'})

    def add_checkbutton(self, **kw):
        self._menu_config.append({'type': 'checkbutton', 'label': kw.get('label', '')})

    def add_radiobutton(self, **kw):
        self._menu_config.append({'type': 'radiobutton', 'label': kw.get('label', '')})

    def delete(self, first, last=None): pass
    def entryconfig(self, index, **kw): pass
    def post(self, x, y): pass
    def unpost(self): pass

class _TkMenubutton(_TkWidget):
    def __init__(self, master=None, **kw):
        super().__init__(master=master, widget_type='Menubutton', **kw)

class _TkOptionMenu(_TkWidget):
    def __init__(self, master, variable, default, *values, **kw):
        super().__init__(master=master, widget_type='OptionMenu', **kw)
        self._config['_options'] = [str(default)] + [str(v) for v in values]
        if isinstance(variable, _TkVar):
            variable.set(default)
            self._config['_var_id'] = variable._id
            self._config['_textvar_id'] = variable._id

class _TkMessage(_TkWidget):
    def __init__(self, master=None, **kw):
        super().__init__(master=master, widget_type='Message', **kw)

class _TkPanedWindow(_TkWidget):
    def __init__(self, master=None, **kw):
        super().__init__(master=master, widget_type='PanedWindow', **kw)
    def add(self, widget, **kw):
        if widget not in self._children:
            self._children.append(widget)
            widget._layout = {'manager': 'pane'}
        _tk_send_tree()
    def paneconfigure(self, widget, **kw): pass

class _TkPhotoImage:
    def __init__(self, **kw):
        self._id = _tk_next_id()
        self._width = kw.get('width', 0)
        self._height = kw.get('height', 0)
    def blank(self): pass
    def subsample(self, *a): return self
    def zoom(self, *a): return self
    def width(self): return self._width
    def height(self): return self._height
    def put(self, *a): pass
    def cget(self, key): return ''
    def configure(self, **kw): pass
    def config(self, **kw): pass

def _handle_tk_event(widget_id, event_type, event_data=None):
    widget = _tk_widgets.get(widget_id)
    if not widget:
        return

    if event_type == 'command':
        cb = _tk_callbacks.get(widget_id + ':command')
        if cb:
            try:
                cb()
            except Exception as e:
                print(f"Error in callback: {e}")

    elif event_type == 'entry_change':
        if hasattr(widget, '_entry_content'):
            widget._entry_content = event_data.get('value', '')
            if '_textvar_id' in widget._config:
                var = _tk_vars.get(widget._config['_textvar_id'])
                if var:
                    var._value = widget._entry_content

    elif event_type == 'text_change':
        if hasattr(widget, '_text_content'):
            widget._text_content = event_data.get('value', '')

    elif event_type == 'check_toggle':
        if hasattr(widget, '_check_selected'):
            widget._check_selected = not widget._check_selected
            if '_var_id' in widget._config:
                var = _tk_vars.get(widget._config['_var_id'])
                if var:
                    var.set(widget._check_selected)
            cb = _tk_callbacks.get(widget_id + ':command')
            if cb:
                try:
                    cb()
                except Exception as e:
                    print(f"Error in callback: {e}")

    elif event_type == 'radio_select':
        if '_var_id' in widget._config:
            var = _tk_vars.get(widget._config['_var_id'])
            if var:
                var.set(widget._config.get('value', ''))
        cb = _tk_callbacks.get(widget_id + ':command')
        if cb:
            try:
                cb()
            except Exception as e:
                print(f"Error in callback: {e}")

    elif event_type == 'scale_change':
        if hasattr(widget, '_scale_value'):
            widget._scale_value = float(event_data.get('value', 0))
            if '_var_id' in widget._config:
                var = _tk_vars.get(widget._config['_var_id'])
                if var:
                    var.set(widget._scale_value)
            cb = _tk_callbacks.get(widget_id + ':command')
            if cb:
                try:
                    cb(widget._scale_value)
                except Exception as e:
                    print(f"Error in callback: {e}")

    elif event_type == 'listbox_select':
        if hasattr(widget, '_selection'):
            idx = event_data.get('index', 0)
            widget._selection = [idx]
            cb_key = widget._id + ':bind:<<ListboxSelect>>'
            cb = _tk_callbacks.get(cb_key)
            if cb:
                try:
                    cb(None)
                except Exception as e:
                    print(f"Error in callback: {e}")

    elif event_type == 'option_select':
        val = event_data.get('value', '')
        if '_var_id' in widget._config:
            var = _tk_vars.get(widget._config['_var_id'])
            if var:
                var.set(val)
        elif '_textvar_id' in widget._config:
            var = _tk_vars.get(widget._config['_textvar_id'])
            if var:
                var.set(val)

    elif event_type == 'menu_command':
        cb_id = event_data.get('callback_id', '')
        cb = _tk_callbacks.get(cb_id + ':command')
        if cb:
            try:
                cb()
            except Exception as e:
                print(f"Error in callback: {e}")

    _tk_send_tree()

_tk_mod = types.ModuleType('tkinter')
_tk_mod.Tk = _TkRoot
_tk_mod.Toplevel = _TkToplevel
_tk_mod.Frame = _TkFrame
_tk_mod.LabelFrame = _TkLabelFrame
_tk_mod.Label = _TkLabel
_tk_mod.Button = _TkButton
_tk_mod.Entry = _TkEntry
_tk_mod.Text = _TkText
_tk_mod.Canvas = _TkCanvas
_tk_mod.Listbox = _TkListbox
_tk_mod.Scrollbar = _TkScrollbar
_tk_mod.Checkbutton = _TkCheckbutton
_tk_mod.Radiobutton = _TkRadiobutton
_tk_mod.Scale = _TkScale
_tk_mod.Spinbox = _TkSpinbox
_tk_mod.Menu = _TkMenu
_tk_mod.Menubutton = _TkMenubutton
_tk_mod.OptionMenu = _TkOptionMenu
_tk_mod.Message = _TkMessage
_tk_mod.PanedWindow = _TkPanedWindow
_tk_mod.PhotoImage = _TkPhotoImage
_tk_mod.StringVar = _TkStringVar
_tk_mod.IntVar = _TkIntVar
_tk_mod.DoubleVar = _TkDoubleVar
_tk_mod.BooleanVar = _TkBooleanVar

_tk_mod.TOP = 'top'
_tk_mod.BOTTOM = 'bottom'
_tk_mod.LEFT = 'left'
_tk_mod.RIGHT = 'right'
_tk_mod.CENTER = 'center'
_tk_mod.X = 'x'
_tk_mod.Y = 'y'
_tk_mod.BOTH = 'both'
_tk_mod.NONE = 'none'
_tk_mod.YES = True
_tk_mod.NO = False
_tk_mod.TRUE = True
_tk_mod.FALSE = False
_tk_mod.END = 'end'
_tk_mod.INSERT = 'insert'
_tk_mod.CURRENT = 'current'
_tk_mod.SEL = 'sel'
_tk_mod.SEL_FIRST = 'sel.first'
_tk_mod.SEL_LAST = 'sel.last'
_tk_mod.NORMAL = 'normal'
_tk_mod.DISABLED = 'disabled'
_tk_mod.ACTIVE = 'active'
_tk_mod.HIDDEN = 'hidden'
_tk_mod.HORIZONTAL = 'horizontal'
_tk_mod.VERTICAL = 'vertical'
_tk_mod.RAISED = 'raised'
_tk_mod.SUNKEN = 'sunken'
_tk_mod.FLAT = 'flat'
_tk_mod.RIDGE = 'ridge'
_tk_mod.GROOVE = 'groove'
_tk_mod.SOLID = 'solid'
_tk_mod.NW = 'nw'
_tk_mod.N = 'n'
_tk_mod.NE = 'ne'
_tk_mod.W = 'w'
_tk_mod.E = 'e'
_tk_mod.SW = 'sw'
_tk_mod.S = 's'
_tk_mod.SE = 'se'
_tk_mod.NSEW = 'nsew'
_tk_mod.NS = 'ns'
_tk_mod.EW = 'ew'
_tk_mod.WORD = 'word'
_tk_mod.CHAR = 'char'
_tk_mod.BROWSE = 'browse'
_tk_mod.MULTIPLE = 'multiple'
_tk_mod.EXTENDED = 'extended'
_tk_mod.SINGLE = 'single'
_tk_mod.ANCHOR = 'anchor'
_tk_mod.READABLE = 1
_tk_mod.WRITABLE = 2
_tk_mod.EXCEPTION = 4

_noop = lambda *a, **kw: None

_ttk_mod = types.ModuleType('tkinter.ttk')

class _TtkWidget(_TkWidget):
    def __init__(self, master=None, widget_type='TtkWidget', **kw):
        super().__init__(master=master, widget_type='ttk.' + widget_type, **kw)
    def state(self, statespec=None): return []
    def instate(self, statespec): return True

class _TtkButton(_TtkWidget):
    def __init__(self, master=None, **kw):
        super().__init__(master=master, widget_type='Button', **kw)
    def invoke(self):
        cb = _tk_callbacks.get(self._id + ':command')
        if cb: cb()

class _TtkEntry(_TkEntry):
    def __init__(self, master=None, **kw):
        super().__init__(master=master, **kw)
        self._type = 'ttk.Entry'
    def state(self, statespec=None): return []
    def instate(self, statespec): return True

class _TtkCombobox(_TkEntry):
    def __init__(self, master=None, **kw):
        super().__init__(master=master, **kw)
        self._type = 'ttk.Combobox'
        self._config['_options'] = list(kw.get('values', []))
    def current(self, index=None):
        if index is not None and self._config.get('_options'):
            opts = self._config['_options']
            if 0 <= index < len(opts):
                self._entry_content = opts[index]
        return 0
    def set(self, value):
        self._entry_content = str(value)
        _tk_send_tree()
    def state(self, statespec=None): return []
    def instate(self, statespec): return True

class _TtkNotebook(_TtkWidget):
    def __init__(self, master=None, **kw):
        super().__init__(master=master, widget_type='Notebook', **kw)
        self._tabs = []
    def add(self, child, **kw):
        text = kw.get('text', f'Tab {len(self._tabs)+1}')
        if child not in self._children:
            self._children.append(child)
            child._layout = {'manager': 'tab'}
        self._tabs.append({'widget_id': child._id, 'text': text})
        self._config['_tabs'] = self._tabs
        _tk_send_tree()
    def tab(self, tab_id, **kw): pass
    def select(self, tab_id=None): pass
    def index(self, tab_id=None): return 0
    def forget(self, tab_id): pass

class _TtkTreeview(_TtkWidget):
    def __init__(self, master=None, **kw):
        super().__init__(master=master, widget_type='Treeview', **kw)
        self._tree_items = {}
        self._tree_counter = 0
        self._columns_config = {}
        self._headings_config = {}
    def insert(self, parent, index, iid=None, **kw):
        self._tree_counter += 1
        item_id = iid or ('I' + str(self._tree_counter).zfill(3))
        self._tree_items[item_id] = {'parent': parent, 'text': kw.get('text', ''), 'values': list(kw.get('values', []))}
        self._config['_tree_data'] = self._tree_items
        _tk_send_tree()
        return item_id
    def delete(self, *items):
        for item in items:
            self._tree_items.pop(str(item), None)
        self._config['_tree_data'] = self._tree_items
        _tk_send_tree()
    def heading(self, column, **kw):
        self._headings_config[str(column)] = kw
        self._config['_headings'] = self._headings_config
    def column(self, column, **kw):
        self._columns_config[str(column)] = kw
        self._config['_columns_config'] = self._columns_config
    def item(self, item, **kw):
        if kw:
            if item in self._tree_items:
                self._tree_items[item].update(kw)
        return self._tree_items.get(item, {})
    def get_children(self, item=None):
        parent = item or ''
        return [k for k, v in self._tree_items.items() if v.get('parent', '') == parent]
    def selection(self): return []
    def see(self, item): pass
    def tag_configure(self, tag, **kw): pass
    def identify(self, component, x, y): return ''
    def identify_region(self, x, y): return ''
    def bbox(self, item, column=None): return (0, 0, 0, 0)
    def focus(self, item=None): pass

class _TtkProgressbar(_TtkWidget):
    def __init__(self, master=None, **kw):
        super().__init__(master=master, widget_type='Progressbar', **kw)
        self._progress_value = kw.get('value', 0)
    def step(self, amount=1.0):
        self._progress_value += amount
        self._config['value'] = self._progress_value
        _tk_send_tree()
    def start(self, interval=None): pass
    def stop(self): pass

class _TtkSeparator(_TtkWidget):
    def __init__(self, master=None, **kw):
        super().__init__(master=master, widget_type='Separator', **kw)

class _TtkSizegrip(_TtkWidget):
    def __init__(self, master=None, **kw):
        super().__init__(master=master, widget_type='Sizegrip', **kw)

class _TtkScale(_TkScale):
    def __init__(self, master=None, **kw):
        super().__init__(master=master, **kw)
        self._type = 'ttk.Scale'

class _TtkScrollbar(_TkScrollbar):
    def __init__(self, master=None, **kw):
        super().__init__(master=master, **kw)
        self._type = 'ttk.Scrollbar'

class _TtkCheckbutton(_TkCheckbutton):
    def __init__(self, master=None, **kw):
        super().__init__(master=master, **kw)
        self._type = 'ttk.Checkbutton'

class _TtkRadiobutton(_TkRadiobutton):
    def __init__(self, master=None, **kw):
        super().__init__(master=master, **kw)
        self._type = 'ttk.Radiobutton'

class _TtkSpinbox(_TkSpinbox):
    def __init__(self, master=None, **kw):
        super().__init__(master=master, **kw)
        self._type = 'ttk.Spinbox'

class _TtkStyle:
    def __init__(self, master=None):
        pass
    def configure(self, style, **kw): pass
    def map(self, style, **kw): pass
    def lookup(self, style, option): return ''
    def theme_use(self, name=None): return 'default'
    def theme_names(self): return ['default']
    def element_create(self, *a, **kw): pass
    def layout(self, style, layoutspec=None): return []

_ttk_mod.Style = _TtkStyle
_ttk_mod.Button = _TtkButton
_ttk_mod.Checkbutton = _TtkCheckbutton
_ttk_mod.Combobox = _TtkCombobox
_ttk_mod.Entry = _TtkEntry
_ttk_mod.Frame = lambda master=None, **kw: _TkFrame(master, **kw)
_ttk_mod.Label = lambda master=None, **kw: _TkLabel(master, **kw)
_ttk_mod.LabelFrame = lambda master=None, **kw: _TkLabelFrame(master, **kw)
_ttk_mod.Menubutton = lambda master=None, **kw: _TkMenubutton(master, **kw)
_ttk_mod.Notebook = _TtkNotebook
_ttk_mod.PanedWindow = lambda master=None, **kw: _TkPanedWindow(master, **kw)
_ttk_mod.Progressbar = _TtkProgressbar
_ttk_mod.Radiobutton = _TtkRadiobutton
_ttk_mod.Scale = _TtkScale
_ttk_mod.Scrollbar = _TtkScrollbar
_ttk_mod.Separator = _TtkSeparator
_ttk_mod.Sizegrip = _TtkSizegrip
_ttk_mod.Spinbox = _TtkSpinbox
_ttk_mod.Treeview = _TtkTreeview

_msgbox_counter = 0
_msgbox_responses = {}

def _show_messagebox(msgtype, title, message, **options):
    global _msgbox_counter
    from js import postMessage
    _msgbox_counter += 1
    msg_id = f'msgbox_{_msgbox_counter}'

    postMessage(
        type='tkinter-messagebox',
        msgId=msg_id,
        msgType=msgtype,
        title=str(title) if title else 'Message',
        message=str(message),
        options=_json.dumps(options)
    )

    import time
    timeout = 0
    while msg_id not in _msgbox_responses and timeout < 300:
        time.sleep(0.01)
        timeout += 1

    if msg_id in _msgbox_responses:
        result = _msgbox_responses[msg_id]
        del _msgbox_responses[msg_id]
        return result

    return None

_msgbox_mod = types.ModuleType('tkinter.messagebox')
_msgbox_mod.showinfo = lambda title='Info', message='', **kw: _show_messagebox('showinfo', title, message, **kw)
_msgbox_mod.showwarning = lambda title='Warning', message='', **kw: _show_messagebox('showwarning', title, message, **kw)
_msgbox_mod.showerror = lambda title='Error', message='', **kw: _show_messagebox('showerror', title, message, **kw)
_msgbox_mod.askquestion = lambda title='Question', message='', **kw: _show_messagebox('askquestion', title, message, **kw)
_msgbox_mod.askokcancel = lambda title='Question', message='', **kw: _show_messagebox('askokcancel', title, message, **kw)
_msgbox_mod.askyesno = lambda title='Question', message='', **kw: _show_messagebox('askyesno', title, message, **kw)
_msgbox_mod.askretrycancel = lambda title='Question', message='', **kw: _show_messagebox('askretrycancel', title, message, **kw)
_msgbox_mod.askyesnocancel = lambda title='Question', message='', **kw: _show_messagebox('askyesnocancel', title, message, **kw)

_dialog_responses = {}

def _show_dialog(dialog_type, **options):
    msg_id = str(time.time())
    _pyjsobj.postMessage({
        'type': 'dialog',
        'dialogType': dialog_type,
        'options': options,
        'msgId': msg_id
    })

    import time
    timeout = 0
    while msg_id not in _dialog_responses and timeout < 300:
        time.sleep(0.01)
        timeout += 1

    if msg_id in _dialog_responses:
        result = _dialog_responses[msg_id]
        del _dialog_responses[msg_id]
        return result

    return None

_filedialog_mod = types.ModuleType('tkinter.filedialog')
_filedialog_mod.askopenfilename = lambda title='Open', **kw: _show_dialog('askopenfilename', title=title, **kw)
_filedialog_mod.asksaveasfilename = lambda title='Save As', **kw: _show_dialog('asksaveasfilename', title=title, **kw)
_filedialog_mod.askdirectory = lambda title='Select Directory', **kw: _show_dialog('askdirectory', title=title, **kw)
_filedialog_mod.askopenfilenames = lambda title='Open', **kw: _show_dialog('askopenfilenames', title=title, **kw) or ()
_filedialog_mod.askopenfile = lambda title='Open', mode='r', **kw: None
_filedialog_mod.asksaveasfile = lambda title='Save As', mode='w', **kw: None

_simpledialog_mod = types.ModuleType('tkinter.simpledialog')
_simpledialog_mod.askstring = lambda title, prompt, **kw: _show_dialog('askstring', title=title, prompt=prompt, **kw)
_simpledialog_mod.askinteger = lambda title, prompt, **kw: _show_dialog('askinteger', title=title, prompt=prompt, **kw)
_simpledialog_mod.askfloat = lambda title, prompt, **kw: _show_dialog('askfloat', title=title, prompt=prompt, **kw)

# ttkbootstrap emulation
_ttkbootstrap_mod = types.ModuleType('ttkbootstrap')

class _TtkBootstrapWindow(_TkRoot):
    def __init__(self, themename=None, **kw):
        super().__init__(**kw)
        self._themename = themename or 'cosmo'
        self._config['_themename'] = self._themename

_ttkbootstrap_mod.Window = _TtkBootstrapWindow
_ttkbootstrap_mod.BooleanVar = _TkBooleanVar
_ttkbootstrap_mod.StringVar = _TkStringVar
_ttkbootstrap_mod.IntVar = _TkIntVar
_ttkbootstrap_mod.DoubleVar = _TkDoubleVar

_ttkbootstrap_ttk_mod = types.ModuleType('ttkbootstrap.ttk')
_ttkbootstrap_ttk_mod.Button = _TtkButton
_ttkbootstrap_ttk_mod.Checkbutton = _TtkCheckbutton
_ttkbootstrap_ttk_mod.Combobox = _TtkCombobox
_ttkbootstrap_ttk_mod.Entry = _TtkEntry
_ttkbootstrap_ttk_mod.Frame = lambda master=None, **kw: _TkFrame(master, **kw)
_ttkbootstrap_ttk_mod.Label = lambda master=None, **kw: _TkLabel(master, **kw)
_ttkbootstrap_ttk_mod.LabelFrame = lambda master=None, **kw: _TkLabelFrame(master, **kw)
_ttkbootstrap_ttk_mod.Notebook = _TtkNotebook
_ttkbootstrap_ttk_mod.Progressbar = _TtkProgressbar
_ttkbootstrap_ttk_mod.Radiobutton = _TtkRadiobutton
_ttkbootstrap_ttk_mod.Scale = _TtkScale
_ttkbootstrap_ttk_mod.Scrollbar = _TtkScrollbar
_ttkbootstrap_ttk_mod.Separator = _TtkSeparator
_ttkbootstrap_ttk_mod.Spinbox = _TtkSpinbox
_ttkbootstrap_ttk_mod.Treeview = _TtkTreeview

_ttkbootstrap_mod.ttk = _ttkbootstrap_ttk_mod

_colorchooser_mod = types.ModuleType('tkinter.colorchooser')
def _askcolor(color=None, **options):
    title = options.get('title', 'Color Chooser')
    result = _show_dialog('askcolor', title=title, initialcolor=color, **options)
    if result:
        return result
    return (None, None)
_colorchooser_mod.askcolor = _askcolor

_font_mod = types.ModuleType('tkinter.font')
class _TkFont:
    def __init__(self, **kw):
        self._config = kw
    def configure(self, **kw): self._config.update(kw)
    def cget(self, key): return self._config.get(key, '')
    def actual(self, *a): return {}
    def metrics(self, *a): return {}
    def measure(self, text): return len(text) * 7
    @staticmethod
    def families(): return ['TkDefaultFont', 'Helvetica', 'Arial', 'Courier']
_font_mod.Font = _TkFont
_font_mod.families = _TkFont.families
_font_mod.nametofont = lambda name: _TkFont()

# CustomTkinter emulation
_customtkinter_mod = types.ModuleType('customtkinter')

class _CTk(_TkRoot):
    def __init__(self, **kw):
        super().__init__(**kw)
        self._appearance_mode = 'dark'
        self._color_theme = 'blue'

_customtkinter_mod.CTk = _CTk
_customtkinter_mod.CTkButton = _TtkButton
_customtkinter_mod.CTkLabel = lambda master=None, **kw: _TkLabel(master, **kw)
_customtkinter_mod.CTkEntry = _TtkEntry
_customtkinter_mod.CTkFrame = lambda master=None, **kw: _TkFrame(master, **kw)
_customtkinter_mod.CTkCheckBox = _TtkCheckbutton
_customtkinter_mod.CTkRadioButton = _TtkRadiobutton
_customtkinter_mod.CTkComboBox = _TtkCombobox
_customtkinter_mod.CTkSlider = _TtkScale
_customtkinter_mod.CTkProgressBar = _TtkProgressbar
_customtkinter_mod.CTkSwitch = _TtkCheckbutton
_customtkinter_mod.CTkTextbox = _TkText
_customtkinter_mod.CTkScrollbar = _TtkScrollbar
_customtkinter_mod.CTkCanvas = _TkCanvas
_customtkinter_mod.CTkTabview = _TtkNotebook
_customtkinter_mod.CTkFont = _TkFont
_customtkinter_mod.StringVar = _TkStringVar
_customtkinter_mod.IntVar = _TkIntVar
_customtkinter_mod.DoubleVar = _TkDoubleVar
_customtkinter_mod.BooleanVar = _TkBooleanVar
_customtkinter_mod.set_appearance_mode = lambda mode: None
_customtkinter_mod.set_default_color_theme = lambda theme: None
_customtkinter_mod.get_appearance_mode = lambda: 'dark'

sys.modules['tkinter'] = _tk_mod
sys.modules['_tkinter'] = types.ModuleType('_tkinter')
sys.modules['tkinter.ttk'] = _ttk_mod
sys.modules['tkinter.constants'] = _tk_mod
sys.modules['tkinter.messagebox'] = _msgbox_mod
sys.modules['tkinter.filedialog'] = _filedialog_mod
sys.modules['tkinter.simpledialog'] = _simpledialog_mod
sys.modules['tkinter.colorchooser'] = _colorchooser_mod
sys.modules['tkinter.font'] = _font_mod
sys.modules['ttkbootstrap'] = _ttkbootstrap_mod
sys.modules['ttkbootstrap.ttk'] = _ttkbootstrap_ttk_mod
sys.modules['customtkinter'] = _customtkinter_mod

import os
os.environ['MPLBACKEND'] = 'AGG'
`;

const PYGAME_STUB = `
import sys
import types
import json as _pgjson
import time as _pgtime
import math as _pgmath
import asyncio as _pg_asyncio

_pg_display_surface = None
_pg_display_caption = 'pygame window'
_pg_display_width = 0
_pg_display_height = 0
_pg_initialized = False
_pg_frame_count = 0
_pg_max_frames = 100000
_pg_start_time = 0
_pg_max_time = 300
_pg_quit_requested = False
_pg_event_queue = []
_pg_keys_pressed = {}
_pg_mouse_pos = (0, 0)
_pg_mouse_buttons = (False, False, False)
_pg_last_flip_time = 0
_pg_flip_interval = 0.033

def _pg_color_to_list(color):
    if isinstance(color, (list, tuple)):
        return [int(c) for c in color[:4]]
    if isinstance(color, int):
        return [(color >> 16) & 0xFF, (color >> 8) & 0xFF, color & 0xFF]
    if isinstance(color, str):
        color = color.lstrip('#')
        if color.lower() in _pg_color_names:
            return list(_pg_color_names[color.lower()])
        if len(color) == 6:
            return [int(color[i:i+2], 16) for i in (0, 2, 4)]
        if len(color) == 8:
            return [int(color[i:i+2], 16) for i in (0, 2, 4, 6)]
    try:
        c = _PgColor(color)
        return [c.r, c.g, c.b, c.a]
    except Exception:
        pass
    return [0, 0, 0]

_pg_color_names = {
    'white': (255, 255, 255), 'black': (0, 0, 0), 'red': (255, 0, 0),
    'green': (0, 128, 0), 'blue': (0, 0, 255), 'yellow': (255, 255, 0),
    'cyan': (0, 255, 255), 'magenta': (255, 0, 255), 'orange': (255, 165, 0),
    'purple': (128, 0, 128), 'gray': (128, 128, 128), 'grey': (128, 128, 128),
    'pink': (255, 192, 203), 'brown': (165, 42, 42), 'gold': (255, 215, 0),
    'silver': (192, 192, 192), 'navy': (0, 0, 128), 'teal': (0, 128, 128),
    'maroon': (128, 0, 0), 'olive': (128, 128, 0), 'lime': (0, 255, 0),
    'aqua': (0, 255, 255), 'coral': (255, 127, 80), 'salmon': (250, 128, 114),
    'khaki': (240, 230, 140), 'violet': (238, 130, 238),
    'darkgreen': (0, 100, 0), 'darkblue': (0, 0, 139), 'darkred': (139, 0, 0),
    'lightgray': (211, 211, 211), 'lightgrey': (211, 211, 211),
    'darkgray': (169, 169, 169), 'darkgrey': (169, 169, 169),
    'lightblue': (173, 216, 230), 'lightgreen': (144, 238, 144),
    'skyblue': (135, 206, 235), 'tomato': (255, 99, 71),
    'steelblue': (70, 130, 180), 'wheat': (245, 222, 179),
}

class _PgColor:
    def __init__(self, *args):
        if len(args) == 1:
            v = args[0]
            if isinstance(v, _PgColor):
                self.r, self.g, self.b, self.a = v.r, v.g, v.b, v.a
                return
            if isinstance(v, str):
                v = v.lstrip('#').lower()
                if v in _pg_color_names:
                    c = _pg_color_names[v]
                    self.r, self.g, self.b, self.a = c[0], c[1], c[2], 255
                    return
                if len(v) >= 6:
                    self.r = int(v[0:2], 16)
                    self.g = int(v[2:4], 16)
                    self.b = int(v[4:6], 16)
                    self.a = int(v[6:8], 16) if len(v) >= 8 else 255
                    return
            if isinstance(v, (list, tuple)):
                self.r = int(v[0])
                self.g = int(v[1])
                self.b = int(v[2])
                self.a = int(v[3]) if len(v) > 3 else 255
                return
        elif len(args) == 3:
            self.r, self.g, self.b, self.a = int(args[0]), int(args[1]), int(args[2]), 255
            return
        elif len(args) == 4:
            self.r, self.g, self.b, self.a = int(args[0]), int(args[1]), int(args[2]), int(args[3])
            return
        self.r = self.g = self.b = 0
        self.a = 255
    def __iter__(self):
        return iter((self.r, self.g, self.b, self.a))
    def __getitem__(self, i):
        return (self.r, self.g, self.b, self.a)[i]
    def __len__(self):
        return 4
    def __repr__(self):
        return f"Color({self.r}, {self.g}, {self.b}, {self.a})"

class _PgRect:
    def __init__(self, *args):
        if len(args) == 4:
            self.x, self.y, self.width, self.height = int(args[0]), int(args[1]), int(args[2]), int(args[3])
        elif len(args) == 2:
            self.x, self.y = int(args[0][0]), int(args[0][1])
            self.width, self.height = int(args[1][0]), int(args[1][1])
        elif len(args) == 1:
            a = args[0]
            if isinstance(a, _PgRect):
                self.x, self.y, self.width, self.height = a.x, a.y, a.width, a.height
            elif isinstance(a, (list, tuple)):
                if len(a) == 4:
                    self.x, self.y, self.width, self.height = int(a[0]), int(a[1]), int(a[2]), int(a[3])
                elif len(a) == 2:
                    self.x, self.y = int(a[0][0]), int(a[0][1])
                    self.width, self.height = int(a[1][0]), int(a[1][1])
                else:
                    self.x = self.y = self.width = self.height = 0
            else:
                self.x = self.y = self.width = self.height = 0
        else:
            self.x = self.y = self.width = self.height = 0

    @property
    def left(self): return self.x
    @left.setter
    def left(self, v): self.x = v
    @property
    def top(self): return self.y
    @top.setter
    def top(self, v): self.y = v
    @property
    def right(self): return self.x + self.width
    @right.setter
    def right(self, v): self.x = v - self.width
    @property
    def bottom(self): return self.y + self.height
    @bottom.setter
    def bottom(self, v): self.y = v - self.height
    @property
    def centerx(self): return self.x + self.width // 2
    @centerx.setter
    def centerx(self, v): self.x = v - self.width // 2
    @property
    def centery(self): return self.y + self.height // 2
    @centery.setter
    def centery(self, v): self.y = v - self.height // 2
    @property
    def center(self): return (self.centerx, self.centery)
    @center.setter
    def center(self, v): self.centerx, self.centery = v[0], v[1]
    @property
    def topleft(self): return (self.x, self.y)
    @topleft.setter
    def topleft(self, v): self.x, self.y = v[0], v[1]
    @property
    def topright(self): return (self.right, self.y)
    @topright.setter
    def topright(self, v): self.right, self.y = v[0], v[1]
    @property
    def bottomleft(self): return (self.x, self.bottom)
    @bottomleft.setter
    def bottomleft(self, v): self.x, self.bottom = v[0], v[1]
    @property
    def bottomright(self): return (self.right, self.bottom)
    @bottomright.setter
    def bottomright(self, v): self.right, self.bottom = v[0], v[1]
    @property
    def midtop(self): return (self.centerx, self.y)
    @property
    def midbottom(self): return (self.centerx, self.bottom)
    @property
    def midleft(self): return (self.x, self.centery)
    @property
    def midright(self): return (self.right, self.centery)
    @property
    def size(self): return (self.width, self.height)
    @size.setter
    def size(self, v): self.width, self.height = v[0], v[1]
    @property
    def w(self): return self.width
    @w.setter
    def w(self, v): self.width = v
    @property
    def h(self): return self.height
    @h.setter
    def h(self, v): self.height = v

    def copy(self): return _PgRect(self.x, self.y, self.width, self.height)
    def move(self, dx, dy): return _PgRect(self.x+dx, self.y+dy, self.width, self.height)
    def move_ip(self, dx, dy): self.x += dx; self.y += dy
    def inflate(self, dw, dh): return _PgRect(self.x-dw//2, self.y-dh//2, self.width+dw, self.height+dh)
    def inflate_ip(self, dw, dh): self.x -= dw//2; self.y -= dh//2; self.width += dw; self.height += dh
    def clamp(self, other): return self.copy()
    def clamp_ip(self, other): pass
    def clip(self, other):
        o = _PgRect(other) if not isinstance(other, _PgRect) else other
        x = max(self.x, o.x)
        y = max(self.y, o.y)
        r = min(self.right, o.right)
        b = min(self.bottom, o.bottom)
        return _PgRect(x, y, max(0, r-x), max(0, b-y))
    def union(self, other):
        o = _PgRect(other) if not isinstance(other, _PgRect) else other
        x = min(self.x, o.x)
        y = min(self.y, o.y)
        r = max(self.right, o.right)
        b = max(self.bottom, o.bottom)
        return _PgRect(x, y, r-x, b-y)
    def contains(self, other):
        o = _PgRect(other) if not isinstance(other, _PgRect) else other
        return self.x <= o.x and self.y <= o.y and self.right >= o.right and self.bottom >= o.bottom
    def collidepoint(self, *args):
        if len(args) == 2: px, py = args
        else: px, py = args[0][0], args[0][1]
        return self.x <= px < self.right and self.y <= py < self.bottom
    def colliderect(self, other):
        o = _PgRect(other) if not isinstance(other, _PgRect) else other
        return self.x < o.right and self.right > o.x and self.y < o.bottom and self.bottom > o.y
    def collidelist(self, rects):
        for i, r in enumerate(rects):
            if self.colliderect(r): return i
        return -1
    def collidelistall(self, rects):
        return [i for i, r in enumerate(rects) if self.colliderect(r)]
    def normalize(self):
        if self.width < 0: self.x += self.width; self.width = -self.width
        if self.height < 0: self.y += self.height; self.height = -self.height
    def __iter__(self):
        return iter((self.x, self.y, self.width, self.height))
    def __getitem__(self, i):
        return (self.x, self.y, self.width, self.height)[i]
    def __len__(self):
        return 4
    def __repr__(self):
        return f"<rect({self.x}, {self.y}, {self.width}, {self.height})>"
    def __eq__(self, other):
        try:
            o = _PgRect(other) if not isinstance(other, _PgRect) else other
            return self.x == o.x and self.y == o.y and self.width == o.width and self.height == o.height
        except: return False

class _PgSurface:
    def __init__(self, size, flags=0, depth=32):
        self._width = int(size[0]) if isinstance(size, (list, tuple)) else int(size)
        self._height = int(size[1]) if isinstance(size, (list, tuple)) else int(size)
        self._commands = []
        self._flags = flags
        self._alpha = 255
        self._colorkey = None
        self._clip = _PgRect(0, 0, self._width, self._height)
        self._is_text = False
        self._text_info = None

    def get_size(self): return (self._width, self._height)
    def get_width(self): return self._width
    def get_height(self): return self._height
    def get_rect(self, **kw):
        r = _PgRect(0, 0, self._width, self._height)
        for k, v in kw.items():
            setattr(r, k, v)
        return r
    def get_at(self, pos): return (0, 0, 0, 255)
    def set_at(self, pos, color):
        c = _pg_color_to_list(color)
        self._commands.append({'type': 'pixel', 'x': int(pos[0]), 'y': int(pos[1]), 'color': c})
    def get_clip(self): return self._clip.copy()
    def set_clip(self, rect): self._clip = _PgRect(rect) if rect else _PgRect(0, 0, self._width, self._height)
    def get_alpha(self): return self._alpha
    def set_alpha(self, a): self._alpha = a if a is not None else 255
    def get_colorkey(self): return self._colorkey
    def set_colorkey(self, color): self._colorkey = _pg_color_to_list(color) if color else None
    def get_flags(self): return self._flags
    def get_bitsize(self): return 32
    def get_bytesize(self): return 4
    def get_masks(self): return (0xFF0000, 0xFF00, 0xFF, 0xFF000000)

    def fill(self, color, rect=None, special_flags=0):
        c = _pg_color_to_list(color)
        if rect:
            r = _PgRect(rect) if not isinstance(rect, _PgRect) else rect
            self._commands.append({'type': 'fillRect', 'color': c, 'rect': [r.x, r.y, r.width, r.height]})
        else:
            self._commands.append({'type': 'fill', 'color': c})
        return _PgRect(0, 0, self._width, self._height)

    def blit(self, source, dest, area=None, special_flags=0):
        dx, dy = 0, 0
        if isinstance(dest, _PgRect):
            dx, dy = dest.x, dest.y
        elif isinstance(dest, (list, tuple)):
            dx, dy = int(dest[0]), int(dest[1])
        if isinstance(source, _PgSurface):
            if source._is_text and source._text_info:
                ti = source._text_info
                self._commands.append({
                    'type': 'text', 'text': ti['text'], 'x': dx, 'y': dy,
                    'color': ti['color'], 'size': ti['size'],
                    'fontFamily': ti.get('fontFamily', 'sans-serif'),
                    'bold': ti.get('bold', False), 'italic': ti.get('italic', False),
                    'bgColor': ti.get('bgColor', None),
                })
            else:
                self._commands.append({
                    'type': 'surface', 'commands': list(source._commands),
                    'x': dx, 'y': dy, 'width': source._width, 'height': source._height,
                    'alpha': source._alpha,
                })
        return _PgRect(dx, dy, source._width if isinstance(source, _PgSurface) else 0, source._height if isinstance(source, _PgSurface) else 0)

    def convert(self): return self
    def convert_alpha(self): return self
    def copy(self):
        s = _PgSurface((self._width, self._height))
        s._commands = list(self._commands)
        s._is_text = self._is_text
        s._text_info = self._text_info
        return s
    def subsurface(self, rect):
        r = _PgRect(rect) if not isinstance(rect, _PgRect) else rect
        s = _PgSurface((r.width, r.height))
        return s
    def lock(self): pass
    def unlock(self): pass
    def mustlock(self): return False
    def get_locked(self): return False
    def get_locks(self): return ()

def _pg_send_frame():
    global _pg_display_surface, _pg_last_flip_time, _pg_frame_count
    if _pg_display_surface is None:
        return
    now = _pgtime.time()
    if now - _pg_last_flip_time < _pg_flip_interval:
        _pg_frame_count += 1
        _pg_display_surface._commands = []
        return
    _pg_last_flip_time = now
    _pg_frame_count += 1
    try:
        from js import postMessage
        frame = {
            'width': _pg_display_width,
            'height': _pg_display_height,
            'title': _pg_display_caption,
            'commands': _pg_display_surface._commands,
            'frame': _pg_frame_count,
        }
        postMessage(type='pygame-frame', frame=_pgjson.dumps(frame))
    except Exception:
        pass
    _pg_display_surface._commands = []

def _pg_check_quit():
    global _pg_quit_requested
    if _pg_quit_requested:
        return True
    if _pg_frame_count >= _pg_max_frames:
        return True
    elapsed = _pgtime.time() - _pg_start_time
    if elapsed > _pg_max_time:
        return True
    return False

_pg_display_mod = types.ModuleType('pygame.display')

def _pg_display_init():
    pass

def _pg_display_quit():
    pass

def _pg_display_set_mode(size=(0,0), flags=0, depth=0):
    global _pg_display_surface, _pg_display_width, _pg_display_height
    _pg_display_width = int(size[0])
    _pg_display_height = int(size[1])
    _pg_display_surface = _PgSurface(size)
    return _pg_display_surface

def _pg_display_set_caption(title, icontitle=None):
    global _pg_display_caption
    _pg_display_caption = str(title)

def _pg_display_get_caption():
    return (_pg_display_caption, _pg_display_caption)

def _pg_display_get_surface():
    return _pg_display_surface

async def _pg_display_flip():
    _pg_send_frame()
    await _pg_asyncio.sleep(0)

async def _pg_display_update(rects=None):
    _pg_send_frame()
    await _pg_asyncio.sleep(0)

def _pg_display_set_icon(surface): pass
def _pg_display_iconify(): pass
def _pg_display_toggle_fullscreen(): pass
def _pg_display_get_driver(): return 'web'
def _pg_display_Info():
    class _Info:
        hw = 0; wm = 1; video_mem = 0
        bitsize = 32; bytesize = 4
        current_w = _pg_display_width; current_h = _pg_display_height
    return _Info()

_pg_display_mod.init = _pg_display_init
_pg_display_mod.quit = _pg_display_quit
_pg_display_mod.set_mode = _pg_display_set_mode
_pg_display_mod.set_caption = _pg_display_set_caption
_pg_display_mod.get_caption = _pg_display_get_caption
_pg_display_mod.get_surface = _pg_display_get_surface
_pg_display_mod.flip = _pg_display_flip
_pg_display_mod.update = _pg_display_update
_pg_display_mod.set_icon = _pg_display_set_icon
_pg_display_mod.iconify = _pg_display_iconify
_pg_display_mod.toggle_fullscreen = _pg_display_toggle_fullscreen
_pg_display_mod.get_driver = _pg_display_get_driver
_pg_display_mod.Info = _pg_display_Info

_pg_draw_mod = types.ModuleType('pygame.draw')

def _pg_draw_rect(surface, color, rect, width=0, border_radius=0, **kw):
    c = _pg_color_to_list(color)
    r = _PgRect(rect) if not isinstance(rect, _PgRect) else rect
    surface._commands.append({'type': 'rect', 'color': c, 'rect': [r.x, r.y, r.width, r.height], 'width': int(width), 'border_radius': int(border_radius)})
    return _PgRect(r.x, r.y, r.width, r.height)

def _pg_draw_circle(surface, color, center, radius, width=0, **kw):
    c = _pg_color_to_list(color)
    surface._commands.append({'type': 'circle', 'color': c, 'center': [int(center[0]), int(center[1])], 'radius': int(radius), 'width': int(width)})
    return _PgRect(int(center[0])-int(radius), int(center[1])-int(radius), int(radius)*2, int(radius)*2)

def _pg_draw_ellipse(surface, color, rect, width=0):
    c = _pg_color_to_list(color)
    r = _PgRect(rect) if not isinstance(rect, _PgRect) else rect
    surface._commands.append({'type': 'ellipse', 'color': c, 'rect': [r.x, r.y, r.width, r.height], 'width': int(width)})
    return _PgRect(r.x, r.y, r.width, r.height)

def _pg_draw_line(surface, color, start_pos, end_pos, width=1):
    c = _pg_color_to_list(color)
    surface._commands.append({'type': 'line', 'color': c, 'start': [int(start_pos[0]), int(start_pos[1])], 'end': [int(end_pos[0]), int(end_pos[1])], 'width': int(width)})
    x1, y1 = int(start_pos[0]), int(start_pos[1])
    x2, y2 = int(end_pos[0]), int(end_pos[1])
    return _PgRect(min(x1,x2), min(y1,y2), abs(x2-x1)+1, abs(y2-y1)+1)

def _pg_draw_lines(surface, color, closed, points, width=1):
    c = _pg_color_to_list(color)
    pts = [[int(p[0]), int(p[1])] for p in points]
    surface._commands.append({'type': 'lines', 'color': c, 'points': pts, 'closed': bool(closed), 'width': int(width)})
    if len(pts) == 0:
        return _PgRect(0, 0, 0, 0)
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    minx, maxx = min(xs), max(xs)
    miny, maxy = min(ys), max(ys)
    return _PgRect(minx, miny, maxx - minx + 1, maxy - miny + 1)

def _pg_draw_aaline(surface, color, start_pos, end_pos, blend=1):
    return _pg_draw_line(surface, color, start_pos, end_pos, 1)

def _pg_draw_aalines(surface, color, closed, points, blend=1):
    return _pg_draw_lines(surface, color, closed, points, 1)

def _pg_draw_polygon(surface, color, points, width=0):
    c = _pg_color_to_list(color)
    pts = [[int(p[0]), int(p[1])] for p in points]
    surface._commands.append({'type': 'polygon', 'color': c, 'points': pts, 'width': int(width)})
    if len(pts) == 0:
        return _PgRect(0, 0, 0, 0)
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    minx, maxx = min(xs), max(xs)
    miny, maxy = min(ys), max(ys)
    return _PgRect(minx, miny, maxx - minx + 1, maxy - miny + 1)

def _pg_draw_arc(surface, color, rect, start_angle, stop_angle, width=1):
    c = _pg_color_to_list(color)
    r = _PgRect(rect) if not isinstance(rect, _PgRect) else rect
    surface._commands.append({'type': 'arc', 'color': c, 'rect': [r.x, r.y, r.width, r.height], 'start': float(start_angle), 'stop': float(stop_angle), 'width': int(width)})
    return _PgRect(r.x, r.y, r.width, r.height)

_pg_draw_mod.rect = _pg_draw_rect
_pg_draw_mod.circle = _pg_draw_circle
_pg_draw_mod.ellipse = _pg_draw_ellipse
_pg_draw_mod.line = _pg_draw_line
_pg_draw_mod.lines = _pg_draw_lines
_pg_draw_mod.aaline = _pg_draw_aaline
_pg_draw_mod.aalines = _pg_draw_aalines
_pg_draw_mod.polygon = _pg_draw_polygon
_pg_draw_mod.arc = _pg_draw_arc

_pg_event_mod = types.ModuleType('pygame.event')

QUIT = 256
KEYDOWN = 768
KEYUP = 769
MOUSEBUTTONDOWN = 1025
MOUSEBUTTONUP = 1026
MOUSEMOTION = 1024
ACTIVEEVENT = 1
VIDEORESIZE = 65537
VIDEOEXPOSE = 65538
USEREVENT = 32868

class _PgEvent:
    def __init__(self, event_type, **kw):
        self.type = event_type
        self.key = kw.get('key', 0)
        self.mod = kw.get('mod', 0)
        self.unicode = kw.get('unicode', '')
        self.pos = kw.get('pos', (0, 0))
        self.rel = kw.get('rel', (0, 0))
        self.button = kw.get('button', 0)
        self.buttons = kw.get('buttons', (0, 0, 0))
        for k, v in kw.items():
            if not hasattr(self, k):
                setattr(self, k, v)
    def __repr__(self):
        return f"<Event({self.type})>"

def _pg_drain_js_events():
    global _pg_mouse_pos, _pg_mouse_buttons, _pg_keys_pressed
    try:
        from js import _pgDrainEvents
        raw = _pgDrainEvents()
        if raw and raw != '[]':
            pending = _pgjson.loads(raw)
            for event_data in pending:
                _pg_handle_event(event_data)
    except Exception:
        pass

def _pg_event_get(eventtype=None):
    _pg_drain_js_events()
    events = list(_pg_event_queue)
    _pg_event_queue.clear()
    if _pg_check_quit():
        events.append(_PgEvent(QUIT))
    if eventtype is not None:
        if isinstance(eventtype, int):
            events = [e for e in events if e.type == eventtype]
        elif isinstance(eventtype, (list, tuple)):
            events = [e for e in events if e.type in eventtype]
    return events

def _pg_event_poll():
    _pg_drain_js_events()
    if _pg_event_queue:
        return _pg_event_queue.pop(0)
    if _pg_check_quit():
        return _PgEvent(QUIT)
    return _PgEvent(0)

def _pg_event_wait():
    return _pg_event_poll()

def _pg_event_pump():
    _pg_drain_js_events()

def _pg_event_clear(eventtype=None):
    if eventtype is None:
        _pg_event_queue.clear()
    else:
        _pg_event_queue[:] = [e for e in _pg_event_queue if e.type != eventtype]

def _pg_event_set_blocked(event_type): pass
def _pg_event_set_allowed(event_type): pass
def _pg_event_get_blocked(event_type): return False
def _pg_event_set_grab(grab): pass
def _pg_event_get_grab(): return False
def _pg_event_post(event): _pg_event_queue.append(event)
def _pg_event_Event(event_type, **kw): return _PgEvent(event_type, **kw)

_pg_event_mod.get = _pg_event_get
_pg_event_mod.poll = _pg_event_poll
_pg_event_mod.wait = _pg_event_wait
_pg_event_mod.pump = _pg_event_pump
_pg_event_mod.clear = _pg_event_clear
_pg_event_mod.set_blocked = _pg_event_set_blocked
_pg_event_mod.set_allowed = _pg_event_set_allowed
_pg_event_mod.get_blocked = _pg_event_get_blocked
_pg_event_mod.set_grab = _pg_event_set_grab
_pg_event_mod.get_grab = _pg_event_get_grab
_pg_event_mod.post = _pg_event_post
_pg_event_mod.Event = _pg_event_Event

_pg_font_mod = types.ModuleType('pygame.font')

class _PgFont:
    def __init__(self, name=None, size=24):
        self._name = name or 'sans-serif'
        self._size = int(size) if size else 24
        self._bold = False
        self._italic = False
        self._underline = False

    def render(self, text, antialias=True, color=(255,255,255), background=None):
        c = _pg_color_to_list(color)
        bg = _pg_color_to_list(background) if background else None
        char_w = max(self._size * 0.6, 6)
        w = int(len(str(text)) * char_w) + 4
        h = int(self._size * 1.4)
        s = _PgSurface((w, h))
        s._is_text = True
        s._text_info = {
            'text': str(text), 'color': c, 'size': self._size,
            'fontFamily': self._name, 'bold': self._bold, 'italic': self._italic,
            'bgColor': bg,
        }
        return s

    def size(self, text):
        char_w = max(self._size * 0.6, 6)
        return (int(len(str(text)) * char_w) + 4, int(self._size * 1.4))

    def set_bold(self, b): self._bold = bool(b)
    def get_bold(self): return self._bold
    def set_italic(self, i): self._italic = bool(i)
    def get_italic(self): return self._italic
    def set_underline(self, u): self._underline = bool(u)
    def get_underline(self): return self._underline
    def get_height(self): return int(self._size * 1.4)
    def get_linesize(self): return int(self._size * 1.4)
    def get_ascent(self): return int(self._size * 1.0)
    def get_descent(self): return int(self._size * 0.3)
    def metrics(self, text): return [(0, self._size, 0, self._size, int(self._size*0.6))] * len(text)

class _PgSysFont:
    def __new__(cls, name, size, bold=False, italic=False):
        f = _PgFont(name, size)
        f._bold = bold
        f._italic = italic
        return f

def _pg_font_init(): pass
def _pg_font_quit(): pass
def _pg_font_get_init(): return True
def _pg_font_get_default_font(): return 'sans-serif'
def _pg_font_get_fonts(): return ['arial', 'helvetica', 'courier', 'times']
def _pg_font_match_font(name, bold=False, italic=False): return name

_pg_font_mod.init = _pg_font_init
_pg_font_mod.quit = _pg_font_quit
_pg_font_mod.get_init = _pg_font_get_init
_pg_font_mod.Font = _PgFont
_pg_font_mod.SysFont = _PgSysFont
_pg_font_mod.get_default_font = _pg_font_get_default_font
_pg_font_mod.get_fonts = _pg_font_get_fonts
_pg_font_mod.match_font = _pg_font_match_font

_pg_time_mod = types.ModuleType('pygame.time')

class _PgClock:
    def __init__(self):
        self._last_tick = _pgtime.time()
        self._dt = 0
        self._target_fps = 0
        self._frame_count = 0
    def tick(self, fps=0):
        now = _pgtime.time()
        self._dt = now - self._last_tick
        self._last_tick = now
        self._target_fps = fps
        self._frame_count += 1
        dt_ms = int(self._dt * 1000)
        if dt_ms == 0:
            return 16
        return dt_ms
    def tick_busy_loop(self, fps=0):
        return self.tick(fps)
    def get_time(self):
        return int(self._dt * 1000)
    def get_rawtime(self):
        return int(self._dt * 1000)
    def get_fps(self):
        return 1.0 / self._dt if self._dt > 0 else 0.0

def _pg_time_get_ticks():
    return int((_pgtime.time() - _pg_start_time) * 1000) if _pg_start_time else 0

def _pg_time_wait(ms):
    return int(ms)

def _pg_time_delay(ms):
    return int(ms)

def _pg_time_set_timer(event_type, millis, loops=0):
    pass

_pg_time_mod.Clock = _PgClock
_pg_time_mod.get_ticks = _pg_time_get_ticks
_pg_time_mod.wait = _pg_time_wait
_pg_time_mod.delay = _pg_time_delay
_pg_time_mod.set_timer = _pg_time_set_timer

_pg_key_mod = types.ModuleType('pygame.key')

K_BACKSPACE = 8; K_TAB = 9; K_RETURN = 13; K_ESCAPE = 27; K_SPACE = 32
K_UP = 273; K_DOWN = 274; K_RIGHT = 275; K_LEFT = 276
K_a = 97; K_b = 98; K_c = 99; K_d = 100; K_e = 101; K_f = 102; K_g = 103
K_h = 104; K_i = 105; K_j = 106; K_k = 107; K_l = 108; K_m = 109; K_n = 110
K_o = 111; K_p = 112; K_q = 113; K_r = 114; K_s = 115; K_t = 116; K_u = 117
K_v = 118; K_w = 119; K_x = 120; K_y = 121; K_z = 122
K_0 = 48; K_1 = 49; K_2 = 50; K_3 = 51; K_4 = 52; K_5 = 53; K_6 = 54; K_7 = 55; K_8 = 56; K_9 = 57
K_F1 = 282; K_F2 = 283; K_F3 = 284; K_F4 = 285; K_F5 = 286; K_F6 = 287
K_F7 = 288; K_F8 = 289; K_F9 = 290; K_F10 = 291; K_F11 = 292; K_F12 = 293
K_LSHIFT = 304; K_RSHIFT = 303; K_LCTRL = 306; K_RCTRL = 305; K_LALT = 308; K_RALT = 307
KMOD_NONE = 0; KMOD_LSHIFT = 1; KMOD_RSHIFT = 2; KMOD_SHIFT = 3; KMOD_LCTRL = 64; KMOD_RCTRL = 128; KMOD_CTRL = 192

class _PgKeyState:
    def __init__(self):
        self._data = [False] * 512
    def __getitem__(self, k):
        if 0 <= k < 512: return self._data[k]
        return False

def _pg_key_get_pressed():
    _pg_drain_js_events()
    state = _PgKeyState()
    for k in _pg_keys_pressed:
        if 0 <= k < 512:
            state._data[k] = True
    return state

def _pg_key_get_mods():
    return 0

def _pg_key_name(key):
    names = {K_UP: 'up', K_DOWN: 'down', K_LEFT: 'left', K_RIGHT: 'right',
             K_SPACE: 'space', K_RETURN: 'return', K_ESCAPE: 'escape'}
    if key in names: return names[key]
    if 97 <= key <= 122: return chr(key)
    if 48 <= key <= 57: return chr(key)
    return f'[{key}]'

def _pg_key_set_repeat(delay=0, interval=0): pass
def _pg_key_get_repeat(): return (0, 0)
def _pg_key_get_focused(): return True

_pg_key_mod.get_pressed = _pg_key_get_pressed
_pg_key_mod.get_mods = _pg_key_get_mods
_pg_key_mod.name = _pg_key_name
_pg_key_mod.set_repeat = _pg_key_set_repeat
_pg_key_mod.get_repeat = _pg_key_get_repeat
_pg_key_mod.get_focused = _pg_key_get_focused

_pg_mouse_mod = types.ModuleType('pygame.mouse')

def _pg_mouse_get_pos(): return _pg_mouse_pos
def _pg_mouse_get_pressed(num_buttons=3): return _pg_mouse_buttons[:num_buttons]
def _pg_mouse_get_rel(): return (0, 0)
def _pg_mouse_set_pos(pos): pass
def _pg_mouse_set_visible(visible): return True
def _pg_mouse_get_visible(): return True
def _pg_mouse_set_cursor(*a): pass
def _pg_mouse_get_cursor(): return (0, 0, (0,), (0,))
def _pg_mouse_get_focused(): return True

_pg_mouse_mod.get_pos = _pg_mouse_get_pos
_pg_mouse_mod.get_pressed = _pg_mouse_get_pressed
_pg_mouse_mod.get_rel = _pg_mouse_get_rel
_pg_mouse_mod.set_pos = _pg_mouse_set_pos
_pg_mouse_mod.set_visible = _pg_mouse_set_visible
_pg_mouse_mod.get_visible = _pg_mouse_get_visible
_pg_mouse_mod.set_cursor = _pg_mouse_set_cursor
_pg_mouse_mod.get_cursor = _pg_mouse_get_cursor
_pg_mouse_mod.get_focused = _pg_mouse_get_focused

_pg_image_mod = types.ModuleType('pygame.image')
def _pg_image_load(filename, namehint=None):
    return _PgSurface((64, 64))
def _pg_image_save(surface, filename): pass
def _pg_image_tostring(surface, format, flipped=False): return b''
def _pg_image_fromstring(string, size, format, flipped=False): return _PgSurface(size)
_pg_image_mod.load = _pg_image_load
_pg_image_mod.save = _pg_image_save
_pg_image_mod.tostring = _pg_image_tostring
_pg_image_mod.fromstring = _pg_image_fromstring

_pg_transform_mod = types.ModuleType('pygame.transform')
def _pg_transform_scale(surface, size):
    s = _PgSurface(size)
    s._commands = list(surface._commands)
    s._is_text = surface._is_text
    s._text_info = surface._text_info
    return s
def _pg_transform_rotate(surface, angle): return surface.copy()
def _pg_transform_flip(surface, xbool, ybool): return surface.copy()
def _pg_transform_smoothscale(surface, size): return _pg_transform_scale(surface, size)
def _pg_transform_scale2x(surface): return _pg_transform_scale(surface, (surface._width*2, surface._height*2))
def _pg_transform_rotozoom(surface, angle, scale): return surface.copy()
_pg_transform_mod.scale = _pg_transform_scale
_pg_transform_mod.rotate = _pg_transform_rotate
_pg_transform_mod.flip = _pg_transform_flip
_pg_transform_mod.smoothscale = _pg_transform_smoothscale
_pg_transform_mod.scale2x = _pg_transform_scale2x
_pg_transform_mod.rotozoom = _pg_transform_rotozoom

_pg_mixer_mod = types.ModuleType('pygame.mixer')
class _PgSound:
    def __init__(self, *a, **kw): pass
    def play(self, loops=0, maxtime=0, fade_ms=0): return None
    def stop(self): pass
    def set_volume(self, v): pass
    def get_volume(self): return 1.0
    def get_length(self): return 0.0
    def fadeout(self, ms): pass
class _PgChannel:
    def __init__(self, id=0): self._id = id
    def play(self, sound, loops=0, maxtime=0, fade_ms=0): return None
    def stop(self): pass
    def pause(self): pass
    def unpause(self): pass
    def set_volume(self, v, r=None): pass
    def get_volume(self): return 1.0
    def get_busy(self): return False
_pg_mixer_mod.init = lambda *a, **kw: None
_pg_mixer_mod.quit = lambda: None
_pg_mixer_mod.get_init = lambda: (22050, -16, 2)
_pg_mixer_mod.pre_init = lambda *a, **kw: None
_pg_mixer_mod.Sound = _PgSound
_pg_mixer_mod.Channel = _PgChannel
_pg_mixer_mod.get_num_channels = lambda: 8
_pg_mixer_mod.set_num_channels = lambda n: None
_pg_mixer_mod.get_busy = lambda: False
_pg_mixer_mod.stop = lambda: None
_pg_mixer_mod.pause = lambda: None
_pg_mixer_mod.unpause = lambda: None
_pg_mixer_mod.fadeout = lambda ms: None
_pg_mixer_mod.set_reserved = lambda n: None
_pg_mixer_mod.find_channel = lambda force=False: _PgChannel()

_pg_mixer_music_mod = types.ModuleType('pygame.mixer.music')
_pg_mixer_music_mod.load = lambda f: None
_pg_mixer_music_mod.play = lambda loops=0, start=0.0: None
_pg_mixer_music_mod.stop = lambda: None
_pg_mixer_music_mod.pause = lambda: None
_pg_mixer_music_mod.unpause = lambda: None
_pg_mixer_music_mod.fadeout = lambda ms: None
_pg_mixer_music_mod.set_volume = lambda v: None
_pg_mixer_music_mod.get_volume = lambda: 1.0
_pg_mixer_music_mod.get_busy = lambda: False
_pg_mixer_music_mod.set_pos = lambda pos: None
_pg_mixer_music_mod.get_pos = lambda: 0
_pg_mixer_music_mod.queue = lambda f: None
_pg_mixer_music_mod.set_endevent = lambda t=0: None
_pg_mixer_music_mod.get_endevent = lambda: 0
_pg_mixer_mod.music = _pg_mixer_music_mod

_pg_sprite_mod = types.ModuleType('pygame.sprite')
class _PgSprite:
    def __init__(self, *groups):
        self.image = None
        self.rect = _PgRect(0, 0, 0, 0)
        self._groups = set()
        for g in groups:
            g.add(self)
    def update(self, *a, **kw): pass
    def kill(self):
        for g in list(self._groups):
            g.remove(self)
    def alive(self): return len(self._groups) > 0
    def add(self, *groups):
        for g in groups: g.add(self)
    def remove(self, *groups):
        for g in groups: g.remove(self)

class _PgGroup:
    def __init__(self, *sprites):
        self._sprites = set()
        for s in sprites: self.add(s)
    def add(self, *sprites):
        for s in sprites:
            self._sprites.add(s)
            s._groups.add(self)
    def remove(self, *sprites):
        for s in sprites:
            self._sprites.discard(s)
            s._groups.discard(self)
    def has(self, *sprites):
        return all(s in self._sprites for s in sprites)
    def update(self, *a, **kw):
        for s in self._sprites: s.update(*a, **kw)
    def draw(self, surface):
        for s in self._sprites:
            if s.image and s.rect:
                surface.blit(s.image, s.rect)
    def empty(self):
        for s in list(self._sprites): s._groups.discard(self)
        self._sprites.clear()
    def sprites(self): return list(self._sprites)
    def copy(self):
        g = _PgGroup()
        g._sprites = set(self._sprites)
        return g
    def __len__(self): return len(self._sprites)
    def __bool__(self): return bool(self._sprites)
    def __iter__(self): return iter(self._sprites)
    def __contains__(self, item): return item in self._sprites

def _pg_sprite_groupcollide(group1, group2, dokill1, dokill2, collided=None):
    result = {}
    for s1 in list(group1._sprites):
        hits = []
        for s2 in list(group2._sprites):
            if s1.rect.colliderect(s2.rect):
                hits.append(s2)
        if hits:
            result[s1] = hits
            if dokill1: s1.kill()
            if dokill2:
                for s2 in hits: s2.kill()
    return result

def _pg_sprite_spritecollide(sprite, group, dokill, collided=None):
    hits = [s for s in group._sprites if sprite.rect.colliderect(s.rect)]
    if dokill:
        for s in hits: s.kill()
    return hits

def _pg_sprite_collide_rect(left, right):
    return left.rect.colliderect(right.rect)

_pg_sprite_mod.Sprite = _PgSprite
_pg_sprite_mod.Group = _PgGroup
_pg_sprite_mod.GroupSingle = _PgGroup
_pg_sprite_mod.RenderPlain = _PgGroup
_pg_sprite_mod.RenderClear = _PgGroup
_pg_sprite_mod.RenderUpdates = _PgGroup
_pg_sprite_mod.OrderedUpdates = _PgGroup
_pg_sprite_mod.groupcollide = _pg_sprite_groupcollide
_pg_sprite_mod.spritecollide = _pg_sprite_spritecollide
_pg_sprite_mod.collide_rect = _pg_sprite_collide_rect

_pg_mask_mod = types.ModuleType('pygame.mask')
class _PgMask:
    def __init__(self, size=(0,0)):
        self.w = size[0]; self.h = size[1]
    def get_size(self): return (self.w, self.h)
    def overlap(self, other, offset): return None
    def get_at(self, pos): return 0
    def set_at(self, pos, value=1): pass
    def count(self): return 0
    def fill(self): pass
    def clear(self): pass
_pg_mask_mod.Mask = _PgMask
_pg_mask_mod.from_surface = lambda surface, threshold=127: _PgMask(surface.get_size())

_pg_math_mod = types.ModuleType('pygame.math')
class _PgVector2:
    def __init__(self, x=0, y=0):
        if isinstance(x, (list, tuple, _PgVector2)):
            self.x, self.y = float(x[0]), float(x[1])
        else:
            self.x, self.y = float(x), float(y)
    def __add__(self, o): return _PgVector2(self.x+o[0], self.y+o[1])
    def __sub__(self, o): return _PgVector2(self.x-o[0], self.y-o[1])
    def __mul__(self, s):
        if isinstance(s, (int, float)): return _PgVector2(self.x*s, self.y*s)
        return self.x*s[0]+self.y*s[1]
    def __rmul__(self, s): return self.__mul__(s)
    def __truediv__(self, s): return _PgVector2(self.x/s, self.y/s)
    def __neg__(self): return _PgVector2(-self.x, -self.y)
    def __getitem__(self, i): return (self.x, self.y)[i]
    def __len__(self): return 2
    def __iter__(self): return iter((self.x, self.y))
    def __repr__(self): return f"<Vector2({self.x}, {self.y})>"
    def length(self): return _pgmath.sqrt(self.x**2+self.y**2)
    def length_squared(self): return self.x**2+self.y**2
    def normalize(self):
        l = self.length()
        if l: return _PgVector2(self.x/l, self.y/l)
        return _PgVector2()
    def normalize_ip(self):
        l = self.length()
        if l: self.x /= l; self.y /= l
    def dot(self, o): return self.x*o[0]+self.y*o[1]
    def cross(self, o): return self.x*o[1]-self.y*o[0]
    def distance_to(self, o): return _pgmath.sqrt((self.x-o[0])**2+(self.y-o[1])**2)
    def angle_to(self, o): return _pgmath.degrees(_pgmath.atan2(o[1]-self.y, o[0]-self.x))
    def rotate(self, angle):
        rad = _pgmath.radians(angle)
        c, s = _pgmath.cos(rad), _pgmath.sin(rad)
        return _PgVector2(self.x*c-self.y*s, self.x*s+self.y*c)
    def rotate_ip(self, angle):
        v = self.rotate(angle)
        self.x, self.y = v.x, v.y
    def lerp(self, o, t): return _PgVector2(self.x+(o[0]-self.x)*t, self.y+(o[1]-self.y)*t)
    def copy(self): return _PgVector2(self.x, self.y)
    def update(self, *a):
        if len(a) == 2: self.x, self.y = float(a[0]), float(a[1])
        elif len(a) == 1 and isinstance(a[0], (list, tuple, _PgVector2)): self.x, self.y = float(a[0][0]), float(a[0][1])
_pg_math_mod.Vector2 = _PgVector2

def _pg_handle_event(event_data):
    global _pg_mouse_pos, _pg_mouse_buttons, _pg_keys_pressed
    etype = event_data.get('type', '')
    if etype == 'mousemove':
        _pg_mouse_pos = (event_data.get('x', 0), event_data.get('y', 0))
        _pg_event_queue.append(_PgEvent(MOUSEMOTION, pos=_pg_mouse_pos, rel=(0,0), buttons=_pg_mouse_buttons))
    elif etype == 'mousedown':
        _pg_mouse_pos = (event_data.get('x', 0), event_data.get('y', 0))
        btn = event_data.get('button', 0) + 1
        bl = list(_pg_mouse_buttons)
        if 1 <= btn <= 3: bl[btn-1] = True
        _pg_mouse_buttons = tuple(bl)
        _pg_event_queue.append(_PgEvent(MOUSEBUTTONDOWN, pos=_pg_mouse_pos, button=btn))
    elif etype == 'mouseup':
        _pg_mouse_pos = (event_data.get('x', 0), event_data.get('y', 0))
        btn = event_data.get('button', 0) + 1
        bl = list(_pg_mouse_buttons)
        if 1 <= btn <= 3: bl[btn-1] = False
        _pg_mouse_buttons = tuple(bl)
        _pg_event_queue.append(_PgEvent(MOUSEBUTTONUP, pos=_pg_mouse_pos, button=btn))
    elif etype == 'keydown':
        key = event_data.get('key', 0)
        _pg_keys_pressed[key] = True
        _pg_event_queue.append(_PgEvent(KEYDOWN, key=key, mod=0, unicode=event_data.get('char', '')))
    elif etype == 'keyup':
        key = event_data.get('key', 0)
        _pg_keys_pressed.pop(key, None)
        _pg_event_queue.append(_PgEvent(KEYUP, key=key, mod=0))

_pg_main = types.ModuleType('pygame')
_pg_main.Surface = _PgSurface
_pg_main.Rect = _PgRect
_pg_main.Color = _PgColor

_pg_main.display = _pg_display_mod
_pg_main.draw = _pg_draw_mod
_pg_main.event = _pg_event_mod
_pg_main.font = _pg_font_mod
_pg_main.time = _pg_time_mod
_pg_main.key = _pg_key_mod
_pg_main.mouse = _pg_mouse_mod
_pg_main.image = _pg_image_mod
_pg_main.transform = _pg_transform_mod
_pg_main.mixer = _pg_mixer_mod
_pg_main.sprite = _pg_sprite_mod
_pg_main.mask = _pg_mask_mod
_pg_main.math = _pg_math_mod

def _pg_init():
    global _pg_initialized, _pg_start_time, _pg_frame_count, _pg_quit_requested
    _pg_initialized = True
    _pg_start_time = _pgtime.time()
    _pg_frame_count = 0
    _pg_quit_requested = False
    return (6, 0)

def _pg_quit():
    global _pg_initialized, _pg_quit_requested
    _pg_initialized = False
    _pg_quit_requested = True
    _pg_send_frame()

_pg_main.init = _pg_init
_pg_main.quit = _pg_quit
_pg_main.get_init = lambda: _pg_initialized

_pg_main.QUIT = QUIT
_pg_main.KEYDOWN = KEYDOWN
_pg_main.KEYUP = KEYUP
_pg_main.MOUSEBUTTONDOWN = MOUSEBUTTONDOWN
_pg_main.MOUSEBUTTONUP = MOUSEBUTTONUP
_pg_main.MOUSEMOTION = MOUSEMOTION
_pg_main.ACTIVEEVENT = ACTIVEEVENT
_pg_main.VIDEORESIZE = VIDEORESIZE
_pg_main.VIDEOEXPOSE = VIDEOEXPOSE
_pg_main.USEREVENT = USEREVENT

_pg_main.K_BACKSPACE = K_BACKSPACE; _pg_main.K_TAB = K_TAB
_pg_main.K_RETURN = K_RETURN; _pg_main.K_ESCAPE = K_ESCAPE; _pg_main.K_SPACE = K_SPACE
_pg_main.K_UP = K_UP; _pg_main.K_DOWN = K_DOWN; _pg_main.K_RIGHT = K_RIGHT; _pg_main.K_LEFT = K_LEFT
_pg_main.K_a = K_a; _pg_main.K_b = K_b; _pg_main.K_c = K_c; _pg_main.K_d = K_d; _pg_main.K_e = K_e
_pg_main.K_f = K_f; _pg_main.K_g = K_g; _pg_main.K_h = K_h; _pg_main.K_i = K_i; _pg_main.K_j = K_j
_pg_main.K_k = K_k; _pg_main.K_l = K_l; _pg_main.K_m = K_m; _pg_main.K_n = K_n; _pg_main.K_o = K_o
_pg_main.K_p = K_p; _pg_main.K_q = K_q; _pg_main.K_r = K_r; _pg_main.K_s = K_s; _pg_main.K_t = K_t
_pg_main.K_u = K_u; _pg_main.K_v = K_v; _pg_main.K_w = K_w; _pg_main.K_x = K_x; _pg_main.K_y = K_y
_pg_main.K_z = K_z
_pg_main.K_0 = K_0; _pg_main.K_1 = K_1; _pg_main.K_2 = K_2; _pg_main.K_3 = K_3; _pg_main.K_4 = K_4
_pg_main.K_5 = K_5; _pg_main.K_6 = K_6; _pg_main.K_7 = K_7; _pg_main.K_8 = K_8; _pg_main.K_9 = K_9
_pg_main.K_F1 = K_F1; _pg_main.K_F2 = K_F2; _pg_main.K_F3 = K_F3; _pg_main.K_F4 = K_F4
_pg_main.K_F5 = K_F5; _pg_main.K_F6 = K_F6; _pg_main.K_F7 = K_F7; _pg_main.K_F8 = K_F8
_pg_main.K_F9 = K_F9; _pg_main.K_F10 = K_F10; _pg_main.K_F11 = K_F11; _pg_main.K_F12 = K_F12
_pg_main.K_LSHIFT = K_LSHIFT; _pg_main.K_RSHIFT = K_RSHIFT
_pg_main.K_LCTRL = K_LCTRL; _pg_main.K_RCTRL = K_RCTRL
_pg_main.K_LALT = K_LALT; _pg_main.K_RALT = K_RALT
_pg_main.KMOD_NONE = KMOD_NONE; _pg_main.KMOD_LSHIFT = KMOD_LSHIFT
_pg_main.KMOD_RSHIFT = KMOD_RSHIFT; _pg_main.KMOD_SHIFT = KMOD_SHIFT
_pg_main.KMOD_LCTRL = KMOD_LCTRL; _pg_main.KMOD_RCTRL = KMOD_RCTRL; _pg_main.KMOD_CTRL = KMOD_CTRL

_pg_main.HWSURFACE = 1; _pg_main.DOUBLEBUF = 0x40000000; _pg_main.FULLSCREEN = 0x80000000
_pg_main.RESIZABLE = 0x00000010; _pg_main.NOFRAME = 0x00000020; _pg_main.SCALED = 0x00000200
_pg_main.SRCALPHA = 0x00010000

_pg_main.error = type('error', (Exception,), {})

_pg_locals_mod = types.ModuleType('pygame.locals')
for _attr in dir(_pg_main):
    if _attr.startswith('K_') or _attr.startswith('KMOD_') or _attr in (
        'QUIT', 'KEYDOWN', 'KEYUP', 'MOUSEBUTTONDOWN', 'MOUSEBUTTONUP', 'MOUSEMOTION',
        'ACTIVEEVENT', 'VIDEORESIZE', 'VIDEOEXPOSE', 'USEREVENT',
        'HWSURFACE', 'DOUBLEBUF', 'FULLSCREEN', 'RESIZABLE', 'NOFRAME', 'SCALED', 'SRCALPHA',
    ):
        setattr(_pg_locals_mod, _attr, getattr(_pg_main, _attr))

_pg_cursors_mod = types.ModuleType('pygame.cursors')
_pg_cursors_mod.arrow = ((16,16),(0,0),(0,)*16,(0,)*16)
_pg_cursors_mod.diamond = _pg_cursors_mod.arrow
_pg_cursors_mod.broken_x = _pg_cursors_mod.arrow
_pg_cursors_mod.tri_left = _pg_cursors_mod.arrow
_pg_cursors_mod.tri_right = _pg_cursors_mod.arrow

sys.modules['pygame'] = _pg_main
sys.modules['pygame.display'] = _pg_display_mod
sys.modules['pygame.draw'] = _pg_draw_mod
sys.modules['pygame.event'] = _pg_event_mod
sys.modules['pygame.font'] = _pg_font_mod
sys.modules['pygame.time'] = _pg_time_mod
sys.modules['pygame.key'] = _pg_key_mod
sys.modules['pygame.mouse'] = _pg_mouse_mod
sys.modules['pygame.image'] = _pg_image_mod
sys.modules['pygame.transform'] = _pg_transform_mod
sys.modules['pygame.mixer'] = _pg_mixer_mod
sys.modules['pygame.mixer.music'] = _pg_mixer_music_mod
sys.modules['pygame.sprite'] = _pg_sprite_mod
sys.modules['pygame.mask'] = _pg_mask_mod
sys.modules['pygame.math'] = _pg_math_mod
sys.modules['pygame.locals'] = _pg_locals_mod
sys.modules['pygame.cursors'] = _pg_cursors_mod
sys.modules['pygame.surfarray'] = types.ModuleType('pygame.surfarray')
sys.modules['pygame.sndarray'] = types.ModuleType('pygame.sndarray')
sys.modules['pygame.freetype'] = _pg_font_mod
`;

const TURTLE_STUB = `
import sys
import types
import json as _tjson
import math as _tmath

_turtle_canvas_width = 800
_turtle_canvas_height = 600
_turtle_bgcolor = 'white'
_turtle_title = 'Python Turtle Graphics'
_turtle_draw_items = []
_turtle_turtles = []
_turtle_screen = None
_turtle_default_turtle = None
_turtle_tracer_on = True
_turtle_tracer_n = 1
_turtle_frame_count = 0
_turtle_setup_width = 800
_turtle_setup_height = 600
_turtle_timers = []

def _turtle_send_frame():
    from js import postMessage
    turtles_data = []
    for t in _turtle_turtles:
        turtles_data.append({
            'x': t._x,
            'y': t._y,
            'heading': t._heading,
            'visible': t._visible,
            'shape': t._shape,
            'color': t._pencolor,
            'fillColor': t._fillcolor,
            'penSize': t._pensize,
            'shapeSize': list(t._shapesize),
        })
    frame = {
        'width': _turtle_canvas_width,
        'height': _turtle_canvas_height,
        'bgcolor': _turtle_bgcolor,
        'title': _turtle_title,
        'items': _turtle_draw_items[:],
        'turtles': turtles_data,
    }
    postMessage(type='turtle-frame', frame=_tjson.dumps(frame))

def _turtle_process_timers():
    import time
    global _turtle_timers
    _turtle_send_frame()
    max_iterations = 600
    iteration = 0
    while _turtle_timers and iteration < max_iterations:
        iteration += 1
        _turtle_timers.sort(key=lambda x: x[0])
        fire_time, fn = _turtle_timers[0]
        now = time.time()
        wait = fire_time - now
        if wait > 0:
            time.sleep(min(wait, 0.05))
            now = time.time()
        if now >= fire_time:
            _turtle_timers.pop(0)
            fn()
            _turtle_send_frame()
        else:
            time.sleep(0.01)

class _TurtleScreen:
    def __init__(self):
        pass

    def bgcolor(self, *args):
        global _turtle_bgcolor
        if len(args) == 0:
            return _turtle_bgcolor
        if len(args) == 1:
            _turtle_bgcolor = args[0]
        elif len(args) == 3:
            _turtle_bgcolor = _color_to_str(args)
        _turtle_maybe_update()

    def title(self, t):
        global _turtle_title
        _turtle_title = str(t)

    def setup(self, width=None, height=None, startx=None, starty=None):
        global _turtle_canvas_width, _turtle_canvas_height, _turtle_setup_width, _turtle_setup_height
        if width is not None:
            if isinstance(width, float) and width <= 1.0:
                width = int(width * 800)
            _turtle_canvas_width = int(width)
            _turtle_setup_width = _turtle_canvas_width
        if height is not None:
            if isinstance(height, float) and height <= 1.0:
                height = int(height * 600)
            _turtle_canvas_height = int(height)
            _turtle_setup_height = _turtle_canvas_height

    def screensize(self, canvwidth=None, canvheight=None, bg=None):
        global _turtle_canvas_width, _turtle_canvas_height, _turtle_bgcolor
        if canvwidth is not None:
            _turtle_canvas_width = int(canvwidth)
        if canvheight is not None:
            _turtle_canvas_height = int(canvheight)
        if bg is not None:
            _turtle_bgcolor = bg
        return (_turtle_canvas_width, _turtle_canvas_height)

    def clear(self):
        global _turtle_draw_items
        _turtle_draw_items = []
        _turtle_maybe_update()

    def reset(self):
        global _turtle_draw_items, _turtle_turtles
        _turtle_draw_items = []
        _turtle_turtles = []
        _turtle_maybe_update()

    def tracer(self, n=None, delay=None):
        global _turtle_tracer_on, _turtle_tracer_n
        if n is None:
            return _turtle_tracer_n
        _turtle_tracer_n = n
        _turtle_tracer_on = (n > 0)

    def update(self):
        _turtle_send_frame()

    def mainloop(self):
        _turtle_process_timers()

    def done(self):
        _turtle_process_timers()

    def exitonclick(self):
        _turtle_process_timers()

    def bye(self):
        _turtle_send_frame()

    def window_width(self):
        return _turtle_canvas_width

    def window_height(self):
        return _turtle_canvas_height

    def colormode(self, cmode=None):
        if cmode is None:
            return 255
        return cmode

    def delay(self, delay=None):
        return 0

    def listen(self):
        pass

    def onkey(self, fun, key):
        pass

    def onkeypress(self, fun, key=None):
        pass

    def onkeyrelease(self, fun, key=None):
        pass

    def onclick(self, fun, btn=1, add=None):
        pass

    def onscreenclick(self, fun, btn=1, add=None):
        pass

    def ontimer(self, fun, t=0):
        import time
        global _turtle_timers
        _turtle_timers.append((time.time() + t / 1000.0, fun))

    def bgpic(self, picname=None):
        return 'nopic'

    def mode(self, mode=None):
        if mode is None:
            return 'standard'

    def register_shape(self, name, shape=None):
        pass

    addshape = register_shape

    def getshapes(self):
        return ['arrow', 'turtle', 'circle', 'square', 'triangle', 'classic']

    def getcanvas(self):
        return None

    def textinput(self, title, prompt):
        return ''

    def numinput(self, title, prompt, default=None, minval=None, maxval=None):
        return default

    def setworldcoordinates(self, llx, lly, urx, ury):
        pass

def _color_to_str(c):
    if isinstance(c, str):
        return c
    if isinstance(c, (list, tuple)):
        if len(c) == 3:
            r, g, b = c
            if all(isinstance(v, float) and v <= 1.0 for v in c):
                r, g, b = int(r * 255), int(g * 255), int(b * 255)
            return 'rgb(' + str(int(r)) + ',' + str(int(g)) + ',' + str(int(b)) + ')'
        if len(c) == 1:
            return _color_to_str(c[0])
    return str(c)

def _turtle_maybe_update():
    global _turtle_frame_count
    if not _turtle_tracer_on:
        return
    _turtle_frame_count += 1
    if _turtle_frame_count % max(1, _turtle_tracer_n) == 0:
        _turtle_send_frame()

class _Turtle:
    def __init__(self, shape='classic', undobuffersize=1000, visible=True):
        self._x = 0.0
        self._y = 0.0
        self._heading = 90.0
        self._pendown = True
        self._pensize = 1
        self._pencolor = 'black'
        self._fillcolor = ''
        self._speed = 3
        self._visible = visible
        self._shape = shape if isinstance(shape, str) else 'classic'
        self._shapesize = [1, 1, 1]
        self._filling = False
        self._fill_points = []
        self._stamp_items = []
        self._undo_buffer = []
        _turtle_turtles.append(self)

    def forward(self, distance):
        rad = _tmath.radians(self._heading)
        new_x = self._x + distance * _tmath.cos(rad)
        new_y = self._y + distance * _tmath.sin(rad)
        if self._pendown:
            _turtle_draw_items.append({
                'type': 'line',
                'x1': self._x, 'y1': self._y,
                'x2': new_x, 'y2': new_y,
                'color': self._pencolor,
                'width': self._pensize,
            })
        if self._filling:
            self._fill_points.append((new_x, new_y))
        self._x = new_x
        self._y = new_y
        _turtle_maybe_update()
    fd = forward

    def backward(self, distance):
        self.forward(-distance)
    bk = backward
    back = backward

    def right(self, angle):
        self._heading -= angle
        _turtle_maybe_update()
    rt = right

    def left(self, angle):
        self._heading += angle
        _turtle_maybe_update()
    lt = left

    def goto(self, x, y=None):
        if y is None:
            if isinstance(x, (list, tuple)):
                x, y = x
            else:
                y = 0
        new_x, new_y = float(x), float(y)
        if self._pendown:
            _turtle_draw_items.append({
                'type': 'line',
                'x1': self._x, 'y1': self._y,
                'x2': new_x, 'y2': new_y,
                'color': self._pencolor,
                'width': self._pensize,
            })
        if self._filling:
            self._fill_points.append((new_x, new_y))
        self._x = new_x
        self._y = new_y
        _turtle_maybe_update()
    setpos = goto
    setposition = goto

    def setx(self, x):
        self.goto(float(x), self._y)

    def sety(self, y):
        self.goto(self._x, float(y))

    def setheading(self, angle):
        self._heading = angle
        _turtle_maybe_update()
    seth = setheading

    def home(self):
        self.goto(0, 0)
        self.setheading(90)

    def circle(self, radius, extent=None, steps=None):
        if extent is None:
            extent = 360
        if steps is None:
            steps = max(1, int(abs(extent) / 3))
        angle_per_step = extent / steps
        step_len = 2 * abs(radius) * _tmath.sin(_tmath.radians(abs(angle_per_step) / 2))
        if radius < 0:
            angle_per_step = -angle_per_step
        for _ in range(steps):
            self.left(angle_per_step / 2)
            self.forward(step_len)
            self.left(angle_per_step / 2)

    def dot(self, size=None, *color):
        if size is None:
            size = max(self._pensize + 4, 2 * self._pensize)
        c = self._pencolor
        if color:
            if len(color) == 1 and isinstance(color[0], str):
                c = color[0]
            elif len(color) == 3:
                c = _color_to_str(color)
            elif len(color) == 1 and isinstance(color[0], (tuple, list)):
                c = _color_to_str(color[0])
        _turtle_draw_items.append({
            'type': 'dot',
            'x': self._x, 'y': self._y,
            'size': size,
            'color': c,
        })
        _turtle_maybe_update()

    def stamp(self):
        sid = len(self._stamp_items)
        self._stamp_items.append({
            'type': 'stamp',
            'x': self._x, 'y': self._y,
            'heading': self._heading,
            'color': self._pencolor,
            'fillColor': self._fillcolor or self._pencolor,
            'shape': self._shape,
            'shapeSize': list(self._shapesize),
        })
        _turtle_draw_items.append(self._stamp_items[-1])
        _turtle_maybe_update()
        return sid

    def clearstamp(self, stampid):
        pass

    def clearstamps(self, n=None):
        pass

    def speed(self, s=None):
        if s is None:
            return self._speed
        if isinstance(s, str):
            speeds = {'fastest': 0, 'fast': 10, 'normal': 6, 'slow': 3, 'slowest': 1}
            s = speeds.get(s, 6)
        self._speed = s

    def penup(self):
        self._pendown = False
    pu = penup
    up = penup

    def pendown(self):
        self._pendown = True
    pd = pendown
    down = pendown

    def isdown(self):
        return self._pendown

    def pensize(self, width=None):
        if width is None:
            return self._pensize
        self._pensize = width
    width = pensize

    def pen(self, pen=None, **pendict):
        if pen is None and not pendict:
            return {
                'shown': self._visible,
                'pendown': self._pendown,
                'pencolor': self._pencolor,
                'fillcolor': self._fillcolor,
                'pensize': self._pensize,
                'speed': self._speed,
            }
        d = pen or {}
        d.update(pendict)
        if 'pendown' in d: self._pendown = d['pendown']
        if 'pencolor' in d: self._pencolor = _color_to_str(d['pencolor'])
        if 'fillcolor' in d: self._fillcolor = _color_to_str(d['fillcolor'])
        if 'pensize' in d: self._pensize = d['pensize']
        if 'speed' in d: self.speed(d['speed'])
        if 'shown' in d: self._visible = d['shown']

    def pencolor(self, *args):
        if len(args) == 0:
            return self._pencolor
        if len(args) == 1:
            self._pencolor = _color_to_str(args[0])
        elif len(args) == 3:
            self._pencolor = _color_to_str(args)

    def fillcolor(self, *args):
        if len(args) == 0:
            return self._fillcolor
        if len(args) == 1:
            self._fillcolor = _color_to_str(args[0])
        elif len(args) == 3:
            self._fillcolor = _color_to_str(args)

    def color(self, *args):
        if len(args) == 0:
            return (self._pencolor, self._fillcolor)
        if len(args) == 1:
            c = _color_to_str(args[0])
            self._pencolor = c
            self._fillcolor = c
        elif len(args) == 2:
            self._pencolor = _color_to_str(args[0])
            self._fillcolor = _color_to_str(args[1])
        elif len(args) == 3:
            c = _color_to_str(args)
            self._pencolor = c
            self._fillcolor = c

    def begin_fill(self):
        self._filling = True
        self._fill_points = [(self._x, self._y)]

    def end_fill(self):
        if self._filling and len(self._fill_points) > 2:
            _turtle_draw_items.append({
                'type': 'polygon',
                'points': list(self._fill_points),
                'color': self._fillcolor or self._pencolor,
            })
            _turtle_maybe_update()
        self._filling = False
        self._fill_points = []

    def filling(self):
        return self._filling

    def showturtle(self):
        self._visible = True
        _turtle_maybe_update()
    st = showturtle

    def hideturtle(self):
        self._visible = False
        _turtle_maybe_update()
    ht = hideturtle

    def isvisible(self):
        return self._visible

    def shape(self, name=None):
        if name is None:
            return self._shape
        self._shape = name

    def shapesize(self, stretch_wid=None, stretch_len=None, outline=None):
        if stretch_wid is None:
            return tuple(self._shapesize)
        if stretch_wid is not None:
            self._shapesize[0] = stretch_wid
        if stretch_len is not None:
            self._shapesize[1] = stretch_len
        if outline is not None:
            self._shapesize[2] = outline
    turtlesize = shapesize

    def position(self):
        return (self._x, self._y)
    pos = position

    def xcor(self):
        return self._x

    def ycor(self):
        return self._y

    def heading(self):
        return self._heading

    def towards(self, x, y=None):
        if y is None and isinstance(x, (tuple, list)):
            x, y = x
        dx = x - self._x
        dy = y - self._y
        return _tmath.degrees(_tmath.atan2(dy, dx))

    def distance(self, x, y=None):
        if y is None and isinstance(x, (tuple, list)):
            x, y = x
        elif y is None and hasattr(x, '_x'):
            y = x._y
            x = x._x
        return _tmath.sqrt((self._x - x) ** 2 + (self._y - y) ** 2)

    def write(self, arg, move=False, align='left', font=('Arial', 8, 'normal')):
        fname, fsize, fstyle = ('Arial', 8, 'normal')
        if isinstance(font, (list, tuple)):
            if len(font) >= 1: fname = font[0]
            if len(font) >= 2: fsize = font[1]
            if len(font) >= 3: fstyle = font[2]
        _turtle_draw_items.append({
            'type': 'text',
            'x': self._x, 'y': self._y,
            'text': str(arg),
            'color': self._pencolor,
            'font': fname,
            'size': fsize,
            'style': fstyle,
            'align': align,
        })
        _turtle_maybe_update()

    def clear(self):
        global _turtle_draw_items
        _turtle_draw_items = [item for item in _turtle_draw_items]
        _turtle_maybe_update()

    def reset(self):
        self._x = 0
        self._y = 0
        self._heading = 90
        self._pendown = True
        self._pensize = 1
        self._pencolor = 'black'
        self._fillcolor = ''
        self._speed = 3
        self._visible = True
        self.clear()

    def undo(self):
        pass

    def clone(self):
        t = _Turtle(visible=self._visible)
        t._x = self._x
        t._y = self._y
        t._heading = self._heading
        t._pendown = self._pendown
        t._pensize = self._pensize
        t._pencolor = self._pencolor
        t._fillcolor = self._fillcolor
        t._speed = self._speed
        t._shape = self._shape
        t._shapesize = list(self._shapesize)
        return t

    def getscreen(self):
        global _turtle_screen
        if _turtle_screen is None:
            _turtle_screen = _TurtleScreen()
        return _turtle_screen

    def onclick(self, fun, btn=1, add=None):
        pass

    def onrelease(self, fun, btn=1, add=None):
        pass

    def ondrag(self, fun, btn=1, add=None):
        pass

    def degrees(self, fullcircle=360.0):
        pass

    def radians(self):
        pass

    def tilt(self, angle):
        pass

    def settiltangle(self, angle):
        pass

    def tiltangle(self, angle=None):
        return 0

    def shapetransform(self, t11=None, t12=None, t21=None, t22=None):
        pass

    def get_shapepoly(self):
        return None

def _get_default_turtle():
    global _turtle_default_turtle
    if _turtle_default_turtle is None:
        _turtle_default_turtle = _Turtle()
    return _turtle_default_turtle

def _get_screen():
    global _turtle_screen
    if _turtle_screen is None:
        _turtle_screen = _TurtleScreen()
    return _turtle_screen

_turtle_mod = types.ModuleType('turtle')
_turtle_mod.Turtle = _Turtle
_turtle_mod.Screen = _get_screen
_turtle_mod.Pen = _Turtle
_turtle_mod.RawTurtle = _Turtle
_turtle_mod.RawPen = _Turtle

def _t_forward(d): _get_default_turtle().forward(d)
def _t_backward(d): _get_default_turtle().backward(d)
def _t_right(a): _get_default_turtle().right(a)
def _t_left(a): _get_default_turtle().left(a)
def _t_goto(x, y=None): _get_default_turtle().goto(x, y)
def _t_setpos(x, y=None): _get_default_turtle().goto(x, y)
def _t_setposition(x, y=None): _get_default_turtle().goto(x, y)
def _t_setx(x): _get_default_turtle().setx(x)
def _t_sety(y): _get_default_turtle().sety(y)
def _t_setheading(a): _get_default_turtle().setheading(a)
def _t_home(): _get_default_turtle().home()
def _t_circle(r, e=None, s=None): _get_default_turtle().circle(r, e, s)
def _t_dot(s=None, *c): _get_default_turtle().dot(s, *c)
def _t_stamp(): return _get_default_turtle().stamp()
def _t_speed(s=None): return _get_default_turtle().speed(s)
def _t_penup(): _get_default_turtle().penup()
def _t_pendown(): _get_default_turtle().pendown()
def _t_isdown(): return _get_default_turtle().isdown()
def _t_pensize(w=None): return _get_default_turtle().pensize(w)
def _t_width(w=None): return _get_default_turtle().pensize(w)
def _t_pen(p=None, **kw): return _get_default_turtle().pen(p, **kw)
def _t_pencolor(*a): return _get_default_turtle().pencolor(*a)
def _t_fillcolor(*a): return _get_default_turtle().fillcolor(*a)
def _t_color(*a): return _get_default_turtle().color(*a)
def _t_begin_fill(): _get_default_turtle().begin_fill()
def _t_end_fill(): _get_default_turtle().end_fill()
def _t_filling(): return _get_default_turtle().filling()
def _t_showturtle(): _get_default_turtle().showturtle()
def _t_hideturtle(): _get_default_turtle().hideturtle()
def _t_isvisible(): return _get_default_turtle().isvisible()
def _t_shape(n=None): return _get_default_turtle().shape(n)
def _t_shapesize(sw=None, sl=None, o=None): return _get_default_turtle().shapesize(sw, sl, o)
def _t_position(): return _get_default_turtle().position()
def _t_pos(): return _get_default_turtle().position()
def _t_xcor(): return _get_default_turtle().xcor()
def _t_ycor(): return _get_default_turtle().ycor()
def _t_heading(): return _get_default_turtle().heading()
def _t_towards(x, y=None): return _get_default_turtle().towards(x, y)
def _t_distance(x, y=None): return _get_default_turtle().distance(x, y)
def _t_write(arg, move=False, align='left', font=('Arial', 8, 'normal')): _get_default_turtle().write(arg, move, align, font)
def _t_clear(): _get_default_turtle().clear()
def _t_reset(): _get_default_turtle().reset()
def _t_undo(): _get_default_turtle().undo()
def _t_clone(): return _get_default_turtle().clone()
def _t_getscreen(): return _get_default_turtle().getscreen()
def _t_bgcolor(*a): return _get_screen().bgcolor(*a)
def _t_title(t): _get_screen().title(t)
def _t_setup(w=None, h=None, sx=None, sy=None): _get_screen().setup(w, h, sx, sy)
def _t_screensize(cw=None, ch=None, bg=None): return _get_screen().screensize(cw, ch, bg)
def _t_tracer(n=None, d=None): return _get_screen().tracer(n, d)
def _t_update(): _get_screen().update()
def _t_mainloop(): _get_screen().mainloop()
def _t_done(): _get_screen().done()
def _t_exitonclick(): _get_screen().exitonclick()
def _t_bye(): _get_screen().bye()
def _t_listen(): _get_screen().listen()
def _t_onkey(f, k): _get_screen().onkey(f, k)
def _t_onkeypress(f, k=None): _get_screen().onkeypress(f, k)
def _t_onkeyrelease(f, k=None): _get_screen().onkeyrelease(f, k)
def _t_onclick(f, b=1, a=None): _get_screen().onclick(f, b, a)
def _t_onscreenclick(f, b=1, a=None): _get_screen().onscreenclick(f, b, a)
def _t_ontimer(f, t=0): _get_screen().ontimer(f, t)
def _t_delay(d=None): return _get_screen().delay(d)
def _t_colormode(cm=None): return _get_screen().colormode(cm)
def _t_window_width(): return _get_screen().window_width()
def _t_window_height(): return _get_screen().window_height()
def _t_mode(m=None): return _get_screen().mode(m)
def _t_register_shape(n, s=None): _get_screen().register_shape(n, s)
def _t_addshape(n, s=None): _get_screen().register_shape(n, s)
def _t_getshapes(): return _get_screen().getshapes()
def _t_textinput(t, p): return _get_screen().textinput(t, p)
def _t_numinput(t, p, d=None, mn=None, mx=None): return _get_screen().numinput(t, p, d, mn, mx)
def _t_turtles(): return list(_turtle_turtles)

_t_funcs = {
    'forward': _t_forward, 'fd': _t_forward,
    'backward': _t_backward, 'bk': _t_backward, 'back': _t_backward,
    'right': _t_right, 'rt': _t_right,
    'left': _t_left, 'lt': _t_left,
    'goto': _t_goto, 'setpos': _t_setpos, 'setposition': _t_setposition,
    'setx': _t_setx, 'sety': _t_sety,
    'setheading': _t_setheading, 'seth': _t_setheading,
    'home': _t_home,
    'circle': _t_circle, 'dot': _t_dot, 'stamp': _t_stamp,
    'speed': _t_speed,
    'penup': _t_penup, 'pu': _t_penup, 'up': _t_penup,
    'pendown': _t_pendown, 'pd': _t_pendown, 'down': _t_pendown,
    'isdown': _t_isdown,
    'pensize': _t_pensize, 'width': _t_width,
    'pen': _t_pen,
    'pencolor': _t_pencolor, 'fillcolor': _t_fillcolor, 'color': _t_color,
    'begin_fill': _t_begin_fill, 'end_fill': _t_end_fill, 'filling': _t_filling,
    'showturtle': _t_showturtle, 'st': _t_showturtle,
    'hideturtle': _t_hideturtle, 'ht': _t_hideturtle,
    'isvisible': _t_isvisible,
    'shape': _t_shape, 'shapesize': _t_shapesize, 'turtlesize': _t_shapesize,
    'position': _t_position, 'pos': _t_pos,
    'xcor': _t_xcor, 'ycor': _t_ycor,
    'heading': _t_heading,
    'towards': _t_towards, 'distance': _t_distance,
    'write': _t_write,
    'clear': _t_clear, 'reset': _t_reset,
    'undo': _t_undo, 'clone': _t_clone,
    'getscreen': _t_getscreen,
    'bgcolor': _t_bgcolor, 'title': _t_title,
    'setup': _t_setup, 'screensize': _t_screensize,
    'tracer': _t_tracer, 'update': _t_update,
    'mainloop': _t_mainloop, 'done': _t_done,
    'exitonclick': _t_exitonclick, 'bye': _t_bye,
    'listen': _t_listen,
    'onkey': _t_onkey, 'onkeypress': _t_onkeypress, 'onkeyrelease': _t_onkeyrelease,
    'onclick': _t_onclick, 'onscreenclick': _t_onscreenclick,
    'ontimer': _t_ontimer,
    'delay': _t_delay, 'colormode': _t_colormode,
    'window_width': _t_window_width, 'window_height': _t_window_height,
    'mode': _t_mode,
    'register_shape': _t_register_shape, 'addshape': _t_addshape,
    'getshapes': _t_getshapes,
    'textinput': _t_textinput, 'numinput': _t_numinput,
    'turtles': _t_turtles,
    'Turtle': _Turtle,
    'Screen': _get_screen,
    'Pen': _Turtle,
    'RawTurtle': _Turtle,
    'RawPen': _Turtle,
}

for _fn, _fv in _t_funcs.items():
    setattr(_turtle_mod, _fn, _fv)

sys.modules['turtle'] = _turtle_mod
`;

const FLASK_STUB = `
import sys as _sys
import types as _types
import json as _flask_json
import re as _flask_re

_flask_virtual_files = {}

def _flask_read_virtual_file(path):
    if path in _flask_virtual_files:
        return _flask_virtual_files[path]
    tpl_path = 'templates/' + path
    if tpl_path in _flask_virtual_files:
        return _flask_virtual_files[tpl_path]
    raise FileNotFoundError(f"Template not found: {path}")

def _flask_render_string(template_str, **context):
    result = template_str

    def replace_for(match):
        var_name = match.group(1).strip()
        iter_name = match.group(2).strip()
        body = match.group(3)
        items = context.get(iter_name, [])
        output = []
        for item in items:
            local_ctx = {**context, var_name: item}
            def do_replace(m):
                expr = m.group(1).strip()
                try:
                    return str(eval(expr, {"__builtins__": {}}, local_ctx))
                except Exception:
                    return m.group(0)
            output.append(_flask_re.sub(r'\\{\\{(.*?)\\}\\}', do_replace, body))
        return ''.join(output)
    result = _flask_re.sub(r'\\{%\\s*for\\s+(\\w+)\\s+in\\s+(\\w+)\\s*%\\}(.*?)\\{%\\s*endfor\\s*%\\}', replace_for, result, flags=_flask_re.DOTALL)

    def replace_if(match):
        condition = match.group(1).strip()
        body = match.group(2)
        try:
            if eval(condition, {"__builtins__": {}}, context):
                return body
        except Exception:
            pass
        return ''
    result = _flask_re.sub(r'\\{%\\s*if\\s+(.*?)\\s*%\\}(.*?)\\{%\\s*endif\\s*%\\}', replace_if, result, flags=_flask_re.DOTALL)

    result = _flask_re.sub(r'\\{%.*?%\\}', '', result)

    def replace_var(match):
        expr = match.group(1).strip()
        try:
            return str(eval(expr, {"__builtins__": {}}, context))
        except Exception:
            return match.group(0)
    result = _flask_re.sub(r'\\{\\{(.*?)\\}\\}', replace_var, result)

    return result

def _flask_inline_assets(html):
    def replace_css(match):
        href = match.group(1)
        try:
            content = _flask_read_virtual_file(href)
            return '<style>' + content + '</style>'
        except FileNotFoundError:
            return match.group(0)
    html = _flask_re.sub(r'<link[^>]+href="([^"]+\\.css)"[^>]*/?>',  replace_css, html)
    def replace_js(match):
        src = match.group(1)
        try:
            content = _flask_read_virtual_file(src)
            return '<script>' + content + '</script>'
        except FileNotFoundError:
            return match.group(0)
    html = _flask_re.sub(r'<script[^>]+src="([^"]+\\.js)"[^>]*></script>', replace_js, html)
    return html

class _FlaskRequest:
    def __init__(self):
        self.method = 'GET'
        self.args = {}
        self.form = {}
        self.json = None
        self.headers = {}
        self.path = '/'

class _FlaskResponse:
    def __init__(self, body='', status=200, headers=None, content_type='text/html'):
        self.body = body
        self.status = status
        self.headers = headers or {}
        self.content_type = content_type

class _FlaskApp:
    def __init__(self, name='__main__'):
        self.name = name
        self._routes = {}
        self.config = {}
        self.secret_key = ''
        self.debug = False
        self.static_folder = 'static'
        self.template_folder = 'templates'

    def route(self, rule, methods=None, **options):
        if methods is None:
            methods = ['GET']
        def decorator(func):
            self._routes[rule] = {'handler': func, 'methods': methods}
            return func
        return decorator

    def add_url_rule(self, rule, endpoint=None, view_func=None, **options):
        if view_func:
            methods = options.get('methods', ['GET'])
            self._routes[rule] = {'handler': view_func, 'methods': methods}

    def errorhandler(self, code):
        def decorator(func):
            return func
        return decorator

    def before_request(self, func):
        return func

    def after_request(self, func):
        return func

    def run(self, host='127.0.0.1', port=5000, debug=False, **kw):
        from js import postMessage

        print(f" * Running on http://{host}:{port}")
        print(f" * Flask app '{self.name}' with {len(self._routes)} route(s)")
        for rule, info in self._routes.items():
            print(f"   {', '.join(info['methods']):8s} {rule}")

        html_output = None
        if '/' in self._routes:
            try:
                handler = self._routes['/']['handler']
                result = handler()
                if isinstance(result, _FlaskResponse):
                    html_output = result.body
                elif isinstance(result, str):
                    html_output = result
                elif isinstance(result, tuple):
                    html_output = str(result[0])
            except Exception as e:
                html_output = f"<h1>500 Internal Server Error</h1><pre>{e}</pre>"
        else:
            lines = ['<html><body><h1>Flask App Routes</h1><ul>']
            for rule in self._routes:
                lines.append(f'<li>{rule}</li>')
            lines.append('</ul></body></html>')
            html_output = ''.join(lines)

        if html_output:
            html_output = _flask_inline_assets(html_output)
            route_info = []
            for rule, info in self._routes.items():
                route_info.append({'path': rule, 'methods': info['methods']})
            postMessage(
                type='flask-html',
                html=html_output,
                routes=_flask_json.dumps(route_info)
            )

def _flask_render_template(template_name, **context):
    template_str = _flask_read_virtual_file(template_name)
    return _flask_render_string(template_str, **context)

def _flask_redirect(location, code=302):
    return _FlaskResponse(body=f'Redirecting to {location}', status=code)

def _flask_url_for(endpoint, **values):
    return f'/{endpoint}'

def _flask_jsonify(*args, **kwargs):
    if args:
        data = args[0]
    else:
        data = kwargs
    return _FlaskResponse(body=_flask_json.dumps(data), content_type='application/json')

def _flask_make_response(*args):
    if len(args) == 1 and isinstance(args[0], str):
        return _FlaskResponse(body=args[0])
    return _FlaskResponse()

def _flask_abort(code):
    raise Exception(f"HTTP {code}")

_flask_mod = _types.ModuleType('flask')
_flask_mod.Flask = _FlaskApp
_flask_mod.render_template = _flask_render_template
_flask_mod.request = _FlaskRequest()
_flask_mod.redirect = _flask_redirect
_flask_mod.url_for = _flask_url_for
_flask_mod.jsonify = _flask_jsonify
_flask_mod.make_response = _flask_make_response
_flask_mod.Response = _FlaskResponse
_flask_mod.abort = _flask_abort
_flask_mod.session = {}
_flask_mod.g = _types.SimpleNamespace()
_sys.modules['flask'] = _flask_mod
`;

async function initPyodide() {
  if (pyodide) return pyodide;

  importScripts(PYODIDE_CDN + 'pyodide.js');

  pyodide = await loadPyodide({
    indexURL: PYODIDE_CDN,
    stdout: (text) => {
      self.postMessage({ type: 'stdout', text });
    },
    stderr: (text) => {
      self.postMessage({ type: 'stderr', text });
    },
  });

  await pyodide.runPythonAsync(TKINTER_STUB);
  await pyodide.runPythonAsync(PYGAME_STUB);
  await pyodide.runPythonAsync(TURTLE_STUB);
  await pyodide.runPythonAsync(FLASK_STUB);
  stubsLoaded = true;

  return pyodide;
}

function transformPygameCode(code) {
  if (!codeNeedsPackage(code, 'pygame')) {
    return code;
  }
  const lines = code.split('\n');
  const transformed = [];
  for (const line of lines) {
    const stripped = line.replace(/^\s*/, '');
    const indent = line.substring(0, line.length - stripped.length);
    if (stripped.startsWith('#')) {
      transformed.push(line);
      continue;
    }
    if (/display\.update\s*\(/.test(stripped) && !stripped.startsWith('await ')) {
      transformed.push(indent + 'await ' + stripped);
      continue;
    }
    if (/display\.flip\s*\(/.test(stripped) && !stripped.startsWith('await ')) {
      transformed.push(indent + 'await ' + stripped);
      continue;
    }
    transformed.push(line);
  }
  return transformed.join('\n');
}

function codeNeedsPackage(code, keyword) {
  return (
    new RegExp(`import\\s+${keyword}\\b`).test(code) ||
    new RegExp(`from\\s+${keyword}\\b`).test(code)
  );
}

async function loadPackagesForCode(code) {
  const packageMap = {
    numpy: 'numpy',
    np: 'numpy',
    scipy: 'scipy',
    matplotlib: 'matplotlib',
    plt: 'matplotlib',
    pandas: 'pandas',
    pd: 'pandas',
    sklearn: 'scikit-learn',
    sympy: 'sympy',
  };

  const needed = new Set();
  for (const [keyword, pkg] of Object.entries(packageMap)) {
    if (codeNeedsPackage(code, keyword)) {
      needed.add(pkg);
    }
  }

  if (needed.size > 0) {
    self.postMessage({
      type: 'status',
      text: `Loading packages: ${[...needed].join(', ')}...`,
    });
    const cleanedCode = code.replace(/^(from flask|import flask)/gm, '# $1');
    await pyodide.loadPackagesFromImports(cleanedCode);
  }

  return needed;
}

function getMatplotlibSetupCode() {
  return `
import io as _io

_plot_outputs = []

def _setup_mpl_capture():
    try:
        import matplotlib
        matplotlib.use('AGG')
        import matplotlib.pyplot as _plt

        def _custom_show(*args, **kwargs):
            import base64
            for fig_num in _plt.get_fignums():
                fig = _plt.figure(fig_num)
                buf = _io.BytesIO()
                fig.savefig(buf, format='png', dpi=100, bbox_inches='tight',
                           facecolor='white', edgecolor='none')
                buf.seek(0)
                img_data = base64.b64encode(buf.read()).decode('utf-8')
                _plot_outputs.append(img_data)
                buf.close()
            _plt.close('all')

        _plt.show = _custom_show
    except Exception:
        pass

_setup_mpl_capture()
`;
}

function scanForNewFiles(py, initialFiles) {
  try {
    const newFiles = {};
    const skipNames = new Set(['.', '..']);

    function scanDir(fsPath, relPath) {
      let entries;
      try {
        entries = py.FS.readdir(fsPath);
      } catch (e) {
        return;
      }
      for (const entry of entries) {
        if (skipNames.has(entry)) continue;
        const fullPath = fsPath + '/' + entry;
        const rel = relPath ? relPath + '/' + entry : entry;
        let stat;
        try {
          stat = py.FS.stat(fullPath);
        } catch (e) {
          continue;
        }
        const isDir = py.FS.isDir(stat.mode);
        if (isDir) {
          scanDir(fullPath, rel);
        } else {
          if (!initialFiles.has(rel)) {
            try {
              const content = py.FS.readFile(fullPath, { encoding: 'utf8' });
              newFiles[rel] = content;
            } catch (e) {
              // skip binary files
            }
          }
        }
      }
    }

    scanDir('/home/pyodide', '');

    if (Object.keys(newFiles).length > 0) {
      self.postMessage({ type: 'files-created', files: newFiles });
    }
  } catch (e) {
    // ignore scan errors
  }
}

async function runCode(files, mainFile) {
  isRunning = true;

  try {
    const py = await initPyodide();

    self.postMessage({ type: 'status', text: 'Preparing environment...' });

    if (!stubsLoaded) {
      await py.runPythonAsync(TKINTER_STUB);
      await py.runPythonAsync(PYGAME_STUB);
      await py.runPythonAsync(TURTLE_STUB);
      await py.runPythonAsync(FLASK_STUB);
      stubsLoaded = true;
    }

    await py.runPythonAsync(`
_tk_widgets.clear()
_tk_callbacks.clear()
_tk_vars.clear()
_tk_var_traces.clear()
_tk_canvas_items.clear()
_tk_menu_items.clear()
_tk_counter = 0
_tk_var_counter = 0
_tk_root = None

_pg_display_surface = None
_pg_display_caption = 'pygame window'
_pg_display_width = 0
_pg_display_height = 0
_pg_initialized = False
_pg_frame_count = 0
_pg_quit_requested = False
_pg_event_queue.clear()
_pg_keys_pressed.clear()
_pg_mouse_pos = (0, 0)
_pg_mouse_buttons = (False, False, False)
_pg_last_flip_time = 0
_pg_start_time = 0

_turtle_draw_items = []
_turtle_turtles = []
_turtle_screen = None
_turtle_default_turtle = None
_turtle_tracer_on = True
_turtle_tracer_n = 1
_turtle_frame_count = 0
_turtle_canvas_width = 800
_turtle_canvas_height = 600
_turtle_bgcolor = 'white'
_turtle_title = 'Python Turtle Graphics'
_turtle_timers = []

_flask_virtual_files = {}
`);

    const sanitizeCode = (src) => src.replace(/[\u200B-\u200D\uFEFF\u00AD\u034F\u115F\u1160\u17B4\u17B5\u180B-\u180D\u2060-\u206F\uFFA0\uFFF0-\uFFF8]/g, '');

    for (const [filename, content] of Object.entries(files)) {
      if (filename !== mainFile) {
        const parts = filename.split('/');
        if (parts.length > 1) {
          let dir = '/home/pyodide';
          for (let i = 0; i < parts.length - 1; i++) {
            dir += '/' + parts[i];
            try { py.FS.mkdir(dir); } catch (e) { /* exists */ }
          }
        }
        py.FS.writeFile(`/home/pyodide/${filename}`, sanitizeCode(content));
      }
    }

    let vfCode = '_flask_virtual_files = {\n';
    for (const [filename, content] of Object.entries(files)) {
      const escaped = sanitizeCode(content).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '');
      vfCode += `  '${filename}': '${escaped}',\n`;
    }
    vfCode += '}\n';
    await py.runPythonAsync(vfCode);

    const initialFiles = new Set(Object.keys(files));

    const mainCode = sanitizeCode(files[mainFile] || '');

    const loadedPackages = await loadPackagesForCode(mainCode);

    if (loadedPackages.has('matplotlib')) {
      await py.runPythonAsync(getMatplotlibSetupCode());
    } else {
      await py.runPythonAsync('_plot_outputs = []');
    }

    self.postMessage({ type: 'status', text: '' });
    self.postMessage({ type: 'execution-start' });

    if (inputSignalArray) {
      self._syncInput = function(prompt) {
        self.postMessage({ type: 'input-request', prompt: prompt || '' });
        Atomics.store(inputSignalArray, 0, 0);
        Atomics.wait(inputSignalArray, 0, 0);
        const length = inputSignalArray[1];
        const bytes = inputDataArray.slice(0, length);
        const decoder = new TextDecoder();
        return decoder.decode(bytes);
      };

      await py.runPythonAsync(`
import builtins as _builtins
from js import self as _js_self

def _custom_input(prompt=''):
    result = _js_self._syncInput(str(prompt) if prompt else '')
    return str(result)

_builtins.input = _custom_input
`);
    }

    const execCode = transformPygameCode(mainCode);
    await py.runPythonAsync(execCode);

    try {
      await py.runPythonAsync(`
if _turtle_timers:
    _turtle_process_timers()
elif _turtle_turtles or _turtle_draw_items:
    _turtle_send_frame()
`);
    } catch (e) {}

    try {
      const plotOutputs = py.globals.get('_plot_outputs');
      if (plotOutputs) {
        const plots = plotOutputs.toJs();
        if (plots && plots.length > 0) {
          for (const imgData of plots) {
            self.postMessage({ type: 'plot', data: imgData });
          }
        }
      }
    } catch (e) {
      // no plots to extract
    }

    scanForNewFiles(py, initialFiles);

    self.postMessage({ type: 'execution-end' });
  } catch (err) {
    let errorMsg = err.message || String(err);

    const lineMatch = errorMsg.match(/File "<exec>", line (\d+)/);
    const lineNum = lineMatch ? lineMatch[1] : null;

    const traceLines = errorMsg.split('\n');
    const relevantLines = traceLines.filter(
      (l) =>
        !l.includes('_pyodide/_base.py') &&
        !l.includes('eval_code_async') &&
        !l.includes('run_async') &&
        !l.includes('coroutine = eval')
    );
    const friendlyMsg =
      relevantLines.length > 0 ? relevantLines.join('\n').trim() : errorMsg;

    self.postMessage({
      type: 'error',
      text: friendlyMsg,
      line: lineNum ? parseInt(lineNum) : null,
    });
    self.postMessage({ type: 'execution-end' });
  } finally {
    isRunning = false;
  }
}

async function handleTkEvent(widgetId, eventType, eventData) {
  if (!pyodide) return;

  try {
    const dataJson = JSON.stringify(eventData || {});
    await pyodide.runPythonAsync(`
_handle_tk_event("${widgetId}", "${eventType}", _json.loads('${dataJson.replace(/'/g, "\\'")}'))
`);
  } catch (err) {
    self.postMessage({ type: 'stderr', text: 'Event error: ' + (err.message || String(err)) });
  }
}

self.onmessage = async (event) => {
  const { type, files, mainFile, widgetId, eventType, eventData } = event.data;

  if (type === 'input-buffer') {
    inputSharedBuffer = event.data.buffer;
    inputSignalArray = new Int32Array(inputSharedBuffer, 0, 2);
    inputDataArray = new Uint8Array(inputSharedBuffer, 8);
    return;
  }

  if (type === 'run') {
    if (isRunning) {
      self.postMessage({ type: 'stderr', text: 'Code is already running.' });
      return;
    }
    await runCode(files, mainFile || 'main.py');
  }

  if (type === 'init') {
    try {
      self.postMessage({ type: 'status', text: 'Loading Python runtime...' });
      await initPyodide();
      self.postMessage({ type: 'ready' });
      self.postMessage({ type: 'status', text: '' });
    } catch (err) {
      self.postMessage({
        type: 'error',
        text: 'Failed to load Python runtime: ' + err.message,
      });
    }
  }

  if (type === 'tkinter-event') {
    await handleTkEvent(widgetId, eventType, eventData);
  }

  if (type === 'pygame-event') {
    handlePygameEvent(event.data.eventData);
  }

  if (type === 'messagebox-response') {
    handleMessageBoxResponse(event.data.msgId, event.data.result);
  }

  if (type === 'dialog-response') {
    handleDialogResponse(event.data.msgId, event.data.result);
  }
};

const pgEventQueue = [];

function handlePygameEvent(eventData) {
  pgEventQueue.push(eventData);
}

function handleMessageBoxResponse(msgId, result) {
  if (pyodide && pyodide.globals.has('_msgbox_responses')) {
    const responsesDict = pyodide.globals.get('_msgbox_responses');
    responsesDict.set(msgId, result);
  }
}

function handleDialogResponse(msgId, result) {
  if (pyodide && pyodide.globals.has('_dialog_responses')) {
    const responsesDict = pyodide.globals.get('_dialog_responses');
    responsesDict.set(msgId, result);
  }
}

self._pgDrainEvents = function() {
  const events = pgEventQueue.splice(0, pgEventQueue.length);
  return JSON.stringify(events);
};
