/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone format (Russian)
 */
export const isValidPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 11;
};

/**
 * Check if string is not empty
 */
export const isNotEmpty = (value: string): boolean => {
  return value.trim().length > 0;
};

export type ValidationResult =
  | { valid: true }
  | { valid: false; errors: Record<string, string> };

const invalid = (errors: Record<string, string>): ValidationResult => ({
  valid: false,
  errors,
});

export const validateCategoryForm = (data: { name: string; description?: string }): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!isNotEmpty(data.name)) {
    errors.name = 'Введите название категории';
  }

  if (!data.description || !isNotEmpty(data.description)) {
    errors.description = 'Введите описание категории';
  }

  return Object.keys(errors).length > 0 ? invalid(errors) : { valid: true };
};

export const validateMenuItemForm = (data: {
  name: string;
  description: string;
  categoryId: string;
  price: number;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!isNotEmpty(data.name)) {
    errors.name = 'Введите название позиции';
  }

  if (!isNotEmpty(data.description)) {
    errors.description = 'Введите описание позиции';
  }

  if (!isNotEmpty(data.categoryId)) {
    errors.categoryId = 'Выберите категорию';
  }

  if (!data.price || data.price <= 0) {
    errors.price = 'Укажите цену больше 0';
  }

  return Object.keys(errors).length > 0 ? invalid(errors) : { valid: true };
};

export const validateTableForm = (data: { number: number; capacity: number }): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!data.number || data.number <= 0) {
    errors.number = 'Укажите номер столика больше 0';
  }

  if (!data.capacity || data.capacity <= 0) {
    errors.capacity = 'Укажите вместимость больше 0';
  }

  return Object.keys(errors).length > 0 ? invalid(errors) : { valid: true };
};

/**
 * Check if value is within range
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

/**
 * Check if date string is valid
 */
export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * Check if date is in the past
 */
export const isDateInPast = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

/**
 * Check if date is in the future
 */
export const isDateInFuture = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date > today;
};
