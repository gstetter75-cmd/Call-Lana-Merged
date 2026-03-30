// CallDetailView.swift — Detailed view of a single call
// Shows header, status badges, sentiment visualization, and expandable transcript.

import SwiftUI

struct CallDetailView: View {
    let callId: UUID
    var callRepository: CallRepositoryProtocol?

    @State private var call: Call?
    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var isTranscriptExpanded = false

    var body: some View {
        Group {
            if isLoading {
                LoadingView(label: "Anruf wird geladen…")
            } else if let call {
                callContent(call)
            } else {
                EmptyStateView(
                    icon: "exclamationmark.triangle",
                    title: "Fehler",
                    subtitle: errorMessage ?? "Anruf konnte nicht geladen werden."
                )
            }
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Anruf-Details")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await loadCall()
        }
    }

    // MARK: - Content

    private func callContent(_ call: Call) -> some View {
        ScrollView {
            VStack(spacing: 20) {
                headerSection(call)
                badgesSection(call)
                sentimentSection(call)
                infoSection(call)

                if let transcript = call.transcript, !transcript.isEmpty {
                    transcriptSection(transcript)
                }
            }
            .padding(.vertical)
        }
    }

    // MARK: - Header

    private func headerSection(_ call: Call) -> some View {
        VStack(spacing: 8) {
            Image(systemName: "phone.circle.fill")
                .font(.system(size: 56))
                .foregroundStyle(Color.clPurple)

            Text(call.phoneNumber ?? "Unbekannt")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundStyle(Color.clText)

            Text("\(call.createdAt.dateString) um \(call.createdAt.timeString)")
                .font(.subheadline)
                .foregroundStyle(Color.clTextSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color.clCard)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Badges

    private func badgesSection(_ call: Call) -> some View {
        HStack(spacing: 12) {
            StatusBadgeView(
                text: statusText(for: call.status),
                style: statusStyle(for: call.status)
            )

            if let outcome = call.status, outcome == "completed" {
                StatusBadgeView(text: "Abgeschlossen", style: .purple)
            }
        }
        .padding(.horizontal)
    }

    // MARK: - Sentiment

    @ViewBuilder
    private func sentimentSection(_ call: Call) -> some View {
        if let score = call.sentimentScore {
            VStack(spacing: 8) {
                Text("Sentiment")
                    .font(.caption)
                    .foregroundStyle(Color.clTextSecondary)

                ZStack {
                    Circle()
                        .stroke(sentimentColor(score).opacity(0.2), lineWidth: 6)
                        .frame(width: 64, height: 64)

                    Circle()
                        .trim(from: 0, to: score / 10.0)
                        .stroke(sentimentColor(score), style: StrokeStyle(lineWidth: 6, lineCap: .round))
                        .frame(width: 64, height: 64)
                        .rotationEffect(.degrees(-90))

                    Text(String(format: "%.1f", score))
                        .font(.title3)
                        .fontWeight(.bold)
                        .foregroundStyle(sentimentColor(score))
                }

                Text(sentimentLabel(score))
                    .font(.caption)
                    .foregroundStyle(Color.clTextSecondary)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.clCard)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .padding(.horizontal)
        }
    }

    // MARK: - Info Grid

    private func infoSection(_ call: Call) -> some View {
        VStack(spacing: 0) {
            infoRow(label: "Dauer", value: formattedDuration(call.duration), icon: "clock")
            Divider().padding(.leading, 44)
            infoRow(label: "Status", value: statusText(for: call.status), icon: "info.circle")
            Divider().padding(.leading, 44)
            infoRow(label: "Datum", value: call.createdAt.dateString, icon: "calendar")
            Divider().padding(.leading, 44)
            infoRow(label: "Uhrzeit", value: call.createdAt.timeString, icon: "clock.badge")
        }
        .background(Color.clCard)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    private func infoRow(label: String, value: String, icon: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.body)
                .foregroundStyle(Color.clPurple)
                .frame(width: 32)

            Text(label)
                .font(.subheadline)
                .foregroundStyle(Color.clTextSecondary)

            Spacer()

            Text(value)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundStyle(Color.clText)
        }
        .padding(.horizontal)
        .padding(.vertical, 12)
    }

    // MARK: - Transcript (Expandable)

    private func transcriptSection(_ transcript: String) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            Button {
                withAnimation(.easeInOut(duration: 0.3)) {
                    isTranscriptExpanded.toggle()
                }
            } label: {
                HStack {
                    Label("Transkript", systemImage: "text.quote")
                        .font(.headline)
                        .foregroundStyle(Color.clText)

                    Spacer()

                    Image(systemName: isTranscriptExpanded ? "chevron.up" : "chevron.down")
                        .font(.caption)
                        .foregroundStyle(Color.clTextSecondary)
                }
                .padding()
            }
            .buttonStyle(.plain)

            if isTranscriptExpanded {
                Divider()

                Text(transcript)
                    .font(.body)
                    .foregroundStyle(Color.clText)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
            }
        }
        .background(Color.clCard)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }

    // MARK: - Helpers

    private func statusText(for status: String?) -> String {
        switch status {
        case "completed": "Abgeschlossen"
        case "missed": "Verpasst"
        case "voicemail": "Mailbox"
        default: "Unbekannt"
        }
    }

    private func statusStyle(for status: String?) -> StatusBadgeView.Style {
        switch status {
        case "completed": .green
        case "missed": .red
        case "voicemail": .orange
        default: .gray
        }
    }

    private func formattedDuration(_ duration: Int?) -> String {
        guard let duration, duration > 0 else { return "–" }
        let minutes = duration / 60
        let seconds = duration % 60
        return minutes > 0 ? "\(minutes) min \(seconds) sek" : "\(seconds) sek"
    }

    private func sentimentColor(_ score: Double) -> Color {
        if score >= 7 { return .green }
        if score >= 4 { return .orange }
        return .red
    }

    private func sentimentLabel(_ score: Double) -> String {
        if score >= 7 { return "Positiv" }
        if score >= 4 { return "Neutral" }
        return "Negativ"
    }

    // MARK: - Loading

    @MainActor
    private func loadCall() async {
        isLoading = true
        do {
            if let repo = callRepository {
                call = try await repo.getCall(id: callId)
            }
        } catch {
            errorMessage = "Anruf konnte nicht geladen werden."
        }
        isLoading = false
    }
}

#Preview {
    NavigationStack {
        CallDetailView(callId: UUID())
    }
}
