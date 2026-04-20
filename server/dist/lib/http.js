"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCookies = parseCookies;
function parseCookies(cookieHeader) {
    if (!cookieHeader) {
        return {};
    }
    return cookieHeader.split(';').reduce((accumulator, pair) => {
        const [rawName, ...rawValue] = pair.trim().split('=');
        if (!rawName) {
            return accumulator;
        }
        accumulator[rawName] = decodeURIComponent(rawValue.join('='));
        return accumulator;
    }, {});
}
