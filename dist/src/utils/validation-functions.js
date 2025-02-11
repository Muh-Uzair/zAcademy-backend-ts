"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPhoto = exports.isPhoneNumber = exports.isNumber = exports.isEmail = exports.isAlpha = void 0;
const isAlpha = (value) => {
    return /^[a-zA-Z\s\.\-\,\/\']+$/.test(value);
};
exports.isAlpha = isAlpha;
const isEmail = (value) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(value);
};
exports.isEmail = isEmail;
const isNumber = (value) => {
    return typeof value === "number" && !isNaN(value) && isFinite(value);
};
exports.isNumber = isNumber;
const isPhoneNumber = (val) => {
    return /^\d{11}$/.test(val);
};
exports.isPhoneNumber = isPhoneNumber;
const isPhoto = (val) => {
    return /^https?:\/\/.+\.(jpg|jpeg|png|gif)$/i.test(val);
};
exports.isPhoto = isPhoto;
