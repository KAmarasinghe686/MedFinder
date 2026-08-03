import { installGoogleTranslateDomCompatibility } from './googleTranslateDomCompatibility';

beforeAll(() => {
  installGoogleTranslateDomCompatibility();
});

test('preserves normal removeChild behavior', () => {
  const parent = document.createElement('div');
  const child = document.createElement('span');
  parent.appendChild(child);

  expect(parent.removeChild(child)).toBe(child);
  expect(parent.children).toHaveLength(0);
});

test('removes a Google Translate wrapper instead of throwing', () => {
  const parent = document.createElement('div');
  const translatedWrapper = document.createElement('font');
  const reactChild = document.createElement('span');
  translatedWrapper.appendChild(reactChild);
  parent.appendChild(translatedWrapper);

  expect(() => parent.removeChild(reactChild)).not.toThrow();
  expect(parent.children).toHaveLength(0);
});

test('safely ignores a node that Google Translate already replaced', () => {
  const parent = document.createElement('div');
  const replacedChild = document.createElement('span');

  expect(() => parent.removeChild(replacedChild)).not.toThrow();
  expect(parent.children).toHaveLength(0);
});

test('inserts before the direct translated wrapper', () => {
  const parent = document.createElement('div');
  const translatedWrapper = document.createElement('font');
  const referenceNode = document.createTextNode('translated');
  const newNode = document.createElement('strong');
  translatedWrapper.appendChild(referenceNode);
  parent.appendChild(translatedWrapper);

  parent.insertBefore(newNode, referenceNode);

  expect(parent.firstChild).toBe(newNode);
  expect(parent.lastChild).toBe(translatedWrapper);
});
