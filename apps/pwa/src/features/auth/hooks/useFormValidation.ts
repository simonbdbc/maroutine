import { useState, useCallback } from "react";

// ─── Règles de validation ─────────────────────────────────────────────────────
export function validateEmail(value: string): string | null {
  if (!value.trim()) return "L'email est requis.";
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(value.trim())) return "Format d'email invalide.";
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return "Le mot de passe est requis.";
  if (value.length < 8) return "Le mot de passe doit faire au moins 8 caractères.";
  return null;
}

export function validateDisplayName(value: string): string | null {
  if (!value.trim()) return "Le prénom est requis.";
  if (value.trim().length < 2) return "Le prénom doit faire au moins 2 caractères.";
  return null;
}

// ─── Hook générique de gestion de champ ──────────────────────────────────────
export function useField(
  initialValue = "",
  validator?: (v: string) => string | null
) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const onChange = useCallback((text: string) => {
    setValue(text);
    if (touched && validator) {
      setError(validator(text));
    }
  }, [touched, validator]);

  const onBlur = useCallback(() => {
    setTouched(true);
    if (validator) setError(validator(value));
  }, [value, validator]);

  const reset = useCallback(() => {
    setValue(initialValue);
    setError(null);
    setTouched(false);
  }, [initialValue]);

  return { value, error, touched, onChange, onBlur, reset };
}
