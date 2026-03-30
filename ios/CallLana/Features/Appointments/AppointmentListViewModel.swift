// AppointmentListViewModel.swift — Appointment data management
// Loads today's and this week's appointments from AppointmentRepository.

import Foundation
import Observation

@Observable
final class AppointmentListViewModel {
    // MARK: - State

    private(set) var todayAppointments: [Appointment] = []
    private(set) var weekAppointments: [Appointment] = []
    private(set) var isLoading = false
    var errorMessage: String?

    var selectedSegment: Segment = .today

    // MARK: - Dependency

    var appointmentRepository: AppointmentRepositoryProtocol?

    // MARK: - Segment

    enum Segment: String, CaseIterable, Identifiable {
        case today
        case week

        var id: String { rawValue }

        var label: String {
            switch self {
            case .today: "Heute"
            case .week: "Diese Woche"
            }
        }
    }

    // MARK: - Computed

    var displayedAppointments: [Appointment] {
        switch selectedSegment {
        case .today: todayAppointments
        case .week: weekAppointments
        }
    }

    // MARK: - Actions

    @MainActor
    func loadAppointments() async {
        guard let repository = appointmentRepository else { return }

        isLoading = true
        errorMessage = nil

        do {
            let calendar = Calendar.current
            let now = Date()

            // Today
            let todayStart = calendar.startOfDay(for: now)
            guard let todayEnd = calendar.date(byAdding: .day, value: 1, to: todayStart) else {
                throw RepositoryError.invalidDateRange
            }

            // This week
            let weekStart = todayStart
            guard let weekEnd = calendar.date(byAdding: .day, value: 7, to: weekStart) else {
                throw RepositoryError.invalidDateRange
            }

            async let todayResult = repository.getAppointments(from: todayStart, to: todayEnd)
            async let weekResult = repository.getAppointments(from: weekStart, to: weekEnd)

            todayAppointments = try await todayResult
            weekAppointments = try await weekResult
        } catch {
            errorMessage = "Termine konnten nicht geladen werden."
        }

        isLoading = false
    }
}
