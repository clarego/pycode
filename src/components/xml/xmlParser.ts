export interface XmlNode {
  type: 'element' | 'text' | 'comment' | 'cdata' | 'processing-instruction' | 'doctype';
  name?: string;
  attributes?: Record<string, string>;
  children?: XmlNode[];
  value?: string;
  path: string;
}

interface ParseResult {
  nodes: XmlNode[];
  error: string | null;
}

export function parseXml(xmlString: string): ParseResult {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      return { nodes: [], error: parserError.textContent || 'XML parse error' };
    }
    const nodes = domNodeToXmlNodes(doc.documentElement, '0');
    return { nodes: [nodes], error: null };
  } catch (e) {
    return { nodes: [], error: String(e) };
  }
}

function domNodeToXmlNodes(node: Element, path: string): XmlNode {
  const attrs: Record<string, string> = {};
  for (let i = 0; i < node.attributes.length; i++) {
    const attr = node.attributes[i];
    attrs[attr.name] = attr.value;
  }

  const children: XmlNode[] = [];
  let childIdx = 0;

  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];
    const childPath = `${path}.${childIdx}`;

    if (child.nodeType === Node.ELEMENT_NODE) {
      children.push(domNodeToXmlNodes(child as Element, childPath));
      childIdx++;
    } else if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent || '';
      if (text.trim()) {
        children.push({ type: 'text', value: text.trim(), path: childPath });
        childIdx++;
      }
    } else if (child.nodeType === Node.COMMENT_NODE) {
      children.push({ type: 'comment', value: child.textContent || '', path: childPath });
      childIdx++;
    } else if (child.nodeType === Node.CDATA_SECTION_NODE) {
      children.push({ type: 'cdata', value: child.textContent || '', path: childPath });
      childIdx++;
    }
  }

  return {
    type: 'element',
    name: node.tagName,
    attributes: attrs,
    children,
    path,
  };
}

export function setValueAtPath(xmlString: string, path: string, newValue: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');
    const err = doc.querySelector('parsererror');
    if (err) return xmlString;

    const node = getNodeAtPath(doc.documentElement, path.split('.').slice(1));
    if (!node) return xmlString;

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      el.textContent = newValue;
    } else {
      node.textContent = newValue;
    }

    return new XMLSerializer().serializeToString(doc);
  } catch {
    return xmlString;
  }
}

export function setAttributeAtPath(xmlString: string, path: string, attrName: string, attrValue: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');
    const err = doc.querySelector('parsererror');
    if (err) return xmlString;

    const node = getNodeAtPath(doc.documentElement, path.split('.').slice(1));
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return xmlString;

    (node as Element).setAttribute(attrName, attrValue);
    return new XMLSerializer().serializeToString(doc);
  } catch {
    return xmlString;
  }
}

export function removeAttributeAtPath(xmlString: string, path: string, attrName: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');
    const err = doc.querySelector('parsererror');
    if (err) return xmlString;

    const node = getNodeAtPath(doc.documentElement, path.split('.').slice(1));
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return xmlString;

    (node as Element).removeAttribute(attrName);
    return new XMLSerializer().serializeToString(doc);
  } catch {
    return xmlString;
  }
}

export function addChildElementAtPath(xmlString: string, path: string, tagName: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');
    const err = doc.querySelector('parsererror');
    if (err) return xmlString;

    const node = getNodeAtPath(doc.documentElement, path.split('.').slice(1));
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return xmlString;

    const newEl = doc.createElement(tagName);
    (node as Element).appendChild(newEl);
    return new XMLSerializer().serializeToString(doc);
  } catch {
    return xmlString;
  }
}

export function removeNodeAtPath(xmlString: string, path: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');
    const err = doc.querySelector('parsererror');
    if (err) return xmlString;

    const parts = path.split('.');
    if (parts.length <= 1) return xmlString;

    const node = getNodeAtPath(doc.documentElement, parts.slice(1));
    if (!node || !node.parentNode) return xmlString;

    node.parentNode.removeChild(node);
    return new XMLSerializer().serializeToString(doc);
  } catch {
    return xmlString;
  }
}

export function renameElementAtPath(xmlString: string, path: string, newName: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');
    const err = doc.querySelector('parsererror');
    if (err) return xmlString;

    const node = getNodeAtPath(doc.documentElement, path.split('.').slice(1));
    if (!node || node.nodeType !== Node.ELEMENT_NODE) return xmlString;

    const el = node as Element;
    const newEl = doc.createElement(newName);
    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes[i];
      newEl.setAttribute(attr.name, attr.value);
    }
    while (el.firstChild) {
      newEl.appendChild(el.firstChild);
    }
    el.parentNode?.replaceChild(newEl, el);
    return new XMLSerializer().serializeToString(doc);
  } catch {
    return xmlString;
  }
}

function getNodeAtPath(root: Element, pathParts: string[]): Node | null {
  if (pathParts.length === 0) return root;

  const idx = parseInt(pathParts[0], 10);
  let elementCount = 0;
  let allChildCount = 0;

  for (let i = 0; i < root.childNodes.length; i++) {
    const child = root.childNodes[i];
    let countThis = false;

    if (child.nodeType === Node.ELEMENT_NODE) {
      countThis = true;
    } else if (child.nodeType === Node.TEXT_NODE && (child.textContent || '').trim()) {
      countThis = true;
    } else if (child.nodeType === Node.COMMENT_NODE) {
      countThis = true;
    } else if (child.nodeType === Node.CDATA_SECTION_NODE) {
      countThis = true;
    }

    if (countThis) {
      if (allChildCount === idx) {
        if (pathParts.length === 1) return child;
        if (child.nodeType === Node.ELEMENT_NODE) {
          return getNodeAtPath(child as Element, pathParts.slice(1));
        }
        return null;
      }
      allChildCount++;
    }
  }

  return null;
}

export function formatXml(xmlString: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'application/xml');
    const err = doc.querySelector('parsererror');
    if (err) return xmlString;
    return formatNode(doc.documentElement, 0);
  } catch {
    return xmlString;
  }
}

function formatNode(node: Element, indent: number): string {
  const pad = '  '.repeat(indent);
  const attrStr = Array.from(node.attributes)
    .map(a => ` ${a.name}="${escapeAttr(a.value)}"`)
    .join('');

  const childElements = Array.from(node.childNodes).filter(
    c => c.nodeType === Node.ELEMENT_NODE ||
         (c.nodeType === Node.TEXT_NODE && (c.textContent || '').trim()) ||
         c.nodeType === Node.COMMENT_NODE ||
         c.nodeType === Node.CDATA_SECTION_NODE
  );

  if (childElements.length === 0) {
    return `${pad}<${node.tagName}${attrStr}/>`;
  }

  const onlyText =
    childElements.length === 1 &&
    childElements[0].nodeType === Node.TEXT_NODE;

  if (onlyText) {
    const text = escapeText(childElements[0].textContent || '');
    return `${pad}<${node.tagName}${attrStr}>${text}</${node.tagName}>`;
  }

  const inner = childElements
    .map(c => {
      if (c.nodeType === Node.ELEMENT_NODE) return formatNode(c as Element, indent + 1);
      if (c.nodeType === Node.COMMENT_NODE) return `${'  '.repeat(indent + 1)}<!--${c.textContent}-->`;
      if (c.nodeType === Node.CDATA_SECTION_NODE) return `${'  '.repeat(indent + 1)}<![CDATA[${c.textContent}]]>`;
      return `${'  '.repeat(indent + 1)}${escapeText(c.textContent || '')}`;
    })
    .join('\n');

  return `${pad}<${node.tagName}${attrStr}>\n${inner}\n${pad}</${node.tagName}>`;
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
