// Simple UserDefaults-based cache with TTL
// Platzhalter fuer SwiftData Migration in v2

import Foundation

final class CacheManager: Sendable {

    static let shared = CacheManager()

    private let defaults: UserDefaults
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    private init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    // MARK: - Cache Entry Wrapper

    private struct CacheEntry<T: Codable>: Codable {
        let value: T
        let expiresAt: Date
    }

    // MARK: - Save

    func save<T: Codable & Sendable>(
        _ value: T,
        forKey key: String,
        ttl: TimeInterval = Constants.Cache.defaultTTLSeconds
    ) {
        let entry = CacheEntry(value: value, expiresAt: Date().addingTimeInterval(ttl))
        if let data = try? encoder.encode(entry) {
            defaults.set(data, forKey: cacheKey(key))
        }
    }

    // MARK: - Load

    func load<T: Codable & Sendable>(_ type: T.Type, forKey key: String) -> T? {
        guard let data = defaults.data(forKey: cacheKey(key)),
              let entry = try? decoder.decode(CacheEntry<T>.self, from: data) else {
            return nil
        }

        // Abgelaufene Eintraege ignorieren
        guard entry.expiresAt > Date() else {
            remove(forKey: key)
            return nil
        }

        return entry.value
    }

    // MARK: - Remove

    func remove(forKey key: String) {
        defaults.removeObject(forKey: cacheKey(key))
    }

    // MARK: - Clear All Cache

    func clearAll() {
        let allKeys = defaults.dictionaryRepresentation().keys
        for key in allKeys where key.hasPrefix("clana_cache_") {
            defaults.removeObject(forKey: key)
        }
    }

    // MARK: - Helpers

    private func cacheKey(_ key: String) -> String {
        "clana_cache_\(key)"
    }
}
