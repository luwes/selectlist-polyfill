
const html = (raw, ...keys) => String.raw({ raw }, ...keys);

const popoverStyles = `
  @supports not selector([popover]:open) {

    [popover] {
      position: fixed;
      z-index: 2147483647;
      padding: 0.25em;
      width: fit-content;
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

    x-selectmenu [behavior="listbox"] {
      min-block-size: 1lh;
      margin: 0;
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

    [part="button"] {
      display: inline-flex;
      align-items: center;
      background-color: white;
      cursor: default;
      appearance: none;
      padding: 1px 3px;
      border-width: 1px;
      border-style: solid;
      border-color: rgb(118, 118, 118);
      border-image: initial;
      border-radius: 2px;
      color: buttontext;
      line-height: min(1.3em, 15px);
    }

    :host([disabled]) [part="button"] {
      background-color: rgba(239, 239, 239, 0.3);
      color: graytext;
      opacity: 0.7;
      border-color: rgba(118, 118, 118, 0.3);
    }

    [part="marker"] {
      margin-inline-start: 4px;
    }

    [part="listbox"] {
      box-shadow: rgba(0, 0, 0, 0.13) 0px 12.8px 28.8px,
        rgba(0, 0, 0, 0.11) 0px 0px 9.2px;
      min-block-size: 1lh;
      border-width: 1px;
      border-style: solid;
      border-color: rgba(0, 0, 0, 0.15);
      border-image: initial;
      border-radius: 4px;
      padding: 4px;
    }

    [part="listbox"], ::slotted([behavior="listbox"]) {
      box-sizing: border-box;
      overflow: auto;
      inset: auto;
      max-height: 100vh;
      max-width: 100vw;
    }
  </style>
  <slot name="button">
    <button part="button" behavior="button" aria-haspopup="listbox">
      <slot name="selected-value">
        <div part="selected-value" behavior="selected-value"></div>
      </slot>
      <slot name="marker">
        <svg part="marker" xmlns="http://www.w3.org/2000/svg" width="10" height="6" fill="none" viewBox="0 0 10 6">
          <path stroke-linejoin="round" d="m1 1 4 4 4-4" stroke="currentColor" />
        </svg>
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

    this.addEventListener('click', this.#handleClick, true);
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

  get selectedOption() {
    return this.options.find(option => option.selected);
  }

  get selectedIndex() {
    return this.options.findIndex(option => option.selected);
  }

  set selectedIndex(index) {
    const option = this.options.find(option => option.index === index);
    if (option) {
      this.#selectOption(option);
    }
  }

  get value() {
    return this.options.find(option => option.selected)?.value ?? '';
  }

  set value(val) {
    const option = this.options.find(option => option.value === val);
    if (option) {
      this.#selectOption(option);
    }
  }

  get required() {
    return this.hasAttribute('required');
  }

  set required(flag) {
    this.toggleAttribute('required', Boolean(flag));
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(flag) {
    this.toggleAttribute('disabled', Boolean(flag));
  }

  get multiple() {
    return this.hasAttribute('multiple');
  }

  set multiple(flag) {
    this.toggleAttribute('multiple', Boolean(flag));
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

  #selectionChanged() {
    this.#selectedValue.textContent = this.selectedOptions[0]?.label;
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

      reposition(this, this.#listbox);

    } else if (path.some(el => this.options.includes(el) && (selectedOption = el))) {

      selectedOption.selected = true;
      this.#hideListbox();
    }
  }

  #handleBlur = (event) => {

    if (event.composedPath().some(el => el === this)) return;

    this.#hideListbox();
  }

  #handleReposition = () => {
    if (this.#isListboxExpanded()) {
      reposition(this, this.#listbox);
    }
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

    window.addEventListener('resize', this.#handleReposition);
    window.addEventListener('scroll', this.#handleReposition);
  }

  #hideListbox() {
    this.#internals.ariaExpanded = 'false';

    if (this.#listbox.hidePopover) {
      this.#listbox.hidePopover();
    } else {
      this.#listbox.classList.remove(':open');
    }

    window.removeEventListener('resize', this.#handleReposition);
    window.removeEventListener('scroll', this.#handleReposition);
  }

}

function reposition(reference, popover) {

  let { style } = getOrInsertCSSRule(
    reference.shadowRoot, 
    '[part="listbox"], ::slotted([behavior="listbox"])'
  );

  if (!style) style = popover.style;

  style.removeProperty('height');
  style.top = 'auto';
  style.bottom = 'auto';

  const container = { top: 0, height: window.innerHeight };
  const refBox = reference.getBoundingClientRect();

  if (!style.minWidth) {
    style.minWidth = `${refBox.width}px`;
  }

  style.top = `${refBox.bottom}px`;

  let popBox = popover.getBoundingClientRect();
  
  const bottomOverflow = popBox.bottom - container.height;
  if (bottomOverflow > 0) {

    let newHeight = popBox.height - bottomOverflow;
    if (newHeight > 100) {

      style.height = `${newHeight}px`;

    } else {

      style.top = 'auto';
      style.bottom = `${container.height - refBox.top}px`;

      popBox = popover.getBoundingClientRect();

      const topOverflow = container.top - popBox.top;
      newHeight = popBox.height - topOverflow;
      
      if (topOverflow > 0) {
        style.top = container.top;
        style.bottom = 'auto';
        style.height = `${newHeight}px`;
      }
    }
  }
}

/**
 * Get or insert a CSS rule with a selector in an element containing <style> tags.
 * @param  {Element|ShadowRoot} styleParent
 * @param  {string} selectorText
 * @return {CSSStyleRule}
  */
function getOrInsertCSSRule(styleParent, selectorText) {
  let style;
  for (style of styleParent.querySelectorAll('style')) {

    // Catch this error. e.g. browser extension adds style tags.
    //   Uncaught DOMException: CSSStyleSheet.cssRules getter:
    //   Not allowed to access cross-origin stylesheet
    let cssRules;
    try { cssRules = style.sheet?.cssRules; } catch { continue; }

    for (let rule of cssRules ?? [])
      if (rule.selectorText === selectorText) return rule;
  }

  return {};
}

if (!globalThis.customElements.get('x-selectmenu')) {
  globalThis.customElements.define('x-selectmenu', SelectMenuElement);
}

export default SelectMenuElement;
