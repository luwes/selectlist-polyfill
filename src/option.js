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

    :host([disabled]) {
      color: rgba(16, 16, 16, 0.3);
    }

    :host(.\\:checked[disabled]) {
      background-color: rgb(176, 176, 176);
    }
  </style>
  <slot></slot>
`;

class OptionElement extends globalThis.HTMLElement {

  static observedAttributes = ['selected'];

  /** @see https://html.spec.whatwg.org/multipage/form-elements.html#concept-option-dirtiness */
  #dirty = false;

  #selected = false;

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(template.content.cloneNode(true));
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'selected' && !this.#dirty) {
      this._setSelectedState(newVal != null);
    }
  }

  connectedCallback() {
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'option');
    }

    this.#ownerElement()?.reset();
  }

  disconnectedCallback() {
    this.#ownerElement()?.reset();
  }

  #ownerElement() {
    return this.closest('x-selectmenu');
  }

  get index() {
    const selectmenu = this.#ownerElement();
    const index = selectmenu?.options.findIndex(option => option === this);
    return index ?? 0;
  }

  get label() {
    return this.getAttribute('label') ?? this.textContent;
  }

  set label(val) {
    this.setAttribute('label', val);
  }

  get value() {
    return this.getAttribute('value');
  }

  set value(val) {
    this.setAttribute('value', val);
  }

  get selected() {
    return this.#selected;
  }

  set selected(selected) {
    this.#dirty = true;

    this._setSelectedState(selected);

    this.#ownerElement()
      ?._optionSelectionChanged(this, selected);
  }

  get defaultSelected() {
    return this.hasAttribute('selected');
  }

  set defaultSelected(val) {
    if (val) {
      this.setAttribute('selected', '');
    } else {
      this.removeAttribute('selected');
    }
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(val) {
    if (val) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  _setSelectedState(selected) {
    if (selected) {
      this.#selected = true;
    } else {
      this.#selected = false;
    }
  }
}

if (!globalThis.customElements.get('x-option')) {
  globalThis.customElements.define('x-option', OptionElement);
}

export default OptionElement;
