export { default as AuthUtils } from './auth-utils';
export { default as ValidationUtils } from './validation-utils';
export { default as NotificationUtils } from './notification-utils';

export function showFormattedDate(date, locale = 'id-ID', options = {}) {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

export function sleep(time = 1000) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
