const PATCH_FLAG = '__medfinderGoogleTranslateCompatibility';

const findDirectChild = (parent, descendant) => {
  let current = descendant;

  while (current?.parentNode && current.parentNode !== parent) {
    current = current.parentNode;
  }

  return current?.parentNode === parent ? current : null;
};

export const installGoogleTranslateDomCompatibility = () => {
  if (
    typeof Node === 'undefined' ||
    Node.prototype[PATCH_FLAG]
  ) {
    return;
  }

  const nativeRemoveChild = Node.prototype.removeChild;
  const nativeInsertBefore = Node.prototype.insertBefore;

  Node.prototype.removeChild = function removeChild(child) {
    if (child?.parentNode === this) {
      return nativeRemoveChild.call(this, child);
    }

    // Google Translate can wrap a React-owned node in a <font> element.
    // Remove the direct wrapper instead so React's deletion can complete.
    const translatedWrapper = findDirectChild(this, child);
    if (translatedWrapper) {
      nativeRemoveChild.call(this, translatedWrapper);
    }

    // Match the native return contract without throwing when Google has
    // already moved or replaced the node.
    return child;
  };

  Node.prototype.insertBefore = function insertBefore(newNode, referenceNode) {
    if (!referenceNode || referenceNode.parentNode === this) {
      return nativeInsertBefore.call(this, newNode, referenceNode);
    }

    // Insert before the wrapper that Google Translate placed around the
    // original reference node. If it was replaced entirely, append safely.
    const translatedWrapper = findDirectChild(this, referenceNode);
    return translatedWrapper
      ? nativeInsertBefore.call(this, newNode, translatedWrapper)
      : this.appendChild(newNode);
  };

  Object.defineProperty(Node.prototype, PATCH_FLAG, {
    configurable: false,
    enumerable: false,
    value: true,
    writable: false,
  });
};
