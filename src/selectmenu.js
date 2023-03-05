
const html = (raw, ...keys) => String.raw({ raw }, ...keys);

const template = document.createElement('template');

template.innerHTML = html`
  <style>
    :host {
      display: inline-block;
    }

    [part=button] {
      display: inline-flex;
      align-items: center;
      background-color: rgb(255, 255, 255);
      cursor: default;
      appearance: none;
      padding: 0px 0px 0px 3px;
      border-width: 1px;
      border-style: solid;
      border-color: rgb(118, 118, 118);
      border-image: initial;
      border-radius: 2px;
    }

/*    @media (prefers-color-scheme: dark) {
      [part=button] {
        background-color: rgb(59, 59, 59);
        border-color: rgb(133, 133, 133);
      }
    }*/

    [part=marker] {
      background-image: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAyMCAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj5cCiAgPHBhdGggZD0iTTQgNiBMMTAgMTIgTCAxNiA2IiBzdHJva2U9IldpbmRvd1RleHQiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPlwKPC9zdmc+);
      background-origin: content-box;
      background-size: contain;
      height: 1em;
      margin-inline-start: 4px;
      opacity: 1;
      padding-bottom: 2px;
      padding-inline-start: 3px;
      padding-inline-end: 3px;
      padding-top: 2px;
      width: 1.2em;
      background-repeat: no-repeat;
      outline: none;
    }

/*    @media (prefers-color-scheme: dark) {
      [part=marker] {
        background-image: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAyMCAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj5cCiAgPHBhdGggZD0iTTQgNiBMMTAgMTIgTCAxNiA2IiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPlwKPC9zdmc+);
      }*/

    [popover] {
      position: fixed;
      z-index: 2147483647;
      inset: 0;
      padding: 0.25em;
      width: fit-content;
      height: fit-content;
      border: solid;
      background: canvas;
      color: canvastext;
      overflow: auto;
      margin: auto;
    }

    [part=listbox] {
      box-shadow: rgba(0, 0, 0, 0.13) 0px 12.8px 28.8px, rgba(0, 0, 0, 0.11) 0px 0px 9.2px;
      box-sizing: border-box;
      min-inline-size: anchor-size(self-inline);
      min-block-size: 1lh;
      anchor-scroll: implicit;
      position-fallback: -internal-selectmenu-listbox-default-fallbacks;
      border-width: 1px;
      border-style: solid;
      border-color: rgba(0, 0, 0, 0.15);
      border-image: initial;
      border-radius: 4px;
      overflow: auto;
      padding: 4px;
      margin: 0px;
      inset: auto;
    }

    ::slotted(option:hover) {
      background-color: lightgray;
      cursor: default;
      user-select: none;
    }
  </style>
  <slot name="button">
    <button part="button" behavior="button" aria-haspopup="listbox">
      <slot name="selected-value">
        <div part="selected-value" behavior="selected-value"></div>
      </slot>
      <slot name="marker">
        <div part="marker"></div>
      </slot>
    </button>
  </slot>
  <slot name="listbox">
    <div popover hidden part="listbox" behavior="listbox">
      <slot></slot>
    </div>
  </slot>
`;

class HTMLSelectMenuElement extends globalThis.HTMLElement {
  #options;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(template.content.cloneNode(true));

    this.addEventListener('click', this.#handleClick);
    document.addEventListener('click', this.#handleBlur);

    this.#defaultSlot.addEventListener('slotchange', this.#handleDefaultSlot);
    this.#listboxSlot.addEventListener('slotchange', this.#handleListboxSlot);
  }

  #select() {
    const selected = this.#options
      .find(el => el.hasAttribute('selected')) ?? this.#options[0];

    this.#selectOption(selected);
  }

  #selectOption(option) {
    this.#selectedValue.textContent = option.value;
  }

  #handleDefaultSlot = () => {
    this.#options = [...this.querySelectorAll('option')];
    this.#select();
  }

  #handleListboxSlot = () => {
    this.#options = [...this.querySelectorAll('option')];
    this.#select();
  }

  get #buttonSlot() {
    return this.shadowRoot.querySelector('slot[name=button]');
  }

  get #listboxSlot() {
    return this.shadowRoot.querySelector('slot[name=listbox]');
  }

  get #defaultSlot() {
    return this.shadowRoot.querySelector('slot:not([name])');
  }

  get #selectedValue() {
    let selectedValue = this.querySelector('[behavior=selected-value]');
    if (!selectedValue) {
      selectedValue = this.shadowRoot.querySelector('[behavior=selected-value]');
    }
    return selectedValue;
  }

  get #button() {
    let button = this.querySelector('[behavior=button]');
    if (!button) {
      button = this.shadowRoot.querySelector('[behavior=button]');
    }
    return button;
  }

  get #listbox() {
    let listbox = this.querySelector('[behavior=listbox]');
    if (!listbox) {
      listbox = this.shadowRoot.querySelector('[behavior=listbox]');
    }
    return listbox;
  }

  #handleClick = (event) => {

    let selected;

    // Open / Close
    if (event.composedPath().some(el => el === this.#button)) {
      if (this.#listbox.hasAttribute('hidden')) {
        this.#listbox.removeAttribute('hidden');
      } else {
        this.#listbox.setAttribute('hidden',  '');
      }
    } else if (event.composedPath().some(el => this.#options.includes(el) && (selected = el))) {

      this.#selectOption(selected);
      this.#listbox.setAttribute('hidden',  '');
    }

  }

  #handleBlur = (event) => {

    if (event.composedPath().some(el => el === this)) return;

    this.#listbox.setAttribute('hidden',  '');
  }
}

if (!globalThis.HTMLSelectMenuElement) {
  globalThis.HTMLSelectMenuElement = HTMLSelectMenuElement;

  if (!globalThis.customElements.get('select-menu')) {
    globalThis.customElements.define('select-menu', HTMLSelectMenuElement);
  }

  observeElement('selectmenu', document);
}

function observeElement(type, rootNode) {

  const upgrade = (node) => {
    if (node.localName !== type) return;

    const childNodes = [...node.childNodes];
    const attributes = [...node.attributes];
    // Firefox and Safari doesn't allow creating a shadow DOM
    // on random generated tags like `selectmenu` so we replace `selectmenu`
    // with a custom element `select-menu`.
    const replacement = document.createElement('select-menu');
    for (let { name, value } of attributes) replacement.setAttribute(name, value);
    replacement.append(...childNodes);
    node.replaceWith(replacement);
  }

  const observer = new MutationObserver((mutationsList) => {
    for (let mutation of mutationsList) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(upgrade);
      }
    }
  });

  observer.observe(rootNode, {
    attributes: true,
    childList: true,
    subtree: true,
  });

  rootNode.querySelectorAll(type).forEach(upgrade);
}
