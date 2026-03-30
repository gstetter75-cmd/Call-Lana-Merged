// AddPaymentMethodView.swift — Add new payment method form
// SEPA or credit card input with basic validation.

import SwiftUI

struct AddPaymentMethodView: View {
    @State private var viewModel = AddPaymentMethodViewModel()
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                typePicker
                if viewModel.selectedType == .sepa {
                    sepaForm
                } else {
                    creditCardForm
                }
                saveSection
            }
            .navigationTitle("Zahlungsmethode hinzufuegen")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Abbrechen") { dismiss() }
                }
            }
            .alert("Fehler", isPresented: .init(
                get: { viewModel.errorMessage != nil },
                set: { if !$0 { viewModel.errorMessage = nil } }
            )) {
                Button("OK") { viewModel.errorMessage = nil }
            } message: {
                Text(viewModel.errorMessage ?? "")
            }
            .alert("Gespeichert", isPresented: $viewModel.showSuccess) {
                Button("OK") { dismiss() }
            } message: {
                Text("Zahlungsmethode wurde hinzugefuegt.")
            }
        }
    }

    // MARK: - Type Picker

    private var typePicker: some View {
        Section("Zahlungsart") {
            Picker("Typ", selection: $viewModel.selectedType) {
                Text("SEPA-Lastschrift").tag(PaymentMethodType.sepa)
                Text("Kreditkarte").tag(PaymentMethodType.creditCard)
            }
            .pickerStyle(.segmented)
        }
    }

    // MARK: - SEPA Form

    private var sepaForm: some View {
        Section("SEPA-Lastschrift") {
            TextField("Kontoinhaber", text: $viewModel.accountHolder)
                .textContentType(.name)
                .autocapitalization(.words)

            TextField("IBAN", text: $viewModel.iban)
                .textContentType(.none)
                .autocapitalization(.allCharacters)
                .onChange(of: viewModel.iban) { _, newValue in
                    viewModel.formatIban(newValue)
                }

            if !viewModel.ibanHint.isEmpty {
                Text(viewModel.ibanHint)
                    .font(.caption)
                    .foregroundStyle(Color.clTextSecondary)
            }

            if !viewModel.ibanValidationError.isEmpty {
                Label(viewModel.ibanValidationError, systemImage: "exclamationmark.triangle.fill")
                    .font(.caption)
                    .foregroundStyle(.red)
            }

            Toggle("SEPA-Lastschriftmandat erteilen", isOn: $viewModel.sepaConsent)

            if viewModel.sepaConsent {
                Text("Ich ermaechtige Call Lana, Zahlungen von meinem Konto mittels Lastschrift einzuziehen.")
                    .font(.caption2)
                    .foregroundStyle(Color.clTextSecondary)
            }
        }
    }

    // MARK: - Credit Card Form

    private var creditCardForm: some View {
        Section("Kreditkarte") {
            TextField("Karteninhaber", text: $viewModel.cardHolder)
                .textContentType(.name)
                .autocapitalization(.words)

            TextField("Kartennummer", text: $viewModel.cardNumber)
                .textContentType(.creditCardNumber)
                .keyboardType(.numberPad)
                .onChange(of: viewModel.cardNumber) { _, newValue in
                    viewModel.formatCardNumber(newValue)
                }

            HStack(spacing: 12) {
                TextField("MM/YY", text: $viewModel.cardExpiry)
                    .keyboardType(.numberPad)
                    .frame(maxWidth: 80)
                    .onChange(of: viewModel.cardExpiry) { _, newValue in
                        viewModel.formatExpiry(newValue)
                    }

                TextField("CVC", text: $viewModel.cardCvc)
                    .keyboardType(.numberPad)
                    .frame(maxWidth: 60)
                    .onChange(of: viewModel.cardCvc) { _, newValue in
                        viewModel.limitCvc(newValue)
                    }
            }

            if !viewModel.cardValidationError.isEmpty {
                Label(viewModel.cardValidationError, systemImage: "exclamationmark.triangle.fill")
                    .font(.caption)
                    .foregroundStyle(.red)
            }
        }
    }

    // MARK: - Save

    private var saveSection: some View {
        Section {
            Button {
                Task { await viewModel.savePaymentMethod() }
            } label: {
                HStack {
                    if viewModel.isLoading {
                        ProgressView()
                    } else {
                        Image(systemName: "checkmark.circle.fill")
                        Text("Speichern")
                    }
                }
                .frame(maxWidth: .infinity)
            }
            .disabled(!viewModel.isFormValid || viewModel.isLoading)

            Text("Zahlungsdaten werden ueber Stripe tokenisiert. Sensible Daten werden nicht auf unseren Servern gespeichert.")
                .font(.caption2)
                .foregroundStyle(Color.clTextSecondary)
        }
    }
}

#Preview {
    AddPaymentMethodView()
}
