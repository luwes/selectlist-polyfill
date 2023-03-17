import { test } from 'zora';

test('selectmenu is an element', async function (t) {
  const selectmenu = await fixture(`<x-selectmenu></x-selectmenu>`);
  t.equal(selectmenu.localName, 'x-selectmenu');
});

test('selectmenu selects the first option by default', async function (t) {
  const selectmenu = await fixture(`
    <x-selectmenu>
      <x-option>Option 1</x-option>
      <x-option>Option 2</x-option>
    </x-selectmenu>`);
  t.equal(selectmenu.value, 'Option 1');
  t.equal(selectmenu.selectedIndex, 0);
});

test('selectmenu selects the option w/ selected attribute', async function (t) {
  const selectmenu = await fixture(`
    <x-selectmenu>
      <x-option>Option 1</x-option>
      <x-option selected>Option 2</x-option>
    </x-selectmenu>`);
  t.equal(selectmenu.value, 'Option 2');
  t.equal(selectmenu.selectedIndex, 1);
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fixture(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  const fragment = template.content.cloneNode(true);
  const result = fragment.children.length > 1
    ? [...fragment.children]
    : fragment.children[0];
  document.body.append(fragment);
  await delay(0);
  return result;
}
