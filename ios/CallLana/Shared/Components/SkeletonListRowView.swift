// SkeletonListRowView.swift — Skeleton placeholder for list rows
// Shows a circle avatar + two text lines with shimmer animation.

import SwiftUI

struct SkeletonListRowView: View {
    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(Color(.systemGray5))
                .frame(width: 36, height: 36)

            VStack(alignment: .leading, spacing: 6) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color(.systemGray5))
                    .frame(height: 14)
                    .frame(maxWidth: 160)

                RoundedRectangle(cornerRadius: 4)
                    .fill(Color(.systemGray5))
                    .frame(height: 10)
                    .frame(maxWidth: 100)
            }

            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .shimmer()
    }
}

#Preview {
    VStack(spacing: 0) {
        SkeletonListRowView()
        SkeletonListRowView()
        SkeletonListRowView()
    }
    .background(Color.clCard)
    .clipShape(RoundedRectangle(cornerRadius: 12))
    .padding()
}
