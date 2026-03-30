import SwiftUI

/// Skeleton loading shimmer effect modifier.
/// Overlays an animated gradient to indicate placeholder content.
struct ShimmerModifier: ViewModifier {
    @State private var phase: CGFloat = -1

    var duration: Double = 1.2

    func body(content: Content) -> some View {
        content
            .overlay {
                GeometryReader { geometry in
                    let gradient = LinearGradient(
                        colors: [
                            .clear,
                            .white.opacity(0.4),
                            .clear
                        ],
                        startPoint: .leading,
                        endPoint: .trailing
                    )

                    Rectangle()
                        .fill(gradient)
                        .frame(width: geometry.size.width * 0.6)
                        .offset(x: geometry.size.width * phase)
                        .onAppear {
                            withAnimation(
                                .linear(duration: duration)
                                .repeatForever(autoreverses: false)
                            ) {
                                phase = 1.6
                            }
                        }
                }
                .clipped()
            }
            .redacted(reason: .placeholder)
    }
}

extension View {
    /// Applies a shimmer skeleton loading effect.
    func shimmer(duration: Double = 1.2) -> some View {
        modifier(ShimmerModifier(duration: duration))
    }
}

#Preview {
    VStack(spacing: 16) {
        RoundedRectangle(cornerRadius: 8)
            .fill(Color(.systemGray5))
            .frame(height: 20)
            .shimmer()

        RoundedRectangle(cornerRadius: 8)
            .fill(Color(.systemGray5))
            .frame(height: 80)
            .shimmer()

        RoundedRectangle(cornerRadius: 8)
            .fill(Color(.systemGray5))
            .frame(width: 200, height: 20)
            .shimmer()
    }
    .padding()
}
