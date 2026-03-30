import SwiftUI
import LocalAuthentication

struct LoginView: View {
    @Environment(DependencyContainer.self) private var container
    @State private var viewModel = LoginViewModel()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 32) {
                    branding
                    loginForm
                    actionButtons
                    signupLink
                }
                .padding(.horizontal, 24)
                .padding(.top, 60)
            }
            .background(Color(.systemGroupedBackground))
            .ignoresSafeArea(.keyboard)
        }
        .onAppear {
            viewModel.authService = container.authService
        }
    }

    // MARK: - Branding

    private var branding: some View {
        VStack(spacing: 12) {
            Image(systemName: "phone.fill")
                .font(.system(size: 48))
                .foregroundStyle(Color.callLanaPurple)
                .padding(20)
                .background(
                    Circle()
                        .fill(Color.callLanaPurple.opacity(0.12))
                )

            Text("Call Lana")
                .font(.largeTitle.bold())
                .foregroundStyle(Color.callLanaPurple)

            Text("Dein KI-Telefonassistent")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
    }

    // MARK: - Form

    private var loginForm: some View {
        VStack(spacing: 16) {
            TextField("E-Mail", text: $viewModel.email)
                .textContentType(.emailAddress)
                .keyboardType(.emailAddress)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
                .padding()
                .background(Color(.secondarySystemGroupedBackground))
                .clipShape(RoundedRectangle(cornerRadius: 12))

            SecureField("Passwort", text: $viewModel.password)
                .textContentType(.password)
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

    // MARK: - Actions

    private var actionButtons: some View {
        VStack(spacing: 12) {
            Button {
                Task { await viewModel.signIn() }
            } label: {
                Group {
                    if viewModel.isLoading {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Text("Anmelden")
                            .fontWeight(.semibold)
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: 50)
            }
            .buttonStyle(.borderedProminent)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .disabled(viewModel.isLoading || !viewModel.isFormValid)

            if viewModel.isBiometricsAvailable {
                Button {
                    Task { await viewModel.signInWithBiometrics() }
                } label: {
                    Label("Mit Face ID anmelden", systemImage: "faceid")
                        .frame(maxWidth: .infinity)
                        .frame(height: 50)
                }
                .buttonStyle(.bordered)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .disabled(viewModel.isLoading)
            }
        }
    }

    // MARK: - Signup Link

    private var signupLink: some View {
        NavigationLink {
            SignupView()
        } label: {
            HStack(spacing: 4) {
                Text("Noch kein Konto?")
                    .foregroundStyle(.secondary)
                Text("Registrieren")
                    .fontWeight(.semibold)
                    .foregroundStyle(Color.callLanaPurple)
            }
            .font(.subheadline)
        }
    }
}

#Preview {
    LoginView()
        .environment(DependencyContainer())
}
