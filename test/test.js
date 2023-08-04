import { test } from 'zora';

test('selectlist is an element', async function (t) {
  const selectlist = await fixture(`<x-selectlist></x-selectlist>`);
  t.equal(selectlist.localName, 'x-selectlist');
});

test('selectlist selects the first option by default', async function (t) {
  const selectlist = await fixture(`
    <x-selectlist>
      <x-option>Option 1</x-option>
      <x-option>Option 2</x-option>
    </x-selectlist>`);
  t.equal(selectlist.value, 'Option 1');
  t.equal(selectlist.selectedIndex, 0);
});

test('selectlist selects the option w/ selected attribute', async function (t) {
  const selectlist = await fixture(`
    <x-selectlist>
      <x-option>Option 1</x-option>
      <x-option selected>Option 2</x-option>
    </x-selectlist>`);
  t.equal(selectlist.value, 'Option 2');
  t.equal(selectlist.selectedIndex, 1);
});

test('selectlist.selectedIndex selects the option w/ index', async function (t) {
  const selectlist = await fixture(`
    <x-selectlist>
      <x-option>Option 1</x-option>
      <x-option>Option 2</x-option>
    </x-selectlist>`);

  selectlist.selectedIndex = 1;

  t.equal(selectlist.value, 'Option 2');
  t.equal(selectlist.selectedIndex, 1);
});

test('selectlist.value selects the option w/ value', async function (t) {
  const selectlist = await fixture(`
    <x-selectlist>
      <x-option>Option 1</x-option>
      <x-option>Option 2</x-option>
    </x-selectlist>`);

  selectlist.value = 'Option 2';

  t.equal(selectlist.value, 'Option 2');
  t.equal(selectlist.selectedIndex, 1);
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
