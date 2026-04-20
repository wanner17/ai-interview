"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SESSION_COOKIE_NAME = void 0;
exports.createSessionToken = createSessionToken;
exports.verifySessionToken = verifySessionToken;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.createSessionCookie = createSessionCookie;
exports.clearSessionCookie = clearSessionCookie;
const crypto_1 = require("crypto");
const util_1 = require("util");
const scrypt = (0, util_1.promisify)(crypto_1.scrypt);
exports.SESSION_COOKIE_NAME = 'ai_interview_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
function getSessionSecret() {
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
        throw new Error('AUTH_SECRET is not configured.');
    }
    return secret;
}
function toBase64Url(input) {
    return Buffer.from(input).toString('base64url');
}
function fromBase64Url(input) {
    return Buffer.from(input, 'base64url');
}
function sign(value) {
    return (0, crypto_1.createHmac)('sha256', getSessionSecret()).update(value).digest('base64url');
}
function createSessionToken(userId) {
    const payload = {
        userId,
        exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    };
    const encodedPayload = toBase64Url(JSON.stringify(payload));
    const signature = sign(encodedPayload);
    return `${encodedPayload}.${signature}`;
}
function verifySessionToken(token) {
    if (!token) {
        return null;
    }
    const [encodedPayload, providedSignature] = token.split('.');
    if (!encodedPayload || !providedSignature) {
        return null;
    }
    const expectedSignature = sign(encodedPayload);
    const expectedBuffer = Buffer.from(expectedSignature);
    const providedBuffer = Buffer.from(providedSignature);
    if (expectedBuffer.length !== providedBuffer.length ||
        !(0, crypto_1.timingSafeEqual)(expectedBuffer, providedBuffer)) {
        return null;
    }
    try {
        const payload = JSON.parse(fromBase64Url(encodedPayload).toString('utf8'));
        if (!payload.userId || !payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
            return null;
        }
        return payload;
    }
    catch {
        return null;
    }
}
async function hashPassword(password) {
    const salt = (0, crypto_1.randomBytes)(16).toString('hex');
    const hash = (await scrypt(password, salt, 64));
    return `scrypt$${salt}$${hash.toString('hex')}`;
}
async function verifyPassword(password, passwordHash) {
    const [algorithm, salt, storedHash] = passwordHash.split('$');
    if (algorithm !== 'scrypt' || !salt || !storedHash) {
        return false;
    }
    const derived = (await scrypt(password, salt, 64));
    const stored = Buffer.from(storedHash, 'hex');
    return stored.length === derived.length && (0, crypto_1.timingSafeEqual)(stored, derived);
}
function serializeCookie(name, value, maxAge) {
    const secure = process.env.NODE_ENV === 'production';
    return [
        `${name}=${value}`,
        'Path=/',
        'HttpOnly',
        'SameSite=Lax',
        `Max-Age=${maxAge}`,
        secure ? 'Secure' : '',
    ]
        .filter(Boolean)
        .join('; ');
}
function createSessionCookie(token) {
    return serializeCookie(exports.SESSION_COOKIE_NAME, token, SESSION_TTL_SECONDS);
}
function clearSessionCookie() {
    return serializeCookie(exports.SESSION_COOKIE_NAME, '', 0);
}
