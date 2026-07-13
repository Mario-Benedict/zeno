export const UPLOAD_TOO_LARGE_EVENT = 'zeno:upload-too-large';

export const notifyUploadTooLarge = (): void => {
  window.dispatchEvent(new CustomEvent(UPLOAD_TOO_LARGE_EVENT));
};
