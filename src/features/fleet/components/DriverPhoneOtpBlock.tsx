"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/shared/ui/Button";
import {
  fetchDevOtpLastCode,
  parseDriverOtpPhone,
  sendDriverPhoneOtp,
  verifyDriverPhoneOtp,
} from "@/features/fleet/api/driverOtp.service";

const RESEND_COOLDOWN_SEC = 60;

interface DriverPhoneOtpBlockProps {
  internationalPhone: string;
  dialCode?: string;
  countryCode?: string;
  verified: boolean;
  onVerifiedChange: (verified: boolean) => void;
  disabled?: boolean;
}

export function DriverPhoneOtpBlock({
  internationalPhone,
  dialCode = "+225",
  countryCode = "CI",
  verified,
  onVerifiedChange,
  disabled = false,
}: DriverPhoneOtpBlockProps) {
  const [code, setCode] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [devHint, setDevHint] = useState<string | null>(null);

  const parts = parseDriverOtpPhone(internationalPhone, dialCode, countryCode);
  const phoneReady = Boolean(parts);
  const onVerifiedChangeRef = useRef(onVerifiedChange);
  onVerifiedChangeRef.current = onVerifiedChange;

  useEffect(() => {
    onVerifiedChangeRef.current(false);
    setCode("");
    setSendError(null);
    setVerifyError(null);
    setSent(false);
    setDevHint(null);
  }, [internationalPhone, dialCode, countryCode]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const handleSend = useCallback(async () => {
    if (!parts || sending || cooldown > 0) return;
    setSending(true);
    setSendError(null);
    setVerifyError(null);
    setDevHint(null);
    try {
      await sendDriverPhoneOtp(parts);
      setSent(true);
      setCooldown(RESEND_COOLDOWN_SEC);
      if (process.env.NODE_ENV === "development") {
        try {
          const last = await fetchDevOtpLastCode(parts.international);
          if (last) setDevHint(`Code dev (sandbox) : ${last}`);
        } catch {
          setDevHint("En dev, essayez le code 000000 (sandbox API).");
        }
      }
    } catch (error) {
      setSendError(
        error instanceof Error ? error.message : "Envoi du code impossible."
      );
    } finally {
      setSending(false);
    }
  }, [parts, sending, cooldown]);

  const handleVerify = useCallback(async () => {
    if (!parts || verifying || verified) return;
    setVerifying(true);
    setVerifyError(null);
    try {
      await verifyDriverPhoneOtp(parts, code);
      onVerifiedChange(true);
    } catch (error) {
      onVerifiedChange(false);
      setVerifyError(
        error instanceof Error ? error.message : "Code incorrect ou expiré."
      );
    } finally {
      setVerifying(false);
    }
  }, [parts, verifying, verified, code, onVerifiedChange]);

  if (!phoneReady) {
    return (
      <p className="text-xs text-muted">
        Saisissez un numéro valide (8 chiffres minimum) pour recevoir un code de
        vérification par SMS.
      </p>
    );
  }

  if (verified) {
    return (
      <div className="rounded-lg border border-teal/30 bg-teal/10 px-3 py-2 text-sm text-teal-dark">
        Numéro vérifié par OTP.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-border bg-canvas/40 p-4">
      <div>
        <p className="text-sm font-medium text-foreground">
          Vérification du téléphone
        </p>
        <p className="mt-1 text-xs text-muted">
          Un code SMS sera envoyé au numéro saisi pour confirmer qu&apos;il est
          bien accessible par le chauffeur.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          className="px-3 py-1.5 text-sm"
          disabled={disabled || sending || cooldown > 0}
          onClick={() => void handleSend()}
        >
          {sending
            ? "Envoi…"
            : sent
              ? cooldown > 0
                ? `Renvoyer (${cooldown}s)`
                : "Renvoyer le code"
              : "Envoyer le code"}
        </Button>
      </div>

      {sent && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="block flex-1">
            <span className="text-xs font-medium text-muted">Code reçu</span>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-sm tracking-widest outline-none ring-teal/30 focus:ring-2"
            />
          </label>
          <Button
            type="button"
            className="px-3 py-1.5 text-sm"
            disabled={disabled || verifying || code.length < 4}
            onClick={() => void handleVerify()}
          >
            {verifying ? "Vérification…" : "Vérifier"}
          </Button>
        </div>
      )}

      {devHint && (
        <p className="text-xs text-amber-800">{devHint}</p>
      )}
      {sendError && <p className="text-xs text-red-600">{sendError}</p>}
      {verifyError && <p className="text-xs text-red-600">{verifyError}</p>}
    </div>
  );
}
