/**
 * Référentiels ISO + enums OpenAPI pour les formulaires profil.
 * - Pays : ISO 3166-1 alpha-2
 * - Langues : ISO 639-1
 */

export type Option = { value: string; label: string };

/** Pays les plus utiles (sport / Europe / Afrique / Amériques) — code ISO 3166-1 alpha-2 */
export const COUNTRIES: Option[] = [
  { value: "FR", label: "France" },
  { value: "BE", label: "Belgique" },
  { value: "CH", label: "Suisse" },
  { value: "LU", label: "Luxembourg" },
  { value: "MC", label: "Monaco" },
  { value: "CA", label: "Canada" },
  { value: "US", label: "États-Unis" },
  { value: "GB", label: "Royaume-Uni" },
  { value: "IE", label: "Irlande" },
  { value: "DE", label: "Allemagne" },
  { value: "ES", label: "Espagne" },
  { value: "PT", label: "Portugal" },
  { value: "IT", label: "Italie" },
  { value: "NL", label: "Pays-Bas" },
  { value: "PL", label: "Pologne" },
  { value: "BR", label: "Brésil" },
  { value: "AR", label: "Argentine" },
  { value: "MX", label: "Mexique" },
  { value: "MA", label: "Maroc" },
  { value: "DZ", label: "Algérie" },
  { value: "TN", label: "Tunisie" },
  { value: "SN", label: "Sénégal" },
  { value: "CI", label: "Côte d'Ivoire" },
  { value: "CM", label: "Cameroun" },
  { value: "MG", label: "Madagascar" },
  { value: "MU", label: "Maurice" },
  { value: "RE", label: "La Réunion" },
  { value: "GP", label: "Guadeloupe" },
  { value: "MQ", label: "Martinique" },
  { value: "GF", label: "Guyane" },
  { value: "YT", label: "Mayotte" },
  { value: "JP", label: "Japon" },
  { value: "KR", label: "Corée du Sud" },
  { value: "CN", label: "Chine" },
  { value: "AU", label: "Australie" },
  { value: "NZ", label: "Nouvelle-Zélande" },
  { value: "ZA", label: "Afrique du Sud" },
  { value: "NG", label: "Nigeria" },
  { value: "GH", label: "Ghana" },
  { value: "EG", label: "Égypte" },
  { value: "TR", label: "Turquie" },
  { value: "RU", label: "Russie" },
  { value: "UA", label: "Ukraine" },
  { value: "SE", label: "Suède" },
  { value: "NO", label: "Norvège" },
  { value: "DK", label: "Danemark" },
  { value: "FI", label: "Finlande" },
  { value: "AT", label: "Autriche" },
  { value: "CZ", label: "Tchéquie" },
  { value: "RO", label: "Roumanie" },
  { value: "GR", label: "Grèce" },
  { value: "HR", label: "Croatie" },
  { value: "RS", label: "Serbie" },
  { value: "BA", label: "Bosnie-Herzégovine" },
  { value: "AL", label: "Albanie" },
  { value: "XK", label: "Kosovo" },
  { value: "ML", label: "Mali" },
  { value: "BF", label: "Burkina Faso" },
  { value: "NE", label: "Niger" },
  { value: "TG", label: "Togo" },
  { value: "BJ", label: "Bénin" },
  { value: "GA", label: "Gabon" },
  { value: "CG", label: "Congo" },
  { value: "CD", label: "RD Congo" },
  { value: "RW", label: "Rwanda" },
  { value: "KE", label: "Kenya" },
  { value: "ET", label: "Éthiopie" },
  { value: "IN", label: "Inde" },
  { value: "QA", label: "Qatar" },
  { value: "AE", label: "Émirats arabes unis" },
  { value: "SA", label: "Arabie saoudite" },
].sort((a, b) => a.label.localeCompare(b.label, "fr"));

/** Langues ISO 639-1 courantes */
export const LANGUAGES: Option[] = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
  { value: "es", label: "Espagnol" },
  { value: "pt", label: "Portugais" },
  { value: "de", label: "Allemand" },
  { value: "it", label: "Italien" },
  { value: "nl", label: "Néerlandais" },
  { value: "ar", label: "Arabe" },
  { value: "zh", label: "Chinois" },
  { value: "ja", label: "Japonais" },
  { value: "ko", label: "Coréen" },
  { value: "ru", label: "Russe" },
  { value: "pl", label: "Polonais" },
  { value: "tr", label: "Turc" },
  { value: "sw", label: "Swahili" },
  { value: "mg", label: "Malgache" },
  { value: "wo", label: "Wolof" },
  { value: "ha", label: "Haoussa" },
  { value: "yo", label: "Yoruba" },
  { value: "zu", label: "Zoulou" },
  { value: "ca", label: "Catalan" },
  { value: "eu", label: "Basque" },
  { value: "ro", label: "Roumain" },
  { value: "uk", label: "Ukrainien" },
  { value: "sv", label: "Suédois" },
  { value: "no", label: "Norvégien" },
  { value: "da", label: "Danois" },
  { value: "fi", label: "Finnois" },
  { value: "el", label: "Grec" },
  { value: "hr", label: "Croate" },
  { value: "sr", label: "Serbe" },
  { value: "bs", label: "Bosniaque" },
  { value: "sq", label: "Albanais" },
].sort((a, b) => a.label.localeCompare(b.label, "fr"));

export const GENDERS: Option[] = [
  { value: "MALE", label: "Homme" },
  { value: "FEMALE", label: "Femme" },
  { value: "OTHER", label: "Autre" },
  { value: "UNDISCLOSED", label: "Non communiqué" },
];

export const DOMINANT_SIDES: Option[] = [
  { value: "LEFT", label: "Gauche" },
  { value: "RIGHT", label: "Droite" },
  { value: "BOTH", label: "Ambidextre" },
];

export const BLOOD_TYPES: Option[] = [
  { value: "A+", label: "A+" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B-" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB-" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O-" },
  { value: "UNKNOWN", label: "Inconnu" },
];

export const COACHING_LICENSE_LEVELS: Option[] = [
  { value: "GRASSROOTS", label: "Grassroots" },
  { value: "C", label: "Licence C" },
  { value: "B", label: "Licence B" },
  { value: "A", label: "Licence A" },
  { value: "PRO", label: "Pro" },
  { value: "NATIONAL", label: "National" },
  { value: "OTHER", label: "Autre" },
];

export const HEALTH_SPECIALTIES: Option[] = [
  { value: "PHYSIOTHERAPIST", label: "Kinésithérapeute" },
  { value: "SPORTS_PHYSICIAN", label: "Médecin du sport" },
  { value: "GENERAL_PRACTITIONER", label: "Médecin généraliste" },
  { value: "ORTHOPEDIST", label: "Orthopédiste" },
  { value: "NUTRITIONIST", label: "Nutritionniste" },
  { value: "PSYCHOLOGIST", label: "Psychologue" },
  { value: "OSTEOPATH", label: "Ostéopathe" },
  { value: "NURSE", label: "Infirmier(ère)" },
  { value: "OTHER", label: "Autre" },
];

/** preferred_contact_method (Parent) — valeurs libres côté API, liste guidée côté UI */
export const CONTACT_METHODS: Option[] = [
  { value: "PHONE", label: "Téléphone" },
  { value: "SMS", label: "SMS" },
  { value: "EMAIL", label: "Email" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "OTHER", label: "Autre" },
];

export function labelOf(options: Option[], value: string | null | undefined): string {
  if (!value) return "—";
  return options.find((o) => o.value === value)?.label ?? value;
}

export const selectClassName =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";
