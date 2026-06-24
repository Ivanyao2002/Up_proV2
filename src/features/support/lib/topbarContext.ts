export interface TopbarContext {
  title: string;
  description: string;
}


interface ContextRule {
  match: (pathname: string) => boolean;
  context: TopbarContext;
}

const CONTEXT_RULES: ContextRule[] = [
  {
    match: (p) => /\/support\/tickets\/[^/]+$/.test(p),
    context: {
      title: "Traitement d’une réclamation",
      description: "Conversation, analyse et actions de résolution",
    },
  },
  {
    match: (p) => p.startsWith("/support/tickets"),
    context: {
      title: "File des réclamations",
      description: "Plaintes partagées entre les agents support",
    },
  },
  {
    match: (p) => /\/support\/chat\/[^/]+$/.test(p),
    context: {
      title: "Conversation support",
      description: "Échange en temps réel avec une franchise",
    },
  },
  {
    match: (p) => p.startsWith("/support/chat"),
    context: {
      title: "Chat support",
      description: "Conversations et messages non lus",
    },
  },
  {
    match: (p) => p.startsWith("/support/anomalies"),
    context: {
      title: "Historique des réclamations",
      description: "Traçabilité des actions réalisées par les agents",
    },
  },
];

export const DEFAULT_SUPPORT_CONTEXT: TopbarContext = {
  title: "Centre de support",
  description: "Vue d’ensemble de l’activité",
};

export function getSupportPageContext(pathname: string): TopbarContext {
  return CONTEXT_RULES.find((rule) => rule.match(pathname))?.context ?? DEFAULT_SUPPORT_CONTEXT;
}

// Initiales (2 lettres max) à partir d'un nom — fallback si nom absent.
export function getInitials(name?: string, fallback = "Agent Support"): string {
  return (name ?? fallback)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
