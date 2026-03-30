// SkeletonCardView.swift — Skeleton placeholder for metric card grids
// Shows a 2x2 grid of rounded gray rectangles with shimmer animation.

import SwiftUI

struct SkeletonCardView: View {
    var body: some View {
        VStack(spacing: 10) {
            RoundedRectangle(cornerRadius: 6)
                .fill(Color(.systemGray5))
                .frame(height: 14)
                .frame(maxWidth: 80)
                .frame(maxWidth: .infinity, alignment: .leading)

            RoundedRectangle(cornerRadius: 8)
                .fill(Color(.systemGray5))
                .frame(height: 28)
        }
        .padding(16)
        .background(Color.clCard)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.06), radius: 4, y: 2)
        .shimmer()
    }
}

#Preview {
    LazyVGrid(columns: [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12)
    ], spacing: 12) {
        SkeletonCardView()
        SkeletonCardView()
        SkeletonCardView()
        SkeletonCardView()
    }
    .padding()
}
