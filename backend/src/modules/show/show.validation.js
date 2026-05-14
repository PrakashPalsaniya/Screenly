"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BulkShowSchema = exports.ShowSchema = void 0;
const zod_1 = require("zod");
const priceMapSchema = zod_1.z.object({
    PREMIUM: zod_1.z.coerce.number().min(1),
    EXECUTIVE: zod_1.z.coerce.number().min(1),
    NORMAL: zod_1.z.coerce.number().min(1),
});
const showSlotSchema = zod_1.z.object({
    startTime: zod_1.z.string().min(1, "Start time is required"),
    format: zod_1.z.enum(["2D", "3D", "IMAX", "PVR PXL"]),
    audioType: zod_1.z.string().min(1, "Audio type is required").default("Dolby 7.1"),
    priceMap: priceMapSchema,
});
exports.ShowSchema = zod_1.z.object({
    movie: zod_1.z.string().min(1, "Movie is required"),
    theater: zod_1.z.string().min(1, "Theater is required"),
    screen: zod_1.z.string().min(1, "Screen is required"),
    date: zod_1.z.string().regex(/^\d{2}-\d{2}-\d{4}$/, "Date must be DD-MM-YYYY"),
    ...showSlotSchema.shape,
});
exports.BulkShowSchema = zod_1.z.object({
    movies: zod_1.z.array(zod_1.z.string().min(1)).min(1, "Select at least one movie"),
    theater: zod_1.z.string().min(1, "Theater is required"),
    screen: zod_1.z.string().min(1, "Screen is required"),
    dates: zod_1.z.array(zod_1.z.string().regex(/^\d{2}-\d{2}-\d{4}$/, "Date must be DD-MM-YYYY")).min(1, "Select at least one date"),
    slots: zod_1.z.array(showSlotSchema).min(1, "Add at least one show time"),
});
