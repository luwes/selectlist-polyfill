# `<selectmenu>` polyfill

Based on the proposal at https://open-ui.org/prototypes/selectmenu/  

One of the goals was to research and create it as closely to spec as possible
and use the learnings for the implementation in
[Media Chrome](https://github.com/muxinc/media-chrome)

```html
<script type="module" src="src/selectmenu.js"></script>

<selectmenu>
  <option>Option 1</option>
  <option>Option 2</option>
  <option>Option 3</option>
</selectmenu>
```

## Caveats

- Firefox and Safari don't allow creating a shadow DOM
  on custom tags like `selectmenu` so the polyfill replaces `selectmenu` elements
  with `x-selectmenu` elements via a mutation observer. If you prefer your elements
are not replaced use `x-selectmenu` directly.
- Safari doesn't render `<option>` content not nested in `<select>` so `option`
  elements nested under `x-selectmenu` are automatically replaced with `x-option` 
  elements. Again if you prefer to keep the element instance intact use `x-option`
  elements directly.
  
