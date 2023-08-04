export { default as SelectListElement } from './selectlist.js';
export { default as OptionElement } from './option.js';


if (!globalThis.HTMLSelectListElement) {

  // Firefox and Safari don't allow creating a shadow DOM
  // on custom tags like `selectlist` so replace `selectlist`
  // with a custom element `x-selectlist`.
  observeElement(document, 'selectlist', (element) => {
    element.replaceWith(convertElementToType(element, `x-selectlist`));
  });

  // Safari doesn't render <option> content not nested in <select> :(
  observeElement(document, 'option', (element) => {
    if (element.closest('x-selectlist') || element.closest('selectlist'))
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
