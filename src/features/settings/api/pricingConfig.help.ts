/** Libellés d'aide — calibration moteur de prix (affichage backoffice) */

export const PRICING_TAB_HELP: Record<string, { title: string; subtitle: string }> = {
  general: {
    title: "Paramètres globaux",
    subtitle: "Décote, arrondi et garde-fous qui s'appliquent à toute la chaîne de calcul.",
  },
  bands: {
    title: "Paliers & catégories",
    subtitle: "Barème par distance — le cœur du prix. Les primes Premium s'ajoutent avant la décote.",
  },
  multipliers: {
    title: "Trafic & météo",
    subtitle: "Coefficients contextuels multipliés ensemble, plafonnés par le cap global.",
  },
  surge: {
    title: "Surge dynamique",
    subtitle: "Ajustement en temps réel selon la chaleur des zones et la tension offre/demande.",
  },
  traffic: {
    title: "Heures de pointe",
    subtitle: "Profils horaires, baseline urbaine et inférence trafic selon l'offre/demande.",
  },
  zones: {
    title: "Zones & hyper-local",
    subtitle: "Détection même zone et palier hyper-local pour les trajets très courts.",
  },
  holidays: {
    title: "Jours fériés",
    subtitle: "Majoration contextuelle selon le calendrier — le coefficient est lu par date.",
  },
};

export const PRICING_FIELD_HELP = {
  enabled: {
    label: "Moteur paliers actif",
    help: "Si désactivé, le serveur repasse sur l'ancien barème unique (pricing_rules). À laisser activé en production.",
  },
  competitorUndercutPct: {
    label: "Décote concurrentielle",
    help: "Pourcentage retiré de la parité Yango avant affichage client. 20 % = le client paie 80 % de la parité.",
    unit: "%",
  },
  roundStepXof: {
    label: "Pas d'arrondi",
    help: "Arrondi au supérieur du prix final (ex. 50 F → 4 437 devient 4 450).",
    unit: "XOF",
  },
  priceCapGlobal: {
    label: "Plafond multiplicateurs",
    help: "Limite absolue du produit trafic × météo × surge. Empêche les prix d'exploser en heure de pointe.",
    unit: "×",
  },
  approachKm: {
    label: "Approche chauffeur — distance",
    help: "Kilomètres chauffeur → client facturés en prise en charge si l'app ne fournit pas la position.",
    unit: "km",
  },
  approachMin: {
    label: "Approche chauffeur — durée",
    help: "Minutes d'approche facturées par défaut lors de la création du devis.",
    unit: "min",
  },
  baseFareXof: {
    label: "Prise en charge",
    help: "Montant fixe au démarrage du trajet pour ce palier de distance.",
    unit: "XOF",
  },
  perKmXof: {
    label: "Tarif kilométrique",
    help: "Prix ajouté pour chaque kilomètre parcouru dans ce palier.",
    unit: "XOF/km",
  },
  perMinuteXof: {
    label: "Tarif horaire",
    help: "Prix par minute de trajet (durée facturée après multiplicateur trafic).",
    unit: "XOF/min",
  },
  minimumFareXof: {
    label: "Tarif minimum",
    help: "Plancher : le sous-total avant décote ne descend jamais sous ce montant (+ prime catégorie).",
    unit: "XOF",
  },
  pickupBaseXof: {
    label: "Pickup fixe",
    help: "Part fixe de la mise en relation chauffeur ↔ client.",
    unit: "XOF",
  },
  pickupPerKmXof: {
    label: "Pickup / km",
    help: "Complément pickup proportionnel à la distance d'approche.",
    unit: "XOF/km",
  },
  pickupPerMinuteXof: {
    label: "Pickup / min",
    help: "Complément pickup proportionnel au temps d'approche.",
    unit: "XOF/min",
  },
  minDistanceKm: {
    label: "Distance minimale",
    help: "Borne basse (km) pour activer ce palier. Vide = pas de borne.",
    unit: "km",
  },
  maxDistanceKm: {
    label: "Distance maximale",
    help: "Borne haute (km). Le dernier palier peut être illimité (vide).",
    unit: "km",
  },
  hotZoneEnabled: {
    label: "Surge zones chaudes",
    help: "Active le coefficient prix selon le heatLevel de la zone de départ (table zones).",
  },
  combineMode: {
    label: "Mode de combinaison surge",
    help: "Comment fusionner surge géographique et surge offre/demande : max (recommandé), multiply, ou l'un seul.",
  },
  heatLevel: {
    label: "Coefficient chaleur",
    help: "Multiplicateur appliqué quand la zone de départ atteint ce niveau de chaleur (0 = calme, 5 = très tendu).",
    unit: "×",
  },
  supplyDemandEnabled: {
    label: "Surge offre / demande",
    help: "Augmente le prix quand il y a plus de demandes que de chauffeurs disponibles à proximité.",
  },
  supplyRadiusKm: {
    label: "Rayon de comptage",
    help: "Zone autour du point de départ pour compter demandes et chauffeurs libres.",
    unit: "km",
  },
  pendingLookbackMin: {
    label: "Fenêtre demandes",
    help: "Demandes récentes (courses + livraisons en attente) prises en compte pour le ratio.",
    unit: "min",
  },
  ratioMax: {
    label: "Ratio max",
    help: "Seuil demandes ÷ chauffeurs : dès que le ratio est inférieur ou égal, ce palier s'applique.",
  },
  ratioMultiplier: {
    label: "Multiplicateur surge",
    help: "Coefficient prix appliqué pour ce palier de ratio.",
    unit: "×",
  },
  supplyDenseRatioThreshold: {
    label: "Seuil trafic dense",
    help: "Ratio offre/demande à partir duquel le trafic est considéré « dense ».",
  },
  supplyBlockedRatioThreshold: {
    label: "Seuil trafic bloqué",
    help: "Ratio au-delà duquel le trafic passe en « blocked » (embouteillages).",
  },
  maxDurationMultiplier: {
    label: "Plafond durée",
    help: "Limite du multiplicateur de durée (baseline urbaine + profils de pointe cumulés).",
    unit: "×",
  },
  peakTrafficLevel: {
    label: "Niveau trafic forcé",
    help: "Niveau utilisé dans trafficMultipliers (fluid, normal, dense, blocked…).",
  },
  peakDurationMult: {
    label: "Mult. durée profil",
    help: "Gonfle la durée facturée pendant ce créneau (impact direct sur le prix/min).",
    unit: "×",
  },
  peakPriceMult: {
    label: "Mult. prix profil",
    help: "Force un coefficient prix spécifique. Laisser vide pour utiliser le niveau trafic.",
    unit: "×",
  },
  hybridRoutingEnabled: {
    label: "Routage hybride",
    help: "Distance et durée réelles pour le calcul d'itinéraire (recommandé en production).",
  },
  zonePolicyEnabled: {
    label: "Détection de zone",
    help: "Active le rattachement aux zones et le palier hyper-local intra-quartier.",
  },
  sameZoneMaxDistanceKm: {
    label: "Distance max même zone",
    help: "Au-delà, un trajet n'est plus considéré comme intra-zone.",
    unit: "km",
  },
  zoneMatchRadiusKm: {
    label: "Rayon de rattachement zone",
    help: "Distance max pour associer un point GPS à une zone.",
    unit: "km",
  },
  hyperLocalDurationFallbackEnabled: {
    label: "Repli durée hyper-local",
    help: "Autorise l'hyper-local hors même zone si le trajet est très court en durée.",
  },
  hyperLocalMaxDurationMin: {
    label: "Durée max repli",
    help: "Seuil de minutes pour le repli hyper-local.",
    unit: "min",
  },
  hotZoneMatchRadiusKm: {
    label: "Rayon zones chaudes",
    help: "Rayon pour rattacher le départ à une zone chaude.",
    unit: "km",
  },
  incrementPerHeatLevel: {
    label: "Incrément par niveau",
    help: "Coefficient de repli si un niveau de chaleur n'est pas dans la map.",
    unit: "×",
  },
  useLiveDemandHeat: {
    label: "Chaleur live",
    help: "Recalcule le niveau de chaleur depuis le ratio demande/offre en temps réel.",
  },
  liveHeatMaxRatio: {
    label: "Ratio max",
    help: "Seuil ratio demande/chauffeurs pour ce palier de chaleur live.",
  },
  liveHeatLevel: {
    label: "Niveau chaleur",
    help: "Niveau de chaleur attribué si le ratio est inférieur ou égal au seuil.",
  },
  trafficPolicyEnabled: {
    label: "Logique trafic active",
    help: "Désactivé = niveau de trafic fixe (défaut).",
  },
  autoResolve: {
    label: "Résolution automatique",
    help: "Le serveur décide du trafic (ignore la valeur envoyée par l'app).",
  },
  defaultTrafficLevel: {
    label: "Niveau trafic par défaut",
    help: "Utilisé si aucun profil ou inférence ne matche.",
  },
  urbanBaselineEnabled: {
    label: "Baseline urbaine",
    help: "Gonfle la durée des trajets urbains longs.",
  },
  urbanBaselineMinDistanceKm: {
    label: "Seuil baseline urbaine",
    help: "Distance minimale pour appliquer la baseline.",
    unit: "km",
  },
  urbanBaselineDurationMultiplier: {
    label: "Mult. durée baseline",
    help: "Multiplicateur de durée pour les trajets urbains au-delà du seuil.",
    unit: "×",
  },
  inferFromSupplyDemand: {
    label: "Inférer depuis offre/demande",
    help: "Déduit dense/blocked du ratio chauffeurs disponibles.",
  },
  peakZoneCode: {
    label: "Code zone",
    help: "Code zone de départ (MAJUSCULES). Vide = toutes les zones.",
  },
  peakDays: {
    label: "Jours actifs",
    help: "0 = dimanche … 6 = samedi. Vide = tous les jours.",
  },
  holidayPolicyEnabled: {
    label: "Majoration fériés",
    help: "Applique le coefficient des jours fériés dans le contexte prix (borné par le plafond global).",
  },
  holidayApplyToDelivery: {
    label: "Inclure les livraisons",
    help: "Applique aussi la majoration aux courses de type livraison.",
  },
  holidayMaxCoefficient: {
    label: "Plafond coefficient férié",
    help: "Garde-fou anti-saisie : un coefficient en base au-delà sera ramené à ce plafond.",
    unit: "×",
  },
} as const;

export const WEEKDAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"] as const;

export const TRAFFIC_LEVEL_HELP: Record<string, string> = {
  fluid: "Circulation fluide — léger rabais sur le prix.",
  normal: "Référence neutre (×1).",
  dense: "Trafic dense — majoration modérée.",
  blocked: "Embouteillages — majoration forte.",
};

export const WEATHER_LEVEL_HELP: Record<string, string> = {
  clear: "Temps dégagé — pas de majoration.",
  rain: "Pluie — confort réduit, prix légèrement plus élevé.",
  storm: "Orage — forte majoration sécurité / disponibilité.",
  heat: "Forte chaleur — majoration modérée.",
};

export const CATEGORY_HELP: Record<string, { label: string; help: string }> = {
  ECO: {
    label: "Eco",
    help: "Catégorie de référence — prime toujours à 0.",
  },
  CONFORT: {
    label: "Confort",
    help: "Prime forfaitaire ajoutée au sous-total, puis décotée.",
  },
  "CONFORT+": {
    label: "Confort+",
    help: "Prime intermédiaire pour véhicules haut de gamme.",
  },
  PREMIUM: {
    label: "Premium",
    help: "Prime la plus élevée — véhicules premium et longues distances.",
  },
};

export const BAND_META: Record<string, { help: string }> = {
  hyper_local: {
    help: "Trajets très courts dans la même zone (≤ 4 km).",
  },
  short: {
    help: "Courses inter-quartiers jusqu'à 8 km.",
  },
  long: {
    help: "Trajets urbains longs (8–25 km).",
  },
  intercity: {
    help: "Inter-villes (> 25 km). Le surge urbain est neutralisé.",
  },
};

export const COMBINE_MODE_OPTIONS = [
  { value: "max", label: "Maximum", help: "Prend le plus fort entre zone chaude et offre/demande." },
  { value: "multiply", label: "Multiplier", help: "Multiplie les deux surges entre eux." },
  { value: "heat_only", label: "Zone seule", help: "Ignore le surge offre/demande." },
  { value: "supply_demand_only", label: "Offre/demande seule", help: "Ignore le surge géographique." },
] as const;
