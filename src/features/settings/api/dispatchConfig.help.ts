export const DISPATCH_TAB_HELP: Record<string, { title: string; subtitle: string }> = {
  general: {
    title: "Paramètres de base",
    subtitle: "Preset, rayon initial, candidats et délai d'acceptation chauffeur.",
  },
  waves: {
    title: "Vagues & chaînage",
    subtitle: "Élargissement progressif du rayon et offres aux chauffeurs bientôt libres.",
  },
  routing: {
    title: "Routage & score",
    subtitle: "Calcul ETA/distance et pondération des candidats éligibles.",
  },
  offers: {
    title: "Offres & attribution",
    subtitle: "Mode séquentiel ou batch, file d'attente et auto-assignation.",
  },
  fairness: {
    title: "Équité & refus",
    subtitle: "Anti-monopole horaire et pénalités après refus consécutifs.",
  },
  urgency: {
    title: "Urgence & programmé",
    subtitle: "Commandes prioritaires et courses à heure fixe.",
  },
  traffic: {
    title: "Trafic dispatch",
    subtitle: "Impact sur l'ETA et le rayon — distinct du moteur de prix.",
  },
  advanced: {
    title: "Stratégies avancées",
    subtitle: "Heatmap, repositionnement, batch matching et index géo Redis.",
  },
};

export const DISPATCH_FIELD_HELP = {
  preset: {
    label: "Preset stratégie",
    help: "Paquet cohérent : legacy (simple), pro (routier), full (production).",
  },
  maxRadiusKm: {
    label: "Rayon vague 1",
    help: "Distance initiale de recherche autour du client.",
    unit: "km",
  },
  candidateLimit: {
    label: "Candidats max",
    help: "Nombre de chauffeurs retenus après scoring.",
  },
  driverSearchLimit: {
    label: "Scan géo max",
    help: "Plafond de chauffeurs interrogés par requête.",
  },
  minDriverWalletBalanceXof: {
    label: "Solde wallet min",
    help: "0 = pas de filtre sur le wallet chauffeur.",
    unit: "XOF",
  },
  offerTtlSeconds: {
    label: "Délai d'acceptation",
    help: "Temps laissé au chauffeur pour répondre à une offre.",
    unit: "s",
  },
  radiusIncrementKm: { label: "Incrément rayon", help: "Élargissement par vague.", unit: "km" },
  maxRadiusKmCap: { label: "Plafond rayon", help: "Rayon maximum toutes vagues.", unit: "km" },
  maxWaves: { label: "Nombre de vagues", help: "Tentatives avant no_driver." },
  waveIntervalSec: { label: "Intervalle vagues", help: "Pause entre deux vagues.", unit: "s" },
  globalTimeoutSec: { label: "Timeout global", help: "Durée max du dispatch.", unit: "s" },
  tripMaxEtaMinutes: {
    label: "ETA max chaînage",
    help: "Temps restant sur la course en cours pour chaîner.",
    unit: "min",
  },
  tripMinProgress: { label: "Progression min", help: "Repli si ETA indisponible (0–1)." },
  chainRadiusBonusKm: { label: "Bonus rayon chaîne", unit: "km", help: "Rayon élargi pour chauffeurs en course." },
  emergencyEnabled: { label: "Passe urgence chaîne", help: "Assouplit les critères en dernière vague." },
  routingMode: { label: "Mode routage", help: "haversine, osrm, mapbox ou hybrid." },
  maxEtaMinutes: {
    label: "ETA max éligibilité",
    help: "0 = pas de filtre ETA chauffeur→pickup.",
    unit: "min",
  },
  scoringMode: { label: "Mode score", help: "legacy ou dynamic." },
  offerMode: { label: "Mode offre", help: "sequential (1 à 1) ou batch (lot)." },
  batchSize: { label: "Taille lot", help: "Offres simultanées en mode batch." },
  sequentialQueueSize: { label: "File séquentielle", help: "Candidats en file d'attente." },
  autoAssignEnabled: {
    label: "Auto-assignation",
    help: "Assigne directement si un candidat domine nettement.",
  },
  minScoreGap: { label: "Écart score min", help: "Écart 1er/2e pour auto-assigner." },
  trafficEnabled: {
    label: "Trafic dispatch actif",
    help: "Ajuste ETA et rayon selon zone/heure — sans impact prix.",
  },
  useZoneProfiles: { label: "Profils par zone", help: "Applique les profils horaires ci-dessous." },
  useLiveTraffic: { label: "Trafic live", help: "Utilise la durée trafic du routeur." },
  maxEtaMultiplier: { label: "Plafond ETA ×", help: "Garde-fou anti-explosion.", unit: "×" },
  zoneDays: {
    label: "Jours actifs",
    help: "0=dim … 6=sam. Vide = tous les jours. Semaine : Lun–Ven.",
  },
  zoneCode: { label: "Code zone", help: "MAJUSCULES. Vide = toutes zones." },
} as const;

export const DISPATCH_PRESET_OPTIONS = [
  { value: "legacy", label: "Legacy", help: "Simple, batch, haversine." },
  { value: "pro", label: "Pro", help: "OSRM, score dynamique, séquentiel." },
  { value: "full", label: "Full (prod)", help: "Toutes stratégies activées." },
] as const;

export const DISPATCH_ROUTING_OPTIONS = ["haversine", "osrm", "mapbox", "hybrid"] as const;
