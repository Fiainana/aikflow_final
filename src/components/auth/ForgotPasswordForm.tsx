"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authForgotPassword, authResetPassword } from "@/api-client";
import { configureApiClient } from "@/lib/api";
import { apiErrorMessage } from "@/lib/errors";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";

export default function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token")?.trim() ?? "";

  const [step, setStep] = useState<"request" | "reset" | "done">(
    tokenFromUrl ? "reset" : "request"
  );

  // Étape 1 — demande
  const [email, setEmail] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [requestMsg, setRequestMsg] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);

  // Étape 2 — nouveau mot de passe
  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordHint = useMemo(() => {
    if (password.length > 0 && password.length < 8) {
      return "Au moins 8 caractères.";
    }
    if (confirm && password !== confirm) {
      return "Les mots de passe ne correspondent pas.";
    }
    return null;
  }, [password, confirm]);

  const handleRequest = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setRequestMsg(null);
    setDevToken(null);
    if (!email.trim()) {
      setError("Email requis.");
      return;
    }
    setRequesting(true);
    configureApiClient();
    const { data, error: err } = await authForgotPassword({
      body: { email: email.trim() },
    });
    setRequesting(false);
    if (err || !data) {
      setError(
        apiErrorMessage(
          err,
          "Impossible d'envoyer la demande. Vérifiez l'email."
        )
      );
      return;
    }
    setRequestMsg(
      data.message ||
        "Si un compte existe pour cet email, un lien de réinitialisation a été envoyé."
    );
    // Dev / staging : le backend peut renvoyer le token en clair
    if (data.reset_token) {
      setDevToken(data.reset_token);
      setToken(data.reset_token);
    }
  };

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token.trim()) {
      setError("Token de réinitialisation manquant.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setResetting(true);
    configureApiClient();
    const { data, error: err } = await authResetPassword({
      body: {
        token: token.trim(),
        new_password: password,
      },
    });
    setResetting(false);
    if (err || !data) {
      setError(
        apiErrorMessage(
          err,
          "Réinitialisation impossible. Le lien a peut-être expiré."
        )
      );
      return;
    }
    setStep("done");
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="w-full max-w-md mx-auto sm:pt-10 mb-5">
        <Link
          href="/signin"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-brand-600 dark:text-gray-400"
        >
          ← Retour à la connexion
        </Link>
      </div>

      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        {step === "done" ? (
          <div className="space-y-4">
            <h1 className="font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Mot de passe mis à jour
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Vous pouvez maintenant vous connecter avec votre nouveau mot de
              passe.
            </p>
            <Button
              size="sm"
              type="button"
              className="w-full"
              onClick={() => router.push("/signin")}
            >
              Se connecter
            </Button>
          </div>
        ) : step === "reset" ? (
          <div>
            <div className="mb-5 sm:mb-8">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                Nouveau mot de passe
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Choisissez un mot de passe sécurisé (8 caractères minimum).
              </p>
            </div>
            <form onSubmit={handleReset} className="space-y-6">
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/20 dark:text-error-400"
                >
                  {error}
                </div>
              )}
              {!tokenFromUrl && (
                <div>
                  <Label>Token de réinitialisation</Label>
                  <Input
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Coller le token reçu"
                    disabled={resetting}
                  />
                </div>
              )}
              <div>
                <Label>
                  Nouveau mot de passe <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={resetting}
                    placeholder="••••••••"
                  />
                  <span
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                  >
                    {showPassword ? (
                      <EyeIcon
                        {...({
                          className: "fill-gray-500 dark:fill-gray-400",
                        } as React.SVGProps<SVGSVGElement>)}
                      />
                    ) : (
                      <EyeCloseIcon
                        {...({
                          className: "fill-gray-500 dark:fill-gray-400",
                        } as React.SVGProps<SVGSVGElement>)}
                      />
                    )}
                  </span>
                </div>
              </div>
              <div>
                <Label>
                  Confirmer <span className="text-error-500">*</span>
                </Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={resetting}
                  placeholder="••••••••"
                />
                {passwordHint && (
                  <p className="mt-1.5 text-xs text-error-600">{passwordHint}</p>
                )}
              </div>
              <Button
                type="submit"
                size="sm"
                className="w-full"
                disabled={resetting || !!passwordHint || !password}
              >
                {resetting ? "Enregistrement…" : "Réinitialiser le mot de passe"}
              </Button>
              <button
                type="button"
                className="w-full text-center text-sm text-gray-500 hover:text-brand-600"
                onClick={() => {
                  setStep("request");
                  setError(null);
                }}
              >
                Demander un nouveau lien
              </button>
            </form>
          </div>
        ) : (
          <div>
            <div className="mb-5 sm:mb-8">
              <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
                Mot de passe oublié
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Indiquez l'email de votre compte. Si un compte existe, vous
                recevrez un lien de réinitialisation.
              </p>
            </div>
            <form onSubmit={handleRequest} className="space-y-6">
              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/20 dark:text-error-400"
                >
                  {error}
                </div>
              )}
              {requestMsg && (
                <div
                  role="status"
                  className="rounded-lg border border-brand-200 bg-brand-25 px-4 py-3 text-sm text-brand-800 dark:border-brand-800 dark:bg-brand-500/10 dark:text-brand-300"
                >
                  {requestMsg}
                </div>
              )}
              {devToken && (
                <div className="rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-900 dark:border-warning-800 dark:bg-warning-500/10 dark:text-warning-200">
                  <p className="font-medium">Mode développement</p>
                  <p className="mt-1 text-xs break-all">
                    Token : <code className="font-mono">{devToken}</code>
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-3"
                    onClick={() => setStep("reset")}
                  >
                    Continuer avec ce token
                  </Button>
                </div>
              )}
              <div>
                <Label>
                  Email <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="coach@club.fr"
                  disabled={requesting}
                />
              </div>
              <Button
                type="submit"
                size="sm"
                className="w-full"
                disabled={requesting}
              >
                {requesting ? "Envoi…" : "Envoyer le lien"}
              </Button>
              {requestMsg && !devToken && (
                <button
                  type="button"
                  className="w-full text-center text-sm text-brand-600 hover:underline"
                  onClick={() => setStep("reset")}
                >
                  J'ai déjà un token / lien
                </button>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
