import { test } from 'zora';

test('selectmenu is an element', async function (t) {
  const selectmenu = await fixture(`<selectmenu></selectmenu>`);
  t.equal(selectmenu.localName, 'selectmenu');
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
  return result;
}
