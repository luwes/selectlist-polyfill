
const html = (raw, ...keys) => String.raw({ raw }, ...keys);

const popoverStyles = `
  @supports not selector([popover]:open) {

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

    [popover]:not(.\\:open) {
      display: none;
    }
  }
`;

const headTemplate = document.createElement('template');
headTemplate.innerHTML = html`
  <style>
    ${popoverStyles}

    x-selectmenu [behavior=listbox] {
      min-block-size: 1lh;
      margin: 0px;
      inset: auto;
    }
  </style>
`;

document.head.append(headTemplate.content.cloneNode(true));

const template = document.createElement('template');
template.innerHTML = html`
  <style>
    ${popoverStyles}

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

    [part=listbox] {
      box-shadow: rgba(0, 0, 0, 0.13) 0px 12.8px 28.8px, rgba(0, 0, 0, 0.11) 0px 0px 9.2px;
      box-sizing: border-box;
      min-block-size: 1lh;
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
    <div popover part="listbox" behavior="listbox" role="listbox">
      <slot></slot>
    </div>
  </slot>
`;

class SelectMenuElement extends globalThis.HTMLElement {
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
    this.#selectedValue.textContent = option?.value;
  }

  #handleDefaultSlot = () => {
    this.#options = [...this.querySelectorAll('x-option')];
    this.#select();
  }

  #handleListboxSlot = () => {
    this.#options = [...this.querySelectorAll('x-option')];
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
    console.log(event.composedPath());

    let selected;

    // Open / Close
    if (event.composedPath().some(el => el === this.#button)) {

      this.#listbox.style.width = `${this.offsetWidth}px`;
      this.#listbox.classList.toggle(':open');

    } else if (event.composedPath().some(el => this.#options.includes(el) && (selected = el))) {

      this.#selectOption(selected);
      this.#listbox.classList.remove(':open');
    }

  }

  #handleBlur = (event) => {

    if (event.composedPath().some(el => el === this)) return;

    this.#listbox.classList.remove(':open');
  }
}

if (!globalThis.customElements.get('x-selectmenu')) {
  globalThis.customElements.define('x-selectmenu', SelectMenuElement);
}

export default SelectMenuElement;
