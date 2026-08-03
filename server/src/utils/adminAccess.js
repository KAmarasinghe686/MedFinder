const getAdminEmails = () =>
  (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

const getAdminLoginError = (email, accountExists) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const configuredEmails = getAdminEmails();
  const isConfiguredAdmin = configuredEmails.includes(normalizedEmail);

  if (configuredEmails.length > 0 && !isConfiguredAdmin) {
    return {
      status: 403,
      message: 'Admin access is not enabled for this email.',
    };
  }

  // A configured address may bootstrap its account. When no allowlist is
  // configured, only an already-provisioned admin account may sign in.
  if (!accountExists && !isConfiguredAdmin) {
    return {
      status: 403,
      message:
        'This email is not a provisioned administrator. Configure ADMIN_EMAILS or ask an existing administrator.',
    };
  }

  return null;
};

const isAdminSessionAllowed = (email) => {
  const configuredEmails = getAdminEmails();
  if (configuredEmails.length === 0) {
    return true;
  }

  return configuredEmails.includes(String(email || '').trim().toLowerCase());
};

module.exports = {
  getAdminEmails,
  getAdminLoginError,
  isAdminSessionAllowed,
};
