// AssistantListView.swift — List of AI assistants with status toggle
// Displays assistant cards with name, status badge, phone number, and toggle.

import SwiftUI

struct AssistantListView: View {
    @State private var viewModel: AssistantListViewModel

    init(assistantRepository: AssistantRepositoryProtocol) {
        _viewModel = State(initialValue: AssistantListViewModel(
            repository: assistantRepository
        ))
    }

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading && viewModel.assistants.isEmpty {
                    LoadingView(label: "Assistenten werden geladen…")
                } else if viewModel.assistants.isEmpty {
                    EmptyStateView(
                        icon: "cpu",
                        title: "Keine Assistenten",
                        subtitle: "Erstelle deinen ersten KI-Assistenten."
                    )
                } else {
                    assistantList
                }
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Assistenten")
            .refreshable {
                await viewModel.loadAssistants()
            }
        }
        .task {
            await viewModel.loadAssistants()
        }
    }

    // MARK: - List

    private var assistantList: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(viewModel.assistants) { assistant in
                    NavigationLink(destination: AssistantDetailView(
                        assistantId: assistant.id,
                        assistantRepository: viewModel.repository
                    )) {
                        AssistantCardView(
                            assistant: assistant,
                            onToggle: {
                                Task {
                                    await viewModel.toggleStatus(id: assistant.id)
                                }
                            }
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding()
        }
    }
}

// MARK: - Assistant Card

private struct AssistantCardView: View {
    let assistant: Assistant
    let onToggle: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(assistant.name ?? "Unbenannter Assistent")
                        .font(.headline)
                        .foregroundStyle(.clText)

                    if let phone = assistant.vapiAssistantId {
                        Text(phone)
                            .font(.caption)
                            .foregroundStyle(.clTextSecondary)
                    }
                }

                Spacer()

                StatusBadgeView(
                    text: isLive ? "Live" : "Offline",
                    style: isLive ? .green : .gray
                )
            }

            HStack {
                if let description = assistant.description, !description.isEmpty {
                    Text(description)
                        .font(.caption)
                        .foregroundStyle(.clTextSecondary)
                        .lineLimit(2)
                }

                Spacer()

                Button {
                    onToggle()
                } label: {
                    HStack(spacing: 4) {
                        Circle()
                            .fill(isLive ? Color.green : Color.gray)
                            .frame(width: 8, height: 8)
                        Text(isLive ? "Deaktivieren" : "Aktivieren")
                            .font(.caption)
                            .fontWeight(.medium)
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(
                        (isLive ? Color.green : Color.clPurple).opacity(0.1),
                        in: Capsule()
                    )
                    .foregroundStyle(isLive ? .green : Color.clPurple)
                }
                .buttonStyle(.plain)
            }
        }
        .padding()
        .background(.clCard)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.06), radius: 4, y: 2)
    }

    private var isLive: Bool {
        assistant.config?["status"] == .string("live")
    }
}

#Preview {
    AssistantListView(
        assistantRepository: AssistantRepository(client: SupabaseClientFactory.shared.client)
    )
}
