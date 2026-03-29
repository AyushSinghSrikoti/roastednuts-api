export type EmailVerificationResult =
    | "deliverable"
    | "undeliverable"
    | "risky"
    | "unknown";

export type EmailVerificationReason =
    | "invalid_email"
    | "invalid_domain"
    | "rejected_email"
    | "accepted_email"
    | "low_quality"
    | "low_deliverability"
    | "no_connect"
    | "timeout"
    | "invalid_smtp"
    | "unavailable_smtp"
    | "unexpected_error";

export interface EmailVerificationResponse {
    result: EmailVerificationResult;
    reason: EmailVerificationReason;

    role: boolean;
    free: boolean;
    disposable: boolean;
    accept_all: boolean;

    did_you_mean: string | null;
    sendex: number;

    email: string;
    user: string;
    domain: string;

    success: boolean;
    message: string | null;
}