import z from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .min(3, "L'identifiant doit contenir au moins 3 caractères"),
  password: z.string().min(1, "Mot de passe requis"),
});
