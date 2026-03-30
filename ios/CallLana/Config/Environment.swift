// Environment configuration for Supabase connection
// Values extracted from js/supabase-init.js

import Foundation

enum Environment {

    // MARK: - Supabase

    static let supabaseURL = URL(string: "https://fgwtptriileytmmotevs.supabase.co")!
    static let supabaseAnonKey = "sb_publishable_T6YW1YX3EfTakMg2m5APqA_uVSDdi5S"

    // MARK: - Feature Flags

    static let isDebug: Bool = {
        #if DEBUG
        return true
        #else
        return false
        #endif
    }()
}
