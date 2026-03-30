// AssistantEditViewModel.swift — Editable state for assistant detail/edit
// Manages field copies, change detection, save, and delete operations.

import Foundation
import Observation
import Supabase

@Observable
final class AssistantEditViewModel {
    // MARK: - Editable Fields

    var name: String = ""
    var phoneNumber: String = ""
    var greeting: String = ""
    var systemPrompt: String = ""
    var selectedVoice: String = "alloy"
    var isLive: Bool = false

    // MARK: - State

    private(set) var isLoading = false
    private(set) var isSaving = false
    private(set) var isDeleting = false
    private(set) var errorMessage: String?
    private(set) var didSave = false
    private(set) var didDelete = false

    // MARK: - Original Snapshot

    private var originalAssistant: Assistant?

    // MARK: - Dependencies

    private let assistantId: UUID
    private let repository: AssistantRepositoryProtocol

    // MARK: - Voice Options

    static let voiceOptions = [
        "alloy", "echo", "fable", "onyx", "nova", "shimmer"
    ]

    init(assistantId: UUID, repository: AssistantRepositoryProtocol) {
        self.assistantId = assistantId
        self.repository = repository
    }

    // MARK: - Computed

    var hasChanges: Bool {
        guard let original = originalAssistant else { return false }
        let originalConfig = original.config ?? [:]
        let originalVoice = extractString(originalConfig["voice"]) ?? "alloy"
        let originalGreeting = extractString(originalConfig["greeting"]) ?? ""
        let originalPrompt = extractString(originalConfig["system_prompt"]) ?? ""
        let originalStatus = extractString(originalConfig["status"]) ?? "offline"

        return name != (original.name ?? "")
            || greeting != originalGreeting
            || systemPrompt != originalPrompt
            || selectedVoice != originalVoice
            || isLive != (originalStatus == "live")
    }

    // MARK: - Actions

    @MainActor
    func loadAssistant() async {
        isLoading = true
        errorMessage = nil

        do {
            let assistant = try await repository.getAssistant(id: assistantId)
            originalAssistant = assistant
            populateFields(from: assistant)
        } catch {
            errorMessage = "Assistent konnte nicht geladen werden."
        }

        isLoading = false
    }

    @MainActor
    func save() async {
        guard hasChanges else { return }
        isSaving = true
        errorMessage = nil

        do {
            var configUpdates: [String: AnyJSON] = [:]
            configUpdates["voice"] = .string(selectedVoice)
            configUpdates["greeting"] = .string(greeting)
            configUpdates["system_prompt"] = .string(systemPrompt)
            configUpdates["status"] = .string(isLive ? "live" : "offline")

            let updates: [String: AnyJSON] = [
                "name": .string(name),
                "config": .object(configUpdates)
            ]

            let updated = try await repository.updateAssistant(
                id: assistantId,
                updates: updates
            )
            originalAssistant = updated
            populateFields(from: updated)
            didSave = true
        } catch {
            errorMessage = "Änderungen konnten nicht gespeichert werden."
        }

        isSaving = false
    }

    @MainActor
    func delete() async {
        isDeleting = true
        errorMessage = nil

        do {
            try await repository.deleteAssistant(id: assistantId)
            didDelete = true
        } catch {
            errorMessage = "Assistent konnte nicht gelöscht werden."
        }

        isDeleting = false
    }

    // MARK: - Private

    private func populateFields(from assistant: Assistant) {
        let config = assistant.config ?? [:]

        name = assistant.name ?? ""
        phoneNumber = assistant.vapiAssistantId ?? ""
        selectedVoice = extractString(config["voice"]) ?? "alloy"
        greeting = extractString(config["greeting"]) ?? ""
        systemPrompt = extractString(config["system_prompt"]) ?? ""
        isLive = extractString(config["status"]) == "live"
    }

    private func extractString(_ json: AnyJSON?) -> String? {
        guard case .string(let value) = json else { return nil }
        return value
    }
}
