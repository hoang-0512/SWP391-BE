export function isPasswordNotEmpty(password: string): boolean {
  return password.length > 0;
}

export function isPasswordValid(password: string): boolean {
  return password.length >= 6;
}

export function isUsernameCaseSensitive(username: string): boolean {
  return username === username.trim() && /[a-z]/.test(username) && /[A-Z]/.test(username);
}

export function isValidDateFormat(input: string): boolean {
  const date = new Date(input);
  return !isNaN(date.getTime());
}
