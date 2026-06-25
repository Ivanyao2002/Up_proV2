import type { NavIconName } from "./NavIcon";

export interface NavItem {
  label: string;
  path: string;
  icon?: NavIconName;
  permission: string;
  /**
   * Stratégie de correspondance pour l'état actif du lien :
   * - `"exact"` : actif uniquement si le pathname égale `path` (ou `path/`).
   * - `"prefix"` : actif si le pathname égale `path` ou commence par `path/`.
   * Si omis, le comportement historique (par défaut prefix, avec règles
   * spécifiques) s'applique — voir `isNavItemActive`.
   */
  match?: "exact" | "prefix";
  /**
   * Chemins additionnels considérés comme actifs pour ce lien. Chaque entrée
   * suit la stratégie `match` (exact/prefix). Permet de regrouper des routes
   * connexes (ex. pages de détail) sans coder de règle en dur.
   */
  activePaths?: string[];
  /**
   * Module métier partenaire requis pour afficher l'entrée (filtrage par
   * `partner_type`). `undefined` = visible par tous les partenaires (commun).
   * Voir `useScope().hasModule`.
   */
  module?: "fleet" | "freight" | "rental";
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}
