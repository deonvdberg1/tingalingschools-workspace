// App params — simplified for Supabase
// Previously used for Base44 SDK configuration

const isNode = typeof window === 'undefined';
const windowObj = isNode ? { localStorage: new Map() } : window;
const storage = windowObj.localStorage;

export const appParams = {
  appId: null,
  token: null,
  fromUrl: isNode ? '' : window.location.href,
  functionsVersion: null,
  appBaseUrl: null,
};
