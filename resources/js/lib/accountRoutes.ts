export const accountPath = (accountIndex: number, path = '') => {
  const normalized =
    path === '' ? '' : path.startsWith('/') ? path : `/${path}`;

  return `/u/${accountIndex}${normalized}`;
};

export const projectPath = (
  accountIndex: number,
  projectSlug: string,
  path = '',
) => {
  const normalized =
    path === '' ? '' : path.startsWith('/') ? path : `/${path}`;

  return accountPath(accountIndex, `/p/${projectSlug}${normalized}`);
};
