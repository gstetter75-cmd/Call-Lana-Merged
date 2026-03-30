// TransactionListView.swift — Transaction history list
// Type labels in German, amount colored by direction (+/-).

import SwiftUI

struct TransactionListView: View {
    let transactions: [BillingTransaction]
    var onRefresh: (() async -> Void)?

    var body: some View {
        Group {
            if transactions.isEmpty {
                EmptyStateView(
                    icon: "list.bullet.rectangle",
                    title: "Keine Transaktionen",
                    subtitle: "Sobald Buchungen anfallen, erscheinen sie hier."
                )
            } else {
                transactionList
            }
        }
        .navigationTitle("Transaktionen")
        .navigationBarTitleDisplayMode(.inline)
        .refreshable {
            await onRefresh?()
        }
    }

    // MARK: - List

    private var transactionList: some View {
        List(transactions) { transaction in
            TransactionRowView(transaction: transaction)
        }
        .listStyle(.insetGrouped)
    }
}

// MARK: - Transaction Row

private struct TransactionRowView: View {
    let transaction: BillingTransaction

    private var isPositive: Bool {
        ["topup", "auto_reload", "refund", "credit"].contains(transaction.type)
    }

    private var typeLabel: String {
        let labels: [String: String] = [
            "plan_charge": "Tarifgebuehr",
            "topup": "Aufladung",
            "auto_reload": "Auto-Aufladung",
            "usage_charge": "Verbrauch",
            "refund": "Erstattung",
            "credit": "Gutschrift"
        ]
        return labels[transaction.type] ?? transaction.type
    }

    private var badgeStyle: StatusBadgeView.Style {
        isPositive ? .green : .gray
    }

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                StatusBadgeView(text: typeLabel, style: badgeStyle)

                Text(transaction.createdAt.relativeDateString + " " + transaction.createdAt.timeString)
                    .font(.caption)
                    .foregroundStyle(Color.clTextSecondary)

                if let description = transaction.description, !description.isEmpty {
                    Text(description)
                        .font(.caption2)
                        .foregroundStyle(Color.clTextSecondary)
                        .lineLimit(1)
                }
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 4) {
                Text("\(isPositive ? "+" : "-")\(abs(transaction.amountCents).centsToEUR)")
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundStyle(isPositive ? Color.green : Color.clText)

                if let balanceAfter = transaction.balanceAfterCents {
                    Text("Saldo: \(balanceAfter.centsToEUR)")
                        .font(.caption2)
                        .foregroundStyle(Color.clTextSecondary)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    NavigationStack {
        TransactionListView(transactions: [])
    }
}
