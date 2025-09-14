/**
 * File: reports.schema.ts
 *
 * Description: Validates contractor report request params.
 * Function: Validate report generation parameters for contractor role
 * Importance: Ensures proper report parameter validation
 * Connects to: reports.ts routes, reports.service.ts.
 */
import { z } from 'zod';
export declare const ReportParametersSchema: z.ZodObject<{
    date_range: z.ZodOptional<z.ZodObject<{
        start: z.ZodString;
        end: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        start: string;
        end: string;
    }, {
        start: string;
        end: string;
    }>>;
    job_type: z.ZodOptional<z.ZodString>;
    payment_status: z.ZodOptional<z.ZodEnum<["paid", "pending", "overdue"]>>;
    rating_threshold: z.ZodOptional<z.ZodNumber>;
    format: z.ZodDefault<z.ZodEnum<["json", "csv", "pdf"]>>;
}, "strip", z.ZodTypeAny, {
    format: "json" | "csv" | "pdf";
    date_range?: {
        start: string;
        end: string;
    } | undefined;
    job_type?: string | undefined;
    payment_status?: "pending" | "paid" | "overdue" | undefined;
    rating_threshold?: number | undefined;
}, {
    date_range?: {
        start: string;
        end: string;
    } | undefined;
    job_type?: string | undefined;
    payment_status?: "pending" | "paid" | "overdue" | undefined;
    rating_threshold?: number | undefined;
    format?: "json" | "csv" | "pdf" | undefined;
}>;
export declare const ReportTypeSchema: z.ZodEnum<["job-performance", "earnings-summary", "customer-feedback"]>;
export type ReportParameters = z.infer<typeof ReportParametersSchema>;
export type ReportType = z.infer<typeof ReportTypeSchema>;
//# sourceMappingURL=reports.schema.d.ts.map