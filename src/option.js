const html = (raw, ...keys) => String.raw({ raw }, ...keys);

const template = document.createElement('template');

template.innerHTML = html`
  <style>
    :host {
      display: list-item;
      list-style: none;
    }

    :host(:hover) {
      background-color: lightgray;
      cursor: default;
      user-select: none;
    }
  </style>
  <slot></slot>
`;

class OptionElement extends globalThis.HTMLElement {
  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(template.content.cloneNode(true));
  }

  connectedCallback() {
    if (!this.hasAttribute('role'))
      this.setAttribute('role', 'option');
  }

  get value() {
    return this.getAttribute('value') ?? this.textContent;
  }

  set value(value) {
    this.setAttribute('value', value);
  }
}

if (!globalThis.customElements.get('x-option')) {
  globalThis.customElements.define('x-option', OptionElement);
}

export default OptionElement;
