// TopupSheetView.swift — Bottom sheet for balance top-up
// Predefined amounts + custom input, matching dashboard-billing.js logic.

import SwiftUI

struct TopupSheetView: View {
    let currentBalanceCents: Int
    let onTopUp: (Int) -> Void

    @Environment(\.dismiss) private var dismiss

    @State private var selectedAmountCents: Int = Constants.Billing.defaultTopUpCents
    @State private var customAmountText = ""
    @State private var isCustom = false
    @State private var isProcessing = false
    @State private var errorMessage: String?

    private let predefinedAmounts = [1_000, 2_500, 5_000, 10_000]

    private var effectiveAmountCents: Int {
        if isCustom, let euros = Double(customAmountText.replacingOccurrences(of: ",", with: ".")) {
            return Int(euros * 100)
        }
        return selectedAmountCents
    }

    private var isValidAmount: Bool {
        let amount = effectiveAmountCents
        return amount >= Constants.Billing.minTopUpCents
            && amount <= Constants.Billing.maxTopUpCents
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                currentBalanceHeader
                predefinedAmountsGrid
                customAmountField
                confirmButton
            }
            .padding(24)
            .navigationTitle("Guthaben aufladen")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Abbrechen") { dismiss() }
                }
            }
        }
    }

    // MARK: - Current Balance

    private var currentBalanceHeader: some View {
        HStack {
            Text("Aktuelles Guthaben:")
                .font(.subheadline)
                .foregroundStyle(.clTextSecondary)
            Spacer()
            Text(currentBalanceCents.centsToEUR)
                .font(.subheadline)
                .fontWeight(.semibold)
        }
        .padding(12)
        .background(Color(.systemGray6))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }

    // MARK: - Predefined Amounts

    private var predefinedAmountsGrid: some View {
        LazyVGrid(columns: [
            GridItem(.flexible()),
            GridItem(.flexible())
        ], spacing: 12) {
            ForEach(predefinedAmounts, id: \.self) { amount in
                Button {
                    selectedAmountCents = amount
                    isCustom = false
                    customAmountText = ""
                } label: {
                    Text(amount.centsToEUR)
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                        .background(
                            !isCustom && selectedAmountCents == amount
                                ? Color.clPurple
                                : Color(.systemGray6)
                        )
                        .foregroundStyle(
                            !isCustom && selectedAmountCents == amount
                                ? .white
                                : .clText
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                }
            }
        }
    }

    // MARK: - Custom Amount

    private var customAmountField: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Oder eigenen Betrag eingeben:")
                .font(.caption)
                .foregroundStyle(.clTextSecondary)

            HStack {
                TextField("Betrag in EUR", text: $customAmountText)
                    .keyboardType(.decimalPad)
                    .padding()
                    .background(Color(.secondarySystemGroupedBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .onChange(of: customAmountText) { _, newValue in
                        isCustom = !newValue.isEmpty
                    }

                Text("EUR")
                    .font(.subheadline)
                    .foregroundStyle(.clTextSecondary)
            }

            if isCustom && !isValidAmount && !customAmountText.isEmpty {
                Text("Min. 5,00 EUR / Max. 1.000,00 EUR")
                    .font(.caption2)
                    .foregroundStyle(.red)
            }
        }
    }

    // MARK: - Confirm Button

    private var confirmButton: some View {
        Button {
            guard isValidAmount else {
                errorMessage = "Betrag muss zwischen 5,00 EUR und 1.000,00 EUR liegen."
                return
            }
            isProcessing = true
            onTopUp(effectiveAmountCents)
            dismiss()
        } label: {
            Group {
                if isProcessing {
                    ProgressView()
                        .tint(.white)
                } else {
                    Text("\(effectiveAmountCents.centsToEUR) aufladen")
                        .fontWeight(.semibold)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 50)
        }
        .buttonStyle(.borderedProminent)
        .tint(.clPurple)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .disabled(!isValidAmount || isProcessing)
    }
}

#Preview {
    TopupSheetView(
        currentBalanceCents: 12_500,
        onTopUp: { _ in }
    )
}
