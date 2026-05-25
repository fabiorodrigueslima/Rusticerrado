import { useState, useCallback } from "react";

/**
 * Hook customizado para gerenciar formulários
 * @param {Object} initialValues - Valores iniciais do formulário
 * @param {Function} onSubmit - Função a executar ao submeter
 * @returns {Object} Objeto com dados, métodos e estado do formulário
 */
export function useForm(initialValues, onSubmit) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      setValues((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
      // Limpar erro quando usuário começa a digitar
      if (errors[name]) {
        setErrors((prev) => ({
          ...prev,
          [name]: "",
        }));
      }
    },
    [errors],
  );

  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
        await onSubmit(values);
      } catch (err) {
        console.error("Erro ao submeter formulário:", err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, onSubmit],
  );

  const setFieldValue = useCallback((name, value) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const setFieldError = useCallback((name, error) => {
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    resetForm,
    // Métodos auxiliares
    getFieldProps: (name) => ({
      name,
      value: values[name] || "",
      onChange: handleChange,
      onBlur: handleBlur,
    }),
    isValid: Object.keys(errors).length === 0,
    isDirty: JSON.stringify(values) !== JSON.stringify(initialValues),
  };
}
