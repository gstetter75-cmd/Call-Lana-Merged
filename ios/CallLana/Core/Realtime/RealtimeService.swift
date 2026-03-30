// Realtime subscriptions for live dashboard updates
// Mirrors js/realtime.js pattern: channels for calls, appointments, leads

import Foundation
import Supabase
import Realtime

@Observable
final class RealtimeService: @unchecked Sendable {

    // MARK: - Event Callbacks

    var onNewCall: (@Sendable (_ call: Call) -> Void)?
    var onAppointmentChange: (@Sendable (_ appointment: Appointment) -> Void)?
    var onNewLead: (@Sendable (_ lead: Lead) -> Void)?

    // MARK: - State

    private(set) var isConnected = false

    // MARK: - Private

    private let client: SupabaseClient
    private var channels: [RealtimeChannelV2] = []
    private var userId: String?

    // MARK: - Init

    init(client: SupabaseClient = SupabaseClientFactory.shared) {
        self.client = client
    }

    // MARK: - Subscribe

    /// Alle relevanten Channels abonnieren
    @MainActor
    func subscribe(userId: String) async {
        await unsubscribeAll()
        self.userId = userId

        await subscribeCalls()
        await subscribeAppointments()
        await subscribeLeads()
        isConnected = true
    }

    // MARK: - Calls Channel

    @MainActor
    private func subscribeCalls() async {
        let channel = client.realtimeV2.channel("realtime-calls")

        let insertions = channel.postgresChange(
            InsertAction.self,
            schema: "public",
            table: "calls"
        )

        await channel.subscribe()
        channels.append(channel)

        Task { [weak self] in
            for await insertion in insertions {
                guard let self,
                      let record = try? insertion.decodeRecord(as: Call.self, decoder: JSONDecoder()),
                      record.userId.uuidString == self.userId else { continue }
                self.onNewCall?(record)
            }
        }
    }

    // MARK: - Appointments Channel

    @MainActor
    private func subscribeAppointments() async {
        let channel = client.realtimeV2.channel("realtime-appointments")

        let changes = channel.postgresChange(
            InsertAction.self,
            schema: "public",
            table: "appointments"
        )

        await channel.subscribe()
        channels.append(channel)

        Task { [weak self] in
            for await change in changes {
                guard let self else { return }
                if let record = try? change.decodeRecord(as: Appointment.self, decoder: JSONDecoder()),
                   record.userId.uuidString == self.userId {
                    self.onAppointmentChange?(record)
                }
            }
        }
    }

    // MARK: - Leads Channel

    @MainActor
    private func subscribeLeads() async {
        let channel = client.realtimeV2.channel("realtime-leads")

        let insertions = channel.postgresChange(
            InsertAction.self,
            schema: "public",
            table: "leads"
        )

        await channel.subscribe()
        channels.append(channel)

        Task { [weak self] in
            for await insertion in insertions {
                guard let self else { return }
                if let record = try? insertion.decodeRecord(as: Lead.self, decoder: JSONDecoder()) {
                    self.onNewLead?(record)
                }
            }
        }
    }

    // MARK: - Unsubscribe

    @MainActor
    func unsubscribeAll() async {
        for channel in channels {
            await channel.unsubscribe()
        }
        channels.removeAll()
        isConnected = false
        userId = nil
    }

    // MARK: - Lifecycle

    @MainActor
    func connect() async {
        // No-op: subscribe(userId:) is called when user is authenticated
    }

    @MainActor
    func disconnect() async {
        await unsubscribeAll()
    }
}
