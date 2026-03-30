import SwiftUI

/// Placeholder view for empty lists.
struct EmptyStateView: View {
    let icon: String
    let title: String
    var subtitle: String?

    var body: some View {
        ContentUnavailableView {
            Label(title, systemImage: icon)
        } description: {
            if let subtitle {
                Text(subtitle)
            }
        }
    }
}

#Preview {
    EmptyStateView(
        icon: "phone.arrow.down.left",
        title: "Keine Anrufe",
        subtitle: "Sobald Anrufe eingehen, erscheinen sie hier."
    )
}
