// CallListView.swift — Searchable, filterable list of calls
// Displays calls with status icon, phone number, time, and duration.

import SwiftUI

struct CallListView: View {
    @State private var viewModel: CallListViewModel
    @State private var showFilter = false

    init(callRepository: CallRepositoryProtocol) {
        _viewModel = State(initialValue: CallListViewModel(callRepository: callRepository))
    }

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.isLoading && viewModel.calls.isEmpty {
                    VStack(spacing: 0) {
                        ForEach(0..<5, id: \.self) { _ in
                            SkeletonListRowView()
                        }
                    }
                    .background(Color.clCard)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .padding()
                } else if viewModel.filteredCalls.isEmpty {
                    EmptyStateView(
                        icon: "phone.arrow.down.left",
                        title: "Keine Anrufe",
                        subtitle: viewModel.searchText.isEmpty
                            ? "Sobald Anrufe eingehen, erscheinen sie hier."
                            : "Keine Ergebnisse für \"\(viewModel.searchText)\""
                    )
                } else {
                    callList
                }
            }
            .background(Color(.systemGroupedBackground))
            .navigationTitle("Anrufe")
            .searchable(
                text: $viewModel.searchText,
                prompt: "Nummer oder Transkript suchen…"
            )
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    filterButton
                }
            }
            .refreshable {
                await viewModel.loadCalls()
            }
            .sheet(isPresented: $showFilter) {
                CallFilterView(
                    selectedFilter: viewModel.statusFilter,
                    onApply: { filter in
                        viewModel.applyFilter(filter)
                        showFilter = false
                    },
                    onReset: {
                        viewModel.clearFilters()
                        showFilter = false
                    }
                )
                .presentationDetents([.medium])
            }
        }
        .task {
            await viewModel.loadCalls()
        }
    }

    // MARK: - Call List

    private var callList: some View {
        List {
            ForEach(viewModel.filteredCalls) { call in
                NavigationLink(destination: CallDetailView(callId: call.id)) {
                    CallListRowView(
                        call: call,
                        transcriptExcerpt: viewModel.transcriptExcerpt(for: call)
                    )
                }
                .listRowBackground(Color.clCard)
                .onAppear {
                    Task {
                        await viewModel.loadMoreIfNeeded(currentItem: call)
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
    }

    // MARK: - Filter Button

    private var filterButton: some View {
        Button {
            showFilter = true
        } label: {
            Image(systemName: viewModel.statusFilter == .all
                  ? "line.3.horizontal.decrease.circle"
                  : "line.3.horizontal.decrease.circle.fill"
            )
            .foregroundStyle(viewModel.statusFilter == .all ? Color.clText : Color.clPurple)
        }
    }
}

// MARK: - Call List Row

private struct CallListRowView: View {
    let call: Call
    var transcriptExcerpt: String?

    var body: some View {
        HStack(spacing: 12) {
            statusIcon
                .frame(width: 32, height: 32)

            VStack(alignment: .leading, spacing: 2) {
                Text(call.phoneNumber ?? "Unbekannt")
                    .font(.subheadline)
                    .fontWeight(.semibold)
                    .foregroundStyle(Color.clText)

                if let excerpt = transcriptExcerpt {
                    Text(excerpt)
                        .font(.caption)
                        .foregroundStyle(Color.callLanaPurple)
                        .lineLimit(1)
                }

                HStack(spacing: 4) {
                    Text(call.createdAt.relativeDateString)
                    Text("·")
                    Text(call.createdAt.timeString)
                }
                .font(.caption)
                .foregroundStyle(Color.clTextSecondary)
            }

            Spacer()

            VStack(alignment: .trailing, spacing: 2) {
                Text(formattedDuration)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundStyle(Color.clText)

                StatusBadgeView(
                    text: statusText,
                    style: statusStyle
                )
            }
        }
        .padding(.vertical, 4)
    }

    private var statusIcon: some View {
        Group {
            switch call.status {
            case "completed":
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(.green)
            case "missed":
                Image(systemName: "xmark.circle.fill")
                    .foregroundStyle(.red)
            case "voicemail":
                Image(systemName: "envelope.fill")
                    .foregroundStyle(.orange)
            default:
                Image(systemName: "phone.fill")
                    .foregroundStyle(Color.clTextSecondary)
            }
        }
        .font(.title3)
    }

    private var statusText: String {
        switch call.status {
        case "completed": "Abgeschlossen"
        case "missed": "Verpasst"
        case "voicemail": "Mailbox"
        default: "Unbekannt"
        }
    }

    private var statusStyle: StatusBadgeView.Style {
        switch call.status {
        case "completed": .green
        case "missed": .red
        case "voicemail": .orange
        default: .gray
        }
    }

    private var formattedDuration: String {
        guard let duration = call.duration, duration > 0 else { return "–" }
        let minutes = duration / 60
        let seconds = duration % 60
        return minutes > 0 ? "\(minutes)m \(seconds)s" : "\(seconds)s"
    }
}

#Preview {
    CallListView(
        callRepository: CallRepository(client: SupabaseClientFactory.shared)
    )
}
