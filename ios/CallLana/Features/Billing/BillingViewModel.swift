// BillingViewModel.swift — Billing data management
// Uses BillingRepository for all data access.

import Foundation
import Observation

@Observable
final class BillingViewModel {
    // MARK: - Published State

    private(set) var subscription: Subscription?
    private(set) var transactions: [BillingTransaction] = []
    private(set) var invoices: [Invoice] = []
    private(set) var isLoading = false
    private(set) var errorMessage: String?

    // MARK: - Auto-Reload Bindings

    var autoReloadEnabled: Bool = false
    var autoReloadThresholdCents: Int = Constants.Billing.defaultAutoReloadThresholdCents
    var autoReloadAmountCents: Int = Constants.Billing.defaultAutoReloadAmountCents

    // MARK: - Hard Cap Bindings

    var hardCapEnabled: Bool = true
    var hardCapCents: Int = Constants.Billing.defaultHardCapCents

    // MARK: - Dependency

    var billingRepository: BillingRepositoryProtocol?

    // MARK: - Computed Properties

    var formattedBalance: String {
        (subscription?.balanceCents ?? 0).centsToEUR
    }

    var balanceCents: Int {
        subscription?.balanceCents ?? 0
    }

    var usedMinutes: Int {
        Int(subscription?.usedMinutes ?? 0)
    }

    var includedMinutes: Int {
        subscription?.includedMinutes ?? 0
    }

    var overageMinutes: Int {
        Int(subscription?.overageMinutes ?? 0)
    }

    var minutesPercentage: Double {
        guard includedMinutes > 0 else { return 0 }
        return min(100, Double(usedMinutes) / Double(includedMinutes) * 100)
    }

    var remainingMinutes: Int {
        max(0, includedMinutes - usedMinutes)
    }

    var monthlySpendingCents: Int {
        let planCost = subscription?.planPriceCents ?? 0
        let overageCost = overageMinutes * Constants.Billing.overageRateCents
        return planCost + overageCost
    }

    var effectiveHardCapCents: Int {
        subscription?.hardCapCents ?? Constants.Billing.defaultHardCapCents
    }

    var spendingPercentage: Double {
        guard effectiveHardCapCents > 0 else { return 0 }
        return min(100, Double(monthlySpendingCents) / Double(effectiveHardCapCents) * 100)
    }

    var formattedMonthlySpending: String {
        monthlySpendingCents.centsToEUR
    }

    var formattedHardCap: String {
        effectiveHardCapCents.centsToEUR
    }

    // MARK: - Actions

    @MainActor
    func loadBilling() async {
        guard let repository = billingRepository else { return }

        isLoading = true
        errorMessage = nil

        do {
            async let sub = repository.getSubscription()
            async let txs = repository.getTransactions(limit: Constants.Pagination.transactionsPageSize)
            async let invs = repository.getInvoices()

            let (loadedSub, loadedTxs, loadedInvs) = try await (sub, txs, invs)

            subscription = loadedSub
            transactions = loadedTxs
            invoices = loadedInvs

            // Sync toggle states from subscription
            autoReloadEnabled = loadedSub.autoReloadEnabled ?? false
            autoReloadThresholdCents = loadedSub.autoReloadThresholdCents ?? Constants.Billing.defaultAutoReloadThresholdCents
            autoReloadAmountCents = loadedSub.autoReloadAmountCents ?? Constants.Billing.defaultAutoReloadAmountCents
            hardCapEnabled = loadedSub.hardCapEnabled ?? true
            hardCapCents = loadedSub.hardCapCents ?? Constants.Billing.defaultHardCapCents
        } catch {
            errorMessage = "Abrechnungsdaten konnten nicht geladen werden."
        }

        isLoading = false
    }

    @MainActor
    func topUp(amountCents: Int) async {
        guard let repository = billingRepository else { return }

        do {
            try await repository.topUp(amountCents: amountCents)
            await loadBilling()
        } catch {
            errorMessage = "Aufladung fehlgeschlagen. Bitte erneut versuchen."
        }
    }

    @MainActor
    func updateAutoReload(enabled: Bool, threshold: Int, amount: Int) async {
        guard let repository = billingRepository else { return }

        do {
            try await repository.updateAutoReload(
                enabled: enabled,
                threshold: threshold,
                amount: amount
            )
            autoReloadEnabled = enabled
            autoReloadThresholdCents = threshold
            autoReloadAmountCents = amount
        } catch {
            errorMessage = "Auto-Aufladung konnte nicht aktualisiert werden."
        }
    }

    @MainActor
    func updateHardCap(enabled: Bool, capCents: Int) async {
        guard let repository = billingRepository else { return }

        do {
            try await repository.updateHardCap(enabled: enabled, capCents: capCents)
            hardCapEnabled = enabled
            hardCapCents = capCents
            await loadBilling()
        } catch {
            errorMessage = "Ausgabenlimit konnte nicht aktualisiert werden."
        }
    }
}
