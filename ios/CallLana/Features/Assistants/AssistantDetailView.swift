// AssistantDetailView.swift — Form-based detail/edit view for a single assistant
// Sections: General info, Behavior config, Status toggle, Delete action.

import SwiftUI

struct AssistantDetailView: View {
    @State private var viewModel: AssistantEditViewModel
    @State private var showDeleteConfirmation = false
    @Environment(\.dismiss) private var dismiss

    init(assistantId: UUID, assistantRepository: AssistantRepositoryProtocol) {
        _viewModel = State(initialValue: AssistantEditViewModel(
            assistantId: assistantId,
            repository: assistantRepository
        ))
    }

    var body: some View {
        Group {
            if viewModel.isLoading {
                LoadingView(label: "Assistent wird geladen…")
            } else if viewModel.errorMessage != nil && viewModel.name.isEmpty {
                errorView
            } else {
                formContent
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Assistent bearbeiten")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                saveButton
            }
        }
        .task {
            await viewModel.loadAssistant()
        }
        .onChange(of: viewModel.didDelete) { _, deleted in
            if deleted { dismiss() }
        }
        .onChange(of: viewModel.didSave) { _, saved in
            if saved { dismiss() }
        }
        .confirmationDialog(
            "Assistent löschen?",
            isPresented: $showDeleteConfirmation,
            titleVisibility: .visible
        ) {
            Button("Löschen", role: .destructive) {
                Task { await viewModel.delete() }
            }
            Button("Abbrechen", role: .cancel) {}
        } message: {
            Text("Diese Aktion kann nicht rückgängig gemacht werden.")
        }
    }

    // MARK: - Form Content

    private var formContent: some View {
        Form {
            generalSection
            behaviorSection
            statusSection

            if let error = viewModel.errorMessage {
                Section {
                    Label(error, systemImage: "exclamationmark.triangle")
                        .font(.caption)
                        .foregroundStyle(.red)
                }
            }

            deleteSection
        }
    }

    // MARK: - General Section

    private var generalSection: some View {
        Section("Allgemein") {
            HStack {
                Label("Name", systemImage: "person.fill")
                    .foregroundStyle(Color.clText)
                Spacer()
                TextField("Assistentenname", text: $viewModel.name)
                    .multilineTextAlignment(.trailing)
                    .foregroundStyle(Color.clText)
            }

            HStack {
                Label("Telefon", systemImage: "phone.fill")
                    .foregroundStyle(Color.clText)
                Spacer()
                Text(viewModel.phoneNumber.isEmpty ? "–" : viewModel.phoneNumber)
                    .foregroundStyle(Color.clTextSecondary)
            }
        }
    }

    // MARK: - Behavior Section

    private var behaviorSection: some View {
        Section("Verhalten") {
            Picker(selection: $viewModel.selectedVoice) {
                ForEach(AssistantEditViewModel.voiceOptions, id: \.self) { voice in
                    Text(voice.capitalized).tag(voice)
                }
            } label: {
                Label("Stimme", systemImage: "waveform")
                    .foregroundStyle(Color.clText)
            }

            VStack(alignment: .leading, spacing: 6) {
                Label("Begrüßung", systemImage: "text.bubble")
                    .font(.subheadline)
                    .foregroundStyle(Color.clText)

                TextField("z.B. Hallo, wie kann ich helfen?", text: $viewModel.greeting)
                    .font(.body)
                    .foregroundStyle(Color.clText)
            }
            .padding(.vertical, 4)

            VStack(alignment: .leading, spacing: 6) {
                Label("System Prompt", systemImage: "doc.text")
                    .font(.subheadline)
                    .foregroundStyle(Color.clText)

                TextEditor(text: $viewModel.systemPrompt)
                    .font(.body)
                    .foregroundStyle(Color.clText)
                    .frame(minHeight: 100)
                    .scrollContentBackground(.hidden)
            }
            .padding(.vertical, 4)
        }
    }

    // MARK: - Status Section

    private var statusSection: some View {
        Section("Status") {
            Toggle(isOn: $viewModel.isLive) {
                HStack(spacing: 8) {
                    Circle()
                        .fill(viewModel.isLive ? Color.green : Color.gray)
                        .frame(width: 10, height: 10)

                    Text(viewModel.isLive ? "Live" : "Offline")
                        .foregroundStyle(Color.clText)
                }
            }
            .tint(Color.clPurple)
        }
    }

    // MARK: - Delete Section

    private var deleteSection: some View {
        Section {
            Button(role: .destructive) {
                showDeleteConfirmation = true
            } label: {
                HStack {
                    Spacer()
                    if viewModel.isDeleting {
                        ProgressView()
                            .controlSize(.small)
                    } else {
                        Label("Assistent löschen", systemImage: "trash")
                    }
                    Spacer()
                }
            }
            .disabled(viewModel.isDeleting)
        }
    }

    // MARK: - Save Button

    private var saveButton: some View {
        Button {
            Task { await viewModel.save() }
        } label: {
            if viewModel.isSaving {
                ProgressView()
                    .controlSize(.small)
            } else {
                Text("Speichern")
                    .fontWeight(.semibold)
            }
        }
        .disabled(!viewModel.hasChanges || viewModel.isSaving)
        .foregroundStyle(viewModel.hasChanges ? Color.clPurple : .clTextSecondary)
    }

    // MARK: - Error View

    private var errorView: some View {
        EmptyStateView(
            icon: "exclamationmark.triangle",
            title: "Fehler",
            subtitle: viewModel.errorMessage ?? "Assistent konnte nicht geladen werden."
        )
    }
}

#Preview {
    NavigationStack {
        AssistantDetailView(
            assistantId: UUID(),
            assistantRepository: AssistantRepository(
                client: SupabaseClientFactory.shared
            )
        )
    }
}
