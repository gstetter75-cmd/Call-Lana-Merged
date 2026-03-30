// CallListViewModel.swift — Call list data loading with search and filter
// Provides paginated calls, search, and status filtering.

import Combine
import Foundation
import Observation

@Observable
final class CallListViewModel {
    // MARK: - Data

    private(set) var calls: [Call] = []

    // MARK: - Search & Filter

    var searchText = "" {
        didSet { searchSubject.send(searchText) }
    }
    var debouncedSearchText = ""
    var statusFilter: CallStatusFilter = .all

    // MARK: - State

    private(set) var isLoading = false
    private(set) var errorMessage: String?
    private(set) var hasMorePages = true
    private var currentPage = 0
    private let pageSize = 30

    // MARK: - Debounce

    private let searchSubject = PassthroughSubject<String, Never>()
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Dependencies

    private let callRepository: CallRepositoryProtocol

    init(callRepository: CallRepositoryProtocol) {
        self.callRepository = callRepository
        setupSearchDebounce()
    }

    private func setupSearchDebounce() {
        searchSubject
            .debounce(for: .milliseconds(300), scheduler: DispatchQueue.main)
            .sink { [weak self] text in
                self?.debouncedSearchText = text
            }
            .store(in: &cancellables)
    }

    // MARK: - Computed

    var filteredCalls: [Call] {
        var result = calls

        // Status filter
        if statusFilter != .all {
            result = result.filter { $0.status == statusFilter.rawValue }
        }

        // Search filter
        let query = debouncedSearchText.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if !query.isEmpty {
            result = result.filter { call in
                let phoneMatch = call.phoneNumber?.lowercased().contains(query) ?? false
                let transcriptMatch = call.transcript?.lowercased().contains(query) ?? false
                let outcomeMatch = call.outcome?.lowercased().contains(query) ?? false
                return phoneMatch || transcriptMatch || outcomeMatch
            }
        }

        return result
    }

    /// Returns a short transcript excerpt around the search match, or nil if no match.
    func transcriptExcerpt(for call: Call) -> String? {
        let query = debouncedSearchText.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !query.isEmpty,
              let transcript = call.transcript?.lowercased(),
              let range = transcript.range(of: query) else {
            return nil
        }

        let original = call.transcript!
        let matchStart = transcript.distance(from: transcript.startIndex, to: range.lowerBound)
        let excerptStart = max(0, matchStart - 30)
        let excerptEnd = min(original.count, matchStart + query.count + 30)

        let startIdx = original.index(original.startIndex, offsetBy: excerptStart)
        let endIdx = original.index(original.startIndex, offsetBy: excerptEnd)
        var excerpt = String(original[startIdx..<endIdx])

        if excerptStart > 0 { excerpt = "…" + excerpt }
        if excerptEnd < original.count { excerpt = excerpt + "…" }

        return excerpt
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
