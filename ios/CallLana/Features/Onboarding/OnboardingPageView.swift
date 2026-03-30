// OnboardingPageView.swift — Reusable onboarding slide component
// Displays an SF Symbol icon, title, and description centered on screen.

import SwiftUI

struct OnboardingPageView: View {
    let icon: String
    let title: String
    let description: String

    var body: some View {
        VStack(spacing: 20) {
            Spacer()

            Image(systemName: icon)
                .font(.system(size: 72))
                .foregroundStyle(Color.callLanaPurple)
                .padding(.bottom, 8)

            Text(title)
                .font(.title)
                .fontWeight(.bold)
                .multilineTextAlignment(.center)

            Text(description)
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)

            Spacer()
            Spacer()
        }
    }
}

#Preview {
    OnboardingPageView(
        icon: "phone.fill.badge.checkmark",
        title: "Dein KI-Telefonassistent",
        description: "Lana nimmt deine Anrufe entgegen, bucht Termine und qualifiziert Leads — rund um die Uhr."
    )
}
