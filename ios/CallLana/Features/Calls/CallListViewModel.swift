// CallListViewModel.swift — Call list data loading with search and filter
// Provides paginated calls, search, and status filtering.

import Foundation
import Observation

@Observable
final class CallListViewModel {
    // MARK: - Data

    private(set) var calls: [Call] = []

    // MARK: - Search & Filter

    var searchText = ""
    var statusFilter: CallStatusFilter = .all

    // MARK: - State

    private(set) var isLoading = false
    private(set) var errorMessage: String?
    private(set) var hasMorePages = true
    private var currentPage = 0
    private let pageSize = 30

    // MARK: - Dependencies

    private let callRepository: CallRepositoryProtocol

    init(callRepository: CallRepositoryProtocol) {
        self.callRepository = callRepository
    }

    // MARK: - Computed

    var filteredCalls: [Call] {
        var result = calls

        // Status filter
        if statusFilter != .all {
            result = result.filter { $0.status == statusFilter.rawValue }
        }

        // Search filter
        let query = searchText.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if !query.isEmpty {
            result = result.filter { call in
                (call.phoneNumber?.lowercased().contains(query) ?? false)
            }
        }

        return result
    }

    // MARK: - Actions

    @MainActor
    func loadCalls() async {
        isLoading = true
        errorMessage = nil
        currentPage = 0

        do {
            calls = try await callRepository.getCalls(limit: pageSize)
            hasMorePages = calls.count >= pageSize
        } catch {
            errorMessage = "Anrufe konnten nicht geladen werden."
            calls = []
        }

        isLoading = false
    }

    @MainActor
    func loadMoreIfNeeded(currentItem: Call) async {
        guard hasMorePages, !isLoading else { return }

        let thresholdIndex = calls.index(calls.endIndex, offsetBy: -5)
        guard let itemIndex = calls.firstIndex(where: { $0.id == currentItem.id }),
              itemIndex >= thresholdIndex else { return }

        currentPage += 1
        let offset = currentPage * pageSize

        do {
            let newCalls = try await callRepository.getCalls(limit: pageSize + offset)
            // Replace with full set since API doesn't support offset directly
            if newCalls.count > calls.count {
                calls = newCalls
            }
            hasMorePages = newCalls.count >= (currentPage + 1) * pageSize
        } catch {
            // Silently fail on pagination errors
            hasMorePages = false
        }
    }

    @MainActor
    func applyFilter(_ filter: CallStatusFilter) {
        statusFilter = filter
    }

    @MainActor
    func clearFilters() {
        statusFilter = .all
        searchText = ""
    }
}

// MARK: - Filter Enum

enum CallStatusFilter: String, CaseIterable, Identifiable {
    case all
    case completed
    case missed
    case voicemail

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .all: "Alle"
        case .completed: "Abgeschlossen"
        case .missed: "Verpasst"
        case .voicemail: "Mailbox"
        }
    }
}
