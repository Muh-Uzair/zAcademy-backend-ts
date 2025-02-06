export const isAlpha = (value: string) => {
  return /^[a-zA-Z\s\.\-\,\/\']+$/.test(value);
};

export const isEmail = (value: string) => {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(value);
};

export const isNumber = (value: unknown): boolean => {
  return typeof value === "number" && !isNaN(value) && isFinite(value);
};

export const isPhoneNumber = (val: string) => {
  return /^\d{11}$/.test(val);
};

export const isPhoto = (val: string) => {
  return /^https?:\/\/.+\.(jpg|jpeg|png|gif)$/i.test(val);
};
