// PlanChangeView.swift — Plan selection and change UI
// Shows 3 plan cards with current plan highlighted, allows switching.

import SwiftUI

struct PlanChangeView: View {
    @State private var viewModel: PlanChangeViewModel
    @Environment(\.dismiss) private var dismiss

    init(currentPlan: String, billingRepository: BillingRepositoryProtocol?) {
        _viewModel = State(
            initialValue: PlanChangeViewModel(
                currentPlan: currentPlan,
                billingRepository: billingRepository
            )
        )
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                headerText
                ForEach(viewModel.plans) { plan in
                    planCard(plan)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Tarif aendern")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Tarif wechseln", isPresented: $viewModel.showConfirmation) {
            Button("Abbrechen", role: .cancel) {}
            Button("Wechseln") {
                Task { await viewModel.confirmChange() }
            }
        } message: {
            if let target = viewModel.pendingPlan {
                Text("Moechtest du zum Tarif \(target.name) (\(target.priceCents.centsToEUR)/Monat) wechseln?")
            }
        }
        .alert("Fehler", isPresented: .init(
            get: { viewModel.errorMessage != nil },
            set: { if !$0 { viewModel.errorMessage = nil } }
        )) {
            Button("OK") { viewModel.errorMessage = nil }
        } message: {
            Text(viewModel.errorMessage ?? "")
        }
        .alert("Tarif gewechselt", isPresented: $viewModel.showSuccess) {
            Button("OK") { dismiss() }
        } message: {
            Text("Dein Tarif wurde erfolgreich geaendert.")
        }
    }

    // MARK: - Header

    private var headerText: some View {
        Text("Waehle den passenden Tarif fuer dein Unternehmen.")
            .font(.subheadline)
            .foregroundStyle(Color.clTextSecondary)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.top, 8)
    }

    // MARK: - Plan Card

    private func planCard(_ plan: PlanOption) -> some View {
        let isCurrent = plan.id == viewModel.currentPlan

        return VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(plan.name)
                    .font(.title3)
                    .fontWeight(.bold)
                    .foregroundStyle(Color.clText)

                Spacer()

                if isCurrent {
                    StatusBadgeView(text: "Aktueller Tarif", style: .purple)
                }
            }

            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text(plan.priceCents.centsToEUR)
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .foregroundStyle(Color.clPurple)
                Text("/ Monat")
                    .font(.caption)
                    .foregroundStyle(Color.clTextSecondary)
            }

            Divider()

            featureRow(icon: "clock.fill", text: "\(plan.includedMinutes) Minuten inklusive")
            ForEach(plan.features, id: \.self) { feature in
                featureRow(icon: "checkmark.circle.fill", text: feature)
            }

            Button {
                viewModel.requestChange(to: plan)
            } label: {
                Text(isCurrent ? "Aktueller Tarif" : "Tarif wechseln")
                    .fontWeight(.semibold)
                    .frame(maxWidth: .infinity)
                    .frame(height: 44)
            }
            .buttonStyle(.borderedProminent)
            .tint(isCurrent ? Color.gray : Color.clPurple)
            .disabled(isCurrent || viewModel.isLoading)
        }
        .padding(16)
        .background(Color.clCard)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(isCurrent ? Color.clPurple : Color.clear, lineWidth: 2)
        )
        .shadow(color: .black.opacity(0.06), radius: 4, y: 2)
    }

    // MARK: - Feature Row

    private func featureRow(icon: String, text: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundStyle(Color.clPurple)
            Text(text)
                .font(.subheadline)
                .foregroundStyle(Color.clText)
        }
    }
}

#Preview {
    NavigationStack {
        PlanChangeView(currentPlan: "starter", billingRepository: nil)
    }
}
