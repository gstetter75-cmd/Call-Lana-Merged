// BillingOverviewView.swift — Main billing screen
// Shows balance, minutes usage, spending, auto-reload, hard cap, and navigation.

import SwiftUI

struct BillingOverviewView: View {
    @State private var viewModel = BillingViewModel()
    @State private var showTopupSheet = false

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading && viewModel.subscription == nil {
                    LoadingView(label: "Abrechnung wird geladen...")
                } else {
                    scrollContent
                }
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Kosten")
            .sheet(isPresented: $showTopupSheet) {
                TopupSheetView(
                    currentBalanceCents: viewModel.balanceCents,
                    onTopUp: { amountCents in
                        Task { await viewModel.topUp(amountCents: amountCents) }
                    }
                )
                .presentationDetents([.medium])
            }
            .refreshable {
                await viewModel.loadBilling()
            }
            .task {
                await viewModel.loadBilling()
            }
            .alert("Fehler", isPresented: .init(
                get: { viewModel.errorMessage != nil },
                set: { if !$0 { viewModel.errorMessage = nil } }
            )) {
                Button("OK") { viewModel.errorMessage = nil }
            } message: {
                Text(viewModel.errorMessage ?? "")
            }
        }
    }

    // MARK: - Content

    private var scrollContent: some View {
        ScrollView {
            VStack(spacing: 16) {
                balanceCard
                minutesSection
                spendingSection
                autoReloadSection
                hardCapSection
                navigationSection
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
        }
    }

    // MARK: - Balance Card

    private var balanceCard: some View {
        VStack(spacing: 12) {
            Text("Guthaben")
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.8))

            Text(viewModel.formattedBalance)
                .font(.system(size: 36, weight: .bold, design: .rounded))
                .foregroundStyle(.white)

            Text(viewModel.balanceCents > 0 ? "Verfuegbar" : "Kein Guthaben vorhanden")
                .font(.caption)
                .foregroundStyle(.white.opacity(0.7))

            Button {
                showTopupSheet = true
            } label: {
                Label("Aufladen", systemImage: "plus.circle.fill")
                    .fontWeight(.semibold)
                    .frame(maxWidth: .infinity)
                    .frame(height: 44)
            }
            .buttonStyle(.borderedProminent)
            .tint(.white)
            .foregroundStyle(Color.clPurple)
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .padding(.top, 4)
        }
        .frame(maxWidth: .infinity)
        .padding(20)
        .background(
            LinearGradient(
                colors: [.clPurple, .clPurpleDark],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
        )
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .clPurple.opacity(0.3), radius: 8, y: 4)
    }

    // MARK: - Minutes Usage

    private var minutesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Minuten", systemImage: "clock.fill")
                .font(.headline)
                .foregroundStyle(Color.clText)

            ProgressBarView(percentage: viewModel.minutesPercentage, height: 10)

            HStack {
                Text("\(viewModel.usedMinutes) von \(viewModel.includedMinutes) Minuten verbraucht")
                    .font(.caption)
                    .foregroundStyle(Color.clTextSecondary)
                Spacer()
                Text("\(viewModel.remainingMinutes) Min. uebrig")
                    .font(.caption)
                    .foregroundStyle(Color.clTextSecondary)
            }

            if viewModel.overageMinutes > 0 {
                HStack {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundStyle(.orange)
                        .font(.caption)
                    Text("\(viewModel.overageMinutes) Zusatzminuten (\((viewModel.overageMinutes * Constants.Billing.overageRateCents).centsToEUR))")
                        .font(.caption)
                        .foregroundStyle(.orange)
                }
            }
        }
        .padding(16)
        .background(Color.clCard)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.06), radius: 4, y: 2)
    }

    // MARK: - Spending

    private var spendingSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("Monatliche Ausgaben", systemImage: "chart.bar.fill")
                .font(.headline)
                .foregroundStyle(Color.clText)

            ProgressBarView(percentage: viewModel.spendingPercentage, height: 10)

            HStack {
                Text(viewModel.formattedMonthlySpending)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(Color.clText)
                Text("von")
                    .font(.caption)
                    .foregroundStyle(Color.clTextSecondary)
                Text(viewModel.formattedHardCap)
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(Color.clText)
                Spacer()
                Text("\(Int(viewModel.spendingPercentage))% vom Limit")
                    .font(.caption)
                    .foregroundStyle(Color.clTextSecondary)
            }
        }
        .padding(16)
        .background(Color.clCard)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.06), radius: 4, y: 2)
    }

    // MARK: - Auto-Reload

    private var autoReloadSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Toggle(isOn: $viewModel.autoReloadEnabled) {
                Label("Auto-Aufladung", systemImage: "arrow.triangle.2.circlepath")
                    .font(.headline)
                    .foregroundStyle(Color.clText)
            }
            .tint(Color.clPurple)
            .onChange(of: viewModel.autoReloadEnabled) { _, newValue in
                Task {
                    await viewModel.updateAutoReload(
                        enabled: newValue,
                        threshold: viewModel.autoReloadThresholdCents,
                        amount: viewModel.autoReloadAmountCents
                    )
                }
            }

            if viewModel.autoReloadEnabled {
                VStack(alignment: .leading, spacing: 8) {
                    HStack {
                        Text("Schwelle:")
                            .font(.subheadline)
                            .foregroundStyle(Color.clTextSecondary)
                        Spacer()
                        Text(viewModel.autoReloadThresholdCents.centsToEUR)
                            .font(.subheadline)
                            .fontWeight(.medium)
                    }
                    HStack {
                        Text("Aufladebetrag:")
                            .font(.subheadline)
                            .foregroundStyle(Color.clTextSecondary)
                        Spacer()
                        Text(viewModel.autoReloadAmountCents.centsToEUR)
                            .font(.subheadline)
                            .fontWeight(.medium)
                    }
                }
                .padding(.leading, 4)
            }
        }
        .padding(16)
        .background(Color.clCard)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.06), radius: 4, y: 2)
    }

    // MARK: - Hard Cap

    private var hardCapSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Toggle(isOn: $viewModel.hardCapEnabled) {
                Label("Ausgabenlimit", systemImage: "shield.fill")
                    .font(.headline)
                    .foregroundStyle(Color.clText)
            }
            .tint(Color.clPurple)
            .onChange(of: viewModel.hardCapEnabled) { _, newValue in
                Task {
                    await viewModel.updateHardCap(
                        enabled: newValue,
                        capCents: viewModel.hardCapCents
                    )
                }
            }

            if viewModel.hardCapEnabled {
                HStack {
                    Text("Limit:")
                        .font(.subheadline)
                        .foregroundStyle(Color.clTextSecondary)
                    Spacer()
                    Text(viewModel.hardCapCents.centsToEUR)
                        .font(.subheadline)
                        .fontWeight(.medium)
                }
                .padding(.leading, 4)
            }
        }
        .padding(16)
        .background(Color.clCard)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.06), radius: 4, y: 2)
    }

    // MARK: - Navigation Links

    private var navigationSection: some View {
        VStack(spacing: 0) {
            NavigationLink {
                TransactionListView(transactions: viewModel.transactions)
            } label: {
                HStack {
                    Label("Transaktionen", systemImage: "list.bullet.rectangle")
                    Spacer()
                    Text("\(viewModel.transactions.count)")
                        .font(.subheadline)
                        .foregroundStyle(Color.clTextSecondary)
                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundStyle(Color.clTextSecondary)
                }
                .padding(16)
            }
            .foregroundStyle(Color.clText)

            Divider()
                .padding(.leading, 16)

            NavigationLink {
                InvoiceListView(invoices: viewModel.invoices)
            } label: {
                HStack {
                    Label("Rechnungen", systemImage: "doc.text.fill")
                    Spacer()
                    Text("\(viewModel.invoices.count)")
                        .font(.subheadline)
                        .foregroundStyle(Color.clTextSecondary)
                    Image(systemName: "chevron.right")
                        .font(.caption)
                        .foregroundStyle(Color.clTextSecondary)
                }
                .padding(16)
            }
            .foregroundStyle(Color.clText)
        }
        .background(Color.clCard)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.06), radius: 4, y: 2)
    }
}

#Preview {
    BillingOverviewView()
}
