import SwiftUI

/// Reusable progress bar with color gradient based on percentage.
/// Used for minutes usage, spending vs hard cap, etc.
struct ProgressBarView: View {
    let percentage: Double
    var height: CGFloat = 8

    private var clampedPercentage: Double {
        min(max(percentage, 0), 100)
    }

    private var fillGradient: LinearGradient {
        let colors: [Color] = switch clampedPercentage {
        case 0..<70:
            [.blue, .cyan]
        case 70..<90:
            [.orange, .orange.opacity(0.8)]
        default:
            [.red, .red.opacity(0.8)]
        }
        return LinearGradient(
            colors: colors,
            startPoint: .leading,
            endPoint: .trailing
        )
    }

    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                Capsule()
                    .fill(Color(.systemGray5))
                    .frame(height: height)

                Capsule()
                    .fill(fillGradient)
                    .frame(
                        width: geometry.size.width * clampedPercentage / 100,
                        height: height
                    )
                    .animation(.easeInOut(duration: 0.6), value: clampedPercentage)
            }
        }
        .frame(height: height)
    }
}

#Preview {
    VStack(spacing: 20) {
        ProgressBarView(percentage: 30)
        ProgressBarView(percentage: 75)
        ProgressBarView(percentage: 95, height: 12)
    }
    .padding()
}
