export interface PasswordChecks {
  minLength: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
}

export const getPasswordChecks = (password: string): PasswordChecks => ({
  minLength: password.length >= 8,
  uppercase: /[A-Z]/.test(password),
  lowercase: /[a-z]/.test(password),
  number: /[0-9]/.test(password),
  special: /[!@#$%^&*]/.test(password),
});

export const getPasswordScore = (checks: PasswordChecks): number =>
  Object.values(checks).filter(Boolean).length;

export const isPasswordStrong = (password: string): boolean => {
  const checks = getPasswordChecks(password);
  return getPasswordScore(checks) === 5;
};

export const getPasswordStrengthLabel = (
  score: number
): 'Weak' | 'Fair' | 'Strong' | 'Very Strong' => {
  if (score <= 2) return 'Weak';
  if (score === 3) return 'Fair';
  if (score === 4) return 'Strong';
  return 'Very Strong';
};
