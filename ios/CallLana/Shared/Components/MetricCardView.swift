import SwiftUI

/// KPI card displaying a metric with optional trend indicator.
struct MetricCardView: View {
    let title: String
    let value: String
    var trend: String?
    var trendUp: Bool?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.caption)
                .foregroundStyle(Color.clTextSecondary)

            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundStyle(Color.clText)

            if let trend {
                HStack(spacing: 4) {
                    if let trendUp {
                        Image(systemName: trendUp ? "arrow.up.right" : "arrow.down.right")
                            .font(.caption2)
                            .foregroundStyle(trendUp ? .green : .red)
                    }
                    Text(trend)
                        .font(.caption2)
                        .foregroundStyle(trendUp == true ? .green : trendUp == false ? .red : .clTextSecondary)
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(Color.clCard)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.06), radius: 4, y: 2)
    }
}

#Preview {
    HStack {
        MetricCardView(
            title: "Anrufe heute",
            value: "42",
            trend: "+12%",
            trendUp: true
        )
        MetricCardView(
            title: "Kosten",
            value: "149,00 €",
            trend: "-5%",
            trendUp: false
        )
    }
    .padding()
}
