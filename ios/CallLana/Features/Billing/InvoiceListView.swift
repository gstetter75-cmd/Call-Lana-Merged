// InvoiceListView.swift — Invoice list with status badges
// Tap to download PDF (placeholder).

import SwiftUI

struct InvoiceListView: View {
    let invoices: [Invoice]

    var body: some View {
        Group {
            if invoices.isEmpty {
                EmptyStateView(
                    icon: "doc.text.fill",
                    title: "Keine Rechnungen",
                    subtitle: "Rechnungen werden hier aufgelistet, sobald sie erstellt wurden."
                )
            } else {
                invoiceList
            }
        }
        .navigationTitle("Rechnungen")
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: - List

    private var invoiceList: some View {
        List(invoices) { invoice in
            InvoiceRowView(invoice: invoice)
        }
        .listStyle(.insetGrouped)
    }
}

// MARK: - Invoice Row

private struct InvoiceRowView: View {
    let invoice: Invoice

    private var statusBadgeStyle: StatusBadgeView.Style {
        switch invoice.status {
        case "paid": return .green
        case "issued": return .purple
        case "cancelled", "credited": return .red
        default: return .gray
        }
    }

    private var statusLabel: String {
        switch invoice.status {
        case "paid": return "Bezahlt"
        case "issued": return "Offen"
        case "draft": return "Entwurf"
        case "cancelled": return "Storniert"
        case "credited": return "Gutgeschrieben"
        default: return invoice.status ?? "Unbekannt"
        }
    }

    var body: some View {
        Button {
            // TODO: Download PDF via pdfUrl
        } label: {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    if let number = invoice.invoiceNumber {
                        Text(number)
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .foregroundStyle(.clText)
                    }

                    if let date = invoice.createdAt {
                        Text(date.dateString)
                            .font(.caption)
                            .foregroundStyle(.clTextSecondary)
                    }
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text(invoice.amountCents.centsToEUR)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundStyle(.clText)

                    StatusBadgeView(text: statusLabel, style: statusBadgeStyle)
                }

                Image(systemName: "arrow.down.doc.fill")
                    .font(.caption)
                    .foregroundStyle(.clPurple)
                    .padding(.leading, 4)
            }
            .padding(.vertical, 4)
        }
    }
}

#Preview {
    NavigationStack {
        InvoiceListView(invoices: [])
    }
}
