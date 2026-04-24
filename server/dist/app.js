"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const auth_route_1 = require("./routes/auth.route");
const attendance_route_1 = require("./routes/attendance.route");
const billing_route_1 = require("./routes/billing.route");
const app = (0, express_1.default)();
exports.app = app;
app.use(express_1.default.json());
app.use('/auth', auth_route_1.authRouter);
app.use('/attendance', attendance_route_1.attendanceRouter);
app.use('/billing', billing_route_1.billingRouter);
