// ProfileEditView.swift — Edit profile form
// Fields: firstName, lastName, company, industry (Picker with Handwerk branches).

import SwiftUI
import Supabase

struct ProfileEditView: View {
    let profile: Profile?

    @Environment(\.dismiss) private var dismiss

    @State private var firstName = ""
    @State private var lastName = ""
    @State private var company = ""
    @State private var selectedIndustry = ""
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var showSuccess = false

    private let industries = [
        "Elektrotechnik",
        "Sanitaer & Heizung",
        "Malerei & Lackierung",
        "Schreinerei & Tischlerei",
        "Dachdecker",
        "Metallbau & Schlosserei",
        "Fliesenleger",
        "Zimmerei",
        "Kfz-Werkstatt",
        "Garten- & Landschaftsbau",
        "Gebaeudereinigung",
        "Bau & Ausbau",
        "Friseur & Kosmetik",
        "Sonstiges Handwerk"
    ]

    var body: some View {
        Form {
            personalDataSection
            companySection
            saveSection
        }
        .navigationTitle("Profil bearbeiten")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            populateFields()
        }
        .alert("Fehler", isPresented: .init(
            get: { errorMessage != nil },
            set: { if !$0 { errorMessage = nil } }
        )) {
            Button("OK") { errorMessage = nil }
        } message: {
            Text(errorMessage ?? "")
        }
        .alert("Gespeichert", isPresented: $showSuccess) {
            Button("OK") { dismiss() }
        } message: {
            Text("Dein Profil wurde aktualisiert.")
        }
    }

    // MARK: - Personal Data

    private var personalDataSection: some View {
        Section("Persoenliche Daten") {
            TextField("Vorname", text: $firstName)
                .textContentType(.givenName)

            TextField("Nachname", text: $lastName)
                .textContentType(.familyName)
        }
    }

    // MARK: - Company

    private var companySection: some View {
        Section("Unternehmen") {
            TextField("Firmenname", text: $company)
                .textContentType(.organizationName)

            Picker("Branche", selection: $selectedIndustry) {
                Text("Bitte waehlen").tag("")
                ForEach(industries, id: \.self) { industry in
                    Text(industry).tag(industry)
                }
            }
        }
    }

    // MARK: - Save

    private var saveSection: some View {
        Section {
            Button {
                Task { await saveProfile() }
            } label: {
                HStack {
                    Spacer()
                    if isSaving {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Text("Speichern")
                            .fontWeight(.semibold)
                    }
                    Spacer()
                }
            }
            .disabled(isSaving || !hasChanges)
            .listRowBackground(
                (isSaving || !hasChanges)
                    ? Color.clPurple.opacity(0.5)
                    : Color.clPurple
            )
            .foregroundStyle(.white)
        }
    }

    // MARK: - Helpers

    private var hasChanges: Bool {
        firstName != (profile?.firstName ?? "")
            || lastName != (profile?.lastName ?? "")
            || company != (profile?.email ?? "")
            || selectedIndustry != ""
    }

    private func populateFields() {
        firstName = profile?.firstName ?? ""
        lastName = profile?.lastName ?? ""
        company = ""
        selectedIndustry = ""
    }

    private func saveProfile() async {
        isSaving = true
        defer { isSaving = false }

        // Build updates dict
        var updates: [String: AnyJSON] = [:]
        updates["first_name"] = .string(firstName)
        updates["last_name"] = .string(lastName)
        if !company.isEmpty {
            updates["company"] = .string(company)
        }
        if !selectedIndustry.isEmpty {
            updates["industry"] = .string(selectedIndustry)
        }

        do {
            let client = SupabaseClientFactory.shared
            let userId = try await client.auth.session.user.id

            _ = try await client
                .from("profiles")
                .update(updates)
                .eq("id", value: userId)
                .execute()

            showSuccess = true
        } catch {
            errorMessage = "Profil konnte nicht gespeichert werden."
        }
    }
}

#Preview {
    NavigationStack {
        ProfileEditView(profile: nil)
    }
}
