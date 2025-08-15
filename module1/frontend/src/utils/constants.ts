export const MFA_CODE_LENGTH = 6;

export const ROUTES = {
  HOME: '/',
  SIGNIN: '/signin',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  PROFILE_EDIT: '/profile/edit',
  EMAIL_VERIFICATION: '/auth/confirm',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password'
} as const;

export const FORM_VALIDATION = {
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MIN_PASSWORD_LENGTH: 6,
  MAX_NAME_LENGTH: 50
} as const;

export const UI_CONSTANTS = {
  FORM_CARD_MAX_WIDTH: 400,
  DASHBOARD_MAX_WIDTH: 1200,
  ANIMATION_DURATION: 300
} as const;