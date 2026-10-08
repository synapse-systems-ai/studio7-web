"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

function useDebouncedField({ value, onChange, delay }) {
  const [local, setLocal] = useState(value ?? "");
  const timer = useRef(null);
  const localRef = useRef(local);
  const lastEmittedRef = useRef(value ?? "");
  const focusedRef = useRef(false);

  localRef.current = local;

  useEffect(() => {
    const next = value ?? "";
    if (next === lastEmittedRef.current) return;
    lastEmittedRef.current = next;
    if (!focusedRef.current) {
      setLocal(next);
      localRef.current = next;
    }
  }, [value]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const scheduleEmit = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const latest = localRef.current;
      lastEmittedRef.current = latest;
      onChange(latest);
    }, delay);
  };

  const handleChange = (next) => {
    setLocal(next);
    localRef.current = next;
    scheduleEmit();
  };

  const handleFocus = (e) => {
    focusedRef.current = true;
    return e;
  };

  const handleBlur = (e, userOnBlur) => {
    focusedRef.current = false;
    clearTimeout(timer.current);
    const latest = e.target.value;
    setLocal(latest);
    localRef.current = latest;
    lastEmittedRef.current = latest;
    onChange(latest);
    userOnBlur?.(e);
  };

  return { local, handleChange, handleFocus, handleBlur };
}

/**
 * Input that shows keystrokes immediately but debounces onChange for parents.
 * Parent value is only synced back when it changes externally (not from our emit).
 */
export const DebouncedInput = forwardRef(function DebouncedInput(
  { value, onChange, delay = 300, onBlur, onFocus, type, ...props },
  ref,
) {
  const instantTypes = new Set(["time", "date", "datetime-local", "month", "week"]);
  const debounced = useDebouncedField({
    value,
    onChange,
    delay,
  });

  if (instantTypes.has(type)) {
    return (
      <Input
        ref={ref}
        type={type}
        {...props}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onFocus={onFocus}
      />
    );
  }

  const { local, handleChange, handleFocus, handleBlur } = debounced;

  return (
    <Input
      ref={ref}
      {...props}
      value={local}
      onChange={(e) => handleChange(e.target.value)}
      onFocus={(e) => {
        handleFocus(e);
        onFocus?.(e);
      }}
      onBlur={(e) => handleBlur(e, onBlur)}
    />
  );
});

/** Textarea variant - same debounce behaviour as DebouncedInput. */
export function DebouncedTextarea({ value, onChange, delay = 300, onBlur, onFocus, ...props }) {
  const { local, handleChange, handleFocus, handleBlur } = useDebouncedField({
    value,
    onChange,
    delay,
  });

  return (
    <Textarea
      {...props}
      value={local}
      onChange={(e) => handleChange(e.target.value)}
      onFocus={(e) => {
        handleFocus(e);
        onFocus?.(e);
      }}
      onBlur={(e) => handleBlur(e, onBlur)}
    />
  );
}
