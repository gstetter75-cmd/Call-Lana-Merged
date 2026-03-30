// AppointmentListView.swift — Appointment list with today/week segment picker
// Shows time, customer name, duration, and status badge.

import SwiftUI

struct AppointmentListView: View {
    @State private var viewModel = AppointmentListViewModel()

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                segmentPicker
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)

                Group {
                    if viewModel.isLoading && viewModel.displayedAppointments.isEmpty {
                        LoadingView(label: "Termine werden geladen...")
                    } else if viewModel.displayedAppointments.isEmpty {
                        EmptyStateView(
                            icon: "calendar",
                            title: "Keine Termine",
                            subtitle: viewModel.selectedSegment == .today
                                ? "Heute stehen keine Termine an."
                                : "Diese Woche stehen keine Termine an."
                        )
                    } else {
                        appointmentList
                    }
                }
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Termine")
            .refreshable {
                await viewModel.loadAppointments()
            }
            .task {
                await viewModel.loadAppointments()
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

    // MARK: - Segment Picker

    private var segmentPicker: some View {
        Picker("Zeitraum", selection: $viewModel.selectedSegment) {
            ForEach(AppointmentListViewModel.Segment.allCases) { segment in
                Text(segment.label).tag(segment)
            }
        }
        .pickerStyle(.segmented)
    }

    // MARK: - List

    private var appointmentList: some View {
        List(viewModel.displayedAppointments) { appointment in
            NavigationLink {
                AppointmentDetailView(appointment: appointment)
            } label: {
                AppointmentRowView(appointment: appointment)
            }
        }
        .listStyle(.insetGrouped)
    }
}

// MARK: - Appointment Row

private struct AppointmentRowView: View {
    let appointment: Appointment

    private var statusBadgeStyle: StatusBadgeView.Style {
        switch appointment.status {
        case "confirmed": .green
        case "cancelled": .red
        case "completed": .purple
        case "pending": .orange
        default: .gray
        }
    }

    private var statusLabel: String {
        switch appointment.status {
        case "confirmed": "Bestaetigt"
        case "cancelled": "Abgesagt"
        case "completed": "Abgeschlossen"
        case "pending": "Ausstehend"
        default: appointment.status ?? "Unbekannt"
        }
    }

    var body: some View {
        HStack(spacing: 12) {
            // Time column
            VStack(spacing: 2) {
                Text(appointment.startTime.timeString)
                    .font(.headline)
                    .fontWeight(.bold)
                    .foregroundStyle(Color.clPurple)

                Text(appointment.startTime.relativeDateString)
                    .font(.caption2)
                    .foregroundStyle(Color.clTextSecondary)
            }
            .frame(width: 60)

            // Details
            VStack(alignment: .leading, spacing: 4) {
                Text(appointment.title ?? "Termin")
                    .font(.subheadline)
                    .fontWeight(.medium)
                    .foregroundStyle(Color.clText)
                    .lineLimit(1)

                if let duration = durationText {
                    Text(duration)
                        .font(.caption)
                        .foregroundStyle(Color.clTextSecondary)
                }
            }

            Spacer()

            StatusBadgeView(text: statusLabel, style: statusBadgeStyle)
        }
        .padding(.vertical, 4)
    }

    private var durationText: String? {
        guard let endTime = appointment.endTime else { return nil }
        let minutes = Int(endTime.timeIntervalSince(appointment.startTime) / 60)
        guard minutes > 0 else { return nil }
        return "\(minutes) Min."
    }
}

#Preview {
    AppointmentListView()
}
