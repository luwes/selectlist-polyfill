const html = (raw, ...keys) => String.raw({ raw }, ...keys);

const template = document.createElement('template');

template.innerHTML = html`
  <style>
    :host {
      display: block;
      list-style: none;
      font: -webkit-small-control;
      line-height: revert;
      white-space: nowrap;
      min-height: 1.2em;
      padding: 1px 2px;
    }

    :host(:hover) {
      background-color: lightgray;
      cursor: default;
      user-select: none;
    }

    :host([disabled]) {
      pointer-events: none;
      color: rgba(16, 16, 16, 0.3);
    }

    :host(.\\:checked[disabled]) {
      background-color: rgb(176, 176, 176);
    }
  </style>
  <slot></slot>
`;

class OptionElement extends globalThis.HTMLElement {
  static formAssociated = true;
  static observedAttributes = ['disabled', 'selected'];

  /** @see https://html.spec.whatwg.org/multipage/form-elements.html#concept-option-dirtiness */
  #dirty = false;
  #internals;
  #selected = false;

  constructor() {
    super();
    this.#internals = this.attachInternals?.() ?? {};
    this.#internals.role = 'option';

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(template.content.cloneNode(true));
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;

    if (name === 'selected' && !this.#dirty) {
      this._setSelectedState(newVal != null);
      this.#ownerElement()?.reset();
    }

    if (name === 'disabled') {
      this.#internals.ariaDisabled = this.disabled ? 'true' : 'false';
      this.#ownerElement()?.reset();
    }
  }

  connectedCallback() {
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
    return this.getAttribute('label') ?? this.text;
  }

  set label(val) {
    this.setAttribute('label', val);
  }

  get value() {
    return this.getAttribute('value') ?? this.text;
  }

  set value(val) {
    this.setAttribute('value', val);
  }

  get text() {
    return (this.textContent ?? '').trim();
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

  set defaultSelected(flag) {
    this.toggleAttribute('selected', Boolean(flag));
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(flag) {
    this.toggleAttribute('disabled', Boolean(flag));
  }

  _setSelectedState(selected) {
    if (selected) {
      this.#selected = true;
      this.#internals.ariaSelected = 'true';
    } else {
      this.#selected = false;
      this.#internals.ariaSelected = 'false';
    }
  }
}

if (!globalThis.customElements.get('x-option')) {
  globalThis.customElements.define('x-option', OptionElement);
}

export default OptionElement;
