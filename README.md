# `<selectlist>` polyfill

Based on the proposal 
[open-ui.org/components/selectmenu](https://open-ui.org/components/selectmenu/)
by [Open UI](https://github.com/openui/open-ui).

This polyfill depends on the 
[Popover API](https://developer.chrome.com/docs/web-platform/popover-api/) 
and comes with a light popover polyfill built-in.  
So it doesn't require the 
[Popover polyfill](https://github.com/oddbird/popover-polyfill) 
but aims to be compatible if you wish to use these together.

One of the goals was to research and create it as closely to spec as possible
and use the learnings for the implementation in
[Media Chrome](https://github.com/muxinc/media-chrome).

## Usage [Codesandbox](https://codesandbox.io/s/selectmenu-polyfill-6qky7m?file=/index.html)

Until the native `<selectlist>` lands in one of the browsers it's recommended 
to use the custom elements `<x-selectlist>` and `<x-option>` directly and not
use them as a polyfill. 

This is to prevent breaking anything in the future 
if the native `<selectlist>` API would change and you would be running a native
selectlist and a polyfilled selectlist with misaligned API's.

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/selectlist-polyfill/src/selectlist.min.js"></script>
<script type="module" src="https://cdn.jsdelivr.net/npm/selectlist-polyfill/src/option.min.js"></script>

<x-selectlist>
  <x-option>Option 1</x-option>
  <x-option>Option 2</x-option>
  <x-option>Option 3</x-option>
</x-selectlist>
```

[See all examples](https://selectlist-polyfill.vercel.app/examples/)

## Caveats

- Firefox and Safari don't allow creating a shadow DOM
  on custom tags like `selectlist` so the polyfill replaces `selectlist` elements
  with `x-selectlist` elements via a mutation observer. If you prefer your elements
are not replaced use `x-selectlist` directly.
- Safari doesn't render `<option>` content not nested in `<select>` so `option`
  elements nested under `x-selectlist` are automatically replaced with `x-option` 
  elements. Again if you prefer to keep the element instance intact use `x-option`
  elements directly.
- The native `<option>` has a `:checked` pseudo selector state. This is not possible to polyfill, 
  so instead `<x-option>` adds the `.\:checked` CSS class to any selected option.

## Related 

- [Popover polyfill](https://github.com/oddbird/popover-polyfill)
- [Media Chrome](https://github.com/muxinc/media-chrome)
