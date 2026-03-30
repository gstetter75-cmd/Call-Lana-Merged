import SwiftUI

/// Small colored badge for status indicators.
/// Used for call status, appointment status, assistant status.
struct StatusBadgeView: View {
    let text: String
    let style: Style

    enum Style {
        case green, red, orange, purple, gray

        var backgroundColor: Color {
            switch self {
            case .green:  Color.green.opacity(0.15)
            case .red:    Color.red.opacity(0.15)
            case .orange: Color.orange.opacity(0.15)
            case .purple: Color.clPurple.opacity(0.15)
            case .gray:   Color.gray.opacity(0.15)
            }
        }

        var foregroundColor: Color {
            switch self {
            case .green:  .green
            case .red:    .red
            case .orange: .orange
            case .purple: .clPurple
            case .gray:   .gray
            }
        }
    }

    var body: some View {
        Text(text)
            .font(.caption2)
            .fontWeight(.semibold)
            .foregroundStyle(style.foregroundColor)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(style.backgroundColor, in: Capsule())
    }
}

#Preview {
    HStack(spacing: 8) {
        StatusBadgeView(text: "Aktiv", style: .green)
        StatusBadgeView(text: "Fehler", style: .red)
        StatusBadgeView(text: "Ausstehend", style: .orange)
        StatusBadgeView(text: "Premium", style: .purple)
        StatusBadgeView(text: "Inaktiv", style: .gray)
    }
}
