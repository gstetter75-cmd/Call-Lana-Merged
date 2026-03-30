// CallFilterView.swift — Sheet with filter options for the call list
// Provides status picker, date range selection, and action buttons.

import SwiftUI

struct CallFilterView: View {
    @State private var selectedFilter: CallStatusFilter
    @State private var startDate: Date
    @State private var endDate: Date
    @State private var useDateRange: Bool

    let onApply: (CallStatusFilter) -> Void
    let onReset: () -> Void

    init(
        selectedFilter: CallStatusFilter,
        onApply: @escaping (CallStatusFilter) -> Void,
        onReset: @escaping () -> Void
    ) {
        let calendar = Calendar.current
        let today = Date()
        let weekAgo = calendar.date(byAdding: .day, value: -7, to: today) ?? today

        _selectedFilter = State(initialValue: selectedFilter)
        _startDate = State(initialValue: weekAgo)
        _endDate = State(initialValue: today)
        _useDateRange = State(initialValue: false)
        self.onApply = onApply
        self.onReset = onReset
    }

    var body: some View {
        NavigationStack {
            Form {
                statusSection
                dateRangeSection
            }
            .navigationTitle("Filter")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Zurücksetzen") {
                        onReset()
                    }
                    .foregroundStyle(.clTextSecondary)
                }

                ToolbarItem(placement: .topBarTrailing) {
                    Button("Anwenden") {
                        onApply(selectedFilter)
                    }
                    .fontWeight(.semibold)
                    .foregroundStyle(Color.clPurple)
                }
            }
        }
    }

    // MARK: - Status Section

    private var statusSection: some View {
        Section("Status") {
            ForEach(CallStatusFilter.allCases) { filter in
                HStack {
                    Label(filter.displayName, systemImage: iconForFilter(filter))
                        .foregroundStyle(.clText)

                    Spacer()

                    if selectedFilter == filter {
                        Image(systemName: "checkmark")
                            .foregroundStyle(Color.clPurple)
                            .fontWeight(.semibold)
                    }
                }
                .contentShape(Rectangle())
                .onTapGesture {
                    selectedFilter = filter
                }
            }
        }
    }

    // MARK: - Date Range Section

    private var dateRangeSection: some View {
        Section("Zeitraum") {
            Toggle(isOn: $useDateRange) {
                Label("Zeitraum filtern", systemImage: "calendar.badge.clock")
                    .foregroundStyle(.clText)
            }
            .tint(Color.clPurple)

            if useDateRange {
                DatePicker(
                    "Von",
                    selection: $startDate,
                    in: ...endDate,
                    displayedComponents: .date
                )
                .foregroundStyle(.clText)

                DatePicker(
                    "Bis",
                    selection: $endDate,
                    in: startDate...,
                    displayedComponents: .date
                )
                .foregroundStyle(.clText)
            }
        }
    }

    // MARK: - Helpers

    private func iconForFilter(_ filter: CallStatusFilter) -> String {
        switch filter {
        case .all: "phone.fill"
        case .completed: "checkmark.circle.fill"
        case .missed: "xmark.circle.fill"
        case .voicemail: "envelope.fill"
        }
    }
}

#Preview {
    CallFilterView(
        selectedFilter: .all,
        onApply: { _ in },
        onReset: {}
    )
}
