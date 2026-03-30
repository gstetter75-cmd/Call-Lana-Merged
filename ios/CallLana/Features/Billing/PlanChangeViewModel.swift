// PlanChangeViewModel.swift — Plan change logic
// Manages plan options and subscription plan switching.

import Foundation
import Observation

struct PlanOption: Identifiable, Sendable {
    let id: String
    let name: String
    let priceCents: Int
    let includedMinutes: Int
    let features: [String]
}

@Observable
final class PlanChangeViewModel {
    // MARK: - State

    let currentPlan: String
    private(set) var isLoading = false
    var errorMessage: String?
    var showConfirmation = false
    var showSuccess = false
    var pendingPlan: PlanOption?

    // MARK: - Dependency

    private let billingRepository: BillingRepositoryProtocol?

    // MARK: - Plans

    let plans: [PlanOption] = [
        PlanOption(
            id: "starter",
            name: "Starter",
            priceCents: 14_900,
            includedMinutes: 150,
            features: [
                "1 KI-Assistent",
                "Anrufweiterleitung",
                "E-Mail-Benachrichtigungen"
            ]
        ),
        PlanOption(
            id: "professional",
            name: "Professional",
            priceCents: 29_900,
            includedMinutes: 400,
            features: [
                "3 KI-Assistenten",
                "Kalender-Integration",
                "CRM-Anbindung",
                "Prioritaets-Support"
            ]
        ),
        PlanOption(
            id: "business",
            name: "Business",
            priceCents: 59_900,
            includedMinutes: 1000,
            features: [
                "Unbegrenzte Assistenten",
                "Alle Integrationen",
                "Dedizierter Account Manager",
                "SLA-Garantie"
            ]
        )
    ]

    // MARK: - Init

    init(currentPlan: String, billingRepository: BillingRepositoryProtocol?) {
        self.currentPlan = currentPlan
        self.billingRepository = billingRepository
    }

    // MARK: - Actions

    func requestChange(to plan: PlanOption) {
        pendingPlan = plan
        showConfirmation = true
    }

    @MainActor
    func confirmChange() async {
        guard let plan = pendingPlan, let repository = billingRepository else { return }

        isLoading = true
        do {
            try await repository.changePlan(to: plan.id)
            showSuccess = true
        } catch {
            errorMessage = "Tarifwechsel fehlgeschlagen. Bitte erneut versuchen."
        }
        isLoading = false
        pendingPlan = nil
    }
}
