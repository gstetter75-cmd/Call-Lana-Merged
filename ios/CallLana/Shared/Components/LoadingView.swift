import SwiftUI

/// Centered loading indicator with optional label.
struct LoadingView: View {
    var label: String = "Laden…"

    var body: some View {
        VStack(spacing: 12) {
            ProgressView()
                .controlSize(.regular)
            Text(label)
                .font(.subheadline)
                .foregroundStyle(Color.clTextSecondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview {
    LoadingView()
    LoadingView(label: "Anrufe werden geladen…")
}
