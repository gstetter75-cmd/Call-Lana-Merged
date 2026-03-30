// EmergencyBannerView.swift — Red alert banner for emergency calls
// Displays phone number, time, and a dismiss button.

import SwiftUI

struct EmergencyBannerView: View {
    let alert: EmergencyAlert
    let onDismiss: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.title3)
                .foregroundStyle(.white)

            VStack(alignment: .leading, spacing: 2) {
                Text("Notfall-Anruf!")
                    .font(.subheadline)
                    .fontWeight(.bold)
                    .foregroundStyle(.white)

                Text("\(alert.phoneNumber) um \(alert.time.timeString)")
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.85))
            }

            Spacer()

            Button("Gesehen") {
                onDismiss()
            }
            .font(.caption)
            .fontWeight(.semibold)
            .foregroundStyle(.red)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(.white, in: Capsule())
        }
        .padding()
        .background(Color.red, in: RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal)
    }
}

#Preview {
    EmergencyBannerView(
        alert: EmergencyAlert(
            phoneNumber: "+49 176 1234567",
            time: Date()
        ),
        onDismiss: {}
    )
    .padding()
}
