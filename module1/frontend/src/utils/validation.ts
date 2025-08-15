import { FORM_VALIDATION, MFA_CODE_LENGTH } from './constants';

export const validateEmail = (email: string): boolean => {
  return FORM_VALIDATION.EMAIL_PATTERN.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= FORM_VALIDATION.MIN_PASSWORD_LENGTH;
};

export const validateMFACode = (code: string): boolean => {
  return code.length === MFA_CODE_LENGTH && /^\d+$/.test(code);
};

export const validateName = (name: string): boolean => {
  return name.trim().length > 0 && name.length <= FORM_VALIDATION.MAX_NAME_LENGTH;
};

export const validatePasswordMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword;
};

export const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  if (password.length < 6) return 'weak';
  if (password.length < 10) return 'medium';
  return 'strong';
};

export const createFormValidationRules = (t: (key: string) => string) => ({
  email: [
    { required: true, message: t('emailRequired') },
    { type: 'email' as const, message: t('emailInvalid') }
  ],
  password: [
    { required: true, message: t('passwordRequired') },
    { min: FORM_VALIDATION.MIN_PASSWORD_LENGTH, message: t('passwordTooShort') }
  ],
  name: [
    { required: true, message: t('firstNameRequired') },
    { max: FORM_VALIDATION.MAX_NAME_LENGTH, message: t('nameTooLong') }
  ],
  surname: [
    { required: true, message: t('lastNameRequired') },
    { max: FORM_VALIDATION.MAX_NAME_LENGTH, message: t('nameTooLong') }
  ]
});