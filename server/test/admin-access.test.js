const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getAdminLoginError,
  isAdminSessionAllowed,
} = require('../src/utils/adminAccess');

const withAdminEmails = (value, callback) => {
  const previous = process.env.ADMIN_EMAILS;
  if (typeof value === 'undefined') {
    delete process.env.ADMIN_EMAILS;
  } else {
    process.env.ADMIN_EMAILS = value;
  }

  try {
    callback();
  } finally {
    if (typeof previous === 'undefined') {
      delete process.env.ADMIN_EMAILS;
    } else {
      process.env.ADMIN_EMAILS = previous;
    }
  }
};

test('an empty allowlist cannot provision an arbitrary admin account', () => {
  withAdminEmails('', () => {
    const error = getAdminLoginError('attacker@example.com', false);
    assert.equal(error.status, 403);
  });
});

test('an existing admin can sign in when the optional allowlist is empty', () => {
  withAdminEmails('', () => {
    assert.equal(getAdminLoginError('existing@example.com', true), null);
    assert.equal(isAdminSessionAllowed('existing@example.com'), true);
  });
});

test('a configured allowlist controls provisioning and active sessions', () => {
  withAdminEmails('admin@medfinder.lk', () => {
    assert.equal(getAdminLoginError('admin@medfinder.lk', false), null);
    assert.equal(getAdminLoginError('other@example.com', true).status, 403);
    assert.equal(isAdminSessionAllowed('other@example.com'), false);
  });
});
