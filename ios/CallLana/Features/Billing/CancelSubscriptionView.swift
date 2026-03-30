// CancelSubscriptionView.swift — Subscription cancellation UI
// Warning message, consequence list, optional reason, and confirmation.

import SwiftUI

struct CancelSubscriptionView: View {
    @State private var selectedReason: CancellationReason = .tooExpensive
    @State private var isLoading = false
    @State private var showConfirmation = false
    @State private var errorMessage: String?
    @State private var showSuccess = false
    @Environment(\.dismiss) private var dismiss

    let billingRepository: BillingRepositoryProtocol?

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                warningHeader
                consequencesList
                reasonPicker
                cancelButton
                keepButton
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Abo kuendigen")
        .navigationBarTitleDisplayMode(.inline)
        .confirmationDialog(
            "Abo wirklich kuendigen?",
            isPresented: $showConfirmation,
            titleVisibility: .visible
        ) {
            Button("Abo kuendigen", role: .destructive) {
                Task { await cancelSubscription() }
            }
            Button("Abbrechen", role: .cancel) {}
        } message: {
            Text("Diese Aktion kann nicht rueckgaengig gemacht werden. Dein Abo wird zum Ende des Abrechnungszeitraums beendet.")
        }
        .alert("Fehler", isPresented: .init(
            get: { errorMessage != nil },
            set: { if !$0 { errorMessage = nil } }
        )) {
            Button("OK") { errorMessage = nil }
        } message: {
            Text(errorMessage ?? "")
        }
        .alert("Abo gekuendigt", isPresented: $showSuccess) {
            Button("OK") { dismiss() }
        } message: {
            Text("Dein Abo wurde gekuendigt. Es bleibt bis zum Ende des Abrechnungszeitraums aktiv.")
        }
    }

    // MARK: - Warning Header

    private var warningHeader: some View {
        VStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 48))
                .foregroundStyle(.orange)

            Text("Moechtest du dein Abo wirklich kuendigen?")
                .font(.title3)
                .fontWeight(.bold)
                .foregroundStyle(Color.clText)
                .multilineTextAlignment(.center)

            Text("Wir bedauern, dass du gehst. Bitte beachte die folgenden Auswirkungen.")
                .font(.subheadline)
                .foregroundStyle(Color.clTextSecondary)
                .multilineTextAlignment(.center)
        }
        .padding(.top, 16)
    }

    // MARK: - Consequences

    private var consequencesList: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Was passiert bei Kuendigung:", systemImage: "info.circle.fill")
                .font(.headline)
                .foregroundStyle(Color.clText)

            consequenceRow(icon: "phone.down.fill", text: "Dein Assistent wird deaktiviert", isNegative: true)
            consequenceRow(icon: "eurosign.circle.fill", text: "Guthaben verfaellt nicht", isNegative: false)
            consequenceRow(icon: "arrow.counterclockwise", text: "Du kannst jederzeit reaktivieren", isNegative: false)
            consequenceRow(icon: "calendar", text: "Aktiv bis Ende des Abrechnungszeitraums", isNegative: false)
        }
        .padding(16)
        .background(Color.clCard)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.06), radius: 4, y: 2)
    }

    private func consequenceRow(icon: String, text: String, isNegative: Bool) -> some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .font(.subheadline)
                .foregroundStyle(isNegative ? .red : .green)
                .frame(width: 24)
            Text(text)
                .font(.subheadline)
                .foregroundStyle(Color.clText)
        }
    }

    // MARK: - Reason Picker

    private var reasonPicker: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Grund der Kuendigung (optional)")
                .font(.subheadline)
                .foregroundStyle(Color.clTextSecondary)

            Picker("Grund", selection: $selectedReason) {
                ForEach(CancellationReason.allCases) { reason in
                    Text(reason.label).tag(reason)
                }
            }
            .pickerStyle(.menu)
            .tint(Color.clPurple)
        }
        .padding(16)
        .background(Color.clCard)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.06), radius: 4, y: 2)
    }

    // MARK: - Buttons

    private var cancelButton: some View {
        Button {
            showConfirmation = true
        } label: {
            HStack {
                if isLoading {
                    ProgressView()
                        .tint(.white)
                } else {
                    Image(systemName: "xmark.circle.fill")
                    Text("Abo kuendigen")
                }
            }
            .fontWeight(.semibold)
            .frame(maxWidth: .infinity)
            .frame(height: 44)
        }
        .buttonStyle(.borderedProminent)
        .tint(.red)
        .disabled(isLoading)
    }

    private var keepButton: some View {
        Button {
            dismiss()
        } label: {
            Text("Doch behalten")
                .fontWeight(.semibold)
                .frame(maxWidth: .infinity)
                .frame(height: 44)
        }
        .buttonStyle(.bordered)
        .tint(Color.clPurple)
    }

    // MARK: - Action

    @MainActor
    private func cancelSubscription() async {
        guard let repository = billingRepository else { return }

        isLoading = true
        do {
            try await repository.cancelSubscription(reason: selectedReason.rawValue)
            showSuccess = true
        } catch {
            errorMessage = "Kuendigung fehlgeschlagen. Bitte erneut versuchen."
        }
        isLoading = false
    }
}

// MARK: - Cancellation Reason

enum CancellationReason: String, CaseIterable, Identifiable, Sendable {
    case tooExpensive = "too_expensive"
    case notUsed = "not_used"
    case alternativeFound = "alternative_found"
    case other = "other"

    var id: String { rawValue }

    var label: String {
        switch self {
        case .tooExpensive: "Zu teuer"
        case .notUsed: "Nicht genutzt"
        case .alternativeFound: "Alternative gefunden"
        case .other: "Sonstiges"
        }
    }
}

#Preview {
    NavigationStack {
        CancelSubscriptionView(billingRepository: nil)
    }
}
