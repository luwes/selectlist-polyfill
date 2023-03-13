export { default as SelectMenuElement } from './selectmenu.js';
export { default as OptionElement } from './option.js';


if (!globalThis.HTMLSelectMenuElement) {

  // Firefox and Safari don't allow creating a shadow DOM
  // on custom tags like `selectmenu` so replace `selectmenu`
  // with a custom element `x-selectmenu`.
  observeElement(document, 'selectmenu', (element) => {
    element.replaceWith(convertElementToType(element, `x-selectmenu`));
  });

  // Safari doesn't render <option> content not nested in <select> :(
  observeElement(document, 'option', (element) => {
    if (element.closest('x-selectmenu') || element.closest('selectmenu'))
      element.replaceWith(convertElementToType(element, `x-option`));
  });
}


export function observeElement(rootNode, type, callback) {

  const upgrade = (node) => {
    rootNode.querySelectorAll?.(type).forEach(callback);

    if (node.localName !== type) return;

    callback(node);
  }

  const observer = new MutationObserver((mutationsList) => {
    for (let mutation of mutationsList) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(upgrade);
      }
    }
  });

  observer.observe(rootNode, {
    childList: true,
    subtree: true,
  });

  rootNode.querySelectorAll(type).forEach(callback);
}

export function convertElementToType(el, type) {
  const childNodes = [...el.childNodes];
  const attributes = [...el.attributes];
  const replacement = document.createElement(type);

  for (let { name, value } of attributes) {
    replacement.setAttribute(name, value);
  }

  replacement.append(...childNodes);

  return replacement;
}
