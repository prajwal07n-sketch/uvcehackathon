/**
 * Universal Academic & Campus Email Validator & Institution Extractor
 * Accepts all accredited university domains (.edu.in, .ac.in, .edu, .ac.uk, etc.)
 * as well as standard personal emails (gmail.com, outlook.com, etc.) for open student access.
 */

// Universal regex for academic TLDs and second-level institutional domains
export const ACADEMIC_EMAIL_REGEX =
  /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)*(edu\.in|ac\.in|edu|ac\.uk|edu\.au|ac\.jp|edu\.sg|ac\.nz|edu\.ca)$/i;

// Standard valid email regex (RFC 5322 compatible)
export const GENERAL_EMAIL_REGEX =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Checks if the email is strictly an institutional academic email
 */
export function isStrictAcademicEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') return false;
  return ACADEMIC_EMAIL_REGEX.test(email.toLowerCase().trim());
}

/**
 * Validates whether an email is permitted for sign-in & registration.
 * By default, permits any valid email address while identifying academic vs general domains.
 */
export function isAcademicEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') return false;
  const cleanEmail = email.toLowerCase().trim();

  // Basic email structure validation
  if (!GENERAL_EMAIL_REGEX.test(cleanEmail)) {
    return false;
  }

  // Permissive by default for hackathons, testing, and universal student inclusion
  // Checked via env or defaults to true for general email support
  const allowAll =
    process.env.ALLOW_ALL_EMAILS !== 'false' &&
    process.env.NEXT_PUBLIC_ALLOW_ALL_EMAILS !== 'false';

  if (allowAll) {
    return true;
  }

  // Check additional allowed domains in .env
  const additionalDomains = [
    ...(process.env.ADDITIONAL_ALLOWED_DOMAINS || '').split(','),
    ...(process.env.NEXT_PUBLIC_ADDITIONAL_ALLOWED_DOMAINS || '').split(','),
    ...(process.env.ALLOWED_CAMPUS_DOMAINS || '').split(','),
    'gmail.com',
    'outlook.com',
    'yahoo.com',
    'hotmail.com',
    'icloud.com',
  ]
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

  for (const domain of additionalDomains) {
    if (domain.startsWith('@') ? cleanEmail.endsWith(domain) : cleanEmail.endsWith(`@${domain}`) || cleanEmail.endsWith(`.${domain}`)) {
      return true;
    }
  }

  return ACADEMIC_EMAIL_REGEX.test(cleanEmail);
}

/**
 * Extracts and formats the institution/college name from an email
 * e.g., 'student@drait.edu.in' -> 'DRAIT'
 * e.g., 'john@mit.edu' -> 'MIT'
 * e.g., 'aarav@campus.ac.in' -> 'CAMPUS'
 * e.g., 'prajwal@gmail.com' -> 'CAMPUS SCHOLAR'
 */
export function extractInstitutionFromEmail(email: string | null | undefined): string {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return 'Campus Member';
  }

  const domain = email.split('@')[1]?.toLowerCase().trim();
  if (!domain) return 'Campus Member';

  // Check for common public email providers
  const publicProviders = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'proton.me'];
  if (publicProviders.includes(domain)) {
    return 'Campus Scholar';
  }

  // Strip academic TLDs
  const cleanedDomain = domain
    .replace(/\.(edu\.in|ac\.in|edu|ac\.uk|edu\.au|ac\.jp|edu\.sg|ac\.nz|edu\.ca|com|org|net|in)$/i, '')
    .trim();

  if (!cleanedDomain) {
    return 'Academic Institution';
  }

  // If subdomains exist (e.g. 'ece.uvce'), pick the main college tag
  const parts = cleanedDomain.split('.');
  const primary = parts[parts.length - 1];

  return primary.toUpperCase();
}

/**
 * Returns the exact domain string for UI badges (e.g. '@drait.edu.in' or '@gmail.com')
 */
export function getAcademicDomain(email: string | null | undefined): string | null {
  if (!email || !isAcademicEmail(email)) return null;
  const parts = email.split('@');
  return parts.length > 1 ? `@${parts[1].toLowerCase().trim()}` : null;
}
