export const ALLOWED_LICENSES = new Set(["MIT", "ISC", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "0BSD", "PSF-2.0", "MPL-2.0"]);

export function findLicenseProblems(list) {
  return Object.entries(list)
    .filter(([license]) => !ALLOWED_LICENSES.has(license))
    .flatMap(([license, packages]) => packages.map((name) => `${name} has the license ${license}, which is not allowed`));
}
