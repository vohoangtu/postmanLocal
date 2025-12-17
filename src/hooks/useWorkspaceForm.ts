/**
 * useWorkspaceForm Hook
 * Generic hook để quản lý form state và validation
 */

import { useState, useCallback, useMemo } from 'react';

export interface FormField<T> {
  value: T;
  error?: string;
  touched?: boolean;
}

export interface FormState<T extends Record<string, unknown>> {
  fields: { [K in keyof T]: FormField<T[K]> };
  isValid: boolean;
  isDirty: boolean;
  touched: boolean;
}

export interface UseFormOptions<T extends Record<string, unknown>> {
  initialValues: T;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  onSubmit?: (values: T) => void | Promise<void>;
}

export interface UseFormResult<T extends Record<string, unknown>> {
  fields: { [K in keyof T]: FormField<T[K]> };
  values: T;
  errors: Partial<Record<keyof T, string>>;
  isValid: boolean;
  isDirty: boolean;
  touched: boolean;
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setError: <K extends keyof T>(field: K, error: string | undefined) => void;
  setValues: (values: Partial<T>) => void;
  reset: () => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  handleChange: <K extends keyof T>(field: K) => (value: T[K]) => void;
  handleBlur: <K extends keyof T>(field: K) => () => void;
}

/**
 * Hook để quản lý form state
 */
export function useWorkspaceForm<T extends Record<string, unknown>>(
  options: UseFormOptions<T>
): UseFormResult<T> {
  const { initialValues, validate, onSubmit } = options;

  const [fields, setFields] = useState<{ [K in keyof T]: FormField<T[K]> }>(() => {
    const initialFields = {} as { [K in keyof T]: FormField<T[K]> };
    Object.keys(initialValues).forEach((key) => {
      initialFields[key as keyof T] = {
        value: initialValues[key],
        error: undefined,
        touched: false,
      };
    });
    return initialFields;
  });

  // Tính toán values từ fields
  const values = useMemo(() => {
    const result = {} as T;
    Object.keys(fields).forEach((key) => {
      result[key as keyof T] = fields[key as keyof T].value;
    });
    return result;
  }, [fields]);

  // Tính toán errors
  const errors = useMemo(() => {
    const result: Partial<Record<keyof T, string>> = {};
    Object.keys(fields).forEach((key) => {
      const field = fields[key as keyof T];
      if (field.error) {
        result[key as keyof T] = field.error;
      }
    });
    return result;
  }, [fields]);

  // Validation
  const validationErrors = useMemo(() => {
    if (!validate) return {};
    return validate(values);
  }, [values, validate]);

  // Apply validation errors to fields
  const isValid = useMemo(() => {
    return Object.keys(validationErrors).length === 0 && Object.keys(errors).length === 0;
  }, [validationErrors, errors]);

  const isDirty = useMemo(() => {
    return Object.keys(fields).some((key) => {
      const field = fields[key as keyof T];
      return field.value !== initialValues[key as keyof T];
    });
  }, [fields, initialValues]);

  const touched = useMemo(() => {
    return Object.keys(fields).some((key) => {
      return fields[key as keyof T].touched === true;
    });
  }, [fields]);

  // Set value cho một field
  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFields((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        value,
        error: validationErrors[field],
      },
    }));
  }, [validationErrors]);

  // Set error cho một field
  const setError = useCallback(<K extends keyof T>(field: K, error: string | undefined) => {
    setFields((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        error,
      },
    }));
  }, []);

  // Set nhiều values cùng lúc
  const setValues = useCallback((newValues: Partial<T>) => {
    setFields((prev) => {
      const updated = { ...prev };
      Object.keys(newValues).forEach((key) => {
        updated[key as keyof T] = {
          ...prev[key as keyof T],
          value: newValues[key as keyof T] as T[keyof T],
          error: validationErrors[key as keyof T],
        };
      });
      return updated;
    });
  }, [validationErrors]);

  // Reset form về initial values
  const reset = useCallback(() => {
    const resetFields = {} as { [K in keyof T]: FormField<T[K]> };
    Object.keys(initialValues).forEach((key) => {
      resetFields[key as keyof T] = {
        value: initialValues[key],
        error: undefined,
        touched: false,
      };
    });
    setFields(resetFields);
  }, [initialValues]);

  // Handle submit
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();

      // Mark all fields as touched
      setFields((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((key) => {
          updated[key as keyof T] = {
            ...updated[key],
            touched: true,
            error: validationErrors[key as keyof T],
          };
        });
        return updated;
      });

      // Check validation
      if (!isValid) {
        return;
      }

      // Call onSubmit nếu có
      if (onSubmit) {
        await onSubmit(values);
      }
    },
    [isValid, values, onSubmit, validationErrors]
  );

  // Handle change cho một field
  const handleChange = useCallback(
    <K extends keyof T>(field: K) => (value: T[K]) => {
      setValue(field, value);
    },
    [setValue]
  );

  // Handle blur cho một field
  const handleBlur = useCallback(
    <K extends keyof T>(field: K) => () => {
      setFields((prev) => ({
        ...prev,
        [field]: {
          ...prev[field],
          touched: true,
          error: validationErrors[field],
        },
      }));
    },
    [validationErrors]
  );

  return {
    fields,
    values,
    errors,
    isValid,
    isDirty,
    touched,
    setValue,
    setError,
    setValues,
    reset,
    handleSubmit,
    handleChange,
    handleBlur,
  };
}

export default useWorkspaceForm;
