
const popoverSupported = typeof HTMLElement !== 'undefined' &&
  typeof HTMLElement.prototype === 'object' &&
  'popover' in HTMLElement.prototype;

const popoverStyles = popoverSupported ? '' : /* css */`
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
`;

const listboxStyles = /* css */`
  [behavior="listbox"] {
    box-sizing: border-box;
    margin: 0;
    min-block-size: 1lh;
    max-block-size: inherit;
    min-inline-size: inherit;
    inset-block-start: inherit;
    inset-block-end: inherit;
  }
`;

/**
 * CSS @layer: any styles declared outside of a layer will override styles
 * declared in a layer, regardless of specificity.
 * https://developer.mozilla.org/en-US/docs/Web/CSS/@layer
 */

const headTemplate = document.createElement('template');
headTemplate.innerHTML = /* html */`
<style>
  @layer {
    ${popoverStyles}
    x-selectmenu ${listboxStyles}
  }
</style>
`;

document.head.prepend(headTemplate.content.cloneNode(true));

const template = document.createElement('template');
template.innerHTML = /* html */`
  <style>
    ${popoverStyles}
    ${listboxStyles}

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

    slot[name="listbox"],
    ::slotted([slot="listbox"]) {
      ${/* min-inline-size overridden below by selectmenu width */''}
    }

    [part="listbox"] {
      box-sizing: border-box;
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
  static observedAttributes = ['disabled', 'required', 'multiple'];

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

    this.addEventListener('click', this.#onClick, true);
    this.addEventListener('keydown', this.#onKeydown);
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

  get #buttonEl() {
    let button = this.querySelector('[behavior=button]');
    if (!button) {
      button = this.shadowRoot.querySelector('[behavior=button]');
    }
    return button;
  }

  get #listboxEl() {
    let listbox = this.querySelector('[behavior=listbox]');
    if (!listbox) {
      listbox = this.shadowRoot.querySelector('[behavior=listbox]');
    }
    return listbox;
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
    this.#selectedValue.textContent = this.selectedOption?.label;
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
          selectedOption._setSelectedState?.(false);
        }

        option._setSelectedState?.(true);
        selectedOption = option;

      } else {
        option._setSelectedState?.(false);
      }

      if (!firstOption && !option.disabled) {
        firstOption = option;
      }
    }

    if (!selectedOption && firstOption && !this.multiple) {
      firstOption._setSelectedState?.(true);
    }

    this.#selectionChanged();
  }

  #onClick = (event) => {
    if (this.disabled) return;

    const path = event.composedPath();
    let selectedOption;

    // Open / Close
    if (path.some(el => el === this.#buttonEl)) {

      if (this.#isOpen()) {
        this.#hide();
      } else {
        this.#show();
      }

    } else if (path.some(el => this.options.includes(el) && (selectedOption = el))) {

      this.#userSelect(selectedOption);
      this.#hide();
    }
  }

  #onBlur = (event) => {

    if (event.composedPath().some(el => el === this)) return;

    this.#hide();
  }

  #onKeydown = (event) => {
    if (this.disabled) return;

    const { key } = event;

    const activeOptions = this.options.filter(opt => !opt.disabled);
    let currentOption = activeOptions.find(el => el.tabIndex === 0)
      ?? activeOptions[0];

    if (key === 'Escape') {
      this.#hide();
      return;
    }

    if (key === 'Enter' || key === ' ') {
      event.preventDefault();

      if (!this.#isOpen()) {
        this.#show();
        return;
      }

      if (!this.multiple) {
        this.#userSelect(currentOption);
        this.#hide();
      }

      return;
    }

    if (['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(key)) {
      // Prevent scrolling
      event.preventDefault();

      const currentIndex = activeOptions.indexOf(currentOption);
      let newIndex = Math.max(0, currentIndex);

      if (key === 'ArrowDown') {
        newIndex = Math.min(currentIndex + 1, activeOptions.length - 1);
      } else if (key === 'ArrowUp') {
        newIndex = Math.max(0, currentIndex - 1);
      } else if (event.key === 'Home') {
        newIndex = 0;
      } else if (event.key === 'End') {
        newIndex = activeOptions.length - 1;
      }

      this.options.forEach(option => (option.tabIndex = '-1'));

      currentOption = activeOptions[newIndex];
      currentOption.tabIndex = 0;
      currentOption.focus();
    }
  };

  #userSelect(option) {
    const oldSelectedOptions = [...this.selectedOptions];

    option.selected = true;

    if (this.selectedOptions.some((opt, i) => opt != oldSelectedOptions[i])) {

      this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      this.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  #handleReposition = () => {
    if (this.#isOpen()) {
      reposition(this, this.#listboxEl);
    }
  }

  #isOpen() {
    try {
      return this.#listboxEl.matches(':open');
    } catch {
      return this.#listboxEl.matches('.\\:open');
    }
  }

  #show() {
    this.#internals.ariaExpanded = 'true';

    if (this.#listboxEl.showPopover) {
      this.#listboxEl.showPopover();
    } else {
      this.#listboxEl.classList.add(':open');
    }

    reposition(this, this.#listboxEl);

    const activeOptions = this.options.filter(opt => !opt.disabled);
    const currentOption = this.selectedOption
      ?? activeOptions.find(el => el.tabIndex === 0)
      ?? activeOptions[0];

    this.options.forEach(option => (option.tabIndex = '-1'));
    currentOption.tabIndex = 0;
    currentOption.focus();

    document.addEventListener('click', this.#onBlur);
    window.addEventListener('resize', this.#handleReposition);
    window.addEventListener('scroll', this.#handleReposition);
  }

  #hide() {
    this.#buttonEl.focus();
    this.#internals.ariaExpanded = 'false';

    if (this.#listboxEl.hidePopover) {
      this.#listboxEl.hidePopover();
    } else {
      this.#listboxEl.classList.remove(':open');
    }

    document.removeEventListener('click', this.#onBlur);
    window.removeEventListener('resize', this.#handleReposition);
    window.removeEventListener('scroll', this.#handleReposition);
  }
}

function reposition(reference, popover) {

  let { style } = getCSSRule(reference.shadowRoot,
    'slot[name="listbox"], ::slotted([slot="listbox"])');

  style.maxBlockSize = 'initial';
  style.insetBlockStart = 'initial';
  style.insetBlockEnd = 'initial';

  const container = { top: 0, height: window.innerHeight };
  const refBox = reference.getBoundingClientRect();

  style.minInlineSize = `${refBox.width}px`;
  style.insetBlockStart = `${refBox.bottom}px`;

  let popBox = popover.getBoundingClientRect();
  
  const bottomOverflow = popBox.bottom - container.height;
  if (bottomOverflow > 0) {

    let minHeightBeforeFlip = (reference.options[0]?.offsetHeight ?? 50) * 1.3;
    let newHeight = popBox.height - bottomOverflow;

    if (newHeight > minHeightBeforeFlip) {

      style.maxBlockSize = `${newHeight}px`;

    } else {

      style.insetBlockStart = 'auto';
      style.insetBlockEnd = `${container.height - refBox.top}px`;

      popBox = popover.getBoundingClientRect();

      const topOverflow = container.top - popBox.top;
      newHeight = popBox.height - topOverflow;
      
      if (topOverflow > 0) {
        style.insetBlockStart = container.top;
        style.insetBlockEnd = 'auto';
        style.maxBlockSize = `${newHeight}px`;
      }
    }
  }
}

/**
 * Get a CSS rule with a selector in an element containing <style> tags.
 * @param  {Element|ShadowRoot} styleParent
 * @param  {string} selectorText
 * @return {CSSStyleRule}
  */
function getCSSRule(styleParent, selectorText) {
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
