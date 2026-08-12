/**
 * Tiny DOM construction API used by every view component.
 * Components declare structure; this module owns browser-specific mutation.
 */

function append(parent, child) {
  if (child === null || child === undefined || child === false) return;
  if (Array.isArray(child)) {
    child.forEach((item) => append(parent, item));
    return;
  }
  parent.append(child instanceof Node ? child : document.createTextNode(String(child)));
}

export function element(tag, options = {}, ...children) {
  const node = document.createElement(tag);
  const {
    className,
    text,
    attributes = {},
    dataset = {},
    events = {},
  } = options;

  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;

  Object.entries(attributes).forEach(([name, value]) => {
    if (value === false || value === null || value === undefined) return;
    if (value === true) node.setAttribute(name, '');
    else node.setAttribute(name, String(value));
  });

  Object.assign(node.dataset, dataset);
  Object.entries(events).forEach(([eventName, handler]) => {
    node.addEventListener(eventName, handler);
  });
  children.forEach((child) => append(node, child));
  return node;
}

export function clear(node) {
  node.replaceChildren();
  return node;
}

export function mount(root, view) {
  root.replaceChildren(view);
  return view;
}

export function asset(path) {
  const base = import.meta.env.BASE_URL || '/';
  return `${base}${path.replace(/^\//, '')}`;
}
