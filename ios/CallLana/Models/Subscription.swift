// Subscription model matching the subscriptions table (013_billing.sql)

import Foundation

struct Subscription: Codable, Identifiable, Sendable {
    let id: UUID
    let userId: UUID
    var plan: String?
    var includedMinutes: Int?
    var usedMinutes: Double?
    var overageMinutes: Double?
    var planPriceCents: Int?
    var balanceCents: Int?
    var autoReloadEnabled: Bool?
    var autoReloadThresholdCents: Int?
    var autoReloadAmountCents: Int?
    var hardCapEnabled: Bool?
    var hardCapCents: Int?
    var serviceActive: Bool?
    var pausedReason: String?
    var stripeCustomerId: String?
    var stripeSubscriptionId: String?
    var currentPeriodStart: Date?
    var currentPeriodEnd: Date?
    let createdAt: Date?
    var updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id, plan
        case userId = "user_id"
        case includedMinutes = "included_minutes"
        case usedMinutes = "used_minutes"
        case overageMinutes = "overage_minutes"
        case planPriceCents = "plan_price_cents"
        case balanceCents = "balance_cents"
        case autoReloadEnabled = "auto_reload_enabled"
        case autoReloadThresholdCents = "auto_reload_threshold_cents"
        case autoReloadAmountCents = "auto_reload_amount_cents"
        case hardCapEnabled = "hard_cap_enabled"
        case hardCapCents = "hard_cap_cents"
        case serviceActive = "service_active"
        case pausedReason = "paused_reason"
        case stripeCustomerId = "stripe_customer_id"
        case stripeSubscriptionId = "stripe_subscription_id"
        case currentPeriodStart = "current_period_start"
        case currentPeriodEnd = "current_period_end"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Computed Properties

extension Subscription {
    /// Verbleibende Inklusivminuten
    var remainingMinutes: Int {
        let included = includedMinutes ?? 0
        let used = Int(usedMinutes ?? 0)
        return max(0, included - used)
    }

    /// Nutzung in Prozent
    var usagePercent: Int {
        let included = includedMinutes ?? 0
        guard included > 0 else { return 0 }
        let used = Int(usedMinutes ?? 0)
        return min(100, (used * 100) / included)
    }

    /// Monatliche Gesamtausgaben in Cents
    var monthlySpendingCents: Int {
        let planCost = planPriceCents ?? 0
        let overageCost = Int(overageMinutes ?? 0) * Constants.Billing.overageRateCents
        return planCost + overageCost
    }
}
