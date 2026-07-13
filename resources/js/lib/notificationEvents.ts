export const NOTIFICATIONS_REFRESH_EVENT = 'zeno:notifications-refresh';

export const refreshNotifications = () => {
  window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));
};
