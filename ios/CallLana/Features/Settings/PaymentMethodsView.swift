// PaymentMethodsView.swift — Payment methods list with add functionality
// Shows card per method with icon, masked number, primary/fallback badge.

import SwiftUI
import Supabase

struct PaymentMethodsView: View {
    @State private var paymentMethods: [PaymentMethod] = []
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var showAddSheet = false

    var body: some View {
        Group {
            if isLoading {
                LoadingView(label: "Zahlungsmethoden werden geladen...")
            } else if paymentMethods.isEmpty {
                emptyState
            } else {
                methodList
            }
        }
        .navigationTitle("Zahlungsmethoden")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await loadPaymentMethods()
        }
        .alert("Fehler", isPresented: .init(
            get: { errorMessage != nil },
            set: { if !$0 { errorMessage = nil } }
        )) {
            Button("OK") { errorMessage = nil }
        } message: {
            Text(errorMessage ?? "")
        }
    }

    // MARK: - Empty State

    private var emptyState: some View {
        VStack(spacing: 16) {
            EmptyStateView(
                icon: "creditcard.trianglebadge.exclamationmark",
                title: "Keine Zahlungsmethoden",
                subtitle: "Du hast noch keine Zahlungsmethode hinterlegt."
            )
            addButton
        }
    }

    // MARK: - Method List

    private var methodList: some View {
        List {
            ForEach(paymentMethods) { method in
                PaymentMethodCardView(method: method)
            }

            Section {
                addButton
            }
        }
        .listStyle(.insetGrouped)
    }

    // MARK: - Add Button

    private var addButton: some View {
        Button {
            showAddSheet = true
        } label: {
            Label("Zahlungsmethode hinzufuegen", systemImage: "plus.circle.fill")
                .fontWeight(.medium)
        }
        .tint(Color.clPurple)
        .sheet(isPresented: $showAddSheet, onDismiss: {
            Task { await loadPaymentMethods() }
        }) {
            AddPaymentMethodView()
        }
    }

    // MARK: - Load

    private func loadPaymentMethods() async {
        isLoading = true

        do {
            let client = SupabaseClientFactory.shared
            let userId = try await client.auth.session.user.id

            let methods: [PaymentMethod] = try await client
                .from("payment_methods")
                .select()
                .eq("user_id", value: userId)
                .order("priority", ascending: true)
                .execute()
                .value

            paymentMethods = methods
        } catch {
            errorMessage = "Zahlungsmethoden konnten nicht geladen werden."
        }

        isLoading = false
    }
}

// MARK: - Payment Method Card

private struct PaymentMethodCardView: View {
    let method: PaymentMethod

    private var typeIcon: String {
        switch method.type {
        case .sepa: "building.columns.fill"
        case .creditCard:
            switch method.cardBrand?.lowercased() {
            case "visa": "v.circle.fill"
            case "mastercard": "m.circle.fill"
            default: "creditcard.fill"
            }
        case .paypal: "p.circle.fill"
        }
    }

    private var typeLabel: String {
        switch method.type {
        case .sepa: "SEPA-Lastschrift"
        case .creditCard: method.cardBrand?.capitalized ?? "Kreditkarte"
        case .paypal: "PayPal"
        }
    }

    private var priorityBadge: (text: String, style: StatusBadgeView.Style) {
        method.isPrimary
            ? ("Primaer", .purple)
            : ("Ersatz", .gray)
    }

    private var statusBadge: (text: String, style: StatusBadgeView.Style) {
        switch method.status {
        case .active: ("Aktiv", .green)
        case .pending: ("Ausstehend", .orange)
        case .revoked: ("Widerrufen", .red)
        case .failed: ("Fehlgeschlagen", .red)
        }
    }

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: typeIcon)
                .font(.title2)
                .foregroundStyle(Color.clPurple)
                .frame(width: 36)

            VStack(alignment: .leading, spacing: 4) {
                Text(typeLabel)
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundStyle(Color.clText)

                Text(method.maskedDisplay)
                    .font(.caption)
                    .foregroundStyle(Color.clTextSecondary)

                if let holder = method.accountHolder, !holder.isEmpty {
                    Text(holder)
                        .font(.caption2)
                        .foregroundStyle(Color.clTextSecondary)
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                StatusBadgeView(
                    text: priorityBadge.text,
                    style: priorityBadge.style
                )
                StatusBadgeView(
                    text: statusBadge.text,
                    style: statusBadge.style
                )
            }
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    NavigationStack {
        PaymentMethodsView()
    }
}
