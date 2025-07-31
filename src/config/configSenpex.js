const senpexApiBaseUrl =
  process.env.SENPEX_API_BASE_URL ||
  'https://api.sandbox.senpex.com/api/restfull/v4';
const senpexClientId = process.env.SENPEX_CLIENT_ID;
const senpexSecretId = process.env.SENPEX_SECRET_ID;
const senpexImagesBaseUrl =
  process.env.SENPEX_IMAGES_BASE_URL ||
  'https://imagesfiles.version4.senpex.com/image_list/';

const senpexEnabled = !!(senpexClientId && senpexSecretId);

export {
  senpexApiBaseUrl,
  senpexClientId,
  senpexSecretId,
  senpexImagesBaseUrl,
  senpexEnabled,
};
