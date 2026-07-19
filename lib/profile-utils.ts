export function getFirstNameFromEmail(email: string | null | undefined) {
  const localPart = email?.trim().split("@")[0];
  if (!localPart) return null;

  const firstName = localPart.split(".")[0]?.trim().toLowerCase();
  if (!firstName) return null;

  return `${firstName.charAt(0).toUpperCase()}${firstName.slice(1)}`;
}
