// AppointmentDetailView.swift — Appointment detail sheet
// Shows date, time, customer, phone, duration, notes, status.

import SwiftUI

struct AppointmentDetailView: View {
    let appointment: Appointment

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                headerCard
                detailsSection
                notesSection
            }
            .padding(16)
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Termindetails")
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: - Header

    private var headerCard: some View {
        VStack(spacing: 12) {
            Image(systemName: "calendar.circle.fill")
                .font(.system(size: 48))
                .foregroundStyle(Color.clPurple)

            Text(appointment.title ?? "Termin")
                .font(.title3)
                .fontWeight(.bold)
                .foregroundStyle(Color.clText)
                .multilineTextAlignment(.center)

            StatusBadgeView(text: statusLabel, style: statusBadgeStyle)
        }
        .frame(maxWidth: .infinity)
        .padding(20)
        .background(Color.clCard)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.06), radius: 4, y: 2)
    }

    // MARK: - Details

    private var detailsSection: some View {
        VStack(spacing: 0) {
            detailRow(
                icon: "calendar",
                label: "Datum",
                value: appointment.startTime.dateString
            )

            Divider().padding(.leading, 44)

            detailRow(
                icon: "clock.fill",
                label: "Uhrzeit",
                value: appointment.startTime.timeString + (endTimeText.map { " - \($0)" } ?? "")
            )

            if let duration = durationMinutes {
                Divider().padding(.leading, 44)

                detailRow(
                    icon: "hourglass",
                    label: "Dauer",
                    value: "\(duration) Minuten"
                )
            }

            if let description = appointment.description, !description.isEmpty {
                Divider().padding(.leading, 44)

                detailRow(
                    icon: "person.fill",
                    label: "Kunde",
                    value: description
                )
            }

            if let leadId = appointment.leadId {
                Divider().padding(.leading, 44)

                detailRow(
                    icon: "tag.fill",
                    label: "Lead-ID",
                    value: leadId.uuidString.prefix(8).uppercased() + "..."
                )
            }
        }
        .padding(16)
        .background(Color.clCard)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.06), radius: 4, y: 2)
    }

    // MARK: - Notes

    @ViewBuilder
    private var notesSection: some View {
        if let title = appointment.title, !title.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                Label("Titel", systemImage: "note.text")
                    .font(.headline)
                    .foregroundStyle(Color.clText)

                Text(title)
                    .font(.body)
                    .foregroundStyle(Color.clTextSecondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(16)
            .background(Color.clCard)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .shadow(color: .black.opacity(0.06), radius: 4, y: 2)
        }
    }

    // MARK: - Helpers

    private func detailRow(icon: String, label: String, value: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(Color.clPurple)
                .frame(width: 24)

            Text(label)
                .font(.subheadline)
                .foregroundStyle(Color.clTextSecondary)

            Spacer()

            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundStyle(Color.clText)
                .multilineTextAlignment(.trailing)
        }
        .padding(.vertical, 10)
    }

    private var endTimeText: String? {
        appointment.endTime?.timeString
    }

    private var durationMinutes: Int? {
        guard let endTime = appointment.endTime else { return nil }
        let minutes = Int(endTime.timeIntervalSince(appointment.startTime) / 60)
        return minutes > 0 ? minutes : nil
    }

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
}

#Preview {
    NavigationStack {
        AppointmentDetailView(
            appointment: Appointment(
                id: UUID(),
                userId: UUID(),
                title: "Beratungstermin",
                description: "Max Mustermann",
                startTime: Date(),
                endTime: Date().addingTimeInterval(1800),
                status: "confirmed",
                leadId: nil,
                createdAt: Date()
            )
        )
    }
}
