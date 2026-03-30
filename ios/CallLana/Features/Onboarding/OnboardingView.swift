// OnboardingView.swift — Onboarding flow with 3 slides
// Introduces new users to Call Lana's key features before entering the app.

import SwiftUI

struct OnboardingView: View {
    @AppStorage("hasCompletedOnboarding") private var hasCompletedOnboarding = false
    @State private var currentPage = 0

    private let slides: [(icon: String, title: String, description: String)] = [
        (
            icon: "phone.fill.badge.checkmark",
            title: "Dein KI-Telefonassistent",
            description: "Lana nimmt deine Anrufe entgegen, bucht Termine und qualifiziert Leads — rund um die Uhr."
        ),
        (
            icon: "chart.bar.fill",
            title: "Alles im Blick",
            description: "Dashboard mit Anrufhistorie, Terminübersicht und Echtzeit-KPIs auf einen Blick."
        ),
        (
            icon: "creditcard.fill",
            title: "Volle Kostenkontrolle",
            description: "Guthaben aufladen, Ausgabenlimit setzen, Rechnungen einsehen — transparent und fair."
        )
    ]

    private var isLastPage: Bool {
        currentPage == slides.count - 1
    }

    var body: some View {
        VStack(spacing: 0) {
            TabView(selection: $currentPage) {
                ForEach(Array(slides.enumerated()), id: \.offset) { index, slide in
                    OnboardingPageView(
                        icon: slide.icon,
                        title: slide.title,
                        description: slide.description
                    )
                    .tag(index)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .animation(.easeInOut(duration: 0.3), value: currentPage)

            // Custom page indicator
            HStack(spacing: 8) {
                ForEach(0..<slides.count, id: \.self) { index in
                    Circle()
                        .fill(index == currentPage ? Color.callLanaPurple : Color.callLanaPurple.opacity(0.3))
                        .frame(width: index == currentPage ? 10 : 8, height: index == currentPage ? 10 : 8)
                        .animation(.easeInOut(duration: 0.2), value: currentPage)
                }
            }
            .padding(.bottom, 32)

            // Action button
            Button {
                if isLastPage {
                    hasCompletedOnboarding = true
                } else {
                    currentPage += 1
                }
            } label: {
                Text(isLastPage ? "Los geht's" : "Weiter")
                    .font(.headline)
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color.callLanaPurple)
                    .clipShape(RoundedRectangle(cornerRadius: 14))
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 16)

            // Skip button (hidden on last page)
            if !isLastPage {
                Button("Überspringen") {
                    hasCompletedOnboarding = true
                }
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .padding(.bottom, 16)
            } else {
                Spacer()
                    .frame(height: 48)
            }
        }
    }
}

#Preview {
    OnboardingView()
}
