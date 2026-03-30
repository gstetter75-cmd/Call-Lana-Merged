import Foundation
import Observation
import Supabase

@Observable
final class DependencyContainer {
    let authService: AuthService
    let realtimeService: RealtimeService

    // Repositories
    let callRepository: CallRepository
    let assistantRepository: AssistantRepository
    let appointmentRepository: AppointmentRepository
    let leadRepository: LeadRepository
    let billingRepository: BillingRepository
    let profileRepository: ProfileRepository
    let settingsRepository: SettingsRepository

    init() {
        let client = SupabaseClientFactory.shared
        self.authService = AuthService()
        self.realtimeService = RealtimeService()
        self.callRepository = CallRepository(client: client)
        self.assistantRepository = AssistantRepository(client: client)
        self.appointmentRepository = AppointmentRepository(client: client)
        self.leadRepository = LeadRepository(client: client)
        self.billingRepository = BillingRepository(client: client)
        self.profileRepository = ProfileRepository(client: client)
        self.settingsRepository = SettingsRepository(client: client)
    }
}
