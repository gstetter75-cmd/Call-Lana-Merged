// HomeView.swift — Main dashboard with metrics, recent calls,
// today's appointments, top leads, and emergency banner.

import SwiftUI

struct HomeView: View {
    @State private var viewModel: HomeViewModel

    init(
        callRepository: CallRepositoryProtocol,
        appointmentRepository: AppointmentRepositoryProtocol,
        leadRepository: LeadRepositoryProtocol
    ) {
        _viewModel = State(initialValue: HomeViewModel(
            callRepository: callRepository,
            appointmentRepository: appointmentRepository,
            leadRepository: leadRepository
        ))
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Emergency banner (conditional)
                    if let alert = viewModel.emergencyAlert {
                        EmergencyBannerView(alert: alert) {
                            viewModel.dismissEmergency()
                        }
                    }

                    // Metric cards 2x2 grid
                    metricCardsSection

                    // Recent calls
                    recentCallsSection

                    // Today's appointments
                    appointmentsSection

                    // Top leads
                    topLeadsSection
                }
                .padding(.vertical)
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Home")
            .refreshable {
                await viewModel.loadDashboard()
            }
            .overlay {
                if viewModel.isLoading && viewModel.recentCalls.isEmpty {
                    LoadingView(label: "Dashboard wird geladen…")
                }
            }
        }
        .task {
            await viewModel.loadDashboard()
        }
    }

    // MARK: - Metric Cards

    private var metricCardsSection: some View {
        LazyVGrid(columns: [
            GridItem(.flexible(), spacing: 12),
            GridItem(.flexible(), spacing: 12)
        ], spacing: 12) {
            MetricCardView(
                title: "Anrufe heute",
                value: "\(viewModel.totalCalls)",
                trend: viewModel.callsTrend,
                trendUp: viewModel.callsTrendUp
            )

            MetricCardView(
                title: "Buchungsrate",
                value: "\(viewModel.bookingRate)%"
            )

            MetricCardView(
                title: "Minuten",
                value: "\(viewModel.totalMinutes) min"
            )

            MetricCardView(
                title: "Sentiment",
                value: viewModel.avgSentiment.map { String(format: "%.1f/10", $0) } ?? "–"
            )
        }
        .padding(.horizontal)
    }

    // MARK: - Recent Calls

    private var recentCallsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionHeader(title: "Letzte Anrufe", icon: "phone.fill")

            if viewModel.recentCalls.isEmpty && !viewModel.isLoading {
                sectionEmptyState("Noch keine Anrufe")
            } else {
                VStack(spacing: 0) {
                    ForEach(viewModel.recentCalls) { call in
                        NavigationLink(value: call.id) {
                            CallRowView(call: call)
                        }
                        .buttonStyle(.plain)

                        if call.id != viewModel.recentCalls.last?.id {
                            Divider()
                                .padding(.leading, 44)
                        }
                    }
                }
                .background(.clCard)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .padding(.horizontal)
            }
        }
        .navigationDestination(for: UUID.self) { callId in
            CallDetailView(callId: callId)
        }
    }

    // MARK: - Appointments

    private var appointmentsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionHeader(
                title: "Heutige Termine",
                icon: "calendar",
                count: viewModel.todayAppointments.count
            )

            if viewModel.todayAppointments.isEmpty && !viewModel.isLoading {
                sectionEmptyState("Keine Termine heute")
            } else {
                VStack(spacing: 0) {
                    ForEach(viewModel.todayAppointments) { appointment in
                        AppointmentRowView(appointment: appointment)

                        if appointment.id != viewModel.todayAppointments.last?.id {
                            Divider()
                                .padding(.leading, 60)
                        }
                    }
                }
                .background(.clCard)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .padding(.horizontal)
            }
        }
    }

    // MARK: - Top Leads

    private var topLeadsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionHeader(title: "Top Leads", icon: "star.fill")

            if viewModel.topLeads.isEmpty && !viewModel.isLoading {
                sectionEmptyState("Keine Leads vorhanden")
            } else {
                VStack(spacing: 0) {
                    ForEach(viewModel.topLeads) { lead in
                        LeadRowView(lead: lead)

                        if lead.id != viewModel.topLeads.last?.id {
                            Divider()
                                .padding(.leading, 16)
                        }
                    }
                }
                .background(.clCard)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .padding(.horizontal)
            }
        }
    }

    // MARK: - Helpers

    private func sectionHeader(title: String, icon: String, count: Int? = nil) -> some View {
        HStack {
            Label(title, systemImage: icon)
                .font(.headline)
                .foregroundStyle(.clText)

            if let count, count > 0 {
                Text("\(count)")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundStyle(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 2)
                    .background(Color.clPurple, in: Capsule())
            }

            Spacer()
        }
        .padding(.horizontal)
    }

    private func sectionEmptyState(_ text: String) -> some View {
        Text(text)
            .font(.subheadline)
            .foregroundStyle(.clTextSecondary)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 24)
            .background(.clCard)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .padding(.horizontal)
    }
}

// MARK: - Call Row

private struct CallRowView: View {
    let call: Call

    var body: some View {
        HStack(spacing: 12) {
            callStatusIcon
                .frame(width: 32, height: 32)

            VStack(alignment: .leading, spacing: 2) {
                Text(call.phoneNumber ?? "Unbekannt")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(.clText)

                HStack(spacing: 4) {
                    Text(call.createdAt.timeString)
                    Text("·")
                    Text(formattedDuration)
                }
                .font(.caption)
                .foregroundStyle(.clTextSecondary)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.clTextSecondary)
        }
        .padding(.horizontal)
        .padding(.vertical, 10)
    }

    private var callStatusIcon: some View {
        Group {
            switch call.status {
            case "completed":
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(.green)
            case "missed":
                Image(systemName: "xmark.circle.fill")
                    .foregroundStyle(.red)
            case "voicemail":
                Image(systemName: "envelope.fill")
                    .foregroundStyle(.orange)
            default:
                Image(systemName: "phone.fill")
                    .foregroundStyle(.clTextSecondary)
            }
        }
        .font(.title3)
    }

    private var formattedDuration: String {
        guard let duration = call.duration, duration > 0 else { return "0s" }
        let minutes = duration / 60
        let seconds = duration % 60
        return minutes > 0 ? "\(minutes) min" : "\(seconds) sek"
    }
}

// MARK: - Appointment Row

private struct AppointmentRowView: View {
    let appointment: Appointment

    var body: some View {
        HStack(spacing: 12) {
            Text(appointment.startTime.timeString)
                .font(.subheadline)
                .fontWeight(.bold)
                .foregroundStyle(Color.clPurple)
                .frame(width: 48, alignment: .leading)

            VStack(alignment: .leading, spacing: 2) {
                Text(appointment.title ?? "Unbekannter Termin")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(.clText)
                    .lineLimit(1)
            }

            Spacer()

            StatusBadgeView(
                text: appointmentStatusText,
                style: appointmentStatusStyle
            )
        }
        .padding(.horizontal)
        .padding(.vertical, 10)
    }

    private var appointmentStatusText: String {
        switch appointment.status {
        case "cancelled": "Storniert"
        case "completed": "Erledigt"
        default: "Bestätigt"
        }
    }

    private var appointmentStatusStyle: StatusBadgeView.Style {
        switch appointment.status {
        case "cancelled": .red
        case "completed": .purple
        default: .green
        }
    }
}

// MARK: - Lead Row

private struct LeadRowView: View {
    let lead: Lead

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(lead.name ?? "Unbekannt")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(.clText)
                    .lineLimit(1)

                if let company = lead.company, !company.isEmpty {
                    Text(company)
                        .font(.caption)
                        .foregroundStyle(.clTextSecondary)
                        .lineLimit(1)
                }
            }

            Spacer()

            HStack(spacing: 8) {
                ProgressBarView(percentage: Double(lead.score ?? 0), height: 6)
                    .frame(width: 60)

                Text("\(lead.score ?? 0)")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundStyle(.clText)
                    .frame(width: 28, alignment: .trailing)
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 10)
    }

    private var leadScoreColor: Color {
        let score = lead.score ?? 0
        if score >= 70 { return .green }
        if score >= 40 { return .orange }
        return .red
    }
}

#Preview {
    HomeView(
        callRepository: CallRepository(client: SupabaseClientFactory.shared.client),
        appointmentRepository: AppointmentRepository(client: SupabaseClientFactory.shared.client),
        leadRepository: LeadRepository(client: SupabaseClientFactory.shared.client)
    )
}
