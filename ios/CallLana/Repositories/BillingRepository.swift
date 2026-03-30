// BillingRepository.swift — Billing data access layer
// Provides subscription management, top-up, auto-reload, hard cap,
// transactions and invoices from "subscriptions", "billing_transactions",
// and "invoices" tables. References dashboard-billing.js closely.

import Foundation
import Supabase

// MARK: - Models

struct Subscription: Codable, Sendable {
    let id: UUID
    let userId: UUID
    let plan: String?
    let planPriceCents: Int?
    let balanceCents: Int?
    let includedMinutes: Int?
    let usedMinutes: Double?
    let overageMinutes: Double?
    let autoReloadEnabled: Bool?
    let autoReloadThresholdCents: Int?
    let autoReloadAmountCents: Int?
    let hardCapEnabled: Bool?
    let hardCapCents: Int?
    let createdAt: Date
    let updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case plan
        case planPriceCents = "plan_price_cents"
        case balanceCents = "balance_cents"
        case includedMinutes = "included_minutes"
        case usedMinutes = "used_minutes"
        case overageMinutes = "overage_minutes"
        case autoReloadEnabled = "auto_reload_enabled"
        case autoReloadThresholdCents = "auto_reload_threshold_cents"
        case autoReloadAmountCents = "auto_reload_amount_cents"
        case hardCapEnabled = "hard_cap_enabled"
        case hardCapCents = "hard_cap_cents"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

struct BillingTransaction: Codable, Identifiable, Sendable {
    let id: UUID
    let userId: UUID
    let type: String
    let amountCents: Int
    let balanceAfterCents: Int?
    let description: String?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case type
        case amountCents = "amount_cents"
        case balanceAfterCents = "balance_after_cents"
        case description
        case createdAt = "created_at"
    }
}

struct Invoice: Codable, Identifiable, Sendable {
    let id: UUID
    let userId: UUID
    let invoiceNumber: String?
    let amountCents: Int
    let status: String?
    let pdfUrl: String?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case invoiceNumber = "invoice_number"
        case amountCents = "amount_cents"
        case status
        case pdfUrl = "pdf_url"
        case createdAt = "created_at"
    }
}

// MARK: - Top-up validation constants

private enum TopUpLimits {
    static let minCents = 500       // 5.00 EUR
    static let maxCents = 100_000   // 1,000.00 EUR
}

// MARK: - Protocol

protocol BillingRepositoryProtocol: Sendable {
    func getSubscription() async throws -> Subscription
    func topUp(amountCents: Int) async throws
    func updateAutoReload(enabled: Bool, threshold: Int, amount: Int) async throws
    func updateHardCap(enabled: Bool, capCents: Int) async throws
    func getTransactions(limit: Int) async throws -> [BillingTransaction]
    func getInvoices() async throws -> [Invoice]
    func changePlan(to planId: String) async throws
    func cancelSubscription(reason: String?) async throws
}

// MARK: - Implementation

final class BillingRepository: BillingRepositoryProtocol {
    private let client: SupabaseClient

    init(client: SupabaseClient) {
        self.client = client
    }

    func getSubscription() async throws -> Subscription {
        let userId = try await currentUserId()

        let subscription: Subscription = try await client
            .from("subscriptions")
            .select()
            .eq("user_id", value: userId)
            .single()
            .execute()
            .value

        return subscription
    }

    /// Atomically top up the user's balance via PostgreSQL RPC function.
    /// Mirrors `confirmTopup()` in dashboard-billing.js.
    func topUp(amountCents: Int) async throws {
        guard amountCents >= TopUpLimits.minCents else {
            throw RepositoryError.validationFailed("Minimum top-up amount is \(TopUpLimits.minCents) cents")
        }
        guard amountCents <= TopUpLimits.maxCents else {
            throw RepositoryError.validationFailed("Maximum top-up amount is \(TopUpLimits.maxCents) cents")
        }

        let userId = try await currentUserId()

        try await client.rpc(
            "atomic_balance_topup",
            params: [
                "p_user_id": AnyJSON.string(userId.uuidString),
                "p_amount_cents": AnyJSON.integer(amountCents)
            ]
        ).execute()
    }

    /// Update auto-reload settings on the subscription.
    /// Mirrors `saveAutoReloadSettings()` in dashboard-billing.js.
    func updateAutoReload(enabled: Bool, threshold: Int, amount: Int) async throws {
        let userId = try await currentUserId()

        let updates: [String: AnyJSON] = [
            "auto_reload_enabled": .bool(enabled),
            "auto_reload_threshold_cents": .integer(threshold),
            "auto_reload_amount_cents": .integer(amount)
        ]

        try await client
            .from("subscriptions")
            .update(updates)
            .eq("user_id", value: userId)
            .execute()
    }

    /// Update hard cap settings on the subscription.
    /// Mirrors `saveHardCapSettings()` in dashboard-billing.js.
    func updateHardCap(enabled: Bool, capCents: Int) async throws {
        let userId = try await currentUserId()

        let updates: [String: AnyJSON] = [
            "hard_cap_enabled": .bool(enabled),
            "hard_cap_cents": .integer(capCents)
        ]

        try await client
            .from("subscriptions")
            .update(updates)
            .eq("user_id", value: userId)
            .execute()
    }

    /// Fetch recent billing transactions.
    /// Mirrors `loadTransactions()` in dashboard-billing.js.
    func getTransactions(limit: Int = 20) async throws -> [BillingTransaction] {
        let userId = try await currentUserId()

        let transactions: [BillingTransaction] = try await client
            .from("billing_transactions")
            .select()
            .eq("user_id", value: userId)
            .order("created_at", ascending: false)
            .limit(limit)
            .execute()
            .value

        return transactions
    }

    func getInvoices() async throws -> [Invoice] {
        let userId = try await currentUserId()

        let invoices: [Invoice] = try await client
            .from("invoices")
            .select()
            .eq("user_id", value: userId)
            .order("created_at", ascending: false)
            .execute()
            .value

        return invoices
    }

    /// Change the subscription plan.
    /// Updates plan, price, and included minutes on the subscription.
    func changePlan(to planId: String) async throws {
        let userId = try await currentUserId()

        let planDetails: (priceCents: Int, minutes: Int) = switch planId {
        case "starter": (14_900, 150)
        case "professional": (29_900, 400)
        case "business": (59_900, 1000)
        default: throw RepositoryError.validationFailed("Unknown plan: \(planId)")
        }

        let updates: [String: AnyJSON] = [
            "plan": .string(planId),
            "plan_price_cents": .integer(planDetails.priceCents),
            "included_minutes": .integer(planDetails.minutes)
        ]

        try await client
            .from("subscriptions")
            .update(updates)
            .eq("user_id", value: userId)
            .execute()
    }

    /// Cancel the subscription by setting status to cancelled.
    func cancelSubscription(reason: String? = nil) async throws {
        let userId = try await currentUserId()

        var updates: [String: AnyJSON] = [
            "status": .string("cancelled"),
            "cancelled_at": .string(ISO8601DateFormatter().string(from: Date.now))
        ]

        if let reason {
            updates["cancellation_reason"] = .string(reason)
        }

        try await client
            .from("subscriptions")
            .update(updates)
            .eq("user_id", value: userId)
            .execute()
    }

    // MARK: - Private

    private func currentUserId() async throws -> UUID {
        let user = try await client.auth.session.user
        guard let userId = UUID(uuidString: user.id.uuidString) else {
            throw RepositoryError.notAuthenticated
        }
        return userId
    }
}
