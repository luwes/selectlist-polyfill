
const html = (raw, ...keys) => String.raw({ raw }, ...keys);

const popoverStyles = `
  @supports not selector([popover]:open) {

    [popover] {
      position: absolute;
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
      position: relative;
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

    :host([disabled]) [part=button] {
      background-color: rgba(239, 239, 239, 0.3);
      color: rgba(16, 16, 16, 0.3);
      opacity: 0.7;
      border-color: rgba(118, 118, 118, 0.3);
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
  static formAssociated = true;
  static observedAttributes = ['disabled', 'required', 'size', 'multiple'];

  #internals;

  constructor() {
    super();

    this.#internals = this.attachInternals?.() ?? {};
    this.#internals.role = 'combobox';
    this.#internals.ariaExpanded = 'false';
    this.#internals.ariaDisabled = 'false';
    this.#internals.ariaRequired = 'false';

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(template.content.cloneNode(true));

    this.addEventListener('click', this.#handleClick);
    document.addEventListener('click', this.#handleBlur);
  }

  get form() { return this.#internals.form; }
  get name() { return this.getAttribute('name'); }

  get options() {
    return [...this.querySelectorAll('x-option')];
  }

  get selectedOptions() {
    return this.options.filter(option => option.selected);
  }

  get selectedIndex() {
    return this.options.findIndex(option => option.selected);
  }

  set selectedIndex(val) {

  }

  get value() {
    return this.options.find(option => option.selected)?.value ?? '';
  }

  set value(val) {

  }

  get required() {
    return this.hasAttribute('required');
  }

  set required(val) {
    if (val) {
      this.setAttribute('required', '');
    } else {
      this.removeAttribute('required');
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

  get multiple() {
    return this.hasAttribute('multiple');
  }

  set multiple(val) {
    if (val) {
      this.setAttribute('multiple', '');
    } else {
      this.removeAttribute('multiple');
    }
  }

  get size() {
    return this.getAttribute('size') ?? 0;
  }

  set size(val) {
    if (val) {
      this.setAttribute('size', val);
    } else {
      this.removeAttribute('size');
    }
  }

  attributeChangedCallback(name, oldVal, newVal) {

    const attrToAria = {
      disabled: 'ariaDisabled',
      required: 'ariaRequired',
    };

    if (name in attrToAria) {
      this.#internals[attrToAria[name]] = newVal != null ? 'true' : 'false';
    }
  }

  _optionSelectionChanged(option, selected) {
    if (selected) {
      this.#selectOption(option);
    }
  }

  #selectOption(option) {
    const allOptions = this.options;
    const newSelectedOptions = [option].flat();

    allOptions.forEach(opt => (opt._setSelectedState(false)));
    newSelectedOptions.forEach(opt => (opt._setSelectedState(true)));

    this.#selectionChanged();
  }

  /**
   * Reset for a selectmenu is the selectedness setting algorithm.
   * Child Options's that are added and removed request this.
   * @see https://html.spec.whatwg.org/multipage/form-elements.html#selectedness-setting-algorithm
   */
  reset() {
    let firstOption;
    let selectedOption;

    for (let option of this.options) {

      if (option.selected) {

        if (selectedOption && !this.multiple) {
          selectedOption._setSelectedState(false);
        }

        option._setSelectedState(true);
        selectedOption = option;

      } else {
        option._setSelectedState(false);
      }

      if (!firstOption && !option.disabled) {
        firstOption = option;
      }
    }

    if (!selectedOption && firstOption && !this.multiple && this.size <= 1) {
      firstOption._setSelectedState(true);
    }

    this.#selectionChanged();
  }

  #selectionChanged() {
    this.#selectedValue.textContent = this.selectedOptions[0]?.label;
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
    let selectedValue = this.querySelector('[behavior="selected-value"]');
    if (!selectedValue) {
      selectedValue = this.shadowRoot.querySelector('[behavior="selected-value"]');
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
    if (this.disabled) return;

    const path = event.composedPath();
    let selectedOption;

    // Open / Close
    if (path.some(el => el === this.#button)) {

      if (this.#isListboxExpanded()) {
        this.#hideListbox();
      } else {
        this.#showListbox();
      }

      if (!this.#listbox.style.minWidth) {
        this.#listbox.style.minWidth = `${this.offsetWidth}px`;
      }

    } else if (path.some(el => this.options.includes(el) && (selectedOption = el))) {

      selectedOption.selected = true;
      this.#hideListbox();
    }
  }

  #handleBlur = (event) => {

    if (event.composedPath().some(el => el === this)) return;

    this.#hideListbox();
  }

  #isListboxExpanded() {
    try {
      return this.#listbox.matches(':open');
    } catch {
      return this.#listbox.matches('.\\:open');
    }
  }

  #showListbox() {
    this.#internals.ariaExpanded = 'true';

    if (this.#listbox.showPopover) {
      this.#listbox.showPopover();
    } else {
      this.#listbox.classList.add(':open');
    }
  }

  #hideListbox() {
    this.#internals.ariaExpanded = 'false';

    if (this.#listbox.hidePopover) {
      this.#listbox.hidePopover();
    } else {
      this.#listbox.classList.remove(':open');
    }
  }

}

if (!globalThis.customElements.get('x-selectmenu')) {
  globalThis.customElements.define('x-selectmenu', SelectMenuElement);
}

export default SelectMenuElement;
