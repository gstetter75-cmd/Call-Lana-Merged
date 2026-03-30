// Singleton factory for the Supabase client instance

import Foundation
import Supabase

enum SupabaseClientFactory {

    /// Shared Supabase client — thread-safe singleton
    static let shared: SupabaseClient = {
        let client = SupabaseClient(
            supabaseURL: AppConfig.supabaseURL,
            supabaseKey: AppConfig.supabaseAnonKey
        )
        return client
    }()
}
