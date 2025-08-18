"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const options = {
    definition: {
        openapi: '3.0.3',
        info: { title: 'CKS API', version: '1.0.0' }
    },
    apis: ['src/**/*.ts', 'routes/**/*.ts']
};
const spec = (0, swagger_jsdoc_1.default)(options);
process.stdout.write(JSON.stringify(spec, null, 2));
