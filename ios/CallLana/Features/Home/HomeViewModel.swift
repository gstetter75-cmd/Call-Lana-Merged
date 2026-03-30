// HomeViewModel.swift — Dashboard data loading with parallel fetching
// Provides metrics, recent calls, appointments, and top leads.

import Foundation
import Observation

@Observable
final class HomeViewModel {
    // MARK: - Metric Data

    private(set) var totalCalls = 0
    private(set) var bookingRate = 0
    private(set) var totalMinutes = 0
    private(set) var avgSentiment: Double?
    private(set) var callsTrend: String?
    private(set) var callsTrendUp: Bool?

    // MARK: - Widget Data

    private(set) var recentCalls: [Call] = []
    private(set) var todayAppointments: [Appointment] = []
    private(set) var topLeads: [Lead] = []

    // MARK: - State

    private(set) var isLoading = false
    private(set) var errorMessage: String?

    // MARK: - Emergency

    private(set) var emergencyAlert: EmergencyAlert?

    // MARK: - Dependencies

    private let callRepository: CallRepositoryProtocol
    private let appointmentRepository: AppointmentRepositoryProtocol
    private let leadRepository: LeadRepositoryProtocol

    init(
        callRepository: CallRepositoryProtocol,
        appointmentRepository: AppointmentRepositoryProtocol,
        leadRepository: LeadRepositoryProtocol
    ) {
        self.callRepository = callRepository
        self.appointmentRepository = appointmentRepository
        self.leadRepository = leadRepository
    }

    // MARK: - Actions

    @MainActor
    func loadDashboard() async {
        isLoading = true
        errorMessage = nil

        await loadCalls()
        await loadMetrics()
        await loadAppointments()
        await loadLeads()

        isLoading = false
    }

    @MainActor
    func dismissEmergency() {
        emergencyAlert = nil
    }

    // MARK: - Private Loading

    @MainActor
    private func loadCalls() async {
        do {
            recentCalls = try await callRepository.getCalls(limit: 5)
        } catch {
            recentCalls = []
        }
    }

    @MainActor
    private func loadMetrics() async {
        do {
            let calendar = Calendar.current
            let now = Date()
            let startOfToday = calendar.startOfDay(for: now)
            guard let endOfToday = calendar.date(byAdding: .day, value: 1, to: startOfToday) else { return }

            let todayStats = try await callRepository.getCallStats(
                from: startOfToday,
                to: endOfToday
            )

            totalCalls = todayStats.totalCalls
            totalMinutes = todayStats.totalDuration / 60

            let completed = todayStats.statuses["completed"] ?? 0
            bookingRate = todayStats.totalCalls > 0
                ? Int(Double(completed) / Double(todayStats.totalCalls) * 100)
                : 0

            // Yesterday comparison for trend
            guard let startOfYesterday = calendar.date(byAdding: .day, value: -1, to: startOfToday) else { return }
            let yesterdayStats = try await callRepository.getCallStats(
                from: startOfYesterday,
                to: startOfToday
            )

            if yesterdayStats.totalCalls > 0 {
                let diff = todayStats.totalCalls - yesterdayStats.totalCalls
                let pct = Int(Double(diff) / Double(yesterdayStats.totalCalls) * 100)
                callsTrend = "\(abs(pct))% vs. gestern"
                callsTrendUp = diff >= 0
            } else {
                callsTrend = nil
                callsTrendUp = nil
            }
        } catch {
            totalCalls = 0
            bookingRate = 0
            totalMinutes = 0
        }
    }

    @MainActor
    private func loadAppointments() async {
        do {
            todayAppointments = try await appointmentRepository.getTodayAppointments()
        } catch {
            todayAppointments = []
        }
    }

    @MainActor
    private func loadLeads() async {
        do {
            topLeads = try await leadRepository.getTopLeads(limit: 5)
        } catch {
            topLeads = []
        }
    }
}

// MARK: - Emergency Alert Model

struct EmergencyAlert: Identifiable, Sendable {
    let id = UUID()
    let phoneNumber: String
    let time: Date
}
