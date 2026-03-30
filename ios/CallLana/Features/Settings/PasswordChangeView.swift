// PasswordChangeView.swift — Change password form
// Validation: min 8 chars, must match confirmation.

import SwiftUI

struct PasswordChangeView: View {
    @Environment(\.dismiss) private var dismiss

    @State private var newPassword = ""
    @State private var confirmPassword = ""
    @State private var isProcessing = false
    @State private var errorMessage: String?
    @State private var showSuccess = false

    private var isValid: Bool {
        newPassword.count >= 8 && newPassword == confirmPassword
    }

    private var validationMessage: String? {
        if newPassword.isEmpty { return nil }
        if newPassword.count < 8 {
            return "Mindestens 8 Zeichen erforderlich."
        }
        if !confirmPassword.isEmpty && newPassword != confirmPassword {
            return "Passwoerter stimmen nicht ueberein."
        }
        return nil
    }

    var body: some View {
        Form {
            passwordSection
            validationSection
            actionSection
        }
        .navigationTitle("Passwort aendern")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Fehler", isPresented: .init(
            get: { errorMessage != nil },
            set: { if !$0 { errorMessage = nil } }
        )) {
            Button("OK") { errorMessage = nil }
        } message: {
            Text(errorMessage ?? "")
        }
        .alert("Erfolgreich", isPresented: $showSuccess) {
            Button("OK") { dismiss() }
        } message: {
            Text("Dein Passwort wurde geaendert.")
        }
    }

    // MARK: - Password Fields

    private var passwordSection: some View {
        Section("Neues Passwort") {
            SecureField("Neues Passwort", text: $newPassword)
                .textContentType(.newPassword)

            SecureField("Passwort bestaetigen", text: $confirmPassword)
                .textContentType(.newPassword)
        }
    }

    // MARK: - Validation Hints

    @ViewBuilder
    private var validationSection: some View {
        if let message = validationMessage {
            Section {
                Label(message, systemImage: "exclamationmark.triangle.fill")
                    .font(.caption)
                    .foregroundStyle(.orange)
            }
        } else if isValid {
            Section {
                Label("Passwort ist gueltig", systemImage: "checkmark.circle.fill")
                    .font(.caption)
                    .foregroundStyle(.green)
            }
        }
    }

    // MARK: - Action

    private var actionSection: some View {
        Section {
            Button {
                Task { await changePassword() }
            } label: {
                HStack {
                    Spacer()
                    if isProcessing {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Text("Passwort aendern")
                            .fontWeight(.semibold)
                    }
                    Spacer()
                }
            }
            .disabled(!isValid || isProcessing)
            .listRowBackground(
                (!isValid || isProcessing)
                    ? Color.clPurple.opacity(0.5)
                    : Color.clPurple
            )
            .foregroundStyle(.white)
        }
    }

    // MARK: - Action

    private func changePassword() async {
        guard isValid else { return }

        isProcessing = true
        defer { isProcessing = false }

        do {
            let client = SupabaseClientFactory.shared
            try await client.auth.update(user: .init(password: newPassword))
            showSuccess = true
        } catch {
            errorMessage = "Passwort konnte nicht geaendert werden. Bitte erneut versuchen."
        }
    }
}

#Preview {
    NavigationStack {
        PasswordChangeView()
    }
}
