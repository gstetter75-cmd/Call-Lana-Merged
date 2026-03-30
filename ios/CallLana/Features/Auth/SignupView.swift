import SwiftUI

struct SignupView: View {
    @Environment(DependencyContainer.self) private var container
    @Environment(\.dismiss) private var dismiss
    @State private var viewModel = SignupViewModel()

    var body: some View {
        ScrollView {
            VStack(spacing: 32) {
                header
                signupForm
                registerButton
            }
            .padding(.horizontal, 24)
            .padding(.top, 32)
        }
        .background(Color(.systemGroupedBackground))
        .navigationTitle("Registrieren")
        .navigationBarTitleDisplayMode(.inline)
        .ignoresSafeArea(.keyboard)
        .onAppear {
            viewModel.authService = container.authService
        }
    }

    // MARK: - Header

    private var header: some View {
        VStack(spacing: 8) {
            Image(systemName: "person.badge.plus")
                .font(.system(size: 40))
                .foregroundStyle(Color.callLanaPurple)

            Text("Konto erstellen")
                .font(.title2.bold())

            Text("Starte jetzt mit deinem KI-Telefonassistenten")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
    }

    // MARK: - Form

    private var signupForm: some View {
        VStack(spacing: 16) {
            HStack(spacing: 12) {
                TextField("Vorname", text: $viewModel.firstName)
                    .textContentType(.givenName)
                    .padding()
                    .background(Color(.secondarySystemGroupedBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 12))

                TextField("Nachname", text: $viewModel.lastName)
                    .textContentType(.familyName)
                    .padding()
                    .background(Color(.secondarySystemGroupedBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }

            TextField("E-Mail", text: $viewModel.email)
                .textContentType(.emailAddress)
                .keyboardType(.emailAddress)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
                .padding()
                .background(Color(.secondarySystemGroupedBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))

            SecureField("Passwort (min. 8 Zeichen)", text: $viewModel.password)
                .textContentType(.newPassword)
                .padding()
                .background(Color(.secondarySystemGroupedBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))

            SecureField("Passwort bestaetigen", text: $viewModel.confirmPassword)
                .textContentType(.newPassword)
                .padding()
                .background(Color(.secondarySystemGroupedBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))

            if let error = viewModel.errorMessage {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .transition(.opacity)
            }
        }
    }

    // MARK: - Register Button

    private var registerButton: some View {
        Button {
            Task { await viewModel.signUp() }
        } label: {
            Group {
                if viewModel.isLoading {
                    ProgressView()
                        .tint(.white)
                } else {
                    Text("Registrieren")
                        .fontWeight(.semibold)
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 50)
        }
        .buttonStyle(.borderedProminent)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .disabled(viewModel.isLoading || !viewModel.isFormValid)
    }
}

#Preview {
    NavigationStack {
        SignupView()
            .environment(DependencyContainer())
    }
}
