// AssistantListViewModel.swift — Assistant list data loading and status toggle
// Provides CRUD-like operations for the assistant list.

import Foundation
import Observation
import Supabase

@Observable
final class AssistantListViewModel {
    // MARK: - Data

    private(set) var assistants: [Assistant] = []

    // MARK: - State

    private(set) var isLoading = false
    private(set) var errorMessage: String?

    // MARK: - Dependencies

    let repository: AssistantRepositoryProtocol

    init(repository: AssistantRepositoryProtocol) {
        self.repository = repository
    }

    // MARK: - Actions

    @MainActor
    func loadAssistants() async {
        isLoading = true
        errorMessage = nil

        do {
            assistants = try await repository.getAssistants()
        } catch {
            errorMessage = "Assistenten konnten nicht geladen werden."
            assistants = []
        }

        isLoading = false
    }

    @MainActor
    func toggleStatus(id: UUID) async {
        guard let index = assistants.firstIndex(where: { $0.id == id }) else { return }

        let current = assistants[index]
        let currentStatus = current.config?["status"]
        let isCurrentlyLive = currentStatus == .string("live")
        let newStatus: String = isCurrentlyLive ? "offline" : "live"

        do {
            let updated = try await repository.updateAssistant(
                id: id,
                updates: ["status": AnyJSON.string(newStatus)]
            )
            assistants[index] = updated
        } catch {
            errorMessage = "Status konnte nicht geändert werden."
        }
    }
}
